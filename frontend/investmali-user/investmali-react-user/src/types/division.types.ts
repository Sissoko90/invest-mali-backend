<<<<<<< HEAD
// Types pour les divisions administratives - API INSTAT Mali
// Compatible avec l'ancien système et la nouvelle structure INSTAT

export interface Division {
  id: string;
  code: string;
  nom: string;
  libelle?: string;
  type: 'REGION' | 'CERCLE' | 'COMMUNE' | 'QUARTIER' | 'ARRONDISSEMENT' | 'UNKNOWN';
  parent?: Division | null;
  parentId?: string;
  parentCode?: string;
  parentNom?: string;
  
  // Hiérarchie complète (optionnel)
  regionId?: string;
  regionCode?: string;
  regionNom?: string;
  cercleId?: string;
  cercleCode?: string;
  cercleNom?: string;
  communeId?: string;
  communeCode?: string;
  communeNom?: string;
  
  // Métadonnées
  displayName?: string;
  divisionType?: string;
}

export interface DivisionService {
  // ===== API INSTAT MALI - NOUVELLE STRUCTURE =====
  getRegions(): Promise<Division[]>;
  getCerclesByRegion(regionCode: string): Promise<Division[]>;
  getCommunesByCercle(cercleCode: string): Promise<Division[]>;
  getQuartiersByCommune(communeCode: string): Promise<Division[]>;

  // ===== COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME =====
  getById(divisionId: string): Promise<Division>;
  getByCode(divisionCode: string): Promise<Division>;
  getByParent(parentId: string): Promise<Division[]>;
  getByType(type: string): Promise<Division[]>;
  getByParentAndType(parentId: string, type: string): Promise<Division[]>;

  // ===== MAPPING POUR BAMAKO ET COMPATIBILITÉ =====
  getArrondissementsByRegion(regionCode: string): Promise<Division[]>;
  getArrondissementsByCercle(cercleCode: string): Promise<Division[]>;
  getCommunesByArrondissement(arrondissementCode: string): Promise<Division[]>;
  getQuartiersByArrondissement(arrondissementCode: string): Promise<Division[]>;

  // ===== MÉTHODES OBSOLÈTES (POUR COMPATIBILITÉ TEMPORAIRE) =====
  getQuartiersByArrondissementCode(arrondissementCode: string): Promise<Division[]>;
  searchBamakoDivisions(): Promise<Division[]>;
  getAllArrondissements(): Promise<Division[]>;
  getAllQuartiers(): Promise<Division[]>;
  getChildrenByRegion(regionCode: string): Promise<Division[]>;

  // ===== MÉTHODES DE DEBUG ET RECHERCHE =====
  searchDivisions(query: string, type?: string | null): Promise<Division[]>;

  // ===== MÉTHODES DE TEST =====
  testInstatConnection(): Promise<string>;
  getCount(): Promise<number>;
}

// Types pour les réponses API INSTAT Mali
export interface InstatRegion {
  code_region: string;
  nom_region: string;
}

export interface InstatCercle {
  code: string;
  nom: string;
}

export interface InstatCommune {
  code: string;
  nom: string;
}

export interface InstatQuartier {
  code: string;
  nom: string;
}

// Types pour la compatibilité avec l'ancien système
export interface LegacyDivision {
  id: string;
  code: string;
  nom: string;
  libelle?: string;
  type: string;
  parent?: LegacyDivision | null;
  divisionType?: string;
}

// Utilitaires de conversion
export const convertInstatToLegacy = {
  region: (instat: InstatRegion): Division => ({
    id: instat.code_region,
    code: instat.code_region,
    nom: instat.nom_region,
    libelle: instat.nom_region,
    type: 'REGION',
    parent: null
  }),
  
  cercle: (instat: InstatCercle, regionCode: string): Division => ({
    id: instat.code,
    code: instat.code,
    nom: instat.nom,
    libelle: instat.nom,
    type: 'CERCLE',
    parentCode: regionCode,
    parent: null
  }),
  
  commune: (instat: InstatCommune, cercleCode: string): Division => ({
    id: instat.code,
    code: instat.code,
    nom: instat.nom,
    libelle: instat.nom,
    type: 'COMMUNE',
    parentCode: cercleCode,
    parent: null
  }),
  
  quartier: (instat: InstatQuartier, communeCode: string): Division => ({
    id: instat.code,
    code: instat.code,
    nom: instat.nom,
    libelle: instat.nom,
    type: 'QUARTIER',
    parentCode: communeCode,
    parent: null
  })
};

export default Division;
=======
// Types pour les divisions administratives - API INSTAT Mali
// Compatible avec l'ancien système et la nouvelle structure INSTAT

export interface Division {
  id: string;
  code: string;
  nom: string;
  libelle?: string;
  type: 'REGION' | 'CERCLE' | 'COMMUNE' | 'QUARTIER' | 'ARRONDISSEMENT' | 'UNKNOWN';
  parent?: Division | null;
  parentId?: string;
  parentCode?: string;
  parentNom?: string;
  
  // Hiérarchie complète (optionnel)
  regionId?: string;
  regionCode?: string;
  regionNom?: string;
  cercleId?: string;
  cercleCode?: string;
  cercleNom?: string;
  communeId?: string;
  communeCode?: string;
  communeNom?: string;
  
  // Métadonnées
  displayName?: string;
  divisionType?: string;
}

export interface DivisionService {
  // ===== API INSTAT MALI - NOUVELLE STRUCTURE =====
  getRegions(): Promise<Division[]>;
  getCerclesByRegion(regionCode: string): Promise<Division[]>;
  getCommunesByCercle(cercleCode: string): Promise<Division[]>;
  getQuartiersByCommune(communeCode: string): Promise<Division[]>;

  // ===== COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME =====
  getById(divisionId: string): Promise<Division>;
  getByCode(divisionCode: string): Promise<Division>;
  getByParent(parentId: string): Promise<Division[]>;
  getByType(type: string): Promise<Division[]>;
  getByParentAndType(parentId: string, type: string): Promise<Division[]>;

  // ===== MAPPING POUR BAMAKO ET COMPATIBILITÉ =====
  getArrondissementsByRegion(regionCode: string): Promise<Division[]>;
  getArrondissementsByCercle(cercleCode: string): Promise<Division[]>;
  getCommunesByArrondissement(arrondissementCode: string): Promise<Division[]>;
  getQuartiersByArrondissement(arrondissementCode: string): Promise<Division[]>;

  // ===== MÉTHODES OBSOLÈTES (POUR COMPATIBILITÉ TEMPORAIRE) =====
  getQuartiersByArrondissementCode(arrondissementCode: string): Promise<Division[]>;
  searchBamakoDivisions(): Promise<Division[]>;
  getAllArrondissements(): Promise<Division[]>;
  getAllQuartiers(): Promise<Division[]>;
  getChildrenByRegion(regionCode: string): Promise<Division[]>;

  // ===== MÉTHODES DE DEBUG ET RECHERCHE =====
  searchDivisions(query: string, type?: string | null): Promise<Division[]>;

  // ===== MÉTHODES DE TEST =====
  testInstatConnection(): Promise<string>;
  getCount(): Promise<number>;
}

// Types pour les réponses API INSTAT Mali
export interface InstatRegion {
  code_region: string;
  nom_region: string;
}

export interface InstatCercle {
  code: string;
  nom: string;
}

export interface InstatCommune {
  code: string;
  nom: string;
}

export interface InstatQuartier {
  code: string;
  nom: string;
}

// Types pour la compatibilité avec l'ancien système
export interface LegacyDivision {
  id: string;
  code: string;
  nom: string;
  libelle?: string;
  type: string;
  parent?: LegacyDivision | null;
  divisionType?: string;
}

// Utilitaires de conversion
export const convertInstatToLegacy = {
  region: (instat: InstatRegion): Division => ({
    id: instat.code_region,
    code: instat.code_region,
    nom: instat.nom_region,
    libelle: instat.nom_region,
    type: 'REGION',
    parent: null
  }),
  
  cercle: (instat: InstatCercle, regionCode: string): Division => ({
    id: instat.code,
    code: instat.code,
    nom: instat.nom,
    libelle: instat.nom,
    type: 'CERCLE',
    parentCode: regionCode,
    parent: null
  }),
  
  commune: (instat: InstatCommune, cercleCode: string): Division => ({
    id: instat.code,
    code: instat.code,
    nom: instat.nom,
    libelle: instat.nom,
    type: 'COMMUNE',
    parentCode: cercleCode,
    parent: null
  }),
  
  quartier: (instat: InstatQuartier, communeCode: string): Division => ({
    id: instat.code,
    code: instat.code,
    nom: instat.nom,
    libelle: instat.nom,
    type: 'QUARTIER',
    parentCode: communeCode,
    parent: null
  })
};

export default Division;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
