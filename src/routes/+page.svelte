<script lang="ts">
  import TitleBar from '$lib/components/TitleBar.svelte';
  import ClockDisplay from '$lib/components/ClockDisplay.svelte';
  import Settings from '$lib/components/Settings.svelte';
  
  let settingsOpen = $state(false);
  let hovered = $state(false);
  
  function toggleSettings() {
    settingsOpen = !settingsOpen;
  }
  
  function closeSettings() {
    settingsOpen = false;
  }
</script>

<div class="app-container"
  onmouseenter={() => hovered = true}
  onmouseleave={() => hovered = false}>
  <TitleBar onSettingsClick={toggleSettings} {hovered} />
  <Settings isOpen={settingsOpen} onClose={closeSettings} />
  <ClockDisplay />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: rgba(var(--bg-color-rgb, 15, 15, 25), var(--bg-opacity, 0.85));
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
</style>
