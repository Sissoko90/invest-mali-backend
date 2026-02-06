import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import DemandeAutorisationForm from './DemandeAutorisationForm';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const DemandeAutorisationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const handleStartDemande = () => {
    setShowForm(true);
  };

  const handleCancelDemande = () => {
    setShowForm(false);
  };

  const handleSubmitDemande = (demande: any) => {
    console.log('Demande soumise:', demande);
    // Optionnel: rediriger vers une page de confirmation ou de suivi
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <DemandeAutorisationForm
            onSubmit={handleSubmitDemande}
            onCancel={handleCancelDemande}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-investmali-primary via-investmali-accent to-investmali-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-6 text-white/70" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Demande de NINA
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              Obtenez votre autorisation d'exercice rapidement avec notre procédure simplifiée
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleStartDemande}
                className="bg-white text-investmali-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-investmali-primary/5 transition-colors shadow-lg"
              >
                Commencer ma demande
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Retour au tableau de bord</span>
          </button>
        </div>
      </div>

      {/* Information Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Avantages de la procédure indépendante */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pourquoi faire une demande indépendante ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Notre nouvelle procédure vous permet de faire une demande d'autorisation d'exercice 
            sans passer par la création d'entreprise, pour plus de flexibilité.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircleIcon className="w-12 h-12 text-investmali-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Processus Simplifié</h3>
            <p className="text-gray-600">
              Procédure dédiée et optimisée spécifiquement pour les demandes d'autorisation d'exercice
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <ClockIcon className="w-12 h-12 text-investmali-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Plus Rapide</h3>
            <p className="text-gray-600">
              Traitement accéléré sans les étapes de création d'entreprise
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <CurrencyDollarIcon className="w-12 h-12 text-investmali-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tarifs Transparents</h3>
            <p className="text-gray-600">
              Coûts clairs selon le type d'autorisation demandée
            </p>
          </div>
        </div>

        {/* Types de demandes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Types d'autorisations disponibles
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-investmali-primary/20 rounded-lg p-6 bg-investmali-primary/5">
              <h3 className="text-lg font-semibold text-investmali-primary mb-3">
                Demande d'Agrément
              </h3>
              <div className="space-y-2 text-sm text-investmali-primary/80 mb-4">
                <p><strong>Montant :</strong> 300 000 FCFA</p>
                <p><strong>Délai :</strong> 60-90 jours</p>
                <p><strong>Validation :</strong> Présidentielle</p>
              </div>
              <p className="text-investmali-primary/70 text-sm">
                Pour les activités nécessitant un agrément officiel avec validation présidentielle
              </p>
            </div>

            <div className="border border-investmali-warning/20 rounded-lg p-6 bg-investmali-warning/5">
              <h3 className="text-lg font-semibold text-investmali-warning mb-3">
                Demande de Décision
              </h3>
              <div className="space-y-2 text-sm text-investmali-warning/80 mb-4">
                <p><strong>Montant :</strong> 150 000 FCFA</p>
                <p><strong>Délai :</strong> 30-45 jours</p>
                <p><strong>Validation :</strong> MIC/SGG</p>
              </div>
              <p className="text-investmali-warning/70 text-sm">
                Pour les activités réglementées nécessitant une validation ministérielle
              </p>
            </div>

            <div className="border border-investmali-accent/20 rounded-lg p-6 bg-investmali-accent/5">
              <h3 className="text-lg font-semibold text-investmali-accent mb-3">
                Enregistrement Simple
              </h3>
              <div className="space-y-2 text-sm text-investmali-accent/80 mb-4">
                <p><strong>Montant :</strong> 50 000 FCFA</p>
                <p><strong>Délai :</strong> 5-10 jours</p>
                <p><strong>Validation :</strong> Directe</p>
              </div>
              <p className="text-investmali-accent/70 text-sm">
                Pour les activités nécessitant seulement un enregistrement simple
              </p>
            </div>
          </div>
        </div>

        {/* Processus */}
        <div className="bg-gray-50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Comment ça marche ?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-investmali-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choisir le type</h3>
              <p className="text-gray-600 text-sm">
                Sélectionnez le type d'autorisation adapté à votre activité
              </p>
            </div>

            <div className="text-center">
              <div className="bg-investmali-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Remplir le formulaire</h3>
              <p className="text-gray-600 text-sm">
                Complétez les informations sur vous et votre activité
              </p>
            </div>

            <div className="text-center">
              <div className="bg-investmali-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Soumettre</h3>
              <p className="text-gray-600 text-sm">
                Envoyez votre demande et recevez un numéro de suivi
              </p>
            </div>

            <div className="text-center">
              <div className="bg-investmali-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Suivre</h3>
              <p className="text-gray-600 text-sm">
                Suivez l'avancement de votre demande en temps réel
              </p>
            </div>
          </div>
        </div>

        {/* Documents requis */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Documents généralement requis
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents de base</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Certificat d'incorporation de l'entreprise</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>CV détaillé du dirigeant</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Justificatif de domicile</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents supplémentaires</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Statuts de l'entreprise (selon le type)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Attestation bancaire (pour agrément)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Plan d'affaires (pour agrément)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à commencer votre demande ?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Notre formulaire guidé vous accompagne étape par étape pour créer votre demande 
              d'autorisation d'exercice en quelques minutes.
            </p>
            <button
              onClick={handleStartDemande}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Commencer maintenant
            </button>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="mt-16 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">
                Besoin d'aide ?
              </h4>
              <p className="text-yellow-800 text-sm mb-3">
                Notre équipe est disponible pour vous accompagner dans votre demande d'autorisation d'exercice.
              </p>
              <div className="text-yellow-800 text-sm space-y-1">
                <p><strong>Email :</strong> support@investmali.gov.ml</p>
                <p><strong>Téléphone :</strong> +223 20 22 XX XX</p>
                <p><strong>Heures d'ouverture :</strong> Lundi - Vendredi : 8h00 - 17h00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DemandeAutorisationPage;
