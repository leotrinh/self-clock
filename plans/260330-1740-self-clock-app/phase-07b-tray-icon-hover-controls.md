---
phase: 7B
priority: high
status: planned
effort: small
---

# Phase 7B — Tray Icon Fix + Hover Controls UX

## Context
Two UX issues reported:
1. System tray icon not appearing despite tray feature being enabled
2. Window controls (Settings, Minimize, Close) always visible — should auto-hide and only show on hover. Window dragging should work from content area, not just titlebar

## Key Insights
- `TrayIconBuilder` in `lib.rs` never calls `.icon()` → no icon rendered in system tray
- Tauri's `data-tauri-drag-region` attribute can be added to any element to enable window dragging
- CSS `opacity` + `pointer-events` transitions give smooth show/hide without layout shifts

---

## Issue 1: Tray Icon Not Showing

**Root cause:** `src-tauri/src/lib.rs:25` — `TrayIconBuilder::new()` chain missing `.icon()` call.

**Fix:** Add `.icon(app.default_window_icon().unwrap().clone())` to reuse the app icon from `tauri.conf.json` bundle config.

### File: `src-tauri/src/lib.rs`

```rust
// Before (line 25)
let _tray = TrayIconBuilder::new()
    .menu(&menu)
    .tooltip("Self Clock")

// After
let _tray = TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .tooltip("Self Clock")
```

---

## Issue 2: Auto-Hide Controls + Content-Area Drag

### Current Behavior
- TitleBar (32px) always shows title "Self Clock" + 3 buttons (Settings, Minimize, Close)
- Only titlebar has `data-tauri-drag-region`
- Content area (ClockDisplay) not draggable

### Desired Behavior
- Controls + title hidden by default (clean clock-only look)
- On mouse hover over window → controls fade in
- Click + drag on content area → moves window
- Footer link "Leo" remains clickable

### Implementation Steps

#### A. `src/routes/+page.svelte` — Track hover state at app level
1. Add `hovered` state variable
2. Bind `mouseenter` / `mouseleave` on `.app-container`
3. Pass `hovered` prop to `<TitleBar>`

```svelte
<script lang="ts">
  let hovered = $state(false);
</script>

<div class="app-container"
  onmouseenter={() => hovered = true}
  onmouseleave={() => hovered = false}>
  <TitleBar onSettingsClick={toggleSettings} {hovered} />
  <Settings isOpen={settingsOpen} onClose={closeSettings} />
  <ClockDisplay />
</div>
```

#### B. `src/lib/components/TitleBar.svelte` — Conditional visibility
1. Accept `hovered` prop
2. Toggle class `hovered` on `.titlebar`
3. CSS: controls + title `opacity: 0` by default, `opacity: 1` when `.hovered`
4. `pointer-events: none` when hidden to allow drag-through

```css
.titlebar {
  background: transparent;
  transition: background 0.2s ease;
}
.titlebar.hovered {
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(10px);
}

.title, .controls {
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.titlebar.hovered .title,
.titlebar.hovered .controls {
  opacity: 1;
  pointer-events: auto;
}
```

#### C. `src/lib/components/ClockDisplay.svelte` — Add drag region
1. Add `data-tauri-drag-region` to `.clock-display` div
2. Ensure `.footer` link does NOT inherit drag (already a child `<a>` tag — interactive elements auto-exclude from drag in Tauri)

```svelte
<div class="clock-display" data-tauri-drag-region>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src-tauri/src/lib.rs` | Add `.icon()` to TrayIconBuilder |
| `src/routes/+page.svelte` | Add hover state, pass to TitleBar |
| `src/lib/components/TitleBar.svelte` | Accept `hovered` prop, CSS auto-hide |
| `src/lib/components/ClockDisplay.svelte` | Add `data-tauri-drag-region` |

---

## Todo List

- [ ] Add `.icon()` call to `TrayIconBuilder` in `lib.rs`
- [ ] Add hover state tracking in `+page.svelte`
- [ ] Update TitleBar to accept `hovered` prop + CSS transitions
- [ ] Add `data-tauri-drag-region` to ClockDisplay
- [ ] Test tray icon appears in system tray
- [ ] Test controls hide/show on hover
- [ ] Test window drag from content area
- [ ] Test footer link still clickable

## Verification

1. `cd self-clock && npm run tauri dev`
2. System tray: icon visible, right-click menu works, left-click toggles window
3. Window idle: only clock visible, no buttons/title
4. Hover window: title + controls fade in smoothly
5. Click + drag clock area: window moves
6. Click Settings/Minimize/Close: buttons work
7. Footer "Leo" link: opens browser (not captured by drag)

## Risk Assessment
- **Low risk**: All changes are CSS + 1 Rust line, no architectural changes
- **Edge case**: `app.default_window_icon()` returns `None` if no icon configured → mitigated by `tauri.conf.json` already having icons defined
- **Edge case**: Interactive elements inside `data-tauri-drag-region` — Tauri auto-excludes `<button>`, `<a>`, `<input>` from drag handling
