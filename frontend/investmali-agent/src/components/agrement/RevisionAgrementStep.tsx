<<<<<<< HEAD
﻿import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  DocumentCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EyeIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { entreprisesAPI } from '../../services/api';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { Entreprise } from '../../types';
import AgrementDocumentViewer from './AgrementDocumentViewer';
import InvestmentDetailsModal from './InvestmentDetailsModal';

interface RevisionAgrementStepProps {
  onEntrepriseUpdate?: (entreprise: Entreprise) => void;
}

const RevisionAgrementStep: React.FC<RevisionAgrementStepProps> = ({ onEntrepriseUpdate }) => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<string | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [approvedDocs, setApprovedDocs] = useState<Record<string, Set<string>>>({});
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [showingDetails, setShowingDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser le nouvel endpoint qui inclut les demandes d'investissement
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/agrement-workflow/revision/demandes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const entreprisesData = await response.json();
      console.log('📋 [RevisionAgrementStep] Demandes en révision:', entreprisesData);
      
      setEntreprises(entreprisesData || []);
    } catch (error) {
      console.error('❌ [RevisionAgrementStep] Erreur:', error);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (entrepriseId: string) => {
    try {
      setLoadingDocs(entrepriseId);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/revision/documents/${entrepriseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des documents');
      }

      const data = await response.json();
      console.log('📄 [RevisionAgrementStep] Documents:', data);
      
      setDocuments(prev => ({
        ...prev,
        [entrepriseId]: data.documents || []
      }));
      
      setSelectedEntreprise(entrepriseId);
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur documents:', error);
      setError(error.message || 'Erreur lors du chargement des documents');
    } finally {
      setLoadingDocs(null);
    }
  };

  const toggleDocumentApproval = (entrepriseId: string, docId: string) => {
    setApprovedDocs(prev => {
      const entrepriseDocs = prev[entrepriseId] || new Set();
      const newSet = new Set(entrepriseDocs);
      
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      
      return {
        ...prev,
        [entrepriseId]: newSet
      };
    });
  };

  const loadInvestmentDetails = async (entrepriseId: string) => {
    try {
      setLoadingDetails(entrepriseId);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/agrement-workflow/revision/investment-details/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 [RevisionAgrementStep] Détails investissement:', data);
      
      setShowingDetails(data.investmentAgreement);
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur détails:', error);
      setError(error.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleValider = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('✅ [RevisionAgrementStep] Validation:', entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/revision/valider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id,
          observations: observations[entreprise.id] || 'Documents vérifiés et conformes'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la validation');
      }

      console.log('✅ [RevisionAgrementStep] Validé et passé au régisseur');

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors de la validation');
    } finally {
      setIsProcessing(null);
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

      console.log('❌ [RevisionAgrementStep] Rejet:', entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/revision/rejeter`, {
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

      console.log('✅ [RevisionAgrementStep] Rejeté vers accueil');

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors du rejet');
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
          <DocumentCheckIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Aucune demande à réviser</h3>
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
              <DocumentCheckIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Révision - Demandes d'Agrément</h1>
              <p className="text-sm text-gray-500">Contrôle et validation des documents</p>
            </div>
          </div>
          <span className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Étape RÉVISION
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

      {/* Visualiseur de document d'agrément */}
      {viewingDoc && (
        <AgrementDocumentViewer
          entrepriseId={viewingDoc.entrepriseId}
          filename={viewingDoc.filename}
          documentName={viewingDoc.documentName}
          documentId={viewingDoc.documentId}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Modal des détails d'investissement */}
      {showingDetails && (
        <InvestmentDetailsModal
          investmentData={showingDetails}
          onClose={() => setShowingDetails(null)}
        />
      )}

      {/* Liste des demandes */}
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
                  {entreprise.domaineActivite && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                      {entreprise.domaineActivite}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => loadDocuments(entreprise.id)}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={loadingDocs === entreprise.id}
                  >
                    {loadingDocs === entreprise.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4" />
                        Voir les documents
                      </>
                    )}
                  </button>

                  {entreprise.id.startsWith('INV-') && (
                    <button
                      onClick={() => loadInvestmentDetails(entreprise.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={loadingDetails === entreprise.id}
                    >
                      {loadingDetails === entreprise.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <InformationCircleIcon className="h-4 w-4" />
                          Voir les détails
                        </>
                      )}
                    </button>
                  )}
                </div>

                {selectedEntreprise === entreprise.id && documents[entreprise.id] && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-800">Documents ({documents[entreprise.id].length})</h4>
                    </div>
                    {documents[entreprise.id].length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun document disponible</p>
                    ) : (
                      documents[entreprise.id].map((doc: any) => (
                        <div
                          key={doc.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{doc.typeDocument || 'Document'}</p>
                              <p className="text-xs text-gray-500">{doc.filename}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingDoc({
                                entrepriseId: entreprise.id,
                                filename: doc.filename,
                                documentName: doc.typeDocument || doc.originalFilename || 'Document',
                                documentId: doc.id // Pour les demandes d'investissement
                              })}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg flex items-center gap-1"
                            >
                              <EyeIcon className="h-3 w-3" />
                              Voir
                            </button>
                            <button
                              onClick={() => toggleDocumentApproval(entreprise.id, doc.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                approvedDocs[entreprise.id]?.has(doc.id)
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              <DocumentCheckIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    {documents[entreprise.id].length > 0 && (
                      <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                        <span className="text-sm text-green-700">
                          {approvedDocs[entreprise.id]?.size || 0} / {documents[entreprise.id].length} documents approuvés
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
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

                <div className="flex gap-2">
                  <button
                    onClick={() => handleValider(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isProcessing === entreprise.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Valider → Régisseur
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejeter(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Rejeter → Accueil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevisionAgrementStep;
























=======
﻿import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  DocumentCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EyeIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { entreprisesAPI } from '../../services/api';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { Entreprise } from '../../types';
import AgrementDocumentViewer from './AgrementDocumentViewer';
import InvestmentDetailsModal from './InvestmentDetailsModal';

interface RevisionAgrementStepProps {
  onEntrepriseUpdate?: (entreprise: Entreprise) => void;
}

const RevisionAgrementStep: React.FC<RevisionAgrementStepProps> = ({ onEntrepriseUpdate }) => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<string | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [approvedDocs, setApprovedDocs] = useState<Record<string, Set<string>>>({});
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [showingDetails, setShowingDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser le nouvel endpoint qui inclut les demandes d'investissement
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/agrement-workflow/revision/demandes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const entreprisesData = await response.json();
      console.log('📋 [RevisionAgrementStep] Demandes en révision:', entreprisesData);
      
      setEntreprises(entreprisesData || []);
    } catch (error) {
      console.error('❌ [RevisionAgrementStep] Erreur:', error);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (entrepriseId: string) => {
    try {
      setLoadingDocs(entrepriseId);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/revision/documents/${entrepriseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des documents');
      }

      const data = await response.json();
      console.log('📄 [RevisionAgrementStep] Documents:', data);
      
      setDocuments(prev => ({
        ...prev,
        [entrepriseId]: data.documents || []
      }));
      
      setSelectedEntreprise(entrepriseId);
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur documents:', error);
      setError(error.message || 'Erreur lors du chargement des documents');
    } finally {
      setLoadingDocs(null);
    }
  };

  const toggleDocumentApproval = (entrepriseId: string, docId: string) => {
    setApprovedDocs(prev => {
      const entrepriseDocs = prev[entrepriseId] || new Set();
      const newSet = new Set(entrepriseDocs);
      
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      
      return {
        ...prev,
        [entrepriseId]: newSet
      };
    });
  };

  const loadInvestmentDetails = async (entrepriseId: string) => {
    try {
      setLoadingDetails(entrepriseId);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/agrement-workflow/revision/investment-details/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 [RevisionAgrementStep] Détails investissement:', data);
      
      setShowingDetails(data.investmentAgreement);
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur détails:', error);
      setError(error.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleValider = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('✅ [RevisionAgrementStep] Validation:', entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/revision/valider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id,
          observations: observations[entreprise.id] || 'Documents vérifiés et conformes'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la validation');
      }

      console.log('✅ [RevisionAgrementStep] Validé et passé au régisseur');

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors de la validation');
    } finally {
      setIsProcessing(null);
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

      console.log('❌ [RevisionAgrementStep] Rejet:', entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/revision/rejeter`, {
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

      console.log('✅ [RevisionAgrementStep] Rejeté vers accueil');

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RevisionAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors du rejet');
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
          <DocumentCheckIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Aucune demande à réviser</h3>
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
              <DocumentCheckIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Révision - Demandes d'Agrément</h1>
              <p className="text-sm text-gray-500">Contrôle et validation des documents</p>
            </div>
          </div>
          <span className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Étape RÉVISION
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

      {/* Visualiseur de document d'agrément */}
      {viewingDoc && (
        <AgrementDocumentViewer
          entrepriseId={viewingDoc.entrepriseId}
          filename={viewingDoc.filename}
          documentName={viewingDoc.documentName}
          documentId={viewingDoc.documentId}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Modal des détails d'investissement */}
      {showingDetails && (
        <InvestmentDetailsModal
          investmentData={showingDetails}
          onClose={() => setShowingDetails(null)}
        />
      )}

      {/* Liste des demandes */}
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
                  {entreprise.domaineActivite && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                      {entreprise.domaineActivite}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => loadDocuments(entreprise.id)}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={loadingDocs === entreprise.id}
                  >
                    {loadingDocs === entreprise.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4" />
                        Voir les documents
                      </>
                    )}
                  </button>

                  {entreprise.id.startsWith('INV-') && (
                    <button
                      onClick={() => loadInvestmentDetails(entreprise.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={loadingDetails === entreprise.id}
                    >
                      {loadingDetails === entreprise.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <InformationCircleIcon className="h-4 w-4" />
                          Voir les détails
                        </>
                      )}
                    </button>
                  )}
                </div>

                {selectedEntreprise === entreprise.id && documents[entreprise.id] && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-800">Documents ({documents[entreprise.id].length})</h4>
                    </div>
                    {documents[entreprise.id].length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun document disponible</p>
                    ) : (
                      documents[entreprise.id].map((doc: any) => (
                        <div
                          key={doc.id}
                          className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{doc.typeDocument || 'Document'}</p>
                              <p className="text-xs text-gray-500">{doc.filename}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingDoc({
                                entrepriseId: entreprise.id,
                                filename: doc.filename,
                                documentName: doc.typeDocument || doc.originalFilename || 'Document',
                                documentId: doc.id // Pour les demandes d'investissement
                              })}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg flex items-center gap-1"
                            >
                              <EyeIcon className="h-3 w-3" />
                              Voir
                            </button>
                            <button
                              onClick={() => toggleDocumentApproval(entreprise.id, doc.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                approvedDocs[entreprise.id]?.has(doc.id)
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              <DocumentCheckIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    {documents[entreprise.id].length > 0 && (
                      <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                        <span className="text-sm text-green-700">
                          {approvedDocs[entreprise.id]?.size || 0} / {documents[entreprise.id].length} documents approuvés
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
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

                <div className="flex gap-2">
                  <button
                    onClick={() => handleValider(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isProcessing === entreprise.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Valider → Régisseur
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejeter(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Rejeter → Accueil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevisionAgrementStep;
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
