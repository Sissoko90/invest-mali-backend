/**
 * Exemple d'utilisation de l'API centralisée InvestMali Utilisateur
 * 
 * Ce composant démontre comment utiliser la nouvelle configuration API centralisée
 * avec les variables d'environnement et les endpoints configurés.
 */

import React, { useState, useEffect } from 'react';
import { authAPI, businessAPI, healthAPI, enumsAPI, chatAPI } from '../services/api';
import { API_CONFIG, buildApiUrl } from '../config/api.config';

const ApiUsageExample = () => {
  const [state, setState] = useState({
    health: null,
    profile: null,
    applications: [],
    enums: null,
    loading: false,
    error: null,
  });

  // Exemple 1: Vérification de la santé de l'API
  const checkHealth = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await healthAPI.checkHealth();
      
      setState(prev => ({
        ...prev,
        health: response,
        loading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Erreur health check: ${error.message}`,
        loading: false
      }));
      console.error('❌ Erreur health check:', error);
    }
  };

  // Exemple 2: Récupération du profil utilisateur
  const getProfile = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await authAPI.getProfile();
      
      setState(prev => ({
        ...prev,
        profile: response.data?.user || response,
        loading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Erreur profil: ${error.message}`,
        loading: false
      }));
      console.error('❌ Erreur profil:', error);
    }
  };

  // Exemple 3: Liste des applications utilisateur
  const getMyApplications = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await businessAPI.getMyApplications();
      
      setState(prev => ({
        ...prev,
        applications: Array.isArray(response) ? response : (response.data || []),
        loading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Erreur applications: ${error.message}`,
        loading: false
      }));
      console.error('❌ Erreur applications:', error);
    }
  };

  // Exemple 4: Récupération des enums
  const getEnums = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [formeJuridique, typeEntreprise] = await Promise.all([
        enumsAPI.getSocieteJuridictions(),
        enumsAPI.getTypeEntreprises()
      ]);
      
      setState(prev => ({
        ...prev,
        enums: { formeJuridique, typeEntreprise },
        loading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Erreur enums: ${error.message}`,
        loading: false
      }));
      console.error('❌ Erreur enums:', error);
    }
  };

  // Exemple 5: Test de connexion (simulation)
  const testLogin = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Simulation d'une connexion (remplacez par de vraies données de test)
      console.log('🔐 Test de connexion (simulation)');
      console.log('Endpoint utilisé:', buildApiUrl('/auth/login'));
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
      
      alert('Test de connexion simulé - vérifiez la console pour l\'URL utilisée');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Erreur test login: ${error.message}`,
        loading: false
      }));
    }
  };

  // Exemple 6: Construction d'URLs
  const showUrlExamples = () => {
    console.group('🔗 Exemples d\'URLs construites (User App)');
    console.log('Health:', buildApiUrl('/health'));
    console.log('Login:', buildApiUrl('/auth/login'));
    console.log('Register:', buildApiUrl('/auth/register'));
    console.log('My Applications:', buildApiUrl('/entreprises/my-applications'));
    console.log('Enums - Forme Juridique:', buildApiUrl('/enums/forme-juridique'));
    console.log('Chat - Start Conversation:', buildApiUrl('/chat/conversations/start-user'));
    console.groupEnd();
  };

  useEffect(() => {
    // Afficher la configuration au montage du composant
    console.group('🔧 User API Configuration Active');
    console.log('Base URL:', API_CONFIG.BASE_URL);
    console.log('Timeout:', API_CONFIG.TIMEOUT);
    console.log('Debug Mode:', API_CONFIG.DEBUG);
    console.groupEnd();

    showUrlExamples();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Exemple d'utilisation de l'API InvestMali Utilisateur</h1>
      
      {/* Configuration actuelle */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuration actuelle</h2>
        <div className="space-y-1 text-sm">
          <p><strong>Base URL:</strong> {API_CONFIG.BASE_URL}</p>
          <p><strong>Timeout:</strong> {API_CONFIG.TIMEOUT}ms</p>
          <p><strong>Debug:</strong> {API_CONFIG.DEBUG ? 'Activé' : 'Désactivé'}</p>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={checkHealth}
          disabled={state.loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Health Check
        </button>
        
        <button
          onClick={getProfile}
          disabled={state.loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Profil
        </button>
        
        <button
          onClick={getMyApplications}
          disabled={state.loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Mes Demandes
        </button>
        
        <button
          onClick={getEnums}
          disabled={state.loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Enums
        </button>
        
        <button
          onClick={testLogin}
          disabled={state.loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Login
        </button>
        
        <button
          onClick={showUrlExamples}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Show URLs
        </button>
      </div>

      {/* État de chargement */}
      {state.loading && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
          <p className="text-yellow-800">Chargement en cours...</p>
        </div>
      )}

      {/* Erreurs */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* Résultats */}
      <div className="space-y-6">
        {/* Health */}
        {state.health && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Health Check</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(state.health, null, 2)}
            </pre>
          </div>
        )}

        {/* Profil */}
        {state.profile && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Profil Utilisateur</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(state.profile, null, 2)}
            </pre>
          </div>
        )}

        {/* Applications */}
        {state.applications.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Mes Applications ({state.applications.length})</h3>
            <div className="space-y-2">
              {state.applications.slice(0, 3).map((app, index) => (
                <div key={index} className="bg-white p-2 rounded text-sm">
                  <p><strong>ID:</strong> {app.id || 'N/A'}</p>
                  <p><strong>Nom:</strong> {app.nom || app.name || 'N/A'}</p>
                  <p><strong>Statut:</strong> {app.statutCreation || app.status || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enums */}
        {state.enums && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Enums</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-2 rounded">
                <h4 className="font-medium">Formes Juridiques</h4>
                <p className="text-sm">{Array.isArray(state.enums.formeJuridique) ? state.enums.formeJuridique.length : 'N/A'} éléments</p>
              </div>
              <div className="bg-white p-2 rounded">
                <h4 className="font-medium">Types d'Entreprise</h4>
                <p className="text-sm">{Array.isArray(state.enums.typeEntreprise) ? state.enums.typeEntreprise.length : 'N/A'} éléments</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Code d'exemple */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Exemples de code</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">1. Utilisation des modules API:</h4>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`import { authAPI, businessAPI, enumsAPI } from '../services/api';

// Connexion
const response = await authAPI.login({
  email: 'user@example.com',
  password: 'password'
});

// Mes demandes
const apps = await businessAPI.getMyApplications();

// Enums
const formes = await enumsAPI.getSocieteJuridictions();`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">2. Configuration personnalisée:</h4>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`// Dans .env
REACT_APP_USER_API_URL=http://localhost:8080/api/v1
REACT_APP_API_TIMEOUT=30000
REACT_APP_DEBUG_API=true

// Dans le code
import { API_CONFIG, buildApiUrl } from '../config/api.config';

const customUrl = buildApiUrl('/custom-endpoint');
console.log('Timeout configuré:', API_CONFIG.TIMEOUT);`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">3. Gestion des erreurs:</h4>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`try {
  const response = await businessAPI.createApplication(data);
  console.log('Succès:', response);
} catch (error) {
  console.error('Erreur:', error.message);
  // Gestion automatique des erreurs 401 (redirection login)
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiUsageExample;
