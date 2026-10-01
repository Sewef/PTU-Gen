<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { parseTutorCost } from '../lib/pokemon';
  import PickerModal from './PickerModal.svelte';
  let { pokemon, onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  let picker = $state(false); let items = $state<any[]>([]); let loading = $state(false);
  const spent = $derived((pokemon.pokeEdges || []).reduce((sum, edge) => sum + parseTutorCost(edge.cost), 0));
  const remaining = $derived(Math.max(0, Number(pokemon.tutorPoints || 0) - spent));
  function normalize(edge: any, fallback = '') { return typeof edge === 'string' ? { name: fallback || edge, effect: edge } : { name: edge.name || edge.Name || edge.Edge || fallback, prerequisites: edge.prerequisites || edge.Prerequisites || edge.Requirements || '', cost: edge.cost || edge.Cost || edge.TutorPoints || '', effect: edge.effect || edge.Effect || edge.Description || '', note: edge.note || edge.Note || '' }; }
  function flatten(data: any): any[] { if (Array.isArray(data)) return data.map(value => normalize(value)).filter(value => value.name); const direct = data?.pokeEdges || data?.PokeEdges || data?.edges || data?.Edges; if (Array.isArray(direct)) return flatten(direct); const arrays = Object.values(data || {}).filter(Array.isArray); if (arrays.length) return arrays.flat().map(value => normalize(value)).filter(value => value.name); return Object.entries(data || {}).map(([name, value]) => normalize(value, name)).filter(value => value.name); }
  async function openPicker() { picker = true; loading = true; try { const response = await fetch('https://sewef.github.io/ptu/data/pokeedges/pokeedges_core.min.json'); if (!response.ok) throw new Error(response.statusText); items = flatten(await response.json()); } catch { items = []; } finally { loading = false; } }
  function pick(item: any) { const index = pokemon.pokeEdges!.findIndex(edge => edge.name === item.name); if (index >= 0) pokemon.pokeEdges!.splice(index, 1); else pokemon.pokeEdges!.push(item); onsave(); }
  function blank() { pokemon.pokeEdges!.push({ name: `Custom Poké Edge ${pokemon.pokeEdges!.length + 1}`, prerequisites: '', cost: '', effect: '', editable: true }); onsave(); }
  function remove(index: number) { pokemon.pokeEdges!.splice(index, 1); onsave(); }
</script>
<div class="section">
  <div class="flex-between-center-15"><h3 class="section-title">Poké Edges</h3><div class="button-group poke-edges-toolbar"><label class="tutor-points-control"><span>Tutor Points</span><span class="tutor-points-counter"><span title={`${spent} spent`}>{remaining}</span><span>/</span><input type="number" min="0" bind:value={pokemon.tutorPoints} onchange={onsave} /></span></label><button type="button" class="edit-bn" onclick={openPicker}>✎ Add</button><button type="button" class="edit-bn" onclick={blank}>+ Blank</button></div></div>
  <div class="section-list">{#each pokemon.pokeEdges || [] as edge, index}<article class="section-card poke-edge"><div class="section-card-header">{#if edge.editable}<input bind:value={edge.name} onchange={onsave} />{:else}<div class="section-card-name">{edge.name}</div>{/if}<button type="button" class="remove-poke-edge-btn" onclick={() => remove(index)}>✕ Remove</button></div>
    {#each ['prerequisites', 'cost', 'effect'] as field}{#if edge.editable}<label class="section-card-field"><strong>{field[0].toUpperCase() + field.slice(1)}:</strong><input bind:value={edge[field]} onchange={onsave} /></label>{:else if edge[field]}<div class="section-card-field"><strong>{field[0].toUpperCase() + field.slice(1)}:</strong> {edge[field]}</div>{/if}{/each}
  </article>{:else}<div class="empty-state compact">No Poké Edges yet.</div>{/each}</div>
</div>
{#if picker}<PickerModal title={loading ? 'Loading Poké Edges…' : 'Add Poké Edge'} {items} selected={(pokemon.pokeEdges || []).map(item => item.name)} onpick={pick} onclose={() => picker = false} />{/if}
