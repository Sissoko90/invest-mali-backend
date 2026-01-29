/**
 * Service pour Orange Money V2
 * Nouvelle implémentation basée sur les tests Postman
 */

export interface OrangeMoneyV2InitiateRequest {
  entrepriseId: string;
  amount: number;
}

export interface OrangeMoneyV2InitiateResponse {
  success: boolean;
  payment_url?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  payment_id?: string;
  pay_token?: string;
  notif_token?: string;
  status?: number;
  message?: string;
  error?: string;
}

export interface OrangeMoneyV2TestResponse {
  success: boolean;
  message: string;
  timestamp: string;
  version: string;
  token_preview?: string;
  error?: string;
}

export interface TransactionStatusRequest {
  order_id: string;
  amount: number;
  pay_token: string;
}

export interface TransactionStatusResponse {
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

export interface PaymentCallbackData {
  type: 'ORANGE_MONEY_RETURN' | 'ORANGE_MONEY_CANCEL';
  data: {
    order_id: string;
    status?: string;
    txnid?: string;
    reason?: string;
  };
}

class OrangeMoneyV2Service {
  private baseUrl = (process.env.REACT_APP_USER_API_URL || 'https://www.formalisation.ml/api/v1') + '/orange-money/v2';
  private directUrl = (process.env.REACT_APP_USER_API_URL || 'https://www.formalisation.ml/api/v1') + '/orange-money/v2/direct';

  /**
   * Teste la connectivité avec l'API Orange Money V2
   */
  async testConnection(): Promise<OrangeMoneyV2TestResponse> {
    const response = await fetch(`${this.baseUrl}/test-connection`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Initie un paiement Orange Money V2
   */
  async initiatePayment(request: OrangeMoneyV2InitiateRequest): Promise<OrangeMoneyV2InitiateResponse> {
    console.log('🍊 [OrangeMoneyV2Service-User] Initialisation du paiement:', request);
    
    // Essayer plusieurs clés de token pour compatibilité
    const authToken = localStorage.getItem('investmali_user_token') || 
                     localStorage.getItem('userToken') || 
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('token');
    console.log('🔑 [OrangeMoneyV2Service-User] Token d\'authentification:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
    console.log('🔍 [OrangeMoneyV2Service-User] Tokens par clé:', {
      'investmali_user_token': localStorage.getItem('investmali_user_token') ? 'PRÉSENT' : 'ABSENT',
      'userToken': localStorage.getItem('userToken') ? 'PRÉSENT' : 'ABSENT', 
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
      console.error('❌ [OrangeMoneyV2Service] Erreur HTTP:', response.status, data);
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }

    console.log('📋 [OrangeMoneyV2Service] Réponse reçue:', data);
    return data;
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/status/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Vérifie le statut d'une transaction avec pay_token
   * Utilise l'endpoint /check-transaction-status qui appelle l'API Orange Money /transactionstatus
   */
  async checkTransactionStatus(request: TransactionStatusRequest): Promise<TransactionStatusResponse> {
    console.log('🔍 [OrangeMoneyV2Service] Vérification statut transaction:', {
      order_id: request.order_id,
      amount: request.amount,
      pay_token: request.pay_token.substring(0, 10) + '...'
    });

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
      console.error('❌ [OrangeMoneyV2Service] Erreur vérification statut:', response.status, data);
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }

    console.log('✅ [OrangeMoneyV2Service] Statut transaction récupéré:', data);
    return data;
  }

  /**
   * Redirige vers la page de paiement Orange Money
   * Peut ouvrir dans une nouvelle fenêtre ou rediriger directement
   */
  redirectToPayment(paymentUrl: string, openInNewWindow: boolean = false): Window | null {
    console.log('🔗 [OrangeMoneyV2Service] Redirection vers:', paymentUrl);
    
    if (openInNewWindow) {
      // Ouvrir dans une nouvelle fenêtre pour pouvoir écouter les callbacks
      const popup = window.open(
        paymentUrl, 
        'orange_money_payment',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );
      return popup;
    } else {
      // Redirection directe
      window.location.href = paymentUrl;
      return null;
    }
  }

  /**
   * Écoute les messages de callback depuis la popup de paiement
   */
  listenForPaymentCallback(
    onSuccess: (data: PaymentCallbackData['data']) => void,
    onCancel: (data: PaymentCallbackData['data']) => void,
    onError: (error: string) => void
  ): () => void {
    const handleMessage = (event: MessageEvent<PaymentCallbackData>) => {
      // Vérifier l'origine pour la sécurité
      if (!event.origin.includes('formalisation.ml') && !event.origin.includes('localhost')) {
        console.warn('⚠️ [OrangeMoneyV2Service] Message reçu d\'une origine non autorisée:', event.origin);
        return;
      }

      console.log('📞 [OrangeMoneyV2Service] Message de callback reçu:', event.data);

      if (event.data && typeof event.data === 'object') {
        switch (event.data.type) {
          case 'ORANGE_MONEY_RETURN':
            console.log('✅ [OrangeMoneyV2Service] Callback de succès reçu');
            onSuccess(event.data.data);
            break;
          case 'ORANGE_MONEY_CANCEL':
            console.log('❌ [OrangeMoneyV2Service] Callback d\'annulation reçu');
            onCancel(event.data.data);
            break;
          default:
            console.warn('⚠️ [OrangeMoneyV2Service] Type de callback inconnu:', event.data.type);
        }
      }
    };

    // Ajouter l'écouteur d'événements
    window.addEventListener('message', handleMessage);

    // Retourner une fonction de nettoyage
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }

  /**
   * Vérifie périodiquement le statut d'une transaction
   */
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
          console.log(`🔄 [OrangeMoneyV2Service] Vérification statut (tentative ${attempts}/${maxAttempts})`);
          
          const status = await this.checkTransactionStatus(request);
          onStatusChange(status);
          
          // Si le statut est final (succès ou échec), arrêter le polling
          if (status.is_success || status.is_failed) {
            console.log(`✅ [OrangeMoneyV2Service] Statut final reçu: ${status.status}`);
            resolve(status);
            return;
          }
          
          // Si on a atteint le nombre maximum de tentatives
          if (attempts >= maxAttempts) {
            console.warn(`⚠️ [OrangeMoneyV2Service] Nombre maximum de tentatives atteint (${maxAttempts})`);
            reject(new Error('Timeout: impossible de vérifier le statut de la transaction'));
            return;
          }
          
          // Programmer la prochaine vérification
          setTimeout(poll, intervalMs);
          
        } catch (error) {
          console.error(`❌ [OrangeMoneyV2Service] Erreur lors de la vérification (tentative ${attempts}):`, error);
          
          // En cas d'erreur, réessayer sauf si on a atteint le maximum
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(poll, intervalMs);
          }
        }
      };
      
      // Démarrer le polling
      poll();
    });
  }

  /**
   * Formate un montant pour l'affichage
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  }

  /**
   * Valide les paramètres de paiement
   */
  validatePaymentRequest(request: OrangeMoneyV2InitiateRequest): string[] {
    const errors: string[] = [];

    if (!request.entrepriseId || request.entrepriseId.trim() === '') {
      errors.push('L\'ID de l\'entreprise est requis');
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }

    if (request.amount && request.amount < 100) {
      errors.push('Le montant minimum est de 100 F CFA');
    }

    if (request.amount && request.amount > 10000000) {
      errors.push('Le montant maximum est de 10 000 000 F CFA');
    }

    return errors;
  }

  /**
   * Valide les paramètres de vérification de statut
   */
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
  }

  /**
   * Extrait les paramètres de callback depuis l'URL
   */
  extractCallbackParams(): { order_id?: string; status?: string; txnid?: string; reason?: string } {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      order_id: urlParams.get('order_id') || undefined,
      status: urlParams.get('status') || undefined,
      txnid: urlParams.get('txnid') || urlParams.get('transaction_id') || undefined,
      reason: urlParams.get('reason') || undefined
    };
  }
}

export const orangeMoneyV2Service = new OrangeMoneyV2Service();
export default orangeMoneyV2Service;
