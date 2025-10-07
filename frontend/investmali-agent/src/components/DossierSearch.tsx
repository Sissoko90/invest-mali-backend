import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { agentBusinessAPI } from '../services/api';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Dossier[]>([]);

  useEffect(() => {
    loadDossiers();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      checkForDuplicates();
    } else {
      setDuplicates([]);
    }
  }, [searchTerm]);

  const loadDossiers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentBusinessAPI.listApplications({
        page: 0,
        size: 50,
        sort: 'dateCreation,desc'
      });
      
      // Mapper les données de l'API vers notre interface Dossier
      const mappedDossiers = response.data.content?.map((app: any) => ({
        id: app.id,
        reference: app.reference || `REF-${app.id}`,
        nom: app.nom || app.businessName || 'Nom non défini',
        sigle: app.sigle || app.businessAcronym,
        statut: app.statutCreation || app.status || 'NOUVEAU',
        dateCreation: app.dateCreation || app.createdAt || new Date().toISOString(),
        division: app.division,
        antenne: app.antenne,
        documentsManquants: app.documentsManquants || [],
        personneId: app.personneId,
        entrepriseId: app.entrepriseId || app.id
      })) || [];
      
      setDossiers(mappedDossiers);
    } catch (err: any) {
      console.error('Erreur lors du chargement des dossiers:', err);
      setError('Erreur lors du chargement des dossiers');
    } finally {
      setIsLoading(false);
    }
  };

  const checkForDuplicates = () => {
    const term = searchTerm.toLowerCase();
    const potentialDuplicates = dossiers.filter(dossier => 
      dossier.nom.toLowerCase().includes(term) ||
      dossier.sigle?.toLowerCase().includes(term) ||
      dossier.reference.toLowerCase().includes(term)
    );
    setDuplicates(potentialDuplicates);
  };

  const filteredDossiers = dossiers.filter(dossier => {
    const matchesSearch = !searchTerm || 
      dossier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.sigle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || dossier.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOUVEAU':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'EN_COURS':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'INCOMPLET':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'VALIDE':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
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

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, sigle ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="NOUVEAU">Nouveau</option>
            <option value="EN_COURS">En cours</option>
            <option value="INCOMPLET">Incomplet</option>
            <option value="VALIDE">Validé</option>
            <option value="REJETE">Rejeté</option>
          </select>
        </div>
      </div>

      {/* Alerte de déduplication */}
      {duplicates.length > 0 && searchTerm.length >= 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Dossiers similaires trouvés ({duplicates.length})
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Vérifiez si un dossier existe déjà avant d'en créer un nouveau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Résultats de recherche */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement des dossiers...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredDossiers.length === 0 ? (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Aucun dossier trouvé pour cette recherche' : 'Aucun dossier disponible'}
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
                        <button
                          onClick={() => onDossierSelected(dossier)}
                          className="text-mali-emerald hover:text-mali-emerald-dark"
                        >
                          Sélectionner
                        </button>
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
