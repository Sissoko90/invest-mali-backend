// Service pour Orange Money V2 - Version Agent TypeScript
// Nouvelle implémentation basée sur les tests Postman avec vérification du statut

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

export interface OrangeMoneyV2TestResponse {
  success: boolean;
  message: string;
  timestamp: string;
  version: string;
  token_preview?: string;
  error?: string;
}

class OrangeMoneyV2Service {
  private getBaseUrl(): string {
    const hostname = window.location.hostname;
    
    if (hostname === '192.168.2.4') {
      return 'http://192.168.2.4:8080/api/v1/orange-money/v2';
    } else if (hostname === 'agent-investmali.com' || hostname === 'www.agent-investmali.com') {
      return '/api/v1/orange-money/v2';
    }
    
    return `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api/v1/orange-money/v2`;
  }
  
  private get baseUrl(): string {
    return this.getBaseUrl();
  }

  async testConnection(): Promise<OrangeMoneyV2TestResponse> {
    const authToken = localStorage.getItem('investmali_agent_token') || 
                     localStorage.getItem('agentToken') || 
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}/test-connection`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }

  async initiatePayment(request: OrangeMoneyV2InitiateRequest): Promise<OrangeMoneyV2InitiateResponse> {
    console.log('🍊 [OrangeMoneyV2Service-Agent] Initialisation du paiement:', request);
    
    // Essayer plusieurs clés de token pour compatibilité
    const authToken = localStorage.getItem('investmali_agent_token') || 
                     localStorage.getItem('agentToken') || 
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('token');
    console.log('🔑 [OrangeMoneyV2Service-Agent] Token d\'authentification:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
    console.log('🔍 [OrangeMoneyV2Service-Agent] Clés localStorage disponibles:', Object.keys(localStorage));
    console.log('🔍 [OrangeMoneyV2Service-Agent] Tokens par clé:', {
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
      console.error('❌ [OrangeMoneyV2Service-Agent] Erreur HTTP:', response.status, data);
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }

    console.log('📋 [OrangeMoneyV2Service-Agent] Réponse reçue:', data);
    return data;
  }

  async checkTransactionStatus(request: TransactionStatusRequest): Promise<TransactionStatusResponse> {
    console.log('🔍 [OrangeMoneyV2Service-Agent] Vérification statut transaction:', {
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
      console.error('❌ [OrangeMoneyV2Service-Agent] Erreur vérification statut:', response.status, data);
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }

    console.log('✅ [OrangeMoneyV2Service-Agent] Statut transaction récupéré:', data);
    return data;
  }

  redirectToPayment(paymentUrl: string, openInNewWindow: boolean = false): Window | null {
    console.log('🔗 [OrangeMoneyV2Service-Agent] Redirection vers:', paymentUrl);
    
    if (openInNewWindow) {
      const popup = window.open(
        paymentUrl, 
        'orange_money_payment',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );
      return popup;
    } else {
      window.location.href = paymentUrl;
      return null;
    }
  }

  listenForPaymentCallback(
    onSuccess: (data: PaymentCallbackData['data']) => void,
    onCancel: (data: PaymentCallbackData['data']) => void,
    onError: (error: string) => void
  ): () => void {
    const handleMessage = (event: MessageEvent<PaymentCallbackData>) => {
      if (!event.origin.includes('investmali.abdatytch.com') && !event.origin.includes('localhost')) {
        console.warn('⚠️ [OrangeMoneyV2Service-Agent] Message reçu d\'une origine non autorisée:', event.origin);
        return;
      }

      console.log('📞 [OrangeMoneyV2Service-Agent] Message de callback reçu:', event.data);

      if (event.data && typeof event.data === 'object') {
        switch (event.data.type) {
          case 'ORANGE_MONEY_RETURN':
            console.log('✅ [OrangeMoneyV2Service-Agent] Callback de succès reçu');
            onSuccess(event.data.data);
            break;
          case 'ORANGE_MONEY_CANCEL':
            console.log('❌ [OrangeMoneyV2Service-Agent] Callback d\'annulation reçu');
            onCancel(event.data.data);
            break;
          default:
            console.warn('⚠️ [OrangeMoneyV2Service-Agent] Type de callback inconnu:', event.data.type);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }

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
          console.log(`🔄 [OrangeMoneyV2Service-Agent] Vérification statut (tentative ${attempts}/${maxAttempts})`);
          
          const status = await this.checkTransactionStatus(request);
          onStatusChange(status);
          
          if (status.is_success || status.is_failed) {
            console.log(`✅ [OrangeMoneyV2Service-Agent] Statut final reçu: ${status.status}`);
            resolve(status);
            return;
          }
          
          if (attempts >= maxAttempts) {
            console.warn(`⚠️ [OrangeMoneyV2Service-Agent] Nombre maximum de tentatives atteint (${maxAttempts})`);
            reject(new Error('Timeout: impossible de vérifier le statut de la transaction'));
            return;
          }
          
          setTimeout(poll, intervalMs);
          
        } catch (error) {
          console.error(`❌ [OrangeMoneyV2Service-Agent] Erreur lors de la vérification (tentative ${attempts}):`, error);
          
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(poll, intervalMs);
          }
        }
      };
      
      poll();
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  }

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

const orangeMoneyV2Service = new OrangeMoneyV2Service();
export default orangeMoneyV2Service;
