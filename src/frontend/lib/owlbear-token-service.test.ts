import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTokenService } from '../../owlbear/tokens.js';
import { OWL_TRACKERS_METADATA_KEY } from '../../owlbear/constants.js';

afterEach(() => vi.useRealTimers());

describe('Owlbear token service', () => {
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
      { name: 'Injuries', value: 1 }
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
      name: 'Testmon', nickname: '', hitPoints: 17, hitPointsMax: 40,
      captureState: { standardCounts: { injuries: 4 } },
      owlbear: { tokenId: 'token-1', trackers: 'owltrackers' }
    });
    await vi.advanceTimersByTimeAsync(301);

    const updatedTrackers = item.metadata[OWL_TRACKERS_METADATA_KEY];
    expect(updatedTrackers[0]).toMatchObject({ value: 17, max: 40 });
    expect(updatedTrackers[1]).toMatchObject({ value: 4 });
    expect(updatedTrackers).not.toBe(trackers);
    expect(nameWrites).toBe(0);
    expect(OBR.scene.items.updateItems).toHaveBeenCalledOnce();
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
});
