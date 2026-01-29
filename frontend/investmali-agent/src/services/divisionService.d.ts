// Déclarations TypeScript pour divisionService.js côté AGENT
declare const divisionService: {
  // API INSTAT MALI
  getRegions: () => Promise<any>;
  getCerclesByRegion: (regionCode: any) => Promise<any>;
  getCommunesByCercle: (cercleCode: any) => Promise<any>;
  getQuartiersByCommune: (communeCode: any) => Promise<any>;
  
  // Compatibilité
  getByParent: (parentId: any) => Promise<any>;
  getByType: (type: any) => Promise<any>;
  getByParentAndType: (parentId: any, type: any) => Promise<any>;
  getById: (divisionId: any) => Promise<any>;
  getByCode: (divisionCode: any) => Promise<any>;
  
  // Mapping Bamako
  getArrondissementsByRegion: (regionCode: any) => Promise<any>;
  getArrondissementsByCercle: (cercleCode: any) => Promise<any>;
  getCommunesByArrondissement: (arrondissementCode: any) => Promise<any>;
  getQuartiersByArrondissement: (arrondissementCode: any) => Promise<any>;
  getQuartiersByArrondissementCode: (arrondissementCode: any) => Promise<any>;
  
  // Cache
  _cache: any;
  _loadBamakoCache: () => Promise<any>;
  _loadMainRegionsCache: () => Promise<any>;
  
  // Recherche
  searchDivisions: (query: any, type?: any) => Promise<any>;
  
  // Méthodes de compatibilité
  searchBamakoDivisions: () => Promise<any>;
  getAllArrondissements: () => Promise<any>;
  getAllQuartiers: () => Promise<any>;
  getChildrenByRegion?: (regionCode: any) => Promise<any>;
  
  // Test
  testInstatConnection?: () => Promise<any>;
  getCount?: () => Promise<any>;
};

export default divisionService;
export { divisionService };
