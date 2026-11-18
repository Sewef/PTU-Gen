<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';
  let { pokemon = $bindable(), embedded = false, onsave }: { pokemon: Pokemon; embedded?: boolean; onsave: () => void } = $props();
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

<div class="section-heading-row"><h3 class="section-title">🔧 Capabilities</h3><div class="section-buttons">{#each ['Overland','Swim','Sky','Levitate','Burrow'] as capability}<button type="button" class="section-btn" onclick={() => addCapability(capability)}>+ {capability}</button>{/each}</div></div>
<div class="section-container capabilities" class:compact-capabilities={embedded}>
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
      <textarea class="capability-no-value-input" rows="1" bind:value={otherText} onchange={saveOther} placeholder="Comma-separated or one capability per line"></textarea>
    </label>
  </div>
</div>

<style>
  .section-heading-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0 .5rem}
  .section-heading-row .section-title,.section-buttons{margin-bottom:.35rem}
  .section-buttons{gap:3px}
  .section-container.capabilities{padding:5px 6px;border-left-color:var(--capabilities-border)}
  .section-grid.capabilities{grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:3px;margin:0}
  .grid-item.capability{box-sizing:border-box;width:100%;min-width:0;overflow:hidden;grid-template-columns:minmax(70px,1fr) 60px 18px;gap:3px;padding:3px 5px;border-color:var(--capabilities-border)}
  .grid-item.capability-full{grid-column:1/-1;grid-template-columns:42px minmax(0,1fr);align-items:center;margin:0}
  .grid-item.capability .grid-item-title{margin:0;font-size:.76rem;font-weight:650;color:var(--text-primary);line-height:1.25}
  .grid-item.capability:not(.capability-full) .grid-item-title{overflow:visible;white-space:normal}
  .grid-item.capability .capability-value-input,.grid-item.capability .capability-no-value-input{box-sizing:border-box;width:100%;min-width:0;border:1px solid var(--border-color);border-radius:3px;background:var(--bg-main);color:var(--text-primary);font:inherit;font-size:.76rem}
  .capability-value-input{height:24px;padding:2px 3px;text-align:center}
  .capability-no-value-input{field-sizing:content;min-height:26px;max-height:120px;padding:3px 4px;resize:vertical;overflow-y:auto;line-height:1.35}
  .compact-capabilities .section-grid.capabilities{grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))}
  .compact-capabilities .grid-item.capability{grid-template-columns:minmax(56px,1fr) 40px 14px;gap:2px;padding:2px 3px}
  .compact-capabilities .grid-item.capability-full{grid-template-columns:42px minmax(0,1fr)}
  .compact-capabilities .grid-item.capability .grid-item-title{font-size:.7rem;font-weight:500}
  .compact-capabilities .grid-item.capability input,.compact-capabilities .grid-item.capability textarea{padding:2px;font-size:.7rem}
  .compact-remove{height:24px;min-height:24px}
  .compact-remove{width:100%;min-width:0;padding:0;border:0;background:transparent;color:var(--danger-color,#c33);cursor:pointer;font:inherit;font-size:1.1rem}
</style>
