// Frontend enums aligned with backend enums
// Backend: com.investmali.investMali.model.entreprise.{Sexe, TypePersonne, Nationalite}

export const Sexe = {
  MASCULIN: 'MASCULIN',
  FEMININ: 'FEMININ',
} as const;
export type Sexe = typeof Sexe[keyof typeof Sexe];

export const TypePersonne = {
  SOI: 'SOI',
  RESPONSABLE: 'RESPONSABLE',
  ASSOCIE: 'ASSOCIE',
} as const;
export type TypePersonne = typeof TypePersonne[keyof typeof TypePersonne];

// Nationalité list is long in backend; expose a small curated subset for the UI dropdown.
// You can extend as needed, values must match backend identifiers exactly.
export const Nationalites = [
  'Malienne',
  'Française',
  'Ivoirienne',
  'Sénégalaise',
  'Burkinabè',
  'Guinéenne',
  'Nigérienne',
  'Marocaine',
  'Algérienne',
  'Tunisienne',
] as const;
export type Nationalite = typeof Nationalites[number];
