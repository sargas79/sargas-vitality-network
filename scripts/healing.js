/**
 * healing.js — Sargas' Vitality Network
 *
 * Rolls the Transfer Vitality healing (e.g. "12[healing]") with the system's
 * DamageRoll and posts it to chat. Anyone allowed to can apply it from the
 * roll card, using the system's own buttons.
 *
 * Transfer Vitality has one target ("yourself or a bonded creature"). When
 * exactly one token is targeted, the message is tagged for pf2e-toolbelt's
 * Target Helper, which adds an apply-healing button for that creature.
 * Target Helper reads flags["pf2e-toolbelt"].targetHelper.targets, an array
 * of token UUIDs, when a DamageRoll message is created.
 *
 * Who sees the roll follows the 'showSpending' setting. With 'none' it is
 * whispered to the spender only, so they still get the apply buttons.
 *
 * Called from: handlers/transfer-vitality.js after points are spent.
 */

import { MODULE_ID } from './constants.js';
import { getDamageRollClass } from './system-adapter.js';
import { escapeHTML, getWhisperRecipients } from './utils.js';

const TOOLBELT_ID = 'pf2e-toolbelt';

export async function rollHealing(actor, points) {
  const DamageRoll = getDamageRollClass();
  const roll = await new DamageRoll(`${points}[healing]`).evaluate();

  const targets = Array.from(game.user.targets);
  const target = targets.length === 1 ? targets[0] : null;

  const showSpending = game.settings.get(MODULE_ID, 'showSpending');
  const messageData = {
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: target
      ? `Vitality Network - Transfer Vitality to ${escapeHTML(target.name)}`
      : 'Vitality Network - Transfer Vitality',
    flags: { [MODULE_ID]: { healing: true } }
  };

  const whisper = showSpending === 'none'
    ? [game.user.id]
    : getWhisperRecipients(showSpending, actor);
  if (whisper) messageData.whisper = whisper;

  // Pin Target Helper to the single target, so it never offers to heal
  // several creatures from one transfer.
  const toolbeltActive = game.modules.get(TOOLBELT_ID)?.active;
  if (toolbeltActive && target) {
    messageData.flags[TOOLBELT_ID] = { targetHelper: { targets: [target.document.uuid] } };
  }

  await roll.toMessage(messageData);

  if (targets.length > 1) {
    ui.notifications.warn('Transfer Vitality heals one creature: apply the healing to just one of your targets.');
  }
}
