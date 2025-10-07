// Service API pour InvestMali - Interface Utilisateur
// Configuration de base
// Utiliser le proxy CRA (voir package.json -> "proxy": "http://localhost:8080")
// Laisser la base SANS "/api/v1" car les endpoints incluent déjà "/api/v1" (ex: personService.BASE)
// Si REACT_APP_API_URL est définie, elle doit être du type "http://host:port" sans suffixe d'API.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Fonction utilitaire pour faire des requêtes fetch
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
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

// Enums API
export const enumsAPI = {
  getSocieteJuridictions: async () => {
    try {
      const response = await apiRequest('/api/v1/enums/forme-juridique');
      return response;
    } catch (error) {
      throw error;
    }
  },
  getTypeEntreprises: async () => {
    try {
      const response = await apiRequest('/api/v1/enums/type-entreprise');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Services d'authentification
export const authAPI = {
  // Inscription utilisateur
  register: async (userData) => {
    try {
      // Mapper les champs frontend vers les champs backend
      const backendData = {
        nom: userData.lastName,
        prenom: userData.firstName,
        civilite: userData.civility,
        sexe: userData.sexe,
        email: userData.email,
        telephone1: userData.phone,
        motdepasse: userData.password
      };
      
      const response = await apiRequest('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });
      // Backend renvoie un LoginResponse avec token, personne_id, nom, prenom, etc.
      if (response && (response.personne_id || response.token)) {
        // Inscription réussie, ne pas sauvegarder automatiquement
        // L'utilisateur devra se connecter manuellement
        return { success: true, data: { user: response } };
      }
      return { success: false, message: 'Réponse inattendue du serveur' };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur lors de l\'inscription' };
    }
  },

  // Connexion utilisateur
  login: async (credentials) => {
    try {
      const loginData = {
        email: credentials.email,
        motdepasse: credentials.password // Mapper 'password' vers 'motdepasse' pour le backend
      };
      
      const response = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      // Backend renvoie { token: '...', user: {...} }
      if (response && response.token) {
        const token = response.token;
        localStorage.setItem('token', token);
        // Stocker les informations complètes de l'utilisateur retournées par le backend
        // S'assurer que personne_id est inclus dans les données utilisateur
        const user = {
          email: response.email || credentials.email,
          nom: response.nom,
          prenom: response.prenom,
          personne_id: response.personne_id,
          role: response.role,
          utilisateur: response.utilisateur,
          telephone: response.telephone1 || response.telephone || ''
        };
        console.log('🔍 Données utilisateur reçues du backend:', user);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, data: { token, user } };
      }
      return { success: false, message: 'Identifiants invalides' };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur lors de la connexion' };
    }
  },

  // Récupérer le profil utilisateur
  getProfile: async () => {
    try {
      console.log('🔄 API: Appel getProfile...');
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, message: 'Non authentifié' };
      }
      // Si aucun endpoint backend n'existe, on renvoie l'utilisateur du localStorage
      const user = authAPI.getCurrentUser();
      if (user) {
        return { success: true, data: { user } };
      }
      // Si un jour un endpoint /auth/profile est dispo, on pourra décommenter:
      // const response = await apiRequest('/api/v1/auth/profile');
      // return response.success ? response : { success: true, data: { user: response } };
      return { success: false, message: 'Profil indisponible' };
    } catch (error) {
      console.error('❌ API: Erreur getProfile:', error);
      return { success: false, message: error.message || 'Erreur profil' };
    }
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (profileData) => {
    try {
      const response = await apiRequest('/api/v1/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      // Mettre à jour les infos utilisateur en local
      if (response.success && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Récupérer les informations d'une personne par ID
  getPersonById: async (personneId) => {
    try {
      const response = await apiRequest(`/api/v1/persons/${personneId}`, {
        method: 'GET',
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ API: Erreur getPersonById:', error);
      return { success: false, message: error.message || 'Erreur lors de la récupération des informations de la personne' };
    }
  },
};

// Services des demandes d'entreprise
export const businessAPI = {
  // Créer une nouvelle demande
  createApplication: async (applicationData) => {
    try {
      const response = await apiRequest('/api/v1/business/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Créer une nouvelle demande en multipart (payload JSON + fichiers)
  createApplicationMultipart: async (formData) => {
    try {
      const response = await apiRequest('/api/v1/business/applications/multipart', {
        method: 'POST',
        body: formData,
        headers: {}, // laisser le navigateur définir le Content-Type pour FormData
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer toutes les demandes de l'utilisateur
  getMyApplications: async () => {
    try {
      const response = await apiRequest('/api/v1/entreprises/my-applications');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer une demande spécifique
  getApplication: async (applicationId) => {
    try {
      const response = await apiRequest(`/api/v1/entreprises/${applicationId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mettre à jour une demande
  updateApplication: async (applicationId, updateData) => {
    try {
      const response = await apiRequest(`/api/v1/entreprises/${applicationId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Supprimer une demande
  deleteApplication: async (applicationId) => {
    try {
      const response = await apiRequest(`/api/v1/entreprises/${applicationId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer les statistiques utilisateur
  getStats: async () => {
    try {
      const response = await apiRequest('/api/v1/business/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Services d'upload de fichiers
export const uploadAPI = {
  // Upload d'un document
  uploadDocument: async (applicationId, documentType, file, documentCategory = null) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      
      if (documentCategory !== null) {
        formData.append('documentCategory', documentCategory);
      }

      const response = await apiRequest(`/api/v1/upload/document/${applicationId}`, {
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

      const response = await apiRequest(`/api/v1/upload/documents/${applicationId}`, {
        method: 'POST',
        body: formData,
        headers: {}, // Laisser le navigateur définir Content-Type pour FormData
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Supprimer un document
  deleteDocument: async (applicationId, documentType, documentCategory = null) => {
    try {
      let url = `/api/v1/upload/document/${applicationId}/${documentType}`;
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
  },

  // Télécharger un document
  downloadDocument: async (applicationId, documentType, documentCategory = null) => {
    try {
      let url = `/api/v1/upload/document/${applicationId}/${documentType}/download`;
      if (documentCategory !== null) {
        url += `?documentCategory=${documentCategory}`;
      }

      // Pour les téléchargements, on utilise fetch directement
      const token = localStorage.getItem('token');
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
  }
};

// Service de santé de l'API
export const healthAPI = {
  // Vérifier l'état de l'API
  checkHealth: async () => {
    try {
      const response = await apiRequest('/api/v1/health');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Utilitaires
export const apiUtils = {
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
      immatriculation: 7000,
      service: 3000,
      publication: 2000
    };

    let additionalPartners = 0;
    if (applicationData.businessType === 'SOCIETE' && applicationData.partners) {
      // Coût supplémentaire pour chaque associé au-delà du premier
      additionalPartners = Math.max(0, applicationData.partners.length - 1) * 2500;
    }

    const total = baseCosts.immatriculation + baseCosts.service + baseCosts.publication + additionalPartners;

    return {
      ...baseCosts,
      additionalPartners,
      total
    };
  }
};

// API de création d'entreprise
export const createEntreprise = async (entrepriseData) => {
  try {
    const response = await apiRequest('/api/v1/entreprises', {
      method: 'POST',
      body: JSON.stringify(entrepriseData),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// API de chat pour les utilisateurs
export const chatAPI = {
  // Démarrer une conversation avec un agent
  startConversation: async (message, subject = "Demande d'assistance", userId = null) => {
    try {
      // Vérifier que userId est fourni
      if (!userId) {
        throw new Error('userId est requis pour démarrer une conversation');
      }

      console.log('📤 Démarrage conversation avec userId:', userId);

      const response = await apiRequest('/api/v1/chat/conversations/start-user', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          message: message,
          subject: subject
        }),
      });
      return response;
    } catch (error) {
      console.error('Erreur lors du démarrage de la conversation:', error);
      throw error;
    }
  },

  // Récupérer une conversation
  getConversation: async (conversationId) => {
    try {
      const response = await apiRequest(`/api/v1/chat/conversations/${conversationId}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation:', error);
      throw error;
    }
  },

  // Envoyer un message
  sendMessage: async (conversationId, content, senderId) => {
    try {
      const response = await apiRequest(`/api/v1/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: content,
          senderId: senderId
        }),
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  },

  // Marquer une conversation comme lue
  markAsRead: async (conversationId) => {
    try {
      const response = await apiRequest(`/api/v1/chat/conversations/${conversationId}/read`, {
        method: 'PATCH',
      });
      return response;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  },

  // Récupérer les conversations de l'utilisateur
  getUserConversations: async () => {
    try {
      const response = await apiRequest('/api/v1/chat/conversations/user', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      throw error;
    }
  }
};

export default { authAPI, businessAPI, uploadAPI, healthAPI, apiUtils, enumsAPI, createEntreprise, chatAPI };
