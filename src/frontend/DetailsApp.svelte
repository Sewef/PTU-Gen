<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from './lib/types';
  import { ALL_TYPES, calculateHp, normalizePokemon, pokemonImage, pokemonTypes, slug } from './lib/pokemon';
  import { typeEffectiveness } from './lib/type-effectiveness';
  import { getNatures } from './lib/api';
  import { readSelected, savePokemon } from './lib/storage';
  import { listenOwlbear, requestOwlbear, type OwlbearPlayer } from './lib/owlbear';
  import ExportMenu from './components/ExportMenu.svelte';
  import StatsEditor from './components/StatsEditor.svelte';
  import AbilitiesEditor from './components/AbilitiesEditor.svelte';
  import MovesEditor from './components/MovesEditor.svelte';
  import PokeEdgesEditor from './components/PokeEdgesEditor.svelte';
  import TypeEffectiveness from './components/TypeEffectiveness.svelte';
  import CaptureCalculator from './components/CaptureCalculator.svelte';
  import SkillsEditor from './components/SkillsEditor.svelte';
  import CapabilitiesEditor from './components/CapabilitiesEditor.svelte';

  const storageKey = new URLSearchParams(location.search).get('pokemonKey') || 'selectedPokemon';
  const embedded = new URLSearchParams(location.search).get('embedded') === 'true';
  let pokemon = $state<Pokemon | null>(null);
  let error = $state('');
  let damageAmount = $state(0);
  let damageType = $state('typeless');
  let damageCategory = $state<'physical' | 'special'>('physical');
  let typesEditing = $state(false);
  let typeDraft = $state<string[]>([]);
  let otherInfoOpen = $state(!embedded);
  let owlbearBusy = $state(false);
  let owlbearStatus = $state('');
  let owlbearError = $state(false);
  let currentPlayer = $state<OwlbearPlayer | null>(null);
  let roomPlayers = $state<OwlbearPlayer[]>([]);
  let natures = $state<any[]>([]);

  const displayedTypes = $derived(pokemon ? pokemonTypes(pokemon) : []);
  const linkedToken = $derived(Boolean(pokemon?.owlbear?.tokenId));
  const effectiveness = $derived.by(() => {
    if (!pokemon || damageType === 'typeless') return 1;
    return Number(typeEffectiveness(pokemon)[damageType] ?? 1);
  });
  const defense = $derived(pokemon ? Number(pokemon.stats[damageCategory === 'physical' ? 'def' : 'spD'] || 0) : 0);
  const finalDamage = $derived(damageAmount > 0 ? (effectiveness === 0 ? 0 : Math.max(1, Math.floor(Math.max(1, damageAmount - defense) * effectiveness))) : 0);

  function fieldLabel(key: string) {
    const labels: Record<string, string> = {
      sizeCategory: 'Size Category', hatchRate: 'Hatch Rate', eggGroups: 'Egg Groups',
      basicInformation: 'Basic Information', capabilityList: 'Capabilities'
    };
    if (labels[key]) return labels[key];
    return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function integrationLabel(value: unknown, fallback: string) {
    const key = String(value || 'none').toLowerCase();
    if (key === 'none') return fallback;
    const labels: Record<string, string> = {
      owltrackers: 'Owl Trackers',
      prettysordid: 'Pretty Sordid',
      justdices: 'JustDices'
    };
    return labels[key] || fieldLabel(String(value));
  }

  function integrationActive(value: unknown) {
    return Boolean(value) && String(value).toLowerCase() !== 'none';
  }

  function persist() {
    if (!pokemon) return;
    savePokemon(pokemon, storageKey);
    document.title = `${pokemon.name} - Lvl ${pokemon.level} - Pokémon Details`;
  }

  function setFavicon() {
    if (!pokemon) return;
    const link = document.getElementById('dynamicFavicon') as HTMLLinkElement | null;
    if (link) link.href = pokemonImage(pokemon);
  }

  onMount(() => {
    if (embedded) document.body.classList.add('owlbear-embedded');
    const stored = readSelected(storageKey);
    if (!stored) { error = 'No Pokémon data found. Please generate or import one first.'; return () => { if (embedded) document.body.classList.remove('owlbear-embedded'); }; }
    pokemon = normalizePokemon(stored);
    persist(); setFavicon();
    void getNatures().then(result => natures = result.natures || []).catch(() => {});
    const stop = embedded ? listenOwlbear((current, players) => { currentPlayer = current; roomPlayers = players; }, applyTokenState) : () => {};
    if (embedded && pokemon.owlbear?.tokenId) refreshToken();
    return () => { stop(); if (embedded) document.body.classList.remove('owlbear-embedded'); };
  });

  function changeLevel() {
    if (!pokemon) return;
    pokemon.level = Math.min(100, Math.max(1, Number(pokemon.level) || 1));
    pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
    if (!pokemon.tutorPointsManual) pokemon.tutorPoints = Math.floor(pokemon.level / 5) + 1;
    persist();
  }

  function changeNature(name: string) {
    if (!pokemon) return;
    const nature = natures.find(item => String(item.name || item.Name) === name);
    if (!nature) return;
    pokemon.nature = nature;
    const calculator = (globalThis as any).PTUStatCalc;
    if (calculator && pokemon.baseStats) {
      const result = calculator.getDistributedPoints(pokemon.baseStats, pokemon.level, nature, pokemon.distribution || 'RANDOM', pokemon.ignoreBaseRelation);
      pokemon.baseWithNature = result.baseWithNature; pokemon.distributedPoints = result.distributedPoints;
      for (const stat of ['HP','atk','def','spA','spD','spe']) pokemon.stats[stat] = result.baseWithNature[stat] + (result.distributedPoints[stat] || 0);
      pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
    }
    persist();
  }

  function changeHpFormula() {
    if (!pokemon) return;
    pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
    persist();
  }

  function changeGender(gender: string) {
    if (!pokemon) return;
    pokemon.gender = gender;
    pokemon.otherInfo ||= {};
    pokemon.otherInfo.gender = gender;
    persist();
  }

  function openTypePicker() {
    typeDraft = [...displayedTypes];
    typesEditing = true;
  }

  function toggleType(type: string) {
    if (typeDraft.includes(type)) typeDraft = typeDraft.filter(value => value !== type);
    else typeDraft = [...typeDraft, type];
  }

  function saveTypes() {
    if (!pokemon || !typeDraft.length) return;
    pokemon.actualTypes = [...typeDraft];
    pokemon.types = [...typeDraft];
    typesEditing = false;
    persist();
  }

  function applyDamage() {
    if (!pokemon || damageAmount <= 0) return;
    pokemon.hitPoints = Number(pokemon.hitPoints) - finalDamage;
    persist();
  }

  function confirmedToken(token: any) {
    if (!pokemon || !token?.id) return;
    pokemon.owlbear ||= {};
    pokemon.owlbear.tokenId = token.id;
    pokemon.owlbear.visible = token.visible !== false;
    if (token.createdUserId) pokemon.owlbear.playerId = token.createdUserId;
    if (pokemon.owlbear.trackers === 'owltrackers' && token.owlTrackers) {
      const hp = token.owlTrackers.hp?.value == null ? NaN : Number(token.owlTrackers.hp.value);
      const hpMax = token.owlTrackers.hp?.max == null ? NaN : Number(token.owlTrackers.hp.max);
      const injuries = token.owlTrackers.injuries == null ? NaN : Number(token.owlTrackers.injuries);
      if (Number.isFinite(hp)) pokemon.hitPoints = Math.trunc(hp);
      if (Number.isFinite(hpMax) && hpMax > 0) pokemon.hitPointsMax = Math.trunc(hpMax);
      if (Number.isFinite(injuries)) pokemon.captureState!.standardCounts.injuries = Math.max(0, Math.trunc(injuries));
    }
    owlbearError = false; owlbearStatus = 'Token linked'; persist();
  }

  function applyTokenState(state: any) {
    if (!pokemon?.owlbear?.tokenId || state.tokenId !== pokemon.owlbear.tokenId) return;
    if (!state.exists) {
      pokemon.owlbear.tokenId = '';
      owlbearError = true;
      owlbearStatus = 'Token no longer in scene';
      persist();
      return;
    }
    confirmedToken({ ...state, id: state.id || state.tokenId });
  }

  async function owlAction(action: () => Promise<any>) {
    owlbearBusy = true; owlbearError = false; owlbearStatus = 'Working…';
    try { const result = await action(); if (result?.token) confirmedToken(result.token); else owlbearStatus = 'Done'; }
    catch (cause) { owlbearError = true; owlbearStatus = cause instanceof Error ? cause.message : 'Owlbear action failed'; }
    finally { owlbearBusy = false; }
  }

  function refreshToken() { if (pokemon?.owlbear?.tokenId) owlAction(() => requestOwlbear('get-token-state', { tokenId: pokemon!.owlbear.tokenId })); }
  function insertToken() {
    if (!pokemon) return;
    const builder = (window as any).buildOwlbearItem;
    if (typeof builder !== 'function') { owlbearStatus = 'Owlbear exporter unavailable'; return; }
    owlAction(() => requestOwlbear('insert-token', { item: builder(pokemon).item }));
  }
  function focusToken() { if (pokemon?.owlbear?.tokenId) owlAction(() => requestOwlbear('focus-token', { tokenId: pokemon!.owlbear.tokenId })); }
  function toggleVisibility() { if (pokemon?.owlbear?.tokenId) owlAction(() => requestOwlbear('set-token-visibility', { tokenId: pokemon!.owlbear.tokenId, visible: pokemon!.owlbear.visible === false })); }
  function changeOwner(userId: string) {
    if (!pokemon) return; pokemon.owlbear ||= {}; pokemon.owlbear.playerId = userId; persist();
    if (pokemon.owlbear.tokenId) owlAction(() => requestOwlbear('set-token-owner', { tokenId: pokemon!.owlbear.tokenId, createdUserId: userId }));
  }
</script>

<div class="container">
  <header class="header">
    <div class="header-top"><a href="/index.html" class="header-back">← Back to Generator</a></div>
    <h1 class="header-title"><img src={embedded ? 'https://ptu-gen.sewef.workers.dev/logo.png' : '/logo.png'} alt="PTU" class="header-logo" /> Pokémon Details</h1>
  </header>

  <main id="pokemonDisplay" class="pokemon-display">
    {#if error}<div class="error">❌ {error}</div>
    {:else if !pokemon}<div class="details-loading">Loading…</div>
    {:else}
      <section class="pokemon-header">
        <div class="pokemon-header-content">
          <img src={pokemonImage(pokemon, 'full')} alt={pokemon.name} class="pokemon-header-image" />
          <div class="pokemon-header-text">
            <div class="flex-header"><div class="pokemon-title">#{Number(pokemon.id) || 0} {pokemon.name}</div>{#if pokemon.shiny}<div class="shiny-badge">✨ SHINY</div>{/if}</div>
            <input type="text" bind:value={pokemon.nickname} onchange={persist} placeholder="Nickname" class="nickname-field" maxlength="20" />
            <div class="pokemon-meta">Level {pokemon.level} • {pokemon.dataset || 'Core'} Dataset{pokemon._fandex ? ` • ${pokemon._fandex}` : ''}</div>
          </div>
          <div class="export-button-wrapper header-actions">
            {#if embedded}
              <div class="owlbear-utilities-panel" aria-label="Owlbear scene utilities">
                <div class="owlbear-utilities-header"><div class="owlbear-utilities-title">Owlbear Scene</div><div class="owlbear-utilities-header-actions"><span class="owlbear-token-status" class:is-error={owlbearError} aria-live="polite">{owlbearStatus || (linkedToken ? 'Token linked' : 'Token not in scene')}</span><div class="owlbear-header-export"><ExportMenu {pokemon} header /></div></div></div>
                <div class="owlbear-integration-status" aria-label="Enabled Owlbear integrations"><span class:active={integrationActive(pokemon.owlbear?.trackers)}>{integrationLabel(pokemon.owlbear?.trackers, 'Trackers')}</span><span class:active={integrationActive(pokemon.owlbear?.initiative)}>{integrationLabel(pokemon.owlbear?.initiative, 'Initiative')}</span><span class:active={integrationActive(pokemon.owlbear?.diceRoller)}>{integrationLabel(pokemon.owlbear?.diceRoller, 'Dice Roller')}</span></div>
                <div class="owlbear-utilities-actions compact"><button type="button" class="owlbear-focus-btn owlbear-primary-action" disabled={owlbearBusy} onclick={() => linkedToken ? focusToken() : insertToken()}>{owlbearBusy ? 'Working…' : linkedToken ? 'Focus' : 'Insert'}</button><button type="button" class="owlbear-visibility-toggle" disabled={!linkedToken || owlbearBusy} data-visible={pokemon.owlbear?.visible !== false} aria-pressed={pokemon.owlbear?.visible !== false} aria-label="Token visibility" onclick={toggleVisibility}><span class="owlbear-visible-label">Visible</span><span class="owlbear-hidden-label">Hidden</span></button><select class="owlbear-owner-select" aria-label="Change token owner" disabled={!currentPlayer || owlbearBusy} value={pokemon.owlbear?.playerId || currentPlayer?.id || ''} onchange={(event) => changeOwner(event.currentTarget.value)}>{#if currentPlayer}<option value={currentPlayer.id}>Me ({currentPlayer.name})</option>{/if}{#each roomPlayers.filter(player => player.id !== currentPlayer?.id) as player}<option value={player.id}>{player.name}</option>{/each}</select></div>
              </div>
            {:else}
              <ExportMenu {pokemon} />
              <details class="owlbear-sheet-settings"><summary class="export-btn-main">⚙ Owlbear</summary><div class="owlbear-settings-popover"><label><input type="checkbox" bind:checked={pokemon.owlbear.visible} onchange={persist} /> Visible</label><label>Owner ID <input bind:value={pokemon.owlbear.playerId} onchange={persist} /></label><label>Trackers <select bind:value={pokemon.owlbear.trackers} onchange={persist}><option value="none">None</option><option value="owltrackers">Owl Trackers</option></select></label><label>Initiative <select bind:value={pokemon.owlbear.initiative} onchange={persist}><option value="none">None</option><option value="prettysordid">Pretty Sordid</option></select></label><label>Dice <select bind:value={pokemon.owlbear.diceRoller} onchange={persist}><option value="none">None</option><option value="justdices">JustDices</option></select></label></div></details>
            {/if}
          </div>
        </div>
      </section>

      <div class="details-content">
        <div class="details-left">
          <div class="pokemon-info">
            <div class="info-box pokemon-info-row pokemon-types-row">
              <span class="info-label">Type(s)</span><div class="pokemon-types-content"><div class="types">{#each displayedTypes as type}<span class="type-badge type-{slug(type)}">{type}</span>{/each}</div><button type="button" class="edit-bn" onclick={openTypePicker}>✎ Edit</button></div>
            </div>
            <div class="info-box pokemon-info-row level-hp-info-row">
              <span class="info-label">Level &amp; HP</span><div class="level-hp-wrapper"><input class="level-input" aria-label="Level" type="number" min="1" max="100" bind:value={pokemon.level} onchange={changeLevel} /><input id="hpCurrentInput" aria-label="Current HP" class="hp-current-input" type="number" bind:value={pokemon.hitPoints} onchange={persist} /><span>/</span><input aria-label="Maximum HP" class="hp-max-input" type="number" min="1" bind:value={pokemon.hitPointsMax} onchange={persist} /></div>
              <div class="margin-top-8"><input id="hpFormulaInput" aria-label="HP Formula" class="skill-input" bind:value={pokemon.hpFormula} onchange={changeHpFormula} /></div>
              <div class="hp-damage-area"><div class="hp-damage-controls"><input class="hp-damage-input" aria-label="Incoming damage" placeholder="Damage" type="number" min="0" bind:value={damageAmount} /><select class="hp-damage-select" aria-label="Damage type" bind:value={damageType}><option value="typeless">Typeless</option>{#each ALL_TYPES as type}<option value={type.toLowerCase()}>{type}</option>{/each}</select><div class="damage-category-buttons" role="group" aria-label="Damage class"><button type="button" class:active={damageCategory === 'physical'} aria-pressed={damageCategory === 'physical'} onclick={() => damageCategory = 'physical'}>Physical</button><button type="button" class:active={damageCategory === 'special'} aria-pressed={damageCategory === 'special'} onclick={() => damageCategory = 'special'}>Special</button></div><button type="button" class="hp-damage-btn" onclick={applyDamage}>Apply</button></div>{#if damageAmount > 0}<div class="hp-damage-preview">Final: {finalDamage} ({damageAmount} − {defense}, {effectiveness}x)</div>{/if}</div>
            </div>
            <div class="info-box pokemon-info-row nature-info-row">
              <label class="info-label" for="natureSelect">Nature</label><div class="nature-control"><select id="natureSelect" class="nature-select" value={typeof pokemon.nature === 'string' ? pokemon.nature : pokemon.nature?.name || pokemon.nature?.Name || ''} onchange={(event) => changeNature(event.currentTarget.value)}>{#if !natures.length}<option>{typeof pokemon.nature === 'string' ? pokemon.nature : pokemon.nature?.name || 'Unknown'}</option>{/if}{#each natures as nature}<option value={nature.name || nature.Name}>{nature.name || nature.Name} (+{nature.raise} / −{nature.lower})</option>{/each}</select></div>
            </div>

            <details class="info-box other-info-panel" bind:open={otherInfoOpen}><summary class="advanced-toggle collapsible-info-summary"><span class="info-label">Other Information</span><span class="toggle-icon collapsible-info-chevron" aria-hidden="true">▼</span></summary><div class="other-info-grid">
              <div class="info-value other-info-gender"><strong>Gender:</strong> <select class="gender-select" value={pokemon.gender} onchange={(event) => changeGender(event.currentTarget.value)}><option>Unknown</option><option>Male</option><option>Female</option><option value="No Gender">Genderless</option></select></div>
              {#each Object.entries(pokemon.otherInfo || {}).filter(([key, value]) => key !== 'gender' && ['string','number'].includes(typeof value)) as [key, value]}<div class="info-value"><strong>{fieldLabel(key)}:</strong> {String(value)}</div>{/each}
            </div></details>
            <CaptureCalculator {pokemon} onsave={persist} />
          </div>

          <StatsEditor bind:pokemon onsave={persist} />

          <SkillsEditor bind:pokemon {embedded} onsave={persist} />
          <CapabilitiesEditor bind:pokemon onsave={persist} />

          <AbilitiesEditor {pokemon} onsave={persist} />
        </div>

        <div class="details-right">
          <TypeEffectiveness {pokemon} selected={damageType} onselect={(type) => damageType = type} onsave={persist} />
          <MovesEditor {pokemon} onsave={persist} />
          <PokeEdgesEditor {pokemon} onsave={persist} />
        </div>
      </div>
    {/if}
  </main>
</div>

{#if typesEditing}
  <div class="modal-overlay" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) typesEditing = false; }}>
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="Select Types">
      <h2 class="modal-title">Select Types</h2>
      <div class="modal-info-box"><p>Selected types: <span class="types">{#each typeDraft as type}<span class="type-badge type-{slug(type)}">{type}</span>{:else}<span class="text-tertiary">None</span>{/each}</span></p></div>
      <div class="modal-grid type-picker">{#each ALL_TYPES as type}<button type="button" class="type-badge type-choice type-{slug(type)}" class:selected={typeDraft.includes(type)} aria-pressed={typeDraft.includes(type)} onclick={() => toggleType(type)}>{type}</button>{/each}</div>
      <div class="modal-buttons"><button type="button" class="modal-btn modal-btn-primary" disabled={!typeDraft.length} onclick={saveTypes}>Save</button><button type="button" class="modal-btn modal-btn-secondary" onclick={() => typesEditing = false}>Cancel</button></div>
    </div>
  </div>
{/if}

<style>
  .header-actions { display:flex;align-items:center;gap:.5rem;flex-wrap:wrap }
  .type-picker { grid-template-columns:repeat(auto-fit,minmax(80px,1fr)) }
  .type-choice { padding:8px 12px;border:2px solid transparent;cursor:pointer;font-weight:600;opacity:.55;transition:opacity .2s,border-color .2s,transform .2s }
  .type-choice.selected { border-color:var(--text-primary);opacity:1;transform:translateY(-1px) }.type-choice:disabled { cursor:not-allowed;opacity:.25 }
  .level-hp-wrapper { display:flex;gap:.35rem;align-items:center }.level-hp-wrapper input { width:5rem }
  .hp-damage-area { width:100%;min-width:0;container-type:inline-size }
  .level-hp-info-row .hp-damage-controls { box-sizing:border-box;width:100%;max-width:100%;grid-template-columns:minmax(48px,.65fr) minmax(64px,.9fr) minmax(104px,1.25fr) minmax(44px,.55fr) }
  .level-hp-info-row .hp-damage-controls > * { min-width:0;max-width:100% }
  .level-hp-info-row .hp-damage-btn { grid-column:auto }
  .other-info-grid { padding:1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem }
  .other-info-gender { font-size:1.1em }
  .damage-category-buttons { display:grid;grid-template-columns:1fr 1fr;gap:2px }.damage-category-buttons button { min-width:0;padding:5px 4px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-secondary);font-size:.72em;font-weight:700;cursor:pointer }.damage-category-buttons button:first-child { border-radius:4px 0 0 4px }.damage-category-buttons button:last-child { border-radius:0 4px 4px 0 }.damage-category-buttons button.active { border-color:var(--primary-color);background:var(--primary-color);color:#fff }
  .owlbear-utilities-actions.compact { grid-template-columns:repeat(3,minmax(0,1fr)) }.owlbear-primary-action { width:100% }
  .owlbear-integration-status { display:flex;gap:.3rem;flex-wrap:wrap }.owlbear-integration-status span { padding:.12rem .4rem;border:1px solid var(--border-color);border-radius:999px;color:var(--text-tertiary);font-size:.65rem;font-weight:700 }.owlbear-integration-status span.active { border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,transparent);color:var(--primary-color) }
  .owlbear-sheet-settings { position:relative;margin:0;align-self:center }.owlbear-sheet-settings summary { list-style:none;cursor:pointer;margin:0 }.owlbear-settings-popover { position:absolute;right:0;z-index:20;display:grid;gap:.55rem;min-width:250px;padding:1rem;background:var(--bg-main);border:1px solid var(--border-color);border-radius:8px;box-shadow:0 8px 24px #0003 }.owlbear-settings-popover label { display:grid;gap:.2rem }.owlbear-settings-popover input[type='checkbox'] { width:auto }
  @container(max-width:300px){.level-hp-info-row .hp-damage-controls{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.level-hp-info-row .hp-damage-btn{grid-column:auto}}
  @media(max-width:700px){.header-actions{width:100%}.owlbear-utilities-actions.compact{grid-template-columns:1fr 1fr}.owlbear-owner-select{grid-column:1/-1}}
</style>
