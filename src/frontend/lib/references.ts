export const REFERENCE_TYPES = [
  'move', 'ability', 'capability', 'status', 'edge', 'pokeedge', 'item', 'feature', 'keyword'
] as const;

export type ReferenceType = typeof REFERENCE_TYPES[number];

export type ReferenceTextPart =
  | { kind: 'text'; text: string }
  | { kind: 'reference'; type: ReferenceType; name: string; label: string };

const REFERENCE_TYPE_PATTERN = REFERENCE_TYPES.join('|');
const REFERENCE_PATTERN = new RegExp(
  `\\[\\[\\s*(${REFERENCE_TYPE_PATTERN})\\s*:\\s*([^\\]]+?)\\s*\\]\\](?:\\(([^)]*)\\))?`,
  'gi'
);

const TYPE_PAGES: Record<ReferenceType, string> = {
  move: 'moves.html',
  ability: 'abilities.html',
  capability: 'capabilities.html',
  status: 'statuses.html',
  edge: 'edges.html',
  pokeedge: 'pokeedges.html',
  item: 'items.html',
  feature: 'features.html',
  keyword: 'moves.html#keywords'
};

export function parseReferenceText(value: unknown): ReferenceTextPart[] {
  const text = String(value ?? '');
  const parts: ReferenceTextPart[] = [];
  let cursor = 0;

  REFERENCE_PATTERN.lastIndex = 0;
  for (let match = REFERENCE_PATTERN.exec(text); match; match = REFERENCE_PATTERN.exec(text)) {
    if (match.index > cursor) parts.push({ kind: 'text', text: text.slice(cursor, match.index) });
    const name = match[2].trim();
    parts.push({
      kind: 'reference',
      type: match[1].toLowerCase() as ReferenceType,
      name,
      label: match[3]?.trim() || name
    });
    cursor = REFERENCE_PATTERN.lastIndex;
  }

  if (cursor < text.length) parts.push({ kind: 'text', text: text.slice(cursor) });
  return parts.length ? parts : [{ kind: 'text', text }];
}

export function referenceUrl(type: ReferenceType, dataset: unknown = 'core', search?: unknown): string {
  const normalizedDataset = String(dataset || 'core').trim().toLowerCase();
  const section = normalizedDataset === 'homebrew'
    ? 'ptuhomebrew'
    : normalizedDataset === 'community'
      ? 'ptucommunity'
      : 'ptucore';
  const [page, fragment] = TYPE_PAGES[type].split('#', 2);
  const searchTerm = String(search ?? '').trim();
  const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
  const hash = fragment ? `#${fragment}` : '';
  return `https://sewef.github.io/ptu/${section}/${page}${query}${hash}`;
}
