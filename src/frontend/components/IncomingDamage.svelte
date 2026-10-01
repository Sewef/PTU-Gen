<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { ALL_TYPES } from '../lib/pokemon';
  import { typeEffectiveness } from '../lib/type-effectiveness';
  import { calculateIncomingDamage } from '../lib/combat';

  let { pokemon = $bindable(), damageType = $bindable('typeless'), onsave }: {
    pokemon: Pokemon;
    damageType: string;
    onsave: () => void;
  } = $props();

  let amount = $state(0);
  let category = $state<'physical' | 'special'>('physical');
  const effectiveness = $derived(damageType === 'typeless' ? 1 : Number(typeEffectiveness(pokemon)[damageType] ?? 1));
  const defense = $derived(Number(pokemon.stats[category === 'physical' ? 'def' : 'spD'] || 0));
  const finalDamage = $derived(calculateIncomingDamage(amount, defense, effectiveness));

  function apply() {
    if (amount <= 0) return;
    pokemon.hitPoints = Number(pokemon.hitPoints) - finalDamage;
    onsave();
  }
</script>

<div class="hp-damage-area">
  <div class="hp-damage-controls">
    <input class="hp-damage-input" aria-label="Incoming damage" placeholder="Damage" type="number" min="0" bind:value={amount} />
    <select class="hp-damage-select" aria-label="Damage type" bind:value={damageType}><option value="typeless">Typeless</option>{#each ALL_TYPES as type}<option value={type.toLowerCase()}>{type}</option>{/each}</select>
    <div class="damage-category-buttons" role="group" aria-label="Damage class"><button type="button" class:active={category === 'physical'} aria-pressed={category === 'physical'} onclick={() => category = 'physical'}>Physical</button><button type="button" class:active={category === 'special'} aria-pressed={category === 'special'} onclick={() => category = 'special'}>Special</button></div>
    <button type="button" class="hp-damage-btn" onclick={apply}>Apply</button>
  </div>
  {#if amount > 0}<div class="hp-damage-preview">Final: {finalDamage} ({amount} − {defense}, {effectiveness}x)</div>{/if}
</div>

<style>
  .hp-damage-area{width:100%;min-width:0;container-type:inline-size}
  .hp-damage-controls{box-sizing:border-box;width:100%;max-width:100%;grid-template-columns:minmax(48px,.65fr) minmax(64px,.9fr) minmax(104px,1.25fr) minmax(44px,.55fr)}
  .hp-damage-controls>*{min-width:0;max-width:100%}
  .hp-damage-btn{grid-column:auto}
  .damage-category-buttons{display:grid;grid-template-columns:1fr 1fr;gap:2px}
  .damage-category-buttons button{min-width:0;padding:5px 4px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-secondary);font-size:.72em;font-weight:700;cursor:pointer}
  .damage-category-buttons button:first-child{border-radius:4px 0 0 4px}.damage-category-buttons button:last-child{border-radius:0 4px 4px 0}.damage-category-buttons button.active{border-color:var(--primary-color);background:var(--primary-color);color:#fff}
  @container(max-width:300px){.hp-damage-controls{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.hp-damage-btn{grid-column:auto}}
</style>
