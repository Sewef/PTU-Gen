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
        {:else}
          {#if ability.frequency}<div class="section-card-field"><strong>Frequency:</strong> {ability.frequency}</div>{/if}
          {#if ability.trigger}<div class="section-card-field"><strong>Trigger:</strong> {ability.trigger}</div>{/if}
          {#if ability.effect}<div class="section-card-field"><strong>Effect:</strong> {ability.effect}</div>{/if}
          {#if ability.bonus}<div class="section-card-field"><strong>Bonus:</strong> {ability.bonus}</div>{/if}
          {#if ability.special}<div class="section-card-field"><strong>Special:</strong> {ability.special}</div>{/if}
          {#if Array.isArray(ability.table?.rows) && ability.table.rows.length > 1}
            <div class="ability-table-wrap"><table class="ability-table"><thead><tr>{#each ability.table.rows[0] as header}<th>{header}</th>{/each}</tr></thead><tbody>{#each ability.table.rows.slice(1) as row}<tr>{#each row as value}<td>{value}</td>{/each}</tr>{/each}</tbody></table></div>
          {/if}
          {#if ability.note}<div class="section-card-field note"><strong>Note:</strong> {ability.note}</div>{/if}
        {/if}
        {#if ability.frequency}<div class="usage-tracker"><span class="usage-label">Uses:</span><div class="usage-boxes">{#each Array(frequencyUses(ability.frequency)) as _, use}<button type="button" aria-label={`Use ${use + 1}`} class:checked={(ability.usageCount || 0) > use} class="usage-checkbox" onclick={() => usage(ability, use)}></button>{/each}</div></div>{/if}
      </article>
    {:else}<div class="empty-state compact">No abilities yet.</div>{/each}
  </div>
</div>
{#if picker}<PickerModal title={loading ? 'Loading abilities…' : globalList ? 'Add Ability — Global List' : 'Add Ability — Species List'} {items} selected={(pokemon.abilities || []).map(item => item.name)} actionLabel={globalList ? 'Show species abilities' : 'Search all abilities'} actionDisabled={loading} onaction={() => loadPickerItems(!globalList)} onpick={pick} onclose={() => picker = false} />{/if}
