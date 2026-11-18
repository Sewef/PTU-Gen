<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { evade } from '../lib/stats';

  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  const categories = [
    { stat: 'def', label: 'Physical', source: 'Defense' },
    { stat: 'spD', label: 'Special', source: 'Special Defense' },
    { stat: 'spe', label: 'Speed', source: 'Speed' }
  ] as const;

  function changeBonus(value: number) {
    pokemon.evadeBonus = Number.isFinite(value) ? Math.trunc(value) : 0;
    onsave();
  }
</script>

<div class="evade-summary" role="group" aria-label="Evade">
  <div class="evade-header">
    <span class="info-label" title="Floor(total stat / 5), limited to 0–6, plus the general bonus. Total Evade is limited to 0–9.">Evade</span>
    <label class="evade-bonus">Bonus <input aria-label="General evade bonus" type="number" step="1" value={pokemon.evadeBonus ?? 0} onchange={(event) => changeBonus(Number(event.currentTarget.value))} /></label>
  </div>
  <div class="evade-values">
    {#each categories as category}
      {@const value = evade(pokemon, category.stat)}
      <div class="evade-value" title={`${category.source}: floor(total / 5), limited to 0–6. ${value.base} + (${value.bonus}) bonus; maximum 9.`}>
        <span>{category.label}</span><output aria-label={`${category.label} evade`}>{value.total}</output>
      </div>
    {/each}
  </div>
</div>

<style>
  .evade-summary{display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px;padding:9px 0 0;}
  .evade-header{display:flex;align-items:center;gap:10px}
  .evade-header .info-label{margin:0;font-size:.8rem}
  .evade-bonus{display:flex;align-items:center;gap:5px;margin:0;color:var(--text-secondary);font-size:.72rem}
  .evade-bonus input{box-sizing:border-box;width:48px;min-width:0;height:26px;margin:0;padding:2px 4px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font:inherit;text-align:center}
  .evade-bonus input:focus{border-color:var(--primary-color);outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .evade-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;flex:1;min-width:220px}
  .evade-value{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 7px;border-radius:4px;background:var(--bg-main);color:var(--text-secondary);font-size:.72rem}
  .evade-value output{color:var(--text-primary);font-size:.9rem;font-weight:750;font-variant-numeric:tabular-nums}
</style>
