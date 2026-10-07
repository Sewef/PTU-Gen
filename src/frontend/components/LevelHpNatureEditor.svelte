<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';
  import { calculateHp } from '../lib/pokemon';
  import { getNatures } from '../lib/api';
  import { levelUpdate, natureUpdate } from '../lib/pokemon-editor';
  import { natureLabel, natureName } from '../lib/natures';
  import IncomingDamage from './IncomingDamage.svelte';

  let { pokemon = $bindable(), damageType = $bindable('typeless'), onsave }: {
    pokemon: Pokemon;
    damageType: string;
    onsave: () => void;
  } = $props();
  let natures = $state<any[]>([]);

  onMount(() => {
    void getNatures().then(result => natures = result.natures || []).catch(() => {});
  });

  function changeLevel() {
    Object.assign(pokemon, levelUpdate(pokemon, pokemon.level));
    onsave();
  }
  function changeNature(name: string) {
    const nature = natures.find(item => natureName(item) === name);
    if (!nature) return;
    Object.assign(pokemon, natureUpdate(pokemon, nature, (globalThis as any).PTUStatCalc));
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
<div class="info-box pokemon-info-row nature-info-row">
  <span class="info-label">Nature</span>
  <div class="nature-content"><label class="nature-field" for="natureSelect"><span>Selected nature</span><select id="natureSelect" class="nature-select" value={natureName(pokemon.nature) || 'Unknown'} onchange={(event) => changeNature(event.currentTarget.value)}>{#if !natures.length}<option>{natureName(pokemon.nature) || 'Unknown'}</option>{/if}{#each natures as nature}<option value={natureName(nature)}>{natureLabel(nature)}</option>{/each}</select></label></div>
</div>

<style>
  .level-hp-content{display:grid;gap:7px;width:100%;min-width:0}
  .level-hp-fields{display:grid;grid-template-columns:minmax(54px,.65fr) repeat(2,minmax(72px,1fr));gap:6px;align-items:end}
  .level-hp-field,.nature-field{display:grid;gap:3px;min-width:0;color:var(--text-secondary);font-size:.67rem;font-weight:700;line-height:1}
  .level-hp-field input,.hp-formula-field input,.nature-field select{box-sizing:border-box;width:100%;min-width:0;height:29px;padding:4px 7px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font:inherit}
  .level-hp-field input{text-align:center;font-size:.78rem;font-weight:700}
  .level-hp-field input:focus,.hp-formula-field input:focus,.nature-field select:focus{border-color:var(--primary-color);outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .hp-formula-field{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:7px;color:var(--text-secondary);font-size:.67rem;font-weight:700}
  .hp-formula-field input{height:27px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.72rem;font-weight:500}
  .nature-content{width:100%;min-width:0}
  .nature-field select{font-size:.78rem;font-weight:600;cursor:pointer}
  @media(max-width:360px){.level-hp-fields{grid-template-columns:minmax(50px,.6fr) repeat(2,minmax(64px,1fr));gap:4px}.level-hp-field input{padding-inline:4px}}
</style>
