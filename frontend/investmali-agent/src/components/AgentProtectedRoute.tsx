import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAgentAuth, AgentRole } from '../contexts/AgentAuthContext';

interface AgentProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AgentRole;
  allowedRoles?: AgentRole[];
}

const AgentProtectedRoute: React.FC<AgentProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  allowedRoles
}) => {
  const { isAuthenticated, isLoading, agent } = useAgentAuth();
  const location = useLocation();


  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/agent-login" state={{ from: location }} replace />;
  }

  // Check if user has required role (single role check)
  if (requiredRole && agent?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user has one of the allowed roles (multiple roles check)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = agent?.roles || (agent?.role ? [agent.role] : []);
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  
  return <>{children}</>;
};

export default AgentProtectedRoute;
























