# Sargas' Vitality Network (Starfinder 2e)

A Foundry VTT module that automates the Starfinder 2e Mystic's **Vitality Network**. It is built for the **Starfinder 2e system** and also supports Pathfinder 2e with the Starfinder Anachronism module.

> This module is a fork of [Greenbottle's Vitality Network](https://github.com/Ayabara1013/greenbottles-vitality-network) by Doc_ (Greenbottle). It has its own package ID (`sargas-vitality-network`), so don't enable both: each would recharge and spend the network separately.

## Features

- **Turn-start recharge**: restores Vitality Network points at the start of the Mystic's turn in combat.
- **Transfer Vitality prompt**: when the Transfer Vitality action is used, asks how many points to spend and deducts them.
- **Popup or chat card**: each user picks the prompt style they prefer.
- **Healing roll**: posts the healing with the system's apply buttons. With pf2e-toolbelt, its Target Helper adds an apply button for your one targeted creature.
- **Visibility controls**: the GM chooses who sees spending and recharge messages.

## Installation

### Foundry package manager
1. In Foundry VTT, open **Add-on Modules** → **Install Module**.
2. Search for "Sargas' Vitality Network".
3. Click **Install**.

### Manifest URL
Paste this into **Install Module** → **Manifest URL**:
```
https://github.com/sargas79/sargas-vitality-network/releases/latest/download/module.json
```

## Usage

1. Enable the module in your world.
2. Make sure the Mystic has the Vitality Network class feature, which provides the resource.
3. (Optional) Enable pf2e-toolbelt, which adds an apply button for your target to the healing roll.
4. Players pick a prompt style under **Configure Settings** → **Sargas' Vitality Network**.
5. Target the creature to heal (yourself or a bonded ally), use Transfer Vitality, choose how many points to spend, then apply the healing from the roll card.

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
