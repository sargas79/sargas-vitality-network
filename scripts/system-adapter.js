/**
 * system-adapter.js — Sargas' Vitality Network
 *
 * Everything that depends on the game system lives here, so the rest of the
 * module doesn't care whether it runs on Starfinder 2e (the primary target)
 * or on Pathfinder 2e with the Starfinder Anachronism module.
 *
 * SF2e is built from the same source as PF2e (foundryvtt/pf2e, SYSTEM_ID
 * "sf2e"), so the actor and roll APIs are identical. What differs is anything
 * namespaced by system ID: chat message flags are flags.sf2e on SF2e and
 * flags.pf2e on PF2e + Anachronism. Both systems fire the same pf2e.* hooks
 * and keep the "pf2e" root CSS class.
 */

export const SUPPORTED_SYSTEMS = ['sf2e', 'pf2e'];

const RESOURCE_SLUG = 'vitalityNetwork';
const TRANSFER_VITALITY_SLUG = 'transfer-vitality';
const REFOCUS_SLUG = 'refocus';

/** True when the active game system is one this module supports. */
export function isSupportedSystem() {
  return SUPPORTED_SYSTEMS.includes(game.system?.id);
}

// ── Vitality Network resource ────────────────────────────────────────────────

/** Returns { value, max } for the actor's Vitality Network, or null if it has none. */
export function getNetwork(actor) {
  const resource = actor?.system?.resources?.[RESOURCE_SLUG];
  if (!resource) return null;
  return {
    value: Number(resource.value) || 0,
    max: Number(resource.max) || 0
  };
}

/**
 * Writes a new Vitality Network value.
 *
 * The resource comes from a SpecialResource rule element rather than being
 * stored on the actor, so a plain actor.update() on system.resources would be
 * silently discarded. Fail loudly instead if the system has no updateResource().
 */
export async function setNetworkValue(actor, value) {
  if (typeof actor?.updateResource !== 'function') {
    throw new Error(`Actor "${actor?.name}" has no updateResource(); cannot change the Vitality Network.`);
  }
  return actor.updateResource(RESOURCE_SLUG, value);
}

// ── Chat messages and items ──────────────────────────────────────────────────

/** The system's flags on a chat message (SF2e may use its own namespace or pf2e's). */
export function getSystemFlags(message) {
  const flags = message?.flags ?? {};
  return flags[game.system.id] ?? flags.sf2e ?? flags.pf2e ?? {};
}

/** The item (action, feat, spell…) a chat message was posted from, if any. */
export function getMessageItem(message) {
  if (message?.item) return message.item;
  const originUuid = getSystemFlags(message).origin?.uuid;
  if (!originUuid) return null;
  try {
    return fromUuidSync(originUuid) ?? null;
  } catch {
    return null;
  }
}

// Matches by slug, or by name for items whose slug wasn't set (e.g. homebrew copies).
function matchesAction(item, slug, name) {
  if (!item) return false;
  if (item.slug === slug) return true;
  return !item.slug && item.name?.trim().toLowerCase() === name;
}

/** True when the item is the Transfer Vitality action. */
export function isTransferVitality(item) {
  return matchesAction(item, TRANSFER_VITALITY_SLUG, 'transfer vitality');
}

/** True when the item is the Refocus action (slug "refocus" on both systems). */
export function isRefocus(item) {
  return matchesAction(item, REFOCUS_SLUG, 'refocus');
}

// ── Character details ────────────────────────────────────────────────────────

/** True when the actor is a Mystic by class (as opposed to via the Mystic Dedication). */
export function isMysticByClass(actor) {
  const slug = actor?.class?.slug;
  // If the class can't be read, assume the class feature (the more common case).
  return slug ? slug === 'mystic' : true;
}

/**
 * The actor's best spell DC proficiency rank (0 untrained … 4 legendary),
 * or null if it can't be read on this system.
 */
export function getSpellDCRank(actor) {
  // Characters: overall spellcasting proficiency (fed by the class's spellcasting).
  // Anyone else: the rank of their best spellcasting entry. Same paths on both systems.
  const candidates = [
    actor?.system?.proficiencies?.spellcasting?.rank,
    actor?.system?.attributes?.spellDC?.rank,
    actor?.spellcasting?.base?.rank
  ];
  return candidates.find(Number.isFinite) ?? null;
}

// ── Rolls ────────────────────────────────────────────────────────────────────

/** The system's DamageRoll class, or the core Roll class if it can't be found. */
export function getDamageRollClass() {
  return CONFIG.Dice.rolls.find(r => r.name === 'DamageRoll') ?? Roll;
}
