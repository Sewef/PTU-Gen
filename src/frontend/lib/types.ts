export type JsonRecord = Record<string, any>;

export interface OwlbearSettings extends JsonRecord {
  visible: boolean;
  playerId: string;
  trackers: string;
  initiative: string;
  diceRoller: string;
  tokenId?: string;
}

export interface BattleOnlyForm extends JsonRecord {
  name: string;
  icon: string;
  types: string[];
  stats: Partial<Record<'HP' | 'atk' | 'def' | 'spA' | 'spD' | 'spe', number>>;
  ability?: JsonRecord | null;
}

export interface Pokemon extends JsonRecord {
  id: number | string;
  Icon?: number | string;
  name: string;
  nickname?: string;
  level: number;
  dataset?: string;
  _fandex?: string;
  fandex?: string[];
  shiny?: boolean;
  legendary?: boolean;
  types: string[] | { isFormeVariant: true; selectedForme: string; formes: Record<string, string[]> };
  actualTypes?: string[];
  stats: Record<string, number>;
  statBonuses: Record<'HP' | 'atk' | 'def' | 'spA' | 'spD' | 'spe', number>;
  combatStages: Record<'atk' | 'def' | 'spA' | 'spD' | 'spe', number>;
  baseStats?: Record<string, number>;
  baseWithNature?: Record<string, number>;
  distributedPoints?: Record<string, number>;
  ignoreBaseRelation?: string;
  nature?: JsonRecord | string;
  skills?: Record<string, string>;
  capabilities?: string[];
  battleOnlyForms?: BattleOnlyForm[];
  activeBattleOnlyForm?: string;
  activeBattleOnlyFormIcon?: string;
  abilities?: JsonRecord[];
  moves?: JsonRecord[];
  pokeEdges?: JsonRecord[];
  otherInfo?: JsonRecord;
  hitPoints?: number;
  hitPointsMax?: number;
  hpFormula?: string;
  tutorPoints?: number;
  typeEffectivenessOverrides?: Record<string, number>;
  owlbear: OwlbearSettings;
}

export interface HistoryEntry {
  id: string;
  name: string;
  nickname: string;
  level: number;
  icon: string;
  updatedAt: string;
}

export interface GeneratorSettings {
  dataset: string;
  fandex: string[];
  countMode: 'fixed' | 'range';
  count: number;
  minCount: number;
  maxCount: number;
  levelMode: 'fixed' | 'range';
  level: number;
  minLevel: number;
  maxLevel: number;
  species: string;
  randomForm: boolean;
  habitat: string;
  type: string;
  shinyMode: 'force' | 'odds';
  shinyOdds: number;
  includeLegendaries: boolean;
  forceEvolution: boolean;
  distribution: 'RANDOM' | 'BALANCED' | 'MINMAXED';
  natureMode: 'random' | 'optimal' | 'fixed';
  nature: string;
  ignoreBaseRelation: string;
  hpFormula: string;
  owlbearVisible: boolean;
  owlbearPlayerId: string;
  owlbearTrackers: string;
  owlbearInitiative: string;
  owlbearDiceRoller: string;
}
