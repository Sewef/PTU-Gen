<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { ATTACKING_TYPES, typeEffectiveness } from '../lib/type-effectiveness';
  import { adjustHitPointsByTick, calculateIncomingDamage, hitPointTick, injuredHitPointMaximum } from '../lib/combat';

  let { pokemon = $bindable(), damageType = $bindable('typeless'), onsave }: {
    pokemon: Pokemon;
    damageType: string;
    onsave: () => void;
  } = $props();

  let amount: number | null = $state(null);
  let category = $state<'physical' | 'special'>('physical');
  const effectiveness = $derived(Number(typeEffectiveness(pokemon)[damageType] ?? 1));
  const defense = $derived(Number(pokemon.stats[category === 'physical' ? 'def' : 'spD'] || 0));
  const finalDamage = $derived(calculateIncomingDamage(amount ?? 0, defense, effectiveness));
  const tick = $derived(hitPointTick(Number(pokemon.hitPointsMax)));
  const injuries = $derived(Number(pokemon.captureState?.standardCounts?.injuries) || 0);
  const healingMaximum = $derived(injuredHitPointMaximum(Number(pokemon.hitPointsMax), injuries));

  function apply() {
    if (amount === null || amount <= 0) return;
    pokemon.hitPoints = Number(pokemon.hitPoints) - finalDamage;
    onsave();
  }

  function setAmount(value: string) {
    amount = value === '' ? null : Number(value);
  }

  function applyTick(direction: 1 | -1) {
    pokemon.hitPoints = adjustHitPointsByTick(Number(pokemon.hitPoints), Number(pokemon.hitPointsMax), direction, injuries);
    onsave();
  }

  function addInjury() {
    setInjuries(injuries + 1);
  }

  function setInjuries(value: number) {
    const count = Math.max(0, Math.trunc(Number(value) || 0));
    pokemon.captureState!.standardCounts.injuries = count;
    pokemon.captureState!.errataFlags.injuries5 = count >= 5;
    pokemon.hitPoints = Math.min(Number(pokemon.hitPoints), injuredHitPointMaximum(Number(pokemon.hitPointsMax), count));
    onsave();
  }
</script>

<div class="info-box incoming-damage-block">
  <div class="incoming-damage-header"><span class="info-label">Incoming Damage</span><label class="injury-counter">Injuries <input aria-label="Injuries" type="number" min="0" value={injuries} onchange={(event) => setInjuries(Number(event.currentTarget.value))} /></label><div class="tick-buttons" role="group" aria-label="HP and injury controls"><button type="button" title={'Heal one tick (' + tick + ' HP), up to ' + healingMaximum} onclick={() => applyTick(1)}>+ Tick</button><button type="button" title={'Lose one tick (' + tick + ' HP)'} onclick={() => applyTick(-1)}>− Tick</button><button type="button" title="Add one injury and reduce the healing cap by 10%" onclick={addInjury}>+ Injury</button></div></div>
  <div class="hp-damage-controls">
    <input class="hp-damage-input" aria-label="Incoming damage" placeholder="Damage" type="number" min="0" value={amount ?? ''} oninput={(event) => setAmount(event.currentTarget.value)} />
    <select class="hp-damage-select" aria-label="Damage type" bind:value={damageType}>{#each ATTACKING_TYPES as type}<option value={type.toLowerCase()}>{type}</option>{/each}</select>
    <div class="damage-category-buttons" role="group" aria-label="Damage class"><button type="button" class:active={category === 'physical'} aria-pressed={category === 'physical'} onclick={() => category = 'physical'}>Physical</button><button type="button" class:active={category === 'special'} aria-pressed={category === 'special'} onclick={() => category = 'special'}>Special</button></div>
    <button type="button" class="hp-damage-btn" onclick={apply}>Apply</button>
  </div>
  {#if amount !== null && amount > 0}<div class="hp-damage-preview">Final: {finalDamage} ({amount} − {defense}, {effectiveness}x)</div>{/if}
</div>

<style>
  .incoming-damage-block{display:block;width:100%;min-width:0;container-type:inline-size;text-align:left}
  .incoming-damage-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .incoming-damage-header .info-label{margin:0}
  .injury-counter{display:flex;align-items:center;gap:4px;margin-left:auto;color:var(--text-secondary);font-size:.7rem;font-weight:700}
  .injury-counter input{box-sizing:border-box;width:42px;min-height:25px;padding:2px 4px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);text-align:center;font:inherit}
  .tick-buttons{display:flex;gap:4px;flex:0 0 auto}
  .tick-buttons button{min-height:25px;padding:3px 7px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-secondary);font-size:.72rem;font-weight:700;cursor:pointer}
  .tick-buttons button:hover{border-color:var(--primary-color);color:var(--primary-color)}
  @container(max-width:480px){.incoming-damage-header{align-items:flex-start;flex-wrap:wrap}.injury-counter{margin-left:auto}.tick-buttons{order:3;width:100%;justify-content:flex-end}}
  .hp-damage-controls{box-sizing:border-box;width:100%;max-width:100%;grid-template-columns:minmax(48px,.65fr) minmax(64px,.9fr) minmax(104px,1.25fr) minmax(44px,.55fr)}
  .hp-damage-controls>*{min-width:0;max-width:100%}
  .hp-damage-btn{grid-column:auto}
  .damage-category-buttons{display:grid;grid-template-columns:1fr 1fr;gap:2px}
  .damage-category-buttons button{min-width:0;padding:5px 4px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-secondary);font-size:.72em;font-weight:700;cursor:pointer}
  .damage-category-buttons button:first-child{border-radius:4px 0 0 4px}.damage-category-buttons button:last-child{border-radius:0 4px 4px 0}.damage-category-buttons button.active{border-color:var(--primary-color);background:var(--primary-color);color:#fff}
  @container(max-width:300px){.hp-damage-controls{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.hp-damage-btn{grid-column:auto}}
</style>
