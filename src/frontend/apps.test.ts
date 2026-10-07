import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import GeneratorApp from './GeneratorApp.svelte';
import DetailsApp from './DetailsApp.svelte';
import MovesEditor from './components/MovesEditor.svelte';
import TypesEditor from './components/TypesEditor.svelte';
import TypeEffectiveness from './components/TypeEffectiveness.svelte';
import StatsEditor from './components/StatsEditor.svelte';
import { damageBase } from './lib/moves';
import { normalizePokemon } from './lib/pokemon';

let instances: any[] = [];

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  localStorage.clear();
});

afterEach(async () => {
  for (const instance of instances) await unmount(instance);
  instances = [];
  vi.unstubAllGlobals();
  history.replaceState({}, '', '/');
});

describe('Svelte application surfaces', () => {
  it('adds generated Pokémon to history only when their card is opened', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = url.includes('/fandexes') ? { fandexes: [] }
        : url.includes('/natures') ? { natures: [] }
        : url.includes('/generate?') ? { id: 25, name: 'Pikachu', level: 12, stats: { HP: 5 }, types: ['Electric'], owlbear: {} }
        : url.includes('/list') ? { species: ['Pikachu'] }
        : url.includes('/habitats') ? { habitats: ['Forest'] }
        : { types: ['Electric'] };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    vi.spyOn(window, 'open').mockImplementation(() => null);
    instances.push(mount(GeneratorApp, { target: document.getElementById('app')! }));
    await vi.waitFor(() => expect(document.querySelector('button[type="submit"]')).not.toBeNull());

    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await vi.waitFor(() => expect(document.querySelector('.pokemon-card')).not.toBeNull());
    expect(JSON.parse(localStorage.getItem('ptu-pokemon-history-v1') || '[]')).toHaveLength(0);

    document.querySelector<HTMLButtonElement>('.pokemon-card')!.click();
    expect(JSON.parse(localStorage.getItem('ptu-pokemon-history-v1') || '[]')).toHaveLength(1);
  });

  it('mounts the generator and hydrates API-backed options', async () => {
    localStorage.setItem('ptu-generator-preferences-v1', JSON.stringify({ fandex: ['Variant'] }));
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = url.includes('/fandexes') ? { fandexes: [{ key: 'variant', name: 'Variant' }] }
        : url.includes('/natures') ? { natures: [{ name: 'Brave', raise: 'Attack', lower: 'Speed' }] }
        : url.includes('/list') ? { species: ['Pikachu'] }
        : url.includes('/habitats') ? { habitats: ['Forest'] }
        : { types: ['Electric'] };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    instances.push(mount(GeneratorApp, { target: document.getElementById('app')! }));
    await vi.waitFor(() => expect(document.body.textContent).toContain('Generation Settings'));
    await vi.waitFor(() => expect(Array.from(document.querySelectorAll('label')).some(label => label.textContent?.includes('Variant'))).toBe(true));
    expect(Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find(input => input.parentElement?.textContent?.includes('Variant'))?.checked).toBe(true);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('fandex=variant'))).toBe(true);
    expect(document.querySelector('form')).not.toBeNull();
    const dataset = document.querySelector<HTMLSelectElement>('#dataset')!;
    dataset.value = 'community';
    dataset.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
    expect(dataset.closest('.form-group')?.classList.contains('pref-changed-group')).toBe(true);
    const helpButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.option-help'));
    expect(helpButtons).toHaveLength(3);
    expect(helpButtons.every(button => button.textContent === '?' && Boolean(button.title))).toBe(true);
    expect(Array.from(document.querySelector<HTMLSelectElement>('select[aria-label="Fixed nature"]')!.options).find(option => option.value === 'Brave')?.textContent).toBe('Brave (+Attack / −Speed)');

    const reset = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('Reset'))!;
    reset.click();
    await tick();
    expect(dataset.value).toBe('core');
    expect(Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find(input => input.parentElement?.textContent?.includes('Variant'))?.checked).toBe(false);
    expect(JSON.parse(localStorage.getItem('ptu-generator-preferences-v1') || '{}')).toMatchObject({ dataset: 'core', fandex: [] });
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([input]) => String(input).includes('dataset=core') && !String(input).includes('fandex='))).toBe(true));

    const advancedToggle = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('Advanced'))!;
    advancedToggle.click();
    await tick();
    const multiplicative = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="radio"]')).find(input => input.parentElement?.textContent?.includes('Multiplicative (Vanilla)'))!;
    expect(multiplicative.checked).toBe(true);
    expect(Array.from(document.querySelectorAll('label')).some(label => label.textContent?.includes('Additive (Homebrew)'))).toBe(true);

    const owlbearToggle = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('Owlbear Rodeo'))!;
    owlbearToggle.click();
    await tick();
    expect(Array.from(document.querySelectorAll('label')).find(label => label.textContent?.includes('Token visible'))?.classList.contains('inline-option')).toBe(true);
  });

  it('offers Nuclear as a type when the Uranium FanDex is selected', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = url.includes('/fandexes') ? { fandexes: [{ key: 'uranium', name: 'Uranium' }] }
        : url.includes('/natures') ? { natures: [] }
        : url.includes('/list') ? { species: [] }
        : url.includes('/habitats') ? { habitats: [] }
        : { types: ['Fire', 'Water'] };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    instances.push(mount(GeneratorApp, { target: document.getElementById('app')! }));
    await vi.waitFor(() => expect(Array.from(document.querySelectorAll('label')).some(label => label.textContent?.includes('Uranium'))).toBe(true));

    const typeSelect = document.querySelector<HTMLSelectElement>('#type')!;
    expect(Array.from(typeSelect.options).some(option => option.value === 'Nuclear')).toBe(false);
    const uranium = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find(input => input.parentElement?.textContent?.includes('Uranium'))!;
    uranium.click();

    await vi.waitFor(() => expect(Array.from(typeSelect.options).some(option => option.value === 'Nuclear')).toBe(true));
  });

  it('mounts an editable details sheet from local storage', async () => {
    history.replaceState({}, '', '/details.html?embedded=true');
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const body = String(input).includes('/natures') ? { natures: [{ name: 'Brave', raise: 'Attack', lower: 'Speed' }] } : { evolutionsRemaining: 0 };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    localStorage.setItem('selectedPokemon', JSON.stringify({
      id: 25, name: 'Pikachu', level: 12, types: ['Electric'], stats: { HP: 7, atk: 10, def: 6, spA: 8, spD: 7, spe: 10 },
      baseStats: { HP: 5, Attack: 6, Defense: 4, 'Special Attack': 7, 'Special Defense': 5, Speed: 8 },
      baseWithNature: { HP: 5, atk: 8, def: 4, spA: 7, spD: 5, spe: 6 }, nature: { name: 'Brave', raise: 'Attack', lower: 'Speed' },
      moves: [], abilities: [{ name: 'Static', sourceTier: 'basic', sourceSlot: 'Basic Ability 1' }], capabilities: ['Overland 5', 'Underdog'], skills: { Acrobatics: '3d6+2' }, pokeEdges: [], otherInfo: { sizeCategory: 'Small', hatch_rate: 10, gender: 'Female' },
      battleOnlyForms: [{ name: 'Charged Form', icon: '25-charged', types: ['Unchanged'], stats: { atk: 4, def: 2, spA: 2, spe: 2 }, ability: { name: 'Adaptability' } }],
      owlbear: { trackers: 'owltrackers', initiative: 'none', diceRoller: 'justdices', visible: true }
    }));
    instances.push(mount(DetailsApp, { target: document.getElementById('app')! }));
    await tick();
    expect(document.body.textContent).toContain('#25 Pikachu');
    expect(document.body.textContent).toContain('Type Effectiveness');
    expect(document.body.textContent).toContain('Moves');
    expect(document.querySelector('.details-content')).not.toBeNull();
    expect(document.body.textContent).toContain('Size Category:');
    expect(document.body.textContent).toContain('Hatch Rate:');
    expect(document.querySelector<HTMLSelectElement>('.gender-select')?.value).toBe('Female');
    expect(document.querySelectorAll('.stats-table-heading span')).toHaveLength(6);
    expect(document.querySelector('.base-relation-summary')?.textContent?.replace(/\s+/g, '')).toBe('Atk>SpAtk>Spd>HP=SpDef>Def');
    expect(document.querySelectorAll('.stat-relation-checkbox')).toHaveLength(6);
    expect(document.querySelectorAll('.nature-indicator')).toHaveLength(2);
    const attackBase = document.querySelector<HTMLInputElement>('input[aria-label="Attack base stat after Nature"]')!;
    expect(attackBase.value).toBe('8');
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Attack level points"]')?.value).toBe('2');
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Attack bonus"]')?.value).toBe('0');
    expect(Array.from(document.querySelectorAll('.level-hp-field > span')).map(label => label.textContent)).toEqual(['Level', 'Current HP', 'Max HP']);
    expect(document.querySelector('.hp-formula-field > span')?.textContent).toBe('Formula');
    expect(document.querySelector('.nature-field > span')?.textContent).toBe('Selected nature');
    const attackRelation = document.querySelector<HTMLInputElement>('input[aria-label="Keep Attack in Base Relation"]')!;
    attackRelation.click();
    await tick();
    expect(JSON.parse(localStorage.getItem('selectedPokemon')!).ignoreBaseRelation).toBe('atk');
    expect(Array.from(document.querySelectorAll('.br-stat')).find(stat => stat.textContent === 'Atk')?.classList.contains('br-stat-ignored')).toBe(true);
    expect(document.querySelector<HTMLTextAreaElement>('.capability-no-value-input')?.value).toBe('Underdog');
    expect(document.querySelector<HTMLInputElement>('.capability-value-input')?.value).toBe('5');
    expect(document.querySelector('button[aria-label="Roll Acrobatics"]')).not.toBeNull();
    expect(document.querySelector('.ability-source-slot')?.textContent).toContain('Basic Ability 1');
    const capabilitiesHeading = Array.from(document.querySelectorAll('.section-title')).find(heading => heading.textContent?.includes('Capabilities'))!;
    const battleFormsSection = document.querySelector('.battle-only-forms-section');
    expect(capabilitiesHeading.compareDocumentPosition(battleFormsSection!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(battleFormsSection?.textContent).toContain('Charged Form');
    expect(battleFormsSection?.textContent).toContain('Adaptability');
    const transformButton = Array.from(battleFormsSection!.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Transform')!;
    transformButton.click();
    await tick();
    const transformed = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(transformed.activeBattleOnlyForm).toBe('Charged Form');
    expect(transformed.activeBattleOnlyFormIcon).toBe('25-charged');
    expect(transformed.statBonuses.atk).toBe(4);
    expect(transformed.stats.atk).toBe(14);
    expect(transformed.abilities.some((ability: { name: string }) => ability.name === 'Adaptability')).toBe(true);
    const revertButton = Array.from(battleFormsSection!.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent === 'Revert')!;
    revertButton.click();
    await tick();
    const reverted = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(reverted.activeBattleOnlyForm).toBeUndefined();
    expect(reverted.statBonuses.atk).toBe(0);
    expect(reverted.stats.atk).toBe(10);
    expect(reverted.abilities.some((ability: { name: string }) => ability.name === 'Adaptability')).toBe(false);
    const integrationBadges = Array.from(document.querySelectorAll('.owlbear-integration-status span'));
    expect(integrationBadges.map(badge => badge.textContent)).toEqual(['Owl Trackers', 'Initiative', 'JustDices']);
    expect(integrationBadges.map(badge => badge.classList.contains('active'))).toEqual([true, false, true]);

    const attackLevel = document.querySelector<HTMLInputElement>('input[aria-label="Attack level points"]')!;
    attackLevel.value = '-2';
    attackLevel.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
    const saved = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(saved.distributedPoints.atk).toBe(-2);
    expect(saved.stats.atk).toBe(6);

    const attackBonus = document.querySelector<HTMLInputElement>('input[aria-label="Attack bonus"]')!;
    attackBonus.value = '3';
    attackBonus.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
    const savedWithBonus = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(savedWithBonus.statBonuses.atk).toBe(3);
    expect(savedWithBonus.distributedPoints.atk).toBe(-2);
    expect(savedWithBonus.stats.atk).toBe(9);

    (Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('+ Skill'))!).click();
    await tick();
    expect(document.querySelectorAll('.skill-row')).toHaveLength(2);

    const otherInfo = document.querySelector<HTMLDetailsElement>('.other-info-panel')!;
    otherInfo.open = false;
    otherInfo.dispatchEvent(new Event('toggle'));
    const nature = document.querySelector<HTMLSelectElement>('#natureSelect')!;
    await vi.waitFor(() => expect(nature.options.length).toBeGreaterThan(0));
    nature.value = 'Brave';
    nature.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
    expect(otherInfo.open).toBe(false);

    const typeEditor = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes('Edit') && button.closest('.pokemon-types-row'))!;
    typeEditor.click();
    await tick();
    expect(document.querySelectorAll('.type-picker .type-choice')).toHaveLength(19);
    expect(document.querySelector('.type-picker input[type="checkbox"]')).toBeNull();
    const unselectedTypes = Array.from(document.querySelectorAll<HTMLButtonElement>('.type-picker .type-choice:not(.selected)'));
    unselectedTypes[0].click();
    unselectedTypes[1].click();
    await tick();
    expect(document.querySelectorAll('.type-picker .type-choice.selected')).toHaveLength(3);

    expect(document.querySelector('.capture-rate-panel-summary.advanced-toggle')).not.toBeNull();
    expect(document.querySelector('.capture-rate-display')?.textContent).toContain('Base');
    expect(document.querySelector('.capture-rate-display')?.textContent).toContain('Current');
    expect(document.querySelector('.capture-rate-modifiers .modifiers-grid')).not.toBeNull();
    expect(document.querySelector('.capture-formula')?.textContent).toContain('evolution');
    expect(document.body.textContent).toContain('Stuck:');
    expect(document.body.textContent).toContain('× 10');
    expect(document.querySelector('.incoming-damage-block .hp-damage-controls')).not.toBeNull();
    expect(document.querySelector('.level-hp-info-row + .incoming-damage-block')).not.toBeNull();
    const tickButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.tick-buttons button'));
    expect(tickButtons.map(button => button.textContent)).toEqual(['+ Tick', '− Tick', '+ Tick Temp HP', '+ Injury']);
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Temp HP"]')?.value).toBe('0');
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Injuries"]')?.value).toBe('0');
    tickButtons[2].click();
    await tick();
    const afterTempHp = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(afterTempHp.tempHitPoints).toBe(Math.floor(afterTempHp.hitPointsMax * .1));
    tickButtons[1].click();
    await tick();
    const afterNegativeTick = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(afterNegativeTick.tempHitPoints).toBe(0);
    expect(afterNegativeTick.hitPoints).toBe(afterTempHp.hitPoints);
    tickButtons[2].click();
    await tick();
    tickButtons[3].click();
    await tick();
    const afterInjury = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(afterInjury.captureState.standardCounts.injuries).toBe(1);
    expect(afterInjury.hitPoints).toBeLessThanOrEqual(Math.floor(afterInjury.hitPointsMax * .9));
    expect(document.querySelectorAll('.damage-category-buttons button')).toHaveLength(2);
    const damageInput = document.querySelector<HTMLInputElement>('input[aria-label="Incoming damage"]')!;
    const damageForm = damageInput.closest('form')!;
    damageInput.value = '20';
    damageInput.dispatchEvent(new Event('input', { bubbles: true }));
    damageForm.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await tick();
    const afterDamage = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(afterDamage.hitPoints).toBeLessThan(afterInjury.hitPoints);
    expect(afterDamage.tempHitPoints).toBe(0);
    expect(document.querySelector('.details-right .damage-panel')).toBeNull();
    expect(document.querySelectorAll('.type-effectiveness-item')).toHaveLength(19);
    expect(document.querySelector('.type-effectiveness-header small')).toBeNull();
  });

  it('lets move and ability pickers switch to their global lists', async () => {
    localStorage.setItem('selectedPokemon', JSON.stringify({
      id: 25, name: 'Pikachu', level: 12, types: ['Electric'], stats: { HP: 5, atk: 6, def: 4, spA: 7, spD: 5, spe: 8 },
      moves: [], abilities: [], capabilities: [], skills: {}, pokeEdges: []
    }));
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = url.includes('/natures') ? { natures: [] }
        : url.includes('/all-moves') ? [{ name: 'Thunderbolt' }]
        : url.includes('/all-abilities') ? [{ name: 'Static' }]
        : url.includes('/abilities/') ? { advanced: [{ name: 'Lightning Rod', sourceSlot: 'Adv Ability 2' }] }
        : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    instances.push(mount(DetailsApp, { target: document.getElementById('app')! }));
    await tick();

    const abilitySection = Array.from(document.querySelectorAll('.section')).find(section => section.textContent?.includes('Abilities'))!;
    (Array.from(abilitySection.querySelectorAll('button')).find(button => button.textContent?.includes('Edit')) as HTMLButtonElement).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Search all abilities'));
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Lightning Rod — Adv Ability 2');
    (Array.from(document.querySelectorAll('button')).find(button => button.textContent?.includes('Search all abilities')) as HTMLButtonElement).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Static'));
    expect(fetchMock.mock.calls.some(call => String(call[0]).includes('/api/pokemon/all-abilities'))).toBe(true);

    (document.querySelector('[role="dialog"] .modal-btn-secondary') as HTMLButtonElement).click();
    await tick();
    const moveSection = Array.from(document.querySelectorAll('.section')).find(section => section.querySelector('.section-title')?.textContent?.includes('Moves'))!;
    (Array.from(moveSection.querySelectorAll('button')).find(button => button.textContent?.includes('Edit')) as HTMLButtonElement).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Search all moves'));
    (Array.from(document.querySelectorAll('button')).find(button => button.textContent?.includes('Search all moves')) as HTMLButtonElement).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Thunderbolt'));
    expect(fetchMock.mock.calls.some(call => String(call[0]).includes('/api/pokemon/all-moves'))).toBe(true);
  });

  it('offers direct JustDices rolls on embedded sheets', async () => {
    history.replaceState({}, '', '/details.html?embedded=true');
    const pokemon = normalizePokemon({
      id: 25, name: 'Pikachu', level: 12, types: ['Electric'], stats: { HP: 5, atk: 6, def: 4, spA: 7, spD: 5, spe: 8 },
      moves: [], abilities: [], capabilities: [], skills: {}, pokeEdges: [], owlbear: { diceRoller: 'justdices', trackers: 'owltrackers' }
    });
    instances.push(mount(MovesEditor, { target: document.getElementById('app')!, props: { pokemon, onsave: vi.fn() } }));
    await tick();

    expect(Array.from(document.querySelectorAll('button')).some(button => button.textContent === 'Roll')).toBe(true);
    expect(Array.from(document.querySelectorAll('button')).some(button => button.textContent === 'Crit')).toBe(true);
  });

  it('shows STAB as a toggle that updates the damage base', async () => {
    const onsave = vi.fn();
    const pokemon = normalizePokemon({
      id: 25, name: 'Pikachu', level: 12, types: ['Electric'], stats: { HP: 5, atk: 6, def: 4, spA: 7, spD: 5, spe: 8 },
      moves: [{ name: 'Thunder Shock', type: 'Electric', class: 'Special', damageBase: damageBase(4) }], capabilities: [], skills: {}
    });
    instances.push(mount(MovesEditor, { target: document.getElementById('app')!, props: { pokemon, onsave } }));
    await tick();

    const stab = document.querySelector<HTMLButtonElement>('[aria-label="Remove STAB from Thunder Shock"]')!;
    expect(stab).not.toBeNull();
    expect(stab.getAttribute('aria-pressed')).toBe('true');
    expect(stab.closest('.db-identity')?.textContent).toContain('DB6');

    stab.click();
    await tick();
    expect(pokemon.moves?.[0]).toMatchObject({ damageBase: { short: 'DB4', stab: false }, stabCustomized: true });
    expect(onsave).toHaveBeenCalledOnce();
  });

  it('shows all Double Strike damage outcomes instead of the regular rolls', async () => {
    const pokemon = normalizePokemon({
      id: 236, name: 'Tyrogue', level: 12, types: ['Fighting'], stats: { HP: 5, atk: 8, def: 5, spA: 3, spD: 4, spe: 6 },
      moves: [{ name: 'Double Kick', type: 'Fighting', class: 'Physical', range: 'Melee, 1 Target, Double Strike', damageBase: damageBase(3) }], capabilities: [], skills: {}
    });
    instances.push(mount(MovesEditor, { target: document.getElementById('app')!, props: { pokemon, onsave: vi.fn() } }));
    await tick();

    const card = Array.from(document.querySelectorAll('.move')).find(item => item.textContent?.includes('Double Kick'))!;
    expect(card.querySelectorAll('.multi-strike-case')).toHaveLength(5);
    expect(Array.from(card.querySelectorAll('.multi-strike-label')).map(item => item.textContent)).toEqual([
      '1 hit · 0 crit', '1 hit · 1 crit', '2 hits · 0 crit', '2 hits · 1 crit', '2 hits · 2 crits'
    ]);
    expect(card.querySelector('.multi-strike-badge')?.textContent).toBe('Double Strike');
  });

  it('shows all Five Strike hit outcomes', async () => {
    const pokemon = normalizePokemon({
      id: 190, name: 'Aipom', level: 12, types: ['Normal'], stats: { HP: 5, atk: 8, def: 5, spA: 3, spD: 4, spe: 6 },
      moves: [{ name: 'Fury Swipes', type: 'Normal', class: 'Physical', range: 'Melee, 1 Target, Five Strike', damageBase: damageBase(3) }], capabilities: [], skills: {}
    });
    instances.push(mount(MovesEditor, { target: document.getElementById('app')!, props: { pokemon, onsave: vi.fn() } }));
    await tick();

    const card = Array.from(document.querySelectorAll('.move')).find(item => item.textContent?.includes('Fury Swipes'))!;
    expect(card.querySelectorAll('.multi-strike-case')).toHaveLength(5);
    expect(Array.from(card.querySelectorAll('.multi-strike-label')).map(item => item.textContent)).toEqual([
      '1 hit · d8: 1', '2 hits · d8: 2–3', '3 hits · d8: 4–6', '4 hits · d8: 7', '5 hits · d8: 8'
    ]);
    expect(card.querySelector('.multi-strike-badge')?.textContent).toBe('Five Strike');
    expect(Array.from(card.querySelectorAll('.multi-strike-case')).every(row => Array.from(row.querySelectorAll('button')).some(button => button.textContent === 'Crit'))).toBe(true);
  });

  it('shows Nuclear in type effectiveness when Uranium was selected for generation', async () => {
    const pokemon = normalizePokemon({
      id: 1, name: 'Orchynx', level: 1, types: ['Grass', 'Steel'], stats: { HP: 1 }, fandex: ['uranium']
    });
    const onselect = vi.fn();
    instances.push(mount(TypeEffectiveness, {
      target: document.getElementById('app')!,
      props: { pokemon, selected: 'typeless', onselect, onsave: vi.fn() }
    }));
    await tick();

    expect(document.querySelectorAll('.type-effectiveness-item')).toHaveLength(20);
    const nuclear = Array.from(document.querySelectorAll<HTMLElement>('.type-effectiveness-item')).find(item => item.textContent?.includes('Nuclear'))!;
    expect(nuclear?.textContent).toContain('1x');
    nuclear.querySelector<HTMLElement>('.type-eff-value-cell')!.click();
    expect(onselect).toHaveBeenCalledWith('nuclear');
    nuclear.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onselect).toHaveBeenCalledTimes(2);
  });

  it('marks a manually modified base stat', async () => {
    const pokemon = normalizePokemon({
      id: 1, name: 'Testmon', level: 10, types: ['Normal'],
      baseStats: { HP: 5, Attack: 6, Defense: 7, 'Special Attack': 8, 'Special Defense': 9, Speed: 10 },
      baseWithNature: { HP: 5, atk: 6, def: 7, spA: 8, spD: 9, spe: 10 },
      stats: { HP: 5, atk: 6, def: 7, spA: 8, spD: 9, spe: 10 },
      nature: { name: 'Composed' }
    });
    const editor = mount(StatsEditor, {
      target: document.getElementById('app')!, props: { pokemon, onsave: vi.fn() }
    });
    await tick();

    expect(document.querySelector('.base-modified-indicator')).toBeNull();
    const speedBase = document.querySelector<HTMLInputElement>('input[aria-label="Speed base stat after Nature"]')!;
    speedBase.value = '11';
    speedBase.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();

    expect(pokemon.baseStats?.Speed).toBe(11);
    await unmount(editor);
    document.getElementById('app')!.innerHTML = '';
    instances.push(mount(StatsEditor, {
      target: document.getElementById('app')!, props: { pokemon, onsave: vi.fn() }
    }));
    await tick();
    expect(document.querySelector('[data-stat="spe"] .base-modified-indicator')?.getAttribute('title')).toBe('Original base stat: 10');
  });

  it('lets users change move types and offers Typeless and Uranium Nuclear for moves and species', async () => {
    const pokemon = normalizePokemon({
      id: 1, name: 'Orchynx', level: 1, types: ['Grass', 'Steel'], stats: { HP: 1 }, fandex: ['uranium'],
      moves: [{ name: 'Leaf Blade', type: 'Grass', class: 'Physical', damageBase: damageBase(5) }]
    });
    const onsave = vi.fn();
    instances.push(mount(MovesEditor, { target: document.getElementById('app')!, props: { pokemon, onsave } }));
    await tick();

    document.querySelector<HTMLButtonElement>('[aria-label="Change Leaf Blade type"]')!.click();
    await tick();
    expect(Array.from(document.querySelectorAll('.type-choice')).map(button => button.textContent)).toContain('Typeless');
    expect(Array.from(document.querySelectorAll('.type-choice')).map(button => button.textContent)).toContain('Nuclear');
    document.querySelector<HTMLButtonElement>('.type-choice.type-typeless')!.click();
    document.querySelector<HTMLButtonElement>('[role="dialog"] .modal-btn-primary')!.click();
    await tick();
    expect(pokemon.moves?.[0].type).toBe('Typeless');
    expect(onsave).toHaveBeenCalled();
    document.querySelector<HTMLButtonElement>('[aria-label="Change Leaf Blade type"]')!.click();
    await tick();
    document.querySelector<HTMLButtonElement>('.type-choice.type-nuclear')!.click();
    document.querySelector<HTMLButtonElement>('[role="dialog"] .modal-btn-primary')!.click();
    await tick();
    expect(pokemon.moves?.[0].type).toBe('Nuclear');

    await unmount(instances.pop()!);
    document.body.innerHTML = '<div id="app"></div>';
    instances.push(mount(TypesEditor, { target: document.getElementById('app')!, props: { pokemon, onsave } }));
    await tick();
    document.querySelector<HTMLButtonElement>('.pokemon-types-row .edit-bn')!.click();
    await tick();
    expect(Array.from(document.querySelectorAll('.type-choice')).map(button => button.textContent)).toContain('Typeless');
    expect(Array.from(document.querySelectorAll('.type-choice')).map(button => button.textContent)).toContain('Nuclear');
  });

  it('edits range keywords as badges with inline numeric values', async () => {
    const pokemon = normalizePokemon({
      id: 236, name: 'Tyrogue', level: 12, types: ['Fighting'], stats: { HP: 5, atk: 8, def: 5, spA: 3, spD: 4, spe: 6 },
      moves: [{ name: 'Custom Strike', type: 'Fighting', class: 'Physical', range: '6, 1 Target, Close Blast 2, Double Strike, Weird Thing' }]
    });
    const onsave = vi.fn();
    instances.push(mount(MovesEditor, { target: document.getElementById('app')!, props: { pokemon, onsave } }));
    await tick();

    document.querySelector<HTMLButtonElement>('[aria-label="Edit Custom Strike range keywords"]')!.click();
    await tick();
    const dialog = () => document.querySelector('[role="dialog"]')!;
    const chip = (label: string) => Array.from(dialog().querySelectorAll<HTMLButtonElement>('.range-chip button')).find(button => button.textContent === label)!;
    const setValue = async (label: string, value: string) => {
      const input = dialog().querySelector<HTMLInputElement>(`[aria-label="${label} value"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await tick();
    };

    await setValue('Range', '8');
    await setValue('Targets', '2');
    chip('Cone').click();
    await tick();
    await setValue('Cone', '3');
    chip('Double Strike').click();
    await tick();
    expect(dialog().querySelector('.modal-info-box')?.textContent).toContain('8, 2 Targets, Cone 3, Close Blast 2, Weird Thing');

    document.querySelector<HTMLButtonElement>('[role="dialog"] .modal-btn-primary')!.click();
    await tick();

    expect(pokemon.moves?.[0].range).toBe('8, 2 Targets, Cone 3, Close Blast 2, Weird Thing');
    expect(onsave).toHaveBeenCalled();
  });
});
