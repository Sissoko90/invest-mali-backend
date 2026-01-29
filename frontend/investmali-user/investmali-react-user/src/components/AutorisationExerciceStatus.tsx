import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface WorkflowStep {
  etape: string;
  libelle: string;
  responsable: string;
  statut: 'COMPLETE' | 'EN_COURS' | 'EN_ATTENTE' | 'REJETE';
  dateTraitement?: string;
  observations?: string;
  description?: string;
}

interface DemandeStatus {
  id: string;
  typedemande: string;
  libelle: string;
  montant: number;
  etapeActuelle: string;
  statut: string;
  dateCreation: string;
  delaiEstime?: string;
  progression: number;
  steps: WorkflowStep[];
}

interface AutorisationExerciceStatusProps {
  entrepriseId: string;
  onRefresh?: () => void;
}

const AutorisationExerciceStatus: React.FC<AutorisationExerciceStatusProps> = ({
  entrepriseId,
  onRefresh
}) => {
  const [demandes, setDemandes] = useState<DemandeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemande, setSelectedDemande] = useState<string | null>(null);

  useEffect(() => {
    if (entrepriseId) {
      loadDemandesStatus();
    }
  }, [entrepriseId]);

  const loadDemandesStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/autorisation-exercice/statut/${entrepriseId}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du statut');
      }
      
      const data = await response.json();
      
      // Convertir les données en format DemandeStatus
      const demande: DemandeStatus = {
        id: data.assignment?.id || 'unknown',
        typedemande: data.typedemande || 'AGREMENT',
        libelle: data.workflowInfo?.libelle || 'Demande d\'autorisation',
        montant: data.workflowInfo?.montant || 0,
        etapeActuelle: data.assignment?.etape || 'ACCUEIL',
        statut: data.assignment?.statut || 'EN_COURS',
        dateCreation: data.assignment?.dateAssignment || new Date().toISOString(),
        progression: calculateProgression(data.workflowInfo, data.assignment?.etape),
        steps: generateStepsFromWorkflowInfo(data.workflowInfo, data.assignment?.etape)
      };
      
      setDemandes([demande]);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement statut:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Fallback pour démonstration
      setDemandes([
        {
          id: 'demo-1',
          typedemande: 'AGREMENT',
          libelle: 'Demande d\'Agrément',
          montant: 300000,
          etapeActuelle: 'MIC_PREMIERE_VALIDATION',
          statut: 'EN_COURS',
          dateCreation: new Date().toISOString(),
          delaiEstime: '60-90 jours',
          progression: 25,
          steps: [
            {
              etape: 'ACCUEIL_AGREMENT_PAIEMENT',
              libelle: 'Accueil - Paiement',
              responsable: 'ACCUEIL',
              statut: 'COMPLETE',
              dateTraitement: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              description: 'Réception et vérification du dossier, paiement effectué'
            },
            {
              etape: 'MIC_PREMIERE_VALIDATION',
              libelle: 'MIC - Première Validation',
              responsable: 'MIC',
              statut: 'EN_COURS',
              description: 'Examen technique par le Ministère de l\'Industrie et du Commerce'
            },
            {
              etape: 'MINISTERE_FINANCES',
              libelle: 'Ministère des Finances',
              responsable: 'MINISTERE_FINANCES',
              statut: 'EN_ATTENTE',
              description: 'Validation financière et fiscale'
            },
            {
              etape: 'SGG_PREMIERE_VALIDATION',
              libelle: 'SGG - Première Validation',
              responsable: 'SGG',
              statut: 'EN_ATTENTE',
              description: 'Examen par le Secrétariat Général du Gouvernement'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgression = (workflowInfo: any, etapeActuelle: string): number => {
    if (!workflowInfo || !etapeActuelle) return 0;
    
    const totalSteps = workflowInfo.totalSteps || 8;
    const stepMappings = getStepMappings(workflowInfo.type || 'AGREMENT');
    const currentIndex = stepMappings.findIndex(s => s.etape === etapeActuelle);
    
    return currentIndex >= 0 ? Math.round((currentIndex / totalSteps) * 100) : 0;
  };

  const generateStepsFromWorkflowInfo = (workflowInfo: any, etapeActuelle: string): WorkflowStep[] => {
    const stepMappings = getStepMappings(workflowInfo?.type || 'AGREMENT');
    
    return stepMappings.map((mapping, index) => ({
      etape: mapping.etape,
      libelle: mapping.libelle,
      responsable: mapping.responsable,
      statut: getStepStatus(mapping.etape, etapeActuelle, index, stepMappings),
      description: mapping.description
    }));
  };

  const getStepMappings = (type: string) => {
    switch (type) {
      case 'AGREMENT':
        return [
          { etape: 'ACCUEIL_AGREMENT_PAIEMENT', libelle: 'Accueil - Paiement', responsable: 'ACCUEIL', description: 'Réception et vérification du dossier' },
          { etape: 'MIC_PREMIERE_VALIDATION', libelle: 'MIC - Première Validation', responsable: 'MIC', description: 'Examen technique ministériel' },
          { etape: 'MINISTERE_FINANCES', libelle: 'Ministère des Finances', responsable: 'MINISTERE_FINANCES', description: 'Validation financière' },
          { etape: 'SGG_PREMIERE_VALIDATION', libelle: 'SGG - Première Validation', responsable: 'SGG', description: 'Examen gouvernemental' },
          { etape: 'PRESIDENCE', libelle: 'Présidence de la République', responsable: 'PRESIDENCE', description: 'Validation présidentielle' },
          { etape: 'SGG_SECONDE_VALIDATION', libelle: 'SGG - Seconde Validation', responsable: 'SGG', description: 'Finalisation gouvernementale' },
          { etape: 'MIC_SECONDE_VALIDATION', libelle: 'MIC - Seconde Validation', responsable: 'MIC', description: 'Validation finale ministérielle' },
          { etape: 'ACCUEIL_RETOUR_AGREMENT', libelle: 'Accueil - Retour', responsable: 'ACCUEIL', description: 'Remise du document final' }
        ];
      case 'DECISION':
        return [
          { etape: 'ACCUEIL_DECISION', libelle: 'Accueil Décision', responsable: 'ACCUEIL', description: 'Réception du dossier' },
          { etape: 'MIC_DECISION', libelle: 'MIC - Décision', responsable: 'MIC', description: 'Examen ministériel' },
          { etape: 'SGG_DECISION', libelle: 'SGG - Décision', responsable: 'SGG', description: 'Validation gouvernementale' },
          { etape: 'MIC_RETOUR_DECISION', libelle: 'MIC - Retour', responsable: 'MIC', description: 'Finalisation ministérielle' },
          { etape: 'ACCUEIL_RETOUR_DECISION', libelle: 'Accueil - Retour', responsable: 'ACCUEIL', description: 'Remise de la décision' }
        ];
      case 'ENREGISTREMENT':
        return [
          { etape: 'ACCUEIL_ENREGISTREMENT', libelle: 'Accueil Enregistrement', responsable: 'ACCUEIL', description: 'Traitement du dossier' },
          { etape: 'ENREGISTREMENT_COMPLETE', libelle: 'Enregistrement Complet', responsable: 'SYSTEM', description: 'Enregistrement finalisé' }
        ];
      default:
        return [];
    }
  };

  const getStepStatus = (stepEtape: string, currentEtape: string, index: number, stepMappings: any[]): 'COMPLETE' | 'EN_COURS' | 'EN_ATTENTE' | 'REJETE' => {
    if (!currentEtape) return index === 0 ? 'EN_COURS' : 'EN_ATTENTE';
    
    if (stepEtape === currentEtape) return 'EN_COURS';
    
    const currentIndex = stepMappings.findIndex(s => s.etape === currentEtape);
    const stepIndex = stepMappings.findIndex(s => s.etape === stepEtape);
    
    if (stepIndex < currentIndex) return 'COMPLETE';
    return 'EN_ATTENTE';
  };

  const getStepIcon = (responsable: string, statut: string) => {
    const iconClass = "w-6 h-6";
    
    if (statut === 'COMPLETE') {
      return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
    } else if (statut === 'EN_COURS') {
      return <ClockIcon className={`${iconClass} text-blue-600 animate-pulse`} />;
    } else if (statut === 'REJETE') {
      return <ExclamationTriangleIcon className={`${iconClass} text-red-600`} />;
    }

    switch (responsable) {
      case 'ACCUEIL':
        return <BuildingOfficeIcon className={`${iconClass} text-gray-400`} />;
      case 'MIC':
        return <UserGroupIcon className={`${iconClass} text-gray-400`} />;
      case 'MINISTERE_FINANCES':
        return <BanknotesIcon className={`${iconClass} text-gray-400`} />;
      case 'SGG':
        return <DocumentCheckIcon className={`${iconClass} text-gray-400`} />;
      case 'PRESIDENCE':
        return <ShieldCheckIcon className={`${iconClass} text-gray-400`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'COMPLETE':
        return 'text-green-600 bg-green-100';
      case 'EN_COURS':
        return 'text-blue-600 bg-blue-100';
      case 'REJETE':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'COMPLETE':
        return 'Terminé';
      case 'EN_COURS':
        return 'En cours';
      case 'REJETE':
        return 'Rejeté';
      default:
        return 'En attente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6" />
            <span className="font-semibold text-lg">Erreur de chargement</span>
          </div>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={loadDemandesStatus}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (demandes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune demande en cours
          </h3>
          <p className="text-gray-600">
            Vous n'avez actuellement aucune demande d'autorisation d'exercice en cours de traitement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {demandes.map((demande) => (
          <div key={demande.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{demande.libelle}</h2>
                  <p className="text-blue-100">
                    Créée le {formatDate(demande.dateCreation)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{demande.progression}%</div>
                  <div className="text-blue-100 text-sm">Progression</div>
                </div>
              </div>
              
              {/* Barre de progression */}
              <div className="mt-4">
                <div className="bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${demande.progression}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Informations générales */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{formatMontant(demande.montant)}</div>
                  <div className="text-gray-600 text-sm">Montant</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{demande.steps.length}</div>
                  <div className="text-gray-600 text-sm">Étapes totales</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{demande.delaiEstime || 'Variable'}</div>
                  <div className="text-gray-600 text-sm">Délai estimé</div>
                </div>
              </div>
            </div>

            {/* Étapes du workflow */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Suivi du processus</h3>
                <button
                  onClick={() => setSelectedDemande(selectedDemande === demande.id ? null : demande.id)}
                  className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <EyeIcon className="w-5 h-5" />
                  <span>{selectedDemande === demande.id ? 'Masquer' : 'Voir'} les détails</span>
                </button>
              </div>

              <div className="space-y-4">
                {demande.steps.map((step, index) => (
                  <div key={step.etape} className="relative">
                    {/* Ligne de connexion */}
                    {index < demande.steps.length - 1 && (
                      <div className="absolute left-3 top-12 w-0.5 h-8 bg-gray-200"></div>
                    )}

                    {/* Étape */}
                    <div className="flex items-start space-x-4">
                      {/* Icône */}
                      <div className="flex-shrink-0">
                        {getStepIcon(step.responsable, step.statut)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {step.libelle}
                          </h4>
                          <span className={`
                            px-3 py-1 text-xs font-medium rounded-full
                            ${getStatusColor(step.statut)}
                          `}>
                            {getStatusLabel(step.statut)}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          Responsable: <span className="font-medium">{step.responsable}</span>
                        </div>

                        {selectedDemande === demande.id && step.description && (
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-2">
                            {step.description}
                          </div>
                        )}

                        {step.dateTraitement && (
                          <div className="text-xs text-gray-500">
                            Traité le {formatDate(step.dateTraitement)}
                          </div>
                        )}

                        {step.observations && (
                          <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded mt-2">
                            <strong>Observations:</strong> {step.observations}
                          </div>
                        )}
                      </div>

                      {/* Flèche vers l'étape suivante */}
                      {index < demande.steps.length - 1 && step.statut === 'COMPLETE' && (
                        <div className="flex-shrink-0">
                          <ArrowRightIcon className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Dernière mise à jour: {formatDate(demande.dateCreation)}
                </div>
                <div className="flex space-x-3">
                  {onRefresh && (
                    <button
                      onClick={onRefresh}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Actualiser
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Imprimer le suivi
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutorisationExerciceStatus;
