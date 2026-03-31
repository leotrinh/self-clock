<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';

  export let onSettingsClick = () => {}; export let hovered = false;

  const appWindow = getCurrentWindow();

  async function handleMinimize() {
    await appWindow.minimize();
  }

  async function handleClose() {
    await appWindow.hide();
  }
</script>

<div class="titlebar" class:hovered={hovered} data-tauri-drag-region>
  <div class="title" data-tauri-drag-region>Self Clock</div>
  <div class="controls">
    <button class="control-btn settings" onclick={onSettingsClick} aria-label="Settings">
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.073 1.03a.75.75 0 01.683.924l.344 4.53a.75.75 0 01-.213.565l-2.25 2.25a.75.75 0 01-.424.177l-4.13.743a.75.75 0 01-.924-.683l.743-4.13a.75.75 0 01.177-.424l2.25-2.25a.75.75 0 01.565-.213L6.073 1.03zM6.75 5.25a.75.75 0 100-1.5.75.75 0 000 1.5z" fill="currentColor"/>
      </svg>
    </button>
    <button class="control-btn minimize" onclick={handleMinimize} aria-label="Minimize">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <rect x="1" y="5" width="10" height="2" fill="currentColor" />
      </svg>
    </button>
    <button class="control-btn close" onclick={handleClose} aria-label="Close">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2" />
      </svg>
    </button>
  </div>
</div>

<style>

  .titlebar {
    transition: background 0.2s ease;
  }

  .titlebar .title,
  .titlebar .controls {
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .titlebar.hovered .title,
  .titlebar.hovered .controls {
    opacity: 1;
    pointer-events: auto;
  }
  
  .titlebar {
    height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(30, 30, 30, 0.85);
    backdrop-filter: blur(10px);
    border-radius: 8px 8px 0 0;
    padding: 0 8px;
    user-select: none;
    -webkit-user-select: none;
    position: relative;
    z-index: 100;
  }

  .title {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }

  .controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .control-btn {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }

  .control-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  .control-btn.settings {
    width: 28px;
  }

  .control-btn.close:hover {
    background: #e81123;
    color: white;
  }
</style>
