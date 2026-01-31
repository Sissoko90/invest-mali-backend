import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import StepNavigation from './StepNavigation';
import AccueilStep from './AccueilStep';
import RegisseurStep from './RegisseurStep';
import RevisionStep from './RevisionStep';
import ImpotsStep from './ImpotsStep';
import TCOMStep from './TCOMStep';
import RCCM2Step from './RCCM2Step';
import NinaStep from './NinaStep';
import RetraitStep from './RetraitStep';
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
        'AGENT_REGISTER': 'REGISSEUR', // AGENT_REGISTER utilise RegisseurStep
        'REGISSEUR': 'REGISSEUR',
        'AGENT_REVISION': 'REVISION',
        'AGENT_IMPOT': 'IMPOTS',
        'AGENT_TCOM': 'TCOM',
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

  const handleEntrepriseUpdate = (updatedEntreprise: Entreprise) => {
    setEntreprise(updatedEntreprise);
    console.log('🔄 [DossierWorkflow] Entreprise mise à jour:', updatedEntreprise);
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
            allowedRoles={['AGENT_REGISTER', 'REGISSEUR', 'SUPER_ADMIN']}
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
            <RevisionStep 
              onDossierUpdate={handleDossierUpdate}
            />
          </RoleProtectedRoute>
        );
      
      case 'IMPOTS':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_IMPOT', 'SUPER_ADMIN']}
            requiredStep="IMPOTS"
          >
            <ImpotsStep 
              canEditStep={canEditStep}
              onDossierUpdate={handleDossierUpdate}
            />
          </RoleProtectedRoute>
        );
      
      
      case 'TCOM':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_TCOM', 'SUPER_ADMIN']}
            requiredStep="TCOM"
          >
            <TCOMStep 
              canEditStep={canEditStep}
              onDossierUpdate={handleDossierUpdate}
            />
          </RoleProtectedRoute>
        );
      
      case 'RCCM2':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_RCCM2', 'SUPER_ADMIN']}
            requiredStep="RCCM2"
          >
            <RCCM2Step 
              canEditStep={canEditStep}
              onDossierUpdate={handleDossierUpdate}
            />
          </RoleProtectedRoute>
        );
      
      case 'NINA':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_NINA', 'SUPER_ADMIN']}
            requiredStep="NINA"
          >
            <NinaStep 
              onEntrepriseUpdate={handleEntrepriseUpdate}
            />
          </RoleProtectedRoute>
        );
      
      case 'RETRAIT':
        return (
          <RoleProtectedRoute 
            allowedRoles={['AGENT_RETRAIT', 'SUPER_ADMIN']}
            requiredStep="RETRAIT"
          >
            <RetraitStep 
              onDossierUpdate={handleDossierUpdate}
            />
          </RoleProtectedRoute>
        );
      
      default:
        return (
          <div className="bg-sky-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-primary-400 mr-2" />
              <p className="text-primary-800">Étape non reconnue: {currentStep}</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Navigation des étapes */}
      <div className="w-0 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <StepNavigation
            currentStep={currentStep}
            onStepChange={handleStepChange}
            dossierStatus={dossier?.statut}
          />
        </div>
        
        {/* Informations du dossier */}
        {/* {dossier && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Informations du dossier</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Référence</span>
                <span className="font-medium text-gray-800">{dossier.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Entreprise</span>
                <span className="font-medium text-gray-800">{dossier.nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-medium">{dossier.statut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Division</span>
                <span className="text-gray-700">{dossier.division}</span>
              </div>
            </div>
          </div>
        )} */}
      </div>
      
      {/* Contenu de l'étape */}
      <div className="flex-1">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default DossierWorkflow;
























