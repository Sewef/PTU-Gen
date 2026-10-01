<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';
  import { errataCaptureBreakdown, standardCaptureBreakdown } from '../lib/capture-rate';

  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  const state = $derived(pokemon.captureState!);
  let evolutionStages = $state(0);
  let panelOpen = $state(new URLSearchParams(location.search).get('embedded') !== 'true');

  function stopSummaryToggle(node: HTMLElement) {
    const stop = (event: MouseEvent) => event.stopPropagation();
    node.addEventListener('click', stop);
    return { destroy: () => node.removeEventListener('click', stop) };
  }

  onMount(() => {
    state.standardCounts ||= {};
    state.standardFlags ||= {};
    state.errataFlags ||= {};
    state.errataFlags.evo2 ??= state.errataFlags.evo2a || false;
    state.errataFlags.injuries5 ??= state.errataFlags.injuries5a || false;
    void fetch(`/api/pokemon/evolutions/${encodeURIComponent(pokemon.name)}?dataset=${pokemon.dataset || 'core'}`)
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) evolutionStages = Number(data.evolutionsRemaining) || 0; })
      .catch(() => {});
  });

  const standard = $derived(standardCaptureBreakdown(pokemon, evolutionStages));
  const errata = $derived(errataCaptureBreakdown(pokemon));
  const base = $derived(state.useErrata ? errata.base : standard.base);
  const current = $derived(state.useErrata ? errata.current : standard.current);
  const signed = (value: number) => value >= 0 ? `+${value}` : String(value);
</script>

<details class="info-box capture-rate-panel" bind:open={panelOpen}>
  <summary class="advanced-toggle capture-rate-panel-summary">
    <span class="capture-rate-heading"><span class="info-label">Capture Rate</span><label class="capture-rate-mode-toggle capture-rate-mode-toggle-header" use:stopSummaryToggle><input type="checkbox" bind:checked={state.useErrata} onchange={onsave} /><span>Use September 2015 errata</span></label></span>
    <span class="capture-rate-display"><span class="capture-rate-value">Base <strong>{base}</strong></span><span class="capture-rate-value capture-rate-current">Current <strong class:capture-rate-warning={!state.useErrata && !standard.capturable} title={!state.useErrata && !standard.capturable ? 'Cannot capture a Pokémon at 0 HP' : ''}>{!state.useErrata && !standard.capturable ? '0 HP' : current}</strong></span></span>
    <span class="toggle-icon capture-rate-chevron" aria-hidden="true">▼</span>
  </summary>
  <div class="capture-rate-panel-body">
    {#if state.useErrata}
      <div class="capture-formula">Base {errata.base} + rarity {signed(errata.rarity)} − {errata.boxes} checked boxes × 2 = <strong>{errata.current}</strong></div>
      <div class="errata-container">
        <div class="errata-row automatic"><input class="errata-checkbox" type="checkbox" checked={errata.hp50} disabled /><span class="errata-row-text">At or under 50% HP? <strong>−2</strong></span></div>
        <div class="errata-row automatic"><input class="errata-checkbox" type="checkbox" checked={errata.hp25} disabled /><span class="errata-row-text">At or under 25% HP? <strong>−2</strong></span></div>
        <label class="errata-row"><span class="errata-checkbox-group"><input class="errata-checkbox" type="checkbox" bind:checked={state.errataFlags.evo2} onchange={onsave} /><input class="errata-checkbox" type="checkbox" checked={state.errataFlags.evo2} disabled /></span><span class="errata-row-text">Exactly 2 evolution stages? <span class="errata-hint">(counts as 2, −4)</span></span></label>
        <label class="errata-row"><input class="errata-checkbox" type="checkbox" bind:checked={state.errataFlags.status} onchange={onsave} /><span class="errata-row-text">Persistent or Volatile Status? <strong>−2</strong></span></label>
        <label class="errata-row"><span class="errata-checkbox-group"><input class="errata-checkbox" type="checkbox" bind:checked={state.errataFlags.injuries5} onchange={onsave} /><input class="errata-checkbox" type="checkbox" checked={state.errataFlags.injuries5} disabled /></span><span class="errata-row-text">5 or more Injuries? <span class="errata-hint">(counts as 2, −4)</span></span></label>
        <label class="errata-row"><input class="errata-checkbox" type="checkbox" bind:checked={state.errataFlags.evo1} onchange={onsave} /><span class="errata-row-text">Exactly 1 evolution stage remaining? <strong>−2</strong></span></label>
        <div class="errata-row errata-rarity-row"><span class="errata-rarity-symbol">+</span><label class="errata-rarity-control"><span class="errata-row-text">Rarity Bonus:</span><input class="errata-rarity-input" type="number" min="0" max="20" bind:value={state.rarityBonus} onchange={onsave} /></label></div>
      </div>
    {:else}
      <div class="capture-formula">Base {standard.base} {signed(standard.hp)} HP {signed(standard.evolution)} evolution{#if standard.shiny} {signed(standard.shiny)} shiny{/if}{#if standard.legendary} {signed(standard.legendary)} legendary{/if} + conditions = <strong>{standard.capturable ? standard.current : 'Cannot capture'}</strong></div>
      <div class="capture-rate-modifiers"><div class="modifiers-grid">
        <div class="modifier-item" title="Based on current HP percentage"><span class="modifier-label">HP</span><span class="modifier-value">{signed(standard.hp)}</span></div>
        <div class="modifier-item" title={String(evolutionStages) + ' evolutionary stages remaining'}><span class="modifier-label">Evolution</span><span class="modifier-value">{signed(standard.evolution)}</span></div>
        {#if pokemon.shiny}<div class="modifier-item"><span class="modifier-label">Shiny</span><span class="modifier-value">−10</span></div>{/if}
        {#if pokemon.legendary}<div class="modifier-item"><span class="modifier-label">Legendary</span><span class="modifier-value">−30</span></div>{/if}
        <div class="modifier-item"><label><span class="modifier-label" title="Persistent Conditions: +10 each">Persistent</span><input class="status-count-input-standard" type="number" min="0" bind:value={state.standardCounts.persistent} onchange={onsave} /><span class="status-multiplier-text">× 10 = <strong>{signed(standard.persistent)}</strong></span></label></div>
        <div class="modifier-item"><label><span class="modifier-label" title="Injuries/Volatile: +5 each">Injuries</span><input class="status-count-input-standard" type="number" min="0" bind:value={state.standardCounts.injuries} onchange={onsave} /><span class="status-multiplier-text">× 5 = <strong>{signed(standard.injuries)}</strong></span></label></div>
        <div class="modifier-item"><label><input type="checkbox" bind:checked={state.standardFlags.stuck} onchange={onsave} /><span>Stuck: <strong>+10</strong></span></label></div>
        <div class="modifier-item"><label><input type="checkbox" bind:checked={state.standardFlags.slow} onchange={onsave} /><span>Slow: <strong>+5</strong></span></label></div>
      </div></div>
    {/if}
  </div>
</details>

<style>
  .capture-formula{margin-bottom:7px;padding:6px 8px;border-left:3px solid var(--primary-color);border-radius:4px;background:var(--bg-tertiary);color:var(--text-secondary);font-size:.76rem;line-height:1.35}
  .capture-formula strong{color:var(--primary-color)}
  .errata-row.automatic{cursor:default}
  .errata-row-text strong,.status-multiplier-text strong{color:var(--primary-color)}
</style>
