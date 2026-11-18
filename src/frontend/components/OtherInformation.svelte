<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';
  import { getNatures } from '../lib/api';
  import { natureUpdate } from '../lib/pokemon-editor';
  import { natureLabel, natureName } from '../lib/natures';
  import { calculateHp } from '../lib/pokemon';

  let { pokemon = $bindable(), initiallyOpen = false, onsave }: {
    pokemon: Pokemon;
    initiallyOpen?: boolean;
    onsave: () => void;
  } = $props();
  let open = $state(false);
  let natures = $state<any[]>([]);
  onMount(() => {
    open = initiallyOpen;
    void getNatures().then(result => natures = result.natures || []).catch(() => {});
  });

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

  function fieldLabel(key: string) {
    const labels: Record<string, string> = {
      sizeCategory: 'Size Category',
      hatchRate: 'Hatch Rate',
      eggGroups: 'Egg Groups',
      basicInformation: 'Basic Information',
      capabilityList: 'Capabilities'
    };
    return labels[key] || key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function changeGender(gender: string) {
    pokemon.gender = gender;
    pokemon.otherInfo ||= {};
    pokemon.otherInfo.gender = gender;
    onsave();
  }
</script>

<details class="info-box other-info-panel" bind:open>
  <summary class="advanced-toggle collapsible-info-summary"><span class="info-label">Other Information</span><span class="toggle-icon collapsible-info-chevron" aria-hidden="true">▼</span></summary>
  <div class="other-info-grid">
    <label class="info-value hp-formula-field" for="hpFormulaInput"><strong>HP Formula:</strong><input id="hpFormulaInput" aria-label="HP Formula" bind:value={pokemon.hpFormula} onchange={changeHpFormula} /></label>
    <label class="info-value nature-field" for="natureSelect"><strong>Nature:</strong><select id="natureSelect" class="nature-select" value={natureName(pokemon.nature) || 'Unknown'} onchange={(event) => changeNature(event.currentTarget.value)}>{#if !natures.length}<option>{natureName(pokemon.nature) || 'Unknown'}</option>{/if}{#each natures as nature}<option value={natureName(nature)}>{natureLabel(nature)}</option>{/each}</select></label>
    <div class="info-value other-info-gender"><strong>Gender:</strong> <select class="gender-select" value={pokemon.gender} onchange={(event) => changeGender(event.currentTarget.value)}><option>Unknown</option><option>Male</option><option>Female</option><option value="No Gender">Genderless</option></select></div>
    {#each Object.entries(pokemon.otherInfo || {}).filter(([key, value]) => key !== 'gender' && ['string','number'].includes(typeof value)) as [key, value]}
      <div class="info-value"><strong>{fieldLabel(key)}:</strong> <span>{String(value)}</span></div>
    {/each}
  </div>
</details>

<style>
  .hp-formula-field strong{flex-shrink:0}
  .hp-formula-field input{box-sizing:border-box;flex:1;width:100%;min-width:0;height:27px;padding:3px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.72rem}
  .hp-formula-field input:focus{border-color:var(--primary-color);outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .other-info-panel > summary{padding:6px 10px}
  .other-info-grid{display:grid;font-size:.8rem;line-height:1.25}
  .other-info-grid .info-value{display:flex;align-items:center;gap:5px;min-width:0;min-height:24px;margin:0;font-size:inherit}
  .other-info-grid .info-value > span{min-width:0;overflow-wrap:anywhere}
  .other-info-grid strong{font-weight:650}
  .other-info-gender .gender-select{width:auto;max-width:100%;min-height:24px;padding:2px 24px 2px 6px;font-size:inherit;line-height:1.25}
  .nature-field .nature-select{width:auto;min-width:0;max-width:100%;min-height:24px;padding:2px 24px 2px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font:inherit;line-height:1.25;cursor:pointer}
  .nature-select:focus{border-color:var(--primary-color);outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
</style>
