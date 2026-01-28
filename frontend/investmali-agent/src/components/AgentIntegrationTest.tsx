import React, { useState } from 'react';
import { agentAuthAPI, agentBusinessAPI, healthAPI } from '../services/api';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

const AgentIntegrationTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (testName: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => {
      const existing = prev.find(t => t.test === testName);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.duration = duration;
        return [...prev];
      } else {
        return [...prev, { test: testName, status, message, duration }];
      }
    });
  };

  const runAgentIntegrationTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Health Check
    try {
      updateTest('Health Check', 'pending', 'Vérification de l\'état de l\'API...');
      const startTime = Date.now();
      const healthResponse = await healthAPI.checkHealth();
      const duration = Date.now() - startTime;
      
      if (healthResponse.status === 200) {
        updateTest('Health Check', 'success', `API opérationnelle - ${healthResponse.data.message || 'OK'}`, duration);
      } else {
        updateTest('Health Check', 'error', `API non disponible: ${healthResponse.statusText}`);
      }
    } catch (error: any) {
      updateTest('Health Check', 'error', `Erreur: ${error.message}`);
    }

    // Test 2: Agent Login
    try {
      updateTest('Agent Login', 'pending', 'Test de connexion agent...');
      const startTime = Date.now();
      
      const loginResponse = await agentAuthAPI.login({
        email: 'test@example.com',
        password: 'password123'
      });
      const duration = Date.now() - startTime;

      if (loginResponse.status === 200 || loginResponse.status === 201) {
        updateTest('Agent Login', 'success', 'Connexion réussie', duration);
        
        // Store the token for subsequent requests
        const token = loginResponse.data?.token;
        if (token) {
          localStorage.setItem('investmali_agent_token', token);
        } else {
          throw new Error('No token received in response');
        }
      } else {
        updateTest('Agent Login', 'error', `Échec de la connexion: ${loginResponse.statusText}`);
      }
    } catch (error: any) {
      updateTest('Agent Login', 'error', `Erreur: ${error.message}`);
    }

    // Test 3: Get Agent Profile
    try {
      updateTest('Get Agent Profile', 'pending', 'Récupération du profil agent...');
      const startTime = Date.now();
      
      const profileResponse = await agentAuthAPI.getProfile();
      const duration = Date.now() - startTime;

      if (profileResponse.data && profileResponse.data.user) {
        updateTest('Get Agent Profile', 'success', `Profil récupéré: ${profileResponse.data.user.email}`, duration);
      } else {
        updateTest('Get Agent Profile', 'error', 'Échec de récupération du profil: Données manquantes');
      }
    } catch (error: any) {
      updateTest('Get Agent Profile', 'error', `Erreur: ${error.message}`);
    }

    // Test 4: Get Applications
    try {
      updateTest('Get Applications', 'pending', 'Récupération des demandes à valider...');
      const startTime = Date.now();
      
      const applicationsResponse = await agentBusinessAPI.getApplications();
      const duration = Date.now() - startTime;

      if (applicationsResponse.data && Array.isArray(applicationsResponse.data.applications)) {
        const count = applicationsResponse.data.applications.length;
        updateTest('Get Applications', 'success', `${count} demande(s) récupérée(s)`, duration);
      } else {
        updateTest('Get Applications', 'error', 'Format de réponse invalide pour les demandes');
      }
    } catch (error: any) {
      updateTest('Get Applications', 'error', `Erreur: ${error.message}`);
    }

    // Test 5: Get Agent Stats
    try {
      updateTest('Get Agent Stats', 'pending', 'Récupération des statistiques agent...');
      const startTime = Date.now();
      
      const statsResponse = await agentBusinessAPI.getStats();
      const duration = Date.now() - startTime;

      if (statsResponse.data && statsResponse.data.total !== undefined) {
        const stats = statsResponse.data;
        updateTest('Get Agent Stats', 'success', `Total: ${stats.total}, En attente: ${stats.pending}, En révision: ${stats.inReview}`, duration);
      } else {
        updateTest('Get Agent Stats', 'error', 'Format de réponse invalide pour les statistiques');
      }
    } catch (error: any) {
      updateTest('Get Agent Stats', 'error', `Erreur: ${error.message}`);
    }

    // Test 6: Create Application for Client
    try {
      updateTest('Create for Client', 'pending', 'Création d\'une demande pour un client...');
      const startTime = Date.now();
      
      const clientApplicationData = {
        companyName: `Agent Test Company ${Date.now()}`,
        businessType: 'Individuelle',
        legalForm: 'Entreprise Individuelle',
        capital: 500000,
        activity: 'Test de création d\'entreprise par un agent pour un client',
        representative: {
          firstName: 'Client',
          lastName: 'Test',
          position: 'Entrepreneur Individuel',
          nationality: 'Malienne',
          phone: '+223 70 00 00 02',
          email: 'client.test@example.com'
        },
        partners: [],
        clientInfo: {
          firstName: 'Client',
          lastName: 'Test',
          email: 'client.test@example.com',
          phone: '+223 70 00 00 02'
        }
      };

      const businessResponse = await agentBusinessAPI.createApplicationForClient(clientApplicationData);
      const duration = Date.now() - startTime;

      if (businessResponse.data && businessResponse.data.application) {
        updateTest('Create for Client', 'success', `Demande créée pour le client: ${businessResponse.data.application.companyName}`, duration);
      } else {
        updateTest('Create for Client', 'error', 'Format de réponse invalide lors de la création de la demande');
      }
    } catch (error: any) {
      updateTest('Create for Client', 'error', `Erreur: ${error.message}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-primary-600';
      case 'success':
        return 'text-primary-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          👨‍💼 Tests d'Intégration Agent InvestMali
        </h2>
        <p className="text-gray-600">
          Tests automatisés pour vérifier l'intégration agent-backend
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runAgentIntegrationTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {isRunning ? '🔄 Tests en cours...' : '🚀 Lancer les tests agent'}
        </button>
      </div>

      {tests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Résultats des Tests Agent
          </h3>
          
          {tests.map((test, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(test.status)}</span>
                  <span className="font-semibold text-gray-800">
                    {test.test}
                  </span>
                </div>
                {test.duration && (
                  <span className="text-sm text-gray-500">
                    {test.duration}ms
                  </span>
                )}
              </div>
              <p className={`text-sm ${getStatusColor(test.status)}`}>
                {test.message}
              </p>
            </div>
          ))}

          <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="font-semibold text-primary-800 mb-2">
              📊 Résumé des Tests Agent
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {tests.filter(t => t.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">Réussis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {tests.filter(t => t.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Échoués</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {tests.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">
          ℹ️ Informations sur les Tests Agent
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Health Check</strong> : Vérification de l'état de l'API backend</li>
          <li>• <strong>Agent Login</strong> : Test de connexion avec un compte agent</li>
          <li>• <strong>Get Agent Profile</strong> : Test de récupération du profil agent</li>
          <li>• <strong>Get Applications</strong> : Test de récupération des demandes à valider</li>
          <li>• <strong>Get Agent Stats</strong> : Test de récupération des statistiques dashboard</li>
          <li>• <strong>Create for Client</strong> : Test de création d'une demande pour un client</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <h4 className="font-semibold text-primary-800 mb-2">
          🔐 Compte de Test Agent
        </h4>
        <p className="text-sm text-primary-700">
          Email: <code>marie.traore@investmali.com</code><br />
          Mot de passe: <code>agent123</code>
        </p>
      </div>
    </div>
  );
};

export default AgentIntegrationTest;
























