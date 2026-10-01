<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { ALL_TYPES, hasNuclearType, pokemonTypes, slug } from '../lib/pokemon';

  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  let editing = $state(false);
  let draft = $state<string[]>([]);
  const displayed = $derived(pokemonTypes(pokemon));
  const availableTypes = $derived([...ALL_TYPES, ...(hasNuclearType(pokemon) ? ['Nuclear'] : [])]);

  function open() {
    draft = [...displayed];
    editing = true;
  }
  function toggle(type: string) {
    draft = draft.includes(type) ? draft.filter(value => value !== type) : [...draft, type];
  }
  function save() {
    if (!draft.length) return;
    pokemon.actualTypes = [...draft];
    pokemon.types = [...draft];
    editing = false;
    onsave();
  }
</script>

<div class="info-box pokemon-info-row pokemon-types-row">
  <span class="info-label">Type(s)</span>
  <div class="pokemon-types-content"><div class="types">{#each displayed as type}<span class="type-badge type-{slug(type)}">{type}</span>{/each}</div><button type="button" class="edit-bn" onclick={open}>✎ Edit</button></div>
</div>

{#if editing}
  <div class="modal-overlay" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) editing = false; }}>
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="Select Types">
      <h2 class="modal-title">Select Types</h2>
      <div class="modal-info-box"><p>Selected types: <span class="types">{#each draft as type}<span class="type-badge type-{slug(type)}">{type}</span>{:else}<span class="text-tertiary">None</span>{/each}</span></p></div>
      <div class="modal-grid type-picker">{#each availableTypes as type}<button type="button" class="type-badge type-choice type-{slug(type)}" class:selected={draft.includes(type)} aria-pressed={draft.includes(type)} onclick={() => toggle(type)}>{type}</button>{/each}</div>
      <div class="modal-buttons"><button type="button" class="modal-btn modal-btn-primary" disabled={!draft.length} onclick={save}>Save</button><button type="button" class="modal-btn modal-btn-secondary" onclick={() => editing = false}>Cancel</button></div>
    </div>
  </div>
{/if}

<style>
  .type-picker{grid-template-columns:repeat(auto-fit,minmax(80px,1fr))}
  .type-choice{padding:8px 12px;border:2px solid transparent;cursor:pointer;font-weight:600;opacity:.55;transition:opacity .2s,border-color .2s,transform .2s}
  .type-choice.selected{border-color:var(--text-primary);opacity:1;transform:translateY(-1px)}
</style>
