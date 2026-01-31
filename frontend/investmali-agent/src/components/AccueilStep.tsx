import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { useAgentNotifications } from '../hooks/useAgentNotifications';
import { API_CONFIG } from '../config/api.config';
import DossierCreationForm from './DossierCreationForm';
import DossierSearch from './DossierSearch';
import EntrepriseDetails from './EntrepriseDetails';
import ChatModal from './ChatModal';
import PaymentMethodModal from './PaymentMethodModal';
import PaymentReceipt from './PaymentReceipt';
import { generateUnpaidReceiptData } from '../services/receiptService';
import { agentBusinessAPI, entreprisesAPI, agentAuthAPI } from '../services/api';
// Import du divisionService - créer une version locale ou utiliser l'API directement
import { Dossier, DemandeEntreprise } from '../types';
import { rateLimitHandler } from '../utils/rateLimitHandler';
import { 
  FolderPlusIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon,
  EyeIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import apiLogo from '../assets/logos/api-logo.png';

// Les interfaces sont maintenant importées depuis ../types

interface AccueilStepProps {
  dossier?: Dossier;
  onDossierUpdate?: (dossier: Dossier) => void;
}

const AccueilStep: React.FC<AccueilStepProps> = ({ dossier, onDossierUpdate }) => {
  const { agent, canEditStep } = useAgentAuth();
  const { isDarkMode } = useTheme();
  const { isModalOpen } = useModal();
  const [activeTab, setActiveTab] = useState<'demandes' | 'assigned' | 'search' | 'create'>('create');
  const [currentDossier, setCurrentDossier] = useState<Dossier | null>(dossier || null);
  const [isLoading, setIsLoading] = useState(false);
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([]);
  const [demandesLoading, setDemandesLoading] = useState(false);
  const [assignedDemandes, setAssignedDemandes] = useState<DemandeEntreprise[]>([]);
  
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string | null>(null);
  const [divisionsCache, setDivisionsCache] = useState<{[key: string]: any}>({});
  const [isScrolled, setIsScrolled] = useState(false);
  
  // États pour le chat
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatEntreprise, setChatEntreprise] = useState<{
    id: string;
    nom: string;
    userId: string;
    userNom: string;
    conversationId?: string; // ✅ NOUVEAU : ID de conversation
  } | null>(null);

  // États pour le paiement agent
  const [paiementModalOpen, setPaiementModalOpen] = useState(false);
  const [paiementEntreprise, setPaiementEntreprise] = useState<{
    id: string;
    nom: string;
    totalAmount?: number;
  } | null>(null);

  // États pour le reçu
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Hook pour les notifications
  const { unreadCount, resetUnreadCount } = useAgentNotifications();

  // Effet pour détecter le scroll et appliquer le sticky
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 100); // Devient sticky après 100px de scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // État pour les compteurs de messages non lus par entreprise
  const [unreadCountsByEntreprise, setUnreadCountsByEntreprise] = useState<{[key: string]: number}>({});

  // État pour les statuts de paiement par entreprise (true = payé, false = non payé)
  const [paiementStatusByEntreprise, setPaiementStatusByEntreprise] = useState<{[key: string]: boolean}>({});

  // Fonction utilitaire pour obtenir le nom d'affichage d'une entreprise
  // Utilise prénom+nom du gérant si le nom d'entreprise est null
  const getDisplayName = (entreprise: any, gerantPersonne?: any): string => {
    if (entreprise.nom) {
      return entreprise.nom;
    }
    
    // Si pas de nom d'entreprise, utiliser prénom+nom du gérant
    const personne = gerantPersonne || entreprise.membres?.find((m: any) => m.role === 'GERANT')?.personne;
    if (personne) {
      const fullName = `${personne.prenom || ''} ${personne.nom || ''}`.trim();
      return fullName || 'Entreprise sans nom';
    }
    
    return 'Entreprise sans nom';
  };

  // Fonction pour récupérer les compteurs de messages non lus par entreprise
  const fetchUnreadCountsByEntreprise = async () => {
    if (!agent?.id) return;

    // Utiliser le contexte modal au lieu de la détection DOM
    if (isModalOpen) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversations/agent/${agent.id}/native`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'SUCCESS' && data.conversations) {
          // Compter les messages non lus par entreprise
          const counts: {[key: string]: number} = {};
          data.conversations.forEach((conv: any, index: number) => {
            const entrepriseId = conv.entreprise_id;
            const unreadCount = conv.unread_count || 0;
            
            if (entrepriseId) {
              counts[entrepriseId] = (counts[entrepriseId] || 0) + unreadCount;
            }
          });
          setUnreadCountsByEntreprise(counts);
        }
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const canEdit = canEditStep('ACCUEIL');

  // Fonction pour vérifier les statuts de paiement des demandes assignées
  const checkPaiementStatusForDemandes = async (demandeIds: string[]) => {
    const statusMap: {[key: string]: boolean} = {};
    
    for (const demandeId of demandeIds) {
      try {
        const paiementResponse = await fetch(`${API_CONFIG.BASE_URL}/paiements/entreprise/${demandeId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (paiementResponse.ok) {
          const paiements = await paiementResponse.json();
          
          // Chercher un paiement validé
          const paiementValide = Array.isArray(paiements) 
            ? paiements.find((p: any) => p.statut === 'VALIDE' || p.statut === 'REUSSI' || p.statut === 'PAID')
            : (paiements.statut === 'VALIDE' || paiements.statut === 'REUSSI' || paiements.statut === 'PAID' ? paiements : null);
          
          statusMap[demandeId] = !!paiementValide;
        } else {
          statusMap[demandeId] = false;
        }
      } catch (error) {
        statusMap[demandeId] = false;
      }
    }
    
    setPaiementStatusByEntreprise(prev => ({ ...prev, ...statusMap }));
  };

  // useEffect pour récupérer les compteurs de messages non lus
  useEffect(() => {
    if (agent?.id) {
      fetchUnreadCountsByEntreprise();
      
      // DÉSACTIVÉ TEMPORAIREMENT : Récupérer les compteurs toutes les 30 secondes
      // Cause des re-renders qui ferment les modals pendant la création d'entreprise
      // const interval = setInterval(fetchUnreadCountsByEntreprise, 30000);
      
      // return () => clearInterval(interval);
    }
  }, [agent?.id]);

  useEffect(() => {
    if (dossier) {
      setCurrentDossier(dossier);
      // Ne pas forcer l'onglet documents si on vient de créer un dossier
      // Seulement si on n'est pas déjà sur l'onglet create
      if (activeTab !== 'create') {
        setActiveTab('search');
      }
    }
  }, [dossier, activeTab]);

  // Charger les demandes d'entreprises directement depuis la base de données
  useEffect(() => {
    loadDemandes();
    loadAssignedDemandes();
  }, []);


  // Fonction optimisée pour résoudre division_id/code vers nom de localisation
  const getDivisionName = async (divisionIdOrCode: string): Promise<string> => {
    if (!divisionIdOrCode) {
      return 'Non spécifiée';
    }
    
    // Vérifier le cache en premier (performance critique)
    if (divisionsCache[divisionIdOrCode]) {
      const division = divisionsCache[divisionIdOrCode];
      return division.displayName || division.nom || 'Non spécifiée';
    }
    
    // Retourner immédiatement "Non spécifiée" pour éviter les appels API lents
    // TODO: Implémenter un cache pré-chargé des divisions les plus communes
    return 'Non spécifiée';
    
    try {
      // Essayer plusieurs noms de token possibles
      let token = localStorage.getItem('investmali_agent_token') || 
                  localStorage.getItem('agentToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('authToken') ||
                  localStorage.getItem('agent_token');
      
      if (!token) {
        return 'Non spécifiée';
      }
      
      
      // Détecter si c'est un UUID (ne pas traiter avec INSTAT)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(divisionIdOrCode);
      if (isUUID) {
        return divisionIdOrCode;
      }
      
      // Pour les codes de division (quartiers de 12 caractères)
      if (divisionIdOrCode.length === 12) {
        const communeCode = divisionIdOrCode.substring(0, 8);
        
        const response = await fetch(`https://apimali.test.instat.ml/api/get/vfq/${communeCode}`, {
          headers: {
            'accept': '*/*',
            'Authorization': 'Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw',
            'X-CSRF-TOKEN': ''
          }
        });
        
        
        if (response.ok) {
          const quartiers = await response.json();
          
          const quartier = quartiers?.find((q: any) => q.code === divisionIdOrCode);
          if (quartier) {
            const divisionName = quartier.nom;
            
            // Mettre en cache
            const newCache = { ...divisionsCache };
            newCache[divisionIdOrCode] = { code: divisionIdOrCode, nom: divisionName, displayName: divisionName };
            setDivisionsCache(newCache);
            
            return divisionName;
          }
        }
      } else {
        return divisionIdOrCode;
      }
    } catch (error) {
      // Silently handle error
    }
    
    return 'Non spécifiée';
  };

  const loadDemandes = async () => {
    setDemandesLoading(true);
    try {
      
      // FALLBACK: Utiliser /entreprises avec filtrage robuste
      // (car /unassigned retourne une erreur 500)
      
      let response;
      let allEntreprises: any[] = [];
      
      try {
        // Essayer d'abord /unassigned
        response = await entreprisesAPI.unassigned({
          etape: 'ACCUEIL',
          page: 0,
          size: 100,
          sort: 'creation,desc'
        });
        
        const pageData = response.data;
        allEntreprises = pageData?.content || pageData?.data || pageData?.rows || pageData || [];
        
      } catch (error) {
        
        // Fallback sur /entreprises
        response = await entreprisesAPI.list({
          page: 0,
          size: 100,
          sort: 'creation,desc'
        });
        
        const pageData = response.data;
        const toutes = pageData?.content || pageData?.data || pageData?.rows || pageData || [];
        
        // Filtrage STRICT pour éliminer les entreprises assignées
        
        allEntreprises = toutes.filter((entreprise: any) => {
          const etapeValidation = entreprise.etapeValidation;
          const assignedTo = entreprise.assignedTo;
          
          // Debug motif_rejet for PAPERS in unassigned list
          if (entreprise.nom === 'PAPERS') {
            console.log('🔍 [DEBUG] PAPERS in unassigned - motif_rejet:', entreprise.motifRejet);
            console.log('🔍 [DEBUG] PAPERS in unassigned - motif_rejet (underscore):', entreprise.motif_rejet);
          }
          
          // Condition 1: Être à l'étape ACCUEIL ET ne pas être validée
          const isAccueilStep = etapeValidation === 'ACCUEIL' || !etapeValidation;
          const statutCreation = entreprise.statutCreation;
          const isNotValidated = statutCreation !== 'VALIDEE' && statutCreation !== 'VALIDE';
          
          // Condition 2: NE PAS être assignée (ULTRA STRICT)
          // Vérifier TOUTES les possibilités d'assignation
          let isAssigned = false;
          if (assignedTo !== null && assignedTo !== undefined) {
            isAssigned = true;
          } else if (entreprise.assigned_to !== null && entreprise.assigned_to !== undefined) {
            isAssigned = true;
          } else if (entreprise.assignedToId) {
            isAssigned = true;
          } else if (entreprise.agent || entreprise.agentId) {
            isAssigned = true;
          }
          
          const isNotAssigned = !isAssigned;
          const inclure = isAccueilStep && isNotAssigned && isNotValidated;
          
          
          return inclure;
        });
        
      }
      
      // Vérification de sécurité finale
      allEntreprises.forEach((entreprise: any) => {
        const assignedTo = entreprise.assignedTo;
        if (assignedTo !== null && assignedTo !== undefined) {
          // Silently handle assigned enterprise detection
        }
      });
      
      // Utiliser les entreprises filtrées
      const entreprises = allEntreprises;
      
      // Mapper vers le format DemandeEntreprise avec résolution des divisions
      const demandesFormatted: DemandeEntreprise[] = await Promise.all(
        entreprises.map(async (entreprise: any) => {
          console.log('🔍 [DEBUG] Entreprise:', {
            id: entreprise.id,
            nom: entreprise.nom,
            membres: entreprise.membres
          });
          
          const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR' || m.entrepriseRole === 'GERANT' || m.entrepriseRole === 'PROMOTEUR');
          const gerantPersonne = gerant?.personne || gerant;
          
          console.log('🔍 [DEBUG] Gérant trouvé:', {
            gerant: gerant,
            gerantPersonne: gerantPersonne,
            prenom: gerantPersonne?.prenom,
            nom: gerantPersonne?.nom
          });
          
          // Résoudre la division
          
          const divisionId = entreprise.division_id || entreprise.divisionId || entreprise.division?.id || entreprise.divisionCode;
          let divisionName = 'Non spécifiée';
          
          
          if (divisionId) {
            divisionName = await getDivisionName(divisionId);
          } else {
          }
          
          return {
            id: entreprise.id,
            nom: getDisplayName(entreprise, gerantPersonne),
            sigle: entreprise.sigle || '',
            formeJuridique: entreprise.formeJuridique || 'Non spécifiée',
            typeEntreprise: entreprise.typeEntreprise || entreprise.domaineActivite || 'Non spécifié',
            statut: entreprise.statutCreation || 'EN_COURS',
            dateCreation: entreprise.creation || entreprise.dateCreation || new Date().toISOString(),
            demandeur: {
              nom: gerantPersonne?.nom || 'Nom non renseinger',
              prenom: gerantPersonne?.prenom || 'Prénom non renseinger',
              email: gerantPersonne?.email || 'Email non renseinger',
              telephone: gerantPersonne?.telephone1 || gerantPersonne?.telephone || 'Téléphone non renseinger'
            },
            division: divisionName,
            antenne: entreprise.antenne || '',
            etapeActuelle: entreprise.etapeValidation || 'ACCUEIL',
            motifRejet: entreprise.motifRejet || entreprise.motif_rejet,
            paiementEffectue: entreprise.paiementEffectue || false
          };
        })
      );
      
      setDemandes(demandesFormatted);
    } catch (error) {
      setDemandes([]);
    } finally {
      setDemandesLoading(false);
    }
  };

  const loadAssignedDemandes = async () => {
    setAssignedLoading(true);
    try {
      console.log('🔍 [DEBUG] loadAssignedDemandes - Agent ID:', agent?.id);
      console.log('🔍 [DEBUG] loadAssignedDemandes - Agent object:', agent);
      
      if (!agent?.id) {
        
        // Essayer de récupérer l'ID depuis localStorage ou API
        let agentId = null;
        
        // Vérifier localStorage
        const storedAgent = localStorage.getItem('investmali_agent');
        if (storedAgent) {
          try {
            const parsedAgent = JSON.parse(storedAgent);
            if (parsedAgent.id) {
              agentId = parsedAgent.id;
            }
          } catch (e) {
            // Silently handle parsing error
          }
        }
        
        // Si pas d'ID dans localStorage, essayer l'API
        if (!agentId && agent?.email) {
          agentId = await getAgentIdFromAPI(agent.email);
          
          // Si on récupère l'ID depuis l'API, mettre à jour le localStorage et le contexte
          if (agentId) {
            // Mettre à jour localStorage
            const updatedAgent = { ...agent, id: agentId };
            localStorage.setItem('investmali_agent', JSON.stringify(updatedAgent));
          }
        }
        
        if (!agentId) {
          setAssignedDemandes([]);
          return;
        }
        
        try {
          // Utiliser l'API assignedToMe avec l'ID récupéré
          const response = await entreprisesAPI.assignedToMe({
            page: 0,
            size: 100,
            sort: 'creation,desc'
          });
          
          const assignedData = response.data;
          const assignedEntreprises = assignedData?.content || assignedData?.data || assignedData?.rows || assignedData || [];
          
          // Filtrer pour exclure les demandes validées (transférées au régisseur)
          const filteredEntreprises = assignedEntreprises.filter((entreprise: any) => {
            const statutCreation = entreprise.statutCreation;
            const etapeValidation = entreprise.etapeValidation;
            
            // Exclure les demandes validées ou transférées au régisseur
            const isValidated = statutCreation === 'VALIDEE';
            const isTransferredToRegisseur = etapeValidation === 'REGISSEUR';
            
            if (isValidated || isTransferredToRegisseur) {
              return false;
            } else {
              return true;
            }
          });
          
          
          // Mapper vers le format DemandeEntreprise
          const demandesFormatted: DemandeEntreprise[] = await Promise.all(
            filteredEntreprises.map(async (entreprise: any) => {
              const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR' || m.entrepriseRole === 'GERANT' || m.entrepriseRole === 'PROMOTEUR');
              const gerantPersonne = gerant?.personne || gerant;
              
              // Résoudre la division
              const divisionId = entreprise.division_id || entreprise.divisionId || entreprise.division?.id || entreprise.divisionCode;
              let divisionName = 'Non spécifiée';
              
              if (divisionId) {
                divisionName = await getDivisionName(divisionId);
              }
              
              return {
                id: entreprise.id,
                nom: getDisplayName(entreprise, gerantPersonne),
                sigle: entreprise.sigle || '',
                formeJuridique: entreprise.formeJuridique || 'Non spécifiée',
                typeEntreprise: entreprise.typeEntreprise || entreprise.domaineActivite || 'Non spécifié',
                statut: entreprise.statutCreation || 'EN_COURS',
                dateCreation: entreprise.creation || entreprise.dateCreation || new Date().toISOString(),
                demandeur: {
                  nom: gerantPersonne?.nom || 'Nom non renseinger',
                  prenom: gerantPersonne?.prenom || 'Prénom non renseinger',
                  email: gerantPersonne?.email || 'Email non renseinger',
                  telephone: gerantPersonne?.telephone1 || gerantPersonne?.telephone || 'Téléphone non renseinger'
                },
                division: divisionName,
                antenne: entreprise.antenne || '',
                etapeActuelle: entreprise.etapeValidation || 'ACCUEIL',
                motifRejet: entreprise.motifRejet || entreprise.motif_rejet,
                paiementEffectue: entreprise.paiementEffectue || false
              };
            })
          );
          
          setAssignedDemandes(demandesFormatted);
          return;
        } catch (error) {
          setAssignedDemandes([]);
          return;
        }
      }
      
      // Utiliser l'API assignedToMe directement
      const response = await entreprisesAPI.assignedToMe({
        page: 0,
        size: 100,
        sort: 'creation,desc'
      });
      
      const assignedData = response.data;
      const assignedEntreprises = assignedData?.content || assignedData?.data || assignedData?.rows || assignedData || [];
      
      console.log('🔍 [DEBUG] Raw assigned enterprises from API:', assignedEntreprises);
      console.log('🔍 [DEBUG] Number of assigned enterprises:', assignedEntreprises.length);
      
      // Debug motif_rejet specifically
      assignedEntreprises.forEach((entreprise: any) => {
        if (entreprise.nom === 'PAPERS') {
          console.log('🔍 [DEBUG] PAPERS motif_rejet:', entreprise.motifRejet);
          console.log('🔍 [DEBUG] PAPERS motif_rejet (underscore):', entreprise.motif_rejet);
          console.log('🔍 [DEBUG] PAPERS full object:', entreprise);
        }
      });
      
      // Filtrer pour exclure les demandes validées (transférées au régisseur)
      const filteredEntreprises = assignedEntreprises.filter((entreprise: any) => {
        const statutCreation = entreprise.statutCreation;
        const etapeValidation = entreprise.etapeValidation;
        
        console.log(`🔍 [DEBUG] Enterprise ${entreprise.nom}: etape=${etapeValidation}, statut=${statutCreation}, assigned_to=${entreprise.assignedTo || entreprise.assigned_to}`);
        
        // Inclure les demandes à l'étape ACCUEIL (y compris celles rejetées de REVISION avec statut EN_COURS)
        if (etapeValidation === 'ACCUEIL') {
          console.log(`✅ [DEBUG] Including ${entreprise.nom} - ACCUEIL step`);
          return true;
        }
        
        // Exclure les demandes validées ou transférées au régisseur
        const isValidated = statutCreation === 'VALIDEE';
        const isTransferredToRegisseur = etapeValidation === 'REGISSEUR';
        
        if (isValidated || isTransferredToRegisseur) {
          console.log(`❌ [DEBUG] Excluding ${entreprise.nom} - validated or transferred`);
          return false;
        } else {
          console.log(`✅ [DEBUG] Including ${entreprise.nom} - other valid status`);
          return true;
        }
      });
      
      
      // Mapper vers le format DemandeEntreprise avec résolution des divisions
      const demandesFormatted: DemandeEntreprise[] = await Promise.all(
        filteredEntreprises.map(async (entreprise: any) => {
          const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR' || m.entrepriseRole === 'GERANT' || m.entrepriseRole === 'PROMOTEUR');
          const gerantPersonne = gerant?.personne || gerant;
          
          // Résoudre la division
          
          const divisionId = entreprise.division_id || entreprise.divisionId || entreprise.division?.id || entreprise.divisionCode;
          let divisionName = 'Non spécifiée';
          
          
          if (divisionId) {
            divisionName = await getDivisionName(divisionId);
          } else {
          }
          
          return {
            id: entreprise.id,
            nom: getDisplayName(entreprise, gerantPersonne),
            sigle: entreprise.sigle || '',
            formeJuridique: entreprise.formeJuridique || 'Non spécifiée',
            typeEntreprise: entreprise.typeEntreprise || entreprise.domaineActivite || 'Non spécifié',
            statut: entreprise.statutCreation || 'EN_COURS',
            dateCreation: entreprise.creation || entreprise.dateCreation || new Date().toISOString(),
            demandeur: {
              nom: gerantPersonne?.nom || 'Nom non renseinger',
              prenom: gerantPersonne?.prenom || 'Prénom non renseinger',
              email: gerantPersonne?.email || 'Email non renseinger',
              telephone: gerantPersonne?.telephone1 || gerantPersonne?.telephone || 'Téléphone non renseinger'
            },
            division: divisionName,
            antenne: entreprise.antenne || '',
            etapeActuelle: entreprise.etapeValidation || 'ACCUEIL',
            motifRejet: entreprise.motifRejet || entreprise.motif_rejet,
            paiementEffectue: entreprise.paiementEffectue || false
          };
        })
      );
      
      setAssignedDemandes(demandesFormatted);
      
      // Vérifier les statuts de paiement pour les demandes assignées
      const demandeIds = demandesFormatted.map(d => d.id);
      if (demandeIds.length > 0) {
        checkPaiementStatusForDemandes(demandeIds);
      }
    } catch (error) {
      setAssignedDemandes([]);
    } finally {
      setAssignedLoading(false);
    }
  };

  const handleDossierCreated = (newDossier: Dossier) => {
    // NE PAS changer d'onglet automatiquement pour permettre au modal de succès de s'afficher
    // Le modal de succès dans DossierCreationForm gère l'affichage et la fermeture
    
    // NE PAS appeler onDossierUpdate car cela déclenche le useEffect qui force l'onglet documents
    // onDossierUpdate?.(newDossier);
    
    // Recharger la liste des demandes pour inclure le nouveau dossier
    loadDemandes();
    loadAssignedDemandes();
  };

  const handleDossierSelected = (selectedDossier: Dossier) => {
    // Afficher les détails de l'entreprise sélectionnée
    setSelectedEntrepriseId(selectedDossier.entrepriseId || selectedDossier.id);
  };

  const handleDemandeAction = async (demandeId: string, action: 'accept' | 'reject' | 'request_info') => {
    try {
      setIsLoading(true);
      
      // Trouver la demande dans les demandes assignées
      const demande = assignedDemandes.find(d => d.id === demandeId);
      if (!demande) {
        console.error('Erreur: Demande non trouvée');
        return;
      }
      
      let newStatus = '';
      let newEtape = '';
      let note = '';
      
      switch (action) {
        case 'accept':
          // Vérifier si un paiement existe dans la base de données
          let isPaid = false;
          try {
            console.log('🔍 [AccueilStep] Vérification du paiement pour:', demandeId);
            const paiementResponse = await fetch(`${API_CONFIG.BASE_URL}/paiements/entreprise/${demandeId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (paiementResponse.ok) {
              const paiements = await paiementResponse.json();
              console.log('✅ [AccueilStep] Paiements trouvés:', paiements);
              
              // Chercher un paiement validé
              const paiementValide = Array.isArray(paiements) 
                ? paiements.find((p: any) => p.statut === 'VALIDE' || p.statut === 'REUSSI' || p.statut === 'PAID')
                : (paiements.statut === 'VALIDE' || paiements.statut === 'REUSSI' || paiements.statut === 'PAID' ? paiements : null);
              
              isPaid = !!paiementValide;
              console.log('💰 [AccueilStep] Paiement validé:', isPaid);
            }
          } catch (error) {
            console.warn('⚠️ [AccueilStep] Erreur lors de la vérification du paiement:', error);
          }
          
          if (isPaid) {
            // Si payé, passer directement à REVISION
            newStatus = 'VALIDE';
            newEtape = 'REVISION';
            note = 'Demande validée par l\'agent d\'accueil - Paiement déjà effectué, transférée directement à la révision';
            console.log('✅ [AccueilStep] Paiement trouvé - Transfert direct vers REVISION');
          } else {
            // Si non payé, passer au REGISSEUR
            newStatus = 'VALIDE';
            newEtape = 'REGISSEUR';
            note = 'Demande validée par l\'agent d\'accueil et transférée au régisseur pour paiement';
            console.log('💳 [AccueilStep] Pas de paiement - Transfert vers REGISSEUR');
          }
          break;
        case 'reject':
          newStatus = 'REJETE';
          newEtape = 'ACCUEIL';
          note = 'Demande rejetée par l\'agent d\'accueil';
          break;
        case 'request_info':
          newStatus = 'INCOMPLET';
          newEtape = 'ACCUEIL';
          note = 'Informations complémentaires requises';
          break;
      }
      
      
      // Mettre à jour via l'API backend avec l'étape appropriée
      await entreprisesAPI.updateStatus(demandeId, newStatus, note, newEtape);
      
      if (action === 'accept') {
        // Validation réussie
        const destination = newEtape === 'REVISION' ? 'la révision (paiement déjà effectué)' : 'le régisseur';
        console.log(`✅ Demande "${demande.nom}" validée et transférée à ${destination} avec succès!`);
      } else {
        console.log(`✅ Demande "${demande.nom}" ${action === 'reject' ? 'rejetée' : 'marquée comme incomplète'} avec succès!`);
      }
      
      // Recharger les données depuis la base de données avec des délais pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadAssignedDemandes();
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadDemandes();
      
      
    } catch (error: any) {
      
      // Gestion spécifique des erreurs
      if (error?.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || '60';
        console.warn(`⚠️ Trop de requêtes simultanées. Veuillez patienter ${retryAfter} secondes avant de réessayer.`);
      } else if (error?.response?.status === 500) {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Erreur serveur inconnue';
        const errorDetails = error?.response?.data?.details || '';
        
        
        console.error(`❌ Erreur serveur lors de la mise à jour du statut. Détails: ${errorMessage}`);
        
        // Recharger les données pour voir si la mise à jour a fonctionné
        setTimeout(async () => {
          try {
            await loadAssignedDemandes();
            await loadDemandes();
          } catch (reloadError) {
            // Silently handle reload error
          }
        }, 2000);
      } else if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.message || 'Données invalides';
        console.warn(`⚠️ Erreur de validation: ${errorMessage}`);
      } else if (error?.response?.status === 404) {
        console.error(`❌ Entreprise non trouvée. Elle a peut-être été supprimée.`);
      } else if (error?.response?.status === 409) {
        const errorMessage = error?.response?.data?.message || 'Conflit de données';
        console.warn(`⚠️ Conflit: ${errorMessage}`);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Erreur inconnue';
        console.error(`❌ Erreur lors du traitement de la demande: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ouvrir le modal de paiement
  const handlePasserAuPaiement = (demandeId: string) => {
    // Trouver la demande dans les demandes assignées
    const demande = assignedDemandes.find(d => d.id === demandeId);
    if (!demande) {
      console.error('Erreur: Demande non trouvée');
      return;
    }
    
    
    // Préparer les données pour le modal
    setPaiementEntreprise({
      id: demande.id,
      nom: demande.nom,
      totalAmount: (demande as any).totalAmount || 14500 // Montant par défaut en FCFA
    });
    
    // Ouvrir le modal
    setPaiementModalOpen(true);
  };

  // Fonction appelée après validation/annulation du paiement
  const handlePaiementComplete = async () => {
    try {
      // Recharger les données depuis la base de données avec des délais pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadAssignedDemandes();
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadDemandes();
      
      console.log('✅ Données rechargées après paiement');
      
    } catch (error) {
      console.error('Erreur lors du rechargement après paiement:', error);
    }
  };

  // Fonction pour afficher le reçu d'une entreprise
  // Vérifie d'abord si un paiement existe dans la base de données
  const handleViewReceipt = async (demande: DemandeEntreprise) => {
    try {
      console.log('🔍 [AccueilStep] Recherche de paiement pour entreprise:', demande.id);
      
      // 1. Vérifier si un paiement existe dans la base de données pour cette entreprise
      const paiementResponse = await fetch(`${API_CONFIG.BASE_URL}/paiements/entreprise/${demande.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (paiementResponse.ok) {
        const paiements = await paiementResponse.json();
        console.log('✅ [AccueilStep] Paiements trouvés:', paiements);
        
        // Chercher un paiement validé (VALIDE ou REUSSI)
        const paiementValide = Array.isArray(paiements) 
          ? paiements.find((p: any) => p.statut === 'VALIDE' || p.statut === 'REUSSI' || p.statut === 'PAID')
          : (paiements.statut === 'VALIDE' || paiements.statut === 'REUSSI' || paiements.statut === 'PAID' ? paiements : null);
        
        if (paiementValide) {
          console.log('✅ [AccueilStep] Paiement validé trouvé:', paiementValide);
          
          // Récupérer les détails de l'entreprise
          let entrepriseData: any = null;
          let gerant: any = null;
          
          try {
            const entrepriseResponse = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demande.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (entrepriseResponse.ok) {
              entrepriseData = await entrepriseResponse.json();
              gerant = entrepriseData.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR');
            }
          } catch (e) {
            console.warn('⚠️ [AccueilStep] Impossible de récupérer les détails entreprise');
          }
          
          // Générer le reçu payé comme dans le Régisseur
          const paymentData = {
            entrepriseId: demande.id,
            entrepriseName: demande.nom || paiementValide.entrepriseNom || '',
            entrepriseType: demande.typeEntreprise || entrepriseData?.typeEntreprise || 'ENTREPRISE_INDIVIDUELLE',
            localisation: demande.division || entrepriseData?.divisionNom || 'Non spécifié',
            commune: entrepriseData?.communeNom || entrepriseData?.quartierNom || 'Non spécifié',
            amount: paiementValide.montant ? Number(paiementValide.montant) : 0,
            paymentMethod: paiementValide.typePaiement || 'Cash',
            transactionId: paiementValide.referenceTransaction || paiementValide.id,
            paymentDate: paiementValide.datePaiement || paiementValide.dateCreation || new Date().toISOString(),
            status: 'success' as const,
            dossierNumber: entrepriseData?.reference || paiementValide.entrepriseReference || demande.id,
            processedByAgent: true,
            agentName: agent ? `${agent.firstName} ${agent.lastName}` : 'Agent API-INVEST',
            prenom: gerant?.personne?.prenom || gerant?.prenom || paiementValide.personnePrenom || demande.demandeur?.prenom || '',
            nom: gerant?.personne?.nom || gerant?.nom || paiementValide.personneNom || demande.demandeur?.nom || ''
          };
          
          setReceiptData(paymentData);
          setReceiptModalOpen(true);
          return;
        }
      }
      
      // 2. Si pas de paiement trouvé, afficher un message
      console.log('⚠️ [AccueilStep] Aucun paiement validé trouvé pour cette entreprise');
      alert('Aucun paiement validé trouvé pour ce dossier.');
      
    } catch (error) {
      console.error('Erreur lors de la récupération du reçu:', error);
      alert('Erreur lors de la récupération du reçu de paiement.');
    }
  };

  // Fonction pour ouvrir le chat avec un utilisateur
  // Fonction pour vérifier et créer une conversation pour une entreprise
  const checkAndCreateConversation = async (entrepriseInfo: {
    id: string;
    nom: string;
    userId: string;
    userNom: string;
  }) => {
    try {
      console.log('🔍 Vérification conversation existante pour entreprise:', entrepriseInfo.id);
      
      const agentId = agent?.id || '8dbfb14f-565c-4428-ba20-b318a7a57cb3';
      
      // 🔍 DEBUG: Vérifier les informations de l'agent
      console.log('🔍 DEBUG Agent Info:', {
        agentId,
        agentRole: agent?.role,
        agentEmail: agent?.email,
        agentName: agent?.firstName + ' ' + agent?.lastName,
        fullAgent: agent
      });
      
      // ✅ ÉTAPE 1 : Vérifier s'il existe déjà une conversation
      console.log('🔍 Recherche conversation existante:', { agentId, userId: entrepriseInfo.userId, entrepriseId: entrepriseInfo.id });
      
      const findResponse = await fetch(`${API_CONFIG.BASE_URL}/conversations/find?agent_id=${agentId}&user_id=${entrepriseInfo.userId}&entreprise_id=${entrepriseInfo.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (findResponse.ok) {
        const findData = await findResponse.json();
        
        if (findData.status === 'FOUND') {
          console.log('✅ Conversation existante trouvée:', findData.conversation_id);
          
          // Ouvrir la conversation existante
          setChatEntreprise({
            ...entrepriseInfo,
            conversationId: findData.conversation_id
          });
          
          return;
        } else {
          console.log('ℹ️ Aucune conversation existante, création d\'une nouvelle...');
        }
      }
      
      // ✅ ÉTAPE 2 : Créer une nouvelle conversation si aucune n'existe
      console.log('🚀 Création nouvelle conversation agent:', { agentId, userId: entrepriseInfo.userId, entrepriseId: entrepriseInfo.id });
      
      const initiateResponse = await fetch(`${API_CONFIG.BASE_URL}/conversations/agent-initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
          user_id: entrepriseInfo.userId,
          entreprise_id: entrepriseInfo.id,
          initial_message: `Bonjour ${entrepriseInfo.userNom}, nous avons bien reçu votre demande de création d'entreprise "${entrepriseInfo.nom}". Comment puis-je vous aider ?`
        })
      });
      
      if (initiateResponse.ok) {
        const initiateData = await initiateResponse.json();
        
        if (initiateData.status === 'SUCCESS') {
          console.log('✅ Conversation initiée avec succès:', initiateData.conversation_id);
          
          // Ouvrir le chat avec la conversation créée/trouvée
          setChatEntreprise({
            ...entrepriseInfo,
            conversationId: initiateData.conversation_id
          });
          
          return;
        } else {
          console.error('❌ Erreur lors de l\'initiation:', initiateData.message);
        }
      } else {
        console.error('❌ Erreur HTTP lors de l\'initiation:', initiateResponse.status);
      }
      
      // Fallback : ouvrir le chat quand même
      console.warn('⚠️ Fallback: ouverture directe du chat');
      setChatEntreprise(entrepriseInfo);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation de conversation:', error);
      // Fallback : ouvrir le chat quand même
      setChatEntreprise(entrepriseInfo);
    }
  };

  const handleOpenChat = async (demande: DemandeEntreprise) => {
    console.log('💬 Ouverture du chat pour:', demande);
    
    try {
      // Récupérer l'ID de l'agent connecté depuis le contexte d'authentification
      const agentId = agent?.id?.toString();
      const agentNom = agent?.firstName && agent?.lastName 
        ? `${agent.firstName} ${agent.lastName}` 
        : agent?.email || 'Agent';
      
      if (!agentId) {
        console.error('❌ Aucun agent trouvé dans le contexte d\'authentification');
        console.error('Erreur : Vous devez être connecté pour ouvrir le chat');
        return;
      }
      
      console.log('✅ Agent ID récupéré depuis le contexte:', agentId);
      console.log('✅ Agent nom:', agentNom);
      
      // Récupérer l'ID du créateur de l'entreprise (gérant)
      console.log('🔍 Recherche du créateur de l\'entreprise:', demande.nom);
      
      // Appeler l'API pour récupérer les détails de l'entreprise avec les membres
        const entrepriseResponse = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${demande.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Gestion spécifique du rate limiting
        if (entrepriseResponse.status === 429) {
          console.warn('⚠️ Rate limit atteint pour l\'API entreprise, abandon de l\'ouverture du chat');
          
          // Utiliser le gestionnaire global de rate limiting
          const retryAfter = entrepriseResponse.headers.get('retry-after');
          const error = {
            status: 429,
            headers: { 'retry-after': retryAfter || '60' }
          };
          rateLimitHandler.handleRateLimitError(error);
          
          return;
        }
        
        if (!entrepriseResponse.ok) {
          throw new Error(`HTTP ${entrepriseResponse.status}: ${entrepriseResponse.statusText}`);
        }
        
        const entrepriseData = await entrepriseResponse.json();
        console.log('🔍 Réponse API entreprise:', entrepriseData);
        
        // PRIORITÉ ABSOLUE : Utiliser le currentUser (utilisateur connecté - plus fiable)
        if (entrepriseData && entrepriseData.currentUser) {
          console.log('🔍 DEBUG - CurrentUser trouvé (utilisateur connecté):', entrepriseData.currentUser);
          
          const utilisateurConnecte = {
            personId: entrepriseData.currentUser.id,
            prenom: entrepriseData.currentUser.prenom,
            nom: entrepriseData.currentUser.nom,
            email: entrepriseData.currentUser.email
          };
          
          console.log('✅ PRIORITÉ ABSOLUE - Utilisation du currentUser (utilisateur connecté):', utilisateurConnecte);
          console.log('📝 Note: Le currentUser est prioritaire même s\'il n\'est pas membre de l\'entreprise');
          
          await checkAndCreateConversation({
            id: demande.id,
            nom: demande.nom,
            userId: utilisateurConnecte.personId, // Utiliser l'ID du currentUser
            userNom: `${utilisateurConnecte.prenom} ${utilisateurConnecte.nom}` // Utiliser le nom du currentUser
          });
        } else if (entrepriseData && entrepriseData.membres && entrepriseData.membres.length > 0) {
          console.warn('⚠️ ATTENTION: CurrentUser non disponible - utilisation du fallback sur les membres');
          console.warn('⚠️ Le currentUser est plus fiable car c\'est l\'utilisateur réellement connecté');
          console.log('🔍 DEBUG - Membres disponibles:', entrepriseData.membres);
          
          // Priorité 1: Chercher le gérant (utilisateur connecté)
          let createurDuCompte = entrepriseData.membres.find((membre: any) => 
            membre.role === 'GERANT' || membre.entrepriseRole === 'GERANT'
          );
          
          if (createurDuCompte) {
            console.log('✅ Gérant trouvé (utilisateur connecté):', {
              nom: `${createurDuCompte.prenom} ${createurDuCompte.nom}`,
              personId: createurDuCompte.personId,
              role: createurDuCompte.role
            });
          }
          
          // Priorité 2: Si pas de gérant, prendre le membre avec le plus de parts
          if (!createurDuCompte) {
            console.log('🔍 Pas de gérant trouvé, recherche du propriétaire principal');
            createurDuCompte = entrepriseData.membres.reduce((proprietairePrincipal: any, membre: any) => {
              const pourcentageParts = membre.pourcentageParts || 0;
              
              if (!proprietairePrincipal || pourcentageParts > (proprietairePrincipal.pourcentageParts || 0)) {
                return membre;
              }
              return proprietairePrincipal;
            }, null);
          }
          
          if (createurDuCompte && createurDuCompte.personId) {
            const logicUsed = createurDuCompte.role === 'GERANT' ? 'GÉRANT (utilisateur connecté)' : 'PROPRIÉTAIRE PRINCIPAL (plus de parts)';
            console.log(`✅ ${logicUsed} sélectionné:`, {
              nom: `${createurDuCompte.prenom} ${createurDuCompte.nom}`,
              personId: createurDuCompte.personId,
              role: createurDuCompte.role,
              pourcentageParts: createurDuCompte.pourcentageParts
            });
            
            await checkAndCreateConversation({
              id: demande.id,
              nom: demande.nom,
              userId: createurDuCompte.personId,
              userNom: `${createurDuCompte.prenom} ${createurDuCompte.nom}`
            });
          } else {
            // Priorité 2: Fallback sur le gérant si pas de correspondance exacte
            const gerant = entrepriseData.membres.find((membre: any) => 
              membre.role === 'GERANT' || membre.entrepriseRole === 'GERANT'
            );
            
            if (gerant && gerant.personId) {
              console.log('⚠️ Pas de correspondance exacte, utilisation du gérant:', gerant.personId);
              console.log('🔍 DEBUG - Gérant complet:', gerant);
              
              await checkAndCreateConversation({
                id: demande.id,
                nom: demande.nom,
                userId: gerant.personId,
                userNom: `${gerant.prenom || demande.demandeur.prenom} ${gerant.nom || demande.demandeur.nom}`
              });
          } else {
            // Priorité 3: Utiliser le premier membre en dernier recours
            const premierMembre = entrepriseData.membres[0];
            if (premierMembre && premierMembre.personId) {
              console.log('⚠️ Pas de gérant trouvé, utilisation du premier membre:', premierMembre.personId);
              
              await checkAndCreateConversation({
                id: demande.id,
                nom: demande.nom,
                userId: premierMembre.personId,
                userNom: `${premierMembre.prenom || demande.demandeur.prenom} ${premierMembre.nom || demande.demandeur.nom}`
              });
            } else {
              console.error('❌ Aucun membre avec personId trouvé');
              console.error(`Impossible de trouver le créateur de l'entreprise "${demande.nom}". Chat non disponible.`);
              return;
            }
          }
        }
      } else {
          console.error('❌ Pas de membres dans la réponse de l\'entreprise');
          console.log('🔍 Structure reçue:', entrepriseData);
          console.error('Erreur : Aucun membre trouvé pour cette entreprise.');
          return;
        }
      setChatModalOpen(true);
      resetUnreadCount(); // Réinitialiser le compteur de notifications
      
      // Note: Le compteur sera mis à jour automatiquement après que les messages 
      // soient marqués comme lus côté serveur et lors de la fermeture du chat
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ouverture du chat:', error);
      console.error('Erreur lors de l\'ouverture du chat. Veuillez réessayer.');
    }
  };
  
  const handleCloseChat = () => {
    setChatModalOpen(false);
    setChatEntreprise(null);
    
    // Rafraîchir les compteurs après fermeture du chat
    fetchUnreadCountsByEntreprise();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Statuts backend réels (StatutCreation enum)
      'EN_ATTENTE': { color: 'bg-sky-100 text-primary-800', text: 'En attente' },
      'EN_COURS': { color: 'bg-sky-100 text-primary-800', text: 'En cours' },
      'VALIDEE': { color: 'bg-sky-100 text-primary-800', text: 'Validée' },
      'REFUSEE': { color: 'bg-red-100 text-red-800', text: 'Refusée' },
      // Fallbacks pour compatibilité
      'NOUVEAU': { color: 'bg-sky-100 text-primary-800', text: 'Nouveau' },
      'SOUMIS': { color: 'bg-sky-100 text-primary-800', text: 'Soumis' },
      'VALIDE': { color: 'bg-sky-100 text-primary-800', text: 'Validé' },
      'REJETE': { color: 'bg-red-100 text-red-800', text: 'Rejeté' },
      'INCOMPLET': { color: 'bg-sky-100 text-primary-800', text: 'Incomplet' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['EN_COURS'];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-base font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };


  const handleViewDetails = (entrepriseId: string) => {
    setSelectedEntrepriseId(entrepriseId);
  };

  const handleBackFromDetails = () => {
    setSelectedEntrepriseId(null);
    // Recharger les demandes pour avoir les données à jour
    loadDemandes();
  };

  const handleStatusUpdateFromDetails = (id: string, status: string) => {
    // Recharger les demandes après mise à jour du statut
    loadDemandes();
    loadAssignedDemandes();
  };

  // Fonction pour récupérer l'ID agent depuis l'API si manquant
  const getAgentIdFromAPI = async (email: string): Promise<string | null> => {
    try {
      console.log('🔍 Tentative de récupération ID agent depuis API pour:', email);
      
      // Essayer l'endpoint /auth/me d'abord
      try {
        const response = await agentAuthAPI.getProfile();
        console.log('📊 Réponse /auth/me:', response.data);
        if (response.data?.personne_id || response.data?.id) {
          const agentId = response.data.personne_id || response.data.id;
          console.log('✅ ID agent récupéré depuis /auth/me:', agentId);
          return agentId;
        }
      } catch (authError) {
        console.warn('⚠️ /auth/me échoué:', authError);
      }
      
      // Fallback: chercher dans /persons par email
      const personsResponse = await fetch(`${API_CONFIG.BASE_URL}/persons?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (personsResponse.ok) {
        const personsData = await personsResponse.json();
        console.log('📊 Réponse /persons:', personsData);
        
        const persons = personsData?.content || personsData?.data || personsData || [];
        const agentPerson = Array.isArray(persons) ? persons.find((p: any) => p.email === email) : persons;
        
        if (agentPerson?.id) {
          console.log('✅ ID agent récupéré depuis /persons:', agentPerson.id);
          return agentPerson.id;
        }
      }
      
      console.error('❌ Impossible de récupérer l\'ID agent depuis l\'API');
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération ID agent:', error);
      return null;
    }
  };

  // Fonctions de simulation supprimées - Utilisation uniquement de l'API backend

  const handleAssignToMe = async (demandeId: string) => {
    setIsLoading(true);
    try {
      console.log('📌 Assignation de la demande:', demandeId);
      console.log('👤 Agent qui assigne:', agent?.email, 'ID:', agent?.id);
      console.log('🔍 Agent complet depuis contexte:', agent);
      
      // Vérifier les données dans localStorage
      const storedAgent = localStorage.getItem('investmali_agent');
      console.log('💾 Agent stocké dans localStorage:', storedAgent);
      if (storedAgent) {
        try {
          const parsedAgent = JSON.parse(storedAgent);
          console.log('💾 Agent parsé:', parsedAgent);
          console.log('💾 Agent parsé ID:', parsedAgent.id);
        } catch (e) {
          console.error('❌ Erreur parsing agent localStorage:', e);
        }
      }
      
      if (!agent?.id) {
        console.error('❌ ID Agent manquant - Tentative de récupération depuis localStorage');
        
        // Tentative de récupération depuis localStorage
        const storedAgent = localStorage.getItem('investmali_agent');
        let agentId = null;
        
        if (storedAgent) {
          try {
            const parsedAgent = JSON.parse(storedAgent);
            if (parsedAgent.id) {
              console.log('✅ ID Agent récupéré depuis localStorage:', parsedAgent.id);
              agentId = parsedAgent.id;
            }
          } catch (e) {
            console.error('❌ Erreur parsing agent localStorage:', e);
          }
        }
        
        // Si pas d'ID dans localStorage, essayer l'API
        if (!agentId && agent?.email) {
          console.log('🔍 Tentative de récupération depuis l\'API...');
          agentId = await getAgentIdFromAPI(agent.email);
        }
        
        if (agentId) {
          console.log('✅ ID Agent final pour assignation:', agentId);
          
          // Continuer avec l'assignation
          console.log('🔄 ASSIGNATION VIA API BACKEND avec ID récupéré...');
          await entreprisesAPI.assign(demandeId, agentId.toString());
          console.log('✅ ASSIGNATION API RÉUSSIE !');
          
          // Attendre un peu pour que la base de données se mette à jour
          console.log('⏳ Attente 3 secondes pour mise à jour DB...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Recharger les données avec logs détaillés
          console.log('🔄 Rechargement FORCÉ des demandes après assignation (avec ID récupéré)...');
          console.log(`🎯 Vérification: L'entreprise ${demandeId} devrait maintenant être assignée et EXCLUE de la liste`);
          
          await loadDemandes();
          await loadAssignedDemandes();
          
          // Vérification supplémentaire
          setTimeout(async () => {
            console.log('🔄 Vérification finale après 2 secondes supplémentaires...');
            await loadDemandes();
          }, 2000);
          
          const demandeToAssign = demandes.find(d => d.id === demandeId);
          console.log(`✅ ASSIGNATION RÉUSSIE ! Demande "${demandeToAssign?.nom || 'Inconnue'}" assignée avec succès.`);
          return;
        }
        
        console.error('❌ ERREUR: ID Agent manquant! Impossible d\'assigner.');
        return;
      }
      
      // Trouver la demande dans la liste des demandes à traiter
      const demandeToAssign = demandes.find(d => d.id === demandeId);
      if (!demandeToAssign) {
        console.error('Erreur: Demande non trouvée');
        return;
      }
      
      console.log('🔄 ASSIGNATION VIA API BACKEND...');
      
      // Appeler l'API pour l'assignation réelle
      await entreprisesAPI.assign(demandeId, agent.id.toString());
      console.log('✅ ASSIGNATION API RÉUSSIE !');
      
      // Attendre un peu pour que la base de données se mette à jour
      console.log('⏳ Attente 3 secondes pour mise à jour DB...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Recharger les données avec logs détaillés
      console.log('🔄 Rechargement FORCÉ des demandes après assignation...');
      console.log(`🎯 Vérification: L'entreprise ${demandeId} devrait maintenant être assignée et EXCLUE de la liste`);
      
      // Forcer le rechargement complet
      await loadDemandes();
      await loadAssignedDemandes();
      
      // Vérification supplémentaire
      console.log('🔍 Vérification post-assignation...');
      setTimeout(async () => {
        console.log('🔄 Vérification finale après 2 secondes supplémentaires...');
        await loadDemandes();
      }, 2000);
      
      console.log(`✅ ASSIGNATION RÉUSSIE ! Demande "${demandeToAssign.nom}" assignée avec succès.`);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'assignation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      console.error(`❌ Erreur lors de l'assignation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async (demandeId: string) => {
    setIsLoading(true);
    try {
      console.log('📌 Désassignation de la demande:', demandeId);
      console.log('👤 Agent qui désassigne:', agent?.email, 'ID:', agent?.id);
      

      // Trouver la demande dans la liste des demandes assignées
      const demandeToUnassign = assignedDemandes.find(d => d.id === demandeId);
      if (!demandeToUnassign) {
        console.error('Erreur: Demande non trouvée');
        return;
      }
      
      console.log('🔄 DÉSASSIGNATION VIA API BACKEND...');
      
      // Appeler l'API pour la désassignation réelle
      await entreprisesAPI.unassign(demandeId);
      console.log('✅ DÉSASSIGNATION API RÉUSSIE !');
      
      // Recharger les données depuis la base de données
      await loadDemandes();
      await loadAssignedDemandes();
      
      console.log(`✅ Demande "${demandeToUnassign.nom}" désassignée avec succès!`);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la désassignation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      console.error(`❌ Erreur lors de la désassignation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOUVEAU':
        return <ClockIcon className="h-5 w-5 text-primary-500" />;
      case 'EN_COURS':
        return <ClockIcon className="h-5 w-5 text-primary-500" />;
      case 'INCOMPLET':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'VALIDE':
        return <CheckCircleIcon className="h-5 w-5 text-primary-500" />;
      case 'REJETE':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600 text-sm font-medium" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return 'Nouveau';
      case 'EN_COURS': return 'En cours';
      case 'INCOMPLET': return 'Incomplet';
      case 'VALIDE': return 'Validé';
      case 'REJETE': return 'Rejeté';
      default: return status;
    }
  };

  // Si une entreprise est sélectionnée, afficher la page de détails
  if (selectedEntrepriseId) {
    return (
      <EntrepriseDetails
        entrepriseId={selectedEntrepriseId}
        onBack={handleBackFromDetails}
        onStatusUpdate={handleStatusUpdateFromDetails}
      />
    );
  }

  if (!canEdit) {
    return (
      <div className="bg-sky-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-primary-400 mr-2" />
          <p className="text-primary-800">
            Vous n'avez pas les permissions pour éditer l'étape ACCUEIL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* En-tête simplifié avec sticky conditionnel */}
      <div className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : 'relative'} bg-white border-b border-gray-200 p-4 backdrop-blur-sm transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={apiLogo} alt="API-MALI" className="w-12 h-12 drop-shadow-lg" />
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-800">Étape ACCUEIL</h2>
                {unreadCount > 0 && (
                  <span className="flex items-center space-x-1 bg-red-100 text-red-700 text-base font-semibold px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>{unreadCount} message{unreadCount > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
              <p className="text-lg text-gray-600 font-medium">Création et gestion des dossiers d'entreprise</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-base text-gray-600">{agent?.firstName} {agent?.lastName}</span>
                <span className="px-3 py-1 bg-sky-100 text-sky-700 text-base font-semibold rounded">Agent Accueil</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            
            {currentDossier && (
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-lg">
                {getStatusIcon(currentDossier.statut)}
                <div>
                  <p className="text-lg font-semibold text-gray-900">{currentDossier.reference}</p>
                  <p className="text-base text-gray-600">{getStatusText(currentDossier.statut)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Contenu principal avec padding conditionnel */}
      <div className={isScrolled ? "pt-24" : "pt-0"}>
        {/* Navigation par onglets simplifiée */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200">
          <nav className="flex space-x-6 px-4">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-4 border-b-2 text-lg font-semibold transition-colors ${
                activeTab === 'create' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <FolderPlusIcon className="h-6 w-6 mr-2" />
                Créer un dossier
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('demandes')}
              className={`py-4 px-4 border-b-2 text-lg font-semibold transition-colors ${
                activeTab === 'demandes' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <ListBulletIcon className="h-6 w-6 mr-2" />
                Demandes à traiter
                {demandes.length > 0 && (
                  <span className="ml-2 bg-sky-600 text-white text-sm px-3 py-1 rounded-full">{demandes.length}</span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-4 border-b-2 text-lg font-semibold transition-colors ${
                activeTab === 'assigned' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 mr-2" />
                Mes demandes assignées
                {assignedDemandes.length > 0 && (
                  <span className="ml-2 bg-green-600 text-white text-sm px-3 py-1 rounded-full">{assignedDemandes.length}</span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-4 border-b-2 text-lg font-semibold transition-colors ${
                activeTab === 'search' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <MagnifyingGlassIcon className="h-6 w-6 mr-2" />
                Rechercher un dossier
              </div>
            </button>
            
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-4">
          {activeTab === 'demandes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Demandes d'entreprises à traiter ({demandes.length})
                </h3>
                <button
                  onClick={loadDemandes}
                  disabled={demandesLoading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-semibold rounded-lg text-gray-700 disabled:opacity-50 transition-colors"
                >
                  {demandesLoading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>

              {demandesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald"></div>
                  <p className="mt-2 text-gray-600 text-lg font-medium">Chargement des demandes...</p>
                </div>
              ) : demandes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">Aucune demande</h3>
                  <p className="mt-1 text-base text-gray-600 font-medium">
                    Il n'y a actuellement aucune demande d'entreprise à traiter.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {demandes.map((demande) => (
                    <div key={demande.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-xl font-bold text-gray-900">{demande.nom}</h4>
                            {demande.sigle && <span className="text-lg text-gray-600 font-medium">({demande.sigle})</span>}
                            {getStatusBadge(demande.statut)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3 text-lg">
                            <div>
                              <p className="text-gray-600 text-base font-medium">Forme juridique</p>
                              <p className="font-semibold text-gray-900">{demande.formeJuridique}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-base font-medium">Type</p>
                              <p className="font-semibold text-gray-900">{demande.typeEntreprise}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-base font-medium">Demandeur</p>
                              <p className="font-semibold text-gray-900">{demande.demandeur.prenom} {demande.demandeur.nom}</p>
                              <p className="text-gray-600 text-base">{demande.demandeur.email}</p>
                            </div>
                          </div>
                          
                          {/* Afficher le motif de rejet si l'entreprise a été rejetée */}
                          {demande.motifRejet && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Motif de rejet :</p>
                                  <p className="text-sm text-red-700 mt-1">{demande.motifRejet}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Soumise le {formatDate(demande.dateCreation)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-1.5 ml-4">
                          <button onClick={() => handleViewReceipt(demande)}
                            className="px-6 py-3 text-base font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5" />
                            Voir le reçu
                          </button>
                          <button onClick={() => handleAssignToMe(demande.id)} disabled={isLoading}
                            className="px-6 py-3 text-base font-medium rounded-lg text-white disabled:opacity-50" style={{backgroundColor: '#2d85c9'}} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563a3'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d85c9'}>
                            Assigner
                          </button>
                          <button onClick={() => handleDemandeAction(demande.id, 'reject')} disabled={isLoading}
                            className="px-6 py-3 text-base font-medium rounded-lg text-white disabled:opacity-50" style={{backgroundColor: '#2d85c9'}} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563a3'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d85c9'}>
                            Rejeter
                          </button>
                          <button onClick={() => handleViewDetails(demande.id)}
                            className="px-6 py-3 text-base font-medium rounded-lg text-white" style={{backgroundColor: '#2d85c9'}} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563a3'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d85c9'}>
                            Détails
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assigned' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Mes demandes assignées ({assignedDemandes.length})
                </h3>
                <button
                  onClick={loadAssignedDemandes}
                  disabled={assignedLoading}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded-lg text-gray-700 disabled:opacity-50 transition-colors"
                >
                  {assignedLoading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>

              {assignedLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                  <p className="mt-2 text-gray-600 text-sm font-medium">Chargement des demandes assignées...</p>
                </div>
              ) : assignedDemandes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune demande assignée</h3>
                  <p className="mt-1 text-lg text-gray-600 text-lg font-medium">
                    Assignez-vous des demandes depuis l'onglet "Demandes à traiter".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedDemandes.map((demande) => (
                    <div key={demande.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{demande.nom}</h4>
                            {demande.sigle && <span className="text-sm text-gray-600 text-sm font-medium">({demande.sigle})</span>}
                            {getStatusBadge(demande.statut)}
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">Assignée</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3 text-base">
                            <div>
                              <p className="text-gray-600 text-sm font-medium">Forme juridique</p>
                              <p className="font-semibold text-gray-900">{demande.formeJuridique}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm font-medium">Type</p>
                              <p className="font-semibold text-gray-900">{demande.typeEntreprise}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm font-medium">Demandeur</p>
                              <p className="font-semibold text-gray-900">{demande.demandeur?.prenom || 'Prénom'} {demande.demandeur?.nom || 'Nom'}</p>
                              <p className="text-gray-600 text-sm font-medium text-xs">{demande.demandeur?.email || 'Email non spécifié'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Soumise le {formatDate(demande.dateCreation)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-1.5 ml-4">
                          <button onClick={() => handleViewReceipt(demande)}
                            className="px-6 py-3 text-base font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5" />
                            Voir le reçu
                          </button>
                          <button onClick={() => handleOpenChat(demande)}
                            className="relative px-6 py-3 text-base font-medium rounded-lg text-white" style={{backgroundColor: '#2d85c9'}} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563a3'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d85c9'}>
                            Contacter
                            {unreadCountsByEntreprise[demande.id] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                                {unreadCountsByEntreprise[demande.id]}
                              </span>
                            )}
                          </button>
                          <button onClick={() => handleDemandeAction(demande.id, 'accept')} disabled={isLoading}
                            className="px-6 py-3 text-base font-medium rounded-lg text-white disabled:opacity-50" style={{backgroundColor: '#2d85c9'}} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563a3'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d85c9'}>
                            {paiementStatusByEntreprise[demande.id] ? 'Valider → Révision' : 'Valider → Régisseur'}
                          </button>
                          <button onClick={() => handleUnassign(demande.id)} disabled={isLoading}
                            className="px-6 py-3 text-base font-medium rounded-lg text-white disabled:opacity-50" style={{backgroundColor: '#2d85c9'}} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563a3'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d85c9'}>
                            Désassigner
                          </button>
                          <button onClick={() => handleViewDetails(demande.id)}
                            className="px-6 py-3 text-base font-medium rounded-lg text-white" style={{backgroundColor: '#2d85c9'}} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563a3'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d85c9'}>
                            Détails
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <DossierSearch onDossierSelected={handleDossierSelected} />
          )}
          
          {activeTab === 'create' && (
            <DossierCreationForm 
              onDossierCreated={handleDossierCreated}
              onClose={() => {
                setCurrentDossier(null);
                setActiveTab('demandes');
              }}
            />
          )}
        </div>
      </div>
      </div>
      
      {/* Modal de chat */}
      {chatModalOpen && chatEntreprise && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={handleCloseChat}
          entrepriseId={chatEntreprise.id}
          entrepriseNom={chatEntreprise.nom}
          userId={chatEntreprise.userId}
          userNom={chatEntreprise.userNom}
          conversationId={chatEntreprise.conversationId}
          onMessagesMarkedRead={fetchUnreadCountsByEntreprise} // Rafraîchir les compteurs immédiatement
        />
      )}

      {/* Modal de paiement agent */}
      {paiementModalOpen && paiementEntreprise && (
        <PaymentMethodModal
          isOpen={paiementModalOpen}
          onClose={() => setPaiementModalOpen(false)}
          entreprise={paiementEntreprise}
          onPaiementComplete={handlePaiementComplete}
        />
      )}

      {/* Modal du reçu */}
      {receiptModalOpen && receiptData && (
        <PaymentReceipt
          paymentData={receiptData}
          onClose={() => setReceiptModalOpen(false)}
        />
      )}

    </>
  );
};

export default AccueilStep;
























