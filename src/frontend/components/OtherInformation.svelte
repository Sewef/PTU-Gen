<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';

  let { pokemon = $bindable(), initiallyOpen = true, onsave }: {
    pokemon: Pokemon;
    initiallyOpen?: boolean;
    onsave: () => void;
  } = $props();
  let open = $state(false);
  onMount(() => open = initiallyOpen);

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
    <div class="info-value other-info-gender"><strong>Gender:</strong> <select class="gender-select" value={pokemon.gender} onchange={(event) => changeGender(event.currentTarget.value)}><option>Unknown</option><option>Male</option><option>Female</option><option value="No Gender">Genderless</option></select></div>
    {#each Object.entries(pokemon.otherInfo || {}).filter(([key, value]) => key !== 'gender' && ['string','number'].includes(typeof value)) as [key, value]}
      <div class="info-value"><strong>{fieldLabel(key)}:</strong> <span>{String(value)}</span></div>
    {/each}
  </div>
</details>

<style>
  .other-info-panel > summary{padding:6px 10px}
  .other-info-grid{display:grid;font-size:.8rem;line-height:1.25}
  .other-info-grid .info-value{display:flex;align-items:center;gap:5px;min-width:0;min-height:24px;margin:0;font-size:inherit}
  .other-info-grid .info-value > span{min-width:0;overflow-wrap:anywhere}
  .other-info-grid strong{font-weight:650}
  .other-info-gender .gender-select{width:auto;max-width:100%;min-height:24px;padding:2px 24px 2px 6px;font-size:inherit;line-height:1.25}
</style>
