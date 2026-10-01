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
      <div class="info-value"><strong>{fieldLabel(key)}:</strong> {String(value)}</div>
    {/each}
  </div>
</details>

<style>
  .other-info-grid{padding:1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem}
  .other-info-gender{font-size:1.1em}
</style>
