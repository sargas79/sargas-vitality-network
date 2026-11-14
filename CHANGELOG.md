# Changelog

## 1.0.0 (unreleased)

First release as **Sargas' Vitality Network** (`sargas-vitality-network`), a Starfinder 2e-first fork of Greenbottle's Vitality Network 1.2.0.

### New package
- New package ID, title, manifest and download URLs. Settings from the original module don't carry over.
- Starfinder 2e is the primary system. Pathfinder 2e with Starfinder Anachronism is still supported.
- Lists `greenbottles-vitality-network` and `sf2e-vitality-network` as conflicts, since running two of them double-charges the network.
- pf2e-toolbelt is now recommended instead of required. The unused `greenbottles-toolbelt` requirement is removed.
- Removed the macro compendium, which was declared but never shipped.

### Rules
- Transfer Vitality is capped per use: 10 / 20 / 30 / 40 / 50 HP at levels 1 / 5 / 10 / 15 / 20 for the class feature, and 10 / 15 / 20 / 25 / 30 for the Mystic Dedication version.
- Turn-start recharge follows spell DC proficiency: 4 HP, 6 if master, 8 if legendary. If the rank can't be read, it falls back to the old level-based approximation.
- Transfer Vitality has a single target. With exactly one token targeted, pf2e-toolbelt's apply button is limited to that creature. With more than one, you get a warning.

### Fixes
- The recharge ran once per connected client, so each client wrote the update and posted its own chat message. Now one client writes it.
- Stepping back a turn and then forward again no longer recharges the same turn twice.
- Spending always reads the current network value. Previously an old chat card could write back a stale total.
- A chat card can only be spent once, including after a reload and when it's on screen twice (chat log and notification toast).
- In chat-card mode, the spending summary now follows the "Show Vitality Spending" setting, as the popup already did.
- In the popup, an empty or invalid amount shows a warning instead of quietly cancelling.
- No "regained" notification is shown when nobody connected can write the recharge (no GM, owner offline).
- The spend prompt now goes to whoever used the action and owns the character. Previously it went only to the user with that character assigned, which missed GMs and unlinked tokens.
- "Owner only" messages with no player owner now go to the GM, where they used to become public.
- Character names and images are escaped in chat cards.
- The healing was handed to a `pf2e-toolbelt.target-helper.damage-received` hook that pf2e-toolbelt doesn't have, so it did nothing. The roll now sets Target Helper's own message flag.

### Foundry v14
- Requires Foundry v14, as current Starfinder 2e (1.7.0) and Starfinder Anachronism releases do.
- The popup uses `DialogV2` and the chat card uses the `renderChatMessageHTML` hook. No jQuery.
- Chat messages no longer pass the deprecated `user` field.
- The release workflow reads the version and compatibility from `module.json`, and each release's download link points at that release. Prereleases aren't submitted to the Foundry registry.
- New `tests/logic.test.mjs` (mocked Foundry, no dependencies) and a CI workflow that runs it.

### Known limits
- If a player spends in the instant between their turn starting and the recharge being saved, one of the two changes can be lost.
- Healing isn't applied automatically. It's applied from the roll card, or from pf2e-toolbelt's button for the target.
