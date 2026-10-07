import { describe, expect, it } from 'vitest';
import { normalizePokemon } from './pokemon';
import { applyTokenToPokemon } from './owlbear-token';

describe('Owlbear token synchronization', () => {
  it('applies token identity, visibility, owner and Owl Trackers state', () => {
    const pokemon = normalizePokemon({
      name: 'Testmon', level: 5, types: ['Normal'],
      stats: { HP: 5, atk: 5, def: 5, spA: 5, spD: 5, spe: 5 },
      owlbear: { visible: true, playerId: '', trackers: 'owltrackers', initiative: 'none', diceRoller: 'none' }
    });
    expect(applyTokenToPokemon(pokemon, {
      id: 'token-1', visible: false, createdUserId: 'player-2',
      owlTrackers: { hp: { value: 12, max: 30 }, injuries: 5, tempHp: 7 }
    })).toBe(true);
    expect(pokemon.owlbear).toMatchObject({ tokenId: 'token-1', visible: false, playerId: 'player-2' });
    expect(pokemon).toMatchObject({ hitPoints: 12, hitPointsMax: 30, tempHitPoints: 7 });
    expect(pokemon.captureState.errataFlags.injuries5).toBe(true);
  });
});
