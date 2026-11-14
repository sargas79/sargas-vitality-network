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
import {
  escapeHTML,
  getRechargeAmount,
  getResponsibleUser,
  getWhisperRecipients,
  userCanSee
} from './utils.js';

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
    announceRecharge(actor, gained, newValue, network.max, responsible);
  }
}

function announceRecharge(actor, gained, newValue, max, responsible) {
  const showUpdates = game.settings.get(MODULE_ID, 'showUpdates');
  if (showUpdates === 'none') return;

  const text = `${actor.name} regained ${gained} Vitality Network points (${newValue}/${max})`;
  const style = game.settings.get(MODULE_ID, 'updateNotificationStyle');

  // UI notifications are local, so each client checks whether it should see one.
  if (style !== 'chat') {
    if (userCanSee(showUpdates, actor)) ui.notifications.info(text);
    return;
  }

  // Chat messages are shared, so only the responsible client posts one.
  if (!responsible) return;
  const messageData = {
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="vitality-network-card">
        <header class="vitality-network-card__header">
          <img src="${escapeHTML(actor.img)}" width="36" height="36" alt=""/>
          <h3>Vitality Network Restored</h3>
        </header>
        <div class="vitality-network-card__content">
          <p>${escapeHTML(text)}</p>
        </div>
      </div>`
  };
  const whisper = getWhisperRecipients(showUpdates, actor);
  if (whisper) messageData.whisper = whisper;
  ChatMessage.create(messageData);
}
