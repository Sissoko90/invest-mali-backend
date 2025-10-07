import React from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { 
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  EyeIcon,
  PencilIcon
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
  const { agent, canEditStep, canViewStep, hasRole } = useAgentAuth();

  const allSteps = [
    {
      id: 'ACCUEIL',
      name: 'Accueil',
      description: 'Création et validation initiale du dossier',
      requiredRole: 'AGENT_ACCEUIL'
    },
    {
      id: 'REGISSEUR',
      name: 'Régisseur',
      description: 'Vérification et traitement administratif',
      requiredRole: 'REGISSEUR'
    },
    {
      id: 'REVISION',
      name: 'Révision',
      description: 'Contrôle et révision des documents',
      requiredRole: 'AGENT_REVISION'
    },
    {
      id: 'IMPOT',
      name: 'Impôts',
      description: 'Traitement fiscal et déclarations',
      requiredRole: 'AGENT_IMPOT'
    },
    {
      id: 'RCCM1',
      name: 'RCCM Phase 1',
      description: 'Première phase du registre de commerce',
      requiredRole: 'AGENT_RCCM1'
    },
    {
      id: 'RCCM2',
      name: 'RCCM Phase 2',
      description: 'Finalisation du registre de commerce',
      requiredRole: 'AGENT_RCCM2'
    },
    {
      id: 'NINA',
      name: 'NINA',
      description: 'Numéro d\'identification nationale',
      requiredRole: 'AGENT_NINA'
    },
    {
      id: 'RETRAIT',
      name: 'Retrait',
      description: 'Finalisation et remise des documents',
      requiredRole: 'AGENT_RETRAIT'
    }
  ];

  const getStepStatus = (stepId: string): Step['status'] => {
    const stepIndex = allSteps.findIndex(s => s.id === stepId);
    const currentIndex = allSteps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    if (stepIndex > currentIndex) return 'upcoming';
    return 'locked';
  };

  const steps: Step[] = allSteps.map(step => ({
    ...step,
    status: getStepStatus(step.id),
    canEdit: canEditStep(step.id),
    canView: canViewStep(step.id)
  }));

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    if (step.status === 'current') {
      return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
    if (!step.canView) {
      return <LockClosedIcon className="h-5 w-5 text-gray-400" />;
    }
    return <ClockIcon className="h-5 w-5 text-gray-400" />;
  };

  const getStepClasses = (step: Step) => {
    const baseClasses = "flex items-center p-4 border-l-4 cursor-pointer transition-colors";
    
    if (step.status === 'current') {
      return `${baseClasses} border-blue-500 bg-blue-50 hover:bg-blue-100`;
    }
    if (step.status === 'completed') {
      return `${baseClasses} border-green-500 bg-green-50 hover:bg-green-100`;
    }
    if (!step.canView) {
      return `${baseClasses} border-gray-300 bg-gray-50 cursor-not-allowed opacity-60`;
    }
    return `${baseClasses} border-gray-300 bg-white hover:bg-gray-50`;
  };

  const handleStepClick = (step: Step) => {
    if (step.canView) {
      onStepChange(step.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Étapes du processus</h3>
        <p className="text-sm text-gray-600 mt-1">
          Agent: {agent?.firstName} {agent?.lastName} ({agent?.role})
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={getStepClasses(step)}
            onClick={() => handleStepClick(step)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {index + 1}. {step.name}
                  </p>
                  <div className="flex items-center space-x-1">
                    {step.canEdit && (
                      <PencilIcon className="h-4 w-4 text-green-600" title="Édition autorisée" />
                    )}
                    {step.canView && !step.canEdit && (
                      <EyeIcon className="h-4 w-4 text-blue-600" title="Lecture seule" />
                    )}
                    {!step.canView && (
                      <LockClosedIcon className="h-4 w-4 text-gray-400" title="Accès restreint" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Légende */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Légende</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-3 w-3 text-green-600" />
            <span className="text-gray-600">Édition autorisée</span>
          </div>
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-3 w-3 text-blue-600" />
            <span className="text-gray-600">Lecture seule</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
            <span className="text-gray-600">Étape terminée</span>
          </div>
          <div className="flex items-center space-x-2">
            <LockClosedIcon className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">Accès restreint</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepNavigation;
