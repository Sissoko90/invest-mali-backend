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
