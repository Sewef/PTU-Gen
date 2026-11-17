<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { attackingTypes, typeEffectiveness } from '../lib/type-effectiveness';
  import { adjustHitPointsByTick, applyDamageToHitPoints, calculateIncomingDamage, hitPointTick, injuredHitPointMaximum } from '../lib/combat';
  import { totalStat } from '../lib/stats';

  let { pokemon = $bindable(), damageType = $bindable('typeless'), onsave }: {
    pokemon: Pokemon;
    damageType: string;
    onsave: () => void;
  } = $props();

  let amount: number | null = $state(null);
  let mode = $state<'attack' | 'direct'>('attack');
  let category = $state<'physical' | 'special'>('physical');
  const damageTypes = $derived(attackingTypes(pokemon));
  const effectiveness = $derived(Number(typeEffectiveness(pokemon)[damageType] ?? 1));
  const defense = $derived(totalStat(pokemon, category === 'physical' ? 'def' : 'spD'));
  const finalDamage = $derived(mode === 'direct'
    ? Math.max(0, Math.trunc(Number.isFinite(amount) ? amount! : 0))
    : calculateIncomingDamage(amount ?? 0, defense, effectiveness));
  const tick = $derived(hitPointTick(Number(pokemon.hitPointsMax)));
  const tempHitPoints = $derived(Math.max(0, Math.trunc(Number(pokemon.tempHitPoints) || 0)));
  const injuries = $derived(Number(pokemon.captureState?.standardCounts?.injuries) || 0);
  const healingMaximum = $derived(injuredHitPointMaximum(Number(pokemon.hitPointsMax), injuries));
  const damageResult = $derived(applyDamageToHitPoints(Number(pokemon.hitPoints), tempHitPoints, finalDamage));

  function apply() {
    if (amount === null || !Number.isFinite(amount) || amount <= 0) return;
    const result = applyDamageToHitPoints(Number(pokemon.hitPoints), tempHitPoints, finalDamage);
    pokemon.hitPoints = result.hitPoints;
    pokemon.tempHitPoints = result.tempHitPoints;
    onsave();
  }

  function setAmount(value: string) {
    amount = value === '' ? null : Number(value);
  }

  function applyTick(direction: 1 | -1) {
    if (direction < 0) {
      const result = applyDamageToHitPoints(Number(pokemon.hitPoints), tempHitPoints, tick);
      pokemon.hitPoints = result.hitPoints;
      pokemon.tempHitPoints = result.tempHitPoints;
    } else {
      pokemon.hitPoints = adjustHitPointsByTick(Number(pokemon.hitPoints), Number(pokemon.hitPointsMax), direction, injuries);
    }
    onsave();
  }

  function addInjury() {
    setInjuries(injuries + 1);
  }

  function addTempHitPointTick() {
    pokemon.tempHitPoints = tempHitPoints + tick;
    onsave();
  }

  function setTempHitPoints(value: number) {
    pokemon.tempHitPoints = Math.max(0, Math.trunc(Number(value) || 0));
    onsave();
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
  <div class="incoming-damage-header">
  <span class="info-label">Incoming Damage</span>
  <div class="damage-mode-buttons" role="group" aria-label="Damage mode">
    <button type="button" class:active={mode === 'attack'} aria-pressed={mode === 'attack'} onclick={() => mode = 'attack'}>Attack</button>
    <button type="button" class:active={mode === 'direct'} aria-pressed={mode === 'direct'} onclick={() => mode = 'direct'}>Direct damage</button>
  </div>
  </div>
  <form class="hp-damage-controls" class:direct-damage-controls={mode === 'direct'} onsubmit={(event) => { event.preventDefault(); apply(); }}>
    <input class="hp-damage-input" aria-label="Incoming damage" placeholder="Damage" type="number" min="0" step="1" value={amount ?? ''} oninput={(event) => setAmount(event.currentTarget.value)} />
    {#if mode === 'attack'}
      <select class="hp-damage-select" aria-label="Damage type" bind:value={damageType}>{#each damageTypes as type}<option value={type.toLowerCase()}>{type}</option>{/each}</select>
      <div class="damage-category-buttons" role="group" aria-label="Damage class"><button type="button" class:active={category === 'physical'} aria-pressed={category === 'physical'} onclick={() => category = 'physical'}>Physical</button><button type="button" class:active={category === 'special'} aria-pressed={category === 'special'} onclick={() => category = 'special'}>Special</button></div>
    {:else}
      <span class="damage-mode-hint">Ignores defense &amp; types</span>
    {/if}
    <button type="submit" class="hp-damage-btn" disabled={amount === null || !Number.isFinite(amount) || amount <= 0}>Apply</button>
  </form>
  {#if amount !== null && Number.isFinite(amount) && amount > 0}
    <div class="hp-damage-preview" aria-live="polite">
      <span>Final: <strong>{finalDamage}</strong>{#if mode === 'attack'} ({amount} − {defense}, {effectiveness}x){/if}</span>
      <span class="damage-hp-preview">{#if tempHitPoints > 0}Temp HP {tempHitPoints} → {damageResult.tempHitPoints}<span aria-hidden="true"> · </span>{/if}HP {pokemon.hitPoints} → {damageResult.hitPoints}</span>
    </div>
  {/if}
  <div class="damage-utilities">
    <div class="tick-buttons" role="group" aria-label="HP tick controls"><span class="utility-label">HP</span><button type="button" title={'Lose one tick (' + tick + ' HP)'} onclick={() => applyTick(-1)}>− Tick</button><button type="button" title={'Heal one tick (' + tick + ' HP), up to ' + healingMaximum} onclick={() => applyTick(1)}>+ Tick</button></div>
    <div class="damage-counters">
      <div class="damage-counter-group"><label class="damage-counter">Temp HP <input aria-label="Temp HP" type="number" min="0" value={tempHitPoints} onchange={(event) => setTempHitPoints(Number(event.currentTarget.value))} /></label><button type="button" title={'Add one tick (' + tick + ' Temp HP)'} aria-label="Add one tick of Temp HP" onclick={addTempHitPointTick}>+ Tick</button></div>
      <div class="damage-counter-group"><label class="damage-counter">Injuries <input aria-label="Injuries" type="number" min="0" value={injuries} onchange={(event) => setInjuries(Number(event.currentTarget.value))} /></label><button type="button" title="Add one injury and reduce the healing cap by 10%" aria-label="Add one injury" onclick={addInjury}>+1</button></div>
    </div>
  </div>
</div>

<style>
  .incoming-damage-block{display:block;width:100%;min-width:0;container-type:inline-size;text-align:left}
  .incoming-damage-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap}
  .incoming-damage-header .info-label{margin:0}
  .damage-counters{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .damage-counter{display:flex;align-items:center;gap:4px;margin:0;color:var(--text-secondary);font-size:.7rem;font-weight:600;white-space:nowrap}
  .damage-counter input{box-sizing:border-box;width:42px;min-height:25px;padding:2px 4px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);text-align:center;font:inherit}
  .damage-utilities{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color)}
  .tick-buttons,.damage-counter-group{display:flex;align-items:center;gap:4px}
  .utility-label{margin-right:2px;font-size:.7rem;font-weight:600;color:var(--text-secondary)}
  .damage-utilities button{min-height:25px;padding:3px 6px;border:1px solid var(--border-color);border-radius:4px;background:transparent;color:var(--text-secondary);font-size:.7rem;cursor:pointer}
  .damage-utilities button:hover{border-color:var(--primary-color);color:var(--primary-color)}
  .damage-mode-buttons{display:inline-flex;gap:0}
  .damage-mode-buttons button{padding:4px 8px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-secondary);font:inherit;font-size:.72rem;font-weight:700;cursor:pointer}
  .damage-mode-buttons button:first-child{border-radius:4px 0 0 4px}.damage-mode-buttons button:last-child{border-radius:0 4px 4px 0}
  .damage-mode-buttons button.active{border-color:var(--primary-color);background:var(--primary-color);color:#fff}
  .damage-mode-buttons button:hover:not(.active){color:var(--primary-color)}
  .damage-mode-hint{color:var(--text-secondary);font-size:.7rem;line-height:1.35}
  .hp-damage-controls{box-sizing:border-box;width:100%;max-width:100%;margin-top:0;align-items:center;gap:6px;grid-template-columns:minmax(54px,.65fr) minmax(70px,1fr) minmax(112px,1.2fr) 60px}
  .hp-damage-controls.direct-damage-controls{grid-template-columns:minmax(54px,.65fr) minmax(0,2.2fr) 60px}
  .hp-damage-controls>*{min-width:0;max-width:100%}
  .hp-damage-input,.hp-damage-select,.damage-category-buttons button,.hp-damage-btn{height:30px;min-height:30px;padding:4px 6px}
  .hp-damage-btn{grid-column:auto}
  .hp-damage-btn:disabled{opacity:.45;cursor:default}
  .hp-damage-preview{display:flex;flex-wrap:wrap;justify-content:space-between;gap:3px 12px;min-height:0;margin-top:6px;padding:0;font-size:.7rem;text-align:left}
  .hp-damage-preview strong{color:var(--primary-color)}
  .damage-hp-preview{font-variant-numeric:tabular-nums}
  .damage-category-buttons{display:grid;grid-template-columns:1fr 1fr;gap:0}
  .damage-category-buttons button{min-width:0;padding:5px 4px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-secondary);font-size:.72em;font-weight:700;cursor:pointer}
  .damage-category-buttons button:first-child{border-radius:4px 0 0 4px}.damage-category-buttons button:last-child{border-radius:0 4px 4px 0}.damage-category-buttons button.active{border-color:var(--primary-color);background:var(--primary-color);color:#fff}
  @container(max-width:360px){.hp-damage-controls{grid-template-columns:minmax(54px,.7fr) minmax(0,1fr)}.damage-category-buttons{grid-column:1}.hp-damage-controls.direct-damage-controls{grid-template-columns:minmax(54px,.7fr) minmax(0,1fr)}.direct-damage-controls .damage-mode-hint{grid-column:2;grid-row:1}.direct-damage-controls .hp-damage-btn{grid-column:1 / -1}.damage-counters{gap:8px}}
</style>
