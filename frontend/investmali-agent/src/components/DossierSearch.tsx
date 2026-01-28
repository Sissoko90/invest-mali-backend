import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { agentBusinessAPI, entreprisesAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAgentAuth } from '../contexts/AgentAuthContext';

interface Dossier {
  id: string;
  reference: string;
  nom: string;
  sigle?: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'INCOMPLET' | 'VALIDE' | 'REJETE';
  dateCreation: string;
  division?: string;
  antenne?: string;
  documentsManquants: string[];
  personneId?: string;
  entrepriseId?: string;
}

interface DossierSearchProps {
  onDossierSelected: (dossier: Dossier) => void;
}

const DossierSearch: React.FC<DossierSearchProps> = ({ onDossierSelected }) => {
  const { isDarkMode } = useTheme();
  const { agent } = useAgentAuth();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Dossier[]>([]);
  
  // Nouveaux filtres avancés
  const [filters, setFilters] = useState({
    nom: '',
    reference: '',
    domaineActivite: '',
    localisation: '',
    statut: '',
    typeEntreprise: '',
    formeJuridique: ''
  });

  useEffect(() => {
    loadDossiers();
  }, []);

  useEffect(() => {
    if (filters.nom.length >= 2) {
      checkForDuplicates();
    } else {
      setDuplicates([]);
    }
  }, [filters.nom, dossiers]);

  const loadDossiers = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 DossierSearch - Chargement des dossiers (même logique que AccueilStep)...');
    console.log('👤 Agent actuel:', agent);
    console.log('🏢 Antenne de l\'agent:', agent?.antenne);
    
    try {
      let response;
      let allEntreprises: any[] = [];
      
      try {
        // Essayer d'abord /unassigned (même logique que AccueilStep)
        console.log('🔄 Tentative /unassigned...');
        response = await entreprisesAPI.unassigned({
          etape: 'ACCUEIL',
          page: 0,
          size: 100,
          sort: 'creation,desc'
        });
        
        const pageData = response.data;
        allEntreprises = pageData?.content || pageData?.data || pageData?.rows || pageData || [];
        console.log('✅ /unassigned fonctionne - Entreprises reçues:', allEntreprises.length);
        
      } catch (error) {
        console.warn('⚠️ /unassigned échoue, utilisation de /entreprises avec filtrage...');
        
        // Fallback sur /entreprises avec filtrage (même logique que AccueilStep)
        response = await entreprisesAPI.list({
          page: 0,
          size: 100,
          sort: 'creation,desc'
        });
        
        const pageData = response.data;
        const toutes = pageData?.content || pageData?.data || pageData?.rows || pageData || [];
        
        console.log('📊 Total entreprises dans /entreprises:', toutes.length);
        
        // Filtrage STRICT pour éliminer les entreprises assignées (même logique que AccueilStep)
        allEntreprises = toutes.filter((entreprise: any) => {
          const etapeValidation = entreprise.etapeValidation;
          const assignedTo = entreprise.assignedTo;
          
          // Condition 1: Être à l'étape ACCUEIL ET ne pas être validée
          const isAccueilStep = etapeValidation === 'ACCUEIL' || !etapeValidation;
          const statutCreation = entreprise.statutCreation;
          const isNotValidated = statutCreation !== 'VALIDEE';
          
          // Condition 2: NE PAS être assignée (ULTRA STRICT)
          let isAssigned = false;
          
          if (assignedTo !== null && assignedTo !== undefined) {
            isAssigned = true;
          } else if (entreprise.assigned_to !== null && entreprise.assigned_to !== undefined) {
            isAssigned = true;
          } else if (entreprise.assignedToId) {
            isAssigned = true;
          } else if (entreprise.agent || entreprise.agentId) {
            isAssigned = true;
          }
          
          const isNotAssigned = !isAssigned;
          const inclure = isAccueilStep && isNotAssigned && isNotValidated;
          
          return inclure;
        });
        
        console.log(`✅ Filtrage terminé: ${allEntreprises.length} entreprises non assignées sur ${toutes.length} total`);
      }
      
      console.log(`📊 Entreprises finales à traiter: ${allEntreprises.length}`);
      
      // Mapper vers le format Dossier
      const mappedDossiers = allEntreprises.map((entreprise: any) => {
        const gerant = entreprise.membres?.find((m: any) => m.role === 'GERANT' || m.role === 'PROMOTEUR' || m.entrepriseRole === 'GERANT' || m.entrepriseRole === 'PROMOTEUR');
        const gerantPersonne = gerant?.personne || gerant;
        
        return {
          id: entreprise.id,
          reference: entreprise.reference || `REF-${entreprise.id}`,
          nom: entreprise.nom || entreprise.businessName || 'Nom non défini',
          sigle: entreprise.sigle || entreprise.businessAcronym,
          statut: mapStatutCreation(entreprise.statutCreation),
          dateCreation: entreprise.dateCreation || entreprise.createdAt || new Date().toISOString(),
          division: entreprise.division_id || entreprise.division,
          antenne: entreprise.antenne || entreprise.branch,
          documentsManquants: entreprise.documentsManquants || [],
          personneId: gerantPersonne?.id,
          entrepriseId: entreprise.id
        };
      });
      
      console.log('📋 Dossiers mappés (total):', mappedDossiers.length);
      console.log('📋 Échantillon des dossiers:', mappedDossiers.slice(0, 3));
      
      // Pas de filtrage par antenne ici car les entreprises non assignées sont pour tous les agents
      // L'agent peut s'assigner n'importe quelle entreprise non assignée
      setDossiers(mappedDossiers);
      
      if (mappedDossiers.length === 0) {
        console.log('ℹ️ Aucune entreprise non assignée trouvée');
        console.log('   - Toutes les entreprises sont soit assignées, soit validées');
        console.log('   - Ou il n\'y a pas d\'entreprises dans le système');
      }
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des dossiers:', err);
      setError(`Erreur lors du chargement des dossiers: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction utilitaire pour mapper les statuts
  const mapStatutCreation = (statutCreation: string): 'NOUVEAU' | 'EN_COURS' | 'INCOMPLET' | 'VALIDE' | 'REJETE' => {
    switch (statutCreation) {
      case 'VALIDEE': return 'VALIDE';
      case 'REFUSEE': return 'REJETE';
      case 'EN_ATTENTE': return 'INCOMPLET';
      case 'EN_COURS': return 'EN_COURS';
      default: return 'NOUVEAU';
    }
  };

  const checkForDuplicates = () => {
    const term = filters.nom.toLowerCase();
    const potentialDuplicates = dossiers.filter(dossier => 
      dossier.nom.toLowerCase().includes(term) ||
      dossier.sigle?.toLowerCase().includes(term) ||
      dossier.reference.toLowerCase().includes(term)
    );
    setDuplicates(potentialDuplicates);
  };

  const filteredDossiers = dossiers.filter(dossier => {
    // Filtres avancés uniquement
    const matchesNom = !filters.nom || 
      dossier.nom.toLowerCase().includes(filters.nom.toLowerCase()) ||
      dossier.sigle?.toLowerCase().includes(filters.nom.toLowerCase());
    
    const matchesReference = !filters.reference || 
      dossier.reference.toLowerCase().includes(filters.reference.toLowerCase());
    
    const matchesLocalisation = !filters.localisation || 
      (dossier.division && dossier.division.toLowerCase().includes(filters.localisation.toLowerCase())) ||
      (dossier.antenne && dossier.antenne.toLowerCase().includes(filters.localisation.toLowerCase()));
    
    const matchesStatut = !filters.statut || dossier.statut === filters.statut;
    
    // Note: domaineActivite n'est pas encore dans l'interface Dossier
    // On peut l'ajouter plus tard quand les données seront disponibles
    const matchesDomaineActivite = !filters.domaineActivite; // Toujours vrai pour l'instant
    
    return matchesNom && matchesReference && matchesLocalisation && 
           matchesStatut && matchesDomaineActivite;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOUVEAU':
        return <ClockIcon className="h-4 w-4 text-primary-500" />;
      case 'EN_COURS':
        return <ClockIcon className="h-4 w-4 text-primary-500" />;
      case 'INCOMPLET':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'VALIDE':
        return <CheckCircleIcon className="h-4 w-4 text-primary-500" />;
      case 'REJETE':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return 'Nouveau';
      case 'EN_COURS': return 'En cours';
      case 'INCOMPLET': return 'Incomplet';
      case 'VALIDE': return 'Validé';
      case 'REJETE': return 'Rejeté';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const resetFilters = () => {
    setFilters({
      nom: '',
      reference: '',
      domaineActivite: '',
      localisation: '',
      statut: '',
      typeEntreprise: '',
      formeJuridique: ''
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAssignToMe = async (dossier: Dossier) => {
    if (!agent?.id) {
      alert('Erreur: Agent non connecté');
      return;
    }

    try {
      console.log(`🔄 Assignation de l'entreprise "${dossier.nom}" à l'agent ${agent.email}...`);
      
      // Utiliser l'API d'assignation
      await entreprisesAPI.assign(dossier.id, agent.id.toString());
      
      console.log('✅ Assignation réussie !');
      alert(`✅ Entreprise "${dossier.nom}" assignée avec succès !\nVous pouvez maintenant la traiter dans vos demandes assignées.`);
      
      // Recharger la liste pour supprimer l'entreprise assignée
      loadDossiers();
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'assignation:', error);
      alert(`❌ Erreur lors de l'assignation: ${error.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres de recherche */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Filtres de recherche</h3>
          <button 
            onClick={resetFilters}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded-lg text-gray-700 transition-colors"
          >
            Réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.nom}
              onChange={(e) => handleFilterChange('nom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Référence</label>
            <input
              type="text"
              placeholder="CE-2025-..."
              value={filters.reference}
              onChange={(e) => handleFilterChange('reference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Localisation</label>
            <input
              type="text"
              placeholder="Bamako..."
              value={filters.localisation}
              onChange={(e) => handleFilterChange('localisation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
            <select
              value={filters.statut}
              onChange={(e) => handleFilterChange('statut', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">Tous</option>
              <option value="NOUVEAU">Nouveau</option>
              <option value="EN_COURS">En cours</option>
              <option value="INCOMPLET">Incomplet</option>
              <option value="VALIDE">Validé</option>
              <option value="REJETE">Rejeté</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerte de déduplication */}
      {duplicates.length > 0 && filters.nom.length >= 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Attention:</strong> {duplicates.length} dossier(s) similaire(s) trouvé(s). Vérifiez avant de créer un nouveau.
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Résultats */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <p className="mt-2 text-gray-500 text-sm">Chargement des dossiers...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredDossiers.length === 0 ? (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {Object.values(filters).some(f => f !== '') ? 'Aucun dossier trouvé' : 'Aucun dossier disponible'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.values(filters).some(f => f !== '')
                  ? 'Modifiez vos filtres de recherche.'
                  : 'Aucun dossier dans le système.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entreprise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date création
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDossiers.map((dossier) => (
                    <tr key={dossier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dossier.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{dossier.nom}</div>
                          {dossier.sigle && (
                            <div className="text-sm text-gray-500">{dossier.sigle}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(dossier.statut)}
                          <span className="ml-2 text-sm text-gray-900">
                            {getStatusText(dossier.statut)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(dossier.dateCreation)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onDossierSelected(dossier)}
                            className="px-2 py-1 text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                          >
                            Détails
                          </button>
                          <button
                            onClick={() => handleAssignToMe(dossier)}
                            className="px-2 py-1 text-xs font-medium rounded text-white bg-sky-600 hover:bg-sky-700"
                          >
                            S'assigner
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DossierSearch;
























