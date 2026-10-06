<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { allMoves, availableMoves } from '../lib/api';
  import { frequencyUses, slug } from '../lib/pokemon';
  import { damageBase, damageRange, moveDamageBase, rollFormula, setDefaultStab, struggleTypes, toggleStab } from '../lib/moves';
  import { requestOwlbear } from '../lib/owlbear';
  import PickerModal from './PickerModal.svelte';
  let { pokemon, onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  let picker = $state(false); let items = $state<any[]>([]); let loading = $state(false); let globalList = $state(false);
  let rolling = $state('');
  let feedbackKey = $state('');
  let feedbackState = $state<'idle' | 'rolling' | 'success' | 'error'>('idle');
  const embedded = new URLSearchParams(location.search).get('embedded') === 'true';
  const justDices = $derived(embedded && pokemon.owlbear?.diceRoller === 'justdices');
  const struggle = $derived(pokemon.struggle);
  function flatten(value: any): any[] { return Array.isArray(value) ? value : Object.values(value || {}).filter(Array.isArray).flat() as any[]; }
  async function loadPickerItems(all = false) { loading = true; try { items = flatten(all ? await allMoves(pokemon) : await availableMoves(pokemon)); globalList = all; } finally { loading = false; } }
  async function openPicker() { picker = true; await loadPickerItems(false); }
  function pick(item: any) { const index = pokemon.moves!.findIndex(move => move.name === item.name); if (index >= 0) pokemon.moves!.splice(index, 1); else pokemon.moves!.push(setDefaultStab(pokemon, { ...item, damageBase: item.damageBase ? { ...item.damageBase } : item.damageBase, usageCount: 0 })); onsave(); }
  function blank() { pokemon.moves!.push({ name: `Custom Move ${pokemon.moves!.length + 1}`, type: '', frequency: '', class: '', range: '', ac: '', effect: '', usageCount: 0, editable: true }); onsave(); }
  function remove(index: number) { pokemon.moves!.splice(index, 1); onsave(); }
  function usage(move: any, index: number) { move.usageCount = move.usageCount === index + 1 ? index : index + 1; onsave(); }
  function adjustDb(move: any, delta: number) {
    const db = moveDamageBase(move) + delta;
    move.db = Math.max(1, Math.min(28, db)); move.damageBase = damageBase(move.db, Boolean(move.damageBase?.stab)); onsave();
  }
  function changeStab(move: any) { toggleStab(move); onsave(); }
  function stabLabel(move: any) { return move.damageBase?.stab ? `Remove STAB from ${move.name}` : `Apply STAB to ${move.name}`; }
  function cycleStruggleType() { const types = struggleTypes(pokemon); struggle.type = types[(types.indexOf(struggle.type) + 1) % types.length]; onsave(); }
  function toggleClass(move: any) { const value = String(move.class || '').toLowerCase(); if (value === 'physical' || value === 'special') { move.class = value === 'physical' ? 'special' : 'physical'; onsave(); } }
  async function useRoll(move: any, critical = false) {
    const formula = rollFormula(pokemon, move, critical); if (!formula) return;
    const key = `${move.name || 'move'}:${critical}`;
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
  function rollLabel(move: any, critical = false) {
    const state = rollButtonState(move, critical);
    if (state === 'rolling') return '…';
    if (state === 'success') return '✓';
    if (state === 'error') return '!';
    if (critical) return 'Crit';
    return justDices ? 'Roll' : 'Copy';
  }
  function rollButtonState(move: any, critical = false) {
    return feedbackKey === `${move.name || 'move'}:${critical}` ? feedbackState : 'idle';
  }
</script>

<div class="section">
  <div class="flex-between-center-15"><h3 class="section-title">⚔️ Moves</h3><div class="button-group"><button type="button" class="edit-bn" onclick={openPicker}>✎ Edit</button><button type="button" class="edit-bn" onclick={blank}>+ Blank</button></div></div>
  <div class="section-list">
    <article class="section-card move struggle-card type-{slug(struggle.type)}">
      <div class="section-card-header"><div class="section-card-name">Struggle <button type="button" class="move-badge type-{slug(struggle.type)}" onclick={cycleStruggleType}>{struggle.type}</button> <button type="button" class="move-badge move-class-{slug(struggle.class)}" onclick={() => toggleClass(struggle)}>{struggle.class}</button></div></div>
      <div class="move-meta-row"><div class="section-card-field"><strong>Range:</strong> {struggle.range}</div><label class="section-card-field"><strong>AC:</strong> <input class="struggle-ac-input" type="number" min="1" max="20" value={struggle.ac} onchange={(event) => { struggle.ac = Number(event.currentTarget.value); onsave(); }} /></label></div>
      <div class="section-card-field db-field"><div class="db-summary"><span class="db-identity"><strong>{struggle.damageBase.short}</strong><button type="button" class="db-stab-badge" class:is-active={Boolean(struggle.damageBase.stab)} aria-label={stabLabel(struggle)} aria-pressed={Boolean(struggle.damageBase.stab)} title="Toggle STAB (+2 DB)" onclick={() => changeStab(struggle)}>STAB</button></span><span class="db-formula">{struggle.damageBase.dmg}<span class="db-attack-bonus">+{pokemon.stats[struggle.class === 'physical' ? 'atk' : 'spA']}</span></span>{#if damageRange(pokemon, struggle)}{@const range = damageRange(pokemon, struggle)!}<span class="db-range">{range.min}<span class="db-range-separator">|</span><strong>{range.avg}</strong><span class="db-range-separator">|</span>{range.max}</span>{/if}</div><div class="db-actions"><span class="db-stepper"><button type="button" class="db-adjust-btn" aria-label="Decrease damage base" onclick={() => adjustDb(struggle, -1)}>−</button><button type="button" class="db-adjust-btn" aria-label="Increase damage base" onclick={() => adjustDb(struggle, 1)}>+</button></span><button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(struggle) === 'success'} class:is-error={rollButtonState(struggle) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll directly with JustDices' : 'Copy the roll command'} onclick={() => useRoll(struggle)}>{rollLabel(struggle)}</button><button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(struggle, true) === 'success'} class:is-error={rollButtonState(struggle, true) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll critical damage directly with JustDices' : 'Copy the critical roll command'} onclick={() => useRoll(struggle, true)}>{rollLabel(struggle, true)}</button></div></div>
    </article>
    {#each pokemon.moves || [] as move, index}
      <article class="section-card move type-{slug(move.type)}">
        <div class="section-card-header">{#if move.editable}<input class="custom-move-name-input" bind:value={move.name} onchange={onsave} />{:else}<div class="section-card-name">{move.name}{#if move.type}<span class="move-badge type-{slug(move.type)}">{move.type}</span>{/if}{#if move.class}<button type="button" class="move-badge move-class-{slug(move.class)}" onclick={() => toggleClass(move)}>{move.class}</button>{/if}</div>{/if}<button type="button" class="remove-move-btn" onclick={() => remove(index)}>✕ Remove</button></div>
        {#if move.editable}<div class="editable-grid">
          {#each ['type', 'frequency', 'class', 'range', 'ac'] as field}<label class="section-card-field"><strong>{field === 'ac' ? 'AC' : field[0].toUpperCase() + field.slice(1)}:</strong><input bind:value={move[field]} onchange={onsave} /></label>{/each}
          <label class="section-card-field wide"><strong>Effect:</strong><textarea bind:value={move.effect} onchange={onsave}></textarea></label>
        </div>{:else}
          <div class="move-meta-row"><div class="section-card-field"><strong>Type:</strong> {move.type || 'N/A'}</div><div class="section-card-field"><strong>Class:</strong> {move.class || 'N/A'}</div><div class="section-card-field"><strong>Range:</strong> {move.range || 'N/A'}</div>{#if move.ac}<div class="section-card-field"><strong>AC:</strong> {move.ac}</div>{/if}</div>
          <div class="section-card-field"><strong>Frequency:</strong> {move.frequency || 'N/A'}</div>
          {#if move.damageBase}<div class="section-card-field db-field"><div class="db-summary"><span class="db-identity"><strong>{move.damageBase.short}</strong><button type="button" class="db-stab-badge" class:is-active={Boolean(move.damageBase.stab)} aria-label={stabLabel(move)} aria-pressed={Boolean(move.damageBase.stab)} title="Toggle STAB (+2 DB)" onclick={() => changeStab(move)}>STAB</button></span><span class="db-formula">{move.damageBase.dmg}</span>{#if damageRange(pokemon, move)}{@const range = damageRange(pokemon, move)!}<span class="db-range">{range.min}<span class="db-range-separator">|</span><strong>{range.avg}</strong><span class="db-range-separator">|</span>{range.max}</span>{/if}</div><div class="db-actions"><span class="db-stepper"><button type="button" class="db-adjust-btn" aria-label={`Decrease ${move.name} damage base`} onclick={() => adjustDb(move, -1)}>−</button><button type="button" class="db-adjust-btn" aria-label={`Increase ${move.name} damage base`} onclick={() => adjustDb(move, 1)}>+</button></span>{#if rollFormula(pokemon, move)}<button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(move) === 'success'} class:is-error={rollButtonState(move) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll directly with JustDices' : 'Copy the roll command'} onclick={() => useRoll(move)}>{rollLabel(move)}</button><button type="button" class="copy-roll-formula-btn" class:is-success={rollButtonState(move, true) === 'success'} class:is-error={rollButtonState(move, true) === 'error'} disabled={Boolean(rolling)} title={justDices ? 'Roll critical damage directly with JustDices' : 'Copy the critical roll command'} onclick={() => useRoll(move, true)}>{rollLabel(move, true)}</button>{/if}</div></div>{/if}
          {#if move.effect}<div class="section-card-field"><strong>Effect:</strong> {move.effect}</div>{/if}
        {/if}
        {#if move.frequency}<div class="usage-tracker"><span class="usage-label">Uses:</span><div class="usage-boxes">{#each Array(frequencyUses(move.frequency)) as _, use}<button type="button" aria-label={`Use ${use + 1}`} class:checked={(move.usageCount || 0) > use} class="usage-checkbox" onclick={() => usage(move, use)}></button>{/each}</div></div>{/if}
      </article>
    {:else}<div class="empty-state compact">No moves yet.</div>{/each}
  </div>
</div>
{#if picker}<PickerModal title={loading ? 'Loading moves…' : globalList ? 'Add Move — Global List' : 'Add Move — Species List'} {items} selected={(pokemon.moves || []).map(item => item.name)} actionLabel={globalList ? 'Show species moves' : 'Search all moves'} actionDisabled={loading} onaction={() => loadPickerItems(!globalList)} onpick={pick} onclose={() => picker = false} />{/if}

<style>.editable-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}.wide{grid-column:1/-1}.wide textarea{width:100%}.copy-roll-formula-btn.is-success{border-color:#62bd83;background:#d9f6e5;color:#187445}.copy-roll-formula-btn.is-error{border-color:#df7b7b;background:#fde1e1;color:#b12a2a}</style>
