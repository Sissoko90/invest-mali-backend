import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AutorisationExerciceManager from './AutorisationExerciceManager';
import {
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface AutorisationExercicePageProps {
  entrepriseId?: string;
}

const AutorisationExercicePage: React.FC<AutorisationExercicePageProps> = ({
  entrepriseId
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentEntrepriseId, setCurrentEntrepriseId] = useState<string | undefined>(entrepriseId);
  const [mode, setMode] = useState<'selection' | 'creation' | 'suivi'>('selection');

  useEffect(() => {
    // Récupérer l'ID d'entreprise depuis les paramètres de l'URL ou le state
    const searchParams = new URLSearchParams(location.search);
    const urlEntrepriseId = searchParams.get('entrepriseId');
    const stateEntrepriseId = location.state?.entrepriseId;
    
    if (urlEntrepriseId) {
      setCurrentEntrepriseId(urlEntrepriseId);
    } else if (stateEntrepriseId) {
      setCurrentEntrepriseId(stateEntrepriseId);
    }

    // Déterminer le mode initial
    const urlMode = searchParams.get('mode') as 'selection' | 'creation' | 'suivi';
    if (urlMode) {
      setMode(urlMode);
    }
  }, [location]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleModeChange = (newMode: 'selection' | 'creation' | 'suivi') => {
    setMode(newMode);
    
    // Mettre à jour l'URL
    const searchParams = new URLSearchParams();
    if (currentEntrepriseId) {
      searchParams.set('entrepriseId', currentEntrepriseId);
    }
    searchParams.set('mode', newMode);
    navigate(`/autorisation-exercice?${searchParams.toString()}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-investmali-primary via-investmali-primary to-investmali-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Autorisation d'Exercice
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Obtenez votre autorisation d'exercice avec nos nouveaux workflows simplifiés : 
              Agrément, Décision ou Enregistrement
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Retour au tableau de bord</span>
            </button>

            <nav className="flex items-center space-x-4">
              <button
                onClick={() => handleModeChange('selection')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'selection'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Sélection
              </button>
              <button
                onClick={() => handleModeChange('creation')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'creation'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                disabled={!currentEntrepriseId}
              >
                Création
              </button>
              <button
                onClick={() => handleModeChange('suivi')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'suivi'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                disabled={!currentEntrepriseId}
              >
                Suivi
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processus Simplifié</h3>
            <p className="text-gray-600 text-sm">
              Trois types de demandes adaptés à votre activité avec des workflows optimisés
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <ClockIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Suivi en Temps Réel</h3>
            <p className="text-gray-600 text-sm">
              Suivez l'avancement de votre demande à chaque étape du processus
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <BuildingOfficeIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Validation Officielle</h3>
            <p className="text-gray-600 text-sm">
              Obtenez une autorisation reconnue par les autorités compétentes
            </p>
          </div>
        </div>

        {/* Informations sur l'entreprise */}
        {currentEntrepriseId && (
          <div className="bg-sky-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-3">
              <InformationCircleIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">Entreprise sélectionnée</h4>
                <p className="text-blue-800 text-sm">ID: {currentEntrepriseId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message si pas d'entreprise sélectionnée */}
        {!currentEntrepriseId && mode !== 'selection' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-2">
                  Demande d'autorisation d'exercice
                </h4>
                <p className="text-yellow-800 text-sm mb-4">
                  Vous pouvez maintenant faire une demande d'autorisation d'exercice indépendante, 
                  sans passer par la création d'entreprise.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/demande-autorisation')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Créer une demande
                  </button>
                  <button
                    onClick={() => navigate('/my-applications')}
                    className="px-4 py-2 bg-white text-yellow-700 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors text-sm font-medium"
                  >
                    Mes entreprises
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composant principal */}
      <AutorisationExerciceManager
        entrepriseId={currentEntrepriseId}
        mode={mode}
        onBack={handleBack}
      />

      {/* Section d'aide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Besoin d'aide ?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Types de demandes
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Agrément</div>
                    <div className="text-sm text-gray-600">
                      Pour les activités nécessitant une validation présidentielle
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Décision</div>
                    <div className="text-sm text-gray-600">
                      Pour les activités réglementées nécessitant une validation ministérielle
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">Enregistrement</div>
                    <div className="text-sm text-gray-600">
                      Pour les activités nécessitant seulement un enregistrement simple
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact et support
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>Email :</strong> support@investmali.gov.ml
                </p>
                <p>
                  <strong>Téléphone :</strong> +223 20 22 XX XX
                </p>
                <p>
                  <strong>Heures d'ouverture :</strong><br />
                  Lundi - Vendredi : 8h00 - 17h00<br />
                  Samedi : 8h00 - 12h00
                </p>
                <p className="text-blue-600">
                  <strong>Assistance en ligne disponible 24h/7j</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AutorisationExercicePage;
