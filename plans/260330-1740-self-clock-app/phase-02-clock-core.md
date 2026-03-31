# Phase 2: Clock Core

## Context Links
- [Plan Overview](plan.md)
- [Timezone Research](reports/researcher-260330-1740-dual-timezone-clock.md)

## Overview
- **Priority:** High
- **Status:** Planned
- **Description:** Build reactive clock store and dual timezone display

## Key Insights
- Native `Intl.DateTimeFormat` = zero deps, auto DST handling
- `Intl.supportedValuesOf('timeZone')` provides ~400+ IANA timezones
- `setInterval(1000)` sufficient for 1-sec clock updates (no RAF needed)
- `timeZoneName: 'short'` gives abbreviations (CET, ICT, PST)

## Requirements
- Clock updates every second
- Display two timezones: local (auto-detect) + working (configurable)
- Show time (`HH:MM:SS`), timezone abbreviation, and date
- Zero external date/time dependencies

## Files to Create
- `src/lib/stores/clock-store.js` — Reactive time store
- `src/lib/utils/timezone-utils.js` — Intl formatter helpers
- `src/components/ClockDisplay.svelte` — Dual clock UI

## Implementation Steps

1. Create `src/lib/utils/timezone-utils.js`:
   ```js
   // formatTime(date, tz) → "14:30:45"
   // formatDate(date, tz) → "Mon, Mar 30"
   // getAbbreviation(date, tz) → "CET"
   // getTimezoneList() → string[]
   ```
   All using native `Intl.DateTimeFormat`

2. Create `src/lib/stores/clock-store.js`:
   - Svelte writable store for current `Date`
   - `setInterval(1000)` updates every second
   - Cleanup on destroy
   - Export `localTimezone` (auto-detect) and `workTimezone` (writable)

3. Create `src/components/ClockDisplay.svelte`:
   - Layout: two rows (local time on top, work timezone below)
   - Each row: `HH:MM:SS` (large monospace) + `CET` (small badge) + date (small)
   - Label each row: "Local" / "Work"

## Todo List
- [ ] Create timezone-utils.js with Intl helpers
- [ ] Create clock-store.js with reactive time
- [ ] Create ClockDisplay.svelte with dual layout
- [ ] Verify both clocks tick every second
- [ ] Test timezone abbreviation display

## Success Criteria
- Both clocks update simultaneously every second
- Correct time for both timezones
- Abbreviations display correctly (CET, ICT, etc.)
- No memory leaks (interval cleanup works)

## Key Code Pattern
```js
// Zero-dep timezone formatting
const formatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false, timeZone: 'Europe/Berlin'
});
```
