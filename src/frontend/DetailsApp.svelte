<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from './lib/types';
  import { normalizePokemon, pokemonImage } from './lib/pokemon';
  import { readSelected, savePokemon } from './lib/storage';
  import StatsEditor from './components/StatsEditor.svelte';
  import AbilitiesEditor from './components/AbilitiesEditor.svelte';
  import MovesEditor from './components/MovesEditor.svelte';
  import PokeEdgesEditor from './components/PokeEdgesEditor.svelte';
  import TypeEffectiveness from './components/TypeEffectiveness.svelte';
  import CaptureCalculator from './components/CaptureCalculator.svelte';
  import SkillsEditor from './components/SkillsEditor.svelte';
  import CapabilitiesEditor from './components/CapabilitiesEditor.svelte';
  import OtherInformation from './components/OtherInformation.svelte';
  import TypesEditor from './components/TypesEditor.svelte';
  import LevelHpNatureEditor from './components/LevelHpNatureEditor.svelte';
  import OwlbearPanel from './components/OwlbearPanel.svelte';

  const storageKey = new URLSearchParams(location.search).get('pokemonKey') || 'selectedPokemon';
  const requestedHistoryScope = new URLSearchParams(location.search).get('historyScope');
  const embedded = new URLSearchParams(location.search).get('embedded') === 'true';
  let pokemon = $state<Pokemon | null>(null);
  let error = $state('');
  let damageType = $state('typeless');

  function persist() {
    if (!pokemon) return;
    savePokemon(pokemon, storageKey, requestedHistoryScope || String(pokemon._ptuHistoryScope || 'site'));
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
    return () => { if (embedded) document.body.classList.remove('owlbear-embedded'); };
  });
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
          <OwlbearPanel bind:pokemon {embedded} onsave={persist} />
        </div>
      </section>

      <div class="details-content">
        <div class="details-left">
          <div class="pokemon-info">
            <TypesEditor bind:pokemon onsave={persist} />
            <LevelHpNatureEditor bind:pokemon bind:damageType onsave={persist} />

            <OtherInformation bind:pokemon initiallyOpen={!embedded} onsave={persist} />
            <CaptureCalculator bind:pokemon onsave={persist} />
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
