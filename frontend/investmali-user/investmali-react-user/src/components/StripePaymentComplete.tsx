import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from './StripeCheckoutForm';
import { paymentService } from '../services/paymentService';

interface StripePaymentCompleteProps {
  entrepriseId: string;
  amount: number;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const StripePaymentComplete: React.FC<StripePaymentCompleteProps> = ({
  entrepriseId,
  amount,
  onSuccess,
  onError,
  onCancel
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'syncing' | 'completed'>('idle');

  useEffect(() => {
    initializeStripe();
  }, []);

  const initializeStripe = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Initialisation Stripe pour entreprise:', entrepriseId);
      
      // Récupérer la clé publique Stripe
      const publicKey = await paymentService.getStripePublicKey();
      console.log('🔑 Clé publique Stripe récupérée');
      
      const stripe = loadStripe(publicKey);
      setStripePromise(stripe);

      // Créer un PaymentIntent
      const paymentData = {
        entrepriseId,
        paymentMethod: 'STRIPE',
        amount,
        currency: 'xof',
        description: 'Frais de création d\'entreprise - API-Invest Mali'
      };

      console.log('💳 Création PaymentIntent:', paymentData);
      const response = await paymentService.initiatePayment(paymentData);
      
      if (response.clientSecret) {
        setClientSecret(response.clientSecret);
        console.log('✅ PaymentIntent créé avec succès');
      } else if (response.redirectUrl) {
        // Redirection vers Stripe Checkout
        window.location.href = response.redirectUrl;
        return;
      } else {
        throw new Error('Réponse Stripe invalide');
      }

    } catch (error: any) {
      console.error('❌ Erreur initialisation Stripe:', error);
      onError(error.message || 'Erreur lors de l\'initialisation du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    console.log('✅ Paiement réussi:', paymentIntent);
    setPaymentStatus('syncing');
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token utilisé:', token ? 'Présent' : 'MANQUANT');
      
      // Synchroniser le paiement avec le backend
      console.log('🔄 Synchronisation avec le backend...');
      const response = await fetch(`http://localhost:8080/api/payments/stripe/${paymentIntent.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Réponse backend:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Paiement persisté avec succès:', responseData);
        
        // Attendre un peu pour que l'association soit établie
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setPaymentStatus('completed');
        onSuccess({
          ...paymentIntent,
          syncResponse: responseData
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur persistance:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Erreur synchronisation: ${response.status}`);
      }
    } catch (persistError: any) {
      console.error('❌ Erreur persistance paiement:', persistError);
      onError(`Paiement réussi mais erreur de synchronisation: ${persistError.message}`);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Erreur paiement:', error);
    setPaymentStatus('idle');
    onError(error);
  };

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#10b981', // mali-emerald
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    }
  };

  const options = {
    clientSecret,
    appearance,
    locale: 'fr' as const
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-investmali-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Initialisation du paiement sécurisé...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'syncing') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Synchronisation du paiement...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter, ne fermez pas cette page</p>
        </div>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur d'initialisation
        </h3>
        <p className="text-gray-600 mb-4">
          Impossible d'initialiser le paiement sécurisé
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
          <h2 className="text-xl font-bold text-gray-900">Paiement sécurisé</h2>
          <p className="text-sm text-gray-600 mt-1">
            Montant: <span className="font-semibold text-investmali-accent">
              {paymentService.formatAmount(amount)}
            </span>
          </p>
        </div>

        {/* Stripe Elements */}
        <Elements stripe={stripePromise} options={options}>
          <StripeCheckoutForm
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={onCancel}
          />
        </Elements>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>🔒</span>
            <span>Paiement sécurisé par Stripe - Vos données sont protégées</span>
          </div>
        </div>

        {/* Status Indicator */}
        {paymentStatus === 'processing' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Traitement du paiement en cours...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripePaymentComplete;
