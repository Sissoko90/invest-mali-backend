import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Footer from '../components/Footer';
import tresorPayService from '../services/tresorPayService';

const PaiementCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const reference = searchParams.get('reference');

        if (!paymentId) {
          setStatus('error');
          setMessage('Identifiant de paiement manquant');
          return;
        }

        // Vérifier le statut du paiement auprès de TresorPay
        const paymentData = await tresorPayService.verifierPaiement(paymentId);
        setPaymentDetails(paymentData);

        switch (paymentData.status) {
          case 'completed':
          case 'success':
            setStatus('success');
            setMessage('Votre paiement a été traité avec succès !');
            break;
          case 'failed':
          case 'error':
            setStatus('error');
            setMessage('Le paiement a échoué. Veuillez réessayer.');
            break;
          case 'pending':
            setStatus('pending');
            setMessage('Votre paiement est en cours de traitement...');
            break;
          default:
            setStatus('error');
            setMessage('Statut de paiement inconnu');
        }
      } catch (error) {
        console.error('❌ [CALLBACK] Erreur lors de la vérification du paiement:', error);
        setStatus('error');
        setMessage('Erreur lors de la vérification du paiement');
      }
    };

    handleCallback();
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />;
      case 'pending':
        return <ClockIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />;
      default:
        return (
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const handleReturnToSuivi = () => {
    navigate('/autorisation-exercice/agrement?tab=suivi');
  };

  const handleRetryPayment = () => {
    navigate('/autorisation-exercice/agrement?tab=suivi');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center">
            {getStatusIcon()}
            
            <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
              {status === 'loading' && 'Vérification du paiement...'}
              {status === 'success' && 'Paiement réussi !'}
              {status === 'error' && 'Paiement échoué'}
              {status === 'pending' && 'Paiement en cours'}
            </h1>
            
            <p className="text-gray-600 mb-6 text-lg">
              {message}
            </p>

            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Référence</p>
                    <p className="font-medium">{paymentDetails.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Montant</p>
                    <p className="font-medium">{paymentDetails.amount?.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {paymentDetails.created_at ? new Date(paymentDetails.created_at).toLocaleString('fr-FR') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className={`font-medium ${getStatusColor()}`}>
                      {paymentDetails.status}
                    </p>
                  </div>
                </div>
                
                {paymentDetails.metadata && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Demande concernée</p>
                    <p className="font-medium">{paymentDetails.metadata.demandeId}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {status === 'success' && (
                <button
                  onClick={handleReturnToSuivi}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Retour au suivi
                </button>
              )}
              
              {status === 'error' && (
                <>
                  <button
                    onClick={handleRetryPayment}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Réessayer le paiement
                  </button>
                  <button
                    onClick={handleReturnToSuivi}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Retour au suivi
                  </button>
                </>
              )}
              
              {status === 'pending' && (
                <button
                  onClick={handleReturnToSuivi}
                  className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Retour au suivi
                </button>
              )}
              
              {status === 'loading' && (
                <button
                  disabled
                  className="inline-flex items-center px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium"
                >
                  Vérification en cours...
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaiementCallback;
