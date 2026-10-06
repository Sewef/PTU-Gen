<script lang="ts">
  import { onMount } from 'svelte';
  import type { Pokemon } from '../lib/types';
  import { listenOwlbear, requestOwlbear, type OwlbearPlayer, type OwlbearTokenState } from '../lib/owlbear';
  import { OWLBEAR_INTEGRATIONS } from '../lib/owlbear-integrations';
  import { applyTokenToPokemon } from '../lib/owlbear-token';
  import { pokemonImage } from '../lib/pokemon';
  import ExportMenu from './ExportMenu.svelte';
  import OwlbearIntegrationBadges from './OwlbearIntegrationBadges.svelte';

  let { pokemon = $bindable(), embedded, onsave }: { pokemon: Pokemon; embedded: boolean; onsave: () => void } = $props();
  let busy = $state(false);
  let status = $state('');
  let failed = $state(false);
  let currentPlayer = $state<OwlbearPlayer | null>(null);
  let roomPlayers = $state<OwlbearPlayer[]>([]);
  let formStateInitialized = false;
  let previousBattleOnlyFormIcon = '';
  const linked = $derived(Boolean(pokemon.owlbear.tokenId));

  onMount(() => {
    if (!embedded) return;
    const stop = listenOwlbear(
      (current, players) => { currentPlayer = current; roomPlayers = players; },
      applyTokenState
    );
    if (pokemon.owlbear.tokenId) refresh();
    return stop;
  });

  $effect(() => {
    const tokenId = String(pokemon.owlbear.tokenId || '').trim();
    const trackers = pokemon.owlbear.trackers;
    const name = String(pokemon.name || 'Pokémon');
    const nickname = String(pokemon.nickname || '');
    const shiny = Boolean(pokemon.shiny);
    const hitPoints = Number(pokemon.hitPoints);
    const hitPointsMax = Number(pokemon.hitPointsMax);
    const injuries = Math.max(0, Math.trunc(Number(pokemon.captureState?.standardCounts?.injuries) || 0));
    const battleOnlyFormIcon = String(pokemon.activeBattleOnlyFormIcon || '');
    const formChanged = formStateInitialized && battleOnlyFormIcon !== previousBattleOnlyFormIcon;
    previousBattleOnlyFormIcon = battleOnlyFormIcon;
    formStateInitialized = true;

    if (!embedded || !tokenId) return;

    const timer = window.setTimeout(() => {
      // Keep this payload plain: Svelte's reactive proxies cannot be cloned by postMessage.
      const snapshot = {
        name,
        nickname,
        shiny,
        hitPoints,
        hitPointsMax,
        ...(formChanged ? { imageUrl: pokemonImage(pokemon, 'full') } : {}),
        captureState: { standardCounts: { injuries } },
        owlbear: { tokenId, trackers }
      };
      void requestOwlbear('sync-token', { pokemon: snapshot })
        .then(() => {
          failed = false;
          status = 'Token linked';
        })
        .catch((cause) => {
          failed = true;
          status = cause instanceof Error ? cause.message : 'Owlbear synchronization failed';
        });
    }, 200);

    return () => window.clearTimeout(timer);
  });

  function confirm(token: Partial<OwlbearTokenState> & { id?: string }) {
    if (!applyTokenToPokemon(pokemon, token)) return;
    failed = false;
    status = 'Token linked';
    onsave();
  }

  function applyTokenState(token: OwlbearTokenState) {
    if (!pokemon.owlbear.tokenId || token.tokenId !== pokemon.owlbear.tokenId) return;
    if (!token.exists) {
      pokemon.owlbear.tokenId = '';
      failed = true;
      status = 'Token no longer in scene';
      onsave();
      return;
    }
    confirm({ ...token, id: token.id || token.tokenId });
  }

  async function action(run: () => Promise<any>) {
    busy = true;
    failed = false;
    status = 'Working…';
    try {
      const result = await run();
      if (result?.token) confirm(result.token);
      else status = 'Done';
    } catch (cause) {
      failed = true;
      status = cause instanceof Error ? cause.message : 'Owlbear action failed';
    } finally {
      busy = false;
    }
  }

  function refresh() {
    if (pokemon.owlbear.tokenId) void action(() => requestOwlbear('get-token-state', { tokenId: pokemon.owlbear.tokenId! }));
  }
  function insert() {
    const builder = (window as any).buildOwlbearItemWithImage;
    if (typeof builder !== 'function') { failed = true; status = 'Owlbear exporter unavailable'; return; }
    void action(async () => requestOwlbear('insert-token', { item: (await builder(pokemon)).item }));
  }
  function focus() {
    if (pokemon.owlbear.tokenId) void action(() => requestOwlbear('focus-token', { tokenId: pokemon.owlbear.tokenId }));
  }
  function toggleVisibility() {
    const visible = pokemon.owlbear.visible === false;
    pokemon.owlbear.visible = visible;
    onsave();
    if (pokemon.owlbear.tokenId) void action(() => requestOwlbear('set-token-visibility', { tokenId: pokemon.owlbear.tokenId, visible }));
  }
  function changeOwner(userId: string) {
    pokemon.owlbear.playerId = userId;
    onsave();
    if (pokemon.owlbear.tokenId) void action(() => requestOwlbear('set-token-owner', { tokenId: pokemon.owlbear.tokenId, createdUserId: userId }));
  }
</script>

<div class="export-button-wrapper header-actions">
  {#if embedded}
    <div class="owlbear-utilities-panel" aria-label="Owlbear scene utilities">
      <div class="owlbear-utilities-header"><div class="owlbear-utilities-title">Owlbear Scene</div><div class="owlbear-utilities-header-actions"><span class="owlbear-token-status" class:is-error={failed} aria-live="polite">{status || (linked ? 'Token linked' : 'Token not in scene')}</span><div class="owlbear-header-export"><ExportMenu {pokemon} header /></div></div></div>
      <OwlbearIntegrationBadges owlbear={pokemon.owlbear} />
      <div class="owlbear-utilities-actions compact"><button type="button" class="owlbear-focus-btn owlbear-primary-action" disabled={busy} onclick={() => linked ? focus() : insert()}>{busy ? 'Working…' : linked ? 'Focus' : 'Insert'}</button><button type="button" class="owlbear-visibility-toggle" disabled={busy} data-visible={pokemon.owlbear.visible !== false} aria-pressed={pokemon.owlbear.visible !== false} aria-label="Token visibility" onclick={toggleVisibility}><span class="owlbear-visible-label">Visible</span><span class="owlbear-hidden-label">Hidden</span></button><select class="owlbear-owner-select" aria-label="Change token owner" disabled={!currentPlayer || busy} value={pokemon.owlbear.playerId || currentPlayer?.id || ''} onchange={(event) => changeOwner(event.currentTarget.value)}>{#if currentPlayer}<option value={currentPlayer.id}>Me ({currentPlayer.name})</option>{/if}{#each roomPlayers.filter(player => player.id !== currentPlayer?.id) as player}<option value={player.id}>{player.name}</option>{/each}</select></div>
    </div>
  {:else}
    <ExportMenu {pokemon} />
    <details class="owlbear-sheet-settings"><summary class="export-btn-main">⚙ Owlbear</summary><div class="owlbear-settings-popover"><label><input type="checkbox" bind:checked={pokemon.owlbear.visible} onchange={onsave} /> Visible</label><label>Owner ID <input bind:value={pokemon.owlbear.playerId} onchange={onsave} /></label>{#each Object.entries(OWLBEAR_INTEGRATIONS) as [kind, config]}<label>{config.label}<select bind:value={pokemon.owlbear[kind]} onchange={onsave}>{#each config.options as option}<option value={option.value}>{option.label}</option>{/each}</select></label>{/each}</div></details>
  {/if}
</div>

<style>
  .header-actions{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
  .owlbear-utilities-actions.compact{grid-template-columns:repeat(3,minmax(0,1fr))}.owlbear-primary-action{width:100%}
  .owlbear-sheet-settings{position:relative;margin:0;align-self:center}.owlbear-sheet-settings summary{list-style:none;cursor:pointer;margin:0}.owlbear-settings-popover{position:absolute;right:0;z-index:20;display:grid;gap:.55rem;min-width:250px;padding:1rem;background:var(--bg-main);border:1px solid var(--border-color);border-radius:8px;box-shadow:0 8px 24px #0003}.owlbear-settings-popover label{display:grid;gap:.2rem}.owlbear-settings-popover input[type='checkbox']{width:auto}
  @media(max-width:700px){.header-actions{width:100%}.owlbear-utilities-actions.compact{grid-template-columns:1fr 1fr}.owlbear-owner-select{grid-column:1/-1}}
</style>
