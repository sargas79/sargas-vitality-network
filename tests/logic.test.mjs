// Mock-Foundry tests for the module's logic (rules, spending, visibility,
// multi-client recharge). No dependencies. Run from the repo root:
//   node tests/logic.test.mjs
import assert from 'node:assert/strict';

let failures = 0;
const test = async (name, fn) => {
  try { await fn(); console.log('ok  ', name); }
  catch (e) { failures++; console.log('FAIL', name, '\n     ', e.message); }
};

// ── Mocks ────────────────────────────────────────────────────────────────────
const users = {
  gm:  { id: 'gm',  isGM: true,  active: true },
  p1:  { id: 'p1',  isGM: false, active: true },
  p2:  { id: 'p2',  isGM: false, active: true },
};
const allUsers = Object.values(users);
const notifications = [];
const chat = [];
const pending = []; // simulated DB writes, applied by sync()
const sync = () => { while (pending.length) pending.shift()(); };
const settings = { showUpdates: 'owner', updateNotificationStyle: 'ui', showSpending: 'all', dialogStyle: 'chat' };

function makeActor({ owners = ['p1'], level = 1, value = 0, max = 10, classSlug = 'mystic', rank = 2 } = {}) {
  const actor = {
    id: 'a1', uuid: 'Actor.a1', name: 'Mira <b>', img: 'm.png', level,
    class: { slug: classSlug },
    hasPlayerOwner: owners.length > 0,
    flags: {},
    system: { resources: { vitalityNetwork: { value, max } }, proficiencies: { spellcasting: { rank } } },
    writes: [],
    testUserPermission: (u, perm) => u.isGM || owners.includes(u.id),
    getFlag(scope, key) { return this.flags[scope]?.[key]; },
    async setFlag(scope, key, v) { pending.push(() => { (this.flags[scope] ??= {})[key] = v; }); },
    async updateResource(slug, v) {
      this.writes.push(v);
      pending.push(() => { this.system.resources[slug].value = Math.max(0, Math.min(v, this.system.resources[slug].max)); });
    },
  };
  return actor;
}

function asClient(userId) {
  const user = { ...users[userId], isSelf: true };
  const list = allUsers.map(u => ({ ...u, isSelf: u.id === userId }));
  globalThis.game = {
    user, system: { id: 'sf2e' },
    users: Object.assign(list, { activeGM: list.find(u => u.isGM && u.active) ?? null }),
    settings: { get: (_m, k) => settings[k] },
    modules: { get: () => ({ active: true }) },
  };
  // Array#filter on our Object.assign'd array returns plain arrays; fine.
}
globalThis.ui = { notifications: {
  info: m => notifications.push(['info', game.user.id, m]),
  warn: m => notifications.push(['warn', game.user.id, m]),
  error: m => notifications.push(['error', game.user.id, m]),
} };
globalThis.ChatMessage = { getSpeaker: () => ({}), create: async d => { chat.push({ by: game.user.id, ...d }); return d; } };
globalThis.CONFIG = { Dice: { rolls: [] } };
globalThis.Hooks = { on() {}, once() {}, call() {} };
globalThis.fromUuidSync = () => null;

asClient('gm');
const U = await import('../scripts/utils.js');
const A = await import('../scripts/system-adapter.js');
const { updateVitalityPool } = await import('../scripts/update-vitality-pool.js');

// ── Rules ────────────────────────────────────────────────────────────────────
await test('class transfer limits by level', () => {
  const cases = { 1: 10, 4: 10, 5: 20, 9: 20, 10: 30, 14: 30, 15: 40, 19: 40, 20: 50 };
  for (const [lvl, cap] of Object.entries(cases)) assert.equal(U.getTransferLimit(makeActor({ level: +lvl })), cap, `level ${lvl}`);
});
await test('archetype transfer limits by level', () => {
  const cases = { 4: 10, 5: 15, 10: 20, 15: 25, 20: 30 };
  for (const [lvl, cap] of Object.entries(cases)) assert.equal(U.getTransferLimit(makeActor({ level: +lvl, classSlug: 'soldier' })), cap, `level ${lvl}`);
});
await test('missing class assumes the class feature', () => {
  const a = makeActor({ level: 10 }); a.class = null;
  assert.equal(U.getTransferLimit(a), 30);
});
await test('max spend is capped by current points', () => {
  assert.equal(U.getMaxSpend(makeActor({ level: 10, value: 7, max: 46 })), 7);
  assert.equal(U.getMaxSpend(makeActor({ level: 1, value: 10, max: 10 })), 10);
  assert.equal(U.getMaxSpend(makeActor({ level: 20, value: 86, max: 86 })), 50);
});
await test('recharge by spell DC rank, with level fallback', () => {
  assert.equal(U.getRechargeAmount(makeActor({ rank: 2 })), 4);
  assert.equal(U.getRechargeAmount(makeActor({ rank: 3 })), 6);
  assert.equal(U.getRechargeAmount(makeActor({ rank: 4 })), 8);
  const noRank = makeActor({ level: 19 }); noRank.system.proficiencies = {};
  assert.equal(U.getRechargeAmount(noRank), 8);
});

// ── Spending ─────────────────────────────────────────────────────────────────
await test('spend rejects 0, too many, non-numbers', async () => {
  const a = makeActor({ level: 1, value: 10, max: 10 });
  for (const bad of [0, -1, 11, 'abc', '', null, NaN]) assert.equal(await U.spendPoints(a, bad), null, `value ${bad}`);
  assert.equal(a.writes.length, 0);
});
await test('spend reads the live value', async () => {
  const a = makeActor({ level: 10, value: 30, max: 46 });
  const r = await U.spendPoints(a, 12); sync();
  assert.deepEqual(r, { points: 12, remaining: 18, max: 46 });
  const r2 = await U.spendPoints(a, 20); // only 18 left now
  assert.equal(r2, null);
});
await test('spend fails loudly without updateResource', async () => {
  const a = makeActor({ value: 5 }); delete a.updateResource;
  await assert.rejects(() => U.spendPoints(a, 1));
});

// ── Visibility ───────────────────────────────────────────────────────────────
await test('whisper recipients', () => {
  asClient('gm');
  const a = makeActor({ owners: ['p1'] });
  assert.equal(U.getWhisperRecipients('all', a), null);
  assert.deepEqual(U.getWhisperRecipients('owner', a), ['p1']);
  assert.deepEqual(U.getWhisperRecipients('gm', a), ['gm']);
  assert.deepEqual(U.getWhisperRecipients('owner-gm', a).sort(), ['gm', 'p1']);
  assert.deepEqual(U.getWhisperRecipients('owner', makeActor({ owners: [] })), ['gm'], 'no player owner falls back to GM');
});
await test('userCanSee per client', () => {
  const a = makeActor({ owners: ['p1'] });
  asClient('p1'); assert.equal(U.userCanSee('owner', a), true);
  asClient('p2'); assert.equal(U.userCanSee('owner', a), false);
  asClient('gm'); assert.equal(U.userCanSee('owner', a), false); assert.equal(U.userCanSee('owner-gm', a), true);
  asClient('p2'); assert.equal(U.userCanSee('none', a), false); assert.equal(U.userCanSee('all', a), true);
});
await test('exactly one responsible client', () => {
  const a = makeActor({ owners: ['p1', 'p2'] });
  const pick = () => ['gm', 'p1', 'p2'].filter(id => { asClient(id); return U.isResponsibleClient(a); });
  assert.deepEqual(pick(), ['gm']);
  users.gm.active = false;
  assert.deepEqual(pick(), ['p1'], 'no GM: lowest-id active owner');
  users.gm.active = true;
});
await test('escapeHTML', () => {
  assert.equal(U.escapeHTML(`<img src=x onerror="a">'&`), '&lt;img src=x onerror=&quot;a&quot;&gt;&#39;&amp;');
});

// ── Recharge across clients ──────────────────────────────────────────────────
async function turn(combat, actor) {
  for (const id of ['p2', 'p1', 'gm']) { asClient(id); await updateVitalityPool(combat, { actor, name: actor.name }); }
  sync();
}
await test('recharge writes once with 3 clients, notifies only the owner', async () => {
  notifications.length = 0; chat.length = 0;
  const a = makeActor({ owners: ['p1'], value: 2, max: 10, rank: 2 });
  await turn({ id: 'c1', round: 1 }, a);
  assert.deepEqual(a.writes, [6]);
  assert.equal(a.system.resources.vitalityNetwork.value, 6);
  assert.deepEqual(notifications.map(n => n[1]), ['p1']);
});
await test('stepping back and forward does not recharge twice', async () => {
  const a = makeActor({ owners: ['p1'], value: 0, max: 20 });
  await turn({ id: 'c1', round: 1 }, a);   // forward into the turn
  await turn({ id: 'c1', round: 1 }, a);   // back, then forward again: same round
  await turn({ id: 'c1', round: 0 }, a);   // stepped back across the round boundary
  assert.deepEqual(a.writes, [4]);
  await turn({ id: 'c1', round: 2 }, a);   // next round recharges
  assert.deepEqual(a.writes, [4, 8]);
  await turn({ id: 'c2', round: 1 }, a);   // new combat resets
  assert.deepEqual(a.writes, [4, 8, 12]);
});
await test('recharge caps at max and stays quiet when full', async () => {
  notifications.length = 0;
  const a = makeActor({ owners: ['p1'], value: 9, max: 10 });
  await turn({ id: 'c1', round: 1 }, a);
  assert.deepEqual(a.writes, [10]);
  const full = makeActor({ owners: ['p1'], value: 10, max: 10 });
  notifications.length = 0;
  await turn({ id: 'c1', round: 1 }, full);
  assert.deepEqual(full.writes, []);
  assert.equal(notifications.length, 0);
});
await test('chat-style recharge posts exactly one message', async () => {
  settings.updateNotificationStyle = 'chat'; chat.length = 0;
  const a = makeActor({ owners: ['p1'], value: 0, max: 10 });
  await turn({ id: 'c1', round: 1 }, a);
  assert.equal(chat.length, 1);
  assert.equal(chat[0].by, 'gm');
  assert.deepEqual(chat[0].whisper, ['p1']);
  assert.ok(!chat[0].content.includes('<b>'), 'actor name is escaped');
  settings.updateNotificationStyle = 'ui';
});
await test('no GM and owner offline: no write and no false announcement', async () => {
  settings.showUpdates = 'all'; notifications.length = 0;
  users.gm.active = false; users.p1.active = false;
  const a = makeActor({ owners: ['p1'], value: 0, max: 10 });
  for (const id of ['p2']) { asClient(id); await updateVitalityPool({ id: 'c1', round: 1 }, { actor: a, name: a.name }); }
  sync();
  assert.deepEqual(a.writes, []);
  assert.equal(notifications.length, 0);
  users.gm.active = true; users.p1.active = true; settings.showUpdates = 'owner';
});
await test('NPCs and actors without a network are skipped', async () => {
  const npc = makeActor({ owners: [], value: 0 });
  await turn({ id: 'c1', round: 1 }, npc);
  assert.deepEqual(npc.writes, []);
  const none = makeActor({ owners: ['p1'] }); none.system.resources = {};
  await turn({ id: 'c1', round: 1 }, none);
  assert.deepEqual(none.writes, []);
});

// ── Adapter ──────────────────────────────────────────────────────────────────
await test('transfer vitality detection', () => {
  assert.equal(A.isTransferVitality({ slug: 'transfer-vitality' }), true);
  assert.equal(A.isTransferVitality({ slug: null, name: 'Transfer Vitality' }), true);
  assert.equal(A.isTransferVitality({ slug: 'refocus', name: 'Transfer Vitality' }), false);
  assert.equal(A.isTransferVitality(null), false);
});
await test('system flags namespace follows the system id', () => {
  asClient('gm');
  game.system.id = 'sf2e';
  assert.equal(A.getSystemFlags({ flags: { sf2e: { origin: 1 }, pf2e: { origin: 2 } } }).origin, 1);
  game.system.id = 'pf2e';
  assert.equal(A.getSystemFlags({ flags: { pf2e: { origin: 2 } } }).origin, 2);
});

console.log(failures ? `\n${failures} failing` : '\nall passed');
process.exit(failures ? 1 : 0);
