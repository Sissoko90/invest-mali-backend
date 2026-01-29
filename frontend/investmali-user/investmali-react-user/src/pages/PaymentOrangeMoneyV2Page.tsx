import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { businessAPI } from '../services/api';
import PaymentStatus from '../components/PaymentStatus';
import orangeMoneyV2Service, { TransactionStatusRequest, TransactionStatusResponse } from '../services/orangeMoneyV2Service';
import orangeMoneyImg from '../assets/images/logos/orange-money.jpeg';

const PaymentOrangeMoneyV2Page: React.FC = () => {
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

  // Fonction pour initier le paiement Orange Money V2
  const handleOrangeMoneyV2Payment = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🍊 [PaymentOrangeMoneyV2Page] Initialisation du paiement Orange Money V2');
      
      // Valider les paramètres
      const validationErrors = orangeMoneyV2Service.validatePaymentRequest({
        entrepriseId,
        amount
      });

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Appeler le service Orange Money V2
      const data = await orangeMoneyV2Service.initiatePayment({
        entrepriseId,
        amount
      });

      if (data.success && data.payment_url) {
        console.log('✅ [PaymentOrangeMoneyV2Page] URL de paiement reçue:', data.payment_url);
        console.log('🎫 [PaymentOrangeMoneyV2Page] Pay token:', data.pay_token);
        console.log('📋 [PaymentOrangeMoneyV2Page] Réponse complète:', data);
        
        // Rediriger vers la page de paiement Orange Money
        // Selon votre test Postman, l'URL générée automatiquement nous redirige vers Orange Money
        orangeMoneyV2Service.redirectToPayment(data.payment_url);
      } else {
        throw new Error(data.error || data.message || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error: any) {
      console.error('❌ [PaymentOrangeMoneyV2Page] Erreur:', error);
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
        return `CEX-V2-${year}-${month}-${day}-${random}`;
      };

      setPaymentResult({
        status: 'success',
        title: 'Paiement Orange Money V2 réussi !',
        message: 'Votre paiement a été traité avec succès via la nouvelle API Orange Money.',
        details: `Transaction: ${transactionId}\nMontant: ${formatAmount(amount)}\nVotre demande est maintenant en cours de traitement.\nVersion: Orange Money V2`,
        transactionRef: transactionId,
        paymentData: {
          entrepriseId: entrepriseId,
          entrepriseName: entrepriseData?.nom || entrepriseNom || 'Entreprise',
          entrepriseType: entrepriseData?.typeEntreprise || 'Entreprise Individuelle',
          localisation: entrepriseData?.division?.nom || 'Non spécifiée',
          commune: entrepriseData?.commune || 'Non spécifiée',
          amount: amount,
          paymentMethod: 'Orange Money V2',
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
        message: 'Le paiement a été traité par Orange Money V2 mais une erreur s\'est produite.',
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
        message: 'Le paiement Orange Money V2 a été annulé ou a échoué.',
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
          <div className="mb-4 flex justify-center">
            <img 
              src={orangeMoneyImg} 
              alt="Orange Money"
              className="w-16 h-16 object-contain rounded"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Orange Money V2
          </h1>
          <p className="text-gray-600">Paiement sécurisé via Orange Money</p>
          <div className="mt-2">
            <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Nouvelle API V2
            </span>
          </div>
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
            onClick={handleOrangeMoneyV2Payment}
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
                <img 
                  src={orangeMoneyImg} 
                  alt="Orange Money"
                  className="w-6 h-6 object-contain rounded mr-3"
                />
                Payer avec Orange Money V2
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
              <p className="font-medium mb-2">Nouvelle API Orange Money V2 :</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Cliquez sur "Payer avec Orange Money V2"</li>
                <li>Vous serez redirigé vers la page de paiement Orange Money</li>
                <li>Saisissez votre numéro et confirmez le paiement</li>
                <li>Vous serez automatiquement redirigé après le paiement</li>
              </ol>
              <p className="mt-2 text-xs text-orange-700">
                ✨ Cette version utilise la dernière API Orange Money avec OAuth2 et webpayment
              </p>
            </div>
          </div>
        </div>

        {/* Technical Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Informations techniques (dev) :</p>
              <p>• Endpoint: /api/v1/orange-money/v2/initiate</p>
              <p>• OAuth: https://api.orange.com/oauth/v3/token</p>
              <p>• Webpay: https://api.orange.com/orange-money-webpay/dev/v1/webpayment</p>
              <p>• Devise: OUV (selon test Postman)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentOrangeMoneyV2Page;
