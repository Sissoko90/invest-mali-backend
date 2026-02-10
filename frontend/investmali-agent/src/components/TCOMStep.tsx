import React, { useState, useEffect } from 'react';
import { 
  DocumentCheckIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  XMarkIcon,
  CpuChipIcon,
  PencilSquareIcon,
  CloudArrowDownIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import DocumentViewer from './DocumentViewer';
import EntrepriseDetails from './EntrepriseDetails';
import { API_CONFIG } from '../config/api.config';

interface DocumentTCOM {
  id: string;
  nom: string;
  type: string;
  statut: 'en_attente' | 'approuve' | 'rejete';
  commentaire?: string;
  dateUpload?: string;
}

interface MembreTCOM {
  personId: string;
  nom: string;
  prenom: string;
  role: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  localite?: string;
  civilite?: string;
  situationMatrimonialeStr?: string;
  sexe?: string;
  nationalite?: string;
}

interface DemandeTCOM {
  id: string;
  nom: string;
  typeEntreprise: string;
  formeJuridique: string;
  secteurActivite: string;
  activiteSecondaire?: string;
  capitale?: string;
  localite?: string;
  divisionCode?: string;
  dateCreation: string;
  etapeValidation: string;
  etapeActuelle: string;
  statut: string;
  motifRejet?: string;
  membres: MembreTCOM[];
  demandeur: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    nationalite?: string;
    situationMatrimoniale?: string;
    civilite?: string;
    sexe?: string;
    localite?: string;
  };
  documents: DocumentTCOM[];
  rccmGenerated?: boolean;
  rccmNumber?: string;
}

interface TCOMStepProps {
  canEditStep: (step: string) => boolean;
  onDossierUpdate?: (updatedDossier: any) => void;
}

const TCOMStep: React.FC<TCOMStepProps> = ({ onDossierUpdate }) => {
  const { canEditStep } = useAgentAuth();
  const [demandes, setDemandes] = useState<DemandeTCOM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<DemandeTCOM | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
  const [showStepDropdown, setShowStepDropdown] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [generatingRCCM, setGeneratingRCCM] = useState<string | null>(null);
  const [manualRccmNumber, setManualRccmNumber] = useState<string>('');
  const [savingManualRccm, setSavingManualRccm] = useState<string | null>(null);

  // États pour le modal d'erreur professionnel
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // États pour le modal de succès
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalMessage, setSuccessModalMessage] = useState('');

  // Fonction utilitaire pour obtenir le nom d'affichage
  const getDisplayName = (demande: DemandeTCOM): string => {
    // Vérifier si le nom existe et n'est pas un fallback avec ID
    if (demande.nom && demande.nom !== 'Entreprise sans nom' && !demande.nom.startsWith('Entreprise ')) {
      return demande.nom;
    }
    // Si pas de nom d'entreprise valide, utiliser nom/prénom du demandeur
    if (demande.demandeur?.prenom || demande.demandeur?.nom) {
      return `${demande.demandeur.prenom || ''} ${demande.demandeur.nom || ''}`.trim();
    }
    return 'Entreprise sans nom';
  };

  // Fonction pour afficher une erreur dans le modal
  const showError = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setShowErrorModal(true);
  };

  // Fonction pour afficher un succès dans le modal
  const showSuccess = (title: string, message: string) => {
    setSuccessModalTitle(title);
    setSuccessModalMessage(message);
    setShowSuccessModal(true);
  };

  // Motifs de rejet prédéfinis pour le retour à ACCUEIL
  const rejectReasons = [
    'Document est illisible',
    'Le document téléchargé ne correspond pas au document demandé',
    'Le document est altéré ou falsifié',
    'Le document ne correspond pas aux données du formulaire',
    'Le document n\'est plus valide',
    'Autres'
  ];

  const availableSteps = [
    { id: 'ACCUEIL', label: 'ACCUEIL', description: 'Retour à l\'étape d\'accueil' }
  ];

  useEffect(() => {
    // Nettoyer complètement toutes les données RCCM simulées/test au démarrage
    
    // Supprimer complètement toutes les données RCCM manuelles de test
    localStorage.removeItem('manual_rccm_data');
    
    // Supprimer aussi les sessions RCCM
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rccm_session_')) {
        localStorage.removeItem(key);
      }
    });
    
    
    loadDemandesTCOM();
  }, []);

  const loadDemandesTCOM = async () => {
    try {
      setIsLoading(true);
      
      const response = await entreprisesAPI.getByEtape('TCOM');
      const entreprises = response.data?.data || response.data || [];
      
      console.log('🔍 [TCOMStep] Réponse API /etape/TCOM:', response);
      console.log('🔍 [TCOMStep] Nombre d\'entreprises TCOM:', entreprises.length);
      console.log('🔍 [TCOMStep] Entreprises TCOM:', entreprises);
      
      // Charger les données RCCM manuelles depuis localStorage
      const manualRccmData = JSON.parse(localStorage.getItem('manual_rccm_data') || '{}');
      
      const demandesAvecDocuments = await Promise.all(
        entreprises.map(async (entreprise: any) => {
          const documents = await getEntrepriseDocuments(entreprise.id);
          
          // Récupérer le gérant ou promoteur depuis les membres (les données sont directement dans le membre, pas dans .personne)
          const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR') 
                      || entreprise.membres?.[0]
                      || {};
          
          
          // Vérifier s'il y a des données RCCM manuelles pour cette entreprise
          const manualRccm = manualRccmData[entreprise.id];
          let rccmNumber = entreprise.numeroRccm || entreprise.rccmNumber;
          let rccmGenerated = !!(entreprise.numeroRccm || entreprise.rccmNumber);
          
          if (manualRccm && manualRccm.numeroRccm) {
            rccmNumber = manualRccm.numeroRccm;
            rccmGenerated = true;
          }
          
          
          // Déterminer le nom d'affichage: nom entreprise ou nom/prénom du gérant
          const nomAffichage = entreprise.nom || entreprise.nomEntreprise || 
            (gerant.prenom || gerant.nom ? `${gerant.prenom || ''} ${gerant.nom || ''}`.trim() : 'Entreprise sans nom');
          
          return {
            id: entreprise.id,
            nom: nomAffichage,
            typeEntreprise: entreprise.typeEntreprise || 'INDIVIDUELLE',
            formeJuridique: entreprise.formeJuridique || 'EI',
            secteurActivite: entreprise.secteurActivite || entreprise.domaineActivite || 'Commerce',
            activiteSecondaire: entreprise.activiteSecondaire || '',
            capitale: entreprise.capitale || entreprise.capital || '1000000',
            localite: entreprise.localite || gerant.localite || 'Bamako',
            divisionCode: entreprise.divisionCode || entreprise.division_code,
            dateCreation: entreprise.dateCreation || new Date().toISOString(),
            etapeValidation: entreprise.etapeValidation || 'TCOM',
            etapeActuelle: 'TCOM',
            statut: entreprise.statut || 'en_cours',
            // Garder les membres complets pour le mapping RCCM
            membres: entreprise.membres || [],
            // Données du demandeur/gérant avec toutes les infos nécessaires pour RCCM
            demandeur: {
              nom: gerant.nom || entreprise.demandeur?.nom || '',
              prenom: gerant.prenom || entreprise.demandeur?.prenom || '',
              email: gerant.email || entreprise.demandeur?.email || '',
              telephone: gerant.telephone1 || gerant.telephone || entreprise.demandeur?.telephone || '',
              dateNaissance: gerant.dateNaissance || '',
              lieuNaissance: gerant.lieuNaissance || '',
              nationalite: gerant.nationalite || 'MLI',
              situationMatrimoniale: gerant.situationMatrimoniale || 'CELIBATAIRE',
              civilite: gerant.civilite || '',
              sexe: gerant.sexe || '',
              localite: gerant.localite || ''
            },
            documents: documents,
            rccmGenerated: rccmGenerated,
            rccmNumber: rccmNumber,
            // Ajouter les données RCCM manuelles si disponibles
            manualRccmData: manualRccm || null
          };
        })
      );
      
      setDemandes(demandesAvecDocuments);
      
      // Log détaillé des numéros RCCM
      demandesAvecDocuments.forEach((d: any) => {
      });
      
    } catch (error) {
      console.error('❌ [TCOMStep] Erreur lors du chargement:', error);
      setDemandes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEntrepriseDocuments = async (entrepriseId: string): Promise<DocumentTCOM[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ [TCOMStep] Erreur récupération documents pour ${entrepriseId}: ${response.status}`);
        return [];
      }

      const documents = await response.json();
      return documents.map((doc: any) => ({
        id: doc.id,
        nom: doc.nom || doc.nomDocument || `Document ${doc.typeDocument || 'Inconnu'}`,
        type: doc.typeDocument || doc.type || 'INCONNU',
        statut: 'en_attente',
        dateUpload: doc.dateCreation || new Date().toISOString()
      }));
    } catch (error) {
      console.error(`❌ [TCOMStep] Erreur lors de la récupération des documents:`, error);
      return [];
    }
  };

  // Fonction pour mapper les données d'entreprise vers CreateCompanyRequest
  const mapEntrepriseToRccmRequest = (demande: any) => {
    
    // Récupérer les données du gérant ou promoteur depuis les membres
    const membres = demande.membres || [];
    
    const gerantMembre = membres.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR') || membres[0] || {};
    
    const demandeur = demande.demandeur || {};
    
    // Utiliser les données du membre gérant en priorité
    const prenom = gerantMembre.prenom || demandeur.prenom || '';
    const nom = gerantMembre.nom || demandeur.nom || '';
    const email = gerantMembre.email || demandeur.email || '';
    const telephone = gerantMembre.telephone || demandeur.telephone || '';
    const nationalite = gerantMembre.nationalite || demandeur.nationalite || 'MLI';
    const lieuNaissance = gerantMembre.lieuNaissance || demandeur.lieuNaissance || 'Bamako';
    const localite = gerantMembre.localite || demandeur.localite || demande.localite || 'Bamako';
    const civilite = gerantMembre.civilite || (gerantMembre.sexe === 'FEMININ' ? 'Mme' : 'M.');
    const situationMatrimoniale = gerantMembre.situationMatrimonialeStr || demandeur.situationMatrimoniale || 'CELIBATAIRE';
    
    // Formater la date de naissance au format RCCM (yyyy-MM-dd HH:mm:ss.S z)
    let birthDate = gerantMembre.dateNaissance || demandeur.dateNaissance || '';
    if (birthDate && !birthDate.includes('GMT')) {
      // Convertir ISO date ou LocalDate en format RCCM
      const date = new Date(birthDate);
      if (!isNaN(date.getTime())) {
        birthDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 00:00:00.0 GMT`;
      }
    }
    
    
    return {
      companyName: demande.nom,
      tradeName: demande.nom,
      legalForm: demande.formeJuridique || "EI",
      capital: demande.capitale || "1000000",
      city: localite,
      district: localite, 
      streetName: "",
      streetNumber: "0",
      
      // Informations détaillées du gérant pour RCCM
      managerFirstName: prenom,
      managerLastName: nom,
      managerName: `${prenom} ${nom}`,
      managerNationality: nationalite,
      managerIdType: "NINA",
      managerIdNumber: "",
      managerBirthDate: birthDate,
      managerBirthPlace: lieuNaissance,
      managerPhone: telephone,
      managerEmail: email,
      managerCivility: civilite,
      managerMaritalStatus: mapMaritalStatus(situationMatrimoniale),
      
      // Activité
      mainActivity: demande.activiteSecondaire || demande.secteurActivite || "Commerce",
      activityCode: "A010201"
    };
  };
  
  // Mapper la situation matrimoniale vers le code RCCM
  const mapMaritalStatus = (status: string | undefined): string => {
    if (!status) return 'C';
    switch (status.toUpperCase()) {
      case 'MARIE': return 'M';
      case 'CELIBATAIRE': return 'C';
      case 'DIVORCE': return 'D';
      case 'VEUF': return 'V';
      default: return 'C';
    }
  };

  // Fonction pour sauvegarder le numéro RCCM saisi manuellement pour les sociétés
  const handleSaveManualRccm = async (demandeId: string) => {
    if (!manualRccmNumber.trim()) {
      alert('⚠️ Veuillez saisir un numéro RCCM valide.');
      return;
    }

    try {
      setSavingManualRccm(demandeId);

      // Récupérer les données de la société pour la fiche RCCM
      const demande = demandes.find(d => d.id === demandeId);
      if (!demande) {
        throw new Error('Société non trouvée');
      }

      // Préparer les données RCCM spécifiques pour société (sans dépendance aux personnes physiques)
      const rccmData = {
        entrepriseId: demandeId,
        numeroRccm: manualRccmNumber.trim(),
        typeEntreprise: 'SOCIETE',
        nomSociete: demande.nom,
        formeJuridique: demande.formeJuridique,
        capital: demande.capitale,
        secteurActivite: demande.secteurActivite,
        localite: demande.localite,
        dateEnregistrement: new Date().toISOString(),
        statutRccm: 'MANUEL',
        // Données du gérant pour la fiche RCCM
        gerantNom: demande.demandeur.nom,
        gerantPrenom: demande.demandeur.prenom,
        gerantDateNaissance: demande.demandeur.dateNaissance,
        gerantLieuNaissance: demande.demandeur.lieuNaissance,
        gerantLocalite: demande.demandeur.localite
      };


      // Utiliser l'endpoint standard de mise à jour d'entreprise pour sauvegarder dans numero_rccm
      let response;
      let result;
      
      try {
        // Utiliser le nouvel endpoint dédié RCCM pour sociétés
        
        response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demandeId}/rccm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ numeroRccm: manualRccmNumber.trim() })
        });

        if (response.ok) {
          result = await response.json();
          
          // Vérifier que la réponse contient le numéro RCCM
          if (result.success && result.numeroRccm) {
            // Sauvegarde réussie dans la base de données
            
            // Retirer l'entreprise de la liste TCOM car elle a été transférée à RCCM2
            const updatedDemandes = demandes.filter(d => d.id !== demandeId);
            setDemandes(updatedDemandes);
            
            // Sauvegarder aussi en localStorage pour persistance entre sessions
            const localRccmData = { ...rccmData, timestamp: Date.now() };
            const existingRccmData = JSON.parse(localStorage.getItem('manual_rccm_data') || '{}');
            existingRccmData[demandeId] = localRccmData;
            localStorage.setItem('manual_rccm_data', JSON.stringify(existingRccmData));
            
            const displayName = demande ? getDisplayName(demande) : 'l\'entreprise';
            showSuccess(
              'RCCM sauvegardé et transféré', 
              `Le numéro RCCM pour "${displayName}" a été sauvegardé avec succès.\n\nNuméro: ${manualRccmNumber.trim()}\n\n✅ L'entreprise a été automatiquement transférée à l'étape RCCM2.`
            );
            setManualRccmNumber('');
            setShowDetails(false);
            setSelectedDemande(null);
            
            // Rafraîchir la liste des demandes TCOM
            await loadDemandesTCOM();
            
            return; // Sortir de la fonction, sauvegarde réussie
          }
        } else if (response.status === 409) {
          // Conflit - Numéro RCCM déjà utilisé
          const errorData = await response.json();
          console.error('❌ [TCOMStep] Doublon RCCM détecté:', errorData);
          
          const displayName = demande ? getDisplayName(demande) : 'l\'entreprise';
          const existingEntrepriseName = errorData.existingEntreprise?.nom || 'une autre entreprise';
          
          showError(
            'Numéro RCCM déjà utilisé', 
            `Le numéro RCCM "${manualRccmNumber.trim()}" est déjà utilisé par "${existingEntrepriseName}".\n\n⚠️ Veuillez vérifier le numéro RCCM et réessayer avec un numéro différent.`
          );
          setSavingManualRccm(null);
          return; // Sortir sans sauvegarder
        } else {
          const errorText = await response.text();
          console.error('❌ [TCOMStep] Erreur endpoint RCCM:', errorText);
          throw new Error('SAVE_ERROR');
        }
      } catch (error) {
        
        // Sauvegarde dans le localStorage comme fallback pour persistance
        const localRccmData = {
          ...rccmData,
          timestamp: Date.now()
        };
        
        // Récupérer les données RCCM existantes
        const existingRccmData = JSON.parse(localStorage.getItem('manual_rccm_data') || '{}');
        existingRccmData[demandeId] = localRccmData;
        localStorage.setItem('manual_rccm_data', JSON.stringify(existingRccmData));
        
        console.warn('⚠️ [TCOMStep] RCCM sauvegardé en localStorage pour persistance');
        
        // Mettre à jour l'état local pour l'affichage
        const updatedDemandes = demandes.map(d => 
          d.id === demandeId 
            ? { ...d, rccmNumber: manualRccmNumber.trim(), rccmGenerated: true }
            : d
        );
        setDemandes(updatedDemandes);
        
        result = { 
          success: true, 
          numeroRccm: manualRccmNumber.trim(),
          message: 'Sauvegarde locale avec persistance'
        };
      }

      // Si on arrive ici sans return, c'est que la sauvegarde localStorage a été utilisée
      const displayNameLocal = demande ? getDisplayName(demande) : 'l\'entreprise';
      showSuccess('RCCM sauvegardé', `Le numéro RCCM pour "${displayNameLocal}" a été sauvegardé.\n\nNuméro: ${manualRccmNumber}`);
      setManualRccmNumber('');

    } catch (error) {
      console.error('❌ [TCOMStep] Erreur sauvegarde RCCM manuel:', error);
      const demandeErr = demandes.find(d => d.id === demandeId);
      const displayNameErr = demandeErr ? getDisplayName(demandeErr) : 'l\'entreprise';
      showError('Erreur de sauvegarde', `Impossible de sauvegarder le numéro RCCM pour "${displayNameErr}".\n\nVeuillez réessayer.`);
    } finally {
      setSavingManualRccm(null);
    }
  };

  // Fonction pour générer le RCCM automatiquement
  const handleGenerateRCCM = async (demandeId: string) => {
    const demande = demandes.find(d => d.id === demandeId);
    if (!demande) {
      showError('Erreur', 'Demande non trouvée. Veuillez actualiser la page.');
      return;
    }

    const displayName = getDisplayName(demande);

    // Vérifier que c'est une entreprise individuelle
    if (demande.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && demande.typeEntreprise !== 'INDIVIDUELLE') {
      showError('Type d\'entreprise non supporté', 'La génération automatique RCCM n\'est disponible que pour les entreprises individuelles.');
      return;
    }

    try {
      setGeneratingRCCM(demandeId);

      // Utiliser l'endpoint qui charge les données directement depuis la BDD
      // Cela garantit que les vraies informations (nom, prénom, date de naissance, etc.) sont utilisées
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/rccm/generate-from-db/${demandeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [TCOMStep] Erreur HTTP:', response.status, errorText);
        // Message utilisateur-friendly sans détails techniques
        throw new Error('SERVICE_UNAVAILABLE');
      }

      const result = await response.json();

      if (result.success) {
        // Retirer l'entreprise de la liste TCOM car elle a été transférée à RCCM2
        const updatedDemandes = demandes.filter(d => d.id !== demandeId);
        setDemandes(updatedDemandes);
        
        showSuccess(
          'RCCM généré et transféré',
          `Le numéro RCCM pour "${displayName}" a été généré avec succès.\n\nNuméro RCCM: ${result.refDos}\n\n✅ L'entreprise a été automatiquement transférée à l'étape RCCM2.`
        );
        
        setShowDetails(false);
        setSelectedDemande(null);
        
        // Rafraîchir la liste des demandes TCOM
        await loadDemandesTCOM();
      } else {
        // Analyser le message d'erreur pour donner un message utilisateur-friendly
        throw new Error(result.message || 'UNKNOWN_ERROR');
      }

    } catch (error) {
      console.error('❌ [TCOMStep] Erreur génération RCCM:', error);
      const errorMsg = error instanceof Error ? error.message : '';
      
      // Messages utilisateur-friendly selon le type d'erreur
      let userMessage = '';
      if (errorMsg.includes('ConnectException') || errorMsg.includes('SERVICE_UNAVAILABLE')) {
        userMessage = `Le service de génération RCCM est temporairement indisponible pour "${displayName}".\n\nVeuillez réessayer dans quelques instants ou contacter le support technique si le problème persiste.`;
      } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
        userMessage = `La génération du RCCM pour "${displayName}" a pris trop de temps.\n\nVeuillez réessayer.`;
      } else if (errorMsg.includes('UNKNOWN_ERROR')) {
        userMessage = `Une erreur inattendue s'est produite lors de la génération du RCCM pour "${displayName}".\n\nVeuillez réessayer ou contacter le support.`;
      } else {
        userMessage = `Impossible de générer le RCCM pour "${displayName}" pour le moment.\n\nVeuillez réessayer ultérieurement.`;
      }
      
      showError('Échec de la génération RCCM', userMessage);
    } finally {
      setGeneratingRCCM(null);
    }
  };

  const handleFinaliserTCOM = async (demandeId: string, decision: 'approuve' | 'rejete', commentaire?: string) => {
    try {
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demandeId}/finaliser-tcom`, {
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
      
      loadDemandesTCOM();
      setSelectedDemande(null);
      setShowDetails(false);
      
      if (decision === 'approuve') {
        alert(`✅ Dossier approuvé avec succès !\n\nTransition: TCOM → RCCM`);
      } else {
        alert(`❌ Dossier rejeté.\n\nRetour à l'étape précédente.\n\nRaison: ${commentaire}`);
      }
      
    } catch (error) {
      console.error('❌ [TCOMStep] Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation de l\'étape TCOM. Veuillez réessayer.');
    }
  };

  const handleReturnToStep = async (stepId: string, demandeId: string, rejectReason?: string) => {
    try {
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demandeId}/finaliser-tcom`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          decision: 'rejete',
          commentaire: rejectReason || `Retour depuis TCOM vers ${stepId}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      loadDemandesTCOM();
      setSelectedDemande(null);
      setShowDetails(false);
      setShowStepDropdown(false);
      
      // Notification silencieuse - pas d'alerte pour ne pas interrompre le flux
      console.log(`✅ Entreprise retournée à l'étape ${stepId} avec succès.`);
      
    } catch (error) {
      console.error('❌ [TCOMStep] Erreur lors du retour:', error);
      alert('Erreur lors du retour à l\'étape précédente. Veuillez réessayer.');
    }
  };

  const canEdit = canEditStep('TCOM');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="p-4 bg-sky-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
          <p className="text-lg text-slate-600 font-medium">Chargement des demandes T-COM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-sky-600 rounded-2xl shadow-lg mr-4">
            <DocumentCheckIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Étape T-COM</h2>
            <p className="text-lg text-slate-600 font-medium">Traitement et communication - Génération RCCM pour entreprises individuelles</p>
          </div>
        </div>

        {demandes.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-sky-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
              <ExclamationTriangleIcon className="h-12 w-12 text-white mx-auto" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-3">Aucune demande à traiter</h3>
            <p className="text-lg text-slate-600 font-medium max-w-md mx-auto">
              Il n'y a actuellement aucune entreprise à l'étape T-COM.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div key={demande.id} className="bg-gradient-to-r from-white/95 via-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                        <DocumentCheckIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-800">{demande.nom}</h3>
                        <div className="flex items-center space-x-4 text-lg text-slate-600">
                          <span className="font-medium">Type: {demande.typeEntreprise}</span>
                          <span className="font-medium">Forme: {demande.formeJuridique}</span>
                          <span className="font-medium">Secteur: {demande.secteurActivite}</span>
                        </div>
                        
                        {/* Afficher le motif de rejet si présent */}
                        {demande.motifRejet && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-red-800">Motif de rejet :</p>
                                <p className="text-sm text-red-700 mt-1">{demande.motifRejet}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {demande.rccmGenerated && (
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-lg font-medium flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5" />
                        RCCM Généré
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedDemande(demande);
                        setShowFullDetails(true);
                      }}
                      className="bg-sky-600 text-white px-6 py-3 rounded-xl hover:bg-sky-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg"
                    >
                      <EyeIcon className="h-5 w-5" />
                      <span>Voir tous les détails</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedDemande(demande);
                        setShowDetails(true);
                      }}
                      className="bg-sky-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg"
                    >
                      <DocumentCheckIcon className="h-5 w-5" />
                      <span>Gérer RCCM</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetails && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-800">Détails - {selectedDemande.nom}</h3>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedDemande(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XCircleIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Debug logs */}
              {(() => {
                console.log('🔍 [TCOMStep] Debug RCCM Interface:');
                console.log('  - canEdit:', canEdit);
                console.log('  - typeEntreprise:', selectedDemande.typeEntreprise);
                console.log('  - formeJuridique:', selectedDemande.formeJuridique);
                console.log('  - divisionCode:', selectedDemande.divisionCode);
                console.log('  - isBamako:', selectedDemande.divisionCode?.startsWith('90'));
                console.log('  - Condition génération auto:', canEdit && (selectedDemande.typeEntreprise === 'INDIVIDUELLE' || selectedDemande.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') && selectedDemande.divisionCode?.startsWith('90'));
                console.log('  - Condition saisie manuelle:', canEdit && ((selectedDemande.typeEntreprise === 'SOCIETE' || selectedDemande.formeJuridique === 'SARL' || selectedDemande.formeJuridique === 'SA') || (selectedDemande.divisionCode && !selectedDemande.divisionCode.startsWith('90'))));
                return null;
              })()}

              {/* Génération RCCM automatique pour entreprises individuelles de Bamako uniquement */}
              {canEdit && (selectedDemande.typeEntreprise === 'INDIVIDUELLE' || selectedDemande.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') && selectedDemande.divisionCode?.startsWith('90') && (
                <div className="bg-gradient-to-r from-blue-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl p-6 border border-blue-200 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                      <CpuChipIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800">Génération RCCM Automatique</h4>
                  </div>
                  
                  <p className="text-lg text-slate-600 mb-4">
                    Pour les entreprises individuelles, vous pouvez générer automatiquement le numéro RCCM via l'API OHADA.
                  </p>
                  
                  <button
                    onClick={() => handleGenerateRCCM(selectedDemande.id)}
                    disabled={generatingRCCM === selectedDemande.id}
                    className="w-full bg-sky-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingRCCM === selectedDemande.id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <BoltIcon className="h-6 w-6" />
                        <span>Générer le RCCM automatiquement</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Saisie manuelle RCCM pour sociétés OU entreprises hors Bamako */}
              {canEdit && ((selectedDemande.typeEntreprise === 'SOCIETE' || selectedDemande.formeJuridique === 'SARL' || selectedDemande.formeJuridique === 'SA') || (selectedDemande.divisionCode && !selectedDemande.divisionCode.startsWith('90'))) && (
                <div className="bg-gradient-to-r from-blue-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl p-6 border border-blue-200 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                      <PencilSquareIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800">Saisie Manuelle RCCM - Société</h4>
                  </div>
                  
                  <p className="text-lg text-slate-600 mb-4">
                    {selectedDemande.divisionCode && !selectedDemande.divisionCode.startsWith('90') 
                      ? 'Pour les entreprises hors Bamako, veuillez saisir manuellement le numéro RCCM en respectant le code du RCCM de votre localité.'
                      : 'Pour les sociétés, veuillez saisir manuellement le numéro RCCM obtenu du Tribunal de Commerce.'}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-2">
                        Numéro RCCM
                      </label>
                      <input
                        type="text"
                        value={manualRccmNumber}
                        onChange={(e) => setManualRccmNumber(e.target.value)}
                        placeholder="Ex: ML-BKO-01-2024-A-00123"
                        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={savingManualRccm === selectedDemande.id}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Format: ML-[VILLE]-[SECTION]-[ANNÉE]-[TYPE]-[NUMÉRO]
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleSaveManualRccm(selectedDemande.id)}
                        disabled={savingManualRccm === selectedDemande.id || !manualRccmNumber.trim()}
                        className="flex-1 bg-sky-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingManualRccm === selectedDemande.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Sauvegarde...</span>
                          </>
                        ) : (
                          <>
                            <CloudArrowDownIcon className="h-5 w-5" />
                            <span>Sauvegarder le numéro RCCM</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {selectedDemande.rccmNumber && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-lg font-medium flex items-center gap-2">
                          <CheckCircleIcon className="h-5 w-5" />
                          Numéro RCCM enregistré: <span className="font-mono">{selectedDemande.rccmNumber}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions finales */}
              {canEdit && (
                <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl p-6 border-t border-white/40">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-sky-600 rounded-xl shadow-lg">
                      <BoltIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800">Actions finales</h4>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => {
                        // Vérifier que le RCCM a été généré pour les entreprises individuelles
                        if ((selectedDemande.typeEntreprise === 'INDIVIDUELLE' || selectedDemande.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') && !selectedDemande.rccmNumber) {
                          alert('⚠️ Veuillez d\'abord générer le numéro RCCM avant d\'approuver cette entreprise individuelle.');
                          return;
                        }
                        const commentaire = prompt('💬 Commentaire final (optionnel):');
                        handleFinaliserTCOM(selectedDemande.id, 'approuve', commentaire || undefined);
                      }}
                      disabled={(selectedDemande.typeEntreprise === 'INDIVIDUELLE' || selectedDemande.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') && !selectedDemande.rccmNumber}
                      className="flex-1 bg-sky-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircleIcon className="h-6 w-6" />
                      <span>Approuver et Transférer au RCCM</span>
                    </button>
                    
                    {/* Bouton de retour d'étape avec menu déroulant */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="w-full bg-sky-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg"
                      >
                        <XMarkIcon className="h-6 w-6" />
                        <span>Rejeter et Retourner à l'ACCUEIL</span>
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
                <h3 className="text-xl font-bold text-gray-800">Motif de rejet</h3>
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
              <p className="text-lg text-gray-600 mb-4">
                Sélectionnez le motif de retour à l'étape ACCUEIL :
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
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
              
              {selectedRejectReason === 'Autres' && (
                <div className="mb-4">
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Précisez le motif :
                  </label>
                  <textarea
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Saisissez le motif de rejet..."
                    className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                  className="flex-1 px-4 py-2 text-lg border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const finalReason = selectedRejectReason === 'Autres' ? customRejectReason : selectedRejectReason;
                    if (finalReason.trim() && selectedDemande) {
                      handleReturnToStep('REVISION', selectedDemande.id, finalReason);
                      setShowRejectModal(false);
                      setSelectedRejectReason('');
                      setCustomRejectReason('');
                    }
                  }}
                  disabled={!selectedRejectReason || (selectedRejectReason === 'Autres' && !customRejectReason.trim())}
                  className="flex-1 px-4 py-2 text-lg bg-sky-600 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                >
                  Confirmer le rejet
                </button>
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
          onClose={() => {
            setSelectedDocumentId(null);
            setSelectedDocumentName('');
          }}
        />
      )}

      {/* Modal d'erreur professionnel */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <XCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{errorModalTitle}</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-lg whitespace-pre-line">{errorModalMessage}</p>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de succès professionnel */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{successModalTitle}</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-lg whitespace-pre-line">{successModalMessage}</p>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour voir tous les détails de l'entreprise */}
      {showFullDetails && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-8xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-black text-slate-800">
                Détails complets - {getDisplayName(selectedDemande)}
              </h3>
              <button
                onClick={() => {
                  setShowFullDetails(false);
                  setSelectedDemande(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <EntrepriseDetails 
                entrepriseId={selectedDemande.id}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TCOMStep;
























