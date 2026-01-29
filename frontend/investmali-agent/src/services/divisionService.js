// Service for DivisionMali endpoints (Spring Boot) - VERSION OPTIMISÉE AGENT
// Backend base for divisions is /api/v1/divisions (with /v1)
// Avec cache intelligent et recherche exhaustive

import { API_CONFIG, getHeaders } from '../config/api.config';

const rawRequest = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;
  const config = {
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
    ...options,
  };
  const res = await fetch(url, config);
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch (_) {}
    const err = { status: res.status, message: (data && (data.message || data.error)) || 'Erreur API', data };
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    throw err;
  }
  return res.json();
};

export const divisionService = {
  // ===== API INSTAT MALI - NOUVELLE STRUCTURE =====
  
  // GET /divisions/regions - Récupérer toutes les régions du Mali
  getRegions: async () => rawRequest('/divisions/regions'),

  // GET /divisions/regions/{regionCode}/cercles - Récupérer les cercles d'une région
  getCerclesByRegion: async (regionCode) => rawRequest(`/divisions/regions/${regionCode}/cercles`),
  
  // GET /divisions/cercles/{cercleCode}/communes - Récupérer les communes d'un cercle
  getCommunesByCercle: async (cercleCode) => rawRequest(`/divisions/cercles/${cercleCode}/communes`),
  
  // GET /divisions/communes/{communeCode}/quartiers - Récupérer les quartiers d'une commune
  getQuartiersByCommune: async (communeCode) => rawRequest(`/divisions/communes/${communeCode}/quartiers`),

  // ===== COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME =====
  
  // Alias pour compatibilité - mapping vers la nouvelle structure
  getByParent: async (parentId) => {
    console.warn('⚠️ getByParent est obsolète - utilisez les méthodes spécifiques');
    return [];
  },

  getByType: async (type) => {
    console.warn('⚠️ getByType est obsolète - utilisez getRegions()');
    if (type === 'REGION') return await rawRequest('/divisions/regions');
    return [];
  },

  getByParentAndType: async (parentId, type) => {
    console.warn('⚠️ getByParentAndType est obsolète - utilisez les méthodes spécifiques');
    return [];
  },

  getById: async (divisionId) => {
    console.warn('⚠️ getById est obsolète dans la nouvelle structure INSTAT');
    // Retourner un objet vide pour maintenir la compatibilité TypeScript
    return {
      id: divisionId,
      code: '',
      nom: '',
      libelle: '',
      type: 'UNKNOWN',
      parent: null
    };
  },

  getByCode: async (divisionCode) => {
    console.warn('⚠️ getByCode est obsolète dans la nouvelle structure INSTAT');
    // Retourner un objet vide pour maintenir la compatibilité TypeScript
    return {
      id: '',
      code: divisionCode,
      nom: '',
      libelle: '',
      type: 'UNKNOWN',
      parent: null
    };
  },

  // ===== MAPPING POUR BAMAKO ET COMPATIBILITÉ =====
  
  // Bamako utilise maintenant la structure INSTAT standard
  // Région Bamako (code: 90) -> Cercles -> Communes -> Quartiers
  
  // Mapping pour compatibilité avec l'ancien système
  getArrondissementsByRegion: async (regionCode) => {
    // Dans la nouvelle structure INSTAT, les "arrondissements" sont des "cercles"
    try {
      const cercles = await rawRequest(`/divisions/regions/${regionCode}/cercles`);
      // Transformer les cercles en format "arrondissement" pour compatibilité
      return cercles.map(cercle => ({
        ...cercle,
        type: 'ARRONDISSEMENT' // Alias pour compatibilité
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des cercles (arrondissements):', error);
      return [];
    }
  },

  // NOUVELLE STRUCTURE INSTAT : Cercle → Commune directement
  getCommunesByCercle: async (cercleCode) => {
    try {
      const communes = await rawRequest(`/divisions/cercles/${cercleCode}/communes`);
      return communes || [];
    } catch (error) {
      console.error('Erreur lors du chargement des communes:', error);
      return [];
    }
  },

  // OBSOLÈTE : Mapping pour compatibilité temporaire
  getArrondissementsByCercle: async (cercleCode) => {
    console.warn('⚠️ getArrondissementsByCercle est obsolète - utilisez getCommunesByCercle()');
    return await divisionService.getCommunesByCercle(cercleCode);
  },

  getCommunesByArrondissement: async (arrondissementCode) => {
    console.warn('⚠️ getCommunesByArrondissement est obsolète - utilisez getQuartiersByCommune()');
    return await divisionService.getQuartiersByCommune(arrondissementCode);
  },
  
  getQuartiersByArrondissement: async (arrondissementCode) => {
    // Dans la nouvelle structure INSTAT, les "arrondissements" sont des communes
    try {
      const quartiers = await rawRequest(`/divisions/communes/${arrondissementCode}/quartiers`);
      return quartiers || [];
    } catch (error) {
      console.error('Erreur lors du chargement des quartiers par commune:', error);
      return [];
    }
  },
  
  // ===== MÉTHODES OBSOLÈTES (POUR COMPATIBILITÉ TEMPORAIRE) =====
  
  getQuartiersByArrondissementCode: async (arrondissementCode) => {
    console.warn('⚠️ getQuartiersByArrondissementCode est obsolète - utilisez getQuartiersByCommune()');
    return await divisionService.getQuartiersByCommune(arrondissementCode);
  },
  
  // ===== CACHE POUR OPTIMISER LES PERFORMANCES =====
  _cache: {
    regions: null,
    bamakoData: null,
    mainRegionsData: null, // Cache pour toutes les régions
    lastUpdate: null,
    mainRegionsLastUpdate: null
  },

  // Cache des données Bamako (zone la plus recherchée)
  _loadBamakoCache: async () => {
    if (divisionService._cache.bamakoData && 
        divisionService._cache.lastUpdate && 
        Date.now() - divisionService._cache.lastUpdate < 300000) { // 5 minutes
      return divisionService._cache.bamakoData;
    }

    try {
      const regions = await divisionService.getRegions();
      const bamako = regions.find(r => r.nom && r.nom.toLowerCase().includes('bamako'));
      
      if (bamako) {
        const cercles = await divisionService.getCerclesByRegion(bamako.code);
        const bamakoData = { region: bamako, cercles: [], communes: [], quartiers: [] };
        
        // Charger TOUS les cercles de Bamako pour une couverture complète
        for (let i = 0; i < cercles.length; i++) {
          const cercle = cercles[i];
          bamakoData.cercles.push(cercle);
          
          try {
            const communes = await divisionService.getCommunesByCercle(cercle.code);
            for (const commune of communes) {
              bamakoData.communes.push({ ...commune, parentCercle: cercle });
              
              // Charger TOUS les quartiers par commune
              try {
                const quartiers = await divisionService.getQuartiersByCommune(commune.code);
                for (const quartier of quartiers) {
                  bamakoData.quartiers.push({ 
                    ...quartier, 
                    parentCommune: commune,
                    parentCercle: cercle,
                    parentRegion: bamako
                  });
                }
              } catch (error) {
                console.warn('⚠️ Erreur quartiers pour commune', commune.nom);
              }
            }
          } catch (error) {
            console.warn('⚠️ Erreur communes pour cercle', cercle.nom);
          }
        }
        
        divisionService._cache.bamakoData = bamakoData;
        divisionService._cache.lastUpdate = Date.now();
        return bamakoData;
      }
    } catch (error) {
      console.error('❌ Erreur chargement cache Bamako:', error);
    }
    return null;
  },

  // Cache des données de TOUTES les régions du Mali (sauf Bamako qui a son propre cache)
  _loadMainRegionsCache: async () => {
    if (divisionService._cache.mainRegionsData && 
        divisionService._cache.mainRegionsLastUpdate && 
        Date.now() - divisionService._cache.mainRegionsLastUpdate < 600000) { // 10 minutes
      return divisionService._cache.mainRegionsData;
    }

    try {
      const regions = await divisionService.getRegions();
      
      // Charger TOUTES les régions (sauf Bamako qui a son propre cache)
      const mainRegions = regions.filter(r => 
        r.nom && !r.nom.toLowerCase().includes('bamako')
      );
      
      const mainRegionsData = { regions: [], cercles: [], communes: [], quartiers: [] };
      
      for (const region of mainRegions) {
        mainRegionsData.regions.push(region);
        
        try {
          const cercles = await divisionService.getCerclesByRegion(region.code);
          
          // Charger les 2 premiers cercles par région pour une meilleure couverture
          for (let i = 0; i < Math.min(2, cercles.length); i++) {
            const cercle = cercles[i];
            mainRegionsData.cercles.push({ ...cercle, parentRegion: region });
            
            try {
              const communes = await divisionService.getCommunesByCercle(cercle.code);
              
              // Charger les 5 premières communes par cercle pour une meilleure couverture
              for (let j = 0; j < Math.min(5, communes.length); j++) {
                const commune = communes[j];
                mainRegionsData.communes.push({ 
                  ...commune, 
                  parentCercle: cercle,
                  parentRegion: region
                });
                
                // Charger quelques quartiers par commune
                try {
                  const quartiers = await divisionService.getQuartiersByCommune(commune.code);
                  
                  // Charger les 5 premiers quartiers par commune pour une meilleure couverture
                  for (let k = 0; k < Math.min(5, quartiers.length); k++) {
                    const quartier = quartiers[k];
                    mainRegionsData.quartiers.push({
                      ...quartier,
                      parentCommune: commune,
                      parentCercle: cercle,
                      parentRegion: region
                    });
                  }
                } catch (error) {
                  console.warn('⚠️ Erreur quartiers pour commune', commune.nom);
                }
              }
            } catch (error) {
              console.warn('⚠️ Erreur communes pour cercle', cercle.nom);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur cercles pour région', region.nom);
        }
      }
      
      divisionService._cache.mainRegionsData = mainRegionsData;
      divisionService._cache.mainRegionsLastUpdate = Date.now();
      return mainRegionsData;
      
    } catch (error) {
      console.error('❌ Erreur chargement cache régions principales:', error);
    }
    return null;
  },

  // ===== MÉTHODES DE DEBUG ET RECHERCHE =====
  
  searchDivisions: async (query, type = null) => {
    
    if (!query || query.length < 2) {
      return [];
    }
    
    try {
      const results = [];
      const searchTerm = query.toLowerCase().trim();
      
        
      // 1. Recherche rapide dans le cache Bamako (zone la plus recherchée)
      if (searchTerm.length >= 3) {
        const bamakoData = await divisionService._loadBamakoCache();
        
        if (bamakoData) {
          // Recherche dans les quartiers de Bamako (cache)
          for (const quartier of bamakoData.quartiers) {
            if (quartier.nom && quartier.nom.toLowerCase().includes(searchTerm)) {
              results.push({
                id: quartier.id,
                nom: quartier.nom,
                code: quartier.code,
                divisionType: 'QUARTIER',
                parent: {
                  id: quartier.parentCommune.id,
                  nom: quartier.parentCommune.nom,
                  code: quartier.parentCommune.code,
                  divisionType: 'COMMUNE',
                  parent: {
                    id: quartier.parentCercle.id,
                    nom: quartier.parentCercle.nom,
                    code: quartier.parentCercle.code,
                    divisionType: 'CERCLE',
                    parent: {
                      id: quartier.parentRegion.id,
                      nom: quartier.parentRegion.nom,
                      code: quartier.parentRegion.code,
                      divisionType: 'REGION'
                    }
                  }
                }
              });
            }
          }
          
          // Si on a trouvé des quartiers, on s'arrête là (très rapide)
          if (results.length > 0) {
            return results.slice(0, 10);
          }
          
          // Recherche dans les communes de Bamako (cache)
          for (const commune of bamakoData.communes) {
            if (commune.nom && commune.nom.toLowerCase().includes(searchTerm)) {
              results.push({
                id: commune.id,
                nom: commune.nom,
                code: commune.code,
                divisionType: 'COMMUNE',
                parent: {
                  id: commune.parentCercle.id,
                  nom: commune.parentCercle.nom,
                  code: commune.parentCercle.code,
                  divisionType: 'CERCLE',
                  parent: {
                    id: bamakoData.region.id,
                    nom: bamakoData.region.nom,
                    code: bamakoData.region.code,
                    divisionType: 'REGION'
                  }
                }
              });
            }
          }
          
          if (results.length > 0) {
            console.log(`⚡ [CACHE AGENT] Trouvé ${results.length} communes dans le cache Bamako`);
            return results.slice(0, 10);
          }
        }
      }
      
      // 2. Recherche dans le cache des régions principales
      if (searchTerm.length >= 3) {
        const mainRegionsData = await divisionService._loadMainRegionsCache();
        
        if (mainRegionsData) {
          // Recherche dans les quartiers des régions principales (cache) - PRIORITÉ
          for (const quartier of mainRegionsData.quartiers) {
            if (quartier.nom && quartier.nom.toLowerCase().includes(searchTerm)) {
              results.push({
                id: quartier.id,
                nom: quartier.nom,
                code: quartier.code,
                divisionType: 'QUARTIER',
                parent: {
                  id: quartier.parentCommune.id,
                  nom: quartier.parentCommune.nom,
                  code: quartier.parentCommune.code,
                  divisionType: 'COMMUNE',
                  parent: {
                    id: quartier.parentCercle.id,
                    nom: quartier.parentCercle.nom,
                    code: quartier.parentCercle.code,
                    divisionType: 'CERCLE',
                    parent: {
                      id: quartier.parentRegion.id,
                      nom: quartier.parentRegion.nom,
                      code: quartier.parentRegion.code,
                      divisionType: 'REGION'
                    }
                  }
                }
              });
            }
          }
          
          if (results.length > 0) {
            console.log(`⚡ [CACHE AGENT] Trouvé ${results.length} quartiers dans le cache régions principales`);
            return results.slice(0, 10);
          }
          
          // Recherche dans les communes des régions principales (cache)
          for (const commune of mainRegionsData.communes) {
            if (commune.nom && commune.nom.toLowerCase().includes(searchTerm)) {
              results.push({
                id: commune.id,
                nom: commune.nom,
                code: commune.code,
                divisionType: 'COMMUNE',
                parent: {
                  id: commune.parentCercle.id,
                  nom: commune.parentCercle.nom,
                  code: commune.parentCercle.code,
                  divisionType: 'CERCLE',
                  parent: {
                    id: commune.parentRegion.id,
                    nom: commune.parentRegion.nom,
                    code: commune.parentRegion.code,
                    divisionType: 'REGION'
                  }
                }
              });
            }
          }
          
          if (results.length > 0) {
            console.log(`⚡ [CACHE AGENT] Trouvé ${results.length} communes dans le cache régions principales`);
            return results.slice(0, 10);
          }
          
          // Recherche dans les cercles des régions principales (cache)
          for (const cercle of mainRegionsData.cercles) {
            if (cercle.nom && cercle.nom.toLowerCase().includes(searchTerm)) {
              results.push({
                id: cercle.id,
                nom: cercle.nom,
                code: cercle.code,
                divisionType: 'CERCLE',
                parent: {
                  id: cercle.parentRegion.id,
                  nom: cercle.parentRegion.nom,
                  code: cercle.parentRegion.code,
                  divisionType: 'REGION'
                }
              });
            }
          }
          
          if (results.length > 0) {
            console.log(`⚡ [CACHE AGENT] Trouvé ${results.length} cercles dans le cache régions principales`);
            return results.slice(0, 10);
          }
        }
      }
      
      // 3. Si pas trouvé dans les caches, recherche rapide dans les régions
      console.log('🔍 [FALLBACK AGENT] Recherche dans les régions');
      const regions = await divisionService.getRegions();
      
      for (const region of regions) {
        if (region.nom && region.nom.toLowerCase().includes(searchTerm)) {
          results.push({
            id: region.id,
            nom: region.nom,
            code: region.code,
            divisionType: 'REGION',
            parent: null
          });
        }
      }
      
      // 4. Si toujours pas de résultats, RECHERCHE EXHAUSTIVE dans toutes les régions
      if (results.length === 0 && searchTerm.length >= 3) {
        console.log('🌍 [EXHAUSTIVE AGENT] Recherche complète dans TOUTES les régions pour garantir 100% de couverture');
        
        for (const region of regions) {
          try {
            const cercles = await divisionService.getCerclesByRegion(region.code);
            
            for (const cercle of cercles) {
              // Recherche dans les cercles
              if (cercle.nom && cercle.nom.toLowerCase().includes(searchTerm)) {
                results.push({
                  id: cercle.id,
                  nom: cercle.nom,
                  code: cercle.code,
                  divisionType: 'CERCLE',
                  parent: {
                    id: region.id,
                    nom: region.nom,
                    code: region.code,
                    divisionType: 'REGION'
                  }
                });
              }
              
              try {
                const communes = await divisionService.getCommunesByCercle(cercle.code);
                
                for (const commune of communes) {
                  // Recherche dans les communes
                  if (commune.nom && commune.nom.toLowerCase().includes(searchTerm)) {
                    results.push({
                      id: commune.id,
                      nom: commune.nom,
                      code: commune.code,
                      divisionType: 'COMMUNE',
                      parent: {
                        id: cercle.id,
                        nom: cercle.nom,
                        code: cercle.code,
                        divisionType: 'CERCLE',
                        parent: {
                          id: region.id,
                          nom: region.nom,
                          code: region.code,
                          divisionType: 'REGION'
                        }
                      }
                    });
                  }
                  
                  // Recherche dans TOUS les quartiers de cette commune
                  try {
                    const quartiers = await divisionService.getQuartiersByCommune(commune.code);
                    
                    for (const quartier of quartiers) {
                      if (quartier.nom && quartier.nom.toLowerCase().includes(searchTerm)) {
                        results.push({
                          id: quartier.id,
                          nom: quartier.nom,
                          code: quartier.code,
                          divisionType: 'QUARTIER',
                          parent: {
                            id: commune.id,
                            nom: commune.nom,
                            code: commune.code,
                            divisionType: 'COMMUNE',
                            parent: {
                              id: cercle.id,
                              nom: cercle.nom,
                              code: cercle.code,
                              divisionType: 'CERCLE',
                              parent: {
                                id: region.id,
                                nom: region.nom,
                                code: region.code,
                                divisionType: 'REGION'
                              }
                            }
                          }
                        });
                      }
                    }
                    
                    // Arrêter dès qu'on trouve des quartiers pour éviter trop d'appels
                    if (results.length > 0) {
                      console.log(`🎯 [EXHAUSTIVE AGENT] Trouvé ${results.length} résultats, arrêt de la recherche exhaustive`);
                      break;
                    }
                  } catch (error) {
                    console.warn('⚠️ Erreur quartiers pour commune', commune.nom);
                  }
                }
                
                if (results.length > 0) break;
              } catch (error) {
                console.warn('⚠️ Erreur communes pour cercle', cercle.nom);
              }
            }
            
            if (results.length > 0) break;
          } catch (error) {
            console.warn('⚠️ Erreur cercles pour région', region.nom);
          }
        }
      }
      
      console.log(`⚡ [ULTRA-RAPIDE AGENT] Recherche terminée: ${results.length} résultats pour "${query}"`);
      
      // Filtrer par type si spécifié
      if (type && type !== 'null') {
        return results.filter(r => r.divisionType === type.toUpperCase()).slice(0, 8);
      }
      
      return results.slice(0, 10); // Max 10 résultats
      
    } catch (error) {
      console.error('❌ Erreur lors de la recherche INSTAT:', error);
      return [];
    }
  },

  // Méthodes obsolètes pour compatibilité temporaire
  searchBamakoDivisions: async () => {
    console.warn('⚠️ searchBamakoDivisions est obsolète - utilisez getCerclesByRegion("90") pour Bamako');
    return [];
  },

  // Méthodes de compatibilité pour DossierCreationForm
  getAllArrondissements: async () => {
    console.warn('⚠️ getAllArrondissements est obsolète - utilisez la nouvelle structure INSTAT');
    try {
      // Récupérer tous les cercles de toutes les régions comme "arrondissements"
      const regions = await divisionService.getRegions();
      const allArrondissements = [];
      
      for (const region of regions) {
        try {
          const cercles = await divisionService.getCerclesByRegion(region.code);
          for (const cercle of cercles) {
            allArrondissements.push({
              ...cercle,
              type: 'ARRONDISSEMENT' // Alias pour compatibilité
            });
          }
        } catch (error) {
          console.warn('⚠️ Erreur récupération cercles pour région', region.nom);
        }
      }
      
      return allArrondissements;
    } catch (error) {
      console.error('❌ Erreur getAllArrondissements:', error);
      return [];
    }
  },

  getAllQuartiers: async () => {
    console.warn('⚠️ getAllQuartiers est obsolète - utilisez la nouvelle structure INSTAT');
    try {
      // Récupérer tous les quartiers de toutes les communes
      const regions = await divisionService.getRegions();
      const allQuartiers = [];
      
      for (const region of regions) {
        try {
          const cercles = await divisionService.getCerclesByRegion(region.code);
          
          for (const cercle of cercles) {
            try {
              const communes = await divisionService.getCommunesByCercle(cercle.code);
              
              for (const commune of communes) {
                try {
                  const quartiers = await divisionService.getQuartiersByCommune(commune.code);
                  allQuartiers.push(...quartiers);
                } catch (error) {
                  console.warn('⚠️ Erreur récupération quartiers pour commune', commune.nom);
                }
              }
            } catch (error) {
              console.warn('⚠️ Erreur récupération communes pour cercle', cercle.nom);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur récupération cercles pour région', region.nom);
        }
      }
      
      return allQuartiers;
    } catch (error) {
      console.error('❌ Erreur getAllQuartiers:', error);
      return [];
    }
  },
};

export default divisionService;
