<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  PhoneIcon,
  ArrowLeftIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';

// Import des images de logos
import carteBancaireImg from '../assets/images/logos/carte-bancaire.jpeg';

interface PaymentData {
  entrepriseId: string;
  amount: string;
}

interface PaymentFormData {
  phoneNumber: string;
  paymentProvider: string;
}

const PaymentTresorPayPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'initiate' | 'processing'>('initiate');
  const [formData, setFormData] = useState<PaymentFormData>({
    phoneNumber: '',
    paymentProvider: 'ORANGE_MONEY'
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const entrepriseId = params.get('entrepriseId');
    const amount = params.get('amount');

    if (entrepriseId && amount) {
      setPaymentData({
        entrepriseId,
        amount
      });
    } else {
      console.error('Paramètres manquants dans l\'URL');
      navigate('/mes-demandes');
    }
  }, [location.search, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleInitiatePayment = async () => {
    if (!paymentData) return;

    // Validation du numéro de téléphone
    if (!formData.phoneNumber.trim()) {
      alert('Veuillez saisir votre numéro de téléphone');
      return;
    }

    // Validation du format du numéro (8 chiffres commençant par 6-9)
    const phoneRegex = /^[6-9]\d{7}$/;
    const cleanPhone = formData.phoneNumber.replace(/\D/g, '').slice(-8);
    if (!phoneRegex.test(cleanPhone)) {
      alert('Veuillez saisir un numéro de téléphone valide (8 chiffres commençant par 6, 7, 8 ou 9)');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('🚀 Initiation du paiement TresorPay...');

      const paymentRequest = {
        entrepriseId: paymentData.entrepriseId,
        paymentMethod: 'TRESORPAY',
        amount: parseInt(paymentData.amount),
        currency: 'xof',
        description: `Frais de création d'entreprise - API-Invest Mali`,
        methodData: {
          phoneNumber: cleanPhone,
          paymentProvider: formData.paymentProvider
        }
      };

      console.log('📤 Envoi de la requête de paiement:', paymentRequest);

      const paymentResponse = await apiRequest('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(paymentRequest)
      });

      console.log('✅ Réponse de paiement reçue:', paymentResponse);

      if (paymentResponse.status === 'PENDING' && paymentResponse.redirectUrl) {
        setPaymentUrl(paymentResponse.redirectUrl);
        setPaymentReference(paymentResponse.paymentId);
        setCurrentStep('processing');
        
        console.log('🔄 URL TresorPay générée:', paymentResponse.redirectUrl);
        console.log('📋 Référence de paiement:', paymentResponse.paymentId);
        
        // Ne pas rediriger automatiquement, laisser l'utilisateur cliquer
        // window.location.href = paymentResponse.redirectUrl;
      } else {
        throw new Error('Réponse de paiement invalide');
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initiation du paiement:', error);
      alert(`Erreur lors de l'initiation du paiement: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Retour à la page précédente
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-investmali-accent-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-investmali-accent-600 rounded-xl shadow-lg">
                <CreditCardIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paiement TresorPay</h1>
                <p className="text-lg text-gray-600">Paiement sécurisé</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Montant à payer</p>
              <p className="text-2xl font-bold text-investmali-accent-700">
                {formatAmount(parseInt(paymentData.amount))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 'initiate' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Paiement via TresorPay</h2>
                <p className="text-lg text-gray-600">Vous serez redirigé vers la plateforme sécurisée TresorPay pour effectuer votre paiement</p>
              </div>
              
              <div className="bg-investmali-accent-50 rounded-lg p-4 border border-investmali-accent-200">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-investmali-accent-600 rounded-lg shadow-md">
                    <ShieldCheckIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-investmali-accent-900">Paiement sécurisé</h4>
                    <p className="text-lg text-investmali-accent-700 mt-1">TresorPay est la plateforme officielle de paiement du Trésor Public du Mali. Toutes les transactions sont sécurisées et chiffrées.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Informations de paiement</h3>
                <div className="space-y-2 text-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant:</span>
                    <span className="font-semibold">{formatAmount(parseInt(paymentData.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Méthode:</span>
                    <span className="font-semibold">TresorPay</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-semibold">Frais de création d'entreprise</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-investmali-accent-600" />
                  Informations de paiement mobile
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Mode de paiement</label>
                    <select
                      value={formData.paymentProvider}
                      onChange={(e) => setFormData({...formData, paymentProvider: e.target.value})}
                      className="w-full px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-investmali-accent-500 focus:border-transparent"
                    >
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="MOOV_MONEY">Moov Money</option>
                      <option value="WAVE">Wave</option>
                      <option value="SAMA_MONEY">Sama Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Numéro de téléphone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">+223</span>
                      </div>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        placeholder="76 12 34 56"
                        className="w-full pl-12 pr-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-investmali-accent-500 focus:border-transparent"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Saisissez votre numéro de téléphone mobile money (8 chiffres)</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-lg border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Annuler
                </button>
                <button
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 text-lg bg-gradient-to-r from-investmali-accent-600 to-blue-600 text-white rounded-md hover:from-investmali-accent-700 hover:to-investmali-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-bold"
                >
                  {isProcessing ? 'Redirection...' : 'Procéder au paiement'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Avis de paiement créé avec succès
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  Référence: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{paymentReference}</span>
                </p>
                <p className="text-lg text-gray-600 mb-4">
                  Votre numéro <strong>{formData.phoneNumber}</strong> ({formData.paymentProvider.replace('_', ' ')}) est maintenant autorisé pour ce paiement.
                </p>
                <p className="text-lg text-gray-600">
                  Cliquez sur le bouton ci-dessous pour accéder à la plateforme TresorPay et finaliser votre paiement.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.location.href = paymentUrl}
                  className="w-full px-6 py-3 bg-gradient-to-r from-investmali-accent-600 to-blue-600 text-white rounded-md hover:from-investmali-accent-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-lg font-bold flex items-center justify-center gap-2"
                >
                  <LinkIcon className="h-5 w-5" />
                  Accéder à TresorPay pour payer
                </button>
                
                <p className="text-lg text-gray-500">
                  Vous serez redirigé vers la plateforme sécurisée TresorPay
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTresorPayPage;
=======
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api';

// Import des images de logos
import carteBancaireImg from '../assets/images/logos/carte-bancaire.jpeg';

interface PaymentData {
  entrepriseId: string;
  amount: string;
}

interface PaymentFormData {
  phoneNumber: string;
  paymentProvider: string;
}

const PaymentTresorPayPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'initiate' | 'processing'>('initiate');
  const [formData, setFormData] = useState<PaymentFormData>({
    phoneNumber: '',
    paymentProvider: 'ORANGE_MONEY'
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const entrepriseId = params.get('entrepriseId');
    const amount = params.get('amount');

    if (entrepriseId && amount) {
      setPaymentData({
        entrepriseId,
        amount
      });
    } else {
      console.error('Paramètres manquants dans l\'URL');
      navigate('/mes-demandes');
    }
  }, [location.search, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleInitiatePayment = async () => {
    if (!paymentData) return;

    // Validation du numéro de téléphone
    if (!formData.phoneNumber.trim()) {
      alert('Veuillez saisir votre numéro de téléphone');
      return;
    }

    // Validation du format du numéro (8 chiffres commençant par 6-9)
    const phoneRegex = /^[6-9]\d{7}$/;
    const cleanPhone = formData.phoneNumber.replace(/\D/g, '').slice(-8);
    if (!phoneRegex.test(cleanPhone)) {
      alert('Veuillez saisir un numéro de téléphone valide (8 chiffres commençant par 6, 7, 8 ou 9)');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('🚀 Initiation du paiement TresorPay...');

      const paymentRequest = {
        entrepriseId: paymentData.entrepriseId,
        paymentMethod: 'TRESORPAY',
        amount: parseInt(paymentData.amount),
        currency: 'xof',
        description: `Frais de création d'entreprise - API-Invest Mali`,
        methodData: {
          phoneNumber: cleanPhone,
          paymentProvider: formData.paymentProvider
        }
      };

      console.log('📤 Envoi de la requête de paiement:', paymentRequest);

      const paymentResponse = await apiRequest('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(paymentRequest)
      });

      console.log('✅ Réponse de paiement reçue:', paymentResponse);

      if (paymentResponse.status === 'PENDING' && paymentResponse.redirectUrl) {
        setPaymentUrl(paymentResponse.redirectUrl);
        setPaymentReference(paymentResponse.paymentId);
        setCurrentStep('processing');
        
        console.log('🔄 URL TresorPay générée:', paymentResponse.redirectUrl);
        console.log('📋 Référence de paiement:', paymentResponse.paymentId);
        
        // Ne pas rediriger automatiquement, laisser l'utilisateur cliquer
        // window.location.href = paymentResponse.redirectUrl;
      } else {
        throw new Error('Réponse de paiement invalide');
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initiation du paiement:', error);
      alert(`Erreur lors de l'initiation du paiement: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/mes-demandes');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-investmali-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={carteBancaireImg} 
                alt="TresorPay"
                className="w-12 h-12 object-contain rounded"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paiement TresorPay</h1>
                <p className="text-gray-600">Paiement sécurisé</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Montant à payer</p>
              <p className="text-2xl font-bold text-investmali-accent">
                {formatAmount(parseInt(paymentData.amount))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 'initiate' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Paiement via TresorPay</h2>
                <p className="text-gray-600">Vous serez redirigé vers la plateforme sécurisée TresorPay pour effectuer votre paiement</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 text-lg">🔒</div>
                  <div>
                    <h4 className="font-medium text-blue-900">Paiement sécurisé</h4>
                    <p className="text-sm text-blue-700 mt-1">TresorPay est la plateforme officielle de paiement du Trésor Public du Mali. Toutes les transactions sont sécurisées et chiffrées.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Informations de paiement</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant:</span>
                    <span className="font-semibold">{formatAmount(parseInt(paymentData.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Méthode:</span>
                    <span className="font-semibold">TresorPay</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-semibold">Frais de création d'entreprise</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Informations de paiement mobile</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
                    <select
                      value={formData.paymentProvider}
                      onChange={(e) => setFormData({...formData, paymentProvider: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                    >
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="MOOV_MONEY">Moov Money</option>
                      <option value="WAVE">Wave</option>
                      <option value="SAMA_MONEY">Sama Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">+223</span>
                      </div>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        placeholder="76 12 34 56"
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Saisissez votre numéro de téléphone mobile money (8 chiffres)</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-investmali-accent text-white rounded-md hover:bg-investmali-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Redirection...' : 'Procéder au paiement'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-investmali-accent rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Avis de paiement créé avec succès
                </h2>
                <p className="text-gray-600 mb-4">
                  Référence: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{paymentReference}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  Votre numéro <strong>{formData.phoneNumber}</strong> ({formData.paymentProvider.replace('_', ' ')}) est maintenant autorisé pour ce paiement.
                </p>
                <p className="text-gray-600">
                  Cliquez sur le bouton ci-dessous pour accéder à la plateforme TresorPay et finaliser votre paiement.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.location.href = paymentUrl}
                  className="w-full px-6 py-3 bg-investmali-accent text-white rounded-md hover:bg-investmali-accent-dark transition-colors text-lg font-medium"
                >
                  🔗 Accéder à TresorPay pour payer
                </button>
                
                <p className="text-sm text-gray-500">
                  Vous serez redirigé vers la plateforme sécurisée TresorPay
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTresorPayPage;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
