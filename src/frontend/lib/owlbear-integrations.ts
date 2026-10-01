export type OwlbearIntegrationKind = 'trackers' | 'initiative' | 'diceRoller';

export interface OwlbearIntegrationOption {
  value: string;
  label: string;
}

export const OWLBEAR_INTEGRATIONS: Record<OwlbearIntegrationKind, {
  label: string;
  emptyLabel: string;
  options: OwlbearIntegrationOption[];
}> = {
  trackers: {
    label: 'Trackers',
    emptyLabel: 'Trackers',
    options: [{ value: 'none', label: 'None' }, { value: 'owltrackers', label: 'Owl Trackers' }]
  },
  initiative: {
    label: 'Initiative',
    emptyLabel: 'Initiative',
    options: [{ value: 'none', label: 'None' }, { value: 'prettysordid', label: 'Pretty Sordid' }]
  },
  diceRoller: {
    label: 'Dice roller',
    emptyLabel: 'Dice Roller',
    options: [{ value: 'none', label: 'None' }, { value: 'justdices', label: 'Just Dices' }]
  }
};

export function integrationActive(value: unknown): boolean {
  return Boolean(value) && String(value).toLowerCase() !== 'none';
}

export function integrationLabel(kind: OwlbearIntegrationKind, value: unknown): string {
  const config = OWLBEAR_INTEGRATIONS[kind];
  const key = String(value || 'none').toLowerCase();
  if (key === 'none') return config.emptyLabel;
  return config.options.find(option => option.value === key)?.label
    || String(value).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}
