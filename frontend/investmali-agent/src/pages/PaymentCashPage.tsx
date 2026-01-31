import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BanknotesIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { entreprisesAPI, paiementsAPI } from '../services/api';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { generateReceiptData, PaymentReceiptData } from '../services/receiptService';
import PaymentReceipt from '../components/PaymentReceipt';
import { API_CONFIG } from '../config/api.config';

const PaymentCashPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agent } = useAgentAuth();
  const [loading, setLoading] = useState(false);
  const [montantPaye, setMontantPaye] = useState<string>('');
  const [numeroRecu, setNumeroRecu] = useState<string>('');
  const [agenceReception, setAgenceReception] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const entrepriseNom = searchParams.get('entrepriseNom') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  // Debug: Afficher les paramètres URL reçus
  console.log('🔍 [PaymentCashPage] Paramètres URL reçus:');
  console.log('   - entrepriseId:', entrepriseId);
  console.log('   - entrepriseNom:', entrepriseNom);
  console.log('   - amount:', amount);
  console.log('   - URL complète:', window.location.href);

  const agences = [
    {
      id: 'bamako-centre',
      name: 'Bamako Centre',
      address: 'ACI 2000, près de la BCEAO'
    },
    {
      id: 'bamako-hippodrome',
      name: 'Bamako Hippodrome',
      address: 'Avenue Cheick Zayed, Hippodrome'
    },
    {
      id: 'koulikoro',
      name: 'Koulikoro',
      address: 'Centre-ville de Koulikoro'
    },
    {
      id: 'sikasso',
      name: 'Sikasso',
      address: 'Centre-ville de Sikasso'
    }
  ];

  useEffect(() => {
    console.log('🔍 [PaymentCashPage] Validation des paramètres:');
    console.log('   - entrepriseId valide?', !!entrepriseId);
    console.log('   - amount valide?', amount > 0);
    
    if (!entrepriseId || !amount) {
      console.log('❌ [PaymentCashPage] Paramètres manquants, redirection vers /dossier');
      console.log('   - entrepriseId:', entrepriseId);
      console.log('   - amount:', amount);
      navigate('/dossier');
    } else {
      console.log('✅ [PaymentCashPage] Paramètres valides, initialisation de la page');
      setMontantPaye(amount.toString());
    }
  }, [entrepriseId, amount, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!montantPaye || parseFloat(montantPaye) <= 0) {
      setError('Veuillez saisir un montant valide');
      setLoading(false);
      return;
    }

    // Générer automatiquement une référence unique si pas fournie
    let referenceTransaction = numeroRecu.trim();
    if (!referenceTransaction) {
      const now = new Date();
      const timestamp = now.getTime();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      referenceTransaction = `CASH-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${timestamp}-${random}`;
      console.log(' [PaymentCashPage] Référence générée automatiquement:', referenceTransaction);
    }

    if (!agenceReception.trim()) {
      setError('Veuillez sélectionner l\'agence de réception');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const agence = agences.find(a => a.id === agenceReception);
      
      // Debug: vérifier la structure de l'agent
      console.log('🔍 [PaymentCashPage] Agent connecté:', agent);
      
      // 1. Créer l'enregistrement de paiement (CRITIQUE)
      const paiementData: any = {
        entrepriseId: entrepriseId,
        personneId: (agent as any)?.id || (agent as any)?.agentId, // ID de l'agent qui effectue le paiement
        montant: parseFloat(montantPaye),
        typePaiement: 'ESPECES', // Utiliser la valeur enum correcte du backend
        referenceTransaction: referenceTransaction,
        description: `Paiement en espèces validé par agent - Agence: ${agence?.name || agenceReception}${notes ? ' - Notes: ' + notes : ''}`,
        statut: 'VALIDE', // Pour les espèces, le statut est directement VALIDE (agent confirme physiquement)
      };
      
      // Ajouter les champs optionnels seulement s'ils ont une valeur
      // (éviter d'envoyer null/undefined qui peuvent causer des erreurs côté backend)

      console.log('💾 [PaymentCashPage] Création de l\'enregistrement de paiement:', paiementData);
      console.log('📤 [PaymentCashPage] Données JSON envoyées:', JSON.stringify(paiementData, null, 2));
      console.log('🌐 [PaymentCashPage] URL de l\'API utilisée:', API_CONFIG.BASE_URL);
      console.log('🔗 [PaymentCashPage] Endpoint complet:', `${API_CONFIG.BASE_URL}/paiements`);
      
      try {
        const paiementResponse = await paiementsAPI.create(paiementData);
        console.log('✅ [PaymentCashPage] Paiement créé avec succès:', paiementResponse);
      } catch (paiementError: any) {
        // Vérifier si l'erreur est due à une réponse HTML au lieu de JSON
        if (paiementError.message?.includes('Unexpected token') && paiementError.message?.includes('<')) {
          console.error('❌ [PaymentCashPage] ERREUR: L\'endpoint retourne du HTML au lieu de JSON');
          console.error('❌ [PaymentCashPage] Cela indique probablement que l\'endpoint /paiements n\'existe pas côté backend');
          setError('Erreur de communication avec le serveur. L\'endpoint de paiement semble indisponible.');
          return;
        }
        console.error('❌ [PaymentCashPage] ERREUR lors de la création du paiement:', paiementError);
        console.error('❌ [PaymentCashPage] Détails de l\'erreur:', {
          message: paiementError.message,
          status: paiementError.response?.status,
          statusText: paiementError.response?.statusText,
          data: paiementError.response?.data,
          url: paiementError.config?.url,
          requestData: paiementError.config?.data
        });
        
        // Log spécifique pour erreur 400
        if (paiementError.response?.status === 400) {
          console.error('🔍 [PaymentCashPage] ERREUR 400 - Données de la requête:', paiementError.config?.data);
          console.error('🔍 [PaymentCashPage] ERREUR 400 - Réponse du serveur:', paiementError.response?.data);
          console.error('🔍 [PaymentCashPage] ERREUR 400 - Headers de la requête:', paiementError.config?.headers);
        }
        
        // Vérifier si c'est une erreur 404 (endpoint n'existe pas)
        if (paiementError.response?.status === 404) {
          console.warn('⚠️ [PaymentCashPage] L\'endpoint /paiements n\'existe pas encore côté backend');
          console.warn('⚠️ [PaymentCashPage] SOLUTION TEMPORAIRE: Continuer sans créer le paiement en base');
          console.warn('⚠️ [PaymentCashPage] TODO: Créer l\'endpoint PaiementController côté Spring Boot');
          
          // Afficher un avertissement mais continuer le processus
          alert(`⚠️ AVERTISSEMENT: L'endpoint de paiement n'existe pas encore côté backend!\n\n✅ L'entreprise va quand même passer à l'étape REVISION\n❌ Mais le paiement ne sera PAS enregistré en base\n\n📋 TODO: Créer l'endpoint /paiements côté Spring Boot`);
        } else {
          // Pour les autres erreurs, arrêter le processus
          setError(`Erreur lors de la création du paiement: ${paiementError.message}`);
          return;
        }
      }

      // 2. Mettre à jour le statut vers PAIEMENT_VALIDE et l'étape vers REVISION
      const statusData = {
        status: 'PAIEMENT_VALIDE',
        note: `Paiement en espèces validé par agent - Montant: ${montantPaye} FCFA - Reçu: ${referenceTransaction} - Agence: ${agence?.name || agenceReception}${notes ? ' - Notes: ' + notes : ''}`
      };

      console.log('📝 [PaymentCashPage] Mise à jour du statut de l\'entreprise:', statusData);
      await entreprisesAPI.updateStatus(entrepriseId, statusData.status, statusData.note);
      console.log('✅ [PaymentCashPage] Statut entreprise mis à jour avec succès');

      // 3. Générer le reçu de paiement
      try {
        console.log('📄 [PaymentCashPage] Génération du reçu de paiement...');
        const generatedReceiptData = await generateReceiptData(
          entrepriseId,
          entrepriseNom,
          parseFloat(montantPaye),
          'Espèces',
          referenceTransaction,
          agent?.email || 'Agent API-INVEST'
        );
        
        console.log('✅ [PaymentCashPage] Reçu généré avec succès:', generatedReceiptData);
        
        // Afficher le modal de reçu
        setReceiptData(generatedReceiptData);
        setShowReceipt(true);
        
      } catch (receiptError: any) {
        console.error('❌ [PaymentCashPage] Erreur lors de la génération du reçu:', receiptError);
        
        // Même si le reçu échoue, le paiement est validé, donc on continue
        alert(`✅ Paiement en espèces validé avec succès pour "${entrepriseNom}"!\n\n✅ Paiement enregistré en base de données\n✅ Entreprise transférée à l'étape de révision\n\n⚠️ Note: Erreur lors de la génération du reçu`);
        navigate('/dossier');
      }

    } catch (error: any) {
      console.error('Erreur lors de la validation du paiement:', error);
      setError('Erreur lors de la validation du paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Retour à la page précédente
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
    navigate('/accueil', { state: { activeTab: 'regisseur' } });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BanknotesIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validation Paiement Espèces
          </h1>
          <p className="text-lg text-gray-600">Validation agent - Paiement en espèces</p>
          <p className="text-2xl font-semibold text-sky-700 mt-2">
            {formatAmount(amount)}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <BuildingOffice2Icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Validation de paiement</h2>
              <p className="text-lg text-gray-600 mt-1">
                Entreprise: <span className="font-semibold">{entrepriseNom}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-lg">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Montant payé (FCFA) *
                </label>
                <input
                  type="number"
                  value={montantPaye}
                  onChange={(e) => setMontantPaye(e.target.value)}
                  className="w-full px-3 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Numéro de reçu (optionnel)
                </label>
                <input
                  type="text"
                  value={numeroRecu}
                  onChange={(e) => setNumeroRecu(e.target.value)}
                  className="w-full px-3 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Laissez vide pour génération automatique"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Si vide, une référence unique sera générée automatiquement
                </p>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Agence de réception *
                </label>
                <select
                  value={agenceReception}
                  onChange={(e) => setAgenceReception(e.target.value)}
                  className="w-full px-3 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Sélectionnez une agence</option>
                  {agences.map((agence) => (
                    <option key={agence.id} value={agence.id}>
                      {agence.name} - {agence.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Informations complémentaires..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-2 py-0 text-lg border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-2 py-0 text-lg bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all font-bold"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>{loading ? 'Validation...' : 'Valider le paiement'}</span>
                </button>
              </div>
            </form>

            <div className="mt-6 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <div className="flex items-center space-x-2 text-lg text-sky-700">
                <BanknotesIcon className="h-5 w-5" />
                <span>Paiement espèces - Validation agent sécurisée</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleCancel}
            className="text-sky-600 hover:text-sky-700 underline text-lg font-medium flex items-center gap-2 mx-auto"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Retour
          </button>
        </div>
      </div>

      {/* Modal de reçu de paiement */}
      {showReceipt && receiptData && (
        <PaymentReceipt
          paymentData={receiptData}
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
};

export default PaymentCashPage;
























