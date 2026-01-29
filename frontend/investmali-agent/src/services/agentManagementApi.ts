import { axiosInstance } from './api';

// Fonction helper pour convertir les réponses axios en format fetch
const apiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    const axiosConfig: any = {
      url,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body as string) : undefined,
    };

    // Gérer les headers
    if (options.headers) {
      const headers: any = {};
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
      axiosConfig.headers = headers;
    }

    const response = await axiosInstance.request(axiosConfig);
    
    // Convertir la réponse axios en format Response-like
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
    } as Response;
  } catch (error: any) {
    if (error.response) {
      // Erreur avec réponse du serveur
      return {
        ok: false,
        status: error.response.status,
        statusText: error.response.statusText,
        json: async () => error.response.data,
      } as Response;
    }
    throw error;
  }
};

// Types pour la gestion des agents
export interface AgentCreationRequest {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  role?: string; // Premier rôle pour compatibilité
  roles?: string[]; // Rôles multiples
  antenneAgent?: string; // Première antenne pour compatibilité
  antennes?: string[]; // Antennes multiples
  telephone?: string;
  adresse?: string;
  actif?: boolean;
}

export interface AgentUpdateRequest {
  prenom?: string;
  nom?: string;
  email?: string;
  motDePasse?: string;
  role?: string;
  roles?: string[];
  antenneAgent?: string;
  antennes?: string[];
  telephone?: string;
  adresse?: string;
  actif?: boolean;
}

export interface AgentResponse {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  role: string; // Premier rôle pour compatibilité
  roles: string[]; // Tous les rôles
  antenneAgent?: string; // Première antenne pour compatibilité
  antennes: string[]; // Toutes les antennes
  actif: boolean;
  dateCreation: string;
  dateModification: string;
}

export interface AgentListResponse {
  content: AgentResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface RoleOption {
  value: string;
  label: string;
}

export interface AntenneOption {
  value: string;
  label: string;
}

// Service de gestion des agents
export class AgentManagementService {
  private static readonly BASE_URL = '/agents';

  /**
   * Créer un nouvel agent
   */
  static async createAgent(agentData: AgentCreationRequest): Promise<AgentResponse> {
    
    try {
      const response = await apiRequest(`${this.BASE_URL}/create`, {
        method: 'POST',
        body: JSON.stringify(agentData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lister les agents avec pagination et filtres
   */
  static async listAgents(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    role?: string;
    antenne?: string;
  } = {}): Promise<AgentListResponse> {

    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);
    if (params.role) queryParams.append('role', params.role);
    if (params.antenne) queryParams.append('antenne', params.antenne);

    try {
      const url = `${this.BASE_URL}/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(url);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtenir un agent par ID
   */
  static async getAgent(agentId: string): Promise<AgentResponse> {

    try {
      const response = await apiRequest(`${this.BASE_URL}/${agentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Agent non trouvé');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour un agent
   */
  static async updateAgent(agentId: string, updateData: AgentUpdateRequest): Promise<AgentResponse> {

    try {
      const response = await apiRequest(`${this.BASE_URL}/${agentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Changer le statut d'un agent (actif/inactif)
   */
  static async toggleAgentStatus(agentId: string, actif: boolean): Promise<AgentResponse> {

    try {
      const response = await apiRequest(`${this.BASE_URL}/${agentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ actif }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Internal Server Error');
    }
  }

  /**
   * Obtenir les rôles disponibles
   */
  static async getAvailableRoles(): Promise<RoleOption[]> {

    try {
      const response = await apiRequest(`${this.BASE_URL}/roles`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.roles;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtenir les antennes disponibles
   */
  static async getAvailableAntennes(): Promise<AntenneOption[]> {

    try {
      const response = await apiRequest(`${this.BASE_URL}/antennes`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result.antennes;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprimer définitivement un agent
   */
  static async deleteAgent(agentId: string): Promise<void> {
    
    try {
      const response = await apiRequest(`${this.BASE_URL}/${agentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la suppression');
    }
  }
}

// Export par défaut
export default AgentManagementService;
