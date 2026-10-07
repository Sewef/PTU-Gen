<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { slug } from '../lib/pokemon';
  import { attackingTypes, typeEffectiveness } from '../lib/type-effectiveness';
  let { pokemon, selected = 'typeless', onselect, onsave }: { pokemon: Pokemon; selected?: string; onselect: (type: string) => void; onsave: () => void } = $props();
  let editing = $state(false);
  const options = [0, .25, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
  const displayedTypes = $derived(attackingTypes(pokemon));
  const effectiveness = $derived(typeEffectiveness(pokemon));
  function change(type: string, value: number) { pokemon.typeEffectivenessOverrides ||= {}; pokemon.typeEffectivenessOverrides[type] = value; onsave(); }
  function effClass(value: number) { if (value === 0) return 'eff-immune'; if (value <= .25) return 'eff-strong-resist'; if (value <= .5) return 'eff-resist'; if (value === 1) return 'eff-neutral'; if (value <= 2) return 'eff-weak'; return 'eff-strong-weak'; }
  function selectWithKeyboard(event: KeyboardEvent, type: string) {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    onselect(type);
  }
</script>
<div class="info-box">
  <div class="type-effectiveness-header"><div class="info-label">Type Effectiveness</div><button type="button" class="edit-bn" onclick={() => editing = !editing}>{editing ? 'Done' : '✎ Edit'}</button></div>
  <div class="type-effectiveness-grid">
    {#each displayedTypes as type}
      {@const key = type.toLowerCase()}{@const value = Number(effectiveness[key] ?? 1)}
      <div class="details-table-type-cell type-effectiveness-item" class:damage-type-selected-top={selected === key} role="button" tabindex="0" aria-label={`Use ${type} for incoming damage`} aria-pressed={selected === key} onclick={() => onselect(key)} onkeydown={(event) => selectWithKeyboard(event, key)}>
        <span class="type-badge type-badge-table type-{slug(type)}">{type}</span>
        {#if editing}<select class="type-effectiveness-select" aria-label={`${type} effectiveness`} value={value} onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()} onchange={(event) => change(key, Number(event.currentTarget.value))}>{#each options as option}<option value={option}>{option}x</option>{/each}</select>{:else}<span class="type-eff-value-cell {effClass(value)}">{value}x</span>{/if}
      </div>
    {/each}
  </div>
</div>
