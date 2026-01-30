import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  DevicePhoneMobileIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BuildingOffice2Icon,
  UserIcon,
  BanknotesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { DemandeEntreprise } from '../types';
import { API_CONFIG } from '../config/api.config';
import PaymentMethodModal from './PaymentMethodModal';

interface Paiement {
  id: string;
  demandeId: string;
  method: string;
  montant: number;
  statut: string;
  dateInitiation: string;
  dateConfirmation?: string;
  reference: string;
}

interface PaiementResponse {
  id: string;
  typePaiement: string;
  statut: string;
  montant: number | string; // Peut être un BigDecimal du backend
  referenceTransaction: string;
  description?: string;
  datePaiement?: string;
  dateCreation?: string;
  numeroTelephone?: string;
  numeroCompte?: string;
  personneId?: string;
  personneNom?: string;
  personnePrenom?: string;
  entrepriseId?: string;
  entrepriseNom?: string;
}

interface Frais {
  fraisBase: number;
  fraisTaxe: number;
  fraisTotal: number;
  devise: string;
  dateCalcul: string;
}

interface DemandeRegisseur extends DemandeEntreprise {
  paiement?: Paiement;
  frais?: Frais;
  statutPaiement?: string;
  dateValidationAccueil?: string;
  noteValidation?: string;
  agentAccueil?: string;
  totalAmount?: number;
}

interface RegisseurStepProps {
  dossier?: any;
  onDossierUpdate?: (dossier: any) => void;
}

const RegisseurStep: React.FC<RegisseurStepProps> = ({ dossier, onDossierUpdate }) => {
  const { agent, canEditStep } = useAgentAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'demandes' | 'paiements'>('demandes');
  const [isLoading, setIsLoading] = useState(false);
  const [regisseurDemandes, setRegisseurDemandes] = useState<DemandeRegisseur[]>([]);
  const [selectedDemande, setSelectedDemande] = useState<DemandeRegisseur | null>(null);
  const [paiementMethod, setPaiementMethod] = useState<'CASH' | 'MOOV_MONEY' |  'ORANGE_MONEY' | 'STRIPE'>('CASH');
  const [fraisCalcules, setFraisCalcules] = useState<any>(null);
  const [paiementsConfirmes, setPaiementsConfirmes] = useState<PaiementResponse[]>([]);

  // États pour le modal de paiement
  const [paiementModalOpen, setPaiementModalOpen] = useState(false);
  const [paiementEntreprise, setPaiementEntreprise] = useState<{
    id: string;
    nom: string;
    totalAmount?: number;
  } | null>(null);

  const canEdit = canEditStep('REGISSEUR');

  // Effet pour détecter le scroll et appliquer le sticky
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 100); // Devient sticky après 100px de scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const REGISSEUR_DEMANDES_KEY = 'investmali_regisseur_demandes';
  const REVISION_DEMANDES_KEY = 'investmali_revision_demandes';

  // Charger les demandes du régisseur automatiquement depuis la base de données
  useEffect(() => {
    // Nettoyer automatiquement les données de simulation au démarrage
    localStorage.removeItem(REGISSEUR_DEMANDES_KEY);
    localStorage.removeItem(REVISION_DEMANDES_KEY);
    
    // Charger directement depuis la base de données
    syncFromDatabase();
    
    // Charger les paiements confirmés
    loadPaiementsConfirmes().then(paiements => {
      setPaiementsConfirmes(paiements);
    });
  }, []);

  // Recharger les paiements quand on change d'onglet vers "paiements"
  useEffect(() => {
    if (activeTab === 'paiements') {
      loadPaiementsConfirmes().then(paiements => {
        setPaiementsConfirmes(paiements);
      });
    }
  }, [activeTab]);

  const loadRegisseurDemandes = () => {
    try {
      // Priorité à la synchronisation avec la base de données
      console.log('🎯 Priorité: Base de données (vraies données)');
      
      // Charger depuis localStorage seulement comme fallback temporaire
      const stored = localStorage.getItem(REGISSEUR_DEMANDES_KEY);
      const demandes = stored ? JSON.parse(stored) : [];
      
      if (demandes.length > 0) {
        console.log('📋 Demandes temporaires depuis localStorage:', demandes.length);
        setRegisseurDemandes(demandes);
      } else {
        console.log('📭 Aucune demande dans localStorage, attente synchronisation DB...');
        setRegisseurDemandes([]);
      }
    } catch (error) {
      console.error('Erreur chargement demandes régisseur:', error);
      setRegisseurDemandes([]);
    }
  };

  const saveRegisseurDemandes = (demandes: DemandeRegisseur[]) => {
    try {
      localStorage.setItem(REGISSEUR_DEMANDES_KEY, JSON.stringify(demandes));
    } catch (error) {
      console.error('Erreur sauvegarde demandes régisseur:', error);
    }
  };

  // Synchroniser avec la base de données
  const syncFromDatabase = async () => {
    try {
      
      // Importer l'API des entreprises
      const { entreprisesAPI } = await import('../services/api');
      
      // Charger les entreprises à l'étape REGISSEUR avec les informations d'assignation
      const response = await entreprisesAPI.getByEtape('REGISSEUR', {
        page: 0,
        size: 100
      });
      
      // L'endpoint /etape/REGISSEUR retourne déjà les entreprises filtrées
      const entreprisesRegisseur = response.data || [];
      
      if (entreprisesRegisseur.length > 0) {
        // Convertir au format attendu par le régisseur
        const demandesForRegisseur = await Promise.all(entreprisesRegisseur.map(async (entreprise: any) => {
          const gerantPersonne = entreprise.gerant || entreprise.gerantPersonne || {};
          
          // Récupérer les informations de l'agent qui a validé via assigne_to
          let agentAccueilNom = 'Agent non spécifié';
          let agentAccueilEmail = null;
          let agentAccueilId = null;
          
          // Priorité 1: assignedTo (agent qui a fait l'assignation)
          // Priorité 2: createdBy (agent qui a créé l'entreprise) comme fallback
          let assigneToData = null;
          let isUsingFallback = false;
          
          if (entreprise.assignedTo) {
            assigneToData = entreprise.assignedTo;
          } else {
            assigneToData = entreprise.createdBy;
            isUsingFallback = true;
          }
          
          
          if (assigneToData) {
            
            // Si assigneToData est un objet (agent complet)
            if (assigneToData && typeof assigneToData === 'object') {
              // Extraire les informations de l'objet agent
              if (assigneToData.firstName && assigneToData.lastName) {
                agentAccueilNom = `${assigneToData.firstName} ${assigneToData.lastName}`;
              } else if (assigneToData.nom && assigneToData.prenom) {
                agentAccueilNom = `${assigneToData.prenom} ${assigneToData.nom}`;
              } else if (assigneToData.email) {
                agentAccueilNom = assigneToData.email;
              } else if (assigneToData.username) {
                agentAccueilNom = assigneToData.username;
              } else if (assigneToData.id) {
                agentAccueilNom = `Agent ID: ${assigneToData.id}`;
              } else {
                agentAccueilNom = 'Agent assigné';
              }
              
              agentAccueilEmail = assigneToData.email;
              agentAccueilId = assigneToData.id;
              
            }
            // Si assigneToData est un simple ID string
            else if (assigneToData && typeof assigneToData === 'string') {
              // Essayer de récupérer les infos de l'agent depuis les données disponibles
              if (entreprise.agentAssigne) {
                agentAccueilNom = entreprise.agentAssigne;
              } else if (entreprise.agentAssigneNom && entreprise.agentAssignePrenom) {
                agentAccueilNom = `${entreprise.agentAssignePrenom} ${entreprise.agentAssigneNom}`;
              } else if (entreprise.agentAssigneEmail) {
                agentAccueilNom = entreprise.agentAssigneEmail;
              } else {
                agentAccueilNom = `Agent ID: ${assigneToData}`;
              }
              
              agentAccueilEmail = entreprise.agentAssigneEmail;
              agentAccueilId = assigneToData;
              
            }
          }
          // Priorité 2: Données stockées dans l'entreprise (fallback)
          else if (entreprise.agentAccueil && entreprise.agentAccueil !== 'Système' && entreprise.agentAccueil !== 'Agent non spécifié') {
            agentAccueilNom = entreprise.agentAccueil;
            agentAccueilEmail = entreprise.agentAccueilEmail;
            agentAccueilId = entreprise.agentAccueilId;
          }
          // Priorité 3: Prénom et nom séparés
          else if (entreprise.agentAccueilPrenom && entreprise.agentAccueilNom) {
            agentAccueilNom = `${entreprise.agentAccueilPrenom} ${entreprise.agentAccueilNom}`;
            agentAccueilEmail = entreprise.agentAccueilEmail;
            agentAccueilId = entreprise.agentAccueilId;
          }
          
          const demandeData = {
            id: entreprise.id,
            nom: entreprise.nom || 'Nom inconnu',
            sigle: entreprise.sigle || '',
            formeJuridique: entreprise.formeJuridique || entreprise.forme_juridique || 'Non spécifiée',
            typeEntreprise: entreprise.typeEntreprise || entreprise.type_entreprise || 'Non spécifié',
            dateCreation: entreprise.dateCreation || entreprise.date_creation || new Date().toISOString(),
            dateValidationAccueil: entreprise.dateValidationAccueil || entreprise.dateCreation || new Date().toISOString(),
            statut: 'VALIDE',
            demandeur: {
              nom: gerantPersonne.nom || 'Nom non renseinger',
              prenom: gerantPersonne.prenom || 'Prénom non renseinger',
              email: gerantPersonne.email || 'Email non renseinger',
              telephone: gerantPersonne.telephone1 || gerantPersonne.telephone || 'Téléphone inconnu'
            },
            etapeActuelle: 'REGISSEUR',
            noteValidation: entreprise.noteValidation || 'Entreprise avec etapeActuelle: REGISSEUR chargée depuis la base de données',
            agentAccueil: agentAccueilNom,
            agentAccueilNom: agentAccueilNom,
            agentAccueilEmail: agentAccueilEmail,
            agentAccueilId: agentAccueilId,
            totalAmount: entreprise.totalAmount || 0
          };
          
          return demandeData;
        }));
        
        // Mettre à jour l'état directement (pas de localStorage)
        setRegisseurDemandes(demandesForRegisseur);
      }
      
    } catch (error: any) {
      console.error('❌ [RegisseurStep] Erreur synchronisation base de données:', error);
      console.error('❌ [RegisseurStep] Détails de l\'erreur:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Afficher un message d'erreur à l'utilisateur mais continuer avec les données mockées
      if (error.response?.status === 500) {
        console.warn('⚠️ [RegisseurStep] Erreur serveur 500 - Utilisation des données de fallback');
        // Optionnel: afficher une notification à l'utilisateur
        // alert('⚠️ Problème de connexion au serveur. Utilisation des données de démonstration.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.warn('⚠️ [RegisseurStep] Serveur inaccessible - Utilisation des données de fallback');
      }
    }
  };

  // Calculer les frais
  const calculerFrais = (demande: DemandeRegisseur) => {
    const fraisBase = 50000; // 50,000 FCFA
    const fraisTaxe = fraisBase * 0.18; // 18% TVA
    const fraisTotal = fraisBase + fraisTaxe;

    const frais = {
      fraisBase,
      fraisTaxe,
      fraisTotal,
      devise: 'FCFA',
      dateCalcul: new Date().toISOString()
    };

    setFraisCalcules(frais);
    console.log('💰 Frais calculés:', frais);
    return frais;
  };

  // Initialiser le paiement
  const initierPaiement = async (demandeId: string, method: string) => {
    setIsLoading(true);
    try {
      console.log(`💳 Initiation paiement ${method} pour demande ${demandeId}`);
      
      const demande = regisseurDemandes.find(d => d.id === demandeId);
      if (!demande || !fraisCalcules) {
        alert('Erreur: Demande ou frais non trouvés');
        return;
      }

      // Simuler l'initialisation du paiement
      const paiement = {
        id: `PAY_${Date.now()}`,
        demandeId,
        method,
        montant: fraisCalcules.fraisTotal,
        statut: 'EN_COURS',
        dateInitiation: new Date().toISOString(),
        reference: `REF_${demandeId.slice(-8)}_${Date.now()}`
      };

      // Mettre à jour la demande avec les infos de paiement
      setRegisseurDemandes(prev => {
        const updated = prev.map(d => 
          d.id === demandeId 
            ? { ...d, paiement, frais: fraisCalcules, statutPaiement: 'EN_COURS' }
            : d
        );
        saveRegisseurDemandes(updated);
        return updated;
      });

      alert(`✅ Paiement ${method} initié avec succès!\nRéférence: ${paiement.reference}`);
      
      // Simuler le suivi en temps réel
      setTimeout(() => {
        simulerStatutPaiement(demandeId, 'REUSSI');
      }, 3000);

    } catch (error) {
      console.error('Erreur initiation paiement:', error);
      alert('Erreur lors de l\'initiation du paiement');
    } finally {
      setIsLoading(false);
    }
  };

  // Simuler le changement de statut de paiement
  const simulerStatutPaiement = (demandeId: string, nouveauStatut: string) => {
    setRegisseurDemandes(prev => {
      const updated = prev.map(d => {
        if (d.id === demandeId && d.paiement) {
          return {
            ...d,
            statutPaiement: nouveauStatut,
            paiement: {
              ...d.paiement,
              statut: nouveauStatut,
              dateConfirmation: new Date().toISOString()
            }
          };
        }
        return d;
      });
      saveRegisseurDemandes(updated);
      return updated;
    });

    if (nouveauStatut === 'REUSSI') {
      alert(`✅ Paiement confirmé pour la demande ${demandeId}!`);
    }
  };

  // Imprimer le reçu
  const imprimerRecu = (demande: DemandeRegisseur) => {
    if (!demande.paiement || !demande.frais) {
      alert('Erreur: Informations de paiement manquantes');
      return;
    }

    const recu = `
=== REÇU DE PAIEMENT ===
API-INVEST MALI

Entreprise: ${demande.nom}
Référence: ${demande.paiement.reference}
Montant: ${demande.frais.fraisTotal} FCFA
Méthode: ${demande.paiement.method}
Date: ${new Date(demande.paiement.dateConfirmation || demande.paiement.dateInitiation).toLocaleDateString()}
Statut: ${demande.paiement.statut}

Agent: ${agent?.firstName} ${agent?.lastName}
========================
    `;

    console.log('🖨️ Impression reçu:', recu);
    alert('🖨️ Reçu imprimé avec succès!\n\n' + recu);
  };

  // Récupérer les paiements confirmés depuis la base de données
  const loadPaiementsConfirmes = async (): Promise<PaiementResponse[]> => {
    try {
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/paiements/confirmes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const paiements = await response.json();
      
      // Debug détaillé de chaque paiement
      paiements.forEach((paiement: PaiementResponse, index: number) => {
        // Log removed for production
      });
      
      return paiements;
    } catch (error) {
      console.error('❌ [RegisseurStep] Erreur lors du chargement des paiements:', error);
      return [];
    }
  };

  // Valider vers REVISION
  const validerVersRevision = (demandeId: string) => {
    const demande = regisseurDemandes.find(d => d.id === demandeId);
    if (!demande) {
      alert('Erreur: Demande non trouvée');
      return;
    }

    if (!demande.paiement || demande.statutPaiement !== 'REUSSI') {
      alert('Erreur: Le paiement doit être confirmé avant la validation');
      return;
    }

    // Transférer vers REVISION
    const demandeForRevision = {
      ...demande,
      etapeActuelle: 'REVISION',
      dateValidationRegisseur: new Date().toISOString(),
      agentRegisseur: agent?.email
    };

    try {
      const existingRevisionDemandes = JSON.parse(localStorage.getItem(REVISION_DEMANDES_KEY) || '[]');
      const updatedRevisionDemandes = [demandeForRevision, ...existingRevisionDemandes];
      localStorage.setItem(REVISION_DEMANDES_KEY, JSON.stringify(updatedRevisionDemandes));

      // Retirer de la liste du régisseur
      setRegisseurDemandes(prev => {
        const updated = prev.filter(d => d.id !== demandeId);
        saveRegisseurDemandes(updated);
        return updated;
      });

      alert(`✅ Demande "${demande.nom}" validée et transférée à la révision!`);
    } catch (error) {
      console.error('Erreur transfert révision:', error);
      alert('Erreur lors du transfert vers la révision');
    }
  };

  // Retourner vers ACCUEIL
  const retournerVersAccueil = (demandeId: string) => {
    const demande = regisseurDemandes.find(d => d.id === demandeId);
    if (!demande) {
      alert('Erreur: Demande non trouvée');
      return;
    }

    // Remettre dans les demandes d'accueil
    const demandeForAccueil = {
      ...demande,
      etapeActuelle: 'ACCUEIL',
      statut: 'EN_COURS',
      dateRetourAccueil: new Date().toISOString(),
      noteRetour: 'Retournée par le régisseur pour correction'
    };

    try {
      const existingAccueilDemandes = JSON.parse(localStorage.getItem('investmali_assigned_demandes') || '[]');
      const updatedAccueilDemandes = [demandeForAccueil, ...existingAccueilDemandes];
      localStorage.setItem('investmali_assigned_demandes', JSON.stringify(updatedAccueilDemandes));

      // Retirer de la liste du régisseur
      setRegisseurDemandes(prev => {
        const updated = prev.filter(d => d.id !== demandeId);
        saveRegisseurDemandes(updated);
        return updated;
      });

      alert(`✅ Demande "${demande.nom}" retournée à l'accueil!`);
    } catch (error) {
      console.error('Erreur retour accueil:', error);
      alert('Erreur lors du retour vers l\'accueil');
    }
  };

  // Fonction pour ouvrir le modal de paiement
  const handlePasserAuPaiement = (demandeId: string) => {
    // Trouver la demande dans les demandes du régisseur
    const demande = regisseurDemandes.find(d => d.id === demandeId);
    if (!demande) {
      alert('Erreur: Demande non trouvée');
      return;
    }
    
    console.log(`💳 Ouverture du modal de paiement pour: ${demande.nom}`);
    
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
      // Recharger les données depuis la base de données
      await new Promise(resolve => setTimeout(resolve, 300));
      await syncFromDatabase();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('✅ Données rechargées après paiement');
    } catch (error) {
      console.error('❌ Erreur lors du rechargement après paiement:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-2xl' : 'relative'} bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6 transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-sky-600 to-blue-600 rounded-2xl shadow-lg">
                <BanknotesIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Étape RÉGISSEUR</h2>
                <p className="text-lg text-slate-600 font-medium mt-1">
                  Calcul des frais, gestion des paiements et validation - Agent: {agent?.firstName} {agent?.lastName}
                </p>
              </div>
            </div>
            
            {/* Statistiques des paiements */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/50 rounded-xl px-3 py-2 border border-white/40 shadow-lg">
                <div className="p-1 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg text-green-600 font-bold">
                  {paiementsConfirmes.filter(p => p.statut === 'VALIDE').length} Payés
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 rounded-xl px-3 py-2 border border-white/40 shadow-lg">
                <div className="p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                  <ClockIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg text-amber-600 font-bold">
                  {regisseurDemandes.filter(d => (d as any).statutPaiement === 'EN_COURS').length} En cours
                </span>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
      <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60">
        <div className="border-b border-white/40">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('demandes')}
              className={`py-4 px-1 border-b-2 font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'demandes'
                  ? 'border-sky-600 text-sky-600 shadow-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5" />
              Demandes à traiter ({regisseurDemandes.length})
            </button>
            <button
              onClick={() => setActiveTab('paiements')}
              className={`py-4 px-1 border-b-2 font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'paiements'
                  ? 'border-sky-600 text-sky-600 shadow-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <CreditCardIcon className="h-5 w-5" />
              Suivi des paiements
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'demandes' && (
            <div className="space-y-4">
              {regisseurDemandes.length === 0 ? (
                <div className="text-center py-12">
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune demande</h3>
                  <p className="mt-1 text-lg text-gray-500">
                    Aucune demande n'a été transférée par l'accueil pour le moment.
                  </p>
                </div>
              ) : (
                regisseurDemandes.map((demande) => (
                  <div key={demande.id} className="bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gradient-to-br from-sky-600 to-blue-600 rounded-xl shadow-lg">
                            <BuildingOffice2Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-800">{demande.nom}</h3>
                            <p className="text-lg text-slate-600 font-medium">{demande.formeJuridique} - {demande.typeEntreprise}</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-primary-50 to-primary-50 rounded-xl p-4 border border-primary-200 mb-3 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg shadow-md">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-lg text-slate-800 font-semibold">
                                <span className="text-sky-700 font-bold">Validé par:</span> 
                                <span className="ml-2 px-2 py-1 bg-sky-100 rounded-lg text-sky-800 font-bold">
                                  {(demande as any).agentAccueil || 'Agent non spécifié'}
                                </span>
                              </p>
                              {(demande as any).agentAccueilEmail && (
                                <p className="text-sm text-slate-500 mt-1">
                                  <span className="font-medium">Contact:</span> 
                                  <span className="ml-1">{(demande as any).agentAccueilEmail}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {demande.frais && (
                          <div className="bg-gradient-to-r from-green-50 to-green-50 rounded-xl p-3 border border-green-200 flex items-center gap-2">
                            <BanknotesIcon className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-bold text-green-700">Frais calculés: {demande.frais.fraisTotal} FCFA</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-6">
                        {/* Statut des paiements */}
                        <div className="bg-gradient-to-r from-white/90 via-slate-50/70 to-primary-50/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                          <h4 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5 text-sky-600" />
                            Statut Paiement
                          </h4>
                          
                          {!demande.frais ? (
                            <div className="flex flex-col space-y-2">
                              <span className="inline-flex items-center px-3 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 shadow-lg">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                En attente
                              </span>
                              <span className="text-sm text-slate-600 font-medium">
                                Montant à payer: <span className="font-bold text-sky-700">
                                  {demande.totalAmount !== undefined && demande.totalAmount !== null ? `${demande.totalAmount.toLocaleString('fr-FR')} FCFA` : 'Non calculé'}
                                </span>
                              </span>
                              
                              {/* Bouton Passer au paiement */}
                              <button
                                onClick={() => handlePasserAuPaiement(demande.id)}
                                disabled={isLoading}
                                className="inline-flex items-center px-4 py-3 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 mt-2"
                              >
                                <CreditCardIcon className="h-4 w-4 mr-1" />
                                Passer au paiement
                              </button>
                            </div>
                          ) : !((demande as any).statutPaiement) ? (
                            <div className="flex flex-col space-y-2">
                              <span className="inline-flex items-center px-3 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 shadow-lg">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                                Frais calculés
                              </span>
                              <span className="text-sm text-slate-700 font-bold">{demande.frais.fraisTotal} FCFA</span>
                              <span className="text-sm text-amber-600 font-medium flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                En attente de paiement
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-2">
                              <span className={`inline-flex items-center px-3 py-2 text-sm font-bold rounded-xl shadow-lg ${
                                (demande as any).statutPaiement === 'REUSSI' 
                                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                  : (demande as any).statutPaiement === 'EN_COURS'
                                  ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800'
                                  : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                              }`}>
                                {(demande as any).statutPaiement === 'REUSSI' ? (
                                  <>
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    Payé
                                  </>
                                ) : (demande as any).statutPaiement === 'EN_COURS' ? (
                                  <>
                                    <ClockIcon className="h-4 w-4 mr-2" />
                                    En cours
                                  </>
                                ) : (
                                  <>
                                    <XCircleIcon className="h-4 w-4 mr-2" />
                                    Échec
                                  </>
                                )}
                              </span>
                              <span className="text-sm text-slate-700 font-bold">{demande.frais?.fraisTotal} FCFA</span>
                              {(demande as any).statutPaiement === 'REUSSI' && (
                                <span className="text-sm text-green-600 font-bold flex items-center gap-1">
                                  <CheckCircleIcon className="h-4 w-4" />
                                  Paiement confirmé
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {demande.frais && !(demande as any).statutPaiement && (
                          <div className="space-y-3">
                            <select
                              value={paiementMethod}
                              onChange={(e) => setPaiementMethod(e.target.value as any)}
                              className="block w-full px-4 py-3 border border-white/60 rounded-xl bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-medium"
                            >
                              <option value="CASH">Cash</option>
                              <option value="MOOV_MONEY">Moov Money</option>
                              <option value="STRIPE">Carte bancaire</option>
                            </select>
                            <button
                              onClick={() => initierPaiement(demande.id, paiementMethod)}
                              disabled={isLoading}
                              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <CreditCardIcon className="h-5 w-5 mr-2" />
                              Initier Paiement
                            </button>
                          </div>
                        )}
                        
                        {(demande as any).statutPaiement === 'REUSSI' && (
                          <div className="space-y-3">
                            <button
                              onClick={() => imprimerRecu(demande)}
                              className="w-full inline-flex items-center justify-center px-4 py-3 border border-white/60 text-lg font-bold rounded-xl text-slate-700 bg-white/60 backdrop-blur-sm hover:bg-white/80 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <PrinterIcon className="h-5 w-5 mr-2" />
                              Imprimer Reçu
                            </button>
                            <button
                              onClick={() => validerVersRevision(demande.id)}
                              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Passer chez le RÉGISSEUR
                            </button>
                            <button
                              onClick={() => retournerVersAccueil(demande.id)}
                              className="w-full inline-flex items-center justify-center px-4 py-3 border border-white/60 text-lg font-bold rounded-xl text-slate-700 bg-white/60 backdrop-blur-sm hover:bg-white/80 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <ArrowLeftIcon className="h-4 w-4 mr-2" />
                              ↩️ Retour ACCUEIL
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'paiements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg">
                    <CreditCardIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">Paiements confirmés</h3>
                </div>
                <button
                  onClick={async () => {
                    const paiements = await loadPaiementsConfirmes();
                    setPaiementsConfirmes(paiements);
                  }}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-2 rounded-xl text-lg font-bold hover:from-sky-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  title="Recharger les paiements confirmés"
                >
                  <ArrowLeftIcon className="h-5 w-5 transform rotate-90" />
                  Actualiser
                </button>
              </div>
              {paiementsConfirmes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-lg font-medium text-gray-900">Aucun paiement confirmé</h4>
                  <p className="mt-1 text-lg text-gray-500">
                    Les paiements confirmés depuis la base de données apparaîtront ici.
                  </p>
                </div>
              ) : (
                paiementsConfirmes.map((paiement: PaiementResponse) => (
                <div key={paiement.id} className="bg-gradient-to-r from-white/95 via-slate-50/80 to-primary-50/60 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        {/* Déterminer le type de paiement selon le montant et la description */}
                        {(() => {
                          const isAgreement = paiement.description?.includes('agrément') || 
                                            paiement.description?.includes('Paiement frais d\'agrément') ||
                                            (paiement.montant && Number(paiement.montant) >= 300000);
                          
                          if (isAgreement) {
                            return (
                              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                                <CheckCircleIcon className="h-6 w-6 text-white" />
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-2 bg-gradient-to-br from-sky-600 to-blue-600 rounded-xl shadow-lg">
                                <BuildingOffice2Icon className="h-6 w-6 text-white" />
                              </div>
                            );
                          }
                        })()}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-black text-slate-800">
                              {paiement.entrepriseNom || 
                               paiement.description?.match(/(?:pour|-)?\ s*([A-Za-zÀ-ÿ\s]+?)(?:\s*-|\s*\(|$)/)?.[1]?.trim() || 
                               'Entreprise'}
                            </h4>
                            {/* Badge pour identifier le type */}
                            {(() => {
                              const isAgreement = paiement.description?.includes('agrément') || 
                                                paiement.description?.includes('Paiement frais d\'agrément') ||
                                                (paiement.montant && Number(paiement.montant) >= 300000);
                              
                              if (isAgreement) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 gap-1">
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Agrément
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-sky-100 text-sky-800 gap-1">
                                    <BuildingOffice2Icon className="h-4 w-4" />
                                    Entreprise
                                  </span>
                                );
                              }
                            })()}
                          </div>
                          <p className="text-lg text-slate-600 font-medium">
                            Référence: {paiement.referenceTransaction || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/50 rounded-xl p-3 border border-white/40">
                          <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                            <BanknotesIcon className="h-4 w-4" />
                            Montant
                          </p>
                          <p className="text-lg text-slate-700 font-bold">
                            {paiement.montant ? Number(paiement.montant).toLocaleString('fr-FR') : 'N/A'} FCFA
                          </p>
                        </div>
                        <div className="bg-white/50 rounded-xl p-3 border border-white/40">
                          <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                            <CreditCardIcon className="h-4 w-4" />
                            Méthode
                          </p>
                          <p className="text-lg text-slate-700 font-bold">{paiement.typePaiement || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {paiement.datePaiement && (
                        <div className="mt-3 bg-white/50 rounded-xl p-3 border border-white/40">
                          <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            Date de confirmation
                          </p>
                          <p className="text-lg text-slate-700 font-bold">
                            {new Date(paiement.datePaiement).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-6">
                      <span className="inline-flex items-center px-4 py-2 text-lg font-bold rounded-xl bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-lg">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Confirmé
                      </span>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de paiement */}
      {paiementModalOpen && paiementEntreprise && (
        <PaymentMethodModal
          isOpen={paiementModalOpen}
          onClose={() => setPaiementModalOpen(false)}
          entreprise={paiementEntreprise}
          onPaiementComplete={handlePaiementComplete}
        />
      )}
    </div>
  );
};

export default RegisseurStep;
























