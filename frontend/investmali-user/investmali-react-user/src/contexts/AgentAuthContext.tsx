import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'validator' | 'supervisor' | 'admin';
  department: string;
  permissions: string[];
  lastLogin: string;
}

interface AgentAuthContextType {
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
    if (savedAgent) {
      try {
        const agentData = JSON.parse(savedAgent);
        setAgent(agentData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données agent:', error);
        localStorage.removeItem('investmali_agent');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulation d'une API de connexion agent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Agents par défaut pour la démonstration
      const defaultAgents = [
        {
          id: 'agent_001',
          email: 'marie.traore@investmali.com',
          firstName: 'Marie',
          lastName: 'Traoré',
          role: 'validator' as const,
          department: 'Validation Documents',
          permissions: ['view_applications', 'validate_documents', 'update_status'],
          lastLogin: new Date().toISOString(),
          password: 'agent123'
        },
        {
          id: 'agent_002',
          email: 'ibrahim.kone@investmali.com',
          firstName: 'Ibrahim',
          lastName: 'Koné',
          role: 'supervisor' as const,
          department: 'Supervision',
          permissions: ['view_applications', 'validate_documents', 'update_status', 'assign_cases', 'view_reports'],
          lastLogin: new Date().toISOString(),
          password: 'supervisor123'
        },
        {
          id: 'agent_003',
          email: 'admin@investmali.com',
          firstName: 'Admin',
          lastName: 'InvestMali',
          role: 'admin' as const,
          department: 'Administration',
          permissions: ['all'],
          lastLogin: new Date().toISOString(),
          password: 'admin123'
        }
      ];
      
      const foundAgent = defaultAgents.find(a => a.email === email && a.password === password);
      
      if (foundAgent) {
        const { password: _, ...agentData } = foundAgent;
        setAgent(agentData);
        localStorage.setItem('investmali_agent', JSON.stringify(agentData));
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion agent:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setAgent(null);
    localStorage.removeItem('investmali_agent');
  };

  const value: AgentAuthContextType = {
    agent,
    isAuthenticated: !!agent,
    isLoading,
    login,
    logout
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
};

export default AgentAuthContext;
