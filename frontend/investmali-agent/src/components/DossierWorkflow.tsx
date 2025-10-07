import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import StepNavigation from './StepNavigation';
import AccueilStep from './AccueilStep';
import RegisseurStep from './RegisseurStep';
import RoleProtectedRoute from './RoleProtectedRoute';
import { Dossier, Entreprise } from '../types';
import { 
  FolderOpenIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Les interfaces sont maintenant importées depuis ../types

interface DossierWorkflowProps {
  dossierId?: string;
}

const DossierWorkflow: React.FC<DossierWorkflowProps> = ({ dossierId }) => {
  const { agent, canEditStep, canViewStep } = useAgentAuth();
  const [currentStep, setCurrentStep] = useState<string>('ACCUEIL');
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (dossierId) {
      loadDossier(dossierId);
    }
  }, [dossierId]);

  useEffect(() => {
    // Déterminer l'étape initiale basée sur le rôle de l'agent
    if (agent) {
      const roleStepMapping: Record<string, string> = {
        'AGENT_ACCEUIL': 'ACCUEIL',
        'REGISSEUR': 'REGISSEUR',
        'AGENT_REVISION': 'REVISION',
        'AGENT_IMPOT': 'IMPOT',
        'AGENT_RCCM1': 'RCCM1',
        'AGENT_RCCM2': 'RCCM2',
        'AGENT_NINA': 'NINA',
        'AGENT_RETRAIT': 'RETRAIT',
        'SUPER_ADMIN': 'ACCUEIL'
      };
      
      const initialStep = roleStepMapping[agent.role] || 'ACCUEIL';
      setCurrentStep(initialStep);
    }
  }, [agent]);

  const loadDossier = async (id: string) => {
    setIsLoading(true);
    try {
      // Simuler le chargement du dossier (à remplacer par l'API réelle)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDossier: Dossier = {
        id,
        reference: `CE-2024-01-${id}`,
        nom: 'Entreprise Test',
        sigle: 'ET',
        statut: 'EN_COURS',
        dateCreation: new Date().toISOString(),
        division: 'Bamako District',
        antenne: 'Antenne Centrale',
        documentsManquants: [],
        personneId: 'person-123',
        entrepriseId: id
      };
      
      setDossier(mockDossier);
      // L'étape actuelle est déterminée par le rôle de l'agent
      // Pas besoin de la récupérer du dossier
    } catch (error) {
      console.error('Erreur lors du chargement du dossier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepChange = (stepId: string) => {
    if (canViewStep(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const handleDossierUpdate = (updatedDossier: Dossier) => {
    setDossier(updatedDossier);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'ACCUEIL':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_ACCEUIL', 'SUPER_ADMIN']}
            requiredStep="ACCUEIL"
          >
            <AccueilStep 
              dossier={dossier || undefined}
              onDossierUpdate={handleDossierUpdate}
            />
          </RoleProtectedRoute>
        );
      
      case 'REGISSEUR':
        return (
          <RoleProtectedRoute 
            allowedRoles={['REGISSEUR', 'SUPER_ADMIN']}
            requiredStep="REGISSEUR"
          >
            <RegisseurStep 
              onDossierUpdate={handleDossierUpdate}
            />
          </RoleProtectedRoute>
        );
      
      case 'REVISION':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_REVISION', 'SUPER_ADMIN']}
            requiredStep="REVISION"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Étape REVISION</h3>
                <p className="text-gray-600">
                  Fonctionnalités de révision en cours de développement
                </p>
              </div>
            </div>
          </RoleProtectedRoute>
        );
      
      case 'IMPOT':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_IMPOT', 'SUPER_ADMIN']}
            requiredStep="IMPOT"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Étape IMPÔTS</h3>
                <p className="text-gray-600">
                  Fonctionnalités fiscales en cours de développement
                </p>
              </div>
            </div>
          </RoleProtectedRoute>
        );
      
      case 'RCCM1':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_RCCM1', 'SUPER_ADMIN']}
            requiredStep="RCCM1"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Étape RCCM Phase 1</h3>
                <p className="text-gray-600">
                  Fonctionnalités RCCM Phase 1 en cours de développement
                </p>
              </div>
            </div>
          </RoleProtectedRoute>
        );
      
      case 'RCCM2':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_RCCM2', 'SUPER_ADMIN']}
            requiredStep="RCCM2"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Étape RCCM Phase 2</h3>
                <p className="text-gray-600">
                  Fonctionnalités RCCM Phase 2 en cours de développement
                </p>
              </div>
            </div>
          </RoleProtectedRoute>
        );
      
      case 'NINA':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_NINA', 'SUPER_ADMIN']}
            requiredStep="NINA"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Étape NINA</h3>
                <p className="text-gray-600">
                  Fonctionnalités NINA en cours de développement
                </p>
              </div>
            </div>
          </RoleProtectedRoute>
        );
      
      case 'RETRAIT':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_RETRAIT', 'SUPER_ADMIN']}
            requiredStep="RETRAIT"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Étape RETRAIT</h3>
                <p className="text-gray-600">
                  Fonctionnalités de retrait en cours de développement
                </p>
              </div>
            </div>
          </RoleProtectedRoute>
        );
      
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-yellow-800">Étape non reconnue: {currentStep}</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald"></div>
        <span className="ml-2 text-gray-600">Chargement du dossier...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Navigation des étapes */}
      <div className="w-80 flex-shrink-0">
        <StepNavigation
          currentStep={currentStep}
          onStepChange={handleStepChange}
          dossierStatus={dossier?.statut}
        />
        
        {/* Informations du dossier */}
        {dossier && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <InformationCircleIcon className="h-5 w-5 text-mali-emerald mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Informations du dossier</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Référence:</span>
                <span className="ml-2 font-medium">{dossier.reference}</span>
              </div>
              <div>
                <span className="text-gray-600">Entreprise:</span>
                <span className="ml-2 font-medium">{dossier.nom}</span>
              </div>
              <div>
                <span className="text-gray-600">Statut:</span>
                <span className="ml-2 font-medium">{dossier.statut}</span>
              </div>
              <div>
                <span className="text-gray-600">Division:</span>
                <span className="ml-2">{dossier.division}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Contenu de l'étape */}
      <div className="flex-1">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default DossierWorkflow;
