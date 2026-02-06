import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import AutorisationExerciceSelector from './AutorisationExerciceSelector';
import WorkflowViewer from './WorkflowViewer';
import {
  PlusIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface TypeDemandeInfo {
  type: string;
  libelle: string;
  montant: number;
  workflowType: string;
  totalSteps: number;
  steps: string[];
  requiresPaiement: boolean;
  description?: string;
}

interface AutorisationExerciceManagerProps {
  entrepriseId?: string;
  mode?: 'creation' | 'consultation';
  onDemandeCreated?: (demande: any) => void;
}

const AutorisationExerciceManager: React.FC<AutorisationExerciceManagerProps> = ({
  entrepriseId,
  mode = 'creation',
  onDemandeCreated
}) => {
  const { agent } = useAgentAuth();
  const [selectedType, setSelectedType] = useState<TypeDemandeInfo | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'consultation' && entrepriseId) {
      loadCurrentWorkflow();
    }
  }, [mode, entrepriseId]);

  const loadCurrentWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/autorisation-exercice/statut/${entrepriseId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentWorkflow(data);
        
        // Déterminer le type basé sur les données
        const typeInfo = await getTypeInfoFromWorkflow(data.typedemande);
        setSelectedType(typeInfo);
      }
    } catch (err) {
      console.error('Erreur chargement workflow actuel:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeInfoFromWorkflow = async (type: string): Promise<TypeDemandeInfo> => {
    try {
      const response = await fetch(`/api/v1/autorisation-exercice/workflow/${type}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Erreur chargement type info:', err);
    }
    
    // Fallback
    return {
      type,
      libelle: type,
      montant: 0,
      workflowType: 'UNKNOWN',
      totalSteps: 0,
      steps: [],
      requiresPaiement: false
    };
  };

  const handleTypeSelected = (typeInfo: TypeDemandeInfo) => {
    setSelectedType(typeInfo);
    setError(null);
    setSuccess(null);
  };

  const handleCreateDemande = async () => {
    if (!selectedType || !entrepriseId || !agent) {
      setError('Informations manquantes pour créer la demande');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = getCreateEndpoint(selectedType.type);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entrepriseId,
          agentId: agent.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const result = await response.json();
      setSuccess(`Demande ${selectedType.libelle} créée avec succès`);
      
      // Recharger le workflow
      await loadCurrentWorkflow();
      
      if (onDemandeCreated) {
        onDemandeCreated(result);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getCreateEndpoint = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return '/api/v1/autorisation-exercice/agrement/creer';
      case 'DECISION':
        return '/api/v1/autorisation-exercice/decision/creer';
      case 'ENREGISTREMENT':
        return '/api/v1/autorisation-exercice/enregistrement/creer';
      default:
        throw new Error('Type de demande non supporté');
    }
  };

  const handleStepAction = async (action: string, step: string, data?: any) => {
    if (!entrepriseId || !agent) return;

    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      let body: any = {
        entrepriseId,
        agentId: agent.id
      };

      switch (action) {
        case 'VALIDER':
          endpoint = getValidationEndpoint(step);
          body.observations = `Validation par agent ${agent.id} - ${new Date().toLocaleString()}`;
          break;
        case 'REJETER':
          endpoint = '/api/v1/autorisation-exercice/rejeter';
          body.motifRejet = prompt('Motif du rejet:') || 'Rejet sans motif';
          break;
        case 'GENERER_PAIEMENT':
          // Logique pour générer un paiement
          setSuccess('Fonctionnalité de paiement à implémenter');
          return;
        default:
          throw new Error('Action non supportée');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'action');
      }

      setSuccess(`Action ${action} effectuée avec succès`);
      await loadCurrentWorkflow();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const getValidationEndpoint = (step: string) => {
    if (step.includes('MIC')) {
      return '/api/v1/autorisation-exercice/agrement/passer-mic';
    } else if (step.includes('MINISTERE_FINANCES')) {
      return '/api/v1/autorisation-exercice/agrement/passer-finances';
    } else if (step.includes('SGG')) {
      return '/api/v1/autorisation-exercice/agrement/passer-sgg';
    } else if (step.includes('PRESIDENCE')) {
      return '/api/v1/autorisation-exercice/agrement/passer-presidence';
    }
    
    // Endpoint générique pour les autres étapes
    return '/api/v1/autorisation-exercice/agrement/passer-etape-suivante';
  };

  return (
    <div className="space-y-6">
      {/* Messages d'état */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">Erreur</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">Succès</span>
          </div>
          <p className="text-green-600 text-sm mt-1">{success}</p>
        </div>
      )}

      {/* Sélection du type de demande (mode création uniquement) */}
      {mode === 'creation' && (
        <AutorisationExerciceSelector
          onTypeSelected={handleTypeSelected}
          selectedType={selectedType?.type}
          disabled={loading}
        />
      )}

      {/* Bouton de création */}
      {mode === 'creation' && selectedType && entrepriseId && (
        <div className="flex justify-center">
          <button
            onClick={handleCreateDemande}
            disabled={loading}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
              ${loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                <span>Créer la demande {selectedType.libelle}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Affichage du workflow */}
      {selectedType && (mode === 'consultation' || currentWorkflow) && (
        <WorkflowViewer
          entrepriseId={entrepriseId || ''}
          workflowInfo={selectedType}
          currentStep={currentWorkflow?.assignment?.etape}
          onStepAction={handleStepAction}
          readOnly={mode === 'consultation' && !agent}
        />
      )}

      {/* État de chargement */}
      {loading && !error && !success && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      )}

      {/* Informations complémentaires */}
      {selectedType && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Informations sur la demande
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{selectedType.libelle}</span>
            </div>
            <div>
              <span className="text-gray-600">Montant:</span>
              <span className="ml-2 font-medium">
                {new Intl.NumberFormat('fr-FR').format(selectedType.montant)} FCFA
              </span>
            </div>
            <div>
              <span className="text-gray-600">Étapes:</span>
              <span className="ml-2 font-medium">{selectedType.totalSteps}</span>
            </div>
          </div>
          {selectedType.requiresPaiement && (
            <div className="mt-2 text-sm text-orange-600">
              ⚠️ Cette demande nécessite un paiement préalable
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutorisationExerciceManager;
