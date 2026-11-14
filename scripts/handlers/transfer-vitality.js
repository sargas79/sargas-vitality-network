/**
 * transfer-vitality.js — Sargas' Vitality Network
 *
 * When the Transfer Vitality action is posted to chat, asks the user who used
 * it how many Vitality Network points to spend, deducts them, and rolls the
 * healing (see healing.js).
 *
 * Two prompt styles (per-user setting 'dialogStyle'):
 *   'chat'  — a card whispered to the user, with a number input and a button.
 *             Once spent, the card is rewritten as a summary and stays spent
 *             after a reload.
 *   'popup' — a DialogV2 window.
 *
 * Points are always read from the actor at the moment of spending (never from
 * the card), and capped by the Transfer Vitality limit for the actor's level.
 */

import { MODULE_ID, MODULE_TITLE } from '../constants.js';
import { rollHealing } from '../healing.js';
import { getMessageItem, getNetwork, isTransferVitality } from '../system-adapter.js';
import {
  escapeHTML,
  getMaxSpend,
  getTransferLimit,
  getWhisperRecipients,
  spendPoints
} from '../utils.js';

// Cards currently being spent on this client. One message can be on screen
// more than once (chat log, notification toast, popped-out log), each with
// its own button, so a per-button disabled state isn't enough.
const spendsInProgress = new Set();

/**
 * Registered at 'init' so cards already in the chat log get their button
 * wired up even if the log renders before 'ready'.
 */
export function registerChatCardHooks() {
  // v13+ hook: receives the message element as a plain HTMLElement.
  Hooks.on('renderChatMessageHTML', (message, element) => activateSpendCard(message, element));
}

export function registerTransferVitalityHooks() {
  Hooks.on('createChatMessage', (message) => {
    onChatMessage(message).catch(error => {
      console.error(`${MODULE_TITLE} | Transfer Vitality prompt failed`, error);
    });
  });
}

// ── Detect Transfer Vitality ─────────────────────────────────────────────────

async function onChatMessage(message) {
  // Ignore this module's own cards.
  if (message.flags?.[MODULE_ID]) return;

  // createChatMessage runs on every client; only the user who posted the
  // action gets the prompt, and only if they own the character.
  if (message.author?.id !== game.user.id) return;
  if (!isTransferVitality(getMessageItem(message))) return;

  const actor = message.actor;
  if (!actor?.isOwner) return;

  const network = getNetwork(actor);
  if (!network) {
    ui.notifications.warn(`${actor.name} has no Vitality Network.`);
    return;
  }
  if (network.value <= 0) {
    ui.notifications.warn(`${actor.name} has no Vitality Network points remaining!`);
    return;
  }

  const style = game.settings.get(MODULE_ID, 'dialogStyle');
  if (style === 'chat') await createSpendCard(actor, network);
  else await showSpendDialog(actor, network);
}

// ── Shared spend flow ────────────────────────────────────────────────────────

/**
 * Spends points and rolls the healing. Returns the spend result, or null if
 * the amount was invalid or the update failed (the user has been told why).
 */
async function performSpend(actor, requested, { postSummary = true } = {}) {
  let result;
  try {
    result = await spendPoints(actor, requested);
  } catch (error) {
    console.error(`${MODULE_TITLE} | Update failed`, error);
    ui.notifications.error('Failed to update Vitality Network points!');
    return null;
  }

  if (!result) {
    ui.notifications.warn(`Choose between 1 and ${getMaxSpend(actor)} points.`);
    return null;
  }

  ui.notifications.info(`Spent ${result.points} Vitality Network points. ${result.remaining} remaining.`);
  await postSpendSummary(actor, result, { skipIfOnlySelf: !postSummary });
  await rollHealing(actor, result.points);
  return result;
}

function summaryHTML(actor, { points, remaining, max }) {
  return `
    <p><strong>${escapeHTML(actor.name)}</strong> spent <strong>${points}</strong> Vitality Network points.</p>
    <p>Remaining: <strong>${remaining}</strong> / ${max}</p>`;
}

function cardHTML(actor, body) {
  return `
    <div class="vitality-network-card">
      <header class="vitality-network-card__header">
        <img src="${escapeHTML(actor.img)}" width="36" height="36" alt=""/>
        <h3>Vitality Network</h3>
      </header>
      <div class="vitality-network-card__content">${body}</div>
    </div>`;
}

/**
 * Posts the spending summary to whoever the 'showSpending' setting names.
 * With skipIfOnlySelf, nothing is posted when the spender would be the only
 * reader (the chat card has already become their summary).
 */
async function postSpendSummary(actor, result, { skipIfOnlySelf = false } = {}) {
  const showSpending = game.settings.get(MODULE_ID, 'showSpending');
  if (showSpending === 'none') return;

  const whisper = getWhisperRecipients(showSpending, actor);
  if (skipIfOnlySelf && whisper?.every(id => id === game.user.id)) return;

  const messageData = {
    speaker: ChatMessage.getSpeaker({ actor }),
    content: cardHTML(actor, summaryHTML(actor, result)),
    flags: { [MODULE_ID]: { summary: true } }
  };
  if (whisper) messageData.whisper = whisper;
  await ChatMessage.create(messageData);
}

function promptHTML(actor, network) {
  const maxSpend = getMaxSpend(actor);
  return `
    <p><strong>Available points:</strong> ${network.value} / ${network.max}</p>
    <p><strong>Transfer limit:</strong> ${getTransferLimit(actor)} per use</p>
    <div class="form-group">
      <label for="vitality-points-${actor.id}">Points to spend</label>
      <input type="number" class="vitality-points-input" id="vitality-points-${actor.id}"
             name="points" min="1" max="${maxSpend}" step="1" value="${Math.min(1, maxSpend)}" autofocus/>
    </div>`;
}

// ── Chat card style ──────────────────────────────────────────────────────────

async function createSpendCard(actor, network) {
  const body = `
    ${promptHTML(actor, network)}
    <button type="button" class="spend-vitality-btn">
      <i class="fas fa-check"></i> Spend Points
    </button>`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: [game.user.id],
    content: cardHTML(actor, body),
    flags: { [MODULE_ID]: { interactive: true, actorUuid: actor.uuid } }
  });
}

// Wires up the card's button each time it renders (including after a reload).
function activateSpendCard(message, element) {
  const flags = message.flags?.[MODULE_ID];
  if (!flags?.interactive) return;

  const button = element?.querySelector('.spend-vitality-btn');
  if (!button) return;

  // Already spent, or someone else's card (a GM can see every whisper).
  if (flags.spent || !message.isAuthor) {
    button.disabled = true;
    return;
  }

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    // Check the live message, not the flags captured when this copy rendered.
    if (spendsInProgress.has(message.id) || message.getFlag(MODULE_ID, 'spent')) return;
    spendsInProgress.add(message.id);
    button.disabled = true;

    try {
      const actor = fromUuidSync(flags.actorUuid) ?? message.actor;
      const input = element.querySelector('.vitality-points-input');
      // postSummary false: the card itself becomes the spender's summary.
      const result = actor ? await performSpend(actor, input?.value, { postSummary: false }) : null;
      if (!result) {
        button.disabled = false;
        return;
      }

      // Persist the spent state so the card can't be used again after a reload.
      await message.update({
        content: cardHTML(actor, summaryHTML(actor, result)),
        [`flags.${MODULE_ID}.spent`]: true
      });
    } catch (error) {
      console.error(`${MODULE_TITLE} | Could not mark the card as spent`, error);
    } finally {
      spendsInProgress.delete(message.id);
    }
  });
}

// ── Popup style ──────────────────────────────────────────────────────────────

async function showSpendDialog(actor, network) {
  const { DialogV2 } = foundry.applications.api;

  const choice = await DialogV2.wait({
    window: { title: 'Vitality Network', icon: 'fas fa-heart-pulse' },
    content: promptHTML(actor, network),
    buttons: [
      {
        action: 'spend',
        label: 'Spend',
        icon: 'fas fa-check',
        default: true,
        // Wrapped in an object so an empty or invalid entry (NaN) can be told
        // apart from Cancel and gets a warning instead of silently closing.
        callback: (event, button) => ({ points: button.form.elements.points.valueAsNumber })
      },
      {
        action: 'cancel',
        label: 'Cancel',
        icon: 'fas fa-times'
      }
    ],
    rejectClose: false
  });

  // Cancel returns the action name ('cancel'); closing the window returns null.
  if (typeof choice !== 'object' || choice === null) return;
  await performSpend(actor, choice.points, { postSummary: true });
}
