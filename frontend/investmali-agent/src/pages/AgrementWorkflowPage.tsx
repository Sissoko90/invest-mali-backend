import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AgrementWorkflow from '../components/agrement/AgrementWorkflow';
import apiLogo from '../assets/logos/api-logo.png';

const AgrementWorkflowPage: React.FC = () => {
  const { agent, logout } = useAgentAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('🚪 [AgrementWorkflow] Déconnexion demandée');
    logout();
    navigate('/agent-login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplifié */}
      <header className="bg-sky-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo et titre */}
            <div className="flex items-center space-x-4">
              <img src={apiLogo} alt="API-MALI" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-white">API-MALI</h1>
                <p className="text-sky-100 text-sm">Module Agrément</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/dossier')}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
              >
                Création
              </button>
              
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {agent?.firstName || 'Agent'} {agent?.lastName || ''}
                  </p>
                  <p className="text-xs text-sky-200">
                    {agent?.role?.replace('AGENT_', '').replace('MINISTERE_', 'Min. ') || 'AGENT'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {(agent?.firstName?.[0] || 'A') + (agent?.lastName?.[0] || 'G')}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Workflow Agrément</h2>
                <p className="text-sm text-gray-500">Gestion des demandes d'autorisation d'exercice</p>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <AgrementWorkflow />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgrementWorkflowPage;
























