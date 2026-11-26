<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { attackingTypes, typeEffectiveness } from '../lib/type-effectiveness';
  import { adjustHitPointsByTick, applyDamageToHitPoints, calculateIncomingDamage, reduceIncomingDamage, hitPointTick, injuredHitPointMaximum } from '../lib/combat';
  import { totalStat } from '../lib/stats';

  let { pokemon = $bindable(), damageType = $bindable('typeless'), onsave }: {
    pokemon: Pokemon;
    damageType: string;
    onsave: () => void;
  } = $props();

  let amount: number | null = $state(null);
  let mode = $state<'attack' | 'direct'>('attack');
  let ignoreDr = $state(false);
  let category = $state<'physical' | 'special'>('physical');
  const damageTypes = $derived(attackingTypes(pokemon));
  const effectiveness = $derived(Number(typeEffectiveness(pokemon)[damageType] ?? 1));
  const defense = $derived(totalStat(pokemon, category === 'physical' ? 'def' : 'spD'));
  const damageReduction = $derived(Math.max(0, Math.trunc(Number(pokemon.damageReduction) || 0)));
  const calculatedDamage = $derived(mode === 'direct'
    ? Math.max(0, Math.trunc(Number.isFinite(amount) ? amount! : 0))
    : calculateIncomingDamage(amount ?? 0, defense, effectiveness));
  const appliedDr = $derived(mode === 'direct' && ignoreDr ? 0 : damageReduction);
  const finalDamage = $derived(reduceIncomingDamage(calculatedDamage, appliedDr));
  const tick = $derived(hitPointTick(Number(pokemon.hitPointsMax)));
  const tempHitPoints = $derived(Math.max(0, Math.trunc(Number(pokemon.tempHitPoints) || 0)));
  const injuries = $derived(Number(pokemon.captureState?.standardCounts?.injuries) || 0);
  const healingMaximum = $derived(injuredHitPointMaximum(Number(pokemon.hitPointsMax), injuries));
  const damageResult = $derived(applyDamageToHitPoints(Number(pokemon.hitPoints), tempHitPoints, finalDamage));
  const hpPercentage = $derived.by(() => {
    const current = pokemon.hitPoints;
    const maximum = pokemon.hitPointsMax;
    if (typeof current !== 'number' || !Number.isFinite(current) ||
        typeof maximum !== 'number' || !Number.isFinite(maximum) || maximum <= 0) return 0;
    return Math.min(100, Math.max(0, current / maximum * 100));
  });

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

  function setDamageReduction(value: number) {
    pokemon.damageReduction = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
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
  <div class="hp-summary" role="group" aria-label="Hit points">
    <div class="hp-heading">
      <span class="info-label">HP <span class="hp-percentage">{Math.round(hpPercentage)}%</span></span>
      <div class="hp-values">
        <input id="hpCurrentInput" aria-label="Current HP" type="number" bind:value={pokemon.hitPoints} onchange={onsave} />
        <span aria-hidden="true">/</span>
        <input aria-label="Maximum HP" type="number" min="1" bind:value={pokemon.hitPointsMax} onchange={onsave} />
      </div>
    </div>
    <div class="hp-bar" role="meter" aria-label="Remaining HP" aria-valuemin="0" aria-valuemax="100" aria-valuenow={hpPercentage} aria-valuetext={`${pokemon.hitPoints} / ${pokemon.hitPointsMax} HP`}>
      <div class="hp-bar-fill" style:width={`${hpPercentage}%`}></div>
    </div>
  </div>
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
      <div class="direct-damage-options"><span class="damage-mode-hint">Ignores defense &amp; types</span><label class="ignore-dr-option"><input type="checkbox" bind:checked={ignoreDr} /> Ignore DR</label></div>
    {/if}
    <button type="submit" class="hp-damage-btn" disabled={amount === null || !Number.isFinite(amount) || amount <= 0}>Apply</button>
  </form>
  {#if amount !== null && Number.isFinite(amount) && amount > 0}
    <div class="hp-damage-preview" aria-live="polite">
      <span>Final: <strong>{finalDamage}</strong>{#if mode === 'attack'} ({amount} − {defense}, {effectiveness}x{#if appliedDr > 0}, −{appliedDr} DR{/if}){:else if ignoreDr} (DR ignored){:else if appliedDr > 0} ({amount} − {appliedDr} DR){/if}</span>
      <span class="damage-hp-preview">{#if tempHitPoints > 0}Temp HP {tempHitPoints} → {damageResult.tempHitPoints}<span aria-hidden="true"> · </span>{/if}HP {pokemon.hitPoints} → {damageResult.hitPoints}</span>
    </div>
  {/if}
  <div class="damage-utilities">
    <div class="tick-buttons" role="group" aria-label="HP tick controls"><span class="utility-label">HP tick</span><button type="button" aria-label="Lose one HP tick" title={'Lose one tick (' + tick + ' HP)'} onclick={() => applyTick(-1)}>−</button><button type="button" aria-label="Heal one HP tick" title={'Heal one tick (' + tick + ' HP), up to ' + healingMaximum} onclick={() => applyTick(1)}>+</button></div>
    <div class="damage-counters">
      <div class="damage-counter-group"><label class="damage-counter"><span>Temp HP</span><input aria-label="Temp HP" type="number" min="0" value={tempHitPoints} onchange={(event) => setTempHitPoints(Number(event.currentTarget.value))} /></label><button type="button" title={'Add one tick (' + tick + ' Temp HP)'} aria-label="Add one tick of Temp HP" onclick={addTempHitPointTick}>+</button></div>
      <label class="damage-counter damage-reduction-counter"><abbr title="Damage Reduction">Damage Reduction</abbr> <input aria-label="Damage Reduction" type="number" min="0" step="1" value={damageReduction} onchange={(event) => setDamageReduction(Number(event.currentTarget.value))} /></label>
      <div class="damage-counter-group"><label class="damage-counter"><span>Injuries</span><input aria-label="Injuries" type="number" min="0" value={injuries} onchange={(event) => setInjuries(Number(event.currentTarget.value))} /></label><button type="button" title="Add one injury and reduce the healing cap by 10%" aria-label="Add one injury" onclick={addInjury}>+</button></div>
    </div>
  </div>
</div>

<style>
  .hp-summary{display:grid;gap:8px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border-color);color:var(--text-secondary)}
  .hp-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .hp-heading .info-label,.incoming-damage-header .info-label{font-size:.85rem;font-weight:700;margin:0}
  .hp-percentage{margin-left:6px;color:var(--text-secondary);font-size:.72rem;font-weight:500;font-variant-numeric:tabular-nums}
  .hp-values{display:flex;align-items:center;gap:6px;font-size:.85rem}
  .hp-summary input{box-sizing:border-box;width:72px;min-width:0;height:29px;margin:0;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font:inherit;font-weight:700;text-align:center}
  .hp-summary input:focus{border-color:var(--primary-color);outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .hp-bar{height:5px;overflow:hidden;border-radius:999px;background:var(--bg-main);box-shadow:inset 0 0 0 1px var(--border-color)}
  .hp-bar-fill{height:100%;border-radius:inherit;background:#dc3545;transition:width .2s ease}
  @media(prefers-reduced-motion:reduce){.hp-bar-fill{transition:none}}
  .incoming-damage-block{display:block;width:100%;min-width:0;container-type:inline-size;text-align:left}
  .incoming-damage-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap}
  .incoming-damage-header .info-label{margin:0}
  .damage-counters{display:contents}
  .damage-counter{display:grid;grid-template-columns:minmax(0,1fr) 40px 25px;align-items:center;gap:3px;margin:0;color:var(--text-secondary);font-size:.7rem;font-weight:600;line-height:14px;white-space:nowrap}
  .damage-counter input{box-sizing:border-box;flex:0 0 40px;width:40px;min-width:0;height:25px;min-height:25px;padding:2px 3px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);text-align:center;font:inherit}
  .damage-counter abbr{text-decoration:none}
  .damage-reduction-counter{grid-template-columns:minmax(0,1fr) 40px}
  .damage-utilities{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:center;gap:5px 12px;margin-top:8px;padding-top:7px;border-top:1px solid var(--border-color)}
  .tick-buttons,.damage-counter-group{display:grid;grid-template-columns:minmax(0,1fr) 40px 25px;align-items:center;gap:3px;white-space:nowrap}
  .tick-buttons{grid-template-columns:minmax(0,1fr) 25px 25px}
  .damage-counter-group .damage-counter{display:contents}
  .damage-counter-group .damage-counter>span,.utility-label{font-size:.7rem;font-weight:600;line-height:14px;color:var(--text-secondary)}
  .damage-utilities button{box-sizing:border-box;flex:0 0 25px;width:25px;height:25px;min-height:25px;padding:0;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font-size:.8rem;cursor:pointer}
  .damage-utilities button:hover{border-color:var(--primary-color);color:var(--primary-color)}
  .damage-mode-buttons{display:inline-flex;gap:0}
  .damage-mode-buttons button{padding:4px 8px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-secondary);font:inherit;font-size:.72rem;font-weight:700;cursor:pointer}
  .damage-mode-buttons button:first-child{border-radius:4px 0 0 4px}.damage-mode-buttons button:last-child{border-radius:0 4px 4px 0}
  .damage-mode-buttons button.active{border-color:var(--primary-color);background:var(--primary-color);color:#fff}
  .damage-mode-buttons button:hover:not(.active){color:var(--primary-color)}
  .damage-mode-hint{color:var(--text-secondary);font-size:.7rem;line-height:1.35}
  .direct-damage-options{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px 8px}
  .ignore-dr-option{display:inline-flex;align-items:center;gap:4px;margin:0;color:var(--text-secondary);font-size:.7rem;white-space:nowrap;cursor:pointer}
  .ignore-dr-option input{width:14px;height:14px;margin:0;padding:0;accent-color:var(--primary-color);cursor:pointer}
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
  @container(max-width:640px){.damage-utilities{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @container(max-width:360px){.hp-damage-controls{grid-template-columns:minmax(54px,.7fr) minmax(0,1fr)}.damage-category-buttons{grid-column:1}.hp-damage-controls.direct-damage-controls{grid-template-columns:minmax(54px,.7fr) minmax(0,1fr)}.direct-damage-controls .direct-damage-options{grid-column:2;grid-row:1}.direct-damage-controls .hp-damage-btn{grid-column:1 / -1}}
</style>
