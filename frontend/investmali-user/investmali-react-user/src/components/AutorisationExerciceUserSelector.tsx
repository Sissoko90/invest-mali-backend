<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  SparklesIcon
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
  delaiTraitement?: string;
  avantages?: string[];
}

interface AutorisationExerciceUserSelectorProps {
  onTypeSelected: (typeInfo: TypeDemandeInfo) => void;
  selectedType?: string;
  disabled?: boolean;
  onProceed?: () => void;
}

const AutorisationExerciceUserSelector: React.FC<AutorisationExerciceUserSelectorProps> = ({
  onTypeSelected,
  selectedType,
  disabled = false,
  onProceed
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
      
      // Fallback avec données statiques pour l'interface utilisateur
      setTypesDisponibles([
        {
          type: 'AGREMENT',
          libelle: 'Demande d\'Agrément',
          montant: 300000,
          workflowType: 'WORKFLOW_COMPLET',
          totalSteps: 8,
          steps: ['Accueil', 'MIC', 'Ministère des Finances', 'SGG', 'Présidence', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: true,
          description: 'Procédure complète avec validation présidentielle pour les activités nécessitant un agrément officiel',
          delaiTraitement: '60-90 jours ouvrables',
          avantages: [
            'Autorisation officielle d\'exercer',
            'Reconnaissance gouvernementale',
            'Accès aux marchés publics',
            'Crédibilité renforcée'
          ]
        },
        {
          type: 'DECISION',
          libelle: 'Demande de Décision',
          montant: 150000,
          workflowType: 'WORKFLOW_DECISION',
          totalSteps: 5,
          steps: ['Accueil', 'MIC', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: false,
          description: 'Procédure intermédiaire via MIC et SGG pour les activités réglementées',
          delaiTraitement: '30-45 jours ouvrables',
          avantages: [
            'Procédure simplifiée',
            'Délai réduit',
            'Validation ministérielle',
            'Coût modéré'
          ]
        },
        {
          type: 'ENREGISTREMENT',
          libelle: 'Enregistrement Simple',
          montant: 50000,
          workflowType: 'WORKFLOW_SIMPLE',
          totalSteps: 2,
          steps: ['Accueil', 'Validation'],
          requiresPaiement: false,
          description: 'Procédure simplifiée pour les activités ne nécessitant qu\'un enregistrement',
          delaiTraitement: '5-10 jours ouvrables',
          avantages: [
            'Traitement rapide',
            'Coût minimal',
            'Procédure directe',
            'Validation immédiate'
          ]
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
        return <ShieldCheckIcon className="w-12 h-12 text-blue-600" />;
      case 'DECISION':
        return <DocumentTextIcon className="w-12 h-12 text-orange-600" />;
      case 'ENREGISTREMENT':
        return <CheckCircleIcon className="w-12 h-12 text-green-600" />;
      default:
        return <InformationCircleIcon className="w-12 h-12 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          hover: 'hover:bg-blue-100',
          selected: 'border-blue-500 bg-blue-100 ring-2 ring-blue-200'
        };
      case 'DECISION':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          hover: 'hover:bg-orange-100',
          selected: 'border-orange-500 bg-orange-100 ring-2 ring-orange-200'
        };
      case 'ENREGISTREMENT':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          hover: 'hover:bg-green-100',
          selected: 'border-green-500 bg-green-100 ring-2 ring-green-200'
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          hover: 'hover:bg-gray-100',
          selected: 'border-gray-500 bg-gray-100 ring-2 ring-gray-200'
        };
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <InformationCircleIcon className="w-6 h-6" />
            <span className="font-semibold text-lg">Erreur de chargement</span>
          </div>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={loadTypesDemandesDisponibles}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent p-8 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Autorisation d'Exercice</h2>
          </div>
          <p className="text-blue-100 text-lg">
            Choisissez le type de demande d'autorisation d'exercice adapté à votre activité
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {typesDisponibles.map((typeInfo) => {
              const colors = getTypeColor(typeInfo.type);
              const isSelected = selectedType === typeInfo.type;
              
              return (
                <div
                  key={typeInfo.type}
                  className={`
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${isSelected ? colors.selected : `${colors.border} ${colors.bg} ${colors.hover}`}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
                  `}
                  onClick={() => handleTypeSelection(typeInfo)}
                >
                  {/* Badge de sélection */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-2">
                      <CheckCircleIcon className="w-5 h-5" />
                    </div>
                  )}

                  {/* Icône et titre */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      {getTypeIcon(typeInfo.type)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {typeInfo.libelle}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {typeInfo.description}
                    </p>
                  </div>

                  {/* Informations clés */}
                  <div className="space-y-4 mb-6">
                    {/* Montant */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Montant</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatMontant(typeInfo.montant)}
                      </span>
                    </div>

                    {/* Délai */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Délai</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {typeInfo.delaiTraitement || `${typeInfo.totalSteps} étapes`}
                      </span>
                    </div>

                    {/* Paiement requis */}
                    {typeInfo.requiresPaiement && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-yellow-800">
                          <InformationCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Paiement requis</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Avantages */}
                  {typeInfo.avantages && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Avantages :</h4>
                      <ul className="space-y-2">
                        {typeInfo.avantages.slice(0, 3).map((avantage, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{avantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Workflow preview */}
                  <div className="border-t pt-4">
                    <div className="text-xs text-gray-500 mb-2">Étapes du processus :</div>
                    <div className="flex flex-wrap gap-1">
                      {typeInfo.steps.slice(0, 4).map((step, index) => (
                        <React.Fragment key={index}>
                          <span className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
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
              );
            })}
          </div>

          {/* Informations complémentaires */}
          {selectedType && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Type sélectionné : {typesDisponibles.find(t => t.type === selectedType)?.libelle}
                  </h4>
                  <p className="text-blue-800 text-sm mb-4">
                    Cette demande suivra le workflow {
                      typesDisponibles.find(t => t.type === selectedType)?.workflowType.replace('WORKFLOW_', '').toLowerCase()
                    } avec {
                      typesDisponibles.find(t => t.type === selectedType)?.totalSteps
                    } étapes de validation.
                  </p>
                  
                  {onProceed && (
                    <button
                      onClick={onProceed}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continuer avec cette demande
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Note importante */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="text-sm text-gray-700">
                <strong>Important :</strong> Assurez-vous de choisir le type de demande approprié à votre activité. 
                En cas de doute, vous pouvez contacter nos services pour obtenir des conseils personnalisés.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutorisationExerciceUserSelector;
=======
import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  SparklesIcon
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
  delaiTraitement?: string;
  avantages?: string[];
}

interface AutorisationExerciceUserSelectorProps {
  onTypeSelected: (typeInfo: TypeDemandeInfo) => void;
  selectedType?: string;
  disabled?: boolean;
  onProceed?: () => void;
}

const AutorisationExerciceUserSelector: React.FC<AutorisationExerciceUserSelectorProps> = ({
  onTypeSelected,
  selectedType,
  disabled = false,
  onProceed
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
      
      // Fallback avec données statiques pour l'interface utilisateur
      setTypesDisponibles([
        {
          type: 'AGREMENT',
          libelle: 'Demande d\'Agrément',
          montant: 300000,
          workflowType: 'WORKFLOW_COMPLET',
          totalSteps: 8,
          steps: ['Accueil', 'MIC', 'Ministère des Finances', 'SGG', 'Présidence', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: true,
          description: 'Procédure complète avec validation présidentielle pour les activités nécessitant un agrément officiel',
          delaiTraitement: '60-90 jours ouvrables',
          avantages: [
            'Autorisation officielle d\'exercer',
            'Reconnaissance gouvernementale',
            'Accès aux marchés publics',
            'Crédibilité renforcée'
          ]
        },
        {
          type: 'DECISION',
          libelle: 'Demande de Décision',
          montant: 150000,
          workflowType: 'WORKFLOW_DECISION',
          totalSteps: 5,
          steps: ['Accueil', 'MIC', 'SGG', 'MIC', 'Retour'],
          requiresPaiement: false,
          description: 'Procédure intermédiaire via MIC et SGG pour les activités réglementées',
          delaiTraitement: '30-45 jours ouvrables',
          avantages: [
            'Procédure simplifiée',
            'Délai réduit',
            'Validation ministérielle',
            'Coût modéré'
          ]
        },
        {
          type: 'ENREGISTREMENT',
          libelle: 'Enregistrement Simple',
          montant: 50000,
          workflowType: 'WORKFLOW_SIMPLE',
          totalSteps: 2,
          steps: ['Accueil', 'Validation'],
          requiresPaiement: false,
          description: 'Procédure simplifiée pour les activités ne nécessitant qu\'un enregistrement',
          delaiTraitement: '5-10 jours ouvrables',
          avantages: [
            'Traitement rapide',
            'Coût minimal',
            'Procédure directe',
            'Validation immédiate'
          ]
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
        return <ShieldCheckIcon className="w-12 h-12 text-blue-600" />;
      case 'DECISION':
        return <DocumentTextIcon className="w-12 h-12 text-orange-600" />;
      case 'ENREGISTREMENT':
        return <CheckCircleIcon className="w-12 h-12 text-green-600" />;
      default:
        return <InformationCircleIcon className="w-12 h-12 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          hover: 'hover:bg-blue-100',
          selected: 'border-blue-500 bg-blue-100 ring-2 ring-blue-200'
        };
      case 'DECISION':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          hover: 'hover:bg-orange-100',
          selected: 'border-orange-500 bg-orange-100 ring-2 ring-orange-200'
        };
      case 'ENREGISTREMENT':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          hover: 'hover:bg-green-100',
          selected: 'border-green-500 bg-green-100 ring-2 ring-green-200'
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          hover: 'hover:bg-gray-100',
          selected: 'border-gray-500 bg-gray-100 ring-2 ring-gray-200'
        };
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <InformationCircleIcon className="w-6 h-6" />
            <span className="font-semibold text-lg">Erreur de chargement</span>
          </div>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={loadTypesDemandesDisponibles}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Autorisation d'Exercice</h2>
          </div>
          <p className="text-blue-100 text-lg">
            Choisissez le type de demande d'autorisation d'exercice adapté à votre activité
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {typesDisponibles.map((typeInfo) => {
              const colors = getTypeColor(typeInfo.type);
              const isSelected = selectedType === typeInfo.type;
              
              return (
                <div
                  key={typeInfo.type}
                  className={`
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${isSelected ? colors.selected : `${colors.border} ${colors.bg} ${colors.hover}`}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
                  `}
                  onClick={() => handleTypeSelection(typeInfo)}
                >
                  {/* Badge de sélection */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-2">
                      <CheckCircleIcon className="w-5 h-5" />
                    </div>
                  )}

                  {/* Icône et titre */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      {getTypeIcon(typeInfo.type)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {typeInfo.libelle}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {typeInfo.description}
                    </p>
                  </div>

                  {/* Informations clés */}
                  <div className="space-y-4 mb-6">
                    {/* Montant */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Montant</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatMontant(typeInfo.montant)}
                      </span>
                    </div>

                    {/* Délai */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Délai</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {typeInfo.delaiTraitement || `${typeInfo.totalSteps} étapes`}
                      </span>
                    </div>

                    {/* Paiement requis */}
                    {typeInfo.requiresPaiement && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-yellow-800">
                          <InformationCircleIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">Paiement requis</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Avantages */}
                  {typeInfo.avantages && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Avantages :</h4>
                      <ul className="space-y-2">
                        {typeInfo.avantages.slice(0, 3).map((avantage, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{avantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Workflow preview */}
                  <div className="border-t pt-4">
                    <div className="text-xs text-gray-500 mb-2">Étapes du processus :</div>
                    <div className="flex flex-wrap gap-1">
                      {typeInfo.steps.slice(0, 4).map((step, index) => (
                        <React.Fragment key={index}>
                          <span className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
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
              );
            })}
          </div>

          {/* Informations complémentaires */}
          {selectedType && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Type sélectionné : {typesDisponibles.find(t => t.type === selectedType)?.libelle}
                  </h4>
                  <p className="text-blue-800 text-sm mb-4">
                    Cette demande suivra le workflow {
                      typesDisponibles.find(t => t.type === selectedType)?.workflowType.replace('WORKFLOW_', '').toLowerCase()
                    } avec {
                      typesDisponibles.find(t => t.type === selectedType)?.totalSteps
                    } étapes de validation.
                  </p>
                  
                  {onProceed && (
                    <button
                      onClick={onProceed}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continuer avec cette demande
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Note importante */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="text-sm text-gray-700">
                <strong>Important :</strong> Assurez-vous de choisir le type de demande approprié à votre activité. 
                En cas de doute, vous pouvez contacter nos services pour obtenir des conseils personnalisés.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutorisationExerciceUserSelector;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
