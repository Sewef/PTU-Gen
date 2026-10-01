import { describe, expect, it } from 'vitest';
import { integrationActive, integrationLabel, OWLBEAR_INTEGRATIONS } from './owlbear-integrations';

describe('Owlbear integration catalog', () => {
  it('keeps configuration labels and badges on the same source of truth', () => {
    expect(integrationLabel('trackers', 'owltrackers')).toBe('Owl Trackers');
    expect(integrationLabel('initiative', 'prettysordid')).toBe('Pretty Sordid');
    expect(integrationLabel('diceRoller', 'justdices')).toBe('Just Dices');
    expect(OWLBEAR_INTEGRATIONS.diceRoller.options[1].label).toBe(integrationLabel('diceRoller', 'justdices'));
  });

  it('keeps empty integrations generic and inactive', () => {
    expect(integrationLabel('diceRoller', 'none')).toBe('Dice Roller');
    expect(integrationActive('none')).toBe(false);
    expect(integrationActive('justdices')).toBe(true);
  });
});
