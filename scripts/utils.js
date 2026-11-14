/**
 * utils.js — Sargas' Vitality Network
 *
 * Rules (transfer limits, recharge) and shared helpers: spending points,
 * deciding who sees messages, and picking which client performs a shared
 * update. System-specific access lives in system-adapter.js.
 */

import { getNetwork, setNetworkValue, isMysticByClass, getSpellDCRank } from './system-adapter.js';

// Most HP one Transfer Vitality can move, as [minimum level, limit] pairs,
// highest level first (Player Core pg. 116 and the Mystic Dedication's
// Vitality Network feat, pg. 176).
const CLASS_TRANSFER_LIMITS = [[20, 50], [15, 40], [10, 30], [5, 20], [1, 10]];
const ARCHETYPE_TRANSFER_LIMITS = [[20, 30], [15, 25], [10, 20], [5, 15], [1, 10]];

/** Most HP the actor can move with one Transfer Vitality at their level. */
export function getTransferLimit(actor) {
  const level = Number(actor?.level) || 1;
  const table = isMysticByClass(actor) ? CLASS_TRANSFER_LIMITS : ARCHETYPE_TRANSFER_LIMITS;
  return table.find(([minLevel]) => level >= minLevel)?.[1] ?? 10;
}

/** Most points the actor can spend right now: their transfer limit, capped by what's in the network. */
export function getMaxSpend(actor) {
  const network = getNetwork(actor);
  if (!network) return 0;
  return Math.max(0, Math.min(network.value, getTransferLimit(actor)));
}

/**
 * HP the network regains at the start of the actor's turn: 4, or 6 if master
 * in spell DC, or 8 if legendary (Player Core pg. 114). If the rank can't be
 * read, fall back to the levels at which a Mystic normally reaches those ranks.
 */
export function getRechargeAmount(actor) {
  const rank = getSpellDCRank(actor);
  if (rank !== null) {
    if (rank >= 4) return 8;
    if (rank >= 3) return 6;
    return 4;
  }
  const level = Number(actor?.level) || 1;
  if (level >= 19) return 8;
  if (level >= 15) return 6;
  return 4;
}

/**
 * Spends points from the network, reading the live value so an old prompt or
 * card can never write back a stale total.
 *
 * Returns { points, remaining, max } on success, or null if the requested
 * amount isn't a whole number between 1 and the current maximum spend.
 */
export async function spendPoints(actor, requested) {
  const network = getNetwork(actor);
  if (!network) throw new Error(`Actor "${actor?.name}" has no Vitality Network.`);

  const points = Math.floor(Number(requested));
  const maxSpend = getMaxSpend(actor);
  if (!Number.isFinite(points) || points < 1 || points > maxSpend) return null;

  const remaining = network.value - points;
  await setNetworkValue(actor, remaining);
  return { points, remaining, max: network.max };
}

/**
 * Whisper recipients for a visibility setting ('all' | 'owner' | 'gm' | 'owner-gm').
 * Returns null for a public message. "Owner" means the actor's player owners,
 * not GMs. If an owner-only message has no player owners it goes to the GMs,
 * because an empty whisper list would make it public.
 */
export function getWhisperRecipients(mode, actor) {
  const gms = game.users.filter(u => u.isGM).map(u => u.id);
  const owners = game.users
    .filter(u => !u.isGM && actor.testUserPermission(u, 'OWNER'))
    .map(u => u.id);

  switch (mode) {
    case 'owner':    return owners.length ? owners : gms;
    case 'gm':       return gms;
    case 'owner-gm': return [...new Set([...owners, ...gms])];
    case 'all':
    default:         return null;
  }
}

/** Whether the current user should see a local UI notification for this visibility setting. */
export function userCanSee(mode, actor) {
  const user = game.user;
  const isPlayerOwner = !user.isGM && actor.testUserPermission(user, 'OWNER');
  switch (mode) {
    case 'all':      return true;
    case 'owner':    return isPlayerOwner;
    case 'gm':       return user.isGM;
    case 'owner-gm': return user.isGM || isPlayerOwner;
    default:         return false;
  }
}

/**
 * Hooks like combatTurnChange run on every client. This picks exactly one
 * user to write updates and post chat messages: the active GM if there is
 * one, otherwise the connected player owner with the lowest user ID.
 * Returns null if nobody connected may update the actor.
 */
export function getResponsibleUser(actor) {
  const activeGM = game.users.activeGM;
  if (activeGM) return activeGM;

  const owners = game.users
    .filter(u => u.active && !u.isGM && actor.testUserPermission(u, 'OWNER'))
    .sort((a, b) => a.id.localeCompare(b.id));
  return owners[0] ?? null;
}

/** True when this client is the one that should write shared updates for the actor. */
export function isResponsibleClient(actor) {
  return getResponsibleUser(actor)?.isSelf ?? false;
}

/** Escapes text for safe use inside chat-card HTML. */
export function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
