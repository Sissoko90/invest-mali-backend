import React from 'react';

/**
 * Gestionnaire global pour les erreurs de rate limiting (HTTP 429)
 */

interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number;
  lastError: Date | null;
}

class RateLimitHandler {
  private state: RateLimitState = {
    isRateLimited: false,
    retryAfter: 0,
    lastError: null
  };

  private listeners: Array<(state: RateLimitState) => void> = [];

  /**
   * Vérifie si une erreur est liée au rate limiting
   */
  isRateLimitError(error: any): boolean {
    return error?.status === 429 || 
           error?.response?.status === 429 ||
           error?.message?.includes('429') ||
           error?.message?.toLowerCase().includes('too many requests');
  }

  /**
   * Traite une erreur de rate limiting
   */
  handleRateLimitError(error: any): void {
    if (!this.isRateLimitError(error)) return;

    const retryAfter = this.extractRetryAfter(error);
    
    this.state = {
      isRateLimited: true,
      retryAfter,
      lastError: new Date()
    };

    console.warn('⚠️ Rate limit détecté:', {
      retryAfter: retryAfter,
      timestamp: this.state.lastError
    });

    // Notifier les listeners
    this.notifyListeners();

    // Auto-reset après le délai
    setTimeout(() => {
      this.reset();
    }, retryAfter * 1000);
  }

  /**
   * Extrait le délai de retry depuis l'erreur
   */
  private extractRetryAfter(error: any): number {
    // Essayer d'extraire depuis les headers
    const retryAfterHeader = error?.response?.headers?.['retry-after'] || 
                            error?.headers?.['retry-after'];
    
    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(seconds)) return seconds;
    }

    // Délai par défaut basé sur l'heure de la dernière erreur
    const now = Date.now();
    const lastErrorTime = this.state.lastError?.getTime() || 0;
    const timeSinceLastError = (now - lastErrorTime) / 1000;

    // Backoff exponentiel : 30s, 60s, 120s, max 300s
    if (timeSinceLastError < 30) return 60;
    if (timeSinceLastError < 60) return 120;
    if (timeSinceLastError < 120) return 300;
    return 30; // Reset si assez de temps s'est écoulé
  }

  /**
   * Remet à zéro l'état de rate limiting
   */
  reset(): void {
    this.state = {
      isRateLimited: false,
      retryAfter: 0,
      lastError: null
    };

    console.log('✅ Rate limit reset');
    this.notifyListeners();
  }

  /**
   * Vérifie si on est actuellement rate limited
   */
  isCurrentlyRateLimited(): boolean {
    return this.state.isRateLimited;
  }

  /**
   * Obtient l'état actuel
   */
  getState(): RateLimitState {
    return { ...this.state };
  }

  /**
   * Ajoute un listener pour les changements d'état
   */
  addListener(callback: (state: RateLimitState) => void): () => void {
    this.listeners.push(callback);
    
    // Retourne une fonction de cleanup
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifie tous les listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Erreur dans listener rate limit:', error);
      }
    });
  }

  /**
   * Crée un wrapper pour les fonctions async qui gère automatiquement le rate limiting
   */
  wrapAsyncFunction<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: any[]) => {
      if (this.isCurrentlyRateLimited()) {
        throw new Error(`Rate limited. Retry after ${this.state.retryAfter} seconds`);
      }

      try {
        return await fn(...args);
      } catch (error) {
        this.handleRateLimitError(error);
        throw error;
      }
    }) as T;
  }
}

// Instance singleton
export const rateLimitHandler = new RateLimitHandler();

// Hook React pour utiliser le rate limit handler
export const useRateLimitState = () => {
  const [state, setState] = React.useState<RateLimitState>(rateLimitHandler.getState());

  React.useEffect(() => {
    const unsubscribe = rateLimitHandler.addListener(setState);
    return unsubscribe;
  }, []);

  return state;
};
