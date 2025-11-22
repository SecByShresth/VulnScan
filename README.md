# 🛡️ Ephemeral Vulnerability Scanner

> **Enterprise-grade, client-side vulnerability analysis engine**  
> 100% privacy-first • Zero data storage • Ephemeral by design

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Client-Side](https://img.shields.io/badge/Architecture-Client--Side-green.svg)](https://github.com)
[![No Tracking](https://img.shields.io/badge/Privacy-No%20Tracking-success.svg)](https://github.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Demo](#-demo)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Supported Platforms](#-supported-platforms)
- [Privacy & Security](#-privacy--security)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Ephemeral Vulnerability Scanner** is a powerful, privacy-first security tool that analyzes your system's installed packages for known vulnerabilities. Unlike traditional scanners, it runs **entirely in your browser** with zero data transmission to external servers.

### Why Ephemeral?

- ✅ **100% Client-Side** - All analysis happens locally in your browser
- ✅ **Zero Data Storage** - No databases, no cookies, no tracking
- ✅ **Ephemeral by Design** - Everything disappears on page refresh
- ✅ **Privacy-First** - Your inventory files never leave your device
- ✅ **No Installation** - Just open `index.html` in any modern browser

---

## ✨ Features

### 🔍 **Comprehensive Vulnerability Detection**

- **Multi-Source Analysis**: Queries MSRC, OSV.dev, and CISA KEV databases
- **Strict Lookup Logic**: 3-step sequential verification to prevent false positives
- **Package-Centric Results**: Groups vulnerabilities by package for actionable insights
- **Severity Classification**: Critical, High, Medium, and Low severity ratings

### 📦 **Package-Centric Display**

- **Consolidated View**: One card per package (not per CVE)
- **Smart Grouping**: All CVEs affecting a package shown together
- **Minimum Safe Version**: Automatically determines the fix version
- **Actionable Commands**: Copy-paste ready update commands for your OS

### 🎨 **Modern UI/UX**

- **Light/Dark Mode**: Toggle between themes with persistent preference
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished micro-interactions
- **Glassmorphism**: Premium design with depth and clarity

### 📊 **Export & Reporting**

- **HTML Export**: Download complete vulnerability report
- **PDF Export**: Generate professional PDF reports (ready to implement)
- **Clickable CVE Links**: Direct links to NVD, GitHub Advisories, OSV.dev
- **Summary Statistics**: Quick overview of affected packages and severity

### 🔒 **Privacy & Security**

- **No Backend**: Pure client-side JavaScript
- **No Data Transmission**: Inventory files stay on your device
- **No Cookies**: Zero tracking or analytics
- **No Storage**: Everything is ephemeral

---

## 🚀 Quick Start

### **Option 1: Download & Run Locally**

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vulnerability-scanner.git

# Navigate to the directory
cd vulnerability-scanner

# Open in browser
# Windows:
start index.html

# macOS:
open index.html

# Linux:
xdg-open index.html
```

### **Option 2: Use GitHub Pages**

Simply visit: `https://YOUR_USERNAME.github.io/vulnerability-scanner/`

---

## 📖 How It Works

### **Step 1: Generate System Inventory**

#### **Windows (PowerShell)**
```powershell
Get-WmiObject -Class Win32_Product | Select-Object Name, Version | ConvertTo-Json | Out-File -FilePath "inventory.json"
```

#### **Linux/macOS**
```bash
# Debian/Ubuntu
dpkg -l | awk '/^ii/ {print "{\"name\":\""$2"\",\"version\":\""$3"\"}"}' | jq -s '.' > inventory.json

# Red Hat/CentOS
rpm -qa --queryformat '{"name":"%{NAME}","version":"%{VERSION}"}\n' | jq -s '.' > inventory.json

# macOS (Homebrew)
brew list --versions | awk '{print "{\"name\":\""$1"\",\"version\":\""$2"\"}"}' | jq -s '.' > inventory.json
```

### **Step 2: Upload & Analyze**

1. Open `index.html` in your browser
2. Select your operating system
3. Upload the generated `inventory.json` file
4. Click "Start Vulnerability Analysis"

### **Step 3: Review Results**

- **Package Cards**: Each card shows one affected package
- **CVE List**: All vulnerabilities affecting that package
- **Recommended Fix**: Minimum safe version and update commands
- **Export**: Download HTML or PDF report

---

## 🔍 Vulnerability Lookup Logic

The scanner uses a **strict 3-step sequential lookup** to ensure accuracy:

### **For Windows:**
1. **MSRC CSAF API** - Microsoft Security Response Center
2. **OSV.dev API** - Open Source Vulnerabilities (if MSRC fails)
3. **CISA KEV** - Known Exploited Vulnerabilities (fallback)

### **For Linux/macOS:**
1. **OSV.dev API** - Primary source for open-source packages
2. **CISA KEV** - Fallback for known exploited vulnerabilities

**Key Principle**: Only proceed to the next source if the previous one fails or returns no data. This prevents false positives and ensures accurate results.

---

## 💻 Supported Platforms

### **Operating Systems**
- ✅ Windows (7, 8, 10, 11, Server)
- ✅ Linux (Debian, Ubuntu, Red Hat, CentOS, Fedora)
- ✅ macOS (10.14+)
- ✅ Unix-based systems

### **Browsers**
- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Opera (76+)

### **Package Managers**
- ✅ Windows: WMI, Chocolatey, Winget
- ✅ Linux: apt, yum, dnf, pacman
- ✅ macOS: Homebrew, MacPorts

---

## 🔒 Privacy & Security

### **Privacy Guarantees**

| Feature | Status |
|---------|--------|
| Data Storage | ❌ None |
| Cookies | ❌ None |
| Tracking | ❌ None |
| Analytics | ❌ None |
| Backend Server | ❌ None |
| Data Transmission | ❌ None (except API queries) |
| Local Processing | ✅ 100% |
| Ephemeral | ✅ Yes |

### **What Gets Sent to APIs?**

Only **package names and versions** are sent to:
- MSRC CSAF API (for Windows packages)
- OSV.dev API (for all packages)
- CISA KEV (JSON file download, no data sent)

**Your inventory file never leaves your device.**

---

## 📚 Documentation

### **Core Documentation**
- [`IMPLEMENTATION.md`](IMPLEMENTATION.md) - Vulnerability lookup logic
- [`PACKAGE-CENTRIC.md`](PACKAGE-CENTRIC.md) - Package grouping implementation
- [`COMPLETE.md`](COMPLETE.md) - Feature completion status

### **Code Structure**

```
vulnerability-scanner/
├── index.html          # Main application
├── styles.css          # Complete styling (dark/light modes)
├── app.js              # Core logic & vulnerability analysis
├── favicon.svg         # Application icon
├── favicon.ico         # Fallback icon
├── README.md           # This file
└── docs/
    ├── IMPLEMENTATION.md
    ├── PACKAGE-CENTRIC.md
    ├── COMPLETE.md
    ├── THEME-PDF-GUIDE.md
    └── THEME-STATUS.md
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### **Ways to Contribute**
- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🎨 Enhance UI/UX
- 🔧 Submit pull requests

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📞 Support

### **Issues & Questions**
- 🐛 [Report a Bug](https://github.com/YOUR_USERNAME/vulnerability-scanner/issues)
- 💡 [Request a Feature](https://github.com/YOUR_USERNAME/vulnerability-scanner/issues)

---

<div align="center">

**Made with ❤️ for the security community**

[⬆ Back to Top](#-ephemeral-vulnerability-scanner)

</div>
