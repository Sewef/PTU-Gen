<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { calculateHp, STAT_LABELS } from '../lib/pokemon';

  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  const statKeys = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'] as const;
  type StatKey = typeof statKeys[number];
  const baseKeys: Record<string, string> = { HP: 'HP', atk: 'Attack', def: 'Defense', spA: 'Special Attack', spD: 'Special Defense', spe: 'Speed' };
  const multipliers: Record<number, number> = { [-6]: .4, [-5]: .5, [-4]: .6, [-3]: .7, [-2]: .8, [-1]: .9, 0: 1, 1: 1.2, 2: 1.4, 3: 1.6, 4: 1.8, 5: 2, 6: 2.2 };

  function rawBase(stat: StatKey) { return Number(pokemon.baseStats?.[baseKeys[stat]] ?? pokemon.baseWithNature?.[stat] ?? pokemon.stats[stat]) || 0; }
  function effectiveBase(stat: StatKey) { return Number(pokemon.baseWithNature?.[stat] ?? rawBase(stat)) || 0; }
  function natureModifier(stat: StatKey) { return effectiveBase(stat) - rawBase(stat); }
  function levelPoints(stat: StatKey) { return Number(pokemon.stats[stat]) - effectiveBase(stat); }

  function updateLevel(stat: StatKey, value: number) {
    const points = Number(value) || 0;
    pokemon.distributedPoints ||= {};
    pokemon.distributedPoints[stat] = points;
    pokemon.stats[stat] = effectiveBase(stat) + points;
    updateHp(stat);
    onsave();
  }

  function updateBase(stat: StatKey, value: number) {
    const points = levelPoints(stat);
    const modifier = natureModifier(stat);
    pokemon.baseStats ||= {};
    pokemon.baseStats[baseKeys[stat]] = Math.max(0, (Number(value) || 0) - modifier);
    const calculator = (globalThis as any).PTUStatCalc;
    pokemon.baseWithNature = calculator?.getBaseStatsWithNature
      ? calculator.getBaseStatsWithNature(pokemon.baseStats, pokemon.nature)
      : Object.fromEntries(statKeys.map(key => [key, rawBase(key)]));
    pokemon.distributedPoints ||= {};
    pokemon.distributedPoints[stat] = points;
    pokemon.stats[stat] = effectiveBase(stat) + points;
    updateHp(stat);
    onsave();
  }

  function updateHp(stat: StatKey) {
    if (stat === 'HP') pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
  }

  function total(stat: StatKey) {
    if (stat === 'HP') return Number(pokemon.stats[stat] || 0);
    return Math.floor(Number(pokemon.stats[stat] || 0) * (multipliers[Number(pokemon.combatStages[stat] || 0)] || 1));
  }

  function redistribute(distribution: string) {
    const calculator = (globalThis as any).PTUStatCalc;
    if (!calculator || !pokemon.baseStats) return;
    const result = calculator.getDistributedPoints(pokemon.baseStats, pokemon.level, pokemon.nature, distribution, pokemon.ignoreBaseRelation);
    pokemon.baseWithNature = result.baseWithNature;
    pokemon.distributedPoints = result.distributedPoints;
    pokemon.distribution = distribution;
    for (const stat of statKeys) pokemon.stats[stat] = result.baseWithNature[stat] + (result.distributedPoints[stat] || 0);
    pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
    onsave();
  }
</script>

<div class="stats-section">
  <div class="stats-section-header"><h3 class="section-title">📈 Stats</h3><div class="stats-buttons-group">{#each ['RANDOM','BALANCED','MINMAXED'] as distribution}<button type="button" class="distribution-button" class:active={pokemon.distribution === distribution} onclick={() => redistribute(distribution)}>{distribution}</button>{/each}<div class="remaining-points-display">Level points: {statKeys.reduce((sum, key) => sum + levelPoints(key), 0)} / {pokemon.level + 10}</div></div></div>
  <div class="stats-breakdown">
    <div class="stats-table-heading" aria-hidden="true"><span>Stat</span><span>Base</span><span>Level</span><span>CS</span><span>Total</span></div>
    {#each statKeys as stat}
      <div class="stat-breakdown-row" data-stat={stat}>
        <div class="stat-breakdown-label">{STAT_LABELS[stat]}{#if natureModifier(stat)}<span class:nature-up={natureModifier(stat) > 0} class:nature-down={natureModifier(stat) < 0} class="nature-indicator" title={`Nature ${natureModifier(stat) > 0 ? 'raises' : 'lowers'} ${STAT_LABELS[stat]} by ${Math.abs(natureModifier(stat))}`}>{natureModifier(stat) > 0 ? '▲' : '▼'} {Math.abs(natureModifier(stat))}</span>{/if}</div>
        <div class="stat-cell base-cell"><input aria-label={`${STAT_LABELS[stat]} base stat after Nature`} type="number" min="0" value={effectiveBase(stat)} onchange={(event) => updateBase(stat, Number(event.currentTarget.value))} /></div>
        <div class="stat-cell"><input aria-label={`${STAT_LABELS[stat]} level points`} type="number" value={levelPoints(stat)} onchange={(event) => updateLevel(stat, Number(event.currentTarget.value))} /></div>
        <div class="stat-cell">
          {#if stat === 'HP'}
            <span class="no-combat-stage" aria-label="HP has no combat stage">—</span>
          {:else}
            <input aria-label={`${STAT_LABELS[stat]} combat stage`} class="cs-input" type="number" min="-6" max="6" bind:value={pokemon.combatStages[stat]} onchange={onsave} />
          {/if}
        </div>
        <div class="stat-total">{total(stat)}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .stats-table-heading,.stat-breakdown-row{display:grid;grid-template-columns:minmax(105px,1.2fr) minmax(76px,.8fr) minmax(72px,.8fr) minmax(54px,.55fr) minmax(58px,.6fr);gap:6px;align-items:center}
  .stats-table-heading{padding:0 5px 3px;color:var(--text-tertiary);font-size:.68rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;text-align:center}
  .stats-table-heading span:first-child{text-align:left}
  .stat-breakdown-row{min-height:34px;padding:3px 5px}
  .stat-breakdown-label{display:flex;align-items:center;justify-content:space-between;gap:4px}
  .stat-cell{display:flex;align-items:center;justify-content:center;gap:3px;min-width:0}
  .stat-cell input{box-sizing:border-box;width:100%;min-width:0;height:26px;padding:2px 4px;text-align:center;font:inherit}
  .stat-total{text-align:center;font-weight:750;color:var(--primary-color)}
  .no-combat-stage{color:var(--text-tertiary);font-weight:700}
  .nature-indicator{flex:0 0 auto;border-radius:999px;padding:1px 4px;font-size:.62rem;font-weight:800;line-height:1.25}
  .nature-up{background:#d9f6e5;color:#187445}.nature-down{background:#fde1e1;color:#b12a2a}
  @media(max-width:560px){.stats-table-heading,.stat-breakdown-row{grid-template-columns:minmax(86px,1.1fr) minmax(67px,.8fr) minmax(64px,.75fr) minmax(48px,.5fr) minmax(48px,.5fr);gap:3px}.nature-indicator{font-size:.55rem}}
</style>
