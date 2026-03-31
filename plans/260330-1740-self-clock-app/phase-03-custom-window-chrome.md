# Phase 3: Custom Window Chrome

## Context Links
- [Plan Overview](plan.md)
- [Tauri v2 Research — Frameless Window](reports/researcher-260330-1740-tauri-v2-windows-clock-app.md)

## Overview
- **Priority:** High
- **Status:** Planned
- **Description:** Build custom titlebar with drag, minimize, close buttons

## Key Insights
- `data-tauri-drag-region` attribute enables window dragging on any element
- Requires permission: `core:window:allow-start-dragging`
- Close button should hide to tray (Phase 5), not quit app
- Minimize sends to taskbar

## Requirements
- Custom titlebar replacing native decorations
- Drag-to-move via `data-tauri-drag-region`
- Minimize and close buttons
- Minimal/subtle design matching widget aesthetic

## Files to Create
- `src/components/TitleBar.svelte` — Custom titlebar component

## Files to Modify
- `src/App.svelte` — Add TitleBar component
- `src-tauri/capabilities/default.json` — Add drag permission

## Implementation Steps

1. Add permission in `src-tauri/capabilities/default.json`:
   ```json
   "permissions": ["core:window:allow-start-dragging"]
   ```

2. Create `src/components/TitleBar.svelte`:
   - Drag region with `data-tauri-drag-region`
   - Minimize button → `getCurrentWindow().minimize()`
   - Close button → `getCurrentWindow().hide()` (hide to tray, fallback to close)
   - Style: height 30px, semi-transparent, flex row

3. Update `src/App.svelte`:
   - Add TitleBar at top
   - Layout: TitleBar → ClockDisplay (vertical stack)

## Todo List
- [ ] Add drag permission to capabilities
- [ ] Create TitleBar.svelte with drag + buttons
- [ ] Wire minimize/close to Tauri window API
- [ ] Integrate into App.svelte layout
- [ ] Test drag-to-move on Windows

## Success Criteria
- Window drags via titlebar area
- Minimize sends to taskbar
- Close hides window (or closes pre-tray)
- Buttons have hover feedback
