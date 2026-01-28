// Service API pour InvestMali - Interface Utilisateur
// Configuration centralisée avec variables d'environnement
import { 
  API_CONFIG, 
  API_ENDPOINTS, 
  AUTH_CONFIG, 
  buildApiUrl, 
  getHeaders, 
  handleAuthError, 
  createApiRequest 
} from '../config/api.config';

// Utiliser la configuration centralisée
const API_BASE_URL = API_CONFIG.BASE_URL;

// Utiliser la fonction apiRequest centralisée
export const apiRequest = createApiRequest();

// Enums API
export const enumsAPI = {
  getSocieteJuridictions: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENUMS.FORME_JURIDIQUE);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getTypeEntreprises: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENUMS.TYPE_ENTREPRISE);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getDomaineActivites: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENUMS.DOMAINE_ACTIVITES);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getDomaineActivitesNr: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENUMS.DOMAINE_ACTIVITES_NR);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getNationalites: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENUMS.NATIONALITES);
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
      
      const response = await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
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
      
      const response = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
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
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
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
      if (API_CONFIG.DEBUG) {
            }
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
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
      const response = await apiRequest(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      // Mettre à jour les infos utilisateur en local
      if (response.success && response.data.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    window.location.href = '/';
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const user = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return !!(token && user);
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: () => {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Récupérer les informations d'une personne par ID
  getPersonById: async (personneId) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.PERSONS.GET_BY_ID(personneId), {
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
      const response = await apiRequest(API_ENDPOINTS.BUSINESS.APPLICATIONS, {
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
      const response = await apiRequest(API_ENDPOINTS.BUSINESS.APPLICATIONS_MULTIPART, {
        method: 'POST',
        body: formData,
        headers: {}, // laisser le navigateur définir le Content-Type pour FormData
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer UNIQUEMENT les entreprises normales de l'utilisateur
  getMyApplications: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENTREPRISES.MY_APPLICATIONS);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer UNIQUEMENT les demandes d'agrément de l'utilisateur
  getMyInvestmentApplications: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENTREPRISES.MY_INVESTMENT_APPLICATIONS);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Récupérer une demande spécifique
  getApplication: async (applicationId) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENTREPRISES.DETAIL(applicationId));
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mettre à jour une demande
  updateApplication: async (applicationId, updateData) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.ENTREPRISES.UPDATE(applicationId), {
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
      const response = await apiRequest(API_ENDPOINTS.ENTREPRISES.DELETE(applicationId), {
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
      const response = await apiRequest(API_ENDPOINTS.BUSINESS.STATS);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Soumettre une demande d'agrément d'investissement
  submitInvestmentAgreement: async (agreementData, documents = {}) => {
    try {
      const formData = new FormData();
      
      // Ajouter les données JSON
      formData.append('data', JSON.stringify(agreementData));
      console.log('🔍 [DEBUG] Données JSON ajoutées à FormData');
      
      // Ajouter tous les documents s'ils existent
      Object.keys(documents).forEach(key => {
        if (documents[key]) {
          formData.append(key, documents[key]);
          console.log('🔍 [DEBUG] Document ajouté:', key, documents[key].name);
        }
      });
      
      console.log('🔍 [DEBUG] FormData prêt pour envoi');
      
      const response = await apiRequest('/investment-agreements', {
        method: 'POST',
        body: formData
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: error.message };
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

      const response = await apiRequest(API_ENDPOINTS.UPLOAD.DOCUMENT(applicationId), {
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

      const response = await apiRequest(API_ENDPOINTS.UPLOAD.DOCUMENTS(applicationId), {
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
      const url = API_ENDPOINTS.UPLOAD.DELETE_DOCUMENT(applicationId, documentType, documentCategory);
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
      const url = API_ENDPOINTS.UPLOAD.DOWNLOAD(applicationId, documentType, documentCategory);
      
      // Pour les téléchargements, on utilise fetch directement
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const response = await fetch(buildApiUrl(url), {
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
      const response = await apiRequest(API_ENDPOINTS.HEALTH);
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
    // Pour les entreprises individuelles, logique spécifique basée sur les réponses aux questions
    if (applicationData.businessType === 'Individuelle') {
      const requiresAuthorization = applicationData.requiresExerciseAuthorization;
      const willImportExport = applicationData.willImportExport;
      
      // 180 FCFA si autorisation d'exercice OU import/export, sinon 100 FCFA
      const total = (requiresAuthorization || willImportExport) ? 180 : 100;
      
      return {
        immatriculation: total,
        service: 0,
        publication: 0,
        additionalPartners: 0,
        total
      };
    }

    // Pour les sociétés, logique existante
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
    const response = await apiRequest(API_ENDPOINTS.ENTREPRISES.CREATE, {
      method: 'POST',
      body: JSON.stringify(entrepriseData),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// API de chat pour les utilisateurs - ✅ NOUVEAU : Logique mise à jour
export const chatAPI = {
  // Démarrer une conversation avec un agent
  startConversation: async (message, subject = "Demande d'assistance", userId = null, entrepriseId = null) => {
    try {
      // Vérifier que userId est fourni
      if (!userId) {
        throw new Error('userId est requis pour démarrer une conversation');
      }

      if (API_CONFIG.DEBUG) {
        console.log('📤 Démarrage conversation avec userId:', userId, 'entrepriseId:', entrepriseId);
      }

      const response = await apiRequest(API_ENDPOINTS.CHAT.START_CONVERSATION, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          entreprise_id: entrepriseId || "default-entreprise",
          initial_message: message
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
      const response = await apiRequest(API_ENDPOINTS.CHAT.GET_CONVERSATION(conversationId), {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation:', error);
      throw error;
    }
  },

  // Envoyer un message - ✅ NOUVEAU : Paramètres mis à jour
  sendMessage: async (conversationId, content, senderId) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.CHAT.SEND_MESSAGE(conversationId), {
        method: 'POST',
        body: JSON.stringify({
          sender_type: "user",
          sender_id: senderId,
          content: content
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
      const response = await apiRequest(API_ENDPOINTS.CHAT.MARK_AS_READ(conversationId), {
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
      const response = await apiRequest(API_ENDPOINTS.CHAT.USER_CONVERSATIONS, {
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
