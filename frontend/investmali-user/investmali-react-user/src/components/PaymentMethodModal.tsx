
import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PAYMENT_METHODS, paymentService } from '../services/paymentService';

// Import des images de logos
import carteBancaireImg from '../assets/images/logos/carte-bancaire.jpeg';
import orangeMoneyImg from '../assets/images/logos/orange-money.jpeg';
import moovMoneyImg from '../assets/images/logos/moov-money.jpeg';
import samaMoneyImg from '../assets/images/logos/sama-money.jpeg';
import waveImg from '../assets/images/logos/wave.jpeg';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrepriseId: string;
  amount?: number; // Montant optionnel passé depuis le parent
  onMethodSelected: (method: string, amount: number) => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  entrepriseId,
  amount,
  onMethodSelected
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [fees, setFees] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fonction pour obtenir l'image correspondante à chaque méthode de paiement
  const getPaymentMethodImage = (methodId: string): string | undefined => {
    const imageMap: { [key: string]: string | undefined } = {
      'TRESORPAY': carteBancaireImg,
      'CASH': undefined
    };
    return imageMap[methodId];
  };

  // Charger les frais au montage seulement si aucun montant n'est fourni
  useEffect(() => {
    if (isOpen && !amount) {
      loadFees();
    }
  }, [isOpen, amount]);

  const loadFees = async () => {
    try {
      setLoading(true);
      const feesData = await paymentService.calculateFees('BUSINESS_CREATION');
      setFees(feesData);
    } catch (error) {
      console.error('Erreur chargement frais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      // Utiliser le montant passé en paramètre ou celui des frais calculés
      const finalAmount = amount || (fees ? fees.amount : 0);
      onMethodSelected(selectedMethod, finalAmount);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-investmali-accent-600 rounded-xl shadow-lg">
                <CreditCardIcon className="h-6 w-6 text-white" />
              </div>
              Choisir une méthode de paiement
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          {(amount || fees) && (
            <p className="text-lg text-gray-600 mt-2">
              Montant à payer: <span className="font-semibold text-investmali-accent-700">
                {paymentService.formatAmount(amount || (fees ? fees.amount : 0))}
              </span>
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-investmali-accent-600 mx-auto"></div>
            <p className="mt-2 text-lg text-gray-600">Chargement des frais...</p>
          </div>
        )}

        {/* Methods List */}
        {!loading && (
          <div className="p-6">
            <div className="space-y-4">
              {Object.values(PAYMENT_METHODS).map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-investmali-accent-600 bg-investmali-accent-50'
                      : 'border-gray-200 hover:border-investmali-accent-600 hover:bg-gray-50'
                  } ${!method.supported ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.supported && handleMethodSelect(method.id)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="w-12 h-12 flex items-center justify-center">
                      {getPaymentMethodImage(method.id) ? (
                        <img 
                          src={getPaymentMethodImage(method.id)} 
                          alt={method.name}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="p-2 bg-investmali-accent-600 rounded-xl shadow-lg">
                          <CreditCardIcon className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                        {selectedMethod === method.id && (
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-lg text-gray-600 mt-1">{method.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{method.fees}</p>
                      
                      {!method.supported && (
                        <p className="text-sm text-red-500 mt-1">Bientôt disponible</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-investmali-accent-50 rounded-lg border border-investmali-accent-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-investmali-accent-600 rounded-lg shadow-md">
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-investmali-accent-900">Paiement sécurisé</h4>
                  <p className="text-lg text-investmali-accent-700 mt-1">
                    Toutes les transactions sont sécurisées et chiffrées. 
                    Vos données bancaires ne sont jamais stockées sur nos serveurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-lg text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedMethod || loading}
              className="px-6 py-2 text-lg bg-investmali-accent text-white rounded-lg hover:from-investmali-accent-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-bold"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
