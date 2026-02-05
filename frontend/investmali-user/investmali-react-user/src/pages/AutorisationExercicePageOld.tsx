import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SelectionRegimeType from '../components/SelectionRegimeType';
import DocumentsReglementairesStep, { UploadedDocument } from '../components/DocumentsReglementairesStep';
import { businessAPI } from '../services/api';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface Entreprise {
  id: string;
  nom: string;
  etapeValidation: string;
  numeroAutorisation?: string;
  typeAgrement?: string;
  dateAutorisation?: string;
  observations?: string;
  domaineActivite?: string;
  typeEntreprise?: string;
  regimeInvestissement?: string;
  typeDemandeAgrement?: string;
  montantFraisDepot?: number;
  agrementSignePath?: string;
  telechargementAutorise?: boolean;
}

const AutorisationExercicePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [selectedSection, setSelectedSection] = useState<'demande' | 'selection' | 'documents' | 'enregistrement' | 'decision'>('demande');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [selectedEntrepriseType, setSelectedEntrepriseType] = useState<string>('');
  const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
  const [selectedTypeDemande, setSelectedTypeDemande] = useState<string>('NOUVEAU');
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentsRequis, setDocumentsRequis] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: boolean}>({});
  const [submitting, setSubmitting] = useState(false);
  const [regulatoryDocuments, setRegulatoryDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDomaineActivite, setSelectedDomaineActivite] = useState<string>('');

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setLoading(true);
      const response = await businessAPI.getMyApplications();
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      
      // Filtrer les entreprises éligibles (création terminée)
      const eligible = list.filter((e: any) => 
        e.etapeValidation === 'RETRAIT' || 
        e.etapeValidation?.includes('AGREMENT')
      );
      
      // Debug: afficher les infos d'agrément
      console.log('📋 [User] Entreprises chargées:', eligible.map((e: any) => ({
        id: e.id,
        nom: e.nom,
        etape: e.etapeValidation,
        telechargementAutorise: e.telechargementAutorise,
        agrementSignePath: e.agrementSignePath
      })));
      
      setEntreprises(eligible);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des entreprises');
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareInitiation = (entrepriseId: string, typeEntreprise: string, domaineActivite?: string) => {
    setSelectedEntreprise(entrepriseId);
    setSelectedEntrepriseType(typeEntreprise);
    setSelectedDomaineActivite(domaineActivite || '');
    // Aller directement à l'étape documents
    setSelectedSection('documents');
  };

  const handleRegimeTypeSelection = (regime: string | null, type: string) => {
    setSelectedRegime(regime);
    setSelectedTypeDemande(type);
  };

  const handleConfirmInitiation = async () => {
    if (!selectedEntreprise) return;

    try {
      setInitiating(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      
      // Enregistrer le régime et le type de demande
      const updateResponse = await fetch(`${apiUrl}/api/v1/entreprises/${selectedEntreprise}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          regimeInvestissement: selectedRegime,
          typeDemandeAgrement: selectedTypeDemande
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Erreur lors de l\'enregistrement du régime et type');
      }

      // Initier la demande
      const response = await fetch(`${apiUrl}/api/v1/entreprises/agrement/initier/${selectedEntreprise}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'initiation de la demande');
      }

      // Passer à l'étape documents réglementaires
      setSelectedSection('documents');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitiating(false);
    }
  };

  const loadDocumentsRequis = async (typeEntreprise: string) => {
    // Liste statique des documents requis pour personne morale (SOCIETE)
    const documentsPersonneMorale = [
      "Demande timbrée",
      "Copie certifiée conforme des statuts",
      "Extrait de l'acte de naissance du responsable dirigeant",
      "Casier judiciaire du responsable dirigeant datant de moins de 3 mois",
      "Certificat de nationalité du responsable dirigeant",
      "Copie du diplôme d'enseignement secondaire au moins ou attestation de capacité professionnelle du responsable dirigeant",
      "Certificat d'inscription au registre des transporteurs",
      "Liste détaillée du matériel roulant"
    ];
    
    const documentsPersonnePhysique = [
      "Demande timbrée",
      "Extrait de l'acte de naissance ou du jugement supplétif en tenant lieu",
      "Extrait du casier judiciaire datant de moins de trois mois",
      "Certificat de nationalité",
      "Certificat de résidence",
      "Diplôme d'enseignement secondaire au moins ou attestation de capacité professionnelle",
      "Certificat d'inscription au registre des transporteurs",
      "Liste détaillée du matériel roulant"
    ];
    
    if (typeEntreprise === 'PERSONNE_PHYSIQUE' || typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
      setDocumentsRequis(documentsPersonnePhysique);
    } else {
      setDocumentsRequis(documentsPersonneMorale);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      console.log('📥 Téléchargement du formulaire Transport');
      
      // Créer un lien de téléchargement direct vers le dossier public/formulaires
      const link = document.createElement('a');
      link.href = `${process.env.PUBLIC_URL}/formulaires/Transport 2023.doc`;
      link.download = 'Transport 2023.doc';
      link.setAttribute('target', '_blank');
      
      // Ajouter temporairement au DOM et cliquer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Téléchargement initié: Formulaire Transport');
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setError('Erreur lors du téléchargement du formulaire. Veuillez réessayer.');
    }
  };

  const handleUploadDocument = async (entrepriseId: string, file: File, typeDocument: string) => {
    try {
      setUploadingDoc(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('typeDocument', typeDocument);

      const response = await fetch(`${apiUrl}/api/v1/entreprises/agrement/upload/${entrepriseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload du document');
      }

      setUploadedDocs(prev => ({ ...prev, [typeDocument]: true }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitDemande = async (entrepriseId: string) => {
    try {
      setSubmitting(true);
      setError(null);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/v1/entreprises/agrement/soumettre/${entrepriseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission de la demande');
      }

      alert('✅ Demande soumise avec succès! Elle sera traitée par un agent sous peu.');
      await loadEntreprises();
      setSelectedSection('enregistrement');
      setUploadedDocs({});
      setSelectedEntreprise(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const allDocumentsUploaded = () => {
    return documentsRequis.length > 0 && documentsRequis.every(doc => uploadedDocs[doc]);
  };

  const getStatusBadge = (etape: string) => {
    const statusConfig: { [key: string]: { label: string; color: string; icon: any } } = {
      'RETRAIT': { label: 'Éligible', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      'ACCUEIL_AGREMENT': { label: 'En cours - Accueil', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      'REVISION_AGREMENT': { label: 'En cours - Révision', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      'REGISSEUR_AGREMENT': { label: 'En cours - Régisseur', color: 'bg-orange-100 text-orange-800', icon: ClockIcon },
      'MINISTERE_AGREMENT': { label: 'En cours - Ministère', color: 'bg-purple-100 text-purple-800', icon: ClockIcon },
      'RETRAIT_AGREMENT': { label: 'Agrément délivré', color: 'bg-green-100 text-green-800', icon: DocumentCheckIcon },
      'AGREMENT_COMPLETE': { label: 'Agrément retiré', color: 'bg-gray-100 text-gray-800', icon: ShieldCheckIcon },
    };

    const config = statusConfig[etape] || { label: etape, color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const getTypeAgrementLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'BTP_TOURISME': 'BTP, Tourisme & Transport',
      'ETABLISSEMENT_CLASSE': 'Établissements Classés',
      'CODE_INVESTISSEMENT': 'Code des Investissements'
    };
    return labels[type] || type;
  };

  const renderDemandeSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <div className="flex items-start">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Demande d'Autorisation d'Exercice
            </h3>
            <p className="text-gray-700 mb-4">
              Sélectionnez une entreprise pour laquelle vous souhaitez obtenir une autorisation d'exercice.
              L'entreprise doit avoir terminé le processus de création.
            </p>
            <div className="bg-white/60 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Conditions d'éligibilité :</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>L'entreprise doit être enregistrée et avoir terminé la création</li>
                <li>L'activité doit être dans un domaine réglementé</li>
                <li>Tous les documents requis doivent être fournis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement de vos entreprises...</p>
        </div>
      ) : entreprises.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune entreprise éligible</h3>
          <p className="text-gray-600 mb-6">
            Vous devez d'abord créer et enregistrer une entreprise avant de demander une autorisation d'exercice.
          </p>
          <button
            onClick={() => navigate('/create-business')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer une entreprise
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{entreprise.nom}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Statut :</span>
                      {getStatusBadge(entreprise.etapeValidation)}
                    </div>
                    {entreprise.domaineActivite && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Domaine :</span>
                        <span>{entreprise.domaineActivite}</span>
                      </div>
                    )}
                    {entreprise.numeroAutorisation && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">N° Autorisation :</span>
                        <span className="font-mono font-semibold text-green-700">{entreprise.numeroAutorisation}</span>
                      </div>
                    )}
                    {entreprise.typeAgrement && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Type :</span>
                        <span>{getTypeAgrementLabel(entreprise.typeAgrement)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  {entreprise.etapeValidation === 'RETRAIT' && !entreprise.numeroAutorisation && (
                    <button
                      onClick={() => handlePrepareInitiation(entreprise.id, entreprise.typeEntreprise || 'SOCIETE', entreprise.domaineActivite)}
                      disabled={initiating}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {initiating ? 'Initiation...' : 'Initier la demande'}
                    </button>
                  )}
                  {entreprise.etapeValidation?.includes('AGREMENT') && (
                    <span className="text-sm text-gray-500">Demande en cours</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSelectionSection = () => {
    const selectedEnt = entreprises.find(e => e.id === selectedEntreprise);
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-6 rounded-lg">
          <div className="flex items-start">
            <DocumentCheckIcon className="h-6 w-6 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sélection du Régime et Type de Demande
              </h3>
              <p className="text-gray-700 mb-2">
                Entreprise sélectionnée: <strong>{selectedEnt?.nom}</strong>
              </p>
              <p className="text-gray-600 text-sm">
                Veuillez sélectionner le type de demande et le régime d'investissement applicable pour votre entreprise.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <SelectionRegimeType
          onSelectionChange={handleRegimeTypeSelection}
          selectedRegime={selectedRegime}
          selectedType={selectedTypeDemande}
        />

        <div className="flex gap-4">
          <button
            onClick={() => setSelectedSection('demande')}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
          >
            ← Retour
          </button>
          <button
            onClick={handleConfirmInitiation}
            disabled={initiating || (selectedTypeDemande === 'NOUVEAU' && !selectedRegime)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {initiating ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Initiation en cours...
              </>
            ) : (
              <>
                Confirmer et initier la demande
                <ArrowRightIcon className="inline h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderDocumentsSection = () => {
    const selectedEnt = entreprises.find(e => e.id === selectedEntreprise);
    const typePersonne = selectedEntrepriseType === 'ENTREPRISE_INDIVIDUELLE' || selectedEntrepriseType === 'PERSONNE_PHYSIQUE' ? 'physique' : 'morale';

    const handleDocumentsChange = (docs: UploadedDocument[]) => {
      setRegulatoryDocuments(docs);
    };

    const handleSubmitDocuments = async () => {
      if (!selectedEntreprise) return;

      try {
        setSubmitting(true);
        setError(null);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

        // Initier la demande d'abord (si pas déjà fait)
        const initiateResponse = await fetch(`${apiUrl}/api/v1/entreprises/agrement/initier/${selectedEntreprise}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!initiateResponse.ok) {
          const errorData = await initiateResponse.json();
          // Ignorer l'erreur si la demande est déjà initiée
          if (!errorData.error?.includes('déjà initiée')) {
            throw new Error(errorData.error || 'Erreur lors de l\'initiation de la demande');
          }
        }

        // Upload tous les documents
        for (const doc of regulatoryDocuments) {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('typeDocument', doc.type === 'formulaire' ? 'FORMULAIRE_AUTORISATION' : 'PIECE_JOINTE');
          formData.append('nom', doc.nom);

          const response = await fetch(`${apiUrl}/api/v1/entreprises/agrement/upload/${selectedEntreprise}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Erreur lors de l'upload de ${doc.nom}`);
          }
        }

        // Soumettre la demande
        const submitResponse = await fetch(`${apiUrl}/api/v1/entreprises/agrement/soumettre/${selectedEntreprise}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!submitResponse.ok) {
          throw new Error('Erreur lors de la soumission de la demande');
        }

        alert('✅ Demande soumise avec succès! Elle sera traitée par un agent sous peu.');
        await loadEntreprises();
        setSelectedSection('enregistrement');
        setRegulatoryDocuments([]);
        setSelectedEntreprise(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
    };

    const allRequiredDocsUploaded = () => {
      if (!selectedDomaineActivite || regulatoryDocuments.length === 0) return false;
      // Vérifier que le formulaire est uploadé
      const hasFormulaire = regulatoryDocuments.some(d => d.type === 'formulaire');
      return hasFormulaire;
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-6 rounded-lg">
          <div className="flex items-start">
            <CloudArrowUpIcon className="h-6 w-6 text-purple-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Documents Réglementaires Requis
              </h3>
              <p className="text-gray-700 mb-2">
                Entreprise sélectionnée: <strong>{selectedEnt?.nom}</strong>
              </p>
              <p className="text-gray-600 text-sm">
                Téléchargez le formulaire officiel, remplissez-le, puis uploadez-le avec les pièces jointes requises.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {selectedDomaineActivite ? (
          <DocumentsReglementairesStep
            domaineActivite={selectedDomaineActivite}
            typePersonne={typePersonne}
            onDocumentsChange={handleDocumentsChange}
            uploadedDocuments={regulatoryDocuments}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Aucun domaine d'activité détecté pour cette entreprise.</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => {
              setSelectedSection('demande');
              setSelectedEntreprise(null);
              setRegulatoryDocuments([]);
            }}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
          >
            ← Retour à la liste
          </button>
          <button
            onClick={handleSubmitDocuments}
            disabled={submitting || !allRequiredDocsUploaded()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Soumission en cours...
              </>
            ) : (
              <>
                Soumettre la demande
                <ArrowRightIcon className="inline h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const handleProcederPaiement = async (entreprise: any) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/payments/entreprise/${entreprise.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const payments = await response.json();
        console.log('💰 [User] Paiements récupérés:', payments);
        
        const pendingPayment = payments.find((p: any) => 
          (p.status === 'PENDING' || p.status === 'EMITTED') && 
          p.description?.startsWith('Frais de dépôt')
        );
        
        console.log('💳 [User] Paiement trouvé:', pendingPayment);
        
        if (pendingPayment && pendingPayment.paymentUrl) {
          console.log('🔗 [User] Ouverture URL:', pendingPayment.paymentUrl);
          window.open(pendingPayment.paymentUrl, '_blank');
        } else {
          console.error('❌ [User] Pas de paiement ou pas d\'URL:', { 
            hasPendingPayment: !!pendingPayment, 
            hasUrl: pendingPayment?.paymentUrl 
          });
          alert('Lien de paiement non disponible. Veuillez contacter le service.');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du paiement:', error);
      alert('Erreur lors de la récupération du lien de paiement');
    }
  };

  const renderEnregistrementSection = () => {
    const enCoursAgrement = entreprises.filter(e => 
      e.etapeValidation?.includes('AGREMENT') && 
      e.etapeValidation !== 'AGREMENT_COMPLETE'
    );

    const paiementEnAttente = entreprises.filter(e => e.etapeValidation === 'PAIEMENT_EN_ATTENTE_AGREMENT');
    const autresEnCours = enCoursAgrement.filter(e => e.etapeValidation !== 'PAIEMENT_EN_ATTENTE_AGREMENT');

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-lg">
          <div className="flex items-start">
            <ClockIcon className="h-6 w-6 text-yellow-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enregistrement en cours
              </h3>
              <p className="text-gray-700">
                Vos demandes d'autorisation sont en cours de traitement par les services compétents.
                Vous serez notifié à chaque étape du processus.
              </p>
            </div>
          </div>
        </div>

        {/* Section Paiement en Attente */}
        {paiementEnAttente.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">⚠️ Paiement Requis</h3>
            {paiementEnAttente.map((entreprise) => (
              <div
                key={entreprise.id}
                className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{entreprise.nom}</h3>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-300">
                      💰 Paiement en Attente
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-orange-200 rounded-lg p-6 mt-4">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💳</span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">Frais de dépôt à régler</h4>
                      <p className="text-sm text-gray-600">Votre demande nécessite le paiement des frais de dépôt</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {entreprise.typeDemandeAgrement && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Type de demande</p>
                        <p className="font-semibold text-gray-900">{entreprise.typeDemandeAgrement}</p>
                      </div>
                    )}
                    {entreprise.regimeInvestissement && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Régime</p>
                        <p className="font-semibold text-gray-900">
                          {entreprise.regimeInvestissement.replace('REGIME_', 'Régime ')}
                        </p>
                      </div>
                    )}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                      <p className="text-xs text-gray-600 mb-1">Montant à payer</p>
                      <p className="text-2xl font-bold text-green-600">
                        {entreprise.montantFraisDepot 
                          ? `${entreprise.montantFraisDepot.toLocaleString()} FCFA`
                          : '300 000 FCFA'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Paiement sécurisé via TresorPay</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Vous serez redirigé vers la plateforme de paiement sécurisée du Trésor Public du Mali
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleProcederPaiement(entreprise)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-3"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Procéder au Paiement
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section Autres Demandes en Cours */}
        {autresEnCours.length === 0 && paiementEnAttente.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande en cours</h3>
            <p className="text-gray-600">
              Vous n'avez pas de demande d'autorisation en cours de traitement.
            </p>
          </div>
        ) : autresEnCours.length > 0 && (
          <div className="grid gap-4">
            {autresEnCours.map((entreprise) => (
              <div
                key={entreprise.id}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{entreprise.nom}</h3>
                    {getStatusBadge(entreprise.etapeValidation)}
                  </div>
                </div>

                {/* Timeline de progression */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {['ACCUEIL_AGREMENT', 'REVISION_AGREMENT', 'REGISSEUR_AGREMENT', 'MINISTERE_AGREMENT', 'RETRAIT_AGREMENT'].map((etape, index) => {
                      const isCompleted = ['REVISION_AGREMENT', 'REGISSEUR_AGREMENT', 'MINISTERE_AGREMENT', 'RETRAIT_AGREMENT'].indexOf(entreprise.etapeValidation) >= index;
                      const isCurrent = entreprise.etapeValidation === etape;
                      
                      return (
                        <div key={etape} className="relative flex items-center mb-4 last:mb-0">
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                            isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                          }`}>
                            {isCompleted ? (
                              <CheckCircleIcon className="h-5 w-5 text-white" />
                            ) : (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>
                              {etape.replace('_', ' ').replace('AGREMENT', '')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {entreprise.observations && (
                  <div className="mt-4 bg-sky-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Observations :</p>
                    <p className="text-sm text-blue-800">{entreprise.observations}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleTelechargerAgrement = async (entreprise: Entreprise) => {
    try {
      if (!entreprise.telechargementAutorise) {
        alert('Le téléchargement n\'est pas encore autorisé. Veuillez contacter l\'agent.');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      console.log('📥 [User] Téléchargement agrément pour:', entreprise.id);
      
      const response = await fetch(`${apiUrl}/api/v1/agrement-workflow/retrait/agrement-file/${entreprise.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agrement_${entreprise.numeroAutorisation || entreprise.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Marquer le téléchargement comme effectué (désactive l'autorisation)
        try {
          await fetch(`${apiUrl}/api/v1/agrement-workflow/retrait/marquer-telecharge`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ entrepriseId: entreprise.id })
          });
          console.log('✅ [User] Téléchargement marqué - autorisation désactivée');
          
          // Recharger les entreprises pour mettre à jour l'état
          await loadEntreprises();
          
          alert('✅ Agrément téléchargé avec succès ! Pour un nouveau téléchargement, veuillez contacter l\'agent au guichet (service payant).');
        } catch (markError) {
          console.error('Erreur marquage téléchargement:', markError);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [User] Erreur téléchargement:', response.status, errorData);
        alert(errorData.error || 'L\'agrément n\'est pas encore disponible. L\'agent au ministère doit d\'abord téléverser le document signé.');
      }
    } catch (error) {
      console.error('Erreur téléchargement agrément:', error);
      alert('Erreur lors du téléchargement de l\'agrément');
    }
  };

  const renderDecisionSection = () => {
    const agrementsDelivres = entreprises.filter(e => 
      e.etapeValidation === 'RETRAIT_AGREMENT' || 
      e.etapeValidation === 'AGREMENT_COMPLETE'
    );

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Décisions et Agréments Délivrés
              </h3>
              <p className="text-gray-700">
                Consultez les autorisations d'exercice qui vous ont été délivrées.
                Vous pouvez télécharger vos documents officiels.
              </p>
            </div>
          </div>
        </div>

        {agrementsDelivres.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun agrément délivré</h3>
            <p className="text-gray-600">
              Vous n'avez pas encore d'autorisation d'exercice délivrée.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {agrementsDelivres.map((entreprise) => (
              <div
                key={entreprise.id}
                className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{entreprise.nom}</h3>
                        <p className="text-sm text-gray-600">Autorisation d'Exercice Délivrée</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Numéro d'Autorisation</p>
                        <p className="text-lg font-mono font-bold text-green-700">{entreprise.numeroAutorisation}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Type d'Agrément</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {entreprise.typeAgrement ? getTypeAgrementLabel(entreprise.typeAgrement) : 'Autorisation d\'exercice'}
                        </p>
                      </div>

                      {entreprise.dateAutorisation && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Date de Délivrance</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(entreprise.dateAutorisation).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Statut</p>
                        {getStatusBadge(entreprise.etapeValidation)}
                      </div>
                    </div>

                    {entreprise.observations && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-900 mb-1">Observations :</p>
                        <p className="text-sm text-green-800">{entreprise.observations}</p>
                      </div>
                    )}

                    {/* Section téléchargement agrément - toujours visible pour RETRAIT_AGREMENT */}
                    <div className={`mt-4 p-4 rounded-lg border-2 ${
                      entreprise.telechargementAutorise 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ArrowDownTrayIcon className={`h-6 w-6 mr-3 ${
                            entreprise.telechargementAutorise ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {entreprise.telechargementAutorise 
                                ? '📄 Agrément signé disponible au téléchargement' 
                                : '🔒 Téléchargement non autorisé'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {entreprise.telechargementAutorise 
                                ? 'Cliquez sur le bouton pour télécharger votre agrément officiel (téléchargement unique)' 
                                : 'Pour télécharger l\'agrément, veuillez vous rendre au guichet. Un nouveau téléchargement est un service payant.'}
                            </p>
                          </div>
                        </div>
                        {entreprise.telechargementAutorise && (
                          <button
                            onClick={() => handleTelechargerAgrement(entreprise)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center gap-2"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            Télécharger
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {entreprise.telechargementAutorise ? (
                    <button 
                      onClick={() => handleTelechargerAgrement(entreprise)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 font-semibold"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Télécharger l'Agrément Signé
                    </button>
                  ) : (
                    <div className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg text-center font-medium">
                      🔒 Téléchargement en attente d'autorisation
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      <Header />

      {/* Bannière principale */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 sm:py-16 lg:py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
            Autorisation d'Exercice
          </h1>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl max-w-3xl mx-auto leading-relaxed opacity-90 mb-2 sm:mb-3 lg:mb-4">
            Obtenez votre autorisation d'exercice pour les activités réglementées. 
            Suivez le processus étape par étape et téléchargez vos documents officiels.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Navigation par onglets */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setSelectedSection('demande')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedSection === 'demande'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Demande d'Agrément
                </div>
              </button>

              <button
                onClick={() => setSelectedSection('enregistrement')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedSection === 'enregistrement'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Suivi
                </div>
              </button>

              <button
                onClick={() => setSelectedSection('decision')}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                  selectedSection === 'decision'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Retrait
                </div>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {selectedSection === 'demande' && renderDemandeSection()}
            {selectedSection === 'selection' && renderSelectionSection()}
            {selectedSection === 'documents' && renderDocumentsSection()}
            {selectedSection === 'enregistrement' && renderEnregistrementSection()}
            {selectedSection === 'decision' && renderDecisionSection()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AutorisationExercicePage;
