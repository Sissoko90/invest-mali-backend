import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAgentAuth } from '../contexts/AgentAuthContext';

interface AgentProtectedRouteProps {
  children: React.ReactNode;
}

const AgentProtectedRoute: React.FC<AgentProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAgentAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-mali-emerald/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mali-emerald mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />;
  }

  return <>{children}</>;
};

export default AgentProtectedRoute;
