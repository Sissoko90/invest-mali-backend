<<<<<<< HEAD
import { API_CONFIG } from '../config/api.config';

/**
 * Service pour la gestion des paiements côté agent
 */
export const paymentService = {
  /**
   * Récupère la clé publique Stripe
   */
  async getStripePublicKey() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/stripe/public-key`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Erreur récupération clé Stripe:', error);
      throw error;
    }
  },

  /**
   * Initie un paiement
   */
  async initiatePayment(paymentData: any) {
    try {
      console.log('💳 Initiation paiement agent:', paymentData);
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Paiement initié:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur initiation paiement:', error);
      throw error;
    }
  },

  /**
   * Vérifie le statut d'un paiement
   */
  async getPaymentStatus(paymentId: string) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/${paymentId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur vérification statut:', error);
      throw error;
    }
  },

  /**
   * Formate un montant en FCFA
   */
  formatAmount(amount: number) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  },

  /**
   * Valide les données de paiement
   */
  validatePaymentData(method: string, data: any) {
    const errors: string[] = [];

    if (!data.entrepriseId) {
      errors.push('ID entreprise requis');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Montant invalide');
    }

    switch (method) {
      case 'STRIPE':
        // Pas de validation supplémentaire pour Stripe (géré par Stripe Elements)
        break;
      case 'ORANGE_MONEY':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      case 'MOOV_MONEY':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      
      case 'SAMA_MONEY':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      
      case 'WAVE':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      
      case 'CASH':
        if (!data.methodData?.agencyLocation) {
          errors.push('Agence de paiement requise');
        }
        break;
    }

    return errors;
  }
};

/**
 * Constantes pour les méthodes de paiement
 */
export const PAYMENT_METHODS = {
  STRIPE: {
    id: 'STRIPE',
    name: 'Carte bancaire',
    description: 'Paiement sécurisé par carte Visa, Mastercard',
    icon: '💳',
    fees: 'Frais: 2.9% + 30 XOF',
    supported: true
  },
  MOOV_MONEY: {
    id: 'MOOV_MONEY',
    name: 'Moov Money',
    description: 'Paiement mobile Moov Money',
    icon: '📲',
    fees: 'Frais: selon grille Moov',
    supported: true
  },
  SAMA_MONEY: {
    id: 'SAMA_MONEY',
    name: 'Sama Money',
    description: 'Paiement mobile Sama Money',
    icon: '💳',
    fees: 'Frais: selon grille Sama',
    supported: true
  },
  WAVE: {
    id: 'WAVE',
    name: 'Wave',
    description: 'Paiement mobile Wave',
    icon: '🌊',
    fees: 'Frais: selon grille Wave',
    supported: true
  },
  CASH: {
    id: 'CASH',
    name: 'Espèces',
    description: 'Paiement en espèces dans nos agences',
    icon: '💵',
    fees: 'Aucun frais supplémentaire',
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
=======
import { API_CONFIG } from '../config/api.config';

/**
 * Service pour la gestion des paiements côté agent
 */
export const paymentService = {
  /**
   * Récupère la clé publique Stripe
   */
  async getStripePublicKey() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/stripe/public-key`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Erreur récupération clé Stripe:', error);
      throw error;
    }
  },

  /**
   * Initie un paiement
   */
  async initiatePayment(paymentData: any) {
    try {
      console.log('💳 Initiation paiement agent:', paymentData);
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Paiement initié:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur initiation paiement:', error);
      throw error;
    }
  },

  /**
   * Vérifie le statut d'un paiement
   */
  async getPaymentStatus(paymentId: string) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/payments/${paymentId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur vérification statut:', error);
      throw error;
    }
  },

  /**
   * Formate un montant en FCFA
   */
  formatAmount(amount: number) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  },

  /**
   * Valide les données de paiement
   */
  validatePaymentData(method: string, data: any) {
    const errors: string[] = [];

    if (!data.entrepriseId) {
      errors.push('ID entreprise requis');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Montant invalide');
    }

    switch (method) {
      case 'STRIPE':
        // Pas de validation supplémentaire pour Stripe (géré par Stripe Elements)
        break;
      case 'ORANGE_MONEY':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      case 'MOOV_MONEY':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      
      case 'SAMA_MONEY':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      
      case 'WAVE':
        if (!data.methodData?.phoneNumber) {
          errors.push('Numéro de téléphone requis');
        }
        break;
      
      case 'CASH':
        if (!data.methodData?.agencyLocation) {
          errors.push('Agence de paiement requise');
        }
        break;
    }

    return errors;
  }
};

/**
 * Constantes pour les méthodes de paiement
 */
export const PAYMENT_METHODS = {
  STRIPE: {
    id: 'STRIPE',
    name: 'Carte bancaire',
    description: 'Paiement sécurisé par carte Visa, Mastercard',
    icon: '💳',
    fees: 'Frais: 2.9% + 30 XOF',
    supported: true
  },
  MOOV_MONEY: {
    id: 'MOOV_MONEY',
    name: 'Moov Money',
    description: 'Paiement mobile Moov Money',
    icon: '📲',
    fees: 'Frais: selon grille Moov',
    supported: true
  },
  SAMA_MONEY: {
    id: 'SAMA_MONEY',
    name: 'Sama Money',
    description: 'Paiement mobile Sama Money',
    icon: '💳',
    fees: 'Frais: selon grille Sama',
    supported: true
  },
  WAVE: {
    id: 'WAVE',
    name: 'Wave',
    description: 'Paiement mobile Wave',
    icon: '🌊',
    fees: 'Frais: selon grille Wave',
    supported: true
  },
  CASH: {
    id: 'CASH',
    name: 'Espèces',
    description: 'Paiement en espèces dans nos agences',
    icon: '💵',
    fees: 'Aucun frais supplémentaire',
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
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
