import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import AnimatedBackground from './AnimatedBackground';

interface BusinessApplication {
  id: string;
  companyName: string;
  legalForm: string;
  applicantName: string;
  applicantEmail: string;
  submissionDate: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'requires_info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  documents: {
    identityCard: boolean;
    proofOfAddress: boolean;
    businessPlan: boolean;
    statutes: boolean;
    bankStatement: boolean;
  };
  steps: {
    id: string;
    name: string;
    status: 'completed' | 'in_progress' | 'pending' | 'rejected';
    completedAt?: string;
    notes?: string;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface CreationStats {
  today: number;
  thisMonth: number;
  semester: number;
  thisYear: number;
}

const AgentDashboard: React.FC = () => {
  const { agent, logout } = useAgentAuth();
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<BusinessApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<BusinessApplication | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedToMe: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'reports'>('dashboard');
  const [creationStats, setCreationStats] = useState<CreationStats>({
    today: 0,
    thisMonth: 0,
    semester: 0,
    thisYear: 0
  });

  // Charger les demandes depuis localStorage et créer des données de démonstration
  useEffect(() => {
    const userApplications = JSON.parse(localStorage.getItem('user_applications') || '[]');
    
    // Convertir les applications utilisateur en format agent avec statuts et étapes
    const agentApplications: BusinessApplication[] = userApplications.map((app: any, index: number) => ({
      id: app.id || `app_${index + 1}`,
      companyName: app.companyName || 'Entreprise non renseinger',
      legalForm: app.legalForm || 'SARL',
      applicantName: `${app.representative?.firstName || 'Prénom'} ${app.representative?.lastName || 'Nom'}`,
      applicantEmail: app.representative?.email || 'email@example.com',
      submissionDate: app.submissionDate || new Date().toISOString(),
      status: ['pending', 'in_review', 'approved'][Math.floor(Math.random() * 3)] as any,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      assignedAgent: Math.random() > 0.5 ? agent?.id : undefined,
      documents: {
        identityCard: Math.random() > 0.2,
        proofOfAddress: Math.random() > 0.3,
        businessPlan: Math.random() > 0.4,
        statutes: Math.random() > 0.3,
        bankStatement: Math.random() > 0.5
      },
      steps: [
        {
          id: 'doc_verification',
          name: 'Vérification des documents',
          status: Math.random() > 0.5 ? 'completed' : 'in_progress',
          completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined
        },
        {
          id: 'legal_review',
          name: 'Examen juridique',
          status: Math.random() > 0.7 ? 'completed' : 'pending',
          completedAt: Math.random() > 0.7 ? new Date().toISOString() : undefined
        },
        {
          id: 'final_approval',
          name: 'Approbation finale',
          status: 'pending'
        }
      ],
      totalAmount: app.totalAmount || 50000,
      paymentStatus: Math.random() > 0.3 ? 'paid' : 'pending'
    }));

    // Ajouter quelques demandes de démonstration supplémentaires
    const demoApplications: BusinessApplication[] = [
      {
        id: 'demo_001',
        companyName: 'TechMali Solutions',
        legalForm: 'SARL',
        applicantName: 'Amadou Diallo',
        applicantEmail: 'amadou.diallo@email.com',
        submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        priority: 'high',
        assignedAgent: agent?.id,
        documents: {
          identityCard: true,
          proofOfAddress: true,
          businessPlan: false,
          statutes: true,
          bankStatement: true
        },
        steps: [
          {
            id: 'doc_verification',
            name: 'Vérification des documents',
            status: 'in_progress'
          },
          {
            id: 'legal_review',
            name: 'Examen juridique',
            status: 'pending'
          },
          {
            id: 'final_approval',
            name: 'Approbation finale',
            status: 'pending'
          }
        ],
        totalAmount: 75000,
        paymentStatus: 'paid'
      },
      {
        id: 'demo_002',
        companyName: 'Agro Business Mali',
        legalForm: 'SA',
        applicantName: 'Fatoumata Keita',
        applicantEmail: 'fatoumata.keita@email.com',
        submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_review',
        priority: 'medium',
        documents: {
          identityCard: true,
          proofOfAddress: true,
          businessPlan: true,
          statutes: true,
          bankStatement: false
        },
        steps: [
          {
            id: 'doc_verification',
            name: 'Vérification des documents',
            status: 'completed',
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'legal_review',
            name: 'Examen juridique',
            status: 'in_progress'
          },
          {
            id: 'final_approval',
            name: 'Approbation finale',
            status: 'pending'
          }
        ],
        totalAmount: 100000,
        paymentStatus: 'paid'
      }
    ];

    const allApplications = [...agentApplications, ...demoApplications];
    setApplications(allApplications);
    setFilteredApplications(allApplications);
  }, [agent?.id]);

  // Filtrer les applications
  useEffect(() => {
    let filtered = applications;

    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(app => app.priority === filters.priority);
    }

    if (filters.assignedToMe) {
      filtered = filtered.filter(app => app.assignedAgent === agent?.id);
    }

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [applications, filters, searchTerm, agent?.id]);

  // Calculer les statistiques à partir des données locales
  const calculateLocalStats = () => {
    const userApplications = JSON.parse(localStorage.getItem('user_applications') || '[]');
    console.log('📊 [STATS LOCAL] Applications trouvées:', userApplications.length);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    console.log('📊 [STATS LOCAL] Dates de référence:');
    console.log('  - Aujourd\'hui:', today.toISOString());
    console.log('  - Ce mois:', thisMonth.toISOString());
    console.log('  - Semestre:', sixMonthsAgo.toISOString());
    console.log('  - Cette année:', thisYear.toISOString());

    let todayCount = 0;
    let monthCount = 0;
    let semesterCount = 0;
    let yearCount = 0;

    userApplications.forEach((app: any, index: number) => {
      if (app.submissionDate) {
        const submissionDate = new Date(app.submissionDate);
        console.log(`📊 [STATS LOCAL] App ${index + 1}: ${app.companyName || 'Sans nom'} - ${submissionDate.toISOString()}`);
        
        if (submissionDate >= today) {
          todayCount++;
          console.log('  ✅ Comptée pour aujourd\'hui');
        }
        if (submissionDate >= thisMonth) {
          monthCount++;
          console.log('  ✅ Comptée pour ce mois');
        }
        if (submissionDate >= sixMonthsAgo) {
          semesterCount++;
          console.log('  ✅ Comptée pour le semestre');
        }
        if (submissionDate >= thisYear) {
          yearCount++;
          console.log('  ✅ Comptée pour cette année');
        }
      } else {
        console.log(`📊 [STATS LOCAL] App ${index + 1}: ${app.companyName || 'Sans nom'} - PAS DE DATE`);
      }
    });

    const stats = {
      today: todayCount,
      thisMonth: monthCount,
      semester: semesterCount,
      thisYear: yearCount
    };

    console.log('📊 [STATS LOCAL] Résultats calculés:', stats);
    return stats;
  };

  // Récupérer les statistiques de création
  const fetchCreationStats = async () => {
    try {
      const token = localStorage.getItem('agent_token');
      
      // Toujours calculer les stats locales d'abord
      const localStats = calculateLocalStats();
      
      if (!token) {
        setCreationStats(localStats);
        return;
      }

      const response = await fetch('/api/entreprises/statistics/creation', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const backendStats = await response.json();
        // Combiner les stats backend et locales
        setCreationStats({
          today: backendStats.today + localStats.today,
          thisMonth: backendStats.thisMonth + localStats.thisMonth,
          semester: backendStats.semester + localStats.semester,
          thisYear: backendStats.thisYear + localStats.thisYear
        });
      } else {
        console.error('Erreur lors de la récupération des statistiques backend, utilisation des données locales');
        setCreationStats(localStats);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      // En cas d'erreur, utiliser les données locales
      const localStats = calculateLocalStats();
      setCreationStats(localStats);
    }
  };

  // Charger les statistiques au montage du composant et quand les applications changent
  useEffect(() => {
    fetchCreationStats();
  }, [applications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_info': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (applicationId: string, newStatus: string, notes?: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === applicationId) {
        const updatedSteps = app.steps.map(step => {
          if (step.status === 'in_progress') {
            return {
              ...step,
              status: (newStatus === 'approved' ? 'completed' : 'rejected') as 'completed' | 'in_progress' | 'pending' | 'rejected',
              completedAt: new Date().toISOString(),
              notes
            };
          }
          return step;
        });

        return {
          ...app,
          status: newStatus as 'pending' | 'in_review' | 'approved' | 'rejected' | 'requires_info',
          steps: updatedSteps
        };
      }
      return app;
    }));
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    inReview: applications.filter(app => app.status === 'in_review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    assignedToMe: applications.filter(app => app.assignedAgent === agent?.id).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-investmali-accent/5 relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="relative text-white shadow animate-fade-in-down">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-mali-emerald to-investmali-warning"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-5">
              <div className="flex items-center">
                <img 
                  src="/api-favicon.png" 
                  alt="API-MALI Logo" 
                  className="w-14 h-14 mr-4 drop-shadow-lg"
                />
                <div className="ml-2">
                  <h1 className="text-2xl font-bold tracking-tight">API-MALI</h1>
                  <p className="text-white/90 text-base font-medium">Agent Création d'Entreprise - Agent d'Enregistrement</p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <div className="bg-investmali-accent text-white px-4 py-2 rounded-full text-base font-semibold flex items-center space-x-2 shadow-md">
                    <span>📝</span>
                    <span>Étape REGISTER</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="group flex items-center gap-3 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 px-3 py-2" aria-label="Ouvrir le profil" title="Modifier le profil">
                  <div className="text-right">
                    <p className="text-base font-semibold group-hover:underline">{agent?.firstName || 'Agent'}</p>
                    <p className="text-sm text-white/90">{agent?.department || 'AGENT_REGISTER'}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/20 backdrop-blur flex items-center justify-center">
                    <span className="text-base font-bold">{(agent?.firstName?.[0] || 'A') + (agent?.lastName?.[0] || 'AG')}</span>
                  </div>
                </button>
                <div className="relative">
                  <button className="relative p-2 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50" aria-label="Notifications" aria-haspopup="true" aria-expanded="false" aria-controls="notifications-menu">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"></path>
                    </svg>
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full bg-investmali-warning text-white shadow">2</span>
                  </button>
                </div>
                <button className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur transition-colors" aria-label="Basculer le thème" title="Mode sombre">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"></path>
                  </svg>
                </button>
                <button 
                  onClick={logout}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur px-5 py-2.5 rounded-lg transition-colors font-semibold text-base"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'dashboard', name: 'Tableau de bord', icon: '📊' },
                { id: 'applications', name: 'Demandes', icon: '📋' },
                { id: 'reports', name: 'Rapports', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-3 border-b-3 font-semibold text-base transition-colors duration-300 ${
                    activeTab === tab.id
                      ? 'border-investmali-accent text-investmali-accent'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2 text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total des demandes', value: stats.total, color: 'bg-blue-500', icon: '📊' },
                  { title: 'En attente', value: stats.pending, color: 'bg-yellow-500', icon: '⏳' },
                  { title: 'En cours', value: stats.inReview, color: 'bg-orange-500', icon: '🔍' },
                  { title: 'Mes dossiers', value: stats.assignedToMe, color: 'bg-investmali-accent', icon: '👤' }
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="flex items-center">
                      <div className={`${stat.color} p-4 rounded-lg text-white text-3xl mr-4`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-600">{stat.title}</p>
                        <p className="text-3xl font-bold text-investmali-neutral-dark">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-investmali-neutral-dark mb-4">Demandes récentes</h3>
                <div className="space-y-4">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-investmali-neutral-dark">{app.companyName}</h4>
                        <p className="text-base text-gray-600">{app.applicantName} • {new Date(app.submissionDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}>
                          {app.status === 'pending' ? 'En attente' : 
                           app.status === 'in_review' ? 'En cours' :
                           app.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setActiveTab('applications');
                          }}
                          className="text-investmali-accent hover:text-investmali-warning transition-colors duration-300 text-base font-semibold"
                        >
                          Voir →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">Rechercher</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nom d'entreprise, demandeur..."
                      className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">Statut</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="in_review">En cours</option>
                      <option value="approved">Approuvé</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">Priorité</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({...filters, priority: e.target.value})}
                      className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                    >
                      <option value="all">Toutes les priorités</option>
                      <option value="low">Faible</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Élevée</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.assignedToMe}
                        onChange={(e) => setFilters({...filters, assignedToMe: e.target.checked})}
                        className="rounded border-gray-300 text-investmali-accent focus:ring-investmali-accent w-5 h-5"
                      />
                      <span className="ml-2 text-base font-medium text-gray-700">Mes dossiers uniquement</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Applications List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-investmali-neutral-dark">
                    Demandes de création d'entreprise ({filteredApplications.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Entreprise</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Demandeur</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Priorité</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors duration-300">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-base font-semibold text-investmali-neutral-dark">{app.companyName}</div>
                              <div className="text-base text-gray-500">{app.legalForm}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-base font-semibold text-gray-900">{app.applicantName}</div>
                              <div className="text-base text-gray-500">{app.applicantEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                            {new Date(app.submissionDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}>
                              {app.status === 'pending' ? 'En attente' : 
                               app.status === 'in_review' ? 'En cours' :
                               app.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getPriorityColor(app.priority)}`}>
                              {app.priority === 'low' ? 'Faible' :
                               app.priority === 'medium' ? 'Moyenne' :
                               app.priority === 'high' ? 'Élevée' : 'Urgente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base font-semibold">
                            <button
                              onClick={() => setSelectedApplication(app)}
                              className="text-investmali-accent hover:text-investmali-warning transition-colors duration-300 mr-3"
                            >
                              Examiner
                            </button>
                            {app.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'in_review')}
                                className="text-investmali-accent hover:text-investmali-warning transition-colors duration-300"
                              >
                                Prendre en charge
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-investmali-neutral-dark mb-6">Rapports et Statistiques</h3>
              <p className="text-base text-gray-600 mb-8">Analyse des performances et métriques du système</p>
              
              {/* Section Statistiques de Création */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 mb-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Statistiques de Création</h3>
                    <p className="text-base text-slate-600 font-medium">Analyse détaillée des créations d'entreprises</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="group bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl shadow-xl border border-blue-200/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-bold text-blue-700 uppercase tracking-wide">Aujourd'hui</p>
                        <p className="text-4xl font-black text-blue-900 mt-2">{creationStats.today || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                      <span className="text-blue-700 font-semibold text-base">Créations du jour</span>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl shadow-xl border border-emerald-200/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-bold text-emerald-700 uppercase tracking-wide">Ce mois</p>
                        <p className="text-4xl font-black text-emerald-900 mt-2">{creationStats.thisMonth || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                      <span className="text-emerald-700 font-semibold text-base">Créations mensuelles</span>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl shadow-xl border border-purple-200/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-bold text-purple-700 uppercase tracking-wide">Semestre</p>
                        <p className="text-4xl font-black text-purple-900 mt-2">{creationStats.semester || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                      <span className="text-purple-700 font-semibold text-base">6 derniers mois</span>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl shadow-xl border border-amber-200/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-base font-bold text-amber-700 uppercase tracking-wide">Cette année</p>
                        <p className="text-4xl font-black text-amber-900 mt-2">{creationStats.thisYear || 0}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                      <span className="text-amber-700 font-semibold text-base">Créations annuelles</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-100 rounded-2xl p-6 border border-indigo-200/50">
                      <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"></path>
                        </svg>
                        <span>Par Antenne</span>
                      </h4>
                      <div className="space-y-3">
                        <p className="text-slate-500 text-center py-4">Aucune donnée disponible</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200/50">
                      <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"></path>
                        </svg>
                        <span>Par Zone Géographique</span>
                      </h4>
                      <div className="space-y-3">
                        <p className="text-slate-500 text-center py-4">Aucune donnée disponible</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-pink-50 to-rose-100 rounded-2xl p-6 border border-pink-200/50">
                      <h4 className="text-lg font-bold text-pink-900 mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <span>Par Sexe</span>
                      </h4>
                      <div className="space-y-3">
                        <p className="text-slate-500 text-center py-4">Aucune donnée disponible</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-violet-50 to-purple-100 rounded-2xl p-6 border border-violet-200/50">
                      <h4 className="text-lg font-bold text-violet-900 mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <span>Par Nationalité</span>
                      </h4>
                      <div className="space-y-3">
                        <p className="text-slate-500 text-center py-4">Aucune donnée disponible</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-100 rounded-2xl p-6 border border-amber-200/50">
                      <h4 className="text-lg font-bold text-amber-900 mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>Par Forme Juridique</span>
                      </h4>
                      <div className="space-y-3">
                        <p className="text-slate-500 text-center py-4">Aucune donnée disponible</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-100 rounded-2xl p-6 border border-teal-200/50">
                      <h4 className="text-lg font-bold text-teal-900 mb-4 flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <span>Par Type de Société</span>
                      </h4>
                      <div className="space-y-3">
                        <p className="text-slate-500 text-center py-4">Aucune donnée disponible</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-investmali-neutral-dark">
                  Détails de la demande - {selectedApplication.companyName}
                </h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Application Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-investmali-neutral-dark mb-3">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Entreprise :</strong> {selectedApplication.companyName}</div>
                    <div><strong>Forme juridique :</strong> {selectedApplication.legalForm}</div>
                    <div><strong>Demandeur :</strong> {selectedApplication.applicantName}</div>
                    <div><strong>Email :</strong> {selectedApplication.applicantEmail}</div>
                    <div><strong>Date de soumission :</strong> {new Date(selectedApplication.submissionDate).toLocaleDateString('fr-FR')}</div>
                    <div><strong>Montant :</strong> {selectedApplication.totalAmount.toLocaleString()} FCFA</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-investmali-neutral-dark mb-3">Documents fournis</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedApplication.documents).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {key === 'identityCard' ? 'Pièce d\'identité' :
                         key === 'proofOfAddress' ? 'Justificatif de domicile' :
                         key === 'businessPlan' ? 'Plan d\'affaires' :
                         key === 'statutes' ? 'Statuts' : 'Relevé bancaire'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t">
                <button
                  onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-300"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-300"
                >
                  Rejeter
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedApplication.id, 'requires_info')}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-300"
                >
                  Demander des infos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;

