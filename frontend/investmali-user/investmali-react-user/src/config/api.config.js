/**
 * Configuration centralisée pour l'API Utilisateur InvestMali
 * 
 * Cette configuration utilise les variables d'environnement pour définir
 * les URLs et paramètres de l'API backend Spring Boot.
 */

// Configuration de base de l'API
export const API_CONFIG = {
  // URL de base de l'API - détection automatique selon l'environnement
  BASE_URL: (() => {
    // 1. Détection automatique selon le domaine (PRIORITÉ)
    const hostname = window.location.hostname;
    
        
    if (hostname === '192.168.2.4') {
      return 'http://192.168.2.4:8080/api/v1';
    }
    
    if (hostname === '102.165.96.223') {
      return 'http://102.165.96.223:8080/api/v1';
    }
    
    if (hostname === 'www.formalisation.ml' || hostname === 'formalisation.ml') {
      return 'https://www.formalisation.ml/api/v1';
    }
    
    // 2. Variable d'environnement en fallback
    if (process.env.REACT_APP_USER_API_URL) {
      return process.env.REACT_APP_USER_API_URL;
    }
    
    // 3. Fallback développement
    return 'http://localhost:8080/api/v1';
  })(),
  
  // Timeout pour les requêtes (30 secondes par défaut)
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configuration pour les uploads de fichiers
  MULTIPART_HEADERS: {
    // Laisser le navigateur définir le Content-Type pour FormData (boundary)
  },
  
  // Debug mode
  DEBUG: process.env.REACT_APP_DEBUG_API === 'true',
};

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
  },
  
  // Persons
  PERSONS: {
    GET_BY_ID: (id) => `/persons/${id}`,
    CREATE: '/persons',
    UPDATE: (id) => `/persons/${id}`,
  },
  
  // Entreprises
  ENTREPRISES: {
    CREATE: '/entreprises',
    LIST: '/entreprises',
    MY_APPLICATIONS: '/entreprises/my-applications',
    MY_INVESTMENT_APPLICATIONS: '/entreprises/my-investment-applications',
    DETAIL: (id) => `/entreprises/${id}`,
    UPDATE: (id) => `/entreprises/${id}`,
    DELETE: (id) => `/entreprises/${id}`,
  },
  
  // Business Applications
  BUSINESS: {
    APPLICATIONS: '/business/applications',
    APPLICATIONS_MULTIPART: '/business/applications/multipart',
    STATS: '/business/stats',
  },
  
  // Upload & Documents
  UPLOAD: {
    DOCUMENT: (applicationId) => `/upload/document/${applicationId}`,
    DOCUMENTS: (applicationId) => `/upload/documents/${applicationId}`,
    DOWNLOAD: (applicationId, documentType, documentCategory = null) => {
      let url = `/upload/document/${applicationId}/${documentType}/download`;
      if (documentCategory) {
        url += `?documentCategory=${documentCategory}`;
      }
      return url;
    },
    DELETE_DOCUMENT: (applicationId, documentType, documentCategory = null) => {
      let url = `/upload/document/${applicationId}/${documentType}`;
      if (documentCategory) {
        url += `?documentCategory=${documentCategory}`;
      }
      return url;
    },
  },
  
  // Chat System (User side) - ✅ NOUVEAU : Endpoints mis à jour
  CHAT: {
    START_CONVERSATION: '/conversations/user-contact-agent',
    GET_CONVERSATION: (conversationId) => `/conversations/${conversationId}`,
    SEND_MESSAGE: (conversationId) => `/conversations/${conversationId}/messages`,
    GET_MESSAGES: (conversationId) => `/conversations/${conversationId}/messages`,
    USER_CONVERSATIONS: (userId) => `/conversations/user/${userId}`,
  },
  
  // Contact
  CONTACT: {
    SEND: '/contact/send',
  },
  
  // Enums
  ENUMS: {
    FORME_JURIDIQUE: '/enums/forme-juridique',
    TYPE_ENTREPRISE: '/enums/type-entreprise',
    DOMAINE_ACTIVITES: '/enums/domaine-activites',
    DOMAINE_ACTIVITES_NR: '/enums/domaine-activites-nr',
    NATIONALITES: '/enums/nationalites',
    SEXES: '/enums/sexes',
    CIVILITES: '/enums/civilites',
    PIECE_IDENTITES: '/enums/piece-identites',
    SITUATION_MATRIMONIALES: '/enums/situation-matrimoniales',
    DOCUMENT_PLANS: '/enums/document-plans',
  },
  
  // Health Check
  HEALTH: '/health',
  
  // Divisions (pour les localisations)
  DIVISIONS: {
    REGIONS: '/divisions/regions',
    CERCLES_BY_REGION: (regionId) => `/divisions/regions/${regionId}/cercles`,
    ARRONDISSEMENTS_BY_CERCLE: (cercleId) => `/divisions/cercles/${cercleId}/arrondissements`,
    COMMUNES_BY_ARRONDISSEMENT: (arrondissementId) => `/divisions/arrondissements/${arrondissementId}/communes`,
    QUARTIERS_BY_COMMUNE: (communeId) => `/divisions/communes/${communeId}/quartiers`,
    SEARCH: '/divisions/search',
  },
};

// Configuration des tokens d'authentification
export const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  LOGIN_REDIRECT: '/auth',
};

// Utilitaires pour construire les URLs
export const buildApiUrl = (endpoint) => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Supprimer le slash final
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Fonction pour obtenir les headers d'authentification
export const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fonction pour obtenir les headers complets
export const getHeaders = (isMultipart = false) => {
  const baseHeaders = isMultipart ? API_CONFIG.MULTIPART_HEADERS : API_CONFIG.DEFAULT_HEADERS;
  const authHeaders = getAuthHeaders();
  
  return {
    ...baseHeaders,
    ...authHeaders,
  };
};

// Fonction pour gérer les erreurs d'authentification
export const handleAuthError = () => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  window.location.href = AUTH_CONFIG.LOGIN_REDIRECT;
};

// Fonction utilitaire pour les requêtes fetch avec configuration centralisée
export const createApiRequest = () => {
  return async (endpoint, options = {}) => {
    const url = buildApiUrl(endpoint);
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    
    const config = {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token.trim()}` }),
        ...options.headers,
      },
      ...options,
    };

    // Si on envoie un FormData, laisser le navigateur définir le Content-Type (boundary)
    const isFormData = typeof FormData !== 'undefined' && options && options.body instanceof FormData;
    if (isFormData && config.headers && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      let data;
      
      if (response.status === 204 || response.status === 205) {
        data = null;
      } else if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (_) {
          data = null;
        }
      } else {
        const text = await response.text();
        data = text || null;
      }
      
      // Gestion des erreurs d'authentification
      if (response.status === 401) {
        handleAuthError();
        throw new Error('Non autorisé');
      }
      
      if (!response.ok) {
        throw {
          message: (data && (data.message || data.error)) || 'Une erreur est survenue',
          status: response.status,
          data
        };
      }
      
      return data;
    } catch (error) {
      if (error.message && error.status) {
        throw error;
      }
      throw {
        message: error.message || 'Erreur de connexion',
        status: 0,
        data: null
      };
    }
  };
};

// Configuration ready for production
