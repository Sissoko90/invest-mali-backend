import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js';
import { API_CONFIG } from '../config/api.config';

interface StripeCheckoutFormProps {
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  isAgentMode?: boolean;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  onSuccess,
  onError,
  onCancel,
  isAgentMode = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'Erreur de validation');
        } else {
          setMessage('Une erreur inattendue s\'est produite');
        }
        onError(error.message || 'Erreur de paiement');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Paiement Stripe réussi (Agent):', paymentIntent);
        
        // SYNCHRONISATION CRITIQUE : Appeler le backend pour persister le paiement
        try {
          console.log('🔄 Synchronisation avec le backend (Agent)...');
          const token = localStorage.getItem('agentToken'); // Token agent au lieu de token utilisateur
          
          const syncResponse = await fetch(`${API_CONFIG.BASE_URL}/payments/stripe/${paymentIntent.id}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Agent-Mode': 'true' // Header pour indiquer que c'est un agent
            }
          });
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            console.log('✅ Synchronisation réussie (Agent):', syncData);
            onSuccess(paymentIntent);
          } else {
            console.error('❌ Erreur synchronisation:', syncResponse.status);
            // Continuer quand même car le paiement Stripe a réussi
            onSuccess(paymentIntent);
          }
        } catch (syncError) {
          console.error('❌ Erreur appel synchronisation:', syncError);
          // Continuer quand même car le paiement Stripe a réussi
          onSuccess(paymentIntent);
        }
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setMessage('Authentification 3D Secure requise');
      }
    } catch (err: any) {
      console.error('Erreur paiement Stripe:', err);
      onError(err.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div>
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>

      {/* Address Element */}
      <div>
        <AddressElement 
          options={{
            mode: 'billing',
            allowedCountries: ['ML', 'FR', 'SN', 'CI', 'BF'],
            fields: {
              phone: 'always'
            }
          }}
        />
      </div>

      {/* Error Message */}
      {message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{message}</p>
        </div>
      )}

      {/* Agent Warning */}
      {isAgentMode && (
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-primary-500">⚠️</span>
            <p className="text-sm text-primary-700">
              <strong>Mode Agent :</strong> Assurez-vous d'avoir l'autorisation écrite du client 
              avant de saisir ses informations de carte bancaire.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg 
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
        
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 bg-mali-emerald text-white rounded-lg 
                     hover:bg-mali-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Traitement...</span>
            </>
          ) : (
            <>
              <span>🔒</span>
              <span>{isAgentMode ? 'Traiter le paiement' : 'Payer maintenant'}</span>
            </>
          )}
        </button>
      </div>

      {/* Payment Info */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        {isAgentMode ? (
          <>
            <p>En traitant ce paiement, vous confirmez avoir l'autorisation du client</p>
            <p>Transaction sécurisée avec chiffrement SSL 256-bit - Mode Agent</p>
          </>
        ) : (
          <>
            <p>En cliquant sur "Payer maintenant", vous acceptez nos conditions de service</p>
            <p>Paiement sécurisé avec chiffrement SSL 256-bit</p>
          </>
        )}
      </div>
    </form>
  );
};

export default StripeCheckoutForm;
























