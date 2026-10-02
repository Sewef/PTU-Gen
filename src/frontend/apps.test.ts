import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import GeneratorApp from './GeneratorApp.svelte';
import DetailsApp from './DetailsApp.svelte';
import MovesEditor from './components/MovesEditor.svelte';
import TypeEffectiveness from './components/TypeEffectiveness.svelte';
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
      moves: [], abilities: [], capabilities: ['Overland 5', 'Underdog'], skills: { Acrobatics: '3d6+2' }, pokeEdges: [], otherInfo: { sizeCategory: 'Small', hatch_rate: 10, gender: 'Female' },
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
    expect(document.querySelector('.base-relation-summary')?.textContent?.replace(/\s+/g, '')).toBe('atk>spA>spe>HP=spD>def');
    expect(document.querySelectorAll('.stat-relation-checkbox')).toHaveLength(6);
    expect(document.querySelectorAll('.nature-indicator')).toHaveLength(2);
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Attack base stat after Nature"]')?.value).toBe('8');
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Attack level points"]')?.value).toBe('2');
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Attack bonus"]')?.value).toBe('0');
    const attackRelation = document.querySelector<HTMLInputElement>('input[aria-label="Keep Attack in Base Relation"]')!;
    attackRelation.click();
    await tick();
    expect(JSON.parse(localStorage.getItem('selectedPokemon')!).ignoreBaseRelation).toBe('atk');
    expect(Array.from(document.querySelectorAll('.br-stat')).find(stat => stat.textContent === 'atk')?.classList.contains('br-stat-ignored')).toBe(true);
    expect(document.querySelector<HTMLTextAreaElement>('.capability-no-value-input')?.value).toBe('Underdog');
    expect(document.querySelector<HTMLInputElement>('.capability-value-input')?.value).toBe('5');
    expect(document.querySelector('button[aria-label="Roll Acrobatics"]')).not.toBeNull();
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
    expect(document.querySelectorAll('.type-picker .type-choice')).toHaveLength(18);
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
    expect(tickButtons.map(button => button.textContent)).toEqual(['+ Tick', '− Tick', '+ Injury']);
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Injuries"]')?.value).toBe('0');
    tickButtons[2].click();
    await tick();
    const afterInjury = JSON.parse(localStorage.getItem('selectedPokemon')!);
    expect(afterInjury.captureState.standardCounts.injuries).toBe(1);
    expect(afterInjury.hitPoints).toBeLessThanOrEqual(Math.floor(afterInjury.hitPointsMax * .9));
    expect(document.querySelectorAll('.damage-category-buttons button')).toHaveLength(2);
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
        : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    instances.push(mount(DetailsApp, { target: document.getElementById('app')! }));
    await tick();

    const abilitySection = Array.from(document.querySelectorAll('.section')).find(section => section.textContent?.includes('Abilities'))!;
    (Array.from(abilitySection.querySelectorAll('button')).find(button => button.textContent?.includes('Edit')) as HTMLButtonElement).click();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Search all abilities'));
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

  it('shows Nuclear in type effectiveness when Uranium was selected for generation', async () => {
    const pokemon = normalizePokemon({
      id: 1, name: 'Orchynx', level: 1, types: ['Grass', 'Steel'], stats: { HP: 1 }, fandex: ['uranium']
    });
    instances.push(mount(TypeEffectiveness, {
      target: document.getElementById('app')!,
      props: { pokemon, selected: 'typeless', onselect: vi.fn(), onsave: vi.fn() }
    }));
    await tick();

    expect(document.querySelectorAll('.type-effectiveness-item')).toHaveLength(20);
    const nuclear = Array.from(document.querySelectorAll('.type-effectiveness-item')).find(item => item.textContent?.includes('Nuclear'));
    expect(nuclear?.textContent).toContain('1x');
  });
});
