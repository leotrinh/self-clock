# Phase 1: Project Scaffold

## Context Links
- [Plan Overview](plan.md)
- [Tauri v2 Research](reports/researcher-260330-1740-tauri-v2-windows-clock-app.md)

## Overview
- **Priority:** High
- **Status:** Planned
- **Description:** Scaffold Tauri v2 + Svelte 5 project, configure window settings

## Key Insights
- `npm create tauri-app@latest` generates full project structure automatically
- Window transparency requires both `transparent: true` AND `decorations: false`
- WebView2 pre-installed on Win10 build 1803+

## Requirements
- Tauri v2 project with Svelte 5 frontend
- Transparent frameless window config
- Dev server working (`npm run tauri dev`)

## Implementation Steps

1. Verify prerequisites:
   ```bash
   rustc --version && node --version
   ```

2. Create project:
   ```bash
   cd D:\DevSpaces\CKWS
   npm create tauri-app@latest self-clock -- --template svelte-ts
   cd self-clock && npm install
   ```

3. Configure `src-tauri/tauri.conf.json` windows section:
   ```json
   {
     "windows": [{
       "label": "main",
       "title": "Self Clock",
       "width": 350,
       "height": 180,
       "alwaysOnTop": true,
       "decorations": false,
       "transparent": true,
       "resizable": true,
       "skipTaskbar": false
     }]
   }
   ```

4. Set `src/app.css` transparent body:
   ```css
   :root { background: transparent; }
   body { background: transparent; margin: 0; overflow: hidden; }
   ```

5. Verify: `npm run tauri dev` → transparent frameless window appears

## Todo List
- [ ] Check Rust & Node.js installed
- [ ] Scaffold Tauri + Svelte project
- [ ] Configure tauri.conf.json window settings
- [ ] Set transparent body CSS
- [ ] Verify dev server works

## Success Criteria
- `npm run tauri dev` launches app
- Window is frameless and transparent
- No build errors

## Risk Assessment
- Missing Rust/C++ build tools → clear error messages, install docs in research report
- WebView2 not found → rare on Win10+, bootstrapper handles it
