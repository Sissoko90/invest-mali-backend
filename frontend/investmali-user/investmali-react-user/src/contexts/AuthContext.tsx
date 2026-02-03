import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id?: string;
  email: string;
  nom: string;
  prenom: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  personne_id?: string;
  role?: string;
  utilisateur?: string;
  civilite?: string;
  registeredAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  civility: string;
  sexe: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuthStatus = async () => {
        
      if (authAPI.isAuthenticated()) {
          try {
          // Vérifier la validité du token avec l'API
              const response = await authAPI.getProfile();
              
          if (response.success && response.data && response.data.user) {
            const userData = response.data.user;
            const user: User = {
              ...userData,
              firstName: userData.prenom || (userData as any).firstName,
              lastName: userData.nom || (userData as any).lastName,
              id: userData.personne_id || (userData as any).id,
              phone: (userData as any).telephone1 || userData.telephone || (userData as any).phone
            };
            setUser(user);
          } else {
            // Token invalide, nettoyer le localStorage
            authAPI.logout();
            setUser(null);
          }
        } catch (error) {
          console.error('❌ AuthContext: Erreur lors de la vérification du token:', error);
          authAPI.logout();
          setUser(null);
        }
      } else {
        // console.log('❌ AuthContext: Aucun token trouvé dans localStorage'); // Log réduit
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        // L'API retourne directement l'utilisateur dans response.data
        const userData = response.data.user || response.data;
        const user: User = {
          ...userData,
          firstName: userData.prenom || (userData as any).firstName,
          lastName: userData.nom || (userData as any).lastName,
          id: userData.personne_id || (userData as any).id,
          phone: (userData as any).telephone1 || userData.telephone || (userData as any).phone
        };
        setUser(user);
        setIsLoading(false);
        return true;
      } else {
        console.error('Échec de la connexion:', response.message);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Inscription réussie, ne pas connecter automatiquement
        // L'utilisateur devra se connecter manuellement
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.message || 'Échec de l\'inscription' 
      };
    } catch (error: unknown) {
      console.error('Erreur lors de l\'inscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    setUser(null);
    authAPI.logout();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
