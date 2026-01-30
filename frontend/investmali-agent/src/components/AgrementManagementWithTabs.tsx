<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import { Entreprise } from '../types';
import AutorisationExerciceManager from './AutorisationExerciceManager';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOffice2Icon,
  FireIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  XMarkIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Types d'agrément selon les procédures
type TypeAgrement = 'BTP_TOURISME' | 'ETABLISSEMENT_CLASSE' | 'CODE_INVESTISSEMENT';

interface AgrementData {
  typeAgrement: TypeAgrement;
  numeroAutorisation?: string;
  dateDelivrance?: string;
  delaiTraitement: number; // en jours
  avantagesFiscaux: boolean;
  observations?: string;
}

const AgrementManagementWithTabs: React.FC = () => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [agrementData, setAgrementData] = useState<Record<string, AgrementData>>({});
  const [showForm, setShowForm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'nouveau' | 'ancien'>('nouveau');

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await entreprisesAPI.list();
      setEntreprises(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des entreprises:', err);
      setError('Erreur lors du chargement des entreprises');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntreprises = entreprises.filter(entreprise =>
    entreprise.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entreprise.sigle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeAgrementInfo = (type: TypeAgrement) => {
    const infos = {
      BTP_TOURISME: {
        label: 'BTP et Tourisme',
        description: 'Autorisation pour les activités de BTP et établissements touristiques',
        icon: BuildingOffice2Icon,
        color: 'blue',
        delai: '30-45 jours',
        avantagesFiscaux: true
      },
      ETABLISSEMENT_CLASSE: {
        label: 'Établissement Classé',
        description: 'Autorisation pour les établissements classés dangereux',
        icon: FireIcon,
        color: 'red',
        delai: '45-60 jours',
        avantagesFiscaux: false
      },
      CODE_INVESTISSEMENT: {
        label: 'Code des Investissements',
        description: 'Agrément sous le régime du Code des Investissements',
        icon: BriefcaseIcon,
        color: 'green',
        delai: '60-90 jours',
        avantagesFiscaux: true
      }
    };
    return infos[type];
  };

  const handleSelectType = (entrepriseId: string, type: TypeAgrement) => {
    setAgrementData(prev => ({
      ...prev,
      [entrepriseId]: {
        typeAgrement: type,
        delaiTraitement: 30,
        avantagesFiscaux: getTypeAgrementInfo(type).avantagesFiscaux
      }
    }));
    setShowForm(entrepriseId);
  };

  const handleSubmitAgrement = async (entrepriseId: string) => {
    try {
      setIsProcessing(entrepriseId);
      // Logique de soumission de l'agrément ancien
      console.log('Soumission agrément ancien pour:', entrepriseId, agrementData[entrepriseId]);
      
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowForm(null);
      setSelectedEntreprise(null);
      
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError('Erreur lors de la soumission de l\'agrément');
    } finally {
      setIsProcessing(null);
    }
  };

  const renderAgrementForm = (entreprise: Entreprise) => {
    const data = agrementData[entreprise.id];
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Formulaire d'agrément - {getTypeAgrementInfo(data.typeAgrement).label}
          </h3>
          <button
            onClick={() => setShowForm(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro d'autorisation (optionnel)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={data.numeroAutorisation || ''}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, numeroAutorisation: e.target.value }
              }))}
              placeholder="Ex: AUT-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de délivrance
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={data.dateDelivrance || ''}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, dateDelivrance: e.target.value }
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai de traitement (jours)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={data.delaiTraitement}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, delaiTraitement: parseInt(e.target.value) || 30 }
              }))}
              min="1"
              max="365"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id={`avantages-${entreprise.id}`}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={data.avantagesFiscaux}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, avantagesFiscaux: e.target.checked }
              }))}
            />
            <label htmlFor={`avantages-${entreprise.id}`} className="ml-2 block text-sm text-gray-700">
              Avantages fiscaux applicables
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observations
          </label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={data.observations || ''}
            onChange={(e) => setAgrementData(prev => ({
              ...prev,
              [entreprise.id]: { ...data, observations: e.target.value }
            }))}
            placeholder="Observations particulières sur cette demande d'agrément..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowForm(null)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => handleSubmitAgrement(entreprise.id)}
            disabled={isProcessing === entreprise.id}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isProcessing === entreprise.id ? 'Traitement...' : 'Soumettre l\'agrément'}
          </button>
        </div>
      </div>
    );
  };

  const renderTypeSelection = (entreprise: Entreprise) => {
    const types: TypeAgrement[] = ['BTP_TOURISME', 'ETABLISSEMENT_CLASSE', 'CODE_INVESTISSEMENT'];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Sélectionner le type d'autorisation d'exercice (Ancien système)
          </h3>
          <button
            onClick={() => setSelectedEntreprise(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {types.map(type => {
            const info = getTypeAgrementInfo(type);
            const Icon = info.icon;
            
            return (
              <button
                key={type}
                onClick={() => handleSelectType(entreprise.id, type)}
                className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-lg ${
                  agrementData[entreprise.id]?.typeAgrement === type
                    ? `border-${info.color}-500 bg-${info.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-${info.color}-100`}>
                    <Icon className={`h-8 w-8 text-${info.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{info.label}</h4>
                    <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">Délai: <strong>{info.delai}</strong></span>
                      </div>
                      {info.avantagesFiscaux && (
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          <span className="text-gray-700">Avantages fiscaux</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: 'nouveau',
      name: 'Nouveaux Workflows',
      icon: SparklesIcon,
      description: 'Système d\'autorisation d\'exercice avec workflows MIC/SGG/Présidence'
    },
    {
      id: 'ancien',
      name: 'Ancien Système',
      icon: DocumentTextIcon,
      description: 'Système d\'agrément traditionnel BTP/Tourisme/Code Investissement'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Autorisations d'Exercice
          </h1>
          <p className="text-gray-600">
            Gérez les demandes d'autorisation d'exercice avec les nouveaux workflows ou l'ancien système
          </p>
        </div>

        {/* Onglets */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'nouveau' | 'ancien')}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-400 font-normal">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-medium">Erreur</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Contenu des onglets */}
        {activeTab === 'nouveau' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Nouveaux Workflows d'Autorisation d'Exercice
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Système avec workflows Agrément, Décision et Enregistrement
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <SparklesIcon className="w-5 h-5" />
                  <span>Nouveau système</span>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Liste des entreprises pour nouveaux workflows */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement des entreprises...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEntreprises.map((entreprise) => (
                    <div key={entreprise.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entreprise.nom}
                            {entreprise.sigle && (
                              <span className="text-gray-500 ml-2">({entreprise.sigle})</span>
                            )}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            ID: {entreprise.id}
                          </p>
                        </div>
                      </div>

                      {/* Intégration du nouveau système */}
                      <AutorisationExerciceManager
                        entrepriseId={entreprise.id}
                        mode="creation"
                        onDemandeCreated={(demande) => {
                          console.log('Demande créée:', demande);
                          // Optionnel: actualiser la liste ou afficher un message
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ancien' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Ancien Système d'Agrément
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Système traditionnel BTP, Tourisme et Code des Investissements
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Système traditionnel</span>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Liste des entreprises pour ancien système */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement des entreprises...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEntreprises.map((entreprise) => (
                    <div key={entreprise.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entreprise.nom}
                            {entreprise.sigle && (
                              <span className="text-gray-500 ml-2">({entreprise.sigle})</span>
                            )}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            ID: {entreprise.id}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {selectedEntreprise !== entreprise.id && (
                            <button
                              onClick={() => setSelectedEntreprise(entreprise.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <span>Créer une demande</span>
                              <ArrowRightIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedEntreprise === entreprise.id && !showForm && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          {renderTypeSelection(entreprise)}
                        </div>
                      )}

                      {showForm === entreprise.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          {renderAgrementForm(entreprise)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgrementManagementWithTabs;
=======
import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import { Entreprise } from '../types';
import AutorisationExerciceManager from './AutorisationExerciceManager';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOffice2Icon,
  FireIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  XMarkIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Types d'agrément selon les procédures
type TypeAgrement = 'BTP_TOURISME' | 'ETABLISSEMENT_CLASSE' | 'CODE_INVESTISSEMENT';

interface AgrementData {
  typeAgrement: TypeAgrement;
  numeroAutorisation?: string;
  dateDelivrance?: string;
  delaiTraitement: number; // en jours
  avantagesFiscaux: boolean;
  observations?: string;
}

const AgrementManagementWithTabs: React.FC = () => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [agrementData, setAgrementData] = useState<Record<string, AgrementData>>({});
  const [showForm, setShowForm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'nouveau' | 'ancien'>('nouveau');

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await entreprisesAPI.list();
      setEntreprises(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des entreprises:', err);
      setError('Erreur lors du chargement des entreprises');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntreprises = entreprises.filter(entreprise =>
    entreprise.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entreprise.sigle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeAgrementInfo = (type: TypeAgrement) => {
    const infos = {
      BTP_TOURISME: {
        label: 'BTP et Tourisme',
        description: 'Autorisation pour les activités de BTP et établissements touristiques',
        icon: BuildingOffice2Icon,
        color: 'blue',
        delai: '30-45 jours',
        avantagesFiscaux: true
      },
      ETABLISSEMENT_CLASSE: {
        label: 'Établissement Classé',
        description: 'Autorisation pour les établissements classés dangereux',
        icon: FireIcon,
        color: 'red',
        delai: '45-60 jours',
        avantagesFiscaux: false
      },
      CODE_INVESTISSEMENT: {
        label: 'Code des Investissements',
        description: 'Agrément sous le régime du Code des Investissements',
        icon: BriefcaseIcon,
        color: 'green',
        delai: '60-90 jours',
        avantagesFiscaux: true
      }
    };
    return infos[type];
  };

  const handleSelectType = (entrepriseId: string, type: TypeAgrement) => {
    setAgrementData(prev => ({
      ...prev,
      [entrepriseId]: {
        typeAgrement: type,
        delaiTraitement: 30,
        avantagesFiscaux: getTypeAgrementInfo(type).avantagesFiscaux
      }
    }));
    setShowForm(entrepriseId);
  };

  const handleSubmitAgrement = async (entrepriseId: string) => {
    try {
      setIsProcessing(entrepriseId);
      // Logique de soumission de l'agrément ancien
      console.log('Soumission agrément ancien pour:', entrepriseId, agrementData[entrepriseId]);
      
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowForm(null);
      setSelectedEntreprise(null);
      
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError('Erreur lors de la soumission de l\'agrément');
    } finally {
      setIsProcessing(null);
    }
  };

  const renderAgrementForm = (entreprise: Entreprise) => {
    const data = agrementData[entreprise.id];
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Formulaire d'agrément - {getTypeAgrementInfo(data.typeAgrement).label}
          </h3>
          <button
            onClick={() => setShowForm(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro d'autorisation (optionnel)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={data.numeroAutorisation || ''}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, numeroAutorisation: e.target.value }
              }))}
              placeholder="Ex: AUT-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de délivrance
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={data.dateDelivrance || ''}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, dateDelivrance: e.target.value }
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai de traitement (jours)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={data.delaiTraitement}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, delaiTraitement: parseInt(e.target.value) || 30 }
              }))}
              min="1"
              max="365"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id={`avantages-${entreprise.id}`}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={data.avantagesFiscaux}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...data, avantagesFiscaux: e.target.checked }
              }))}
            />
            <label htmlFor={`avantages-${entreprise.id}`} className="ml-2 block text-sm text-gray-700">
              Avantages fiscaux applicables
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observations
          </label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={data.observations || ''}
            onChange={(e) => setAgrementData(prev => ({
              ...prev,
              [entreprise.id]: { ...data, observations: e.target.value }
            }))}
            placeholder="Observations particulières sur cette demande d'agrément..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowForm(null)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => handleSubmitAgrement(entreprise.id)}
            disabled={isProcessing === entreprise.id}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isProcessing === entreprise.id ? 'Traitement...' : 'Soumettre l\'agrément'}
          </button>
        </div>
      </div>
    );
  };

  const renderTypeSelection = (entreprise: Entreprise) => {
    const types: TypeAgrement[] = ['BTP_TOURISME', 'ETABLISSEMENT_CLASSE', 'CODE_INVESTISSEMENT'];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Sélectionner le type d'autorisation d'exercice (Ancien système)
          </h3>
          <button
            onClick={() => setSelectedEntreprise(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {types.map(type => {
            const info = getTypeAgrementInfo(type);
            const Icon = info.icon;
            
            return (
              <button
                key={type}
                onClick={() => handleSelectType(entreprise.id, type)}
                className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-lg ${
                  agrementData[entreprise.id]?.typeAgrement === type
                    ? `border-${info.color}-500 bg-${info.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-${info.color}-100`}>
                    <Icon className={`h-8 w-8 text-${info.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{info.label}</h4>
                    <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">Délai: <strong>{info.delai}</strong></span>
                      </div>
                      {info.avantagesFiscaux && (
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          <span className="text-gray-700">Avantages fiscaux</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: 'nouveau',
      name: 'Nouveaux Workflows',
      icon: SparklesIcon,
      description: 'Système d\'autorisation d\'exercice avec workflows MIC/SGG/Présidence'
    },
    {
      id: 'ancien',
      name: 'Ancien Système',
      icon: DocumentTextIcon,
      description: 'Système d\'agrément traditionnel BTP/Tourisme/Code Investissement'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Autorisations d'Exercice
          </h1>
          <p className="text-gray-600">
            Gérez les demandes d'autorisation d'exercice avec les nouveaux workflows ou l'ancien système
          </p>
        </div>

        {/* Onglets */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'nouveau' | 'ancien')}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-400 font-normal">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-medium">Erreur</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Contenu des onglets */}
        {activeTab === 'nouveau' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Nouveaux Workflows d'Autorisation d'Exercice
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Système avec workflows Agrément, Décision et Enregistrement
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <SparklesIcon className="w-5 h-5" />
                  <span>Nouveau système</span>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Liste des entreprises pour nouveaux workflows */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement des entreprises...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEntreprises.map((entreprise) => (
                    <div key={entreprise.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entreprise.nom}
                            {entreprise.sigle && (
                              <span className="text-gray-500 ml-2">({entreprise.sigle})</span>
                            )}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            ID: {entreprise.id}
                          </p>
                        </div>
                      </div>

                      {/* Intégration du nouveau système */}
                      <AutorisationExerciceManager
                        entrepriseId={entreprise.id}
                        mode="creation"
                        onDemandeCreated={(demande) => {
                          console.log('Demande créée:', demande);
                          // Optionnel: actualiser la liste ou afficher un message
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ancien' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Ancien Système d'Agrément
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Système traditionnel BTP, Tourisme et Code des Investissements
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Système traditionnel</span>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Liste des entreprises pour ancien système */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Chargement des entreprises...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEntreprises.map((entreprise) => (
                    <div key={entreprise.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entreprise.nom}
                            {entreprise.sigle && (
                              <span className="text-gray-500 ml-2">({entreprise.sigle})</span>
                            )}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            ID: {entreprise.id}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {selectedEntreprise !== entreprise.id && (
                            <button
                              onClick={() => setSelectedEntreprise(entreprise.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <span>Créer une demande</span>
                              <ArrowRightIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedEntreprise === entreprise.id && !showForm && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          {renderTypeSelection(entreprise)}
                        </div>
                      )}

                      {showForm === entreprise.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          {renderAgrementForm(entreprise)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgrementManagementWithTabs;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
