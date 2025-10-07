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

  // Charger les demandes depuis localStorage et créer des données de démonstration
  useEffect(() => {
    const userApplications = JSON.parse(localStorage.getItem('user_applications') || '[]');
    
    // Convertir les applications utilisateur en format agent avec statuts et étapes
    const agentApplications: BusinessApplication[] = userApplications.map((app: any, index: number) => ({
      id: app.id || `app_${index + 1}`,
      companyName: app.companyName || 'Entreprise Inconnue',
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
                { id: 'applications', name: 'Demandes', icon: '📋' },
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
                  { title: 'Total des demandes', value: stats.total, color: 'bg-blue-500', icon: '📊' },
                  { title: 'En attente', value: stats.pending, color: 'bg-yellow-500', icon: '⏳' },
                  { title: 'En cours', value: stats.inReview, color: 'bg-orange-500', icon: '🔍' },
                  { title: 'Mes dossiers', value: stats.assignedToMe, color: 'bg-mali-emerald', icon: '👤' }
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
                          {app.status === 'pending' ? 'En attente' : 
                           app.status === 'in_review' ? 'En cours' :
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
                    Demandes de création d'entreprise ({filteredApplications.length})
                  </h3>
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
                              {app.status === 'pending' ? 'En attente' : 
                               app.status === 'in_review' ? 'En cours' :
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
                            {app.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'in_review')}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-300"
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
              <h3 className="text-lg font-bold text-mali-dark mb-4">Rapports et Statistiques</h3>
              <p className="text-gray-600">Fonctionnalité de rapports en cours de développement...</p>
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
