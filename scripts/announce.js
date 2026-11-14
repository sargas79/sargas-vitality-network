/**
 * announce.js — Sargas' Vitality Network
 *
 * Tells people that a Vitality Network was restored (turn-start recharge or
 * Refocus), following the 'showUpdates' and 'updateNotificationStyle' settings.
 *
 * Callers run this on every client:
 *   - a UI notification is local, so each client decides for itself whether
 *     to show one;
 *   - a chat message is shared, so only the responsible client posts it.
 */

import { MODULE_ID } from './constants.js';
import { escapeHTML, getWhisperRecipients, userCanSee } from './utils.js';

export function announceRestore(actor, text, responsible) {
  const showUpdates = game.settings.get(MODULE_ID, 'showUpdates');
  if (showUpdates === 'none') return;

  const style = game.settings.get(MODULE_ID, 'updateNotificationStyle');
  if (style !== 'chat') {
    if (userCanSee(showUpdates, actor)) ui.notifications.info(text);
    return;
  }

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
      </div>`,
    flags: { [MODULE_ID]: { restored: true } }
  };
  const whisper = getWhisperRecipients(showUpdates, actor);
  if (whisper) messageData.whisper = whisper;
  ChatMessage.create(messageData);
}
