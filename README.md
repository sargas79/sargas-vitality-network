# Sargas' Vitality Network (Starfinder 2e)

A Foundry VTT module that automates the Starfinder 2e Mystic's **Vitality Network**. It is built for the **Starfinder 2e system** and also supports Pathfinder 2e with the Starfinder Anachronism module.

> This module is a fork of [Greenbottle's Vitality Network](https://github.com/Ayabara1013/greenbottles-vitality-network) by Doc_ (Greenbottle). It has its own package ID (`sargas-vitality-network`), so don't enable both: each would recharge and spend the network separately.

## Features

- **Turn-start recharge**: restores Vitality Network points at the start of the Mystic's turn in combat.
- **Refocus refill**: when the Mystic uses the Refocus action, the network is refilled to its maximum.
- **Transfer Vitality prompt**: when the Transfer Vitality action is used, asks how many points to spend and deducts them.
- **Popup or chat card**: each user picks the prompt style they prefer.
- **Healing roll**: posts the healing with the system's apply buttons. With pf2e-toolbelt, its Target Helper adds an apply button for your one targeted creature.
- **Visibility controls**: the GM chooses who sees spending and recharge messages.

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

## Usage

1. Enable the module in your world.
2. Make sure the Mystic has the Vitality Network class feature, which provides the resource.
3. (Optional) Enable pf2e-toolbelt, which adds an apply button for your target to the healing roll.
4. Players pick a prompt style under **Configure Settings** → **Sargas' Vitality Network**.
5. Target the creature to heal (yourself or a bonded ally), use Transfer Vitality, choose how many points to spend, then apply the healing from the roll card.
6. To refill the network, use the **Refocus** action from the character sheet so it's posted to chat. The GM can turn the refill off, or extend it to Mystic Dedication characters, with the **Refill on Refocus** setting.

## Requirements

| | |
|---|---|
| Foundry VTT | v14 |
| Game system | **Starfinder 2e** 1.7.0+ (primary), or Pathfinder 2e 8.7.0+ with Starfinder Anachronism |
| Recommended | pf2e-toolbelt, for a per-target apply button on the healing roll |
| Conflicts | `greenbottles-vitality-network`, `sf2e-vitality-network` |

## Credits

- **Maintainer**: [sargas79](https://github.com/sargas79)
- **Original author**: Doc_ (Greenbottle), [Greenbottle's Vitality Network](https://github.com/Ayabara1013/greenbottles-vitality-network)

## Changelog

See [Releases](https://github.com/sargas79/sargas-vitality-network/releases).

## License

MIT. See [LICENSE](LICENSE). The original copyright notice is kept as the licence requires.
