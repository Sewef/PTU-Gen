<script lang="ts">
  import { parseReferenceText, referenceUrl } from '../lib/references';

  let { text, dataset = 'core' }: { text: unknown; dataset?: unknown } = $props();
  const parts = $derived(parseReferenceText(text));
</script>

{#each parts as part}
  {#if part.kind === 'reference'}
    <a
      class="ptu-data-reference"
      href={referenceUrl(part.type, dataset, part.name)}
      target="_blank"
      rel="noreferrer"
      title={`Open ${part.type} “${part.name}” in PTU-Data`}
    >{part.label}</a>
  {:else}{part.text}{/if}
{/each}

<style>
  .ptu-data-reference { color: var(--primary-color); font-weight: 600; text-decoration: underline; text-decoration-thickness: .08em; text-underline-offset: .12em; }
  .ptu-data-reference:hover { color: var(--primary-hover-color, var(--primary-color)); }
</style>
