<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { calculateHp, STAT_LABELS } from '../lib/pokemon';

  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  const statKeys = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'] as const;
  type StatKey = typeof statKeys[number];
  const baseKeys: Record<string, string> = { HP: 'HP', atk: 'Attack', def: 'Defense', spA: 'Special Attack', spD: 'Special Defense', spe: 'Speed' };
  const relationLabels: Record<StatKey, string> = { HP: 'HP', atk: 'Atk', def: 'Def', spA: 'SpAtk', spD: 'SpDef', spe: 'Spd' };
  const multipliers: Record<number, number> = { [-6]: .4, [-5]: .5, [-4]: .6, [-3]: .7, [-2]: .8, [-1]: .9, 0: 1, 1: 1.2, 2: 1.4, 3: 1.6, 4: 1.8, 5: 2, 6: 2.2 };

  function rawBase(stat: StatKey) { return Number(pokemon.baseStats?.[baseKeys[stat]] ?? pokemon.baseWithNature?.[stat] ?? pokemon.stats[stat]) || 0; }
  function originalBase(stat: StatKey) { return Number(pokemon.baseStatsOriginal?.[baseKeys[stat]] ?? rawBase(stat)) || 0; }
  function isBaseModified(stat: StatKey) { return rawBase(stat) !== originalBase(stat); }
  function effectiveBase(stat: StatKey) { return Number(pokemon.baseWithNature?.[stat] ?? rawBase(stat)) || 0; }
  function natureModifier(stat: StatKey) { return effectiveBase(stat) - rawBase(stat); }
  function ignoredStats(): Set<StatKey> {
    const value = String(pokemon.ignoreBaseRelation || '').trim();
    if (['ALL', 'IGNORE'].includes(value.toUpperCase())) return new Set(statKeys);
    const aliases: Record<string, StatKey> = { HP: 'HP', ATK: 'atk', DEF: 'def', SPA: 'spA', SPD: 'spD', SPE: 'spe' };
    return new Set(value.split(',').map(stat => aliases[stat.trim().toUpperCase()]).filter((stat): stat is StatKey => Boolean(stat)));
  }
  function relationGroups(): StatKey[][] {
    const groups = new Map<number, StatKey[]>();
    for (const stat of statKeys) {
      const base = effectiveBase(stat);
      groups.set(base, [...(groups.get(base) || []), stat]);
    }
    return [...groups.entries()].sort(([left], [right]) => right - left).map(([, stats]) => stats);
  }
  function toggleRelation(stat: StatKey, included: boolean) {
    const ignored = ignoredStats();
    if (included) ignored.delete(stat);
    else ignored.add(stat);
    pokemon.ignoreBaseRelation = ignored.size === statKeys.length
      ? 'ALL'
      : ignored.size ? statKeys.filter(key => ignored.has(key)).join(',') : undefined;
    onsave();
  }
  function statBonus(stat: StatKey) { return Number(pokemon.statBonuses[stat]) || 0; }
  function levelPoints(stat: StatKey) {
    return Number(pokemon.distributedPoints?.[stat] ?? (Number(pokemon.stats[stat]) - effectiveBase(stat) - statBonus(stat))) || 0;
  }

  function updateLevel(stat: StatKey, value: number) {
    const points = Number(value) || 0;
    pokemon.distributedPoints ||= {};
    pokemon.distributedPoints[stat] = points;
    pokemon.stats[stat] = effectiveBase(stat) + points + statBonus(stat);
    updateHp(stat);
    onsave();
  }

  function updateBase(stat: StatKey, value: number) {
    const points = levelPoints(stat);
    const modifier = natureModifier(stat);
    pokemon.baseStatsOriginal ||= {};
    pokemon.baseStatsOriginal[baseKeys[stat]] ??= rawBase(stat);
    pokemon.baseStats ||= {};
    pokemon.baseStats[baseKeys[stat]] = Math.max(0, (Number(value) || 0) - modifier);
    const calculator = (globalThis as any).PTUStatCalc;
    pokemon.baseWithNature = calculator?.getBaseStatsWithNature
      ? calculator.getBaseStatsWithNature(pokemon.baseStats, pokemon.nature)
      : Object.fromEntries(statKeys.map(key => [key, rawBase(key)]));
    pokemon.distributedPoints ||= {};
    pokemon.distributedPoints[stat] = points;
    pokemon.stats[stat] = effectiveBase(stat) + points + statBonus(stat);
    updateHp(stat);
    onsave();
  }

  function updateBonus(stat: StatKey, value: number) {
    const points = levelPoints(stat);
    pokemon.statBonuses[stat] = Number(value) || 0;
    pokemon.stats[stat] = effectiveBase(stat) + points + statBonus(stat);
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
    for (const stat of statKeys) pokemon.stats[stat] = result.baseWithNature[stat] + (result.distributedPoints[stat] || 0) + statBonus(stat);
    pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
    onsave();
  }
</script>

<div class="stats-section">
  <div class="stats-section-header"><h3 class="section-title">📈 Stats</h3><div class="stats-buttons-group">{#each ['RANDOM','BALANCED','MINMAXED'] as distribution}<button type="button" class="distribution-button" class:active={pokemon.distribution === distribution} onclick={() => redistribute(distribution)}>{distribution}</button>{/each}<div class="remaining-points-display">Level points: {statKeys.reduce((sum, key) => sum + levelPoints(key), 0)} / {pokemon.level + 10}</div></div></div>
  <div class="stats-breakdown">
    <div class="base-relation-summary" aria-label="Base Relation based on stats after Nature">
      {#each relationGroups() as group, groupIndex}
        {#if groupIndex > 0}<span class="br-sep br-gt">&gt;</span>{/if}
        {#each group as stat, statIndex}
          {#if statIndex > 0}<span class="br-sep">=</span>{/if}
          <span class="br-stat" class:br-stat-ignored={ignoredStats().has(stat)}>{relationLabels[stat]}</span>
        {/each}
      {/each}
    </div>
    <div class="stats-table-heading" aria-hidden="true"><span>Stat</span><span>Base</span><span>Level</span><span>Bonus</span><span>CS</span><span>Total</span></div>
    {#each statKeys as stat}
      <div class="stat-breakdown-row" data-stat={stat}>
        <div class="stat-breakdown-label">
          <span>{STAT_LABELS[stat]}</span>
          <span class="stat-label-actions">
            {#if natureModifier(stat)}<span class:nature-up={natureModifier(stat) > 0} class:nature-down={natureModifier(stat) < 0} class="nature-indicator" title={`Nature ${natureModifier(stat) > 0 ? 'raises' : 'lowers'} ${STAT_LABELS[stat]} by ${Math.abs(natureModifier(stat))}`}>{natureModifier(stat) > 0 ? '▲' : '▼'} {Math.abs(natureModifier(stat))}</span>{/if}
            <label class="stat-relation-toggle" title="Keep this stat in Base Relation"><input class="stat-relation-checkbox" aria-label={`Keep ${STAT_LABELS[stat]} in Base Relation`} type="checkbox" checked={!ignoredStats().has(stat)} onchange={(event) => toggleRelation(stat, event.currentTarget.checked)} /></label>
          </span>
        </div>
        <div class="stat-cell base-cell" class:base-modified={isBaseModified(stat)}><input aria-label={`${STAT_LABELS[stat]} base stat after Nature`} type="number" min="0" value={effectiveBase(stat)} onchange={(event) => updateBase(stat, Number(event.currentTarget.value))} />{#if isBaseModified(stat)}<span class="base-modified-indicator" aria-label={`${STAT_LABELS[stat]} base stat modified`} title={`Original base stat: ${originalBase(stat)}`}></span>{/if}</div>
        <div class="stat-cell"><input aria-label={`${STAT_LABELS[stat]} level points`} type="number" value={levelPoints(stat)} onchange={(event) => updateLevel(stat, Number(event.currentTarget.value))} /></div>
        <div class="stat-cell"><input aria-label={`${STAT_LABELS[stat]} bonus`} type="number" value={statBonus(stat)} onchange={(event) => updateBonus(stat, Number(event.currentTarget.value))} /></div>
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
  .stats-section{box-sizing:border-box;width:100%;max-width:100%;min-width:0}
  .stats-breakdown{box-sizing:border-box;width:100%;max-width:100%;min-width:0;overflow:hidden}
  .stats-table-heading,.stat-breakdown-row{box-sizing:border-box;display:grid;width:100%;max-width:100%;min-width:0;grid-template-columns:minmax(82px,1.15fr) repeat(3,minmax(0,.72fr)) minmax(0,.5fr) minmax(0,.55fr);gap:4px;align-items:center}
  .stats-table-heading{padding:0 5px 3px;color:var(--text-tertiary);font-size:.68rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;text-align:center}
  .stats-table-heading span{min-width:0;overflow:hidden;text-overflow:ellipsis}.stats-table-heading span:first-child{text-align:left}
  .stat-breakdown-row{min-height:34px;padding:3px 5px}
  .stat-breakdown-label{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:3px;font-size:.8rem}
  .stat-breakdown-label>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .stat-label-actions{display:flex;flex:0 0 auto;align-items:center;gap:2px}
  .stat-cell{display:flex;align-items:center;justify-content:center;gap:3px;min-width:0}
  .stat-cell input{box-sizing:border-box;width:100%;min-width:0;height:26px;padding:2px;text-align:center;font:inherit}
  .base-cell{position:relative}
  .base-modified-indicator{position:absolute;top:3px;right:3px;width:5px;height:5px;border-radius:50%;background:#d89b28;box-shadow:0 0 0 1px var(--bg-main);pointer-events:none}
  .base-modified input{border-color:color-mix(in srgb,#d89b28 45%,var(--border-color))}
  .stat-total{text-align:center;font-weight:750;color:var(--primary-color)}
  .no-combat-stage{color:var(--text-tertiary);font-weight:700}
  .nature-indicator{flex:0 0 auto;border-radius:999px;padding:1px 4px;font-size:.62rem;font-weight:800;line-height:1.25}
  .nature-up{background:#d9f6e5;color:#187445}.nature-down{background:#fde1e1;color:#b12a2a}
  @container(max-width:430px){
    .stats-breakdown{padding-inline:5px}
    .stats-table-heading,.stat-breakdown-row{grid-template-columns:minmax(62px,1fr) repeat(3,minmax(0,.7fr)) minmax(0,.48fr) minmax(0,.5fr);gap:2px}
    .stats-table-heading{padding-inline:2px;font-size:.58rem;letter-spacing:0}
    .stat-breakdown-row{padding-inline:2px}
    .stat-breakdown-label{font-size:.7rem}
    .stat-cell input{height:24px;padding-inline:1px;font-size:.72rem}
    .nature-indicator{padding-inline:2px;font-size:.52rem}
    .stat-relation-checkbox{width:13px;height:13px}
    .stat-total{font-size:.75rem}
  }
  @container(max-width:330px){
    .stats-table-heading,.stat-breakdown-row{grid-template-columns:minmax(54px,.95fr) repeat(3,minmax(0,.7fr)) minmax(0,.45fr) minmax(0,.48fr)}
    .nature-indicator{display:none}
  }
</style>
