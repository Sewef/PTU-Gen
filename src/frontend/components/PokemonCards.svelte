<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { pokemonImage, pokemonTypes, slug } from '../lib/pokemon';
  import { ensurePokemonId, plainPokemon, savePokemon } from '../lib/storage';

  let { pokemons, historyScope = 'site' }: { pokemons: Pokemon[]; historyScope?: string } = $props();

  function openPokemon(pokemon: Pokemon, index: number, event: MouseEvent) {
    const embedded = new URLSearchParams(location.search).get('owlbear') === 'true' && window.parent !== window;
    ensurePokemonId(pokemon);
    if (!embedded) savePokemon(pokemon, 'selectedPokemon', historyScope);
    sessionStorage.setItem(`pokemon_${index}`, JSON.stringify(pokemon));
    if (embedded) {
      window.parent.postMessage({ type: 'ptu-open-pokemon', pokemon: plainPokemon(pokemon), activate: !(event.ctrlKey || event.metaKey) }, location.origin);
      return;
    }
    window.open('/details.html', '_blank', 'noopener');
  }
</script>

<div class="pokemon-cards-grid">
  {#each pokemons as pokemon, index (pokemon._ptuRecordId || index)}
    <button type="button" class="pokemon-card" onclick={(event) => openPokemon(pokemon, index, event)}>
      <div class="pokemon-card-header">
        <img src={pokemonImage(pokemon)} alt={pokemon.name} class="pokemon-card-icon" />
        <div class="pokemon-card-number">#{Number(pokemon.id) || 0}</div>
      </div>
      <div class="pokemon-card-name">{pokemon.name}</div>
      <div class="pokemon-card-info">
        <span class="pokemon-card-level">L{pokemon.level}</span>
        {#if pokemon.shiny}<span class="pokemon-card-shiny">✨</span>{/if}
      </div>
      <div class="pokemon-card-types">
        {#each pokemonTypes(pokemon) as type}
          <span class="pokemon-card-type type-{slug(type)}">{type}</span>
        {/each}
      </div>
    </button>
  {/each}
</div>
