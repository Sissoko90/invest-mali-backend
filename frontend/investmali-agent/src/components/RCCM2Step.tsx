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
  XMarkIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { DemandeEntreprise } from '../types';
import { entreprisesAPI } from '../services/api';
import DocumentViewer from './DocumentViewer';
import RccmCertificate from './RccmCertificate';
import RccmCertificateP1 from './RccmCertificateP1';
import { API_CONFIG } from '../config/api.config';

interface DocumentRCCM2 {
  id: string;
  nom: string;
  type: string;
  statut: 'en_attente' | 'approuve' | 'rejete';
  commentaire?: string;
  dateUpload?: string;
  agentRCCM2?: string;
  localite?: string;
  situationMatrimonialeStr?: string;
}

interface DemandeRCCM2 {
  id: string;
  nom: string;
  sigle?: string;
  typeEntreprise: string;
  formeJuridique: string;
  secteurActivite: string;
  dateCreation: string;
  etapeValidation: string;
  etapeActuelle: string;
  statut: string;
  localite?: string;
  
  demandeur: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    civilite?: string;
    situationMatrimoniale?: string;
    localite?: string;
  };
  membres?: {
    nom: string;
    prenom: string;
    role: string;
    pourcentageParts: number;
    civilite?: string;
    sexe?: string;
    situationMatrimonialeStr?: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    nationalite?: string;
    email?: string;
    telephone?: string;
    localite?: string;
    
  }[];
  statutRCCM2: 'en_cours' | 'rccm_a_remplacer' | 'rccm_remplace' | 'termine';
  dateTransitionRCCM2: string;
  noteRCCM1?: string;
  agentRCCM1?: string;
  documents: DocumentRCCM2[];
  rccmExistant?: boolean;
  rccmDocument?: DocumentRCCM2;
  rccmNumber?: string;
  capital?: string;
  city?: string;
  adresse?: string;
  manualRccmData?: any;
  regionNom?: string;
  quartierNom?: string;
  communeNom?: string;
  cercleNom?: string;
  divisionNom?: string;
  situationMatrimonialeStr?: string;
  domaineActiviteLabel?: string;
}

interface RCCM2StepProps {
  canEditStep: (step: string) => boolean;
  onDossierUpdate?: (updatedDossier: any) => void;
}

const RCCM2Step: React.FC<RCCM2StepProps> = ({ onDossierUpdate }) => {
  const { canEditStep } = useAgentAuth();
  const [demandes, setDemandes] = useState<DemandeRCCM2[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<DemandeRCCM2 | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
  const [replacingRCCM, setReplacingRCCM] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<boolean>(false);
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  const [showRccmCertificate, setShowRccmCertificate] = useState<string | null>(null);

  // Définition des étapes disponibles pour le retour (étapes précédentes à RCCM2)
  const availableSteps = [
    { id: 'TCOM', label: 'T-COM', description: 'Retour à l\'étape T-COM' },
    { id: 'REVISION', label: 'RÉVISION', description: 'Retour à l\'étape de révision' },
    { id: 'REGISSEUR', label: 'RÉGISSEUR', description: 'Retour au régisseur' },
    { id: 'ACCUEIL', label: 'ACCUEIL', description: 'Retour à l\'étape accueil' }
  ];

  useEffect(() => {
    loadDemandesRCCM2();
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

  const getEntrepriseDocuments = async (entrepriseId: string): Promise<DocumentRCCM2[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ [RCCM2Step] Erreur récupération documents pour ${entrepriseId}: ${response.status}`);
        return [];
      }

      const documents = await response.json();
      console.log(`📄 [RCCM2Step] ${documents.length} documents récupérés:`, documents);
      
      return documents.map((doc: any) => ({
        id: doc.id,
        nom: doc.nom || doc.nomDocument || doc.nomFichier || doc.libelle || `Document ${doc.typeDocument || doc.type || doc.typePiece || 'Inconnu'}`,
        type: doc.typeDocument || doc.type || doc.typePiece || doc.categorie || doc.typeDoc || 'INCONNU',
        statut: 'en_attente',
        dateUpload: doc.dateCreation || doc.dateUpload || doc.creation || new Date().toISOString()
      }));
    } catch (error) {
      console.error(`❌ [RCCM2Step] Erreur lors de la récupération des documents:`, error);
      return [];
    }
  };

  const loadDemandesRCCM2 = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les entreprises à l'étape RCCM2
      const response = await entreprisesAPI.getByEtape('RCCM2');
      const entreprises = response.data || [];
      
      // Charger les données RCCM manuelles depuis localStorage (pour les sociétés)
      const manualRccmData = JSON.parse(localStorage.getItem('manual_rccm_data') || '{}');
      
      // Mapper les données de l'API vers le format attendu par le composant
      const demandesRCCM2: DemandeRCCM2[] = await Promise.all(
        entreprises.map(async (entreprise: any) => {
          // Toujours récupérer les détails complets de l'entreprise
          // Utiliser directement les données de l'endpoint /etape/RCCM2 qui contient déjà tous les champs
          let entrepriseComplete = entreprise;
          
          const documents = await getEntrepriseDocuments(entreprise.id);
          
          // Vérifier d'abord s'il y a un RCCM manuel pour cette entreprise (sociétés)
          const manualRccm = manualRccmData[entreprise.id];
          let hasRccm = false;
          let rccmNumber = null;
          
          if (manualRccm && manualRccm.numeroRccm) {
            hasRccm = true;
            rccmNumber = manualRccm.numeroRccm;
          }
          
          // Ensuite vérifier les documents uploadés
          const rccmDocument = documents.find(doc => 
            doc.type === 'RCCM' || 
            doc.type === 'REGISTRE_COMMERCE' ||
            doc.type === 'STATUS_SOCIETE' ||
            doc.type?.includes('RCCM') ||
            doc.type?.includes('REGISTRE') ||
            doc.nom?.includes('RCCM') ||
            doc.nom?.includes('Registre') ||
            doc.nom?.includes('STATUS')
          );
          
          if (rccmDocument) {
            hasRccm = true;
          }
          
          // Vérifier aussi le numéro RCCM dans les données de l'entreprise
          if (entrepriseComplete.numeroRccm || entrepriseComplete.rccmNumber) {
            hasRccm = true;
            rccmNumber = entrepriseComplete.numeroRccm || entrepriseComplete.rccmNumber;
          }
          
          return {
            id: entreprise.id,
            nom: entreprise.nom,
            sigle: entrepriseComplete.sigle,
            typeEntreprise: entrepriseComplete.typeEntreprise || 'SARL',
            formeJuridique: entrepriseComplete.formeJuridique || entrepriseComplete.typeEntreprise || 'SARL',
            secteurActivite: entrepriseComplete.domaineActiviteNr || entrepriseComplete.domaineActivite || entrepriseComplete.secteurActiviteNr || entrepriseComplete.secteurActivite || 'Non spécifié',
            dateCreation: entrepriseComplete.dateCreationEntreprise || entrepriseComplete.dateCreation || new Date().toISOString(),
            etapeValidation: 'RCCM2',
            etapeActuelle: 'RCCM2',
            statut: 'en_cours',
            demandeur: {
              nom: entrepriseComplete.membres?.[0]?.nom || entrepriseComplete.createdBy?.personne?.nom || 'Utilisateur',
              prenom: entrepriseComplete.membres?.[0]?.prenom || entrepriseComplete.createdBy?.personne?.prenom || 'Inconnu',
              email: entrepriseComplete.createdBy?.email || 'email@example.com',
              telephone: entrepriseComplete.membres?.[0]?.telephone || entrepriseComplete.createdBy?.personne?.telephone1 || '+223 00 00 00 00',
              dateNaissance: entrepriseComplete.membres?.[0]?.dateNaissance || entrepriseComplete.createdBy?.personne?.dateNaissance || '',
              lieuNaissance: entrepriseComplete.membres?.[0]?.lieuNaissance || entrepriseComplete.createdBy?.personne?.lieuNaissance || ''
            },
            membres: entrepriseComplete.membres?.map((membre: any) => ({
              nom: membre.nom,
              prenom: membre.prenom,
              role: membre.role,
              pourcentageParts: membre.pourcentageParts,
              civilite: membre.civilite,
              sexe: membre.sexe,
              situationMatrimonialeStr: membre.situationMatrimonialeStr,
              dateNaissance: membre.dateNaissance,
              lieuNaissance: membre.lieuNaissance,
              nationalite: membre.nationalite,
              email: membre.email,
              telephone: membre.telephone
            })) || [],
            statutRCCM2: determinerStatutRCCM2(rccmDocument, entreprise),
            dateTransitionRCCM2: entreprise.modification || entreprise.dateCreation || new Date().toISOString(),
            noteRCCM1: 'Dossier approuvé par TCOM. Document RCCM à valider.',
            agentRCCM1: 'Agent TCOM',
            documents: documents,
            rccmExistant: !!rccmDocument,
            rccmDocument: rccmDocument,
            rccmNumber: rccmNumber || entrepriseComplete.numeroRccm || entreprise.numeroRccm || '',
            manualRccmData: manualRccm || null,
            capital: entrepriseComplete.capital || entrepriseComplete.capitale || '1000000',
            city: entrepriseComplete.localite || entrepriseComplete.ville || 'Bamako',
            adresse: entrepriseComplete.adresse || entrepriseComplete.localite || 'Bamako',
            regionNom: entrepriseComplete.regionNom,
            quartierNom: entrepriseComplete.quartierNom,
            communeNom: entrepriseComplete.communeNom,
            cercleNom: entrepriseComplete.cercleNom,
            divisionNom: entrepriseComplete.divisionNom,
            localite: entrepriseComplete.membres?.[0]?.localite || entrepriseComplete.localite || '',
            situationMatrimonialeStr: entrepriseComplete.situationMatrimoniale,
            domaineActiviteLabel: entrepriseComplete.domaineActiviteLabel
          };
        })
      );

      setDemandes(demandesRCCM2);
      
    } catch (error) {
      console.error('❌ [RCCM2Step] Erreur lors du chargement des demandes:', error);
      setDemandes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = (documentId: string, documentName: string) => {
    setSelectedDocumentId(documentId);
    setSelectedDocumentName(documentName);
  };

  const handleCloseDocumentViewer = () => {
    setSelectedDocumentId(null);
    setSelectedDocumentName('');
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

      console.log(`🔄 Retour vers l'étape ${selectedStep.label} pour la demande ${demandeId}`);
      console.log(`📋 Paramètres de retour:`, { stepId, selectedStep });
      
      // Utiliser l'API update pour mettre à jour l'étape de validation et le statut
      const updateData = {
        statutCreation: 'EN_COURS',  // Utiliser EN_COURS au lieu de EN_ATTENTE
        etapeValidation: stepId,
        etapeActuelle: stepId,       // Ajouter etapeActuelle aussi
        note: `Demande retournée à l'étape ${selectedStep.label} par l'agent RCCM2`
      };
      
      console.log(`🔄 Données de mise à jour:`, updateData);
      await entreprisesAPI.update(demandeId, updateData);
      
      // Attendre un peu avant de désassigner
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Désassigner pour que ça retourne à l'étape choisie
      console.log(`🔄 Désassignation de la demande ${demandeId}`);
      await entreprisesAPI.unassign(demandeId);
      
      alert(`✅ Demande renvoyée vers l'étape ${selectedStep.label} avec succès!`);
      
      // Recharger les données
      await new Promise(resolve => setTimeout(resolve, 300));
      loadDemandesRCCM2();
      setSelectedDemande(null);
      
      // Fermer le dropdown
      setShowStepDropdown(false);
      
    } catch (error: any) {
      console.error('❌ Erreur lors du retour d\'étape:', error);
      alert(`❌ Erreur lors du retour vers l'étape: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour déterminer le statut RCCM2 selon la date de modification
  const determinerStatutRCCM2 = (rccmDocument: any, entreprise: any) => {
    if (!rccmDocument) {
      return 'rccm_a_remplacer'; // Pas de document RCCM
    }

    // Vérifier si le document RCCM a été modifié récemment (dans les dernières 5 minutes)
    const dateUpload = new Date(rccmDocument.dateUpload || rccmDocument.dateCreation);
    const dateTransition = new Date(entreprise.modification || entreprise.dateCreation);
    const maintenant = new Date();
    
    // Charger les données RCCM manuelles depuis localStorage (pour les sociétés)
    const manualRccmData = JSON.parse(localStorage.getItem('manual_rccm_data') || '{}');
    console.log('📦 [RCCM2Step] Données RCCM manuelles chargées:', manualRccmData);

    // Si le document a été uploadé après la transition vers RCCM2, il a été remplacé
    if (dateUpload > dateTransition) {
      console.log(`📋 [RCCM2Step] Document RCCM récent détecté - statut: remplacé`);
      return 'rccm_remplace';
    }
    
    // Si le document est récent (moins de 5 minutes), il vient d'être remplacé
    const diffMinutes = (maintenant.getTime() - dateUpload.getTime()) / (1000 * 60);
    if (diffMinutes < 5) {
      console.log(`📋 [RCCM2Step] Document RCCM très récent (${diffMinutes.toFixed(1)}min) - statut: remplacé`);
      return 'rccm_remplace';
    }
    
    console.log(`📋 [RCCM2Step] Document RCCM ancien - statut: à remplacer`);
    return 'rccm_a_remplacer';
  };

  // Fonction pour remplacer le document RCCM existant
  const handleReplaceRCCM = async (entrepriseId: string, file: File) => {
    try {
      setReplacingRCCM(entrepriseId);
      console.log(`🔄 [RCCM2Step] Remplacement du RCCM pour l'entreprise ${entrepriseId}`);
      
      // Étape 1: Récupérer les documents existants pour trouver l'ancien RCCM à remplacer
      const documentsExistants = await getEntrepriseDocuments(entrepriseId);
      console.log(`🔍 [RCCM2Step] Tous les documents existants:`, documentsExistants);
      
      // Chercher uniquement RCCM ou REGISTRE_COMMERCE pour le remplacement
      console.log(`🔍 [RCCM2Step] Recherche document RCCM ou REGISTRE_COMMERCE...`);
      let ancienRCCM = documentsExistants.find(doc => 
        doc.type === 'RCCM' || doc.type === 'REGISTRE_COMMERCE'
      );
      
      if (ancienRCCM) {
        console.log(`✅ [RCCM2Step] Document RCCM/REGISTRE_COMMERCE trouvé:`, ancienRCCM);
      } else {
        console.log(`📋 [RCCM2Step] Aucun document RCCM/REGISTRE_COMMERCE trouvé, création d'un nouveau document`);
        console.log(`📋 [RCCM2Step] Documents disponibles:`, documentsExistants.map(d => ({id: d.id, nom: d.nom, type: d.type})));
      }
      
      console.log(`🎯 [RCCM2Step] Document RCCM trouvé pour remplacement:`, ancienRCCM);
      
      // Vérifier la taille du fichier (limite augmentée à 200MB)
      const maxSize = 209715200; // 200MB en bytes
      if (file.size > maxSize) {
        const sizeMB = (file.size / 1048576).toFixed(2);
        const maxSizeMB = (maxSize / 1048576).toFixed(2);
        throw new Error(`Le fichier est trop volumineux (${sizeMB}MB). La taille maximale autorisée est ${maxSizeMB}MB. Veuillez compresser le fichier ou utiliser un fichier plus petit.`);
      }
      
      if (ancienRCCM) {
        console.log(`🔄 [RCCM2Step] Modification du fichier RCCM existant:`, ancienRCCM);
        
        // Modifier uniquement le fichier du document existant (garde le même ID, numéro, etc.)
        const formData = new FormData();
        formData.append('file', file);
        
        console.log(`📤 [RCCM2Step] Mise à jour du fichier RCCM (ID: ${ancienRCCM.id})`);
        console.log(`📋 [RCCM2Step] Détails:`, {
          documentId: ancienRCCM.id,
          documentNom: ancienRCCM.nom,
          documentType: ancienRCCM.type,
          fileSize: file.size,
          fileName: file.name
        });
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/documents/${ancienRCCM.id}/file`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [RCCM2Step] Erreur PUT response:`, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ [RCCM2Step] Fichier RCCM modifié avec succès (même ID/numéro conservés):`, result);
        
        // Recharger les demandes
        loadDemandesRCCM2();
        
      } else {
        console.log(`📤 [RCCM2Step] Aucun RCCM existant, upload initial du document`);
        
        // Récupérer l'entreprise pour obtenir les membres
        const entrepriseResponse = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!entrepriseResponse.ok) {
          throw new Error('Impossible de récupérer les informations de l\'entreprise');
        }
        
        const entrepriseData = await entrepriseResponse.json();
        console.log(`🔍 [RCCM2Step] Données entreprise:`, entrepriseData);
        console.log(`🔍 [RCCM2Step] Membres:`, entrepriseData.membres);
        console.log(`🔍 [RCCM2Step] CreatedBy:`, entrepriseData.createdBy);
        
        // Chercher un membre fondateur ou gérant
        let personneId = null;
        
        if (entrepriseData.membres && entrepriseData.membres.length > 0) {
          console.log(`🔍 [RCCM2Step] Structure premier membre:`, entrepriseData.membres[0]);
          
          // Chercher d'abord un fondateur, gérant ou promoteur
          const fondateur = entrepriseData.membres.find((m: any) => 
            m.role === 'FONDATEUR' || m.role === 'GERANT' || m.role === 'PROMOTEUR' || m.role === 'PRESIDENT'
          );
          
          if (fondateur) {
            // Essayer différentes structures possibles - PRIORITÉ au personId
            personneId = fondateur.personId || fondateur.personne?.id || fondateur.id;
            if (personneId) {
              console.log(`✅ [RCCM2Step] Fondateur trouvé avec personId: ${personneId}`);
            }
          }
          
          // Si pas trouvé, prendre le premier membre
          if (!personneId && entrepriseData.membres[0]) {
            const premierMembre = entrepriseData.membres[0];
            personneId = premierMembre.personId || premierMembre.personne?.id || premierMembre.id;
            if (personneId) {
              console.log(`✅ [RCCM2Step] Premier membre utilisé avec personId: ${personneId}`);
            }
          }
        }
        
        // Si toujours pas de personneId, essayer createdBy avec différentes structures
        if (!personneId && entrepriseData.createdBy) {
          personneId = entrepriseData.createdBy.personne?.id || 
                      entrepriseData.createdBy.id || 
                      entrepriseData.createdBy;
          if (personneId) {
            console.log(`✅ [RCCM2Step] CreatedBy utilisé: ${personneId}`);
          }
        }
        
        if (!personneId) {
          console.error(`❌ [RCCM2Step] Structure complète entreprise:`, JSON.stringify(entrepriseData, null, 2));
          throw new Error('Impossible de déterminer le propriétaire du document. Aucun membre ou fondateur trouvé.');
        }
        
        // Upload initial du document RCCM
        const formData = new FormData();
        formData.append('file', file);
        formData.append('typeDocument', 'REGISTRE_COMMERCE');
        formData.append('entrepriseId', entrepriseId);
        formData.append('personneId', personneId);
        
        console.log(`📤 [RCCM2Step] Upload initial REGISTRE_COMMERCE pour entreprise ${entrepriseId}, personne ${personneId}`);
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/documents/document`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [RCCM2Step] Erreur POST response:`, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ [RCCM2Step] Document RCCM uploadé avec succès:`, result);
        
        // Recharger les demandes
        loadDemandesRCCM2();
        alert('Document RCCM uploadé avec succès !');
      }
      
    } catch (error) {
      console.error('❌ [RCCM2Step] Erreur lors du remplacement du RCCM:', error);
      alert('Erreur lors du remplacement du document RCCM. Veuillez réessayer.');
    } finally {
      setReplacingRCCM(null);
    }
  };

  const handleFinaliserRCCM2 = async (demandeId: string, decision: 'approuve' | 'rejete', commentaire?: string) => {
    try {
      console.log(`🔄 [RCCM2Step] Finalisation RCCM2 pour ${demandeId}: ${decision}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demandeId}/finaliser-rccm2`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: decision,
          commentaire: commentaire
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [RCCM2Step] Erreur ${response.status}:`, errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ [RCCM2Step] Finalisation réussie:`, result);
      console.log(`🎯 [RCCM2Step] Transition: RCCM2 → ${result.prochaineEtape}`);
      
      // Recharger les demandes pour voir les changements
      loadDemandesRCCM2();
      setSelectedDemande(null);
      
      if (decision === 'approuve') {
        alert(`✅ Dossier approuvé avec succès !\n\n🎯 Transition: RCCM2 → ${result.prochaineEtape}\n\nL'entreprise a été transférée à l'étape ${result.prochaineEtape}.`);
      } else {
        alert(`❌ Dossier rejeté.\n\n🔄 Transition: RCCM2 → ${result.prochaineEtape}\n\nL'entreprise retourne à l'étape ${result.prochaineEtape} pour correction.\n\nRaison: ${commentaire}`);
      }
      
    } catch (error) {
      console.error('❌ [RCCM2Step] Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation. Veuillez réessayer.');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'rccm_a_remplacer': return 'bg-gradient-to-r from-primary-100 to-amber-200 text-primary-800';
      case 'rccm_remplace': return 'bg-sky-50 text-black-800';
      case 'termine': return 'bg-sky-50 text-black-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800';
    }
  };

  const canEdit = canEditStep('RCCM2');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="p-4 bg-sky-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement des demandes RCCM Phase 2...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-sky-600 rounded-2xl shadow-lg mr-4">
            <DocumentCheckIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Étape RCCM Phase 2</h2>
            <p className="text-slate-600 font-medium">Remplacement et validation finale des documents RCCM</p>
          </div>
        </div>

        {demandes.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-sky-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
              <ExclamationTriangleIcon className="h-12 w-12 text-white mx-auto" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-3">Aucune demande à traiter</h3>
            <p className="text-lg text-slate-600 font-medium max-w-md mx-auto">
              Il n'y a actuellement aucune entreprise à l'étape RCCM Phase 2.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div key={demande.id} className="bg-gradient-to-r from-white/95 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                        <BuildingOfficeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-800">{demande.nom}</h3>
                        <span className={`px-3 py-1 text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 ${getStatutColor(demande.statutRCCM2)}`}>
                          {demande.statutRCCM2 === 'rccm_a_remplacer' ? <><ArrowPathIcon className="h-4 w-4" /> RCCM à remplacer</> : 
                           demande.statutRCCM2 === 'rccm_remplace' ? <><CheckCircleIcon className="h-4 w-4" /> RCCM remplacé</> : demande.statutRCCM2}
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
                    {canEdit && (
                      <label className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 cursor-pointer flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg">
                        {replacingRCCM === demande.id ? (
                          <ClockIcon className="h-5 w-5 animate-spin" />
                        ) : demande.rccmExistant ? (
                          <ArrowPathIcon className="h-5 w-5" />
                        ) : (
                          <CloudArrowUpIcon className="h-5 w-5" />
                        )}
                        <span>
                          {replacingRCCM === demande.id 
                            ? 'Traitement...' 
                            : demande.rccmExistant 
                              ? 'Remplacer RCCM' 
                              : 'Joindre le RCCM'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png,image/jpg"
                          disabled={replacingRCCM === demande.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleReplaceRCCM(demande.id, file);
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
                      className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-sky-700 hover:to-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg"
                    >
                      <EyeIcon className="h-5 w-5" />
                      <span>Détails</span>
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
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-8 w-11/12 max-w-8xl">
            <div className="bg-gradient-to-br from-white/95 via-slate-50/90 to-primary-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
              {/* Header modernisé */}
              <div className="bg-gradient-to-r from-[#1e5987]/90 to-[#2d6aa0]/90 backdrop-blur-xl p-8 border-b border-white/20">
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
                {/* Statut RCCM Phase 2 modernisé */}
                <div className="mt-6 p-6 bg-gradient-to-r from-primary-50/80 to-amber-50/60 backdrop-blur-xl rounded-2xl border-2 border-primary-200 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-amber-600 rounded-xl shadow-lg">
                      <ArrowPathIcon className="h-5 w-5 text-white" />
                    </div>
                    <h5 className="text-lg font-black text-slate-800">Statut RCCM</h5>
                  </div>
                  <div className="text-center py-4">
                    {selectedDemande.rccmNumber ? (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                        <span className="text-xl font-bold text-green-600">Numéro RCCM généré: {selectedDemande.rccmNumber}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <XCircleIcon className="h-8 w-8 text-red-600" />
                        <span className="text-xl font-bold text-red-600">Aucun numéro RCCM trouvé</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Certificat RCCM */}
                  {selectedDemande.rccmNumber && (
                    <div className="mt-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                          <DocumentTextIcon className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-xl font-black text-slate-800">
                          Certificat RCCM {(selectedDemande.typeEntreprise === 'PERSONNE_PHYSIQUE' || 
                            selectedDemande.typeEntreprise === 'E_I' || 
                            selectedDemande.typeEntreprise === 'EI' ||
                            selectedDemande.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') ? '(Personne Physique)' : '(Personne Morale)'}
                        </h4>
                      </div>
                      
                      {/* Afficher le bon certificat selon le type d'entreprise */}
                      {(selectedDemande.typeEntreprise === 'PERSONNE_PHYSIQUE' || 
                        selectedDemande.typeEntreprise === 'E_I' || 
                        selectedDemande.typeEntreprise === 'EI' ||
                        selectedDemande.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') ? (
                        <RccmCertificateP1
                          rccmNumber={selectedDemande.rccmNumber}
                          nom={selectedDemande.membres?.[0]?.nom || selectedDemande.demandeur.nom}
                          prenom={selectedDemande.membres?.[0]?.prenom || selectedDemande.demandeur.prenom}
                          dateNaissance={selectedDemande.demandeur.dateNaissance || ''}
                          lieuNaissance={selectedDemande.demandeur.lieuNaissance || selectedDemande.city || 'Bamako'}
                          nationalite="Malienne"
                          adressePostale={selectedDemande.adresse || ''}
                          ville={selectedDemande.regionNom || selectedDemande.city || 'Bamako'}
                          quartier={selectedDemande.divisionNom || selectedDemande.quartierNom || selectedDemande.communeNom || ''}
                          situationMatrimoniale={(() => {
                            const situationFromMembre = selectedDemande.situationMatrimonialeStr;
                            const situationFromDemandeur = selectedDemande.demandeur.situationMatrimoniale;
                            const finalSituation = situationFromMembre || situationFromDemandeur || "Célibataire";
                            
                            console.log('🔍 [SITUATION DEBUG] situationMatrimonialeStr:', situationFromMembre);
                            console.log('🔍 [SITUATION DEBUG] demandeur.situationMatrimoniale:', situationFromDemandeur);
                            console.log('🔍 [SITUATION DEBUG] Final situation matrimoniale:', finalSituation);
                            
                            return finalSituation;
                          })()}
                          activites={selectedDemande.domaineActiviteLabel || selectedDemande.secteurActivite}
                          sigleEnseigne={selectedDemande.sigle || ''}
                          nomCommercial={selectedDemande.nom}
                          adresseEtablissement={selectedDemande.adresse || ''}
                          registrationDate={selectedDemande.dateCreation}
                          dateDebut={selectedDemande.dateCreation}
                          civilite={selectedDemande.membres?.[0]?.civilite || ''}
                          localite={selectedDemande.localite || ''}
                         
                        />
                      ) : (
                        <RccmCertificate
                          rccmNumber={selectedDemande.rccmNumber}
                          companyName={selectedDemande.nom}
                          legalForm={selectedDemande.formeJuridique}
                          capital={selectedDemande.capital}
                          managerName={`${selectedDemande.demandeur.prenom} ${selectedDemande.demandeur.nom}`}
                          managerFirstName={selectedDemande.demandeur.prenom}
                          managerLastName={selectedDemande.demandeur.nom}
                          managerBirthDate={selectedDemande.demandeur.dateNaissance}
                          managerBirthPlace={selectedDemande.demandeur.lieuNaissance}
                          registrationDate={selectedDemande.dateCreation}
                          city={selectedDemande.city || 'Bamako'}
                          mainActivity={selectedDemande.secteurActivite}
                          address={selectedDemande.adresse}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Actions modernisées */}
                {canEdit && (
                  <div className="bg-gradient-to-r from-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl p-6 border-t border-white/40 mt-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                        <BoltIcon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800">Actions finales</h4>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => {
                          if (!selectedDemande.rccmNumber) {
                            alert('⚠️ Le numéro RCCM doit être généré avant d\'approuver cette entreprise.');
                            return;
                          }
                          const commentaire = prompt('💬 Commentaire final (optionnel):');
                          handleFinaliserRCCM2(selectedDemande.id, 'approuve', commentaire || undefined);
                        }}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-[#2d6aa0] text-white px-8 py-4 rounded-2xl hover:from-primary-600 hover:to-primary-700 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedDemande.rccmNumber}
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                        <span>✅ Approuver et Transférer au NINA</span>
                      </button>
                      
                      {/* Bouton de retour d'étape avec menu déroulant */}
                      <div className="relative flex-1">
                        <button
                          onClick={() => setShowStepDropdown(!showStepDropdown)}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg disabled:opacity-50"
                        >
                          <XMarkIcon className="h-6 w-6" />
                          <span>Rejeter et Retourner</span>
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
                    
                    {!selectedDemande.rccmNumber && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl border border-primary-200 shadow-lg">
                        <p className="text-primary-800 text-sm font-medium flex items-center space-x-2">
                          <span>⚠️</span>
                          <span><strong>Attention :</strong> Le numéro RCCM doit être généré à l'étape TCOM avant de pouvoir approuver le dossier.</span>
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

      {/* Visualiseur de documents */}
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
                <strong>⚠️ Conséquence :</strong> L'entreprise retournera à l'étape RCCM1 pour corriger les documents.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rejet (obligatoire) :
              </label>
              <textarea
                id="rejectReason"
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
                  const textarea = document.getElementById('rejectReason') as HTMLTextAreaElement;
                  const commentaire = textarea?.value?.trim();
                  if (commentaire) {
                    handleFinaliserRCCM2(selectedDemande!.id, 'rejete', commentaire);
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

      {/* Modal de génération de certificat RCCM */}
      {showRccmCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-800">Certificat RCCM</h3>
                <button
                  onClick={() => setShowRccmCertificate(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XCircleIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {(() => {
                const demande = demandes.find(d => d.id === showRccmCertificate);
                if (!demande) return null;

                // Charger les données RCCM manuelles si disponibles
                const manualRccmData = JSON.parse(localStorage.getItem('manual_rccm_data') || '{}');
                const rccmData = manualRccmData[demande.id] || demande.manualRccmData || {};

                return (
                  <RccmCertificate
                    rccmNumber={demande.rccmNumber || rccmData.numeroRccm || ''}
                    companyName={demande.nom}
                    legalForm={demande.formeJuridique}
                    capital={rccmData.capital || demande.capital || '1000000'}
                    managerName={demande.membres?.[0] ? `${demande.membres[0].prenom} ${demande.membres[0].nom}` : `${demande.demandeur.prenom} ${demande.demandeur.nom}`}
                    managerFirstName={demande.membres?.[0]?.prenom || demande.demandeur.prenom || rccmData.gerantPrenom}
                    managerLastName={demande.membres?.[0]?.nom || demande.demandeur.nom || rccmData.gerantNom}
                    managerBirthDate={demande.demandeur.dateNaissance || rccmData.gerantDateNaissance || ''}
                    managerBirthPlace={demande.demandeur.lieuNaissance || rccmData.gerantLieuNaissance || rccmData.localite || demande.city || 'Bamako'}
                    registrationDate={new Date().toISOString()}
                    city={rccmData.localite || demande.city || 'Bamako'}
                    mainActivity={demande.secteurActivite || rccmData.secteurActivite}
                    address={demande.adresse || rccmData.localite || demande.city || 'Bamako'}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RCCM2Step;
























