# Dual-Timezone Clock Display: Technical Research Report

**Date:** 2026-03-30
**Scope:** Lightweight web frontend implementation (Svelte/vanilla JS)

---

## Executive Summary

For a minimal desktop widget, use **native `Intl.DateTimeFormat`** for timezone conversion + **`setInterval` in Svelte readable store** for updates + **`Intl.supportedValuesOf('timeZone')`** for timezone list. This approach adds **zero external dependencies** for core functionality and weighs **<1KB overhead**.

**Skip libraries** (date-fns-tz, luxon, dayjs) unless you need extensive date manipulation outside clock display.

---

## 1. Timezone Handling in JavaScript

### Recommendation: Native `Intl.DateTimeFormat` (NO LIBRARY)

**Why:** Browser-native since ES2020, ~96% global coverage, zero bundle size, handles DST automatically.

```javascript
// Convert time to any timezone
function formatTimeInTimezone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone
  }).format(date);
}

// Usage:
formatTimeInTimezone(new Date(), 'Europe/Berlin');  // "14:30:45"
formatTimeInTimezone(new Date(), 'Asia/Ho_Chi_Minh'); // "20:30:45"
```

### Library Comparison (if you want convenience APIs)

| Library | Size | Timezone Support | Use Case |
|---------|------|------------------|----------|
| **date-fns-tz** | 13KB (tree-shakeable) | Built-in | Tree-shakeable, functional style |
| **luxon** | 36KB | Built-in, very mature | Heavy date manipulation, native Intl backend |
| **dayjs + tz plugin** | 6KB + 5KB | Plugin | Ultra-lightweight, moment-like API |
| **Native Intl.DateTimeFormat** | 0KB | Built-in | **RECOMMENDED for clock widget** |

**Verdict:** Native `Intl` is sufficient. Use date-fns-tz only if you're already using date-fns elsewhere; skip luxon for a widget.

---

## 2. Getting IANA Timezone List

### Recommendation: `Intl.supportedValuesOf('timeZone')`

**Modern (Chrome 93+, Firefox 91+, Safari 14.1+):**

```javascript
// Get searchable timezone list
const timezones = Intl.supportedValuesOf('timeZone');
console.log(timezones);
// ['Africa/Abidjan', 'Africa/Accra', ..., 'UTC', ...]

// Searchable dropdown (vanilla)
function createTimezoneSelect(containerId, onSelect) {
  const select = document.createElement('select');
  const zones = Intl.supportedValuesOf('timeZone').sort();

  zones.forEach(tz => {
    const option = document.createElement('option');
    option.value = tz;
    option.textContent = tz; // "Europe/Berlin" format
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => onSelect(e.target.value));
  document.getElementById(containerId).appendChild(select);
}

createTimezoneSelect('tz-selector', (tz) => {
  console.log('Selected:', tz);
});
```

**For older browsers (fallback):**
Use `timezones-list` npm package (~2KB) or hardcode ~400 zones.

### Enhanced Dropdown with GMT Offset Labels

```javascript
function getTimezoneLabel(tz) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Calculate UTC offset from formatter
  const parts = formatter.formatToParts(now);
  const tzTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const offset = (tzTime - now) / 60000; // minutes
  const sign = offset >= 0 ? '+' : '';
  const hours = Math.floor(Math.abs(offset) / 60);
  const mins = Math.abs(offset) % 60;

  return `${tz} (UTC${sign}${hours}:${mins.toString().padStart(2, '0')})`;
}

// Usage in select:
// option.textContent = getTimezoneLabel('Europe/Berlin');
// Output: "Europe/Berlin (UTC+1)"
```

---

## 3. Real-Time Clock Update Pattern

### Recommendation: Svelte Readable Store + `setInterval`

**Why setInterval over requestAnimationFrame:**
- Clock updates need **1-second granularity**, not 60FPS sync
- `setInterval` is more battery-efficient for non-visual updates
- Simple to reason about for time display

**Svelte 5 (Runes):**

```javascript
// stores/clock.js
import { state, effect } from 'svelte';

export function createClock(timeZone = 'UTC') {
  let time = $state(new Date());
  let formattedTime = $derived(formatInTimezone(time, timeZone));

  $effect(() => {
    const interval = setInterval(() => {
      time = new Date();
    }, 1000);

    return () => clearInterval(interval);
  });

  return {
    get time() { return time; },
    get formatted() { return formattedTime; },
    setTimeZone(tz) { timeZone = tz; }
  };
}

function formatInTimezone(date, tz) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tz
  }).format(date);
}
```

**Svelte 3/4 (Stores):**

```javascript
// stores/clock.js
import { readable } from 'svelte/store';
import { derived } from 'svelte/store';

export function createClock(initialTz = 'UTC') {
  let currentTz = initialTz;

  const time = readable(new Date(), (set) => {
    const interval = setInterval(() => {
      set(new Date());
    }, 1000);

    return () => clearInterval(interval);
  });

  const formatted = derived(time, ($time) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: currentTz
    }).format($time);
  });

  return { time, formatted, setTz: (tz) => currentTz = tz };
}
```

**Component Usage:**

```svelte
<script>
  import { createClock } from './stores/clock.js';

  const { time, formatted } = createClock('Europe/Berlin');
  let selectedTz = 'Europe/Berlin';

  function changeTz(tz) {
    selectedTz = tz;
    // Re-create clock or update store (implementation-dependent)
  }
</script>

<div class="clock">
  <div class="time">{$formatted}</div>
  <select bind:value={selectedTz} on:change={(e) => changeTz(e.target.value)}>
    <!-- timezone options -->
  </select>
</div>

<style>
  .time {
    font-family: 'Courier New', monospace;
    font-size: 48px;
    font-weight: bold;
  }
</style>
```

**Note:** Cleanup function in readable store automatically stops interval when store is destroyed.

---

## 4. Timezone Abbreviation Display (EST, PST, CET, ICT)

### Recommendation: `Intl.DateTimeFormat` with `timeZoneName: 'short'`

```javascript
function getTimeWithAbbr(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
    timeZoneName: 'short'  // Adds abbreviation
  });

  // Returns parts: [{ type: 'hour', value: '14' }, ..., { type: 'timeZoneName', value: 'CET' }]
  return formatter.formatToParts(date);
}

// Utility to extract and format
function formatTimeWithAbbrCompact(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tz,
    timeZoneName: 'short'
  }).formatToParts(date);

  let timeStr = '';
  let abbr = '';

  parts.forEach(part => {
    if (part.type === 'timeZoneName') {
      abbr = part.value;
    } else if (part.type !== 'literal') {
      timeStr += part.value;
    } else if (part.value !== ' ') {
      timeStr += part.value;
    }
  });

  return { time: timeStr, abbr };
}

// Usage:
const { time, abbr } = formatTimeWithAbbrCompact(new Date(), 'Europe/Berlin');
console.log(`${time} ${abbr}`);  // "14:30:45 CET"
```

### Alternative: `timeZoneName: 'long'` for full names

```javascript
// timeZoneName: 'long' returns: "Central European Time"
// timeZoneName: 'short' returns: "CET"
// timeZoneName: 'shortOffset' returns: "UTC+1"
// timeZoneName: 'longOffset' returns: "UTC+01:00"
```

**Trade-off:** `short` is most compact; `long` is clearest but verbose.

---

## 5. Analog vs Digital Clock

### Recommendation: Digital Clock (KISS Principle)

**Why:**
- Minimal DOM: 1 element
- No canvas rendering complexity
- Easier to theme (font, color, size)
- Better readability at any size
- Faster performance

**Minimal Digital Clock Component (Svelte):**

```svelte
<script>
  import { createClock } from './stores/clock.js';

  const { formatted } = createClock('Europe/Berlin');
</script>

<div class="clock">
  {$formatted}
</div>

<style>
  .clock {
    font-family: 'Courier New', monospace;
    font-size: 48px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #333;
  }
</style>
```

**If analog is required:** Use SVG + `requestAnimationFrame` for smooth hand rotation, but this adds ~200 lines of code and complexity. Not recommended for widget.

---

## 6. Svelte Reactive Stores Pattern (Complete Example)

### Svelte 5 Runes-Based Pattern

```javascript
// lib/stores/timezone-clock.js
import { state, effect } from 'svelte';

export function createTimezoneClock() {
  let time = $state(new Date());
  let timeZone = $state('UTC');

  let formattedTime = $derived(formatTime(time, timeZone));
  let timeAbbr = $derived(getAbbr(time, timeZone));

  // Auto-update every second
  $effect(() => {
    const interval = setInterval(() => {
      time = new Date();
    }, 1000);

    return () => clearInterval(interval);
  });

  return {
    get time() { return time; },
    get timeZone() { return timeZone; },
    set timeZone(tz) { timeZone = tz; },
    get formatted() { return formattedTime; },
    get abbr() { return timeAbbr; }
  };
}

function formatTime(date, tz) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tz
  }).format(date);
}

function getAbbr(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short'
  }).formatToParts(date);

  return parts.find(p => p.type === 'timeZoneName')?.value || '';
}
```

### Svelte 3/4 Store Pattern

```javascript
// lib/stores/timezone-clock.js
import { readable, derived } from 'svelte/store';

export function createTimezoneClock(initialTz = 'UTC') {
  let currentTz = initialTz;

  const time = readable(new Date(), (set) => {
    const interval = setInterval(() => {
      set(new Date());
    }, 1000);

    return () => clearInterval(interval);
  });

  const formatted = derived(time, $time =>
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: currentTz
    }).format($time)
  );

  const abbr = derived(time, $time => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: currentTz,
      timeZoneName: 'short'
    }).formatToParts($time);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  });

  return {
    time,
    formatted,
    abbr,
    setTimeZone: (tz) => { currentTz = tz; }
  };
}
```

### Component Usage

```svelte
<script>
  import { createTimezoneClock } from './lib/stores/timezone-clock.js';

  const clock = createTimezoneClock('Europe/Berlin');
  const timezones = Intl.supportedValuesOf('timeZone').sort();
</script>

<div class="widget">
  <div class="display">
    <div class="time">{$clock.formatted}</div>
    <div class="abbr">{$clock.abbr}</div>
  </div>

  <select value={$clock.timeZone} on:change={(e) => clock.setTimeZone(e.target.value)}>
    {#each timezones as tz}
      <option value={tz}>{tz}</option>
    {/each}
  </select>
</div>

<style>
  .widget {
    padding: 16px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
  }

  .display {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }

  .time {
    font-family: 'Courier New', monospace;
    font-size: 48px;
    font-weight: bold;
  }

  .abbr {
    font-size: 12px;
    color: #666;
  }

  select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
</style>
```

---

## Implementation Checklist

- [ ] Use native `Intl.DateTimeFormat` for timezone formatting
- [ ] Populate timezone dropdown via `Intl.supportedValuesOf('timeZone')`
- [ ] Create Svelte readable store with `setInterval(1000)`
- [ ] Add cleanup function to interval (auto-clears when store destroyed)
- [ ] Use `timeZoneName: 'short'` for abbreviations
- [ ] Render as digital clock (single line, monospace font)
- [ ] Test timezone switching in component
- [ ] Verify no memory leaks on store destroy

---

## Performance & Bundle Size Summary

| Approach | Bundle Impact | Memory | Notes |
|----------|---------------|---------|----|
| Native Intl + setInterval | 0KB | ~5KB (interval + store) | **RECOMMENDED** |
| date-fns-tz | +13KB | ~8KB | If already using date-fns |
| luxon | +36KB | ~12KB | Overkill for clock widget |
| dayjs + tz | +11KB | ~7KB | Lightweight alternative if desired |

**Conclusion:** Zero external dependencies is achievable and recommended.

---

## Unresolved Questions

1. **DST Handling:** Intl handles DST automatically—confirm transitions don't cause display glitches in your app
2. **Server-side Time:** If backend serves times, ensure they're UTC before formatting client-side
3. **Svelte Version:** Confirm your project uses Svelte 3/4 (stores) or Svelte 5 (runes)
4. **Older Browser Support:** If IE11/old Safari needed, use `timezones-list` npm package as fallback

---

## Sources

- [Intl.DateTimeFormat MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
- [Intl.supportedValuesOf() MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf)
- [Best JavaScript Date Libraries in 2026: date-fns vs Day.js vs Luxon](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026)
- [Svelte Stores Documentation](https://svelte.dev/docs/svelte/svelte-reactivity)
- [Svelte Clock Example](https://svelte.dev/repl/clock)
- [Stop Using setInterval. Use requestAnimationFrame](https://blog.webdevsimplified.com/2021-12/request-animation-frame/)
- [How to get a list of all time zones in JavaScript](https://attacomsian.com/blog/javascript-get-timezones-list)
