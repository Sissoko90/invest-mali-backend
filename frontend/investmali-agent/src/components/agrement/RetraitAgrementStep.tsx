import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { entreprisesAPI } from '../../services/api';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { Entreprise } from '../../types';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  BuildingOfficeIcon,
  ClockIcon,
  TrophyIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

interface RetraitAgrementStepProps {
  onEntrepriseUpdate?: (entreprise: Entreprise) => void;
}

const RetraitAgrementStep: React.FC<RetraitAgrementStepProps> = ({ onEntrepriseUpdate }) => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingAgrement, setViewingAgrement] = useState<string | null>(null);
  const [agrementUrl, setAgrementUrl] = useState<string | null>(null);

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await entreprisesAPI.getByEtape('RETRAIT_AGREMENT');
      console.log('📋 [RetraitAgrementStep] Entreprises:', response.data);
      
      const entreprisesData = response.data || [];
      setEntreprises(entreprisesData);
    } catch (error) {
      console.error('❌ [RetraitAgrementStep] Erreur:', error);
      setError('Erreur lors du chargement des agréments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarquerRetire = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('✅ [RetraitAgrementStep] Marquage comme retiré:', entreprise.nom);

      const response = await entreprisesAPI.update(entreprise.id, {
        etapeValidation: 'AGREMENT_COMPLETE',
        dateRetrait: new Date().toISOString()
      });

      console.log('✅ [RetraitAgrementStep] Marqué comme retiré:', response);

      if (onEntrepriseUpdate) {
        onEntrepriseUpdate(response.data);
      }

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RetraitAgrementStep] Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors du marquage');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleImprimerAgrement = (entreprise: Entreprise) => {
    console.log('🖨️ [RetraitAgrementStep] Impression agrément:', entreprise.nom);
    // TODO: Implémenter la génération et l'impression du certificat d'agrément
    alert('Fonctionnalité d\'impression en cours de développement');
  };

  const handleVoirAgrement = async (entreprise: Entreprise) => {
    try {
      setViewingAgrement(entreprise.id);
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/retrait/agrement-file/${entreprise.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAgrementUrl(url);
      } else {
        setError('Impossible de charger l\'agrément');
        setViewingAgrement(null);
      }
    } catch (error) {
      console.error('Erreur chargement agrément:', error);
      setError('Erreur lors du chargement de l\'agrément');
      setViewingAgrement(null);
    }
  };

  const handleTelechargerAgrement = async (entreprise: Entreprise) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/retrait/agrement-file/${entreprise.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agrement_${entreprise.reference}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError('Impossible de télécharger l\'agrément');
      }
    } catch (error) {
      console.error('Erreur téléchargement agrément:', error);
      setError('Erreur lors du téléchargement de l\'agrément');
    }
  };

  const handleAutoriserTelechargement = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/retrait/autoriser-telechargement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'autorisation');
      }

      console.log('✅ [RetraitAgrementStep] Téléchargement autorisé pour:', entreprise.nom);
      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RetraitAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors de l\'autorisation');
    } finally {
      setIsProcessing(null);
    }
  };

  const closeViewer = () => {
    if (agrementUrl) {
      URL.revokeObjectURL(agrementUrl);
    }
    setViewingAgrement(null);
    setAgrementUrl(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement des agréments...</p>
        </div>
      </div>
    );
  }

  if (entreprises.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <TrophyIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Aucun agrément à retirer</h3>
          <p className="text-sm text-gray-500">Tous les agréments ont été retirés.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-600 rounded-lg">
              <TrophyIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Retrait - Agréments Délivrés</h1>
              <p className="text-sm text-gray-500">Remise des autorisations d'exercice</p>
            </div>
          </div>
          <span className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Étape RETRAIT
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des agréments */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 space-y-4">
          {entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sky-600 rounded-lg">
                    <BuildingOfficeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{entreprise.nom}</h3>
                    <span className="text-xs text-gray-500">Réf: {entreprise.reference}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {entreprise.formeJuridique}
                  </span>
                  {entreprise.typeAgrement && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-sky-100 text-sky-700">
                      {entreprise.typeAgrement === 'BTP_TOURISME' && 'BTP, Tourisme & Transport'}
                      {entreprise.typeAgrement === 'ETABLISSEMENT_CLASSE' && 'Établissement Classé'}
                      {entreprise.typeAgrement === 'CODE_INVESTISSEMENT' && 'Code des Investissements'}
                    </span>
                  )}
                  {entreprise.avantagesFiscaux && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      Avantages fiscaux
                    </span>
                  )}
                </div>
              </div>

              {/* Numéro d'autorisation */}
              {entreprise.numeroAutorisation && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-3 mb-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrophyIcon className="h-4 w-4 text-green-600" />
                    <h4 className="text-sm font-medium text-green-800">Numéro d'autorisation</h4>
                  </div>
                  <p className="text-lg font-bold text-green-700">
                    {entreprise.numeroAutorisation}
                  </p>
                  {entreprise.dateAutorisation && (
                    <p className="text-xs text-green-600 mt-1">
                      Délivré le {new Date(entreprise.dateAutorisation).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              {/* Section Agrément signé */}
              {entreprise.agrementSignePath && (
                <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-amber-600" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800">Agrément signé</h4>
                        <p className="text-xs text-amber-600">Document prêt pour remise</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleVoirAgrement(entreprise)}
                        className="p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
                        title="Visualiser"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTelechargerAgrement(entreprise)}
                        className="p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
                        title="Télécharger"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Statut téléchargement user */}
              <div className={`rounded-lg border p-3 mb-3 ${
                entreprise.telechargementAutorise 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LockOpenIcon className={`h-4 w-4 ${entreprise.telechargementAutorise ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <h4 className={`text-sm font-medium ${entreprise.telechargementAutorise ? 'text-green-800' : 'text-gray-700'}`}>
                        {entreprise.telechargementAutorise ? 'Téléchargement autorisé' : 'Téléchargement non autorisé'}
                      </h4>
                      <p className={`text-xs ${entreprise.telechargementAutorise ? 'text-green-600' : 'text-gray-500'}`}>
                        {entreprise.telechargementAutorise 
                          ? 'L\'utilisateur peut télécharger son agrément' 
                          : 'Cliquez pour autoriser le téléchargement'}
                      </p>
                    </div>
                  </div>
                  {!entreprise.telechargementAutorise && (
                    <button
                      onClick={() => handleAutoriserTelechargement(entreprise)}
                      disabled={isProcessing === entreprise.id}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {isProcessing === entreprise.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        'Autoriser'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleImprimerAgrement(entreprise)}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Imprimer
                </button>
                <button
                  onClick={() => handleMarquerRetire(entreprise)}
                  disabled={isProcessing === entreprise.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isProcessing === entreprise.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Marquer comme retiré
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal visualisation agrément */}
      {viewingAgrement && agrementUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-sky-600 p-3 flex items-center justify-between">
              <h3 className="text-white font-medium">Agrément signé</h3>
              <button
                onClick={closeViewer}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 h-[70vh]">
              <iframe
                src={agrementUrl}
                className="w-full h-full rounded-lg border"
                title="Agrément"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetraitAgrementStep;
























