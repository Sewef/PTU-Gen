import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTokenService } from '../../owlbear/tokens.js';
import { OWL_TRACKERS_HIDDEN_METADATA_KEY, OWL_TRACKERS_METADATA_KEY, PTU_TOKEN_METADATA_KEY } from '../../owlbear/constants.js';

afterEach(() => vi.useRealTimers());

describe('Owlbear token service', () => {
  it('shows Owl Trackers when a player inserts a token', async () => {
    const builtItem: any = { id: 'token-1', metadata: {} };
    const builder: any = {};
    for (const method of ['id', 'name', 'position', 'rotation', 'scale', 'visible', 'locked', 'layer']) {
      builder[method] = vi.fn((value: any) => {
        if (method === 'id') builtItem.id = value;
        return builder;
      });
    }
    builder.metadata = vi.fn((metadata: any) => {
      builtItem.metadata = metadata;
      return builder;
    });
    builder.build = vi.fn(() => builtItem);

    const OBR = {
      player: { id: 'player-1', getRole: vi.fn(async () => 'PLAYER') },
      party: { getPlayers: vi.fn(async () => []) },
      viewport: {
        getWidth: vi.fn(async () => 1000),
        getHeight: vi.fn(async () => 800),
        inverseTransformPoint: vi.fn(async (point: any) => point)
      },
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([builtItem]),
          addItems: vi.fn(async () => undefined)
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(() => builder), owlbearReady: Promise.resolve(true) });

    await service.insertSceneToken({
      id: 'token-1',
      name: 'Testmon',
      image: { url: 'test.png' },
      grid: { dpi: 70 },
      metadata: {
        [OWL_TRACKERS_METADATA_KEY]: [{ name: 'HP', value: 20, max: 40 }],
        [OWL_TRACKERS_HIDDEN_METADATA_KEY]: true
      }
    }, {});

    expect(OBR.player.getRole).toHaveBeenCalledOnce();
    expect(builtItem.metadata[PTU_TOKEN_METADATA_KEY]).toBe(true);
    expect(builtItem.metadata[OWL_TRACKERS_HIDDEN_METADATA_KEY]).toBe(false);
  });

  it('hides Owl Trackers when assigning a token to a GM', async () => {
    const item: any = {
      id: 'token-1',
      createdUserId: 'player-1',
      metadata: {
        [PTU_TOKEN_METADATA_KEY]: true,
        [OWL_TRACKERS_METADATA_KEY]: [{ name: 'HP', value: 20, max: 40 }],
        [OWL_TRACKERS_HIDDEN_METADATA_KEY]: false
      }
    };
    const OBR = {
      player: { id: 'player-1', getRole: vi.fn(async () => 'PLAYER') },
      party: { getPlayers: vi.fn(async () => [{ id: 'gm-1', role: 'GM' }]) },
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async () => [item]),
          updateItems: vi.fn(async (_ids: string[], update: (items: any[]) => void) => update([item]))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });

    await service.setSceneTokenOwner('token-1', 'gm-1', {});

    expect(item.createdUserId).toBe('gm-1');
    expect(item.metadata[OWL_TRACKERS_HIDDEN_METADATA_KEY]).toBe(true);
    expect(OBR.player.getRole).not.toHaveBeenCalled();
  });

  it('shows Owl Trackers when assigning a token to a player', async () => {
    const item: any = {
      id: 'token-1',
      createdUserId: 'gm-1',
      metadata: {
        [OWL_TRACKERS_METADATA_KEY]: [{ name: 'HP', value: 20, max: 40 }],
        [OWL_TRACKERS_HIDDEN_METADATA_KEY]: true
      }
    };
    const OBR = {
      player: { id: 'player-1', getRole: vi.fn(async () => 'PLAYER') },
      party: { getPlayers: vi.fn(async () => []) },
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async () => [item]),
          updateItems: vi.fn(async (_ids: string[], update: (items: any[]) => void) => update([item]))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });

    await service.setSceneTokenOwner('token-1', 'player-1', {});

    expect(item.createdUserId).toBe('player-1');
    expect(item.metadata[OWL_TRACKERS_HIDDEN_METADATA_KEY]).toBe(false);
    expect(OBR.player.getRole).toHaveBeenCalledOnce();
  });

  it('updates Owl Trackers visibility when its owner changes role', async () => {
    const ownedItem: any = {
      id: 'token-1',
      createdUserId: 'player-1',
      metadata: {
        [PTU_TOKEN_METADATA_KEY]: true,
        [OWL_TRACKERS_METADATA_KEY]: [{ name: 'HP', value: 20, max: 40 }],
        [OWL_TRACKERS_HIDDEN_METADATA_KEY]: true
      }
    };
    const unrelatedItem: any = {
      id: 'token-2',
      createdUserId: 'player-1',
      metadata: {
        [OWL_TRACKERS_METADATA_KEY]: [{ name: 'HP', value: 30, max: 30 }],
        [OWL_TRACKERS_HIDDEN_METADATA_KEY]: true
      }
    };
    const items = [ownedItem, unrelatedItem];
    const OBR = {
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async (filter: (item: any) => boolean) => items.filter(filter)),
          updateItems: vi.fn(async (ids: string[], update: (items: any[]) => void) => (
            update(items.filter(item => ids.includes(item.id)))
          ))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });

    await service.ensurePlayerOwnedOwlTrackersVisibility({ id: 'player-1', role: 'PLAYER' });

    expect(ownedItem.metadata[OWL_TRACKERS_HIDDEN_METADATA_KEY]).toBe(false);
    expect(unrelatedItem.metadata[OWL_TRACKERS_HIDDEN_METADATA_KEY]).toBe(true);
    expect(OBR.scene.items.updateItems).toHaveBeenCalledWith(['token-1'], expect.any(Function));

    await service.ensurePlayerOwnedOwlTrackersVisibility({ id: 'player-1', role: 'GM' });

    expect(ownedItem.metadata[OWL_TRACKERS_HIDDEN_METADATA_KEY]).toBe(true);
    expect(unrelatedItem.metadata[OWL_TRACKERS_HIDDEN_METADATA_KEY]).toBe(true);
  });

  it('centers a focused token without changing the viewport scale', async () => {
    const item = { id: 'token-1', name: 'Testmon', metadata: {} };
    const OBR = {
      player: { select: vi.fn(async () => undefined) },
      viewport: {
        getPosition: vi.fn(async () => ({ x: 100, y: 200 })),
        getWidth: vi.fn(async () => 1000),
        getHeight: vi.fn(async () => 800),
        transformPoint: vi.fn(async () => ({ x: 700, y: 500 })),
        setPosition: vi.fn(async () => undefined),
        animateTo: vi.fn(async () => undefined)
      },
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async () => [item]),
          getItemBounds: vi.fn(async () => ({ center: { x: 350, y: 250 } }))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });

    await service.focusSceneToken('token-1', {});

    expect(OBR.viewport.setPosition).toHaveBeenCalledWith({ x: -100, y: 100 });
    expect(OBR.viewport.animateTo).not.toHaveBeenCalled();
    expect(OBR.player.select).toHaveBeenCalledWith(['token-1'], true);
  });

  it('synchronizes HP and injuries from the sheet to Owl Trackers', async () => {
    vi.useFakeTimers();
    const trackers: any[] = [
      { name: 'HP', value: 20, max: 40 },
      { name: 'Injuries', value: 1 },
      { name: 'Temp HP', variant: 'value', color: 3, value: 2 }
    ];
    let nameWrites = 0;
    const item = new Proxy<any>({ id: 'token-1', name: 'Testmon', metadata: { [OWL_TRACKERS_METADATA_KEY]: trackers } }, {
      set(target, property, value) {
        if (property === 'name') nameWrites++;
        return Reflect.set(target, property, value);
      }
    });
    const OBR = {
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async () => [item]),
          updateItems: vi.fn(async (_ids: string[], update: (items: any[]) => void) => update([item]))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });
    await service.getSceneToken('token-1', {});
    service.schedulePokemonTokenSync({
      name: 'Testmon', nickname: '', hitPoints: 17, hitPointsMax: 40, tempHitPoints: 9,
      captureState: { standardCounts: { injuries: 4 } },
      owlbear: { tokenId: 'token-1', trackers: 'owltrackers' }
    });
    await vi.advanceTimersByTimeAsync(301);

    const updatedTrackers = item.metadata[OWL_TRACKERS_METADATA_KEY];
    expect(updatedTrackers[0]).toMatchObject({ value: 17, max: 40 });
    expect(updatedTrackers[1]).toMatchObject({ value: 4 });
    expect(updatedTrackers[2]).toMatchObject({ value: 9 });
    expect(service.serializeToken(item)?.owlTrackers).toMatchObject({
      hp: { value: 17, max: 40 }, injuries: 4, tempHp: 9
    });
    expect(updatedTrackers).not.toBe(trackers);
    expect(nameWrites).toBe(0);
    expect(OBR.scene.items.updateItems).toHaveBeenCalledOnce();
  });

  it('adds the Temp HP tracker to an already linked Owl Trackers token', async () => {
    const item: any = {
      id: 'token-1', name: 'Testmon',
      metadata: { [OWL_TRACKERS_METADATA_KEY]: [{ name: 'HP', value: 40, max: 40 }, { name: 'Injuries', value: 0 }] }
    };
    const OBR = {
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async () => [item]),
          updateItems: vi.fn(async (_ids: string[], update: (items: any[]) => void) => update([item]))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });

    await service.syncPokemonToSceneToken({
      name: 'Testmon', hitPoints: 40, hitPointsMax: 40, tempHitPoints: 6,
      captureState: { standardCounts: { injuries: 0 } },
      owlbear: { tokenId: 'token-1', trackers: 'owltrackers' }
    });

    expect(item.metadata[OWL_TRACKERS_METADATA_KEY]).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Temp HP', variant: 'value', color: 3, value: 6 })
    ]));
  });

  it('synchronizes a transformed sprite without requiring Owl Trackers', async () => {
    vi.useFakeTimers();
    const item: any = { id: 'token-1', name: 'Lucario', image: { url: 'base.png', width: 96, height: 96 }, metadata: {} };
    const originalImage = item.image;
    const OBR = {
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async () => [item]),
          updateItems: vi.fn(async (_ids: string[], update: (items: any[]) => void) => update([item]))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });
    await service.getSceneToken('token-1', {});
    service.schedulePokemonTokenSync({
      name: 'Lucario', imageUrl: 'mega.png', captureState: { standardCounts: {} },
      owlbear: { tokenId: 'token-1', trackers: 'none' }
    });
    await vi.advanceTimersByTimeAsync(301);

    expect(item.image).toMatchObject({ url: 'mega.png', width: 96, height: 96 });
    expect(item.image).toBe(originalImage);
    expect(OBR.scene.items.updateItems).toHaveBeenCalledOnce();
  });

  it('preserves a manually replaced image and token geometry when synchronizing', async () => {
    const item: any = {
      id: 'token-1',
      name: 'Lucario',
      image: { url: 'https://example.com/custom.png', width: 320, height: 180 },
      scale: { x: 2.5, y: 1.75 },
      grid: { dpi: 70, offset: { x: 160, y: 90 } },
      metadata: {}
    };
    const originalImage = structuredClone(item.image);
    const originalScale = structuredClone(item.scale);
    const originalGrid = structuredClone(item.grid);
    const OBR = {
      scene: {
        isReady: vi.fn(async () => true),
        items: {
          getItems: vi.fn(async () => [item]),
          updateItems: vi.fn(async (_ids: string[], update: (items: any[]) => void) => update([item]))
        }
      }
    };
    const service = createTokenService({ OBR, buildImage: vi.fn(), owlbearReady: Promise.resolve(true) });

    await service.syncPokemonToSceneToken({
      name: 'Lucario', nickname: 'Aura', captureState: { standardCounts: {} },
      owlbear: { tokenId: 'token-1', trackers: 'none' }
    });

    expect(item.image).toEqual(originalImage);
    expect(item.scale).toEqual(originalScale);
    expect(item.grid).toEqual(originalGrid);
    expect(item.name).toBe('Aura');
    expect(OBR.scene.items.updateItems).toHaveBeenCalledOnce();
  });
});
