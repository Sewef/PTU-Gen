<script lang="ts">
  type Group = 'reach' | 'target' | 'keyword';
  type Kind = {
    key: string;
    label: string;
    group: Group;
    value?: { fallback: string; pattern: RegExp; width: string };
    parse: RegExp;
    format: (value: string) => string;
  };
  type Entry = { key: string | null; value: string; raw: string };

  let { range, onsave, onclose }: {
    range: string;
    onsave: (range: string) => void;
    onclose: () => void;
  } = $props();

  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flag = (name: string, group: Group = 'keyword'): Kind => ({ key: name, label: name, group, parse: new RegExp(`^${escape(name)}$`, 'i'), format: () => name });
  const numbered = (name: string, fallback: string): Kind => ({
    key: name, label: name, group: 'target', value: { fallback, pattern: /^\d+$/, width: '2.6rem' },
    parse: new RegExp(`^${escape(name)} (\\d+)$`, 'i'), format: value => `${name} ${value}`
  });

  const KINDS: Kind[] = [
    flag('Melee', 'reach'),
    { key: 'Range', label: 'Range', group: 'reach', value: { fallback: '6', pattern: /^\d+$/, width: '2.6rem' }, parse: /^(\d+)$/, format: value => value },
    { key: 'Target', label: 'Targets', group: 'target', value: { fallback: '1', pattern: /^\d+$/, width: '2.6rem' }, parse: /^(\d+) Targets?$/i, format: value => `${value} Target${value === '1' ? '' : 's'}` },
    flag('Self', 'target'),
    numbered('Line', '4'), numbered('Burst', '1'), numbered('Cone', '2'), numbered('Close Blast', '3'), numbered('Ranged Blast', '3'), numbered('Blast', '2'),
    flag('All Adjacent Foes', 'target'), flag('All Cardinally Adjacent Targets', 'target'),
    ...['Smite', 'Dash', 'Slice', 'Social', 'Spirit Surge', 'Pass', 'Sonic', 'Interrupt', 'Trigger', 'Priority', 'Reckless', 'Friendly', 'Field', 'Push', 'Five Strike', 'Double Strike', 'Set-Up', 'Shield', 'Healing', 'Full Action', 'Swift Action', 'Free Action', 'Reaction', 'Aura', 'Exhaust', 'Groundsource', 'Powder', 'Blessing', 'Coat', 'Weather', 'Hazard', 'Execute', 'Illusion', 'Versatile', 'Pledge', 'Weight Class', 'Fling', 'Berry', 'Environ'].map(name => flag(name)),
    { key: 'Recoil', label: 'Recoil', group: 'keyword', value: { fallback: '1/4', pattern: /^\d+\/\d+$/, width: '3.4rem' }, parse: /^Recoil (\d+\/\d+)$/i, format: value => `Recoil ${value}` }
  ];
  const GROUPS: { id: Group; title: string }[] = [
    { id: 'reach', title: 'Reach' }, { id: 'target', title: 'Targets & Area' }, { id: 'keyword', title: 'Keywords' }
  ];
  const orderOf = (key: string) => KINDS.findIndex(kind => kind.key === key);

  function parseEntry(raw: string): Entry {
    for (const kind of KINDS) {
      const match = raw.match(kind.parse);
      if (match) return { key: kind.key, value: match[1] ?? '', raw };
    }
    return { key: null, value: '', raw };
  }

  let entries = $state<Entry[]>((range || '').split(',').map(part => part.trim()).filter(Boolean).map(parseEntry));
  let custom = $state('');

  const kindOf = (entry: Entry) => KINDS.find(kind => kind.key === entry.key);
  const valid = $derived(entries.every(entry => { const value = kindOf(entry)?.value; return !value || value.pattern.test(entry.value.trim()); }));
  const preview = $derived(entries.map(entry => { const kind = kindOf(entry); return kind ? kind.format(entry.value.trim()) : entry.raw; }).join(', '));

  function toggle(kind: Kind) {
    const index = entries.findIndex(entry => entry.key === kind.key);
    if (index >= 0) { entries.splice(index, 1); return; }
    if (kind.group === 'reach') entries = entries.filter(entry => kindOf(entry)?.group !== 'reach');
    const order = orderOf(kind.key);
    const before = entries.findIndex(entry => entry.key !== null && orderOf(entry.key) > order);
    const entry: Entry = { key: kind.key, value: kind.value?.fallback ?? '', raw: kind.key };
    entries.splice(before < 0 ? entries.length : before, 0, entry);
  }

  function addCustom() {
    const raw = custom.trim().replace(/\s*,\s*/g, ' ');
    if (!raw) return;
    entries.push(parseEntry(raw));
    custom = '';
  }
</script>

<div class="modal-overlay" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) onclose(); }}>
  <div class="modal-content range-editor" role="dialog" aria-modal="true" aria-label="Edit Range Keywords">
    <h2 class="modal-title">Edit Range Keywords</h2>
    <div class="modal-info-box"><p>Range: <strong>{preview || 'None'}</strong></p></div>
    {#each GROUPS as group}
      <div class="range-group">
        <div class="range-group-title">{group.title}</div>
        <div class="range-chips">
          {#each KINDS.filter(kind => kind.group === group.id) as kind}
            {@const entry = entries.find(item => item.key === kind.key)}
            <span class="range-chip" class:selected={Boolean(entry)}>
              <button type="button" aria-pressed={Boolean(entry)} onclick={() => toggle(kind)}>{kind.label}</button>
              {#if entry && kind.value}<input aria-label={`${kind.label} value`} class:invalid={!kind.value.pattern.test(entry.value.trim())} style:width={kind.value.width} value={entry.value} oninput={(event) => entry.value = event.currentTarget.value} inputmode="numeric" />{/if}
            </span>
          {/each}
        </div>
      </div>
    {/each}
    <div class="range-group">
      <div class="range-group-title">Other</div>
      <div class="range-chips">
        {#each entries as entry, index}{#if entry.key === null}<span class="range-chip selected"><button type="button" aria-label={`Remove ${entry.raw}`} onclick={() => entries.splice(index, 1)}>{entry.raw} ×</button></span>{/if}{/each}
        <form class="range-custom" onsubmit={(event) => { event.preventDefault(); addCustom(); }}><input aria-label="Custom keyword" placeholder="Custom keyword" bind:value={custom} /></form>
      </div>
    </div>
    <div class="modal-buttons"><button type="button" class="modal-btn modal-btn-primary" disabled={!valid} onclick={() => onsave(preview)}>Save</button><button type="button" class="modal-btn modal-btn-secondary" onclick={onclose}>Cancel</button></div>
  </div>
</div>

<style>
  .range-editor{max-width:620px}
  .range-group{margin-top:.8rem}
  .range-group-title{margin-bottom:.35rem;color:var(--text-tertiary);font-size:.68em;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
  .range-chips{display:flex;flex-wrap:wrap;gap:4px 6px}
  .range-chip{display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:4px 8px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-main);color:var(--text-primary);font-size:.8em;transition:background-color .2s,border-color .2s}
  .range-chip:hover{border-color:var(--primary-color);background:var(--bg-tertiary)}
  .range-chip.selected{border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 10%,var(--bg-main))}
  .range-chip button{display:inline-flex;align-items:center;gap:6px;padding:0;border:0;background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}
  .range-chip button::before{content:'';width:13px;height:13px;flex:0 0 auto;border:1px solid var(--border-color);border-radius:3px;background:var(--bg-main);box-sizing:border-box}
  .range-chip.selected button::before{border-color:var(--primary-color);background:var(--primary-color) radial-gradient(circle,#fff 28%,transparent 32%)}
  .range-chip input{width:2.4rem;min-height:22px;padding:2px 4px;border:1px solid var(--primary-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font:inherit;font-weight:700;text-align:center}
  .range-chip input:focus{outline:1px solid var(--primary-color)}
  .range-chip input.invalid{border-color:#df7b7b}
  .range-custom input{width:9rem;min-height:30px;padding:4px 8px;border:1px dashed var(--border-color);border-radius:6px;background:var(--bg-main);color:inherit;font:inherit;font-size:.8em}
  .range-custom input:focus{outline:1px solid var(--primary-color)}
</style>