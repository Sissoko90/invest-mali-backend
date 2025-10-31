<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import DocumentViewer from './DocumentViewer';
import AnimatedBackground from './AnimatedBackground';
import Header from './Header';
import { businessAPI, apiUtils, enumsAPI, chatAPI, apiRequest } from '../services/api';
import { divisionService } from '../services/divisionService';
import UserChatModal from './UserChatModal';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import PaymentMethodModal from './PaymentMethodModal';
import { API_CONFIG } from '../config/api.config';
import { useNavigate } from 'react-router-dom';
import DivisionSearchInput from './DivisionSearchInput';
import PaymentReceipt from './PaymentReceipt';
import { generateUnpaidReceiptData } from '../services/receiptService';

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedDuration: string;
  completedAt?: string;
  details?: string;
}

interface BusinessApplication {
  id: string;
  companyName: string;
  businessName?: string;
  legalForm: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  submittedAt: string;
  totalAmount: number;
  currentStep?: string;
  overallProgress: number;
  estimatedCompletion: string;
  steps: TrackingStep[];
}

const stageProgressMap: Record<string, number> = {
  ACCUEIL: 12.5,
  REGISSEUR: 25,
  REVISION: 37.5,
  IMPOT: 50,
  RCCM1: 62.5,
  TCOM: 75,
  RCCM2: 87.5,
  NINA: 93.75,
  RETRAIT: 100,
};

const stageOrder: string[] = [
  'ACCUEIL',
  'REGISSEUR',
  'REVISION',
  'IMPOT',
  'RCCM1',
  'TCOM',
  'RCCM2',
  'NINA',
  'RETRAIT'
];

const normalizeStage = (stage?: string): string => {
  if (!stage) return 'ACCUEIL';
  const upper = stage.toString().trim().toUpperCase();
  switch (upper) {
    case 'IMPOTS':
    case 'IMPÔTS':
      return 'IMPOT';
    case 'ACCUEIL':
    case 'REGISSEUR':
    case 'REVISION':
    case 'IMPOT':
    case 'RCCM1':
    case 'TCOM':
    case 'RCCM2':
    case 'NINA':
    case 'RETRAIT':
      return upper;
    default:
      return upper;
  }
};

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'messages' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // États pour les conversations et messages
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  
  // États pour le système de paiement
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEntrepriseForPayment, setSelectedEntrepriseForPayment] = useState<string>('');
  const [selectedEntrepriseAmount, setSelectedEntrepriseAmount] = useState<number>(0);
  
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  
  // Hook pour les notifications (utiliser la première entreprise ou une valeur par défaut)
  const firstEntrepriseId = applications.length > 0 ? applications[0].id : "default-entreprise";
  const { unreadCount, resetUnreadCount } = useNotifications(firstEntrepriseId);
  
  // Compteur de notifications
  useEffect(() => {
    // Notification count updated
  }, [unreadCount]);
  
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  // Détails par demande (chargés à l'ouverture du suivi détaillé)
  const [appDetails, setAppDetails] = useState<Record<string, any>>({});
  const [appDetailsLoading, setAppDetailsLoading] = useState<Record<string, boolean>>({});
  const [appDetailsError, setAppDetailsError] = useState<Record<string, string | null>>({});
  const [appDetailsSuccess, setAppDetailsSuccess] = useState<Record<string, string | null>>({});
  const [appEditMode, setAppEditMode] = useState<Record<string, boolean>>({});
  const [appEditData, setAppEditData] = useState<Record<string, any>>({});
  // États pour l'édition des données des étapes
  const [stepDataEditMode, setStepDataEditMode] = useState<Record<string, boolean>>({});
  // État pour l'édition des participants individuels
  const [participantEditMode, setParticipantEditMode] = useState<Record<string, boolean>>({});
  // États pour les documents de l'entreprise
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [documentsLoading, setDocumentsLoading] = useState<Record<string, boolean>>({});
  const [documentsError, setDocumentsError] = useState<Record<string, string | null>>({});
  // États pour le remplacement de documents
  const [documentReplaceMode, setDocumentReplaceMode] = useState<Record<string, boolean>>({});
  const [documentUploadLoading, setDocumentUploadLoading] = useState<Record<string, boolean>>({});
  // État pour la confirmation de suppression
  const [documentDeleteConfirm, setDocumentDeleteConfirm] = useState<string | null>(null);
  // État pour tracker les téléchargements de documents par entreprise
  const [downloadedDocuments, setDownloadedDocuments] = useState<Record<string, { rccm: boolean; nina: boolean }>>({});
  // États pour le reçu
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  // Toasts globaux
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; text: string }>>([]);
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Options dynamiques depuis backend (fallback vides)
  const [legalFormOptions, setLegalFormOptions] = useState<string[]>([]);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<string[]>([]);
  const [domaineActiviteOptions, setDomaineActiviteOptions] = useState<Array<{key: string, value: string}>>([]);
  const [domaineActiviteNrOptions, setDomaineActiviteNrOptions] = useState<Array<{key: string, value: string}>>([]);
  // Cache pour les divisions (éviter rechargements)
  const [divisionsCache, setDivisionsCache] = useState<Record<string, any>>({});

  // Ouvrir l'onglet ciblé via query param: /profile?tab=applications
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'profile' || tab === 'applications' || tab === 'settings') {
      setActiveTab(tab as any);
    }
  }, []);

  // Charger les enums pour les selects
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const [forms, types, domaines, domainesNr] = await Promise.all([
          enumsAPI.getSocieteJuridictions(),
          enumsAPI.getTypeEntreprises(),
          enumsAPI.getDomaineActivites(),
          enumsAPI.getDomaineActivitesNr()
        ]);
        // Enums reçus du backend
        
        // Traiter les formes juridiques - extraire les labels si ce sont des objets
        const processedForms = Array.isArray(forms) ? forms.map((form, index) => {
          if (typeof form === 'object' && form !== null) {
            return form.label || form.value || form.key || String(form);
          }
          return String(form);
        }) : [];
        
        // Traiter les types d'entreprise - extraire les labels si ce sont des objets  
        const processedTypes = Array.isArray(types) ? types.map((type, index) => {
          if (typeof type === 'object' && type !== null) {
            return type.label || type.value || type.key || String(type);
          }
          return String(type);
        }) : [];
        
        // Traiter les domaines d'activité - garder la structure {key, value}
        const processedDomaines = Array.isArray(domaines) ? domaines.map((domaine, index) => {
          if (typeof domaine === 'object' && domaine !== null) {
            return {
              key: domaine.key || domaine.name || String(domaine),
              value: domaine.value || domaine.label || String(domaine)
            };
          }
          return { key: String(domaine), value: String(domaine) };
        }) : [];
        
        // Traiter les domaines d'activité non réglementés - garder la structure {key, value}
        const processedDomainesNr = Array.isArray(domainesNr) ? domainesNr.map((domaine, index) => {
          if (typeof domaine === 'object' && domaine !== null) {
            return {
              key: domaine.key || domaine.name || String(domaine),
              value: domaine.value || domaine.label || String(domaine)
            };
          }
          return { key: String(domaine), value: String(domaine) };
        }) : [];
        
        
        setLegalFormOptions(processedForms);
        setBusinessTypeOptions(processedTypes);
        setDomaineActiviteOptions(processedDomaines);
        setDomaineActiviteNrOptions(processedDomainesNr);
      } catch (e) {
        // En cas d'erreur, laisser les listes vides, l'utilisateur pourra saisir manuellement si nécessaire
        console.warn('Impossible de charger les enums', e);
      }
    };
    loadEnums();
  }, []);

  // Avertir en cas de navigation avec edition en cours
  useEffect(() => {
    const hasEditing = Object.values(appEditMode).some(Boolean);
    const handler = (e: BeforeUnloadEvent) => {
      if (hasEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [appEditMode]);

  useEffect(() => {
    const load = async (silent = false) => {
      if (!user) return;
      if (!silent) {
        setAppsLoading(true);
      }
      setAppsError(null);
      try {
        const resp = await businessAPI.getMyApplications();
        // resp peut être un array ou un objet avec data; on gère les deux cas
        const list = Array.isArray(resp) ? resp : (resp?.data ?? []);
        const mapped: BusinessApplication[] = (list || []).map((a: any) => {
          // Données reçues du backend
          
          // Normalisations prudentes selon l'entité backend
          const statusRaw = (a.statutCreation || a.status || '').toString().toLowerCase();
          const totalAmount = Number(a.totalAmount ?? a.totalCost ?? a.total ?? a.amount ?? 0) || 0;
          const submittedAt = a.creation || a.createdAt || a.submittedAt || new Date().toISOString();
          // Fin estimée par défaut: +48h après la soumission si non fournie par l'API
          const estimatedCompletionCalculated = (() => {
            try {
              const base = new Date(submittedAt);
              if (isNaN(base.getTime())) return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
              return new Date(base.getTime() + 48 * 60 * 60 * 1000).toISOString();
            } catch {
              return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
            }
          })();
          const backendStage = a.etapeValidation || a.etape_validation || a.currentStep;
          const currentStep = normalizeStage(backendStage);
          const overallProgress = stageProgressMap[currentStep] ?? stageProgressMap.ACCUEIL;
          
          // Déterminer le status basé sur l'étape agent actuelle
          const status: BusinessApplication['status'] = 
            currentStep === 'RETRAIT' ? 'completed' :
            statusRaw.includes('reject') ? 'rejected' :
            'in-progress';
          return {
            id: String(a.id ?? a.applicationId ?? ''),
            companyName: a.nom || a.businessName || a.business_name || a.companyName || a.entrepriseName || '',
            businessName: a.nom || a.businessName || a.business_name || a.companyName || a.entrepriseName || '',
            legalForm: a.formeJuridique || a.legalForm || '—',
            status,
            submittedAt: a.creation || a.createdAt || a.submittedAt || new Date().toISOString(),
            totalAmount,
            currentStep,
            overallProgress,
            estimatedCompletion: a.estimatedCompletion || estimatedCompletionCalculated,
            steps: Array.isArray(a.steps) ? a.steps : [],
          };
        });
        setApplications(mapped);
        
        // Pré-remplir appDetails avec les données d'étape disponibles
        const initialAppDetails: Record<string, any> = {};
        list.forEach((a: any) => {
          if (a.id) {
            initialAppDetails[a.id] = {
              etapeValidation: a.etapeValidation || a.etape_validation,
              // Ajouter d'autres champs utiles si disponibles
              nom: a.nom || a.name,
              formeJuridique: a.formeJuridique || a.legalForm,
              // Garder les données originales pour référence
              ...a
            };
          }
        });
        setAppDetails(prev => ({ ...prev, ...initialAppDetails }));
        
        // Charger l'état des téléchargements depuis la base de données
        const downloadStates: Record<string, { rccm: boolean; nina: boolean }> = {};
        list.forEach((a: any) => {
          if (a.id) {
            downloadStates[a.id] = {
              rccm: a.rccmTelecharge || false,
              nina: a.ninaTelecharge || false
            };
          }
        });
        setDownloadedDocuments(downloadStates);
        
      } catch (err) {
        setAppsError(apiUtils.formatError(err));
        setApplications([]);
      } finally {
        if (!silent) {
          setAppsLoading(false);
        }
      }
    };
    
    // Chargement initial
    load();
    
    // Rafraîchissement automatique toutes les 30 secondes
    const refreshInterval = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique de l\'état des dossiers...');
      load(true); // silent = true pour ne pas afficher le loader
    }, 3000); // 30 secondes
    
    // Nettoyage à la destruction du composant
    return () => clearInterval(refreshInterval);
  }, [user]);

  const loadApplicationDetails = async (id: string, forceReload = false) => {
    // Eviter rechargements inutiles - seulement si déjà en cours de chargement
    if (appDetailsLoading[id]) return;
    
    // Si forceReload, vider le cache pour cette application
    if (forceReload) {
      setAppDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[id];
        return newDetails;
      });
    }
    
    setAppDetailsLoading(prev => ({ ...prev, [id]: true }));
    setAppDetailsError(prev => ({ ...prev, [id]: null }));
    try {
      const resp = await businessAPI.getApplication(id);
      const data = (resp && resp.data) ? resp.data : resp;
      // Fusionner avec les données existantes pour préserver les informations d'étape
      setAppDetails(prev => ({ 
        ...prev, 
        [id]: { 
          ...prev[id], // Garder les données existantes (étape, etc.)
          ...data       // Ajouter les nouvelles données détaillées
        } 
      }));
      // Préparer données d'édition (champs principaux)
      setAppEditData(prev => ({
        ...prev,
        [id]: {
          businessName: data.businessName || data.business_name || data.nom || data.companyName || '',
          legalForm: data.legalForm || data.legal_form || data.formeJuridique || '',
          businessType: data.businessType || data.business_type || data.typeEntreprise || '',
          domaineActivite: data.domaineActivite || data.domaine_activite || data.businessActivity || '',
          sigle: data.sigle || data.acronym || '',
          divisionId: data.divisionId || data.division_id || data.divisionCode || ''
        }
      }));
    } catch (e: any) {
      setAppDetailsError(prev => ({ ...prev, [id]: apiUtils.formatError(e) }));
    } finally {
      setAppDetailsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Fonction pour sauvegarder tous les membres modifiés
  const saveAllMembresModifications = async (entrepriseId: string): Promise<boolean> => {
    try {
      
      const appData = appDetails[entrepriseId];
      const membres = appData?.membres || [];
      
      if (membres.length === 0) {
        addToast('success', 'Aucun membre à sauvegarder');
        return true;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Récupérer tous les formulaires des membres
      for (let i = 0; i < membres.length; i++) {
        const membre = membres[i];
        try {
          // Récupérer le formulaire par data-membre-id
          const formElement = document.querySelector(`[data-membre-id="${membre.personId || i}"]`) as HTMLFormElement;
          
          if (formElement) {
            
            // Créer FormData depuis le formulaire
            const formData = new FormData(formElement);
            
            // Données récupérées du formulaire
            
            const success = await saveMembreModifications(entrepriseId, membre.personId || i.toString(), formData);
            if (success) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            console.error('❌ Formulaire non trouvé pour membre:', membre.personId || i);
            errorCount++;
          }
        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde du membre:', membre.personId || i, error);
          errorCount++;
        }
      }
      
      if (errorCount === 0) {
        
        // Recharger les données seulement après toutes les sauvegardes
        await loadApplicationDetails(entrepriseId);
        
        addToast('success', `${successCount} membre(s) sauvegardé(s) avec succès`);
        return true;
      } else {
        addToast('error', `${errorCount} erreur(s) lors de la sauvegarde`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde globale:', error);
      addToast('error', 'Erreur lors de la sauvegarde des membres');
      return false;
    }
  };

  // Fonction pour sauvegarder les modifications d'un membre
  const saveMembreModifications = async (entrepriseId: string, membreId: string, formData: FormData): Promise<boolean> => {
    try {
      
      // Récupérer les données du formulaire
      const membreData = {
        prenom: formData.get('prenom'),
        nom: formData.get('nom'),
        telephone: formData.get('telephone'),
        email: formData.get('email'),
        role: formData.get('role'),
        pourcentageParts: parseFloat(formData.get('pourcentageParts') as string) || 0,
        dateNaissance: formData.get('dateNaissance') || null,
        situationMatrimoniale: formData.get('situationMatrimoniale') === 'marie'
      };
      
      
      // Appel API pour mettre à jour le membre
      const response = await apiRequest(`/entreprises/${entrepriseId}/membres/${membreId}`, {
        method: 'PUT',
        body: JSON.stringify(membreData)
      });
      
      
      // Ne pas recharger les données ici pour éviter d'écraser les modifications en cours
      // Le rechargement se fera après toutes les sauvegardes dans saveAllMembresModifications
      
      addToast('success', 'Membre mis à jour avec succès');
      
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde du membre:', error);
      addToast('error', `Erreur lors de la sauvegarde: ${apiUtils.formatError(error)}`);
      return false;
    }
  };

  // Fonction pour remplacer un document existant
  const replaceDocument = async (entrepriseId: string, documentId: string, file: File): Promise<boolean> => {
    try {
      
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: true }));
      
      // S'assurer que les documents sont chargés
      if (!documents[entrepriseId] && !documentsLoading[entrepriseId]) {
        await loadDocuments(entrepriseId);
      }
      
      // Attendre que le chargement soit terminé
      if (documentsLoading[entrepriseId]) {
        // Attendre un peu que le chargement se termine
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Récupérer les informations du document existant pour connaître son type
      const appDocuments = documents[entrepriseId] || [];
      
      const existingDoc = appDocuments.find((doc: any) => doc.id === documentId);
      
      if (!existingDoc) {
        console.error('❌ Document non trouvé. IDs disponibles:', appDocuments.map((doc: any) => doc.id));
        throw new Error(`Document à remplacer non trouvé. ID recherché: ${documentId}`);
      }
      
      
      // Utiliser le nouvel endpoint de mise à jour qui met à jour uniquement le fichier
      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = `/documents/${documentId}/file`;
      
      console.log('📡 Appel API de mise à jour:', endpoint);
      console.log('🔄 Mise à jour du fichier pour le document ID:', documentId);
      
      // Debug: Afficher les données envoyées
      console.log('📋 Données FormData envoyées:');
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      // Appel API réel pour mettre à jour le document
      const response = await apiRequest(endpoint, {
        method: 'PUT',
        body: formData
        // Ne pas définir Content-Type, le navigateur le fera automatiquement pour FormData
      });
      
      console.log('✅ Document mis à jour avec succès:', response);
      
      // Mise à jour optimiste : remplacer le document dans la liste avec les nouvelles données
      setDocuments(prev => {
        const currentDocs = prev[entrepriseId] || [];
        const updatedDocs = currentDocs.map(doc => 
          doc.id === documentId ? response : doc
        );
        
        console.log('🔄 Mise à jour optimiste - Document mis à jour dans la liste');
        console.log('📄 Document ID:', documentId);
        console.log('📄 Nouvelles données:', response);
        
        return { ...prev, [entrepriseId]: updatedDocs };
      });
      
      addToast('success', `Document "${file.name}" remplacé avec succès`);
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors du remplacement du document:', error);
      addToast('error', `Erreur lors du remplacement: ${apiUtils.formatError(error)}`);
      return false;
    } finally {
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: false }));
    }
  };

  // États pour la visualisation de documents (comme dans EntrepriseDetails)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');

  // Fonction pour voir un document (comme dans EntrepriseDetails)
  const handleViewDocument = (documentId: string, documentName: string) => {
    console.log('👁️ Ouverture du viewer pour le document:', documentId);
    setSelectedDocumentId(documentId);
    setSelectedDocumentName(documentName);
  };

  // Fonction pour fermer le viewer de document
  const handleCloseDocumentViewer = () => {
    setSelectedDocumentId(null);
    setSelectedDocumentName('');
  };

  // Fonction pour télécharger un document par ID (comme dans EntrepriseDetails)
  const handleDownloadDocumentById = async (documentId: string, documentName: string) => {
    try {
      console.log('📥 Téléchargement du document:', documentId);
      
      // Utiliser le même endpoint que EntrepriseDetails mais avec le token user
      const response = await fetch(`${process.env.REACT_APP_USER_API_URL}/documents/${documentId}/file`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || `document_${documentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL blob
      URL.revokeObjectURL(url);
      
      console.log('✅ Téléchargement du document réussi');
      addToast('success', 'Téléchargement du document réussi');
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement:', error);
      addToast('error', 'Erreur lors du téléchargement du document');
    }
  };

  // Fonction pour supprimer un document
  const deleteDocument = async (entrepriseId: string, documentId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Suppression du document:', documentId);
      
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: true }));
      
      // TODO: Remplacer par l'endpoint réel de suppression de document
      // const response = await apiRequest(`/entreprises/${entrepriseId}/documents/${documentId}`, {
      //   method: 'DELETE'
      // });
      
      // Simulation pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Document supprimé avec succès');
      
      // Recharger les documents pour voir la liste mise à jour
      await loadDocuments(entrepriseId);
      
      addToast('success', 'Document supprimé avec succès');
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du document:', error);
      addToast('error', `Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
      return false;
    } finally {
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: false }));
    }
  };

  // Fonction pour forcer le rechargement des documents
  const forceReloadDocuments = async (entrepriseId: string): Promise<void> => {
    console.log('🔄 Forçage du rechargement des documents pour:', entrepriseId);
    
    // Réinitialiser l'état des documents pour forcer le rechargement
    setDocuments(prev => ({ ...prev, [entrepriseId]: [] }));
    setDocumentsLoading(prev => ({ ...prev, [entrepriseId]: false }));
    setDocumentsError(prev => ({ ...prev, [entrepriseId]: null }));
    
    // Maintenant recharger
    await loadDocuments(entrepriseId);
  };

  // Fonction pour charger les documents d'une entreprise (comme dans EntrepriseDetails.tsx)
  const loadDocuments = async (entrepriseId: string): Promise<void> => {
    // Éviter rechargements inutiles
    if (documents[entrepriseId] || documentsLoading[entrepriseId]) return;
    
    setDocumentsLoading(prev => ({ ...prev, [entrepriseId]: true }));
    setDocumentsError(prev => ({ ...prev, [entrepriseId]: null }));
    
    try {
      console.log('📄 Chargement des documents de l\'entreprise:', entrepriseId);
      
      // Appel API pour récupérer les documents (même endpoint que dans EntrepriseDetails.tsx)
      const response = await apiRequest(`/documents/entreprise/${entrepriseId}`);
      
      console.log('📄 Documents récupérés:', response);
      setDocuments(prev => ({ ...prev, [entrepriseId]: response || [] }));
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      setDocumentsError(prev => ({ ...prev, [entrepriseId]: apiUtils.formatError(error) }));
      setDocuments(prev => ({ ...prev, [entrepriseId]: [] }));
    } finally {
      setDocumentsLoading(prev => ({ ...prev, [entrepriseId]: false }));
    }
  };

  const saveApplicationDetails = async (id: string) => {
    const src = appEditData[id] || {};
    // Validations simples
    const name = src.businessName ?? src.business_name;
    const legal = src.legalForm ?? src.legal_form;
    const email = src.representative?.email ?? src.applicant_email;
    const capitalVal = src.capital;

    // Reset messages
    setAppDetailsError(prev => ({ ...prev, [id]: null }));
    setAppDetailsSuccess(prev => ({ ...prev, [id]: null }));

    if (!name || String(name).trim().length === 0) {
      setAppDetailsError(prev => ({ ...prev, [id]: "Le nom de l'entreprise est requis." }));
      return;
    }
    if (!legal || String(legal).trim().length === 0) {
      setAppDetailsError(prev => ({ ...prev, [id]: 'La forme juridique est requise.' }));
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setAppDetailsError(prev => ({ ...prev, [id]: "L'adresse email du représentant est invalide." }));
      return;
    }
    if (capitalVal !== '' && capitalVal !== null && capitalVal !== undefined) {
      const num = Number(capitalVal);
      if (Number.isNaN(num) || num < 0) {
        setAppDetailsError(prev => ({ ...prev, [id]: 'Le capital doit être un nombre positif.' }));
        return;
      }
    }
    const payload = {
      ...src,
      // Dupliquer les clés pour compat backend
      businessName: src.businessName ?? src.business_name,
      business_name: src.businessName ?? src.business_name,
      nom: src.businessName ?? src.business_name,
      legalForm: src.legalForm ?? src.legal_form,
      legal_form: src.legalForm ?? src.legal_form,
      formeJuridique: src.legalForm ?? src.legal_form,
      businessType: src.businessType ?? src.business_type,
      business_type: src.businessType ?? src.business_type,
      typeEntreprise: src.businessType ?? src.business_type,
      domaineActivite: src.domaineActivite,
      domaine_activite: src.domaineActivite,
      businessActivity: src.domaineActivite,
      sigle: src.sigle,
      acronym: src.sigle,
      divisionId: src.divisionId,
      division_id: src.divisionId,
      divisionCode: src.divisionId
    };
    try {
      setAppDetailsLoading(prev => ({ ...prev, [id]: true }));
      const updated = await businessAPI.updateApplication(id, payload);
      const data = (updated && updated.data) ? updated.data : updated;
      // Mettre à jour détails et sortir du mode édition
      setAppDetails(prev => ({ ...prev, [id]: data }));
      setAppEditMode(prev => ({ ...prev, [id]: false }));
      setAppDetailsSuccess(prev => ({ ...prev, [id]: 'Modifications enregistrées.' }));
      addToast('success', 'Modifications enregistrées');
      // Rafraîchir la liste avec nouveaux champs principaux si besoin
      setApplications(prev => prev.map(app => app.id === id ? {
        ...app,
        businessName: data.businessName || data.business_name || app.businessName,
        companyName: data.businessName || data.business_name || app.companyName,
        legalForm: data.legalForm || data.legal_form || app.legalForm,
      } : app));
    } catch (e: any) {
      setAppDetailsError(prev => ({ ...prev, [id]: apiUtils.formatError(e) }));
      addToast('error', apiUtils.formatError(e));
    } finally {
      setAppDetailsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (!editData.firstName || !editData.lastName || !editData.email) {
        setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
        setIsLoading(false);
        return;
      }

      if (editData.newPassword && editData.newPassword !== editData.confirmPassword) {
        setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
        setIsLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedUser = {
        ...user,
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        phone: editData.phone
      };

      localStorage.setItem('investmali_user', JSON.stringify(updatedUser));
      
      const allUsers = JSON.parse(localStorage.getItem('investmali_registered_users') || '[]');
      const updatedUsers = allUsers.map((u: any) => 
        u.id === user?.id ? { ...u, ...updatedUser } : u
      );
      localStorage.setItem('investmali_registered_users', JSON.stringify(updatedUsers));

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setIsEditing(false);
      
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions pour le système de paiement
  const handlePaymentClick = (entrepriseId: string) => {
    console.log('💳 Ouverture modal paiement pour entreprise:', entrepriseId);
    
    // Trouver l'entreprise dans la liste pour récupérer son montant
    const entreprise = applications.find(app => app.id === entrepriseId);
    const amount = entreprise ? entreprise.totalAmount : 0;
    
    console.log('💰 Montant récupéré pour l\'entreprise:', amount);
    
    setSelectedEntrepriseForPayment(entrepriseId);
    setSelectedEntrepriseAmount(amount);
    setPaymentModalOpen(true);
  };

  const handlePaymentMethodSelected = (method: string, amount: number) => {
    console.log('💳 Méthode sélectionnée:', method, 'Montant:', amount);
    setPaymentModalOpen(false);
    
    // Rediriger vers la page de paiement appropriée
    const params = new URLSearchParams({
      entrepriseId: selectedEntrepriseForPayment,
      amount: amount.toString()
    });
    
    switch (method) {
      case 'TRESORPAY':
        navigate(`/payment/tresorpay?${params}`);
        break;
      default:
        console.error('Méthode de paiement non supportée:', method);
    }
  };

  // Fonction pour télécharger les documents RCCM ou NINA
  const handleDownloadDocument = async (entrepriseId: string, documentType: 'RCCM' | 'NINA') => {
    try {
      console.log(`📄 Téléchargement du document ${documentType} pour l'entreprise:`, entrepriseId);
      
      // Récupérer les documents de l'entreprise
      const documentsResponse = await fetch(`${process.env.REACT_APP_USER_API_URL}/documents/entreprise/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!documentsResponse.ok) {
        throw new Error(`Erreur lors de la récupération des documents: ${documentsResponse.status}`);
      }
      
      const documents = await documentsResponse.json();
      console.log(`📊 Documents récupérés:`, documents);
      
      // Trouver le document correspondant
      let foundDocument = null;
      if (documentType === 'RCCM') {
        foundDocument = documents.find((doc: any) => 
          doc.typeDocument === 'RCCM' || 
          doc.typePiece === 'RCCM' ||
          doc.typeDocument === 'REGISTRE_COMMERCE' ||
          doc.typePiece === 'REGISTRE_COMMERCE'
        );
      } else {
        foundDocument = documents.find((doc: any) => 
          doc.typeDocument === 'NINA' && doc.numero?.startsWith('NINA-')
        );
      }
      
      if (!foundDocument) {
        throw new Error(`Aucun document ${documentType} trouvé pour cette entreprise.`);
      }
      
      console.log(`✅ Document ${documentType} trouvé:`, foundDocument);
      
      // Télécharger le fichier
      const downloadUrl = `${process.env.REACT_APP_USER_API_URL}/documents/${foundDocument.id}/file`;
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}_${entrepriseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Téléchargement ${documentType} réussi`);
      addToast('success', `Document ${documentType} téléchargé avec succès`);
      
      // Enregistrer le téléchargement dans la base de données
      try {
        const enregistrementResponse = await fetch(`${process.env.REACT_APP_USER_API_URL}/entreprises/${entrepriseId}/enregistrer-telechargement`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ documentType })
        });
        
        if (enregistrementResponse.ok) {
          const result = await enregistrementResponse.json();
          console.log(`✅ Téléchargement enregistré dans la BDD:`, result);
          
          // Mettre à jour l'état local
          setDownloadedDocuments(prev => ({
            ...prev,
            [entrepriseId]: {
              rccm: result.rccmTelecharge || false,
              nina: result.ninaTelecharge || false
            }
          }));
        }
      } catch (error) {
        console.error(`⚠️ Erreur lors de l'enregistrement du téléchargement:`, error);
        // Continuer même en cas d'erreur d'enregistrement
      }
    } catch (error: any) {
      console.error(`❌ Erreur téléchargement ${documentType}:`, error);
      addToast('error', `Erreur lors du téléchargement du document ${documentType}: ${error.message}`);
    }
  };
  
  // Fonction pour marquer le dossier comme retiré
  const handleMarkAsRetired = async (entrepriseId: string) => {
    if (!window.confirm('Confirmez-vous avoir retiré tous les documents de votre entreprise ?')) {
      return;
    }
    
    try {
      console.log(`✅ Marquage comme retiré pour l'entreprise:`, entrepriseId);
      
      // Mettre à jour le statut de l'entreprise (vous pouvez ajouter un champ "dateRetrait" dans le backend)
      const response = await fetch(`${process.env.REACT_APP_USER_API_URL}/entreprises/${entrepriseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRetrait: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
      }
      
      console.log(`✅ Dossier marqué comme retiré`);
      addToast('success', 'Votre dossier a été marqué comme retiré. Merci !');
      
      // Recharger les applications pour mettre à jour l'affichage
      window.location.reload();
    } catch (error: any) {
      console.error(`❌ Erreur marquage comme retiré:`, error);
      addToast('error', `Erreur lors du marquage comme retiré: ${error.message}`);
    }
  };

  // Fonction pour vérifier si le paiement est requis selon l'étape
  const isPaymentRequired = (app: BusinessApplication): boolean => {
    // Le paiement est requis si l'étape de validation est "REGISSEUR"
    const appData = appDetails[app.id];
    const etapeValidation = normalizeStage(appData?.etapeValidation || appData?.etape_validation);
    return etapeValidation === 'REGISSEUR';
  };

  // Fonction pour vérifier si les modifications sont autorisées selon l'étape
  const canModifyApplication = (app: BusinessApplication): boolean => {
    // Les modifications sont autorisées seulement à l'étape "ACCUEIL"
    const appData = appDetails[app.id];
    const etapeValidation = normalizeStage(appData?.etapeValidation || appData?.etape_validation);
    return etapeValidation === 'ACCUEIL';
  };

  // Fonction pour obtenir le message d'étape
  const getStageMessage = (app: BusinessApplication): string => {
    const appData = appDetails[app.id];
    const etapeValidation = normalizeStage(appData?.etapeValidation || appData?.etape_validation);
    
    switch (etapeValidation) {
      case 'ACCUEIL':
        return 'Votre demande est en cours de vérification initiale. Vous pouvez encore modifier vos informations.';
      case 'REGISSEUR':
        return 'Vérification terminée. Veuillez procéder au paiement pour continuer le traitement.';
      case 'IMPOTS':
        return 'Paiement reçu. Votre dossier est en cours de traitement fiscal.';
      case 'RCCM1':
        return 'Traitement fiscal terminé. Inscription au RCCM en cours (étape 1).';
      case 'RCCM2':
        return 'Inscription RCCM en cours (étape 2 - finalisation).';
      case 'NINA':
        return 'RCCM obtenu. Attribution de l\'autorisation d\'exercice en cours.';
      case 'RETRAIT':
        return 'Traitement terminé. Vos documents sont prêts pour le retrait.';
      default:
        return 'Statut de traitement en cours de mise à jour.';
    }
  };

  const getTrackingStatusIcon = (status: TrackingStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-investmali-accent rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'in-progress':
        return (
          <div className="w-8 h-8 bg-investmali-accent rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-8 h-8 bg-investmali-warning rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        );
    }
  };

  const getTrackingStatusColor = (status: TrackingStep['status']) => {
    switch (status) {
      case 'completed': return 'text-investmali-accent';
      case 'in-progress': return 'text-investmali-accent';
      case 'failed': return 'text-investmali-warning';
      default: return 'text-gray-500';
    }
  };

  // Génère les étapes de création d'entreprise selon notre logique
  const generateBusinessCreationSteps = (app: BusinessApplication): TrackingStep[] => {
    const baseSteps: Omit<TrackingStep, 'status' | 'completedAt'>[] = [
      {
        id: 'personal-info',
        title: 'Informations personnelles',
        description: 'Collecte des informations personnelles du demandeur et validation de l\'identité',
        estimatedDuration: '5-10 min',
        details: 'Vérification des données personnelles, civilité, téléphone, adresse, et documents d\'identité'
      },
      {
        id: 'company-info',
        title: 'Informations entreprise',
        description: 'Définition du nom, forme juridique, domaine d\'activité et localisation',
        estimatedDuration: '10-15 min',
        details: 'Configuration de la raison sociale, forme juridique (SARL, SA, E.I.), domaine d\'activité et division administrative'
      },
      {
        id: 'participants',
        title: 'Participants et associés',
        description: 'Ajout des fondateurs, associés et gérants avec répartition des parts',
        estimatedDuration: '15-20 min',
        details: 'Gestion des rôles (FONDATEUR, ASSOCIE, GERANT), pourcentages de parts, documents d\'identité et pièces justificatives'
      },
      {
        id: 'documents',
        title: 'Documents et pièces justificatives',
        description: 'Upload des documents requis selon la configuration choisie',
        estimatedDuration: '10-15 min',
        details: 'Documents d\'identité, casier judiciaire (si requis), acte de mariage (gérants mariés), autres pièces justificatives'
      }
    ];

    // Récupérer l'étape actuelle de l'entreprise
    const appData = appDetails[app.id];
    const currentAgentStage = normalizeStage(appData?.etapeValidation || appData?.etape_validation || 'ACCUEIL');
    const currentStageIndex = stageOrder.indexOf(currentAgentStage);
    
    // Si l'entreprise est à REGISSEUR ou plus loin, toutes les étapes user sont complétées
    const allStepsCompleted = currentStageIndex >= 1; // REGISSEUR est à l'index 1
    
    return baseSteps.map((step, index) => {
      let status: TrackingStep['status'];
      let completedAt: string | undefined;
      
      if (allStepsCompleted) {
        status = 'completed';
        // Estimation de la date de completion basée sur la soumission
        const submittedDate = new Date(app.submittedAt);
        const completionDate = new Date(submittedDate.getTime() + (index * 2 * 60 * 60 * 1000)); // +2h par étape
        completedAt = completionDate.toISOString();
      } else {
        // Logique originale basée sur la progression
        const progress = app.overallProgress;
        const stepProgress = progress / 100;
        const stepsCount = baseSteps.length;
        const stepThreshold = (index + 1) / stepsCount;
        const prevStepThreshold = index / stepsCount;
        
        if (stepProgress > stepThreshold) {
          status = 'completed';
          const submittedDate = new Date(app.submittedAt);
          const completionDate = new Date(submittedDate.getTime() + (index * 2 * 60 * 60 * 1000));
          completedAt = completionDate.toISOString();
        } else if (stepProgress > prevStepThreshold) {
          status = 'in-progress';
        } else if (app.status === 'rejected' && stepProgress <= prevStepThreshold) {
          status = 'failed';
        } else {
          status = 'pending';
        }
      }
      
      return {
        ...step,
        status,
        completedAt
      };
    });
  };

  const getStatusColor = (status: BusinessApplication['status']) => {
    switch (status) {
      case 'completed': return 'bg-investmali-accent/10 text-investmali-accent';
      case 'in-progress': return 'bg-investmali-primary/10 text-investmali-primary';
      case 'pending': return 'bg-investmali-warning/10 text-investmali-warning';
      case 'rejected': return 'bg-investmali-warning/10 text-investmali-warning';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: BusinessApplication['status']) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in-progress': return 'En cours';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejetée';
      default: return 'Inconnu';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Fonction pour résoudre division_id vers nom de localisation avec hiérarchie
  const getDivisionName = async (divisionId: string): Promise<string> => {
    if (!divisionId) return '—';
    
    // Vérifier le cache
    if (divisionsCache[divisionId]) {
      const division = divisionsCache[divisionId];
      return division.displayName || division.nom || '—';
    }
    
    try {
      let division = null;
      
      // Essayer d'abord par ID (UUID)
      try {
        division = await divisionService.getById(divisionId);
      } catch (error: any) {
        // Si erreur 404, essayer par code
        if (error.status === 404) {
          try {
            division = await divisionService.getByCode(divisionId);
          } catch (codeError) {
            console.warn('Division non trouvée par ID ni par code:', divisionId);
            return 'Division inconnue';
          }
        } else {
          throw error;
        }
      }
      
      if (division && division.nom) {
        // Utiliser seulement le nom de la division sans hiérarchie
        const divisionName = division.nom;
        
        // Mettre en cache avec le nom simple
        const newCache = { ...divisionsCache };
        newCache[divisionId] = { ...division, displayName: divisionName };
        setDivisionsCache(newCache);
        
        return divisionName;
      }
      
      return 'Division inconnue';
      
    } catch (error) {
      console.warn('Erreur lors du chargement de la division:', error);
      return 'Division inconnue';
    }
  };

  // Hook pour charger le nom de division avec rate limiting
  const [divisionNames, setDivisionNames] = useState<Record<string, string>>({});
  const [loadingDivisions, setLoadingDivisions] = useState<Set<string>>(new Set());
  
  const loadDivisionName = async (divisionId: string, appId: string) => {
    if (!divisionId || divisionNames[divisionId] || loadingDivisions.has(divisionId)) return;
    
    setLoadingDivisions(prev => {
      const newSet = new Set(prev);
      newSet.add(divisionId);
      return newSet;
    });
    
    try {
      const name = await getDivisionName(divisionId);
      setDivisionNames(prev => ({ ...prev, [divisionId]: name }));
    } catch (error) {
      console.warn(`Erreur chargement division ${divisionId}:`, error);
      setDivisionNames(prev => ({ ...prev, [divisionId]: 'Division non renseinger' }));
    } finally {
      setLoadingDivisions(prev => {
        const newSet = new Set(prev);
        newSet.delete(divisionId);
        return newSet;
      });
    }
  };

  // Fonctions pour la gestion des conversations et messages
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    
    setConversationsLoading(true);
    try {
      console.log('📥 Chargement des conversations pour utilisateur:', user.id);
      
      // Essayer d'abord le nouvel endpoint avec les entreprises gérées
      let response = await fetch(`${API_CONFIG.BASE_URL}/conversations/user-with-companies/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Si le nouvel endpoint échoue, utiliser l'ancien comme fallback
      if (!response.ok) {
        console.warn('⚠️ Nouvel endpoint échoué, utilisation de l\'ancien endpoint comme fallback');
        response = await fetch(`${API_CONFIG.BASE_URL}/conversations/user-native/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversations récupérées:', data);
        
        if (data.status === 'SUCCESS' && data.conversations) {
          setConversations(data.conversations);
          // L'auto-sélection est maintenant gérée par un useEffect séparé
        }
      } else {
        console.error('❌ Erreur lors du chargement des conversations:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  }, [user?.id, selectedConversation]);

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('📥 Chargement des messages pour conversation:', conversationId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Messages récupérés:', data);
        
        if (data.status === 'SUCCESS' && data.messages) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            messageType: msg.sender_type === 'agent' ? 'AGENT' : 'USER',
            createdAt: msg.created_at,
            senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Agent' : 'Utilisateur'),
            senderId: msg.sender_id,
            isRead: msg.is_read
          }));
          setMessages(formattedMessages);
        }
      } else {
        console.error('❌ Erreur lors du chargement des messages:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending || !user?.id) return;
    
    setSending(true);
    try {
      console.log('📤 Envoi du message utilisateur:', newMessage);
      
      const requestPayload = {
        sender_type: "user",
        sender_id: user.id,
        content: newMessage
      };
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message envoyé avec succès:', data);
        
        // Ajouter le message à la liste locale
        const sentMessage = {
          id: data.message?.id || `msg-${Date.now()}`,
          content: newMessage,
          messageType: 'USER',
          createdAt: new Date().toISOString(),
          senderName: `${displayFirstName} ${displayLastName}`.trim(),
          senderId: user.id,
          isRead: false
        };
        
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        
        // Recharger les conversations pour mettre à jour les compteurs
        loadConversations();
      } else {
        console.error('❌ Erreur lors de l\'envoi du message:', response.status);
        addToast('error', 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      addToast('error', 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      console.log('📖 Début marquage des messages comme lus');
      console.log('📖 Conversation ID:', conversationId);
      console.log('📖 User ID:', user?.id);
      
      const requestBody = {
        user_id: user?.id
      };
      console.log('📖 Request body:', requestBody);
      
      const response = await fetch(`http://localhost:8080/api/v1/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📖 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Messages marqués comme lus - Réponse:', data);
        
        // Recharger les conversations pour mettre à jour les compteurs
        console.log('🔄 Rechargement des conversations');
        loadConversations();
      } else {
        const errorData = await response.text();
        console.error('❌ Erreur lors du marquage des messages comme lus:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Erreur lors du marquage des messages comme lus:', error);
    }
  };

  const selectConversation = (conversation: any) => {
    console.log('🔍 Sélection de la conversation:', conversation);
    console.log('🔍 Messages non lus:', conversation.unread_count);
    
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    
    // Marquer les messages comme lus quand l'utilisateur ouvre la conversation
    if (conversation.unread_count > 0) {
      console.log('📖 Marquage des messages comme lus - Conversation ID:', conversation.id);
      
      // Mise à jour immédiate de l'état local pour un feedback instantané
      console.log('⚡ Mise à jour immédiate du badge');
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unread_count: 0 }
            : conv
        );
        console.log('✅ Conversations mises à jour:', updated);
        return updated;
      });
      
      // Appel API pour marquer comme lu côté serveur
      console.log('📡 Appel API markMessagesAsRead');
      markMessagesAsRead(conversation.id);
    } else {
      console.log('ℹ️ Aucun message non lu à marquer');
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // Charger les conversations quand l'onglet Messages est sélectionné
  useEffect(() => {
    if (activeTab === 'messages' && user?.id) {
      loadConversations();
    }
  }, [activeTab, user?.id, loadConversations]);

  // Auto-sélectionner la première conversation quand les conversations sont chargées
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && activeTab === 'messages') {
      console.log('🎯 Auto-sélection de la première conversation via useEffect');
      selectConversation(conversations[0]);
    }
  }, [conversations, selectedConversation, activeTab]);

  // Calculer le nombre total de messages non lus
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-investmali-accent/5 relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground variant="minimal" />
        <div className="relative z-10 text-center">
          <p className="text-investmali-neutral-dark text-lg">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Valeurs sûres pour éviter les crashes si certaines infos manquent
  const displayFirstName = user.firstName || (user as any).first_name || (user.email ? user.email.split('@')[0] : 'Utilisateur');
  const displayLastName = user.lastName || (user as any).last_name || '';
  const initials = `${(displayFirstName || '').charAt(0)}${(displayLastName || '').charAt(0)}`.toUpperCase() || (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  const registeredAtText = (user as any).registeredAt ? formatDate((user as any).registeredAt) : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-investmali-accent/5 relative overflow-hidden">
      <AnimatedBackground variant="minimal" />
      
      {/* Navigation Header */}
      <Header />
      
      <div className="relative z-10">
        {/* Toasts */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 space-y-2 z-50">
            {toasts.map(t => (
              <div key={t.id} className={`px-4 py-3 rounded-lg shadow ${t.type === 'success' ? 'bg-investmali-accent text-white' : 'bg-investmali-warning text-white'}`}>
                {t.text}
              </div>
            ))}
          </div>
        )}
        {/* Profile Header */}
        <div className="bg-investmali-accent shadow-lg border-b border-gray-100 mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-investmali-accent to-investmali-warning rounded-full flex items-center justify-center">
                  <span className="text-white text-sm sm:text-lg font-bold">
                    {initials}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{displayFirstName} {displayLastName}</h1>
                  <p className="text-white/80 text-xs sm:text-sm">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => window.history.back()}
                className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 sm:px-4 rounded-xl hover:bg-white/30 transition-colors border border-white/30 text-sm sm:text-base"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="bg-white rounded-2xl shadow-lg mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-investmali-accent border-b-2 border-investmali-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs sm:text-sm">Profil</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center font-medium transition-colors ${
                  activeTab === 'applications'
                    ? 'text-investmali-accent border-b-2 border-investmali-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Mes Demandes</span>
                    <span className="sm:hidden">Demandes</span>
                    <span className="ml-1">({applications.length})</span>
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center font-medium transition-colors relative ${
                  activeTab === 'messages'
                    ? 'text-investmali-accent border-b-2 border-investmali-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs sm:text-sm">Messages</span>
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-investmali-warning text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse text-xs">
                      {totalUnreadCount}
                    </span>
                  )}
                </div>
              </button>
              {/* <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 px-2 sm:py-4 sm:px-6 text-center font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-investmali-accent border-b-2 border-investmali-accent'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Paramètres</span>
                    <span className="sm:hidden">Config</span>
                  </span>
                </div>
              </button> */}
            </div>

            {/* Messages */}
            {message && (
              <div className={`mx-6 mt-4 p-4 rounded-xl ${
                message.type === 'success' ? 'bg-investmali-accent/10 text-investmali-accent border border-investmali-accent/20' : 'bg-investmali-warning/10 text-investmali-warning border border-investmali-warning/20'
              }`}>
                {message.text}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-investmali-neutral-dark">Informations Personnelles</h2>
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditData({
                          firstName: user.firstName || user.prenom || '',
                          lastName: user.lastName || user.nom || '',
                          email: user.email,
                          phone: user.phone || '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="bg-investmali-accent text-white px-4 py-2 rounded-xl hover:bg-investmali-accent/90 transition-colors text-sm sm:text-base w-full sm:w-auto"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                        <input
                          type="text"
                          value={editData.firstName}
                          onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                        <input
                          type="text"
                          value={editData.lastName}
                          onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                        placeholder="+223 XX XX XX XX"
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-base sm:text-lg font-medium text-investmali-neutral-dark mb-4">Changer le mot de passe</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                          <input
                            type="password"
                            value={editData.newPassword}
                            onChange={(e) => setEditData({...editData, newPassword: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                            placeholder="Laisser vide pour ne pas changer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                          <input
                            type="password"
                            value={editData.confirmPassword}
                            onChange={(e) => setEditData({...editData, confirmPassword: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="bg-investmali-accent text-white px-6 py-3 rounded-xl hover:bg-investmali-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setMessage(null);
                        }}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Prénom</label>
                        <p className="text-sm sm:text-base font-medium text-investmali-neutral-dark">{user.firstName}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                        <p className="text-sm sm:text-base font-medium text-investmali-neutral-dark">{user.lastName}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-sm sm:text-base font-medium text-investmali-neutral-dark">{user.email}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Téléphone</label>
                      <p className="text-sm sm:text-base font-medium text-investmali-neutral-dark">{user.phone || 'Non renseigné'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Membre depuis</label>
                      <p className="text-sm sm:text-base font-medium text-investmali-neutral-dark">{registeredAtText}</p>
                    </div>

                    {/* Section Entreprises */}
                    {applications.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-investmali-neutral-dark mb-4">Mes Entreprises</h3>
                        <div className="space-y-3">
                          {applications.map((app) => {
                            const appData = appDetails[app.id];
                            const entrepriseName = appData?.nom || appData?.businessName || app.businessName || app.companyName;
                            const displayName = entrepriseName || 
                              (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Entreprise');
                            const reference = appData?.reference || app.id.substring(0, 8);
                            
                            return (
                              <div key={app.id} className="bg-white border border-gray-200 p-4 rounded-xl">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold text-investmali-neutral-dark">{displayName}</p>
                                    <p className="text-sm text-gray-600 mt-1">Réf: {reference}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                    {getStatusText(app.status)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark mb-6">Mes Demandes de Création d'Entreprise</h2>
                
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucune demande pour le moment</h3>
                    <p className="text-gray-500 mb-6">Vous n'avez pas encore soumis de demande de création d'entreprise.</p>
                    <button
                      onClick={() => window.location.href = '/create-business'}
                      className="bg-investmali-accent text-white px-6 py-3 rounded-xl hover:bg-investmali-accent/90 transition-colors"
                    >
                      Créer ma première entreprise
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map((app) => (
                      <div key={app.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Application Header */}
                        <div className="bg-gray-50 p-4 sm:p-6 border-b border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark">
                                {app.businessName || app.companyName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Entreprise')}
                              </h3>
                              <p className="text-sm sm:text-base text-gray-600">
                                {app.legalForm} • Réf: {appDetails[app.id]?.reference || app.id.substring(0, 8)}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                              {getStatusText(app.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Soumise le :</span>
                              <p className="font-medium">{formatDate(app.submittedAt)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Montant :</span>
                              <p className="font-medium">{formatAmount(app.totalAmount)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Progression :</span>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-investmali-accent to-investmali-warning h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${app.overallProgress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium">{Math.round(app.overallProgress)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Fin estimée :</span>
                              <p className="font-medium">{new Date(app.estimatedCompletion).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>

                          {app.status === 'in-progress' && app.currentStep && (
                            <div className="mt-4 p-3 bg-investmali-accent/10 rounded-lg border border-investmali-primary/20">
                              <p className="text-black text-sm">
                                <strong>Étape actuelle :</strong> {app.steps.find(step => step.status === 'in-progress')?.title || 'En cours...'}
                              </p>
                            </div>
                          )}

                          {/* Message d'étape et contrôles */}
                          <div className="mt-4 p-3 sm:p-4 bg-investmali-accent/10 border border-investmali-primary/20 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <div className="text-black text-sm sm:text-base">ℹ️</div>
                              <div className="flex-1">
                                <h4 className="text-sm sm:text-base font-medium text-black mb-1">
                                  Étape actuelle: {(() => {
                                    const backendStage = appDetails[app.id]?.etapeValidation || appDetails[app.id]?.etape_validation;
                                    return normalizeStage(backendStage);
                                  })()}
                                </h4>
                                <p className="text-xs sm:text-sm text-black/80">
                                  {getStageMessage(app)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                              {/* Afficher les boutons de téléchargement si l'entreprise est à l'étape RETRAIT */}
                              {(() => {
                                const appData = appDetails[app.id];
                                const currentStage = normalizeStage(appData?.etapeValidation || appData?.etape_validation);
                                return currentStage === 'RETRAIT' ? (() => {
                                  const appData = appDetails[app.id];
                                  const isRetired = appData?.dateRetrait != null;
                                  const downloads = downloadedDocuments[app.id] || { rccm: false, nina: false };
                                  const bothDownloaded = downloads.rccm && downloads.nina;
                                  
                                  return (
                                    <div className="border-t border-gray-200 pt-4 mt-4 w-full">
                                      {!isRetired ? (
                                        <>
                                          <p className="text-sm font-medium text-gray-700 mb-3">Documents disponibles:</p>
                                          <div className="flex flex-wrap gap-3">
                                            <button 
                                              onClick={() => !downloads.rccm && handleDownloadDocument(app.id, 'RCCM')}
                                              disabled={downloads.rccm}
                                              className="flex items-center px-4 py-2 bg-investmali-primary text-white rounded-lg hover:bg-investmali-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 mr-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                              </svg>
                                              {downloads.rccm ? '✓ RCCM Téléchargé' : 'Télécharger RCCM'}
                                            </button>
                                            <button 
                                              onClick={() => !downloads.nina && handleDownloadDocument(app.id, 'NINA')}
                                              disabled={downloads.nina}
                                              className="flex items-center px-4 py-2 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 mr-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                              </svg>
                                              {downloads.nina ? '✓ NINA Téléchargé' : 'Télécharger NINA'}
                                            </button>
                                            {bothDownloaded && (
                                              <button 
                                                onClick={() => handleMarkAsRetired(app.id)}
                                                className="flex items-center px-4 py-2 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 mr-2">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                                Marquer comme retiré
                                              </button>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="p-4 bg-investmali-accent/10 border border-investmali-accent/20 rounded-lg">
                                          <p className="text-investmali-accent font-medium flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 mr-2">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            Documents retirés le {new Date(appData.dateRetrait).toLocaleDateString('fr-FR')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : (
                                  <>
                                    <button 
                                      onClick={async () => {
                                        console.log('🎯 [DEBUT] Bouton Télécharger le reçu cliqué pour:', app.id);
                                        try {
                                          const token = localStorage.getItem('token');
                                          console.log('🔑 [Token] Token récupéré:', token ? 'OUI' : 'NON');
                                          
                                          // Charger les détails si pas encore chargés
                                          if (!appDetails[app.id]) {
                                            console.log('📥 [Détails] Chargement des détails pour:', app.id);
                                            await loadApplicationDetails(app.id);
                                          }
                                          
                                          const appData = appDetails[app.id];
                                          console.log('📋 [AppData] Données app chargées:', appData ? 'OUI' : 'NON');
                                          
                                          // 1. Vérifier si un paiement existe
                                          console.log('🔍 [Reçu] Récupération paiements pour entreprise:', app.id);
                                          const paymentsResponse = await fetch(`/api/v1/paiements/entreprise/${app.id}`, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                          });
                                          
                                          console.log('📡 [Reçu] Statut réponse API paiements:', paymentsResponse.status);
                                          
                                          let paidPayment = null;
                                          if (paymentsResponse.ok) {
                                            const payments = await paymentsResponse.json();
                                            console.log('💳 [Reçu] Paiements trouvés:', JSON.stringify(payments, null, 2));
                                            
                                            if (Array.isArray(payments)) {
                                              console.log('📋 [Reçu] Nombre de paiements:', payments.length);
                                              payments.forEach((p: any, index: number) => {
                                                console.log(`💰 [Reçu] Paiement ${index + 1}:`, {
                                                  id: p.id,
                                                  statut: p.statut,
                                                  status: p.status,
                                                  montant: p.montant,
                                                  referenceTransaction: p.referenceTransaction
                                                });
                                              });
                                              paidPayment = payments.find((p: any) => 
                                                p.statut === 'VALIDE' || p.statut === 'REUSSI' || p.status === 'PAID'
                                              );
                                            } else {
                                              console.log('📋 [Reçu] Paiement unique:', {
                                                statut: payments.statut,
                                                status: payments.status
                                              });
                                              paidPayment = (
                                                payments.statut === 'VALIDE' || 
                                                payments.statut === 'REUSSI' || 
                                                payments.status === 'PAID' 
                                                  ? payments 
                                                  : null
                                              );
                                            }
                                            
                                            console.log('💳 [Reçu] Paiement validé trouvé:', paidPayment ? 'OUI' : 'NON');
                                            if (paidPayment) {
                                              console.log('✅ [Reçu] Détails paiement validé:', {
                                                statut: paidPayment.statut,
                                                montant: paidPayment.montant,
                                                referenceTransaction: paidPayment.referenceTransaction
                                              });
                                            }
                                          } else {
                                            const errorText = await paymentsResponse.text();
                                            console.error('❌ [Reçu] Erreur récupération paiements:', {
                                              status: paymentsResponse.status,
                                              statusText: paymentsResponse.statusText,
                                              error: errorText
                                            });
                                          }
                                          
                                          // Utiliser nom entreprise ou nom+prénom de la personne
                                          const entrepriseName = appData?.nom || appData?.businessName || app.businessName || app.companyName;
                                          const displayName = entrepriseName || 
                                            (user?.firstName && user?.lastName 
                                              ? `${user.firstName} ${user.lastName}`
                                              : 'Entreprise');
                                          
                                          // 2. Si paiement validé → Générer le reçu PAYÉ
                                          if (paidPayment) {
                                            console.log('✅ [Reçu] Génération reçu PAYÉ avec paiement validé');
                                            
                                            const receiptDataPaid = {
                                              entrepriseId: app.id,
                                              entrepriseName: displayName,
                                              entrepriseType: appData?.typeEntreprise || 'ENTREPRISE_INDIVIDUELLE',
                                              localisation: appData?.quartierNom || appData?.divisionNom || 'Non spécifié',
                                              commune: appData?.communeNom || 'Bamako',
                                              amount: paidPayment.montant || appData?.totalAmount || app.totalAmount || 50000,
                                              paymentMethod: paidPayment.typePaiement || 'TresorPay',
                                              transactionId: paidPayment.referenceTransaction || paidPayment.tresorPayReference || paidPayment.id,
                                              paymentDate: paidPayment.datePaiement || new Date().toISOString(),
                                              status: 'success' as const,  // ✅ 'success' pour afficher "PAYÉ"
                                              dossierNumber: appData?.reference || app.id,
                                              processedByAgent: false,
                                              prenom: user?.firstName || '',
                                              nom: user?.lastName || ''
                                            };
                                            
                                            setReceiptData(receiptDataPaid);
                                            setReceiptModalOpen(true);
                                            return;
                                          }
                                          
                                          // 3. Sinon → Générer le reçu NON PAYÉ localement
                                          console.log('⚠️ [Reçu] Génération reçu NON PAYÉ (paiement non trouvé)');
                                          console.log('⚠️ [Reçu] paidPayment est NULL ou undefined:', paidPayment === null || paidPayment === undefined);
                                          
                                          console.log('📋 Données reçu:', {
                                            appData,
                                            entrepriseName,
                                            displayName,
                                            user: { firstName: user?.firstName, lastName: user?.lastName }
                                          });
                                          
                                          const receiptDataGenerated = generateUnpaidReceiptData(
                                            {
                                              id: app.id,
                                              nom: entrepriseName || '', // Nom entreprise seulement (pas le fallback)
                                              typeEntreprise: appData?.typeEntreprise || 'ENTREPRISE_INDIVIDUELLE',
                                              reference: appData?.reference || app.id,
                                              divisionNom: appData?.divisionNom || 'Non spécifié',
                                              communeNom: appData?.communeNom || 'Bamako',
                                              regionNom: appData?.regionNom || 'Bamako',
                                              prenom: user?.firstName || '', // Prénom pour fallback
                                              nomParticipant: user?.lastName || '' // Nom pour fallback
                                            },
                                            appData?.montantFraisDepot || app.totalAmount || 50000,
                                            'Client'
                                          );
                                          
                                          setReceiptData(receiptDataGenerated);
                                          setReceiptModalOpen(true);
                                          
                                        } catch (error: any) {
                                          console.error('❌ [ERREUR CRITIQUE] Erreur téléchargement reçu:', error);
                                          console.error('❌ [ERREUR CRITIQUE] Stack:', error.stack);
                                          alert('Erreur lors de la récupération du reçu: ' + error.message);
                                        }
                                      }}
                                      className="bg-gray-200 text-black px-3 py-2 sm:px-4 rounded-lg hover:bg-investmali-accent transition-colors text-xs sm:text-sm"
                                    >
                                      Télécharger le reçu
                                    </button>
                                    {app.status === 'completed' && (
                                      <button 
                                        onClick={() => {
                                          const appData = appDetails[app.id];
                                          if (appData?.id) {
                                            window.open(`/api/v1/entreprises/${appData.id}/documents`, '_blank');
                                          }
                                        }}
                                        className="bg-investmali-accent text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-investmali-accent/90 transition-colors text-xs sm:text-sm"
                                      >
                                        Télécharger les documents
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                              
                              {/* Bouton de paiement conditionnel */}
                              {isPaymentRequired(app) && (
                                <button
                                  onClick={() => handlePaymentClick(app.id)}
                                  className="bg-investmali-accent text-white px-4 py-2 sm:px-6 rounded-lg hover:bg-investmali-accent/90 
                                           transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-2"
                                >
                                  {/* <span>💳</span> */}
                                  <span>Procéder au paiement</span>
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const next = selectedApplication === app.id ? null : app.id;
                                setSelectedApplication(next);
                                if (next) {
                                  // Forcer le rechargement pour s'assurer d'avoir les dernières données du backend
                                  loadApplicationDetails(app.id, true);
                                }
                              }}
                              className="text-investmali-accent hover:text-investmali-warning transition-colors text-xs sm:text-sm font-medium flex items-center space-x-1 w-full sm:w-auto justify-center sm:justify-start"
                            >
                              <span>{selectedApplication === app.id ? 'Masquer le suivi' : 'Voir le suivi détaillé'}</span>
                              <svg 
                                className={`w-4 h-4 transition-transform ${selectedApplication === app.id ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Detailed Tracking */}
                        {selectedApplication === app.id && (
                          <div className="p-4 sm:p-6 bg-white">
                            <h4 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-6">Suivi Détaillé des Étapes</h4>

                            {/* Infos soumises + édition */}
                            <div className="mb-8">
                              <h5 className="text-sm sm:text-base font-semibold text-investmali-neutral-dark mb-4">Informations de la demande</h5>
                              {appDetailsLoading[app.id] && (
                                <p className="text-gray-500 text-sm">Chargement des informations...</p>
                              )}
                              {appDetailsError[app.id] && (
                                <p className="text-investmali-warning text-sm">{appDetailsError[app.id]}</p>
                              )}
                              {appDetailsSuccess[app.id] && (
                                <p className="text-investmali-accent text-sm">{appDetailsSuccess[app.id]}</p>
                              )}
                              {!appDetailsLoading[app.id] && !appDetailsError[app.id] && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Nom de l'entreprise</label>
                                      {appEditMode[app.id] ? (
                                        <input
                                          type="text"
                                          value={appEditData[app.id]?.businessName || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], businessName: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                      ) : (
                                        <p className="font-medium">
                                          {appDetails[app.id]?.businessName || appDetails[app.id]?.business_name || appDetails[app.id]?.nom || appDetails[app.id]?.companyName || app.businessName || app.companyName || 
                                          (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '—')}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Forme juridique</label>
                                      {appEditMode[app.id] ? (
                                        <select
                                          value={appEditData[app.id]?.legalForm || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], legalForm: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        >
                                          <option value="">Sélectionner</option>
                                          {/* Options statiques temporaires pour éviter l'erreur */}
                                          <option value="SA">SA (Société Anonyme)</option>
                                          <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                                          <option value="E_I">Entreprise Individuelle</option>
                                          <option value="SNC">SNC (Société en Nom Collectif)</option>
                                          <option value="SCS">SCS (Société en Commandite Simple)</option>
                                          {/* Options dynamiques avec protection */}
                                          {legalFormOptions.length > 0 && legalFormOptions.map((opt: any, index: number) => {
                                            try {
                                              const optValue = typeof opt === 'object' ? (opt?.value || opt?.key || opt?.label || `option-${index}`) : String(opt || '');
                                              const optLabel = typeof opt === 'object' ? (opt?.label || opt?.value || opt?.key || `Option ${index}`) : String(opt || '');
                                              
                                              // Éviter les doublons avec les options statiques
                                              if (['SA', 'SARL', 'E_I', 'SNC', 'SCS'].includes(optValue)) {
                                                return null;
                                              }
                                              
                                              return (
                                                <option key={`legal-dyn-${index}-${optValue}`} value={optValue}>
                                                  {optLabel}
                                                </option>
                                              );
                                            } catch (error) {
                                              console.warn('Erreur lors du rendu de l\'option:', opt, error);
                                              return null;
                                            }
                                          })}
                                        </select>
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.legalForm || appDetails[app.id]?.legal_form || appDetails[app.id]?.formeJuridique || app.legalForm || '—'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Type d'entreprise</label>
                                      {appEditMode[app.id] ? (
                                        <select
                                          value={appEditData[app.id]?.businessType || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], businessType: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        >
                                          <option value="">Sélectionner</option>
                                          {/* Options statiques temporaires pour éviter l'erreur */}
                                          <option value="SOCIETE">Société</option>
                                          <option value="ENTREPRISE_INDIVIDUELLE">Entreprise Individuelle</option>
                                          {/* Options dynamiques avec protection */}
                                          {businessTypeOptions.length > 0 && businessTypeOptions.map((opt: any, index: number) => {
                                            try {
                                              const optValue = typeof opt === 'object' ? (opt?.value || opt?.key || opt?.label || `type-${index}`) : String(opt || '');
                                              const optLabel = typeof opt === 'object' ? (opt?.label || opt?.value || opt?.key || `Type ${index}`) : String(opt || '');
                                              
                                              // Éviter les doublons avec les options statiques
                                              if (['SOCIETE', 'ENTREPRISE_INDIVIDUELLE'].includes(optValue)) {
                                                return null;
                                              }
                                              
                                              return (
                                                <option key={`type-dyn-${index}-${optValue}`} value={optValue}>
                                                  {optLabel}
                                                </option>
                                              );
                                            } catch (error) {
                                              console.warn('Erreur lors du rendu du type:', opt, error);
                                              return null;
                                            }
                                          })}
                                        </select>
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.businessType || appDetails[app.id]?.business_type || appDetails[app.id]?.typeEntreprise || '—'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Domaine d'activité</label>
                                      {appEditMode[app.id] ? (
                                        <select
                                          value={appEditData[app.id]?.domaineActivite || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], domaineActivite: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                          <option value="">-- Sélectionner un domaine --</option>
                                          {domaineActiviteOptions.map(domaine => (
                                            <option key={domaine.key} value={domaine.key}>
                                              {domaine.value}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <p className="font-medium">
                                          {(() => {
                                            // Priorité au domaineActiviteNr s'il existe
                                            const domaineNrValue = appDetails[app.id]?.domaineActiviteNr;
                                            if (domaineNrValue) {
                                              const domaineNr = domaineActiviteNrOptions.find(d => d.key === domaineNrValue);
                                              return domaineNr ? domaineNr.value : domaineNrValue;
                                            }
                                            
                                            // Sinon, utiliser domaineActivite
                                            const currentValue = appDetails[app.id]?.domaineActivite || appDetails[app.id]?.domaine_activite || appDetails[app.id]?.businessActivity;
                                            if (!currentValue) return '—';
                                            // Trouver le libellé correspondant à la clé
                                            const domaine = domaineActiviteOptions.find(d => d.key === currentValue);
                                            return domaine ? domaine.value : currentValue;
                                          })()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Sigle</label>
                                      {appEditMode[app.id] ? (
                                        <input
                                          type="text"
                                          value={appEditData[app.id]?.sigle || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], sigle: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.sigle || appDetails[app.id]?.acronym || '—'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Localisation</label>
                                      {appEditMode[app.id] ? (
                                        <DivisionSearchInput
                                          onSelect={(division) => {
                                            setAppEditData(prev => ({
                                              ...prev,
                                              [app.id]: {
                                                ...prev[app.id],
                                                divisionId: division.id,
                                                divisionCode: division.code,
                                                divisionName: division.nom
                                              }
                                            }));
                                          }}
                                          placeholder="Rechercher une localisation..."
                                        />
                                      ) : (
                                        <p className="font-medium">
                                          {(() => {
                                            // Utiliser directement divisionNom de l'API si disponible
                                            const divisionNom = appDetails[app.id]?.divisionNom;
                                            if (divisionNom && divisionNom !== 'Division inconnue') {
                                              return divisionNom;
                                            }
                                            
                                            // Utiliser divisionCode directement si disponible
                                            const divisionCode = appDetails[app.id]?.divisionCode;
                                            if (divisionCode) {
                                              return `Division ${divisionCode}`;
                                            }
                                            
                                            // Fallback vers l'ancien système si divisionNom n'est pas disponible
                                            const divisionId = appDetails[app.id]?.divisionId || appDetails[app.id]?.division_id;
                                            if (divisionId) {
                                              // Charger le nom si pas encore fait
                                              if (!divisionNames[divisionId]) {
                                                if (!loadingDivisions.has(divisionId)) {
                                                  loadDivisionName(divisionId, app.id);
                                                }
                                                return 'Chargement...';
                                              }
                                              return divisionNames[divisionId];
                                            }
                                            return '—';
                                          })()
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-3 pt-2">
                                    {/* Debug info */}
                                    {process.env.NODE_ENV === 'development' && (
                                      <div className="text-xs text-gray-500 mr-auto">
                                        Mode édition: {appEditMode[app.id] ? 'ON' : 'OFF'} | App ID: {app.id}
                                      </div>
                                    )}
                                    
                                    {appEditMode[app.id] ? (
                                      <>
                                        <button
                                          onClick={() => saveApplicationDetails(app.id)}
                                          disabled={!!appDetailsLoading[app.id]}
                                          className="bg-investmali-accent text-white px-4 py-2 rounded-lg hover:bg-investmali-accent/90 text-sm disabled:opacity-50"
                                        >
                                          Enregistrer
                                        </button>
                                        <button
                                          onClick={() => setAppEditMode(prev => ({ ...prev, [app.id]: false }))}
                                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                        >
                                          Annuler
                                        </button>
                                      </>
                                    ) : (
                                      canModifyApplication(app) ? (
                                        <button
                                          onClick={() => {
                                            console.log('🔧 Activation du mode édition pour:', app.id);
                                            setAppEditMode(prev => ({ ...prev, [app.id]: true }));
                                            // Initialiser les données d'édition avec les valeurs actuelles
                                            const currentDetails = appDetails[app.id] || {};
                                            setAppEditData(prev => ({
                                              ...prev,
                                              [app.id]: {
                                                businessName: currentDetails.businessName || currentDetails.business_name || currentDetails.nom || '',
                                              legalForm: currentDetails.legalForm || currentDetails.legal_form || currentDetails.formeJuridique || '',
                                              businessType: currentDetails.businessType || currentDetails.business_type || currentDetails.typeEntreprise || '',
                                              domaineActivite: currentDetails.domaineActivite || currentDetails.domaine_activite || currentDetails.businessActivity || '',
                                              sigle: currentDetails.sigle || currentDetails.acronym || '',
                                              divisionId: currentDetails.divisionId || currentDetails.division_id || currentDetails.divisionCode || ''
                                            }
                                          }));
                                        }}
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                                        title="Cliquez pour modifier les informations de cette demande"
                                      >
                                        ✏️ Modifier
                                      </button>
                                      ) : (
                                        <div className="text-sm text-gray-500 italic">
                                          Modifications bloquées - Étape: {(() => {
                                            const backendStage = appDetails[app.id]?.etapeValidation || appDetails[app.id]?.etape_validation;
                                            return normalizeStage(backendStage);
                                          })()}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-6">
                              {generateBusinessCreationSteps(app).map((step, index, steps) => (
                                  <div key={step.id} className="relative">
                                    {/* Connector line */}
                                    {index < steps.length - 1 && (
                                      <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
                                    )}
                                  <div className="flex items-start space-x-4">
                                    {getTrackingStatusIcon(step.status)}
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-3">
                                          <h5 className={`text-sm sm:text-base font-medium ${getTrackingStatusColor(step.status)}`}>
                                            {step.title}
                                          </h5>
                                          {/* Bouton pour modifier les données de cette étape - masqué si étape REGISSEUR ou plus */}
                                          {(() => {
                                            const appData = appDetails[app.id];
                                            const currentAgentStage = normalizeStage(appData?.etapeValidation || appData?.etape_validation || 'ACCUEIL');
                                            const currentStageIndex = stageOrder.indexOf(currentAgentStage);
                                            const hideEditButtons = currentStageIndex >= 1; // REGISSEUR ou plus
                                            
                                            if (hideEditButtons) return null;
                                            
                                            return stepDataEditMode[`${app.id}-${step.id}`] ? (
                                              <>
                                                <button
                                                  onClick={async () => {
                                                    console.log('💾 Sauvegarde des données de l\'étape:', step.id);
                                                    
                                                    if (step.id === 'participants') {
                                                      // Pour l'étape participants, sauvegarder tous les membres
                                                      const success = await saveAllMembresModifications(app.id);
                                                      if (success) {
                                                        setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                      }
                                                    } else {
                                                      // Pour les autres étapes, juste fermer le mode édition
                                                      setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                    }
                                                  }}
                                                  className="bg-investmali-accent text-white px-2 py-1 rounded text-xs hover:bg-investmali-accent/90"
                                                  title="Sauvegarder les modifications"
                                                >
                                                  ✓ Enregistrer
                                                </button>
                                                <button
                                                  onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200"
                                                  title="Annuler les modifications"
                                                >
                                                  ✕ Annuler
                                                </button>
                                              </>
                                            ) : (
                                              <button
                                                onClick={() => {
                                                  console.log(`🔧 Activation édition étape ${step.id} pour application ${app.id}`);
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: true }));
                                                }}
                                                className="bg-investmali-accent text-white px-2 py-1 rounded text-xs hover:bg-investmali-accent/90 transition-colors"
                                                title={`Modifier les données de l'étape: ${step.title}`}
                                              >
                                                ✏️ Modifier
                                              </button>
                                            );
                                          })()}
                                        </div>
                                        <span className="text-sm text-gray-500">{step.estimatedDuration}</span>
                                      </div>
                                      
                                      <p className="text-gray-600 mb-2">{step.description}</p>
                                      
                                      {/* Formulaire d'édition des données de l'étape */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'company-info' && (
                                        <div className="mt-4 p-4 bg-investmali-primary/5 border border-investmali-primary/20 rounded-lg">
                                          <h6 className="font-medium text-investmali-primary mb-3">Modification des informations de l'entreprise</h6>
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Nom de l'entreprise</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={appDetails[app.id]?.businessName || appDetails[app.id]?.business_name || appDetails[app.id]?.nom || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Forme juridique</label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                                  <option value="">Sélectionner</option>
                                                  <option value="SA">SA (Société Anonyme)</option>
                                                  <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                                                  <option value="E_I">Entreprise Individuelle</option>
                                                  <option value="SNC">SNC (Société en Nom Collectif)</option>
                                                  <option value="SCS">SCS (Société en Commandite Simple)</option>
                                                  <option value="Société à Responsabilité Limitée">Société à Responsabilité Limitée</option>
                                                  <option value="Société à Responsabilité Limitée Unipersonnelle">Société à Responsabilité Limitée Unipersonnelle</option>
                                                  <option value="Succursale de SARL">Succursale de SARL</option>
                                                  <option value="Filiale de SARL">Filiale de SARL</option>
                                                  <option value="Société Anonyme">Société Anonyme</option>
                                                  <option value="Succursale de SA">Succursale de SA</option>
                                                  <option value="Filiale de SA">Filiale de SA</option>
                                                  <option value="Société par Actions Simplifiées Unipersonnelle">Société par Actions Simplifiées Unipersonnelle</option>
                                                  <option value="Société par Actions Simplifiées">Société par Actions Simplifiées</option>
                                                  <option value="Bureau de Représentation">Bureau de Représentation</option>
                                                  <option value="Filiale de SAS">Filiale de SAS</option>
                                                  <option value="Succursale de SAS">Succursale de SAS</option>
                                                  <option value="Société en Nom Collectif">Société en Nom Collectif</option>
                                                  <option value="Société en Commandite Simple">Société en Commandite Simple</option>
                                                  <option value="Société Civile Immobilière">Société Civile Immobilière</option>
                                                  <option value="Société Civile Professionnelle">Société Civile Professionnelle</option>
                                                  <option value="Groupement d'Intérêt Economique">Groupement d'Intérêt Economique</option>
                                                  <option value="Entreprise Individuelle">Entreprise Individuelle</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Type d'entreprise</label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                                  <option value="">Sélectionner</option>
                                                  <option value="SOCIETE">Société</option>
                                                  <option value="ENTREPRISE_INDIVIDUELLE">Entreprise Individuelle</option>
                                                  <option value="Société">Société</option>
                                                  <option value="Entreprise individuelle">Entreprise individuelle</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Domaine d'activité</label>
                                                <select 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  defaultValue={appDetails[app.id]?.domaineActivite || appDetails[app.id]?.domaine_activite || ''}
                                                >
                                                  <option value="">-- Sélectionner un domaine --</option>
                                                  {domaineActiviteOptions.map(domaine => (
                                                    <option key={domaine.key} value={domaine.key}>
                                                      {domaine.value}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Sigle</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={appDetails[app.id]?.sigle || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Localisation</label>
                                                <DivisionSearchInput
                                                  onSelect={(division) => {
                                                    setAppEditData(prev => ({
                                                      ...prev,
                                                      [app.id]: {
                                                        ...prev[app.id],
                                                        divisionId: division.id,
                                                        divisionCode: division.code,
                                                        divisionName: division.nom
                                                      }
                                                    }));
                                                  }}
                                                  placeholder="Rechercher une localisation..."
                                                />
                                              </div>
                                            </div>
                                            <div className="flex justify-end space-x-3 pt-2">
                                              <div className="text-xs text-gray-500 mr-auto">
                                                Mode édition: ON | App ID: {app.id}
                                              </div>
                                              <button 
                                                onClick={() => {
                                                  console.log('💾 Sauvegarde des données entreprise');
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                }}
                                                className="bg-investmali-accent text-white px-4 py-2 rounded-lg hover:bg-investmali-accent/90 text-sm"
                                              >
                                                Enregistrer
                                              </button>
                                              <button 
                                                onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                              >
                                                Annuler
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Formulaire pour les informations personnelles */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'personal-info' && (
                                        <div className="mt-4 p-4 bg-investmali-accent/5 border border-investmali-accent/20 rounded-lg">
                                          <h6 className="font-medium text-investmali-accent mb-3">Modification des informations personnelles</h6>
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={user?.firstName || user?.prenom || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Nom</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={user?.lastName || user?.nom || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Email</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="email" 
                                                  defaultValue={user?.email || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="tel" 
                                                  defaultValue={user?.phone || ''}
                                                />
                                              </div>
                                            </div>
                                            <div className="flex justify-end space-x-3 pt-2">
                                              <button 
                                                onClick={() => {
                                                  console.log('💾 Sauvegarde des informations personnelles');
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                }}
                                                className="bg-investmali-accent text-white px-4 py-2 rounded-lg hover:bg-investmali-accent/90 text-sm"
                                              >
                                                Enregistrer
                                              </button>
                                              <button 
                                                onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                              >
                                                Annuler
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Formulaire pour les participants et associés */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'participants' && (
                                        <div className="mt-4 p-4 bg-investmali-primary/5 border border-investmali-primary/20 rounded-lg">
                                          <h6 className="font-medium text-investmali-primary mb-4">Gestion des participants et associés</h6>
                                          
                                          {/* Liste des participants */}
                                          <div className="space-y-4">
                                            {(() => {
                                              const appData = appDetails[app.id];
                                              console.log('🔍 Données complètes app:', appData);
                                              
                                              // Récupération des membres comme dans EntrepriseDetails.tsx
                                              const membres = appData?.membres || [];
                                              console.log('👥 Membres trouvés:', membres);
                                              
                                              if (!membres || membres.length === 0) {
                                                return (
                                                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                    <p className="text-gray-600 mb-2">Aucun membre trouvé pour cette entreprise</p>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                      Les membres n'ont pas encore été ajoutés ou ne sont pas disponibles dans les données.
                                                    </p>
                                                    <button className="bg-investmali-primary text-white px-4 py-2 rounded-lg hover:bg-investmali-primary/90 transition-colors">
                                                      ➕ Ajouter le premier membre
                                                    </button>
                                                  </div>
                                                );
                                              }
                                              
                                              return membres.map((membre: any, index: number) => (
                                                <form 
                                                  key={membre.personId || index} 
                                                  className="bg-white p-4 rounded-lg border border-investmali-primary/20"
                                                  data-membre-id={membre.personId || index}
                                                >
                                                  <div className="flex items-center justify-between mb-3">
                                                    <h6 className="font-medium text-gray-800">
                                                      Membre #{index + 1} - {membre.prenom || ''} {membre.nom || ''}
                                                    </h6>
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                                                      <input 
                                                        name="prenom"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="text" 
                                                        key={`prenom-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.prenom || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Nom</label>
                                                      <input 
                                                        name="nom"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="text" 
                                                        key={`nom-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.nom || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                                                      <input 
                                                        name="telephone"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="tel" 
                                                        key={`telephone-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.telephone || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Téléphone 2 (optionnel)</label>
                                                      <input 
                                                        name="telephone2"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="tel" 
                                                        key={`telephone2-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.telephone2 || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Rôle</label>
                                                      <select 
                                                        name="role"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                                                        key={`role-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.role || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      >
                                                        <option value="">Sélectionner un rôle</option>
                                                        <option value="GERANT">Gérant</option>
                                                        <option value="PROMOTEUR">Promoteur</option>
                                                        <option value="DIRIGEANT">Dirigeant</option>
                                                        <option value="ASSOCIE">Associé</option>
                                                       
                                                      </select>
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Part (%)</label>
                                                      <input 
                                                        name="pourcentageParts"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="number" 
                                                        min="0" 
                                                        max="100" 
                                                        key={`pourcentageParts-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.pourcentageParts || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Email</label>
                                                      <input 
                                                        name="email"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="email" 
                                                        key={`email-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.email || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    {membre.dateNaissance && (
                                                      <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Date de naissance</label>
                                                        <input 
                                                          name="dateNaissance"
                                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                          type="date" 
                                                          defaultValue={membre.dateNaissance ? membre.dateNaissance.split('T')[0] : ''}
                                                          disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                        />
                                                      </div>
                                                    )}
                                                    {(membre.situationMatrimoniale !== undefined && membre.situationMatrimoniale !== null) && (
                                                      <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Situation matrimoniale</label>
                                                        <select 
                                                          name="situationMatrimoniale"
                                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                                                          defaultValue={membre.situationMatrimoniale === true || membre.situationMatrimoniale === 'true' ? 'marie' : 'celibataire'}
                                                          disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                        >
                                                          <option value="celibataire">Célibataire</option>
                                                          <option value="marie">Marié(e)</option>
                                                        </select>
                                                      </div>
                                                    )}
                                                    {membre.dateDebut && (
                                                      <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Date début</label>
                                                        <input 
                                                          name="dateDebut"
                                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                          type="date" 
                                                          defaultValue={membre.dateDebut ? membre.dateDebut.split('T')[0] : ''}
                                                          disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                </form>
                                              ));
                                            })()}

                                            {/* Bouton pour ajouter un nouveau participant */}
                                            <div className="border-2 border-dashed border-investmali-primary/30 rounded-lg p-6 text-center">
                                              <button className="bg-investmali-primary text-white px-4 py-2 rounded-lg hover:bg-investmali-primary/90 transition-colors">
                                                ➕ Ajouter un nouveau participant
                                              </button>
                                            </div>

                                            {/* Résumé des parts */}
                                            {(() => {
                                              const appData = appDetails[app.id];
                                              const membres = appData?.membres || [];
                                              
                                              if (membres.length === 0) return null;
                                              
                                              const totalParts = membres.reduce((sum: number, m: any) => {
                                                const part = parseFloat(m.pourcentageParts || 0);
                                                return sum + (isNaN(part) ? 0 : part);
                                              }, 0);
                                              
                                              const gerants = membres.filter((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR').length;
                                              const dirigeants = membres.filter((m: any) => m.role === 'DIRIGEANT').length;
                                              const associes = membres.filter((m: any) => m.role === 'ASSOCIE').length;
                                              const fondateurs = membres.filter((m: any) => m.role === 'FONDATEUR').length;
                                              
                                              return (
                                                <div className="bg-investmali-primary/10 p-4 rounded-lg">
                                                  <h6 className="font-medium text-investmali-primary mb-2 block">Résumé des participations</h6>
                                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                      <span className="text-gray-600">Total des parts :</span>
                                                      <span className={`font-medium ml-2 ${totalParts === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {totalParts.toFixed(1)}%
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-600">Membres :</span>
                                                      <span className="font-medium ml-2">{membres.length}</span>
                                                    </div>
                                                    {gerants > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Gérants :</span>
                                                        <span className="font-medium ml-2">{gerants}</span>
                                                      </div>
                                                    )}
                                                    {dirigeants > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Dirigeants :</span>
                                                        <span className="font-medium ml-2">{dirigeants}</span>
                                                      </div>
                                                    )}
                                                    {associes > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Associés :</span>
                                                        <span className="font-medium ml-2">{associes}</span>
                                                      </div>
                                                    )}
                                                    {fondateurs > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Fondateurs :</span>
                                                        <span className="font-medium ml-2">{fondateurs}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  {totalParts !== 100 && (
                                                    <div className="mt-2 text-xs text-red-600">
                                                      ⚠️ Le total des parts doit être égal à 100%
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </div>

                                          {/* Boutons de contrôle */}
                                          <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-investmali-primary/20">
                                            <button 
                                              onClick={async () => {
                                                console.log('💾 Sauvegarde des participants et associés');
                                                const success = await saveAllMembresModifications(app.id);
                                                if (success) {
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                }
                                              }}
                                              className="bg-investmali-accent text-white px-4 py-2 rounded-lg hover:bg-investmali-accent/90 text-sm"
                                              title="Sauvegarder les modifications"
                                            >
                                              ✓ Enregistrer
                                            </button>
                                            <button 
                                              onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                            >
                                              Annuler
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Formulaire pour les documents */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'documents' && (
                                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                          <h6 className="font-medium text-orange-800 mb-4">Gestion des documents et pièces justificatives</h6>
                                          
                                          {/* Charger les documents au clic */}
                                          {(() => {
                                            // Charger les documents si pas encore fait
                                            if (!documents[app.id] && !documentsLoading[app.id]) {
                                              loadDocuments(app.id);
                                            }
                                            
                                            const appDocuments = documents[app.id] || [];
                                            const isLoading = documentsLoading[app.id];
                                            const error = documentsError[app.id];
                                            
                                            console.log(' Documents pour app', app.id, ':', appDocuments);
                                            
                                            if (isLoading) {
                                              return (
                                                <div className="text-center py-8">
                                                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mb-2"></div>
                                                  <p className="text-gray-600">Chargement des documents...</p>
                                                </div>
                                              );
                                            }
                                            
                                            if (error) {
                                              return (
                                                <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                                                  <p className="text-red-600 mb-2">Erreur lors du chargement des documents</p>
                                                  <p className="text-sm text-red-500 mb-4">{error}</p>
                                                  <button 
                                                    onClick={() => loadDocuments(app.id)}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                                  >
                                                    Réessayer
                                                  </button>
                                                </div>
                                              );
                                            }
                                            
                                            if (appDocuments.length === 0) {
                                              return (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                  <p className="text-gray-600 mb-2">Aucun document trouvé pour cette entreprise</p>
                                                  <p className="text-sm text-gray-500 mb-4">
                                                    Les documents n'ont pas encore été uploadés ou ne sont pas disponibles.
                                                  </p>
                                                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                                                    Ajouter des documents
                                                  </button>
                                                </div>
                                              );
                                            }
                                            
                                            // Fonction pour obtenir le nom du type de document (comme dans EntrepriseDetails.tsx)
                                            const getDocumentTypeName = (type: string) => {
                                              if (!type) return 'Document';
                                              
                                              const typeNames: Record<string, string> = {
                                                'EXTRAIT_NAISSANCE': 'Extrait de naissance',
                                                'CERTIFICAT_RESIDENCE': 'Certificat de résidence',
                                                'CASIER_JUDICIAIRE': 'Casier judiciaire',
                                                'STATUS_SOCIETE': 'Statuts de société',
                                                'STATUTS_SOCIETE': 'Statuts de société',
                                                'ACTE_MARIAGE': 'Acte de mariage',
                                                'DECLARATION_HONNEUR': 'Déclaration sur l\'honneur',
                                                'REGISTRE_COMMERCE': 'Registre de commerce',
                                                'RCCM': 'RCCM',
                                                'ATTESTATION': 'Attestation',
                                                'CERTIFICAT': 'Certificat',
                                                'CONTRAT': 'Contrat',
                                                'FACTURE': 'Facture',
                                                'RECU': 'Reçu'
                                              };
                                              
                                              return typeNames[type.toUpperCase()] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                            };
                                            
                                            const getPieceTypeName = (type: string) => {
                                              if (!type) return 'Pièce d\'identité';
                                              
                                              const typeNames: Record<string, string> = {
                                                'PASSEPORT': 'Passeport',
                                                'CNI': 'Carte Nationale d\'Identité',
                                                'CARTE_CONSULAIRE': 'Carte consulaire',
                                                'CARTE_ELECTEUR': 'Carte d\'électeur',
                                                'CARTE_IDENTITE': 'Carte d\'identité',
                                                'ACTE_NAISSANCE': 'Acte de naissance'
                                              };
                                              
                                              return typeNames[type.toUpperCase()] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                            };
                                            
                                            const formatDate = (dateString: string) => {
                                              if (!dateString) return 'Date non disponible';
                                              
                                              try {
                                                const date = new Date(dateString);
                                                if (isNaN(date.getTime())) {
                                                  return 'Date invalide';
                                                }
                                                
                                                return date.toLocaleDateString('fr-FR', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                });
                                              } catch (error) {
                                                return 'Date invalide';
                                              }
                                            };
                                            
                                            return (
                                              <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-4">
                                                  <p className="text-sm text-gray-600">
                                                    {appDocuments.length} document{appDocuments.length > 1 ? 's' : ''} trouvé{appDocuments.length > 1 ? 's' : ''}
                                                  </p>
                                                  <button 
                                                    onClick={() => loadDocuments(app.id)}
                                                    className="text-orange-600 hover:text-orange-700 text-sm"
                                                  >
                                                    Actualiser
                                                  </button>
                                                </div>
                                                
                                                {appDocuments.map((doc: any, index: number) => (
                                                  <div key={doc.id || index} className="bg-white p-4 rounded-lg border border-orange-200">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                          <h3 className="font-medium text-gray-900">
                                                            {(doc.typeDocument || doc.type_document) ? 
                                                              getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                                                             (doc.typePiece || doc.type_piece) ? 
                                                              getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document sans type'}
                                                          </h3>
                                                          {(doc.typePiece || doc.type_piece) && (doc.typeDocument || doc.type_document) && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-investmali-primary/10 text-investmali-primary">
                                                              {getPieceTypeName((doc.typePiece || doc.type_piece) || '')}
                                                            </span>
                                                          )}
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500">
                                                          <div>
                                                            <span className="font-medium">Numéro:</span> 
                                                            <span className={(doc.numero || doc.num_piece) ? 'text-gray-900' : 'text-red-500 italic'}>
                                                              {doc.numero || doc.num_piece || 'Numéro manquant'}
                                                            </span>
                                                          </div>
                                                          <div>
                                                            <span className="font-medium">Créé le:</span> 
                                                            <span className="text-gray-900">{formatDate((doc.dateCreation || doc.created_at) || '')}</span>
                                                          </div>
                                                          {(doc.dateExpiration || doc.date_expiration) && (
                                                            <div>
                                                              <span className="font-medium">Expire le:</span> 
                                                              <span className="text-gray-900">
                                                                {formatDate((doc.dateExpiration || doc.date_expiration) || '')}
                                                              </span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                      
                                                      <div className="flex space-x-2 ml-4">
                                                        <button 
                                                          onClick={() => handleViewDocument(
                                                            doc.id, 
                                                            (doc.typeDocument || doc.type_document) ? getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                                                            (doc.typePiece || doc.type_piece) ? getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document'
                                                          )}
                                                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                          title="Voir le document"
                                                        >
                                                          👁️ Voir
                                                        </button>
                                                        <button 
                                                          onClick={() => handleDownloadDocumentById(
                                                            doc.id, 
                                                            (doc.typeDocument || doc.type_document) ? getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                                                            (doc.typePiece || doc.type_piece) ? getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document'
                                                          )}
                                                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                          title="Télécharger le document"
                                                        >
                                                          📥 Télécharger
                                                        </button>
                                                        {stepDataEditMode[`${app.id}-documents`] && (
                                                          <>
                                                            <input
                                                              type="file"
                                                              id={`file-replace-${doc.id || index}`}
                                                              className="hidden"
                                                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                              onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                  const success = await replaceDocument(app.id, doc.id || index.toString(), file);
                                                                  if (success) {
                                                                    // Reset le input file
                                                                    e.target.value = '';
                                                                  }
                                                                }
                                                              }}
                                                            />
                                                            <button 
                                                              onClick={() => {
                                                                const fileInput = document.getElementById(`file-replace-${doc.id || index}`) as HTMLInputElement;
                                                                fileInput?.click();
                                                              }}
                                                              disabled={documentUploadLoading[`${app.id}-${doc.id || index}`]}
                                                              className="inline-flex items-center px-2 py-1 border border-orange-300 shadow-sm text-xs font-medium rounded text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50"
                                                              title="Remplacer ce document"
                                                            >
                                                              {documentUploadLoading[`${app.id}-${doc.id || index}`] ? '🔄' : '✏️'} Modifier
                                                            </button>
                                                          </>
                                                        )}
                                                        {stepDataEditMode[`${app.id}-documents`] && (
                                                          <>
                                                            {documentDeleteConfirm === `${app.id}-${doc.id || index}` ? (
                                                              <div className="inline-flex items-center space-x-1">
                                                                <button 
                                                                  onClick={async () => {
                                                                    await deleteDocument(app.id, doc.id || index.toString());
                                                                    setDocumentDeleteConfirm(null);
                                                                  }}
                                                                  disabled={documentUploadLoading[`${app.id}-${doc.id || index}`]}
                                                                  className="inline-flex items-center px-2 py-1 border border-red-500 shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                                                  title="Confirmer la suppression"
                                                                >
                                                                  ✓ Confirmer
                                                                </button>
                                                                <button 
                                                                  onClick={() => setDocumentDeleteConfirm(null)}
                                                                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                  title="Annuler la suppression"
                                                                >
                                                                  ✕ Annuler
                                                                </button>
                                                              </div>
                                                            ) : (
                                                              <button 
                                                                onClick={() => setDocumentDeleteConfirm(`${app.id}-${doc.id || index}`)}
                                                                disabled={documentUploadLoading[`${app.id}-${doc.id || index}`]}
                                                                className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                                                title="Supprimer ce document"
                                                              >
                                                                {documentUploadLoading[`${app.id}-${doc.id || index}`] ? '🔄' : '🗑️'} Supprimer
                                                              </button>
                                                            )}
                                                          </>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                                
                                                {/* Bouton pour ajouter des documents */}
                                                <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
                                                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                                                    Ajouter des documents
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {/* Boutons de contrôle */}
                                          <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-orange-200">
                                            <button 
                                              onClick={() => {
                                                console.log(' Sauvegarde des documents');
                                                setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                              }}
                                              className="bg-investmali-accent text-white px-4 py-2 rounded-lg hover:bg-investmali-accent/90 text-sm"
                                            >
                                              Enregistrer les modifications
                                            </button>
                                            <button 
                                              onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                            >
                                              Annuler
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {!stepDataEditMode[`${app.id}-${step.id}`] && step.details && (
                                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                                          {step.details}
                                        </div>
                                      )}
                                      
                                      {step.completedAt && (
                                        <div className="mt-2 text-sm text-green-600">
                                          ✓ Complété le {formatDate(step.completedAt)}
                                        </div>
                                      )}
                                    </div>
                                    </div>
                                  </div>
                                ))
                              }
                            
                            </div>

                            {/* Support Section */}
                            <div className="mt-8 p-4 bg-gradient-to-r from-investmali-accent/10 to-investmali-warning/10 rounded-xl border border-investmali-accent/20">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                  <h5 className="text-sm sm:text-base font-medium text-investmali-neutral-dark">Besoin d'aide avec cette demande ?</h5>
                                  <p className="text-xs sm:text-sm text-gray-600">Notre équipe support est là pour vous accompagner</p>
                                </div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                                  <button 
                                    onClick={() => {
                                      setActiveTab('messages');
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="bg-investmali-accent text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-investmali-accent/90 transition-colors text-xs sm:text-sm flex items-center justify-center space-x-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>Chat Support</span>
                                  </button>
                                  <a 
                                    href="tel:+22320292929"
                                    className="bg-gray-100 text-gray-700 px-3 py-2 sm:px-4 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm flex items-center justify-center space-x-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>+223 20 29 29 29</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark">Mes Conversations</h2>
                  <div className="flex items-center space-x-4">
                    {conversationsLoading && <p className="text-sm text-gray-500">Chargement...</p>}
                  </div>
                </div>

                <div className="h-[200vh] sm:h-[800px] flex flex-col sm:flex-row border border-gray-200 rounded-xl overflow-hidden">
                  {/* Liste des conversations */}
                  <div className="w-full sm:w-1/3 h-32 sm:h-full border-b sm:border-b-0 sm:border-r border-gray-200 bg-gray-50 flex flex-col">
                    <div className="p-2 sm:p-4 border-b border-gray-200 flex-shrink-0">
                      <h3 className="text-sm sm:text-base font-semibold text-investmali-neutral-dark">Conversations</h3>
                      {conversations.length > 0 && (
                        <p className="text-xs sm:text-sm text-gray-600">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(100% - 80px)' }}>
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => selectConversation(conv)}
                          className={`p-2 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                            selectedConversation?.id === conv.id ? 'bg-white border-l-4 border-l-mali-emerald' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-investmali-neutral-dark">{conv.entreprise_name}</h4>
                              <p className="text-xs text-gray-600">Agent: {conv.agent_name}</p>
                              {conv.last_message_content && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {conv.last_message_content}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              {conv.unread_count > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                                  {conv.unread_count}
                                </span>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {conv.total_messages} msg
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {conversations.length === 0 && !conversationsLoading && (
                        <div className="p-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                          </svg>
                          <p>Aucune conversation</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Zone de chat */}
                  <div className="flex-1 flex flex-col h-full sm:h-auto">
                    {selectedConversation ? (
                      <>
                        {/* En-tête de conversation */}
                        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                          <h3 className="font-semibold text-investmali-neutral-dark">{selectedConversation.entreprise_name}</h3>
                          <p className="text-sm text-gray-600">Agent: {selectedConversation.agent_name}</p>
                        </div>

                        {/* Messages */}
                        <div className="overflow-y-auto flex-1 min-h-0 bg-gray-50">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex p-4 ${message.messageType === 'USER' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                    message.messageType === 'USER'
                                      ? 'bg-gradient-to-r from-investmali-accent to-investmali-warning text-white'
                                      : 'bg-white text-gray-800 border border-gray-200'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${message.messageType === 'USER' ? 'text-white opacity-75' : 'text-gray-500'}`}>
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Zone de saisie */}
                        <div className="border-t border-gray-200 p-2 sm:p-4 bg-white flex-shrink-0">
                          <div className="flex space-x-2 sm:space-x-3">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              placeholder="Tapez votre réponse..."
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm"
                              disabled={sending}
                            />
                            <button
                              onClick={sendMessage}
                              disabled={sending || !newMessage.trim()}
                              className="bg-gradient-to-r from-investmali-accent to-investmali-warning text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {sending ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500">
                          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                          </svg>
                          <p className="text-base sm:text-lg font-medium">Sélectionnez une conversation</p>
                          <p className="text-sm">Choisissez une conversation dans la liste pour commencer</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {/* {activeTab === 'settings' && (
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark mb-6">Paramètres du Compte</h2>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-medium text-investmali-neutral-dark mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notifications par email</p>
                          <p className="text-sm text-gray-500">Recevoir des mises à jour sur vos demandes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mali-emerald/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-investmali-accent"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-base sm:text-lg font-medium text-investmali-neutral-dark mb-4">Sécurité</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Authentification à deux facteurs</p>
                          <p className="text-sm text-gray-500">Ajouter une couche de sécurité supplémentaire</p>
                        </div>
                        <button className="bg-investmali-accent text-white px-4 py-2 rounded-lg hover:bg-investmali-accent/90 transition-colors text-sm">
                          Activer
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = '/';
                      }}
                      className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* Bouton de chat flottant */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          {/* <button
            onClick={() => {
              setIsChatOpen(true);
              resetUnreadCount(); // Réinitialiser le compteur quand on ouvre le chat
            }}
            className="relative bg-gradient-to-r from-investmali-accent to-investmali-warning text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            title="Contacter l'assistance"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button> */}
        </div>

        {/* Modal de chat */}
        <UserChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          user={user}
          entrepriseId={firstEntrepriseId}
        />

        {/* Document Viewer Modal */}
        {selectedDocumentId && (
          <DocumentViewer
            documentId={selectedDocumentId}
            documentName={selectedDocumentName}
            onClose={handleCloseDocumentViewer}
          />
        )}

        {/* Payment Method Modal */}
        <PaymentMethodModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          entrepriseId={selectedEntrepriseForPayment}
          amount={selectedEntrepriseAmount}
          onMethodSelected={handlePaymentMethodSelected}
        />

        {/* Modal du reçu */}
        {receiptModalOpen && receiptData && (
          <PaymentReceipt
            paymentData={receiptData}
            onClose={() => setReceiptModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfile;

=======
import React, { useState, useEffect } from 'react';
import DocumentViewer from './DocumentViewer';
import AnimatedBackground from './AnimatedBackground';
import { businessAPI, apiUtils, enumsAPI, chatAPI, apiRequest } from '../services/api';
import { divisionService } from '../services/divisionService';
import UserChatModal from './UserChatModal';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import PaymentMethodModal from './PaymentMethodModal';
import { useNavigate } from 'react-router-dom';
import DivisionSearchInput from './DivisionSearchInput';

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedDuration: string;
  completedAt?: string;
  details?: string;
}

interface BusinessApplication {
  id: string;
  companyName: string;
  businessName?: string;
  legalForm: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  submittedAt: string;
  totalAmount: number;
  currentStep?: string;
  overallProgress: number;
  estimatedCompletion: string;
  steps: TrackingStep[];
}

const stageProgressMap: Record<string, number> = {
  ACCUEIL: 14.28,
  REGISSEUR: 28.56,
  REVISION: 42.84,
  IMPOT: 57.12,
  RCCM1: 71.4,
  RCCM2: 85.68,
  NINA: 92.84,
  RETRAIT: 100,
};

const stageOrder: string[] = [
  'ACCUEIL',
  'REGISSEUR',
  'REVISION',
  'IMPOT',
  'RCCM1',
  'RCCM2',
  'NINA',
  'RETRAIT'
];

const normalizeStage = (stage?: string): string => {
  if (!stage) return 'ACCUEIL';
  const upper = stage.toString().trim().toUpperCase();
  switch (upper) {
    case 'IMPOTS':
    case 'IMPÔTS':
      return 'IMPOT';
    case 'ACCUEIL':
    case 'REGISSEUR':
    case 'REVISION':
    case 'IMPOT':
    case 'RCCM1':
    case 'RCCM2':
    case 'NINA':
    case 'RETRAIT':
      return upper;
    default:
      return upper;
  }
};

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // États pour le système de paiement
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEntrepriseForPayment, setSelectedEntrepriseForPayment] = useState<string>('');
  const [selectedEntrepriseAmount, setSelectedEntrepriseAmount] = useState<number>(0);
  
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  
  // Hook pour les notifications (utiliser la première entreprise ou une valeur par défaut)
  const firstEntrepriseId = applications.length > 0 ? applications[0].id : "default-entreprise";
  const { unreadCount, resetUnreadCount } = useNotifications(firstEntrepriseId);
  
  // Debug: Log du compteur de notifications
  useEffect(() => {
    console.log('🔔 Compteur notifications mis à jour:', unreadCount);
  }, [unreadCount]);
  
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  // Détails par demande (chargés à l'ouverture du suivi détaillé)
  const [appDetails, setAppDetails] = useState<Record<string, any>>({});
  const [appDetailsLoading, setAppDetailsLoading] = useState<Record<string, boolean>>({});
  const [appDetailsError, setAppDetailsError] = useState<Record<string, string | null>>({});
  const [appDetailsSuccess, setAppDetailsSuccess] = useState<Record<string, string | null>>({});
  const [appEditMode, setAppEditMode] = useState<Record<string, boolean>>({});
  const [appEditData, setAppEditData] = useState<Record<string, any>>({});
  // États pour l'édition des données des étapes
  const [stepDataEditMode, setStepDataEditMode] = useState<Record<string, boolean>>({});
  // État pour l'édition des participants individuels
  const [participantEditMode, setParticipantEditMode] = useState<Record<string, boolean>>({});
  // États pour les documents de l'entreprise
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [documentsLoading, setDocumentsLoading] = useState<Record<string, boolean>>({});
  const [documentsError, setDocumentsError] = useState<Record<string, string | null>>({});
  // États pour le remplacement de documents
  const [documentReplaceMode, setDocumentReplaceMode] = useState<Record<string, boolean>>({});
  const [documentUploadLoading, setDocumentUploadLoading] = useState<Record<string, boolean>>({});
  // État pour la confirmation de suppression
  const [documentDeleteConfirm, setDocumentDeleteConfirm] = useState<string | null>(null);
  // Toasts globaux
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; text: string }>>([]);
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Options dynamiques depuis backend (fallback vides)
  const [legalFormOptions, setLegalFormOptions] = useState<string[]>([]);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<string[]>([]);
  // Cache pour les divisions (éviter rechargements)
  const [divisionsCache, setDivisionsCache] = useState<Record<string, any>>({});

  // Ouvrir l'onglet ciblé via query param: /profile?tab=applications
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'profile' || tab === 'applications' || tab === 'settings') {
      setActiveTab(tab as any);
    }
  }, []);

  // Charger les enums pour les selects
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const [forms, types] = await Promise.all([
          enumsAPI.getSocieteJuridictions(),
          enumsAPI.getTypeEntreprises()
        ]);
        // Debug: Afficher les données reçues
        console.log('🔍 Enums reçus du backend:', { forms, types });
        
        // Traiter les formes juridiques - extraire les labels si ce sont des objets
        const processedForms = Array.isArray(forms) ? forms.map((form, index) => {
          if (typeof form === 'object' && form !== null) {
            console.log(`📋 Forme juridique ${index}:`, form);
            return form.label || form.value || form.key || String(form);
          }
          return String(form);
        }) : [];
        
        // Traiter les types d'entreprise - extraire les labels si ce sont des objets  
        const processedTypes = Array.isArray(types) ? types.map((type, index) => {
          if (typeof type === 'object' && type !== null) {
            console.log(`🏢 Type entreprise ${index}:`, type);
            return type.label || type.value || type.key || String(type);
          }
          return String(type);
        }) : [];
        
        console.log('✅ Options traitées:', { processedForms, processedTypes });
        
        setLegalFormOptions(processedForms);
        setBusinessTypeOptions(processedTypes);
      } catch (e) {
        // En cas d'erreur, laisser les listes vides, l'utilisateur pourra saisir manuellement si nécessaire
        console.warn('Impossible de charger les enums', e);
      }
    };
    loadEnums();
  }, []);

  // Avertir en cas de navigation avec edition en cours
  useEffect(() => {
    const hasEditing = Object.values(appEditMode).some(Boolean);
    const handler = (e: BeforeUnloadEvent) => {
      if (hasEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [appEditMode]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setAppsLoading(true);
      setAppsError(null);
      try {
        const resp = await businessAPI.getMyApplications();
        // resp peut être un array ou un objet avec data; on gère les deux cas
        const list = Array.isArray(resp) ? resp : (resp?.data ?? []);
        const mapped: BusinessApplication[] = (list || []).map((a: any) => {
          // Debug: afficher les données reçues du backend
          console.log('🔍 DEBUG Frontend - Données reçues:', a);
          
          // Normalisations prudentes selon l'entité backend
          const statusRaw = (a.statutCreation || a.status || '').toString().toLowerCase();
          const totalAmount = Number(a.totalAmount ?? a.totalCost ?? a.total ?? a.amount ?? 0) || 0;
          const submittedAt = a.creation || a.createdAt || a.submittedAt || new Date().toISOString();
          // Fin estimée par défaut: +48h après la soumission si non fournie par l'API
          const estimatedCompletionCalculated = (() => {
            try {
              const base = new Date(submittedAt);
              if (isNaN(base.getTime())) return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
              return new Date(base.getTime() + 48 * 60 * 60 * 1000).toISOString();
            } catch {
              return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
            }
          })();
          const backendStage = a.etapeValidation || a.etape_validation || a.currentStep;
          const currentStep = normalizeStage(backendStage);
          const overallProgress = stageProgressMap[currentStep] ?? stageProgressMap.ACCUEIL;
          
          // Déterminer le status basé sur l'étape agent actuelle
          const status: BusinessApplication['status'] = 
            currentStep === 'RETRAIT' ? 'completed' :
            statusRaw.includes('reject') ? 'rejected' :
            'in-progress';
          return {
            id: String(a.id ?? a.applicationId ?? ''),
            companyName: a.nom || a.businessName || a.business_name || a.companyName || a.entrepriseName || '—',
            businessName: a.nom || a.businessName || a.business_name || a.companyName || a.entrepriseName || '—',
            legalForm: a.formeJuridique || a.legalForm || '—',
            status,
            submittedAt: a.creation || a.createdAt || a.submittedAt || new Date().toISOString(),
            totalAmount,
            currentStep,
            overallProgress,
            estimatedCompletion: a.estimatedCompletion || estimatedCompletionCalculated,
            steps: Array.isArray(a.steps) ? a.steps : [],
          };
        });
        setApplications(mapped);
      } catch (err) {
        setAppsError(apiUtils.formatError(err));
        setApplications([]);
      } finally {
        setAppsLoading(false);
      }
    };
    load();
  }, [user]);

  const loadApplicationDetails = async (id: string) => {
    // Eviter rechargements inutiles
    if (appDetails[id] || appDetailsLoading[id]) return;
    setAppDetailsLoading(prev => ({ ...prev, [id]: true }));
    setAppDetailsError(prev => ({ ...prev, [id]: null }));
    try {
      const resp = await businessAPI.getApplication(id);
      const data = (resp && resp.data) ? resp.data : resp;
      setAppDetails(prev => ({ ...prev, [id]: data }));
      // Préparer données d'édition (champs principaux)
      setAppEditData(prev => ({
        ...prev,
        [id]: {
          businessName: data.businessName || data.business_name || data.nom || data.companyName || '',
          legalForm: data.legalForm || data.legal_form || data.formeJuridique || '',
          businessType: data.businessType || data.business_type || data.typeEntreprise || '',
          domaineActivite: data.domaineActivite || data.domaine_activite || data.businessActivity || '',
          sigle: data.sigle || data.acronym || '',
          divisionId: data.divisionId || data.division_id || data.divisionCode || ''
        }
      }));
    } catch (e: any) {
      setAppDetailsError(prev => ({ ...prev, [id]: apiUtils.formatError(e) }));
    } finally {
      setAppDetailsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Fonction pour sauvegarder tous les membres modifiés
  const saveAllMembresModifications = async (entrepriseId: string): Promise<boolean> => {
    try {
      console.log('💾 Sauvegarde de tous les membres de l\'entreprise:', entrepriseId);
      
      const appData = appDetails[entrepriseId];
      const membres = appData?.membres || [];
      
      if (membres.length === 0) {
        addToast('success', 'Aucun membre à sauvegarder');
        return true;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Récupérer tous les formulaires des membres
      for (let i = 0; i < membres.length; i++) {
        const membre = membres[i];
        try {
          // Récupérer le formulaire par data-membre-id
          const formElement = document.querySelector(`[data-membre-id="${membre.personId || i}"]`) as HTMLFormElement;
          
          if (formElement) {
            console.log('📋 Formulaire trouvé pour membre:', membre.personId || i);
            
            // Créer FormData depuis le formulaire
            const formData = new FormData(formElement);
            
            // Debug: Afficher les données récupérées
            console.log('📝 Données récupérées du formulaire:');
            Array.from(formData.entries()).forEach(([key, value]) => {
              console.log(`  ${key}: ${value}`);
            });
            
            const success = await saveMembreModifications(entrepriseId, membre.personId || i.toString(), formData);
            if (success) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            console.error('❌ Formulaire non trouvé pour membre:', membre.personId || i);
            errorCount++;
          }
        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde du membre:', membre.personId || i, error);
          errorCount++;
        }
      }
      
      if (errorCount === 0) {
        console.log('🔄 Toutes les sauvegardes terminées, rechargement des données...');
        
        // Recharger les données seulement après toutes les sauvegardes
        await loadApplicationDetails(entrepriseId);
        
        addToast('success', `${successCount} membre(s) sauvegardé(s) avec succès`);
        return true;
      } else {
        addToast('error', `${errorCount} erreur(s) lors de la sauvegarde`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde globale:', error);
      addToast('error', 'Erreur lors de la sauvegarde des membres');
      return false;
    }
  };

  // Fonction pour sauvegarder les modifications d'un membre
  const saveMembreModifications = async (entrepriseId: string, membreId: string, formData: FormData): Promise<boolean> => {
    try {
      console.log('💾 Sauvegarde des modifications du membre:', membreId);
      
      // Récupérer les données du formulaire
      const membreData = {
        prenom: formData.get('prenom'),
        nom: formData.get('nom'),
        telephone: formData.get('telephone'),
        email: formData.get('email'),
        role: formData.get('role'),
        pourcentageParts: parseFloat(formData.get('pourcentageParts') as string) || 0,
        dateNaissance: formData.get('dateNaissance') || null,
        situationMatrimoniale: formData.get('situationMatrimoniale') === 'marie'
      };
      
      console.log('📝 Données à sauvegarder:', membreData);
      
      // Appel API pour mettre à jour le membre
      const response = await apiRequest(`/entreprises/${entrepriseId}/membres/${membreId}`, {
        method: 'PUT',
        body: JSON.stringify(membreData)
      });
      
      console.log('✅ Membre mis à jour avec succès:', response);
      
      // Ne pas recharger les données ici pour éviter d'écraser les modifications en cours
      // Le rechargement se fera après toutes les sauvegardes dans saveAllMembresModifications
      
      addToast('success', 'Membre mis à jour avec succès');
      
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde du membre:', error);
      addToast('error', `Erreur lors de la sauvegarde: ${apiUtils.formatError(error)}`);
      return false;
    }
  };

  // Fonction pour remplacer un document existant
  const replaceDocument = async (entrepriseId: string, documentId: string, file: File): Promise<boolean> => {
    try {
      console.log('🔄 Remplacement du document:', documentId, 'avec le fichier:', file.name);
      
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: true }));
      
      // S'assurer que les documents sont chargés
      if (!documents[entrepriseId] && !documentsLoading[entrepriseId]) {
        console.log('📄 Chargement des documents avant remplacement...');
        await loadDocuments(entrepriseId);
      }
      
      // Attendre que le chargement soit terminé
      if (documentsLoading[entrepriseId]) {
        console.log('⏳ Attente de la fin du chargement des documents...');
        // Attendre un peu que le chargement se termine
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Récupérer les informations du document existant pour connaître son type
      const appDocuments = documents[entrepriseId] || [];
      console.log('🔍 Documents disponibles pour entreprise', entrepriseId, ':', appDocuments);
      console.log('🔍 Recherche du document avec ID:', documentId);
      
      const existingDoc = appDocuments.find((doc: any) => doc.id === documentId);
      
      if (!existingDoc) {
        console.error('❌ Document non trouvé. IDs disponibles:', appDocuments.map((doc: any) => doc.id));
        throw new Error(`Document à remplacer non trouvé. ID recherché: ${documentId}`);
      }
      
      console.log('✅ Document trouvé:', existingDoc);
      
      // Utiliser le nouvel endpoint de mise à jour qui met à jour uniquement le fichier
      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = `/documents/${documentId}/file`;
      
      console.log('📡 Appel API de mise à jour:', endpoint);
      console.log('🔄 Mise à jour du fichier pour le document ID:', documentId);
      
      // Debug: Afficher les données envoyées
      console.log('📋 Données FormData envoyées:');
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      // Appel API réel pour mettre à jour le document
      const response = await apiRequest(endpoint, {
        method: 'PUT',
        body: formData
        // Ne pas définir Content-Type, le navigateur le fera automatiquement pour FormData
      });
      
      console.log('✅ Document mis à jour avec succès:', response);
      
      // Mise à jour optimiste : remplacer le document dans la liste avec les nouvelles données
      setDocuments(prev => {
        const currentDocs = prev[entrepriseId] || [];
        const updatedDocs = currentDocs.map(doc => 
          doc.id === documentId ? response : doc
        );
        
        console.log('🔄 Mise à jour optimiste - Document mis à jour dans la liste');
        console.log('📄 Document ID:', documentId);
        console.log('📄 Nouvelles données:', response);
        
        return { ...prev, [entrepriseId]: updatedDocs };
      });
      
      addToast('success', `Document "${file.name}" remplacé avec succès`);
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors du remplacement du document:', error);
      addToast('error', `Erreur lors du remplacement: ${apiUtils.formatError(error)}`);
      return false;
    } finally {
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: false }));
    }
  };

  // États pour la visualisation de documents (comme dans EntrepriseDetails)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');

  // Fonction pour voir un document (comme dans EntrepriseDetails)
  const handleViewDocument = (documentId: string, documentName: string) => {
    console.log('👁️ Ouverture du viewer pour le document:', documentId);
    setSelectedDocumentId(documentId);
    setSelectedDocumentName(documentName);
  };

  // Fonction pour fermer le viewer de document
  const handleCloseDocumentViewer = () => {
    setSelectedDocumentId(null);
    setSelectedDocumentName('');
  };

  // Fonction pour télécharger un document (comme dans EntrepriseDetails)
  const handleDownloadDocument = async (documentId: string, documentName: string) => {
    try {
      console.log('📥 Téléchargement du document:', documentId);
      
      // Utiliser le même endpoint que EntrepriseDetails mais avec le token user
      const response = await fetch(`${process.env.REACT_APP_USER_API_URL}/documents/${documentId}/file`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || `document_${documentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL blob
      URL.revokeObjectURL(url);
      
      console.log('✅ Téléchargement du document réussi');
      addToast('success', 'Téléchargement du document réussi');
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement:', error);
      addToast('error', 'Erreur lors du téléchargement du document');
    }
  };

  // Fonction pour supprimer un document
  const deleteDocument = async (entrepriseId: string, documentId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Suppression du document:', documentId);
      
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: true }));
      
      // TODO: Remplacer par l'endpoint réel de suppression de document
      // const response = await apiRequest(`/entreprises/${entrepriseId}/documents/${documentId}`, {
      //   method: 'DELETE'
      // });
      
      // Simulation pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Document supprimé avec succès');
      
      // Recharger les documents pour voir la liste mise à jour
      await loadDocuments(entrepriseId);
      
      addToast('success', 'Document supprimé avec succès');
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du document:', error);
      addToast('error', `Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
      return false;
    } finally {
      setDocumentUploadLoading(prev => ({ ...prev, [`${entrepriseId}-${documentId}`]: false }));
    }
  };

  // Fonction pour forcer le rechargement des documents
  const forceReloadDocuments = async (entrepriseId: string): Promise<void> => {
    console.log('🔄 Forçage du rechargement des documents pour:', entrepriseId);
    
    // Réinitialiser l'état des documents pour forcer le rechargement
    setDocuments(prev => ({ ...prev, [entrepriseId]: [] }));
    setDocumentsLoading(prev => ({ ...prev, [entrepriseId]: false }));
    setDocumentsError(prev => ({ ...prev, [entrepriseId]: null }));
    
    // Maintenant recharger
    await loadDocuments(entrepriseId);
  };

  // Fonction pour charger les documents d'une entreprise (comme dans EntrepriseDetails.tsx)
  const loadDocuments = async (entrepriseId: string): Promise<void> => {
    // Éviter rechargements inutiles
    if (documents[entrepriseId] || documentsLoading[entrepriseId]) return;
    
    setDocumentsLoading(prev => ({ ...prev, [entrepriseId]: true }));
    setDocumentsError(prev => ({ ...prev, [entrepriseId]: null }));
    
    try {
      console.log('📄 Chargement des documents de l\'entreprise:', entrepriseId);
      
      // Appel API pour récupérer les documents (même endpoint que dans EntrepriseDetails.tsx)
      const response = await apiRequest(`/documents/entreprise/${entrepriseId}`);
      
      console.log('📄 Documents récupérés:', response);
      setDocuments(prev => ({ ...prev, [entrepriseId]: response || [] }));
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      setDocumentsError(prev => ({ ...prev, [entrepriseId]: apiUtils.formatError(error) }));
      setDocuments(prev => ({ ...prev, [entrepriseId]: [] }));
    } finally {
      setDocumentsLoading(prev => ({ ...prev, [entrepriseId]: false }));
    }
  };

  const saveApplicationDetails = async (id: string) => {
    const src = appEditData[id] || {};
    // Validations simples
    const name = src.businessName ?? src.business_name;
    const legal = src.legalForm ?? src.legal_form;
    const email = src.representative?.email ?? src.applicant_email;
    const capitalVal = src.capital;

    // Reset messages
    setAppDetailsError(prev => ({ ...prev, [id]: null }));
    setAppDetailsSuccess(prev => ({ ...prev, [id]: null }));

    if (!name || String(name).trim().length === 0) {
      setAppDetailsError(prev => ({ ...prev, [id]: "Le nom de l'entreprise est requis." }));
      return;
    }
    if (!legal || String(legal).trim().length === 0) {
      setAppDetailsError(prev => ({ ...prev, [id]: 'La forme juridique est requise.' }));
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setAppDetailsError(prev => ({ ...prev, [id]: "L'adresse email du représentant est invalide." }));
      return;
    }
    if (capitalVal !== '' && capitalVal !== null && capitalVal !== undefined) {
      const num = Number(capitalVal);
      if (Number.isNaN(num) || num < 0) {
        setAppDetailsError(prev => ({ ...prev, [id]: 'Le capital doit être un nombre positif.' }));
        return;
      }
    }
    const payload = {
      ...src,
      // Dupliquer les clés pour compat backend
      businessName: src.businessName ?? src.business_name,
      business_name: src.businessName ?? src.business_name,
      nom: src.businessName ?? src.business_name,
      legalForm: src.legalForm ?? src.legal_form,
      legal_form: src.legalForm ?? src.legal_form,
      formeJuridique: src.legalForm ?? src.legal_form,
      businessType: src.businessType ?? src.business_type,
      business_type: src.businessType ?? src.business_type,
      typeEntreprise: src.businessType ?? src.business_type,
      domaineActivite: src.domaineActivite,
      domaine_activite: src.domaineActivite,
      businessActivity: src.domaineActivite,
      sigle: src.sigle,
      acronym: src.sigle,
      divisionId: src.divisionId,
      division_id: src.divisionId,
      divisionCode: src.divisionId
    };
    try {
      setAppDetailsLoading(prev => ({ ...prev, [id]: true }));
      const updated = await businessAPI.updateApplication(id, payload);
      const data = (updated && updated.data) ? updated.data : updated;
      // Mettre à jour détails et sortir du mode édition
      setAppDetails(prev => ({ ...prev, [id]: data }));
      setAppEditMode(prev => ({ ...prev, [id]: false }));
      setAppDetailsSuccess(prev => ({ ...prev, [id]: 'Modifications enregistrées.' }));
      addToast('success', 'Modifications enregistrées');
      // Rafraîchir la liste avec nouveaux champs principaux si besoin
      setApplications(prev => prev.map(app => app.id === id ? {
        ...app,
        businessName: data.businessName || data.business_name || app.businessName,
        companyName: data.businessName || data.business_name || app.companyName,
        legalForm: data.legalForm || data.legal_form || app.legalForm,
      } : app));
    } catch (e: any) {
      setAppDetailsError(prev => ({ ...prev, [id]: apiUtils.formatError(e) }));
      addToast('error', apiUtils.formatError(e));
    } finally {
      setAppDetailsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (!editData.firstName || !editData.lastName || !editData.email) {
        setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
        setIsLoading(false);
        return;
      }

      if (editData.newPassword && editData.newPassword !== editData.confirmPassword) {
        setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
        setIsLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedUser = {
        ...user,
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        phone: editData.phone
      };

      localStorage.setItem('investmali_user', JSON.stringify(updatedUser));
      
      const allUsers = JSON.parse(localStorage.getItem('investmali_registered_users') || '[]');
      const updatedUsers = allUsers.map((u: any) => 
        u.id === user?.id ? { ...u, ...updatedUser } : u
      );
      localStorage.setItem('investmali_registered_users', JSON.stringify(updatedUsers));

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setIsEditing(false);
      
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions pour le système de paiement
  const handlePaymentClick = (entrepriseId: string) => {
    console.log('💳 Ouverture modal paiement pour entreprise:', entrepriseId);
    
    // Trouver l'entreprise dans la liste pour récupérer son montant
    const entreprise = applications.find(app => app.id === entrepriseId);
    const amount = entreprise ? entreprise.totalAmount : 0;
    
    console.log('💰 Montant récupéré pour l\'entreprise:', amount);
    
    setSelectedEntrepriseForPayment(entrepriseId);
    setSelectedEntrepriseAmount(amount);
    setPaymentModalOpen(true);
  };

  const handlePaymentMethodSelected = (method: string, amount: number) => {
    console.log('💳 Méthode sélectionnée:', method, 'Montant:', amount);
    setPaymentModalOpen(false);
    
    // Rediriger vers la page de paiement appropriée
    const params = new URLSearchParams({
      entrepriseId: selectedEntrepriseForPayment,
      amount: amount.toString()
    });
    
    switch (method) {
      case 'STRIPE':
        navigate(`/payment/card?${params}`);
        break;
      case 'ORANGE_MONEY':
        navigate(`/payment/orange-money?${params}`);
        break;
      case 'MOOV_MONEY':
        navigate(`/payment/moov-money?${params}`);
        break;
      case 'BANK_TRANSFER':
        navigate(`/payment/bank-transfer?${params}`);
        break;
      case 'CASH':
        navigate(`/payment/cash?${params}`);
        break;
      default:
        console.error('Méthode de paiement non supportée:', method);
    }
  };

  // Fonction pour vérifier si le paiement est requis selon l'étape
  const isPaymentRequired = (app: BusinessApplication): boolean => {
    // Le paiement est requis si l'étape de validation est "REGISSEUR"
    const appData = appDetails[app.id];
    const etapeValidation = appData?.etapeValidation || appData?.etape_validation;
    return etapeValidation === 'REGISSEUR';
  };

  // Fonction pour vérifier si les modifications sont autorisées selon l'étape
  const canModifyApplication = (app: BusinessApplication): boolean => {
    // Les modifications sont autorisées seulement à l'étape "ACCUEIL"
    const appData = appDetails[app.id];
    const etapeValidation = appData?.etapeValidation || appData?.etape_validation;
    return etapeValidation === 'ACCUEIL';
  };

  // Fonction pour obtenir le message d'étape
  const getStageMessage = (app: BusinessApplication): string => {
    const appData = appDetails[app.id];
    const etapeValidation = appData?.etapeValidation || appData?.etape_validation;
    
    switch (etapeValidation) {
      case 'ACCUEIL':
        return 'Votre demande est en cours de vérification initiale. Vous pouvez encore modifier vos informations.';
      case 'REGISSEUR':
        return 'Vérification terminée. Veuillez procéder au paiement pour continuer le traitement.';
      case 'IMPOTS':
        return 'Paiement reçu. Votre dossier est en cours de traitement fiscal.';
      case 'RCCM1':
        return 'Traitement fiscal terminé. Inscription au RCCM en cours (étape 1).';
      case 'RCCM2':
        return 'Inscription RCCM en cours (étape 2 - finalisation).';
      case 'NINA':
        return 'RCCM obtenu. Attribution du numéro NINA en cours.';
      case 'RETRAIT':
        return 'Traitement terminé. Vos documents sont prêts pour le retrait.';
      default:
        return 'Statut de traitement en cours de mise à jour.';
    }
  };

  const getTrackingStatusIcon = (status: TrackingStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'in-progress':
        return (
          <div className="w-8 h-8 bg-mali-emerald rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        );
    }
  };

  const getTrackingStatusColor = (status: TrackingStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-mali-emerald';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  // Génère les étapes de création d'entreprise selon notre logique
  const generateBusinessCreationSteps = (app: BusinessApplication): TrackingStep[] => {
    const baseSteps: Omit<TrackingStep, 'status' | 'completedAt'>[] = [
      {
        id: 'personal-info',
        title: 'Informations personnelles',
        description: 'Collecte des informations personnelles du demandeur et validation de l\'identité',
        estimatedDuration: '5-10 min',
        details: 'Vérification des données personnelles, civilité, téléphone, adresse, et documents d\'identité'
      },
      {
        id: 'company-info',
        title: 'Informations entreprise',
        description: 'Définition du nom, forme juridique, domaine d\'activité et localisation',
        estimatedDuration: '10-15 min',
        details: 'Configuration de la raison sociale, forme juridique (SARL, SA, E.I.), domaine d\'activité et division administrative'
      },
      {
        id: 'participants',
        title: 'Participants et associés',
        description: 'Ajout des fondateurs, associés et gérants avec répartition des parts',
        estimatedDuration: '15-20 min',
        details: 'Gestion des rôles (FONDATEUR, ASSOCIE, GERANT), pourcentages de parts, documents d\'identité et pièces justificatives'
      },
      {
        id: 'documents',
        title: 'Documents et pièces justificatives',
        description: 'Upload des documents requis selon la configuration choisie',
        estimatedDuration: '10-15 min',
        details: 'Documents d\'identité, casier judiciaire (si requis), acte de mariage (gérants mariés), autres pièces justificatives'
      }
    ];

    // Récupérer l'étape actuelle de l'entreprise
    const appData = appDetails[app.id];
    const currentAgentStage = normalizeStage(appData?.etapeValidation || appData?.etape_validation || 'ACCUEIL');
    const currentStageIndex = stageOrder.indexOf(currentAgentStage);
    
    // Si l'entreprise est à REGISSEUR ou plus loin, toutes les étapes user sont complétées
    const allStepsCompleted = currentStageIndex >= 1; // REGISSEUR est à l'index 1
    
    return baseSteps.map((step, index) => {
      let status: TrackingStep['status'];
      let completedAt: string | undefined;
      
      if (allStepsCompleted) {
        status = 'completed';
        // Estimation de la date de completion basée sur la soumission
        const submittedDate = new Date(app.submittedAt);
        const completionDate = new Date(submittedDate.getTime() + (index * 2 * 60 * 60 * 1000)); // +2h par étape
        completedAt = completionDate.toISOString();
      } else {
        // Logique originale basée sur la progression
        const progress = app.overallProgress;
        const stepProgress = progress / 100;
        const stepsCount = baseSteps.length;
        const stepThreshold = (index + 1) / stepsCount;
        const prevStepThreshold = index / stepsCount;
        
        if (stepProgress > stepThreshold) {
          status = 'completed';
          const submittedDate = new Date(app.submittedAt);
          const completionDate = new Date(submittedDate.getTime() + (index * 2 * 60 * 60 * 1000));
          completedAt = completionDate.toISOString();
        } else if (stepProgress > prevStepThreshold) {
          status = 'in-progress';
        } else if (app.status === 'rejected' && stepProgress <= prevStepThreshold) {
          status = 'failed';
        } else {
          status = 'pending';
        }
      }
      
      return {
        ...step,
        status,
        completedAt
      };
    });
  };

  const getStatusColor = (status: BusinessApplication['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: BusinessApplication['status']) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in-progress': return 'En cours';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejetée';
      default: return 'Inconnu';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Fonction pour résoudre division_id vers nom de localisation avec hiérarchie
  const getDivisionName = async (divisionId: string): Promise<string> => {
    if (!divisionId) return '—';
    
    // Vérifier le cache
    if (divisionsCache[divisionId]) {
      const division = divisionsCache[divisionId];
      return division.displayName || division.nom || '—';
    }
    
    try {
      let division = null;
      
      // Essayer d'abord par ID (UUID)
      try {
        division = await divisionService.getById(divisionId);
      } catch (error: any) {
        // Si erreur 404, essayer par code
        if (error.status === 404) {
          try {
            division = await divisionService.getByCode(divisionId);
          } catch (codeError) {
            console.warn('Division non trouvée par ID ni par code:', divisionId);
            return 'Division inconnue';
          }
        } else {
          throw error;
        }
      }
      
      if (division && division.nom) {
        // Utiliser seulement le nom de la division sans hiérarchie
        const divisionName = division.nom;
        
        // Mettre en cache avec le nom simple
        const newCache = { ...divisionsCache };
        newCache[divisionId] = { ...division, displayName: divisionName };
        setDivisionsCache(newCache);
        
        return divisionName;
      }
      
      return 'Division inconnue';
      
    } catch (error) {
      console.warn('Erreur lors du chargement de la division:', error);
      return 'Division inconnue';
    }
  };

  // Hook pour charger le nom de division avec rate limiting
  const [divisionNames, setDivisionNames] = useState<Record<string, string>>({});
  const [loadingDivisions, setLoadingDivisions] = useState<Set<string>>(new Set());
  
  const loadDivisionName = async (divisionId: string, appId: string) => {
    if (!divisionId || divisionNames[divisionId] || loadingDivisions.has(divisionId)) return;
    
    setLoadingDivisions(prev => {
      const newSet = new Set(prev);
      newSet.add(divisionId);
      return newSet;
    });
    
    try {
      const name = await getDivisionName(divisionId);
      setDivisionNames(prev => ({ ...prev, [divisionId]: name }));
    } catch (error) {
      console.warn(`Erreur chargement division ${divisionId}:`, error);
      setDivisionNames(prev => ({ ...prev, [divisionId]: 'Division inconnue' }));
    } finally {
      setLoadingDivisions(prev => {
        const newSet = new Set(prev);
        newSet.delete(divisionId);
        return newSet;
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground variant="minimal" />
        <div className="relative z-10 text-center">
          <p className="text-mali-dark text-lg">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Valeurs sûres pour éviter les crashes si certaines infos manquent
  const displayFirstName = user.firstName || (user as any).first_name || (user.email ? user.email.split('@')[0] : 'Utilisateur');
  const displayLastName = user.lastName || (user as any).last_name || '';
  const initials = `${(displayFirstName || '').charAt(0)}${(displayLastName || '').charAt(0)}`.toUpperCase() || (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  const registeredAtText = (user as any).registeredAt ? formatDate((user as any).registeredAt) : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden">
      <AnimatedBackground variant="minimal" />
      
      <div className="relative z-10">
        {/* Toasts */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 space-y-2 z-50">
            {toasts.map(t => (
              <div key={t.id} className={`px-4 py-3 rounded-lg shadow ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {t.text}
              </div>
            ))}
          </div>
        )}
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-mali-emerald to-mali-gold rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {initials}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-mali-dark">{displayFirstName} {displayLastName}</h1>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-2xl shadow-lg mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-mali-emerald border-b-2 border-mali-emerald'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profil</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'applications'
                    ? 'text-mali-emerald border-b-2 border-mali-emerald'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Mes Demandes ({applications.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-mali-emerald border-b-2 border-mali-emerald'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Paramètres</span>
                </div>
              </button>
            </div>

            {/* Messages */}
            {message && (
              <div className={`mx-6 mt-4 p-4 rounded-xl ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-mali-dark">Informations Personnelles</h2>
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditData({
                          firstName: user.firstName || user.prenom || '',
                          lastName: user.lastName || user.nom || '',
                          email: user.email,
                          phone: user.phone || '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="bg-mali-emerald text-white px-4 py-2 rounded-xl hover:bg-mali-emerald/90 transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                        <input
                          type="text"
                          value={editData.firstName}
                          onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                        <input
                          type="text"
                          value={editData.lastName}
                          onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                        placeholder="+223 XX XX XX XX"
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-mali-dark mb-4">Changer le mot de passe</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                          <input
                            type="password"
                            value={editData.newPassword}
                            onChange={(e) => setEditData({...editData, newPassword: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                            placeholder="Laisser vide pour ne pas changer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                          <input
                            type="password"
                            value={editData.confirmPassword}
                            onChange={(e) => setEditData({...editData, confirmPassword: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="bg-mali-emerald text-white px-6 py-3 rounded-xl hover:bg-mali-emerald/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setMessage(null);
                        }}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Prénom</label>
                        <p className="text-lg font-medium text-mali-dark">{user.firstName}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                        <p className="text-lg font-medium text-mali-dark">{user.lastName}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-lg font-medium text-mali-dark">{user.email}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Téléphone</label>
                      <p className="text-lg font-medium text-mali-dark">{user.phone || 'Non renseigné'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Membre depuis</label>
                      <p className="text-lg font-medium text-mali-dark">{registeredAtText}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-mali-dark mb-6">Mes Demandes de Création d'Entreprise</h2>
                
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande pour le moment</h3>
                    <p className="text-gray-500 mb-6">Vous n'avez pas encore soumis de demande de création d'entreprise.</p>
                    <button
                      onClick={() => window.location.href = '/create-business'}
                      className="bg-mali-emerald text-white px-6 py-3 rounded-xl hover:bg-mali-emerald/90 transition-colors"
                    >
                      Créer ma première entreprise
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map((app) => (
                      <div key={app.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Application Header */}
                        <div className="bg-gray-50 p-6 border-b border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-mali-dark">{app.businessName || app.companyName}</h3>
                              <p className="text-gray-600">{app.legalForm} • {app.businessName || app.companyName}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                              {getStatusText(app.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Soumise le :</span>
                              <p className="font-medium">{formatDate(app.submittedAt)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Montant :</span>
                              <p className="font-medium">{formatAmount(app.totalAmount)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Progression :</span>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-mali-emerald to-mali-gold h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${app.overallProgress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium">{Math.round(app.overallProgress)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Fin estimée :</span>
                              <p className="font-medium">{new Date(app.estimatedCompletion).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>

                          {app.status === 'in-progress' && app.currentStep && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-blue-800 text-sm">
                                <strong>Étape actuelle :</strong> {app.steps.find(step => step.status === 'in-progress')?.title || 'En cours...'}
                              </p>
                            </div>
                          )}

                          {/* Message d'étape et contrôles */}
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <div className="text-blue-500 text-lg">ℹ️</div>
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900 mb-1">
                                  Étape actuelle: {appDetails[app.id]?.etapeValidation || appDetails[app.id]?.etape_validation || 'ACCUEIL'}
                                </h4>
                                <p className="text-sm text-blue-700">
                                  {getStageMessage(app)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-between items-center">
                            <div className="flex space-x-3">
                              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                                Télécharger le reçu
                              </button>
                              {app.status === 'completed' && (
                                <button className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 transition-colors text-sm">
                                  Télécharger les documents
                                </button>
                              )}
                              
                              {/* Bouton de paiement conditionnel */}
                              {isPaymentRequired(app) && (
                                <button
                                  onClick={() => handlePaymentClick(app.id)}
                                  className="bg-mali-gold text-white px-6 py-2 rounded-lg hover:bg-mali-gold/90 
                                           transition-colors text-sm font-medium flex items-center space-x-2"
                                >
                                  <span>💳</span>
                                  <span>Procéder au paiement</span>
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                const next = selectedApplication === app.id ? null : app.id;
                                setSelectedApplication(next);
                                if (next) {
                                  loadApplicationDetails(app.id);
                                }
                              }}
                              className="text-mali-emerald hover:text-mali-gold transition-colors text-sm font-medium flex items-center space-x-1"
                            >
                              <span>{selectedApplication === app.id ? 'Masquer le suivi' : 'Voir le suivi détaillé'}</span>
                              <svg 
                                className={`w-4 h-4 transition-transform ${selectedApplication === app.id ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Detailed Tracking */}
                        {selectedApplication === app.id && (
                          <div className="p-6 bg-white">
                            <h4 className="text-lg font-semibold text-mali-dark mb-6">Suivi Détaillé des Étapes</h4>

                            {/* Infos soumises + édition */}
                            <div className="mb-8">
                              <h5 className="text-md font-semibold text-mali-dark mb-4">Informations de la demande</h5>
                              {appDetailsLoading[app.id] && (
                                <p className="text-gray-500 text-sm">Chargement des informations...</p>
                              )}
                              {appDetailsError[app.id] && (
                                <p className="text-red-600 text-sm">{appDetailsError[app.id]}</p>
                              )}
                              {appDetailsSuccess[app.id] && (
                                <p className="text-green-600 text-sm">{appDetailsSuccess[app.id]}</p>
                              )}
                              {!appDetailsLoading[app.id] && !appDetailsError[app.id] && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Nom de l'entreprise</label>
                                      {appEditMode[app.id] ? (
                                        <input
                                          type="text"
                                          value={appEditData[app.id]?.businessName || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], businessName: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.businessName || appDetails[app.id]?.business_name || appDetails[app.id]?.nom || appDetails[app.id]?.companyName || app.businessName || app.companyName || '—'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Forme juridique</label>
                                      {appEditMode[app.id] ? (
                                        <select
                                          value={appEditData[app.id]?.legalForm || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], legalForm: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        >
                                          <option value="">Sélectionner</option>
                                          {/* Options statiques temporaires pour éviter l'erreur */}
                                          <option value="SA">SA (Société Anonyme)</option>
                                          <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                                          <option value="E_I">Entreprise Individuelle</option>
                                          <option value="SNC">SNC (Société en Nom Collectif)</option>
                                          <option value="SCS">SCS (Société en Commandite Simple)</option>
                                          {/* Options dynamiques avec protection */}
                                          {legalFormOptions.length > 0 && legalFormOptions.map((opt: any, index: number) => {
                                            try {
                                              const optValue = typeof opt === 'object' ? (opt?.value || opt?.key || opt?.label || `option-${index}`) : String(opt || '');
                                              const optLabel = typeof opt === 'object' ? (opt?.label || opt?.value || opt?.key || `Option ${index}`) : String(opt || '');
                                              
                                              // Éviter les doublons avec les options statiques
                                              if (['SA', 'SARL', 'E_I', 'SNC', 'SCS'].includes(optValue)) {
                                                return null;
                                              }
                                              
                                              return (
                                                <option key={`legal-dyn-${index}-${optValue}`} value={optValue}>
                                                  {optLabel}
                                                </option>
                                              );
                                            } catch (error) {
                                              console.warn('Erreur lors du rendu de l\'option:', opt, error);
                                              return null;
                                            }
                                          })}
                                        </select>
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.legalForm || appDetails[app.id]?.legal_form || appDetails[app.id]?.formeJuridique || app.legalForm || '—'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Type d'entreprise</label>
                                      {appEditMode[app.id] ? (
                                        <select
                                          value={appEditData[app.id]?.businessType || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], businessType: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                        >
                                          <option value="">Sélectionner</option>
                                          {/* Options statiques temporaires pour éviter l'erreur */}
                                          <option value="SOCIETE">Société</option>
                                          <option value="ENTREPRISE_INDIVIDUELLE">Entreprise Individuelle</option>
                                          {/* Options dynamiques avec protection */}
                                          {businessTypeOptions.length > 0 && businessTypeOptions.map((opt: any, index: number) => {
                                            try {
                                              const optValue = typeof opt === 'object' ? (opt?.value || opt?.key || opt?.label || `type-${index}`) : String(opt || '');
                                              const optLabel = typeof opt === 'object' ? (opt?.label || opt?.value || opt?.key || `Type ${index}`) : String(opt || '');
                                              
                                              // Éviter les doublons avec les options statiques
                                              if (['SOCIETE', 'ENTREPRISE_INDIVIDUELLE'].includes(optValue)) {
                                                return null;
                                              }
                                              
                                              return (
                                                <option key={`type-dyn-${index}-${optValue}`} value={optValue}>
                                                  {optLabel}
                                                </option>
                                              );
                                            } catch (error) {
                                              console.warn('Erreur lors du rendu du type:', opt, error);
                                              return null;
                                            }
                                          })}
                                        </select>
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.businessType || appDetails[app.id]?.business_type || appDetails[app.id]?.typeEntreprise || '—'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Domaine d'activité</label>
                                      {appEditMode[app.id] ? (
                                        <input
                                          type="text"
                                          value={appEditData[app.id]?.domaineActivite || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], domaineActivite: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.domaineActivite || appDetails[app.id]?.domaine_activite || appDetails[app.id]?.businessActivity || '—'}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Sigle</label>
                                      {appEditMode[app.id] ? (
                                        <input
                                          type="text"
                                          value={appEditData[app.id]?.sigle || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], sigle: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                      ) : (
                                        <p className="font-medium">{appDetails[app.id]?.sigle || appDetails[app.id]?.acronym || '—'}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm text-gray-600 mb-1">Localisation</label>
                                      {appEditMode[app.id] ? (
                                        <DivisionSearchInput
                                          onSelect={(division) => {
                                            setAppEditData(prev => ({
                                              ...prev,
                                              [app.id]: {
                                                ...prev[app.id],
                                                divisionId: division.id,
                                                divisionCode: division.code,
                                                divisionName: division.nom
                                              }
                                            }));
                                          }}
                                          placeholder="Rechercher une localisation..."
                                        />
                                      ) : (
                                        <p className="font-medium">
                                          {(() => {
                                            const divisionId = appDetails[app.id]?.divisionId || appDetails[app.id]?.division_id || appDetails[app.id]?.divisionCode;
                                            if (divisionId) {
                                              // Charger le nom si pas encore fait
                                              if (!divisionNames[divisionId]) {
                                                if (!loadingDivisions.has(divisionId)) {
                                                  loadDivisionName(divisionId, app.id);
                                                }
                                                return 'Chargement...';
                                              }
                                              return divisionNames[divisionId];
                                            }
                                            return '—';
                                          })()
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-3 pt-2">
                                    {/* Debug info */}
                                    {process.env.NODE_ENV === 'development' && (
                                      <div className="text-xs text-gray-500 mr-auto">
                                        Mode édition: {appEditMode[app.id] ? 'ON' : 'OFF'} | App ID: {app.id}
                                      </div>
                                    )}
                                    
                                    {appEditMode[app.id] ? (
                                      <>
                                        <button
                                          onClick={() => saveApplicationDetails(app.id)}
                                          disabled={!!appDetailsLoading[app.id]}
                                          className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 text-sm disabled:opacity-50"
                                        >
                                          Enregistrer
                                        </button>
                                        <button
                                          onClick={() => setAppEditMode(prev => ({ ...prev, [app.id]: false }))}
                                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                        >
                                          Annuler
                                        </button>
                                      </>
                                    ) : (
                                      canModifyApplication(app) ? (
                                        <button
                                          onClick={() => {
                                            console.log('🔧 Activation du mode édition pour:', app.id);
                                            setAppEditMode(prev => ({ ...prev, [app.id]: true }));
                                            // Initialiser les données d'édition avec les valeurs actuelles
                                            const currentDetails = appDetails[app.id] || {};
                                            setAppEditData(prev => ({
                                              ...prev,
                                              [app.id]: {
                                                businessName: currentDetails.businessName || currentDetails.business_name || currentDetails.nom || '',
                                              legalForm: currentDetails.legalForm || currentDetails.legal_form || currentDetails.formeJuridique || '',
                                              businessType: currentDetails.businessType || currentDetails.business_type || currentDetails.typeEntreprise || '',
                                              domaineActivite: currentDetails.domaineActivite || currentDetails.domaine_activite || currentDetails.businessActivity || '',
                                              sigle: currentDetails.sigle || currentDetails.acronym || '',
                                              divisionId: currentDetails.divisionId || currentDetails.division_id || currentDetails.divisionCode || ''
                                            }
                                          }));
                                        }}
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                                        title="Cliquez pour modifier les informations de cette demande"
                                      >
                                        ✏️ Modifier
                                      </button>
                                      ) : (
                                        <div className="text-sm text-gray-500 italic">
                                          Modifications bloquées - Étape: {appDetails[app.id]?.etapeValidation || appDetails[app.id]?.etape_validation || 'ACCUEIL'}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-6">
                              {generateBusinessCreationSteps(app).map((step, index, steps) => (
                                  <div key={step.id} className="relative">
                                    {/* Connector line */}
                                    {index < steps.length - 1 && (
                                      <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
                                    )}
                                  <div className="flex items-start space-x-4">
                                    {getTrackingStatusIcon(step.status)}
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-3">
                                          <h5 className={`text-lg font-medium ${getTrackingStatusColor(step.status)}`}>
                                            {step.title}
                                          </h5>
                                          {/* Bouton pour modifier les données de cette étape - masqué si étape REGISSEUR ou plus */}
                                          {(() => {
                                            const appData = appDetails[app.id];
                                            const currentAgentStage = normalizeStage(appData?.etapeValidation || appData?.etape_validation || 'ACCUEIL');
                                            const currentStageIndex = stageOrder.indexOf(currentAgentStage);
                                            const hideEditButtons = currentStageIndex >= 1; // REGISSEUR ou plus
                                            
                                            if (hideEditButtons) return null;
                                            
                                            return stepDataEditMode[`${app.id}-${step.id}`] ? (
                                              <>
                                                <button
                                                  onClick={async () => {
                                                    console.log('💾 Sauvegarde des données de l\'étape:', step.id);
                                                    
                                                    if (step.id === 'participants') {
                                                      // Pour l'étape participants, sauvegarder tous les membres
                                                      const success = await saveAllMembresModifications(app.id);
                                                      if (success) {
                                                        setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                      }
                                                    } else {
                                                      // Pour les autres étapes, juste fermer le mode édition
                                                      setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                    }
                                                  }}
                                                  className="bg-mali-emerald text-white px-2 py-1 rounded text-xs hover:bg-mali-emerald/90"
                                                  title="Sauvegarder les modifications"
                                                >
                                                  ✓ Enregistrer
                                                </button>
                                                <button
                                                  onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200"
                                                  title="Annuler les modifications"
                                                >
                                                  ✕ Annuler
                                                </button>
                                              </>
                                            ) : (
                                              <button
                                                onClick={() => {
                                                  console.log(`🔧 Activation édition étape ${step.id} pour application ${app.id}`);
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: true }));
                                                }}
                                                className="bg-mali-emerald text-white px-2 py-1 rounded text-xs hover:bg-mali-emerald/90 transition-colors"
                                                title={`Modifier les données de l'étape: ${step.title}`}
                                              >
                                                ✏️ Modifier
                                              </button>
                                            );
                                          })()}
                                        </div>
                                        <span className="text-sm text-gray-500">{step.estimatedDuration}</span>
                                      </div>
                                      
                                      <p className="text-gray-600 mb-2">{step.description}</p>
                                      
                                      {/* Formulaire d'édition des données de l'étape */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'company-info' && (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                          <h6 className="font-medium text-blue-800 mb-3">Modification des informations de l'entreprise</h6>
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Nom de l'entreprise</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={appDetails[app.id]?.businessName || appDetails[app.id]?.business_name || appDetails[app.id]?.nom || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Forme juridique</label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                                  <option value="">Sélectionner</option>
                                                  <option value="SA">SA (Société Anonyme)</option>
                                                  <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                                                  <option value="E_I">Entreprise Individuelle</option>
                                                  <option value="SNC">SNC (Société en Nom Collectif)</option>
                                                  <option value="SCS">SCS (Société en Commandite Simple)</option>
                                                  <option value="Société à Responsabilité Limitée">Société à Responsabilité Limitée</option>
                                                  <option value="Société à Responsabilité Limitée Unipersonnelle">Société à Responsabilité Limitée Unipersonnelle</option>
                                                  <option value="Succursale de SARL">Succursale de SARL</option>
                                                  <option value="Filiale de SARL">Filiale de SARL</option>
                                                  <option value="Société Anonyme">Société Anonyme</option>
                                                  <option value="Succursale de SA">Succursale de SA</option>
                                                  <option value="Filiale de SA">Filiale de SA</option>
                                                  <option value="Société par Actions Simplifiées Unipersonnelle">Société par Actions Simplifiées Unipersonnelle</option>
                                                  <option value="Société par Actions Simplifiées">Société par Actions Simplifiées</option>
                                                  <option value="Bureau de Représentation">Bureau de Représentation</option>
                                                  <option value="Filiale de SAS">Filiale de SAS</option>
                                                  <option value="Succursale de SAS">Succursale de SAS</option>
                                                  <option value="Société en Nom Collectif">Société en Nom Collectif</option>
                                                  <option value="Société en Commandite Simple">Société en Commandite Simple</option>
                                                  <option value="Société Civile Immobilière">Société Civile Immobilière</option>
                                                  <option value="Société Civile Professionnelle">Société Civile Professionnelle</option>
                                                  <option value="Groupement d'Intérêt Economique">Groupement d'Intérêt Economique</option>
                                                  <option value="Entreprise Individuelle">Entreprise Individuelle</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Type d'entreprise</label>
                                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                                  <option value="">Sélectionner</option>
                                                  <option value="SOCIETE">Société</option>
                                                  <option value="ENTREPRISE_INDIVIDUELLE">Entreprise Individuelle</option>
                                                  <option value="Société">Société</option>
                                                  <option value="Entreprise individuelle">Entreprise individuelle</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Domaine d'activité</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={appDetails[app.id]?.domaineActivite || appDetails[app.id]?.domaine_activite || ''}
                                                />
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Sigle</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={appDetails[app.id]?.sigle || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Localisation</label>
                                                <DivisionSearchInput
                                                  onSelect={(division) => {
                                                    setAppEditData(prev => ({
                                                      ...prev,
                                                      [app.id]: {
                                                        ...prev[app.id],
                                                        divisionId: division.id,
                                                        divisionCode: division.code,
                                                        divisionName: division.nom
                                                      }
                                                    }));
                                                  }}
                                                  placeholder="Rechercher une localisation..."
                                                />
                                              </div>
                                            </div>
                                            <div className="flex justify-end space-x-3 pt-2">
                                              <div className="text-xs text-gray-500 mr-auto">
                                                Mode édition: ON | App ID: {app.id}
                                              </div>
                                              <button 
                                                onClick={() => {
                                                  console.log('💾 Sauvegarde des données entreprise');
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                }}
                                                className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 text-sm"
                                              >
                                                Enregistrer
                                              </button>
                                              <button 
                                                onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                              >
                                                Annuler
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Formulaire pour les informations personnelles */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'personal-info' && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                          <h6 className="font-medium text-green-800 mb-3">Modification des informations personnelles</h6>
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={user?.firstName || user?.prenom || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Nom</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="text" 
                                                  defaultValue={user?.lastName || user?.nom || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Email</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="email" 
                                                  defaultValue={user?.email || ''}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                                                <input 
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                  type="tel" 
                                                  defaultValue={user?.phone || ''}
                                                />
                                              </div>
                                            </div>
                                            <div className="flex justify-end space-x-3 pt-2">
                                              <button 
                                                onClick={() => {
                                                  console.log('💾 Sauvegarde des informations personnelles');
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                }}
                                                className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 text-sm"
                                              >
                                                Enregistrer
                                              </button>
                                              <button 
                                                onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                              >
                                                Annuler
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Formulaire pour les participants et associés */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'participants' && (
                                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                          <h6 className="font-medium text-purple-800 mb-4">Gestion des participants et associés</h6>
                                          
                                          {/* Liste des participants */}
                                          <div className="space-y-4">
                                            {(() => {
                                              const appData = appDetails[app.id];
                                              console.log('🔍 Données complètes app:', appData);
                                              
                                              // Récupération des membres comme dans EntrepriseDetails.tsx
                                              const membres = appData?.membres || [];
                                              console.log('👥 Membres trouvés:', membres);
                                              
                                              if (!membres || membres.length === 0) {
                                                return (
                                                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                    <p className="text-gray-600 mb-2">Aucun membre trouvé pour cette entreprise</p>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                      Les membres n'ont pas encore été ajoutés ou ne sont pas disponibles dans les données.
                                                    </p>
                                                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                                      ➕ Ajouter le premier membre
                                                    </button>
                                                  </div>
                                                );
                                              }
                                              
                                              return membres.map((membre: any, index: number) => (
                                                <form 
                                                  key={membre.personId || index} 
                                                  className="bg-white p-4 rounded-lg border border-purple-200"
                                                  data-membre-id={membre.personId || index}
                                                >
                                                  <div className="flex items-center justify-between mb-3">
                                                    <h6 className="font-medium text-gray-800">
                                                      Membre #{index + 1} - {membre.prenom || ''} {membre.nom || ''}
                                                    </h6>
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                                                      <input 
                                                        name="prenom"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="text" 
                                                        key={`prenom-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.prenom || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Nom</label>
                                                      <input 
                                                        name="nom"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="text" 
                                                        key={`nom-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.nom || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                                                      <input 
                                                        name="telephone"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="tel" 
                                                        key={`telephone-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.telephone || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Rôle</label>
                                                      <select 
                                                        name="role"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                                                        key={`role-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.role || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      >
                                                        <option value="">Sélectionner un rôle</option>
                                                        <option value="GERANT">Gérant</option>
                                                        <option value="DIRIGEANT">Dirigeant</option>
                                                        <option value="ASSOCIE">Associé</option>
                                                       
                                                      </select>
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Part (%)</label>
                                                      <input 
                                                        name="pourcentageParts"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="number" 
                                                        min="0" 
                                                        max="100" 
                                                        key={`pourcentageParts-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.pourcentageParts || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm text-gray-600 mb-1">Email</label>
                                                      <input 
                                                        name="email"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                        type="email" 
                                                        key={`email-${membre.personId || index}-${stepDataEditMode[`${app.id}-${step.id}`] ? 'edit' : 'read'}`}
                                                        defaultValue={membre.email || ''}
                                                        disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                      />
                                                    </div>
                                                    {membre.dateNaissance && (
                                                      <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Date de naissance</label>
                                                        <input 
                                                          name="dateNaissance"
                                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                          type="date" 
                                                          defaultValue={membre.dateNaissance ? membre.dateNaissance.split('T')[0] : ''}
                                                          disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                        />
                                                      </div>
                                                    )}
                                                    {(membre.situationMatrimoniale !== undefined && membre.situationMatrimoniale !== null) && (
                                                      <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Situation matrimoniale</label>
                                                        <select 
                                                          name="situationMatrimoniale"
                                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                                                          defaultValue={membre.situationMatrimoniale === true || membre.situationMatrimoniale === 'true' ? 'marie' : 'celibataire'}
                                                          disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                        >
                                                          <option value="celibataire">Célibataire</option>
                                                          <option value="marie">Marié(e)</option>
                                                        </select>
                                                      </div>
                                                    )}
                                                    {membre.dateDebut && (
                                                      <div>
                                                        <label className="block text-sm text-gray-600 mb-1">Date début</label>
                                                        <input 
                                                          name="dateDebut"
                                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                                          type="date" 
                                                          defaultValue={membre.dateDebut ? membre.dateDebut.split('T')[0] : ''}
                                                          disabled={!stepDataEditMode[`${app.id}-${step.id}`]}
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                </form>
                                              ));
                                            })()}

                                            {/* Bouton pour ajouter un nouveau participant */}
                                            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                                              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                                ➕ Ajouter un nouveau participant
                                              </button>
                                            </div>

                                            {/* Résumé des parts */}
                                            {(() => {
                                              const appData = appDetails[app.id];
                                              const membres = appData?.membres || [];
                                              
                                              if (membres.length === 0) return null;
                                              
                                              const totalParts = membres.reduce((sum: number, m: any) => {
                                                const part = parseFloat(m.pourcentageParts || 0);
                                                return sum + (isNaN(part) ? 0 : part);
                                              }, 0);
                                              
                                              const gerants = membres.filter((m: any) => m.role === 'GERANT').length;
                                              const dirigeants = membres.filter((m: any) => m.role === 'DIRIGEANT').length;
                                              const associes = membres.filter((m: any) => m.role === 'ASSOCIE').length;
                                              const fondateurs = membres.filter((m: any) => m.role === 'FONDATEUR').length;
                                              
                                              return (
                                                <div className="bg-purple-100 p-4 rounded-lg">
                                                  <h6 className="font-medium text-purple-800 mb-2 block">Résumé des participations</h6>
                                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                      <span className="text-gray-600">Total des parts :</span>
                                                      <span className={`font-medium ml-2 ${totalParts === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {totalParts.toFixed(1)}%
                                                      </span>
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-600">Membres :</span>
                                                      <span className="font-medium ml-2">{membres.length}</span>
                                                    </div>
                                                    {gerants > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Gérants :</span>
                                                        <span className="font-medium ml-2">{gerants}</span>
                                                      </div>
                                                    )}
                                                    {dirigeants > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Dirigeants :</span>
                                                        <span className="font-medium ml-2">{dirigeants}</span>
                                                      </div>
                                                    )}
                                                    {associes > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Associés :</span>
                                                        <span className="font-medium ml-2">{associes}</span>
                                                      </div>
                                                    )}
                                                    {fondateurs > 0 && (
                                                      <div>
                                                        <span className="text-gray-600">Fondateurs :</span>
                                                        <span className="font-medium ml-2">{fondateurs}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  {totalParts !== 100 && (
                                                    <div className="mt-2 text-xs text-red-600">
                                                      ⚠️ Le total des parts doit être égal à 100%
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </div>

                                          {/* Boutons de contrôle */}
                                          <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-purple-200">
                                            <button 
                                              onClick={async () => {
                                                console.log('💾 Sauvegarde des participants et associés');
                                                const success = await saveAllMembresModifications(app.id);
                                                if (success) {
                                                  setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                                }
                                              }}
                                              className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 text-sm"
                                              title="Sauvegarder les modifications"
                                            >
                                              ✓ Enregistrer
                                            </button>
                                            <button 
                                              onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                            >
                                              Annuler
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Formulaire pour les documents */}
                                      {stepDataEditMode[`${app.id}-${step.id}`] && step.id === 'documents' && (
                                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                          <h6 className="font-medium text-orange-800 mb-4">Gestion des documents et pièces justificatives</h6>
                                          
                                          {/* Charger les documents au clic */}
                                          {(() => {
                                            // Charger les documents si pas encore fait
                                            if (!documents[app.id] && !documentsLoading[app.id]) {
                                              loadDocuments(app.id);
                                            }
                                            
                                            const appDocuments = documents[app.id] || [];
                                            const isLoading = documentsLoading[app.id];
                                            const error = documentsError[app.id];
                                            
                                            console.log(' Documents pour app', app.id, ':', appDocuments);
                                            
                                            if (isLoading) {
                                              return (
                                                <div className="text-center py-8">
                                                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mb-2"></div>
                                                  <p className="text-gray-600">Chargement des documents...</p>
                                                </div>
                                              );
                                            }
                                            
                                            if (error) {
                                              return (
                                                <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                                                  <p className="text-red-600 mb-2">Erreur lors du chargement des documents</p>
                                                  <p className="text-sm text-red-500 mb-4">{error}</p>
                                                  <button 
                                                    onClick={() => loadDocuments(app.id)}
                                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                                  >
                                                    Réessayer
                                                  </button>
                                                </div>
                                              );
                                            }
                                            
                                            if (appDocuments.length === 0) {
                                              return (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                  <p className="text-gray-600 mb-2">Aucun document trouvé pour cette entreprise</p>
                                                  <p className="text-sm text-gray-500 mb-4">
                                                    Les documents n'ont pas encore été uploadés ou ne sont pas disponibles.
                                                  </p>
                                                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                                                    Ajouter des documents
                                                  </button>
                                                </div>
                                              );
                                            }
                                            
                                            // Fonction pour obtenir le nom du type de document (comme dans EntrepriseDetails.tsx)
                                            const getDocumentTypeName = (type: string) => {
                                              if (!type) return 'Document';
                                              
                                              const typeNames: Record<string, string> = {
                                                'EXTRAIT_NAISSANCE': 'Extrait de naissance',
                                                'CERTIFICAT_RESIDENCE': 'Certificat de résidence',
                                                'CASIER_JUDICIAIRE': 'Casier judiciaire',
                                                'STATUS_SOCIETE': 'Statuts de société',
                                                'STATUTS_SOCIETE': 'Statuts de société',
                                                'ACTE_MARIAGE': 'Acte de mariage',
                                                'DECLARATION_HONNEUR': 'Déclaration sur l\'honneur',
                                                'REGISTRE_COMMERCE': 'Registre de commerce',
                                                'ATTESTATION': 'Attestation',
                                                'CERTIFICAT': 'Certificat',
                                                'CONTRAT': 'Contrat',
                                                'FACTURE': 'Facture',
                                                'RECU': 'Reçu'
                                              };
                                              
                                              return typeNames[type.toUpperCase()] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                            };
                                            
                                            const getPieceTypeName = (type: string) => {
                                              if (!type) return 'Pièce d\'identité';
                                              
                                              const typeNames: Record<string, string> = {
                                                'PASSEPORT': 'Passeport',
                                                'CNI': 'Carte Nationale d\'Identité',
                                                'CARTE_CONSULAIRE': 'Carte consulaire',
                                                'PERMIS_CONDUIRE': 'Permis de conduire',
                                                'CARTE_ELECTEUR': 'Carte d\'électeur',
                                                'CARTE_IDENTITE': 'Carte d\'identité',
                                                'ACTE_NAISSANCE': 'Acte de naissance'
                                              };
                                              
                                              return typeNames[type.toUpperCase()] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                            };
                                            
                                            const formatDate = (dateString: string) => {
                                              if (!dateString) return 'Date non disponible';
                                              
                                              try {
                                                const date = new Date(dateString);
                                                if (isNaN(date.getTime())) {
                                                  return 'Date invalide';
                                                }
                                                
                                                return date.toLocaleDateString('fr-FR', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                });
                                              } catch (error) {
                                                return 'Date invalide';
                                              }
                                            };
                                            
                                            return (
                                              <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-4">
                                                  <p className="text-sm text-gray-600">
                                                    {appDocuments.length} document{appDocuments.length > 1 ? 's' : ''} trouvé{appDocuments.length > 1 ? 's' : ''}
                                                  </p>
                                                  <button 
                                                    onClick={() => loadDocuments(app.id)}
                                                    className="text-orange-600 hover:text-orange-700 text-sm"
                                                  >
                                                    Actualiser
                                                  </button>
                                                </div>
                                                
                                                {appDocuments.map((doc: any, index: number) => (
                                                  <div key={doc.id || index} className="bg-white p-4 rounded-lg border border-orange-200">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                          <h3 className="font-medium text-gray-900">
                                                            {(doc.typeDocument || doc.type_document) ? 
                                                              getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                                                             (doc.typePiece || doc.type_piece) ? 
                                                              getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document sans type'}
                                                          </h3>
                                                          {(doc.typePiece || doc.type_piece) && (doc.typeDocument || doc.type_document) && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                              {getPieceTypeName((doc.typePiece || doc.type_piece) || '')}
                                                            </span>
                                                          )}
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500">
                                                          <div>
                                                            <span className="font-medium">Numéro:</span> 
                                                            <span className={(doc.numero || doc.num_piece) ? 'text-gray-900' : 'text-red-500 italic'}>
                                                              {doc.numero || doc.num_piece || 'Numéro manquant'}
                                                            </span>
                                                          </div>
                                                          <div>
                                                            <span className="font-medium">Créé le:</span> 
                                                            <span className="text-gray-900">{formatDate((doc.dateCreation || doc.created_at) || '')}</span>
                                                          </div>
                                                          {(doc.dateExpiration || doc.date_expiration) && (
                                                            <div>
                                                              <span className="font-medium">Expire le:</span> 
                                                              <span className="text-gray-900">
                                                                {formatDate((doc.dateExpiration || doc.date_expiration) || '')}
                                                              </span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                      
                                                      <div className="flex space-x-2 ml-4">
                                                        <button 
                                                          onClick={() => handleViewDocument(
                                                            doc.id, 
                                                            (doc.typeDocument || doc.type_document) ? getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                                                            (doc.typePiece || doc.type_piece) ? getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document'
                                                          )}
                                                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                          title="Voir le document"
                                                        >
                                                          👁️ Voir
                                                        </button>
                                                        <button 
                                                          onClick={() => handleDownloadDocument(
                                                            doc.id, 
                                                            (doc.typeDocument || doc.type_document) ? getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                                                            (doc.typePiece || doc.type_piece) ? getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document'
                                                          )}
                                                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                          title="Télécharger le document"
                                                        >
                                                          📥 Télécharger
                                                        </button>
                                                        {stepDataEditMode[`${app.id}-documents`] && (
                                                          <>
                                                            <input
                                                              type="file"
                                                              id={`file-replace-${doc.id || index}`}
                                                              className="hidden"
                                                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                              onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                  const success = await replaceDocument(app.id, doc.id || index.toString(), file);
                                                                  if (success) {
                                                                    // Reset le input file
                                                                    e.target.value = '';
                                                                  }
                                                                }
                                                              }}
                                                            />
                                                            <button 
                                                              onClick={() => {
                                                                const fileInput = document.getElementById(`file-replace-${doc.id || index}`) as HTMLInputElement;
                                                                fileInput?.click();
                                                              }}
                                                              disabled={documentUploadLoading[`${app.id}-${doc.id || index}`]}
                                                              className="inline-flex items-center px-2 py-1 border border-orange-300 shadow-sm text-xs font-medium rounded text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50"
                                                              title="Remplacer ce document"
                                                            >
                                                              {documentUploadLoading[`${app.id}-${doc.id || index}`] ? '🔄' : '✏️'} Modifier
                                                            </button>
                                                          </>
                                                        )}
                                                        {stepDataEditMode[`${app.id}-documents`] && (
                                                          <>
                                                            {documentDeleteConfirm === `${app.id}-${doc.id || index}` ? (
                                                              <div className="inline-flex items-center space-x-1">
                                                                <button 
                                                                  onClick={async () => {
                                                                    await deleteDocument(app.id, doc.id || index.toString());
                                                                    setDocumentDeleteConfirm(null);
                                                                  }}
                                                                  disabled={documentUploadLoading[`${app.id}-${doc.id || index}`]}
                                                                  className="inline-flex items-center px-2 py-1 border border-red-500 shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                                                  title="Confirmer la suppression"
                                                                >
                                                                  ✓ Confirmer
                                                                </button>
                                                                <button 
                                                                  onClick={() => setDocumentDeleteConfirm(null)}
                                                                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                                  title="Annuler la suppression"
                                                                >
                                                                  ✕ Annuler
                                                                </button>
                                                              </div>
                                                            ) : (
                                                              <button 
                                                                onClick={() => setDocumentDeleteConfirm(`${app.id}-${doc.id || index}`)}
                                                                disabled={documentUploadLoading[`${app.id}-${doc.id || index}`]}
                                                                className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                                                                title="Supprimer ce document"
                                                              >
                                                                {documentUploadLoading[`${app.id}-${doc.id || index}`] ? '🔄' : '🗑️'} Supprimer
                                                              </button>
                                                            )}
                                                          </>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                                
                                                {/* Bouton pour ajouter des documents */}
                                                <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
                                                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                                                    Ajouter des documents
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          
                                          {/* Boutons de contrôle */}
                                          <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-orange-200">
                                            <button 
                                              onClick={() => {
                                                console.log(' Sauvegarde des documents');
                                                setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }));
                                              }}
                                              className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 text-sm"
                                            >
                                              Enregistrer les modifications
                                            </button>
                                            <button 
                                              onClick={() => setStepDataEditMode(prev => ({ ...prev, [`${app.id}-${step.id}`]: false }))}
                                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                            >
                                              Annuler
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {!stepDataEditMode[`${app.id}-${step.id}`] && step.details && (
                                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                                          {step.details}
                                        </div>
                                      )}
                                      
                                      {step.completedAt && (
                                        <div className="mt-2 text-sm text-green-600">
                                          ✓ Complété le {formatDate(step.completedAt)}
                                        </div>
                                      )}
                                    </div>
                                    </div>
                                  </div>
                                ))
                              }
                            
                            </div>

                            {/* Support Section */}
                            <div className="mt-8 p-4 bg-gradient-to-r from-mali-emerald/10 to-mali-gold/10 rounded-xl border border-mali-emerald/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-mali-dark">Besoin d'aide avec cette demande ?</h5>
                                  <p className="text-sm text-gray-600">Notre équipe support est là pour vous accompagner</p>
                                </div>
                                <div className="flex space-x-2">
                                  <button className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 transition-colors text-sm">
                                    Chat Support
                                  </button>
                                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                                    +223 XX XX XX XX
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-mali-dark mb-6">Paramètres du Compte</h2>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-mali-dark mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notifications par email</p>
                          <p className="text-sm text-gray-500">Recevoir des mises à jour sur vos demandes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mali-emerald/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mali-emerald"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-mali-dark mb-4">Sécurité</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Authentification à deux facteurs</p>
                          <p className="text-sm text-gray-500">Ajouter une couche de sécurité supplémentaire</p>
                        </div>
                        <button className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 transition-colors text-sm">
                          Activer
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        logout();
                        window.location.href = '/';
                      }}
                      className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de chat flottant */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              setIsChatOpen(true);
              resetUnreadCount(); // Réinitialiser le compteur quand on ouvre le chat
            }}
            className="relative bg-gradient-to-r from-mali-emerald to-mali-gold text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            title="Contacter l'assistance"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal de chat */}
        <UserChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          user={user}
          entrepriseId={firstEntrepriseId}
        />

        {/* Document Viewer Modal */}
        {selectedDocumentId && (
          <DocumentViewer
            documentId={selectedDocumentId}
            documentName={selectedDocumentName}
            onClose={handleCloseDocumentViewer}
          />
        )}

        {/* Payment Method Modal */}
        <PaymentMethodModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          entrepriseId={selectedEntrepriseForPayment}
          amount={selectedEntrepriseAmount}
          onMethodSelected={handlePaymentMethodSelected}
        />
      </div>
    </div>
  );
};

export default UserProfile;
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
