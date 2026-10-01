<script lang="ts">
  let { title, items, selected = [], actionLabel = '', actionDisabled = false, onaction, onpick, onclose }: {
    title: string; items: any[]; selected?: string[]; actionLabel?: string; actionDisabled?: boolean;
    onaction?: () => void; onpick: (item: any) => void; onclose: () => void;
  } = $props();
  let query = $state('');
  const filtered = $derived(items.filter(item => itemName(item).toLowerCase().includes(query.toLowerCase())).slice(0, 300));
  function itemName(item: any) { return String(item?.name || item?.Name || item?.Move || item?.Ability || item); }
</script>

<div class="modal-overlay" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) onclose(); }}>
  <div class="modal-content" role="dialog" aria-modal="true" aria-label={title} style="max-width: 800px;">
    <h2 class="modal-title">{title}</h2>
    <div class="modal-search-bar"><input class="modal-search-input" bind:value={query} placeholder="Search…" />{#if onaction}<button type="button" class="edit-bn picker-source-toggle" disabled={actionDisabled} onclick={onaction}>{actionLabel}</button>{/if}</div>
    <div class="modal-info-box"><p class="modal-info-text"><strong>{filtered.length}</strong> item(s)</p></div>
    <div class="move-grid picker-grid">
      {#each filtered as item}
        {@const name = itemName(item)}
        <button type="button" class:exists={selected.includes(name)} class="modal-move-btn" onclick={() => onpick(item)}>
          <span class="move-btn-text">{name}{item.type ? ` — ${item.type}` : ''}{item.frequency ? ` — ${item.frequency}` : ''}</span>{#if selected.includes(name)}<span> ✓</span>{/if}
        </button>
      {:else}<div class="empty-grid-message">No result</div>{/each}
    </div>
    <div class="modal-buttons"><button type="button" class="modal-btn modal-btn-secondary" onclick={onclose}>Close</button></div>
  </div>
</div>

<style>.picker-grid { max-height: 60vh; overflow: auto; }.modal-move-btn { width: 100%; }.modal-search-bar { display:flex;gap:.5rem }.modal-search-input { flex:1 }.picker-source-toggle { white-space:nowrap }</style>
