import { writable, derived } from 'svelte/store';
import { formatTime, formatDate, getAbbreviation, getLocalTimezone } from '../utils/timezone-utils.js';

/**
 * Clock store using Svelte 5 runes reactivity
 * Updates every second with setInterval
 */

// Default to Europe/Berlin as working timezone
const DEFAULT_WORK_TZ = 'Europe/Berlin';

// Get local timezone automatically and check localStorage for saved value
function getInitialLocalTimezone() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('self-clock-local-tz');
    if (saved) return saved;
  }
  return getLocalTimezone();
}

// Local timezone - writable for user configuration with localStorage persistence
export const localTimezone = writable(getInitialLocalTimezone());

// Subscribe to changes and persist to localStorage
if (typeof localStorage !== 'undefined') {
  localTimezone.subscribe(value => {
    localStorage.setItem('self-clock-local-tz', value);
  });
}

// Working timezone - can be changed by settings
export const workTimezone = writable(DEFAULT_WORK_TZ);

// Current time store - updates every second
export const currentTime = writable(new Date());

// Interval reference for cleanup
let intervalId = null;

/**
 * Start the clock - call this when component mounts
 */
export function startClock() {
  if (intervalId) return; // Already running
  
  // Update immediately
  currentTime.set(new Date());
  
  // Update every second
  intervalId = setInterval(() => {
    currentTime.set(new Date());
  }, 1000);
}

/**
 * Stop the clock - call this when component unmounts
 */
export function stopClock() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Derived store for local time display values
 * Now uses the writable localTimezone store
 */
export const localTime = derived(
  [currentTime, localTimezone],
  ([$time, $localTz]) => ({
    time: formatTime($time, $localTz),
    date: formatDate($time, $localTz),
    abbreviation: getAbbreviation($time, $localTz),
    timezone: $localTz
  })
);

/**
 * Derived store for work time display values
 */
export const workTime = derived(
  [currentTime, workTimezone],
  ([$time, $workTimezone]) => ({
    time: formatTime($time, $workTimezone),
    date: formatDate($time, $workTimezone),
    abbreviation: getAbbreviation($time, $workTimezone),
    timezone: $workTimezone
  })
);
