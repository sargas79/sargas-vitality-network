# Manual test checklist

Run this before each release.

`node tests/logic.test.mjs` covers the rules, spending, visibility and multi-client recharge logic against mocked Foundry objects. CI runs it on every push. It can't check rendering, real permissions or system integration, so the manual checks below are still needed.

## Setup

| World | Foundry | System | Modules |
|---|---|---|---|
| A (primary) | v14 (14.361+) | Starfinder 2e 1.7.0+ | this module, pf2e-toolbelt |
| B | v14 (14.361+) | Pathfinder 2e 8.7.0+ | this module, Starfinder Anachronism, pf2e-toolbelt |
| C | v14 (14.361+) | Starfinder 2e 1.7.0+ | this module only (no pf2e-toolbelt) |

In each world, set up:
- a level 1 Mystic (class), a level 10 Mystic, and a level 5 character with Mystic Dedication + Vitality Network;
- one GM and two player accounts, with each Mystic owned by one player;
- the browser console open on every client, so you can watch for errors and deprecation warnings.

## Loading
- [ ] The module loads with no errors or deprecation warnings that come from this module.
- [ ] On an unsupported system (e.g. dnd5e), the console says the module is disabled and nothing else happens.
- [ ] Enabling `greenbottles-vitality-network` or `sf2e-vitality-network` alongside this module shows Foundry's conflict warning.

## Recharge
- [ ] With the GM and both players connected, the Mystic's turn recharges **once** (4 HP at expert spell DC), with one chat message in chat mode.
- [ ] Recharge is 6 at master spell DC and 8 at legendary.
- [ ] It never goes over the maximum, and nothing is announced when the network is already full.
- [ ] Previous turn, then next turn, gives no second recharge for the same round.
- [ ] The next round recharges again.
- [ ] With no GM connected, the owning player's client does the recharge, once.
- [ ] Visibility settings: `all`, `owner` (players only), `gm`, `owner-gm` and `none` behave correctly for both UI notifications and chat messages.

## Transfer Vitality: popup
- [ ] Using the action as the player opens the dialog on that player's client only.
- [ ] Using it as the GM on the player's Mystic opens the dialog on the GM's client.
- [ ] The input max is the transfer limit (10 at level 1, 30 at level 10, 15 for the Dedication at level 5), capped by the current points.
- [ ] Entering 0, more than the max, or nothing shows a warning and spends nothing.
- [ ] Cancel or closing the window spends nothing.
- [ ] A valid amount is deducted, the summary follows the `showSpending` setting, and the healing roll is posted.

## Transfer Vitality: chat card
- [ ] The card is whispered to the user who used the action.
- [ ] Spending deducts the points, and the card becomes a summary.
- [ ] After reloading the page, the spent card has no live button.
- [ ] Spend from card 1, then recharge, then use card 2: card 2 uses the current value, not the value it was created with.
- [ ] The GM sees a player's card with the button disabled.
- [ ] Double-clicking the button spends only once.

## Refocus refill
- [ ] A class Mystic with a partly spent network uses Refocus from the sheet: the network goes to its maximum, written once with 3 clients connected.
- [ ] The announcement follows **Show Vitality Network Updates** and **Update Notification Style**: one chat message in chat mode, or a UI notification only for the right users.
- [ ] Refocus with a full network writes and announces nothing.
- [ ] **Refill on Refocus** set to *Mystics by class only*: a Mystic Dedication character isn't refilled. Set to *Everyone*: they are. Set to *Off*: nobody is.
- [ ] A Refocus message that isn't the Refocus action (e.g. typed text) doesn't refill.

## Healing
- [ ] With pf2e-toolbelt and exactly one target, the roll card's Target Helper section lists only that creature, and applying heals it.
- [ ] Targeting yourself works the same way.
- [ ] With more than one target, there's a warning. The roll card's own buttons still work.
- [ ] Without pf2e-toolbelt, the roll is posted and the system's damage card buttons apply it to the selected token.
- [ ] With `showSpending: none`, the roll is whispered to the spender only and can still be applied.
- [ ] Healing a creature with void healing works as the rules describe (Transfer Vitality counts as void for them).

## Release
- [ ] `module.json` version matches the tag.
- [ ] After publishing, the release has `module.zip` and `module.json`, and the release's `module.json` download points at that tag.
- [ ] Installing from the manifest URL on a clean Foundry works.
