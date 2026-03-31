# Phase 6: Polish & Build

## Context Links
- [Plan Overview](plan.md)

## Overview
- **Priority:** Low
- **Status:** Planned
- **Description:** Dark theme styling, transitions, release build optimization

## Requirements
- Clean dark theme matching modern widget aesthetic
- Smooth opacity transitions
- Optimized release binary (<10MB)
- No visual glitches on Windows

## Files to Modify
- `src/app.css` — Global dark theme
- `src-tauri/Cargo.toml` — Release profile optimization
- All `.svelte` components — Polish styles

## Implementation Steps

1. Dark theme styling:
   - Background: `rgba(15, 15, 25, 0.85)` with `backdrop-filter: blur(10px)`
   - Text: white with subtle opacity layers
   - Monospace font for time: `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`
   - Accent color for timezone badges
   - Rounded corners: `border-radius: 12px`

2. Transitions:
   ```css
   .clock-widget {
     transition: background 0.3s ease, color 0.2s ease;
   }
   ```

3. Release optimization in `src-tauri/Cargo.toml`:
   ```toml
   [profile.release]
   opt-level = "z"
   lto = true
   codegen-units = 1
   strip = true
   ```

4. Build & test:
   ```bash
   npm run tauri build
   ```
   Verify installer size <10MB

5. Final Windows testing:
   - Transparency renders correctly
   - Always-on-top persists across focus changes
   - Tray icon visible and functional
   - Drag-to-move smooth
   - Opacity sliders responsive

## Todo List
- [ ] Apply dark theme globally
- [ ] Add monospace font for clock display
- [ ] Add CSS transitions for smooth opacity changes
- [ ] Configure release profile optimizations
- [ ] Build production binary
- [ ] Final Windows testing pass

## Success Criteria
- Visual: Clean, modern dark widget aesthetic
- Performance: Instant opacity changes, no flicker
- Binary: <10MB installer with MSI
- Stability: No crashes on extended use
