import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { agentAuthAPI } from '../services/api';

// Nouveaux rôles agents alignés aux étapes du processus
type AgentRole = 
  | 'AGENT_ACCEUIL'     // Étape d'accueil/intake
  | 'REGISSEUR'         // Étape de régie
  | 'AGENT_REVISION'    // Étape de révision
  | 'AGENT_IMPOT'       // Étape impôts
  | 'AGENT_RCCM1'       // Étape RCCM phase 1
  | 'AGENT_RCCM2'       // Étape RCCM phase 2
  | 'AGENT_NINA'        // Étape NINA
  | 'AGENT_RETRAIT'     // Étape de retrait
  | 'SUPER_ADMIN';      // Accès complet + transition forçable

interface Agent {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  role: AgentRole;
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

interface AgentAuthContextType {
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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

export const AgentAuthProvider: React.FC<AgentAuthProviderProps> = ({ children }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (email: string, password: string): Promise<boolean> => {
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
      
      // Déterminer le rôle correct
      let finalRole = agentSource.role || 'AGENT_ACCEUIL';
      
      // Solution temporaire : vérifier si l'email correspond à un admin connu
      const adminEmails = ['admin@api-invest.ml', 'superadmin@api-invest.ml', 'admin@example.com'];
      if (adminEmails.includes(agentSource.email?.toLowerCase())) {
        console.log('Email admin détecté, assignation du rôle SUPER_ADMIN');
        finalRole = 'SUPER_ADMIN';
      }
      
      // Vérifier aussi dans les permissions ou autres champs
      if (agentSource.permissions?.includes('SUPER_ADMIN') || 
          agentSource.isAdmin === true || 
          agentSource.admin === true) {
        console.log('Permissions admin détectées, assignation du rôle SUPER_ADMIN');
        finalRole = 'SUPER_ADMIN';
      }
      
      const agent = {
        id: agentSource.id || agentSource.personne_id || payload.personne_id,
        email: agentSource.email || payload.email,
        firstName: agentSource.firstName || agentSource.first_name || agentSource.prenom || payload.prenom || '',
        lastName: agentSource.lastName || agentSource.last_name || agentSource.nom || payload.nom || '',
        role: finalRole,
        department: agentSource.department || 'N/A',
        permissions: agentSource.permissions || [],
        lastLogin: new Date().toISOString(),
        phone: agentSource.phone || agentSource.telephone1 || payload.telephone1 || '',
        avatarUrl: agentSource.avatarUrl || agentSource.avatar_url || agentSource.avatar || '',
        assignedStep: agentSource.assignedStep,
        canForceTransition: agentSource.canForceTransition || finalRole === 'SUPER_ADMIN',
        division: agentSource.division,
        antenne: agentSource.antenne
      } as Agent;
      
      console.log('=== AGENT FINAL CRÉÉ ===');
      console.log('Agent complet:', agent);
      console.log('Agent ID:', agent.id);
      console.log('Agent email:', agent.email);
      console.log('Agent role:', agent.role);
      console.log('========================');
      
      // Stocker le token et les informations de l'agent
      localStorage.setItem('investmali_agent_token', token);
      localStorage.setItem('investmali_agent', JSON.stringify(agent));
      
      setAgent(agent);
      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion agent:', error);
      // En cas d'erreur, s'assurer que l'état est bien nettoyé
      setAgent(null);
      localStorage.removeItem('investmali_agent');
      return false;
    } finally {
      console.log('Fin de la tentative de connexion, mise à jour de l\'état de chargement');
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAgent(null);
    localStorage.removeItem('investmali_agent');
    localStorage.removeItem('investmali_agent_token');
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
    
    // SUPER_ADMIN peut tout éditer
    if (agent.role === 'SUPER_ADMIN') return true;
    
    // Mapping des rôles aux étapes qu'ils peuvent éditer
    const roleStepMapping: Record<AgentRole, string[]> = {
      'AGENT_ACCEUIL': ['ACCUEIL'],
      'REGISSEUR': ['REGISSEUR'],
      'AGENT_REVISION': ['REVISION'],
      'AGENT_IMPOT': ['IMPOT'],
      'AGENT_RCCM1': ['RCCM1'],
      'AGENT_RCCM2': ['RCCM2'],
      'AGENT_NINA': ['NINA'],
      'AGENT_RETRAIT': ['RETRAIT'],
      'SUPER_ADMIN': ['ACCUEIL', 'REGISSEUR', 'REVISION', 'IMPOT', 'RCCM1', 'RCCM2', 'NINA', 'RETRAIT']
    };
    
    return roleStepMapping[agent.role]?.includes(stepName) || false;
  };

  const canViewStep = (stepName: string): boolean => {
    if (!agent) return false;
    
    // Tous les agents peuvent voir toutes les étapes (lecture seule)
    // Seule l'édition est restreinte
    return true;
  };

  const canForceTransition = (): boolean => {
    return agent?.role === 'SUPER_ADMIN' || agent?.canForceTransition === true;
  };

  const hasRole = (role: AgentRole): boolean => {
    return agent?.role === role;
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
