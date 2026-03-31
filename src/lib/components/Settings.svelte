<script>
  import { onMount } from 'svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { isEnabled, enable, disable } from '@tauri-apps/plugin-autostart';
  import TimezoneSelect from './TimezoneSelect.svelte';
  import { workTimezone, localTimezone } from '../stores/clock-store.js';
  import { getLocalTimezone } from '../utils/timezone-utils.js';
   
  export let isOpen = false;
  export let onClose = () => {};
   
  const DEFAULTS = {
    localTz: getLocalTimezone(),
    workTz: 'Europe/Berlin',
    bgOpacity: 85,
    textOpacity: 100,
    alwaysOnTop: true,
    autostart: false,
    bgColor: '#0f0f19',
    textColor: '#ffffff'
  };
   
  let settings = { ...DEFAULTS };
  let appWindow;
   
  // Helper to convert hex to rgb
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
   
  onMount(async () => {
    // Load from localStorage
    const saved = localStorage.getItem('self-clock-settings');
    if (saved) {
      try {
        settings = { ...DEFAULTS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    // Load autostart state
    try {
      settings.autostart = await isEnabled();
    } catch (e) {
      console.error('Failed to check autostart', e);
    }
    applySettings();
     
    appWindow = getCurrentWindow();
  });
   
  function applySettings() {
    // Apply opacity via CSS custom properties
    document.documentElement.style.setProperty('--bg-opacity', settings.bgOpacity / 100);
    document.documentElement.style.setProperty('--text-opacity', settings.textOpacity / 100);
    document.documentElement.style.setProperty('--bg-color-rgb', hexToRgb(settings.bgColor));
    document.documentElement.style.setProperty('--text-color', settings.textColor);
     
    // Apply always-on-top
    if (appWindow) {
      appWindow.setAlwaysOnTop(settings.alwaysOnTop);
    }
  }
   
  function save() {
    localStorage.setItem('self-clock-settings', JSON.stringify(settings));
    applySettings();
  }
   
  function handleLocalTimezoneChange(tz) {
    settings.localTz = tz;
    localTimezone.set(tz);
    save();
  }
   
  function handleWorkTimezoneChange(tz) {
    settings.workTz = tz;
    workTimezone.set(tz);
    save();
  }
   
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
   
  function handleBgOpacity(e) {
    settings.bgOpacity = parseInt(e.target.value);
    save();
  }
   
  function handleTextOpacity(e) {
    settings.textOpacity = parseInt(e.target.value);
    save();
  }
   
  async function handleAlwaysOnTop(e) {
    settings.alwaysOnTop = e.target.checked;
    save();
  }
   
  function handleBack() {
    onClose();
  }

  async function handleAutostart(e) {
    const enabled = e.target.checked;
    settings.autostart = enabled;
    try {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
    } catch (err) {
      console.error('Failed to update autostart', err);
    }
    save();
  }
</script>

{#if isOpen}
  <div class="settings-panel">
    <div class="settings-header">
      <button class="back-btn" onclick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        <span>Back</span>
      </button>
    </div>
    
    <div class="setting">
      <label class="label">Local Timezone</label>
      <TimezoneSelect value={settings.localTz} onchange={handleLocalTimezoneChange} />
    </div>
    
    <div class="setting">
      <label class="label">Working Timezone</label>
      <TimezoneSelect value={settings.workTz} onchange={handleWorkTimezoneChange} />
    </div>
    
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
    
    <div class="setting">
      <label class="label">Background Opacity: {settings.bgOpacity}%</label>
      <input 
        type="range" 
        min="20" 
        max="100" 
        value={settings.bgOpacity}
        oninput={handleBgOpacity}
        class="slider"
      />
    </div>
    
    <div class="setting">
      <label class="label">Text Opacity: {settings.textOpacity}%</label>
      <input 
        type="range" 
        min="50" 
        max="100" 
        value={settings.textOpacity}
        oninput={handleTextOpacity}
        class="slider"
      />
    </div>
    
    <div class="setting checkbox">
      <label>
        <input 
          type="checkbox" 
          checked={settings.alwaysOnTop}
          onchange={handleAlwaysOnTop}
        />
        <span>Always on Top</span>
      </label>
    </div>
    
    <div class="setting checkbox">
      <label>
        <input 
          type="checkbox" 
          checked={settings.autostart}
          onchange={handleAutostart}
        />
        <span>Start with Windows</span>
      </label>
    </div>
  </div>
{/if}

<style>
  .settings-panel {
    position: absolute;
    top: 32px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(15px);
    border-radius: 0 0 8px 8px;
    padding: 16px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    overflow-y: auto;
    overflow-x: hidden;
  }
  
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
  
  .setting {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .label {
    font-size: 0.7rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
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
  
  .slider {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    outline: none;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    transition: transform 0.15s;
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
  
  .checkbox label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    color: white;
  }
  
  .checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
</style>
