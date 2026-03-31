/**
 * Timezone utility functions using native Intl API
 * Zero dependencies - auto DST handling
 */

/**
 * Format time as HH:MM:SS
 * @param {Date} date 
 * @param {string} timeZone 
 * @returns {string}
 */
export function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone
  }).format(date);
}

/**
 * Format date as "Mon, Mar 30"
 * @param {Date} date 
 * @param {string} timeZone 
 * @returns {string}
 */
export function formatDate(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone
  }).format(date);
}

/**
 * Get timezone abbreviation (e.g., "CET", "ICT")
 * @param {Date} date 
 * @param {string} timeZone 
 * @returns {string}
 */
export function getAbbreviation(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    timeZone
  }).formatToParts(date);
  
  const tzPart = parts.find(part => part.type === 'timeZoneName');
  return tzPart ? tzPart.value : timeZone;
}

/**
 * Get list of all supported IANA timezones
 * @returns {string[]}
 */
export function getTimezoneList() {
  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }
  // Fallback for older environments
  return [
    'UTC',
    'Europe/Berlin',
    'Europe/London',
    'Europe/Paris',
    'Asia/Bangkok',
    'Asia/Ho_Chi_Minh',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];
}

/**
 * Get user's local timezone automatically
 * @returns {string}
 */
export function getLocalTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
