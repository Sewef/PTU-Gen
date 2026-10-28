import { describe, expect, it, vi } from 'vitest';
import { createOwlbearContext } from '../../owlbear/context.js';

describe('Owlbear scene readiness', () => {
  it('reapplies current player roles whenever a scene becomes ready', async () => {
    let initialize: () => Promise<void>;
    let sceneReady: (ready: boolean) => void;
    let playerChanged: (player: any) => void;
    const ensureVisibility = vi.fn(async () => {});
    const OBR = {
      isAvailable: true,
      room: { id: 'room-1' },
      onReady: vi.fn(callback => { initialize = callback; }),
      player: {
        id: 'player-1', getName: vi.fn(async () => 'Player'), getRole: vi.fn(async () => 'PLAYER'),
        onChange: vi.fn(callback => { playerChanged = callback; })
      },
      party: { getPlayers: vi.fn(async () => []), onChange: vi.fn() },
      scene: { onReadyChange: vi.fn(callback => { sceneReady = callback; }), items: { onChange: vi.fn() } }
    };
    const context = createOwlbearContext({
      OBR, resolveOwlbearReady: vi.fn(), notifyTrackedTokenStates: vi.fn(),
      ensurePlayerOwnedOwlTrackersVisibility: ensureVisibility
    });
    await context.initializeOwlbearContext();
    await initialize!();
    ensureVisibility.mockClear();

    sceneReady!(false);
    expect(ensureVisibility).not.toHaveBeenCalled();
    playerChanged!({ id: 'player-1', name: 'Player', role: 'GM' });
    ensureVisibility.mockClear();
    sceneReady!(true);
    expect(ensureVisibility).toHaveBeenCalledWith([{ id: 'player-1', name: 'Player', role: 'GM' }]);
    sceneReady!(false);
    sceneReady!(true);
    expect(ensureVisibility).toHaveBeenCalledTimes(2);
  });
});
