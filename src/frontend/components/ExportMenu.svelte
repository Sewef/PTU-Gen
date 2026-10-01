<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { exportMany, exportOne, type ExportFormat } from '../lib/exports';

  let { pokemon, bulk = false, header = false }: { pokemon: Pokemon | Pokemon[]; bulk?: boolean; header?: boolean } = $props();
  let open = $state(false);
  let status = $state('');

  async function run(format: ExportFormat) {
    status = 'Exporting…';
    try {
      if (bulk) await exportMany(format, pokemon as Pokemon[]);
      else await exportOne(format, pokemon as Pokemon);
      status = 'Done';
      setTimeout(() => status = '', 1500);
    } catch (error) {
      status = error instanceof Error ? error.message : 'Export failed';
    } finally {
      open = false;
    }
  }
</script>

<div class="export-button-wrapper">
  <button type="button" class="export-btn-main" class:owlbear-header-export-btn={header} onclick={() => open = !open}>
    {header ? '' : '📥 '}{status || 'Export'} <span class="dropdown-arrow">▼</span>
  </button>
  {#if open}
    <div class="export-dropdown svelte-export-menu">
      <button type="button" class="export-dropdown-item" onclick={() => run('json')}>📄 PTU-Gen JSON</button>
      <button type="button" class="export-dropdown-item" onclick={() => run('roll20')}>🎲 Roll20</button>
      <button type="button" class="export-dropdown-item" onclick={() => run('pokesheets')}>📊 Pokésheets</button>
      <button type="button" class="export-dropdown-item" onclick={() => run('owlbear')}>Owlbear Token{bulk ? 's' : ''}</button>
    </div>
  {/if}
</div>

<style>
  .svelte-export-menu { display: block; right: 0; }
</style>
