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
  Cog6ToothIcon
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

const AgrementManagement: React.FC = () => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [agrementData, setAgrementData] = useState<Record<string, AgrementData>>({});
  const [showForm, setShowForm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ancien' | 'nouveau'>('nouveau');

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Charger toutes les entreprises qui ont terminé la création (étape RETRAIT)
      // et qui ont un domaine d'activité réglementé
      const response = await entreprisesAPI.getByEtape('RETRAIT');
      console.log('📋 [AgrementManagement] Réponse API complète:', response);
      
      const entreprisesData = response.data || [];
      console.log('📋 [AgrementManagement] Nombre d\'entreprises total:', entreprisesData.length);
      
      // Filtrer uniquement les entreprises avec un domaine d'activité réglementé
      // et qui n'ont pas encore d'agrément
      const entreprisesEligibles = entreprisesData.filter((ent: any) => {
        const hasDomaineReglemente = ent.domaineActivite && ent.domaineActivite.trim() !== '';
        const hasNoAgrement = !ent.numeroAutorisation;
        console.log(`🔍 [AgrementManagement] ${ent.nom} - Domaine: ${ent.domaineActivite || 'AUCUN'} - A agrément: ${!hasNoAgrement} - Éligible: ${hasDomaineReglemente && hasNoAgrement}`);
        return hasDomaineReglemente && hasNoAgrement;
      });
      
      console.log('📋 [AgrementManagement] Entreprises éligibles à l\'agrément:', entreprisesEligibles.length);
      setEntreprises(entreprisesEligibles);
    } catch (error) {
      console.error('❌ [AgrementManagement] Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des entreprises');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeAgrementInfo = (type: TypeAgrement) => {
    switch (type) {
      case 'BTP_TOURISME':
        return {
          label: 'BTP, Tourisme & Transport',
          description: 'Entrepreneurs BTP, cartographie, topographie, architectes, ingénieurs-conseils, promoteurs immobiliers, organisateurs de voyages, établissements de tourisme et spectacles, transports publics, producteurs de spectacles, salles de cinéma',
          delai: '24 heures',
          delaiJours: 1,
          icon: BuildingOffice2Icon,
          color: 'blue',
          avantagesFiscaux: false
        };
      case 'ETABLISSEMENT_CLASSE':
        return {
          label: 'Établissements Classés',
          description: 'Établissements classés dangereux, insalubres ou incommodes (dépôts d\'hydrocarbures, stations d\'essence, explosifs, produits chimiques) et demandes d\'implantation industrielle sans avantages du code des investissements',
          delai: '5 jours',
          delaiJours: 5,
          icon: FireIcon,
          color: 'orange',
          avantagesFiscaux: false
        };
      case 'CODE_INVESTISSEMENT':
        return {
          label: 'Code des Investissements',
          description: 'Entreprises éligibles au Code des Investissements : activités industrielles, services, hôtels, agro-industrie, polycliniques, etc.',
          delai: '20 jours',
          delaiJours: 20,
          icon: BriefcaseIcon,
          color: 'green',
          avantagesFiscaux: true
        };
    }
  };

  const handleSelectType = (entrepriseId: string, type: TypeAgrement) => {
    const info = getTypeAgrementInfo(type);
    setAgrementData(prev => ({
      ...prev,
      [entrepriseId]: {
        typeAgrement: type,
        delaiTraitement: info.delaiJours,
        avantagesFiscaux: info.avantagesFiscaux
      }
    }));
    setShowForm(entrepriseId);
  };

  const handleGenerateAgrement = async (entreprise: Entreprise) => {
    const data = agrementData[entreprise.id];
    
    if (!data) {
      setError('Veuillez sélectionner un type d\'agrément');
      return;
    }

    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('🔄 [AgrementManagement] Génération de l\'agrément pour:', entreprise.nom);
      console.log('📋 [AgrementManagement] Type d\'agrément:', data.typeAgrement);

      // Générer le numéro d'autorisation
      const numeroAutorisation = generateNumeroAutorisation(data.typeAgrement);
      const dateDelivrance = new Date().toISOString();

      // Mettre à jour l'entreprise avec les informations d'agrément
      const updatePayload = {
        numeroAutorisation,
        dateAutorisation: dateDelivrance,
        typeAgrement: data.typeAgrement,
        delaiTraitement: data.delaiTraitement,
        avantagesFiscaux: data.avantagesFiscaux,
        observations: data.observations
      };

      console.log('📤 [AgrementManagement] Payload de mise à jour:', updatePayload);

      // Appel API pour mettre à jour l'entreprise
      const response = await entreprisesAPI.update(entreprise.id, updatePayload);
      
      console.log('✅ [AgrementManagement] Agrément généré avec succès:', response);

      // Mettre à jour les données locales
      setAgrementData(prev => ({
        ...prev,
        [entreprise.id]: {
          ...prev[entreprise.id],
          numeroAutorisation,
          dateDelivrance
        }
      }));

      // Recharger la liste
      await loadEntreprises();
      
      setShowForm(null);
      setSelectedEntreprise(null);

    } catch (error: any) {
      console.error('❌ [AgrementManagement] Erreur lors de la génération:', error);
      setError(error.response?.data?.message || 'Erreur lors de la génération de l\'agrément');
    } finally {
      setIsProcessing(null);
    }
  };

  const generateNumeroAutorisation = (type: TypeAgrement): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    switch (type) {
      case 'BTP_TOURISME':
        return `BTP-${year}-${random}`;
      case 'ETABLISSEMENT_CLASSE':
        return `EC-${year}-${random}`;
      case 'CODE_INVESTISSEMENT':
        return `CI-${year}-${random}`;
    }
  };

  const renderTypeSelection = (entreprise: Entreprise) => {
    const types: TypeAgrement[] = ['BTP_TOURISME', 'ETABLISSEMENT_CLASSE', 'CODE_INVESTISSEMENT'];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Sélectionner le type d'autorisation d'exercice
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
                          <CheckCircleIcon className="h-4 w-4 text-primary-500" />
                          <span className="text-primary-700 font-medium">Avantages fiscaux</span>
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

  const renderAgrementForm = (entreprise: Entreprise) => {
    const data = agrementData[entreprise.id];
    if (!data) return null;

    const info = getTypeAgrementInfo(data.typeAgrement);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Formulaire d'autorisation - {info.label}
          </h3>
          <button
            onClick={() => {
              setShowForm(null);
              setAgrementData(prev => {
                const newData = { ...prev };
                delete newData[entreprise.id];
                return newData;
              });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-sky-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-800">
              <p className="font-medium mb-1">Informations sur le traitement</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Délai de traitement: <strong>{info.delai}</strong></li>
                <li>Type: {info.label}</li>
                {info.avantagesFiscaux && <li className="text-primary-700 font-medium">Avec avantages fiscaux et douaniers</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations (optionnel)
            </label>
            <textarea
              value={data.observations || ''}
              onChange={(e) => setAgrementData(prev => ({
                ...prev,
                [entreprise.id]: { ...prev[entreprise.id], observations: e.target.value }
              }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ajouter des observations ou notes particulières..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleGenerateAgrement(entreprise)}
              disabled={isProcessing === entreprise.id}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing === entreprise.id ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Générer l'autorisation
                </>
              )}
            </button>
            <button
              onClick={() => setShowForm(null)}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredEntreprises = entreprises.filter(ent => 
    ent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ent.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ent.domaineActivite && ent.domaineActivite.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Chargement des entreprises...</p>
        </div>
      </div>
    );
  }

  if (error && !isProcessing) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Gestion des Agréments</h1>
        <p className="text-sm text-slate-500">Autorisation d'exercice pour les entreprises avec domaine réglementé</p>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, référence ou domaine..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {filteredEntreprises.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {searchTerm ? 'Aucun résultat' : 'Aucune entreprise éligible'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchTerm 
              ? 'Aucune entreprise ne correspond à votre recherche.'
              : 'Aucune entreprise éligible à l\'agrément pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{entreprise.nom}</h3>
                    <p className="text-xs text-gray-500">Réf: {entreprise.reference}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {entreprise.formeJuridique}
                      </span>
                      {entreprise.domaineActivite && (
                        <span className="px-2 py-0.5 rounded text-xs bg-sky-100 text-sky-700">
                          {entreprise.domaineActivite}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {!selectedEntreprise && !showForm && (
                    <button
                      onClick={() => setSelectedEntreprise(entreprise.id)}
                      className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-2"
                    >
                      Traiter
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgrementManagement;
























