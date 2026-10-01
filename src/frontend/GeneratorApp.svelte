<script lang="ts">
  import { onMount } from 'svelte';
  import { generate, generatorOptions, loadCustom, metadata } from './lib/api';
  import type { GeneratorSettings, HistoryEntry, Pokemon } from './lib/types';
  import { clearHistory, HISTORY_KEY, listHistory, loadPokemon, plainPokemon, removeHistory, savePokemon } from './lib/storage';
  import type { OwlbearPlayer } from './lib/owlbear';
  import { OWLBEAR_INTEGRATIONS } from './lib/owlbear-integrations';
  import PokemonCards from './components/PokemonCards.svelte';
  import ExportMenu from './components/ExportMenu.svelte';

  const SETTINGS_KEY = 'ptu-generator-preferences-v1';
  const embedded = new URLSearchParams(location.search).get('owlbear') === 'true' && window.parent !== window;
  const defaults: GeneratorSettings = {
    dataset: 'core', fandex: [], countMode: 'fixed', count: 1, minCount: 1, maxCount: 6,
    levelMode: 'fixed', level: 50, minLevel: 30, maxLevel: 70, species: '', randomForm: false,
    habitat: '', type: '', shinyMode: 'odds', shinyOdds: 1, includeLegendaries: false,
    forceEvolution: false, distribution: 'RANDOM', natureMode: 'random', nature: '',
    ignoreBaseRelation: '', hpFormula: 'LEVEL + (HP * 3) + 10', owlbearVisible: true,
    owlbearPlayerId: '', owlbearTrackers: 'none', owlbearInitiative: 'none', owlbearDiceRoller: 'none'
  };
  const helpTitles = {
    dataset: 'Core: Base manual + official Pokédex\nCommunity: Same + Gen 9 community Pokédex + modifications\nHomebrew: Auto-updated Pokédex + unchanged Gen 9 community Pokédex',
    distribution: 'Random: Completely unpredictable distribution\nBalanced: Equal distribution across all stats\nMinmaxed: Specializes — high stats get higher, low stats get lower',
    nature: "Random: Chooses any nature\nOptimal: Raises the species' highest base stat and lowers its lowest base stat\nFixed: Uses the selected nature from the dropdown\nTies currently use Composed",
    ignoreBaseRelation: 'Use ALL to disable Base Relation for every stat, or list specific stats separated by commas. Accepted stats: HP, ATK, DEF, SPA, SPD, SPE.',
    hpFormula: 'Formula placeholders: LEVEL, HP, ATK, DEF, SPA, SPD, SPE. Example: LEVEL + (HP * 3) + DEF.'
  };

  let settings = $state<GeneratorSettings>({ ...defaults });
  let pokemons = $state<Pokemon[]>([]);
  let history = $state<HistoryEntry[]>([]);
  let species = $state<string[]>([]);
  let habitats = $state<string[]>([]);
  let types = $state<string[]>([]);
  let fandexes = $state<any[]>([]);
  let natures = $state<any[]>([]);
  let loading = $state(false);
  let message = $state('');
  let advancedOpen = $state(false);
  let customOpen = $state(false);
  let owlbearOpen = $state(false);
  let importOpen = $state(false);
  let customInputs = $state({ pokemon: '', abilities: '', moves: '' });
  let customStatus = $state('');
  let selectedFiles = $state<File[]>([]);
  let currentPlayer = $state<OwlbearPlayer | null>(null);
  let roomPlayers = $state<OwlbearPlayer[]>([]);
  let metadataRequest = 0;

  const filteredSpecies = $derived(settings.species.trim().length > 0
    ? species.filter(item => item.toLowerCase().includes(settings.species.toLowerCase())).slice(0, 10)
    : []);
  const datasetChanged = $derived(settings.dataset !== defaults.dataset);
  const fandexChanged = $derived(settings.fandex.length > 0);
  const countChanged = $derived(settings.countMode !== defaults.countMode || settings.count !== defaults.count || settings.minCount !== defaults.minCount || settings.maxCount !== defaults.maxCount);
  const levelChanged = $derived(settings.levelMode !== defaults.levelMode || settings.level !== defaults.level || settings.minLevel !== defaults.minLevel || settings.maxLevel !== defaults.maxLevel);
  const speciesChanged = $derived(Boolean(settings.species || settings.randomForm));
  const filtersChanged = $derived(Boolean(settings.habitat || settings.type));
  const shinyChanged = $derived(settings.shinyMode !== defaults.shinyMode || settings.shinyOdds !== defaults.shinyOdds);
  const optionsChanged = $derived(settings.includeLegendaries !== defaults.includeLegendaries || settings.forceEvolution !== defaults.forceEvolution);
  const distributionChanged = $derived(settings.distribution !== defaults.distribution);
  const natureChanged = $derived(settings.natureMode !== defaults.natureMode || Boolean(settings.nature));
  const advancedChanged = $derived(settings.ignoreBaseRelation !== defaults.ignoreBaseRelation || settings.hpFormula !== defaults.hpFormula);
  const owlbearChanged = $derived(settings.owlbearVisible !== defaults.owlbearVisible || settings.owlbearPlayerId !== defaults.owlbearPlayerId || settings.owlbearTrackers !== defaults.owlbearTrackers || settings.owlbearInitiative !== defaults.owlbearInitiative || settings.owlbearDiceRoller !== defaults.owlbearDiceRoller);

  function readSettings(): GeneratorSettings {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return { ...defaults }; }
  }

  function persist() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async function refreshMetadata() {
    const request = ++metadataRequest;
    try {
      const result = await metadata(settings);
      if (request !== metadataRequest) return;
      species = result.species;
      habitats = result.habitats;
      types = result.types;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Unable to load generator data';
    }
  }

  function refreshHistory() { history = listHistory(); }

  onMount(() => {
    let disposed = false;
    const onPlayers = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.data?.type !== 'ptu-owlbear-players') return;
      currentPlayer = event.data.currentPlayer?.id ? { id: String(event.data.currentPlayer.id), name: String(event.data.currentPlayer.name || 'Player') } : null;
      roomPlayers = (Array.isArray(event.data.players) ? event.data.players : []).filter((player: any) => player?.id).map((player: any) => ({ id: String(player.id), name: String(player.name || 'Player') }));
      settings.owlbearPlayerId ||= currentPlayer?.id || '';
    };
    if (embedded) document.body.classList.add('owlbear-embedded');
    settings = readSettings();
    refreshHistory();
    window.addEventListener('ptu-history-updated', refreshHistory);
    window.addEventListener('storage', event => { if (event.key === HISTORY_KEY) refreshHistory(); });
    window.addEventListener('message', onPlayers);
    void (async () => {
      try {
        const options = await generatorOptions();
        if (!disposed) {
          fandexes = options.fandexes;
          natures = options.natures;
          const normalizedFandexes = normalizeSelectedFandexes(fandexes);
          if (normalizedFandexes.join('\0') !== settings.fandex.join('\0')) {
            settings.fandex = normalizedFandexes;
            persist();
          }
        }
      } catch (error) { if (!disposed) message = error instanceof Error ? error.message : 'Unable to load options'; }
      if (!disposed) await refreshMetadata();
      if (!disposed && embedded) {
        window.parent.postMessage({ type: 'ptu-request-owlbear-players' }, location.origin);
      }
    })();
    return () => {
      disposed = true;
      window.removeEventListener('ptu-history-updated', refreshHistory);
      window.removeEventListener('message', onPlayers);
      if (embedded) document.body.classList.remove('owlbear-embedded');
    };
  });

  async function create(blank = false) {
    persist();
    loading = true;
    message = blank ? 'Creating blank Pokémon…' : 'Generating Pokémon…';
    const count = blank ? 1 : settings.countMode === 'range'
      ? Math.floor(Math.random() * (Math.max(settings.minCount, settings.maxCount) - Math.min(settings.minCount, settings.maxCount) + 1)) + Math.min(settings.minCount, settings.maxCount)
      : settings.count;
    const results: Pokemon[] = [];
    for (let index = 0; index < Math.max(1, Math.min(50, count)); index++) {
      try {
        message = `${blank ? 'Creating' : 'Generating'} ${index + 1}/${count}…`;
        const pokemon = await generate(settings, blank);
        pokemon.owlbear = {
          ...pokemon.owlbear,
          visible: settings.owlbearVisible,
          playerId: settings.owlbearPlayerId,
          trackers: settings.owlbearTrackers,
          initiative: settings.owlbearInitiative,
          diceRoller: settings.owlbearDiceRoller
        };
        savePokemon(pokemon);
        results.push(pokemon);
      } catch (error) {
        message = `Pokémon ${index + 1}: ${error instanceof Error ? error.message : 'generation failed'}`;
      }
    }
    pokemons = results;
    sessionStorage.setItem('pokemon_count', String(results.length));
    loading = false;
    message = results.length ? `${results.length} Pokémon ready.` : message;
  }

  function toggleFandex(name: string, checked: boolean) {
    settings.fandex = checked ? [...settings.fandex, name] : settings.fandex.filter(item => item !== name);
    persist();
    refreshMetadata();
  }

  function nameOf(value: any) { return String(value?.name || value?.Name || value?.id || value); }

  function fandexKey(value: any) { return String(value?.key || value?.id || value?.name || value?.Name || value); }

  function normalizeSelectedFandexes(options: any[]) {
    const canonical = new Map<string, string>();
    for (const option of options) {
      const key = fandexKey(option);
      canonical.set(key.toLowerCase(), key);
      canonical.set(nameOf(option).toLowerCase(), key);
    }
    return [...new Set(settings.fandex.map(value => canonical.get(String(value).toLowerCase())).filter((value): value is string => Boolean(value)))];
  }

  async function submitCustom(kind: 'pokemon' | 'abilities' | 'moves') {
    try {
      await loadCustom(kind, customInputs[kind]);
      customStatus = `${kind} loaded successfully.`;
      customInputs[kind] = '';
      await refreshMetadata();
    } catch (error) { customStatus = error instanceof Error ? error.message : 'Load failed'; }
  }

  function chooseFiles(files: FileList | null) {
    selectedFiles = files ? Array.from(files).filter(file => file.name.toLowerCase().endsWith('.json')) : [];
  }

  async function importFiles() {
    const imported: Pokemon[] = [];
    for (const file of selectedFiles) {
      try {
        const data = JSON.parse(await file.text());
        const values = Array.isArray(data) ? data : data.pokemon ? data.pokemon : [data];
        for (const value of values) {
          if (!value?.name) continue;
          savePokemon(value);
          imported.push(value);
        }
      } catch (error) { message = `${file.name}: ${error instanceof Error ? error.message : 'invalid JSON'}`; }
    }
    if (imported.length) pokemons = imported;
    selectedFiles = [];
    importOpen = false;
    message = `${imported.length} Pokémon imported.`;
  }

  function openHistory(entry: HistoryEntry) {
    const pokemon = loadPokemon(entry.id);
    if (!pokemon) return refreshHistory();
    savePokemon(pokemon);
    if (embedded) {
      window.parent.postMessage({ type: 'ptu-open-pokemon', pokemon: plainPokemon(pokemon), activate: false }, location.origin);
      return;
    }
    window.open('/details.html', '_blank', 'noopener');
  }
</script>

<svelte:head><title>PTU Pokémon Generator</title></svelte:head>

<div class="container">
  <header class="header">
    <h1 class="header-title"><img src={embedded ? 'https://ptu-gen.sewef.workers.dev/logo.png' : '/logo.png'} alt="PTU" class="header-logo" /> PTU Pokémon Generator</h1>
    <p class="header-subtitle">Generate Pokémon with customized stats</p>
    <div class="header-links">
      <a href="/api-documentation.html" class="header-link">📚 API Documentation</a>
      <a href="https://sewef.github.io/ptu" target="_blank" rel="noreferrer" class="header-link">📖 Full Data</a>
    </div>
  </header>

  <main class="content">
    <section class="panel generation-settings-panel">
      <h2>⚙️ Generation Settings</h2>
      <form class="generation-settings-form" onsubmit={(event) => { event.preventDefault(); create(false); }} onchange={persist}>
        <div class="form-group" class:pref-changed-group={datasetChanged}><div class="field-label-row"><label for="dataset">Dataset</label><button type="button" class="option-help" title={helpTitles.dataset} aria-label="Help: Dataset">?</button></div>
          <select id="dataset" class:pref-changed-control={datasetChanged} bind:value={settings.dataset} onchange={() => refreshMetadata()}>
            <option value="core">Core</option><option value="community">Community</option><option value="homebrew">Homebrew</option>
          </select>
        </div>
        <div class="form-group" class:pref-changed-group={fandexChanged}><span class="group-label">FanDexes</span><div class="checkbox-wrap">
          {#if !fandexes.length}<span class="small-text text-secondary">No FanDex available</span>{/if}
          {#each fandexes as fandex}
            {@const key = fandexKey(fandex)}
            <label class="inline-option"><input type="checkbox" checked={settings.fandex.includes(key)} onchange={(event) => toggleFandex(key, event.currentTarget.checked)} /> {nameOf(fandex)}</label>
          {/each}
        </div></div>

        <div class="form-group" class:pref-changed-group={countChanged}><span class="group-label">Number of Pokémon</span>
          <div class="inline-controls"><label><input type="radio" bind:group={settings.countMode} value="fixed" /> Fixed</label><input type="number" min="1" max="50" bind:value={settings.count} disabled={settings.countMode !== 'fixed'} />
          <label><input type="radio" bind:group={settings.countMode} value="range" /> Range</label><input type="number" min="1" max="50" bind:value={settings.minCount} disabled={settings.countMode !== 'range'} /><span>to</span><input type="number" min="1" max="50" bind:value={settings.maxCount} disabled={settings.countMode !== 'range'} /></div>
        </div>
        <div class="form-group" class:pref-changed-group={levelChanged}><span class="group-label">Level</span>
          <div class="inline-controls"><label><input type="radio" bind:group={settings.levelMode} value="fixed" /> Fixed</label><input type="number" min="1" max="100" bind:value={settings.level} disabled={settings.levelMode !== 'fixed'} />
          <label><input type="radio" bind:group={settings.levelMode} value="range" /> Range</label><input type="number" min="1" max="100" bind:value={settings.minLevel} disabled={settings.levelMode !== 'range'} /><span>to</span><input type="number" min="1" max="100" bind:value={settings.maxLevel} disabled={settings.levelMode !== 'range'} /></div>
        </div>

        <div class="form-group form-group-autocomplete" class:pref-changed-group={speciesChanged}><label for="species">Species</label>
          <input id="species" class:pref-changed-control={speciesChanged} type="text" bind:value={settings.species} placeholder="e.g. Pikachu, Charizard…" autocomplete="off" />
          {#if filteredSpecies.length && !species.includes(settings.species)}<div class="autocomplete-suggestions visible">
            {#each filteredSpecies as item}<button type="button" class="autocomplete-item" onclick={() => settings.species = item}>{item}</button>{/each}
          </div>{/if}
          <label class="inline-option"><input type="checkbox" bind:checked={settings.randomForm} /> Random form</label>
        </div>
        <div class="form-row" class:pref-changed-group={filtersChanged}>
          <div class="form-group"><label for="habitat">Habitat</label><select id="habitat" class:pref-changed-control={Boolean(settings.habitat)} bind:value={settings.habitat}><option value="">Random Habitat</option>{#each habitats as item}<option value={item}>{item}</option>{/each}</select></div>
          <div class="form-group"><label for="type">Type</label><select id="type" class:pref-changed-control={Boolean(settings.type)} bind:value={settings.type}><option value="">Random Type</option>{#each types as item}<option value={item}>{item}</option>{/each}</select></div>
        </div>
        <div class="form-group" class:pref-changed-group={shinyChanged}><span class="group-label">Shiny</span><div class="inline-controls">
          <label><input type="radio" bind:group={settings.shinyMode} value="force" /> Force</label>
          <label><input type="radio" bind:group={settings.shinyMode} value="odds" /> Odds</label><input type="number" min="0" max="100" step="0.1" bind:value={settings.shinyOdds} disabled={settings.shinyMode !== 'odds'} /><span>%</span>
        </div></div>
        <div class="form-group options-grid" class:pref-changed-group={optionsChanged}><label><input type="checkbox" bind:checked={settings.includeLegendaries} /> Include legendaries</label><label><input type="checkbox" bind:checked={settings.forceEvolution} /> Force evolution</label></div>
        <div class="form-group" class:pref-changed-group={distributionChanged}><div class="field-label-row"><span class="group-label">Distribution</span><button type="button" class="option-help" title={helpTitles.distribution} aria-label="Help: Distribution">?</button></div><div class="radio-row">
          {#each ['RANDOM', 'BALANCED', 'MINMAXED'] as value}<label><input type="radio" bind:group={settings.distribution} {value} /> {value}</label>{/each}
        </div></div>
        <div class="form-group" class:pref-changed-group={natureChanged}><div class="field-label-row"><span class="group-label">Nature</span><button type="button" class="option-help" title={helpTitles.nature} aria-label="Help: Nature">?</button></div><div class="radio-row">
          <label><input type="radio" bind:group={settings.natureMode} value="random" /> Random</label><label><input type="radio" bind:group={settings.natureMode} value="optimal" /> Optimal</label><label><input type="radio" bind:group={settings.natureMode} value="fixed" /> Fixed</label>
          <select bind:value={settings.nature} disabled={settings.natureMode !== 'fixed'}><option value="">Select nature</option>{#each natures as nature}<option value={nameOf(nature)}>{nameOf(nature)}</option>{/each}</select>
        </div></div>

        <button type="button" class="advanced-toggle" class:has-hidden-changes={advancedChanged && !advancedOpen} onclick={() => advancedOpen = !advancedOpen}><span>Advanced</span><span>{advancedOpen ? '▲' : '▼'}</span></button>
        {#if advancedOpen}<div class="advanced-section open"><div class="advanced-content">
          <div class="form-group" class:pref-changed-group={settings.ignoreBaseRelation !== defaults.ignoreBaseRelation}><div class="field-label-row"><label for="ignoreBase">Ignore Base Relation</label><button type="button" class="option-help" title={helpTitles.ignoreBaseRelation} aria-label="Help: Ignore Base Relation">?</button></div><input id="ignoreBase" bind:value={settings.ignoreBaseRelation} placeholder="ALL or HP,ATK,DEF" /></div>
          <div class="form-group" class:pref-changed-group={settings.hpFormula !== defaults.hpFormula}><div class="field-label-row"><label for="hpFormula">HP Formula</label><button type="button" class="option-help" title={helpTitles.hpFormula} aria-label="Help: HP Formula">?</button></div><input id="hpFormula" bind:value={settings.hpFormula} /></div>
        </div></div>{/if}

        <button type="button" class="advanced-toggle" onclick={() => customOpen = !customOpen}><span>Customization</span><span>{customOpen ? '▲' : '▼'}</span></button>
        {#if customOpen}<div class="advanced-section open"><div class="advanced-content">
          {#each ['pokemon', 'abilities', 'moves'] as kind}
            <div class="form-group"><div class="field-label-row"><label for="custom-{kind}">Custom {kind}</label><button type="button" class="option-help" title={`Load custom ${kind} definitions. Duplicates will be overwritten.`} aria-label={`Help: Custom ${kind}`}>?</button></div><div class="input-button-row"><input id="custom-{kind}" bind:value={customInputs[kind as keyof typeof customInputs]} placeholder="Paste JSON or URL" /><button type="button" class="edit-bn" onclick={() => submitCustom(kind as any)}>Load</button></div></div>
          {/each}
          {#if customStatus}<div class="info-box">{customStatus}</div>{/if}
        </div></div>{/if}

        <button type="button" class="advanced-toggle" class:has-hidden-changes={owlbearChanged && !owlbearOpen} onclick={() => owlbearOpen = !owlbearOpen}><span>Owlbear Rodeo</span><span>{owlbearOpen ? '▲' : '▼'}</span></button>
        {#if owlbearOpen}<div class="advanced-section open"><div class="advanced-content">
          <div class="form-group" class:pref-changed-group={settings.owlbearPlayerId !== defaults.owlbearPlayerId}><label for="owner">{embedded ? 'Owner' : 'Player ID'}</label>{#if embedded}<select id="owner" bind:value={settings.owlbearPlayerId} disabled={!currentPlayer}><option value="">{currentPlayer ? 'Select owner' : 'Loading players…'}</option>{#if currentPlayer}<option value={currentPlayer.id}>Me ({currentPlayer.name})</option>{/if}{#each roomPlayers.filter(player => player.id !== currentPlayer?.id) as player}<option value={player.id}>{player.name}</option>{/each}</select>{:else}<input id="owner" bind:value={settings.owlbearPlayerId} />{/if}</div>
          <div class="form-group" class:pref-changed-group={settings.owlbearVisible !== defaults.owlbearVisible}><label class="inline-option"><input type="checkbox" bind:checked={settings.owlbearVisible} /> Token visible</label></div>
          <div class="form-group" class:pref-changed-group={settings.owlbearTrackers !== defaults.owlbearTrackers}><label for="trackers">{OWLBEAR_INTEGRATIONS.trackers.label}</label><select id="trackers" bind:value={settings.owlbearTrackers}>{#each OWLBEAR_INTEGRATIONS.trackers.options as option}<option value={option.value}>{option.label}</option>{/each}</select></div>
          <div class="form-group" class:pref-changed-group={settings.owlbearInitiative !== defaults.owlbearInitiative}><label for="initiative">{OWLBEAR_INTEGRATIONS.initiative.label}</label><select id="initiative" bind:value={settings.owlbearInitiative}>{#each OWLBEAR_INTEGRATIONS.initiative.options as option}<option value={option.value}>{option.label}</option>{/each}</select></div>
          <div class="form-group" class:pref-changed-group={settings.owlbearDiceRoller !== defaults.owlbearDiceRoller}><label for="dice">{OWLBEAR_INTEGRATIONS.diceRoller.label}</label><select id="dice" bind:value={settings.owlbearDiceRoller}>{#each OWLBEAR_INTEGRATIONS.diceRoller.options as option}<option value={option.value}>{option.label}</option>{/each}</select></div>
        </div></div>{/if}

        <div class="button-group"><button type="submit" class="btn-generate" disabled={loading}>🎲 Generate Pokémon</button><button type="button" class="btn-generate" onclick={() => create(true)} disabled={loading}>+ Blank Pokémon</button><button type="reset" class="btn-reset" onclick={() => settings = { ...defaults }}>↻ Reset</button></div>
      </form>
    </section>

    <section class="panel">
      {#if history.length}<section class="pokemon-history-section">
        <div class="pokemon-history-header"><h3>Recent Pokémon</h3><button type="button" class="history-clear-btn" onclick={() => { if (confirm('Clear the entire Pokémon history?')) clearHistory(); }}>Clear history</button></div>
        <div class="pokemon-history-grid">{#each history.slice(0, 12) as entry}
          <article class="pokemon-history-card"><button type="button" class="pokemon-history-open" onclick={() => openHistory(entry)}><img src={entry.icon} alt="" class="pokemon-history-icon" /><span class="pokemon-history-text"><strong>{entry.nickname ? `${entry.nickname} (${entry.name})` : entry.name}</strong><small>Lv. {entry.level}</small></span></button><button type="button" class="pokemon-history-remove" aria-label="Remove" onclick={() => removeHistory(entry.id)}>×</button></article>
        {/each}</div>
      </section>{/if}

      <div class="import-section"><button type="button" class="advanced-toggle" onclick={() => importOpen = !importOpen}><span>📥 Import Pokémon</span><span>{importOpen ? '▲' : '▼'}</span></button>
        {#if importOpen}<div class="import-drop-zone"><input type="file" accept=".json" multiple onchange={(event) => chooseFiles(event.currentTarget.files)} />
          {#if selectedFiles.length}<p>{selectedFiles.length} file(s) selected</p><button type="button" class="btn-generate" onclick={importFiles}>Import</button>{/if}
        </div>{/if}
      </div>

      <div class="flex-between-center generated-heading"><h2>🎯 Generated Pokémon</h2>{#if pokemons.length}<ExportMenu pokemon={pokemons} bulk />{/if}</div>
      {#if message}<div class:loading={loading} class:error={!loading && !pokemons.length} class="generation-status">{message}</div>{/if}
      <div class:no-pokemon={!pokemons.length} class="pokemon-display">
        {#if pokemons.length}<PokemonCards {pokemons} />{:else if !loading}<p>No Pokémon generated yet. Configure the settings and click Generate!</p>{/if}
      </div>
    </section>
  </main>
</div>

<style>
  .generation-settings-panel{container-type:inline-size}
  .generation-settings-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));align-items:start;gap:.65rem .8rem;font-size:.875rem;line-height:1.3}
  .generation-settings-form>.form-group,.generation-settings-form>.form-row{min-width:0;margin:0}
  .generation-settings-form>.advanced-toggle,.generation-settings-form>.advanced-section,.generation-settings-form>.button-group{grid-column:1/-1}
  .generation-settings-form :is(input,select,button){font-size:inherit}
  .generation-settings-form :is(input:not([type='radio']):not([type='checkbox']),select){min-height:32px;padding:.38rem .5rem}
  .checkbox-wrap, .inline-controls, .radio-row, .input-button-row { display: flex; flex-wrap: wrap; gap: .35rem .55rem; align-items: center; }
  .inline-controls input[type='number'] { width: 4.25rem; }
  .inline-option, .radio-row label, .options-grid label, .inline-controls label { display: inline-flex; flex:0 0 auto; gap: .3rem; align-items: center; margin:0; white-space:nowrap; }
  .inline-option input, .radio-row input, .options-grid input, .inline-controls input[type='radio'] { width: auto; }
  .options-grid { display:flex;flex-wrap:wrap;align-content:center;gap:.35rem .8rem; }
  .generation-settings-form>.form-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}
  .generation-settings-form>.form-row .form-group{min-width:0;margin:0}
  .advanced-toggle { width: 100%; border: 0; padding:.55rem .7rem; }
  .input-button-row input { flex: 1; }
  .autocomplete-suggestions.visible { display: block; position: relative; }
  .autocomplete-item { display: block; width: 100%; text-align: left; border: 0; padding: .45rem; background: transparent; cursor: pointer; }
  .group-label { display:block; font-size:.82rem; font-weight:650; margin-bottom:.25rem; }
  .field-label-row{display:flex;align-items:center;gap:.3rem;margin-bottom:.25rem}.field-label-row :is(label,.group-label){margin:0}
  .option-help{display:inline-grid;place-items:center;flex:0 0 auto;width:1.15rem;height:1.15rem;min-height:0;padding:0;border:1px solid var(--primary-color);border-radius:50%;background:transparent;color:var(--primary-color);font-size:.72rem!important;font-weight:800;line-height:1;cursor:help}.option-help:hover,.option-help:focus-visible{background:var(--primary-color);color:#fff;outline:none}
  .generation-status { margin-bottom: 1rem; }
  .generated-heading { align-items: center; }
  .generated-heading h2 { margin-block: 0; }
  @container(max-width:500px){.generation-settings-form>.form-row{grid-template-columns:1fr}.generation-settings-form>.button-group{grid-template-columns:1fr}}
</style>
