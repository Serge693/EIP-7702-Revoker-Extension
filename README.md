# EIP-7702 Revoker Extension

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest: v3](https://img.shields.io/badge/manifest-v3-green.svg)]()

A browser extension to scan, revoke, and manage **EIP-7702 delegations** across 19 EVM networks — with sponsored gas, no ETH required on the compromised wallet.

---

## The Problem

EIP-7702 (Pectra upgrade, May 2025) allows an EOA to temporarily act as a smart contract by delegating to a contract address. Attackers exploit this by phishing users into signing a malicious authorization — giving the attacker full control over the wallet.

Once delegated, the attacker can:
- Drain all tokens and NFTs
- Forward any incoming funds automatically
- Block the victim from sending transactions

**The victim cannot fight back** — any ETH sent to pay gas gets stolen instantly by the delegation logic.

---

## How This Extension Solves It

```
Compromised wallet (private key) → signs EIP-7702 authorization locally
                                              ↓
                              Sponsor wallet (stored encrypted) → sends Type-4 tx
                                              ↓
                                    Delegation revoked — wallet clean
```

- The **compromised wallet** needs zero ETH — gas is fully sponsored
- The **private key** is used only locally in the browser — never sent anywhere
- The **sponsor key** is stored encrypted with AES-256-GCM — password protected

---

## Features

- 🔍 **Scan** — check delegation status across 19 EVM networks simultaneously
- 🚫 **Revoke** — remove malicious delegations with sponsored gas
- 🔗 **Delegate** — set trusted delegations (for advanced users)
- ☑️ **Batch operations** — select multiple networks and revoke/delegate in one click
- 🔐 **Encrypted sponsor key** — AES-256-GCM, never leaves your device
- ⚡ **No server** — fully client-side, no backend required

---

## Supported Networks

| Network | Chain ID | Native |
|---|---|---|
| Ethereum | 1 | ETH |
| Base | 8453 | ETH |
| Ink | 57073 | ETH |
| Arbitrum One | 42161 | ETH |
| OP Mainnet | 10 | ETH |
| Polygon | 137 | POL |
| BNB Smart Chain | 56 | BNB |
| Gnosis Chain | 100 | xDAI |
| Linea | 59144 | ETH |
| Blast | 81457 | ETH |
| Mode | 34443 | ETH |
| Soneium | 1868 | ETH |
| zkSync Era | 324 | ETH ⚠️ |
| Berachain | 80094 | BERA |
| Unichain | 130 | ETH |
| World Chain | 480 | ETH |
| Lisk | 1135 | ETH |
| Bob | 60808 | ETH |
| Zora | 7777777 | ETH |
| Plume   | 98866 | PLUME |

> ⚠️ zkSync Era may not fully support EIP-7702 — use with caution.

---

## Installation

### From source

```bash
git clone https://github.com/Serge693/EIP-7702-Revoker-Extension
cd EIP-7702-Revoker-Extension
npm install
npm run build
```

Load `dist/` as an unpacked extension in Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

### Setup sponsor wallet

1. Open the extension → **Settings** tab
2. Enter the private key of a wallet with gas on target networks
3. Set an encryption password (min 6 characters)
4. Click **Save & Encrypt**

The sponsor key is encrypted with AES-256-GCM and stored in `chrome.storage.local`. It never leaves your device.

---

## Usage

1. Open the extension → **Scan & Revoke** tab
2. Enter the **private key of the compromised wallet** (used locally only to sign the EIP-7702 authorization)
3. The address auto-fills — click **Scan All Networks**
4. Unlock the sponsor wallet with your password
5. Select networks with active delegations (checkboxes) → click **Revoke Selected**

---

## Security Model

| What | Where | Sent to server? |
|---|---|---|
| Compromised wallet private key | Browser memory only | ❌ Never |
| EIP-7702 authorization signature | Browser → sponsor tx | Only `r`, `s`, `yParity` |
| Sponsor private key | `chrome.storage.local` encrypted | ❌ Never |
| Delegation scan results | Public RPC calls | No sensitive data |

---

## Related Tools

- [EIP-7702 Revoker CLI](https://github.com/Serge693/eip7702-revoker) — command-line tool for revoking delegations
- [EIP-7702 Rescue Web](https://github.com/Serge693/eip7702-rescue-web) — web UI for rescuing funds from compromised wallets
- [AutoForwarder](https://github.com/Serge693/auto-forwarder) — permanent EIP-7702 delegation to auto-forward incoming funds

---

## License

MIT © Serge693
