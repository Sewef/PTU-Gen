<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { availableAbilities, allAbilities } from '../lib/api';
  import { frequencyUses } from '../lib/pokemon';
  import PickerModal from './PickerModal.svelte';
  let { pokemon, onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  let picker = $state(false);
  let items = $state<any[]>([]);
  let loading = $state(false);
  let globalList = $state(false);
  function flatten(value: any): any[] { return Array.isArray(value) ? value : Object.values(value || {}).filter(Array.isArray).flat() as any[]; }
  async function loadPickerItems(all = false) { loading = true; try { items = flatten(all ? await allAbilities(pokemon) : await availableAbilities(pokemon)); globalList = all; } finally { loading = false; } }
  async function openPicker() { picker = true; await loadPickerItems(false); }
  function pick(item: any) {
    pokemon.abilities!.push({ ...item, usageCount: 0 }); onsave();
  }
  function blank() { pokemon.abilities!.push({ name: `Custom Ability ${pokemon.abilities!.length + 1}`, frequency: '', effect: '', usageCount: 0, editable: true }); onsave(); }
  function remove(index: number) { pokemon.abilities!.splice(index, 1); onsave(); }
  function usage(ability: any, index: number) { ability.usageCount = ability.usageCount === index + 1 ? index : index + 1; onsave(); }
  const internalFields = new Set(['name', 'editable', 'usageCount', 'sourceTier', 'sourceSlot', 'table']);
  const fieldOrder = ['frequency', 'trigger', 'target', 'effect', 'bonus', 'special', 'note'];
  function hasValue(value: any) { return value !== undefined && value !== null && value !== ''; }
  function displayFields(ability: any) {
    const entries = Object.entries(ability || {}).filter(([key, value]) => !internalFields.has(key) && hasValue(value));
    return entries.sort(([left], [right]) => {
      const leftIndex = fieldOrder.indexOf(left);
      const rightIndex = fieldOrder.indexOf(right);
      return (leftIndex < 0 ? fieldOrder.length : leftIndex) - (rightIndex < 0 ? fieldOrder.length : rightIndex);
    });
  }
  function additionalEditableFields(ability: any) { return displayFields(ability).filter(([key]) => !['frequency', 'effect'].includes(key)); }
  function fieldLabel(key: string) {
    const label = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
    return label.replace(/\b\w/g, character => character.toUpperCase());
  }
  function fieldValue(value: any) {
    if (Array.isArray(value) && value.every(item => item === null || ['string', 'number', 'boolean'].includes(typeof item))) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
  function hasRowsTable(table: any) { return Array.isArray(table?.rows) && table.rows.length > 0; }
</script>

<div class="section">
  <div class="section-header"><h3 class="section-title">🎯 Abilities</h3><div class="button-group"><button type="button" class="edit-bn" onclick={openPicker}>✎ Edit</button><button type="button" class="edit-bn" onclick={blank}>+ Blank</button></div></div>
  <div class="section-list">
    {#each pokemon.abilities || [] as ability, index}
      <article class="section-card">
        <div class="section-card-header">{#if ability.editable}<input class="custom-ability-name-input" bind:value={ability.name} onchange={onsave} />{:else}<div class="section-card-name">{ability.name}</div>{/if}<button type="button" class="remove-ability-btn" onclick={() => remove(index)}>✕ Remove</button></div>
        {#if ability.sourceSlot}<div class="section-card-field ability-source-slot"><strong>Slot:</strong> {ability.sourceSlot}</div>{/if}
        {#if ability.editable}
          <label class="section-card-field"><strong>Frequency:</strong><input bind:value={ability.frequency} onchange={onsave} /></label>
          <label class="section-card-field"><strong>Effect:</strong><textarea bind:value={ability.effect} onchange={onsave}></textarea></label>
          {#each additionalEditableFields(ability) as [key, value]}
            <div class="section-card-field ability-extra-field"><strong>{fieldLabel(key)}:</strong> <span class:structured-value={typeof value === 'object'}>{fieldValue(value)}</span></div>
          {/each}
        {:else}
          {#each displayFields(ability) as [key, value]}
            <div class="section-card-field ability-property" class:note={key === 'note'}><strong>{fieldLabel(key)}:</strong> <span class:structured-value={typeof value === 'object'}>{fieldValue(value)}</span></div>
          {/each}
        {/if}
        {#if hasRowsTable(ability.table)}
          <div class="ability-table-wrap"><table class="ability-table"><thead><tr>{#each ability.table.rows[0] as header}<th>{header}</th>{/each}</tr></thead><tbody>{#each ability.table.rows.slice(1) as row}<tr>{#each row as value}<td>{value}</td>{/each}</tr>{/each}</tbody></table></div>
        {:else if hasValue(ability.table)}
          <div class="section-card-field ability-property"><strong>Table:</strong> <span class="structured-value">{fieldValue(ability.table)}</span></div>
        {/if}
        {#if ability.frequency}<div class="usage-tracker"><span class="usage-label">Uses:</span><div class="usage-boxes">{#each Array(frequencyUses(ability.frequency)) as _, use}<button type="button" aria-label={`Use ${use + 1}`} class:checked={(ability.usageCount || 0) > use} class="usage-checkbox" onclick={() => usage(ability, use)}></button>{/each}</div></div>{/if}
      </article>
    {:else}<div class="empty-state compact">No abilities yet.</div>{/each}
  </div>
</div>
{#if picker}<PickerModal title={loading ? 'Loading abilities…' : globalList ? 'Add Ability — Global List' : 'Add Ability — Species List'} {items} selected={(pokemon.abilities || []).map(item => item.name)} actionLabel={globalList ? 'Show species abilities' : 'Search all abilities'} actionDisabled={loading} onaction={() => loadPickerItems(!globalList)} onpick={pick} onclose={() => picker = false} />{/if}

<style>
  .structured-value { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
