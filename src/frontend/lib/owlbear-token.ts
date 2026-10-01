import type { OwlbearTokenState } from './owlbear';
import type { Pokemon } from './types';

export function applyTokenToPokemon(pokemon: Pokemon, token: Partial<OwlbearTokenState> & { id?: string }) {
  const id = String(token.id || token.tokenId || '');
  if (!id) return false;
  pokemon.owlbear.tokenId = id;
  if (token.visible !== null && token.visible !== undefined) pokemon.owlbear.visible = token.visible !== false;
  if (token.createdUserId) pokemon.owlbear.playerId = token.createdUserId;
  if (pokemon.owlbear.trackers === 'owltrackers' && token.owlTrackers) {
    const hp = token.owlTrackers.hp?.value == null ? NaN : Number(token.owlTrackers.hp.value);
    const hpMax = token.owlTrackers.hp?.max == null ? NaN : Number(token.owlTrackers.hp.max);
    const injuries = token.owlTrackers.injuries == null ? NaN : Number(token.owlTrackers.injuries);
    if (Number.isFinite(hp)) pokemon.hitPoints = Math.trunc(hp);
    if (Number.isFinite(hpMax) && hpMax > 0) pokemon.hitPointsMax = Math.trunc(hpMax);
    if (Number.isFinite(injuries)) {
      const count = Math.max(0, Math.trunc(injuries));
      pokemon.captureState!.standardCounts.injuries = count;
      pokemon.captureState!.errataFlags.injuries5 = count >= 5;
    }
  }
  return true;
}
