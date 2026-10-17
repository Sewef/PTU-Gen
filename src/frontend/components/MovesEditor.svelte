<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { allMoves, availableMoves } from '../lib/api';
  import { frequencyUses, selectableTypes, slug } from '../lib/pokemon';
  import { attackValue, baseDamageBase, damageBase, damageRange, doubleStrikeCases, fiveStrikeCases, hasDoubleStrike, hasFiveStrike, moveDamageBase, rollFormula, setDefaultStab, toggleStab } from '../lib/moves';
  import { requestOwlbear } from '../lib/owlbear';
  import PickerModal from './PickerModal.svelte';
  import TypePickerModal from './TypePickerModal.svelte';
  import RangePickerModal from './RangePickerModal.svelte';
  let { pokemon, onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  let picker = $state(false); let items = $state<any[]>([]); let loading = $state(false); let globalList = $state(false);
  let rolling = $state('');
  let typeTarget = $state.raw<any | null>(null);
  let rangeTarget = $state.raw<any | null>(null);
  let feedbackKey = $state('');
  let feedbackState = $state<'idle' | 'rolling' | 'success' | 'error'>('idle');
  const embedded = new URLSearchParams(location.search).get('embedded') === 'true';
  const justDices = $derived(embedded && pokemon.owlbear?.diceRoller === 'justdices');
  const struggle = $derived(pokemon.struggle);
  function flatten(value: any): any[] { return Array.isArray(value) ? value : Object.values(value || {}).filter(Array.isArray).flat() as any[]; }
  async function loadPickerItems(all = false) { loading = true; try { items = flatten(all ? await allMoves(pokemon) : await availableMoves(pokemon)); globalList = all; } finally { loading = false; } }
  async function openPicker() { picker = true; await loadPickerItems(false); }
  function pick(item: any) { const index = pokemon.moves!.findIndex(move => move.name === item.name); if (index >= 0) pokemon.moves!.splice(index, 1); else pokemon.moves!.push(setDefaultStab(pokemon, { ...item, damageBase: item.damageBase ? { ...item.damageBase } : item.damageBase, usageCount: 0 })); onsave(); }
  function blank() { pokemon.moves!.push({ name: `Custom Move ${pokemon.moves!.length + 1}`, type: 'Typeless', frequency: '', class: 'Physical', range: '', ac: '', db: 4, damageBase: damageBase(4), effect: '', usageCount: 0, editable: true }); onsave(); }
  function remove(index: number) { pokemon.moves!.splice(index, 1); onsave(); }
  function usage(move: any, index: number) { move.usageCount = move.usageCount === index + 1 ? index : index + 1; onsave(); }
  function adjustDb(move: any, delta: number) {
    const db = moveDamageBase(move) + delta;
    const activeStab = Boolean(move.damageBase?.stab);
    const baseDb = activeStab ? Number(move.damageBase?.baseDb || moveDamageBase(move) - 2) + delta : undefined;
    move.db = Math.max(1, Math.min(28, db)); move.damageBase = damageBase(move.db, activeStab, baseDb); onsave();
  }
  function changeStab(move: any) { toggleStab(move); onsave(); }
  function stabLabel(move: any) { return move.damageBase?.stab ? `Remove STAB from ${move.name}` : `Apply STAB to ${move.name}`; }
  function changeType(types: string[]) {
    const move = typeTarget;
    const type = types[0];
    if (!move || !type) return;
    const isStruggle = move === pokemon.struggle;
    if (move.damageBase && !move.stabCustomized) {
      const baseDb = baseDamageBase(move);
      move.db = baseDb;
      move.damageBase = damageBase(baseDb, false, baseDb);
    }
    move.type = type;
    if (!isStruggle) setDefaultStab(pokemon, move);
    typeTarget = null;
    onsave();
  }
  function openTypePicker(move: any) { typeTarget = move; }
  function changeRange(range: string) {
    if (!rangeTarget) return;
    rangeTarget.range = range;
    rangeTarget = null;
    onsave();
  }
  function openRangeEditor(move: any) { rangeTarget = move; }
  function toggleClass(move: any) { const value = String(move.class || '').toLowerCase(); if (value === 'physical' || value === 'special') { move.class = value === 'physical' ? 'special' : 'physical'; onsave(); } }
  function changeCustomClass(move: any, moveClass: string) {
    move.class = moveClass;
    if (!move.stabCustomized && move.damageBase) {
      if (moveClass === 'Status' && move.damageBase.stab) {
        const db = baseDamageBase(move);
        move.db = db;
        move.damageBase = damageBase(db, false, db);
      } else {
        setDefaultStab(pokemon, move);
      }
    }
    onsave();
  }
  async function useFormula(move: any, formula: string | null, variant: string) {
    if (!formula) return;
    const key = `${move.name || 'move'}:${variant}`;
    rolling = key;
    feedbackKey = key;
    feedbackState = 'rolling';
    try {
      if (justDices) {
        await requestOwlbear('roll-justdices', { callId: crypto.randomUUID(), expression: `/r ${formula}`, showInLogs: true });
      } else {
        await navigator.clipboard.writeText(`/r ${formula}`);
      }
      feedbackState = 'success';
    } catch {
      feedbackState = 'error';
    } finally {
      rolling = '';
      window.setTimeout(() => {
        if (feedbackKey === key) {
          feedbackKey = '';
          feedbackState = 'idle';
        }
      }, 1200);
    }
  }
  function useRoll(move: any, critical = false) { return useFormula(move, rollFormula(pokemon, move, critical), critical ? 'critical' : 'normal'); }
  function strikeKeyword(move: any) { return hasDoubleStrike(move) ? 'Double Strike' : hasFiveStrike(move) ? 'Five Strike' : ''; }
  function strikeCases(move: any) {
    if (hasDoubleStrike(move)) return doubleStrikeCases(pokemon, move).map(result => ({ ...result, variant: `double-strike-${result.hits}-${result.criticals}`, criticalFormula: null, criticalVariant: '' }));
    if (hasFiveStrike(move)) return fiveStrikeCases(pokemon, move).map(result => ({ ...result, variant: `five-strike-${result.hits}`, criticalVariant: `five-strike-${result.hits}-critical` }));
    return [];
  }
  function rollLabel(move: any, critical = false) {
    const state = rollButtonState(move, critical);
    if (state === 'rolling') return '…';
    if (state === 'success') return '✓';
    if (state === 'error') return '!';
    if (critical) return 'Crit';
    return justDices ? 'Roll' : 'Copy';
  }
  function rollButtonState(move: any, critical = false) {
    return variantButtonState(move, critical ? 'critical' : 'normal');
  }
  function variantButtonState(move: any, variant: string) { return feedbackKey === `${move.name || 'move'}:${variant}` ? feedbackState : 'idle'; }
  function variantRollLabel(move: any, variant: string, idleLabel = justDices ? 'Roll' : 'Copy') {
    const state = variantButtonState(move, variant);
    if (state === 'rolling') return '…';
    if (state === 'success') return '✓';
    if (state === 'error') return '!';
    return idleLabel;
  }
</script>

<div class="section">
  <div class="flex-between-center-15"><h3 class="section-title">⚔️ Moves</h3><div class="button-group"><button type="button" class="edit-bn" onclick={openPicker}>✎ Edit</button><button type="button" class="edit-bn" onclick={blank}>+ Blank</button></div></div>
  <div class="section-list">
    <article class="section-card move struggle-card type-{slug(struggle.type)}">
      <div class="section-card-header"><div class="section-card-name">Struggle <button type="button" class="move-badge type-{slug(struggle.type)} move-type-picker" aria-label="Change Struggle type" onclick={() => openTypePicker(struggle)}>{struggle.type}</button> <button type="button" class="move-badge move-class-{slug(struggle.class)}" onclick={() => toggleClass(struggle)}>{struggle.class}</button></div></div>
      <div class="move-meta-row"><div class="section-card-field"><strong>Range:</strong> {struggle.range} <button type="button" class="edit-bn range-edit-bn" aria-label="Edit Struggle range keywords" onclick={() => openRangeEditor(struggle)}>✎</button></div><label class="section-card-field"><strong>AC:</strong> <input class="struggle-ac-input" type="number" min="1" max="20" value={struggle.ac} onchange={(event) => { struggle.ac = Number(event.currentTarget.value); onsave(); }} /></label></div>
      <div class="section-card-field db-field"><div class="db-summary"><span class="db-identity"><strong>{struggle.damageBase.short}</strong></span><span class="db-formula">{struggle.damageBase.dmg}<span class="db-attack-bonus">+{attackValue(pokemon, struggle)}</span></span>{#if damageRange(pokemon, struggle)}{@const range = damageRange(pokemon, struggle)!}<span class="db-range">{range.min}<span class="db-range-separator">|</span><strong>{range.avg}</strong><span class="db-range-separator">|</span>{range.max}</span>{/if}</div><div class="db-actions"><span class="db-stepper"><button type="button" class="db-adjust-btn" aria-label="Decrease damage base" onclick={() => adjustDb(struggle, -1)}>−</button><button type="button" class="db-adjust-btn" aria-label="Increase damage base" onclick={() => adjustDb(struggle, 1)}>+</button></span><button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(struggle) === 'success'} class:is-error={rollButtonState(struggle) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll directly with JustDices' : 'Copy the roll command'} onclick={() => useRoll(struggle)}>{rollLabel(struggle)}</button><button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(struggle, true) === 'success'} class:is-error={rollButtonState(struggle, true) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll critical damage directly with JustDices' : 'Copy the critical roll command'} onclick={() => useRoll(struggle, true)}>{rollLabel(struggle, true)}</button></div></div>
    </article>
    {#each pokemon.moves || [] as move, index}
      <article class="section-card move type-{slug(move.type)}">
        <div class="section-card-header">{#if move.editable}<div class="section-card-name custom-move-heading"><input class="custom-move-name-input" aria-label="Custom move name" bind:value={move.name} onchange={onsave} /><button type="button" class="move-badge type-{slug(move.type)} move-type-picker" aria-label={`Change ${move.name} type`} onclick={() => openTypePicker(move)}>{move.type || 'Typeless'}</button><select class="move-badge custom-move-class-input move-class-{slug(move.class)}" aria-label={`${move.name} class`} value={move.class} onchange={(event) => changeCustomClass(move, event.currentTarget.value)}>{#each ['Physical', 'Special', 'Status', 'Versatile'] as moveClass}<option value={moveClass}>{moveClass}</option>{/each}</select></div>{:else}<div class="section-card-name">{move.name}{#if move.type}<button type="button" class="move-badge type-{slug(move.type)} move-type-picker" aria-label={`Change ${move.name} type`} onclick={() => openTypePicker(move)}>{move.type}</button>{/if}{#if move.class}<button type="button" class="move-badge move-class-{slug(move.class)}" onclick={() => toggleClass(move)}>{move.class}</button>{/if}</div>{/if}<button type="button" class="remove-move-btn" onclick={() => remove(index)}>✕ Remove</button></div>
        {#if move.editable}
          <div class="move-meta-row custom-move-meta-row"><div class="section-card-field"><strong>Range:</strong> {move.range || 'Add range keywords'} <button type="button" class="edit-bn range-edit-bn" aria-label={`Edit ${move.name} range keywords`} onclick={() => openRangeEditor(move)}>✎</button></div><label class="section-card-field"><strong>AC:</strong> <input class="struggle-ac-input custom-move-ac-input" aria-label={`${move.name} AC`} type="number" min="1" max="20" value={move.ac} onchange={(event) => { move.ac = event.currentTarget.value === '' ? '' : Number(event.currentTarget.value); onsave(); }} /></label></div>
          <label class="section-card-field custom-move-frequency"><strong>Frequency:</strong> <input class="custom-move-frequency-input" aria-label={`${move.name} frequency`} bind:value={move.frequency} onchange={onsave} /></label>
        {:else}
          <div class="move-meta-row"><div class="section-card-field"><strong>Range:</strong> {move.range || 'N/A'} <button type="button" class="edit-bn range-edit-bn" aria-label={`Edit ${move.name} range keywords`} onclick={() => openRangeEditor(move)}>✎</button></div>{#if move.ac !== undefined && move.ac !== null && move.ac !== ''}<label class="section-card-field"><strong>AC:</strong> <input class="struggle-ac-input" aria-label={`${move.name} AC`} type="number" min="1" max="20" value={move.ac} onchange={(event) => { move.ac = Number(event.currentTarget.value); onsave(); }} /></label>{/if}</div>
          <div class="section-card-field"><strong>Frequency:</strong> {move.frequency || 'N/A'}</div>
        {/if}
        {#if move.damageBase}
          {@const strike = strikeKeyword(move)}
          <div class="section-card-field db-field" class:is-multi-strike={Boolean(strike)}>
            <div class="db-summary">
              <span class="db-identity"><strong>{move.damageBase.short}</strong><button type="button" class="db-stab-badge" class:is-active={Boolean(move.damageBase.stab)} aria-label={stabLabel(move)} aria-pressed={Boolean(move.damageBase.stab)} title="Toggle STAB (+2 DB)" onclick={() => changeStab(move)}>STAB</button></span>
              {#if strike}
                <span class="multi-strike-badge">{strike}</span>
              {:else}
                <span class="db-formula">{move.damageBase.dmg}{#if attackValue(pokemon, move) !== null}<span class="db-attack-bonus">+{attackValue(pokemon, move)}</span>{/if}</span>
                {#if damageRange(pokemon, move)}{@const range = damageRange(pokemon, move)!}<span class="db-range">{range.min}<span class="db-range-separator">|</span><strong>{range.avg}</strong><span class="db-range-separator">|</span>{range.max}</span>{/if}
              {/if}
            </div>
            <div class="db-actions"><span class="db-stepper"><button type="button" class="db-adjust-btn" aria-label={`Decrease ${move.name} damage base`} onclick={() => adjustDb(move, -1)}>−</button><button type="button" class="db-adjust-btn" aria-label={`Increase ${move.name} damage base`} onclick={() => adjustDb(move, 1)}>+</button></span>{#if !strike && rollFormula(pokemon, move)}<button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(move) === 'success'} class:is-error={rollButtonState(move) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll directly with JustDices' : 'Copy the roll command'} onclick={() => useRoll(move)}>{rollLabel(move)}</button><button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(move, true) === 'success'} class:is-error={rollButtonState(move, true) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll critical damage directly with JustDices' : 'Copy the critical roll command'} onclick={() => useRoll(move, true)}>{rollLabel(move, true)}</button>{/if}</div>
            {#if strike}
              <div class="multi-strike-cases">
                {#each strikeCases(move) as result}
                  <div class="multi-strike-case">
                    <strong class="multi-strike-label">{result.label}</strong>
                    <span class="db-formula">{result.formula}</span>
                    {#if result.range}<span class="db-range">{result.range.min}<span class="db-range-separator">|</span><strong>{result.range.avg}</strong><span class="db-range-separator">|</span>{result.range.max}</span>{/if}
                    <span class="multi-strike-actions"><button type="button" class="copy-roll-formula-btn" class:is-success={variantButtonState(move, result.variant) === 'success'} class:is-error={variantButtonState(move, result.variant) === 'error'} disabled={Boolean(rolling)} title={justDices ? `Roll ${result.label}` : `Copy ${result.label}`} onclick={() => useFormula(move, result.formula, result.variant)}>{variantRollLabel(move, result.variant)}</button>{#if result.criticalFormula}<button type="button" class="copy-roll-formula-btn" class:is-success={variantButtonState(move, result.criticalVariant) === 'success'} class:is-error={variantButtonState(move, result.criticalVariant) === 'error'} disabled={Boolean(rolling)} title={justDices ? `Roll critical damage for ${result.label}` : `Copy critical damage for ${result.label}`} onclick={() => useFormula(move, result.criticalFormula, result.criticalVariant)}>{variantRollLabel(move, result.criticalVariant, 'Crit')}</button>{/if}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        {#if move.editable}
          <label class="section-card-field custom-move-effect"><strong>Effect:</strong><textarea bind:value={move.effect} onchange={onsave}></textarea></label>
        {:else if move.effect}<div class="section-card-field"><strong>Effect:</strong> {move.effect}</div>{/if}
        {#if move.frequency}<div class="usage-tracker"><span class="usage-label">Uses:</span><div class="usage-boxes">{#each Array(frequencyUses(move.frequency)) as _, use}<button type="button" aria-label={`Use ${use + 1}`} class:checked={(move.usageCount || 0) > use} class="usage-checkbox" onclick={() => usage(move, use)}></button>{/each}</div></div>{/if}
      </article>
    {:else}<div class="empty-state compact">No moves yet.</div>{/each}
  </div>
</div>
{#if picker}<PickerModal title={loading ? 'Loading moves…' : globalList ? 'Add Move — Global List' : 'Add Move — Species List'} {items} selected={(pokemon.moves || []).map(item => item.name)} actionLabel={globalList ? 'Show species moves' : 'Search all moves'} actionDisabled={loading} onaction={() => loadPickerItems(!globalList)} onpick={pick} onclose={() => picker = false} />{/if}
{#if typeTarget}<TypePickerModal title={`Select ${typeTarget.name || 'Move'} Type`} types={selectableTypes(pokemon)} selected={typeTarget.type ? [typeTarget.type] : []} onsave={changeType} onclose={() => typeTarget = null} />{/if}
{#if rangeTarget}<RangePickerModal range={rangeTarget.range || ''} onsave={changeRange} onclose={() => rangeTarget = null} />{/if}

<style>
  .move-type-picker{border:0;cursor:pointer;font-family:inherit}
  .custom-move-heading{display:flex;align-items:center;flex:1;min-width:0;gap:6px;margin-bottom:0}
  .custom-move-heading .move-badge{margin-left:0}
  .custom-move-name-input{box-sizing:border-box;flex:0 1 155px;width:155px;min-width:85px;max-width:155px;padding:3px 6px}
  .custom-move-class-input{box-sizing:border-box;flex:0 0 90px;width:90px;min-width:90px;max-width:90px;margin:0;padding:3px 22px 3px 8px;border:0;border-radius:3px;color:#fff;font-family:inherit;font-size:.75em;font-weight:600;line-height:normal;text-transform:uppercase;vertical-align:middle;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 7px center;background-size:10px 6px}
  .custom-move-class-input option{background:var(--bg-main);color:var(--text-primary);font-size:1rem;text-transform:none}
  .custom-move-meta-row{align-items:center}
  .custom-move-frequency{display:flex;align-items:center;gap:5px}
  .custom-move-frequency-input{box-sizing:border-box;width:120px;min-width:0;padding:2px 5px}
  .custom-move-effect{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:5px}
  .custom-move-effect textarea{box-sizing:border-box;width:100%;min-width:0}
  .copy-roll-formula-btn.is-success{border-color:#62bd83;background:#d9f6e5;color:#187445}
  .copy-roll-formula-btn.is-error{border-color:#df7b7b;background:#fde1e1;color:#b12a2a}
  @media(max-width:480px){.custom-move-heading{flex-wrap:wrap}.custom-move-name-input{flex-basis:130px;width:130px}.custom-move-effect{grid-template-columns:1fr}}
</style>
