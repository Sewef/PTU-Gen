export function calculateIncomingDamage(amount: number, defense: number, multiplier: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (multiplier === 0) return 0;
  const reduced = Math.max(1, amount - (Number.isFinite(defense) ? defense : 0));
  return Math.max(1, Math.floor(reduced * (Number.isFinite(multiplier) ? multiplier : 1)));
}
