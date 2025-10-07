import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { 
  InformationCircleIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const RoleNotification: React.FC = () => {
  const { agent, hasRole } = useAgentAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Vérifier si la notification a déjà été montrée pour ce rôle
    const shownKey = `role_notification_shown_${agent?.role}`;
    const wasShown = localStorage.getItem(shownKey);
    
    if (!wasShown && agent?.role) {
      setIsVisible(true);
      setHasBeenShown(false);
    } else {
      setHasBeenShown(true);
    }
  }, [agent?.role]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (agent?.role) {
      localStorage.setItem(`role_notification_shown_${agent.role}`, 'true');
    }
  };

  const getRoleDescription = () => {
    const descriptions = {
      'AGENT_ACCEUIL': 'Vous pouvez créer et gérer les dossiers à l\'étape d\'accueil, uploader les documents initiaux et valider vers l\'étape suivante.',
      'REGISSEUR': 'Vous gérez l\'étape de régie, vérifiez les documents et traitez les aspects administratifs.',
      'AGENT_REVISION': 'Vous contrôlez et révisez les documents soumis, validez leur conformité.',
      'AGENT_IMPOT': 'Vous traitez les aspects fiscaux et les déclarations d\'impôts des entreprises.',
      'AGENT_RCCM1': 'Vous gérez la première phase du registre de commerce et du crédit mobilier.',
      'AGENT_RCCM2': 'Vous finalisez le registre de commerce et du crédit mobilier.',
      'AGENT_NINA': 'Vous gérez l\'attribution du numéro d\'identification nationale des entreprises.',
      'AGENT_RETRAIT': 'Vous finalisez le processus et gérez la remise des documents aux clients.',
      'SUPER_ADMIN': 'Vous avez un accès complet à toutes les étapes et pouvez forcer les transitions.'
    };
    
    return descriptions[agent?.role as keyof typeof descriptions] || 'Rôle non défini.';
  };

  if (!isVisible || hasBeenShown) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {hasRole('SUPER_ADMIN') ? (
            <ShieldCheckIcon className="h-6 w-6 text-yellow-500" />
          ) : (
            <InformationCircleIcon className="h-6 w-6 text-blue-500" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Bienvenue, {agent?.firstName || 'Agent'}
            </h3>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Votre rôle:</span>
              <span className="bg-mali-emerald text-white px-2 py-1 rounded text-xs font-medium">
                {agent?.role}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {getRoleDescription()}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {hasRole('SUPER_ADMIN') ? 'Accès complet' : 'Accès limité à votre étape'}
            </span>
            <button
              onClick={handleDismiss}
              className="text-xs text-mali-emerald hover:text-mali-emerald-dark font-medium"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleNotification;
