import React, { useState } from 'react';
import { 
  DocumentCheckIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Dossier {
  id: string;
  reference: string;
  nom: string;
  sigle?: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'INCOMPLET' | 'VALIDE' | 'REJETE';
  dateCreation: string;
  division?: string;
  antenne?: string;
  documentsManquants: string[];
  personneId?: string;
  entrepriseId?: string;
}

interface Document {
  id: string;
  nom: string;
  type: string;
  obligatoire: boolean;
  statut: 'MANQUANT' | 'UPLOADE' | 'VALIDE' | 'REJETE';
  fichier?: File;
  url?: string;
  commentaire?: string;
}

interface DocumentsChecklistProps {
  dossier: Dossier;
  onDossierUpdated: (dossier: Dossier) => void;
}

const DocumentsChecklist: React.FC<DocumentsChecklistProps> = ({ dossier, onDossierUpdated }) => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      nom: 'Pièce d\'identité du représentant',
      type: 'PIECE_IDENTITE',
      obligatoire: true,
      statut: 'MANQUANT'
    },
    {
      id: '2',
      nom: 'Statuts de l\'entreprise',
      type: 'STATUTS',
      obligatoire: true,
      statut: 'MANQUANT'
    },
    {
      id: '3',
      nom: 'Certificat de résidence',
      type: 'CERTIFICAT_RESIDENCE',
      obligatoire: true,
      statut: 'MANQUANT'
    },
    {
      id: '4',
      nom: 'Registre de commerce (si existant)',
      type: 'REGISTRE_COMMERCE',
      obligatoire: false,
      statut: 'MANQUANT'
    },
    {
      id: '5',
      nom: 'Déclaration fiscale',
      type: 'DECLARATION_FISCALE',
      obligatoire: false,
      statut: 'MANQUANT'
    },
    {
      id: '6',
      nom: 'Déclaration sur l\'honneur',
      type: 'DECLARATION_HONNEUR',
      obligatoire: true,
      statut: 'MANQUANT'
    }
  ]);

  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(null);

  const handleFileUpload = async (documentId: string, file: File) => {
    setIsUploading(documentId);
    
    try {
      // Simuler l'upload (à remplacer par l'API réelle)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, statut: 'UPLOADE', fichier: file }
          : doc
      ));
      
      updateDossierStatus();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    } finally {
      setIsUploading(null);
    }
  };

  const handleDocumentValidation = (documentId: string, isValid: boolean, commentaire?: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { 
            ...doc, 
            statut: isValid ? 'VALIDE' : 'REJETE',
            commentaire: commentaire || doc.commentaire
          }
        : doc
    ));
    
    if (!isValid) {
      setShowRejectionModal(null);
      setRejectionReason('');
    }
    
    updateDossierStatus();
  };

  const updateDossierStatus = () => {
    const documentsObligatoires = documents.filter(doc => doc.obligatoire);
    const documentsValides = documentsObligatoires.filter(doc => doc.statut === 'VALIDE');
    const documentsRejetes = documents.filter(doc => doc.statut === 'REJETE');
    
    let nouveauStatut: Dossier['statut'] = dossier.statut;
    let documentsManquants: string[] = [];
    
    if (documentsRejetes.length > 0) {
      nouveauStatut = 'REJETE';
    } else if (documentsValides.length === documentsObligatoires.length) {
      nouveauStatut = 'VALIDE';
    } else if (documents.some(doc => doc.statut === 'UPLOADE')) {
      nouveauStatut = 'EN_COURS';
    } else {
      nouveauStatut = 'INCOMPLET';
      documentsManquants = documentsObligatoires
        .filter(doc => doc.statut === 'MANQUANT')
        .map(doc => doc.nom);
    }
    
    const updatedDossier = {
      ...dossier,
      statut: nouveauStatut,
      documentsManquants
    };
    
    onDossierUpdated(updatedDossier);
  };

  const handleValidateToRegisseur = () => {
    const documentsObligatoires = documents.filter(doc => doc.obligatoire);
    const documentsValides = documentsObligatoires.filter(doc => doc.statut === 'VALIDE');
    
    if (documentsValides.length === documentsObligatoires.length) {
      const updatedDossier = {
        ...dossier,
        statut: 'VALIDE' as const
      };
      onDossierUpdated(updatedDossier);
      alert('Dossier validé et transféré vers REGISSEUR');
    } else {
      alert('Tous les documents obligatoires doivent être validés avant de passer à l\'étape suivante');
    }
  };

  const handleRejectDossier = () => {
    const updatedDossier = {
      ...dossier,
      statut: 'REJETE' as const
    };
    onDossierUpdated(updatedDossier);
    alert('Dossier rejeté');
  };

  const handlePutOnHold = () => {
    const updatedDossier = {
      ...dossier,
      statut: 'INCOMPLET' as const
    };
    onDossierUpdated(updatedDossier);
    alert('Dossier mis en attente');
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'VALIDE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJETE':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'UPLOADE':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'VALIDE': return 'Validé';
      case 'REJETE': return 'Rejeté';
      case 'UPLOADE': return 'En attente de validation';
      default: return 'Manquant';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <DocumentCheckIcon className="h-6 w-6 text-mali-emerald mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Documents obligatoires - {dossier.reference}
          </h3>
        </div>
        <div className="text-sm text-gray-600">
          {documents.filter(d => d.obligatoire && d.statut === 'VALIDE').length} / {documents.filter(d => d.obligatoire).length} validés
        </div>
      </div>

      {/* Liste des documents */}
      <div className="space-y-4">
        {documents.map((document) => (
          <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(document.statut)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{document.nom}</span>
                    {document.obligatoire && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getStatusText(document.statut)}
                    {document.commentaire && (
                      <span className="text-red-600 ml-2">- {document.commentaire}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {document.statut === 'MANQUANT' && (
                  <div>
                    <input
                      type="file"
                      id={`file-${document.id}`}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(document.id, file);
                      }}
                    />
                    <label
                      htmlFor={`file-${document.id}`}
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {isUploading === document.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mali-emerald mr-2"></div>
                          Upload...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                          Uploader
                        </>
                      )}
                    </label>
                  </div>
                )}

                {document.statut === 'UPLOADE' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDocumentValidation(document.id, true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => setShowRejectionModal(document.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      Rejeter
                    </button>
                  </div>
                )}

                {document.statut === 'REJETE' && (
                  <button
                    onClick={() => handleDocumentValidation(document.id, false)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Réuploader
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions du dossier */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Actions sur le dossier</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleValidateToRegisseur}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Valider vers REGISSEUR
          </button>
          
          <button
            onClick={handleRejectDossier}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Rejeter
          </button>
          
          <button
            onClick={handlePutOnHold}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Mettre en attente
          </button>
        </div>
      </div>

      {/* Modal de rejet */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Motif de rejet
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez pourquoi ce document est rejeté..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRejectionModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDocumentValidation(showRejectionModal, false, rejectionReason)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsChecklist;
