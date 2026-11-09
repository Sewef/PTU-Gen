import { describe, expect, it } from 'vitest';
import { parseReferenceText, referenceUrl } from './references';

describe('PTU-Data references', () => {
  it('parses references and their optional display labels without losing surrounding text', () => {
    expect(parseReferenceText('Choose [[ability:Starlight]] or [[status:Burned]](Burn).')).toEqual([
      { kind: 'text', text: 'Choose ' },
      { kind: 'reference', type: 'ability', name: 'Starlight', label: 'Starlight' },
      { kind: 'text', text: ' or ' },
      { kind: 'reference', type: 'status', name: 'Burned', label: 'Burn' },
      { kind: 'text', text: '.' }
    ]);
  });

  it('targets the matching PTU-Data dataset and page', () => {
    expect(referenceUrl('item', 'core')).toBe('https://sewef.github.io/ptu/ptucore/items.html');
    expect(referenceUrl('feature', 'community')).toBe('https://sewef.github.io/ptu/ptucommunity/features.html');
    expect(referenceUrl('ability', 'homebrew')).toBe('https://sewef.github.io/ptu/ptuhomebrew/abilities.html');
    expect(referenceUrl('keyword', 'unknown')).toBe('https://sewef.github.io/ptu/ptucore/moves.html#keywords');
  });

  it('adds the referenced name as an encoded search query before any fragment', () => {
    expect(referenceUrl('item', 'core', 'Super Potion')).toBe(
      'https://sewef.github.io/ptu/ptucore/items.html?search=Super%20Potion'
    );
    expect(referenceUrl('keyword', 'core', 'Blessed & Cursed')).toBe(
      'https://sewef.github.io/ptu/ptucore/moves.html?search=Blessed%20%26%20Cursed#keywords'
    );
  });
});
