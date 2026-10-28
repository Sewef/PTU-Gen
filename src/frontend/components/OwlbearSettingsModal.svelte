<script lang="ts">
  import { onMount } from 'svelte';
  import { OWLBEAR_INTEGRATIONS, type OwlbearIntegrationKind } from '../lib/owlbear-integrations';
  import type { OwlbearSettings } from '../lib/types';

  type Integrations = Pick<OwlbearSettings, OwlbearIntegrationKind>;
  let { settings, onsave, onclose }: { settings: OwlbearSettings; onsave: (settings: Integrations) => void; onclose: () => void } = $props();
  let dialog: HTMLDialogElement;
  let draft = $state<Integrations>({ trackers: 'none', initiative: 'none', diceRoller: 'none' });
  const kinds: OwlbearIntegrationKind[] = ['trackers', 'initiative', 'diceRoller'];

  onMount(() => {
    draft = { trackers: settings.trackers, initiative: settings.initiative, diceRoller: settings.diceRoller };
    dialog.showModal();
  });
</script>

<dialog bind:this={dialog} class="modal-content owlbear-integrations-modal" aria-labelledby="owlbear-settings-title" onclose={onclose} oncancel={(event) => { event.preventDefault(); onclose(); }} onclick={(event) => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onclose(); } }}>
  <form onsubmit={(event) => { event.preventDefault(); onsave(draft); }}>
    <h2 class="modal-title" id="owlbear-settings-title">Owlbear integrations</h2>
    <div class="integration-fields">
      {#each kinds as kind}
        <label>{OWLBEAR_INTEGRATIONS[kind].label}
          <select bind:value={draft[kind]}>
            {#each OWLBEAR_INTEGRATIONS[kind].options as option}<option value={option.value}>{option.label}</option>{/each}
          </select>
        </label>
      {/each}
    </div>
    <div class="modal-buttons"><button type="submit" class="modal-btn modal-btn-primary">Save</button><button type="button" class="modal-btn modal-btn-secondary" onclick={onclose}>Cancel</button></div>
  </form>
</dialog>

<style>
  .owlbear-integrations-modal{position:fixed;inset:0;margin:auto;width:min(360px,calc(100vw - 2rem));max-height:calc(100dvh - 2rem);padding:1.25rem;border:1px solid var(--border-color);color:var(--text-primary);background:var(--bg-main);border-radius:12px;overflow:auto}
  .owlbear-integrations-modal::backdrop{background:#0008}
  .integration-fields{display:grid;gap:.85rem}
  label{display:grid;gap:.35rem;font-size:.85rem;font-weight:600}
  select{width:100%;min-width:0;padding:.5rem;color:var(--text-primary);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px}
</style>
