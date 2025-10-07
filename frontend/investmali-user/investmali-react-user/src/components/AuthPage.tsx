import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from './AnimatedBackground';
import PhoneInput from './PhoneInput';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer la page d'origine ou rediriger vers la page de demande par défaut
  const from = (location.state as any)?.from?.pathname || '/demande';

  // Gérer les messages de redirection depuis l'inscription
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      setActiveTab('login');
      
      // Pré-remplir l'email si fourni
      if (location.state.email) {
        setLoginData(prev => ({ ...prev, email: location.state.email }));
      }
      
      // Nettoyer le state pour éviter de réafficher le message
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state]);

  // États pour le formulaire de connexion
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // États pour le formulaire d'inscription
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    civility: '',
    sexe: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleCivilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const civilityValue = e.target.value;
    let autoSexe = '';
    
    // Logique de cohérence automatique civilité/sexe
    if (civilityValue === 'MONSIEUR') {
      autoSexe = 'MASCULIN';
    } else if (civilityValue === 'MADAME' || civilityValue === 'MADEMOISELLE') {
      autoSexe = 'FEMININ';
    }
    
    setRegisterData(prev => ({
      ...prev,
      civility: civilityValue,
      sexe: autoSexe
    }));
  };

  const handleSexeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sexeValue = e.target.value;
    let autoCivility = '';
    
    // Logique de cohérence automatique sexe/civilité
    if (sexeValue === 'MASCULIN') {
      autoCivility = 'MONSIEUR';
    } else if (sexeValue === 'FEMININ') {
      // Par défaut Madame pour féminin, l'utilisateur peut changer vers Mademoiselle
      autoCivility = 'MADAME';
    }
    
    setRegisterData(prev => ({
      ...prev,
      sexe: sexeValue,
      civility: autoCivility
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        setSuccess('Connexion réussie ! Redirection...');
        setTimeout(() => navigate(from, { replace: true }), 1500);
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validation des mots de passe
    if (registerData.password !== registerData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }
    
    if (registerData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }
    
    // Validation des champs civilité et sexe
    if (!registerData.civility) {
      setError('La civilité est obligatoire');
      setIsLoading(false);
      return;
    }
    
    if (!registerData.sexe) {
      setError('Le sexe est obligatoire');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        civility: registerData.civility,
        sexe: registerData.sexe,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password
      });
      
      if (result.success) {
        // Inscription réussie, basculer vers l'onglet connexion avec message
        setActiveTab('login');
        setSuccess('Inscription réussie ! Veuillez vous connecter avec vos identifiants.');
        setLoginData(prev => ({ ...prev, email: registerData.email })); // Pré-remplir l'email
        setError('');
      } else {
        setError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div className="text-center animate-slide-up">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-mali-emerald to-mali-gold p-3 rounded-2xl shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-mali-dark">
              Créez votre entreprise au Mali
            </h2>
            <p className="mt-2 text-gray-600">
              Connectez-vous ou créez un compte pour commencer
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'login'
                    ? 'bg-white text-mali-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'register'
                    ? 'bg-white text-mali-dark shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Messages d'erreur et de succès */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-fade-in">
                {success}
              </div>
            )}

            {/* Formulaire de Connexion */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                    placeholder="votre@email.com"
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
            )}

            {/* Formulaire d'Inscription */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                      placeholder="Votre prénom"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      required
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                
                {/* Civilité et Sexe */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Civilité
                    </label>
                    <select
                      required
                      value={registerData.civility}
                      onChange={handleCivilityChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Sélectionnez votre civilité</option>
                      <option value="MONSIEUR">Monsieur</option>
                      <option value="MADAME">Madame</option>
                      <option value="MADEMOISELLE">Mademoiselle</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sexe
                    </label>
                    <select
                      required
                      value={registerData.sexe}
                      onChange={handleSexeChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Sélectionnez votre sexe</option>
                      <option value="MASCULIN">Masculin</option>
                      <option value="FEMININ">Féminin</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                    placeholder="votre@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <PhoneInput
                    value={registerData.phone}
                    onChange={(value) => setRegisterData({...registerData, phone: value})}
                    placeholder="XX XX XX XX"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
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
                      <span>Inscription...</span>
                    </div>
                  ) : (
                    'Créer mon compte'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Retour à l'accueil */}
          <div className="text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
            <button
              onClick={() => navigate('/')}
              className="text-mali-emerald hover:text-mali-gold transition-colors duration-300 text-sm font-medium"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
