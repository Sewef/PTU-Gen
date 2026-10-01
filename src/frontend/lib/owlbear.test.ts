import { describe, expect, it, vi } from 'vitest';
import { listenOwlbear } from './owlbear';

describe('Owlbear bridge', () => {
  it('forwards live scene token updates to the details sheet', () => {
    const onPlayers = vi.fn();
    const onTokenState = vi.fn();
    const stop = listenOwlbear(onPlayers, onTokenState);
    const state = {
      type: 'ptu-owlbear-token-state', tokenId: 'token-1', id: 'token-1', exists: true,
      visible: true, createdUserId: 'player-1', owlTrackers: { hp: { value: 12, max: 30 }, injuries: 2 }
    };

    window.dispatchEvent(new MessageEvent('message', { origin: location.origin, data: state }));

    expect(onTokenState).toHaveBeenCalledWith(state);
    stop();
  });
});
