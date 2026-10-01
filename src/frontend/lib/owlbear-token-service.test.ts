import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTokenService } from '../../owlbear/tokens.js';
import { OWL_TRACKERS_METADATA_KEY } from '../../owlbear/constants.js';

afterEach(() => vi.useRealTimers());

describe('Owlbear token service', () => {
  it('synchronizes HP and injuries from the sheet to Owl Trackers', async () => {
    vi.useFakeTimers();
    const trackers: any[] = [
      { name: 'HP', value: 20, max: 40 },
      { name: 'Injuries', value: 1 }
    ];
    const item = { id: 'token-1', name: 'Testmon', metadata: { [OWL_TRACKERS_METADATA_KEY]: trackers } };
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
    expect(OBR.scene.items.updateItems).toHaveBeenCalledOnce();
  });
});
