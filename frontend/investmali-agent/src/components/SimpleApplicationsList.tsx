import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/apiUrl';

interface Application {
  id: string;
  nom?: string;
  creation?: string;
  companyName?: string;
  company_name?: string;
  nomEntreprise?: string;
  reference: string;
  status?: string;
  statutCreation?: string;
  submittedAt?: string;
  submitted_at?: string;
  dateCreation?: string;
  created_at?: string;
  typeEntreprise?: string;
  formeJuridique?: string;
  domaineActivite?: string;
  domaineActiviteNr?: string;
  domaine_activite?: string;
  domaine_activite_nr?: string;
  divisionCode?: string;
  divisionNom?: string;
  localisation?: string;
}

const SimpleApplicationsList: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    nom: '',
    localisation: '',
    status: '',
    reference: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleEntrepriseClick = (entrepriseId: string) => {
    navigate(`/entreprise/${entrepriseId}`);
  };

  const getCompanyName = (app: Application): string => {
    return app.nom || app.companyName || app.company_name || app.nomEntreprise || 'Nom non disponible';
  };

  const getStatus = (app: Application): string => {
    return app.status || app.statutCreation || 'Statut inconnu';
  };

  const getSubmittedDate = (app: Application): string => {
    const dateStr = app.creation || app.created_at || app.dateCreation || app.submittedAt || app.submitted_at;
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  const getLocation = (app: Application): string => {
    return app.localisation || app.divisionNom || app.divisionCode || '-';
  };

  const applyFilters = (apps: Application[]) => {
    return apps.filter(app => {
      const nom = getCompanyName(app).toLowerCase();
      const localisation = getLocation(app).toLowerCase();
      const status = getStatus(app).toLowerCase();
      const reference = (app.reference || '').toLowerCase();
      return (
        nom.includes(filters.nom.toLowerCase()) &&
        localisation.includes(filters.localisation.toLowerCase()) &&
        status.includes(filters.status.toLowerCase()) &&
        reference.includes(filters.reference.toLowerCase())
      );
    });
  };

  useEffect(() => {
    const filtered = applyFilters(applications);
    setFilteredApplications(filtered);
    setCurrentPage(1);
  }, [applications, filters]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const resetFilters = () => {
    setFilters({ nom: '', localisation: '', status: '', reference: '' });
  };

  useEffect(() => {
    const loadApplications = async () => {
      try {
        let token: string | null = null;
        try {
          const agentData = JSON.parse(localStorage.getItem('agent') || '{}');
          token = localStorage.getItem('authToken') || localStorage.getItem('token') || agentData?.token || null;
        } catch (e) {
          console.error('Erreur parsing localStorage:', e);
        }
        
        const endpoint = `${getApiBaseUrl()}/entreprises?page=0&size=1000`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        let finalApplicationsData = [];
        if (responseData.content && Array.isArray(responseData.content)) {
          finalApplicationsData = responseData.content;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          finalApplicationsData = responseData.data;
        } else if (Array.isArray(responseData)) {
          finalApplicationsData = responseData;
        }
        
        setApplications(finalApplicationsData);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e5987] mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm">Chargement des entreprises...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-[#1e5987] to-[#2d6aa0] bg-clip-text text-transparent">Liste des Entreprises</h1>
          <p className="text-sm text-slate-500">
            {filteredApplications.length} entreprise{filteredApplications.length > 1 ? 's' : ''} trouvée{filteredApplications.length > 1 ? 's' : ''}
            {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
              showFilters ? 'bg-gradient-to-r from-[#1e5987] to-[#2d6aa0] text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Filtres
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-[#1e5987] to-[#2d6aa0] text-white text-sm font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black bg-gradient-to-r from-[#1e5987] to-[#2d6aa0] bg-clip-text text-transparent">Filtres</h3>
            <button onClick={resetFilters} className="text-sm text-[#1e5987] hover:text-[#2d6aa0] font-semibold">
              Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1e5987] mb-2">🏢 Nom</label>
              <input
                type="text"
                value={filters.nom}
                onChange={(e) => setFilters({...filters, nom: e.target.value})}
                placeholder="Rechercher..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1e5987] focus:border-[#1e5987] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1e5987] mb-2">🔖 Référence</label>
              <input
                type="text"
                value={filters.reference}
                onChange={(e) => setFilters({...filters, reference: e.target.value})}
                placeholder="CE-2025-..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1e5987] focus:border-[#1e5987] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1e5987] mb-2">📍 Localisation</label>
              <input
                type="text"
                value={filters.localisation}
                onChange={(e) => setFilters({...filters, localisation: e.target.value})}
                placeholder="Bamako..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1e5987] focus:border-[#1e5987] transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1e5987] mb-2">📊 Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1e5987] focus:border-[#1e5987] transition-all duration-300"
              >
                <option value="">Tous</option>
                <option value="approved">Approuvé</option>
                <option value="in_review">En cours</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {applications.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 text-center">
          <p className="text-gray-500 text-lg">🏢 Aucune entreprise trouvée</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 text-center">
          <p className="text-gray-500 mb-4 text-lg">🔍 Aucun résultat pour ces filtres</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gradient-to-r from-[#1e5987] to-[#2d6aa0] text-white text-sm font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-[#1e5987]/10 to-[#2d6aa0]/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#1e5987] uppercase">🏢 Entreprise</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#1e5987] uppercase">🔖 Référence</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#1e5987] uppercase">🏭 Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#1e5987] uppercase">📍 Localisation</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#1e5987] uppercase">📊 Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#1e5987] uppercase">📅 Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApplications.map((app) => (
                    <tr 
                      key={app.id} 
                      onClick={() => handleEntrepriseClick(app.id)}
                      className="hover:bg-gradient-to-r hover:from-[#1e5987]/5 hover:to-[#2d6aa0]/5 cursor-pointer transition-all duration-300"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-800">{getCompanyName(app)}</div>
                        <div className="text-xs text-slate-500">{app.formeJuridique || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{app.reference || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{app.typeEntreprise || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{getLocation(app)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          getStatus(app) === 'VALIDEE' || getStatus(app) === 'approved' ? 'bg-green-100 text-green-800' :
                          getStatus(app) === 'REJETEE' || getStatus(app) === 'rejected' ? 'bg-red-100 text-red-800' :
                          getStatus(app) === 'EN_COURS' || getStatus(app) === 'pending' || getStatus(app) === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatus(app)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500">{getSubmittedDate(app)}</span>
                      </td>
                    </tr>
                    
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 px-6 py-4">
              <p className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(endIndex, filteredApplications.length)} sur {filteredApplications.length}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm rounded-xl font-medium transition-all duration-300 ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#1e5987] to-[#2d6aa0] text-white hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SimpleApplicationsList;
