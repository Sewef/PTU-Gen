export function calculateIncomingDamage(amount: number, defense: number, multiplier: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (multiplier === 0) return 0;
  const reduced = Math.max(1, amount - (Number.isFinite(defense) ? defense : 0));
  return Math.max(1, Math.floor(reduced * (Number.isFinite(multiplier) ? multiplier : 1)));
}

export function hitPointTick(maximumHitPoints: number): number {
  return Math.max(1, Math.floor((Number(maximumHitPoints) || 0) / 10));
}

export function injuredHitPointMaximum(maximumHitPoints: number, injuries: number): number {
  const maximum = Math.max(0, Number(maximumHitPoints) || 0);
  const injuryCount = Math.max(0, Math.min(10, Math.trunc(Number(injuries) || 0)));
  return Math.max(0, Math.floor(maximum * (1 - injuryCount * .1)));
}

export function adjustHitPointsByTick(current: number, maximum: number, direction: 1 | -1, injuries = 0): number {
  const next = (Number(current) || 0) + hitPointTick(maximum) * direction;
  return direction > 0 ? Math.min(injuredHitPointMaximum(maximum, injuries), next) : next;
}
