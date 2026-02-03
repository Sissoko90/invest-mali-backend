import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
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
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [conflictData, setConflictData] = useState<any>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

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
    setDuplicateWarning('');

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
      // ÉTAPE 1: Vérifier les doublons avant inscription
      const duplicateCheck = await authAPI.checkDuplicate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      });

      if (duplicateCheck.success && duplicateCheck.data) {
        const checkResult = duplicateCheck.data;
        
        // CAS 1: Conflit critique - Blocage total
        if (checkResult.conflictResolutionRequired === 'BLOCKED_CONTACT_SUPPORT') {
          setError(checkResult.message);
          setConflictData(checkResult);
          setShowConflictModal(true);
          return;
        }
        
        // CAS 2: Compte existe déjà
        if (checkResult.conflictResolutionRequired === 'ACCOUNT_EXISTS') {
          setError(checkResult.message);
          return;
        }
        
        // CAS 3: Conflit modéré - Demander confirmation
        if (checkResult.conflictResolutionRequired === 'CONFIRM_AND_UPDATE') {
          setDuplicateWarning(checkResult.message);
          setConflictData(checkResult);
          setShowConflictModal(true);
          return;
        }
        
        // CAS 4 & 5: Fusion automatique - Afficher info mais continuer
        if (checkResult.conflictResolutionRequired === 'AUTO_MERGE_WITH_UPDATE' || 
            checkResult.conflictResolutionRequired === 'AUTO_MERGE') {
          setDuplicateWarning(checkResult.message);
        }
      }

      // ÉTAPE 2: Procéder à l'inscription
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
        navigate('/auth', { 
          state: { 
            message: 'Inscription réussie ! Veuillez vous connecter avec vos identifiants.',
            email: formData.email
          } 
        });
      } else {
        setError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    }
  };

  const handleConfirmMerge = async () => {
    setShowConflictModal(false);
    setDuplicateWarning('');
    
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
        navigate('/auth', { 
          state: { 
            message: 'Inscription réussie ! Votre compte a été mis à jour. Veuillez vous connecter.',
            email: formData.email
          } 
        });
      } else {
        setError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    }
  };

  const handleCancelMerge = () => {
    setShowConflictModal(false);
    setDuplicateWarning('');
    setConflictData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground variant="subtle" />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-investmali-accent to-investmali-accent/80 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">IM</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-investmali-neutral-dark">
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
              <h3 className="text-lg font-semibold text-investmali-neutral-dark mb-4">Informations personnelles</h3>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
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
              <h3 className="text-lg font-semibold text-investmali-neutral-dark mb-4">Informations entreprise</h3>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
                    placeholder="Mot de passe sécurisé"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-investmali-accent transition-colors duration-300"
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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50"
                    placeholder="Confirmez votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-investmali-accent transition-colors duration-300"
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
                  className="w-4 h-4 text-investmali-accent bg-gray-100 border-gray-300 rounded focus:ring-mali-emerald focus:ring-2"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-gray-700">
                  J'accepte les{' '}
                  <a href="#" className="text-investmali-accent hover:text-investmali-accent/80 font-medium">
                    conditions d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-investmali-accent hover:text-investmali-accent/80 font-medium">
                    politique de confidentialité
                  </a>
                </label>
              </div>
            </div>

            {/* Warning message */}
            {duplicateWarning && !error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">{duplicateWarning}</p>
                  </div>
                </div>
              </div>
            )}

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
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-investmali-accent to-investmali-accent/90 hover:from-investmali-accent/90 hover:to-investmali-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <Link to="/login" className="font-medium text-investmali-accent hover:text-investmali-accent/80 transition-colors duration-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* Modal de confirmation de conflit */}
      {showConflictModal && conflictData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                {conflictData.conflictResolutionRequired === 'BLOCKED_CONTACT_SUPPORT' ? (
                  <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {conflictData.conflictResolutionRequired === 'BLOCKED_CONTACT_SUPPORT' 
                    ? 'Inscription bloquée' 
                    : 'Compte existant détecté'}
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {conflictData.message}
                </p>
                {conflictData.existingNom && conflictData.existingPrenom && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Informations existantes:</p>
                    <p className="text-sm font-medium text-gray-700">
                      {conflictData.existingPrenom} {conflictData.existingNom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conflictData.existingTelephone}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              {conflictData.conflictResolutionRequired === 'BLOCKED_CONTACT_SUPPORT' ? (
                <button
                  onClick={handleCancelMerge}
                  className="flex-1 px-4 py-3 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent/90 transition-colors font-medium"
                >
                  Compris
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelMerge}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmMerge}
                    className="flex-1 px-4 py-3 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent/90 transition-colors font-medium"
                  >
                    Confirmer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;

