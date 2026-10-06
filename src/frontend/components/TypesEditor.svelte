<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { pokemonTypes, selectableTypes, slug } from '../lib/pokemon';
  import TypePickerModal from './TypePickerModal.svelte';

  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  let editing = $state(false);
  const displayed = $derived(pokemonTypes(pokemon));
  const availableTypes = $derived(selectableTypes(pokemon));

  function open() {
    editing = true;
  }
  function save(types: string[]) {
    pokemon.actualTypes = [...types];
    pokemon.types = [...types];
    editing = false;
    onsave();
  }
</script>

<div class="info-box pokemon-info-row pokemon-types-row">
  <span class="info-label">Type(s)</span>
  <div class="pokemon-types-content"><div class="types">{#each displayed as type}<span class="type-badge type-{slug(type)}">{type}</span>{/each}</div><button type="button" class="edit-bn" onclick={open}>✎ Edit</button></div>
</div>

{#if editing}
  <TypePickerModal title="Select Types" types={availableTypes} selected={displayed} multiple onsave={save} onclose={() => editing = false} />
{/if}
