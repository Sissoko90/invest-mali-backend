import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import AnimatedBackground from './AnimatedBackground';
import { LockClosedIcon, EnvelopeIcon, EyeIcon, EyeSlashIcon, PhoneIcon } from '@heroicons/react/24/outline';

const AgentLogin: React.FC = () => {
  const [loginType, setLoginType] = useState<'email' | 'telephone'>('email');
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isAuthenticated, isLoading: authLoading, agent } = useAgentAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated (disabled - redirection handled in handleLogin)
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate('/dossier', { replace: true });
  //   }
  // }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Field validation
    if (!loginData.identifier.trim() || !loginData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    // Validation selon le type de login
    if (loginType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginData.identifier)) {
        setError('Veuillez entrer une adresse e-mail valide');
        return;
      }
    } else {
      // Validation du téléphone (format malien ou international)
      const phoneRegex = /^(\+223|00223)?[0-9]{8}$/;
      const cleanPhone = loginData.identifier.replace(/\s/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        setError('Veuillez entrer un numéro de téléphone valide (ex: 70123456 ou +22370123456)');
        return;
      }
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('[AgentLogin] Tentative de connexion pour:', loginData.identifier, 'type:', loginType);
      const result = await login(loginData.identifier, loginData.password, loginType);
      console.log('[AgentLogin] Résultat de connexion:', result);
      
      if (result.success) {
        setLoginData({ identifier: '', password: '' });
        
        // Logique de redirection intelligente basée sur le rôle
        let redirectPath = result.redirectUrl;
        
        if (!redirectPath) {
          // Utiliser l'agent retourné par login() au lieu du contexte
          const userRole = result.agent?.role;
          if (userRole === 'SUPER_ADMIN') {
            redirectPath = '/dashboard'; // Super Admin vers dashboard
          } else {
            redirectPath = '/dossier'; // Autres agents vers dossier
          }
          
          console.log('🚀 [AgentLogin] Redirection vers:', redirectPath);
          console.log('🚀 [AgentLogin] RedirectUrl du backend:', result.redirectUrl);
          console.log('🚀 [AgentLogin] Rôle de l\'agent:', userRole);
          console.log('🚀 [AgentLogin] Agent complet:', result.agent);
          console.log('🚀 [AgentLogin] Fallback utilisé:', !result.redirectUrl);
        } else {
          console.log('🚀 [AgentLogin] Redirection vers:', redirectPath);
          console.log('🚀 [AgentLogin] RedirectUrl du backend:', result.redirectUrl);
        }
        
        navigate(redirectPath, { replace: true });
      } else {
        console.error('[AgentLogin] Échec de connexion');
        setError('Identifiant ou mot de passe invalide');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Extract error message from the error object if available
      const errorMessage = err?.response?.data?.message || 
                         err?.message || 
                         "Une erreur s'est produite lors de la connexion. Veuillez réessayer.";
      setError(errorMessage);
      
      // Log the full error for debugging
      if (err?.response) {
        console.error('Login error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AnimatedBackground />
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl z-10">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Espace Agent
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous à votre compte agent
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Sélecteur de type de connexion */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginType('email');
                  setLoginData({ ...loginData, identifier: '' });
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'email'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                E-mail
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('telephone');
                  setLoginData({ ...loginData, identifier: '' });
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === 'telephone'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                Téléphone
              </button>
            </div>

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                {loginType === 'email' ? 'Adresse e-mail' : 'Numéro de téléphone'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginType === 'email' ? (
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type={loginType === 'email' ? 'email' : 'tel'}
                  autoComplete={loginType === 'email' ? 'email' : 'tel'}
                  required
                  className="focus:ring-sky-500 focus:border-sky-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder={loginType === 'email' ? 'vous@example.com' : '70 12 34 56'}
                  value={loginData.identifier}
                  onChange={(e) => setLoginData({...loginData, identifier: e.target.value})}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Se souvenir de moi
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </>
              ) : 'Se connecter'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>Vous n'avez pas de compte agent ? <Link to="/request-access" className="font-medium text-primary-600 hover:text-primary-500">Demander un accès</Link></p>
          <p className="mt-2">
            <Link to="/dashboard" className="font-medium text-sky-600 hover:text-sky-700">
              Accéder au Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;
























