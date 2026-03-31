---
status: planned
created: 2026-03-30
blockedBy: []
blocks: []
---

# Plan: self-clock — Dual Timezone Desktop Clock

## Context
User works with a German team (CET) from Vietnam (ICT). Needs a lightweight always-on-top clock widget showing both local time and working timezone. Must run on Windows with transparency/opacity controls.

## Techstack Decision
**Tauri v2 + Svelte 5 + Native Intl API**
- Tauri v2: ~5MB binary, native always-on-top & transparency, frameless window
- Svelte 5: Lightweight frontend with runes reactivity
- Native `Intl.DateTimeFormat`: Zero-dep timezone handling, auto DST
- No external date/time libraries needed

## Project: `D:\DevSpaces\CKWS\self-clock`

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | [Project Scaffold](phase-01-project-scaffold.md) | planned |
| 2 | [Clock Core](phase-02-clock-core.md) | planned |
| 3 | [Custom Window Chrome](phase-03-custom-window-chrome.md) | planned |
| 4 | [Settings & Controls](phase-04-settings-controls.md) | planned |
| 5 | [System Tray](phase-05-system-tray.md) | planned |
| 6 | [Polish & Build](phase-06-polish-build.md) | planned |
| 7 | [UI Redesign & Polish](phase-07-ui-redesign.md) | planned |
| 7A | [Settings UX Fixes — Scroll, Startup, Colors](phase-07a-settings-ux-fixes.md) | planned |
| 7B | [Tray Icon Fix + Hover Controls UX](phase-07b-tray-icon-hover-controls.md) | planned |
| 8 | [Working Hours & Teams Status](phase-08-working-hours-teams-status.md) | planned |

## Architecture

```
self-clock/
├── src/                          # Svelte frontend
│   ├── lib/
│   │   ├── stores/
│   │   │   └── clock-store.js    # Reactive clock with setInterval(1000)
│   │   └── utils/
│   │       └── timezone-utils.js # Intl.DateTimeFormat helpers
│   ├── components/
│   │   ├── ClockDisplay.svelte   # Time display (local + work tz)
│   │   ├── TitleBar.svelte       # Custom frameless titlebar + drag
│   │   ├── Settings.svelte       # Timezone picker, opacity, always-on-top
│   │   └── TimezoneSelect.svelte # Searchable timezone dropdown
│   ├── App.svelte                # Root layout
│   ├── app.css                   # Global styles + transparency
│   └── main.js                   # Entry point
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   └── lib.rs                # Tauri commands (toggle always-on-top)
│   ├── icons/                    # App icons (.ico)
│   ├── Cargo.toml
│   └── tauri.conf.json           # Window config: transparent, no decorations
├── package.json
└── vite.config.js
```

## Prerequisites
- Rust toolchain (`rustup`)
- Visual Studio C++ Build Tools (Desktop development with C++)
- WebView2 (pre-installed on Win10+)
- Node.js 18+

## Defaults
- Local timezone: auto-detect via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Working timezone: `Europe/Berlin` (CET)
- Background opacity: 85%
- Text opacity: 100%
- Always on top: ON

## Verification
1. `npm run tauri dev` — app launches with transparent frameless window
2. Both clocks update every second with correct timezone
3. Timezone selector changes working timezone + persists on reload
4. Opacity sliders affect background/text independently
5. Always-on-top toggle works (window stays above other apps)
6. Close → hides to tray, tray menu → show/quit
7. `npm run tauri build` — produces <10MB installer

## Research Reports
- [Tauri v2 Windows Features](reports/researcher-260330-1740-tauri-v2-windows-clock-app.md)
- [Dual Timezone Clock](reports/researcher-260330-1740-dual-timezone-clock.md)
