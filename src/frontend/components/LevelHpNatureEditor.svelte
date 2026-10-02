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
  <div class="level-hp-wrapper"><input class="level-input" aria-label="Level" type="number" min="1" max="100" bind:value={pokemon.level} onchange={changeLevel} /><input id="hpCurrentInput" aria-label="Current HP" class="hp-current-input" type="number" bind:value={pokemon.hitPoints} onchange={onsave} /><span>/</span><input aria-label="Maximum HP" class="hp-max-input" type="number" min="1" bind:value={pokemon.hitPointsMax} onchange={onsave} /></div>
  <div class="margin-top-8"><input id="hpFormulaInput" aria-label="HP Formula" class="skill-input" bind:value={pokemon.hpFormula} onchange={changeHpFormula} /></div>
</div>
<IncomingDamage bind:pokemon bind:damageType {onsave} />
<div class="info-box pokemon-info-row nature-info-row">
  <label class="info-label" for="natureSelect">Nature</label>
  <div class="nature-control"><select id="natureSelect" class="nature-select" value={natureName(pokemon.nature) || 'Unknown'} onchange={(event) => changeNature(event.currentTarget.value)}>{#if !natures.length}<option>{natureName(pokemon.nature) || 'Unknown'}</option>{/if}{#each natures as nature}<option value={natureName(nature)}>{natureLabel(nature)}</option>{/each}</select></div>
</div>

<style>
  .level-hp-wrapper{display:flex;gap:.35rem;align-items:center}.level-hp-wrapper input{width:5rem}
</style>
