import React from 'react';
import { useAgentAuth, AgentRole } from '../contexts/AgentAuthContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AgentRole;
  requiredStep?: string;
  allowedRoles?: AgentRole[];
  fallback?: React.ReactNode;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredStep,
  allowedRoles,
  fallback
}) => {
  const { agent, hasRole, canEditStep, canViewStep } = useAgentAuth();

  if (!agent) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Vérification du rôle spécifique
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <>
        {fallback || (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">Accès restreint</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Votre rôle ({agent.role}) ne vous permet pas d'accéder à cette fonctionnalité.
                  Rôle requis: {requiredRole}
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Vérification des rôles autorisés
  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    return (
      <>
        {fallback || (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">Accès restreint</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Votre rôle ({agent.role}) ne vous permet pas d'accéder à cette fonctionnalité.
                  Rôles autorisés: {allowedRoles.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Vérification de l'étape
  if (requiredStep && !canEditStep(requiredStep) && !canViewStep(requiredStep)) {
    return (
      <>
        {fallback || (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">Accès restreint à l'étape</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Vous n'avez pas accès à l'étape {requiredStep}.
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
