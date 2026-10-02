export function natureName(nature: any): string {
  return String(nature?.name || nature?.Name || nature || '');
}

export function natureLabel(nature: any): string {
  const name = natureName(nature);
  const raise = nature?.raise || nature?.Raise;
  const lower = nature?.lower || nature?.Lower;
  return raise && lower ? `${name} (+${raise} / −${lower})` : name;
}
