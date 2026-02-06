import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { entreprisesAPI } from '../../services/api';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { Entreprise } from '../../types';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentCheckIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import AgrementDocumentViewer from './AgrementDocumentViewer';

interface AccueilAgrementStepProps {
  onEntrepriseUpdate?: (entreprise: Entreprise) => void;
}

const AccueilAgrementStep: React.FC<AccueilAgrementStepProps> = ({ onEntrepriseUpdate }) => {
  const { agent } = useAgentAuth();
  const [activeTab, setActiveTab] = useState<'non-assignees' | 'mes-assignations'>('non-assignees');
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [mesAssignations, setMesAssignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignations, setIsLoadingAssignations] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<string | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState<Record<string, string>>({});
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  useEffect(() => {
    if (activeTab === 'non-assignees') {
      loadEntreprises();
    } else if (activeTab === 'mes-assignations') {
      loadMesAssignations();
    }
  }, [activeTab]);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser le nouveau endpoint du workflow d'agrément
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/accueil/demandes-non-assignees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des demandes');
      }
      
      const entreprisesData = await response.json();
      setEntreprises(entreprisesData || []);
    } catch (error) {
      console.error('❌ [AccueilAgrementStep] Erreur:', error);
      setError('Erreur lors du chargement des demandes d\'agrément');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMesAssignations = async () => {
    try {
      setIsLoadingAssignations(true);
      setError(null);
      
      if (!agent?.id) {
        console.error('❌ [loadMesAssignations] Agent non identifié:', agent);
        setError('Agent non identifié');
        return;
      }
      
      console.log('🔍 [loadMesAssignations] Chargement des assignations pour agent:', agent.id);
      
      const url = `${getApiBaseUrl()}/agrement-workflow/accueil/mes-assignations/${agent.id}`;
      console.log('🔍 [loadMesAssignations] URL appelée:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('🔍 [loadMesAssignations] Statut de la réponse:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [loadMesAssignations] Erreur HTTP:', response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const assignationsData = await response.json();
      console.log('📋 [loadMesAssignations] Assignations brutes reçues:', assignationsData);
      console.log('📋 [loadMesAssignations] Nombre d\'assignations:', assignationsData?.length || 0);
      
      // Utiliser directement les assignations sans récupérer les détails d'entreprise séparément
      console.log('🔍 [loadMesAssignations] Traitement de', assignationsData.length, 'assignations');
      
      const assignationsAvecEntreprises = assignationsData.map((assignation: any, index: number) => {
        let nomEntreprise = `Entreprise ${assignation.entrepriseId.substring(0, 8)}...`;
        
        // Pour les demandes d'investissement, extraire le nom depuis les observations
        if (assignation.entrepriseId && assignation.entrepriseId.startsWith('INV-') && assignation.observations) {
          const match = assignation.observations.match(/Demande d'investissement assignée - (.+?) \(ID:/);
          if (match && match[1]) {
            nomEntreprise = match[1];
          }
        }
        
        return {
          ...assignation,
          entreprise: {
            id: assignation.entrepriseId,
            nom: nomEntreprise,
            reference: `Assignation ${index + 1}`
          }
        };
      });
      
      
      setMesAssignations(assignationsAvecEntreprises);
    } catch (error) {
      console.error('❌ [AccueilAgrementStep] Erreur assignations:', error);
      setError('Erreur lors du chargement de vos assignations');
    } finally {
      setIsLoadingAssignations(false);
    }
  };

  const loadDocuments = async (entrepriseId: string) => {
    try {
      setLoadingDocs(entrepriseId);
      setError(null);

      console.log('🔍 [DEBUG] Chargement documents pour ID:', entrepriseId);

      let endpoint;
      let isInvestmentRequest = false;

      // Détecter le type de demande
      if (entrepriseId.startsWith('INV-')) {
        // Demande d'investissement
        const realInvestmentId = entrepriseId.substring(4); // Enlever "INV-"
        endpoint = `${getApiBaseUrl()}/investment-agreements/${realInvestmentId}/documents`;
        isInvestmentRequest = true;
        console.log('🔍 [DEBUG] Demande d\'investissement détectée, endpoint:', endpoint);
      } else if (entrepriseId.startsWith('AGR-')) {
        // Demande indépendante classique
        endpoint = `${getApiBaseUrl()}/agrement-workflow/accueil/documents/${entrepriseId}`;
        console.log('🔍 [DEBUG] Demande indépendante classique, endpoint:', endpoint);
      } else {
        // Entreprise normale
        endpoint = `${getApiBaseUrl()}/agrement-workflow/revision/documents/${entrepriseId}`;
        console.log('🔍 [DEBUG] Entreprise normale, endpoint:', endpoint);
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('🔍 [DEBUG] Réponse HTTP status:', response.status);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des documents');
      }

      const data = await response.json();
      console.log('🔍 [DEBUG] Données reçues:', data);
      
      // Extraire les documents selon le type de réponse
      let documentsArray: any[];
      if (isInvestmentRequest) {
        // Pour les demandes d'investissement, les documents sont dans data.data
        documentsArray = data.data || [];
      } else if (entrepriseId.startsWith('AGR-')) {
        // Pour les demandes indépendantes, les documents sont directement dans le tableau
        documentsArray = data || [];
      } else {
        // Pour les entreprises normales, ils sont dans data.documents
        documentsArray = data.documents || [];
      }

      console.log('🔍 [DEBUG] Documents extraits:', documentsArray.length);
      
      setDocuments(prev => ({
        ...prev,
        [entrepriseId]: documentsArray
      }));
      
      setSelectedEntreprise(entrepriseId);
    } catch (error: any) {
      console.error('❌ [AccueilAgrementStep] Erreur documents:', error);
      setError(error.message || 'Erreur lors du chargement des documents');
    } finally {
      setLoadingDocs(null);
    }
  };

  const handleAssigner = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      
      const assignResponse = await fetch(`${getApiBaseUrl()}/agrement-workflow/accueil/assigner`, {
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

      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(errorData.error || 'Erreur lors de l\'assignation');
      }

      
      // Afficher une notification de succès
      setError(null);
      setSuccessMessage(`✅ Demande "${entreprise.nom}" assignée avec succès ! Retrouvez-la dans l'onglet "Mes assignations".`);
      
      // Attendre 2 secondes puis recharger les données et basculer vers l'onglet "Mes assignations"
      setTimeout(async () => {
        // Recharger les demandes non assignées
        await loadEntreprises();
        // Basculer automatiquement vers l'onglet "Mes assignations" et charger les assignations
        setActiveTab('mes-assignations');
        // Recharger les assignations pour mettre à jour le compteur
        await loadMesAssignations();
        // Masquer le message de succès après un délai
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }, 2000);
    } catch (error: any) {
      console.error('❌ [AccueilAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors de l\'assignation');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAccepter = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/accueil/passer-revision`, {
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
        throw new Error(errorData.error || 'Erreur lors du passage en révision');
      }

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [AccueilAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors de l\'acceptation');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejeter = async (entreprise: Entreprise) => {
    if (!motifRejet[entreprise.id]) {
      setError('Veuillez ajouter un motif de rejet');
      return;
    }

    try {
      setIsProcessing(entreprise.id);
      setError(null);

      
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/accueil/rejeter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id,
          motifRejet: motifRejet[entreprise.id]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du rejet');
      }

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [AccueilAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors du rejet');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleVerifierDocuments = async (assignation: any) => {
    try {
      setIsProcessing(assignation.entrepriseId);
      setError(null);

      
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/accueil/verifier-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: assignation.entrepriseId,
          agentId: agent?.id,
          documentsOk: true,
          observations: 'Documents vérifiés et conformes'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la vérification des documents');
      }

      
      // Recharger les assignations pour mettre à jour l'état
      await loadMesAssignations();
      
      setSuccessMessage('✅ Documents vérifiés avec succès ! Vous pouvez maintenant passer la demande en révision.');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ [AccueilAgrementStep] Erreur vérification documents:', error);
      setError(error.message || 'Erreur lors de la vérification des documents');
    } finally {
      setIsProcessing(null);
    }
  };


  return (
    <div className="space-y-4">
      {/* Header avec onglets */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-sky-600 rounded-lg">
              <DocumentCheckIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Accueil - Demandes d'Agrément</h1>
              <p className="text-lg text-gray-600 font-medium">Vérification initiale et enregistrement des demandes</p>
            </div>
          </div>
          <span className="bg-sky-600 text-white px-4 py-2 rounded-lg text-lg font-semibold">
            Étape ACCUEIL
          </span>
        </div>

        {/* Onglets */}
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-2">
          <button
            onClick={() => setActiveTab('non-assignees')}
            className={`flex-1 px-6 py-3 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'non-assignees'
                ? 'bg-sky-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <DocumentTextIcon className="h-6 w-6" />
            Demandes non assignées
            {entreprises.length > 0 && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                activeTab === 'non-assignees' ? 'bg-white/20' : 'bg-sky-100 text-sky-700'
              }`}>
                {entreprises.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('mes-assignations')}
            className={`flex-1 px-6 py-3 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'mes-assignations'
                ? 'bg-sky-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckCircleIcon className="h-6 w-6" />
            Mes assignations
            {mesAssignations.length > 0 && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                activeTab === 'mes-assignations' ? 'bg-white/20' : 'bg-sky-100 text-sky-700'
              }`}>
                {mesAssignations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <p className="text-red-700 text-lg font-medium">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
            <p className="text-green-700 text-lg font-medium">{successMessage}</p>
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

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'non-assignees' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg font-medium">Chargement des demandes...</p>
                </div>
              </div>
            ) : entreprises.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande non assignée</h3>
                <p className="text-base text-gray-600 font-medium">Toutes les demandes ont été assignées.</p>
              </div>
            ) : (
              entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-sky-600 rounded-lg">
                    <BuildingOfficeIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{entreprise.nom}</h3>
                    {entreprise.sigle && (
                      <p className="text-base text-gray-600 font-medium">Sigle: {entreprise.sigle}</p>
                    )}
                    <span className="text-base text-gray-600">Réf: {entreprise.reference}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded text-base font-semibold bg-gray-100 text-gray-700">
                    {entreprise.formeJuridique}
                  </span>
                  <span className="px-3 py-1.5 rounded text-base font-semibold bg-sky-100 text-sky-700">
                    {entreprise.typeEntreprise}
                  </span>
                  {entreprise.domaineActivite && (
                    <span className="px-3 py-1.5 rounded text-base font-semibold bg-amber-100 text-amber-700">
                      {entreprise.domaineActivite}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-sky-50 rounded-lg border border-sky-200 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="h-6 w-6 text-sky-600 flex-shrink-0 mt-0.5" />
                  <p className="text-lg text-sky-700 font-medium">Vérifier les documents avant de transmettre à la révision.</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => loadDocuments(entreprise.id)}
                  disabled={loadingDocs === entreprise.id}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingDocs === entreprise.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-6 w-6" />
                      Voir les documents
                    </>
                  )}
                </button>

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
                              <p className="text-xs text-gray-500">{doc.filename || doc.fileName || doc.nomFichier}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingDoc({
                              entrepriseId: entreprise.id,
                              filename: doc.filename || doc.fileName,
                              documentName: doc.typeDocument || doc.originalFilename || 'Document',
                              documentId: doc.id // Pour les demandes d'investissement
                            })}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg flex items-center gap-1"
                          >
                            <EyeIcon className="h-3 w-3" />
                            Voir
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Champ motif de rejet */}
                {selectedEntreprise === entreprise.id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motif de rejet (optionnel)
                    </label>
                    <textarea
                      value={motifRejet[entreprise.id] || ''}
                      onChange={(e) => setMotifRejet(prev => ({
                        ...prev,
                        [entreprise.id]: e.target.value
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      placeholder="Ajouter un motif de rejet si nécessaire..."
                    />
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAssigner(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isProcessing === entreprise.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      "S'assigner"
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleAccepter(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isProcessing === entreprise.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Accepter
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRejeter(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isProcessing === entreprise.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4" />
                        Rejeter
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Onglet Mes Assignations */}
      {activeTab === 'mes-assignations' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 space-y-4">
            {isLoadingAssignations ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 text-sm">Chargement de vos assignations...</p>
                </div>
              </div>
            ) : mesAssignations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">Aucune assignation en cours</h3>
                <p className="text-sm text-gray-500">Vous n'avez aucune demande assignée.</p>
              </div>
            ) : (
              mesAssignations.map((assignation) => (
                <div
                  key={assignation.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">{assignation.entreprise?.nom || 'Entreprise'}</h3>
                        <p className="text-sm text-gray-500">
                          Assigné le {new Date(assignation.dateAssignment).toLocaleDateString('fr-FR')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Réf: {assignation.entreprise?.reference || 'N/A'}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            assignation.statut === 'EN_COURS' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {assignation.statut}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg border border-green-200 p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-700">
                        <p>Cette demande vous a été assignée.</p>
                        {assignation.observations && (
                          <p className="mt-1"><strong>Observations:</strong> {assignation.observations}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Liste des documents si affichés */}
                  {selectedEntreprise === assignation.entrepriseId && documents[assignation.entrepriseId] && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                        <h4 className="text-sm font-medium text-gray-800">Documents ({documents[assignation.entrepriseId].length})</h4>
                      </div>
                      {documents[assignation.entrepriseId].length === 0 ? (
                        <p className="text-sm text-gray-500">Aucun document disponible</p>
                      ) : (
                        documents[assignation.entrepriseId].map((doc: any) => (
                          <div
                            key={doc.id}
                            className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{doc.typeDocument || 'Document'}</p>
                                <p className="text-xs text-gray-500">{doc.filename || doc.fileName || doc.nomFichier}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setViewingDoc({
                                entrepriseId: assignation.entrepriseId,
                                filename: doc.filename || doc.fileName,
                                documentName: doc.typeDocument || doc.originalFilename || 'Document',
                                documentId: doc.id // Pour les demandes d'investissement
                              })}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg flex items-center gap-1"
                            >
                              <EyeIcon className="h-3 w-3" />
                              Voir
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => handleVerifierDocuments(assignation)}
                      disabled={isProcessing === assignation.entrepriseId || assignation.documentsVerifies}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                        assignation.documentsVerifies 
                          ? 'bg-green-600 text-white'
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                    >
                      {isProcessing === assignation.entrepriseId ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : assignation.documentsVerifies ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Documents vérifiés
                        </>
                      ) : (
                        <>
                          <DocumentCheckIcon className="h-4 w-4" />
                          Vérifier les documents
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAccepter({ 
                          id: assignation.entrepriseId, 
                          nom: assignation.entreprise?.nom || 'Entreprise',
                          reference: assignation.entreprise?.reference || 'N/A',
                          formeJuridique: '',
                          typeEntreprise: '',
                          statutCreation: '',
                          etapeValidation: ''
                        } as any)}
                        disabled={isProcessing === assignation.entrepriseId || !assignation.documentsVerifies}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {isProcessing === assignation.entrepriseId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            Passer en révision
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => loadDocuments(assignation.entrepriseId)}
                        disabled={loadingDocs === assignation.entrepriseId}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {loadingDocs === assignation.entrepriseId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <EyeIcon className="h-4 w-4" />
                            Voir documents
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccueilAgrementStep;
























