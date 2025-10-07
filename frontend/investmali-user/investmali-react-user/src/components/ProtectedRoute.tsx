import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from './AnimatedBackground';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Affichage de chargement pendant la vérification d'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground variant="minimal" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mali-emerald mx-auto mb-4"></div>
          <p className="text-mali-dark text-lg">Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  // Redirection vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Affichage du contenu protégé si authentifié
  return <>{children}</>;
};

export default ProtectedRoute;
