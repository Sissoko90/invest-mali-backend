import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { agentBusinessAPI } from '../services/api';
import AnimatedBackground from './AnimatedBackground';
import AgentConversationsModal from './AgentConversationsModal';

// Fonction pour mapper les statuts backend vers frontend
const mapBackendStatusToFrontend = (backendStatus: string): 'pending' | 'pending_validation' | 'in_review' | 'approved' | 'rejected' | 'requires_info' => {
  switch (backendStatus) {
    case 'VALIDEE':
      return 'approved';
    case 'REJETEE':
      return 'rejected';
    case 'EN_COURS':
      return 'in_review';
    case 'PENDING':
    default:
      return 'pending';
  }
};

interface BusinessApplication {
  id: string;
  companyName: string;
  legalForm: string;
  applicantName: string;
  applicantEmail: string;
  submissionDate: string;
  status: 'pending' | 'pending_validation' | 'in_review' | 'approved' | 'rejected' | 'requires_info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string | number;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'assigned-applications' | 'user-requests' | 'reports'>('dashboard');
  const [conversationsModalOpen, setConversationsModalOpen] = useState(false);

  // Données de démonstration pour les demandes de création d'utilisateur
  const [userRequests, setUserRequests] = useState([
    {
      id: 'user_001',
      firstName: 'Moussa',
      lastName: 'Coulibaly',
      email: 'moussa.coulibaly@email.com',
      phone: '+223 XX XX XX XX',
      status: 'pending',
      submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      documents: {
        identityCard: true,
        proofOfAddress: true,
        photo: true
      }
    },
    {
      id: 'user_002',
      firstName: 'Aminata',
      lastName: 'Traoré',
      email: 'aminata.traore@email.com',
      phone: '+223 76 54 32 10',
      status: 'in_review',
      submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: agent?.id,
      documents: {
        identityCard: true,
        proofOfAddress: false,
        photo: true
      }
    },
    {
      id: 'user_003',
      firstName: 'Ibrahim',
      lastName: 'Diakité',
      email: 'ibrahim.diakite@email.com',
      phone: '+223 65 43 21 09',
      status: 'approved',
      submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: agent?.id,
      documents: {
        identityCard: true,
        proofOfAddress: true,
        photo: true
      }
    }
  ]);

  // Fonction pour charger les vraies données assignées
  const handleLoadRealData = async () => {
    try {
      console.log('🔄 Chargement des vraies données assignées...');
      // Utiliser l'API correcte pour récupérer les demandes assignées
      const response = await fetch('/api/v1/entreprises/assigned-to-me?size=50&sort=dateCreation,desc', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      console.log('📊 Réponse API assigned-to-me:', data);
      
      if (data) {
        let assignedApps = [];
        if (Array.isArray(data)) {
          assignedApps = data;
        } else if (data.content && Array.isArray(data.content)) {
          assignedApps = data.content;
        }
        
        console.log('✅ Vraies demandes assignées:', assignedApps);
        
        // Mapper les données réelles
        const mappedApps = assignedApps.map((app: any) => ({
          id: app.id,
          companyName: app.nom || app.companyName || 'Entreprise non renseinger',
          legalForm: app.formeJuridique || 'SARL',
          applicantName: 'Demandeur',
          applicantEmail: 'email@example.com',
          submissionDate: app.creation || new Date().toISOString(),
          status: 'pending',
          priority: 'medium',
          assignedAgent: '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6', // Forcer l'ID réel
          documents: {
            identityCard: true,
            proofOfAddress: true,
            businessPlan: true,
            statutes: true,
            bankStatement: true,
          },
          steps: [],
          totalAmount: 0,
          paymentStatus: 'pending',
        }));
        
        setApplications(prev => [...prev.filter(app => !app.id.startsWith('real-')), ...mappedApps.map((app: any) => ({...app, id: `real-${app.id}`}))]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des vraies données:', error);
    }
  };

  // Fonction de test pour assigner une demande de démo
  const handleTestAssign = () => {
    console.log('🧪 Test d\'assignation de démo');
    console.log('🔍 Agent actuel:', agent);
    console.log('🔍 Agent ID:', agent?.id);
    console.log('🔍 ID en base:', '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6');
    
    // Utiliser l'ID réel de la base de données pour les tests
    const realAgentId = '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6';
    
    setApplications(prev => prev.map(app => {
      if (app.id === 'demo_002') {
        console.log('🔄 Assignation de demo_002 à:', realAgentId);
        return { ...app, assignedAgent: realAgentId };
      }
      return app;
    }));
  };

  // Fonction pour assigner une demande à l'agent connecté
  const handleAssignToMe = async (applicationId: string) => {
    try {
      console.log('📌 Assignation de la demande:', applicationId);
      console.log('🔍 Agent ID actuel:', agent?.id);
      
      await agentBusinessAPI.assignApplication(applicationId, true);
      
      // Mettre à jour la liste des applications
      setApplications(prev => {
        const updated = prev.map(app => {
          if (app.id === applicationId) {
            console.log('🔄 Mise à jour de l\'application:', app.id, 'assignedAgent:', agent?.id);
            return { ...app, assignedAgent: agent?.id };
          }
          return app;
        });
        console.log('📊 Applications après mise à jour:', updated.filter(app => app.assignedAgent === agent?.id).length, 'assignées');
        return updated;
      });
      
      console.log('✅ Demande assignée avec succès');
      
      // Afficher une notification de succès
      alert('Demande assignée avec succès !');
      
      // Recharger les données depuis le backend pour s'assurer de la cohérence
      setTimeout(async () => {
        console.log('🔄 Rechargement des données depuis le backend...');
        try {
          const response = await agentBusinessAPI.listApplications({
            page: 1,
            limit: 50,
            assigned: 'all',
            sort: '-submitted_at'
          });
          
          if (response.data && Array.isArray(response.data)) {
            console.log('📊 Nouvelles données reçues:', response.data.length, 'applications');
            setApplications(response.data);
          }
        } catch (error) {
          console.error('Erreur lors du rechargement:', error);
        }
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'assignation:', error);
      
      // Afficher un message d'erreur détaillé
      let errorMessage = 'Erreur lors de l\'assignation de la demande.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur serveur. Vérifiez que vous avez les permissions nécessaires pour traiter cette étape.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('❌ Erreur: ' + errorMessage);
    }
  };

  // Charger les demandes depuis l'API backend
  useEffect(() => {
    const loadApplications = async () => {
      try {
        console.log('Chargement des applications depuis l\'API...');
        const response = await agentBusinessAPI.listApplications({
          page: 1,
          limit: 50,
          assigned: 'all',
          sort: '-submitted_at'
        });
        
        console.log('Réponse API applications:', response.data);
        
        // Convertir les données API en format agent
        const agentApplications: BusinessApplication[] = response.data.applications.map((app: any) => ({
          id: app.id,
          companyName: app.companyName || app.nom || 'Entreprise non renseinger',
          legalForm: app.formeJuridique || 'SARL',
          applicantName: 'Demandeur', // À récupérer depuis les membres si disponible
          applicantEmail: 'email@example.com', // À récupérer depuis les membres si disponible
          submissionDate: app.submittedAt || app.creation || new Date().toISOString(),
          status: mapBackendStatusToFrontend(app.status),
          priority: 'medium',
          assignedAgent: app.assignedAgent,
          documents: {
            identityCard: true,
            proofOfAddress: true,
            businessPlan: true,
            statutes: true,
            bankStatement: true,
          },
          steps: [
            { id: 'doc_verification', name: 'Vérification des documents', status: 'in_progress' },
            { id: 'legal_review', name: 'Examen juridique', status: 'pending' },
            { id: 'final_approval', name: 'Approbation finale', status: 'pending' },
          ],
          totalAmount: typeof app.totalAmount === 'number' ? app.totalAmount : 0,
          paymentStatus: Math.random() > 0.3 ? 'paid' : 'pending',
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
        assignedAgent: '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6', // ID réel de la base
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
      } catch (error) {
        console.error('Erreur lors du chargement des applications:', error);
      }
    };

    loadApplications();
  }, [agent?.id]);

  // Filtrer les applications
  useEffect(() => {
    console.log('🔍 Filtrage des applications - Onglet actif:', activeTab);
    console.log('📊 Total applications:', applications.length);
    console.log('👤 Agent ID:', agent?.id);
    
    let filtered = applications;

    // Filtrer selon l'onglet actif
    if (activeTab === 'applications') {
      // Demandes d'entreprises à traiter (non assignées)
      filtered = filtered.filter(app => !app.assignedAgent);
      console.log('📋 Demandes non assignées:', filtered.length);
    } else if (activeTab === 'assigned-applications') {
      // Mes demandes assignées
      console.log('🔍 Comparaison pour filtrage:');
      console.log('   - Agent ID:', agent?.id);
      console.log('   - Agent ID type:', typeof agent?.id);
      
      // Pour les tests, accepter aussi l'ID réel de la base
      const realAgentId = '4bb6b0a6-26f2-4cea-9f20-d19b577bfbd6';
      filtered = filtered.filter(app => 
        app.assignedAgent === agent?.id || 
        app.assignedAgent === realAgentId ||
        app.assignedAgent === 'test-agent-id'
      );
      
      console.log('📋 Mes demandes assignées:', filtered.length);
      console.log('🔍 Applications avec assignedAgent:', applications.filter(app => app.assignedAgent).map(app => ({
        id: app.id,
        companyName: app.companyName,
        assignedAgent: app.assignedAgent,
        assignedAgentType: typeof app.assignedAgent
      })));
    }

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

    console.log('✅ Applications filtrées finales:', filtered.length);
    setFilteredApplications(filtered);
  }, [applications, filters, searchTerm, agent?.id, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-sky-100 text-primary-800';
      case 'pending_validation': return 'bg-sky-100 text-primary-800';
      case 'in_review': return 'bg-sky-600 text-white-100';
      case 'approved': return 'bg-sky-100 text-primary-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_info': return 'bg-sky-100 text-primary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserRequestStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_review': return 'En cours de vérification';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const handleUserRequestAction = (requestId: string, action: 'approve' | 'reject' | 'request_info') => {
    setUserRequests(prev => 
      prev.map(req => {
        if (req.id === requestId) {
          let newStatus = req.status;
          if (action === 'approve') newStatus = 'approved';
          else if (action === 'reject') newStatus = 'rejected';
          else if (action === 'request_info') newStatus = 'requires_info';
          
          return { ...req, status: newStatus };
        }
        return req;
      })
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-sky-100 text-primary-800';
      case 'medium': return 'bg-sky-100 text-primary-800';
      case 'high': return 'bg-sky-100 text-primary-800';
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
    assignedToMe: applications.filter(app => app.assignedAgent === agent?.id).length,
    unassigned: applications.filter(app => !app.assignedAgent).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-mali-emerald/5 relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-mali-emerald to-mali-gold p-2 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-mali-dark">Dashboard Agent</h1>
                  <p className="text-sm text-gray-600">InvestMali - Système de validation</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setConversationsModalOpen(true)}
                  className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-mali-emerald/90 transition-colors duration-300 text-sm font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Conversations</span>
                </button>
                <div className="text-right">
                  <p className="text-sm font-medium text-mali-dark">{agent?.firstName} {agent?.lastName}</p>
                  <p className="text-xs text-gray-600 capitalize">{agent?.role} - {agent?.department}</p>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors duration-300 text-sm font-medium"
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
                { id: 'applications', name: 'Demandes d\'entreprises à traiter', icon: '🏢' },
                { id: 'assigned-applications', name: 'Mes demandes assignées', icon: '📋' },
                { id: 'user-requests', name: 'Demandes Utilisateurs', icon: '👥' },
                { id: 'reports', name: 'Rapports', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-300 ${
                    activeTab === tab.id
                      ? 'border-mali-emerald text-mali-emerald'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
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
                  { title: 'Total des demandes', value: stats.total, color: 'bg-primary-500', icon: '📊' },
                  { title: 'À traiter', value: stats.unassigned, color: 'bg-primary-500', icon: '⏳' },
                  { title: 'Mes dossiers', value: stats.assignedToMe, color: 'bg-mali-emerald', icon: '👤' },
                  { title: 'Approuvées', value: stats.approved, color: 'bg-primary-500', icon: '✅' }
                ].map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="flex items-center">
                      <div className={`${stat.color} p-3 rounded-lg text-white text-2xl mr-4`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-mali-dark">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Boutons de test pour debug */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-primary-800">🧪 Mode Debug</h4>
                    <p className="text-xs text-primary-600">Tester l'assignation et charger les vraies données</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleTestAssign}
                      className="bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                    >
                      Assigner Demo
                    </button>
                    <button
                      onClick={handleLoadRealData}
                      className="bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                    >
                      Charger API
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-mali-dark mb-4">Demandes récentes</h3>
                <div className="space-y-4">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                      <div className="flex-1">
                        <h4 className="font-medium text-mali-dark">{app.companyName}</h4>
                        <p className="text-sm text-gray-600">{app.applicantName} • {new Date(app.submissionDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status === 'pending_validation' ? 'En attente de validation' :
                           app.status === 'pending' ? 'En attente' : 
                           app.status === 'in_review' ? 'En cours de révision' :
                           app.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setActiveTab('applications');
                          }}
                          className="text-mali-emerald hover:text-mali-gold transition-colors duration-300 text-sm font-medium"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nom d'entreprise, demandeur..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="pending_validation">En attente de validation</option>
                      <option value="in_review">En cours</option>
                      <option value="approved">Approuvé</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({...filters, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
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
                        className="rounded border-gray-300 text-mali-emerald focus:ring-mali-emerald"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mes dossiers uniquement</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Applications List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-mali-dark">
                    Demandes d'entreprises à traiter ({filteredApplications.length})
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ces demandes ne sont assignées à aucun agent et peuvent être prises en charge
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandeur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors duration-300">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-mali-dark">{app.companyName}</div>
                              <div className="text-sm text-gray-500">{app.legalForm}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{app.applicantName}</div>
                              <div className="text-sm text-gray-500">{app.applicantEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(app.submissionDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {app.status === 'pending_validation' ? 'En attente de validation' :
                               app.status === 'pending' ? 'En attente' : 
                               app.status === 'in_review' ? 'En cours de révision' :
                               app.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(app.priority)}`}>
                              {app.priority === 'low' ? 'Faible' :
                               app.priority === 'medium' ? 'Moyenne' :
                               app.priority === 'high' ? 'Élevée' : 'Urgente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedApplication(app)}
                              className="text-mali-emerald hover:text-mali-gold transition-colors duration-300 mr-3"
                            >
                              Examiner
                            </button>
                            {!app.assignedAgent && (
                              <button
                                onClick={() => handleAssignToMe(app.id)}
                                className="bg-mali-emerald text-white px-3 py-1 rounded-lg hover:bg-mali-gold transition-colors duration-300 text-sm"
                              >
                                M'assigner
                              </button>
                            )}
                            {app.assignedAgent === agent?.id && (
                              <span className="text-primary-600 text-sm font-medium">
                                Assigné à moi
                              </span>
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

          {activeTab === 'assigned-applications' && (
            <div className="space-y-6">
              {/* Filters and Search for Assigned Applications */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nom d'entreprise, demandeur..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="pending_validation">En attente de validation</option>
                      <option value="in_review">En cours</option>
                      <option value="approved">Approuvé</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({...filters, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    >
                      <option value="all">Toutes les priorités</option>
                      <option value="low">Faible</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Élevée</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Assigned Applications List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-mali-dark">
                    Mes demandes assignées ({filteredApplications.length})
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Demandes qui vous sont assignées et que vous devez traiter
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandeur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors duration-300">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-mali-dark">{app.companyName}</div>
                              <div className="text-sm text-gray-500">{app.legalForm}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{app.applicantName}</div>
                              <div className="text-sm text-gray-500">{app.applicantEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(app.submissionDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {app.status === 'pending_validation' ? 'En attente de validation' :
                               app.status === 'pending' ? 'En attente' : 
                               app.status === 'in_review' ? 'En cours de révision' :
                               app.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(app.priority)}`}>
                              {app.priority === 'low' ? 'Faible' :
                               app.priority === 'medium' ? 'Moyenne' :
                               app.priority === 'high' ? 'Élevée' : 'Urgente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedApplication(app)}
                              className="text-mali-emerald hover:text-mali-gold transition-colors duration-300 mr-3"
                            >
                              Traiter
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(app.id, 'in_review')}
                              className="text-primary-600 hover:text-primary-900 transition-colors duration-300"
                            >
                              Mettre à jour
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredApplications.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande assignée</h3>
                    <p className="text-gray-500">Vous n'avez actuellement aucune demande assignée.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'user-requests' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-mali-dark mb-6">
                  Demandes de création de comptes utilisateurs
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de soumission</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-mali-emerald/10 rounded-full flex items-center justify-center text-mali-emerald font-medium">
                                {request.firstName.charAt(0)}{request.lastName.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {request.firstName} {request.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              {request.documents.identityCard && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  CNI
                                </span>
                              )}
                              {request.documents.proofOfAddress && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  Justif. domicile
                                </span>
                              )}
                              {request.documents.photo && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  Photo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              {getUserRequestStatusText(request.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.submissionDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUserRequestAction(request.id, 'approve')}
                                    className="text-primary-600 hover:text-primary-900"
                                    title="Approuver"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleUserRequestAction(request.id, 'reject')}
                                    className="text-red-600 hover:text-red-900"
                                    title="Rejeter"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  // TODO: Implémenter la prévisualisation des documents
                                  alert(`Prévisualisation des documents pour ${request.firstName} ${request.lastName}`);
                                }}
                                className="text-primary-600 hover:text-primary-900"
                                title="Voir les documents"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </div>
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
              <h3 className="text-lg font-bold text-mali-dark mb-4">Rapports et statistiques</h3>
              <p className="text-gray-600">Cette section est en cours de développement.</p>
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
                <h3 className="text-xl font-bold text-mali-dark">
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
                  <h4 className="font-medium text-mali-dark mb-3">Informations générales</h4>
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
                  <h4 className="font-medium text-mali-dark mb-3">Documents fournis</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedApplication.documents).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        
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
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-300"
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
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-300"
                >
                  Demander des infos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des conversations */}
      <AgentConversationsModal
        isOpen={conversationsModalOpen}
        onClose={() => setConversationsModalOpen(false)}
      />
    </div>
  );
};

export default AgentDashboard;
























