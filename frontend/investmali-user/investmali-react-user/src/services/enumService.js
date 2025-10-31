<<<<<<< HEAD
// Service to fetch backend enums
// Base: /api/v1/enums

import { apiRequest } from './api';

export const enumService = {
  // GET /enums/societe-juridictions
  getSocieteJuridictions: async () => apiRequest('/enums/forme-juridique', { method: 'GET' }),
  // GET /enums/nationalites
  getNationalites: async () => apiRequest('/enums/nationalites', { method: 'GET' }),
  // GET /enums/sexes
  getSexes: async () => apiRequest('/enums/sexes', { method: 'GET' }),
  // GET /enums/civilites
  getCivilites: async () => apiRequest('/enums/civilites', { method: 'GET' }),
  // GET /enums/piece-identites
  getPieceIdentites: async () => apiRequest('/enums/piece-identites', { method: 'GET' }),
  // GET /enums/fonctions
  getFonctions: async () => apiRequest('/enums/fonctions', { method: 'GET' }),
  // GET /enums/pouvoirs
  getPouvoirs: async () => apiRequest('/enums/pouvoirs', { method: 'GET' }),
  // GET /enums/activites-principales
  getActivitesPrincipales: async () => apiRequest('/enums/activites-principales', { method: 'GET' }),
  // GET /enums/document-plans
  getDocumentPlans: async () => apiRequest('/enums/document-plans', { method: 'GET' }),
  // GET /enums/type-entreprise
  getTypeEntreprise: async () => apiRequest('/enums/type-entreprise', { method: 'GET' }),
  // GET /enums/forme-juridique
  getFormeJuridique: async () => apiRequest('/enums/forme-juridique', { method: 'GET' }),
  // GET /enums/domaine-activites
  getDomaineActivites: async () => apiRequest('/enums/domaine-activites', { method: 'GET' }),
  // GET /enums/domaine-activites-nr
  getDomaineActivitesNr: async () => apiRequest('/enums/domaine-activites-nr', { method: 'GET' }),
  // GET /enums/situation-matrimoniales
  getSituationMatrimoniales: async () => apiRequest('/enums/situation-matrimoniales', { method: 'GET' }),
  // GET /enums/pays-emission-rccm
  getPaysEmissionRccm: async () => apiRequest('/enums/pays-emission-rccm', { method: 'GET' }),
};

export default enumService;
=======
// Service to fetch backend enums
// Base: /api/v1/enums

import { apiRequest } from './api';

export const enumService = {
  // GET /enums/societe-juridictions
  getSocieteJuridictions: async () => apiRequest('/enums/forme-juridique', { method: 'GET' }),
  // GET /enums/nationalites
  getNationalites: async () => apiRequest('/enums/nationalites', { method: 'GET' }),
  // GET /enums/sexes
  getSexes: async () => apiRequest('/enums/sexes', { method: 'GET' }),
  // GET /enums/civilites
  getCivilites: async () => apiRequest('/enums/civilites', { method: 'GET' }),
  // GET /enums/piece-identites
  getPieceIdentites: async () => apiRequest('/enums/piece-identites', { method: 'GET' }),
  // GET /enums/fonctions
  getFonctions: async () => apiRequest('/enums/fonctions', { method: 'GET' }),
  // GET /enums/pouvoirs
  getPouvoirs: async () => apiRequest('/enums/pouvoirs', { method: 'GET' }),
  // GET /enums/activites-principales
  getActivitesPrincipales: async () => apiRequest('/enums/activites-principales', { method: 'GET' }),
  // GET /enums/document-plans
  getDocumentPlans: async () => apiRequest('/enums/document-plans', { method: 'GET' }),
  // GET /enums/type-entreprise
  getTypeEntreprise: async () => apiRequest('/enums/type-entreprise', { method: 'GET' }),
  // GET /enums/forme-juridique
  getFormeJuridique: async () => apiRequest('/enums/forme-juridique', { method: 'GET' }),
  // GET /enums/domaine-activites
  getDomaineActivites: async () => apiRequest('/enums/domaine-activites', { method: 'GET' }),
  // GET /enums/situation-matrimoniales
  getSituationMatrimoniales: async () => apiRequest('/enums/situation-matrimoniales', { method: 'GET' }),
};

export default enumService;
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
