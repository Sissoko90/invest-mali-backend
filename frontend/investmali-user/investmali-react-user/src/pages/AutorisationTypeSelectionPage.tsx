import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  XMarkIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AutorisationTypeSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAgrementModal, setShowAgrementModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  const handleCardClick = (type: string) => {
    switch (type) {
      case 'agrement':
        setShowAgrementModal(true);
        break;
      case 'enregistrement':
        // TODO: Navigate to enregistrement page when implemented
        console.log('Enregistrement selected - not implemented yet');
        break;
      case 'decision':
        setShowDecisionModal(true);
        break;
      default:
        break;
    }
  };

  const handleAgrementTypeSelect = (type: string) => {
    setShowAgrementModal(false);
    switch (type) {
      case 'nouvelle':
        navigate('/autorisation-exercice/agrement');
        break;
      case 'extension':
        // TODO: Navigate to extension page when implemented
        console.log('Extension selected - not implemented yet');
        break;
      case 'transfert':
        // TODO: Navigate to transfert page when implemented
        console.log('Transfert selected - not implemented yet');
        break;
      case 'modification':
        // TODO: Navigate to modification page when implemented
        console.log('Modification selected - not implemented yet');
        break;
      case 'prorogation':
        // TODO: Navigate to prorogation page when implemented
        console.log('Prorogation selected - not implemented yet');
        break;
      default:
        break;
    }
  };

  const handleDecisionTypeSelect = (type: string) => {
    setShowDecisionModal(false);
    switch (type) {
      case 'nouvelle':
        // TODO: Navigate to decision nouvelle page when implemented
        console.log('Decision nouvelle selected - not implemented yet');
        break;
      case 'modification':
        // TODO: Navigate to decision modification page when implemented
        console.log('Decision modification selected - not implemented yet');
        break;
      case 'transfert':
        // TODO: Navigate to decision transfert page when implemented
        console.log('Decision transfert selected - not implemented yet');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent text-white py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
            Autorisation d'Exercice
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
            Obtenez votre autorisation d'exercice au Mali en toute simplicité. Choisissez le type d'autorisation adapté à votre activité et bénéficiez de notre accompagnement personnalisé dans vos démarches administratives.
          </p>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Types d'Autorisation d'Exercice
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choisissez le type d'autorisation dont vous avez besoin pour exercer votre activité au Mali
          </p>
        </div>

        {/* Authorization Type Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Agréments au Code des Investissements */}
          <div 
            onClick={() => handleCardClick('agrement')}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
          >
            <div className="text-center">
              <div className="bg-investmali-primary/10 rounded-full p-6 w-20 h-20 mx-auto mb-6 group-hover:bg-investmali-primary/20 transition-colors">
                <DocumentTextIcon className="h-8 w-8 text-investmali-primary mx-auto" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Les agréments au Code des Investissements
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Obtenez votre agrément pour bénéficier des avantages du Code des Investissements du Mali. 
                Idéal pour les projets d'investissement de grande envergure.
              </p>
              
              <div className="bg-investmali-primary/5 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-investmali-primary mb-2">Avantages inclus :</h4>
                <ul className="text-sm text-investmali-primary/80 space-y-1">
                  <li>• Exonérations fiscales</li>
                  <li>• Facilités douanières</li>
                  <li>• Régimes préférentiels</li>
                  <li>• Support institutionnel</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                Commencer la demande
                <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Les enregistrements */}
          <div 
            onClick={() => handleCardClick('enregistrement')}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
          >
            <div className="text-center">
              <div className="bg-investmali-accent/10 rounded-full p-6 w-20 h-20 mx-auto mb-6 group-hover:bg-investmali-accent/20 transition-colors">
                <ClipboardDocumentListIcon className="h-8 w-8 text-investmali-accent mx-auto" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Les enregistrements
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Procédure simplifiée d'enregistrement pour les activités commerciales standard. 
                Processus rapide et efficace pour démarrer votre activité.
              </p>
              
              <div className="bg-investmali-accent/5 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-investmali-accent mb-2">Caractéristiques :</h4>
                <ul className="text-sm text-investmali-accent/80 space-y-1">
                  <li>• Procédure simplifiée</li>
                  <li>• Délais réduits</li>
                  <li>• Coûts optimisés</li>
                  <li>• Formalités allégées</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-center text-investmali-accent font-semibold group-hover:text-investmali-accent/90">
                Bientôt disponible
                <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Les décisions */}
          <div 
            onClick={() => handleCardClick('decision')}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
          >
            <div className="text-center">
              <div className="bg-investmali-warning/10 rounded-full p-6 w-20 h-20 mx-auto mb-6 group-hover:bg-investmali-warning/20 transition-colors">
                <ShieldCheckIcon className="h-8 w-8 text-investmali-warning mx-auto" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Les décisions
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Demandes de décisions administratives spécifiques pour des cas particuliers 
                ou des situations nécessitant une validation officielle.
              </p>
              
              <div className="bg-investmali-warning/5 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-investmali-warning mb-2">Applications :</h4>
                <ul className="text-sm text-investmali-warning/80 space-y-1">
                  <li>• Cas spéciaux</li>
                  <li>• Validations officielles</li>
                  <li>• Décisions sur mesure</li>
                  <li>• Situations particulières</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-center text-investmali-warning font-semibold group-hover:text-investmali-warning/90">
                Bientôt disponible
                <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-gradient-to-r from-investmali-primary/5 to-investmali-accent/5 rounded-2xl p-8 border border-investmali-primary/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'aide pour choisir ?
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Notre équipe d'experts est là pour vous accompagner dans le choix du type d'autorisation 
              le plus adapté à votre projet d'investissement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-6 py-3 bg-investmali-primary text-white rounded-lg hover:bg-investmali-primary/90 transition-colors font-semibold">
                Contacter un conseiller
              </button>
              <button className="inline-flex items-center px-6 py-3 bg-white text-investmali-primary border border-investmali-primary rounded-lg hover:bg-investmali-primary/5 transition-colors font-semibold">
                Consulter la documentation
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Agrement Types */}
      {showAgrementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Types de demandes d'agrément
                </h2>
                <button
                  onClick={() => setShowAgrementModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Choisissez le type de demande d'agrément qui correspond à votre situation
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Demande de nouvelle activité */}
                <div 
                  onClick={() => handleAgrementTypeSelect('nouvelle')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <PlusIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande de nouvelle activité
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Pour une nouvelle activité d'investissement
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Commencer
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Demande d'extension */}
                <div 
                  onClick={() => handleAgrementTypeSelect('extension')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <ArrowsPointingOutIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande d'extension
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Extension d'une activité existante
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Bientôt disponible
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Demande de transfert de site */}
                <div 
                  onClick={() => handleAgrementTypeSelect('transfert')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <ArrowPathIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande de transfert de site
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Transfert vers un nouveau site
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Bientôt disponible
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Demande de modification */}
                <div 
                  onClick={() => handleAgrementTypeSelect('modification')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <PencilSquareIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande de modification
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Modification d'un agrément existant
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Bientôt disponible
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Demande de prorogation */}
                <div 
                  onClick={() => handleAgrementTypeSelect('prorogation')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <ClockIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande de prorogation
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Prolongation d'un agrément existant
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Bientôt disponible
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-investmali-primary/5 rounded-lg border border-investmali-primary/20">
                <h4 className="font-semibold text-investmali-primary mb-2">Information importante</h4>
                <p className="text-sm text-investmali-primary/80">
                  Actuellement, seules les demandes de nouvelle activité sont disponibles. 
                  Les autres types de demandes seront bientôt accessibles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Decision Types */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Types de demandes de décision
                </h2>
                <button
                  onClick={() => setShowDecisionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Choisissez le type de demande de décision qui correspond à votre situation
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Demande de nouvelle activité */}
                <div 
                  onClick={() => handleDecisionTypeSelect('nouvelle')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <PlusIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande de nouvelle activité
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Décision pour une nouvelle activité
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Bientôt disponible
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Demande de modification */}
                <div 
                  onClick={() => handleDecisionTypeSelect('modification')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <PencilSquareIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande de modification
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Modification d'une décision existante
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Bientôt disponible
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Demande de transfert de site */}
                <div 
                  onClick={() => handleDecisionTypeSelect('transfert')}
                  className="bg-gradient-to-br from-investmali-primary/5 to-investmali-primary/10 border border-investmali-primary/20 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group opacity-75"
                >
                  <div className="text-center">
                    <div className="bg-investmali-primary rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-investmali-primary/90 transition-colors">
                      <ArrowPathIcon className="h-8 w-8 text-white mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Demande de transfert de site
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Transfert de décision vers un nouveau site
                    </p>
                    <div className="flex items-center justify-center text-investmali-primary font-semibold group-hover:text-investmali-primary/90">
                      Bientôt disponible
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-investmali-primary/5 rounded-lg border border-investmali-primary/20">
                <h4 className="font-semibold text-investmali-primary mb-2">Information importante</h4>
                <p className="text-sm text-investmali-primary/80">
                  Les demandes de décision seront bientôt disponibles. 
                  Cette fonctionnalité est en cours de développement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AutorisationTypeSelectionPage;
