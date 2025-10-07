import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import DossierCreationForm from './DossierCreationForm';
import DocumentsChecklist from './DocumentsChecklist';
import DossierSearch from './DossierSearch';
import EntrepriseDetails from './EntrepriseDetails';
import ChatModal from './ChatModal';
import { agentBusinessAPI, entreprisesAPI, agentAuthAPI } from '../services/api';
import { Dossier, DemandeEntreprise } from '../types';
import { useAgentNotifications } from '../hooks/useAgentNotifications';
import { 
  FolderPlusIcon, 
  DocumentCheckIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon,
  EyeIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

// Les interfaces sont maintenant importées depuis ../types

interface AccueilStepProps {
  dossier?: Dossier;
  onDossierUpdate?: (dossier: Dossier) => void;
}

const AccueilStep: React.FC<AccueilStepProps> = ({ dossier, onDossierUpdate }) => {
  const { agent, canEditStep } = useAgentAuth();
  const [activeTab, setActiveTab] = useState<'demandes' | 'assigned' | 'search' | 'create' | 'documents'>('demandes');
  const [currentDossier, setCurrentDossier] = useState<Dossier | null>(dossier || null);
  const [isLoading, setIsLoading] = useState(false);
  const [demandes, setDemandes] = useState<DemandeEntreprise[]>([]);
  const [demandesLoading, setDemandesLoading] = useState(false);
  const [assignedDemandes, setAssignedDemandes] = useState<DemandeEntreprise[]>([]);
  
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string | null>(null);
  
  // États pour le chat
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatEntreprise, setChatEntreprise] = useState<{
    id: string;
    nom: string;
    userId: string;
    userNom: string;
  } | null>(null);

  // Hook pour les notifications
  const { unreadCount, resetUnreadCount } = useAgentNotifications();

  const canEdit = canEditStep('ACCUEIL');

  useEffect(() => {
    if (dossier) {
      setCurrentDossier(dossier);
      setActiveTab('documents');
    }
  }, [dossier]);

  // Charger les demandes d'entreprises directement depuis la base de données
  useEffect(() => {
    console.log('🚀 Chargement des données depuis la base de données uniquement');
    loadDemandes();
    loadAssignedDemandes();
  }, []);

  const loadDemandes = async () => {
    setDemandesLoading(true);
    try {
      console.log('🚀 Chargement des demandes non assignées depuis la base de données');
      console.log('👤 Agent connecté:', agent?.email);
      
      // FALLBACK: Utiliser /entreprises avec filtrage robuste
      // (car /unassigned retourne une erreur 500)
      console.log('🔄 Utilisation de /entreprises avec filtrage anti-conflit...');
      
      let response;
      let allEntreprises: any[] = [];
      
      try {
        // Essayer d'abord /unassigned
        console.log('🔄 Tentative /unassigned...');
        response = await entreprisesAPI.unassigned({
          etape: 'ACCUEIL',
          page: 0,
          size: 100,
          sort: 'creation,desc'
        });
        
        const pageData = response.data;
        allEntreprises = pageData?.content || pageData?.data || pageData?.rows || pageData || [];
        console.log('✅ /unassigned fonctionne - Entreprises reçues:', allEntreprises.length);
        
      } catch (error) {
        console.warn('⚠️ /unassigned échoue (erreur 500), utilisation de /entreprises avec filtrage...');
        
        // Fallback sur /entreprises
        response = await entreprisesAPI.list({
          page: 0,
          size: 100,
          sort: 'creation,desc'
        });
        
        const pageData = response.data;
        const toutes = pageData?.content || pageData?.data || pageData?.rows || pageData || [];
        
        console.log('📊 Total entreprises dans /entreprises:', toutes.length);
        
        // Filtrage STRICT pour éliminer les entreprises assignées
        console.log('🔍 DIAGNOSTIC COMPLET - Vérification de la colonne assigned_to:');
        
        allEntreprises = toutes.filter((entreprise: any) => {
          const etapeValidation = entreprise.etapeValidation;
          const assignedTo = entreprise.assignedTo;
          
          // DIAGNOSTIC ULTRA DÉTAILLÉ pour chaque entreprise
          console.log(`\n🔍 ENTREPRISE: "${entreprise.nom}" (ID: ${entreprise.id})`);
          console.log('   - etapeValidation:', etapeValidation);
          console.log('   - assignedTo (brut):', assignedTo);
          console.log('   - assignedTo type:', typeof assignedTo);
          console.log('   - assignedTo === null:', assignedTo === null);
          console.log('   - assignedTo === undefined:', assignedTo === undefined);
          console.log('   - JSON.stringify(assignedTo):', JSON.stringify(assignedTo));
          
          // Vérifier TOUS les champs possibles liés à l'assignation
          console.log('   - Autres champs possibles:');
          console.log('     * assigned_to:', entreprise.assigned_to);
          console.log('     * assignedToId:', entreprise.assignedToId);
          console.log('     * agent:', entreprise.agent);
          console.log('     * agentId:', entreprise.agentId);
          
          // Condition 1: Être à l'étape ACCUEIL
          const isAccueilStep = etapeValidation === 'ACCUEIL' || !etapeValidation;
          
          // Condition 2: NE PAS être assignée (ULTRA STRICT)
          // Vérifier TOUTES les possibilités d'assignation
          let isAssigned = false;
          
          if (assignedTo !== null && assignedTo !== undefined) {
            isAssigned = true;
            console.log('   → ASSIGNÉE via assignedTo');
          } else if (entreprise.assigned_to !== null && entreprise.assigned_to !== undefined) {
            isAssigned = true;
            console.log('   → ASSIGNÉE via assigned_to');
          } else if (entreprise.assignedToId) {
            isAssigned = true;
            console.log('   → ASSIGNÉE via assignedToId');
          } else if (entreprise.agent || entreprise.agentId) {
            isAssigned = true;
            console.log('   → ASSIGNÉE via agent/agentId');
          } else {
            console.log('   → NON ASSIGNÉE');
          }
          
          const isNotAssigned = !isAssigned;
          const inclure = isAccueilStep && isNotAssigned;
          
          console.log(`   → RÉSULTAT: ${inclure ? '✅ INCLUS' : '❌ EXCLU'} (isAccueilStep: ${isAccueilStep}, isNotAssigned: ${isNotAssigned})`);
          
          return inclure;
        });
        
        console.log(`✅ Filtrage terminé: ${allEntreprises.length} entreprises non assignées sur ${toutes.length} total`);
      }
      
      console.log(`📊 Entreprises finales à traiter: ${allEntreprises.length}`);
      
      // Vérification de sécurité finale
      console.log('🔍 Vérification finale des entreprises...');
      allEntreprises.forEach((entreprise: any) => {
        const assignedTo = entreprise.assignedTo;
        if (assignedTo !== null && assignedTo !== undefined) {
          console.error(`🚨 PROBLÈME: Entreprise assignée détectée: "${entreprise.nom}"`, {
            id: entreprise.id,
            assignedTo: assignedTo
          });
        }
      });
      
      // Utiliser les entreprises filtrées
      const entreprises = allEntreprises;
      
      console.log(`✅ Résultat final: ${entreprises.length} entreprises à traiter`);
      
      // Mapper vers le format DemandeEntreprise
      const demandesFormatted: DemandeEntreprise[] = entreprises.map((entreprise: any) => {
        const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.entrepriseRole === 'GERANT');
        const gerantPersonne = gerant?.personne || gerant;
        
        return {
          id: entreprise.id,
          nom: entreprise.nom || 'Entreprise sans nom',
          sigle: entreprise.sigle || '',
          formeJuridique: entreprise.formeJuridique || 'Non spécifiée',
          typeEntreprise: entreprise.typeEntreprise || entreprise.domaineActivite || 'Non spécifié',
          statut: entreprise.statutCreation || 'EN_COURS',
          dateCreation: entreprise.creation || entreprise.dateCreation || new Date().toISOString(),
          demandeur: {
            nom: gerantPersonne?.nom || 'Nom inconnu',
            prenom: gerantPersonne?.prenom || 'Prénom inconnu',
            email: gerantPersonne?.email || 'Email inconnu',
            telephone: gerantPersonne?.telephone1 || gerantPersonne?.telephone || 'Téléphone inconnu'
          },
          division: entreprise.division?.nom || entreprise.localisation || '',
          antenne: entreprise.antenne || '',
          etapeActuelle: entreprise.etapeValidation || 'ACCUEIL'
        };
      });
      
      console.log('✅ Demandes non assignées formatées:', demandesFormatted.length);
      setDemandes(demandesFormatted);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des demandes:', error);
      setDemandes([]);
    } finally {
      setDemandesLoading(false);
    }
  };

  const loadAssignedDemandes = async () => {
    setAssignedLoading(true);
    try {
      console.log('🔄 Chargement des demandes assignées depuis la BASE DE DONNÉES...');
      console.log('👤 Agent connecté:', agent?.email, 'ID:', agent?.id);
      
      if (!agent?.id) {
        console.warn('⚠️ ID Agent manquant, tentative de récupération...');
        
        // Essayer de récupérer l'ID depuis localStorage ou API
        let agentId = null;
        
        // Vérifier localStorage
        const storedAgent = localStorage.getItem('investmali_agent');
        if (storedAgent) {
          try {
            const parsedAgent = JSON.parse(storedAgent);
            if (parsedAgent.id) {
              agentId = parsedAgent.id;
              console.log('✅ ID Agent récupéré depuis localStorage pour loadAssignedDemandes:', agentId);
            }
          } catch (e) {
            console.error('❌ Erreur parsing localStorage:', e);
          }
        }
        
        // Si pas d'ID dans localStorage, essayer l'API
        if (!agentId && agent?.email) {
          console.log('🔍 Tentative de récupération ID depuis API pour loadAssignedDemandes...');
          agentId = await getAgentIdFromAPI(agent.email);
          
          // Si on récupère l'ID depuis l'API, mettre à jour le localStorage et le contexte
          if (agentId) {
            console.log('💾 Mise à jour du localStorage et contexte avec l\'ID récupéré:', agentId);
            
            // Mettre à jour localStorage
            const updatedAgent = { ...agent, id: agentId };
            localStorage.setItem('investmali_agent', JSON.stringify(updatedAgent));
            
            // Mettre à jour le contexte si possible (via useAgentAuth)
            // Note: Ceci nécessitera peut-être une fonction updateAgent dans le contexte
            console.log('✅ Agent mis à jour avec ID:', updatedAgent);
          }
        }
        
        if (!agentId) {
          console.warn('⚠️ Impossible de récupérer l\'ID Agent, aucune demande assignée ne peut être chargée');
          setAssignedDemandes([]);
          return;
        }
        
        // Utiliser l'ID récupéré pour charger les demandes assignées
        console.log('✅ Utilisation de l\'ID récupéré pour charger les demandes:', agentId);
        
        try {
          // Utiliser l'API assignedToMe avec l'ID récupéré
          const response = await entreprisesAPI.assignedToMe({
            page: 0,
            size: 100,
            sort: 'creation,desc'
          });
          
          console.log('📊 Réponse assignedToMe avec ID récupéré:', response.data);
          const assignedData = response.data;
          const assignedEntreprises = assignedData?.content || assignedData?.data || assignedData?.rows || assignedData || [];
          
          console.log('✅ Entreprises assignées trouvées avec ID récupéré:', assignedEntreprises.length);
          
          // Mapper vers le format DemandeEntreprise
          const demandesFormatted: DemandeEntreprise[] = assignedEntreprises.map((entreprise: any) => {
            const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.entrepriseRole === 'GERANT');
            const gerantPersonne = gerant?.personne || gerant;
            
            return {
              id: entreprise.id,
              nom: entreprise.nom || 'Entreprise sans nom',
              sigle: entreprise.sigle || '',
              formeJuridique: entreprise.formeJuridique || 'Non spécifiée',
              typeEntreprise: entreprise.typeEntreprise || entreprise.domaineActivite || 'Non spécifié',
              statut: entreprise.statutCreation || 'EN_COURS',
              dateCreation: entreprise.creation || entreprise.dateCreation || new Date().toISOString(),
              demandeur: {
                nom: gerantPersonne?.nom || 'Nom inconnu',
                prenom: gerantPersonne?.prenom || 'Prénom inconnu',
                email: gerantPersonne?.email || 'Email inconnu',
                telephone: gerantPersonne?.telephone1 || gerantPersonne?.telephone || 'Téléphone inconnu'
              },
              division: entreprise.division?.nom || entreprise.localisation || '',
              antenne: entreprise.antenne || '',
              etapeActuelle: entreprise.etapeValidation || 'ACCUEIL'
            };
          });
          
          console.log('✅ Demandes assignées formatées avec ID récupéré:', demandesFormatted.length);
          setAssignedDemandes(demandesFormatted);
          return;
        } catch (error) {
          console.error('❌ Erreur lors du chargement avec ID récupéré:', error);
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
      
      console.log('📊 Réponse assignedToMe:', response.data);
      const assignedData = response.data;
      const assignedEntreprises = assignedData?.content || assignedData?.data || assignedData?.rows || assignedData || [];
      
      console.log('✅ Entreprises assignées trouvées:', assignedEntreprises.length);
      
      // Mapper vers le format DemandeEntreprise
      const demandesFormatted: DemandeEntreprise[] = assignedEntreprises.map((entreprise: any) => {
        const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.entrepriseRole === 'GERANT');
        const gerantPersonne = gerant?.personne || gerant;
        
        return {
          id: entreprise.id,
          nom: entreprise.nom || 'Entreprise sans nom',
          sigle: entreprise.sigle || '',
          formeJuridique: entreprise.formeJuridique || 'Non spécifiée',
          typeEntreprise: entreprise.typeEntreprise || entreprise.domaineActivite || 'Non spécifié',
          statut: entreprise.statutCreation || 'EN_COURS',
          dateCreation: entreprise.creation || entreprise.dateCreation || new Date().toISOString(),
          demandeur: {
            nom: gerantPersonne?.nom || 'Nom inconnu',
            prenom: gerantPersonne?.prenom || 'Prénom inconnu',
            email: gerantPersonne?.email || 'Email inconnu',
            telephone: gerantPersonne?.telephone1 || gerantPersonne?.telephone || 'Téléphone inconnu'
          },
          division: entreprise.division?.nom || entreprise.localisation || '',
          antenne: entreprise.antenne || '',
          etapeActuelle: entreprise.etapeValidation || 'ACCUEIL'
        };
      });
      
      console.log('✅ Demandes assignées formatées:', demandesFormatted.length);
      setAssignedDemandes(demandesFormatted);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des demandes assignées:', error);
      setAssignedDemandes([]);
    } finally {
      setAssignedLoading(false);
    }
  };

  const handleDossierCreated = (newDossier: Dossier) => {
    setCurrentDossier(newDossier);
    setActiveTab('documents');
    onDossierUpdate?.(newDossier);
  };

  const handleDossierSelected = (selectedDossier: Dossier) => {
    setCurrentDossier(selectedDossier);
    setActiveTab('documents');
    onDossierUpdate?.(selectedDossier);
  };

  const handleDemandeAction = async (demandeId: string, action: 'accept' | 'reject' | 'request_info') => {
    try {
      setIsLoading(true);
      
      // Trouver la demande dans les demandes assignées
      const demande = assignedDemandes.find(d => d.id === demandeId);
      if (!demande) {
        alert('Erreur: Demande non trouvée');
        return;
      }
      
      let newStatus = '';
      let newEtape = '';
      let note = '';
      
      switch (action) {
        case 'accept':
          newStatus = 'VALIDE';
          newEtape = 'REGISSEUR';
          note = 'Demande validée par l\'agent d\'accueil et transférée au régisseur';
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
      
      console.log(`📋 Action ${action} sur demande ${demandeId}:`);
      console.log(`   - Nouveau statut: ${newStatus}`);
      console.log(`   - Nouvelle étape: ${newEtape}`);
      console.log(`   - Note: ${note}`);
      
      // Mettre à jour via l'API backend
      await entreprisesAPI.updateStatus(demandeId, newStatus, note);
      
      if (action === 'accept') {
        // Si accepté, désassigner pour que ça passe au régisseur
        await entreprisesAPI.unassign(demandeId);
        alert(`✅ Demande "${demande.nom}" validée et transférée au régisseur avec succès!`);
      } else {
        alert(`✅ Demande "${demande.nom}" ${action === 'reject' ? 'rejetée' : 'marquée comme incomplète'} avec succès!`);
      }
      
      // Recharger les données depuis la base de données
      await loadAssignedDemandes();
      await loadDemandes();
      
      console.log('✅ Action terminée avec succès');
      
    } catch (error) {
      console.error('Erreur lors du traitement de la demande:', error);
      alert('Erreur lors du traitement de la demande. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ouvrir le chat avec un utilisateur
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
        alert('Erreur : Vous devez être connecté pour ouvrir le chat');
        return;
      }
      
      console.log('✅ Agent ID récupéré depuis le contexte:', agentId);
      console.log('✅ Agent nom:', agentNom);
      
      // Récupérer l'ID du créateur de l'entreprise (gérant)
      console.log('🔍 Recherche du créateur de l\'entreprise:', demande.nom);
      
      try {
        // Appeler l'API pour récupérer les détails de l'entreprise avec les membres
        const entrepriseResponse = await fetch(`http://localhost:8080/api/v1/entreprises/${demande.id}`);
        
        if (!entrepriseResponse.ok) {
          throw new Error(`HTTP ${entrepriseResponse.status}: ${entrepriseResponse.statusText}`);
        }
        
        const entrepriseData = await entrepriseResponse.json();
        console.log('🔍 Réponse API entreprise:', entrepriseData);
        
        if (entrepriseData && entrepriseData.membres && entrepriseData.membres.length > 0) {
          // Chercher le gérant dans les membres (c'est généralement le créateur)
          const gerant = entrepriseData.membres.find((membre: any) => 
            membre.role === 'GERANT' || membre.entrepriseRole === 'GERANT'
          );
          
          if (gerant && gerant.personId) {
            console.log('✅ ID gérant trouvé:', gerant.personId);
            console.log('🔍 DEBUG - Gérant complet:', gerant);
            console.log('🔍 DEBUG - Entreprise ID:', demande.id);
            
            setChatEntreprise({
              id: demande.id,
              nom: demande.nom,
              userId: gerant.personId, // Utiliser l'ID du gérant (créateur)
              userNom: `${gerant.prenom || demande.demandeur.prenom} ${gerant.nom || demande.demandeur.nom}`
            });
          } else {
            // Si pas de gérant spécifique, utiliser le premier membre
            const premierMembre = entrepriseData.membres[0];
            if (premierMembre && premierMembre.personId) {
              console.log('⚠️ Pas de gérant trouvé, utilisation du premier membre:', premierMembre.personId);
              
              setChatEntreprise({
                id: demande.id,
                nom: demande.nom,
                userId: premierMembre.personId,
                userNom: `${premierMembre.prenom || demande.demandeur.prenom} ${premierMembre.nom || demande.demandeur.nom}`
              });
            } else {
              console.error('❌ Aucun membre avec personId trouvé');
              alert(`Impossible de trouver le créateur de l'entreprise "${demande.nom}". Chat non disponible.`);
              return;
            }
          }
        } else {
          console.error('❌ Pas de membres dans la réponse de l\'entreprise');
          console.log('🔍 Structure reçue:', entrepriseData);
          alert('Erreur : Aucun membre trouvé pour cette entreprise.');
          return;
        }
      } catch (error: any) {
        console.error('❌ Erreur API entreprise:', error);
        alert(`Erreur de connexion : ${error.message || error}`);
        return;
      }
      setChatModalOpen(true);
      resetUnreadCount(); // Réinitialiser le compteur de notifications
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ouverture du chat:', error);
      alert('Erreur lors de l\'ouverture du chat. Veuillez réessayer.');
    }
  };
  
  const handleCloseChat = () => {
    setChatModalOpen(false);
    setChatEntreprise(null);
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
      'EN_ATTENTE': { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      'EN_COURS': { color: 'bg-blue-100 text-blue-800', text: 'En cours' },
      'VALIDEE': { color: 'bg-green-100 text-green-800', text: 'Validée' },
      'REFUSEE': { color: 'bg-red-100 text-red-800', text: 'Refusée' },
      // Fallbacks pour compatibilité
      'NOUVEAU': { color: 'bg-blue-100 text-blue-800', text: 'Nouveau' },
      'SOUMIS': { color: 'bg-purple-100 text-purple-800', text: 'Soumis' },
      'VALIDE': { color: 'bg-green-100 text-green-800', text: 'Validé' },
      'REJETE': { color: 'bg-red-100 text-red-800', text: 'Rejeté' },
      'INCOMPLET': { color: 'bg-orange-100 text-orange-800', text: 'Incomplet' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['EN_COURS'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleDocumentsUpdated = (updatedDossier: Dossier) => {
    setCurrentDossier(updatedDossier);
    onDossierUpdate?.(updatedDossier);
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
      const personsResponse = await fetch(`http://localhost:8080/api/v1/persons?email=${encodeURIComponent(email)}`, {
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
          alert(`✅ ASSIGNATION RÉUSSIE !\nDemande "${demandeToAssign?.nom || 'Inconnue'}" assignée avec succès.\nVérifiez dans "Mes demandes assignées".`);
          return;
        }
        
        alert('❌ ERREUR: ID Agent manquant!\nImpossible d\'assigner.\nVeuillez vous reconnecter.');
        return;
      }
      
      // Trouver la demande dans la liste des demandes à traiter
      const demandeToAssign = demandes.find(d => d.id === demandeId);
      if (!demandeToAssign) {
        alert('Erreur: Demande non trouvée');
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
      
      alert(`✅ ASSIGNATION RÉUSSIE !\nDemande "${demandeToAssign.nom}" assignée avec succès.\nVérifiez dans "Mes demandes assignées".`);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'assignation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      alert(`❌ Erreur lors de l'assignation:\n${errorMessage}`);
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
        alert('Erreur: Demande non trouvée');
        return;
      }
      
      console.log('🔄 DÉSASSIGNATION VIA API BACKEND...');
      
      // Appeler l'API pour la désassignation réelle
      await entreprisesAPI.unassign(demandeId);
      console.log('✅ DÉSASSIGNATION API RÉUSSIE !');
      
      // Recharger les données depuis la base de données
      await loadDemandes();
      await loadAssignedDemandes();
      
      alert(`✅ Demande "${demandeToUnassign.nom}" désassignée avec succès!`);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la désassignation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      alert(`❌ Erreur lors de la désassignation:\n${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOUVEAU':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'EN_COURS':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'INCOMPLET':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'VALIDE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJETE':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
          <p className="text-yellow-800">
            Vous n'avez pas les permissions pour éditer l'étape ACCUEIL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Étape ACCUEIL</h2>
              {unreadCount > 0 && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 text-sm font-medium">
                    {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message{unreadCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Création et gestion des dossiers d'entreprise - Agent: {agent?.firstName} {agent?.lastName}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  console.log('🔄 Rechargement des vraies données depuis la base de données...');
                  loadDemandes();
                  loadAssignedDemandes();
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                title="Recharger les données depuis la base de données"
              >
                🔄 Actualiser
              </button>
              <button
                onClick={async () => {
                  // Test de l'API d'assignation
                  console.log('🧪 TEST API D\'ASSIGNATION...');
                  console.log('👤 Agent connecté:', agent?.email, 'ID:', agent?.id);
                  
                  if (demandes.length === 0) {
                    alert('❌ Aucune demande disponible pour tester l\'assignation');
                    return;
                  }
                  
                  const testDemande = demandes[0];
                  console.log('📋 Test avec demande:', testDemande.id, testDemande.nom);
                  
                  try {
                    const response = await entreprisesAPI.assign(testDemande.id, agent?.id?.toString());
                    console.log('✅ TEST API RÉUSSI:', response);
                    alert(`✅ TEST API RÉUSSI !\nDemande "${testDemande.nom}" assignée.\nStatus: ${response.status}`);
                    
                    // Recharger les données
                    loadDemandes();
                    loadAssignedDemandes();
                  } catch (error: any) {
                    console.error('❌ TEST API ÉCHOUÉ:', error);
                    alert(`❌ TEST API ÉCHOUÉ !\nErreur: ${error.response?.data?.message || error.message}`);
                  }
                }}
                className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
                title="Tester l'API d'assignation"
              >
                🧪 Test API Assign
              </button>
              <button
                onClick={async () => {
                  // Vérifier l'état des assignations dans la DB
                  console.log('🔍 VÉRIFICATION ÉTAT DB...');
                  try {
                    const response = await entreprisesAPI.list({ page: 0, size: 10 });
                    const entreprises = response.data?.content || response.data?.data || response.data?.rows || response.data || [];
                    
                    console.log('📊 Entreprises dans la DB:', entreprises.length);
                    entreprises.forEach((entreprise: any, index: number) => {
                      console.log(`🏢 ${index + 1}. ${entreprise.nom}:`, {
                        id: entreprise.id,
                        assignedTo: entreprise.assignedTo,
                        assigned_to: entreprise.assigned_to,
                        agentId: entreprise.agentId,
                        agent_id: entreprise.agent_id,
                        etapeActuelle: entreprise.etapeActuelle || entreprise.etape_actuelle,
                        etapeValidation: entreprise.etapeValidation || entreprise.etape_validation
                      });
                    });
                    
                    const assignedCount = entreprises.filter((e: any) => 
                      e.assignedTo || e.assigned_to || e.agentId || e.agent_id
                    ).length;
                    
                    alert(`📊 ÉTAT DB:\n- Total entreprises: ${entreprises.length}\n- Assignées: ${assignedCount}\n- Voir console pour détails`);
                    
                  } catch (error) {
                    console.error('❌ Erreur vérification DB:', error);
                    alert('❌ Erreur lors de la vérification de la DB');
                  }
                }}
                className="bg-cyan-500 text-white px-3 py-1 rounded text-xs hover:bg-cyan-600"
                title="Vérifier l'état des assignations dans la base de données"
              >
                🔍 État DB
              </button>
              <button
                onClick={async () => {
                  // Diagnostic complet après assignation
                  console.log('🔍 DIAGNOSTIC COMPLET ASSIGNATION...');
                  
                  if (demandes.length === 0) {
                    alert('❌ Aucune demande disponible pour le diagnostic');
                    return;
                  }
                  
                  const testDemande = demandes[0];
                  console.log('📋 Test avec demande:', testDemande.id, testDemande.nom);
                  
                  try {
                    // 1. État AVANT assignation
                    console.log('📊 AVANT ASSIGNATION:');
                    const beforeResponse = await entreprisesAPI.list({ page: 0, size: 5 });
                    const beforeEntreprises = beforeResponse.data?.content || beforeResponse.data?.data || beforeResponse.data?.rows || beforeResponse.data || [];
                    const beforeEntreprise = beforeEntreprises.find((e: any) => e.id === testDemande.id);
                    console.log('🔍 Entreprise AVANT:', beforeEntreprise);
                    
                    // 2. Assignation
                    console.log('🔄 ASSIGNATION...');
                    const assignResponse = await entreprisesAPI.assign(testDemande.id, agent?.id?.toString());
                    console.log('✅ Assignation réussie:', assignResponse.status);
                    
                    // 3. Attendre et vérifier APRÈS
                    console.log('⏳ Attente 3 secondes...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    console.log('📊 APRÈS ASSIGNATION:');
                    const afterResponse = await entreprisesAPI.list({ page: 0, size: 5 });
                    const afterEntreprises = afterResponse.data?.content || afterResponse.data?.data || afterResponse.data?.rows || afterResponse.data || [];
                    const afterEntreprise = afterEntreprises.find((e: any) => e.id === testDemande.id);
                    console.log('🔍 Entreprise APRÈS:', afterEntreprise);
                    
                    // 4. Comparaison détaillée
                    console.log('🔍 COMPARAISON AVANT/APRÈS:');
                    const allKeys = new Set([...Object.keys(beforeEntreprise || {}), ...Object.keys(afterEntreprise || {})]);
                    const changes = [];
                    
                    allKeys.forEach(key => {
                      const before = beforeEntreprise?.[key];
                      const after = afterEntreprise?.[key];
                      if (before !== after) {
                        changes.push({ key, before, after });
                        console.log(`🔄 ${key}: "${before}" → "${after}"`);
                      }
                    });
                    
                    if (changes.length === 0) {
                      console.log('⚠️ AUCUN CHANGEMENT DÉTECTÉ dans la structure');
                    } else {
                      console.log('✅ CHANGEMENTS DÉTECTÉS:', changes.length);
                    }
                    
                    alert(`🔍 DIAGNOSTIC TERMINÉ\n- Changements détectés: ${changes.length}\n- Voir console pour détails complets`);
                    
                  } catch (error: any) {
                    console.error('❌ Erreur diagnostic:', error);
                    alert(`❌ Erreur diagnostic: ${error.message}`);
                  }
                }}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
                title="Diagnostic complet de l'assignation"
              >
                🔍 Diagnostic Assign
              </button>
              <button
                onClick={async () => {
                  // Forcer le rechargement et voir les assignations
                  console.log('🔄 RECHARGEMENT FORCÉ AVEC LOGS...');
                  console.log('👤 Agent actuel:', {
                    id: agent?.id,
                    email: agent?.email,
                    firstName: agent?.firstName,
                    lastName: agent?.lastName
                  });
                  
                  try {
                    // Recharger les demandes assignées avec logs détaillés
                    await loadAssignedDemandes();
                    
                    // Vérifier aussi l'API assignedToMe
                    console.log('🔍 Test API assignedToMe...');
                    const assignedResponse = await entreprisesAPI.assignedToMe({
                      size: 10,
                      sort: 'dateCreation,desc'
                    });
                    console.log('📊 Réponse assignedToMe:', assignedResponse.data);
                    
                    alert('🔄 Rechargement terminé!\nVérifiez la console pour les logs détaillés.');
                    
                  } catch (error) {
                    console.error('❌ Erreur rechargement:', error);
                    alert('❌ Erreur lors du rechargement');
                  }
                }}
                className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                title="Forcer le rechargement avec logs détaillés"
              >
                🔄 Force Reload
              </button>
              <button
                onClick={() => {
                  // Vérifier l'état de l'agent connecté
                  console.log('🔍 VÉRIFICATION AGENT CONNECTÉ...');
                  console.log('👤 Agent complet:', agent);
                  console.log('🆔 Agent ID:', agent?.id, 'Type:', typeof agent?.id);
                  console.log('📧 Agent Email:', agent?.email);
                  console.log('👤 Agent Nom:', agent?.firstName, agent?.lastName);
                  console.log('🎭 Agent Role:', agent?.role);
                  
                  // Vérifier localStorage
                  const storedAgent = localStorage.getItem('investmali_agent');
                  console.log('💾 Agent localStorage:', storedAgent);
                  if (storedAgent) {
                    try {
                      const parsedAgent = JSON.parse(storedAgent);
                      console.log('📦 Agent parsé:', parsedAgent);
                    } catch (error) {
                      console.error('❌ Erreur parsing agent:', error);
                    }
                  }
                  
                  const hasId = !!agent?.id;
                  const hasEmail = !!agent?.email;
                  
                  alert(`🔍 ÉTAT AGENT:\n- ID: ${agent?.id || 'MANQUANT'}\n- Email: ${agent?.email || 'MANQUANT'}\n- Nom: ${agent?.firstName} ${agent?.lastName}\n- Role: ${agent?.role}\n- ID valide: ${hasId ? 'OUI' : 'NON'}\n- Email valide: ${hasEmail ? 'OUI' : 'NON'}`);
                }}
                className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
                title="Vérifier l'état de l'agent connecté"
              >
                👤 Check Agent
              </button>
              <button
                onClick={() => {
                  // Nettoyer les assignations hybrides
                  const HYBRID_ASSIGNED_KEY = 'investmali_hybrid_assigned';
                  localStorage.removeItem(HYBRID_ASSIGNED_KEY);
                  setAssignedDemandes([]);
                  console.log('🗑️ Assignations hybrides supprimées');
                  alert('🗑️ Assignations hybrides supprimées!\nLes demandes assignées ont été effacées.');
                  loadDemandes();
                  loadAssignedDemandes();
                }}
                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                title="Nettoyer les assignations hybrides"
              >
                🗑️ Clear Hybride
              </button>
            </div>
          </div>
          {currentDossier && (
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              {getStatusIcon(currentDossier.statut)}
              <span className="text-sm font-medium text-gray-700">
                {currentDossier.reference} - {getStatusText(currentDossier.statut)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('demandes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'demandes'
                  ? 'border-mali-emerald text-mali-emerald'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ListBulletIcon className="h-5 w-5 mr-2" />
                Demandes à traiter
                {demandes.length > 0 && (
                  <span className="ml-2 bg-mali-emerald text-white text-xs font-medium px-2 py-1 rounded-full">
                    {demandes.length}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assigned'
                  ? 'border-mali-emerald text-mali-emerald'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Mes demandes assignées
                {assignedDemandes.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {assignedDemandes.length}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-mali-emerald text-mali-emerald'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Rechercher un dossier
              </div>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-mali-emerald text-mali-emerald'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FolderPlusIcon className="h-5 w-5 mr-2" />
                Créer un dossier
              </div>
            </button>
            {currentDossier && (
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-mali-emerald text-mali-emerald'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <DocumentCheckIcon className="h-5 w-5 mr-2" />
                  Documents & Validation
                  {currentDossier.documentsManquants.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      {currentDossier.documentsManquants.length}
                    </span>
                  )}
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'demandes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Demandes d'entreprises à traiter ({demandes.length})
                </h3>
                <button
                  onClick={loadDemandes}
                  disabled={demandesLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald disabled:opacity-50"
                >
                  {demandesLoading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>

              {demandesLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald"></div>
                  <p className="mt-2 text-gray-500">Chargement des demandes...</p>
                </div>
              ) : demandes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Il n'y a actuellement aucune demande d'entreprise à traiter.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {demandes.map((demande) => (
                    <div key={demande.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-lg font-medium text-gray-900">{demande.nom}</h4>
                            {demande.sigle && (
                              <span className="text-sm text-gray-500">({demande.sigle})</span>
                            )}
                            {getStatusBadge(demande.statut)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Forme juridique</p>
                              <p className="font-medium">{demande.formeJuridique}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Type d'entreprise</p>
                              <p className="font-medium">{demande.typeEntreprise}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Demandeur</p>
                              <p className="font-medium">{demande.demandeur.prenom} {demande.demandeur.nom}</p>
                              <p className="text-sm text-gray-500">{demande.demandeur.email}</p>
                              <p className="text-sm text-gray-500">{demande.demandeur.telephone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Localisation</p>
                              <p className="font-medium">{demande.division || 'Non spécifiée'}</p>
                              {demande.antenne && (
                                <p className="text-sm text-gray-500">Antenne: {demande.antenne}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Soumise le {formatDate(demande.dateCreation)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-6">
                          <button
                            onClick={() => handleAssignToMe(demande.id)}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-mali-emerald hover:bg-mali-emerald-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald disabled:opacity-50"
                          >
                            <ClockIcon className="h-4 w-4 mr-1" />
                            S'assigner
                          </button>
                          
                          <button
                            onClick={() => handleDemandeAction(demande.id, 'accept')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Accepter
                          </button>
                          
                          <button
                            onClick={() => handleDemandeAction(demande.id, 'request_info')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald disabled:opacity-50"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            Info requise
                          </button>
                          
                          <button
                            onClick={() => handleDemandeAction(demande.id, 'reject')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            Rejeter
                          </button>
                          
                          <button
                            onClick={() => handleViewDetails(demande.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Mes demandes assignées ({assignedDemandes.length})
                </h3>
                <button
                  onClick={loadAssignedDemandes}
                  disabled={assignedLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald disabled:opacity-50"
                >
                  {assignedLoading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>

              {assignedLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald"></div>
                  <p className="mt-2 text-gray-500">Chargement des demandes assignées...</p>
                </div>
              ) : assignedDemandes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande assignée</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Vous n'avez pas encore de demandes assignées. Assignez-vous des demandes depuis l'onglet "Demandes à traiter".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedDemandes.map((demande, index) => (
                    <div key={demande.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-lg font-medium text-gray-900">{demande.nom}</h4>
                            <span className="text-sm text-gray-500">({demande.sigle})</span>
                            {getStatusBadge(demande.statut)}
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Assignée à moi
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Forme juridique</p>
                              <p className="font-medium">{demande.formeJuridique}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Type d'entreprise</p>
                              <p className="font-medium">{demande.typeEntreprise}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Demandeur</p>
                              <p className="font-medium">
                                {demande.demandeur?.prenom || 'Prénom inconnu'} {demande.demandeur?.nom || 'Nom inconnu'}
                              </p>
                              <p className="text-sm text-gray-500">{demande.demandeur?.email || 'Email non spécifié'}</p>
                              <p className="text-sm text-gray-500">{demande.demandeur?.telephone || 'Téléphone non spécifié'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Localisation</p>
                              <p className="font-medium">{demande.division}</p>
                              {demande.antenne && <p className="text-sm text-gray-500">Antenne: {demande.antenne}</p>}
                            </div>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Soumise le {formatDate(demande.dateCreation)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-6">
                          <button
                            onClick={() => handleOpenChat(demande)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Contacter l'utilisateur pour clarifier les documents"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                            💬 Contacter
                          </button>
                          
                          <button
                            onClick={() => handleDemandeAction(demande.id, 'accept')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Valider et passer au Régisseur
                          </button>
                          
                          <button
                            onClick={() => handleDemandeAction(demande.id, 'request_info')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald disabled:opacity-50"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            Info requise
                          </button>
                          
                          <button
                            onClick={() => handleDemandeAction(demande.id, 'reject')}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            Rejeter
                          </button>
                          
                          <button
                            onClick={() => handleUnassign(demande.id)}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald disabled:opacity-50"
                          >
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Désassigner
                          </button>
                          
                          <button
                            onClick={() => handleViewDetails(demande.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
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
            <DossierCreationForm onDossierCreated={handleDossierCreated} />
          )}
          
          {activeTab === 'documents' && currentDossier && (
            <DocumentsChecklist 
              dossier={currentDossier}
              onDossierUpdated={handleDocumentsUpdated}
            />
          )}
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
        />
      )}
    </div>
  );
};

export default AccueilStep;
