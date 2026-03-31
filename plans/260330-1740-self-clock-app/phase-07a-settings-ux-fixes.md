# Phase 7A: Settings UX Fixes — Scroll, Startup, Colors

## Context Links
- [Plan Overview](plan.md)
- Screenshot: Settings panel clips off-screen when window height is small — no scroll

## Overview
- **Priority:** High
- **Status:** Planned
- **Description:** Fix settings scroll overflow, add Windows startup toggle, add text/background color pickers

## Issues & Solutions

### Issue 1: Settings Panel Not Scrollable

**Root cause:** `.settings-panel` in `Settings.svelte` uses `position: absolute` with no max-height or overflow-y. When window height is small, bottom settings (opacity sliders, always-on-top) are hidden and unreachable.

**Fix in** `src/lib/components/Settings.svelte`:

Change CSS:
```css
.settings-panel {
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  bottom: 0;                        /* ← ADD: stretch to bottom */
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 0 0 8px 8px;
  padding: 16px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;                  /* ← ADD: enable scroll */
  overflow-x: hidden;               /* ← ADD: prevent horizontal scroll */
}
```

Key changes:
- Add `bottom: 0` so panel fills available height (between titlebar and window bottom)
- Add `overflow-y: auto` so content scrolls when it overflows
- Add scrollbar styling for dark theme consistency

Optional scrollbar styling:
```css
.settings-panel::-webkit-scrollbar {
  width: 4px;
}
.settings-panel::-webkit-scrollbar-track {
  background: transparent;
}
.settings-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
```

### Issue 2: Windows Startup Toggle

**File:** `src/lib/components/Settings.svelte` + `src-tauri/src/lib.rs`

Tauri v2 provides autostart via `tauri-plugin-autostart`.

**Step 1: Add plugin to `src-tauri/Cargo.toml`:**
```toml
[dependencies]
tauri-plugin-autostart = "2"
```

Also add to `package.json`:
```bash
npm install @tauri-apps/plugin-autostart
```

**Step 2: Register plugin in `src-tauri/src/lib.rs`:**
```rust
use tauri_plugin_autostart::MacosLauncher;

// In builder chain, before .run():
.plugin(tauri_plugin_autostart::init(
    MacosLauncher::LaunchAgent,  // irrelevant on Windows, required param
    Some(vec![]),                 // no extra args
))
```

**Step 3: Add capability permissions in `src-tauri/capabilities/default.json`:**
```json
"permissions": [
  "autostart:allow-enable",
  "autostart:allow-disable",
  "autostart:allow-is-enabled"
]
```

**Step 4: Frontend toggle in `Settings.svelte`:**
```js
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

let startupEnabled = false;

onMount(async () => {
  // ... existing code ...
  try {
    startupEnabled = await isEnabled();
  } catch (e) {
    console.error('Autostart check failed', e);
  }
});

async function handleStartup(e) {
  const checked = e.target.checked;
  try {
    if (checked) {
      await enable();
    } else {
      await disable();
    }
    startupEnabled = checked;
  } catch (e) {
    console.error('Autostart toggle failed', e);
  }
}
```

Add checkbox below "Always on Top":
```svelte
<div class="setting checkbox">
  <label>
    <input
      type="checkbox"
      checked={startupEnabled}
      onchange={handleStartup}
    />
    <span>Start with Windows</span>
  </label>
</div>
```

### Issue 3: Text Color & Background Color Pickers

**File:** `src/lib/components/Settings.svelte`

Add two color inputs. Use native `<input type="color">` for simplicity (KISS).

**Add to DEFAULTS:**
```js
const DEFAULTS = {
  localTz: getLocalTimezone(),
  workTz: 'Europe/Berlin',
  bgOpacity: 85,
  textOpacity: 100,
  alwaysOnTop: true,
  bgColor: '#0f0f19',     // ← NEW: dark blue-black default
  textColor: '#ffffff',     // ← NEW: white default
};
```

**Add handlers:**
```js
function handleBgColor(e) {
  settings.bgColor = e.target.value;
  applySettings();
  save();
}

function handleTextColor(e) {
  settings.textColor = e.target.value;
  applySettings();
  save();
}
```

**Update `applySettings()`:**
```js
function applySettings() {
  document.documentElement.style.setProperty('--bg-opacity', settings.bgOpacity / 100);
  document.documentElement.style.setProperty('--text-opacity', settings.textOpacity / 100);
  document.documentElement.style.setProperty('--bg-color', settings.bgColor);
  document.documentElement.style.setProperty('--text-color', settings.textColor);

  if (appWindow) {
    appWindow.setAlwaysOnTop(settings.alwaysOnTop);
  }
}
```

**Add UI — color pickers as inline row with label:**
```svelte
<div class="setting">
  <label class="label">Colors</label>
  <div class="color-row">
    <div class="color-item">
      <span class="color-label">Background</span>
      <input
        type="color"
        value={settings.bgColor}
        oninput={handleBgColor}
        class="color-picker"
      />
    </div>
    <div class="color-item">
      <span class="color-label">Text</span>
      <input
        type="color"
        value={settings.textColor}
        oninput={handleTextColor}
        class="color-picker"
      />
    </div>
  </div>
</div>
```

**Styles:**
```css
.color-row {
  display: flex;
  gap: 16px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.color-picker {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}
```

**Update CSS in `+page.svelte`** to use CSS vars:
```css
.app-container {
  background: rgba(var(--bg-color-rgb, 15, 15, 25), var(--bg-opacity, 0.85));
}
```

Note: `<input type="color">` returns hex (#rrggbb). To use with `rgba()`, need hex→rgb conversion helper:
```js
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// In applySettings():
document.documentElement.style.setProperty('--bg-color-rgb', hexToRgb(settings.bgColor));
document.documentElement.style.setProperty('--text-color', settings.textColor);
```

**Update `+page.svelte` CSS:**
```css
.app-container {
  background: rgba(var(--bg-color-rgb, 15, 15, 25), var(--bg-opacity, 0.85));
}
```

**Update `ClockDisplay.svelte`** — `.time` and `.label` elements use `var(--text-color)`:
```css
.time {
  color: var(--text-color, white);
}
.label {
  color: color-mix(in srgb, var(--text-color, white) 50%, transparent);
}
.tz-badge {
  color: color-mix(in srgb, var(--text-color, white) 80%, transparent);
  background: color-mix(in srgb, var(--text-color, white) 15%, transparent);
}
.date {
  color: color-mix(in srgb, var(--text-color, white) 60%, transparent);
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/components/Settings.svelte` | Scroll fix, startup toggle, color pickers |
| `src/routes/+page.svelte` | CSS vars for bg-color-rgb |
| `src/lib/components/ClockDisplay.svelte` | CSS vars for text-color |
| `src-tauri/Cargo.toml` | Add `tauri-plugin-autostart` |
| `src-tauri/src/lib.rs` | Register autostart plugin |
| `src-tauri/capabilities/default.json` | Autostart permissions |
| `package.json` | Add `@tauri-apps/plugin-autostart` |

## Settings Order (final)
1. ← Back
2. Local Timezone
3. Working Timezone
4. Colors (Background + Text — inline row)
5. Background Opacity slider
6. Text Opacity slider
7. ☑ Always on Top
8. ☑ Start with Windows

## Todo List
- [ ] Fix `.settings-panel` CSS: add `bottom: 0`, `overflow-y: auto`, scrollbar styling
- [ ] Add `tauri-plugin-autostart` to Cargo.toml + package.json
- [ ] Register autostart plugin in lib.rs
- [ ] Add autostart permissions to capabilities
- [ ] Add "Start with Windows" checkbox in Settings
- [ ] Add color DEFAULTS (`bgColor: '#0f0f19'`, `textColor: '#ffffff'`)
- [ ] Add `hexToRgb()` utility in Settings
- [ ] Add color picker inputs (bg + text) with inline layout
- [ ] Update `applySettings()` to set `--bg-color-rgb` and `--text-color` CSS vars
- [ ] Update `+page.svelte` CSS to use `rgba(var(--bg-color-rgb), var(--bg-opacity))`
- [ ] Update `ClockDisplay.svelte` CSS to use `var(--text-color)` with `color-mix` for muted variants
- [ ] Test: scroll works when window height is small (~150px)
- [ ] Test: startup toggle enables/disables Windows autostart
- [ ] Test: color changes apply live with opacity preserved
- [ ] Test: settings persist after app restart

## Success Criteria
1. Settings panel scrolls when content exceeds window height
2. "Start with Windows" toggle adds/removes app from Windows startup
3. Background color picker changes widget bg (works with opacity slider)
4. Text color picker changes all text elements (time, labels, badges, date)
5. All new settings persist in localStorage (colors) and system (autostart)
