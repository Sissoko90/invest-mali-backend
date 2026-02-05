import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { entreprisesAPI } from '../../services/api';
import { Entreprise } from '../../types';
import AccueilAgrementStep from './AccueilAgrementStep';
import RevisionAgrementStep from './RevisionAgrementStep';
import RegisseurAgrementStep from './RegisseurAgrementStep';
import MinistereAgrementStep from './MinistereAgrementStep';
import RetraitAgrementStep from './RetraitAgrementStep';
import { 
  FolderOpenIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AgrementWorkflow: React.FC = () => {
  const { agent, canEditStep, canViewStep } = useAgentAuth();
  const [currentStep, setCurrentStep] = useState<string>('ACCUEIL_AGREMENT');
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Déterminer l'étape initiale basée sur le rôle de l'agent
    if (agent) {
      const roleStepMapping: Record<string, string> = {
        'AGENT_ACCUEIL_AGREMENT': 'ACCUEIL_AGREMENT',
        'AGENT_REVISION_AGREMENT': 'REVISION_AGREMENT',
        'AGENT_REGISSEUR_AGREMENT': 'REGISSEUR_AGREMENT',
        'AGENT_MINISTERE_AGREMENT': 'MINISTERE_AGREMENT',
        'AGENT_RETRAIT_AGREMENT': 'RETRAIT_AGREMENT',
        'SUPER_ADMIN': 'ACCUEIL_AGREMENT'
      };
      
      const initialStep = roleStepMapping[agent.role] || 'ACCUEIL_AGREMENT';
      setCurrentStep(initialStep);
    }
  }, [agent]);

  const handleStepChange = (stepId: string) => {
    if (canViewStep(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const handleEntrepriseUpdate = (updatedEntreprise: Entreprise) => {
    setEntreprise(updatedEntreprise);
    console.log('🔄 [AgrementWorkflow] Entreprise mise à jour:', updatedEntreprise);
  };

  const allSteps = [
    {
      id: 'ACCUEIL_AGREMENT',
      name: 'Accueil',
      description: 'Réception et enregistrement',
      icon: '📥'
    },
    {
      id: 'REVISION_AGREMENT',
      name: 'Analyste',
      description: 'Contrôle et Analyse',
      icon: '🔍'
    },
    {
      id: 'REGISSEUR_AGREMENT',
      name: 'Régisseur',
      description: 'Traitement administratif',
      icon: '📋'
    },
    {
      id: 'MINISTERE_AGREMENT',
      name: 'Ministère',
      description: 'Délivrance agrément',
      icon: '🏛️'
    },
    {
      id: 'RETRAIT_AGREMENT',
      name: 'Retrait',
      description: 'Remise documents',
      icon: '✅'
    }
  ];

  const currentStepIndex = allSteps.findIndex(s => s.id === currentStep);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'ACCUEIL_AGREMENT':
        return <AccueilAgrementStep onEntrepriseUpdate={handleEntrepriseUpdate} />;
      
      case 'REVISION_AGREMENT':
        return <RevisionAgrementStep onEntrepriseUpdate={handleEntrepriseUpdate} />;
      
      case 'REGISSEUR_AGREMENT':
        return <RegisseurAgrementStep onEntrepriseUpdate={handleEntrepriseUpdate} />;
      
      case 'MINISTERE_AGREMENT':
        return <MinistereAgrementStep onEntrepriseUpdate={handleEntrepriseUpdate} />;
      
      case 'RETRAIT_AGREMENT':
        return <RetraitAgrementStep onEntrepriseUpdate={handleEntrepriseUpdate} />;
      
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Étape non disponible</h3>
              <p className="text-gray-600">Cette étape n'est pas encore implémentée.</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Navigation des étapes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4">
          <nav className="flex items-center justify-between">
            <ol className="flex items-center w-full space-x-4">
              {allSteps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                const isAccessible = canViewStep(step.id);

                return (
                  <li key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => handleStepChange(step.id)}
                      disabled={!isAccessible}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors w-full ${
                        isActive
                          ? 'bg-sky-50 border border-sky-500'
                          : isCompleted
                          ? 'bg-green-50 border border-green-500'
                          : isAccessible
                          ? 'bg-gray-50 border border-gray-300 hover:bg-gray-100'
                          : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        isActive
                          ? 'bg-sky-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? '✓' : step.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-sky-800' : isCompleted ? 'text-green-800' : 'text-gray-700'
                        }`}>
                          {step.name}
                        </p>
                        <p className={`text-xs ${
                          isActive ? 'text-sky-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </button>
                    {index < allSteps.length - 1 && (
                      <div className={`w-6 h-0.5 mx-1 ${
                        index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default AgrementWorkflow;
























