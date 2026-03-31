<script>
  import { getTimezoneList, getAbbreviation } from '../utils/timezone-utils.js';
  
  export let value = 'Europe/Berlin';
  export let onchange = () => {};
  
  let search = '';
  let isOpen = false;
  let selectRef;
  
  const timezones = getTimezoneList();
  const now = new Date();
  
  $: filtered = search 
    ? timezones.filter(tz => 
        tz.toLowerCase().includes(search.toLowerCase()) ||
        getAbbreviation(now, tz).toLowerCase().includes(search.toLowerCase())
      )
    : timezones;
  
  function select(tz) {
    value = tz;
    onchange(tz);
    isOpen = false;
    search = '';
  }
  
  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      search = '';
      setTimeout(() => selectRef?.focus(), 10);
    }
  }
  
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      isOpen = false;
    }
  }
</script>

<div class="timezone-select">
  <button class="selected" onclick={toggle}>
    <span class="tz-name">{value}</span>
    <span class="tz-abbr">({getAbbreviation(now, value)})</span>
    <svg class="chevron" class:open={isOpen} width="12" height="12" viewBox="0 0 12 12">
      <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none" />
    </svg>
  </button>
  
  {#if isOpen}
    <div class="dropdown" onkeydown={handleKeydown}>
      <input 
        bind:this={selectRef}
        bind:value={search}
        placeholder="Search timezone..."
        class="search"
      />
      <div class="list">
        {#each filtered as tz}
          <button class="option" onclick={() => select(tz)}>
            <span class="tz-name">{tz}</span>
            <span class="tz-abbr">({getAbbreviation(now, tz)})</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .timezone-select {
    position: relative;
    width: 100%;
  }
  
  .selected {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s;
  }
  
  .selected:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .tz-name {
    flex: 1;
    text-align: left;
  }
  
  .tz-abbr {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }
  
  .chevron {
    transition: transform 0.2s;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .chevron.open {
    transform: rotate(180deg);
  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: rgba(30, 30, 40, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    overflow: hidden;
    z-index: 100;
    backdrop-filter: blur(10px);
  }
  
  .search {
    width: 100%;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.875rem;
    outline: none;
  }
  
  .search::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }
  
  .option:hover {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
