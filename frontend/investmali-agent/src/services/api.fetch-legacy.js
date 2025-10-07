// Service API pour InvestMali - Interface Agent
// Configuration de base
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Fonction utilitaire pour faire des requêtes fetch
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🔍 API Request URL:', url);
  console.log('🔍 API Base URL:', API_BASE_URL);
  console.log('🔍 Endpoint:', endpoint);
  const token = localStorage.getItem('agentToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    // Gestion des erreurs d'authentification
    if (response.status === 401) {
      localStorage.removeItem('agentToken');
      localStorage.removeItem('agent');
      window.location.href = '/login';
      // Création d'une erreur avec un objet Error
      const error = new Error('Non autorisé');
      error.status = 401;
      throw error;
    }
    
    if (!response.ok) {
      const error = new Error(data.message || 'Une erreur est survenue');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error.message && error.status) {
      throw error;
    }
    const connectionError = new Error(error.message || 'Erreur de connexion');
    connectionError.status = 0;
    connectionError.data = null;
    throw connectionError;
  }
};

// Services d'authentification agent
export const agentAuthAPI = {
  // Connexion agent
  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Sauvegarder le token et les infos agent
    if (response.success && response.data.token) {
      localStorage.setItem('agentToken', response.data.token);
      localStorage.setItem('agent', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Récupérer le profil agent
  getProfile: async () => {
    try {
      const response = await apiRequest('/auth/profile');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mettre à jour le profil agent
  updateProfile: async (profileData) => {
    try {
      const response = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      // Mettre à jour les infos agent en local
      if (response.success && response.data.user) {
        localStorage.setItem('agent', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Déconnexion agent
  logout: () => {
    localStorage.removeItem('agentToken');
    localStorage.removeItem('agent');
    window.location.href = '/login';
  },

  // Vérifier si l'agent est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('agentToken');
    const agent = localStorage.getItem('agent');
    return !!(token && agent);
  },

  // Récupérer l'agent actuel
  getCurrentAgent: () => {
    const agentStr = localStorage.getItem('agent');
    return agentStr ? JSON.parse(agentStr) : null;
  }
};

// Services de gestion des demandes pour les agents
export const agentBusinessAPI = {
  // Récupérer toutes les demandes avec filtres
  getApplications: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const url = queryString ? `/agent/applications?${queryString}` : '/agent/applications';
      const response = await apiRequest(url);
      return response;
    } catch (error) {
      // Fallback si les routes agent ne sont pas disponibles
      if (error && error.status === 404) {
        try {
          const response = await apiRequest('/business/applications');
          return response;
        } catch (e) {
          throw e;
        }
      }
      throw error;
    }
  },

  // Récupérer une demande spécifique
  getApplication: async (applicationId) => {
    try {
      const response = await apiRequest(`/agent/applications/${applicationId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Assigner une demande à l'agent connecté
  assignApplication: async (applicationId) => {
    try {
      const response = await apiRequest(`/agent/applications/${applicationId}/assign`, {
        method: 'PATCH',
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mettre à jour le statut d'une demande
  updateStatus: async (applicationId, status, notes = '') => {
    try {
      const response = await apiRequest(`/agent/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Approuver une demande
  approveApplication: async (applicationId, notes = '') => {
    try {
      const response = await apiRequest(`/agent/applications/${applicationId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Rejeter une demande
  rejectApplication: async (applicationId, reason) => {
    try {
      const response = await apiRequest(`/agent/applications/${applicationId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Créer une demande pour un client (agent)
  createApplicationForClient: async (applicationData) => {
    try {
      const response = await apiRequest('/agent/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData),
      });
      return response;
    } catch (error) {
      // Fallback: utiliser l'endpoint générique si la route agent n'existe pas
      if (error && error.status === 404) {
        const enriched = {
          ...applicationData,
          createdBy: 'agent',
        };
        const response = await apiRequest('/business/applications', {
          method: 'POST',
          body: JSON.stringify(enriched),
        });
        return response;
      }
      throw error;
    }
  },

  // Récupérer l'historique des actions de l'agent
  getAgentHistory: async () => {
    try {
      const response = await apiRequest('/agent/history');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer les statistiques pour le dashboard agent
  getStats: async () => {
    try {
      const response = await apiRequest('/agent/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Services d'upload de fichiers pour les agents
export const agentUploadAPI = {
  // Upload d'un document pour une demande
  uploadDocument: async (applicationId, documentType, file, documentCategory = null) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      
      if (documentCategory !== null) {
        formData.append('documentCategory', documentCategory);
      }

      const response = await apiRequest(`/upload/document/${applicationId}`, {
        method: 'POST',
        body: formData,
        headers: {}, // Laisser le navigateur définir Content-Type pour FormData
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Upload de plusieurs documents
  uploadMultipleDocuments: async (applicationId, documents) => {
    try {
      const formData = new FormData();
      const documentTypes = [];

      documents.forEach((doc, index) => {
        formData.append('documents', doc.file);
        documentTypes.push(doc.type);
      });

      formData.append('documentTypes', JSON.stringify(documentTypes));

      const response = await apiRequest(`/upload/documents/${applicationId}`, {
        method: 'POST',
        body: formData,
        headers: {}, // Laisser le navigateur définir Content-Type pour FormData
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Télécharger un document
  downloadDocument: async (applicationId, documentType, documentCategory = null) => {
    try {
      let url = `/upload/document/${applicationId}/${documentType}/download`;
      if (documentCategory !== null) {
        url += `?documentCategory=${documentCategory}`;
      }

      // Pour les téléchargements, on utilise fetch directement
      const token = localStorage.getItem('agentToken');
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      
      return await response.blob();
    } catch (error) {
      throw error;
    }
  },

  // Supprimer un document
  deleteDocument: async (applicationId, documentType, documentCategory = null) => {
    try {
      let url = `/upload/document/${applicationId}/${documentType}`;
      if (documentCategory !== null) {
        url += `?documentCategory=${documentCategory}`;
      }

      const response = await apiRequest(url, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Service de santé de l'API
export const healthAPI = {
  // Vérifier l'état de l'API
  checkHealth: async () => {
    try {
      const response = await apiRequest('/health');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Utilitaires pour les agents
export const agentUtils = {
  // Formater les erreurs pour l'affichage
  formatError: (error) => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    if (error.data && error.data.message) {
      return error.data.message;
    }
    
    return 'Une erreur inattendue est survenue';
  },

  // Vérifier si l'API est accessible
  isApiAvailable: async () => {
    try {
      await healthAPI.checkHealth();
      return true;
    } catch (error) {
      return false;
    }
  },

  // Calculer les coûts d'une demande
  calculateCosts: (applicationData) => {
    const baseCosts = {
      immatriculation: 25000,
      service: 15000,
      publication: 10000
    };

    let additionalPartners = 0;
    if (applicationData.businessType === 'Société' && applicationData.partners) {
      // Coût supplémentaire pour chaque associé au-delà du premier
      additionalPartners = Math.max(0, applicationData.partners.length - 1) * 2500;
    }

    const total = baseCosts.immatriculation + baseCosts.service + baseCosts.publication + additionalPartners;

    return {
      ...baseCosts,
      additionalPartners,
      total
    };
  },

  // Formater le statut pour l'affichage
  formatStatus: (status) => {
    const statusMap = {
      'pending_validation': 'En attente de validation',
      'in_review': 'En cours de révision',
      'approved': 'Approuvée',
      'rejected': 'Rejetée',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    
    return statusMap[status] || status;
  },

  // Formater la priorité pour l'affichage
  formatPriority: (priority) => {
    const priorityMap = {
      'low': 'Faible',
      'medium': 'Moyenne',
      'high': 'Élevée',
      'urgent': 'Urgente'
    };
    
    return priorityMap[priority] || priority;
  },

  // Obtenir la couleur du statut
  getStatusColor: (status) => {
    const colorMap = {
      'pending_validation': 'yellow',
      'in_review': 'blue',
      'approved': 'green',
      'rejected': 'red',
      'completed': 'green',
      'cancelled': 'gray'
    };
    
    return colorMap[status] || 'gray';
  },

  // Obtenir la couleur de la priorité
  getPriorityColor: (priority) => {
    const colorMap = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'orange',
      'urgent': 'red'
    };
    
    return colorMap[priority] || 'gray';
  }
};

const apiServices = { agentAuthAPI, agentBusinessAPI, agentUploadAPI, healthAPI, agentUtils };

export default apiServices;
