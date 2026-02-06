import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAgentStats } from '../hooks/useAgentStats';
import { agentBusinessAPI } from '../services/api';
import AgentManagementService from '../services/agentManagementApi';
import AgentManagement from '../components/AgentManagement';
import SimpleApplicationsList from '../components/SimpleApplicationsList';
import ApplicationsTable from '../components/ApplicationsTable';
import BusinessCreationModal from '../components/BusinessCreationModal';
import SuperAdminDashboard from '../components/SuperAdminDashboard';
import DossierWorkflow from '../components/DossierWorkflow';
import AgrementManagement from '../components/AgrementManagement';
import { LayoutDashboard, Users, Building2, BarChart3, FolderOpen, FileText, LogOut, Menu, X } from 'lucide-react';
import apiLogo from '../assets/logos/api-logo.png';

const AgentDashboard: React.FC = () => {
  const { agent, logout } = useAgentAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useAgentStats();
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalAgents: 0,
    totalApplications: 0,
    approvedApplications: 0,
    pendingApplications: 0,
    rejectedApplications: 0
  });
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // S'assurer que allApplications est toujours un tableau
  const safeApplications = Array.isArray(allApplications) ? allApplications : [];

  // Charger les statistiques du dashboard Super Admin
  const loadDashboardStats = async () => {
    if (!agent || agent.role !== 'SUPER_ADMIN') return;
    
    try {
      setLoading(true);
      
      // Vérifier le token d'authentification
      const token = localStorage.getItem('investmali_agent_token');
      if (!token) {
        alert('Session expirée. Veuillez vous reconnecter.');
        logout();
        return;
      }
      
      
      // Récupérer les statistiques depuis l'API en parallèle
      const [statsResponse, applicationsResponse, agentsResponse] = await Promise.allSettled([
        agentBusinessAPI.getStats(),
        agentBusinessAPI.listApplications({ page: 1, limit: 1000 }),
        AgentManagementService.listAgents({ page: 0, size: 1000 })
      ]);
      
      
      // Traiter les applications
      let applications: any[] = [];
      if (applicationsResponse.status === 'fulfilled') {
        const appData = applicationsResponse.value.data;
        applications = appData?.content || appData?.applications || appData || [];
      }
      
      // Traiter les agents
      let totalAgents = 0;
      if (agentsResponse.status === 'fulfilled') {
        const agentsData = agentsResponse.value;
        totalAgents = agentsData.totalElements || agentsData.content?.length || 0;
      }
      
      // Calculer les statistiques des applications
      const totalApplications = applications.length;
      const approvedApplications = applications.filter((app: any) => 
        app.status === 'approved' || app.statutCreation === 'VALIDEE'
      ).length;
      const pendingApplications = applications.filter((app: any) => 
        app.status === 'pending' || app.statutCreation === 'EN_COURS' || app.statutCreation === 'EN_ATTENTE'
      ).length;
      
      // Utiliser les statistiques de l'API si disponibles, sinon les calculées
      let finalStats = {
        totalAgents,
        totalApplications,
        approvedApplications,
        pendingApplications,
        rejectedApplications: 0
      };
      
      if (statsResponse.status === 'fulfilled' && statsResponse.value.data) {
        const apiStats = statsResponse.value.data;
        finalStats = {
          totalAgents: apiStats.totalAgents || totalAgents,
          totalApplications: apiStats.totalApplications || totalApplications,
          approvedApplications: apiStats.approvedApplications || approvedApplications,
          pendingApplications: apiStats.pendingApplications || pendingApplications,
          rejectedApplications: apiStats.rejectedApplications || 0
        };
      }
      
      setDashboardStats(finalStats);
      setAllApplications(applications);
      
    } catch (error) {
      
      // En cas d'erreur, utiliser des données de démonstration avec antennes
      const fallbackStats = {
        totalAgents: 7,
        totalApplications: 5,
        approvedApplications: 2,
        pendingApplications: 3,
        rejectedApplications: 0,
        agentsByAntenne: {
          'Bamako Centre': 3,
          'Kayes': 2,
          'Sikasso': 1,
          'Ségou': 1
        }
      };
      
      setDashboardStats(fallbackStats);
      
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    if (agent && agent.role === 'SUPER_ADMIN') {
      loadDashboardStats();
    }
  }, [agent]);

  // Si c'est un Super Admin, afficher la nouvelle interface
  if (agent && agent.role === 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex">
        
        {/* Sidebar - pousse le contenu au lieu de le superposer - Masquée dans la section dossier */}
        <div className={`bg-sky-50 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${
          activeSection === 'dossier' ? 'w-0' : (sidebarOpen ? 'w-56' : 'w-0')
        } overflow-hidden flex-shrink-0`}>
          
          {/* Header sidebar avec logo et bouton fermer - logo caché quand sidebar fermé */}
          <div className="p-4 flex items-center justify-between border-b border-sky-100">
            <div className={`flex items-center space-x-2 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              <img src={apiLogo} alt="API-MALI" className="w-10 h-10" />
              <span className="font-bold text-lg text-sky-800">API-MALI</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-sky-100 text-sky-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Profil utilisateur */}
          <div className="p-6 flex flex-col items-center border-b border-sky-100">
            <div className="w-16 h-16 bg-sky-200 rounded-full flex items-center justify-center mb-3">
              <span className="text-sky-700 font-bold text-xl">
                {agent.firstName?.charAt(0)}{agent.lastName?.charAt(0)}
              </span>
            </div>
            <p className="text-sky-800 font-semibold text-lg">{agent.firstName} {agent.lastName}</p>
            <p className="text-sky-600 text-base">{agent.email || 'admin@investmali.ml'}</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 py-4">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center space-x-3 px-6 py-4 text-lg font-semibold transition-colors ${
                activeSection === 'dashboard' 
                  ? 'bg-sky-100 text-sky-800 border-l-4 border-sky-600' 
                  : 'text-sky-700 hover:bg-sky-100'
              }`}
            >
              <LayoutDashboard className="w-7 h-7" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveSection('agents')}
              className={`w-full flex items-center space-x-3 px-6 py-4 text-lg font-semibold transition-colors ${
                activeSection === 'agents' 
                  ? 'bg-sky-100 text-sky-800 border-l-4 border-sky-600' 
                  : 'text-sky-700 hover:bg-sky-100'
              }`}
            >
              <Users className="w-7 h-7" />
              <span>Agents</span>
            </button>
            
            <button
              onClick={() => setActiveSection('entreprises')}
              className={`w-full flex items-center space-x-3 px-6 py-4 text-lg font-semibold transition-colors ${
                activeSection === 'entreprises' 
                  ? 'bg-sky-100 text-sky-800 border-l-4 border-sky-600' 
                  : 'text-sky-700 hover:bg-sky-100'
              }`}
            >
              <Building2 className="w-7 h-7" />
              <span>Entreprises</span>
            </button>
            
            <button
              onClick={() => setActiveSection('rapports')}
              className={`w-full flex items-center space-x-3 px-6 py-4 text-lg font-semibold transition-colors ${
                activeSection === 'rapports' 
                  ? 'bg-sky-100 text-sky-800 border-l-4 border-sky-600' 
                  : 'text-sky-700 hover:bg-sky-100'
              }`}
            >
              <BarChart3 className="w-7 h-7" />
              <span>Rapports</span>
            </button>
            
            <button
              onClick={() => setActiveSection('dossier')}
              className={`w-full flex items-center space-x-3 px-6 py-4 text-lg font-semibold transition-colors ${
                activeSection === 'dossier' 
                  ? 'bg-sky-100 text-sky-800 border-l-4 border-sky-600' 
                  : 'text-sky-700 hover:bg-sky-100'
              }`}
            >
              <FolderOpen className="w-7 h-7" />
              <span>Dossiers</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/agrement-workflow'}
              className="w-full flex items-center space-x-3 px-6 py-4 text-lg font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <FileText className="w-7 h-7" />
              <span>Agréments</span>
            </button>
          </nav>
          
          {/* Logout */}
          <div className="p-4 border-t border-sky-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-6 py-4 text-lg font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-7 h-7" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-sky-600 shadow-lg h-20 flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              {/* Bouton menu pour toggle le sidebar */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/20 text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <img src={apiLogo} alt="API-MALI" className="w-14 h-14 drop-shadow-lg" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  API-MALI
                </h1>
                <p className="text-white/90 text-lg font-medium">Bienvenue, {agent.firstName} !</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Bouton Dashboard dans le navbar */}
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  activeSection === 'dashboard' 
                    ? 'bg-white text-sky-600' 
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <span className="text-lg font-medium text-white/90">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </header>
          
          {/* Content */}
          <main className="flex-1 p-12 overflow-y-auto scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                {/* Overview Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                    <button
                      onClick={loadDashboardStats}
                      disabled={loading}
                      className="px-6 py-3 bg-sky-600 text-white text-lg font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Chargement...' : 'Actualiser'}
                    </button>
                  </div>
                  
                  {statsError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-lg">
                        Erreur: {statsError}
                      </p>
                    </div>
                  )}
                
                  {/* Cartes statistiques - Première ligne */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Carte Agents */}
                    <div className="bg-sky-50 rounded-lg border border-sky-100 p-6 flex items-center space-x-4">
                      <div className="w-14 h-14 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Users className="w-7 h-7 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold text-gray-800">
                          {loading ? '...' : dashboardStats.totalAgents}
                        </p>
                        <p className="text-lg font-semibold text-gray-600">Total Agents</p>
                      </div>
                    </div>
                    
                    {/* Carte Approuvées */}
                    <div className="bg-green-50 rounded-lg border border-green-100 p-6 flex items-center space-x-4">
                      <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-green-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold text-gray-800">
                          {loading ? '...' : dashboardStats.approvedApplications}
                        </p>
                        <p className="text-lg font-semibold text-gray-600">Approuvées</p>
                      </div>
                    </div>
                    
                    {/* Carte En cours */}
                    <div className="bg-yellow-50 rounded-lg border border-yellow-100 p-6 flex items-center space-x-4">
                      <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-7 h-7 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold text-gray-800">
                          {loading ? '...' : dashboardStats.pendingApplications}
                        </p>
                        <p className="text-lg font-semibold text-gray-600">En cours</p>
                      </div>
                    </div>
                    
                    {/* Carte Total */}
                    <div className="bg-purple-50 rounded-lg border border-purple-100 p-6 flex items-center space-x-4">
                      <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-7 h-7 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold text-gray-800">
                          {loading ? '...' : dashboardStats.totalApplications}
                        </p>
                        <p className="text-lg font-semibold text-gray-600">Total</p>
                      </div>
                    </div>
                  </div>

                  {/* Deuxième ligne - Entreprises rejetées */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="bg-red-50 rounded-lg border border-red-100 p-6 flex items-center space-x-4">
                      <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-4xl font-bold text-gray-800">
                          {loading ? '...' : dashboardStats.rejectedApplications}
                        </p>
                        <p className="text-lg font-semibold text-gray-600">Rejetées</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Section Gestion des Agents */}
            {activeSection === 'agents' && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <AgentManagement />
              </div>
            )}
            
            {/* Section Entreprises */}
            {activeSection === 'entreprises' && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <SimpleApplicationsList />
              </div>
            )}
            
            {/* Section Rapports */}
            {activeSection === 'rapports' && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <SuperAdminDashboard />
              </div>
            )}
            
            {/* Section Dossiers */}
            {activeSection === 'dossier' && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <DossierWorkflow />
              </div>
            )}
            
            {/* Section Actualités */}
            {activeSection === 'actualites' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Actualités</h2>
                <p className="text-gray-500">Section actualités à venir...</p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Code pour les autres types d'agents (non Super Admin) - Interface originale
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interface Agent Standard</h2>
          <p className="text-gray-600">Interface pour les agents non Super Admin</p>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
























