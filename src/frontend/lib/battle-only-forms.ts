import type { BattleOnlyForm, Pokemon } from './types';
import { calculateHp, STAT_KEYS } from './pokemon';
import { ensureStruggle } from './moves';

function applyStatModifiers(pokemon: Pokemon, form: BattleOnlyForm, direction: 1 | -1) {
  for (const stat of STAT_KEYS) {
    const change = (Number(form.stats?.[stat]) || 0) * direction;
    if (!change) continue;
    pokemon.statBonuses[stat] = (Number(pokemon.statBonuses[stat]) || 0) + change;
    pokemon.stats[stat] = (Number(pokemon.stats[stat]) || 0) + change;
  }
}

function removeFormAbility(pokemon: Pokemon, formName: string) {
  pokemon.abilities = (pokemon.abilities || []).filter(ability => ability._battleOnlyForm !== formName);
}

function addFormAbility(pokemon: Pokemon, form: BattleOnlyForm) {
  const ability = form.ability;
  const name = String(ability?.name || '').trim();
  if (!name || (pokemon.abilities || []).some(item => String(item.name).toLowerCase() === name.toLowerCase())) return;
  pokemon.abilities!.push({ ...ability, usageCount: 0, _battleOnlyForm: form.name });
}

export function setBattleOnlyForm(pokemon: Pokemon, requestedName: string | null): boolean {
  const forms = pokemon.battleOnlyForms || [];
  const current = forms.find(form => form.name === pokemon.activeBattleOnlyForm);
  if (current) {
    applyStatModifiers(pokemon, current, -1);
    removeFormAbility(pokemon, current.name);
  }

  pokemon.activeBattleOnlyForm = undefined;
  pokemon.activeBattleOnlyFormIcon = undefined;

  const next = requestedName && requestedName !== current?.name
    ? forms.find(form => form.name === requestedName)
    : undefined;
  if (next) {
    applyStatModifiers(pokemon, next, 1);
    addFormAbility(pokemon, next);
    pokemon.activeBattleOnlyForm = next.name;
    pokemon.activeBattleOnlyFormIcon = next.icon;
  }

  pokemon.hitPointsMax = calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
  pokemon.hitPoints = Math.min(Number(pokemon.hitPoints), pokemon.hitPointsMax);
  ensureStruggle(pokemon);
  return Boolean(next);
}
