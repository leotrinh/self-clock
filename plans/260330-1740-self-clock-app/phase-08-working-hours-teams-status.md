# Phase 8: Working Hours & MS Teams Status Update

## Context Links
- [Plan Overview](plan.md)
- [MS Teams API Research](reports/researcher-260330-2116-teams-status-api.md)

## Overview
- **Priority:** Medium
- **Status:** Planned
- **Description:** Configurable working hours with validation (8h total), display status bar, sync to MS Teams status message via Graph API

## Key Research Findings
- **MS Graph API endpoint:** `POST /me/presence/setStatusMessage` — sets custom text only (not presence state)
- **Scope:** `Presence.ReadWrite` (delegated)
- **PasswordVault approach: NOT FEASIBLE** — Teams doesn't store tokens in Windows Credential Manager
- **Recommended auth:** OAuth2 with Azure AD app registration → refresh token for silent renewal
- **Alternative (MVP):** PowerShell wrapper calling `Set-MgUserPresenceStatusMessage`
- **Rate limits:** ~10k req/min, not a concern for periodic updates

## Features

### 8A. Working Hours Configuration (Frontend)
User inputs flexible work schedule slots. Example:
```
Slot 1: 08:00 - 13:30
Slot 2: 15:30 - 18:00
Total: 8h ✓
```

**Validation rules:**
- Total hours across all slots must equal 8h (configurable, default 8)
- No overlapping time slots
- End time must be after start time within each slot
- Support 1-3 time slots (flexible lunch breaks, split shifts)
- Times in HH:MM format (24h)

**Display format:**
```
Working time: 08:00 - 13:30 + 15:30 - 18:00
```

### 8B. Status Display (Clock View)
Show working hours status below clock display:
```
┌──────────────────────────────────────┐
│ LOCAL (Asia/Bangkok)                 │
│ 18:46:05   GMT+7   Mon, Mar 30      │
│                                      │
│ WORKING (Europe/Berlin)              │
│ 13:46:05   GMT+2   Mon, Mar 30      │
│                                      │
│ 🟢 Working: 08:00-13:30 + 15:30-18:00│
│      made by Leo with ❤️             │
└──────────────────────────────────────┘
```

Status indicator logic (based on WORKING timezone):
- 🟢 "Working" — currently within a work slot
- 🟡 "Break" — between work slots (lunch)
- ⚪ "Off" — outside all work slots

### 8C. MS Teams Status Update (Rust Backend)

**Approach: OAuth2 + reqwest (production-ready)**

Flow:
1. User registers Azure AD app once (guided setup in Settings)
2. User clicks "Connect to Teams" → opens browser for OAuth consent
3. App receives auth code → exchanges for access+refresh tokens
4. Tokens stored encrypted locally (PasswordVault for OUR tokens, not Teams')
5. On working hours change → auto-update Teams status message
6. Refresh token used for silent renewal (~90 day validity)

## Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/components/WorkingHours.svelte` | Working hours input UI in Settings |
| `src/lib/components/WorkStatus.svelte` | Status display on clock view |
| `src/lib/stores/working-hours-store.js` | Store for work schedule + validation |
| `src/lib/utils/working-hours-utils.js` | Time parsing, validation, overlap check |
| `src-tauri/src/teams.rs` | MS Teams Graph API integration (Rust) |
| `src-tauri/src/oauth.rs` | OAuth2 flow handling (Rust) |

### Files to Modify

| File | Changes |
|------|---------|
| `src-tauri/src/lib.rs` | Register new Tauri commands, add modules |
| `src-tauri/Cargo.toml` | Add `reqwest`, `tokio`, `keyring` deps |
| `src/lib/components/Settings.svelte` | Add WorkingHours section + Teams connect |
| `src/lib/components/ClockDisplay.svelte` | Add WorkStatus component |

## Implementation Steps

### Step 1: Working Hours Utils (`working-hours-utils.js`)

```js
/**
 * Parse "HH:MM" to minutes since midnight
 */
export function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format minutes to "HH:MM"
 */
export function formatMinutes(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calculate total hours from slots
 * @param {Array<{start: string, end: string}>} slots
 * @returns {number} total hours (decimal)
 */
export function calculateTotalHours(slots) {
  return slots.reduce((total, slot) => {
    const start = parseTime(slot.start);
    const end = parseTime(slot.end);
    return total + (end - start) / 60;
  }, 0);
}

/**
 * Validate working hours
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateWorkingHours(slots, requiredHours = 8) {
  // Check each slot: end > start
  for (const slot of slots) {
    if (parseTime(slot.end) <= parseTime(slot.start)) {
      return { valid: false, error: `End time must be after start time: ${slot.start}-${slot.end}` };
    }
  }

  // Check no overlaps
  const sorted = [...slots].sort((a, b) => parseTime(a.start) - parseTime(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (parseTime(sorted[i].start) < parseTime(sorted[i - 1].end)) {
      return { valid: false, error: 'Time slots overlap' };
    }
  }

  // Check total hours
  const total = calculateTotalHours(slots);
  if (Math.abs(total - requiredHours) > 0.01) {
    return { valid: false, error: `Total ${total.toFixed(1)}h ≠ ${requiredHours}h required` };
  }

  return { valid: true };
}

/**
 * Format slots to status string
 * @returns {string} "Working time: 08:00 - 13:30 + 15:30 - 18:00"
 */
export function formatWorkingStatus(slots) {
  const parts = slots.map(s => `${s.start} - ${s.end}`);
  return `Working time: ${parts.join(' + ')}`;
}

/**
 * Get current work status based on time
 * @param {Date} now
 * @param {string} timezone - working timezone
 * @param {Array} slots
 * @returns {'working' | 'break' | 'off'}
 */
export function getCurrentWorkStatus(now, timezone, slots) {
  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: timezone
  }).format(now);
  const currentMins = parseTime(timeStr);
  const sorted = [...slots].sort((a, b) => parseTime(a.start) - parseTime(b.start));

  for (const slot of sorted) {
    if (currentMins >= parseTime(slot.start) && currentMins < parseTime(slot.end)) {
      return 'working';
    }
  }

  // Check if between slots (break)
  for (let i = 0; i < sorted.length - 1; i++) {
    if (currentMins >= parseTime(sorted[i].end) && currentMins < parseTime(sorted[i + 1].start)) {
      return 'break';
    }
  }

  return 'off';
}
```

### Step 2: Working Hours Store (`working-hours-store.js`)

```js
import { writable, derived } from 'svelte/store';
import { currentTime, workTimezone } from './clock-store.js';
import { validateWorkingHours, formatWorkingStatus, getCurrentWorkStatus } from '../utils/working-hours-utils.js';

const DEFAULT_SLOTS = [
  { start: '08:00', end: '13:30' },
  { start: '15:30', end: '18:00' }
];

function loadSlots() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('self-clock-working-hours');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
  }
  return DEFAULT_SLOTS;
}

export const workingSlots = writable(loadSlots());

// Auto-save
if (typeof localStorage !== 'undefined') {
  workingSlots.subscribe(v => localStorage.setItem('self-clock-working-hours', JSON.stringify(v)));
}

// Validation result
export const validation = derived(workingSlots, $slots => validateWorkingHours($slots));

// Formatted status string
export const statusText = derived(workingSlots, $slots => formatWorkingStatus($slots));

// Live work status
export const workStatus = derived(
  [currentTime, workTimezone, workingSlots],
  ([$time, $tz, $slots]) => getCurrentWorkStatus($time, $tz, $slots)
);
```

### Step 3: WorkingHours.svelte (Settings UI)

Compact form:
- Dynamic slot rows (add/remove, max 3)
- Each row: [HH:MM] — [HH:MM] + remove button
- "Add slot" button
- Total hours display with validation status (✓/✗)
- "Sync to Teams" button (if connected)

### Step 4: WorkStatus.svelte (Clock Display)

```svelte
<script>
  import { workStatus, statusText } from '../stores/working-hours-store.js';
</script>

<div class="work-status">
  <span class="status-dot" class:working={$workStatus === 'working'}
    class:break={$workStatus === 'break'} class:off={$workStatus === 'off'}></span>
  <span class="status-label">
    {$workStatus === 'working' ? 'Working' : $workStatus === 'break' ? 'Break' : 'Off'}
  </span>
  <span class="status-text">{$statusText.replace('Working time: ', '')}</span>
</div>
```

### Step 5: Rust Backend — Teams Integration

**Add dependencies to `Cargo.toml`:**
```toml
[dependencies]
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["full"] }
```

**Create `src-tauri/src/teams.rs`:**
```rust
use reqwest::Client;
use serde_json::json;

/// Update MS Teams status message via Graph API
pub async fn update_teams_status(access_token: &str, message: &str) -> Result<(), String> {
    let client = Client::new();
    let body = json!({
        "statusMessage": {
            "message": {
                "content": message,
                "contentType": "text"
            }
        }
    });

    let response = client
        .post("https://graph.microsoft.com/v1.0/me/presence/setStatusMessage")
        .header("Authorization", format!("Bearer {}", access_token))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    match response.status().as_u16() {
        200 => Ok(()),
        401 => Err("Token expired — please reconnect Teams".into()),
        403 => Err("Missing Presence.ReadWrite scope".into()),
        code => Err(format!("Teams API error: {}", code)),
    }
}
```

**Create `src-tauri/src/oauth.rs`:**
```rust
/// OAuth2 flow for Azure AD
/// 1. Open browser to consent URL
/// 2. Listen on localhost for redirect with auth code
/// 3. Exchange code for access + refresh tokens
/// 4. Store refresh token securely (PasswordVault for OUR app's tokens)

// Tauri commands:
#[tauri::command]
pub async fn start_teams_auth(client_id: String, tenant_id: String) -> Result<String, String> {
    // Build consent URL and open in browser
    // Start local HTTP server on port 8400 for redirect
    // Return auth URL for user
    todo!()
}

#[tauri::command]
pub async fn exchange_teams_code(code: String, client_id: String, client_secret: String) -> Result<(), String> {
    // Exchange auth code for tokens
    // Store refresh token in PasswordVault (our own credential)
    todo!()
}

#[tauri::command]
pub async fn update_teams_working_hours(message: String) -> Result<(), String> {
    // Load refresh token from PasswordVault
    // Get new access token
    // Call set_teams_status
    todo!()
}
```

**Register commands in `lib.rs`:**
```rust
mod teams;
mod oauth;

// In builder:
.invoke_handler(tauri::generate_handler![
    oauth::start_teams_auth,
    oauth::exchange_teams_code,
    oauth::update_teams_working_hours,
])
```

### Step 6: Teams Settings UI

Add to Settings.svelte:
- "Microsoft Teams" section
- Azure App ID + Tenant ID input fields (one-time setup)
- "Connect to Teams" button → triggers OAuth flow
- Connection status indicator (connected/disconnected)
- "Auto-sync" toggle — update Teams on working hours change
- Store Azure credentials in localStorage (non-sensitive, just app IDs)

## Settings for Teams (stored in localStorage)

```js
const teamsSettings = {
  connected: false,
  clientId: '',      // Azure AD App ID (public, not secret)
  tenantId: '',      // Azure AD Tenant ID
  autoSync: true,    // Auto-update Teams on schedule change
};
```

Note: `client_secret` should be stored in Rust-side PasswordVault, NOT localStorage.

## Todo List
- [ ] Create `working-hours-utils.js` — time parsing, validation, status logic
- [ ] Create `working-hours-store.js` — Svelte stores with persistence
- [ ] Create `WorkingHours.svelte` — time slot input UI with validation
- [ ] Create `WorkStatus.svelte` — status indicator on clock view
- [ ] Add to `Settings.svelte` — working hours section
- [ ] Add to `ClockDisplay.svelte` — work status display
- [ ] Create `src-tauri/src/teams.rs` — Graph API call
- [ ] Create `src-tauri/src/oauth.rs` — OAuth2 flow + token management
- [ ] Update `src-tauri/src/lib.rs` — register commands, add modules
- [ ] Update `src-tauri/Cargo.toml` — add reqwest, tokio deps
- [ ] Test: working hours validation (8h total, no overlap)
- [ ] Test: live status indicator (working/break/off)
- [ ] Test: Teams OAuth flow + status update
- [ ] Test: token refresh after expiry

## Success Criteria
1. User can configure 1-3 flexible time slots
2. Validation enforces 8h total (configurable)
3. Live status shows working/break/off based on current time in work timezone
4. Status string formatted: "Working time: 08:00 - 13:30 + 15:30 - 18:00"
5. Teams status message updates via Graph API after OAuth consent
6. Token refresh works silently for ~90 days

## Risk Assessment
- **Azure AD app registration barrier** — user needs admin/developer access to Azure Portal. Mitigate: provide step-by-step guide or consider PowerShell fallback
- **Token expiry** — refresh tokens valid ~90 days. After that, user must re-consent. Mitigate: show clear UI prompt when token expires
- **Corporate IT policies** — some orgs block 3rd-party Graph API access. Mitigate: detect 403 and show helpful error
- **reqwest adds binary size** — estimate +1-2MB to final binary. Acceptable tradeoff

## Security Considerations
- Refresh tokens stored in Windows PasswordVault (our app's own credential, DPAPI encrypted)
- Access tokens kept in memory only (never persisted)
- Client secret stored Rust-side in PasswordVault (NOT in localStorage/frontend)
- Azure App ID + Tenant ID are non-sensitive (safe in localStorage)
- No credentials transmitted except over HTTPS to Microsoft endpoints
