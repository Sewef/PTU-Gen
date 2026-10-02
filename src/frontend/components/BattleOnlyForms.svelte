<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { battleOnlyFormImage, STAT_LABELS } from '../lib/pokemon';
  import { setBattleOnlyForm } from '../lib/battle-only-forms';

  let { pokemon = $bindable(), onsave }: { pokemon: Pokemon; onsave: () => void } = $props();
  const statOrder = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'] as const;

  function toggle(name: string) {
    setBattleOnlyForm(pokemon, name);
    onsave();
  }
</script>

{#if pokemon.battleOnlyForms?.length}
  <section class="section battle-only-forms-section">
    <div class="section-header"><h3 class="section-title">Battle-Only Forms</h3></div>
    <div class="battle-form-grid">
      {#each pokemon.battleOnlyForms as form}
        {@const active = pokemon.activeBattleOnlyForm === form.name}
        <article class="section-card battle-form-card" class:active>
          <img class="battle-form-sprite" src={battleOnlyFormImage(pokemon, form)} alt={form.name} />
          <div class="battle-form-content">
            <div class="section-card-header"><div class="section-card-name">{form.name}</div><button type="button" class="edit-bn" class:active onclick={() => toggle(form.name)}>{active ? 'Revert' : 'Transform'}</button></div>
            <div class="battle-form-modifiers">
              {#each statOrder.filter(stat => Number(form.stats?.[stat])) as stat}
                <span>{STAT_LABELS[stat]} {Number(form.stats[stat]) > 0 ? '+' : ''}{form.stats[stat]}</span>
              {/each}
            </div>
            {#if form.ability?.name}<div class="section-card-field"><strong>Ability:</strong> {form.ability.name}</div>{/if}
            {#each Object.entries(form.abilityReplacements || {}) as [slot, ability]}
              <div class="section-card-field"><strong>{slot}:</strong> Becomes {ability.name}</div>
            {/each}
            {#if form.types?.length && !form.types.includes('Unchanged')}<div class="section-card-field"><strong>Types:</strong> {form.types.join(', ')}</div>{/if}
          </div>
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .battle-form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:.6rem}
  .battle-form-card{display:grid;grid-template-columns:88px minmax(0,1fr);gap:.75rem;align-items:center;border:1px solid var(--border-color);transition:border-color .2s,box-shadow .2s}
  .battle-form-card.active{border-color:var(--primary-color);box-shadow:0 0 0 2px color-mix(in srgb,var(--primary-color) 18%,transparent)}
  .battle-form-sprite{width:88px;height:88px;object-fit:contain;image-rendering:auto}
  .battle-form-content{min-width:0}
  .battle-form-content .section-card-header{margin-bottom:.4rem}
  .battle-form-modifiers{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.35rem}
  .battle-form-modifiers span{padding:.15rem .4rem;border-radius:999px;background:var(--bg-tertiary);color:var(--text-secondary);font-size:.72rem;font-weight:700}
  @container(max-width:340px){.battle-form-card{grid-template-columns:64px minmax(0,1fr)}.battle-form-sprite{width:64px;height:64px}}
</style>
