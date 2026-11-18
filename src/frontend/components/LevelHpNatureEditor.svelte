<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { calculateHp } from '../lib/pokemon';
  import { levelUpdate } from '../lib/pokemon-editor';
  import IncomingDamage from './IncomingDamage.svelte';

  let { pokemon = $bindable(), damageType = $bindable('typeless'), onsave }: {
    pokemon: Pokemon;
    damageType: string;
    onsave: () => void;
  } = $props();

  function changeLevel() {
    Object.assign(pokemon, levelUpdate(pokemon, pokemon.level));
    onsave();
  }
  function changeHpFormula() {
    pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
    onsave();
  }
</script>

<div class="info-box pokemon-info-row level-hp-info-row">
  <span class="info-label">Level &amp; HP</span>
  <div class="level-hp-content">
    <div class="level-hp-fields">
      <label class="level-hp-field level-field"><span>Level</span><input class="level-input" aria-label="Level" type="number" min="1" max="100" bind:value={pokemon.level} onchange={changeLevel} /></label>
      <label class="level-hp-field"><span>Current HP</span><input id="hpCurrentInput" aria-label="Current HP" class="hp-current-input" type="number" bind:value={pokemon.hitPoints} onchange={onsave} /></label>
      <label class="level-hp-field"><span>Max HP</span><input aria-label="Maximum HP" class="hp-max-input" type="number" min="1" bind:value={pokemon.hitPointsMax} onchange={onsave} /></label>
    </div>
    <label class="hp-formula-field" for="hpFormulaInput"><span>Formula</span><input id="hpFormulaInput" aria-label="HP Formula" bind:value={pokemon.hpFormula} onchange={changeHpFormula} /></label>
  </div>
</div>
<IncomingDamage bind:pokemon bind:damageType {onsave} />

<style>
  .level-hp-content{display:grid;gap:7px;width:100%;min-width:0}
  .level-hp-fields{display:grid;grid-template-columns:minmax(54px,.65fr) repeat(2,minmax(72px,1fr));gap:6px;align-items:end}
  .level-hp-field{display:grid;gap:3px;min-width:0;color:var(--text-secondary);font-size:.67rem;font-weight:700;line-height:1}
  .level-hp-field input,.hp-formula-field input{box-sizing:border-box;width:100%;min-width:0;height:29px;padding:4px 7px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font:inherit}
  .level-hp-field input{text-align:center;font-size:.78rem;font-weight:700}
  .level-hp-field input:focus,.hp-formula-field input:focus{border-color:var(--primary-color);outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .hp-formula-field{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:7px;color:var(--text-secondary);font-size:.67rem;font-weight:700}
  .hp-formula-field input{height:27px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.72rem;font-weight:500}
  @media(max-width:360px){.level-hp-fields{grid-template-columns:minmax(50px,.6fr) repeat(2,minmax(64px,1fr));gap:4px}.level-hp-field input{padding-inline:4px}}
</style>
