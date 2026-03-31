# Phase 4: Settings & Controls

## Context Links
- [Plan Overview](plan.md)
- [Timezone Research](reports/researcher-260330-1740-dual-timezone-clock.md)

## Overview
- **Priority:** Medium
- **Status:** Planned
- **Description:** Settings panel with timezone picker, opacity sliders, always-on-top toggle

## Key Insights
- `Intl.supportedValuesOf('timeZone')` provides full timezone list natively
- `getCurrentWindow().setAlwaysOnTop(bool)` for runtime toggle
- CSS custom properties (`--bg-opacity`, `--text-opacity`) for live opacity control
- localStorage for persistence across sessions

## Requirements
- Gear icon toggles settings panel overlay
- Searchable timezone dropdown for working timezone
- Background opacity slider (0-100%)
- Text opacity slider (50-100%)
- Always-on-top checkbox
- All settings persist to localStorage

## Files to Create
- `src/components/Settings.svelte` — Settings panel
- `src/components/TimezoneSelect.svelte` — Searchable dropdown

## Files to Modify
- `src/App.svelte` — Add settings toggle
- `src/lib/stores/clock-store.js` — Read/write settings from localStorage

## Implementation Steps

1. Create `src/components/TimezoneSelect.svelte`:
   - Text input for filtering
   - Dropdown list from `Intl.supportedValuesOf('timeZone')`
   - Show timezone + abbreviation in list items
   - Emit selected timezone

2. Create `src/components/Settings.svelte`:
   - Gear icon button in titlebar area
   - Slide-down or overlay panel
   - TimezoneSelect for working timezone
   - Range input: background opacity (0-100%, default 85%)
   - Range input: text opacity (50-100%, default 100%)
   - Checkbox: always-on-top (default ON)
   - On change → save to localStorage + apply

3. Opacity implementation:
   ```css
   .clock-widget {
     background: rgba(15, 15, 25, var(--bg-opacity, 0.85));
     color: rgba(255, 255, 255, var(--text-opacity, 1));
   }
   ```
   Update CSS vars via JS: `document.documentElement.style.setProperty('--bg-opacity', value)`

4. Always-on-top toggle:
   ```js
   import { getCurrentWindow } from '@tauri-apps/api/window';
   await getCurrentWindow().setAlwaysOnTop(checked);
   ```

5. Settings persistence:
   ```js
   const DEFAULTS = { workTz: 'Europe/Berlin', bgOpacity: 0.85, textOpacity: 1, alwaysOnTop: true };
   // Load on mount, save on change
   ```

## Todo List
- [ ] Create TimezoneSelect with search/filter
- [ ] Create Settings panel with all controls
- [ ] Implement opacity via CSS custom properties
- [ ] Wire always-on-top to Tauri API
- [ ] Add localStorage persistence
- [ ] Integrate settings toggle in App.svelte

## Success Criteria
- Timezone change updates clock immediately
- Opacity sliders have live preview
- Always-on-top toggles correctly
- Settings survive app restart (localStorage)
