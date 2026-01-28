import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import PaymentStatus from '../components/PaymentStatus';

const PaymentCashPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedAgency, setSelectedAgency] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  const agencies = [
    {
      id: 'bamako-centre',
      name: 'Bamako Centre',
      address: 'ACI 2000, près de la BCEAO',
      hours: 'Lun-Ven: 8h-17h, Sam: 8h-12h',
      phone: '+223 20 12 34 56'
    },
    {
      id: 'bamako-hippodrome',
      name: 'Bamako Hippodrome',
      address: 'Avenue Cheick Zayed, Hippodrome',
      hours: 'Lun-Ven: 8h-17h, Sam: 8h-12h',
      phone: '+223 20 12 34 57'
    }
  ];

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/profile?tab=applications');
    }
  }, [entrepriseId, amount, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgency) {
      setError('Veuillez sélectionner une agence');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const agency = agencies.find(a => a.id === selectedAgency);
      const paymentData = {
        entrepriseId,
        paymentMethod: 'CASH',
        amount,
        currency: 'xof',
        description: 'Frais de création d\'entreprise - API-Invest Mali',
        methodData: {
          agencyLocation: agency?.name || selectedAgency,
          cashReference: `CASH_${Date.now()}`
        }
      };

      const response = await paymentService.initiatePayment(paymentData);
      setPaymentResult(response);

    } catch (error: any) {
      console.error('Erreur paiement espèces:', error);
      setError(error.message || 'Erreur lors de la génération de la référence');
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
        title="Référence de paiement générée"
        message="Rendez-vous dans l'agence sélectionnée avec cette référence"
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
          <div className="text-6xl mb-4">💵</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement en Espèces
          </h1>
          <p className="text-gray-600">
            Paiement dans nos agences
          </p>
          <p className="text-lg font-semibold text-investmali-accent mt-2">
            {paymentService.formatAmount(amount)}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sélectionnez une agence
              </label>
              
              <div className="space-y-3">
                {agencies.map((agency) => (
                  <div
                    key={agency.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedAgency === agency.id
                        ? 'border-investmali-accent bg-investmali-accent bg-opacity-5'
                        : 'border-gray-200 hover:border-investmali-accent hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAgency(agency.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{agency.name}</h3>
                          {selectedAgency === agency.id && (
                            <div className="w-5 h-5 bg-investmali-accent rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">📍 {agency.address}</p>
                        <p className="text-sm text-gray-600 mb-1">🕒 {agency.hours}</p>
                        <p className="text-sm text-gray-600">📞 {agency.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">À apporter:</h3>
              <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                <li>Pièce d'identité valide</li>
                <li>Montant exact en espèces</li>
                <li>Référence de paiement (générée après validation)</li>
              </ul>
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
                disabled={loading || !selectedAgency}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg 
                         hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
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
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>🔒</span>
              <span>Paiement sécurisé dans nos agences agréées</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Informations importantes</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Aucun frais supplémentaire pour le paiement en espèces</li>
            <li>• Reçu officiel remis après paiement</li>
            <li>• Traitement immédiat de votre dossier</li>
            <li>• Support disponible dans toutes nos agences</li>
          </ul>
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

export default PaymentCashPage;

