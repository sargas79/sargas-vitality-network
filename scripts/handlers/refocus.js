/**
 * refocus.js — Sargas' Vitality Network
 *
 * "When you Refocus, your vitality network regains all its Hit Points."
 * (Mystic, Player Core pg. 114.)
 *
 * When the Refocus action is posted to chat, refills the actor's network to
 * its maximum. createChatMessage runs on every client: one client writes the
 * refill, and each client decides for itself whether to show a notification
 * (the same pattern as the turn-start recharge).
 *
 * The 'refocusRefill' setting picks who refills:
 *   'class' — Mystics by class only (default; the Mystic Dedication's
 *             Vitality Network feat doesn't mention a Refocus refill)
 *   'all'   — anyone with a Vitality Network, including the Dedication
 *   'off'   — never
 */

import { MODULE_ID, MODULE_TITLE } from '../constants.js';
import { announceRestore } from '../announce.js';
import { getMessageItem, getNetwork, isMysticByClass, isRefocus, setNetworkValue } from '../system-adapter.js';
import { getResponsibleUser } from '../utils.js';

export function registerRefocusHooks() {
  Hooks.on('createChatMessage', (message) => {
    onChatMessage(message).catch(error => {
      console.error(`${MODULE_TITLE} | Refocus refill failed`, error);
    });
  });
}

async function onChatMessage(message) {
  // Ignore this module's own messages.
  if (message.flags?.[MODULE_ID]) return;
  if (!isRefocus(getMessageItem(message))) return;
  await refillNetwork(message.actor);
}

/** Refills the actor's Vitality Network to its maximum, if the setting allows. */
export async function refillNetwork(actor) {
  const mode = game.settings.get(MODULE_ID, 'refocusRefill');
  if (mode === 'off' || !actor) return;
  if (mode === 'class' && !isMysticByClass(actor)) return;

  const network = getNetwork(actor);
  if (!network) return;
  const gained = network.max - network.value;
  if (gained <= 0) return; // Already full: nothing to write or announce.

  const responsibleUser = getResponsibleUser(actor);
  if (!responsibleUser) return;
  const responsible = responsibleUser.isSelf;

  if (responsible) await setNetworkValue(actor, network.max);
  announceRestore(
    actor,
    `${actor.name} refocused: Vitality Network refilled (+${gained}, ${network.max}/${network.max})`,
    responsible
  );
}
