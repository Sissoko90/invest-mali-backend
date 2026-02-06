import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import PaymentStatus from '../components/PaymentStatus';

const PaymentBankTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const handleInitiateTransfer = async () => {
    setLoading(true);
    setError('');

    try {
      const paymentData = {
        entrepriseId,
        paymentMethod: 'BANK_TRANSFER',
        amount,
        currency: 'xof',
        description: 'Frais de création d\'entreprise - API-Invest Mali',
        methodData: {
          bankAccount: 'ML13 BMLI 0001 0000 0000 0000 1234',
          bankCode: 'BMLIMALI'
        }
      };

      const response = await paymentService.initiatePayment(paymentData);
      setPaymentResult(response);

    } catch (error: any) {
      console.error('Erreur virement bancaire:', error);
      setError(error.message || 'Erreur lors de l\'initiation du virement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile?tab=applications');
  };

  if (paymentResult) {
    return (
      <PaymentStatus
        status="pending"
        title="Virement bancaire initié"
        message="Effectuez le virement avec les informations ci-dessous"
        details={paymentResult.paymentInstructions}
        transactionRef={paymentResult.transactionReference}
        onContinue={() => navigate('/profile?tab=applications')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏦</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Virement Bancaire
          </h1>
          <p className="text-gray-600">
            Paiement par virement sécurisé
          </p>
          <p className="text-lg font-semibold text-investmali-accent mt-2">
            {paymentService.formatAmount(amount)}
          </p>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Informations bancaires</h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Bénéficiaire</label>
              <p className="font-mono text-sm">API-INVEST MALI</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">IBAN</label>
              <p className="font-mono text-sm">ML13 BMLI 0001 0000 0000 0000 1234</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">BIC/SWIFT</label>
              <p className="font-mono text-sm">BMLIMALI</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Banque</label>
              <p className="font-mono text-sm">Banque Malienne de Solidarité</p>
            </div>
            
            <div className="p-3 bg-investmali-accent bg-opacity-10 rounded-lg border border-investmali-accent">
              <label className="block text-sm font-medium text-investmali-accent mb-1">Montant exact</label>
              <p className="font-semibold text-investmali-accent">{paymentService.formatAmount(amount)}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions importantes:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Effectuez le virement avec le montant exact</li>
              <li>Indiquez votre nom complet en référence</li>
              <li>Conservez le reçu de virement</li>
              <li>Le traitement peut prendre 1-3 jours ouvrés</li>
              <li>Vous recevrez une confirmation par email</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg 
                       hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Retour
            </button>
            
            <button
              onClick={handleInitiateTransfer}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Générer la référence</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-blue-500 text-lg">🔒</div>
            <div>
              <h4 className="font-medium text-blue-900">Sécurité</h4>
              <p className="text-sm text-blue-700">
                Vérifiez toujours les informations bancaires avant d'effectuer le virement
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleCancel}
            className="text-investmali-accent hover:text-investmali-accent-dark underline"
          >
            ← Retour aux méthodes de paiement
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentBankTransferPage;

