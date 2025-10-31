<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { businessAPI } from '../services/api';
import PaymentStatus from '../components/PaymentStatus';

const PaymentOrangeMoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const entrepriseNom = searchParams.get('entrepriseNom') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/profile?tab=applications');
    }
  }, [entrepriseId, amount, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  };

  // Fonction pour initier le paiement Orange Money
  const handleOrangeMoneyPayment = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🍊 [PaymentOrangeMoneyPage] Initialisation du paiement Orange Money');
      
      // Appeler l'API backend pour initier le paiement Orange Money
      const response = await fetch('/api/v1/orange-money/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          entrepriseId: entrepriseId,
          amount: amount
        })
      });

      const data = await response.json();

      if (data.success && data.payment_url) {
        console.log('✅ [PaymentOrangeMoneyPage] URL de paiement reçue:', data.payment_url);
        
        // Rediriger vers la page de paiement Orange Money
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error: any) {
      console.error('❌ [PaymentOrangeMoneyPage] Erreur:', error);
      setError(error.message || 'Une erreur est survenue lors de l\'initialisation du paiement');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le succès du paiement (appelée après retour d'Orange Money)
  const handlePaymentSuccess = async (transactionId: string) => {
    try {
      // Récupérer les données de l'entreprise
      console.log('📋 Récupération données entreprise:', entrepriseId);
      const resp = await businessAPI.getApplication(entrepriseId);
      const entrepriseData = resp.data;
      
      // Générer un numéro de dossier
      const generateDossierNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
        return `CEX-${year}-${month}-${day}-${random}`;
      };

      setPaymentResult({
        status: 'success',
        title: 'Paiement Orange Money réussi !',
        message: 'Votre paiement a été traité avec succès.',
        details: `Transaction: ${transactionId}\nMontant: ${formatAmount(amount)}\nVotre demande est maintenant en cours de traitement.`,
        transactionRef: transactionId,
        paymentData: {
          entrepriseId: entrepriseId,
          entrepriseName: entrepriseData?.nom || entrepriseNom || 'Entreprise',
          entrepriseType: entrepriseData?.typeEntreprise || 'Entreprise Individuelle',
          localisation: entrepriseData?.division?.nom || 'Non spécifiée',
          commune: entrepriseData?.commune || 'Non spécifiée',
          amount: amount,
          paymentMethod: 'Orange Money',
          transactionId: transactionId,
          paymentDate: new Date().toISOString(),
          status: 'success' as const,
          dossierNumber: entrepriseData?.referenceServeur || generateDossierNumber()
        }
      });

    } catch (error: any) {
      console.error('Erreur lors de la récupération des données:', error);
      setPaymentResult({
        status: 'error',
        title: 'Erreur de synchronisation',
        message: 'Le paiement a été traité par Orange Money mais une erreur s\'est produite.',
        details: 'Veuillez vérifier votre profil pour confirmer le statut de votre demande.',
        transactionRef: transactionId
      });
    }
  };

  // Vérifier si on revient d'Orange Money avec des paramètres de succès
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const transactionId = urlParams.get('txnid') || urlParams.get('transaction_id');
    
    if (status === 'success' && transactionId) {
      handlePaymentSuccess(transactionId);
    } else if (status === 'failed' || status === 'cancelled') {
      setPaymentResult({
        status: 'error',
        title: 'Paiement annulé',
        message: 'Le paiement Orange Money a été annulé ou a échoué.',
        details: 'Vous pouvez réessayer ou choisir une autre méthode de paiement.'
      });
    }
  }, []);

  const handleCancel = () => {
    navigate('/profile?tab=applications');
  };

  // Afficher le résultat du paiement si disponible
  if (paymentResult) {
    return (
      <PaymentStatus
        status={paymentResult.status}
        title={paymentResult.title}
        message={paymentResult.message}
        details={paymentResult.details}
        transactionRef={paymentResult.transactionRef}
        paymentData={paymentResult.paymentData}
        onContinue={() => navigate('/profile?tab=applications&payment=success')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍊</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement Orange Money
          </h1>
          <p className="text-gray-600">Paiement sécurisé via Orange Money</p>
          <p className="text-lg font-semibold text-orange-600 mt-2">
            {formatAmount(amount)}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <div className="space-y-6">
          <button
            onClick={handleOrangeMoneyPayment}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Initialisation...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-3">🍊</span>
                Payer avec Orange Money
              </div>
            )}
          </button>
          
          <button
            onClick={handleCancel}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Retour aux méthodes de paiement
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-orange-600 mr-3 mt-0.5">
              ℹ️
            </div>
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-2">Comment ça marche :</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Cliquez sur "Payer avec Orange Money"</li>
                <li>Vous serez redirigé vers la page de paiement Orange Money</li>
                <li>Saisissez votre numéro et confirmez le paiement</li>
                <li>Vous serez automatiquement redirigé après le paiement</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOrangeMoneyPage;
=======
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { businessAPI } from '../services/api';

const PaymentOrangeMoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/profile?tab=applications');
    }
  }, [entrepriseId, amount, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Veuillez saisir votre numéro Orange Money');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentData = {
        entrepriseId,
        paymentMethod: 'ORANGE_MONEY',
        amount,
        currency: 'xof',
        description: 'Frais de création d\'entreprise - API-Invest Mali',
        methodData: {
          phoneNumber: phoneNumber.trim()
        }
      };

      const response = await paymentService.initiatePayment(paymentData);
      
      // Récupérer les données de l'entreprise depuis l'API
      console.log('📋 Récupération données entreprise:', entrepriseId);
      const resp = await businessAPI.getApplication(entrepriseId);
      const entrepriseData = (resp && resp.data) ? resp.data : resp;
      
      console.log('📊 Données entreprise reçues:', entrepriseData);
      
      // Extraire les données avec gestion des différents noms de champs
      const entrepriseName = entrepriseData.businessName || 
                            entrepriseData.business_name || 
                            entrepriseData.nom || 
                            entrepriseData.companyName || 
                            'Entreprise';
                            
      const entrepriseType = entrepriseData.legalForm || 
                            entrepriseData.legal_form || 
                            entrepriseData.formeJuridique || 
                            'Entreprise Individuelle';
                            
      const localisation = entrepriseData.localisation || 
                          entrepriseData.location || 
                          entrepriseData.adresse || 
                          '';
                          
      const commune = entrepriseData.commune || 
                     entrepriseData.municipality || 
                     '';
                     
      const reference = entrepriseData.reference || 
                       entrepriseData.dossierNumber || 
                       entrepriseData.referenceNumber || 
                       '';
      
      // Construire les paramètres pour la page de reçu avec les vraies données
      const receiptParams = new URLSearchParams({
        entrepriseId: entrepriseId,
        amount: amount.toString(),
        transactionId: response.transactionReference || response.id || 'TXN_' + Date.now(),
        paymentMethod: 'Orange Money',
        entrepriseName: entrepriseName,
        entrepriseType: entrepriseType,
        localisation: localisation,
        commune: commune,
        reference: reference
      });
      
      console.log('📄 Données reçu:', Object.fromEntries(receiptParams));
      
      // Rediriger directement vers la page de reçu
      navigate(`/payment/receipt?${receiptParams.toString()}`);

    } catch (error: any) {
      console.error('Erreur paiement Orange Money:', error);
      setError(error.message || 'Erreur lors de l\'initiation du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile?tab=applications');
  };

  // Plus besoin de cette logique car on redirige directement vers /payment/receipt

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Orange Money
          </h1>
          <p className="text-gray-600">
            Paiement mobile sécurisé
          </p>
          <p className="text-lg font-semibold text-mali-emerald mt-2">
            {paymentService.formatAmount(amount)}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro Orange Money
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">🇲🇱 +223</span>
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="70 12 34 56"
                  className="block w-full pl-20 pr-3 py-3 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-mali-emerald focus:border-mali-emerald"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Saisissez votre numéro Orange Money (sans l'indicatif +223)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">Instructions:</h3>
              <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
                <li>Saisissez votre numéro Orange Money</li>
                <li>Cliquez sur "Initier le paiement"</li>
                <li>Composez *144*4*4# sur votre téléphone</li>
                <li>Suivez les instructions pour valider</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg 
                         hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              
              <button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg 
                         hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Initiation...</span>
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    <span>Initier le paiement</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>🔒</span>
              <span>Transaction sécurisée via Orange Money Mali</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleCancel}
            className="text-mali-emerald hover:text-mali-emerald-dark underline"
          >
            ← Retour aux méthodes de paiement
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentOrangeMoneyPage;
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
