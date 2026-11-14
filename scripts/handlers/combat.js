/**
 * combat.js — Sargas' Vitality Network
 *
 * Recharges the Vitality Network at the start of each combatant's turn.
 */

import { MODULE_TITLE } from '../constants.js';
import { updateVitalityPool } from '../update-vitality-pool.js';

export function registerCombatHooks() {
  // Fires on every client whenever the turn or round changes, including the
  // first turn when combat starts. updateVitalityPool makes sure only one
  // client writes and that a turn isn't recharged twice.
  Hooks.on('combatTurnChange', (combat) => {
    const combatant = combat?.combatant;
    if (!combatant) return;

    updateVitalityPool(combat, combatant).catch(error => {
      console.error(`${MODULE_TITLE} | Recharge failed for ${combatant.name}`, error);
    });
  });
}
