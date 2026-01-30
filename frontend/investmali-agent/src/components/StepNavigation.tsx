import React, { useState } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { 
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  EyeIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface Step {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  canEdit: boolean;
  canView: boolean;
}

interface StepNavigationProps {
  currentStep: string;
  onStepChange: (stepId: string) => void;
  dossierStatus?: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({ 
  currentStep, 
  onStepChange, 
  dossierStatus = 'NOUVEAU' 
}) => {
  const { agent, canEditStep, canViewStep } = useAgentAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const allSteps = [
    { id: 'ACCUEIL', name: 'Accueil', description: 'Création et validation initiale du dossier', requiredRole: 'AGENT_ACCEUIL', alternateRoles: [] },
    { id: 'REGISSEUR', name: 'Régisseur', description: 'Vérification et traitement administratif', requiredRole: 'REGISSEUR', alternateRoles: ['AGENT_REGISTER'] },
    { id: 'REVISION', name: 'Révision', description: 'Contrôle et révision des documents', requiredRole: 'AGENT_REVISION', alternateRoles: [] },
    { id: 'TCOM', name: 'T-COM', description: 'Traitement et communication intermédiaire', requiredRole: 'AGENT_TCOM', alternateRoles: [] },
    { id: 'RCCM2', name: 'RCCM', description: 'Registre de commerce et du crédit mobilier', requiredRole: 'AGENT_RCCM2', alternateRoles: [] },
    { id: 'NINA', name: 'NINA', description: 'Numéro d\'identification nationale', requiredRole: 'AGENT_NINA', alternateRoles: [] },
    { id: 'RETRAIT', name: 'Retrait', description: 'Finalisation et remise des documents', requiredRole: 'AGENT_RETRAIT', alternateRoles: [] },
    { id: 'IMPOTS', name: 'Impôts', description: 'Traitement fiscal et déclarations', requiredRole: 'AGENT_IMPOT', alternateRoles: [] },
  ];

  const rawCurrentIndex = allSteps.findIndex(s => s.id === currentStep);
  const safeCurrentIndex = rawCurrentIndex >= 0 ? rawCurrentIndex : 0;

  const getStepStatus = (stepId: string): Step['status'] => {
    const stepIndex = allSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return 'locked';
    if (stepIndex < safeCurrentIndex) return 'completed';
    if (stepIndex === safeCurrentIndex) return 'current';
    return 'upcoming';
  };

  // Filtrer les étapes selon le rôle de l'agent
  const getVisibleSteps = () => {
    if (!agent?.role) return [];
    
    // Récupérer tous les rôles de l'agent (principal + additionnels)
    const userRoles = agent.roles || [agent.role];
    
    // Si c'est un SUPER_ADMIN, afficher toutes les étapes
    if (userRoles.includes('SUPER_ADMIN')) {
      return allSteps;
    }
    
    // Pour les autres agents, afficher toutes les étapes correspondant à leurs rôles
    const agentSteps = allSteps.filter(step => 
      userRoles.includes(step.requiredRole as any) || 
      step.alternateRoles.some(altRole => userRoles.includes(altRole as any))
    );
    
    // Retourner toutes les étapes correspondant aux rôles de l'agent
    return agentSteps;
  };

  const visibleSteps = getVisibleSteps();
  
  const steps: Step[] = visibleSteps.map(step => ({
    ...step,
    status: getStepStatus(step.id),
    canEdit: canEditStep(step.id),
    canView: canViewStep(step.id)
  }));

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') return <CheckCircleIcon className="h-7 w-7 text-green-600" />;
    if (step.status === 'current') return <ClockIcon className="h-7 w-7 text-sky-600" />;
    if (!step.canView) return <LockClosedIcon className="h-7 w-7 text-gray-400" />;
    return <ClockIcon className="h-7 w-7 text-gray-400" />;
  };

  const getStepClasses = (step: Step) => {
    const base = "flex items-center p-4 border-l-4 cursor-pointer transition-colors";
    if (step.status === 'current') return `${base} border-sky-600 bg-sky-50 hover:bg-sky-100`;
    if (step.status === 'completed') return `${base} border-green-500 bg-green-50 hover:bg-green-100`;
    if (!step.canView) return `${base} border-gray-200 bg-gray-50 cursor-not-allowed opacity-60`;
    return `${base} border-gray-200 bg-white hover:bg-gray-50`;
  };

  const handleStepClick = (step: Step) => {
    if (step.canView) onStepChange(step.id);
  };

  return (
    <div 
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30 group hover:w-80 w-16 overflow-hidden flex flex-col"
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 border-b border-sky-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <img 
                  src="/api-favicon.png" 
                  alt="API-MALI Logo" 
                  className="w-14 h-14 mr-4 drop-shadow-lg"
                />
            <h3 className={`text-lg font-bold text-white transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              Étapes du processus
            </h3>
          </div>
        </div>
        <div className={`flex items-center space-x-2 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-base text-white/90 truncate font-medium">{agent?.firstName} {agent?.lastName}</span>
          <span className="px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded whitespace-nowrap">{agent?.role}</span>
        </div>
      </div>
      
      {/* Steps - Always visible */}
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
        {steps.map((step, index) => (
          <div key={step.id} className={getStepClasses(step)} onClick={() => handleStepClick(step)}>
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">{getStepIcon(step)}</div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-gray-800">{index + 1}. {step.name}</p>
                    <div className="flex items-center space-x-1">
                      {step.canEdit && <PencilIcon className="h-5 w-5 text-sky-600" />}
                      {step.canView && !step.canEdit && <EyeIcon className="h-5 w-5 text-gray-500" />}
                      {!step.canView && <LockClosedIcon className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>
                  <p className="text-base text-gray-600 mt-1 font-medium">{step.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Légende - Only when expanded */}
      {!isCollapsed && (
        <div className="bg-gray-50 border-t border-gray-200 p-4 mt-auto">
          <h4 className="text-base font-semibold text-gray-700 mb-3">Légende</h4>
          <div className="grid grid-cols-2 gap-3 text-base">
            <div className="flex items-center space-x-2">
              <PencilIcon className="h-5 w-5 text-sky-600" />
              <span className="text-gray-700 font-medium">Édition</span>
            </div>
            <div className="flex items-center space-x-2">
              <EyeIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700 font-medium">Lecture seule</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-gray-700 font-medium">Terminée</span>
            </div>
            <div className="flex items-center space-x-2">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700 font-medium">Restreint</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepNavigation;
























