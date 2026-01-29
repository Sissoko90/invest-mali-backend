import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import { getApiBaseUrl } from '../utils/apiUrl';

// Import des images de logos
import carteBancaireImg from '../assets/logos/carte-bancaire.jpeg';
import orangeMoneyImg from '../assets/logos/orange-money.jpeg';
import moovMoneyImg from '../assets/logos/moov-money.jpeg';
import samaMoneyImg from '../assets/logos/sama-money.jpeg';
import waveImg from '../assets/logos/wave.jpeg';

interface PaymentData {
  entrepriseId: string;
  entrepriseNom: string;
  amount: string;
}

interface PaymentFormData {
  phoneNumber: string;
  paymentProvider: string;
}

const PaymentTresorPayPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { agent } = useAgentAuth();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'initiate' | 'redirect' | 'verify'>('initiate');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [formData, setFormData] = useState<PaymentFormData>({
    phoneNumber: '',
    paymentProvider: 'ORANGE_MONEY'
  });

  useEffect(() => {
    // Extraire les paramètres de l'URL
    const params = new URLSearchParams(location.search);
    const entrepriseId = params.get('entrepriseId');
    const entrepriseNom = params.get('entrepriseNom');
    const amount = params.get('amount');

    if (entrepriseId && entrepriseNom && amount) {
      setPaymentData({
        entrepriseId,
        entrepriseNom,
        amount
      });
    } else {
      console.error('Paramètres manquants dans l\'URL');
      navigate('/dashboard');
    }
  }, [location.search, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  };

  const handleInitiatePayment = async () => {
    if (!paymentData) return;

    // Validation du numéro de téléphone
    if (!formData.phoneNumber.trim()) {
      alert('Veuillez saisir le numéro de téléphone du client');
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

      // Préparer les données de paiement
      const paymentRequest = {
        entrepriseId: paymentData.entrepriseId,
        paymentMethod: 'TRESORPAY',
        amount: parseInt(paymentData.amount),
        currency: 'xof',
        description: `Création d'entreprise - ${paymentData.entrepriseNom}`,
        methodData: {
          phoneNumber: cleanPhone,
          paymentProvider: formData.paymentProvider
        }
      };

      console.log('📤 Envoi de la requête de paiement:', paymentRequest);

      // Appeler l'API de paiement
      const response = await fetch(`${getApiBaseUrl()}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('agentToken')}`
        },
        body: JSON.stringify(paymentRequest)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const paymentResponse = await response.json();
      console.log('✅ Réponse de paiement reçue:', paymentResponse);

      if (paymentResponse.status === 'PENDING' && paymentResponse.redirectUrl) {
        setPaymentUrl(paymentResponse.redirectUrl);
        setPaymentReference(paymentResponse.paymentId);
        setCurrentStep('redirect');
        
        console.log('🔄 URL TresorPay générée:', paymentResponse.redirectUrl);
        console.log('� Référence de paiement:', paymentResponse.paymentId);
        
        // Ne pas rediriger automatiquement, laisser l'agent cliquer
        // window.location.href = paymentResponse.redirectUrl;
      } else {
        throw new Error('Réponse de paiement invalide');
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initiation du paiement:', error);
      alert(`Erreur lors de l'initiation du paiement: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPaymentUrl = () => {
    if (paymentUrl) {
      // Ouvrir l'URL de paiement TresorPay dans un nouvel onglet
      window.open(paymentUrl, '_blank');
      setCurrentStep('verify');
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentReference) return;

    try {
      setIsProcessing(true);
      console.log('🔍 Vérification du statut du paiement:', paymentReference);

      // Vérifier le statut du paiement
      const response = await fetch(`${getApiBaseUrl()}/payments/${paymentReference}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agentToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const statusResponse = await response.json();
      console.log('📊 Statut du paiement:', statusResponse);

      if (statusResponse.status === 'SUCCEEDED') {
        // Paiement réussi - mettre à jour l'entreprise
        await handlePaymentSuccess();
      } else if (statusResponse.status === 'FAILED' || statusResponse.status === 'CANCELLED') {
        alert('❌ Le paiement a échoué ou a été annulé. Veuillez réessayer.');
        setCurrentStep('initiate');
      } else {
        alert('⏳ Le paiement est toujours en cours. Veuillez vérifier à nouveau dans quelques instants.');
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de la vérification:', error);
      alert(`Erreur lors de la vérification: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentData) return;

    try {
      console.log('✅ Traitement du paiement réussi...');

      // Mettre à jour le statut de l'entreprise
      const statusData = {
        status: 'PAIEMENT_VALIDE',
        note: `Paiement TresorPay validé - Référence: ${paymentReference} - Agent: ${(agent as any)?.nom || (agent as any)?.name || 'Agent'}`
      };

      await entreprisesAPI.updateStatus(paymentData.entrepriseId, statusData.status, statusData.note);

      alert(`✅ Paiement TresorPay validé avec succès pour "${paymentData.entrepriseNom}"!\n\n✅ Entreprise transférée à l'étape de révision`);

      // Retourner au dashboard
      navigate('/dashboard');

    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      alert(`Erreur lors de la mise à jour de l'entreprise: ${error.message}`);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mali-emerald mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
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
                <p className="text-gray-600">Entreprise: {paymentData.entrepriseNom}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Montant à payer</p>
              <p className="text-2xl font-bold text-mali-emerald">
                {formatAmount(parseInt(paymentData.amount))}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Steps */}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
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
                        placeholder="76 12 34 56"
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                        maxLength={10}
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
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
                  className="flex-1 px-4 py-2 bg-mali-emerald text-white rounded-md hover:bg-mali-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Création...' : 'Procéder au paiement'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'redirect' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-mali-emerald rounded-full flex items-center justify-center mx-auto">
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
                  Le numéro <strong>{formData.phoneNumber}</strong> ({formData.paymentProvider.replace('_', ' ')}) est maintenant autorisé pour ce paiement.
                </p>
                <p className="text-gray-600">
                  Cliquez sur le bouton ci-dessous pour ouvrir la page de paiement TresorPay
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleOpenPaymentUrl}
                  className="w-full px-6 py-3 bg-mali-emerald text-white rounded-md hover:bg-mali-emerald-dark transition-colors text-lg font-medium"
                >
                  🔗 Ouvrir la page de paiement TresorPay
                </button>
                
                <p className="text-sm text-gray-500">
                  Une nouvelle fenêtre s'ouvrira avec la page de paiement TresorPay
                </p>
              </div>
            </div>
          )}

          {currentStep === 'verify' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Vérification du paiement
                </h2>
                <p className="text-gray-600 mb-4">
                  Référence: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{paymentReference}</span>
                </p>
                <p className="text-gray-600">
                  Une fois le paiement effectué sur TresorPay, cliquez sur "Vérifier le paiement" pour confirmer
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleVerifyPayment}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                >
                  {isProcessing ? 'Vérification...' : '🔍 Vérifier le paiement'}
                </button>
                
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Retour au dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTresorPayPage;
























