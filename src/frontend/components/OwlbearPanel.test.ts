import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import { normalizePokemon } from '../lib/pokemon';

const { requestOwlbear } = vi.hoisted(() => ({ requestOwlbear: vi.fn() }));

vi.mock('../lib/owlbear', () => ({
  listenOwlbear: vi.fn(() => () => undefined),
  requestOwlbear
}));

import OwlbearPanel from './OwlbearPanel.svelte';

let instance: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  requestOwlbear.mockReset();
});

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = undefined;
});

describe('OwlbearPanel', () => {
  it('keeps the Visible label beside its checkbox outside the extension', () => {
    const pokemon = normalizePokemon({
      id: 25,
      name: 'Pikachu',
      level: 12,
      types: ['Electric'],
      stats: { HP: 5 }
    });

    instance = mount(OwlbearPanel, {
      target: document.getElementById('app')!,
      props: { pokemon, embedded: false, onsave: vi.fn() }
    });

    const label = document.querySelector<HTMLElement>('.owlbear-visible-option')!;
    expect(label.firstElementChild).toMatchObject({ type: 'checkbox' });
    expect(label.textContent?.trim()).toBe('Visible');
  });

  it('offers insertion again when the linked token no longer exists', async () => {
    requestOwlbear.mockResolvedValue({ token: null });
    const onsave = vi.fn();
    const pokemon = normalizePokemon({
      id: 25,
      name: 'Pikachu',
      level: 12,
      types: ['Electric'],
      stats: { HP: 5 },
      owlbear: { tokenId: 'deleted-token', trackers: 'none' }
    });

    instance = mount(OwlbearPanel, {
      target: document.getElementById('app')!,
      props: { pokemon, embedded: true, onsave }
    });

    await vi.waitFor(() => expect(document.querySelector('.owlbear-focus-btn')?.textContent).toBe('Insert'));
    expect(pokemon.owlbear.tokenId).toBe('');
    expect(document.querySelector('.owlbear-token-status')?.textContent).toBe('Token no longer in scene');
    expect(onsave).toHaveBeenCalled();
  });
});
