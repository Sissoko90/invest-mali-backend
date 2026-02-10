import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG, API_ENDPOINTS, AUTH_CONFIG, buildApiUrl, getHeaders } from '../config/api.config';

// Utiliser la configuration centralisée
const baseURL = API_CONFIG.BASE_URL;


// Create axios instance with proper typing
const api: AxiosInstance = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      window.location.href = AUTH_CONFIG.LOGIN_REDIRECT;
    }
    return Promise.reject(error);
  }
);

// API Modules
const agentBusinessAPI = {
  // Applications list with filters/sort/pagination (Agent endpoints)
  listApplications: (params: Record<string, any> = {}) => api.get(API_ENDPOINTS.AGENT.APPLICATIONS, { params }),
  // Backward-compat alias used by legacy components/tests
  getApplications: (queryParams: Record<string, any> = {}) => api.get(API_ENDPOINTS.AGENT.APPLICATIONS, { params: queryParams }),
  // Single application detail
  getApplication: (id: string | number) => api.get(API_ENDPOINTS.AGENT.APPLICATION_DETAIL(id)),
  // Partial update (priority, agent_notes, payment_status, costs)
  updateApplication: (id: string | number, patch: Partial<Record<string, any>>) => api.patch(API_ENDPOINTS.AGENT.UPDATE_APPLICATION(id), patch),
  // Assign to current agent or unassign depending on backend contract
  assignApplication: (id: string | number, assignToMe = true) => api.patch(API_ENDPOINTS.AGENT.ASSIGN_APPLICATION(id), { assignToMe }),
  // Update status with optional note
  updateStatus: (id: string | number, status: string, note?: string) => api.patch(API_ENDPOINTS.AGENT.UPDATE_STATUS(id), { status, note }),
  // Aggregated stats for KPI cards
  getStats: () => api.get(API_ENDPOINTS.AGENT.STATS),
  // Backward-compat: client application creation (non-agent endpoint)
  createApplicationForClient: (data: any) => api.post('/applications/client-application', data),
  // Multipart version including files (statutes, commerceRegistry, residenceCertificate, representativeId, partnersIds[])
  createApplicationForClientMultipart: (form: FormData) =>
    api.post('/applications/client-application', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // Smart multipart with env-configurable path and multiple fallbacks
  // Set REACT_APP_CREATE_CLIENT_APP_PATH to override (e.g. "/agent/applications")
  createApplicationForClientMultipartSmart: async (form: FormData): Promise<AxiosResponse<any>> => {
    const candidates = [
      // Highest priority: explicit env path(s)
      ...API_ENDPOINTS.CLIENT_APPS.CONFIGURED_PATHS,
      // Default paths from configuration
      ...API_ENDPOINTS.CLIENT_APPS.DEFAULT_PATHS,
    ];
    let lastErr: any;
    const tried: { path: string; status?: number }[] = [];
    for (const path of candidates) {
      try {
        const res = await api.post(path, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res;
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        tried.push({ path, status });
        if (status && status !== 404) break; // do not continue on non-404 errors
      }
    }
    const enhanced = new Error(
      `Aucune route de création trouvée. Chemins testés: ${tried.map(t => `${t.path}${t.status ? ` (status ${t.status})` : ''}`).join(', ')}`
    ) as any;
    enhanced.cause = lastErr;
    enhanced.triedPaths = tried;
    throw enhanced;
  },
  // Fully smart: try MULTIPART endpoints first (to persist files), then fallback to JSON
  createClientApplicationSmart: async (payload: any, form: FormData): Promise<AxiosResponse<any>> => {
    const configuredPath = process.env.REACT_APP_CREATE_CLIENT_APP_PATH?.trim();
    const multipartCandidates = [
      '/agent/applications/client-application',
      '/agent/applications',
      '/agent/client-applications',
      '/agent/business/client-application',
      '/applications/client-application',
      '/applications',
      '/client-applications',
      '/business/client-application',
    ];
    const configured = configuredPath ? configuredPath.split(',').map(p => p.trim()).filter(Boolean) : [];
    // Prefer configured paths first (could be multipart), then the known multipart list, then JSON fallback
    const candidates = [
      ...configured,
      ...multipartCandidates,
      '/business/applications', // JSON fallback
    ];
    let lastErr: any;
    const tried: { path: string; status?: number; mode: 'json' | 'multipart' }[] = [];
    for (const path of candidates) {
      const isJson = path === '/business/applications';
      const mode: 'json' | 'multipart' = isJson ? 'json' : 'multipart';
      try {
        const res = isJson
          ? await api.post(path, payload)
          : await api.post(path, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res;
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        tried.push({ path, status, mode });
        if (status && status !== 404 && status !== 500) break; // continue on 500 errors to try other endpoints
      }
    }
    const enhanced = new Error(
      `Aucune route de création trouvée. Chemins testés: ${tried.map(t => `${t.path} [${t.mode}]${t.status ? ` (status ${t.status})` : ''}`).join(', ')}`
    ) as any;
    enhanced.cause = lastErr;
    enhanced.triedPaths = tried;
    throw enhanced;
  },
};

const healthAPI = {
  checkHealth: () => api.get(API_ENDPOINTS.HEALTH),
};

const agentAuthAPI = {
  login: (credentials: { email?: string; telephone?: string; password: string }) => {
    // Le backend attend 'identifiant' (email ou téléphone) et 'motdepasse'
    const identifiant = credentials.email || credentials.telephone || '';
    return api.post(API_ENDPOINTS.AUTH.LOGIN, { 
      identifiant, 
      motdepasse: credentials.password 
    });
  },
  register: (data: any) => api.post(API_ENDPOINTS.AUTH.REGISTER, data),
  getProfile: () => api.get(API_ENDPOINTS.AUTH.PROFILE),
  updateProfile: (patch: Partial<Record<string, any>>) => api.patch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, patch),
  uploadAvatar: (file: File | Blob) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post(API_ENDPOINTS.AUTH.UPLOAD_AVATAR, form, {
      headers: API_CONFIG.MULTIPART_HEADERS,
    });
  },
};

// Notifications (Agent)
const notificationsAPI = {
  list: (params: Record<string, any> = {}) => api.get(API_ENDPOINTS.AGENT.NOTIFICATIONS, { params }),
  markRead: (id: string | number) => api.patch(API_ENDPOINTS.AGENT.MARK_NOTIFICATION_READ(id)),
  markAllRead: () => api.patch(API_ENDPOINTS.AGENT.MARK_ALL_NOTIFICATIONS_READ),
};

// Entreprises API
const entreprisesAPI = {
  // Liste des entreprises avec filtres
  list: (params: Record<string, any> = {}) => api.get(API_ENDPOINTS.ENTREPRISES.LIST, { params }),
  // Liste des entreprises NON ASSIGNÉES (pour éviter les conflits entre agents)
  unassigned: (params: Record<string, any> = {}) => api.get(API_ENDPOINTS.ENTREPRISES.UNASSIGNED, { params }),
  // Détail d'une entreprise
  getById: (id: string | number) => api.get(API_ENDPOINTS.ENTREPRISES.DETAIL(id)),
  // Mettre à jour une entreprise (utilise PUT avec UpdateEntrepriseRequest)
  update: (id: string | number, updateData: Record<string, any>) => 
    api.put(API_ENDPOINTS.ENTREPRISES.UPDATE(id), updateData),
  // Mettre à jour le statut d'une entreprise (utilise l'endpoint update général)
  // etapeOverride permet de forcer une étape spécifique (ex: REVISION si déjà payé)
  updateStatus: (id: string | number, status: string, note?: string, etapeOverride?: string) => {
    // Mapper les statuts vers les enums backend
    let statutCreation = '';
    let etapeValidation = 'ACCUEIL';
    
    switch (status) {
      case 'VALIDE':
        statutCreation = 'VALIDEE';
        etapeValidation = etapeOverride || 'REGISSEUR'; // Utilise l'override si fourni, sinon REGISSEUR
        break;
      case 'PAIEMENT_VALIDE':
        statutCreation = 'VALIDEE';
        etapeValidation = 'REVISION'; // Passe à l'étape révision après paiement
        break;
      case 'REJETE':
        statutCreation = 'REFUSEE';
        etapeValidation = 'ACCUEIL'; // Reste à l'accueil
        break;
      case 'INCOMPLET':
        statutCreation = 'EN_ATTENTE';
        etapeValidation = 'ACCUEIL'; // Reste à l'accueil
        break;
      default:
        statutCreation = 'EN_COURS';
        etapeValidation = 'ACCUEIL';
    }
    
    // Extraire le motif de rejet de la note si présent
    let motifRejet = null;
    if (status === 'REJETE' && note && note.includes('Motif:')) {
      motifRejet = note.substring(note.indexOf('Motif:') + 6).trim();
    }
    
    const payload: any = { 
      statutCreation,
      etapeValidation
    };
    
    // Ajouter le motif de rejet si présent, ou le supprimer si on revalide
    if (motifRejet) {
      payload.motifRejet = motifRejet;
    } else if (status !== 'REJETE') {
      // Supprimer le motif de rejet lors de la revalidation
      payload.motifRejet = null;
    }
    
    return api.put(API_ENDPOINTS.ENTREPRISES.UPDATE(id), payload);
  },
  // Mes applications (pour les agents)
  myApplications: () => api.get(API_ENDPOINTS.ENTREPRISES.MY_APPLICATIONS),
  // Assignation des demandes
  assign: (id: string | number, agentId?: string) => 
    api.patch(API_ENDPOINTS.ENTREPRISES.ASSIGN(id), { agentId: agentId || null }),
  unassign: (id: string | number) => 
    api.patch(API_ENDPOINTS.ENTREPRISES.UNASSIGN(id)),
  // Mes demandes assignées
  assignedToMe: (params: Record<string, any> = {}) => 
    api.get(API_ENDPOINTS.ENTREPRISES.ASSIGNED_TO_ME, { params }),
  // Entreprises par étape de validation
  getByEtape: (etape: string, params: Record<string, any> = {}) => 
    api.get(API_ENDPOINTS.ENTREPRISES.BY_ETAPE(etape), { params }),
  // Documents d'une entreprise
  getDocuments: (entrepriseId: string) => 
    api.get(API_ENDPOINTS.ENTREPRISES.DOCUMENTS(entrepriseId)),
};

// Enums API - Récupération des énumérations
const enumsAPI = {
  // Récupérer la liste des pays d'émission RCCM
  getPaysEmissionRccm: () => api.get(API_ENDPOINTS.ENUMS.PAYS_EMISSION_RCCM),
  // Récupérer la liste des domaines d'activité non réglementés
  getDomaineActivitesNr: () => api.get(API_ENDPOINTS.ENUMS.DOMAINE_ACTIVITES_NR),
};

// NINA API - Génération des numéros NINA INSTAT Mali
const ninaAPI = {
  // Test ultra simple
  ping: () => api.get('/nina/ping'),
  
  // Test simple du contrôleur
  testController: () => api.get('/nina/test'),
  
  // Test sans authentification
  testNoAuth: (entrepriseId: string, rccm: string) => 
    api.post(`/nina/test-no-auth/${entrepriseId}?rccm=${encodeURIComponent(rccm)}`, {}),
  
  // Test de génération sans service
  testGenerate: (entrepriseId: string, rccm: string) => 
    api.post(`/nina/test-generate/${entrepriseId}?rccm=${encodeURIComponent(rccm)}`, {}),
  
  // Générer un numéro NINA pour une entreprise
  generateNina: (entrepriseId: string, rccm: string) => 
    api.post(`/nina/generate/${entrepriseId}?rccm=${encodeURIComponent(rccm)}`, {}),
  
  // Récupérer le NINA d'une entreprise
  getNinaByEntreprise: (entrepriseId: string) => 
    api.get(`/nina/entreprise/${entrepriseId}`),
  
  // Générer le certificat NINA en PDF
  generateCertificate: (entrepriseId: string) => 
    api.get(`/nina/certificate/${entrepriseId}`, { responseType: 'blob' }),
};

// Chat API - Système de messagerie agent-utilisateur
const chatAPI = {
  // Conversations
  createConversation: (data: {
    entrepriseId: string;
    userId: string;
    subject: string;
    initialMessage: string;
    priority?: string;
  }) => api.post(API_ENDPOINTS.CHAT.CONVERSATIONS, data),
  
  getAgentConversations: (params: { page?: number; size?: number } = {}) =>
    api.get(API_ENDPOINTS.CHAT.AGENT_CONVERSATIONS, { params }),
  
  getConversation: (conversationId: string) =>
    api.get(API_ENDPOINTS.CHAT.CONVERSATION_DETAIL(conversationId)),
  
  // Messages
  sendMessage: (conversationId: string, data: {
    content: string;
    messageType?: string;
    documentName?: string;
    documentUrl?: string;
  }) => api.post(API_ENDPOINTS.CHAT.SEND_MESSAGE(conversationId), data),
  
  // Actions
  markAsRead: (conversationId: string) =>
    api.patch(API_ENDPOINTS.CHAT.MARK_AS_READ(conversationId)),
  
  closeConversation: (conversationId: string) =>
    api.patch(API_ENDPOINTS.CHAT.CLOSE_CONVERSATION(conversationId)),
  
  // Statistiques
  getUnreadCount: () => api.get(API_ENDPOINTS.CHAT.UNREAD_COUNT),
  
  // Démarrer conversation depuis entreprise
  startFromEntreprise: (entrepriseId: string, data: {
    userId: string;
    subject?: string;
    message: string;
  }) => api.post(API_ENDPOINTS.CHAT.START_FROM_ENTREPRISE(entrepriseId), data),
};

// Paiements API - Gestion des paiements
const paiementsAPI = {
  // Créer un nouveau paiement
  create: (paiementData: {
    entrepriseId: string;
    montant: number;
    typePaiement: string;
    referenceTransaction: string;
    description?: string;
    numeroTelephone?: string;
    numeroCompte?: string;
  }) => api.post(API_ENDPOINTS.PAIEMENTS.CREATE, paiementData),
  
  // Liste des paiements
  list: (params: Record<string, any> = {}) => api.get(API_ENDPOINTS.PAIEMENTS.LIST, { params }),
  
  // Détail d'un paiement
  getById: (id: string | number) => api.get(API_ENDPOINTS.PAIEMENTS.DETAIL(id)),
  
  // Paiements d'une entreprise
  getByEntreprise: (entrepriseId: string | number) => api.get(API_ENDPOINTS.PAIEMENTS.BY_ENTREPRISE(entrepriseId)),
  
  // Paiements confirmés
  getConfirmes: () => api.get(API_ENDPOINTS.PAIEMENTS.CONFIRMES),
};

// Create the main API client object with all modules
const apiClient = Object.freeze({
  agentBusinessAPI,
  healthAPI,
  agentAuthAPI,
  notificationsAPI,
  entreprisesAPI,
  enumsAPI,
  ninaAPI,
  chatAPI,
  paiementsAPI,
});

// Export the API client as default (with proper typing)
export default apiClient;

// Export individual modules for direct import when needed
export { agentAuthAPI, agentBusinessAPI, healthAPI, notificationsAPI, entreprisesAPI, enumsAPI, ninaAPI, chatAPI, paiementsAPI };

// Export the raw axios instance for direct usage
export { api as axiosInstance };
