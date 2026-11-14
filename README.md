# Sargas' Vitality Network (Starfinder 2e)

A Foundry VTT module that automates the Starfinder 2e Mystic's **Vitality Network**: it recharges the network each turn, refills it on Refocus, and handles spending it on Transfer Vitality. It is built for the **Starfinder 2e system** and also supports Pathfinder 2e with the Starfinder Anachronism module.

> This module is a fork of [Greenbottle's Vitality Network](https://github.com/Ayabara1013/greenbottles-vitality-network) by Doc_ (Greenbottle). It has its own package ID (`sargas-vitality-network`), so don't enable both: each would recharge and spend the network separately.

## Features

- **Turn-start recharge**: restores Vitality Network points at the start of the Mystic's turn in combat, scaled by their spell DC proficiency.
- **Refocus refill**: when the Mystic uses the Refocus action, the network is refilled to its maximum.
- **Transfer Vitality prompt**: when the Transfer Vitality action is used, asks how many points to spend, enforces the per-use limit for the character's level, and deducts the points.
- **Popup or chat card**: each user picks the prompt style they prefer.
- **Healing roll**: posts the healing with the system's apply buttons. With pf2e-toolbelt, its Target Helper adds an apply button for your one targeted creature.
- **Visibility controls**: the GM chooses who sees spending, recharge and refill messages.
- **Multiplayer-safe**: however many players are connected, each recharge, refill or spend is saved once.

## Installation

This module isn't listed in Foundry's package browser, so searching for it in **Install Module** won't find it. Install it from its manifest URL instead.

### Manifest URL (recommended)
1. In Foundry VTT's setup screen, open **Add-on Modules** → **Install Module**.
2. Paste this into the **Manifest URL** field at the bottom of the window and click **Install**:
   ```
   https://github.com/sargas79/sargas-vitality-network/releases/latest/download/module.json
   ```

Foundry keeps the manifest URL, so its update check on the **Add-on Modules** tab still finds new releases.

### Manual install
1. Download `module.zip` from the [latest release](https://github.com/sargas79/sargas-vitality-network/releases/latest).
2. Extract it into your Foundry user data folder as `Data/modules/sargas-vitality-network/`, so that `module.json` sits directly inside that folder.
3. Restart Foundry, or return to the setup screen, so it picks up the module.

A manual install doesn't update itself: repeat these steps for each new release.

### A specific version
To install an older version, use that release's own manifest URL, for example:
```
https://github.com/sargas79/sargas-vitality-network/releases/download/v1.0.0/module.json
```

## Quick start

1. Enable the module in your world.
2. Give the character a Vitality Network: either the Mystic class feature, or the Mystic Dedication's **Vitality Network** feat. Either one provides the resource the module uses.
3. (Optional) Enable pf2e-toolbelt, which adds an apply button for your target to the healing roll.
4. Each player picks a prompt style under **Configure Settings** → **Sargas' Vitality Network**. The GM sets everything else there (see [Settings](#settings)).

**In play:**
- **Recharge** happens by itself at the start of the Mystic's turn in combat.
- **To transfer:** target the creature to heal (yourself or a bonded ally), then use Transfer Vitality from the character sheet. Choose how many points to spend, and apply the healing from the roll card.
- **To refill:** use the **Refocus** action from the character sheet, so it's posted to chat.

## What it automates

| Rule | What the module does |
|---|---|
| **Recharge** at the start of each turn in combat | Adds 4 HP, or 6 if master in spell DC, or 8 if legendary, up to the network's maximum. If the rank can't be read, it uses level instead (6 from 15th, 8 from 19th). Only player-owned characters recharge, and each turn recharges at most once per round, even if the GM steps back and forward. |
| **Refocus** refills the network | Refills to the maximum when the Refocus action is posted to chat. Mystics by class only, by default; see **Refill on Refocus**. |
| **Transfer Vitality** limit per use | Class feature: 10 HP at 1st level, 20 at 5th, 30 at 10th, 40 at 15th, 50 at 20th. Mystic Dedication: 10, 15, 20, 25, 30 at the same levels. You can never spend more than the network holds. |
| Transfer Vitality has **one target** | With exactly one token targeted, pf2e-toolbelt's apply button is limited to that creature. With more than one, you get a warning. |
| Network **capacity** | Read from the character's Vitality Network resource, which the system calculates. The module never changes the maximum. |

## Settings

| Setting | Who sets it | Options (default in bold) | What it does |
|---|---|---|---|
| **Dialog Style** | Each player | Popup Dialog, **Chat Message** | How the Transfer Vitality prompt appears for you. |
| **Show Vitality Spending** | GM | **Everyone (Public Chat)**, Owner Only (Whisper), GM Only (Whisper), Owner and GM (Whisper), No One (Silent) | Who sees the spending summary and the healing roll. With *No One*, the roll is whispered to the spender only, so they can still apply it. |
| **Show Vitality Network Updates** | GM | Everyone, **Owner Only**, GM Only, Owner and GM, No One | Who is told about turn-start recharges and Refocus refills. |
| **Update Notification Style** | GM | **UI Notification (top right)**, Chat Message | Whether recharge and refill notices pop up in the corner or are posted to chat. |
| **Refill on Refocus** | GM | **Mystics by class only**, Everyone with a Vitality Network (includes Mystic Dedication), Off | Who is refilled by Refocus. *Everyone* includes Mystic Dedication characters, whose feat text doesn't mention a refill. |

"Owner" means the players who own the character, not the GM. If a character has no player owner, owner-only messages go to the GM instead of becoming public.

## Requirements

| | |
|---|---|
| Foundry VTT | v14 |
| Game system | **Starfinder 2e** 1.7.0+ (primary), or Pathfinder 2e 8.7.0+ with Starfinder Anachronism |
| Recommended | pf2e-toolbelt, for a per-target apply button on the healing roll |
| Conflicts | `greenbottles-vitality-network`, `sf2e-vitality-network` |

## Known limits and troubleshooting

- **Healing isn't applied automatically.** Apply it from the roll card, or with pf2e-toolbelt's button for your target.
- **Refocus has to be the action.** The refill only happens when the Refocus action is posted to chat from the character sheet. Getting focus points back some other way, such as editing the focus pool by hand, doesn't refill the network.
- **No recharge with nobody connected who can save it.** If no GM is online and the Mystic's owner is offline, the turn-start recharge is skipped.
- **Rare lost update.** If a player spends in the instant their turn's recharge is being saved, one of the two changes can be lost. Check the network value if a spend and a turn start happen together.
- **No prompt when using Transfer Vitality?** Check that the character has a Vitality Network with points left, that you own the character, and that the action was used from the sheet so it was posted to chat.
- **Settings from Greenbottle's Vitality Network don't carry over**, because this module has its own package ID.

## Credits

- **Maintainer**: [sargas79](https://github.com/sargas79)
- **Original author**: Doc_ (Greenbottle), [Greenbottle's Vitality Network](https://github.com/Ayabara1013/greenbottles-vitality-network)

## Changelog

See [CHANGELOG.md](CHANGELOG.md), or the [Releases](https://github.com/sargas79/sargas-vitality-network/releases) page.

## License

MIT. See [LICENSE](LICENSE). The original copyright notice is kept as the licence requires.
