/**
 * main.js — Sargas' Vitality Network
 *
 * Module entry point. Registers settings and hooks, but only on a supported
 * game system (Starfinder 2e, or Pathfinder 2e with Starfinder Anachronism).
 *
 * Module architecture:
 *   main.js                          ← you are here (bootstraps everything)
 *   constants.js                     ← module ID and title
 *   settings.js                      ← registers all Foundry module settings
 *   system-adapter.js                ← everything that differs between SF2e and PF2e
 *   utils.js                         ← rules (limits, recharge), spending, visibility helpers
 *   handlers/combat.js               ← recharges the network at the start of each turn
 *   handlers/transfer-vitality.js    ← detects Transfer Vitality, shows the spend prompt
 *   healing.js                       ← rolls the healing and hands it to pf2e-toolbelt
 *   update-vitality-pool.js          ← the per-turn recharge itself
 */

import { MODULE_TITLE } from './constants.js';
import { registerSettings } from './settings.js';
import { isSupportedSystem, SUPPORTED_SYSTEMS } from './system-adapter.js';
import { registerCombatHooks } from './handlers/combat.js';
import { registerChatCardHooks, registerTransferVitalityHooks } from './handlers/transfer-vitality.js';

Hooks.once('init', () => {
  if (!isSupportedSystem()) {
    console.warn(`${MODULE_TITLE} | System "${game.system.id}" is not supported (needs ${SUPPORTED_SYSTEMS.join(' or ')}); module disabled.`);
    return;
  }
  console.log(`${MODULE_TITLE} | Initializing on ${game.system.id}`);
  registerSettings();
  registerChatCardHooks();
});

Hooks.once('ready', () => {
  if (!isSupportedSystem()) return;
  registerCombatHooks();
  registerTransferVitalityHooks();
  console.log(`${MODULE_TITLE} | Ready`);
});
