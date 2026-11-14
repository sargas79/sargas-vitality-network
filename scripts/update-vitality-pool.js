/**
 * update-vitality-pool.js — Sargas' Vitality Network
 *
 * Recharges a combatant's Vitality Network at the start of their turn:
 * 4 HP, 6 if master in spell DC, 8 if legendary (see utils.getRechargeAmount),
 * capped at the network's maximum.
 *
 * combatTurnChange fires on every connected client, so:
 *   - exactly one client (see utils.getResponsibleUser) writes the update and
 *     posts any chat message;
 *   - every client decides for itself whether to show a UI notification.
 *
 * Each actor remembers the last combat and round it recharged in. That stops
 * a second recharge when the GM steps back a turn and then forward again.
 *
 * Known limit: the recharge and a spend both write an absolute value. If a
 * player spends in the instant between the turn starting and the recharge
 * write arriving, one of the two changes can be lost. Fixing that needs a
 * socket round trip to a single writer, which this module doesn't have yet.
 *
 * Called from: handlers/combat.js on the 'combatTurnChange' hook.
 */

import { MODULE_ID } from './constants.js';
import { getNetwork, setNetworkValue } from './system-adapter.js';
import { announceRestore } from './announce.js';
import { getRechargeAmount, getResponsibleUser } from './utils.js';

export async function updateVitalityPool(combat, combatant) {
  const actor = combatant?.actor;

  // Only player characters with a Vitality Network take part.
  if (!actor?.hasPlayerOwner) return;
  const network = getNetwork(actor);
  if (!network) return;

  // Already recharged this round (e.g. the GM stepped back and forward again)?
  const last = actor.getFlag(MODULE_ID, 'lastRecharge');
  if (last?.combatId === combat.id && last.round >= combat.round) return;

  // If nobody connected can update the actor (no GM, owner offline), nothing
  // is written, so don't announce a recharge that won't happen.
  const responsibleUser = getResponsibleUser(actor);
  if (!responsibleUser) return;
  const responsible = responsibleUser.isSelf;

  const newValue = Math.min(network.value + getRechargeAmount(actor), network.max);
  const gained = newValue - network.value;

  if (responsible) {
    await actor.setFlag(MODULE_ID, 'lastRecharge', { combatId: combat.id, round: combat.round });
    if (gained > 0) await setNetworkValue(actor, newValue);
  }

  if (gained > 0) {
    announceRestore(actor, `${actor.name} regained ${gained} Vitality Network points (${newValue}/${network.max})`, responsible);
  }
}
