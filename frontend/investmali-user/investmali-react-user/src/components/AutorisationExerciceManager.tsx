import React, { useState, useEffect } from 'react';
import AutorisationExerciceUserSelector from './AutorisationExerciceUserSelector';
import AutorisationExerciceStatus from './AutorisationExerciceStatus';
import {
  PlusIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  InformationCircleIcon
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
  mode?: 'selection' | 'creation' | 'suivi';
  onBack?: () => void;
}

const AutorisationExerciceManager: React.FC<AutorisationExerciceManagerProps> = ({
  entrepriseId,
  mode = 'selection',
  onBack
}) => {
  const [currentMode, setCurrentMode] = useState<'selection' | 'creation' | 'suivi'>(mode);
  const [selectedType, setSelectedType] = useState<TypeDemandeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdDemandeId, setCreatedDemandeId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const handleTypeSelected = (typeInfo: TypeDemandeInfo) => {
    setSelectedType(typeInfo);
    setError(null);
    setSuccess(null);
  };

  const handleProceedToCreation = () => {
    if (selectedType) {
      setCurrentMode('creation');
    }
  };

  const handleCreateDemande = async () => {
    if (!selectedType || !entrepriseId) {
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
          typedemande: selectedType.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const result = await response.json();
      setSuccess(`Demande ${selectedType.libelle} créée avec succès`);
      setCreatedDemandeId(result.assignment?.id || 'created');
      
      // Passer automatiquement au suivi après création
      setTimeout(() => {
        setCurrentMode('suivi');
      }, 2000);

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

  const handleBackToSelection = () => {
    setCurrentMode('selection');
    setSelectedType(null);
    setError(null);
    setSuccess(null);
    setCreatedDemandeId(null);
  };

  const handleRefreshStatus = () => {
    // Force le rechargement du composant de statut
    setCurrentMode('suivi');
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  // Mode sélection
  if (currentMode === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50">
        {onBack && (
          <div className="max-w-6xl mx-auto p-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Retour</span>
            </button>
          </div>
        )}

        <AutorisationExerciceUserSelector
          onTypeSelected={handleTypeSelected}
          selectedType={selectedType?.type}
          disabled={loading}
          onProceed={handleProceedToCreation}
        />

        {/* Messages d'état */}
        {error && (
          <div className="max-w-6xl mx-auto p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="font-medium">Erreur</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-6xl mx-auto p-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-medium">Succès</span>
              </div>
              <p className="text-green-600 text-sm mt-1">{success}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mode création
  if (currentMode === 'creation') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBackToSelection}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Retour à la sélection</span>
            </button>
            
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Sélection</span>
              <span>→</span>
              <span className="text-blue-600 font-medium">Création</span>
              <span>→</span>
              <span>Suivi</span>
            </nav>
          </div>

          {/* Confirmation de création */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Confirmation de la demande</h2>
              <p className="text-blue-100">
                Vérifiez les informations avant de soumettre votre demande
              </p>
            </div>

            <div className="p-8">
              {selectedType && (
                <div className="space-y-6">
                  {/* Résumé de la demande */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Résumé de votre demande
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Type de demande</label>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          {selectedType.libelle}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {selectedType.description}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Montant</label>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          {formatMontant(selectedType.montant)}
                        </div>
                        {selectedType.requiresPaiement && (
                          <div className="text-sm text-orange-600 mt-1">
                            ⚠️ Paiement requis lors du dépôt
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Nombre d'étapes</label>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          {selectedType.totalSteps} étapes de validation
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Entreprise</label>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                          ID: {entrepriseId}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aperçu du processus */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      Aperçu du processus de validation
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedType.steps.map((step, index) => (
                        <React.Fragment key={index}>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {step}
                          </span>
                          {index < selectedType.steps.length - 1 && (
                            <span className="text-blue-400 self-center">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

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
                      <p className="text-green-600 text-sm mt-2">
                        Redirection vers le suivi en cours...
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={handleBackToSelection}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Modifier la sélection
                    </button>
                    
                    <button
                      onClick={handleCreateDemande}
                      disabled={loading || !!success}
                      className={`
                        flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all
                        ${loading || success
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
                      ) : success ? (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Demande créée</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-5 h-5" />
                          <span>Confirmer et créer la demande</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations importantes */}
          <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-2">
                  Informations importantes
                </h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Une fois créée, votre demande entrera dans le processus de validation</li>
                  <li>• Vous recevrez des notifications à chaque étape du processus</li>
                  <li>• Vous pouvez suivre l'avancement de votre demande en temps réel</li>
                  <li>• En cas de rejet, vous serez informé des motifs et des actions à entreprendre</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode suivi
  if (currentMode === 'suivi') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBackToSelection}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Nouvelle demande</span>
            </button>
            
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Sélection</span>
              <span>→</span>
              <span>Création</span>
              <span>→</span>
              <span className="text-blue-600 font-medium">Suivi</span>
            </nav>
          </div>

          {entrepriseId ? (
            <AutorisationExerciceStatus
              entrepriseId={entrepriseId}
              onRefresh={handleRefreshStatus}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ID d'entreprise requis
              </h3>
              <p className="text-gray-600 mb-6">
                Un ID d'entreprise est nécessaire pour afficher le suivi des demandes.
              </p>
              <button
                onClick={handleBackToSelection}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retour à la sélection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default AutorisationExerciceManager;
