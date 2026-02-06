import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import PaymentStatus from '../components/PaymentStatus';

const PaymentMoovMoneyPage: React.FC = () => {
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
      setError('Veuillez saisir votre numéro Moov Money');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentData = {
        entrepriseId,
        paymentMethod: 'MOOV_MONEY',
        amount,
        currency: 'xof',
        description: 'Frais de création d\'entreprise - API-Invest Mali',
        methodData: {
          phoneNumber: phoneNumber.trim()
        }
      };

      const response = await paymentService.initiatePayment(paymentData);
      setPaymentResult(response);

    } catch (error: any) {
      console.error('Erreur paiement Moov Money:', error);
      setError(error.message || 'Erreur lors de l\'initiation du paiement');
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
        title="Paiement Moov Money initié"
        message="Suivez les instructions pour finaliser votre paiement"
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
          <div className="text-6xl mb-4">📲</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Moov Money
          </h1>
          <p className="text-gray-600">
            Paiement mobile sécurisé
          </p>
          <p className="text-lg font-semibold text-investmali-accent mt-2">
            {paymentService.formatAmount(amount)}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro Moov Money
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
                  placeholder="60 12 34 56"
                  className="block w-full pl-20 pr-3 py-3 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-mali-emerald focus:border-investmali-accent"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Saisissez votre numéro Moov Money (sans l'indicatif +223)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Instructions:</h3>
              <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                <li>Saisissez votre numéro Moov Money</li>
                <li>Cliquez sur "Initier le paiement"</li>
                <li>Composez *555# sur votre téléphone</li>
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
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg 
                         hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Initiation...</span>
                  </>
                ) : (
                  <>
                    <span>📲</span>
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
              <span>Transaction sécurisée via Moov Money Mali</span>
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

export default PaymentMoovMoneyPage;

