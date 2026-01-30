<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
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

interface AutorisationExerciceSelectorProps {
  onTypeSelected: (typeInfo: TypeDemandeInfo) => void;
  selectedType?: string;
  disabled?: boolean;
}

const AutorisationExerciceSelector: React.FC<AutorisationExerciceSelectorProps> = ({
  onTypeSelected,
  selectedType,
  disabled = false
}) => {
  const [typesDisponibles, setTypesDisponibles] = useState<TypeDemandeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTypesDemandesDisponibles();
  }, []);

  const loadTypesDemandesDisponibles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/autorisation-exercice/types-demandes');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des types de demandes');
      }
      
      const data = await response.json();
      setTypesDisponibles(data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement types demandes:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Fallback avec données statiques
      setTypesDisponibles([
        {
          type: 'AGREMENT',
          libelle: 'Demande d\'Agrément',
          montant: 300000,
          workflowType: 'WORKFLOW_COMPLET',
          totalSteps: 8,
          steps: ['Accueil', 'MIC', 'MF', 'SGG', 'Présidence', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: true,
          description: 'Procédure complète avec validation présidentielle'
        },
        {
          type: 'DECISION',
          libelle: 'Demande de Décision',
          montant: 150000,
          workflowType: 'WORKFLOW_DECISION',
          totalSteps: 5,
          steps: ['Accueil', 'MIC', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: false,
          description: 'Procédure intermédiaire via MIC et SGG'
        },
        {
          type: 'ENREGISTREMENT',
          libelle: 'Enregistrement',
          montant: 50000,
          workflowType: 'WORKFLOW_SIMPLE',
          totalSteps: 2,
          steps: ['Accueil', 'Complet'],
          requiresPaiement: false,
          description: 'Procédure simplifiée, traitement direct'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = (typeInfo: TypeDemandeInfo) => {
    if (!disabled) {
      onTypeSelected(typeInfo);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return <DocumentTextIcon className="w-8 h-8 text-blue-600" />;
      case 'DECISION':
        return <ClockIcon className="w-8 h-8 text-orange-600" />;
      case 'ENREGISTREMENT':
        return <CheckCircleIcon className="w-8 h-8 text-green-600" />;
      default:
        return <InformationCircleIcon className="w-8 h-8 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'DECISION':
        return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      case 'ENREGISTREMENT':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <InformationCircleIcon className="w-5 h-5" />
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadTypesDemandesDisponibles}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Type de Demande d'Autorisation d'Exercice
      </h3>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {typesDisponibles.map((typeInfo) => (
          <div
            key={typeInfo.type}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${selectedType === typeInfo.type 
                ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-200' 
                : getTypeColor(typeInfo.type)
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
            `}
            onClick={() => handleTypeSelection(typeInfo)}
          >
            {/* Indicateur de sélection */}
            {selectedType === typeInfo.type && (
              <div className="absolute top-2 right-2">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
            )}

            {/* Header avec icône et titre */}
            <div className="flex items-start space-x-3 mb-3">
              {getTypeIcon(typeInfo.type)}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-base">
                  {typeInfo.libelle}
                </h4>
                {typeInfo.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {typeInfo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="space-y-2">
              {/* Montant */}
              <div className="flex items-center space-x-2 text-sm">
                <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <span className="font-medium">{formatMontant(typeInfo.montant)}</span>
                  {typeInfo.requiresPaiement && (
                    <span className="text-red-600 ml-1">(Paiement requis)</span>
                  )}
                </span>
              </div>

              {/* Nombre d'étapes */}
              <div className="flex items-center space-x-2 text-sm">
                <ClockIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <span className="font-medium">{typeInfo.totalSteps} étapes</span>
                </span>
              </div>

              {/* Aperçu du workflow */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Workflow :</div>
                <div className="flex flex-wrap gap-1">
                  {typeInfo.steps.slice(0, 4).map((step, index) => (
                    <React.Fragment key={index}>
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {step}
                      </span>
                      {index < Math.min(typeInfo.steps.length - 1, 3) && (
                        <span className="text-gray-400 text-xs self-center">→</span>
                      )}
                    </React.Fragment>
                  ))}
                  {typeInfo.steps.length > 4 && (
                    <span className="text-gray-400 text-xs self-center">...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informations complémentaires */}
      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Type sélectionné : {
                typesDisponibles.find(t => t.type === selectedType)?.libelle
              }</p>
              <p>
                Cette demande suivra le workflow {
                  typesDisponibles.find(t => t.type === selectedType)?.workflowType.replace('WORKFLOW_', '').toLowerCase()
                } avec {
                  typesDisponibles.find(t => t.type === selectedType)?.totalSteps
                } étapes de validation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutorisationExerciceSelector;
=======
import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
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

interface AutorisationExerciceSelectorProps {
  onTypeSelected: (typeInfo: TypeDemandeInfo) => void;
  selectedType?: string;
  disabled?: boolean;
}

const AutorisationExerciceSelector: React.FC<AutorisationExerciceSelectorProps> = ({
  onTypeSelected,
  selectedType,
  disabled = false
}) => {
  const [typesDisponibles, setTypesDisponibles] = useState<TypeDemandeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTypesDemandesDisponibles();
  }, []);

  const loadTypesDemandesDisponibles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/autorisation-exercice/types-demandes');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des types de demandes');
      }
      
      const data = await response.json();
      setTypesDisponibles(data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement types demandes:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Fallback avec données statiques
      setTypesDisponibles([
        {
          type: 'AGREMENT',
          libelle: 'Demande d\'Agrément',
          montant: 300000,
          workflowType: 'WORKFLOW_COMPLET',
          totalSteps: 8,
          steps: ['Accueil', 'MIC', 'MF', 'SGG', 'Présidence', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: true,
          description: 'Procédure complète avec validation présidentielle'
        },
        {
          type: 'DECISION',
          libelle: 'Demande de Décision',
          montant: 150000,
          workflowType: 'WORKFLOW_DECISION',
          totalSteps: 5,
          steps: ['Accueil', 'MIC', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: false,
          description: 'Procédure intermédiaire via MIC et SGG'
        },
        {
          type: 'ENREGISTREMENT',
          libelle: 'Enregistrement',
          montant: 50000,
          workflowType: 'WORKFLOW_SIMPLE',
          totalSteps: 2,
          steps: ['Accueil', 'Complet'],
          requiresPaiement: false,
          description: 'Procédure simplifiée, traitement direct'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = (typeInfo: TypeDemandeInfo) => {
    if (!disabled) {
      onTypeSelected(typeInfo);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return <DocumentTextIcon className="w-8 h-8 text-blue-600" />;
      case 'DECISION':
        return <ClockIcon className="w-8 h-8 text-orange-600" />;
      case 'ENREGISTREMENT':
        return <CheckCircleIcon className="w-8 h-8 text-green-600" />;
      default:
        return <InformationCircleIcon className="w-8 h-8 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'DECISION':
        return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      case 'ENREGISTREMENT':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg border border-red-200">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <InformationCircleIcon className="w-5 h-5" />
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadTypesDemandesDisponibles}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Type de Demande d'Autorisation d'Exercice
      </h3>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {typesDisponibles.map((typeInfo) => (
          <div
            key={typeInfo.type}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${selectedType === typeInfo.type 
                ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-200' 
                : getTypeColor(typeInfo.type)
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
            `}
            onClick={() => handleTypeSelection(typeInfo)}
          >
            {/* Indicateur de sélection */}
            {selectedType === typeInfo.type && (
              <div className="absolute top-2 right-2">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
            )}

            {/* Header avec icône et titre */}
            <div className="flex items-start space-x-3 mb-3">
              {getTypeIcon(typeInfo.type)}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-base">
                  {typeInfo.libelle}
                </h4>
                {typeInfo.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {typeInfo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="space-y-2">
              {/* Montant */}
              <div className="flex items-center space-x-2 text-sm">
                <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <span className="font-medium">{formatMontant(typeInfo.montant)}</span>
                  {typeInfo.requiresPaiement && (
                    <span className="text-red-600 ml-1">(Paiement requis)</span>
                  )}
                </span>
              </div>

              {/* Nombre d'étapes */}
              <div className="flex items-center space-x-2 text-sm">
                <ClockIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <span className="font-medium">{typeInfo.totalSteps} étapes</span>
                </span>
              </div>

              {/* Aperçu du workflow */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Workflow :</div>
                <div className="flex flex-wrap gap-1">
                  {typeInfo.steps.slice(0, 4).map((step, index) => (
                    <React.Fragment key={index}>
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {step}
                      </span>
                      {index < Math.min(typeInfo.steps.length - 1, 3) && (
                        <span className="text-gray-400 text-xs self-center">→</span>
                      )}
                    </React.Fragment>
                  ))}
                  {typeInfo.steps.length > 4 && (
                    <span className="text-gray-400 text-xs self-center">...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informations complémentaires */}
      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Type sélectionné : {
                typesDisponibles.find(t => t.type === selectedType)?.libelle
              }</p>
              <p>
                Cette demande suivra le workflow {
                  typesDisponibles.find(t => t.type === selectedType)?.workflowType.replace('WORKFLOW_', '').toLowerCase()
                } avec {
                  typesDisponibles.find(t => t.type === selectedType)?.totalSteps
                } étapes de validation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutorisationExerciceSelector;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
