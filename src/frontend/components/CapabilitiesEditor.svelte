<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';
  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  const valuedPattern = /^(.+?)\s+([\d/]+)$/;
  let otherText = $state('');
  onMount(() => otherText = (pokemon.capabilities || []).filter(value => !valuedPattern.test(value)).join(', '));

  function valued() {
    return (pokemon.capabilities || []).map((capability, index) => {
      const match = capability.match(valuedPattern);
      return match ? { index, name: match[1], value: match[2] } : null;
    }).filter(Boolean) as { index: number; name: string; value: string }[];
  }

  function updateValue(index: number, name: string, value: string) {
    pokemon.capabilities![index] = `${name} ${value.trim() || '0'}`;
    onsave();
  }

  function removeValue(index: number) {
    pokemon.capabilities!.splice(index, 1);
    onsave();
  }

  function saveOther() {
    const withValues = (pokemon.capabilities || []).filter(value => valuedPattern.test(value));
    const freeform = otherText.split(/[,\n]+/).map(value => value.trim()).filter(Boolean);
    pokemon.capabilities!.splice(0, pokemon.capabilities!.length, ...withValues, ...freeform);
    onsave();
  }

  function addCapability(name: string) {
    if ((pokemon.capabilities || []).some(capability => capability.match(valuedPattern)?.[1] === name)) return;
    pokemon.capabilities!.push(`${name} 1`);
    onsave();
  }
</script>

<h3 class="section-title">🔧 Capabilities</h3>
<div class="section-container capabilities">
  <div class="section-grid capabilities">
    {#each valued() as capability (capability.index)}
      <div class="grid-item capability">
        <div class="grid-item-title" title={capability.name}>{capability.name}</div>
        <input type="text" class="capability-value-input" aria-label={`${capability.name} value`} value={capability.value} onchange={(event) => updateValue(capability.index, capability.name, event.currentTarget.value)} />
        <button type="button" class="compact-remove" aria-label={`Remove ${capability.name}`} onclick={() => removeValue(capability.index)}>×</button>
      </div>
    {/each}
    <label class="grid-item capability capability-full">
      <span class="grid-item-title">Other</span>
      <textarea class="capability-no-value-input" rows="2" bind:value={otherText} onchange={saveOther} placeholder="Comma-separated or one capability per line"></textarea>
    </label>
  </div>
  <div class="section-buttons">{#each ['Overland','Swim','Sky','Levitate','Burrow'] as capability}<button type="button" class="section-btn" onclick={() => addCapability(capability)}>+ {capability}</button>{/each}</div>
</div>

<style>
  .section-grid.capabilities{grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}
  .grid-item.capability{box-sizing:border-box;width:100%;min-width:0;grid-template-columns:minmax(100px,1fr) 42px 20px;gap:4px}.grid-item.capability-full{grid-column:1/-1;grid-template-columns:65px minmax(0,1fr)}
  .grid-item.capability:not(.capability-full) .grid-item-title{overflow:visible;white-space:normal;line-height:1.15}
  .capability-value-input,.capability-no-value-input{box-sizing:border-box;width:100%;font-family:inherit!important}
  .capability-no-value-input{resize:vertical;line-height:1.35}
  .compact-remove{width:100%;min-width:0;padding:0;border:0;background:transparent;color:var(--danger-color,#c33);cursor:pointer;font:inherit;font-size:1.1rem}
</style>
