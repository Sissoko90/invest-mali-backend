
﻿/**
 * Exemple d'utilisation de l'API centralisée InvestMali Agent
 * 
 * Ce composant démontre comment utiliser la nouvelle configuration API centralisée
 * avec les variables d'environnement et les endpoints configurés.
 */

import React, { useState, useEffect } from 'react';
import apiClient, { agentAuthAPI, entreprisesAPI, healthAPI, axiosInstance } from '../services/api';
import { API_CONFIG, buildApiUrl } from '../config/api.config';

interface ApiExampleState {
  health: any;
  profile: any;
  applications: any[];
  loading: boolean;
  error: string | null;
}

const ApiUsageExample: React.FC = () => {
  const [state, setState] = useState<ApiExampleState>({
    health: null,
    profile: null,
    applications: [],
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
        health: response.data,
        loading: false
      }));
      
      console.log('✅ Health check réussi:', response.data);
    } catch (error: any) {
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
      
      const response = await agentAuthAPI.getProfile();
      
      setState(prev => ({
        ...prev,
        profile: response.data,
        loading: false
      }));
      
      console.log('✅ Profil récupéré:', response.data);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: `Erreur profil: ${error.message}`,
        loading: false
      }));
      console.error('❌ Erreur profil:', error);
    }
  };

  // Exemple 3: Liste des applications
  const getApplications = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await entreprisesAPI.list({
        page: 0,
        size: 10,
        sort: 'dateCreation,desc'
      });
      
      setState(prev => ({
        ...prev,
        applications: response.data.content || response.data || [],
        loading: false
      }));
      
      console.log('✅ Applications récupérées:', response.data);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: `Erreur applications: ${error.message}`,
        loading: false
      }));
      console.error('❌ Erreur applications:', error);
    }
  };

  // Exemple 4: Appel API direct avec axios
  const directApiCall = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Utilisation directe de l'instance axios configurée
      const response = await axiosInstance.get('/entreprises/unassigned', {
        params: { size: 5 }
      });
      
      console.log('✅ Appel direct réussi:', response.data);
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: `Erreur appel direct: ${error.message}`,
        loading: false
      }));
      console.error('❌ Erreur appel direct:', error);
    }
  };

  // Exemple 5: Construction d'URL avec la fonction utilitaire
  const showUrlExamples = () => {
    console.group('🔗 Exemples d\'URLs construites');
    console.log('Health:', buildApiUrl('/health'));
    console.log('Login:', buildApiUrl('/auth/login'));
    console.log('Entreprises:', buildApiUrl('/entreprises'));
    console.log('Chat:', buildApiUrl('/chat/conversations'));
    console.groupEnd();
  };

  useEffect(() => {
    // Afficher la configuration au montage du composant
    console.group('🔧 Configuration API Active');
    console.log('Base URL:', API_CONFIG.BASE_URL);
    console.log('Timeout:', API_CONFIG.TIMEOUT);
    console.log('Debug Mode:', API_CONFIG.DEBUG);
    console.groupEnd();

    showUrlExamples();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Exemple d'utilisation de l'API InvestMali Agent</h1>
      
      {/* Configuration actuelle */}
      <div className="bg-primary-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuration actuelle</h2>
        <div className="space-y-1 text-sm">
          <p><strong>Base URL:</strong> {API_CONFIG.BASE_URL}</p>
          <p><strong>Timeout:</strong> {API_CONFIG.TIMEOUT}ms</p>
          <p><strong>Debug:</strong> {API_CONFIG.DEBUG ? 'Activé' : 'Désactivé'}</p>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={checkHealth}
          disabled={state.loading}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Health Check
        </button>
        
        <button
          onClick={getProfile}
          disabled={state.loading}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Profil
        </button>
        
        <button
          onClick={getApplications}
          disabled={state.loading}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Applications
        </button>
        
        <button
          onClick={directApiCall}
          disabled={state.loading}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Appel Direct
        </button>
      </div>

      {/* État de chargement */}
      {state.loading && (
        <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg mb-4">
          <p className="text-primary-800">Chargement en cours...</p>
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
          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Health Check</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(state.health, null, 2)}
            </pre>
          </div>
        )}

        {/* Profil */}
        {state.profile && (
          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Profil Utilisateur</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(state.profile, null, 2)}
            </pre>
          </div>
        )}

        {/* Applications */}
        {state.applications.length > 0 && (
          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Applications ({state.applications.length})</h3>
            <div className="space-y-2">
              {state.applications.slice(0, 3).map((app, index) => (
                <div key={index} className="bg-white p-2 rounded text-sm">
                  <p><strong>ID:</strong> {app.id}</p>
                  <p><strong>Nom:</strong> {app.nom || 'N/A'}</p>
                  <p><strong>Statut:</strong> {app.statutCreation || 'N/A'}</p>
                </div>
              ))}
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
{`import { agentAuthAPI, entreprisesAPI } from '../services/api';

// Connexion
const response = await agentAuthAPI.login({
  email: 'agent@example.com',
  password: 'password'
});

// Liste des entreprises
const apps = await entreprisesAPI.list({ page: 0, size: 10 });`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">2. Appel direct avec axios:</h4>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`import { axiosInstance } from '../services/api';

// Appel GET
const response = await axiosInstance.get('/entreprises');

// Appel POST
const result = await axiosInstance.post('/auth/login', {
  email: 'user@example.com',
  motdepasse: 'password'
});

// Alternative: utiliser apiClient (Object.assign)
import apiClient from '../services/api';
const response2 = await apiClient.get('/entreprises');`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">3. Configuration personnalisée:</h4>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`// Dans .env
REACT_APP_AGENT_API_URL=http://localhost:8080/api/v1
REACT_APP_API_TIMEOUT=30000
REACT_APP_DEBUG_API=true

// Dans le code
import { API_CONFIG, buildApiUrl } from '../config/api.config';

const customUrl = buildApiUrl('/custom-endpoint');
console.log('Timeout configuré:', API_CONFIG.TIMEOUT);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiUsageExample;





















