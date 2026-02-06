import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InvestmentAgreementRequest from '../components/InvestmentAgreementRequest';
import { businessAPI } from '../services/api';
import tresorPayService from '../services/tresorPayService';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface DemandeAutorisation {
  id: string;
  typeDemandeAgrement: 'AGREMENT' | 'DECISION' | 'ENREGISTREMENT';
  etapeValidation: string;
  numeroAutorisation?: string;
  dateCreation: string;
  dateAutorisation?: string;
  montantFraisDepot: number;
  statut: 'EN_COURS' | 'APPROUVE' | 'REJETE' | 'EN_ATTENTE';
  observations?: string;
  nomEntreprise: string;
  domaineActivite: string;
  typeEntreprise: string;
  regimeInvestissement?: string;
  agrementSignePath?: string;
  telechargementAutorise?: boolean;
}

interface InvestmentData {
  promoteurNom: string;
  promoteurNationalite: string;
  promoteurAdresse: string;
  nomRaisonSociale: string;
  activite: string;
  formeJuridique: string;
  localisation: string;
  adresse: string;
  investissementTotal: number;
  immobilisations: number;
  fondsRoulement: number;
  fondsPropres: number;
  credits: number;
  autres: number;
  tauxNationaux: number;
  tauxExpatries: number;
  emploisNationaux: number;
  emploisExpatries: number;
  tauxValeurAjoutee: number;
  capaciteProduction: string;
  marcheLocal: number;
  marcheExterieur: number;
  regimeSollicite: 'A' | 'B' | 'C' | 'D' | 'ZONES_ECONOMIQUES';
}

const AutorisationExercicePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [demandes, setDemandes] = useState<DemandeAutorisation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'demande' | 'suivi' | 'retrait'>('demande');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['demande', 'suivi', 'retrait'].includes(tabParam)) {
      setSelectedTab(tabParam as 'demande' | 'suivi' | 'retrait');
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedTab === 'suivi' || selectedTab === 'retrait') {
      loadDemandes();
    }
  }, [selectedTab]);

  const loadDemandes = async () => {
    try {
      setLoading(true);
      // Charger UNIQUEMENT les demandes d'investissement (agrément)
      const response = await businessAPI.getMyInvestmentApplications();
      console.log('🔍 [DEBUG] Demandes d\'investissement chargées:', response);
      
      // Transformer les données des demandes d'investissement
      const demandesTransformees = response.map((demande: any) => {
        return {
          id: demande.id,
          typeDemandeAgrement: 'AGREMENT' as const,
          etapeValidation: demande.etapeValidation || 'EN_COURS',
          dateCreation: demande.dateCreation || new Date().toISOString(),
          montantFraisDepot: demande.montantFraisDepot || 0,
          statut: demande.statutCreation === 'EN_COURS' ? 'EN_COURS' as const : 'EN_ATTENTE' as const,
          nomEntreprise: demande.nom || 'Demande d\'investissement',
          domaineActivite: demande.regimeInvestissement || 'Investissement',
          typeEntreprise: 'INVESTISSEMENT',
          regimeInvestissement: demande.regimeInvestissement
        };
      });
      
      setDemandes(demandesTransformees || []);
    } catch (err: any) {
      console.error('❌ [ERROR] Erreur lors du chargement des demandes:', err);
      setError(err?.message || 'Erreur lors du chargement des demandes');
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir le montant selon le régime d'investissement
  const getMontantRegime = (regime: string | undefined) => {
    if (!regime) return '350000'; // Valeur par défaut si régime non défini
    
    // Convertir REGIME_X vers X pour compatibilité (sauf pour ZONES_ECONOMIQUES)
    let regimeKey = regime;
    if (regime.startsWith('REGIME_') && regime !== 'ZONES_ECONOMIQUES') {
      regimeKey = regime.replace('REGIME_', '');
    }
    
    const montants = {
      'A': '350000',
      'B': '450000', 
      'C': '550000',
      'D': '600000',
      'ZONES_ECONOMIQUES': '600000'
    };
    return montants[regimeKey as keyof typeof montants] || '350000';
  };

  // Fonction pour gérer le paiement TresorPay
  const handlePaiementTresorPay = async (demande: DemandeAutorisation) => {
    try {
      console.log('🔍 [TRESORPAY] Initiation du paiement pour:', demande.id);
      
      const montant = getMontantRegime(demande.regimeInvestissement || 'A');
      
      // Préparer les données de paiement pour l'API backend
      const paymentRequest = {
        entrepriseId: demande.id,
        paymentMethod: 'TRESORPAY',
        amount: parseInt(montant),
        description: `Paiement frais d'agrément - ${demande.nomEntreprise}`,
        regime: demande.regimeInvestissement
      };
      
      console.log('🔍 [TRESORPAY] Données de paiement:', paymentRequest);
      
      // Appeler l'endpoint backend au lieu de TresorPay directement
      const response = await fetch('/api/v1/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentRequest)
      });
      
      console.log('🔍 [TRESORPAY] Statut réponse backend:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [TRESORPAY] Erreur HTTP:', response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 [TRESORPAY] Réponse backend complète:', result);
      console.log('🔍 [TRESORPAY] Message d\'erreur:', result.errorMessage);
      console.log('🔍 [TRESORPAY] Statut:', result.status);
      
      if (result.status === 'PENDING' && result.paymentId && (result.paymentUrl || result.redirectUrl)) {
        const redirectUrl = result.paymentUrl || result.redirectUrl;
        console.log('✅ [TRESORPAY] Redirection vers:', redirectUrl);
        // Rediriger vers l'URL de paiement TresorPay
        window.location.href = redirectUrl;
      } else if (result.status === 'PENDING' && result.paymentId) {
        // Si pas d'URL de redirection mais paiement créé, afficher un message de succès
        console.log('✅ [TRESORPAY] Paiement créé avec succès:', result.paymentId);
        alert(`Paiement créé avec succès!\nRéférence: ${result.paymentId}\nMontant: ${result.amount.toLocaleString()} FCFA`);
      } else {
        console.error('❌ [TRESORPAY] Réponse backend invalide:', result);
        throw new Error(result.message || `Erreur: ${result.status}`);
      }
      
    } catch (error) {
      console.error('❌ [TRESORPAY] Erreur lors du paiement:', error);
      alert('Erreur lors de l\'initiation du paiement. Veuillez réessayer.');
    }
  };

  const handleInvestmentAgreementSubmit = async (data: InvestmentData & { documents?: any[] }) => {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 [DEBUG] Données reçues:', data);
      console.log('🔍 [DEBUG] Documents reçus:', data.documents);
      // Transform data for backend API
      const requestData = {
        // Promoteur information
        promoteur: {
          nom: data.promoteurNom,
          nationalite: data.promoteurNationalite,
          adresse: data.promoteurAdresse
        },
        
        // Project identification
        identification: {
          nomRaisonSociale: data.nomRaisonSociale,
          activite: data.activite,
          formeJuridique: data.formeJuridique,
          localisation: data.localisation,
          adresse: data.adresse
        },
        
        // Project characteristics
        caracteristiques: {
          investissements: {
            total: data.investissementTotal,
            immobilisations: data.immobilisations,
            fondsRoulement: data.fondsRoulement
          },
          planFinancement: {
            fondsPropres: data.fondsPropres,
            credits: data.credits,
            autres: data.autres
          },
          participation: {
            tauxNationaux: data.tauxNationaux,
            tauxExpatries: data.tauxExpatries
          },
          emplois: {
            nationaux: data.emploisNationaux,
            expatries: data.emploisExpatries
          },
          tauxValeurAjoutee: data.tauxValeurAjoutee,
          capaciteProduction: data.capaciteProduction,
          marche: {
            local: data.marcheLocal,
            exterieur: data.marcheExterieur
          }
        },
        
        // Regime
        regimeSollicite: data.regimeSollicite,
        
        // Status
        statut: 'EN_COURS',
        dateCreation: new Date().toISOString()
      };

      // Collecter les documents uploadés
      const documents: { [key: string]: File } = {};
      if (data.documents && data.documents.length > 0) {
        console.log('🔍 [DEBUG] Documents uploadés trouvés:', data.documents);
        // Collecter tous les documents par type
        data.documents.forEach((doc: any) => {
          console.log('🔍 [DEBUG] Document:', doc.documentType, doc.file?.name);
          if (doc.documentType === 'DEMANDE_TIMBREE') {
            documents.demandeTimbree = doc.file;
          } else if (doc.documentType === 'ETUDE_FAISABILITE') {
            documents.etudeFaisabilite = doc.file;
          } else if (doc.documentType === 'STATUTS') {
            documents.statuts = doc.file;
          } else if (doc.documentType === 'AUTORISATION_EXERCICE') {
            documents.autorisationExercice = doc.file;
          } else if (doc.documentType === 'AUTRE') {
            documents.autreDocument = doc.file;
          }
        });
        console.log('🔍 [DEBUG] Documents collectés:', Object.keys(documents));
      } else {
        console.log('🔍 [DEBUG] Aucun document trouvé dans data.documents');
      }

      // Submit to backend API
      const response = await businessAPI.submitInvestmentAgreement(requestData, documents);
      
      if (response.success) {
        setNotification({type: 'success', message: 'Demande d\'agrément soumise avec succès!'});
        
        // Navigate to payment or confirmation page after a short delay
        setTimeout(() => {
          navigate('/payment/tresorpay', { 
            state: { 
              type: 'investment_agreement',
              amount: getRegimeFees(data.regimeSollicite),
              requestId: response.data.id
            }
          });
        }, 2000);
      } else {
        throw new Error(response.message || 'Erreur lors de la soumission');
      }
      
    } catch (error: any) {
      console.error('Erreur soumission demande:', error);
      setNotification({type: 'error', message: error.message || 'Erreur lors de la soumission de la demande'});
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRegimeFees = (regime: string): number => {
    const fees = {
      'A': 350000,
      'B': 450000,
      'C': 550000,
      'D': 600000,
      'ZONES_ECONOMIQUES': 600000
    };
    return fees[regime as keyof typeof fees] || 350000;
  };

  const getTypeDemandeLabel = (type: string) => {
    switch (type) {
      case 'AGREMENT': return 'Demande d\'Agrément';
      case 'DECISION': return 'Demande de Décision';
      case 'ENREGISTREMENT': return 'Enregistrement Simple';
      default: return type;
    }
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      'EN_COURS': 'bg-investmali-primary/10 text-investmali-primary',
      'APPROUVE': 'bg-investmali-accent/10 text-investmali-accent',
      'REJETE': 'bg-investmali-warning/10 text-investmali-warning',
      'EN_ATTENTE': 'bg-investmali-warning/10 text-investmali-warning'
    };
    
    const labels = {
      'EN_COURS': 'En cours',
      'APPROUVE': 'Approuvé',
      'REJETE': 'Rejeté',
      'EN_ATTENTE': 'En attente'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[statut as keyof typeof labels] || statut}
      </span>
    );
  };

  const renderDemandeTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-investmali-primary/5 to-investmali-accent/5 border-l-4 border-investmali-primary p-6 rounded-lg">
        <div className="flex items-start">
          <DocumentTextIcon className="h-6 w-6 text-investmali-primary mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Demande d'Agrément au Code des Investissements
            </h3>
            <p className="text-gray-700 mb-4">
              Remplissez ce formulaire officiel pour soumettre votre demande d'agrément 
              au Code des Investissements du Mali selon le format réglementaire.
            </p>
            <div className="bg-white/60 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Régimes d'investissement disponibles :</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li><strong>Régime A</strong> - Frais de dépôt : 350 000 FCFA</li>
                <li><strong>Régime B</strong> - Frais de dépôt : 450 000 FCFA</li>
                <li><strong>Régime C</strong> - Frais de dépôt : 550 000 FCFA</li>
                <li><strong>Régime D</strong> - Frais de dépôt : 600 000 FCFA</li>
                <li><strong>Régime des Zones Économiques</strong> - Frais de dépôt : 600 000 FCFA</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 relative">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
              <span className="text-gray-700 font-medium">Soumission en cours...</span>
            </div>
          </div>
        )}
        
        <InvestmentAgreementRequest 
          onSubmit={handleInvestmentAgreementSubmit}
        />
      </div>
    </div>
  );

  const renderSuiviTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-investmali-warning/5 to-investmali-warning/10 border-l-4 border-investmali-warning p-6 rounded-lg">
        <div className="flex items-start">
          <ClockIcon className="h-6 w-6 text-investmali-warning mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Suivi de vos Demandes
            </h3>
            <p className="text-gray-700">
              Suivez l'avancement de vos demandes d'autorisation d'exercice en temps réel.
              Vous recevrez des notifications à chaque étape du processus.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement de vos demandes...</p>
        </div>
      ) : demandes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_ATTENTE').length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande en cours</h3>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas de demande d'autorisation en cours de traitement.
          </p>
          <button
            onClick={() => setSelectedTab('demande')}
            className="inline-flex items-center px-6 py-3 bg-investmali-primary text-white rounded-lg hover:bg-investmali-primary/90 transition-colors"
          >
            Créer une demande
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {demandes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_ATTENTE').map((demande) => (
            <div key={demande.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{demande.nomEntreprise}</h3>
                    {getStatutBadge(demande.statut)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Type:</strong> {getTypeDemandeLabel(demande.typeDemandeAgrement)}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Domaine:</strong> {demande.domaineActivite}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Étape:</strong> {demande.etapeValidation}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                    {demande.id.startsWith('INV-') ? 
                      parseInt(getMontantRegime(demande.regimeInvestissement)).toLocaleString() : 
                      demande.montantFraisDepot.toLocaleString()
                    } FCFA
                  </p>
                </div>
              </div>
              
              {/* Section paiement pour les demandes à l'étape REGISSEUR_AGREMENT */}
              {demande.etapeValidation === 'REGISSEUR_AGREMENT' && demande.id.startsWith('INV-') && (
                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CurrencyDollarIcon className="h-5 w-5 text-orange-600" />
                    <h4 className="text-sm font-medium text-orange-800">Paiement requis</h4>
                  </div>
                  <p className="text-sm text-orange-700 mb-3">
                    Votre demande d'investissement est prête pour le paiement des frais d'agrément.
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Montant à payer:</p>
                      <p className="text-lg font-bold text-orange-600">
                        {getMontantRegime(demande.regimeInvestissement)} FCFA
                      </p>
                    </div>
                    <button 
                      onClick={() => handlePaiementTresorPay(demande)}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Payer avec TresorPay
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Demande #{demande.id}
                </div>
                <button className="inline-flex items-center px-4 py-2 bg-investmali-primary text-white rounded-lg hover:bg-investmali-primary/90 transition-colors text-sm">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRetraitTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-investmali-accent/5 to-investmali-accent/10 border-l-4 border-investmali-accent p-6 rounded-lg">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-6 w-6 text-investmali-accent mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Autorisations Délivrées
            </h3>
            <p className="text-gray-700">
              Consultez et téléchargez vos autorisations d'exercice délivrées.
              Tous vos documents officiels sont disponibles ici.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement de vos autorisations...</p>
        </div>
      ) : demandes.filter(d => d.statut === 'APPROUVE').length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune autorisation délivrée</h3>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore d'autorisation d'exercice délivrée.
          </p>
          <button
            onClick={() => setSelectedTab('demande')}
            className="inline-flex items-center px-6 py-3 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent/90 transition-colors"
          >
            Créer une demande
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {demandes.filter(d => d.statut === 'APPROUVE').map((demande) => (
            <div key={demande.id} className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{demande.nomEntreprise}</h3>
                    <span className="px-3 py-1 bg-investmali-accent/10 text-investmali-accent rounded-full text-sm font-medium">
                      Autorisé
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Type:</strong> {getTypeDemandeLabel(demande.typeDemandeAgrement)}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>N° Autorisation:</strong> {demande.numeroAutorisation}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Date de délivrance:</strong> {demande.dateAutorisation ? new Date(demande.dateAutorisation).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <CheckCircleIcon className="h-12 w-12 text-investmali-accent mx-auto mb-2" />
                  <p className="text-sm font-medium text-investmali-accent">Délivré</p>
                </div>
              </div>
              
              {demande.telechargementAutorise && demande.agrementSignePath && (
                <div className="flex items-center justify-between pt-4 border-t border-green-200">
                  <div className="text-sm text-gray-600">
                    Document officiel disponible
                  </div>
                  <button className="inline-flex items-center px-4 py-2 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent/90 transition-colors text-sm">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Télécharger
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" >
      <Header />
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-investmali-accent text-white' : 'bg-investmali-warning text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{padding: '80px'}}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          {/* Navigation par onglets */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setSelectedTab('demande')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedTab === 'demande'
                    ? 'border-investmali-primary text-investmali-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Demande d'Agrément
                </div>
              </button>

              <button
                onClick={() => setSelectedTab('suivi')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedTab === 'suivi'
                    ? 'border-investmali-primary text-investmali-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Suivi
                </div>
              </button>

              <button
                onClick={() => setSelectedTab('retrait')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedTab === 'retrait'
                    ? 'border-investmali-primary text-investmali-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Retrait
                </div>
              </button>
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-investmali-warning/10 border border-investmali-warning/20 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-investmali-warning" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'demande' && renderDemandeTab()}
            {selectedTab === 'suivi' && renderSuiviTab()}
            {selectedTab === 'retrait' && renderRetraitTab()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AutorisationExercicePage;
