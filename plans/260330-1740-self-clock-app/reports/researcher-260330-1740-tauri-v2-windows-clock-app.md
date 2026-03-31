# Tauri v2 Windows Desktop Clock App: Technical Research Report

**Date:** 2026-03-30 | **Version:** Tauri v2.10.3 | **Target:** Windows 10+

---

## Executive Summary

Tauri v2 is **production-ready** for a Windows desktop clock app. All required features (always-on-top, transparent windows, frameless UI, system tray) are natively supported. Binary size baseline is **~3-6 MB** (with WebView2 bundling). Setup requires Rust toolchain + Visual C++ build tools; development overhead is minimal.

**Recommendation:** Proceed with Tauri v2 + Svelte. Zero show-stoppers for clock app requirements.

---

## 1. Always-On-Top Configuration

### Window Config (tauri.conf.json)

```json
{
  "windows": [
    {
      "label": "main",
      "title": "Desktop Clock",
      "width": 400,
      "height": 200,
      "alwaysOnTop": true,
      "decorations": false,
      "transparent": true
    }
  ]
}
```

### JavaScript API (Runtime Control)

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

// Enable always-on-top
await appWindow.setAlwaysOnTop(true);

// Check current state
const isOnTop = await appWindow.isAlwaysOnTop();
console.log(`Always on top: ${isOnTop}`);

// Disable
await appWindow.setAlwaysOnTop(false);

// Alternative: Set always-on-bottom
await appWindow.setAlwaysOnBottom(true);
```

### Rust Backend Control

```rust
use tauri::Manager;

#[tauri::command]
async fn toggle_always_on_top(window: tauri::Window) -> Result<bool, String> {
    let current_state = window.is_always_on_top()
        .map_err(|e| e.to_string())?;

    window.set_always_on_top(!current_state)
        .map_err(|e| e.to_string())?;

    Ok(!current_state)
}
```

**Windows Implementation Note:** Uses OS owned-windows mechanism where owned window stays above owner in z-order, automatically destroyed with owner, hidden when owner minimizes.

---

## 2. Transparent Window & Background

### Configuration with Decorations Hidden

```json
{
  "windows": [
    {
      "label": "main",
      "transparent": true,
      "decorations": false,
      "skipTaskbar": false
    }
  ]
}
```

### CSS Implementation (Svelte Component)

```svelte
<script>
  import { onMount } from 'svelte';

  onMount(() => {
    // Apply transparent background
    document.body.style.backgroundColor = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
  });
</script>

<div class="clock-widget">
  <!-- Clock display -->
</div>

<style>
  :global(body) {
    background: transparent;
    margin: 0;
    overflow: hidden;
  }

  .clock-widget {
    background: rgba(0, 0, 0, 0.8);  /* Semi-transparent dark background */
    color: #fff;
    padding: 20px;
    border-radius: 12px;
    backdrop-filter: blur(10px);  /* Acrylic effect on Windows */
  }
</style>
```

### Windows-Specific Limitations & Workarounds

| Issue | Impact | Solution |
|-------|--------|----------|
| Alpha channel ignored on native titlebar | Can't make native titlebar transparent | Use `decorations: false`, create custom titlebar |
| Full window transparency may have rendering issues | Window background might not be truly transparent | Use CSS `background: transparent` + component-level opaque elements |
| Acrylic effect unavailable natively | Can't replicate Windows 10+ acrylic blur | Use CSS `backdrop-filter: blur()` or `tauri-plugin-window-vibrancy` |

**Recommended Approach:** Disable decorations + use CSS `backdrop-filter` for modern blur effect. For classic frosted glass, use the `window-vibrancy` plugin.

---

## 3. Window Decorations & Frameless Design

### Complete Frameless Setup

```json
{
  "windows": [
    {
      "label": "main",
      "decorations": false,
      "transparent": true,
      "resizable": true,
      "fullscreen": false,
      "width": 400,
      "height": 200
    }
  ]
}
```

**What `decorations: false` removes:**
- Native window title bar
- Window border/frame
- Minimize, maximize, close buttons
- Window shadow
- OS-level drag region

### Custom Drag-Region Titlebar (Svelte)

```svelte
<script>
  import { appWindow } from '@tauri-apps/api/window';

  async function minimizeWindow() {
    await appWindow.minimize();
  }

  async function closeWindow() {
    await appWindow.close();
  }
</script>

<div class="titlebar">
  <div class="titlebar-content" data-tauri-drag-region>
    <span>Desktop Clock</span>
  </div>
  <div class="titlebar-controls">
    <button on:click={minimizeWindow} title="Minimize">
      −
    </button>
    <button on:click={closeWindow} title="Close">
      ✕
    </button>
  </div>
</div>

<style>
  .titlebar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
    user-select: none;
    -webkit-user-select: none;
  }

  .titlebar-content {
    flex: 1;
    padding-left: 12px;
    font-size: 14px;
    font-weight: 500;
  }

  .titlebar-controls {
    display: flex;
    gap: 4px;
    padding-right: 8px;
  }

  button {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  button:hover {
    opacity: 1;
  }
</style>
```

**Required Permission in tauri.conf.json:**
```json
{
  "permissions": ["core:window:allow-start-dragging"]
}
```

---

## 4. Tauri v2 + Svelte Setup

### Quick Start (Recommended)

```bash
# Option 1: npm (default)
npm create tauri-app@latest my-clock-app -- --template svelte

# Option 2: Using pnpm
pnpm create tauri-app my-clock-app --template svelte

# Option 3: Using yarn
yarn create tauri-app my-clock-app --template svelte
```

### Manual Setup Steps

```bash
# 1. Create project
npm create tauri-app@latest my-clock-app

# 2. Select during prompts:
#    - Package manager: npm/pnpm/yarn
#    - UI template: Svelte
#    - Language: TypeScript (recommended)

# 3. Navigate and install
cd my-clock-app
npm install

# 4. Start dev server
npm tauri dev

# 5. Build for production
npm tauri build
```

### Project Structure (Post-Setup)

```
my-clock-app/
├── src/                    # Frontend (Svelte)
│   ├── App.svelte         # Root component
│   ├── main.ts            # Entry point
│   └── ...
├── src-tauri/             # Backend (Rust)
│   ├── main.rs            # Tauri app entry
│   ├── lib.rs
│   └── Cargo.toml
├── tauri.conf.json        # Tauri configuration
├── vite.config.ts         # Vite bundler config
├── tsconfig.json
└── package.json
```

### Svelte-Specific Config (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import { svelte } from 'vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
})
```

**Note:** `create-tauri-app` handles this automatically. No manual Vite config needed for basic setup.

---

## 5. System Tray Support

### Enable in Cargo.toml

```toml
[dependencies]
tauri = { version = "2.0", features = ["tray-icon"] }
```

### Rust Implementation

```rust
use tauri::tray::TrayIconBuilder;
use tauri::menu::{Menu, MenuItem};

fn main() {
    let quit = MenuItem::new("Quit", "quit", true);
    let toggle = MenuItem::new("Toggle Window", "toggle", true);

    let menu = Menu::new()
        .add_items(vec![toggle, quit])
        .build(app.handle())
        .unwrap();

    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "quit" => std::process::exit(0),
                "toggle" => {
                    let window = app.get_window("main").unwrap();
                    let _ = window.toggle();
                }
                _ => {}
            }
        })
        .build(app)
        .unwrap();
}
```

### JavaScript/TypeScript Alternative

```typescript
import { TrayIcon } from '@tauri-apps/api/tray';
import { defaultWindowIcon } from '@tauri-apps/api/app';

const icon = await defaultWindowIcon();

const tray = await TrayIcon.new({
  icon,
  menu: [
    {
      text: 'Toggle Window',
      action: 'toggle',
    },
    {
      text: 'Quit',
      action: 'quit',
    },
  ],
});

tray.set_on_menu_item_clicked((action) => {
  if (action === 'quit') {
    process.exit(0);
  } else if (action === 'toggle') {
    getCurrentWindow().toggle();
  }
});
```

### Icon Requirements

- **Format:** .ico (Windows)
- **Minimum size:** 16×16 px (Windows taskbar standard)
- **Recommended:** Provide 16×16, 32×32, 48×48 variants
- **Location:** `src-tauri/icons/` (referenced in tauri.conf.json)

---

## 6. Windows Binary Size

### Baseline Measurements

| Scenario | Size | Notes |
|----------|------|-------|
| Minimal app (empty Svelte) | ~3-4 MB | Uncompressed binary |
| Minimal app + WebView2 Bootstrapper | ~5-6 MB | Installer size |
| Minimal app + WebView2 offline | ~127-130 MB | Full runtime included |
| Clock app (with system tray, transparency) | ~4-6 MB | Estimated for this project |

### Size Optimization (Cargo.toml)

```toml
[profile.release]
opt-level = "z"      # Optimize for size instead of speed
lto = true           # Link-time optimization
codegen-units = 1    # Single codegen unit (slower build, smaller binary)
strip = true         # Remove debug symbols
```

**Expected Impact:** ~40-50% size reduction from baseline.

### Distribution Strategy for Clock App

| Distribution | Size | Recommendation |
|--------------|------|-----------------|
| Direct .exe binary | 4-6 MB | Suitable for tech-savvy users |
| MSI installer + Bootstrapper | ~5-6 MB | Recommended. Auto-updates WebView2 |
| Bundled WebView2 offline | ~130 MB | Only if offline deployment required |

**Recommendation:** Use MSI installer with WebView2 Bootstrapper (~5-6 MB). Minimal overhead, automatic runtime management.

---

## 7. Windows Prerequisites & Setup

### System Requirements

| Component | Requirement | Installation |
|-----------|-------------|--------------|
| **OS** | Windows 10 (build 1803+) or later | Pre-installed |
| **WebView2** | Already included in Win10+ (build 1803+) | Check: Settings → Apps → Optional features |
| **.NET Desktop Runtime** | Not required for Tauri | — |

### Required Developer Tools

#### A. Rust Toolchain (MANDATORY)

```powershell
# Via winget (recommended)
winget install --id Rustlang.Rustup

# OR manual: https://www.rust-lang.org/tools/install
```

**Verify MSVC default:**
```powershell
rustup default stable-msvc
```

Valid toolchains:
- `x86_64-pc-windows-msvc` (64-bit, standard)
- `i686-pc-windows-msvc` (32-bit)
- `aarch64-pc-windows-msvc` (ARM64)

#### B. Visual Studio C++ Build Tools (MANDATORY)

1. Download: [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
2. Run installer, select **"Desktop development with C++"**
3. Include:
   - MSVC C++ compiler
   - Windows 10 SDK (or latest)
   - CMake support (optional but recommended)

#### C. WebView2 Runtime (Optional, Usually Pre-installed)

On Windows 10 build 1803+: Already included.

To manually install (if needed):
1. Download [WebView2 Evergreen Bootstrapper](https://developer.microsoft.com/microsoft-edge/webview2/)
2. Run installer (~1.8 MB, downloads runtime on-demand)

#### D. VBSCRIPT Feature (Optional, MSI Builds Only)

For MSI installer generation:
1. Settings → Apps → Optional features → More Windows features
2. Check "VBSCRIPT"
3. Restart

---

## Implementation Checklist

- [ ] Install Rust via winget
- [ ] Install Visual Studio C++ Build Tools (C++ workload + Windows SDK)
- [ ] Verify WebView2 installed (Windows Settings → Apps → Optional features)
- [ ] Run `npm create tauri-app@latest` with Svelte template
- [ ] Configure `tauri.conf.json`: `alwaysOnTop: true`, `transparent: true`, `decorations: false`
- [ ] Create custom titlebar component with `data-tauri-drag-region`
- [ ] Add system tray icon (16×16 .ico) to `src-tauri/icons/`
- [ ] Enable `tray-icon` feature in Cargo.toml
- [ ] Implement tray menu in Rust `main.rs`
- [ ] Test with `npm tauri dev`
- [ ] Build release: `npm tauri build` (~5-6 MB MSI)

---

## Known Limitations & Workarounds

| Issue | Workaround |
|-------|-----------|
| Native titlebar can't be transparent | Use `decorations: false` + custom HTML titlebar |
| Full window transparency buggy on some Win10 builds | Use semi-transparent backgrounds (rgba) + CSS backdrop-filter |
| Window blur (acrylic) not native | Use CSS `backdrop-filter: blur(10px)` or tauri-plugin-window-vibrancy |
| Can't set window below other windows reliably | Use `setAlwaysOnBottom()` with caveats on alt-tab behavior |
| Tray icon won't show if .ico file missing | Always include 16×16 .ico in icons folder |

---

## Unresolved Questions

1. **SvelteKit compatibility?** Research used Svelte 5. Does project require SvelteKit router? (Answer: Use standard Svelte for simple clock app; SvelteKit adds unnecessary build complexity for single-window app.)

2. **Window positioning on multi-monitor setups?** Tauri provides `WindowOptions.position` but multimon behavior on taskbar clock apps varies. Consider: `tauri-plugin-positioner` for "corner" anchoring.

3. **Real-time clock updates:** Need to validate whether Svelte's reactive statements or a background Rust timer is more efficient. (Preliminary: Svelte setInterval sufficient for clock UI; Rust backend for system notifications if needed.)

4. **Auto-start on Windows login?** Not covered in this research. Requires registry keys or Windows Startup folder manipulation. Plan separate investigation if needed.

---

## Sources

- [Tauri v2 Official Documentation](https://v2.tauri.app/)
- [Window Customization Guide](https://v2.tauri.app/learn/window-customization/)
- [System Tray Documentation](https://v2.tauri.app/learn/system-tray/)
- [JavaScript Window API Reference](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
- [Create Tauri App - Project Setup](https://v2.tauri.app/start/create-project/)
- [Windows Prerequisites Guide](https://v2.tauri.app/start/prerequisites/)
- [App Size Optimization](https://v2.tauri.app/concept/size/)
- [Windows Installer Documentation](https://v2.tauri.app/distribute/windows-installer/)
