import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve('public/export-owlbear.js'), 'utf8');
const helpers = new Function(`${source}\nreturn { buildOwlbearItem, computeOwlbearBounds };`)() as {
  buildOwlbearItem: (pokemon: any, position?: { x: number; y: number }, imageMetadata?: { width: number; height: number; mime: string }) => { item: any };
  computeOwlbearBounds: (items: Record<string, any>) => { min: { x: number; y: number }; max: { x: number; y: number } };
};
const { buildOwlbearItem, computeOwlbearBounds } = helpers;

describe('Owlbear token export', () => {
  it('keeps configured tracker and initiative metadata on inserted tokens', () => {
    const { item } = buildOwlbearItem({
      id: 25, name: 'Pikachu', shiny: true, level: 12, stats: { HP: 5, spe: 8 }, hitPoints: 20, hitPointsMax: 37, tempHitPoints: 7,
      otherInfo: { sizeCategory: 'Small' },
      captureState: { standardCounts: { injuries: 3 } },
      owlbear: { visible: true, playerId: 'player-1', trackers: 'owltrackers', initiative: 'prettysordid', diceRoller: 'justdices' }
    });

    expect(item.createdUserId).toBe('player-1');
    expect(item.name).toBe('✨ Pikachu');
    expect(item.text.plainText).toBe('✨ Pikachu');
    expect(item.metadata['com.owl-trackers/trackers']).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'HP', value: 20, max: 37 }),
      expect.objectContaining({ name: 'Injuries', value: 3 }),
      expect.objectContaining({ name: 'Temp HP', variant: 'value', color: 3, value: 7 })
    ]));
    expect(item.metadata['com.pretty-initiative/metadata']).toMatchObject({ count: '8', active: false });
  });

  it('uses the active Battle-Only Form sprite', () => {
    const { item } = buildOwlbearItem({
      id: 448, name: 'Lucario', activeBattleOnlyFormIcon: '448-mega', level: 50,
      stats: { HP: 16, spe: 18 }, otherInfo: {}, owlbear: {}
    });
    expect(item.image.url).toContain('/448-mega.png');
  });

  it('uses a custom species image', () => {
    const { item } = buildOwlbearItem({
      id: 900000, name: 'Warrior', image: 'https://example.com/warrior.jpeg', level: 10,
      stats: { HP: 8, spe: 9 }, otherInfo: {}, owlbear: {}
    }, undefined, { width: 1200, height: 800, mime: 'image/jpeg' });
    expect(item.image).toEqual({
      url: 'https://example.com/warrior.jpeg', width: 1200, height: 800, mime: 'image/jpeg'
    });
    expect(item.grid).toEqual({ dpi: 1200, offset: { x: 600, y: 400 } });
  });

  it('computes bounds from image dimensions and token scale', () => {
    const { item } = buildOwlbearItem({
      id: 900000, name: 'Warrior', level: 10, stats: {}, otherInfo: { sizeCategory: 'Large' }, owlbear: {}
    }, { x: 100, y: 200 }, { width: 300, height: 180, mime: 'image/png' });

    expect(computeOwlbearBounds({ token: item })).toEqual({
      min: { x: -200, y: 20 },
      max: { x: 400, y: 380 }
    });
  });
});
