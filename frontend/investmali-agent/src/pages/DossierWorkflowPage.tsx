import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import DossierWorkflow from '../components/DossierWorkflow';
import { LogOut, Sun, Moon } from 'lucide-react';
<<<<<<< HEAD
import apiLogo from '../assets/logos/api-logo.png';
=======
>>>>>>> 060c2b6fa (WIP: local changes before rebase)

const DossierWorkflowPage: React.FC = () => {
  const { dossierId } = useParams<{ dossierId?: string }>();
  const { agent, logout } = useAgentAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/agent-login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header simplifié */}
      <header className="bg-sky-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center space-x-3">
<<<<<<< HEAD
              <img src={apiLogo} alt="API-MALI" className="w-10 h-10" />
=======
              <div className="w-10 h-10 bg-white text-sky-600 rounded-lg flex items-center justify-center font-bold">
                IM
              </div>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
              <div>
                <h1 className="text-lg font-semibold text-white">API-MALI</h1>
                <p className="text-sky-100 text-xs">Gestion des Dossiers</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Profil */}
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1.5">
                <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {(agent?.firstName?.[0] || 'A')}{(agent?.lastName?.[0] || 'G')}
                  </span>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">
                    {agent?.firstName || 'Agent'} {agent?.lastName || ''}
                  </p>
                  <p className="text-xs text-sky-200">
                    {agent?.role?.replace('AGENT_', '') || 'AGENT'}
                  </p>
                </div>
              </div>

              {/* Thème */}
<<<<<<< HEAD
              {/* <button 
=======
              <button 
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
<<<<<<< HEAD
              </button> */}
=======
              </button>
>>>>>>> 060c2b6fa (WIP: local changes before rebase)

              {/* Déconnexion */}
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-8xl mx-auto px-4 py-6 pl-24">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête de section */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">Tableau de Bord Agent</h2>
            <p className="text-sm text-slate-500">
              Bienvenue {agent?.firstName} {agent?.lastName}
            </p>
          </div>
          
          {/* Workflow */}
          <div className="p-6">
            <DossierWorkflow dossierId={dossierId} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DossierWorkflowPage;
























