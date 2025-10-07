import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Normalize base URL from env to ensure it doesn't include unwanted "/agent" suffix
const rawBaseURL = process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8080/api/v1';
const baseURL = (() => {
  try {
    let url = rawBaseURL.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    // Replace '/api/agent' (or trailing '/agent') with '/api'
    url = url.replace(/\/api\/agent$/i, '/api').replace(/\/agent$/i, '');
    return url;
  } catch {
    return 'http://localhost:8080/api/v1';
  }
})();

// Debug: show which baseURL is used at runtime
// eslint-disable-next-line no-console
console.log('Agent API baseURL:', baseURL);

// Create axios instance with proper typing
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('investmali_agent_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response interceptor error:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('investmali_agent_token');
      localStorage.removeItem('investmali_agent');
      window.location.href = '/agent-login';
    }
    return Promise.reject(error);
  }
);

// API Modules
const agentBusinessAPI = {
  // Applications list with filters/sort/pagination (Agent endpoints)
  listApplications: (params: Record<string, any> = {}) => api.get('/agent/applications', { params }),
  // Backward-compat alias used by legacy components/tests
  getApplications: (queryParams: Record<string, any> = {}) => api.get('/agent/applications', { params: queryParams }),
  // Single application detail
  getApplication: (id: string | number) => api.get(`/agent/applications/${id}`),
  // Partial update (priority, agent_notes, payment_status, costs)
  updateApplication: (id: string | number, patch: Partial<Record<string, any>>) => api.patch(`/agent/applications/${id}`, patch),
  // Assign to current agent or unassign depending on backend contract
  assignApplication: (id: string | number, assignToMe = true) => api.patch(`/agent/applications/${id}/assign`, { assignToMe }),
  // Update status with optional note
  updateStatus: (id: string | number, status: string, note?: string) => api.patch(`/agent/applications/${id}/status`, { status, note }),
  // Aggregated stats for KPI cards
  getStats: () => api.get('/agent/stats'),
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
    const configuredPath = process.env.REACT_APP_CREATE_CLIENT_APP_PATH?.trim();
    const candidates = [
      // Highest priority: explicit env path(s)
      ...(configuredPath ? configuredPath.split(',').map(p => p.trim()).filter(Boolean) : []),
      // Agent-first common paths
      '/agent/applications/client-application',
      '/agent/applications',
      '/agent/client-applications',
      '/agent/business/client-application',
      // Non-agent common paths
      '/applications/client-application',
      '/applications',
      '/client-applications',
      '/business/client-application',
    ];
    let lastErr: any;
    const tried: { path: string; status?: number }[] = [];
    for (const path of candidates) {
      try {
        // eslint-disable-next-line no-console
        console.log('[API] Trying create path:', path);
        const res = await api.post(path, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res;
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        // eslint-disable-next-line no-console
        console.warn('[API] Create path failed', path, 'status =', status);
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
        // eslint-disable-next-line no-console
        console.log('[API] Trying create path:', path, 'mode =', mode);
        const res = isJson
          ? await api.post(path, payload)
          : await api.post(path, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res;
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        // eslint-disable-next-line no-console
        console.warn('[API] Create path failed', path, 'mode =', mode, 'status =', status);
        tried.push({ path, status, mode });
        if (status && status !== 404) break; // stop on non-404 errors
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
  checkHealth: () => api.get('/health'),
};

const agentAuthAPI = {
  login: (credentials: { email: string; password: string }) => {
    console.log('=== AGENT LOGIN API CALL ===');
    console.log('Credentials:', { email: credentials.email, password: '***' });
    console.log('Endpoint:', '/auth/login');
    console.log('============================');
    
    return api.post('/auth/login', { 
      email: credentials.email, 
      motdepasse: credentials.password 
    }).then(response => {
      console.log('=== AGENT LOGIN RESPONSE ===');
      console.log('Response data:', response.data);
      console.log('============================');
      return response;
    });
  },
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (patch: Partial<Record<string, any>>) => api.patch('/auth/me', patch),
  uploadAvatar: (file: File | Blob) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/auth/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Notifications (Agent)
const notificationsAPI = {
  list: (params: Record<string, any> = {}) => api.get('/agent/notifications', { params }),
  markRead: (id: string | number) => api.patch(`/agent/notifications/${id}/read`),
  markAllRead: () => api.patch('/agent/notifications/read-all'),
};

// Entreprises API
const entreprisesAPI = {
  // Liste des entreprises avec filtres
  list: (params: Record<string, any> = {}) => api.get('/entreprises', { params }),
  // Liste des entreprises NON ASSIGNÉES (pour éviter les conflits entre agents)
  unassigned: (params: Record<string, any> = {}) => api.get('/entreprises/unassigned', { params }),
  // Détail d'une entreprise
  getById: (id: string | number) => api.get(`/entreprises/${id}`),
  // Mettre à jour une entreprise (utilise PUT avec UpdateEntrepriseRequest)
  update: (id: string | number, updateData: Record<string, any>) => 
    api.put(`/entreprises/${id}`, updateData),
  // Mettre à jour le statut d'une entreprise (utilise l'endpoint update général)
  updateStatus: (id: string | number, status: string, note?: string) => {
    console.log(`Mise à jour du statut de l'entreprise ${id} vers ${status}`);
    
    // Mapper les statuts vers les enums backend
    let statutCreation = '';
    let etapeValidation = 'ACCUEIL';
    
    switch (status) {
      case 'VALIDE':
        statutCreation = 'VALIDEE';
        etapeValidation = 'REGISSEUR'; // Passe à l'étape suivante
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
    
    return api.put(`/entreprises/${id}`, { 
      statutCreation,
      etapeValidation
    });
  },
  // Mes applications (pour les agents)
  myApplications: () => api.get('/entreprises/my-applications'),
  // Assignation des demandes
  assign: (id: string | number, agentId?: string) => 
    api.patch(`/entreprises/${id}/assign`, { agentId: agentId || null }),
  unassign: (id: string | number) => 
    api.patch(`/entreprises/${id}/unassign`),
  // Mes demandes assignées
  assignedToMe: (params: Record<string, any> = {}) => 
    api.get('/entreprises/assigned-to-me', { params }),
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
  }) => api.post('/chat/conversations', data),
  
  getAgentConversations: (params: { page?: number; size?: number } = {}) =>
    api.get('/chat/conversations/agent', { params }),
  
  getConversation: (conversationId: string) =>
    api.get(`/chat/conversations/${conversationId}`),
  
  // Messages
  sendMessage: (conversationId: string, data: {
    content: string;
    messageType?: string;
    documentName?: string;
    documentUrl?: string;
  }) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  
  // Actions
  markAsRead: (conversationId: string) =>
    api.patch(`/chat/conversations/${conversationId}/read`),
  
  closeConversation: (conversationId: string) =>
    api.patch(`/chat/conversations/${conversationId}/close`),
  
  // Statistiques
  getUnreadCount: () => api.get('/chat/unread-count/agent'),
  
  // Démarrer conversation depuis entreprise
  startFromEntreprise: (entrepriseId: string, data: {
    userId: string;
    subject?: string;
    message: string;
  }) => api.post(`/chat/conversations/start-from-entreprise/${entrepriseId}`, data),
};

// Create the main API client with all methods
const apiClient = {
  // Core axios methods
  ...api,
  
  // Authentication methods
  login: agentAuthAPI.login,
  
  // API modules
  agentBusinessAPI,
  healthAPI,
  agentAuthAPI,
  notificationsAPI,
  entreprisesAPI,
  chatAPI,
};

// Export the API client as default
export default apiClient;

// Export individual modules for direct import when needed
export { agentAuthAPI, agentBusinessAPI, healthAPI, notificationsAPI, entreprisesAPI, chatAPI };
