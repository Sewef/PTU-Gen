import type { OwlbearTokenState } from './owlbear';
import type { Pokemon } from './types';

export function applyTokenToPokemon(pokemon: Pokemon, token: Partial<OwlbearTokenState> & { id?: string }) {
  const id = String(token.id || token.tokenId || '');
  if (!id) return false;
  let changed = false;
  const assign = <K extends keyof Pokemon>(key: K, value: Pokemon[K]) => {
    if (pokemon[key] === value) return;
    pokemon[key] = value;
    changed = true;
  };

  if (pokemon.owlbear.tokenId !== id) {
    pokemon.owlbear.tokenId = id;
    changed = true;
  }
  if (token.visible !== null && token.visible !== undefined) {
    const visible = token.visible !== false;
    if (pokemon.owlbear.visible !== visible) {
      pokemon.owlbear.visible = visible;
      changed = true;
    }
  }
  if (token.createdUserId && pokemon.owlbear.playerId !== token.createdUserId) {
    pokemon.owlbear.playerId = token.createdUserId;
    changed = true;
  }
  if (pokemon.owlbear.trackers === 'owltrackers' && token.owlTrackers) {
    const hp = token.owlTrackers.hp?.value == null ? NaN : Number(token.owlTrackers.hp.value);
    const hpMax = token.owlTrackers.hp?.max == null ? NaN : Number(token.owlTrackers.hp.max);
    const injuries = token.owlTrackers.injuries == null ? NaN : Number(token.owlTrackers.injuries);
    const tempHp = token.owlTrackers.tempHp == null ? NaN : Number(token.owlTrackers.tempHp);
    if (Number.isFinite(hp)) assign('hitPoints', Math.trunc(hp));
    if (Number.isFinite(hpMax) && hpMax > 0) assign('hitPointsMax', Math.trunc(hpMax));
    if (Number.isFinite(tempHp)) assign('tempHitPoints', Math.max(0, Math.trunc(tempHp)));
    if (Number.isFinite(injuries)) {
      const count = Math.max(0, Math.trunc(injuries));
      if (pokemon.captureState!.standardCounts.injuries !== count) {
        pokemon.captureState!.standardCounts.injuries = count;
        changed = true;
      }
      const injuries5 = count >= 5;
      if (pokemon.captureState!.errataFlags.injuries5 !== injuries5) {
        pokemon.captureState!.errataFlags.injuries5 = injuries5;
        changed = true;
      }
    }
  }
  return changed;
}
