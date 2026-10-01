import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type BuildOwlbearItem = (pokemon: any) => { item: any };
const source = readFileSync(resolve('public/export-owlbear.js'), 'utf8');
const buildOwlbearItem = new Function(`${source}\nreturn buildOwlbearItem;`)() as BuildOwlbearItem;

describe('Owlbear token export', () => {
  it('keeps configured tracker and initiative metadata on inserted tokens', () => {
    const { item } = buildOwlbearItem({
      id: 25, name: 'Pikachu', level: 12, stats: { HP: 5, spe: 8 }, hitPoints: 20, hitPointsMax: 37,
      otherInfo: { sizeCategory: 'Small' },
      owlbear: { visible: true, playerId: 'player-1', trackers: 'owltrackers', initiative: 'prettysordid', diceRoller: 'justdices' }
    });

    expect(item.createdUserId).toBe('player-1');
    expect(item.metadata['com.owl-trackers/trackers']).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'HP', value: 20, max: 37 }),
      expect.objectContaining({ name: 'Injuries', value: 0 })
    ]));
    expect(item.metadata['com.pretty-initiative/metadata']).toMatchObject({ count: '8', active: false });
  });
});
