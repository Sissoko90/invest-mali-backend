import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from './AnimatedBackground';
import PhoneInput from './PhoneInput';

const Register: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    civility: '',
    sexe: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    businessType: '',
    acceptTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleCivilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const civilityValue = e.target.value;
    let autoSexe = '';
    
    // Logique de cohérence automatique civilité/sexe
    if (civilityValue === 'MONSIEUR') {
      autoSexe = 'MASCULIN';
    } else if (civilityValue === 'MADAME' || civilityValue === 'MADEMOISELLE') {
      autoSexe = 'FEMININ';
    }
    
    setFormData(prev => ({
      ...prev,
      civility: civilityValue,
      sexe: autoSexe
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
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
    
    setFormData(prev => ({
      ...prev,
      sexe: sexeValue,
      civility: autoCivility
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        civility: formData.civility,
        sexe: formData.sexe,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      if (result.success) {
        // Rediriger vers la page de connexion avec un message de succès
        navigate('/auth', { 
          state: { 
            message: 'Inscription réussie ! Veuillez vous connecter avec vos identifiants.',
            email: formData.email // Pré-remplir l'email
          } 
        });
      } else {
        setError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground variant="subtle" />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-mali-emerald to-mali-emerald/80 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">IM</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-mali-dark">
            Créez votre compte
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez la plateforme #1 pour créer votre entreprise au Mali
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6 animate-slide-up" style={{animationDelay: '0.2s'}} onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-mali-dark mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              
              {/* Civilité et Sexe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="civility" className="block text-sm font-medium text-gray-700 mb-2">
                    Civilité *
                  </label>
                  <select
                    id="civility"
                    name="civility"
                    required
                    value={formData.civility}
                    onChange={handleCivilityChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                  >
                    <option value="">Sélectionnez votre civilité</option>
                    <option value="MONSIEUR">Monsieur</option>
                    <option value="MADAME">Madame</option>
                    <option value="MADEMOISELLE">Mademoiselle</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sexe" className="block text-sm font-medium text-gray-700 mb-2">
                    Sexe *
                  </label>
                  <select
                    id="sexe"
                    name="sexe"
                    required
                    value={formData.sexe}
                    onChange={handleSexeChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                  >
                    <option value="">Sélectionnez votre sexe</option>
                    <option value="MASCULIN">Masculin</option>
                    <option value="FEMININ">Féminin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  placeholder="XX XX XX XX"
                  required
                />
              </div>
            </div>

            {/* Informations entreprise */}
            <div>
              <h3 className="text-lg font-semibold text-mali-dark mb-4">Informations entreprise</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                    placeholder="Nom de votre entreprise"
                  />
                </div>
                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'activité *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                  >
                    <option value="">Sélectionnez votre secteur</option>
                    <option value="commerce">Commerce</option>
                    <option value="services">Services</option>
                    <option value="industrie">Industrie</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="technologie">Technologie</option>
                    <option value="transport">Transport</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                    placeholder="Mot de passe sécurisé"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-mali-emerald transition-colors duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                    placeholder="Confirmez votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-mali-emerald transition-colors duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  required
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-mali-emerald bg-gray-100 border-gray-300 rounded focus:ring-mali-emerald focus:ring-2"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-gray-700">
                  J'accepte les{' '}
                  <a href="#" className="text-mali-emerald hover:text-mali-emerald/80 font-medium">
                    conditions d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-mali-emerald hover:text-mali-emerald/80 font-medium">
                    politique de confidentialité
                  </a>
                </label>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-mali-emerald to-mali-emerald/90 hover:from-mali-emerald/90 hover:to-mali-emerald focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="relative z-10">
                {isLoading ? 'Création en cours...' : 'Créer mon compte'}
              </span>
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </form>

        {/* Login link */}
        <div className="text-center animate-fade-in" style={{animationDelay: '0.4s'}}>
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-medium text-mali-emerald hover:text-mali-emerald/80 transition-colors duration-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
