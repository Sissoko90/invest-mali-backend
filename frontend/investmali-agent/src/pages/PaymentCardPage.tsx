import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { entreprisesAPI, agentBusinessAPI } from '../services/api';
import { generateReceiptData, formatAmount } from '../services/receiptService';
import TresorPaymentContainer from '../components/StripePaymentContainer';
import PaymentStatus from '../components/PaymentStatus';

const PaymentCardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const entrepriseNom = searchParams.get('entrepriseNom') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/dashboard');
    }
  }, [entrepriseId, amount, navigate]);


  const handlePaymentSuccess = async (result: any) => {
    console.log('✅ Paiement réussi (Agent):', result);
    
    try {
      // Mettre à jour le statut vers PAIEMENT_VALIDE et l'étape vers REVISION
      const statusData = {
        status: 'PAIEMENT_VALIDE',
        note: `Paiement par carte bancaire traité par agent - Transaction Stripe: ${result.id} - Montant: ${amount} FCFA - Entreprise: ${entrepriseNom}`
      };

      await agentBusinessAPI.updateStatus(entrepriseId, statusData.status, statusData.note);

      // Générer les données de reçu avec les vraies informations de l'entreprise
      const paymentData = await generateReceiptData(
        entrepriseId,
        entrepriseNom,
        amount,
        'Carte Bancaire (Stripe)',
        result.id,
        'Agent API-INVEST'
      );

      setPaymentResult({
        status: 'success',
        title: 'Paiement réussi !',
        message: `Le paiement par carte bancaire a été traité avec succès pour "${entrepriseNom}".`,
        details: `Transaction Stripe: ${result.id}\nMontant: ${formatAmount(amount)}\nL'entreprise passe maintenant à l'étape de révision.`,
        transactionRef: result.id,
        paymentData: paymentData
      });

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setPaymentResult({
        status: 'error',
        title: 'Erreur de synchronisation',
        message: 'Le paiement a été traité par Stripe mais une erreur s\'est produite lors de la mise à jour.',
        details: 'Veuillez vérifier manuellement le statut de l\'entreprise.',
        transactionRef: result.id
      });
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Erreur paiement:', error);
    setError(error);
    setPaymentResult({
      status: 'error',
      title: 'Erreur de paiement',
      message: 'Une erreur s\'est produite lors du traitement du paiement.',
      details: error
    });
  };

  const handleCancel = () => {
    navigate('/dashboard');
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
        onContinue={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💳</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement TresorPay
          </h1>
          <p className="text-gray-600">Paiement sécurisé via TresorPay - Mode Agent</p>
          <p className="text-lg font-semibold text-mali-emerald mt-2">
            {formatAmount(amount)}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* TresorPay Payment Container */}
        <TresorPaymentContainer
          entrepriseId={entrepriseId}
          entrepriseNom={entrepriseNom}
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handleCancel}
        />

        {/* Return Link */}
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

export default PaymentCardPage;
























