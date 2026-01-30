import { getApiBaseUrl } from '../utils/apiUrl';

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

class TokenRefreshService {
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  /**
   * Ajoute un callback à la liste des abonnés qui seront notifiés
   * quand le token sera rafraîchi
   */
  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notifie tous les abonnés que le token a été rafraîchi
   */
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Rafraîchit le token JWT en utilisant le refresh token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('investmali_agent_refresh_token');
    
    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    // Si un rafraîchissement est déjà en cours, attendre qu'il se termine
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.subscribeTokenRefresh((token: string) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Échec du rafraîchissement du token');
      }

      const data: RefreshTokenResponse = await response.json();
      
      // Stocker les nouveaux tokens
      localStorage.setItem('investmali_agent_token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('investmali_agent_refresh_token', data.refreshToken);
      }

      // Notifier tous les abonnés
      this.onTokenRefreshed(data.token);
      
      this.isRefreshing = false;
      return data.token;
    } catch (error) {
      this.isRefreshing = false;
      // En cas d'erreur, supprimer les tokens et rediriger vers la connexion
      localStorage.removeItem('investmali_agent_token');
      localStorage.removeItem('investmali_agent_refresh_token');
      localStorage.removeItem('agentToken');
      window.location.href = '/login';
      throw error;
    }
  }

  /**
   * Intercepte les requêtes fetch pour ajouter automatiquement le token
   * et gérer le rafraîchissement en cas d'expiration
   */
  setupInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Ajouter le token à toutes les requêtes
      const token = localStorage.getItem('investmali_agent_token') || 
                    localStorage.getItem('agentToken') || 
                    localStorage.getItem('token');

      const headers = new Headers(init?.headers || {});
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const modifiedInit = {
        ...init,
        headers,
      };

      try {
        let response = await originalFetch(input, modifiedInit);

        // Si la réponse est 401 (Unauthorized), essayer de rafraîchir le token
        if (response.status === 401) {
          console.log('🔄 Token expiré, rafraîchissement en cours...');
          
          try {
            const newToken = await this.refreshToken();
            
            // Réessayer la requête avec le nouveau token
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryInit = {
              ...init,
              headers,
            };
            
            response = await originalFetch(input, retryInit);
            console.log('✅ Requête réessayée avec succès après rafraîchissement du token');
          } catch (refreshError) {
            console.error('❌ Échec du rafraîchissement du token:', refreshError);
            throw refreshError;
          }
        }

        return response;
      } catch (error) {
        console.error('❌ Erreur lors de la requête:', error);
        throw error;
      }
    };
  }

  /**
   * Stocke le refresh token lors de la connexion
   */
  storeRefreshToken(refreshToken: string) {
    localStorage.setItem('investmali_agent_refresh_token', refreshToken);
  }

  /**
   * Supprime tous les tokens
   */
  clearTokens() {
    localStorage.removeItem('investmali_agent_token');
    localStorage.removeItem('investmali_agent_refresh_token');
    localStorage.removeItem('agentToken');
    localStorage.removeItem('token');
  }
}

export const tokenRefreshService = new TokenRefreshService();
