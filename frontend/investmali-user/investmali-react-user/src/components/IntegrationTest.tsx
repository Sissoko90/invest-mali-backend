import React, { useState } from 'react';
import { authAPI, businessAPI, healthAPI } from '../services/api';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

const IntegrationTest: React.FC = () => {
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

  const runIntegrationTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Health Check
    try {
      updateTest('Health Check', 'pending', 'Vérification de l\'état de l\'API...');
      const startTime = Date.now();
      const healthResponse = await healthAPI.checkHealth();
      const duration = Date.now() - startTime;
      
      if (healthResponse.success) {
        updateTest('Health Check', 'success', `API opérationnelle - ${healthResponse.message}`, duration);
      } else {
        updateTest('Health Check', 'error', 'API non disponible');
      }
    } catch (error: any) {
      updateTest('Health Check', 'error', `Erreur: ${error.message}`);
    }

    // Test 2: User Registration
    try {
      updateTest('User Registration', 'pending', 'Test d\'inscription utilisateur...');
      const startTime = Date.now();
      const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: `test.user.${Date.now()}@example.com`,
        phone: '+223 70 00 00 00',
        password: 'testpass123'
      };

      const registerResponse = await authAPI.register(testUser);
      const duration = Date.now() - startTime;

      if (registerResponse.success) {
        const email = registerResponse.data?.user?.email || 'email non renseinger';
        updateTest('User Registration', 'success', `Utilisateur créé: ${email}`, duration);
      } else {
        updateTest('User Registration', 'error', 'Échec de l\'inscription');
      }
    } catch (error: any) {
      updateTest('User Registration', 'error', `Erreur: ${error.message}`);
    }

    // Test 3: User Login
    try {
      updateTest('User Login', 'pending', 'Test de connexion utilisateur...');
      const startTime = Date.now();
      
      const loginResponse = await authAPI.login({
        email: 'amadou.diallo@email.com',
        password: 'user123'
      });
      const duration = Date.now() - startTime;

      if (loginResponse.success) {
        const user = loginResponse.data?.user;
        const name = user?.prenom && user?.nom
          ? `${user.prenom} ${user.nom}`
          : (user?.email || 'Utilisateur');
        updateTest('User Login', 'success', `Connexion réussie: ${name}`, duration);
      } else {
        updateTest('User Login', 'error', 'Échec de la connexion');
      }
    } catch (error: any) {
      updateTest('User Login', 'error', `Erreur: ${error.message}`);
    }

    // Test 4: Get User Profile
    try {
      updateTest('Get Profile', 'pending', 'Récupération du profil utilisateur...');
      const startTime = Date.now();
      
      const profileResponse = await authAPI.getProfile();
      const duration = Date.now() - startTime;

      if (profileResponse.success) {
        const email = profileResponse.data?.user?.email || 'email non renseinger';
        updateTest('Get Profile', 'success', `Profil récupéré: ${email}`, duration);
      } else {
        updateTest('Get Profile', 'error', 'Échec de récupération du profil');
      }
    } catch (error: any) {
      updateTest('Get Profile', 'error', `Erreur: ${error.message}`);
    }

    // Test 5: Create Business Application
    try {
      updateTest('Create Business', 'pending', 'Création d\'une demande d\'entreprise...');
      const startTime = Date.now();
      
      const businessData = {
        companyName: `Test Company ${Date.now()}`,
        businessType: 'Société',
        legalForm: 'SARL',
        capital: 1000000,
        activity: 'Test d\'intégration API pour la création d\'entreprise',
        representative: {
          firstName: 'Test',
          lastName: 'Representative',
          position: 'Gérant',
          nationality: 'Malienne',
          phone: '+223 70 00 00 01',
          email: 'test.rep@example.com'
        },
        partners: [
          { firstName: 'Test', lastName: 'Partner1', shares: 60 },
          { firstName: 'Test', lastName: 'Partner2', shares: 40 }
        ]
      };

      const businessResponse = await businessAPI.createApplication(businessData);
      const duration = Date.now() - startTime;

      if (businessResponse.success) {
        updateTest('Create Business', 'success', `Demande créée: ${businessResponse.data.application.companyName}`, duration);
      } else {
        updateTest('Create Business', 'error', 'Échec de création de la demande');
      }
    } catch (error: any) {
      updateTest('Create Business', 'error', `Erreur: ${error.message}`);
    }

    // Test 6: Get My Applications
    try {
      updateTest('Get Applications', 'pending', 'Récupération des demandes utilisateur...');
      const startTime = Date.now();
      
      const applicationsResponse = await businessAPI.getMyApplications();
      const duration = Date.now() - startTime;

      if (applicationsResponse.success) {
        const count = applicationsResponse.data.applications.length;
        updateTest('Get Applications', 'success', `${count} demande(s) récupérée(s)`, duration);
      } else {
        updateTest('Get Applications', 'error', 'Échec de récupération des demandes');
      }
    } catch (error: any) {
      updateTest('Get Applications', 'error', `Erreur: ${error.message}`);
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
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
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
          🧪 Tests d'Intégration InvestMali API
        </h2>
        <p className="text-gray-600">
          Tests automatisés pour vérifier l'intégration frontend-backend
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runIntegrationTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isRunning ? '🔄 Tests en cours...' : '🚀 Lancer les tests'}
        </button>
      </div>

      {tests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Résultats des Tests
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

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              📊 Résumé des Tests
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
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
                <div className="text-2xl font-bold text-yellow-600">
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
          ℹ️ Informations sur les Tests
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Health Check</strong> : Vérification de l'état de l'API backend</li>
          <li>• <strong>User Registration</strong> : Test de création d'un nouvel utilisateur</li>
          <li>• <strong>User Login</strong> : Test de connexion avec un utilisateur existant</li>
          <li>• <strong>Get Profile</strong> : Test de récupération du profil utilisateur</li>
          <li>• <strong>Create Business</strong> : Test de création d'une demande d'entreprise</li>
          <li>• <strong>Get Applications</strong> : Test de récupération des demandes utilisateur</li>
        </ul>
      </div>
    </div>
  );
};

export default IntegrationTest;
