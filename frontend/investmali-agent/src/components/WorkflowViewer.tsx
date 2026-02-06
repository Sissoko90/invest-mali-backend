import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface WorkflowStep {
  etape: string;
  libelle: string;
  responsable: string;
  statut: 'COMPLETE' | 'EN_COURS' | 'EN_ATTENTE' | 'REJETE';
  dateTraitement?: string;
  observations?: string;
}

interface WorkflowInfo {
  type: string;
  libelle: string;
  montant: number;
  workflowType: string;
  totalSteps: number;
  steps: string[];
  requiresPaiement: boolean;
}

interface WorkflowViewerProps {
  entrepriseId: string;
  workflowInfo: WorkflowInfo;
  currentStep?: string;
  onStepAction?: (action: string, step: string, data?: any) => void;
  readOnly?: boolean;
}

const WorkflowViewer: React.FC<WorkflowViewerProps> = ({
  entrepriseId,
  workflowInfo,
  currentStep,
  onStepAction,
  readOnly = false
}) => {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entrepriseId) {
      loadWorkflowStatus();
    } else {
      generateDefaultSteps();
    }
  }, [entrepriseId, workflowInfo]);

  const loadWorkflowStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/autorisation-exercice/statut/${entrepriseId}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du statut');
      }
      
      const data = await response.json();
      
      // Convertir les données en format WorkflowStep
      const steps = generateStepsFromWorkflowInfo(data.workflowInfo, data.assignment);
      setWorkflowSteps(steps);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement workflow:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      generateDefaultSteps();
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSteps = () => {
    const steps = generateStepsFromWorkflowInfo(workflowInfo);
    setWorkflowSteps(steps);
    setLoading(false);
  };

  const generateStepsFromWorkflowInfo = (info: WorkflowInfo, assignment?: any): WorkflowStep[] => {
    const stepMappings = getStepMappings(info.type);
    
    return stepMappings.map((mapping, index) => ({
      etape: mapping.etape,
      libelle: mapping.libelle,
      responsable: mapping.responsable,
      statut: getStepStatus(mapping.etape, currentStep || assignment?.etape, index),
      dateTraitement: assignment?.dateAssignment,
      observations: assignment?.observations
    }));
  };

  const getStepMappings = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return [
          { etape: 'ACCUEIL_AGREMENT_PAIEMENT', libelle: 'Accueil - Paiement', responsable: 'ACCUEIL' },
          { etape: 'MIC_PREMIERE_VALIDATION', libelle: 'MIC - Première Validation', responsable: 'MIC' },
          { etape: 'MINISTERE_FINANCES', libelle: 'Ministère des Finances', responsable: 'MINISTERE_FINANCES' },
          { etape: 'SGG_PREMIERE_VALIDATION', libelle: 'SGG - Première Validation', responsable: 'SGG' },
          { etape: 'PRESIDENCE', libelle: 'Présidence de la République', responsable: 'PRESIDENCE' },
          { etape: 'SGG_SECONDE_VALIDATION', libelle: 'SGG - Seconde Validation', responsable: 'SGG' },
          { etape: 'MIC_SECONDE_VALIDATION', libelle: 'MIC - Seconde Validation', responsable: 'MIC' },
          { etape: 'ACCUEIL_RETOUR_AGREMENT', libelle: 'Accueil - Retour', responsable: 'ACCUEIL' }
        ];
      case 'DECISION':
        return [
          { etape: 'ACCUEIL_DECISION', libelle: 'Accueil Décision', responsable: 'ACCUEIL' },
          { etape: 'MIC_DECISION', libelle: 'MIC - Décision', responsable: 'MIC' },
          { etape: 'SGG_DECISION', libelle: 'SGG - Décision', responsable: 'SGG' },
          { etape: 'MIC_RETOUR_DECISION', libelle: 'MIC - Retour', responsable: 'MIC' },
          { etape: 'ACCUEIL_RETOUR_DECISION', libelle: 'Accueil - Retour', responsable: 'ACCUEIL' }
        ];
      case 'ENREGISTREMENT':
        return [
          { etape: 'ACCUEIL_ENREGISTREMENT', libelle: 'Accueil Enregistrement', responsable: 'ACCUEIL' },
          { etape: 'ENREGISTREMENT_COMPLETE', libelle: 'Enregistrement Complet', responsable: 'SYSTEM' }
        ];
      default:
        return [];
    }
  };

  const getStepStatus = (stepEtape: string, currentEtape?: string, index?: number): 'COMPLETE' | 'EN_COURS' | 'EN_ATTENTE' | 'REJETE' => {
    if (!currentEtape) return index === 0 ? 'EN_ATTENTE' : 'EN_ATTENTE';
    
    if (stepEtape === currentEtape) return 'EN_COURS';
    
    // Logique simplifiée : les étapes avant l'étape courante sont complètes
    const stepMappings = getStepMappings(workflowInfo.type);
    const currentIndex = stepMappings.findIndex(s => s.etape === currentEtape);
    const stepIndex = stepMappings.findIndex(s => s.etape === stepEtape);
    
    if (stepIndex < currentIndex) return 'COMPLETE';
    return 'EN_ATTENTE';
  };

  const getStepIcon = (responsable: string, statut: string) => {
    const iconClass = "w-6 h-6";
    
    if (statut === 'COMPLETE') {
      return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
    } else if (statut === 'EN_COURS') {
      return <ClockIcon className={`${iconClass} text-blue-600`} />;
    } else if (statut === 'REJETE') {
      return <ExclamationTriangleIcon className={`${iconClass} text-red-600`} />;
    }

    // Icônes par responsable pour les étapes en attente
    switch (responsable) {
      case 'ACCUEIL':
        return <BuildingOfficeIcon className={`${iconClass} text-gray-400`} />;
      case 'MIC':
        return <UserGroupIcon className={`${iconClass} text-gray-400`} />;
      case 'MINISTERE_FINANCES':
        return <BanknotesIcon className={`${iconClass} text-gray-400`} />;
      case 'SGG':
        return <DocumentCheckIcon className={`${iconClass} text-gray-400`} />;
      case 'PRESIDENCE':
        return <ShieldCheckIcon className={`${iconClass} text-gray-400`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStepColor = (statut: string) => {
    switch (statut) {
      case 'COMPLETE':
        return 'bg-green-50 border-green-200';
      case 'EN_COURS':
        return 'bg-blue-50 border-blue-200';
      case 'REJETE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleStepAction = (action: string, step: WorkflowStep) => {
    if (onStepAction) {
      onStepAction(action, step.etape, { step });
    }
  };

  const canTakeAction = (step: WorkflowStep) => {
    return !readOnly && step.statut === 'EN_COURS';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Workflow : {workflowInfo.libelle}
        </h3>
        <div className="text-sm text-gray-500">
          {workflowSteps.filter(s => s.statut === 'COMPLETE').length} / {workflowSteps.length} étapes
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <div key={step.etape} className="relative">
            {/* Ligne de connexion */}
            {index < workflowSteps.length - 1 && (
              <div className="absolute left-3 top-12 w-0.5 h-8 bg-gray-200"></div>
            )}

            {/* Étape */}
            <div className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${getStepColor(step.statut)}
              ${step.statut === 'EN_COURS' ? 'ring-2 ring-blue-200' : ''}
            `}>
              <div className="flex items-start space-x-4">
                {/* Icône */}
                <div className="flex-shrink-0">
                  {getStepIcon(step.responsable, step.statut)}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {step.libelle}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {step.dateTraitement && (
                        <span className="text-xs text-gray-500">
                          {formatDate(step.dateTraitement)}
                        </span>
                      )}
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${step.statut === 'COMPLETE' ? 'bg-green-100 text-green-800' : ''}
                        ${step.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' : ''}
                        ${step.statut === 'EN_ATTENTE' ? 'bg-gray-100 text-gray-800' : ''}
                        ${step.statut === 'REJETE' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {step.statut === 'COMPLETE' && 'Terminé'}
                        {step.statut === 'EN_COURS' && 'En cours'}
                        {step.statut === 'EN_ATTENTE' && 'En attente'}
                        {step.statut === 'REJETE' && 'Rejeté'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Responsable: <span className="font-medium">{step.responsable}</span>
                  </div>

                  {step.observations && (
                    <div className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                      <strong>Observations:</strong> {step.observations}
                    </div>
                  )}

                  {/* Actions */}
                  {canTakeAction(step) && (
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleStepAction('VALIDER', step)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => handleStepAction('REJETER', step)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Rejeter
                      </button>
                      {step.responsable === 'ACCUEIL' && workflowInfo.requiresPaiement && (
                        <button
                          onClick={() => handleStepAction('GENERER_PAIEMENT', step)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Générer Paiement
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Flèche vers l'étape suivante */}
                {index < workflowSteps.length - 1 && step.statut === 'COMPLETE' && (
                  <div className="flex-shrink-0">
                    <ArrowRightIcon className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {workflowSteps.filter(s => s.statut === 'COMPLETE').length}
            </div>
            <div className="text-sm text-gray-600">Terminées</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {workflowSteps.filter(s => s.statut === 'EN_COURS').length}
            </div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {workflowSteps.filter(s => s.statut === 'EN_ATTENTE').length}
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {workflowSteps.filter(s => s.statut === 'REJETE').length}
            </div>
            <div className="text-sm text-gray-600">Rejetées</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowViewer;
