import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAgentAuth, AgentRole } from '../contexts/AgentAuthContext';

interface AgentProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AgentRole;
}

const AgentProtectedRoute: React.FC<AgentProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, agent } = useAgentAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('AgentProtectedRoute - Auth state:', { 
      isAuthenticated, 
      isLoading, 
      currentPath: location.pathname,
      agent: agent ? { id: agent.id, email: agent.email, role: agent.role } : 'not logged in'
    });
  }, [isAuthenticated, isLoading, location.pathname, agent]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/agent-login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRole && agent?.role !== requiredRole) {
    console.warn(`Agent does not have required role: ${requiredRole}`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('AgentProtectedRoute - Access granted for agent:', { 
    agentId: agent?.id,
    email: agent?.email,
    role: agent?.role,
    requiredRole
  });
  
  return <>{children}</>;
};

export default AgentProtectedRoute;
