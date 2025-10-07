// Service to fetch backend enums
// Base: /api/v1/enums

import { apiRequest } from './api';

export const enumService = {
  // GET /api/v1/enums/societe-juridictions
  getSocieteJuridictions: async () => apiRequest('/api/v1/enums/forme-juridique', { method: 'GET' }),
  // GET /api/v1/enums/nationalites
  getNationalites: async () => apiRequest('/api/v1/enums/nationalites', { method: 'GET' }),
  // GET /api/v1/enums/sexes
  getSexes: async () => apiRequest('/api/v1/enums/sexes', { method: 'GET' }),
  // GET /api/v1/enums/civilites
  getCivilites: async () => apiRequest('/api/v1/enums/civilites', { method: 'GET' }),
  // GET /api/v1/enums/piece-identites
  getPieceIdentites: async () => apiRequest('/api/v1/enums/piece-identites', { method: 'GET' }),
  // GET /api/v1/enums/fonctions
  getFonctions: async () => apiRequest('/api/v1/enums/fonctions', { method: 'GET' }),
  // GET /api/v1/enums/pouvoirs
  getPouvoirs: async () => apiRequest('/api/v1/enums/pouvoirs', { method: 'GET' }),
  // GET /api/v1/enums/activites-principales
  getActivitesPrincipales: async () => apiRequest('/api/v1/enums/activites-principales', { method: 'GET' }),
  // GET /api/v1/enums/document-plans
  getDocumentPlans: async () => apiRequest('/api/v1/enums/document-plans', { method: 'GET' }),
  // GET /api/v1/enums/type-entreprise
  getTypeEntreprise: async () => apiRequest('/api/v1/enums/type-entreprise', { method: 'GET' }),
  // GET /api/v1/enums/forme-juridique
  getFormeJuridique: async () => apiRequest('/api/v1/enums/forme-juridique', { method: 'GET' }),
  // GET /api/v1/enums/domaine-activites
  getDomaineActivites: async () => apiRequest('/api/v1/enums/domaine-activites', { method: 'GET' }),
  // GET /api/v1/enums/situation-matrimoniales
  getSituationMatrimoniales: async () => apiRequest('/api/v1/enums/situation-matrimoniales', { method: 'GET' }),
};

export default enumService;
