import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { agentAuthAPI } from '../services/api';
import { tokenRefreshService } from '../services/tokenRefreshService';

// Nouveaux rôles agents alignés aux étapes du processus
type AgentRole = 
  | 'AGENT_ACCEUIL'     // Étape d'accueil/intake
  | 'AGENT_REGISTER'    // Étape d'enregistrement
  | 'REGISSEUR'         // Étape de régie
  | 'AGENT_REVISION'    // Étape de révision
  | 'AGENT_IMPOT'       // Étape impôts
  | 'AGENT_TCOM'        // Étape T-COM
  | 'AGENT_RCCM1'       // Étape RCCM phase 1
  | 'AGENT_RCCM2'       // Étape RCCM phase 2
  | 'AGENT_NINA'        // Étape NINA
  | 'AGENT_RETRAIT'     // Étape de retrait
  | 'AGENT_NOTAIRE'     // Étape notaire
  // Rôles agrément
  | 'AGENT_AGREMENT_ACCUEIL'    // Accueil agrément
  | 'AGENT_AGREMENT_REVISION'   // Révision agrément
  | 'AGENT_REGISSEUR'           // Régisseur agrément
  | 'AGENT_AGREMENT_RETRAIT'    // Retrait agrément
  // Rôles ministères
  | 'MINISTERE_TRANSPORT'
  | 'MINISTERE_TOURISME'
  | 'MINISTERE_COMMERCE'
  | 'MINISTERE_INDUSTRIE'
  | 'MINISTERE_ENVIRONNEMENT'
  | 'MINISTERE_URBANISME'
  | 'SUPER_ADMIN';      // Accès complet + transition forçable

interface Agent {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  role: AgentRole; // Rôle principal pour compatibilité
  roles: AgentRole[]; // Tous les rôles de l'agent
  department: string;
  permissions: string[];
  lastLogin: string;
  phone?: string;
  avatarUrl?: string;
  // Nouveaux champs pour RBAC
  assignedStep?: string;
  canForceTransition?: boolean;
  division?: string;
  antenne?: string;
}

interface LoginResult {
  success: boolean;
  redirectUrl?: string;
  agent?: Agent;
}

interface AgentAuthContextType {
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateAgent: (patch: Partial<Agent>) => void;
  // Nouvelles fonctions RBAC
  canEditStep: (stepName: string) => boolean;
  canViewStep: (stepName: string) => boolean;
  canForceTransition: () => boolean;
  hasRole: (role: AgentRole) => boolean;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

export const useAgentAuth = () => {
  const context = useContext(AgentAuthContext);
  if (context === undefined) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};

interface AgentAuthProviderProps {
  children: ReactNode;
}

// Fonction utilitaire pour décoder le token JWT
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur lors du décodage du token JWT:', error);
    return null;
  }
};

export const AgentAuthProvider: React.FC<AgentAuthProviderProps> = ({ children }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser l'intercepteur de rafraîchissement de token
  useEffect(() => {
    tokenRefreshService.setupInterceptor();
    console.log('✅ Intercepteur de rafraîchissement de token initialisé');
  }, []);

  // Vérifier si l'agent est déjà connecté au chargement
  useEffect(() => {
    const savedAgent = localStorage.getItem('investmali_agent');
    const token = localStorage.getItem('investmali_agent_token');
    
    if (savedAgent && token) {
      try {
        const agentData = JSON.parse(savedAgent);
        setAgent(agentData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données agent:', error);
        localStorage.removeItem('investmali_agent');
        localStorage.removeItem('investmali_agent_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    console.log('Tentative de connexion avec:', email);
    setIsLoading(true);
    setAgent(null);
    
    try {
      const response = await agentAuthAPI.login({ email, password });
      // Support both Axios response (with .data) and fetch JSON (plain object)
      const payload: any = (response && (response as any).data) ? (response as any).data : response;
      console.log('Réponse normalisée du serveur:', payload);
      
      // Extraction des données selon plusieurs formats possibles
      const { success, message, data } = payload || {};
      // Format A (backend générique): { success, data: { token, agent|user } }
      let token: string | undefined = data?.token;
      let agentData = data?.agent;
      let user = data?.user;
      // Format B (backend actuel): { token, tokenType }
      if (!token && payload?.token) {
        token = payload.token;
      }
      if (!token) {
        throw new Error(message || 'Échec de la connexion');
      }
      
      // Création de l'objet agent avec les données reçues
      const agentSource = agentData || user || { email };
      
      // Debug: Afficher les données reçues du backend
      console.log('=== DEBUG AGENT LOGIN ===');
      console.log('payload complet:', payload);
      console.log('agentSource:', agentSource);
      console.log('agentSource.role:', agentSource.role);
      console.log('agentSource.id:', agentSource.id);
      console.log('agentSource.personne_id:', agentSource.personne_id);
      console.log('payload.personne_id:', payload.personne_id);
      console.log('user:', user);
      console.log('agentData:', agentData);
      console.log('========================');
      
      // Extraire les rôles du token JWT
      const tokenPayload = decodeJWT(token);
      console.log('Token JWT décodé:', tokenPayload);
      
      // Récupérer tous les rôles depuis le token
      let allRoles: AgentRole[] = [];
      if (tokenPayload?.roles && Array.isArray(tokenPayload.roles)) {
        allRoles = tokenPayload.roles.filter((role: string) => {
          // Vérifier que le rôle est valide
          const validRoles: AgentRole[] = [
            // Rôles création d'entreprise
            'AGENT_ACCEUIL', 'AGENT_REGISTER', 'REGISSEUR', 'AGENT_REVISION', 'AGENT_IMPOT',
            'AGENT_TCOM', 'AGENT_RCCM1', 'AGENT_RCCM2', 'AGENT_NINA', 'AGENT_RETRAIT', 'AGENT_NOTAIRE',
            // Rôles agrément
            'AGENT_AGREMENT_ACCUEIL', 'AGENT_AGREMENT_REVISION', 'AGENT_REGISSEUR', 'AGENT_AGREMENT_RETRAIT',
            // Rôles ministères
            'MINISTERE_TRANSPORT', 'MINISTERE_TOURISME', 'MINISTERE_COMMERCE', 
            'MINISTERE_INDUSTRIE', 'MINISTERE_ENVIRONNEMENT', 'MINISTERE_URBANISME',
            // Admin
            'SUPER_ADMIN'
          ];
          return validRoles.includes(role as AgentRole);
        }) as AgentRole[];
      }
      
      // Déterminer le rôle principal
      let finalRole: AgentRole = tokenPayload?.role || agentSource.role || 'AGENT_ACCEUIL';
      
      // Si pas de rôles dans le token, utiliser le rôle principal
      if (allRoles.length === 0 && finalRole) {
        allRoles = [finalRole];
      }
      
      // Solution temporaire : vérifier si l'email correspond à un admin connu
      const adminEmails = ['admin@api-invest.ml', 'superadmin@api-invest.ml'];
      if (adminEmails.includes(agentSource.email?.toLowerCase())) {
        console.log('Email admin détecté, assignation du rôle SUPER_ADMIN');
        finalRole = 'SUPER_ADMIN';
        if (!allRoles.includes('SUPER_ADMIN')) {
          allRoles.push('SUPER_ADMIN');
        }
      }
      
      console.log('Rôles extraits du token:', allRoles);
      console.log('Rôle principal:', finalRole);
      
      const agent = {
        id: agentSource.id || agentSource.personne_id || payload.personne_id,
        email: agentSource.email || payload.email,
        firstName: agentSource.firstName || agentSource.first_name || agentSource.prenom || payload.prenom || '',
        lastName: agentSource.lastName || agentSource.last_name || agentSource.nom || payload.nom || '',
        role: finalRole,
        roles: allRoles, // Tous les rôles de l'agent
        department: agentSource.department || 'N/A',
        permissions: agentSource.permissions || [],
        lastLogin: new Date().toISOString(),
        phone: agentSource.phone || agentSource.telephone1 || payload.telephone1 || '',
        avatarUrl: agentSource.avatarUrl || agentSource.avatar_url || agentSource.avatar || '',
        assignedStep: agentSource.assignedStep,
        canForceTransition: agentSource.canForceTransition || allRoles.includes('SUPER_ADMIN'),
        division: agentSource.division,
        antenne: agentSource.antenne
      } as Agent;
      
      console.log('=== AGENT FINAL CRÉÉ ===');
      console.log('Agent complet:', agent);
      console.log('Agent ID:', agent.id);
      console.log('Agent email:', agent.email);
      console.log('Agent role:', agent.role);
      console.log('Agent roles:', agent.roles);
      console.log('========================');
      
      // Stocker le token et les informations de l'agent
      localStorage.setItem('investmali_agent_token', token);
      localStorage.setItem('investmali_agent', JSON.stringify(agent));
      
      // Stocker le refresh token s'il est présent
      if (payload.refreshToken) {
        tokenRefreshService.storeRefreshToken(payload.refreshToken);
        console.log('✅ Refresh token stocké');
      }
      
      setAgent(agent);
      
      // Récupérer la redirectUrl du payload
      const redirectUrl = payload?.redirectUrl;
      console.log('🎯 [AgentAuth] RedirectUrl reçue du backend:', redirectUrl);
      console.log('🎯 [AgentAuth] Payload complet:', payload);
      console.log('🎯 [AgentAuth] Agent créé avec rôle:', agent.role);
      
      return { success: true, redirectUrl, agent };
    } catch (error) {
      console.error('Erreur lors de la connexion agent:', error);
      // En cas d'erreur, s'assurer que l'état est bien nettoyé
      setAgent(null);
      localStorage.removeItem('investmali_agent');
      return { success: false };
    } finally {
      console.log('Fin de la tentative de connexion, mise à jour de l\'état de chargement');
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAgent(null);
    localStorage.removeItem('investmali_agent');
    tokenRefreshService.clearTokens();
    // Optional: Call the logout API endpoint if available
    // agentAuthAPI.logout?.().catch(console.error);
  };

  const updateAgent = (patch: Partial<Agent>) => {
    setAgent((prev) => {
      const next = { ...(prev || ({} as Agent)), ...patch } as Agent;
      localStorage.setItem('investmali_agent', JSON.stringify(next));
      return next;
    });
  };

  // Fonctions RBAC
  const canEditStep = (stepName: string): boolean => {
    if (!agent) return false;
    
    // Vérifier tous les rôles de l'agent
    const userRoles = agent.roles || [agent.role];
    
    // SUPER_ADMIN peut tout éditer
    if (userRoles.includes('SUPER_ADMIN')) return true;
    
    // Mapping des rôles aux étapes qu'ils peuvent éditer
    const roleStepMapping: Record<AgentRole, string[]> = {
      // Rôles création d'entreprise
      'AGENT_ACCEUIL': ['ACCUEIL'],
      'AGENT_REGISTER': ['REGISSEUR'],
      'REGISSEUR': ['REGISSEUR'],
      'AGENT_REVISION': ['REVISION'],
      'AGENT_IMPOT': ['IMPOTS'],
      'AGENT_TCOM': ['TCOM'],
      'AGENT_RCCM1': ['RCCM1'],
      'AGENT_RCCM2': ['RCCM2'],
      'AGENT_NINA': ['NINA'],
      'AGENT_RETRAIT': ['RETRAIT'],
      'AGENT_NOTAIRE': ['NOTAIRE'],
      // Rôles agrément
      'AGENT_AGREMENT_ACCUEIL': ['ACCUEIL_AGREMENT'],
      'AGENT_AGREMENT_REVISION': ['REVISION_AGREMENT'],
      'AGENT_REGISSEUR': ['REGISSEUR_AGREMENT'],
      'AGENT_AGREMENT_RETRAIT': ['RETRAIT_AGREMENT'],
      // Rôles ministères
      'MINISTERE_TRANSPORT': ['MINISTERE_AGREMENT'],
      'MINISTERE_TOURISME': ['MINISTERE_AGREMENT'],
      'MINISTERE_COMMERCE': ['MINISTERE_AGREMENT'],
      'MINISTERE_INDUSTRIE': ['MINISTERE_AGREMENT'],
      'MINISTERE_ENVIRONNEMENT': ['MINISTERE_AGREMENT'],
      'MINISTERE_URBANISME': ['MINISTERE_AGREMENT'],
      // Admin
      'SUPER_ADMIN': ['ACCUEIL', 'REGISSEUR', 'REVISION', 'TCOM', 'RCCM1', 'RCCM2', 'NINA', 'RETRAIT', 'IMPOTS', 'NOTAIRE', 'ACCUEIL_AGREMENT', 'REVISION_AGREMENT', 'REGISSEUR_AGREMENT', 'MINISTERE_AGREMENT', 'RETRAIT_AGREMENT']
    };
    
    // Vérifier si l'un des rôles de l'agent permet d'éditer cette étape
    return userRoles.some(role => roleStepMapping[role]?.includes(stepName));
  };

  const canViewStep = (stepName: string): boolean => {
    if (!agent) return false;
    
    // Tous les agents peuvent voir toutes les étapes (lecture seule)
    // Seule l'édition est restreinte
    return true;
  };

  const canForceTransition = (): boolean => {
    if (!agent) return false;
    const userRoles = agent.roles || [agent.role];
    return userRoles.includes('SUPER_ADMIN') || agent?.canForceTransition === true;
  };

  const hasRole = (role: AgentRole): boolean => {
    if (!agent) return false;
    const userRoles = agent.roles || [agent.role];
    return userRoles.includes(role);
  };

  const value: AgentAuthContextType = {
    agent,
    isAuthenticated: !!agent,
    isLoading,
    login,
    logout,
    updateAgent,
    canEditStep,
    canViewStep,
    canForceTransition,
    hasRole
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
};

export default AgentAuthContext;
export type { AgentRole, Agent };
























