// Service for DivisionMali endpoints (Spring Boot)
// Backend base for divisions is /api/v1/divisions (with /v1)

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const rawRequest = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `http://localhost:8080${path}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
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
  // GET /api/v1/divisions/regions
  getRegions: async () => rawRequest('/api/v1/divisions/regions'),

  // GET /api/v1/divisions/parent/{parentId}
  getByParent: async (parentId) => rawRequest(`/api/v1/divisions/parent/${parentId}`),

  // GET /api/v1/divisions/type/{type}
  // type one of: REGION, CERCLE, ARRONDISSEMENT, COMMUNE
  getByType: async (type) => rawRequest(`/api/v1/divisions/type/${type}`),

  // GET /api/v1/divisions/parent/{parentId}/type/{type}
  getByParentAndType: async (parentId, type) => rawRequest(`/api/v1/divisions/parent/${parentId}/type/${type}`),

  // GET /api/v1/divisions/{id} - Récupérer une division spécifique par ID
  getById: async (divisionId) => rawRequest(`/api/v1/divisions/${divisionId}`),

  // GET /api/v1/divisions/code/{code} - Récupérer une division par son code
  getByCode: async (divisionCode) => rawRequest(`/api/v1/divisions/code/${divisionCode}`),

  // Helpers for cascaded selects
  getCerclesByRegion: async (regionId) => rawRequest(`/api/v1/divisions/regions/${regionId}/cercles`),
  getArrondissementsByCercle: async (cercleId) => rawRequest(`/api/v1/divisions/cercles/${cercleId}/arrondissements`),
  getCommunesByArrondissement: async (arrondissementId) => rawRequest(`/api/v1/divisions/arrondissements/${arrondissementId}/communes`),
  getQuartiersByCommune: async (communeId) => rawRequest(`/api/v1/divisions/communes/${communeId}/quartiers`),
  
  // Helpers spécifiques pour Bamako District (structure différente)
  getArrondissementsByRegion: async (regionId) => {
    // Pour Bamako District, récupérer directement les arrondissements depuis la région
    try {
      return await rawRequest(`/api/v1/divisions/regions/${regionId}/arrondissements`);
    } catch (error) {
      console.error('Erreur lors du chargement des arrondissements par région:', error);
      return [];
    }
  },
  
  getQuartiersByArrondissement: async (arrondissementId) => {
    // Pour Bamako District, récupérer directement les quartiers depuis l'arrondissement
    try {
      return await rawRequest(`/api/v1/divisions/arrondissements/${arrondissementId}/quartiers`);
    } catch (error) {
      console.error('Erreur lors du chargement des quartiers par arrondissement:', error);
      return [];
    }
  },
  
  // Solution de contournement: Récupérer les quartiers par code d'arrondissement
  getQuartiersByArrondissementCode: async (arrondissementId) => {
    try {
      return await rawRequest(`/api/v1/divisions/arrondissements/${arrondissementId}/quartiers/by-code`);
    } catch (error) {
      console.error('Erreur lors du chargement des quartiers par code:', error);
      return [];
    }
  },
  
  // Debug: Récupérer tous les enfants d'une région
  getChildrenByRegion: async (regionId) => {
    try {
      return await rawRequest(`/api/v1/divisions/debug/regions/${regionId}/children`);
    } catch (error) {
      console.error('Erreur lors du chargement des enfants par région:', error);
      return [];
    }
  },
  
  // Debug: Rechercher toutes les divisions Bamako
  searchBamakoDivisions: async () => {
    try {
      return await rawRequest(`/api/v1/divisions/debug/search/bamako`);
    } catch (error) {
      console.error('Erreur lors de la recherche des divisions Bamako:', error);
      return [];
    }
  },
  
  // Debug: Récupérer tous les arrondissements
  getAllArrondissements: async () => {
    try {
      return await rawRequest(`/api/v1/divisions/debug/arrondissements`);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les arrondissements:', error);
      return [];
    }
  },
  
  // Debug: Récupérer tous les quartiers
  getAllQuartiers: async () => {
    try {
      return await rawRequest(`/api/v1/divisions/debug/quartiers`);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les quartiers:', error);
      return [];
    }
  },
  
  // Debug: Analyser la structure complète de Bamako
  analyzeBamakoStructure: async () => {
    try {
      const url = `http://localhost:8080/api/v1/divisions/debug/bamako/structure`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
      };
      const res = await fetch(url, config);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      // Récupérer comme texte au lieu de JSON
      const text = await res.text();
      return text;
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la structure Bamako:', error);
      return 'Erreur: ' + error.message;
    }
  },

  // Recherche rapide de divisions par nom
  searchDivisions: async (query, type = null) => {
    try {
      const params = new URLSearchParams({ query });
      if (type && type !== null) params.append('type', type);
      return await rawRequest(`/api/v1/divisions/search?${params.toString()}`);
    } catch (error) {
      console.error('Erreur lors de la recherche de divisions:', error);
      return [];
    }
  },
};

export default divisionService;
