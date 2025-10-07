import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from './AnimatedBackground';
import { businessAPI, apiUtils, enumsAPI, chatAPI } from '../services/api';
import { divisionService } from '../services/divisionService';
import UserChatModal from './UserChatModal';
import { useNotifications } from '../hooks/useNotifications';

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

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Hook pour les notifications
  const { unreadCount, resetUnreadCount } = useNotifications("69f667f7-b9a2-43cd-bf7c-8fb5c723ce33");
  
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

  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  // Détails par demande (chargés à l'ouverture du suivi détaillé)
  const [appDetails, setAppDetails] = useState<Record<string, any>>({});
  const [appDetailsLoading, setAppDetailsLoading] = useState<Record<string, boolean>>({});
  const [appDetailsError, setAppDetailsError] = useState<Record<string, string | null>>({});
  const [appDetailsSuccess, setAppDetailsSuccess] = useState<Record<string, string | null>>({});
  const [appEditMode, setAppEditMode] = useState<Record<string, boolean>>({});
  const [appEditData, setAppEditData] = useState<Record<string, any>>({});
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
        setLegalFormOptions(Array.isArray(forms) ? forms : []);
        setBusinessTypeOptions(Array.isArray(types) ? types : []);
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
          const status: BusinessApplication['status'] =
            statusRaw.includes('complete') || statusRaw.includes('valide') ? 'completed' :
            statusRaw.includes('reject') ? 'rejected' :
            statusRaw.includes('progress') || statusRaw.includes('cours') ? 'in-progress' : 'pending';
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
          return {
            id: String(a.id ?? a.applicationId ?? ''),
            companyName: a.nom || a.businessName || a.business_name || a.companyName || a.entrepriseName || '—',
            businessName: a.nom || a.businessName || a.business_name || a.companyName || a.entrepriseName || '—',
            legalForm: a.formeJuridique || a.legalForm || '—',
            status,
            submittedAt: a.creation || a.createdAt || a.submittedAt || new Date().toISOString(),
            totalAmount,
            currentStep: a.currentStep || undefined,
            overallProgress: Number(a.progress ?? a.overallProgress ?? 0),
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
      },
      {
        id: 'review-submit',
        title: 'Récapitulatif et soumission',
        description: 'Vérification finale et soumission de la demande',
        estimatedDuration: '5 min',
        details: 'Validation de toutes les informations, acceptation des conditions et soumission officielle de la demande'
      }
    ];

    // Détermine le statut de chaque étape basé sur la progression globale
    const progress = app.overallProgress;
    const stepProgress = progress / 100;
    const stepsCount = baseSteps.length;
    
    return baseSteps.map((step, index) => {
      const stepThreshold = (index + 1) / stepsCount;
      const prevStepThreshold = index / stepsCount;
      
      let status: TrackingStep['status'];
      let completedAt: string | undefined;
      
      if (stepProgress > stepThreshold) {
        status = 'completed';
        // Estimation de la date de completion basée sur la soumission
        const submittedDate = new Date(app.submittedAt);
        const completionDate = new Date(submittedDate.getTime() + (index * 2 * 60 * 60 * 1000)); // +2h par étape
        completedAt = completionDate.toISOString();
      } else if (stepProgress > prevStepThreshold) {
        status = 'in-progress';
      } else if (app.status === 'rejected' && stepProgress <= prevStepThreshold) {
        status = 'failed';
      } else {
        status = 'pending';
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
                                          {legalFormOptions.map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
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
                                          {businessTypeOptions.map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
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
                                        <input
                                          type="text"
                                          value={appEditData[app.id]?.divisionId || ''}
                                          onChange={e => setAppEditData(prev => ({ ...prev, [app.id]: { ...prev[app.id], divisionId: e.target.value } }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                          placeholder="ID de la division"
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
                                      <button
                                        onClick={() => setAppEditMode(prev => ({ ...prev, [app.id]: true }))}
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                                      >
                                        Modifier
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-6">
                              {(() => {
                                const steps = app.steps.length > 0 ? app.steps : generateBusinessCreationSteps(app);
                                return steps.map((step, index) => (
                                  <div key={step.id} className="relative">
                                    {/* Connector line */}
                                    {index < steps.length - 1 && (
                                      <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
                                    )}
                                  
                                  <div className="flex items-start space-x-4">
                                    {getTrackingStatusIcon(step.status)}
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className={`text-lg font-medium ${getTrackingStatusColor(step.status)}`}>
                                          {step.title}
                                        </h5>
                                        <span className="text-sm text-gray-500">{step.estimatedDuration}</span>
                                      </div>
                                      
                                      <p className="text-gray-600 mb-2">{step.description}</p>
                                      
                                      {step.details && (
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
                                ));
                              })()
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
          entrepriseId="69f667f7-b9a2-43cd-bf7c-8fb5c723ce33"
        />
      </div>
    </div>
  );
};

export default UserProfile;
