import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js';

interface StripeCheckoutFormProps {
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  onSuccess,
  onError,
  onCancel
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
        console.log('✅ Paiement Stripe réussi:', paymentIntent);
        
        // SYNCHRONISATION CRITIQUE : Appeler le backend pour persister le paiement
        try {
          console.log('🔄 Synchronisation avec le backend...');
          const token = localStorage.getItem('token');
          
          const syncResponse = await fetch(`http://localhost:8080/api/v1/payments/stripe/${paymentIntent.id}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            console.log('✅ Synchronisation réussie:', syncData);
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
          className="flex-1 px-4 py-3 bg-investmali-accent text-white rounded-lg 
                     hover:bg-investmali-accent-dark disabled:opacity-50 disabled:cursor-not-allowed
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
              <span>Payer maintenant</span>
            </>
          )}
        </button>
      </div>

      {/* Payment Info */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>En cliquant sur "Payer maintenant", vous acceptez nos conditions de service</p>
        <p>Paiement sécurisé avec chiffrement SSL 256-bit</p>
      </div>
    </form>
  );
};

export default StripeCheckoutForm;

