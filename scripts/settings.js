import { MODULE_ID } from './constants.js';

/**
 * Register all module settings
 */
export function registerSettings() {
  // Dialog style preference (client-side)
  game.settings.register(MODULE_ID, 'dialogStyle', {
    name: 'Dialog Style',
    hint: 'Choose how the vitality network spending prompt appears.',
    scope: 'client',     // Each user can set their own preference
    config: true,        // Shows in module settings
    type: String,
    choices: {
      'popup': 'Popup Dialog',
      'chat': 'Chat Message'
    },
    default: 'chat'
  });

  // Visibility setting for vitality spending
  game.settings.register(MODULE_ID, 'showSpending', {
    name: 'Show Vitality Spending',
    hint: 'Controls who sees when vitality points are spent and the healing roll.',
    scope: 'world',      // GM sets this for everyone
    config: true,
    type: String,
    choices: {
      'all': 'Everyone (Public Chat)',
      'owner': 'Owner Only (Whisper)',
      'gm': 'GM Only (Whisper)',
      'owner-gm': 'Owner and GM (Whisper)',
      'none': 'No One (Silent)'
    },
    default: 'all'
  });

  // Visibility setting for vitality network updates
  game.settings.register(MODULE_ID, 'showUpdates', {
    name: 'Show Vitality Network Updates',
    hint: 'Show a notification when vitality network points are restored at turn start.',
    scope: 'world',      // GM sets this for everyone
    config: true,
    type: String,
    choices: {
      'all': 'Everyone',
      'owner': 'Owner Only',
      'gm': 'GM Only',
      'owner-gm': 'Owner and GM',
      'none': 'No One'
    },
    default: 'owner'
  });

  // Style for vitality network update notifications
  game.settings.register(MODULE_ID, 'updateNotificationStyle', {
    name: 'Update Notification Style',
    hint: 'Choose how vitality network restoration notifications appear.',
    scope: 'world',      // GM sets this for everyone
    config: true,
    type: String,
    choices: {
      'ui': 'UI Notification (top right)',
      'chat': 'Chat Message'
    },
    default: 'ui'
  });

  // Refill the network when the Refocus action is used
  game.settings.register(MODULE_ID, 'refocusRefill', {
    name: 'Refill on Refocus',
    hint: 'When the Refocus action is posted to chat, refill the Vitality Network to its maximum. The Mystic Dedication version of Vitality Network does not mention a Refocus refill, so by default only Mystics by class get it.',
    scope: 'world',      // GM sets this for everyone
    config: true,
    type: String,
    choices: {
      'class': 'Mystics by class only',
      'all': 'Everyone with a Vitality Network (includes Mystic Dedication)',
      'off': 'Off'
    },
    default: 'class'
  });
}
