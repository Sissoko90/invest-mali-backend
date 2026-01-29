import React, { useState, useEffect, useRef } from 'react';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { entreprisesAPI } from '../../services/api';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { Entreprise } from '../../types';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  ClockIcon,
  InformationCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  CloudArrowUpIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import AgrementDocumentViewer from './AgrementDocumentViewer';

interface MinistereAgrementStepProps {
  onEntrepriseUpdate?: (entreprise: Entreprise) => void;
}

const MinistereAgrementStep: React.FC<MinistereAgrementStepProps> = ({ onEntrepriseUpdate }) => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Record<string, string>>({});
  
  // Documents
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [viewingDoc, setViewingDoc] = useState<{ entrepriseId: string; filename: string; documentName: string } | null>(null);
  
  // Upload agrément signé
  const [agrementFile, setAgrementFile] = useState<Record<string, File | null>>({});
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await entreprisesAPI.getByEtape('MINISTERE_AGREMENT');
      console.log('📋 [MinistereAgrementStep] Entreprises:', response.data);
      
      const entreprisesData = response.data || [];
      setEntreprises(entreprisesData);
      
      // Charger les documents pour chaque entreprise
      for (const entreprise of entreprisesData) {
        loadDocuments(entreprise.id);
      }
    } catch (error) {
      console.error('❌ [MinistereAgrementStep] Erreur:', error);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (entrepriseId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/revision/documents/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(prev => ({
          ...prev,
          [entrepriseId]: data.documents || []
        }));
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    }
  };

  const handleRejeter = async (entreprise: Entreprise) => {
    if (!observations[entreprise.id]) {
      setError('Veuillez ajouter une observation pour le rejet');
      return;
    }

    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('❌ [MinistereAgrementStep] Rejet:', entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/ministere/rejeter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id,
          motifRejet: observations[entreprise.id]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du rejet');
      }

      console.log('✅ [MinistereAgrementStep] Rejeté vers accueil (sans paiement)');

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [MinistereAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors du rejet');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleFileSelect = (entrepriseId: string, file: File | null) => {
    setAgrementFile(prev => ({
      ...prev,
      [entrepriseId]: file
    }));
  };

  const handleUploadAgrement = async (entreprise: Entreprise) => {
    const file = agrementFile[entreprise.id];
    if (!file) {
      setError('Veuillez sélectionner un fichier d\'agrément signé');
      return;
    }

    try {
      setIsUploading(entreprise.id);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('entrepriseId', String(entreprise.id));
      formData.append('agentId', String(agent?.id || ''));

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/ministere/upload-agrement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      console.log('✅ [MinistereAgrementStep] Agrément signé uploadé');
      
      // Réinitialiser le fichier sélectionné
      setAgrementFile(prev => ({
        ...prev,
        [entreprise.id]: null
      }));
      
      // Recharger les entreprises pour mettre à jour agrementSignePath
      await loadEntreprises();
      
      // Recharger les documents
      await loadDocuments(entreprise.id);
    } catch (error: any) {
      console.error('❌ [MinistereAgrementStep] Erreur upload:', error);
      setError(error.message || 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(null);
    }
  };

  const handleDelivrerAgrement = async (entreprise: Entreprise) => {
    // Vérifier que l'agrément signé a été uploadé
    if (!entreprise.agrementSignePath) {
      setError('⚠️ Vous devez d\'abord uploader l\'agrément signé avant de pouvoir délivrer.');
      return;
    }

    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('✅ [MinistereAgrementStep] Délivrance agrément:', entreprise.nom);

      // Générer un numéro d'autorisation basé sur le domaine d'activité
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const numeroAutorisation = `AE-${year}-${random}`;
      const dateAutorisation = new Date().toISOString();

      const response = await entreprisesAPI.update(entreprise.id, {
        etapeValidation: 'RETRAIT_AGREMENT',
        numeroAutorisation,
        dateAutorisation,
        observations: observations[entreprise.id]
      });

      console.log('✅ [MinistereAgrementStep] Agrément délivré:', response);

      if (onEntrepriseUpdate) {
        onEntrepriseUpdate(response.data);
      }

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [MinistereAgrementStep] Erreur:', error);
      setError(error.response?.data?.message || 'Erreur lors de la délivrance');
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  if (entreprises.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <BuildingOffice2Icon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Aucune demande à traiter</h3>
          <p className="text-sm text-gray-500">Toutes les demandes ont été traitées.</p>
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
              <BuildingOffice2Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Ministère - Délivrance d'Agrément</h1>
              <p className="text-sm text-gray-500">Délivrance de l'autorisation d'exercice</p>
            </div>
          </div>
          <span className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Étape MINISTÈRE
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

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <AgrementDocumentViewer
          entrepriseId={viewingDoc.entrepriseId}
          filename={viewingDoc.filename}
          documentName={viewingDoc.documentName}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 space-y-4">
          {entreprises.map((entreprise) => {
            const entrepriseDocuments = documents[entreprise.id] || [];
            
            return (
              <div
                key={entreprise.id}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-600 rounded-lg">
                      <BuildingOffice2Icon className="h-5 w-5 text-white" />
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
                    {entreprise.domaineActivite && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        {entreprise.domaineActivite}
                      </span>
                    )}
                  </div>
                </div>

                {/* Section Documents */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                    Documents ({entrepriseDocuments.length})
                  </h4>
                  {entrepriseDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {entrepriseDocuments.map((doc: any, index: number) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-2 border border-gray-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{doc.nom || doc.name}</p>
                              <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setViewingDoc({
                                entrepriseId: entreprise.id,
                                filename: doc.filename || doc.url?.split('/').pop(),
                                documentName: doc.nom || doc.name
                              })}
                              className="p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
                              title="Visualiser"
                            >
                              <EyeIcon className="h-3 w-3" />
                            </button>
                            <a
                              href={doc.url}
                              download
                              className="p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
                              title="Télécharger"
                            >
                              <ArrowDownTrayIcon className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500 text-sm">
                      Aucun document disponible
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Upload agrément signé */}
                  <div className="bg-amber-50 rounded-lg border border-amber-200 p-3">
                    <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                      <CloudArrowUpIcon className="h-4 w-4 text-amber-600" />
                      Upload de l'agrément signé
                    </h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={(el) => { fileInputRefs.current[entreprise.id] = el; }}
                        onChange={(e) => handleFileSelect(entreprise.id, e.target.files?.[0] || null)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRefs.current[entreprise.id]?.click()}
                        className="flex-1 bg-white border-2 border-dashed border-amber-300 rounded-lg p-3 text-center hover:border-amber-500 transition-colors"
                      >
                        {agrementFile[entreprise.id] ? (
                          <div className="flex items-center justify-center gap-2 text-amber-700 text-sm">
                            <DocumentCheckIcon className="h-4 w-4" />
                            <span>{agrementFile[entreprise.id]?.name}</span>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">
                            <CloudArrowUpIcon className="h-6 w-6 mx-auto mb-1 text-amber-400" />
                            <span>Cliquez pour sélectionner</span>
                          </div>
                        )}
                      </button>
                      {agrementFile[entreprise.id] && (
                        <button
                          onClick={() => handleUploadAgrement(entreprise)}
                          disabled={isUploading === entreprise.id}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          {isUploading === entreprise.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            'Uploader'
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Observations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observations (requis pour le rejet)
                    </label>
                    <textarea
                      value={observations[entreprise.id] || ''}
                      onChange={(e) => setObservations(prev => ({
                        ...prev,
                        [entreprise.id]: e.target.value
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      placeholder="Ajouter des observations..."
                    />
                  </div>

                  <div className="bg-sky-50 rounded-lg border border-sky-200 p-3">
                    <div className="flex items-start gap-2">
                      <InformationCircleIcon className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-sky-700">Un numéro d'autorisation sera généré automatiquement.</p>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejeter(entreprise)}
                      disabled={isProcessing === entreprise.id || !observations[entreprise.id]}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      Rejeter
                    </button>
                    <button
                      onClick={() => handleDelivrerAgrement(entreprise)}
                      disabled={isProcessing === entreprise.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {isProcessing === entreprise.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Délivrer l'agrément
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MinistereAgrementStep;
























