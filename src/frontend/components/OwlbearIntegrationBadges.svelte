<script lang="ts">
  import { integrationActive, integrationLabel, type OwlbearIntegrationKind } from '../lib/owlbear-integrations';
  import type { OwlbearSettings } from '../lib/types';

  let { owlbear }: { owlbear: OwlbearSettings } = $props();
  const kinds: OwlbearIntegrationKind[] = ['trackers', 'initiative', 'diceRoller'];
</script>

<div class="owlbear-integration-status" aria-label="Enabled Owlbear integrations">
  {#each kinds as kind}
    <span class:active={integrationActive(owlbear?.[kind])}>{integrationLabel(kind, owlbear?.[kind])}</span>
  {/each}
</div>

<style>
  .owlbear-integration-status{display:flex;gap:.3rem;flex-wrap:wrap}
  .owlbear-integration-status span{padding:.12rem .4rem;border:1px solid var(--border-color);border-radius:999px;color:var(--text-tertiary);font-size:.65rem;font-weight:700}
  .owlbear-integration-status span.active{border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 12%,transparent);color:var(--primary-color)}
</style>
