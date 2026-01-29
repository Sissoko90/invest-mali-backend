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
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { DemandeEntreprise } from '../types';
import { entreprisesAPI } from '../services/api';
import DocumentViewer from './DocumentViewer';
import { API_CONFIG } from '../config/api.config';

interface DocumentImpots {
  id: string;
  nom: string;
  type: string;
  statut: 'en_attente' | 'approuve' | 'rejete';
  commentaire?: string;
  dateUpload?: string;
  agentImpots?: string;
}

interface DemandeImpots {
  id: string;
  nom: string;
  typeEntreprise: string;
  formeJuridique: string;
  secteurActivite: string;
  dateCreation: string;
  etapeValidation: string;
  etapeActuelle: string;
  statut: string;
  demandeur: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  membres?: {
    nom: string;
    prenom: string;
    role: string;
    pourcentageParts: number;
  }[];
  statutImpots: 'en_cours' | 'nif_en_attente' | 'nif_valide' | 'termine';
  dateTransitionImpots: string;
  noteRevision?: string;
  agentRevision?: string;
  documents: DocumentImpots[];
  nifUploaded?: boolean;
  nifDocument?: DocumentImpots;
}

interface ImpotsStepProps {
  canEditStep: (step: string) => boolean;
  onDossierUpdate?: (updatedDossier: any) => void;
}

const ImpotsStep: React.FC<ImpotsStepProps> = ({ canEditStep, onDossierUpdate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [demandes, setDemandes] = useState<DemandeImpots[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<DemandeImpots | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
  const [uploadingNif, setUploadingNif] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<boolean>(false);
  const [showStepDropdown, setShowStepDropdown] = useState(false);

  // Définition des étapes disponibles pour le retour (étapes précédentes à IMPOTS - maintenant dernière étape)
  const availableSteps = [
    { id: 'RETRAIT', label: 'RETRAIT', description: 'Retour à l\'étape de retrait' },
    { id: 'NINA', label: 'NINA', description: 'Retour à l\'étape NINA' },
    { id: 'RCCM2', label: 'RCCM', description: 'Retour à l\'étape RCCM' },
    { id: 'TCOM', label: 'T-COM', description: 'Retour à l\'étape T-COM' },
    { id: 'REVISION', label: 'RÉVISION', description: 'Retour à l\'étape de révision' },
    { id: 'REGISSEUR', label: 'RÉGISSEUR', description: 'Retour au régisseur' },
    { id: 'ACCUEIL', label: 'ACCUEIL', description: 'Retour à l\'étape accueil' }
  ];

  // Fonction pour récupérer les documents d'une entreprise
  const getEntrepriseDocuments = async (entrepriseId: string): Promise<DocumentImpots[]> => {
    try {
      
      // Utiliser le même endpoint que EntrepriseDetails qui fonctionne avec les vrais documents
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const documents = await response.json();
      
      
      // Mapper les données de l'API vers le format attendu
      return documents.map((doc: any) => ({
        id: doc.id,
        nom: doc.nom || doc.name,
        type: doc.typeDocument || doc.type,
        statut: doc.statut || 'en_attente',
        commentaire: doc.commentaire,
        dateUpload: doc.dateUpload,
        agentImpots: doc.agentImpots
      }));
      
    } catch (error) {
      console.error('❌ [ImpotsStep] Erreur lors de la récupération des documents:', error);
      return [];
    }
  };

  // Simuler le chargement des demandes à l'étape IMPOTS
  useEffect(() => {
    loadDemandesImpots();
  }, []);

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

  const loadDemandesImpots = async () => {
    setIsLoading(true);
    try {
      
      // Récupérer les entreprises à l'étape IMPOTS
      const response = await entreprisesAPI.getByEtape('IMPOTS');
      const entreprises = response.data || [];
      
      
      // Mapper les données de l'API vers le format attendu par le composant
      const demandesImpots: DemandeImpots[] = await Promise.all(
        entreprises.map(async (entreprise: any) => {
          // Toujours récupérer les détails complets de l'entreprise pour avoir toutes les données
          let entrepriseComplete = entreprise;
          try {
            const detailsResponse = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entreprise.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                'Content-Type': 'application/json'
              }
            });
            if (detailsResponse.ok) {
              entrepriseComplete = await detailsResponse.json();
            }
          } catch (error) {
          }
          
          const documents = await getEntrepriseDocuments(entreprise.id);
          const nifDocument = documents.find(doc => doc.type === 'NIF');
          
          // Utiliser les données complètes pour tous les champs
          const entrepriseData = entrepriseComplete;
          
          return {
            id: entreprise.id,
            nom: entreprise.nom,
            typeEntreprise: entrepriseData.typeEntreprise || 'SARL',
            formeJuridique: entrepriseData.formeJuridique || entrepriseData.typeEntreprise || 'SARL',
            secteurActivite: entrepriseData.secteurActiviteNr || entrepriseData.secteurActivite || entrepriseData.secteur || entrepriseData.activite || entrepriseData.domaineActivite || 'Non spécifié',
            dateCreation: entrepriseData.dateCreationEntreprise || entrepriseData.dateCreationSociete || entrepriseData.dateCreation || entrepriseData.creation || new Date().toISOString(),
            etapeValidation: 'IMPOTS',
            etapeActuelle: 'IMPOTS',
            statut: 'en_cours',
            demandeur: (() => {
              const demandeur = {
                nom: entrepriseComplete.membres?.[0]?.nom || entrepriseComplete.createdBy?.personne?.nom || 'Utilisateur',
                prenom: entrepriseComplete.membres?.[0]?.prenom || entrepriseComplete.createdBy?.personne?.prenom || 'Inconnu',
                email: entrepriseComplete.createdBy?.email || 'email@example.com',
                telephone: entrepriseComplete.membres?.[0]?.telephone || entrepriseComplete.createdBy?.personne?.telephone1 || '+223 00 00 00 00'
              };
              return demandeur;
            })(),
            membres: entrepriseComplete.membres?.map((membre: any) => ({
              nom: membre.nom,
              prenom: membre.prenom,
              role: membre.role,
              pourcentageParts: membre.pourcentageParts
            })) || [],
            statutImpots: nifDocument ? 'nif_valide' : 'nif_en_attente',
            dateTransitionImpots: entreprise.modification || entreprise.dateCreation || new Date().toISOString(),
            noteRevision: 'Dossier approuvé par la révision. En attente du NIF.',
            agentRevision: 'Agent Révision',
            documents: documents,
            nifUploaded: !!nifDocument,
            nifDocument: nifDocument
          };
        })
      );
      
      setDemandes(demandesImpots);
      
    } catch (error: any) {
      setDemandes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour gérer le retour vers une étape spécifique
  const handleReturnToStep = async (stepId: string, demandeId: string) => {
    try {
      setIsLoading(true);
      
      // Trouver l'étape sélectionnée
      const selectedStep = availableSteps.find(step => step.id === stepId);
      if (!selectedStep) {
        alert('Étape non trouvée');
        return;
      }

      
      // Utiliser l'API update pour mettre à jour l'étape de validation et le statut
      const updateData = {
        statutCreation: 'EN_COURS',  // Utiliser EN_COURS au lieu de EN_ATTENTE
        etapeValidation: stepId,
        etapeActuelle: stepId,       // Ajouter etapeActuelle aussi
        note: `Demande retournée à l'étape ${selectedStep.label} par l'agent des impôts`
      };
      
      await entreprisesAPI.update(demandeId, updateData);
      
      // Attendre un peu avant de désassigner
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Désassigner pour que ça retourne à l'étape choisie
      await entreprisesAPI.unassign(demandeId);
      
      alert(`✅ Demande renvoyée vers l'étape ${selectedStep.label} avec succès!`);
      
      // Recharger les données
      await new Promise(resolve => setTimeout(resolve, 300));
      loadDemandesImpots();
      setSelectedDemande(null);
      
      // Fermer le dropdown
      setShowStepDropdown(false);
      
    } catch (error: any) {
      alert(`❌ Erreur lors du retour vers l'étape: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = (document: DocumentImpots, demandeId: string) => {
    setSelectedDocumentId(document.id);
    setSelectedDocumentName(document.nom);
  };

  const handleCloseDocumentViewer = () => {
    setSelectedDocumentId(null);
    setSelectedDocumentName('');
  };

  const handleUploadNif = async (entrepriseId: string, file: File) => {
    try {
      setUploadingNif(entrepriseId);
      
      // D'abord, récupérer les détails de l'entreprise pour obtenir l'ID d'une personne
      const entrepriseResponse = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!entrepriseResponse.ok) {
        throw new Error(`Erreur lors de la récupération de l'entreprise: ${entrepriseResponse.status}`);
      }

      const entrepriseData = await entrepriseResponse.json();
      
      // Récupérer l'ID du premier membre (gérant ou associé)
      let personneId = null;
      if (entrepriseData.membres && entrepriseData.membres.length > 0) {
        const membre = entrepriseData.membres[0];
        
        // Essayer différentes propriétés possibles pour l'ID de la personne
        personneId = membre.personId || membre.personneId || membre.personne?.id || membre.id;
      } 
      
      if (!personneId && entrepriseData.createdBy && entrepriseData.createdBy.personne) {
        personneId = entrepriseData.createdBy.personne.id;
      }
      
      // Si toujours pas trouvé, essayer d'autres propriétés
      if (!personneId && entrepriseData.createdBy) {
        personneId = entrepriseData.createdBy.id;
      }
      
      if (!personneId) {
        throw new Error('Aucune personne trouvée pour cette entreprise');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('typeDocument', 'NIF');
      formData.append('numero', `NIF-${Date.now()}`);
      formData.append('personneId', personneId);
      formData.append('entrepriseId', entrepriseId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Recharger les demandes
      loadDemandesImpots();
      
      alert('Document NIF uploadé avec succès !');
      
    } catch (error) {
      alert('Erreur lors de l\'upload du NIF. Veuillez réessayer.');
    } finally {
      setUploadingNif(null);
    }
  };

  const handleFinaliserImpots = async (demandeId: string, decision: 'approuve' | 'rejete', commentaire?: string) => {
    try {
      
      // TODO: Appel API pour finaliser l'étape impôts et passer à l'étape suivante (TCOM)
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demandeId}/finaliser-impots`, {
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
      console.log(`✅ [ImpotsStep] Impôts finalisés avec succès:`, result);
      console.log(`🎯 [ImpotsStep] Transition: IMPOTS → ${result.nouvelleEtape}`);
      
      // Recharger les demandes
      loadDemandesImpots();
      setSelectedDemande(null);
      setShowDetails(false);
      
      if (decision === 'approuve') {
        alert(`✅ Dossier approuvé avec succès !\n\n🎯 Transition: IMPOTS → ${result.nouvelleEtape}\n\nL'entreprise a été transférée à l'étape ${result.nouvelleEtape}.`);
      } else {
        alert(`❌ Dossier rejeté.\n\n🔄 Transition: IMPOTS → ${result.nouvelleEtape}\n\nL'entreprise retourne à l'étape ${result.nouvelleEtape} pour correction.\n\nRaison: ${commentaire}`);
      }
      
      if (onDossierUpdate) {
        // Créer un objet dossier minimal compatible
        const updatedDossier = {
          id: demandeId,
          reference: `REF-${demandeId}`,
          nom: selectedDemande?.nom || 'Entreprise',
          statut: decision === 'approuve' ? 'TCOM' : 'REVISION',
          dateCreation: new Date().toISOString(),
          documentsManquants: [],
          etapeValidation: decision === 'approuve' ? 'TCOM' : 'REVISION'
        };
        onDossierUpdate(updatedDossier);
      }

      // Afficher un message de succès
      alert(`Étape impôts finalisée avec succès. ${decision === 'approuve' ? 'Entreprise transférée au RCCM.' : 'Entreprise retournée à la Révision.'}`);
      
    } catch (error) {
      console.error('❌ [ImpotsStep] Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation de l\'étape impôts. Veuillez réessayer.');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'nif_en_attente': return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800';
      case 'nif_valide': return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800';
      case 'termine': return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800';
    }
  };

  const canEdit = canEditStep('IMPOTS');

  // Effet pour détecter le scroll et appliquer le sticky
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 100); // Devient sticky après 100px de scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-2xl' : 'relative'} bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6 transition-all duration-300`}>
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-br from-[#412A5C] to-primary-600 rounded-2xl shadow-lg mr-4">
            <DocumentCheckIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Étape Impôts</h2>
            <p className="text-slate-600 font-medium">Gestion des documents fiscaux et upload du NIF</p>
          </div>
        </div>

        {demandes.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gradient-to-br from-[#412A5C] to-primary-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
              <ExclamationTriangleIcon className="h-12 w-12 text-white mx-auto" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-3">Aucune demande à traiter</h3>
            <p className="text-slate-600 font-medium max-w-md mx-auto">
              Il n'y a actuellement aucune entreprise à l'étape impôts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div key={demande.id} className="bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="p-2 bg-gradient-to-br from-[#412A5C] to-primary-600 rounded-xl shadow-lg">
                        <BuildingOfficeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-800">{demande.nom}</h3>
                        <span className={`px-3 py-1 text-xs font-bold rounded-xl shadow-lg ${getStatutColor(demande.statutImpots)}`}>
                          {demande.statutImpots === 'nif_en_attente' ? '⏳ NIF en attente' : 
                           demande.statutImpots === 'nif_valide' ? '✅ NIF validé' : demande.statutImpots}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/50 rounded-xl p-3 border border-white/40">
                        <p className="text-xs text-slate-500 font-medium">Forme juridique</p>
                        <p className="text-sm text-slate-700 font-bold">{demande.formeJuridique}</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-3 border border-white/40">
                        <p className="text-xs text-slate-500 font-medium">Secteur</p>
                        <p className="text-sm text-slate-700 font-bold">{demande.secteurActivite}</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-3 border border-white/40">
                        <p className="text-xs text-slate-500 font-medium">Responsable</p>
                        <p className="text-sm text-slate-700 font-bold">{demande.membres ? demande.membres.map(m => `${m.prenom} ${m.nom}`).join(', ') : `${demande.demandeur.prenom} ${demande.demandeur.nom}`}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3 ml-6">
                    {!demande.nifUploaded && canEdit && (
                      <label className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 cursor-pointer flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold">
                        <CloudArrowUpIcon className="h-5 w-5" />
                        <span>{uploadingNif === demande.id ? '⏳ Upload...' : '📤 Upload NIF'}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={uploadingNif === demande.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadNif(demande.id, file);
                            }
                          }}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => {
                        setSelectedDemande(demande);
                        setShowDetails(true);
                      }}
                      className="bg-gradient-to-r from-[#412A5C] to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-[#412A5C] flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                    >
                      <EyeIcon className="h-5 w-5" />
                      <span>👁️ Détails</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal des détails modernisé */}
      {showDetails && selectedDemande && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-primary-900/50 to-primary-900/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-8 w-11/12 max-w-6xl">
            <div className="bg-gradient-to-br from-white/95 via-slate-50/90 to-primary-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
              {/* Header modernisé */}
              <div className="bg-gradient-to-r from-[#412A5C]/90 to-primary-600/90 backdrop-blur-xl p-8 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-2xl shadow-lg">
                      <BuildingOfficeIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        Détails de l'entreprise
                      </h3>
                      <p className="text-primary-100 font-medium text-lg">{selectedDemande.nom}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedDemande(null);
                    }}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <XCircleIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Contenu modernisé */}
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Informations entreprise modernisées */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-[#412A5C] to-primary-600 rounded-xl shadow-lg">
                        <span className="text-lg">🏢</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-800">Informations de l'entreprise</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-gradient-to-br from-primary-50 to-violet-100 rounded-2xl border-2 border-primary-200 hover:border-[#412A5C] transition-all duration-300">
                        <label className="flex items-center space-x-2 text-sm font-bold text-[#412A5C] mb-2">
                          <span>🏷️</span>
                          <span>Nom</span>
                        </label>
                        <p className="text-lg font-semibold text-slate-800">{selectedDemande.nom}</p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-violet-50 to-primary-100 rounded-2xl border-2 border-violet-200 hover:border-[#412A5C] transition-all duration-300">
                        <label className="flex items-center space-x-2 text-sm font-bold text-[#412A5C] mb-2">
                          <span>🏭</span>
                          <span>Type</span>
                        </label>
                        <p className="text-lg font-semibold text-slate-800">{selectedDemande.typeEntreprise}</p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-primary-200 hover:border-[#412A5C] transition-all duration-300">
                        <label className="flex items-center space-x-2 text-sm font-bold text-[#412A5C] mb-2">
                          <span>⚖️</span>
                          <span>Forme juridique</span>
                        </label>
                        <p className="text-lg font-semibold text-slate-800">{selectedDemande.formeJuridique}</p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-primary-100 rounded-2xl border-2 border-slate-200 hover:border-[#412A5C] transition-all duration-300">
                        <label className="flex items-center space-x-2 text-sm font-bold text-[#412A5C] mb-2">
                          <span>🎯</span>
                          <span>Secteur</span>
                        </label>
                        <p className="text-lg font-semibold text-slate-800">{selectedDemande.secteurActivite}</p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-primary-100 to-violet-100 rounded-2xl border-2 border-primary-300 hover:border-[#412A5C] transition-all duration-300">
                        <label className="flex items-center space-x-2 text-sm font-bold text-[#412A5C] mb-2">
                          <span>📅</span>
                          <span>Date de création</span>
                        </label>
                        <p className="text-lg font-semibold text-slate-800">{new Date(selectedDemande.dateCreation).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Membres modernisés */}
                    <div className="mt-8">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-[#412A5C] to-primary-600 rounded-xl shadow-lg">
                          <span className="text-lg">👥</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-800">Membres ({selectedDemande.membres?.length || 0})</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {selectedDemande.membres && selectedDemande.membres.length > 0 ? (
                          selectedDemande.membres.map((membre, index) => (
                            <div key={index} className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border-2 border-white/60 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 bg-gradient-to-r from-[#412A5C] to-primary-700 rounded-2xl shadow-lg">
                                  <span className="text-white text-xl">👤</span>
                                </div>
                                <div>
                                  <h5 className="text-lg font-black text-slate-800">{membre.prenom} {membre.nom}</h5>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                      membre.role === 'GERANT' ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' : 
                                      membre.role === 'ADMINISTRATEUR' ? 'bg-gradient-to-r from-primary-500 to-violet-600 text-white' :
                                      'bg-gradient-to-r from-slate-500 to-gray-600 text-white'
                                    } shadow-lg`}>
                                      {membre.role === 'GERANT' ? '👑 Gérant' : 
                                       membre.role === 'PROMOTEUR' ? '🚀 Promoteur' :
                                       membre.role === 'ADMINISTRATEUR' ? '⚙️ Administrateur' : 
                                       '🤝 Associé'}
                                    </span>
                                    <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-violet-600 text-white font-bold rounded-xl text-xs shadow-lg">
                                      {membre.pourcentageParts}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border-2 border-white/60 p-6 shadow-xl">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-gradient-to-r from-[#412A5C] to-primary-700 rounded-2xl shadow-lg">
                                <span className="text-white text-xl">👤</span>
                              </div>
                              <div>
                                <h5 className="text-lg font-black text-slate-800">{selectedDemande.demandeur.prenom} {selectedDemande.demandeur.nom}</h5>
                                <p className="text-sm text-slate-600 font-medium">📧 {selectedDemande.demandeur.email}</p>
                                <p className="text-sm text-slate-600 font-medium">📞 {selectedDemande.demandeur.telephone}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents modernisés */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-[#412A5C] to-primary-600 rounded-xl shadow-lg">
                        <span className="text-lg">📄</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-800">Documents ({selectedDemande.documents.length})</h4>
                    </div>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {selectedDemande.documents.length > 0 ? (
                        selectedDemande.documents.map((doc, index) => (
                          <div key={index} className="bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl border-2 border-white/60 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="p-3 bg-gradient-to-r from-[#412A5C] to-primary-700 rounded-xl shadow-lg">
                                  <DocumentTextIcon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-lg font-black text-slate-800">{doc.nom || 'Document sans nom'}</h5>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 font-bold rounded-xl text-xs shadow-lg">
                                      {doc.type || 'Type non spécifié'}
                                    </span>
                                    {doc.type === 'NIF' && (
                                      <span className="px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 font-bold rounded-xl text-xs shadow-lg">
                                        🎯 NIF
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleViewDocument(doc, selectedDemande.id)}
                                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-xl hover:from-primary-600 hover:to-primary-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                              >
                                <EyeIcon className="h-4 w-4" />
                                <span>👁️ Voir</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="relative inline-block mb-6">
                            <div className="p-6 bg-gradient-to-br from-primary-100 to-red-200 rounded-full shadow-2xl animate-pulse">
                              <DocumentTextIcon className="w-12 h-12 text-primary-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-primary-400 to-red-500 rounded-full animate-ping"></div>
                          </div>
                          <h5 className="text-lg font-black bg-gradient-to-r from-primary-600 to-red-600 bg-clip-text text-transparent mb-2">
                            Aucun document disponible
                          </h5>
                          <p className="text-slate-500 font-medium">Les documents de l'entreprise apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions modernisées */}
                {canEdit && (
                  <div className="bg-gradient-to-r from-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl p-6 border-t border-white/40 mt-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                        <span className="text-lg">⚡</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-800">Actions finales</h4>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => {
                          const commentaire = prompt('💬 Commentaire final (optionnel):');
                          handleFinaliserImpots(selectedDemande.id, 'approuve', commentaire || undefined);
                        }}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-2xl hover:from-primary-600 hover:to-primary-700 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedDemande.nifUploaded}
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                        <span>✅ Approuver et Transférer au RCCM</span>
                      </button>
                      
                      {/* Bouton de retour d'étape avec menu déroulant */}
                      <div className="relative flex-1">
                        <button
                          onClick={() => setShowStepDropdown(!showStepDropdown)}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-red-500 to-primary-600 text-white px-8 py-4 rounded-2xl hover:from-primary-600 hover:to-red-700 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg disabled:opacity-50"
                        >
                          <XMarkIcon className="h-6 w-6" />
                          <span>❌ Rejeter et Retourner</span>
                          <ChevronDownIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Menu déroulant */}
                        {showStepDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-auto max-h-64">
                            <div className="py-2">
                              <div className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-50 border-b">
                                Choisir l'étape de retour :
                              </div>
                              {availableSteps.map((step) => (
                                <button
                                  key={step.id}
                                  onClick={() => handleReturnToStep(step.id, selectedDemande.id)}
                                  disabled={isLoading}
                                  className="w-full text-left px-4 py-3 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 disabled:opacity-50"
                                >
                                  <div className="font-medium">{step.label}</div>
                                  <div className="text-sm text-gray-500">{step.description}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!selectedDemande.nifUploaded && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl border border-primary-200 shadow-lg">
                        <p className="text-primary-800 text-sm font-medium flex items-center space-x-2">
                          <span>⚠️</span>
                          <span><strong>Attention :</strong> Le NIF doit être uploadé avant de pouvoir approuver le dossier.</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DocumentViewer */}
      {selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId}
          documentName={selectedDocumentName}
          onClose={handleCloseDocumentViewer}
        />
      )}

      {/* Modal de confirmation de rejet */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Confirmer le rejet</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir rejeter ce dossier ?
            </p>
            
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
              <p className="text-primary-800 text-sm">
                <strong>⚠️ Conséquence :</strong> L'entreprise retournera à l'étape REVISION pour corriger les documents.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rejet (obligatoire) :
              </label>
              <textarea
                id="rejectReasonImpots"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Expliquez pourquoi ce dossier est rejeté..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const textarea = document.getElementById('rejectReasonImpots') as HTMLTextAreaElement;
                  const commentaire = textarea?.value?.trim();
                  if (commentaire) {
                    handleFinaliserImpots(selectedDemande!.id, 'rejete', commentaire);
                    setShowRejectConfirm(false);
                  } else {
                    alert('La raison du rejet est obligatoire.');
                  }
                }}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpotsStep;
























