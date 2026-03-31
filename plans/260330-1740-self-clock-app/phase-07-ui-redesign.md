# Phase 7: UI Redesign & Polish

## Context Links
- [Plan Overview](plan.md)
- Screenshots: Current UI has rough layout, missing timezone names, no back button in settings, no footer

## Overview
- **Priority:** High
- **Status:** Planned
- **Description:** Polish UI/UX — show timezone names, improve settings navigation, add footer branding

## Current Issues
1. Clock only shows abbreviation badge (GMT+7), no IANA timezone name visible
2. Settings only has Working timezone — no Local timezone selector
3. Settings has no back/close button — user must find gear icon again (poor UX)
4. No footer/branding

## Changes

### Change 1: Clock Display — Show Timezone Names (2-line layout)

**File:** `src/lib/components/ClockDisplay.svelte`

Current layout (single row, too wide):
```
LOCAL   18:46:05  [GMT+7]  Mon, Mar 30
WORK    13:46:05  [GMT+2]  Mon, Mar 30
```

Target layout (2 lines per clock, saves width):
```
LOCAL (Asia/Bangkok)
18:46:05   GMT+7   Mon, Mar 30

WORKING (Europe/Berlin)
13:46:05   GMT+2   Mon, Mar 30
```

Implementation:
- Each `.clock-row` becomes a flex-column with 2 lines
- Line 1: label (`LOCAL`/`WORKING`) + timezone name in muted parentheses
- Line 2: time (large monospace) + tz-badge + date
- Use `$localTime.timezone` and `$workTime.timezone` from store (already available)
- Align left for cleaner look

```svelte
<div class="clock-row">
  <div class="clock-label">
    <span class="label">LOCAL</span>
    <span class="tz-name">({$localTime.timezone})</span>
  </div>
  <div class="clock-values">
    <span class="time">{$localTime.time}</span>
    <span class="tz-badge">{$localTime.abbreviation}</span>
    <span class="date">{$localTime.date}</span>
  </div>
</div>
```

Styles:
```css
.clock-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 0 16px;
}
.clock-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.label {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tz-name {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.35);
}
.clock-values {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
```

### Change 2: Settings — Add Local Timezone + Back Button

**File:** `src/lib/stores/clock-store.js`

Make `localTimezone` writable:
```js
// Before (const):
export const localTimezone = getLocalTimezone();

// After (writable store):
const savedLocal = typeof localStorage !== 'undefined'
  ? localStorage.getItem('self-clock-local-tz')
  : null;
export const localTimezone = writable(savedLocal || getLocalTimezone());

// Update derived store to use writable:
export const localTime = derived(
  [currentTime, localTimezone],
  ([$time, $localTz]) => ({
    time: formatTime($time, $localTz),
    date: formatDate($time, $localTz),
    abbreviation: getAbbreviation($time, $localTz),
    timezone: $localTz
  })
);
```

**File:** `src/lib/components/Settings.svelte`

Add back button at top:
```svelte
<div class="settings-header">
  <button class="back-btn" onclick={handleBack}>
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>
    <span>Back</span>
  </button>
</div>
```

Add Local Timezone section before Working Timezone:
```svelte
<div class="setting">
  <label class="label">Local Timezone</label>
  <TimezoneSelect value={settings.localTz} onchange={handleLocalTimezoneChange} />
</div>

<div class="setting">
  <label class="label">Working Timezone</label>
  <TimezoneSelect value={settings.workTz} onchange={handleTimezoneChange} />
</div>
```

Add handler:
```js
function handleLocalTimezoneChange(tz) {
  settings.localTz = tz;
  localTimezone.set(tz);
  localStorage.setItem('self-clock-local-tz', tz);
  save();
}

function handleBack() {
  // Emit close event to parent
  onClose?.();
}
```

Add `onClose` prop:
```js
export let onClose = () => {};
```

Update DEFAULTS:
```js
const DEFAULTS = {
  localTz: getLocalTimezone(),
  workTz: 'Europe/Berlin',
  bgOpacity: 85,
  textOpacity: 100,
  alwaysOnTop: true
};
```

Styles for back button:
```css
.settings-header {
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
```

**File:** `src/routes/+page.svelte`

Wire close callback:
```svelte
<Settings isOpen={settingsOpen} onClose={() => settingsOpen = false} />
```

### Change 3: Footer — "made by Leo with Love"

**File:** `src/lib/components/ClockDisplay.svelte`

Add footer at bottom of clock display:
```svelte
<div class="footer">
  made by <a href="https://github.com/leotrinh" class="footer-link"
    onclick|preventDefault={openGitHub}>Leo</a> with ❤️
</div>
```

Open link via Tauri shell:
```js
import { open } from '@tauri-apps/plugin-shell';

async function openGitHub() {
  try {
    await open('https://github.com/leotrinh');
  } catch {
    window.open('https://github.com/leotrinh', '_blank');
  }
}
```

Note: May need `@tauri-apps/plugin-shell` installed. If not available, fallback to window.open.

Footer styles:
```css
.footer {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  padding: 4px 0 8px;
}
.footer-link {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  transition: color 0.15s;
}
.footer-link:hover {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: underline;
}
```

## Target Visual

### Clock View
```
┌──────────────────────────────────────┐
│ Self Clock                ⚙  —  ✕   │
├──────────────────────────────────────┤
│                                      │
│ LOCAL (Asia/Bangkok)                 │
│ 18:46:05   GMT+7   Mon, Mar 30      │
│                                      │
│ WORKING (Europe/Berlin)              │
│ 13:46:05   GMT+2   Mon, Mar 30      │
│                                      │
│      made by Leo with ❤️             │
└──────────────────────────────────────┘
```

### Settings View
```
┌──────────────────────────────────────┐
│ Self Clock                ⚙  —  ✕   │
├──────────────────────────────────────┤
│ ← Back                               │
│──────────────────────────────────────│
│ LOCAL TIMEZONE                       │
│ ┌ Asia/Bangkok        (GMT+7)  ▾ ┐  │
│                                      │
│ WORKING TIMEZONE                     │
│ ┌ Europe/Berlin       (GMT+2)  ▾ ┐  │
│                                      │
│ BACKGROUND OPACITY: 85%      ──●    │
│ TEXT OPACITY: 100%            ──●    │
│ ☑ Always on Top                      │
└──────────────────────────────────────┘
```

## Todo List
- [ ] Update `clock-store.js`: make `localTimezone` writable + persist localStorage
- [ ] Update `ClockDisplay.svelte`: 2-line layout with timezone names
- [ ] Update `ClockDisplay.svelte`: add footer "made by Leo with ❤️"
- [ ] Update `Settings.svelte`: add back button at top
- [ ] Update `Settings.svelte`: add Local Timezone selector
- [ ] Update `+page.svelte`: wire onClose callback
- [ ] Check if `@tauri-apps/plugin-shell` needed for footer link
- [ ] Test: both timezone names display correctly
- [ ] Test: local timezone changeable from settings
- [ ] Test: back button closes settings
- [ ] Test: footer link opens browser
- [ ] Test: no layout overflow at 350px width

## Success Criteria
- Timezone IANA names visible on clock (e.g., "Asia/Bangkok")
- Both Local + Working timezone configurable in settings
- Back button provides clear settings exit
- Footer shows "made by Leo with ❤️" with clickable GitHub link
- Compact layout within 350px width — no overflow
