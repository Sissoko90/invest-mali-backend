import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import AnimatedBackground from './AnimatedBackground';

const AgentLogin: React.FC = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAgentAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        navigate('/agent/dashboard');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          {/* Header */}
          <div className="text-center animate-slide-up">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-mali-emerald to-mali-gold p-4 rounded-2xl shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-mali-dark">
              Espace Agent InvestMali
            </h2>
            <p className="mt-2 text-gray-600">
              Connectez-vous pour accéder au système de validation
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email professionnel
                </label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                  placeholder="votre.nom@investmali.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-mali-emerald to-mali-gold text-white py-3 px-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Comptes de démonstration :</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <strong>Validateur :</strong> marie.traore@investmali.com / agent123
                </div>
                <div>
                  <strong>Superviseur :</strong> ibrahim.kone@investmali.com / supervisor123
                </div>
                <div>
                  <strong>Admin :</strong> admin@investmali.com / admin123
                </div>
              </div>
            </div>
          </div>

          {/* Back to main site */}
          <div className="text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
            <button
              onClick={() => navigate('/')}
              className="text-mali-emerald hover:text-mali-gold transition-colors duration-300 text-sm font-medium"
            >
              ← Retour au site principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;
