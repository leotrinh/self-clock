<script>
  import { onMount, onDestroy } from 'svelte';
  import { localTime, workTime, startClock, stopClock } from '../stores/clock-store.js';

  onMount(() => {
    startClock();
  });

  onDestroy(() => {
    stopClock();
  });

  function openGitHub() {
    try {
      // Try using window.open as fallback
      window.open('https://github.com/leotrinh', '_blank');
    } catch (e) {
      console.error('Failed to open link', e);
    }
  }
</script>

<div class="clock-display" data-tauri-drag-region>
  <div class="clock-row">
    <div class="clock-label">
      <span class="label">LOCAL</span>
      <span class="tz-name">({$localTime.timezone})</span>
    </div>
    <div class="clock-values">
      <span class="time">{$localTime.time}</span>
      <span class="tz-badge">{$localTime.abbreviation}</span>
      <span class="date">{$localTime.date}</span>
    </div>
  </div>
  
  <div class="clock-row">
    <div class="clock-label">
      <span class="label">WORKING</span>
      <span class="tz-name">({$workTime.timezone})</span>
    </div>
    <div class="clock-values">
      <span class="time">{$workTime.time}</span>
      <span class="tz-badge">{$workTime.abbreviation}</span>
      <span class="date">{$workTime.date}</span>
    </div>
  </div>
  
  <div class="footer">
    made by <a href="https://github.com/leotrinh" class="footer-link" target="_blank" rel="noopener noreferrer">Leo</a> with ❤️
  </div>
</div>

<style>
  .clock-display {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 12px 16px;
    height: 100%;
    gap: 12px;
    box-sizing: border-box;
  }

  .clock-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 0 8px;
    box-sizing: border-box;
  }

  .clock-label {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .label {
    font-size: 0.7rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--text-color, white) 50%, transparent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tz-name {
    font-size: 0.65rem;
    color: color-mix(in srgb, var(--text-color, white) 35%, transparent);
  }

  .clock-values {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .time {
    font-size: 1.8rem;
    font-weight: 600;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
    color: var(--text-color, white);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.02em;
  }

  .tz-badge {
    font-size: 0.65rem;
    font-weight: 600;
    color: color-mix(in srgb, var(--text-color, white) 80%, transparent);
    background: color-mix(in srgb, var(--text-color, white) 15%, transparent);
    padding: 2px 6px;
    border-radius: 4px;
    min-width: 32px;
    text-align: center;
  }

  .date {
    font-size: 0.7rem;
    color: color-mix(in srgb, var(--text-color, white) 60%, transparent);
  }

  .footer {
    font-size: 0.6rem;
    color: color-mix(in srgb, var(--text-color, white) 30%, transparent);
    text-align: center;
    padding: 4px 0 8px;
  }

  .footer-link {
    color: color-mix(in srgb, var(--text-color, white) 50%, transparent);
    text-decoration: none;
    transition: color 0.15s;
  }

  .footer-link:hover {
    color: color-mix(in srgb, var(--text-color, white) 80%, transparent);
    text-decoration: underline;
  }
</style>
