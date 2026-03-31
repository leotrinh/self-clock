# Self Clock

A dual-timezone desktop clock app for Windows, built with Tauri v2 + Svelte 5 + TypeScript.

## Features

- **Dual Timezone Display** — Shows local time and working time simultaneously
- **Timezone Selection** — Choose any timezone via Intl API (no external dependencies)
- **System Tray** — Minimize to tray, right-click menu (Show/Hide, Always on Top, Quit)
- **Window Controls** — Auto-hide controls on idle, show on hover, drag from content area
- **Custom Theme** — Background/text color pickers with live preview
- **Opacity Controls** — Adjust background and text opacity
- **Windows Startup** — Option to start with Windows on login

## Architecture

```
self-clock/
├── src/                          # Svelte frontend
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ClockDisplay.svelte   # Main clock display
│   │   │   ├── TitleBar.svelte       # Custom title bar with controls
│   │   │   ├── Settings.svelte        # Settings panel
│   │   │   └── TimezoneSelect.svelte # Timezone dropdown
│   │   ├── stores/
│   │   │   └── clock-store.js        # Svelte stores for time state
│   │   └── utils/
│   │       └── timezone-utils.js     # Timezone utilities
│   └── routes/
│       └── +page.svelte              # Main page
├── src-tauri/                     # Rust backend
│   ├── src/
│   │   └── lib.rs                   # Tauri app setup + tray
│   ├── Cargo.toml                   # Rust dependencies
│   └── tauri.conf.json               # Tauri config
└── package.json                    # Node dependencies
```

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Svelte 5, TypeScript, SvelteKit |
| Backend | Tauri v2, Rust |
| Build | Vite, Cargo |
| Plugins | @tauri-apps/plugin-autostart, @tauri-apps/plugin-opener |

## Commands

```bash
# Development
cd self-clock && npm run tauri dev

# Build for production
cd self-clock && npm run tauri build
```

## Build Output

- **Executable**: `src-tauri/target/release/self-clock.exe` (~5 MB)
- **MSI Installer**: `src-tauri/target/release/bundle/msi/self-clock_0.1.0_x64_en-US.msi`
- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/self-clock_0.1.0_x64-setup.exe`

## UI Screenshots

### Clock View (Idle)
```
┌─────────────────────────────────┐
│                                   │
│   LOCAL (Asia/Bangkok)        │
│   02:25:43 PM GMT+7           │
│   Monday, March 31            │
│                                   │
│   WORKING (Europe/Berlin)      │
│   08:25:43 PM CET             │
│   Monday, March 31            │
│                                   │
│    made by Leo with ❤️        │
│                                   │
└─────────────────────────────────┘
```

### Clock View (Hover)
```
┌─────────────────────────────────┐
│ Self Clock    [⚙] [─] [×]      │ ← Title + controls visible
│                                   │
│   LOCAL (Asia/Bangkok)        │
│   02:25:43 PM GMT+7           │
│   Monday, March 31            │
│                                   │
│   WORKING (Europe/Berlin)      │
│   08:25:43 PM CET             │
│   Monday, March 31            │
│                                   │
│    made by Leo with ❤️        │
│                                   │
└─────────────��───────────────────┘
```

### Settings View
```
┌─────────────────────────────────┐
│ ← Back                         │
│                                   │
│ Local Timezone            [▼]  │
│ Working Timezone          [▼]  │
│                                   │
│ Colors                         │
│ Background        [■ #0f0f19] │
│ Text             [■ #ffffff]  │
│                                   │
│ Background Opacity: [=====] 85%│
│ Text Opacity:        [======] 100%│
│                                   │
│ [✓] Always on Top                │
│ [ ] Start with Windows            │
└─────────────────────────────────┘
```

## Implementation History

| Phase | Description |
|-------|------------|
| 1 | Project scaffold (Tauri v2 + Svelte 5) |
| 2 | Clock core (Intl API for timezones) |
| 3 | Custom window chrome |
| 4 | Settings (timezone picker, opacity) |
| 5 | System tray |
| 6 | Polish + release build |
| 7A | Settings UX fixes (scroll, color pickers, autostart) |
| 7B | Tray icon fix + hover controls |

## License

MIT
