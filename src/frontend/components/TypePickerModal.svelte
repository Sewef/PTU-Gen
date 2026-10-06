<script lang="ts">
  import { slug } from '../lib/pokemon';

  let { title = 'Select Type', types, selected = [], multiple = false, onsave, onclose }: {
    title?: string;
    types: string[];
    selected?: string[];
    multiple?: boolean;
    onsave: (types: string[]) => void;
    onclose: () => void;
  } = $props();
  let draft = $state([...selected]);

  function toggle(type: string) {
    if (!multiple) {
      draft = [type];
      return;
    }
    draft = draft.includes(type) ? draft.filter(value => value !== type) : [...draft, type];
  }
</script>

<div class="modal-overlay" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) onclose(); }}>
  <div class="modal-content" role="dialog" aria-modal="true" aria-label={title}>
    <h2 class="modal-title">{title}</h2>
    <div class="modal-info-box"><p>Selected type{multiple ? 's' : ''}: <span class="types">{#each draft as type}<span class="type-badge type-{slug(type)}">{type}</span>{:else}<span class="text-tertiary">None</span>{/each}</span></p></div>
    <div class="modal-grid type-picker">{#each types as type}<button type="button" class="type-badge type-choice type-{slug(type)}" class:selected={draft.includes(type)} aria-pressed={draft.includes(type)} onclick={() => toggle(type)}>{type}</button>{/each}</div>
    <div class="modal-buttons"><button type="button" class="modal-btn modal-btn-primary" disabled={!draft.length} onclick={() => onsave(draft)}>Save</button><button type="button" class="modal-btn modal-btn-secondary" onclick={onclose}>Cancel</button></div>
  </div>
</div>

<style>
  .type-picker{grid-template-columns:repeat(auto-fit,minmax(80px,1fr))}
  .type-choice{padding:8px 12px;border:2px solid transparent;cursor:pointer;font-weight:600;opacity:.55;transition:opacity .2s,border-color .2s,transform .2s}
  .type-choice.selected{border-color:var(--text-primary);opacity:1;transform:translateY(-1px)}
</style>
