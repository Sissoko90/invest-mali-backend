import React, { useState, useEffect } from 'react';
import AnimatedBackground from './AnimatedBackground';

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  estimatedDuration: string;
  completedAt?: string;
  details?: string;
}

interface BusinessTrackingData {
  applicationId: string;
  companyName: string;
  submittedAt: string;
  currentStep: string;
  overallProgress: number;
  estimatedCompletion: string;
  steps: TrackingStep[];
}

const BusinessTracking: React.FC = () => {
  const [trackingData, setTrackingData] = useState<BusinessTrackingData>({
    applicationId: "INV-2025-001234",
    companyName: "Ma Nouvelle Entreprise SARL",
    submittedAt: "2025-01-10T10:30:00Z",
    currentStep: "document-review",
    overallProgress: 45,
    estimatedCompletion: "2025-01-17",
    steps: [
      {
        id: "payment-confirmation",
        title: "Confirmation du Paiement",
        description: "Vérification et validation du paiement reçu",
        status: "completed",
        estimatedDuration: "Immédiat",
        completedAt: "2025-01-10T10:32:00Z",
        details: "Paiement de 40 000 FCFA confirmé via Orange Money"
      },
      {
        id: "document-review",
        title: "Vérification des Documents",
        description: "Contrôle de conformité de tous les documents fournis",
        status: "in-progress",
        estimatedDuration: "1-2 jours",
        details: "Vérification en cours des pièces d'identité et documents officiels"
      },
      {
        id: "statutes-drafting",
        title: "Rédaction des Statuts",
        description: "Préparation des statuts selon la législation malienne",
        status: "pending",
        estimatedDuration: "2-3 jours",
        details: "Démarrera après validation des documents"
      },
      {
        id: "legal-registration",
        title: "Immatriculation Légale",
        description: "Dépôt officiel au Registre du Commerce et du Crédit Mobilier",
        status: "pending",
        estimatedDuration: "3-5 jours",
        details: "Procédures administratives auprès des autorités compétentes"
      },
      {
        id: "tax-registration",
        title: "Enregistrement Fiscal",
        description: "Obtention du Numéro d'Identification Fiscale (NIF)",
        status: "pending",
        estimatedDuration: "1-2 jours",
        details: "Inscription auprès de la Direction Générale des Impôts"
      },
      {
        id: "final-documents",
        title: "Remise des Documents",
        description: "Préparation et envoi des documents officiels finaux",
        status: "pending",
        estimatedDuration: "1 jour",
        details: "Certificat d'immatriculation, statuts signés, et autres documents"
      }
    ]
  });

  // Simulation de mise à jour en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setTrackingData(prev => {
        const newData = { ...prev };
        
        // Simulation de progression
        if (newData.overallProgress < 100) {
          newData.overallProgress = Math.min(100, newData.overallProgress + Math.random() * 2);
        }
        
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: TrackingStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'in-progress':
        return (
          <div className="w-8 h-8 bg-mali-emerald rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        );
    }
  };

  const getStatusColor = (status: TrackingStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-mali-emerald';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-light via-white to-mali-emerald/5 relative overflow-hidden">
      <AnimatedBackground variant="minimal" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-mali-dark">Suivi de Création d'Entreprise</h1>
                <p className="text-gray-600 mt-1">Suivez en temps réel l'avancement de votre demande</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Numéro de dossier</div>
                <div className="text-lg font-bold text-mali-emerald">{trackingData.applicationId}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Progress Overview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
                <h2 className="text-xl font-semibold text-mali-dark mb-4">Vue d'Ensemble</h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression globale</span>
                      <span>{Math.round(trackingData.overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-mali-emerald to-mali-gold h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${trackingData.overallProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entreprise :</span>
                        <span className="font-medium text-mali-dark">{trackingData.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Soumis le :</span>
                        <span className="font-medium text-mali-dark">{formatDate(trackingData.submittedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fin estimée :</span>
                        <span className="font-medium text-mali-emerald">{new Date(trackingData.estimatedCompletion).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-mali-emerald/10 to-mali-gold/10 p-4 rounded-xl border border-mali-emerald/20">
                    <div className="flex items-center space-x-3">
                      <div className="bg-mali-emerald text-white rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-mali-dark">Étape actuelle</div>
                        <div className="text-sm text-gray-600">
                          {trackingData.steps.find(step => step.status === 'in-progress')?.title || 'En cours...'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <h3 className="text-lg font-semibold text-mali-dark mb-4">Besoin d'Aide ?</h3>
                <div className="space-y-3">
                  <button className="w-full bg-mali-emerald text-white py-3 px-4 rounded-xl hover:bg-mali-emerald/90 transition-colors flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                    <span>Chat Support</span>
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+223 XX XX XX XX</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <h2 className="text-xl font-semibold text-mali-dark mb-6">Étapes de Traitement</h2>
                
                <div className="space-y-6">
                  {trackingData.steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Connector line */}
                      {index < trackingData.steps.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {getStatusIcon(step.status)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-medium ${getStatusColor(step.status)}`}>
                              {step.title}
                            </h3>
                            <span className="text-sm text-gray-500">{step.estimatedDuration}</span>
                          </div>
                          
                          <p className="text-gray-600 mb-2">{step.description}</p>
                          
                          {step.details && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                              {step.details}
                            </div>
                          )}
                          
                          {step.completedAt && (
                            <div className="mt-2 text-sm text-green-600">
                              ✓ Complété le {formatDate(step.completedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessTracking;
