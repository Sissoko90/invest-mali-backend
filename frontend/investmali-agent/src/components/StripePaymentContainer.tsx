import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';

interface StripePaymentContainerProps {
  entrepriseId: string;
  entrepriseNom: string;
  amount: number;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const TresorPaymentContainer: React.FC<StripePaymentContainerProps> = ({
  entrepriseId,
  entrepriseNom,
  amount,
  onSuccess,
  onError,
  onCancel
}) => {
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeTresorPay();
  }, []);

  const initializeTresorPay = async () => {
    try {
      setLoading(true);
      
      // Créer un paiement TresorPay
      const paymentData = {
        entrepriseId,
        paymentMethod: 'TRESORPAY',
        amount: amount * 100, // Convertir FCFA en centimes
        currency: 'xof',
        description: `Frais de création d'entreprise - ${entrepriseNom} - Traité par agent`,
        metadata: {
          processedByAgent: 'true',
          entrepriseNom: entrepriseNom
        }
      };

      console.log('🔧 [Agent] Initiation paiement TresorPay:', paymentData);
      const response = await paymentService.initiatePayment(paymentData);
      
      if (response.redirectUrl && response.paymentId) {
        setPaymentUrl(response.redirectUrl);
        setPaymentReference(response.paymentId);
        console.log('✅ [Agent] TresorPay initialisé:', response.paymentId);
      } else {
        throw new Error('Réponse TresorPay invalide - URL de paiement manquante');
      }

    } catch (error: any) {
      console.error('❌ [Agent] Erreur initialisation TresorPay:', error);
      onError(error.message || 'Erreur lors de l\'initialisation du paiement TresorPay');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = () => {
    if (paymentUrl) {
      // Ouvrir TresorPay dans une nouvelle fenêtre
      const paymentWindow = window.open(paymentUrl, 'tresorpay', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      // Vérifier périodiquement si le paiement est terminé
      const checkPayment = setInterval(async () => {
        try {
          const status = await paymentService.getPaymentStatus(paymentReference);
          if (status.status === 'SUCCEEDED' || status.status === 'PAID') {
            clearInterval(checkPayment);
            if (paymentWindow) paymentWindow.close();
            onSuccess({
              id: paymentReference,
              status: 'succeeded',
              amount: amount
            });
          } else if (status.status === 'CANCELLED' || status.status === 'FAILED') {
            clearInterval(checkPayment);
            if (paymentWindow) paymentWindow.close();
            onError('Paiement annulé ou échoué');
          }
        } catch (error) {
          console.error('Erreur vérification statut:', error);
        }
      }, 3000); // Vérifier toutes les 3 secondes

      // Nettoyer l'intervalle si la fenêtre est fermée manuellement
      const checkClosed = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkPayment);
          clearInterval(checkClosed);
        }
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mali-emerald mx-auto"></div>
          <p className="mt-4 text-gray-600">Initialisation du paiement TresorPay...</p>
        </div>
      </div>
    );
  }

  if (!paymentUrl || !paymentReference) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur d'initialisation
        </h3>
        <p className="text-gray-600 mb-4">
          Impossible d'initialiser le paiement TresorPay
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💳</div>
          <h2 className="text-xl font-bold text-gray-900">Paiement TresorPay</h2>
          <p className="text-sm text-gray-600 mt-1">
            Entreprise: <span className="font-semibold">{entrepriseNom}</span>
          </p>
          <p className="text-sm text-gray-600">
            Montant: <span className="font-semibold text-mali-emerald">
              {paymentService.formatAmount(amount)}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Référence: {paymentReference}
          </p>
        </div>

        {/* Agent Notice */}
        <div className="mb-6 p-4 bg-primary-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-primary-500 text-lg">👤</div>
            <div>
              <h4 className="font-medium text-primary-900">Mode Agent</h4>
              <p className="text-sm text-primary-700 mt-1">
                Vous traitez le paiement TresorPay pour le client. 
                Le paiement s'ouvrira dans une nouvelle fenêtre.
              </p>
            </div>
          </div>
        </div>

        {/* TresorPay Payment Button */}
        <div className="space-y-4">
          <button
            onClick={handleOpenPayment}
            className="w-full px-6 py-4 bg-mali-emerald text-white rounded-lg hover:bg-mali-emerald-dark transition-colors font-semibold"
          >
            🏦 Ouvrir TresorPay
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Méthodes de paiement disponibles :</p>
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <span>📱 Orange Money</span>
              <span>📱 Moov Money</span>
              <span>💳 Carte bancaire</span>
              <span>🌊 Wave</span>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>🔒</span>
            <span>Paiement sécurisé par TresorPay - Données protégées par chiffrement SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TresorPaymentContainer;
























