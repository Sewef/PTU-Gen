<script lang="ts">
  import type { Pokemon } from '../lib/types';
  import { requestOwlbear } from '../lib/owlbear';

  let { pokemon = $bindable(), embedded, onsave }: { pokemon: Pokemon; embedded: boolean; onsave: () => void } = $props();
  let activeSkill = $state('');
  let rollState = $state<'idle' | 'rolling' | 'success' | 'error'>('idle');

  function uniqueName(seed = 'Custom Skill') {
    let name = seed;
    let suffix = 2;
    while (Object.hasOwn(pokemon.skills || {}, name)) name = `${seed} ${suffix++}`;
    return name;
  }

  function addSkill() {
    pokemon.skills![uniqueName()] = '2d6';
    onsave();
  }

  function renameSkill(oldName: string, requested: string) {
    const nextName = requested.trim();
    if (!nextName || nextName === oldName || Object.hasOwn(pokemon.skills || {}, nextName)) return;
    const value = pokemon.skills![oldName];
    delete pokemon.skills![oldName];
    pokemon.skills![nextName] = value;
    onsave();
  }

  function removeSkill(name: string) {
    delete pokemon.skills?.[name];
    onsave();
  }

  async function roll(name: string, formula: string) {
    const expression = String(formula || '').trim();
    if (!expression) return;
    activeSkill = name;
    rollState = 'rolling';
    try {
      if (embedded && pokemon.owlbear?.diceRoller === 'justdices') {
        await requestOwlbear('roll-justdices', { callId: crypto.randomUUID(), expression: `/r ${expression}`, showInLogs: true });
      } else {
        await navigator.clipboard.writeText(`/r ${expression}`);
      }
      rollState = 'success';
    } catch {
      rollState = 'error';
    }
    window.setTimeout(() => {
      if (activeSkill === name) {
        activeSkill = '';
        rollState = 'idle';
      }
    }, 1200);
  }

  function buttonLabel(name: string) {
    if (activeSkill === name && rollState === 'rolling') return `Processing ${name} roll`;
    if (activeSkill === name && rollState === 'success') return `${name} roll succeeded`;
    if (activeSkill === name && rollState === 'error') return `${name} roll failed`;
    return embedded && pokemon.owlbear?.diceRoller === 'justdices' ? `Roll ${name}` : `Copy ${name} roll`;
  }

  function buttonIcon(name: string) {
    if (activeSkill !== name) return '🎲';
    if (rollState === 'rolling') return '…';
    if (rollState === 'success') return '✓';
    if (rollState === 'error') return '!';
    return '🎲';
  }
</script>

<div class="section-heading-row"><h3 class="section-title">📊 Skills</h3><button type="button" class="section-btn add-skill" onclick={addSkill}>+ Skill</button></div>
<div class="section-container skills">
  <div class="section-grid skills">
    {#each Object.entries(pokemon.skills || {}) as [name, value] (name)}
      <div class="grid-item skill skill-row">
        <input class="skill-name" aria-label="Skill name" value={name} onchange={(event) => renameSkill(name, event.currentTarget.value)} />
        <input class="skill-formula" aria-label={`${name} roll`} value={value} onchange={(event) => { pokemon.skills![name] = event.currentTarget.value; onsave(); }} />
        <button type="button" class="roll-skill" class:is-rolling={activeSkill === name && rollState === 'rolling'} class:is-success={activeSkill === name && rollState === 'success'} class:is-error={activeSkill === name && rollState === 'error'} title={embedded && pokemon.owlbear?.diceRoller === 'justdices' ? `Roll ${name} with JustDices` : `Copy ${name} roll`} aria-label={buttonLabel(name)} disabled={activeSkill === name && rollState === 'rolling'} onclick={() => roll(name, pokemon.skills?.[name] || '')}>{buttonIcon(name)}</button>
        <button type="button" class="compact-remove" aria-label={`Remove ${name}`} onclick={() => removeSkill(name)}>×</button>
      </div>
    {:else}<div class="empty-state compact">No skills yet.</div>{/each}
  </div>
</div>

<style>
  .section-heading-row{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.section-heading-row .section-title{margin-bottom:.35rem}
  .section-grid.skills{grid-template-columns:minmax(0,1fr)}
  .add-skill{margin-bottom:.35rem}.skill-row{box-sizing:border-box;width:100%;min-width:0;overflow:hidden;grid-template-columns:minmax(90px,1fr) minmax(64px,.55fr) 30px 22px!important;gap:4px!important}
  .skill-row input{box-sizing:border-box;width:100%;min-width:0;padding:4px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-primary);font:inherit;font-size:.82rem}
  .skill-name{font-weight:650}.roll-skill,.compact-remove{box-sizing:border-box;width:100%;min-width:0;border:0;background:transparent;cursor:pointer;font:inherit}.roll-skill{height:26px;padding:2px;border-radius:5px;font-size:1rem;line-height:1;transition:background-color .15s,color .15s,transform .15s}.roll-skill.is-rolling{background:var(--bg-tertiary);color:var(--text-secondary)}.roll-skill.is-success{background:#d9f6e5;color:#187445;transform:scale(1.06)}.roll-skill.is-error{background:#fde1e1;color:#b12a2a}.compact-remove{padding:0;color:var(--danger-color,#c33);font-size:1.1rem}
</style>
