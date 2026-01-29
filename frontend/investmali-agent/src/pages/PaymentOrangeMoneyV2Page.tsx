import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// Types pour Orange Money V2
interface TransactionStatusRequest {
  order_id: string;
  amount: number;
  pay_token: string;
}

interface TransactionStatusResponse {
  success: boolean;
  status: string;
  order_id: string;
  txnid?: string;
  is_success: boolean;
  is_failed: boolean;
  is_pending: boolean;
  error?: string;
  message?: string;
}

interface PaymentCallbackData {
  type: 'ORANGE_MONEY_RETURN' | 'ORANGE_MONEY_CANCEL';
  data: {
    order_id: string;
    status?: string;
    txnid?: string;
    reason?: string;
  };
}

// Service Orange Money V2 intégré
const orangeMoneyV2Service = {
  baseUrl: process.env.NODE_ENV === 'production' ? '/api/v1/orange-money/v2' : 'http://localhost:8080/api/v1/orange-money/v2',
  
  async initiatePayment(request: { entrepriseId: string; amount: number }) {
    console.log('🍊 [PaymentOrangeMoneyV2Page-Agent] Initialisation du paiement:', request);
    
    // Essayer plusieurs clés de token pour compatibilité
    const authToken = localStorage.getItem('investmali_agent_token') || 
                     localStorage.getItem('agentToken') || 
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('token');
    console.log('🔑 [PaymentOrangeMoneyV2Page-Agent] Token d\'authentification:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
    console.log('🔍 [PaymentOrangeMoneyV2Page-Agent] Tokens par clé:', {
      'investmali_agent_token': localStorage.getItem('investmali_agent_token') ? 'PRÉSENT' : 'ABSENT',
      'agentToken': localStorage.getItem('agentToken') ? 'PRÉSENT' : 'ABSENT', 
      'authToken': localStorage.getItem('authToken') ? 'PRÉSENT' : 'ABSENT',
      'token': localStorage.getItem('token') ? 'PRÉSENT' : 'ABSENT'
    });

    const response = await fetch(`${this.baseUrl}/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(request)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }
    return data;
  },
  
  async checkTransactionStatus(request: TransactionStatusRequest): Promise<TransactionStatusResponse> {
    const response = await fetch(`${this.baseUrl}/check-transaction-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(request)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }
    return data;
  },
  
  redirectToPayment(paymentUrl: string, openInNewWindow: boolean = false): Window | null {
    if (openInNewWindow) {
      return window.open(paymentUrl, 'orange_money_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');
    } else {
      window.location.href = paymentUrl;
      return null;
    }
  },
  
  listenForPaymentCallback(
    onSuccess: (data: PaymentCallbackData['data']) => void,
    onCancel: (data: PaymentCallbackData['data']) => void,
    onError: (error: string) => void
  ): () => void {
    const handleMessage = (event: MessageEvent<PaymentCallbackData>) => {
      if (!event.origin.includes('investmali.abdatytch.com') && !event.origin.includes('localhost')) {
        return;
      }
      
      if (event.data && typeof event.data === 'object') {
        switch (event.data.type) {
          case 'ORANGE_MONEY_RETURN':
            onSuccess(event.data.data);
            break;
          case 'ORANGE_MONEY_CANCEL':
            onCancel(event.data.data);
            break;
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  },
  
  async pollTransactionStatus(
    request: TransactionStatusRequest,
    onStatusChange: (status: TransactionStatusResponse) => void,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<TransactionStatusResponse> {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const status = await this.checkTransactionStatus(request);
          onStatusChange(status);
          
          if (status.is_success || status.is_failed) {
            resolve(status);
            return;
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Timeout: impossible de vérifier le statut de la transaction'));
            return;
          }
          
          setTimeout(poll, intervalMs);
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(poll, intervalMs);
          }
        }
      };
      
      poll();
    });
  },
  
  validatePaymentRequest(request: { entrepriseId: string; amount: number }): string[] {
    const errors: string[] = [];
    if (!request.entrepriseId || request.entrepriseId.trim() === '') {
      errors.push('L\'ID de l\'entreprise est requis');
    }
    if (!request.amount || request.amount <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }
    return errors;
  },
  
  validateTransactionStatusRequest(request: TransactionStatusRequest): string[] {
    const errors: string[] = [];
    if (!request.order_id || request.order_id.trim() === '') {
      errors.push('L\'ID de commande est requis');
    }
    if (!request.amount || request.amount <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }
    if (!request.pay_token || request.pay_token.trim() === '') {
      errors.push('Le token de paiement est requis');
    }
    return errors;
  },
  
  extractCallbackParams(): { order_id?: string; status?: string; txnid?: string; reason?: string } {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      order_id: urlParams.get('order_id') || undefined,
      status: urlParams.get('status') || undefined,
      txnid: urlParams.get('txnid') || urlParams.get('transaction_id') || undefined,
      reason: urlParams.get('reason') || undefined
    };
  }
};

const PaymentOrangeMoneyV2Page: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusCheckInProgress, setStatusCheckInProgress] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<{order_id: string, amount: number, pay_token: string} | null>(null);
  const cleanupCallbackRef = useRef<(() => void) | null>(null);

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const entrepriseNom = searchParams.get('entrepriseNom') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/dashboard');
    }
  }, [entrepriseId, amount, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  };

  // Fonction pour initier le paiement Orange Money V2 (côté agent)
  const handleOrangeMoneyV2Payment = async () => {
    setLoading(true);
    setError('');
    setStatusMessage('');

    try {
      console.log('🍊 [PaymentOrangeMoneyV2Page - Agent] Initialisation du paiement Orange Money V2');
      
      // Valider les paramètres
      const validationErrors = orangeMoneyV2Service.validatePaymentRequest({
        entrepriseId,
        amount
      });

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Appeler le service Orange Money V2
      const data = await orangeMoneyV2Service.initiatePayment({
        entrepriseId,
        amount
      });

      if (data.success && data.payment_url && data.pay_token && data.order_id) {
        console.log('✅ [PaymentOrangeMoneyV2Page - Agent] URL de paiement reçue:', data.payment_url);
        console.log('🎫 [PaymentOrangeMoneyV2Page - Agent] Pay token:', data.pay_token?.substring(0, 10) + '...');
        console.log('📋 [PaymentOrangeMoneyV2Page - Agent] Order ID:', data.order_id);
        
        // Sauvegarder les données de paiement pour la vérification du statut
        const paymentData = {
          order_id: data.order_id,
          amount: data.amount || amount,
          pay_token: data.pay_token,
          payment_url: data.payment_url
        };
        
        setCurrentPaymentData(paymentData);
        setLastPaymentData({
          order_id: data.order_id,
          amount: data.amount || amount,
          pay_token: data.pay_token
        });
        
        // Option 1: Ouvrir dans une popup et écouter les callbacks
        const usePopup = true; // Interface agent avec popup pour meilleure UX
        
        if (usePopup) {
          // Ouvrir dans une popup
          const popup = orangeMoneyV2Service.redirectToPayment(data.payment_url, true);
          
          if (popup) {
            // Écouter les callbacks depuis la popup
            const cleanup = orangeMoneyV2Service.listenForPaymentCallback(
              // Succès
              (callbackData: PaymentCallbackData['data']) => {
                console.log('✅ [PaymentOrangeMoneyV2Page - Agent] Callback de succès:', callbackData);
                popup.close();
                handlePaymentCallback(callbackData.order_id, callbackData.status, callbackData.txnid);
              },
              // Annulation
              (callbackData: PaymentCallbackData['data']) => {
                console.log('❌ [PaymentOrangeMoneyV2Page - Agent] Callback d\'annulation:', callbackData);
                popup.close();
                handlePaymentCancel(callbackData.reason);
              },
              // Erreur
              (error: string) => {
                console.error('❌ [PaymentOrangeMoneyV2Page - Agent] Erreur callback:', error);
                popup.close();
                setError('Erreur lors du traitement du callback: ' + error);
              }
            );
            
            cleanupCallbackRef.current = cleanup;
            
            // Démarrer la vérification périodique du statut après un délai
            // pour laisser le temps à l'utilisateur d'ouvrir la popup et de payer
            setStatusMessage('Veuillez effectuer le paiement dans la fenêtre Orange Money. La vérification automatique commencera dans 60 secondes...');
            
            setTimeout(() => {
              if (!statusCheckInProgress) { // Vérifier que le polling n'a pas déjà commencé
                console.log('🔄 [PaymentOrangeMoneyV2Page - Agent] Début du polling après délai');
                startStatusPolling(data.order_id, data.amount || amount, data.pay_token);
              }
            }, 60000); // Attendre 15 secondes avant de commencer le polling
          } else {
            throw new Error('Impossible d\'ouvrir la popup de paiement');
          }
        } else {
          // Option 2: Redirection directe
          orangeMoneyV2Service.redirectToPayment(data.payment_url, false);
        }
      } else {
        throw new Error(data.error || data.message || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error: any) {
      console.error('❌ [PaymentOrangeMoneyV2Page - Agent] Erreur:', error);
      setError(error.message || 'Une erreur est survenue lors de l\'initialisation du paiement');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour démarrer la vérification périodique du statut
  const startStatusPolling = async (orderId: string, amount: number, payToken: string) => {
    setStatusCheckInProgress(true);
    setStatusMessage('Vérification du statut de la transaction...');
    
    try {
      const statusRequest: TransactionStatusRequest = {
        order_id: orderId,
        amount: amount,
        pay_token: payToken
      };
      
      // Valider la requête
      const validationErrors = orangeMoneyV2Service.validateTransactionStatusRequest(statusRequest);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      // Démarrer le polling
      const finalStatus = await orangeMoneyV2Service.pollTransactionStatus(
        statusRequest,
        (status: TransactionStatusResponse) => {
          console.log(' [PaymentOrangeMoneyV2Page - Agent] Statut mis à jour:', status);
          setStatusMessage(`Statut: ${status.status} (${status.is_pending ? 'En attente' : status.is_success ? 'Succès' : 'Echec'})`);
        },
        30, // 30 tentatives max
        3000 // Vérifier toutes les 3 secondes
      );
      
      // Traiter le statut final
      if (finalStatus.is_success && finalStatus.txnid) {
        await handlePaymentSuccess(finalStatus.txnid);
      } else if (finalStatus.is_failed) {
        handlePaymentFailure('Paiement échoué selon la vérification du statut');
      } else if (finalStatus.is_pending) {
        // Le paiement est toujours en attente, ne pas le marquer comme échoué
        setStatusMessage('Le paiement est toujours en cours de traitement. Vous pouvez fermer cette fenêtre et vérifier plus tard.');
        console.log('⏳ [PaymentOrangeMoneyV2Page - Agent] Paiement toujours en attente après polling');
        setStatusCheckInProgress(false);
        return; // Ne pas effacer le message de statut
      } else {
        // Statut inconnu, considérer comme en attente
        setStatusMessage('Statut de paiement inconnu. Veuillez vérifier manuellement ou contacter le support.');
        console.log('❓ [PaymentOrangeMoneyV2Page - Agent] Statut final inconnu:', finalStatus);
        setStatusCheckInProgress(false);
        return; // Ne pas effacer le message de statut
      }
      
    } catch (error: any) {
      console.error('❌ [PaymentOrangeMoneyV2Page - Agent] Erreur lors de la vérification du statut:', error);
      setError('Erreur lors de la vérification du statut: ' + error.message);
    } finally {
      setStatusCheckInProgress(false);
      setStatusMessage('');
    }
  };

  // Fonction pour gérer les callbacks de la popup
  const handlePaymentCallback = async (orderId?: string, status?: string, txnid?: string) => {
    if (status === 'SUCCESS' && txnid) {
      await handlePaymentSuccess(txnid);
    } else if (orderId && currentPaymentData) {
      // Vérifier le statut via l'API si les données du callback ne sont pas complètes
      try {
        const statusResponse = await orangeMoneyV2Service.checkTransactionStatus({
          order_id: orderId,
          amount: currentPaymentData.amount,
          pay_token: currentPaymentData.pay_token
        });
        
        if (statusResponse.is_success && statusResponse.txnid) {
          await handlePaymentSuccess(statusResponse.txnid);
        } else if (statusResponse.is_failed) {
          handlePaymentFailure('Paiement échoué selon Orange Money');
        } else {
          // Paiement en attente ou statut inconnu, ne pas marquer comme échoué
          setStatusMessage('Paiement en cours de traitement. Vérification automatique en cours...');
          console.log('⏳ [PaymentOrangeMoneyV2Page - Agent] Paiement en attente via callback');
        }
      } catch (error: any) {
        console.error('❌ [PaymentOrangeMoneyV2Page - Agent] Erreur vérification callback:', error);
        setError('Erreur lors de la vérification du paiement: ' + error.message);
      }
    }
  };

  // Fonction pour gérer l'annulation
  const handlePaymentCancel = (reason?: string) => {
    setPaymentResult({
      status: 'error',
      title: 'Paiement annulé',
      message: 'Le paiement Orange Money V2 a été annulé.',
      details: reason || 'Annulé par l\'utilisateur'
    });
  };

  // Fonction pour gérer l'échec
  const handlePaymentFailure = (reason: string) => {
    setPaymentResult({
      status: 'error',
      title: 'Paiement échoué',
      message: 'Le paiement Orange Money V2 a échoué.',
      details: reason
    });
  };

  // Fonction pour gérer le succès du paiement (appelée après retour d'Orange Money)
  const handlePaymentSuccess = async (transactionId: string) => {
    try {
      setPaymentResult({
        status: 'success',
        title: 'Paiement Orange Money V2 réussi !',
        message: 'Le paiement a été traité avec succès via la nouvelle API Orange Money.',
        details: `Transaction: ${transactionId}\nMontant: ${formatAmount(amount)}\nLa demande est maintenant en cours de traitement.\nVersion: Orange Money V2`,
        transactionRef: transactionId,
        paymentData: {
          entrepriseId: entrepriseId,
          entrepriseName: entrepriseNom || 'Entreprise',
          amount: amount,
          paymentMethod: 'Orange Money V2',
          transactionId: transactionId,
          paymentDate: new Date().toISOString(),
          status: 'success' as const
        }
      });

    } catch (error: any) {
      console.error('Erreur lors du traitement du succès:', error);
      setPaymentResult({
        status: 'error',
        title: 'Erreur de synchronisation',
        message: 'Le paiement a été traité par Orange Money V2 mais une erreur s\'est produite.',
        details: 'Veuillez vérifier le dashboard pour confirmer le statut de la demande.',
        transactionRef: transactionId
      });
    }
  };

  // Vérifier si on revient d'Orange Money avec des paramètres de callback
  useEffect(() => {
    const callbackParams = orangeMoneyV2Service.extractCallbackParams();
    
    if (callbackParams.order_id) {
      console.log('🔄 [PaymentOrangeMoneyV2Page - Agent] Paramètres de callback détectés:', callbackParams);
      
      if (callbackParams.status === 'SUCCESS' && callbackParams.txnid) {
        handlePaymentSuccess(callbackParams.txnid);
      } else if (callbackParams.status === 'FAILED' || callbackParams.status === 'CANCELLED') {
        handlePaymentCancel(callbackParams.reason);
      } else if (callbackParams.order_id) {
        // Si on a un order_id mais pas de statut clair, essayer de vérifier via l'API
        setStatusMessage('Vérification du statut du paiement...');
      }
    }
  }, []);

  // Nettoyage des écouteurs d'événements
  useEffect(() => {
    return () => {
      if (cleanupCallbackRef.current) {
        cleanupCallbackRef.current();
      }
    };
  }, []);

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  // Afficher le résultat du paiement si disponible
  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${paymentResult.status === 'success' ? 'text-primary-500' : 'text-red-500'}`}>
                {paymentResult.status === 'success' ? '✅' : '❌'}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {paymentResult.title}
              </h1>
              <p className="text-gray-600 mb-4">
                {paymentResult.message}
              </p>
              {paymentResult.details && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {paymentResult.details}
                  </pre>
                </div>
              )}
              <button
                onClick={handleContinue}
                className="w-full bg-mali-emerald text-white py-3 px-6 rounded-lg font-medium hover:bg-mali-emerald/90 focus:outline-none focus:ring-2 focus:ring-mali-emerald focus:ring-offset-2 transition-colors"
              >
                Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍊</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Orange Money V2
          </h1>
          <p className="text-gray-600">Paiement sécurisé via Orange Money</p>
          <div className="mt-2">
            <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
              Nouvelle API V2 - Interface Agent
            </span>
          </div>
          <p className="text-lg font-semibold text-primary-600 mt-2">
            {formatAmount(amount)}
          </p>
          {entrepriseNom && (
            <p className="text-sm text-gray-500 mt-1">
              Pour: {entrepriseNom}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center">
              {statusCheckInProgress && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-3"></div>
              )}
              <p className="text-primary-600 text-sm">{statusMessage}</p>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <div className="space-y-6">
          <button
            onClick={handleOrangeMoneyV2Payment}
            disabled={loading}
            className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Initialisation...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-3">🍊</span>
                Payer avec Orange Money V2
              </div>
            )}
          </button>

          {/* Bouton de vérification manuelle si un paiement est en cours */}
          {statusMessage && !loading && lastPaymentData && (
            <button
              onClick={() => {
                console.log('🔄 [PaymentOrangeMoneyV2Page - Agent] Vérification manuelle demandée');
                startStatusPolling(
                  lastPaymentData.order_id, 
                  lastPaymentData.amount, 
                  lastPaymentData.pay_token
                );
              }}
              disabled={statusCheckInProgress}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {statusCheckInProgress ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Vérification...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🔄</span>
                  Vérifier le statut maintenant
                </div>
              )}
            </button>
          )}
          
          <button
            onClick={handleCancel}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Retour au Dashboard
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-primary-600 mr-3 mt-0.5">
              ℹ️
            </div>
            <div className="text-sm text-primary-800">
              <p className="font-medium mb-2">Nouvelle API Orange Money V2 :</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Cliquez sur "Payer avec Orange Money V2"</li>
                <li>Une popup s'ouvrira avec la page de paiement Orange Money</li>
                <li>Saisissez votre numéro et confirmez le paiement</li>
                <li>Le statut sera vérifié automatiquement</li>
                <li>Vous serez informé du résultat en temps réel</li>
              </ol>
              <p className="mt-2 text-xs text-primary-700">
                ✨ Cette version utilise la dernière API Orange Money avec OAuth2, webpayment et vérification automatique du statut
              </p>
            </div>
          </div>
        </div>

        {/* Technical Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Informations techniques (dev) :</p>
              <p>• Initiate: /api/v1/orange-money/v2/initiate</p>
              <p>• Status Check: /api/v1/orange-money/v2/check-transaction-status</p>
              <p>• OAuth: https://api.orange.com/oauth/v3/token</p>
              <p>• Webpay: https://api.orange.com/orange-money-webpay/dev/v1/webpayment</p>
              <p>• Transaction Status: https://api.orange.com/orange-money-webpay/dev/v1/transactionstatus</p>
              <p>• Callbacks: return, cancel, notif URLs</p>
              <p>• Interface: Agent avec popup et polling</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentOrangeMoneyV2Page;
























