// Configuration TresorPay - pas besoin d'api.config pour ce service

// Configuration TresorPay
const TRESORPAY_CONFIG = {
  client_id: 'api-mali',
  client_secret: 'SYhpGoLQoojalN56CLyox2Cirqsm1q6k',
  auth_url: 'https://recette.auth.finances.ml/realms/tresorpay/protocol/openid-connect/token',
  base_url: 'https://recette.tresorpay.finances.ml/api/public/v1'
};

class TresorPayService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Obtenir un token d'accès
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await fetch(TRESORPAY_CONFIG.auth_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: TRESORPAY_CONFIG.client_id,
          client_secret: TRESORPAY_CONFIG.client_secret
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur d'authentification TresorPay: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute de marge

      return this.accessToken;
    } catch (error) {
      console.error('❌ [TRESORPAY] Erreur lors de l\'obtention du token:', error);
      throw error;
    }
  }

  // Initier un paiement
  async initierPaiement(paiementData) {
    try {
      const token = await this.getAccessToken();
      
      const paymentPayload = {
        amount: paiementData.montant,
        currency: 'XOF', // Franc CFA
        description: paiementData.description,
        reference: `INV-${Date.now()}`, // Référence unique
        callback_url: `${window.location.origin}/paiement/callback`,
        return_url: `${window.location.origin}/paiement/success`,
        cancel_url: `${window.location.origin}/paiement/cancel`,
        metadata: {
          demandeId: paiementData.demandeId,
          regime: paiementData.regime,
          type: 'agrement_investissement'
        }
      };

      const response = await fetch(`${TRESORPAY_CONFIG.base_url}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur TresorPay: ${errorData.message || response.status}`);
      }

      const paymentResponse = await response.json();
      
      // Rediriger vers la page de paiement TresorPay
      if (paymentResponse.payment_url) {
        window.location.href = paymentResponse.payment_url;
      }

      return paymentResponse;
    } catch (error) {
      console.error('❌ [TRESORPAY] Erreur lors de l\'initiation du paiement:', error);
      throw error;
    }
  }

  // Vérifier le statut d'un paiement
  async verifierPaiement(paymentId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${TRESORPAY_CONFIG.base_url}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ [TRESORPAY] Erreur lors de la vérification du paiement:', error);
      throw error;
    }
  }

  // Obtenir l'historique des paiements
  async getHistoriquePaiements() {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${TRESORPAY_CONFIG.base_url}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération de l'historique: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ [TRESORPAY] Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
}

// Instance singleton
const tresorPayService = new TresorPayService();

export default tresorPayService;
