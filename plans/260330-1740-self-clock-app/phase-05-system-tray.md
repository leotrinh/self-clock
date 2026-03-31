# Phase 5: System Tray

## Context Links
- [Plan Overview](plan.md)
- [Tauri v2 Research — Tray](reports/researcher-260330-1740-tauri-v2-windows-clock-app.md)

## Overview
- **Priority:** Medium
- **Status:** Planned
- **Description:** System tray icon with menu, close-to-tray behavior

## Key Insights
- Requires `tray-icon` feature in Cargo.toml
- Tray icon must be .ico format (16x16 minimum)
- Tray menu built in Rust (`src-tauri/src/lib.rs`)
- Close button hides window → tray icon remains

## Requirements
- System tray icon when app runs
- Right-click menu: Show/Hide, Always on Top, Quit
- Close button (X) hides to tray instead of quitting
- Double-click tray icon toggles window visibility

## Files to Modify
- `src-tauri/Cargo.toml` — Add `tray-icon` feature
- `src-tauri/src/lib.rs` — Tray setup + menu handlers
- `src-tauri/capabilities/default.json` — Add tray permissions

## Files to Create
- `src-tauri/icons/tray-icon.ico` — 16x16 tray icon (or use default app icon)

## Implementation Steps

1. Enable tray feature in `src-tauri/Cargo.toml`:
   ```toml
   tauri = { version = "2", features = ["tray-icon"] }
   ```

2. Add tray setup in `src-tauri/src/lib.rs`:
   ```rust
   use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState};
   use tauri::menu::{Menu, MenuItem};

   // Build menu: Show/Hide, Always on Top, Separator, Quit
   // On "quit" → std::process::exit(0)
   // On "toggle" → window.show()/hide()
   // On tray double-click → toggle window visibility
   ```

3. Handle close-to-tray:
   - Listen for window close event in Rust
   - Instead of closing: `window.hide()`
   - Add `on_window_event` handler

4. Add permissions for tray operations

## Todo List
- [ ] Add tray-icon feature to Cargo.toml
- [ ] Create tray menu in lib.rs
- [ ] Handle close event → hide to tray
- [ ] Add tray double-click → show window
- [ ] Test tray behavior on Windows

## Success Criteria
- Tray icon appears on app start
- Right-click shows menu with correct options
- Close button hides to tray (app keeps running)
- Double-click tray restores window
- "Quit" from tray actually exits app
