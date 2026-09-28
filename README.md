<p align="center">
  <a href="https://jaym3.github.io/budgetflow/">
    <img src="public/logo.png" alt="BudgetFlow Logo" width="120" height="120">
  </a>
</p>

<h1 align="center">BudgetFlow 🌊</h1>

<p align="center">
  <strong>Intelligent, friction-free personal and family budgeting.</strong>
</p>

<p align="center">
  <a href="https://github.com/JayM3/budgetflow/releases/tag/v1.0.2.4"><img src="https://img.shields.io/badge/release-v1.0.2.4-06b6d4?logo=github&style=flat-square" alt="GitHub Release v1.0.2.4"></a>
  <a href="https://jaym3.github.io/budgetflow/"><img src="https://img.shields.io/badge/Live%20Demo-jaym3.github.io%2Fbudgetflow-0891b2?logo=googlechrome&logoColor=white&style=flat-square" alt="Live Web Demo"></a>
  <a href="https://github.com/JayM3/budgetflow"><img src="https://img.shields.io/badge/Architecture-Dual--Mode%20(Static%20%2B%20Hub)-10b981?logo=node.js&logoColor=white&style=flat-square" alt="Dual-Mode Architecture"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Dependencies-Zero%20Native%20C%2B%2B-blueviolet?style=flat-square" alt="Zero Native C++ Dependencies">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Termux%20%7C%20Web-informational?style=flat-square" alt="Platform: Linux | Termux | Web">
  <img src="https://img.shields.io/badge/Currencies-NOK%20%7C%20USD%20%7C%20EUR-informational?style=flat-square" alt="Currencies: NOK | USD | EUR">
</p>

<p align="center">
  <a href="https://jaym3.github.io/budgetflow/"><strong>Launch Live Demo »</strong></a> •
  <a href="#-key-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-cli-commands">CLI Commands</a> •
  <a href="#-tablet-kiosk-mode">Tablet Kiosk</a> •
  <a href="#-license">License</a>
</p>

---

## 🌊 What is BudgetFlow?

**BudgetFlow** is a modern, privacy-first personal and household budgeting app designed to eliminate spreadsheet headaches and paid subscription tools. It provides dynamic daily spending pacing, scenario testing before you buy, and an always-on tablet kiosk for the kitchen or hallway.

### Dual-Distribution Model

- **[Live Web Demo](https://jaym3.github.io/budgetflow/)**: Runs 100% in your browser with realistic sample data. Zero installation required.
- **BudgetFlow Family Hub (Self-Hosted)**: Run your own private, clean-slate household hub on a Linux home server, Raspberry Pi, mini PC, or an Android tablet using **Termux**. Requires **zero native C++ build tools**.

---

## ✨ Key Features

- 🎯 **Daily Safe-to-Spend**: Real-time burn-rate pacer calculates exactly how much you can spend today without running out before payday.
- 🔮 **"What-If" Purchase Simulator**: Test prospective purchases before buying to see how they impact your daily allowance and savings goals.
- ⚖️ **Dynamic Envelope Smoothing**: 1-click rebalancing between budget categories without guilt or complex reconciliations.
- 🔒 **9-Dot Pattern Touch Lock**: Fast, tactile lockscreen authentication for shared household devices (PBKDF2 / SHA-256 salted hashes).
- 📱 **Always-On Tablet Kiosk**: Turn an old tablet into a fridge-mounted family hub with screen wake lock, large touch buttons, and a 15-second auto-lock.
- 👨‍👩‍👧‍👦 **Family Roles & Permissions**: Multi-user support with admin/member roles and granular per-wallet visibility.
- 🔄 **Recurring Bills & Auto-Processing**: Manage subscriptions and repeating bills with automatic cycle advancement and payment recording.
- 🌐 **Multi-Currency & NLP Omnibar**: Native support for Norwegian Krone (NOK kr), USD ($), and EUR (€) with smart natural text input (`"500 kr groceries at Kiwi"`).
- 💾 **Local-First & Resilient**: Atomic JSON storage with power-loss safety and zero third-party cloud tracking.

---

## ⚡ Quick Start

### 1. Try the Live Demo (Instant)

Experience BudgetFlow directly in your browser with preloaded demo data:  
👉 **[https://jaym3.github.io/budgetflow/](https://jaym3.github.io/budgetflow/)**

---

### 2. Self-Hosted Family Hub (Linux & Android Termux)

Run on any Linux system, Raspberry Pi, or Android tablet via Termux:

```bash
# 1. Clone the repository
git clone https://github.com/JayM3/budgetflow.git
cd budgetflow

# 2. Run the automated installer
chmod +x install.sh
./install.sh

# 3. Start the server (runs as background daemon)
budgetflow start
```

Open `http://<server-ip>:5050` in any browser on your home network to complete the clean-slate setup wizard.

---

### 3. Local Development

```bash
# Install dependencies & start Vite dev server
npm install
npm run dev

# (Optional) Run backend hub in another terminal
cd server && npm install && node server.js
```

---

## 🛠️ CLI Commands

When installed globally, BudgetFlow includes a unified management CLI:

| Command | Description |
| :--- | :--- |
| `budgetflow` / `budgetflow start` | Start server as background daemon (use `-f` for foreground) |
| `budgetflow stop` | Stop running background daemon |
| `budgetflow restart` | Restart the server daemon |
| `budgetflow status` | Display server status, PID, port, and LAN URL |
| `budgetflow logs -f` | Tail live background server logs |
| `budgetflow update` | Check for updates and self-update from GitHub |
| `budgetflow backup` | Create a timestamped database snapshot |
| `budgetflow restore <file>` | Restore database from a backup file |
| `budgetflow wipe` | Factory reset back to a clean slate (creates safety backup) |
| `budgetflow doctor` | Run health and environment diagnostics |
| `budgetflow service install` | Configure system autostart (systemd or Termux:Boot) |

---

## 📱 Tablet Kiosk Mode

Set up a dedicated kitchen or entryway display:

1. **Mount Display**: Mount an Android tablet, iPad, or touch monitor on a wall or fridge.
2. **Navigate**: Open Chrome or Fully Kiosk Browser to `http://<server-ip>:5050`.
3. **Launch Kiosk**: Tap the **Tablet Kiosk** button in the header.
4. **Lock & Go**: Tap **Full Screen** and **Keep Screen Awake**. Family members tap `+ Log Expense`, use quick touch increments, draw their 9-dot pattern, and the screen returns to ambient mode after 15 seconds.

---

## 🔒 Security & Privacy

- **100% Local Network**: Financial data never leaves your private network. No telemetry, no external database dependencies.
- **Salted Cryptographic Auth**: 9-dot patterns are hashed with PBKDF2/SHA-256 and constant-time comparison.
- **Power-Loss Safe**: Writes use atomic file replacement to avoid corruption during unexpected shutdowns.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

<p align="center">
  Built with ❤️ for privacy-minded households.
</p>
