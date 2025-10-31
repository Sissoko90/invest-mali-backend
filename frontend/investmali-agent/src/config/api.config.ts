<<<<<<< HEAD
/**
 * Configuration centralisée pour l'API Agent InvestMali
 * 
 * Cette configuration utilise les variables d'environnement pour définir
 * les URLs et paramètres de l'API backend Spring Boot.
 */

// Fonction pour déterminer l'URL de base selon l'environnement
const getBaseUrl = (): string => {
  // 1. Détection automatique selon le domaine (PRIORITÉ)
  const hostname = window.location.hostname;


  if ( hostname==='agent-investmali.com') {
    return 'http://agent-investmali.com/api/v1';
  }
  if (hostname === '192.168.2.4') {
    return 'http://192.168.2.4/api/v1';
  }
  if (hostname === '102.165.96.223') {
    return 'http://102.165.96.223/api/v1';
  }
  
 if (hostname === 'agent.formalisation.ml') {
    return 'https://agent.formalisation.ml/api/v1';
  }
  
  
  if (hostname === 'investmali-agent.abdatytch.com' || hostname === 'www.agent-investmali.com') {
    return 'https://investmali.abdatytch.com/api/v1';
  }
  
  // 2. Variable d'environnement en fallback
  const envUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_USER_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // 3. Fallback développement
  return 'http://localhost:8080/api/v1';
};

// Configuration de base de l'API
export const API_CONFIG = {
  // URL de base de l'API - détection automatique dev/prod
  BASE_URL: getBaseUrl(),
  
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
  
  // Debug mode (activé automatiquement en développement)
  DEBUG: process.env.REACT_APP_DEBUG_API === 'true' || process.env.NODE_ENV === 'development',
} as const;

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/auth/me',
    UPLOAD_AVATAR: '/auth/me/avatar',
  },
  
  // Agent Business (Applications)
  AGENT: {
    APPLICATIONS: '/agent/applications',
    APPLICATION_DETAIL: (id: string | number) => `/agent/applications/${id}`,
    UPDATE_APPLICATION: (id: string | number) => `/agent/applications/${id}`,
    ASSIGN_APPLICATION: (id: string | number) => `/agent/applications/${id}/assign`,
    UPDATE_STATUS: (id: string | number) => `/agent/applications/${id}/status`,
    STATS: '/agent/stats',
    NOTIFICATIONS: '/agent/notifications',
    MARK_NOTIFICATION_READ: (id: string | number) => `/agent/notifications/${id}/read`,
    MARK_ALL_NOTIFICATIONS_READ: '/agent/notifications/read-all',
  },
  
  // Entreprises
  ENTREPRISES: {
    LIST: '/entreprises',
    UNASSIGNED: '/entreprises/unassigned',
    DETAIL: (id: string | number) => `/entreprises/${id}`,
    UPDATE: (id: string | number) => `/entreprises/${id}`,
    MY_APPLICATIONS: '/entreprises/my-applications',
    ASSIGN: (id: string | number) => `/entreprises/${id}/assign`,
    UNASSIGN: (id: string | number) => `/entreprises/${id}/unassign`,
    ASSIGNED_TO_ME: '/entreprises/assigned-to-me',
    BY_ETAPE: (etape: string) => `/entreprises/etape/${etape}`,
    DOCUMENTS: (entrepriseId: string) => `/entreprises/${entrepriseId}/documents`,
  },
  
  // Chat System
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    AGENT_CONVERSATIONS: '/chat/conversations/agent',
    CONVERSATION_DETAIL: (id: string) => `/chat/conversations/${id}`,
    SEND_MESSAGE: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    MARK_AS_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    CLOSE_CONVERSATION: (conversationId: string) => `/chat/conversations/${conversationId}/close`,
    UNREAD_COUNT: '/chat/unread-count/agent',
    START_FROM_ENTREPRISE: (entrepriseId: string) => `/chat/conversations/start-from-entreprise/${entrepriseId}`,
  },
  
  // Système de santé
  HEALTH: '/health',
  
  // Enums
  ENUMS: {
    PAYS_EMISSION_RCCM: '/enums/pays-emission-rccm',
    DOMAINE_ACTIVITES_NR: '/enums/domaine-activites-nr',
  },
  
  // Paiements
  PAIEMENTS: {
    CREATE: '/paiements',
    LIST: '/paiements',
    DETAIL: (id: string | number) => `/paiements/${id}`,
    BY_ENTREPRISE: (entrepriseId: string | number) => `/paiements/entreprise/${entrepriseId}`,
    CONFIRMES: '/paiements/confirmes',
  },
  
  // Client Applications (chemins multiples pour compatibilité)
  CLIENT_APPS: {
    // Chemins configurables via variable d'environnement
    CONFIGURED_PATHS: process.env.REACT_APP_CREATE_CLIENT_APP_PATH?.split(',').map(p => p.trim()) || [],
    
    // Chemins par défaut à tester
    DEFAULT_PATHS: [
      '/agent/applications/client-application',
      '/agent/applications',
      '/agent/client-applications',
      '/agent/business/client-application',
      '/applications/client-application',
      '/applications',
      '/client-applications',
      '/business/client-application',
    ],
    
    // Fallback JSON
    JSON_FALLBACK: '/business/applications',
  },
} as const;

// Configuration des tokens d'authentification
export const AUTH_CONFIG = {
  TOKEN_KEY: 'investmali_agent_token',
  USER_KEY: 'investmali_agent',
  LOGIN_REDIRECT: '/agent-login',
} as const;

// Utilitaires pour construire les URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Supprimer le slash final
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Fonction pour obtenir les headers d'authentification
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fonction pour obtenir les headers complets
export const getHeaders = (isMultipart = false): Record<string, string> => {
  const baseHeaders = isMultipart ? {} : API_CONFIG.DEFAULT_HEADERS;
  const authHeaders = getAuthHeaders();
  
  return {
    ...baseHeaders,
    ...authHeaders,
  };
};

// Fonction pour gérer les erreurs d'authentification
export const handleAuthError = (): void => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  window.location.href = AUTH_CONFIG.LOGIN_REDIRECT;
};

// Fonction utilitaire pour les requêtes fetch avec configuration centralisée
export const createApiRequest = () => {
  return async (endpoint: string, options: any = {}) => {
    const url = buildApiUrl(endpoint);
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    
    const config = {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
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

      // Gestion spéciale des erreurs 429 (Rate Limiting)
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const error = {
          message: 'Trop de requêtes. Veuillez patienter.',
          status: 429,
          retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
          data,
          headers: response.headers
        };
        
        
        throw error;
      }
      
      if (!response.ok) {
        throw {
          message: (data && (data.message || data.error)) || 'Une erreur est survenue',
          status: response.status,
          data,
          headers: response.headers
        };
      }
      
      return data;
    } catch (error: any) {
      
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

=======
/**
 * Configuration centralisée pour l'API Agent InvestMali
 * 
 * Cette configuration utilise les variables d'environnement pour définir
 * les URLs et paramètres de l'API backend Spring Boot.
 */

// Fonction pour déterminer l'URL de base selon l'environnement
const getBaseUrl = (): string => {
  // 1. Priorité à la variable d'environnement explicite (support des deux noms)
  const envUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_USER_API_URL;
  
  // 2. Détection automatique selon l'environnement NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    // Environnement de développement : utiliser localhost
    return envUrl || 'http://localhost:8080/api/v1';
  } else {
    // Environnement de production : FORCER l'URL de production
    return envUrl || 'https://investmali-agent.abdatytch.com/api/v1';
  }
};

// Configuration de base de l'API
export const API_CONFIG = {
  // URL de base de l'API - détection automatique dev/prod
  BASE_URL: getBaseUrl(),
  
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
  
  // Debug mode (activé automatiquement en développement)
  DEBUG: process.env.REACT_APP_DEBUG_API === 'true' || process.env.NODE_ENV === 'development',
} as const;

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/auth/me',
    UPLOAD_AVATAR: '/auth/me/avatar',
  },
  
  // Agent Business (Applications)
  AGENT: {
    APPLICATIONS: '/agent/applications',
    APPLICATION_DETAIL: (id: string | number) => `/agent/applications/${id}`,
    UPDATE_APPLICATION: (id: string | number) => `/agent/applications/${id}`,
    ASSIGN_APPLICATION: (id: string | number) => `/agent/applications/${id}/assign`,
    UPDATE_STATUS: (id: string | number) => `/agent/applications/${id}/status`,
    STATS: '/agent/stats',
    NOTIFICATIONS: '/agent/notifications',
    MARK_NOTIFICATION_READ: (id: string | number) => `/agent/notifications/${id}/read`,
    MARK_ALL_NOTIFICATIONS_READ: '/agent/notifications/read-all',
  },
  
  // Entreprises
  ENTREPRISES: {
    LIST: '/entreprises',
    UNASSIGNED: '/entreprises/unassigned',
    DETAIL: (id: string | number) => `/entreprises/${id}`,
    UPDATE: (id: string | number) => `/entreprises/${id}`,
    MY_APPLICATIONS: '/entreprises/my-applications',
    ASSIGN: (id: string | number) => `/entreprises/${id}/assign`,
    UNASSIGN: (id: string | number) => `/entreprises/${id}/unassign`,
    ASSIGNED_TO_ME: '/entreprises/assigned-to-me',
  },
  
  // Chat System
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    AGENT_CONVERSATIONS: '/chat/conversations/agent',
    CONVERSATION_DETAIL: (id: string) => `/chat/conversations/${id}`,
    SEND_MESSAGE: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    MARK_AS_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    CLOSE_CONVERSATION: (conversationId: string) => `/chat/conversations/${conversationId}/close`,
    UNREAD_COUNT: '/chat/unread-count/agent',
    START_FROM_ENTREPRISE: (entrepriseId: string) => `/chat/conversations/start-from-entreprise/${entrepriseId}`,
  },
  
  // Système de santé
  HEALTH: '/health',
  
  // Client Applications (chemins multiples pour compatibilité)
  CLIENT_APPS: {
    // Chemins configurables via variable d'environnement
    CONFIGURED_PATHS: process.env.REACT_APP_CREATE_CLIENT_APP_PATH?.split(',').map(p => p.trim()) || [],
    
    // Chemins par défaut à tester
    DEFAULT_PATHS: [
      '/agent/applications/client-application',
      '/agent/applications',
      '/agent/client-applications',
      '/agent/business/client-application',
      '/applications/client-application',
      '/applications',
      '/client-applications',
      '/business/client-application',
    ],
    
    // Fallback JSON
    JSON_FALLBACK: '/business/applications',
  },
} as const;

// Configuration des tokens d'authentification
export const AUTH_CONFIG = {
  TOKEN_KEY: 'investmali_agent_token',
  USER_KEY: 'investmali_agent',
  LOGIN_REDIRECT: '/agent-login',
} as const;

// Utilitaires pour construire les URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Supprimer le slash final
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Fonction pour obtenir les headers d'authentification
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fonction pour obtenir les headers complets
export const getHeaders = (isMultipart = false): Record<string, string> => {
  const baseHeaders = isMultipart ? {} : API_CONFIG.DEFAULT_HEADERS;
  const authHeaders = getAuthHeaders();
  
  return {
    ...baseHeaders,
    ...authHeaders,
  };
};

// Fonction pour gérer les erreurs d'authentification
export const handleAuthError = (): void => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  window.location.href = AUTH_CONFIG.LOGIN_REDIRECT;
};

// Fonction utilitaire pour les requêtes fetch avec configuration centralisée
export const createApiRequest = () => {
  return async (endpoint: string, options: any = {}) => {
    const url = buildApiUrl(endpoint);
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    
    const config = {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Si on envoie un FormData, laisser le navigateur définir le Content-Type (boundary)
    const isFormData = typeof FormData !== 'undefined' && options && options.body instanceof FormData;
    if (isFormData && config.headers && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }

    if (API_CONFIG.DEBUG) {
      console.log('🔄 API Request:', {
        method: config.method || 'GET',
        url: url,
        hasAuth: !!token,
        isFormData: isFormData
      });
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
      
      if (API_CONFIG.DEBUG) {
        console.log('✅ API Response:', {
          status: response.status,
          url: url,
          method: config.method || 'GET',
          hasData: !!data
        });
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
    } catch (error: any) {
      if (API_CONFIG.DEBUG) {
        console.error('❌ API Error:', {
          url: url,
          error: error.message || error,
          status: error.status || 0
        });
      }
      
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

// Log de configuration (TOUJOURS afficher pour diagnostiquer)
console.group('🔧 Agent API Configuration - DIAGNOSTIC');
console.log('Base URL:', API_CONFIG.BASE_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('REACT_APP_USER_API_URL:', process.env.REACT_APP_USER_API_URL);
console.log('Timeout:', API_CONFIG.TIMEOUT);
console.log('Debug Mode:', API_CONFIG.DEBUG);
console.groupEnd();

// Log de configuration (seulement en mode debug)
if (API_CONFIG.DEBUG) {
  console.group('🔧 Agent API Configuration');
  console.log('Base URL:', API_CONFIG.BASE_URL);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  console.log('REACT_APP_USER_API_URL:', process.env.REACT_APP_USER_API_URL);
  console.log('Timeout:', API_CONFIG.TIMEOUT);
  console.log('Debug Mode:', API_CONFIG.DEBUG);
  console.groupEnd();
}
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
