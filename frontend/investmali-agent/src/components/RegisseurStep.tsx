import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  DevicePhoneMobileIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { DemandeEntreprise } from '../types';

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
}

interface RegisseurStepProps {
  onDossierUpdate?: (dossier: any) => void;
}

const RegisseurStep: React.FC<RegisseurStepProps> = ({ onDossierUpdate }) => {
  const { agent, canEditStep } = useAgentAuth();
  const [activeTab, setActiveTab] = useState<'demandes' | 'paiements'>('demandes');
  const [isLoading, setIsLoading] = useState(false);
  const [regisseurDemandes, setRegisseurDemandes] = useState<DemandeRegisseur[]>([]);
  const [selectedDemande, setSelectedDemande] = useState<DemandeRegisseur | null>(null);
  const [paiementMethod, setPaiementMethod] = useState<'CASH' | 'ORANGE_MONEY' | 'MOOV_MONEY' | 'STRIPE'>('CASH');
  const [fraisCalcules, setFraisCalcules] = useState<any>(null);

  const canEdit = canEditStep('REGISSEUR');
  const REGISSEUR_DEMANDES_KEY = 'investmali_regisseur_demandes';
  const REVISION_DEMANDES_KEY = 'investmali_revision_demandes';

  // Charger les demandes du régisseur automatiquement depuis la base de données
  useEffect(() => {
    // Nettoyer automatiquement les données de simulation au démarrage
    localStorage.removeItem(REGISSEUR_DEMANDES_KEY);
    localStorage.removeItem(REVISION_DEMANDES_KEY);
    console.log('🗑️ Données de simulation REGISSEUR automatiquement supprimées');
    
    // Charger directement depuis la base de données
    syncFromDatabase();
  }, []);

  const loadRegisseurDemandes = () => {
    try {
      // Priorité à la synchronisation avec la base de données
      console.log('📦 Chargement des demandes régisseur...');
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
      console.log('🔄 Chargement des vraies données REGISSEUR depuis la base de données...');
      
      // Importer l'API des entreprises
      const { entreprisesAPI } = await import('../services/api');
      
      // Charger toutes les entreprises depuis l'API
      const response = await entreprisesAPI.list({
        page: 0,
        size: 100
      });
      
      const allEntreprises = response.data?.content || response.data?.data || response.data?.rows || response.data || [];
      console.log('📊 Total entreprises chargées depuis DB:', allEntreprises.length);
      
      // Filtrer celles qui ont etapeActuelle: 'REGISSEUR' ou etapeValidation: 'REGISSEUR'
      const entreprisesRegisseur = allEntreprises.filter((entreprise: any) => {
        const etapeActuelle = entreprise.etapeActuelle || entreprise.etape_actuelle || entreprise.etapeValidation || entreprise.etape_validation;
        const isRegisseur = etapeActuelle === 'REGISSEUR';
        
        if (isRegisseur) {
          console.log(`✅ Entreprise REGISSEUR trouvée: ${entreprise.nom} (${entreprise.id})`);
        }
        
        return isRegisseur;
      });
      
      console.log('🎯 Entreprises pour REGISSEUR trouvées:', entreprisesRegisseur.length);
      
      if (entreprisesRegisseur.length > 0) {
        // Convertir au format attendu par le régisseur
        const demandesForRegisseur = await Promise.all(entreprisesRegisseur.map(async (entreprise: any) => {
          const gerantPersonne = entreprise.gerant || entreprise.gerantPersonne || {};
          
          // Récupérer les informations de l'agent qui a validé
          let agentAccueilNom = 'Agent non spécifié';
          
          // Priorité 1: Nom complet déjà formaté
          if (entreprise.agentAccueil && entreprise.agentAccueil !== 'Système' && entreprise.agentAccueil !== 'Agent non spécifié') {
            agentAccueilNom = entreprise.agentAccueil;
          }
          // Priorité 2: Prénom et nom séparés
          else if (entreprise.agentAccueilPrenom && entreprise.agentAccueilNom) {
            agentAccueilNom = `${entreprise.agentAccueilPrenom} ${entreprise.agentAccueilNom}`;
          }
          // Priorité 3: Email comme fallback
          else if (entreprise.agentAccueilEmail && entreprise.agentAccueilEmail !== 'Agent non spécifié') {
            agentAccueilNom = entreprise.agentAccueilEmail;
          }
          // Priorité 4: ID comme dernier recours
          else if (entreprise.agentAccueilId) {
            agentAccueilNom = `Agent ID: ${entreprise.agentAccueilId}`;
          }
          
          console.log(`🔍 Agent validation pour ${entreprise.nom}:`, {
            agentAccueil: entreprise.agentAccueil,
            agentAccueilPrenom: entreprise.agentAccueilPrenom,
            agentAccueilNom: entreprise.agentAccueilNom,
            agentAccueilEmail: entreprise.agentAccueilEmail,
            agentAccueilId: entreprise.agentAccueilId,
            result: agentAccueilNom
          });
          
          return {
            id: entreprise.id,
            nom: entreprise.nom || 'Nom inconnu',
            sigle: entreprise.sigle || '',
            formeJuridique: entreprise.formeJuridique || entreprise.forme_juridique || 'Non spécifiée',
            typeEntreprise: entreprise.typeEntreprise || entreprise.type_entreprise || 'Non spécifié',
            dateCreation: entreprise.dateCreation || entreprise.date_creation || new Date().toISOString(),
            statut: 'VALIDE',
            demandeur: {
              nom: gerantPersonne.nom || 'Nom inconnu',
              prenom: gerantPersonne.prenom || 'Prénom inconnu',
              email: gerantPersonne.email || 'Email inconnu',
              telephone: gerantPersonne.telephone1 || gerantPersonne.telephone || 'Téléphone inconnu'
            },
            etapeActuelle: 'REGISSEUR',
            dateValidationAccueil: entreprise.dateValidationAccueil || new Date().toISOString(),
            noteValidation: entreprise.noteValidation || 'Entreprise avec etapeActuelle: REGISSEUR chargée depuis la base de données',
            agentAccueil: agentAccueilNom,
            agentAccueilEmail: entreprise.agentAccueilEmail,
            agentAccueilId: entreprise.agentAccueilId
          };
        }));
        
        // Mettre à jour l'état directement (pas de localStorage)
        setRegisseurDemandes(demandesForRegisseur);
        console.log('✅ Vraies données REGISSEUR chargées:', demandesForRegisseur.length);
      }
      
    } catch (error) {
      console.error('Erreur synchronisation base de données:', error);
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Étape RÉGISSEUR</h2>
            <p className="text-gray-600 mt-1">
              Calcul des frais, gestion des paiements et validation - Agent: {agent?.firstName} {agent?.lastName}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  console.log('🔄 Rechargement des vraies données REGISSEUR...');
                  syncFromDatabase();
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                title="Recharger les données depuis la base de données"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation des onglets */}
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
              Demandes à traiter ({regisseurDemandes.length})
            </button>
            <button
              onClick={() => setActiveTab('paiements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'paiements'
                  ? 'border-mali-emerald text-mali-emerald'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Aucune demande n'a été transférée par l'accueil pour le moment.
                  </p>
                </div>
              ) : (
                regisseurDemandes.map((demande) => (
                  <div key={demande.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{demande.nom}</h3>
                        <p className="text-sm text-gray-600">{demande.formeJuridique} - {demande.typeEntreprise}</p>
                        <p className="text-sm text-gray-500">
                          Validé par: {(demande as any).agentAccueil} le {new Date((demande as any).dateValidationAccueil).toLocaleDateString()}
                        </p>
                        {demande.frais && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Frais calculés: {demande.frais.fraisTotal} FCFA</span>
                          </div>
                        )}
                        {(demande as any).statutPaiement && (
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              (demande as any).statutPaiement === 'REUSSI' 
                                ? 'bg-green-100 text-green-800'
                                : (demande as any).statutPaiement === 'EN_COURS'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Paiement: {(demande as any).statutPaiement}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-6">
                        {!demande.frais && (
                          <button
                            onClick={() => calculerFrais(demande)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            Calculer Frais
                          </button>
                        )}
                        
                        {demande.frais && !(demande as any).statutPaiement && (
                          <div className="space-y-2">
                            <select
                              value={paiementMethod}
                              onChange={(e) => setPaiementMethod(e.target.value as any)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="CASH">Cash</option>
                              <option value="ORANGE_MONEY">Orange Money</option>
                              <option value="MOOV_MONEY">Moov Money</option>
                              <option value="STRIPE">Carte bancaire</option>
                            </select>
                            <button
                              onClick={() => initierPaiement(demande.id, paiementMethod)}
                              disabled={isLoading}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CreditCardIcon className="h-4 w-4 mr-1" />
                              Initier Paiement
                            </button>
                          </div>
                        )}
                        
                        {(demande as any).statutPaiement === 'REUSSI' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => imprimerRecu(demande)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <PrinterIcon className="h-4 w-4 mr-1" />
                              Imprimer Reçu
                            </button>
                            <button
                              onClick={() => validerVersRevision(demande.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Valider → RÉVISION
                            </button>
                            <button
                              onClick={() => retournerVersAccueil(demande.id)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <ArrowLeftIcon className="h-4 w-4 mr-1" />
                              Retour ACCUEIL
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
              <h3 className="text-lg font-medium text-gray-900">Suivi des paiements en temps réel</h3>
              {regisseurDemandes.filter(d => (d as any).statutPaiement).map((demande) => (
                <div key={demande.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{demande.nom}</h4>
                      <p className="text-sm text-gray-600">
                        Référence: {(demande as any).paiement?.reference}
                      </p>
                      <p className="text-sm text-gray-600">
                        Montant: {demande.frais?.fraisTotal} FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        (demande as any).statutPaiement === 'REUSSI' 
                          ? 'bg-green-100 text-green-800'
                          : (demande as any).statutPaiement === 'EN_COURS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(demande as any).statutPaiement}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisseurStep;
