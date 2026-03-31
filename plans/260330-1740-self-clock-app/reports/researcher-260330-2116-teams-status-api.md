# Microsoft Teams Status Message Update via MS Graph API
**Research Report | 2026-03-30**

---

## EXECUTIVE SUMMARY

Setting Teams status messages programmatically via MS Graph API is **fully viable**. The endpoint is simple, but token sourcing is the blocker:
- **Windows PasswordVault approach: NOT FEASIBLE** — Teams doesn't store retrievable tokens there; MSAL uses encrypted file storage
- **Recommended: OAuth2 flow with Azure AD app registration** (one-time setup)
- **Alternative: PowerShell wrapper** (immediate solution for single-user scenarios)

---

## 1. MS GRAPH API FOR TEAMS PRESENCE/STATUS MESSAGE

### Endpoint Details

| Aspect | Value |
|--------|-------|
| **HTTP Method** | `POST` |
| **URL** | `https://graph.microsoft.com/v1.0/users/{userId}/presence/setStatusMessage` |
| **Alternative** | `POST /me/presence/setStatusMessage` (uses authenticated user) |
| **Response on Success** | `200 OK` (empty body) |
| **Response on Error** | `401 Unauthorized`, `403 Forbidden`, `429 Too Many Requests` |

### Required Headers

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body Schema

```json
{
  "statusMessage": {
    "message": {
      "content": "Working time: 08:00 - 13:30 + 15:30 - 18:00",
      "contentType": "text"
    },
    "expiryDateTime": {
      "dateTime": "2026-03-31T18:00:00",
      "timeZone": "Eastern Standard Time"
    }
  }
}
```

**Fields:**
- `statusMessage.message.content` (required): Plain text status (no rich formatting)
- `statusMessage.message.contentType`: Always `"text"`
- `statusMessage.expiryDateTime` (optional): When to clear the status automatically
  - `dateTime`: ISO 8601 format `YYYY-MM-DDTHH:mm:ss`
  - `timeZone`: IANA timezone (e.g., "Eastern Standard Time", "Pacific Standard Time", "UTC")

**Constraint**: Setting status message does **NOT** change presence state (Available/Busy/DoNotDisturb). The status message is independent metadata.

### Exact HTTP Request Example

```http
POST https://graph.microsoft.com/v1.0/users/fa8bf3dc-eca7-46b7-bad1-db199b62afc3/presence/setStatusMessage HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "statusMessage": {
    "message": {
      "content": "Working time: 08:00 - 13:30 + 15:30 - 18:00",
      "contentType": "text"
    },
    "expiryDateTime": {
      "dateTime": "2026-03-31T18:00:00",
      "timeZone": "Eastern Standard Time"
    }
  }
}
```

---

## 2. AUTHENTICATION & SCOPE REQUIREMENTS

### Permission Scope

| Scenario | Required Scope | Permission Type | Headless? |
|----------|---|---|---|
| Set your own status | `Presence.ReadWrite` | Delegated | ❌ No |
| Set another user's status | `Presence.ReadWrite.All` | Application | ✅ Yes (admin consent required) |

**Critical constraint**: Both delegated and application scopes require the user to have **logged in at least once**. True headless/background operation is not supported. You need an authenticated user session.

### Token Types

- **Bearer token** (OAuth 2.0 Access Token) — JWT format
- **Scope format**: `https://graph.microsoft.com/.default` (for app-only) or specific scopes listed above

---

## 3. WINDOWS CREDENTIAL MANAGER / PASSWORDVAULT APPROACH

### Finding: NOT FEASIBLE

**Problem**: Microsoft Teams does not store OAuth tokens in Windows Credential Manager that can be easily retrieved for programmatic reuse.

#### Why It Fails

1. **Teams stores credentials privately**: Microsoft Teams caches credentials internally (location: `%LOCALAPPDATA%\Microsoft\Teams`) but does NOT write tokens to PasswordVault/Credential Manager in a format that tools can safely consume.

2. **MSAL token storage on Windows**:
   - Tokens are stored as **encrypted files** in a protected directory (not PasswordVault)
   - Located at: `%USERPROFILE%\.cache\msal\` or AppData\Local (MSAL v3+)
   - Files are encrypted with DPAPI (Data Protection API) — requires the same user context to decrypt
   - No documented public API to retrieve these tokens from Rust

3. **Rust PasswordVault access limitations**:
   - The `windows` crate provides `windows::Security::Credentials::PasswordVault` API
   - This API requires explicit credential storage — it won't retrieve Teams' internal tokens
   - You can only retrieve credentials that were explicitly stored in PasswordVault by your own application

#### Verdict

**Do not pursue PasswordVault token retrieval**. It will not work for Teams tokens.

---

## 4. VIABLE AUTHENTICATION APPROACHES

### Option A: Azure AD OAuth2 (RECOMMENDED)

**Setup time**: 10-15 minutes (one-time)

**Steps**:
1. Register app in Azure Portal (`portal.azure.com`)
2. Create client secret
3. Request `Presence.ReadWrite` scope with user consent (sign-in popup once)
4. Cache the refresh token from that session
5. Use refresh token to get new access tokens without user interaction

**Implementation**:

```rust
// Using reqwest + serde_json
use reqwest::Client;
use serde_json::json;

async fn get_access_token(client_id: &str, client_secret: &str, refresh_token: &str) -> Result<String, Box<dyn std::error::Error>> {
    let client = Client::new();
    let response = client
        .post("https://login.microsoftonline.com/common/oauth2/v2.0/token")
        .form(&[
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("refresh_token", refresh_token),
            ("grant_type", "refresh_token"),
            ("scope", "https://graph.microsoft.com/.default"),
        ])
        .send()
        .await?;

    let body: serde_json::Value = response.json().await?;
    Ok(body["access_token"].as_str().unwrap().to_string())
}

async fn set_teams_status(access_token: &str, user_id: &str, message: &str) -> Result<(), Box<dyn std::error::Error>> {
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
        .post(&format!("https://graph.microsoft.com/v1.0/users/{}/presence/setStatusMessage", user_id))
        .header("Authorization", format!("Bearer {}", access_token))
        .json(&body)
        .send()
        .await?;

    if response.status() == 200 {
        Ok(())
    } else {
        Err(format!("Status: {}", response.status()).into())
    }
}
```

**Advantages**:
- Refresh tokens persist (can be stored encrypted locally)
- No re-authentication needed until token expires (refresh token valid for ~90 days)
- Standard OAuth flow

**Disadvantages**:
- Requires Azure app registration
- Initial user consent needed once
- Need to handle token expiration/refresh logic

### Option B: PowerShell Wrapper (QUICK FIX)

**Setup time**: 5 minutes

**For single-user scenarios**, wrap PowerShell calls from Rust:

```rust
use std::process::Command;

fn set_teams_status_powershell(message: &str) -> Result<(), Box<dyn std::error::Error>> {
    let script = format!(
        r#"
        Import-Module Microsoft.Graph.CloudCommunications
        Connect-MgGraph -Scopes "Presence.ReadWrite" -NoWelcome
        $params = @{{
            statusMessage = @{{
                message = @{{
                    content = "{}"
                    contentType = "text"
                }}
            }}
        }}
        Set-MgUserPresenceStatusMessage -UserId me -BodyParameter $params
        "#,
        message
    );

    let output = Command::new("powershell")
        .arg("-Command")
        .arg(&script)
        .output()?;

    if output.status.success() {
        Ok(())
    } else {
        Err(format!("PowerShell error: {}", String::from_utf8_lossy(&output.stderr)).into())
    }
}
```

**Advantages**:
- Uses existing Teams authentication (user already logged in)
- Zero app registration needed
- Works immediately

**Disadvantages**:
- PowerShell must be available
- Spawns subprocess (slower)
- User must already be signed into Teams
- Less suitable for automation/scheduling

### Option C: Microsoft Graph SDK for Rust (IF IT EXISTS)

**Status**: Limited / Partial

- **graph-rs-sdk** crate exists: https://github.com/sreeise/graph-rs-sdk
- Provides convenience wrappers around Graph API
- Requires OAuth token injection (doesn't solve auth problem)
- Less mature than C#/.NET SDKs

**Example**:
```rust
use graph_rs_sdk::GraphClient;

let graph_client = GraphClient::new(access_token);
// Presence API support is limited in Rust SDK
```

---

## 5. RATE LIMITS & THROTTLING

**Microsoft Graph Rate Limiting**:
- Uses **token bucket algorithm** per tenant/app
- General limits: ~10,000 requests/minute per app (varies)
- Presence API has no documented special limits
- Status message updates are likely low-cost operations

**If throttled**:
- Response: `429 Too Many Requests`
- Header: `Retry-After: {seconds}` (respect this)
- Backoff strategy: Exponential backoff (1s, 2s, 4s, 8s, ...)

**For your use case** (single user, periodic updates): Rate limiting is not a concern. Safe to update every 1-5 minutes.

---

## 6. STATUS MESSAGE vs PRESENCE STATE

**Important distinction**:

| Property | Status Message | Presence State |
|----------|---|---|
| **What it is** | Custom text visible in Teams UI | User availability (Available/Busy/Away/DoNotDisturb/Offline) |
| **API to change** | `/presence/setStatusMessage` | `/presence/setPresence` |
| **Your requirement** | ✅ This one ("Working time...") | ❌ No requirement mentioned |
| **Can change independently?** | ✅ Yes | ❌ Presence state is controlled by Teams app, not API |

**Note**: You cannot programmatically change presence state (Available/Busy) via Graph API without also managing the entire presence lifecycle. The setStatusMessage endpoint **only** updates the custom text.

---

## 7. IMPLEMENTATION DECISION MATRIX

| Approach | Setup | Auth | Maintenance | Best For |
|----------|-------|------|---|---|
| **OAuth2 + Rust** | 15 min | Refresh token | Ongoing (handle expiry) | Production automation |
| **PowerShell wrapper** | 5 min | Teams login | Minimal | Quick POC, single user |
| **graph-rs-sdk** | 15 min | Same as OAuth2 | SDK updates | If SDK matures |

### RECOMMENDATION

**For production**: Use **Option A (OAuth2 + Rust)** with these specific steps:

1. Register app in Azure Portal with `Presence.ReadWrite` scope
2. Implement token refresh logic with exponential backoff
3. Store refresh token encrypted locally (using `aes-gcm` crate + local config file)
4. Use `reqwest` for HTTP calls (battle-tested, async)
5. Handle 429/401 responses with retry logic

**For MVP/Testing**: Use **Option B (PowerShell wrapper)** to validate requirements without Azure setup.

---

## 8. CODE SKELETON (RUST + REQWEST)

```rust
use reqwest::Client;
use serde_json::json;
use std::error::Error;

pub struct TeamsStatusClient {
    access_token: String,
    user_id: String,
}

impl TeamsStatusClient {
    pub async fn set_status(&self, message: &str) -> Result<(), Box<dyn Error>> {
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
            .post(&format!(
                "https://graph.microsoft.com/v1.0/users/{}/presence/setStatusMessage",
                self.user_id
            ))
            .header("Authorization", format!("Bearer {}", self.access_token))
            .json(&body)
            .send()
            .await?;

        match response.status().as_u16() {
            200 => Ok(()),
            401 => Err("Unauthorized — token expired or invalid".into()),
            403 => Err("Forbidden — missing Presence.ReadWrite scope".into()),
            429 => Err("Rate limited — wait before retrying".into()),
            code => Err(format!("Unexpected status {}", code).into()),
        }
    }
}
```

---

## UNRESOLVED QUESTIONS

1. **Can Teams tokens be extracted from MSAL cache without user context?**
   - No documented approach. DPAPI encryption tied to user profile.

2. **Does Graph API return current status message on GET /me/presence?**
   - Yes, but only `statusMessage.message` for self; full metadata (expiryDateTime) only visible to self, not others.

3. **Is there a way to refresh token without redirect flow?**
   - Yes: OAuth2 refresh token grant (implemented above). Requires initial consent once.

4. **Can we get User ID without additional API call?**
   - If using `/me` endpoint: No additional call needed (API infers from token).
   - If updating specific user: Must know their ObjId or UPN upfront.

---

## SOURCES

- [Microsoft Graph presence: setStatusMessage](https://learn.microsoft.com/en-us/graph/api/presence-setstatusmessage?view=graph-rest-1.0)
- [Microsoft Graph throttling and rate limits](https://learn.microsoft.com/en-us/graph/throttling-limits)
- [MSAL token caching and storage](https://learn.microsoft.com/en-us/entra/identity-platform/msal-acquire-cache-tokens)
- [Microsoft Teams does not write credentials in Credential Manager](https://techcommunity.microsoft.com/t5/microsoft-teams/microsoft-teams-does-not-write-credentials-in-credential-manager/td-p/1207131)
- [Windows PasswordVault API (Rust bindings)](https://microsoft.github.io/windows-docs-rs/doc/windows/Security/Credentials/struct.PasswordVault.html)
- [graph-rs-sdk GitHub](https://github.com/sreeise/graph-rs-sdk)
- [PowerShell Set-MgUserPresenceStatusMessage](https://learn.microsoft.com/en-us/powershell/module/microsoft.graph.cloudcommunications/set-mguserpresencestatusmessage?view=graph-powershell-1.0)
