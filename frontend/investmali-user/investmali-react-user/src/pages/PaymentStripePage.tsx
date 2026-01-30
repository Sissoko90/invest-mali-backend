import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StripePaymentComplete from '../components/StripePaymentComplete';
import PaymentReceipt from '../components/PaymentReceipt';
import { businessAPI } from '../services/api';

const PaymentStripePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [entrepriseData, setEntrepriseData] = useState<any>(null);

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/profile?tab=applications');
      return;
    }
    
    // Charger les données de l'entreprise
    loadEntrepriseData();
  }, [entrepriseId, amount, navigate]);

  const loadEntrepriseData = async () => {
    try {
      console.log('📋 Chargement données entreprise:', entrepriseId);
      const response = await businessAPI.getApplication(entrepriseId);
      const data = (response && response.data) ? response.data : response;
      setEntrepriseData(data);
      console.log('📊 Données entreprise chargées:', data);
    } catch (error) {
      console.error('❌ Erreur chargement entreprise:', error);
    }
  };

  const handlePaymentSuccess = async (result: any) => {
    console.log('🎉 Paiement complété avec succès:', result);
    
    try {
      // Recharger les données de l'entreprise pour avoir le statut mis à jour
      await loadEntrepriseData();
      
      // Préparer les données pour le reçu
      const receiptData = {
        paymentId: result.id,
        amount: amount,
        currency: 'XOF',
        status: 'succeeded',
        paymentMethod: 'Carte bancaire',
        transactionDate: new Date().toISOString(),
        entreprise: {
          id: entrepriseId,
          name: entrepriseData?.nom || entrepriseData?.businessName || 'Entreprise',
          type: entrepriseData?.formeJuridique || entrepriseData?.legalForm || 'SARL'
        },
        reference: result.id
      };
      
      setPaymentResult(receiptData);
      setShowReceipt(true);
      
    } catch (error) {
      console.error('❌ Erreur post-paiement:', error);
      // Même en cas d'erreur, on affiche le succès car le paiement a réussi
      setPaymentResult({
        paymentId: result.id,
        amount: amount,
        currency: 'XOF',
        status: 'succeeded',
        paymentMethod: 'Carte bancaire',
        transactionDate: new Date().toISOString(),
        entreprise: {
          id: entrepriseId,
          name: 'Entreprise',
          type: 'SARL'
        },
        reference: result.id
      });
      setShowReceipt(true);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('❌ Erreur paiement:', errorMessage);
    setError(errorMessage);
  };

  const handleCancel = () => {
    navigate('/profile?tab=applications');
  };

  const handleReceiptClose = () => {
    // Rediriger vers le profil avec un message de succès
    navigate('/profile?tab=applications&payment=success');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Affichage du reçu après paiement réussi
  if (showReceipt && paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header de succès */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              Paiement réussi !
            </h1>
            <p className="text-gray-600">
              Votre paiement de <span className="font-semibold text-investmali-accent">
                {formatAmount(amount)}
              </span> a été traité avec succès
            </p>
          </div>

          {/* Reçu */}
          <PaymentReceipt
            paymentData={paymentResult}
            onClose={handleReceiptClose}
          />

          {/* Actions */}
          <div className="text-center mt-8">
            <button
              onClick={handleReceiptClose}
              className="px-6 py-3 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent-dark transition-colors"
            >
              Retour à mes demandes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Erreur de paiement
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError('');
                  window.location.reload();
                }}
                className="w-full px-4 py-2 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent-dark"
              >
                Réessayer
              </button>
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage principal du paiement
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Finaliser votre paiement
          </h1>
          <p className="text-gray-600">
            Paiement sécurisé pour votre demande de création d'entreprise
          </p>
          {entrepriseData && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900">
                {entrepriseData.nom || entrepriseData.businessName || 'Votre entreprise'}
              </h3>
              <p className="text-sm text-gray-600">
                {entrepriseData.formeJuridique || entrepriseData.legalForm || 'SARL'}
              </p>
            </div>
          )}
        </div>

        {/* Composant de paiement Stripe */}
        <div className="flex justify-center">
          <StripePaymentComplete
            entrepriseId={entrepriseId}
            amount={amount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleCancel}
          />
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              🛡️ Paiement 100% sécurisé
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Chiffrement SSL 256-bit</li>
              <li>• Conformité PCI DSS</li>
              <li>• Vos données bancaires ne sont jamais stockées</li>
              <li>• Authentification 3D Secure</li>
            </ul>
          </div>
          
          <div className="mt-4 bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ Après votre paiement
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Reçu de paiement immédiat</li>
              <li>• Mise à jour automatique du statut</li>
              <li>• Traitement accéléré de votre dossier</li>
              <li>• Notification par email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStripePage;
<<<<<<< HEAD

=======

>>>>>>> 060c2b6fa (WIP: local changes before rebase)
