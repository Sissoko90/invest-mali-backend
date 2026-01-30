import React, { useState, useEffect } from 'react';
import { 
  DocumentCheckIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  EyeSlashIcon,
  DocumentMagnifyingGlassIcon,
  ChevronDownIcon,
<<<<<<< HEAD
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { DemandeEntreprise } from '../types';
import { entreprisesAPI } from '../services/api';
import DocumentViewer from './DocumentViewer';
import { API_CONFIG } from '../config/api.config';

interface DocumentRevision {
  id: string;
  nom: string;
  type: string;
  statut: 'en_attente' | 'approuve' | 'rejete';
  commentaire?: string;
  dateRevision?: string;
  agentRevision?: string;
}

interface DemandeRevision extends DemandeEntreprise {
  documents?: DocumentRevision[];
  dateTransitionRevision?: string;
  noteRegisseur?: string;
  agentRegisseur?: string;
  statutRevision?: 'en_cours' | 'complete' | 'rejete';
  secteurActivite?: string;
  etapeValidation?: string;
  motifRejet?: string;
  reference?: string;
  createur?: {
    nom?: string;
    prenom?: string;
    email?: string;
  };
  participants?: Array<{
    nom?: string;
    prenom?: string;
    role?: string;
    pourcentageParts?: number;
  }>;
}

interface RevisionStepProps {
  onDossierUpdate?: (dossier: any) => void;
}

const RevisionStep: React.FC<RevisionStepProps> = ({ onDossierUpdate }) => {
  const { agent, canEditStep } = useAgentAuth();
  const [isScrolled, setIsScrolled] = useState(false);
<<<<<<< HEAD

  // Fonction utilitaire pour obtenir le nom d'affichage d'une entreprise
  // Utilise prénom+nom du gérant/promoteur si le nom d'entreprise est null
  const getDisplayName = (entreprise: any): string => {
    if (entreprise.nom) {
      return entreprise.nom;
    }
    
    // Si pas de nom d'entreprise, chercher le gérant/promoteur dans les membres
    const gerant = entreprise.membres?.find((m: any) => 
      m.role === 'GERANT' || m.role === 'PROMOTEUR' || 
      m.entrepriseRole === 'GERANT' || m.entrepriseRole === 'PROMOTEUR'
    );
    const personne = gerant?.personne || gerant;
    
    if (personne) {
      const fullName = `${personne.prenom || ''} ${personne.nom || ''}`.trim();
      return fullName || 'Entreprise sans nom';
    }
    
    // Fallback sur le créateur
    if (entreprise.createdBy?.personne) {
      const createur = entreprise.createdBy.personne;
      const fullName = `${createur.prenom || ''} ${createur.nom || ''}`.trim();
      return fullName || 'Entreprise sans nom';
    }
    
    return 'Entreprise sans nom';
  };
=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
  const [activeTab, setActiveTab] = useState<'demandes' | 'documents'>('demandes');
  const [isLoading, setIsLoading] = useState(false);
  const [demandes, setDemandes] = useState<DemandeRevision[]>([]);
  const [entreprisesPostRevision, setEntreprisesPostRevision] = useState<DemandeRevision[]>([]);
<<<<<<< HEAD
  const [filteredEntreprises, setFilteredEntreprises] = useState<DemandeRevision[]>([]);
=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
  const [selectedDemande, setSelectedDemande] = useState<DemandeRevision | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [customRejectReason, setCustomRejectReason] = useState('');

<<<<<<< HEAD
  // États pour la pagination et la recherche des documents révisés
  const [documentsSearch, setDocumentsSearch] = useState('');
  const [documentsPage, setDocumentsPage] = useState(0);
  const [documentsTotalPages, setDocumentsTotalPages] = useState(0);
  const [documentsTotalElements, setDocumentsTotalElements] = useState(0);
  const documentsPerPage = 10;

  // États pour la pagination des demandes à réviser
  const [demandesPage, setDemandesPage] = useState(0);
  const DEMANDES_PER_PAGE = 5;

=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
  // Motifs de rejet prédéfinis pour le retour à RÉVISION
  const rejectReasons = [
    'Document est illisible',
    'Le document téléchargé ne correspond pas au document demandé',
    'Le document est altéré ou falsifié',
    'Le document ne correspond pas aux données du formulaire',
    'Le document n\'est plus valide',
    'Autres'
  ];

  // Pour T-COM, seul retour à RÉVISION est possible
  const availableSteps = [
    { id: 'ACCUEIL', label: 'ACCUEIL', description: 'Retour à l\'étape d\'accueil' },
    { id: 'REVISION', label: 'RÉVISION', description: 'Retour à l\'étape de révision' }
  ];

  // Effet pour fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showStepDropdown && !target.closest('.relative')) {
        setShowStepDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStepDropdown]);

  // Fonction pour récupérer les documents d'une entreprise
  const getEntrepriseDocuments = async (entrepriseId: string): Promise<DocumentRevision[]> => {
    try {
      
      // Utiliser le même endpoint que EntrepriseDetails qui fonctionne avec les vrais documents
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Utiliser la même logique que EntrepriseDetails qui fonctionne correctement
      if (response.ok) {
        const documents = await response.json();
        
        // Mapper les données de l'API vers le format attendu
        return documents.map((doc: any) => ({
          id: doc.id,
          nom: doc.nom || doc.name,
          type: doc.typeDocument || doc.type,
          statut: doc.statut || 'en_attente',
          commentaire: doc.commentaire,
          dateRevision: doc.dateRevision,
          agentRevision: doc.agentRevision
        }));
      } else {
        return [];
      }
      
    } catch (error) {
      console.error('❌ [RevisionStep] Erreur lors de la récupération des documents:', error);
      return [];
    }
  };

  // Simuler le chargement des demandes à l'étape REVISION
  useEffect(() => {
    loadDemandesRevision();
  }, []);

  // Charger les entreprises post-révision quand l'onglet "documents" est activé
  useEffect(() => {
    if (activeTab === 'documents') {
      loadEntreprisesPostRevision();
    }
  }, [activeTab]);

<<<<<<< HEAD
  // Filtrer et paginer les entreprises post-révision
  useEffect(() => {
    let filtered = entreprisesPostRevision;
    
    // Appliquer la recherche par nom entreprise, nom/prénom personne, référence
    if (documentsSearch.trim()) {
      const searchLower = documentsSearch.toLowerCase();
      filtered = entreprisesPostRevision.filter(e => 
        e.nom?.toLowerCase().includes(searchLower) ||
        e.reference?.toLowerCase().includes(searchLower) ||
        e.demandeur?.nom?.toLowerCase().includes(searchLower) ||
        e.demandeur?.prenom?.toLowerCase().includes(searchLower)
      );
    }
    
    // Calculer la pagination
    setDocumentsTotalElements(filtered.length);
    setDocumentsTotalPages(Math.ceil(filtered.length / documentsPerPage));
    
    // Appliquer la pagination
    const startIndex = documentsPage * documentsPerPage;
    const paginatedEntreprises = filtered.slice(startIndex, startIndex + documentsPerPage);
    
    setFilteredEntreprises(paginatedEntreprises);
  }, [entreprisesPostRevision, documentsSearch, documentsPage]);

=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
  const loadDemandesRevision = async () => {
    setIsLoading(true);
    try {
      
      // Récupérer les vraies entreprises à l'étape REVISION depuis l'API
      const response = await entreprisesAPI.getByEtape('REVISION');
      
      const entreprises = response.data?.data || response.data || [];
      
      // Mapper les données de l'API vers le format attendu par le composant
      const demandesRevision: DemandeRevision[] = await Promise.all(
        entreprises.map(async (entreprise: any) => ({
          id: entreprise.id,
<<<<<<< HEAD
          nom: getDisplayName(entreprise),
=======
          nom: entreprise.nom,
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
          typeEntreprise: entreprise.typeEntreprise || 'SARL',
          formeJuridique: entreprise.formeJuridique || entreprise.typeEntreprise || 'SARL',
          secteurActivite: entreprise.domaineActiviteLabel || entreprise.domaineActiviteNr?.label || entreprise.secteurActivite || 'Non spécifié',
          dateCreation: entreprise.dateCreation || entreprise.creation,
          etapeValidation: 'REVISION',
          etapeActuelle: 'REVISION',
          statut: 'en_cours',
          demandeur: {
            nom: entreprise.createdBy?.personne?.nom || 'Utilisateur',
            prenom: entreprise.createdBy?.personne?.prenom || 'Inconnu',
            email: entreprise.createdBy?.email || 'email@example.com',
            telephone: entreprise.createdBy?.personne?.telephone1 || '+223 00 00 00 00'
          },
          statutRevision: 'en_cours',
          dateTransitionRevision: entreprise.modification || entreprise.dateCreation || new Date().toISOString(),
          noteRegisseur: entreprise.paiementEffectue ? 'Paiement effectué avec succès. Dossier prêt pour révision.' : 'Dossier transféré pour révision.',
          agentRegisseur: 'Agent Régisseur',
          motifRejet: entreprise.motifRejet, // Ajouter le motif de rejet depuis le backend
          reference: entreprise.reference,
          createur: {
            nom: entreprise.createdBy?.personne?.nom || entreprise.createdBy?.nom,
            prenom: entreprise.createdBy?.personne?.prenom || entreprise.createdBy?.prenom,
            email: entreprise.createdBy?.email
          },
          participants: entreprise.membres || [],
          // Récupérer les vrais documents de l'entreprise
          documents: await getEntrepriseDocuments(entreprise.id)
        }))
      );
      
      // DEBUG: Log pour vérifier les données
      const papersEntreprise = entreprises.find((e: any) => e.nom === 'PAPERS');
      console.log('🔍 [DEBUG] Entreprise PAPERS - Champs disponibles:', Object.keys(papersEntreprise || {}));
      console.log('🔍 [DEBUG] Entreprise PAPERS - motifRejet:', papersEntreprise?.motifRejet);
      console.log('🔍 [DEBUG] Entreprise PAPERS - motif_rejet:', papersEntreprise?.motif_rejet);
      console.log('🔍 [DEBUG] Entreprise PAPERS complète:', JSON.stringify(papersEntreprise, null, 2));
      
      setDemandes(demandesRevision);
      
    } catch (error: any) {
      console.error('❌ [RevisionStep] Erreur lors du chargement des entreprises:', error);
      console.error('❌ [RevisionStep] Message d\'erreur:', error.message);
      console.error('❌ [RevisionStep] Status de l\'erreur:', error.response?.status);
      console.error('❌ [RevisionStep] Données de l\'erreur:', error.response?.data);
      console.error('❌ [RevisionStep] URL de l\'erreur:', error.config?.url);
      
      // Fallback vers des données simulées en cas d'erreur
      const demandesRevision: DemandeRevision[] = [
        {
          id: '5d3f3e7f-d6e1-4544-ad69-2daaf19d0688',
          nom: 'lolipop (Simulé)',
          typeEntreprise: 'SARL',
          formeJuridique: 'SARL',
          secteurActivite: 'Commerce',
          dateCreation: '2024-11-05',
          etapeValidation: 'REVISION',
          etapeActuelle: 'REVISION',
          statut: 'en_cours',
          demandeur: {
            nom: 'Utilisateur',
            prenom: 'Test',
            email: 'test@example.com',
            telephone: '+223 70 00 00 00'
          },
          statutRevision: 'en_cours',
          dateTransitionRevision: '2024-11-05T11:36:53.000Z',
          noteRegisseur: 'Paiement effectué avec succès. Dossier prêt pour révision.',
          agentRegisseur: 'Agent Régisseur',
          documents: [
            {
              id: 'doc1',
              nom: 'Statuts de la société',
              type: 'STATUTS',
              statut: 'en_attente'
            },
            {
              id: 'doc2', 
              nom: 'Pièce d\'identité du gérant',
              type: 'IDENTITE',
              statut: 'en_attente'
            }
          ]
        }
      ];
      setDemandes(demandesRevision);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour charger les entreprises qui ont dépassé l'étape REVISION
  const loadEntreprisesPostRevision = async () => {
    try {
      
      // Étapes qui viennent après REVISION
      const etapesPostRevision = ['TCOM', 'RCCM2', 'NINA', 'RETRAIT', 'IMPOTS'];
      const toutesEntreprises: DemandeRevision[] = [];
      
      // Charger les entreprises de chaque étape post-révision
      for (const etape of etapesPostRevision) {
        try {
          const response = await entreprisesAPI.getByEtape(etape);
          const entreprises = response.data?.data || response.data || [];
          
          
          // Mapper les données pour chaque entreprise
          const entreprisesMappees = entreprises.map((entreprise: any) => ({
            id: entreprise.id,
<<<<<<< HEAD
            nom: getDisplayName(entreprise),
            reference: entreprise.reference || entreprise.numeroReference || '',
=======
            nom: entreprise.nom,
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
            typeEntreprise: entreprise.typeEntreprise || 'SARL',
            formeJuridique: entreprise.formeJuridique || entreprise.typeEntreprise || 'SARL',
            secteurActivite: entreprise.secteurActivite || 'Non spécifié',
            dateCreation: entreprise.dateCreation || entreprise.creation,
            etapeValidation: etape,
            etapeActuelle: etape,
            statut: 'approuve', // Ces entreprises ont dépassé la révision donc sont approuvées
            demandeur: {
<<<<<<< HEAD
              nom: entreprise.createdBy?.personne?.nom || entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR')?.personne?.nom || 'Utilisateur',
              prenom: entreprise.createdBy?.personne?.prenom || entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR')?.personne?.prenom || 'Inconnu',
=======
              nom: entreprise.createdBy?.personne?.nom || 'Utilisateur',
              prenom: entreprise.createdBy?.personne?.prenom || 'Inconnu',
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              email: entreprise.createdBy?.email || 'email@example.com',
              telephone: entreprise.createdBy?.personne?.telephone1 || '+223 00 00 00 00'
            },
            statutRevision: 'complete',
            dateTransitionRevision: entreprise.modification || entreprise.dateCreation || new Date().toISOString(),
            noteRegisseur: `Entreprise validée et transférée à l'étape ${etape}`,
            agentRegisseur: 'Agent Révision',
            documents: [] // Les documents seront chargés à la demande
          }));
          
          toutesEntreprises.push(...entreprisesMappees);
        } catch (error) {
          console.warn(`⚠️ [RevisionStep] Erreur lors du chargement de l'étape ${etape}:`, error);
          // Continuer avec les autres étapes même si une échoue
        }
      }
      
      setEntreprisesPostRevision(toutesEntreprises);
      
    } catch (error) {
      console.error('❌ [RevisionStep] Erreur lors du chargement des entreprises post-révision:', error);
      setEntreprisesPostRevision([]);
    }
  };

  const handleViewDocument = (document: DocumentRevision, demandeId: string) => {
    setSelectedDocumentId(document.id);
    setSelectedDocumentName(document.nom);
  };

  const handleCloseDocumentViewer = () => {
    setSelectedDocumentId(null);
    setSelectedDocumentName('');
  };

  const handleRevisionDocument = async (demandeId: string, documentId: string, statut: 'approuve' | 'rejete', commentaire?: string) => {
    try {
      // TODO: Appel API pour mettre à jour le statut du document
      // await api.put(`/entreprises/${demandeId}/documents/${documentId}/revision`, { statut, commentaire });
      
      // Mise à jour locale pour la démo
      setDemandes(prev => prev.map(demande => {
        if (demande.id === demandeId) {
          return {
            ...demande,
            documents: demande.documents?.map(doc => 
              doc.id === documentId 
                ? { ...doc, statut, commentaire, dateRevision: new Date().toISOString(), agentRevision: agent?.firstName }
                : doc
            )
          };
        }
        return demande;
      }));

      // Mettre à jour la demande sélectionnée si c'est celle en cours
      if (selectedDemande?.id === demandeId) {
        setSelectedDemande(prev => prev ? {
          ...prev,
          documents: prev.documents?.map(doc => 
            doc.id === documentId 
              ? { ...doc, statut, commentaire, dateRevision: new Date().toISOString(), agentRevision: agent?.firstName }
              : doc
          )
        } : null);
      }

      console.log(`Document ${documentId} ${statut} pour la demande ${demandeId}`);
    } catch (error) {
      console.error('Erreur lors de la révision du document:', error);
    }
  };

  const handleFinaliserRevision = async (demandeId: string, decision: 'approuve' | 'rejete', commentaire?: string) => {
    try {
      
<<<<<<< HEAD
      // Si on approuve, approuver automatiquement tous les documents d'abord
      if (decision === 'approuve' && selectedDemande?.documents) {
        // Approuver tous les documents localement
        const updatedDocuments = selectedDemande.documents.map(doc => ({
          ...doc,
          statut: 'approuve' as const,
          dateRevision: new Date().toISOString(),
          agentRevision: agent?.firstName
        }));
        
        // Mettre à jour l'état local
        setDemandes(prev => prev.map(demande => {
          if (demande.id === demandeId) {
            return { ...demande, documents: updatedDocuments };
          }
          return demande;
        }));
        
        setSelectedDemande(prev => prev ? { ...prev, documents: updatedDocuments } : null);
        
        console.log(`✅ Tous les documents (${updatedDocuments.length}) ont été approuvés automatiquement`);
      }
      
=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
      // Appel API pour finaliser la révision et passer à l'étape suivante
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demandeId}/finaliser-revision`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision, commentaire })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Recharger les demandes
      loadDemandesRevision();
      setSelectedDemande(null);
      setShowDetails(false);
      
      if (onDossierUpdate) {
        onDossierUpdate({ 
          id: demandeId, 
          etapeValidation: decision === 'approuve' ? 'TCOM' : 'ACCUEIL' 
        });
      }
<<<<<<< HEAD
=======

      // Afficher un message de succès
      alert(`Révision finalisée avec succès. ${decision === 'approuve' ? 'Entreprise transférée au RCCM Phase 1.' : 'Entreprise retournée à l\'étape l\'accueil.'}`);
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
      
    } catch (error) {
      console.error('❌ [RevisionStep] Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation de la révision. Veuillez réessayer.');
    }
  };

  // Fonction pour gérer le retour vers une étape spécifique
  const handleReturnToStep = async (stepId: string, demandeId: string, rejectReason?: string) => {
    try {
      setIsLoading(true);
      
      // Trouver l'étape sélectionnée
      const selectedStep = availableSteps.find(step => step.id === stepId);
      if (!selectedStep) {
        alert('Étape non trouvée');
        return;
      }

      console.log(`🔄 Retour vers l'étape ${selectedStep.label} pour la demande ${demandeId}`);
      
      // Utiliser la fonction existante avec 'rejete' et un commentaire spécifique
      await handleFinaliserRevision(demandeId, 'rejete', `Demande retournée à l'étape ${selectedStep.label} par l'agent de révision`);
      
      // Fermer le dropdown
      setShowStepDropdown(false);
      
    } catch (error: any) {
      console.error('❌ Erreur lors du retour d\'étape:', error);
      alert(`❌ Erreur lors du retour vers l'étape: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
<<<<<<< HEAD
      case 'en_cours': return 'bg-sky-50 text-black-800';
      case 'complete': return 'bg-sky-600 text-primary-800';
=======
      case 'en_cours': return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800';
      case 'complete': return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800';
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
      case 'rejete': return 'bg-gradient-to-r from-red-100 to-primary-200 text-red-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800';
    }
  };

  const canEdit = canEditStep('REVISION');

  // Effet pour détecter le scroll et appliquer le sticky
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 100); // Devient sticky après 100px de scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
<<<<<<< HEAD
      <div className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-2xl' : 'relative'} bg-gradient-to-r from-white/95 backdrop-blur-xl rounded-2xl border border-white/60 p-6 transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-sky-600 rounded-2xl shadow-lg">
=======
      <div className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-2xl' : 'relative'} bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6 transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-[#1e5987] to-[#2d6aa0] rounded-2xl shadow-lg">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              <DocumentCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">Révision des Documents</h1>
              <p className="text-slate-600 font-medium">Contrôle et validation des documents d'entreprise</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
<<<<<<< HEAD
            <span className="bg-sky-600 text-white px-4 py-2 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2">
              <DocumentMagnifyingGlassIcon className="h-5 w-5" />
              Étape REVISION
            </span>
            {!canEdit && (
              <span className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-4 py-2 rounded-xl text-lg font-bold shadow-lg flex items-center gap-2">
                <EyeSlashIcon className="h-5 w-5" />
                Lecture seule
=======
            <span className="bg-gradient-to-r from-primary-500 to-[#2d6aa0] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
              🔍 Étape REVISION
            </span>
            {!canEdit && (
              <span className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
                👁️ Lecture seule
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              </span>
            )}
          </div>
        </div>
      </div>


      {/* Tabs */}
<<<<<<< HEAD
      <div className="bg-gradient-to-r from-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60">
=======
      <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
        <div className="border-b border-white/40">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('demandes')}
<<<<<<< HEAD
              className={`py-4 px-1 border-b-2 font-bold text-lg transition-all duration-300 ${
                activeTab === 'demandes'
                  ? 'border-sky-600 text-sky-700 shadow-lg'
=======
              className={`py-4 px-1 border-b-2 font-bold text-sm transition-all duration-300 ${
                activeTab === 'demandes'
                  ? 'border-[#412A5C] text-[#412A5C] shadow-lg'
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="h-5 w-5" />
<<<<<<< HEAD
                <span>Demandes à Réviser ({demandes.length})</span>
=======
                <span>📋 Demandes à Réviser ({demandes.length})</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
<<<<<<< HEAD
              className={`py-4 px-1 border-b-2 font-bold text-lg transition-all duration-300 ${
                activeTab === 'documents'
                  ? 'border-sky-600 text-sky-700 shadow-lg'
=======
              className={`py-4 px-1 border-b-2 font-bold text-sm transition-all duration-300 ${
                activeTab === 'documents'
                  ? 'border-[#412A5C] text-[#412A5C] shadow-lg'
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5" />
<<<<<<< HEAD
                <span>Documents Révisés</span>
=======
                <span>📄 Documents Révisés</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Demandes */}
          {activeTab === 'demandes' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
<<<<<<< HEAD
                  <div className="p-4 bg-sky-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit animate-pulse">
                    <ClockIcon className="h-8 w-8 text-white mx-auto" />
                  </div>
                  <p className="text-lg text-slate-600 font-medium">Chargement des demandes...</p>
                </div>
              ) : demandes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-sky-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
                    <DocumentCheckIcon className="h-12 w-12 text-white mx-auto" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-3">Aucune demande à réviser</h3>
                  <p className="text-lg text-slate-600 font-medium max-w-md mx-auto">Toutes les demandes ont été traitées ou aucune n'est encore arrivée à l'étape de révision.</p>
                </div>
              ) : (
                <>
                {demandes
                  .slice(demandesPage * DEMANDES_PER_PAGE, (demandesPage + 1) * DEMANDES_PER_PAGE)
                  .map((demande) => (
                  <div key={demande.id} className="bg-gradient-to-r from-white/95 via-slate-50/80 to-sky-50/60 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-sky-600 rounded-2xl shadow-lg">
                          <BuildingOfficeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-slate-800">{demande.nom}</h3>
                          <p className="text-lg text-slate-600 font-medium">
=======
                  <div className="p-4 bg-gradient-to-br from-primary-500 to-[#2d6aa0] rounded-2xl shadow-lg mx-auto mb-6 w-fit animate-pulse">
                    <ClockIcon className="h-8 w-8 text-white mx-auto" />
                  </div>
                  <p className="text-slate-600 font-medium">Chargement des demandes...</p>
                </div>
              ) : demandes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-br from-[#1e5987] to-[#2d6aa0] rounded-2xl shadow-lg mx-auto mb-6 w-fit">
                    <DocumentCheckIcon className="h-12 w-12 text-white mx-auto" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-3">Aucune demande à réviser</h3>
                  <p className="text-slate-600 font-medium max-w-md mx-auto">Toutes les demandes ont été traitées ou aucune n'est encore arrivée à l'étape de révision.</p>
                </div>
              ) : (
                demandes.map((demande) => (
                  <div key={demande.id} className="bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-[#1e5987] to-[#2d6aa0] rounded-2xl shadow-lg">
                          <BuildingOfficeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-slate-800">{demande.nom}</h3>
                          <p className="text-sm text-slate-600 font-medium">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                            {demande.typeEntreprise} • {demande.secteurActivite}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="bg-white/50 rounded-lg px-3 py-1 border border-white/40">
<<<<<<< HEAD
                              <span className="text-sm text-slate-600 font-bold">
                                Réf: {demande.reference || 'N/A'}
                              </span>
                            </div>
                            <div className="bg-white/50 rounded-lg px-3 py-1 border border-white/40">
                              <span className="text-sm text-slate-600 font-bold">
=======
                              <span className="text-xs text-slate-600 font-bold">
                                ID: {demande.id}
                              </span>
                            </div>
                            <div className="bg-white/50 rounded-lg px-3 py-1 border border-white/40">
                              <span className="text-xs text-slate-600 font-bold">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                                Transféré le: {demande.dateTransitionRevision ? new Date(demande.dateTransitionRevision).toLocaleDateString('fr-FR') : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
<<<<<<< HEAD
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatutColor(demande.statutRevision || 'en_cours')}`}>
                          {demande.statutRevision === 'en_cours' ? 'En cours de révision' : 
                           demande.statutRevision === 'complete' ? 'Révision terminée' : 
                           demande.statutRevision === 'rejete' ? 'Rejeté' : 'En attente'}
=======
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getStatutColor(demande.statutRevision || 'en_cours')}`}>
                          {demande.statutRevision === 'en_cours' ? '🔍 En cours de révision' : 
                           demande.statutRevision === 'complete' ? '✅ Révision terminée' : 
                           demande.statutRevision === 'rejete' ? '❌ Rejeté' : '⏳ En attente'}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDemande(demande);
                            setShowDetails(true);
                          }}
<<<<<<< HEAD
                          className="bg-sky-600 text-white px-6 py-3 rounded-xl hover:from-sky-700 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl font-bold text-lg"
                        >
                          <EyeIcon className="h-5 w-5" />
                          <span>Réviser</span>
=======
                          className="bg-gradient-to-r from-[#1e5987] to-[#2d6aa0] text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-[#412A5C] transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl font-bold"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>👁️ Réviser</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                        </button>
                      </div>
                    </div>
                    
                    {/* Affichage du motif de rejet en priorité, sinon note du régisseur */}
                    {demande.motifRejet ? (
<<<<<<< HEAD
                      <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-red-50 rounded-xl border border-red-200 shadow-lg flex items-start gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-lg text-red-800 font-medium">
                          <span className="font-black">Motif de rejet:</span> {demande.motifRejet}
                        </p>
                      </div>
                    ) : demande.noteRegisseur && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-sky-50 to-sky-50 rounded-xl border border-sky-200 shadow-lg flex items-start gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                        <p className="text-lg text-sky-800 font-medium">
                          <span className="font-black">Note du régisseur:</span> {demande.noteRegisseur}
=======
                      <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-red-50 rounded-xl border border-red-200 shadow-lg">
                        <p className="text-sm text-red-800 font-medium">
                          <span className="font-black">⚠️ Motif de rejet:</span> {demande.motifRejet}
                        </p>
                      </div>
                    ) : demande.noteRegisseur && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-primary-50 rounded-xl border border-primary-200 shadow-lg">
                        <p className="text-sm text-primary-800 font-medium">
                          <span className="font-black">💬 Note du régisseur:</span> {demande.noteRegisseur}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                        </p>
                      </div>
                    )}
                  </div>
<<<<<<< HEAD
                ))}
                
                {/* Pagination des demandes à réviser - toujours affichée */}
                <div className="flex items-center justify-center space-x-4 mt-6 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setDemandesPage(prev => Math.max(0, prev - 1))}
                      disabled={demandesPage === 0}
                      className="px-4 py-2 text-sm font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      ← Précédent
                    </button>
                    <span className="text-sm font-medium text-slate-600">
                      Page {demandesPage + 1} sur {Math.ceil(demandes.length / DEMANDES_PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setDemandesPage(prev => Math.min(Math.ceil(demandes.length / DEMANDES_PER_PAGE) - 1, prev + 1))}
                      disabled={demandesPage >= Math.ceil(demandes.length / DEMANDES_PER_PAGE) - 1}
                      className="px-4 py-2 text-sm font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      Suivant →
                    </button>
                  </div>
                </>
=======
                ))
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              )}
            </div>
          )}

          {/* Tab Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
<<<<<<< HEAD
              <div className="bg-gradient-to-r from-sky-50/50 to-blue-50/50 rounded-2xl p-6 border border-sky-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-sky-600 rounded-xl shadow-lg">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Entreprises Post-Révision</h3>
                      <p className="text-lg text-slate-600 font-medium">
                        Entreprises ayant dépassé l'étape de révision
                        {documentsTotalElements > 0 && (
                          <span className="ml-2">({documentsTotalElements} entreprise{documentsTotalElements > 1 ? 's' : ''})</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadEntreprisesPostRevision()}
                    className="bg-sky-600 text-white px-4 py-2 rounded-xl text-lg font-bold hover:bg-sky-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    title="Recharger les entreprises"
                  >
                    <ArrowLeftIcon className="h-5 w-5 transform rotate-90" />
                    Actualiser
                  </button>
                </div>

                {/* Barre de recherche */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={documentsSearch}
                    onChange={(e) => {
                      setDocumentsSearch(e.target.value);
                      setDocumentsPage(0); // Réinitialiser à la première page lors de la recherche
                    }}
                    placeholder="Rechercher par nom d'entreprise, nom, prénom ou référence..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base"
                  />
=======
              <div className="bg-gradient-to-r from-[#1e5987]/10 to-primary-50/50 rounded-2xl p-6 border border-[#412A5C]/20">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-[#1e5987] to-[#2d6aa0] rounded-xl shadow-lg">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Entreprises Post-Révision</h3>
                    <p className="text-slate-600 font-medium">Entreprises ayant dépassé l'étape de révision</p>
                  </div>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                </div>

                {/* Liste des entreprises */}
                <div className="space-y-3">
<<<<<<< HEAD
                  {filteredEntreprises.length === 0 ? (
                    <div className="text-center py-8">
                      <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-700 mb-2">Aucune entreprise trouvée</h4>
                      <p className="text-lg text-gray-500">
                        {documentsSearch ? 'Aucun résultat pour votre recherche.' : 'Aucune entreprise n\'a encore dépassé l\'étape de révision.'}
                      </p>
                    </div>
                  ) : (
                    filteredEntreprises.map((entreprise) => (
=======
                  {entreprisesPostRevision.map((entreprise, index) => (
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                      <div 
                        key={entreprise.id} 
                        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/90"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
<<<<<<< HEAD
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
=======
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-[#2d6aa0] rounded-xl flex items-center justify-center shadow-lg">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                                <BuildingOfficeIcon className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
<<<<<<< HEAD
                              <h4 className="text-xl font-bold text-slate-800">{entreprise.nom}</h4>
                              <div className="flex items-center space-x-4 text-lg text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <UserIcon className="h-4 w-4" />
                                  <span>Réf: {entreprise.reference || 'N/A'}</span>
=======
                              <h4 className="text-lg font-bold text-slate-800">{entreprise.nom}</h4>
                              <div className="flex items-center space-x-4 text-sm text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <UserIcon className="h-4 w-4" />
                                  <span>ID: {entreprise.id}</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                                </span>
                                <span className="flex items-center space-x-1">
                                  <ClockIcon className="h-4 w-4" />
                                  <span>{new Date(entreprise.dateCreation).toLocaleDateString('fr-FR')}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
<<<<<<< HEAD
                            <div className="px-3 py-1 bg-gradient-to-r from-green-50 to-green-50 rounded-lg border border-green-200">
                              <span className="text-lg font-bold text-green-700">
=======
                            {/* Juste un badge simple avec l'étape actuelle */}
                            <div className="px-3 py-1 bg-gradient-to-r from-primary-50 to-primary-50 rounded-lg border border-primary-200">
                              <span className="text-sm font-bold text-primary-700">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                                Étape: {entreprise.etapeActuelle || 'TERMINÉ'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
<<<<<<< HEAD
                    ))
                  )}
                </div>

                {/* Pagination - toujours affichée */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Page <span className="font-medium">{documentsPage + 1}</span> sur <span className="font-medium">{Math.max(1, documentsTotalPages)}</span>
                    {' '}({documentsTotalElements} résultat{documentsTotalElements > 1 ? 's' : ''})
                  </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setDocumentsPage(Math.max(0, documentsPage - 1))}
                        disabled={documentsPage === 0}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                        Précédent
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, documentsTotalPages) }, (_, i) => {
                          let pageNum: number;
                          if (documentsTotalPages <= 5) {
                            pageNum = i;
                          } else if (documentsPage < 3) {
                            pageNum = i;
                          } else if (documentsPage > documentsTotalPages - 4) {
                            pageNum = documentsTotalPages - 5 + i;
                          } else {
                            pageNum = documentsPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setDocumentsPage(pageNum)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                documentsPage === pageNum
                                  ? 'bg-sky-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setDocumentsPage(Math.min(documentsTotalPages - 1, documentsPage + 1))}
                        disabled={documentsPage >= documentsTotalPages - 1}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Suivant
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
=======
                    ))}
                  
                  {/* Message si aucune entreprise */}
                  {entreprisesPostRevision.length === 0 && (
                    <div className="text-center py-8">
                      <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-700 mb-2">Aucune entreprise trouvée</h4>
                      <p className="text-gray-500">Aucune entreprise n'a encore dépassé l'étape de révision.</p>
                    </div>
                  )}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {showDetails && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<<<<<<< HEAD
          <div className="bg-gradient-to-r from-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 max-w-8xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-sky-600 rounded-2xl shadow-lg">
=======
          <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-[#1e5987] to-[#2d6aa0] rounded-2xl shadow-lg">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                    <DocumentCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Révision: {selectedDemande.nom}</h2>
<<<<<<< HEAD
                    <p className="text-slate-600 font-medium">{selectedDemande.typeEntreprise} • RE: {selectedDemande.reference}</p>
=======
                    <p className="text-slate-600 font-medium">{selectedDemande.typeEntreprise} • ID: {selectedDemande.id}</p>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 bg-white/50 rounded-xl border border-white/40 text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-all duration-300 shadow-lg"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Section Informations de l'Entreprise */}
              <div className="flex items-center space-x-3 mb-6">
<<<<<<< HEAD
                <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Informations de l'Entreprise</h3>
              </div>
              
              <div className="bg-sky-50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl mb-8">
=======
                <div className="p-2 bg-gradient-to-br from-primary-500 to-[#2d6aa0] rounded-xl shadow-lg">
                  <span className="text-lg">🏢</span>
                </div>
                <h3 className="text-lg font-black text-slate-800">Informations de l'Entreprise</h3>
              </div>
              
              <div className="bg-gradient-to-r from-white/90 via-slate-50/70 to-primary-50/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl mb-8">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colonne gauche */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Nom de l'entreprise</label>
<<<<<<< HEAD
                      <p className="text-xl font-black text-slate-800">{selectedDemande.nom}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Type d'entreprise</label>
                      <p className="text-lg font-medium text-slate-700">{selectedDemande.typeEntreprise}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Forme juridique</label>
                      <p className="text-lg font-medium text-slate-700">{selectedDemande.formeJuridique}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Secteur d'activité</label>
                      <p className="text-lg font-medium text-slate-700">{selectedDemande.secteurActivite}</p>
=======
                      <p className="text-lg font-black text-slate-800">{selectedDemande.nom}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Type d'entreprise</label>
                      <p className="text-base font-medium text-slate-700">{selectedDemande.typeEntreprise}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Forme juridique</label>
                      <p className="text-base font-medium text-slate-700">{selectedDemande.formeJuridique}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Secteur d'activité</label>
                      <p className="text-base font-medium text-slate-700">{selectedDemande.secteurActivite}</p>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                    </div>
                  </div>
                  
                  {/* Colonne droite */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Référence</label>
<<<<<<< HEAD
                      <p className="text-lg font-mono font-medium text-slate-700">{selectedDemande.reference}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Date de création</label>
                      <p className="text-lg font-medium text-slate-700">{selectedDemande.dateCreation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Créé par</label>
                      <p className="text-lg font-medium text-slate-700">{selectedDemande.createur?.nom} {selectedDemande.createur?.prenom}</p>
=======
                      <p className="text-base font-mono font-medium text-slate-700">{selectedDemande.reference}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Date de création</label>
                      <p className="text-base font-medium text-slate-700">{selectedDemande.dateCreation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Créé par</label>
                      <p className="text-base font-medium text-slate-700">{selectedDemande.createur?.nom} {selectedDemande.createur?.prenom}</p>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                      <p className="text-sm text-slate-500">{selectedDemande.createur?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Statut</label>
<<<<<<< HEAD
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-lg font-bold bg-gradient-to-r from-sky-100 to-sky-200 text-sky-800">
                        <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                        {selectedDemande.statutRevision}
=======
                      <span className="inline-block px-3 py-1 rounded-lg text-sm font-bold bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800">
                        🔍 {selectedDemande.statutRevision}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Section Membres/Participants */}
                {selectedDemande.participants && selectedDemande.participants.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/40">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3 block">Membres/Participants</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDemande.participants.map((participant: any, index: number) => (
                        <div key={index} className="bg-white/60 rounded-xl p-4 border border-white/40">
                          <div className="flex items-center space-x-3">
<<<<<<< HEAD
                            <div className="p-2 bg-sky-600 rounded-lg">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-slate-800">{participant.nom} {participant.prenom}</p>
                              <p className="text-sm text-slate-600">{participant.role}</p>
                              {participant.pourcentageParts && selectedDemande.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
                                <p className="text-sm text-slate-500">{participant.pourcentageParts}% des parts</p>
=======
                            <div className="p-2 bg-gradient-to-br from-[#1e5987] to-[#2d6aa0] rounded-lg">
                              <span className="text-white text-sm">👤</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{participant.nom} {participant.prenom}</p>
                              <p className="text-sm text-slate-600">{participant.role}</p>
                              {participant.pourcentageParts && selectedDemande.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
                                <p className="text-xs text-slate-500">{participant.pourcentageParts}% des parts</p>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section Documents */}
              <div className="flex items-center space-x-3 mb-6">
<<<<<<< HEAD
                <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Documents à Réviser</h3>
=======
                <div className="p-2 bg-gradient-to-br from-primary-500 to-[#2d6aa0] rounded-xl shadow-lg">
                  <span className="text-lg">📄</span>
                </div>
                <h3 className="text-lg font-black text-slate-800">Documents à Réviser</h3>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              </div>
              
              <div className="space-y-4">
                {selectedDemande.documents && selectedDemande.documents.length > 0 ? (
                  selectedDemande.documents.map((document) => (
<<<<<<< HEAD
                  <div key={document.id} className="bg-gradient-to-r from-white/90 via-slate-50/70 to-sky-50/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                          <DocumentTextIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-800">{document.nom}</h4>
                          <p className="text-sm text-slate-600 font-medium">Type: {document.type}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatutColor(document.statut)}`}>
                        {document.statut === 'en_attente' ? 'En attente' :
                         document.statut === 'approuve' ? 'Approuvé' : 'Rejeté'}
=======
                  <div key={document.id} className="bg-gradient-to-r from-white/90 via-slate-50/70 to-primary-50/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-[#1e5987] to-[#2d6aa0] rounded-xl shadow-lg">
                          <DocumentTextIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">{document.nom}</h4>
                          <p className="text-sm text-slate-600 font-medium">Type: {document.type}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getStatutColor(document.statut)}`}>
                        {document.statut === 'en_attente' ? '⏳ En attente' :
                         document.statut === 'approuve' ? '✅ Approuvé' : '❌ Rejeté'}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                      </span>
                    </div>

                    {document.commentaire && (
<<<<<<< HEAD
                      <div className="mb-4 p-4 bg-gradient-to-r from-sky-50 to-sky-50 rounded-xl border border-sky-200 shadow-lg">
                        <p className="text-lg text-sky-800 font-medium">
                          <span className="font-black">Commentaire:</span> {document.commentaire}
=======
                      <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-primary-50 rounded-xl border border-primary-200 shadow-lg">
                        <p className="text-sm text-primary-800 font-medium">
                          <span className="font-black">💬 Commentaire:</span> {document.commentaire}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {/* Bouton Visualiser - toujours disponible */}
                      <button
                        onClick={() => handleViewDocument(document, selectedDemande.id)}
<<<<<<< HEAD
                        className="bg-sky-600 text-white px-4 py-2 rounded-xl text-lg hover:from-sky-700 hover:to-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                      >
                        <EyeIcon className="h-5 w-5" />
                        <span>Visualiser</span>
=======
                        className="bg-[#1e5987] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#2563a3] flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>👁️ Visualiser</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                      </button>
                      
                      {/* Boutons d'action - seulement si éditable et en attente */}
                      {canEdit && document.statut === 'en_attente' && (
                        <>
                          <button
                            onClick={() => handleRevisionDocument(selectedDemande.id, document.id, 'approuve')}
<<<<<<< HEAD
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl text-lg hover:from-green-700 hover:to-green-800 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>Approuver</span>
=======
                            className="bg-[#1e5987] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#2563a3] flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>✅ Approuver</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                          </button>
                          <button
                            onClick={() => {
                              const commentaire = prompt('Commentaire de rejet (optionnel):');
                              handleRevisionDocument(selectedDemande.id, document.id, 'rejete', commentaire || undefined);
                            }}
<<<<<<< HEAD
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl text-lg hover:from-red-700 hover:to-red-800 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                          >
                            <XCircleIcon className="h-5 w-5" />
                            <span>Rejeter</span>
=======
                            className="bg-[#1e5987] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#2563a3] flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            <span>❌ Rejeter</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="relative inline-block mb-8">
<<<<<<< HEAD
                      <div className="p-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full shadow-2xl animate-pulse">
                        <DocumentTextIcon className="w-16 h-16 text-amber-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent mb-4">
                      Aucun document disponible
                    </h3>
                    <p className="text-slate-500 text-xl">Les documents de l'entreprise apparaîtront ici une fois chargés</p>
=======
                      <div className="p-8 bg-gradient-to-br from-primary-100 to-red-200 rounded-full shadow-2xl animate-pulse">
                        <DocumentTextIcon className="w-16 h-16 text-primary-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary-400 to-red-500 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-primary-600 to-red-600 bg-clip-text text-transparent mb-4">
                      Aucun document disponible
                    </h3>
                    <p className="text-slate-500 text-lg">Les documents de l'entreprise apparaîtront ici une fois chargés</p>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="mt-8 pt-6 border-t border-white/40">
                  <div className="flex items-center space-x-3 mb-6">
<<<<<<< HEAD
                    <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800">Finaliser la Révision</h4>
=======
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-[#2d6aa0] rounded-xl shadow-lg">
                      <span className="text-lg">⚡</span>
                    </div>
                    <h4 className="font-black text-slate-800">Finaliser la Révision</h4>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleFinaliserRevision(selectedDemande.id, 'approuve')}
<<<<<<< HEAD
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Approuver et Transférer au TCOM</span>
=======
                      className="flex-1 bg-[#1e5987] text-white px-6 py-4 rounded-xl hover:bg-[#2563a3] flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>✅ Approuver et Transférer au TCOM</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                    </button>
                    {/* Bouton de retour d'étape avec menu déroulant */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={isLoading}
<<<<<<< HEAD
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-red-800 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg disabled:opacity-50"
                      >
                        <XMarkIcon className="h-5 w-5" />
                        <span>Rejeter et Retourner à l'ACCUEIL</span>
=======
                        className="w-full bg-[#1e5987] text-white px-6 py-4 rounded-xl hover:bg-[#2563a3] flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 font-bold disabled:opacity-50"
                      >
                        <XMarkIcon className="h-5 w-5" />
                        <span>❌ Rejeter et Retourner à l'ACCUEIL</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                      </button>
                      
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejet avec motifs */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
<<<<<<< HEAD
                <h3 className="text-xl font-bold text-gray-800">Motif de rejet</h3>
=======
                <h3 className="text-lg font-bold text-gray-800">Motif de rejet</h3>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRejectReason('');
                    setCustomRejectReason('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
<<<<<<< HEAD
              <p className="text-lg text-gray-600 mb-4">
=======
              <p className="text-sm text-gray-600 mb-4">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                Sélectionnez le motif de retour à l'étape RÉVISION :
              </p>
              
              <div className="space-y-2 mb-4">
                {rejectReasons.map((reason) => (
                  <label key={reason} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason}
                      checked={selectedRejectReason === reason}
                      onChange={(e) => setSelectedRejectReason(e.target.value)}
<<<<<<< HEAD
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-lg text-gray-700">{reason}</span>
=======
                      className="text-[#1e5987] focus:ring-[#1e5987]"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                  </label>
                ))}
              </div>
              
              {selectedRejectReason === 'Autres' && (
                <div className="mb-4">
<<<<<<< HEAD
                  <label className="block text-lg font-medium text-gray-700 mb-2">
=======
                  <label className="block text-sm font-medium text-gray-700 mb-2">
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                    Précisez le motif :
                  </label>
                  <textarea
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Saisissez le motif de rejet..."
<<<<<<< HEAD
                    className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
=======
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e5987] focus:border-[#1e5987] resize-none"
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                    rows={3}
                  />
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRejectReason('');
                    setCustomRejectReason('');
                  }}
<<<<<<< HEAD
                  className="flex-1 px-4 py-2 text-lg border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
=======
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const finalReason = selectedRejectReason === 'Autres' ? customRejectReason : selectedRejectReason;
                    if (finalReason.trim() && selectedDemande) {
                      handleReturnToStep('ACCUEIL', selectedDemande.id, finalReason);
                      setShowRejectModal(false);
                      setSelectedRejectReason('');
                      setCustomRejectReason('');
                    }
                  }}
                  disabled={!selectedRejectReason || (selectedRejectReason === 'Autres' && !customRejectReason.trim())}
<<<<<<< HEAD
                  className="flex-1 px-4 py-2 text-lg bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
=======
                  className="flex-1 px-4 py-2 bg-[#1e5987] text-white rounded-lg hover:bg-[#2563a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DocumentViewer - comme dans EntrepriseDetails */}
      {selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId}
          documentName={selectedDocumentName}
          onClose={handleCloseDocumentViewer}
        />
      )}
    </div>
  );
};

export default RevisionStep;
























