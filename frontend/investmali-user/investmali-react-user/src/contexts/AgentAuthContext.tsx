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
  login: (email: string, password: string) => Promise<{ success: boolean; redirectUrl?: string }>;
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

  const login = async (email: string, password: string): Promise<{ success: boolean; redirectUrl?: string }> => {
    setIsLoading(true);
    
    try {
      // Appel à l'API backend réelle
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          motdepasse: password
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Créer l'objet agent à partir de la réponse backend
        const agentData: Agent = {
          id: data.personne_id || 'unknown',
          email: data.email || email,
          firstName: data.prenom || '',
          lastName: data.nom || '',
          role: data.role?.includes('AGENT') ? 'validator' : 
                data.role === 'SUPER_ADMIN' ? 'admin' : 'supervisor',
          department: data.role || 'Unknown',
          permissions: data.role === 'SUPER_ADMIN' ? ['all'] : ['view_applications'],
          lastLogin: new Date().toISOString()
        };

        setAgent(agentData);
        localStorage.setItem('investmali_agent', JSON.stringify(agentData));
        localStorage.setItem('authToken', data.token);
        
        return { 
          success: true, 
          redirectUrl: data.redirectUrl 
        };
      } else {
        const errorData = await response.json();
        console.error('Erreur de connexion:', errorData);
        return { success: false };
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAgent(null);
    localStorage.removeItem('investmali_agent');
    localStorage.removeItem('authToken');
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
