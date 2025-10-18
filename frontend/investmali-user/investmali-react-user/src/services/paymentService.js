import { apiRequest } from './api';

/**
 * Service pour la gestion des paiements
 */
export const paymentService = {
  /**
   * Récupère la clé publique Stripe
   */
  async getStripePublicKey() {
    try {
      const response = await apiRequest('/payments/stripe/public-key');
      return response.publicKey;
    } catch (error) {
      console.error('Erreur récupération clé Stripe:', error);
      throw error;
    }
  },

  /**
   * Initie un paiement
   */
  async initiatePayment(paymentData) {
    try {
      console.log('💳 Initiation paiement:', paymentData);
      const response = await apiRequest('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
      console.log('✅ Paiement initié:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur initiation paiement:', error);
      throw error;
    }
  },

  /**
   * Vérifie le statut d'un paiement
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await apiRequest(`/payments/${paymentId}/status`);
      return response;
    } catch (error) {
      console.error('Erreur vérification statut:', error);
      throw error;
    }
  },

  /**
   * Calcule les frais de paiement
   */
  async calculateFees(requestType = 'BUSINESS_CREATION') {
    try {
      const response = await apiRequest(`/payments/fees?requestType=${requestType}`);
      return response;
    } catch (error) {
      console.error('Erreur calcul frais:', error);
      throw error;
    }
  },

  /**
   * Formate un montant en XOF
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Valide les données de paiement selon la méthode
   */
  validatePaymentData(method, data) {
    const errors = [];

    if (!data.entrepriseId) {
      errors.push('ID entreprise requis');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Montant invalide');
    }

    switch (method) {
      case 'TRESORPAY':
        // Validation spécifique pour TresorPay si nécessaire
        break;
    }

    return errors;
  }
};

/**
 * Constantes pour les méthodes de paiement
 */
export const PAYMENT_METHODS = {
  TRESORPAY: {
    id: 'TRESORPAY',
    name: 'TresorPay',
    description: 'Paiement sécurisé via TresorPay',
    icon: '💳',
    fees: 'Frais: selon grille TresorPay',
    supported: true
  }
};

/**
 * Statuts de paiement avec traductions
 */
export const PAYMENT_STATUS = {
  PENDING: { label: 'En attente', color: 'yellow', icon: '⏳' },
  PROCESSING: { label: 'En cours', color: 'blue', icon: '🔄' },
  SUCCEEDED: { label: 'Réussi', color: 'green', icon: '✅' },
  FAILED: { label: 'Échoué', color: 'red', icon: '❌' },
  CANCELLED: { label: 'Annulé', color: 'gray', icon: '🚫' },
  REQUIRES_ACTION: { label: 'Action requise', color: 'orange', icon: '⚠️' },
  REQUIRES_CONFIRMATION: { label: 'Confirmation requise', color: 'purple', icon: '❓' }
};
