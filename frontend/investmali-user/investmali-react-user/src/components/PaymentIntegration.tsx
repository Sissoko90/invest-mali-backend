import React, { useState } from 'react';
import PaymentMethodModal from './PaymentMethodModal';
import PaymentReceipt from './PaymentReceipt';
import { paymentService } from '../services/paymentService';

interface PaymentIntegrationProps {
  entrepriseId: string;
  onSuccess?: (paymentResult: any) => void;
  onCancel?: () => void;
  triggerButton?: React.ReactNode;
  amount?: number; // Si fourni, skip le calcul des frais
}

const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  entrepriseId,
  onSuccess,
  onCancel,
  triggerButton,
  amount
}) => {
  const [currentStep, setCurrentStep] = useState<'trigger' | 'method' | 'payment' | 'receipt'>('trigger');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(amount || 0);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleTriggerClick = () => {
    setCurrentStep('method');
  };

  const handleMethodSelected = (method: string, calculatedAmount: number) => {
    setSelectedMethod(method);
    setPaymentAmount(calculatedAmount);
    
    if (method === 'TRESORPAY') {
      // Rediriger vers la page TresorPay avec l'interface de saisie
      window.location.href = `/payment/tresorpay?entrepriseId=${entrepriseId}&amount=${calculatedAmount}`;
    }
  };

  const handlePaymentSuccess = (result: any) => {
    console.log('🎉 Paiement intégré réussi:', result);
    
    // Préparer les données pour le reçu
    const receiptData = {
      entrepriseId: entrepriseId,
      entrepriseName: 'Votre entreprise', // À récupérer depuis l'API
      entrepriseType: 'SARL',
      localisation: 'Mali',
      commune: 'Bamako',
      amount: paymentAmount,
      paymentMethod: 'Carte bancaire',
      transactionId: result.id,
      paymentDate: new Date().toISOString(),
      status: 'success' as const,
      dossierNumber: `DOS-${Date.now()}`
    };
    
    setPaymentResult(receiptData);
    setCurrentStep('receipt');
    
    // Appeler le callback de succès si fourni
    if (onSuccess) {
      onSuccess(result);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('❌ Erreur paiement intégré:', errorMessage);
    setError(errorMessage);
  };

  const handleCancel = () => {
    setCurrentStep('trigger');
    setSelectedMethod('');
    setError('');
    
    if (onCancel) {
      onCancel();
    }
  };

  const handleReceiptClose = () => {
    setCurrentStep('trigger');
    setPaymentResult(null);
    
    // Optionnel : callback de succès final
    if (onSuccess && paymentResult) {
      onSuccess(paymentResult);
    }
  };

  // Étape 1: Bouton déclencheur
  if (currentStep === 'trigger') {
    return (
      <div>
        {triggerButton ? (
          <div onClick={handleTriggerClick} style={{ cursor: 'pointer' }}>
            {triggerButton}
          </div>
        ) : (
          <button
            onClick={handleTriggerClick}
            className="px-6 py-3 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent-dark transition-colors flex items-center space-x-2"
          >
<<<<<<< HEAD
            {/* <span>💳</span> */}
=======
            <span>💳</span>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
            <span>Procéder au paiement</span>
          </button>
        )}
      </div>
    );
  }

  // Étape 2: Sélection de méthode
  if (currentStep === 'method') {
    return (
      <PaymentMethodModal
        isOpen={true}
        onClose={handleCancel}
        entrepriseId={entrepriseId}
        amount={amount}
        onMethodSelected={handleMethodSelected}
      />
    );
  }

  // Étape 3: Paiement TresorPay
  if (currentStep === 'payment' && selectedMethod === 'TRESORPAY') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                💳 Paiement sécurisé
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Montant: <span className="font-semibold text-investmali-accent">
                {paymentService.formatAmount(paymentAmount)}
              </span>
            </p>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-4">❌</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erreur de paiement
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setError('')}
                    className="w-full px-4 py-2 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent-dark"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Redirection vers TresorPay en cours...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Étape 4: Reçu
  if (currentStep === 'receipt' && paymentResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header de succès */}
          <div className="p-6 border-b border-gray-200 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Paiement réussi !
            </h2>
            <p className="text-gray-600">
              Votre paiement de <span className="font-semibold text-investmali-accent">
                {paymentService.formatAmount(paymentAmount)}
              </span> a été traité avec succès
            </p>
          </div>

          {/* Reçu */}
          <div className="p-6">
            <PaymentReceipt
              paymentData={paymentResult}
              onClose={handleReceiptClose}
            />
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 text-center">
            <button
              onClick={handleReceiptClose}
              className="px-6 py-3 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent-dark transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentIntegration;

