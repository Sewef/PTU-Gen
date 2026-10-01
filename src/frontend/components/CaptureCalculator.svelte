<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';
  let { pokemon, onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  const state = $derived(pokemon.captureState!);
  let evolutionStages = $state(0);
  let panelOpen = $state(new URLSearchParams(location.search).get('embedded') !== 'true');
  function stopSummaryToggle(node: HTMLElement) {
    const stop = (event: MouseEvent) => event.stopPropagation();
    node.addEventListener('click', stop);
    return { destroy: () => node.removeEventListener('click', stop) };
  }
  onMount(() => {
    void fetch(`/api/pokemon/evolutions/${encodeURIComponent(pokemon.name)}?dataset=${pokemon.dataset || 'core'}`)
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) evolutionStages = Number(data.evolutionsRemaining) || 0; })
      .catch(() => {});
  });
  const hpPercent = $derived((Number(pokemon.hitPoints) / Math.max(1, Number(pokemon.hitPointsMax))) * 100);
  const standard = $derived.by(() => {
    if (Number(pokemon.hitPoints) <= 0) return 0;
    let rate = 100 - pokemon.level * 2;
    rate += pokemon.hitPoints === 1 ? 30 : hpPercent <= 25 ? 15 : hpPercent <= 50 ? 0 : hpPercent <= 75 ? -15 : -30;
    rate += (Number(state.standardCounts.persistent) || 0) * 10 + (Number(state.standardCounts.injuries) || 0) * 5;
    rate += evolutionStages === 2 ? 10 : evolutionStages === 1 ? 0 : -10;
    if (state.standardFlags.frozen) rate += 10; if (state.standardFlags.asleep) rate += 10; if (state.standardFlags.slow) rate += 5;
    if (pokemon.shiny) rate -= 10; if (pokemon.legendary) rate -= 30;
    return Math.max(0, rate);
  });
  const errata = $derived.by(() => {
    let boxes = (hpPercent <= 50 ? 1 : 0) + (hpPercent <= 25 ? 1 : 0);
    boxes += state.errataFlags.status ? 1 : 0; boxes += evolutionStages === 1 || state.errataFlags.evo1 ? 1 : 0; boxes += evolutionStages === 2 || state.errataFlags.evo2 ? 2 : 0; boxes += state.errataFlags.injuries5 ? 2 : 0;
    return Math.max(0, 10 + Math.floor(pokemon.level / 10) + (Number(state.rarityBonus) || 0) - boxes * 2);
  });
  const base = $derived(state.useErrata ? 10 + Math.floor(pokemon.level / 10) : 100 - pokemon.level * 2);
</script>
<details class="info-box capture-rate-panel" bind:open={panelOpen}>
  <summary class="advanced-toggle capture-rate-panel-summary">
    <span class="capture-rate-heading"><span class="info-label">Capture Rate</span><label class="capture-rate-mode-toggle capture-rate-mode-toggle-header" use:stopSummaryToggle><input type="checkbox" bind:checked={state.useErrata} onchange={onsave} /><span>Use September 2015 errata</span></label></span>
    <span class="capture-rate-display"><span class="capture-rate-value">Base <strong>{base}</strong></span><span class="capture-rate-value capture-rate-current">Current <strong>{state.useErrata ? errata : standard}</strong></span></span>
    <span class="toggle-icon capture-rate-chevron" aria-hidden="true">▼</span>
  </summary>
  <div class="capture-rate-panel-body">
    {#if state.useErrata}
      <div class="errata-container"><label class="errata-row"><input type="checkbox" bind:checked={state.errataFlags.status} onchange={onsave} /> Persistent or volatile status?</label><label class="errata-row"><input type="checkbox" bind:checked={state.errataFlags.evo1} onchange={onsave} /> One evolution remaining?</label><label class="errata-row"><input type="checkbox" bind:checked={state.errataFlags.evo2} onchange={onsave} /> Two evolutions remaining?</label><label class="errata-row"><input type="checkbox" bind:checked={state.errataFlags.injuries5} onchange={onsave} /> Five or more injuries?</label><label class="errata-row">Rarity bonus <input class="errata-rarity-input" type="number" min="0" max="20" bind:value={state.rarityBonus} onchange={onsave} /></label></div>
    {:else}
      <div class="capture-rate-modifiers"><div class="modifiers-grid"><label class="modifier-item">Persistent statuses <input class="status-count-input-standard" type="number" min="0" bind:value={state.standardCounts.persistent} onchange={onsave} /></label><label class="modifier-item">Injuries <input class="status-count-input-standard" type="number" min="0" bind:value={state.standardCounts.injuries} onchange={onsave} /></label><label class="modifier-item"><input type="checkbox" bind:checked={state.standardFlags.frozen} onchange={onsave} /> Frozen</label><label class="modifier-item"><input type="checkbox" bind:checked={state.standardFlags.asleep} onchange={onsave} /> Asleep</label><label class="modifier-item"><input type="checkbox" bind:checked={state.standardFlags.slow} onchange={onsave} /> Slow</label></div></div>
    {/if}
  </div>
</details>
