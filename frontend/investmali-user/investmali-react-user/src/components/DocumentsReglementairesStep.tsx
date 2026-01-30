<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { CloudArrowDownIcon, DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { getActiviteReglementeeData, getPiecesRequises, PieceJointe } from '../data/activitesReglementeesData';

interface DocumentsReglementairesStepProps {
  domaineActivite?: string;
  typePersonne: 'physique' | 'morale';
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  uploadedDocuments: UploadedDocument[];
}

export interface UploadedDocument {
  type: 'formulaire' | 'piece_jointe';
  nom: string;
  file: File;
  uploaded: boolean;
}

const DocumentsReglementairesStep: React.FC<DocumentsReglementairesStepProps> = ({
  domaineActivite,
  typePersonne,
  onDocumentsChange,
  uploadedDocuments
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>(uploadedDocuments);
  const [activiteData, setActiviteData] = useState<any>(null);
  const [piecesRequises, setPiecesRequises] = useState<PieceJointe[]>([]);

  useEffect(() => {
    if (domaineActivite) {
      const data = getActiviteReglementeeData(domaineActivite);
      setActiviteData(data);
      
      if (data) {
        const pieces = getPiecesRequises(domaineActivite, typePersonne);
        setPiecesRequises(pieces);
      }
    }
  }, [domaineActivite, typePersonne]);

  useEffect(() => {
    onDocumentsChange(documents);
  }, [documents, onDocumentsChange]);

  const handleDownloadFormulaire = () => {
    if (!activiteData?.formulaire) return;
    
    try {
      console.log(`📥 Téléchargement du formulaire: ${activiteData.formulaire.nom}`);
      
      const link = document.createElement('a');
      link.href = `${process.env.PUBLIC_URL}/formulaires/${activiteData.formulaire.fichier}`;
      link.download = activiteData.formulaire.fichier;
      link.setAttribute('target', '_blank');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Téléchargement initié: ${activiteData.formulaire.nom}`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert(`Erreur lors du téléchargement du formulaire.`);
    }
  };

  const handleFileUpload = (type: 'formulaire' | 'piece_jointe', nom: string, file: File) => {
    const newDocument: UploadedDocument = {
      type,
      nom,
      file,
      uploaded: true
    };

    setDocuments(prev => {
      const filtered = prev.filter(d => !(d.type === type && d.nom === nom));
      return [...filtered, newDocument];
    });

    console.log(`✅ Document uploadé: ${nom}`, file.name);
  };

  const handleRemoveDocument = (type: 'formulaire' | 'piece_jointe', nom: string) => {
    setDocuments(prev => prev.filter(d => !(d.type === type && d.nom === nom)));
    console.log(`🗑️ Document supprimé: ${nom}`);
  };

  const isDocumentUploaded = (type: 'formulaire' | 'piece_jointe', nom: string): boolean => {
    return documents.some(d => d.type === type && d.nom === nom && d.uploaded);
  };

  const getUploadedDocument = (type: 'formulaire' | 'piece_jointe', nom: string): UploadedDocument | undefined => {
    return documents.find(d => d.type === type && d.nom === nom);
  };

  if (!domaineActivite || !activiteData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune activité réglementée sélectionnée</p>
      </div>
    );
  }

  const allRequiredDocumentsUploaded = () => {
    // Vérifier que le formulaire est uploadé
    const formulaireUploaded = isDocumentUploaded('formulaire', activiteData.formulaire.nom);
    if (!formulaireUploaded) return false;

    // Vérifier que toutes les pièces obligatoires sont uploadées
    const obligatoires = piecesRequises.filter(p => p.obligatoire);
    return obligatoires.every(piece => isDocumentUploaded('piece_jointe', piece.nom));
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Documents réglementaires requis
        </h2>
        <p className="text-gray-700">
          <span className="font-semibold">Activité:</span> {activiteData.nom}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Type:</span> {typePersonne === 'physique' ? 'Personne physique' : 'Personne morale'}
        </p>
      </div>

      {/* Section Formulaire */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <CloudArrowDownIcon className="h-6 w-6 mr-3" />
            Formulaire officiel
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg mb-1">
                {activiteData.formulaire.nom}
              </h4>
              {activiteData.formulaire.description && (
                <p className="text-sm text-gray-600 mb-2">{activiteData.formulaire.description}</p>
              )}
              <p className="text-xs text-green-700 font-medium">
                Format: {activiteData.formulaire.fichier.endsWith('.pdf') ? 'PDF' : 'Word'}
              </p>
            </div>
            <button
              onClick={handleDownloadFormulaire}
              className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-sm"
            >
              <CloudArrowDownIcon className="h-5 w-5" />
              <span>Télécharger</span>
            </button>
          </div>

          {/* Upload du formulaire signé */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Téléverser la fiche signé et timbré <span className="text-red-500">*</span>
            </label>
            
            {!isDocumentUploaded('formulaire', activiteData.formulaire.nom) ? (
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload('formulaire', activiteData.formulaire.nom, file);
                    }
                  }}
                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {getUploadedDocument('formulaire', activiteData.formulaire.nom)?.file.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {(getUploadedDocument('formulaire', activiteData.formulaire.nom)?.file.size || 0 / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDocument('formulaire', activiteData.formulaire.nom)}
                  className="text-red-600 hover:text-red-800 font-semibold text-sm"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Pièces jointes */}
      {piecesRequises.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <DocumentArrowUpIcon className="h-6 w-6 mr-3" />
              Pièces jointes requises
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {piecesRequises.map((piece, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {piece.nom}
                      {piece.obligatoire && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    {piece.description && (
                      <p className="text-sm text-gray-600">{piece.description}</p>
                    )}
                  </div>
                  {isDocumentUploaded('piece_jointe', piece.nom) && (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 ml-3" />
                  )}
                </div>

                {!isDocumentUploaded('piece_jointe', piece.nom) ? (
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload('piece_jointe', piece.nom, file);
                      }
                    }}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {getUploadedDocument('piece_jointe', piece.nom)?.file.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {((getUploadedDocument('piece_jointe', piece.nom)?.file.size || 0) / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDocument('piece_jointe', piece.nom)}
                      className="text-red-600 hover:text-red-800 font-semibold text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résumé */}
      <div className={`p-4 rounded-xl border-2 ${allRequiredDocumentsUploaded() ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
        <div className="flex items-center space-x-3">
          {allRequiredDocumentsUploaded() ? (
            <>
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <p className="text-green-800 font-semibold">
                Tous les documents obligatoires ont été uploadés
              </p>
            </>
          ) : (
            <>
              <XCircleIcon className="h-6 w-6 text-yellow-600" />
              <p className="text-yellow-800 font-semibold">
                Veuillez téléverser tous les documents obligatoires (marqués d'un *)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsReglementairesStep;
=======
import React, { useState, useEffect } from 'react';
import { CloudArrowDownIcon, DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { getActiviteReglementeeData, getPiecesRequises, PieceJointe } from '../data/activitesReglementeesData';

interface DocumentsReglementairesStepProps {
  domaineActivite?: string;
  typePersonne: 'physique' | 'morale';
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  uploadedDocuments: UploadedDocument[];
}

export interface UploadedDocument {
  type: 'formulaire' | 'piece_jointe';
  nom: string;
  file: File;
  uploaded: boolean;
}

const DocumentsReglementairesStep: React.FC<DocumentsReglementairesStepProps> = ({
  domaineActivite,
  typePersonne,
  onDocumentsChange,
  uploadedDocuments
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>(uploadedDocuments);
  const [activiteData, setActiviteData] = useState<any>(null);
  const [piecesRequises, setPiecesRequises] = useState<PieceJointe[]>([]);

  useEffect(() => {
    if (domaineActivite) {
      const data = getActiviteReglementeeData(domaineActivite);
      setActiviteData(data);
      
      if (data) {
        const pieces = getPiecesRequises(domaineActivite, typePersonne);
        setPiecesRequises(pieces);
      }
    }
  }, [domaineActivite, typePersonne]);

  useEffect(() => {
    onDocumentsChange(documents);
  }, [documents, onDocumentsChange]);

  const handleDownloadFormulaire = () => {
    if (!activiteData?.formulaire) return;
    
    try {
      console.log(`📥 Téléchargement du formulaire: ${activiteData.formulaire.nom}`);
      
      const link = document.createElement('a');
      link.href = `${process.env.PUBLIC_URL}/formulaires/${activiteData.formulaire.fichier}`;
      link.download = activiteData.formulaire.fichier;
      link.setAttribute('target', '_blank');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Téléchargement initié: ${activiteData.formulaire.nom}`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert(`Erreur lors du téléchargement du formulaire.`);
    }
  };

  const handleFileUpload = (type: 'formulaire' | 'piece_jointe', nom: string, file: File) => {
    const newDocument: UploadedDocument = {
      type,
      nom,
      file,
      uploaded: true
    };

    setDocuments(prev => {
      const filtered = prev.filter(d => !(d.type === type && d.nom === nom));
      return [...filtered, newDocument];
    });

    console.log(`✅ Document uploadé: ${nom}`, file.name);
  };

  const handleRemoveDocument = (type: 'formulaire' | 'piece_jointe', nom: string) => {
    setDocuments(prev => prev.filter(d => !(d.type === type && d.nom === nom)));
    console.log(`🗑️ Document supprimé: ${nom}`);
  };

  const isDocumentUploaded = (type: 'formulaire' | 'piece_jointe', nom: string): boolean => {
    return documents.some(d => d.type === type && d.nom === nom && d.uploaded);
  };

  const getUploadedDocument = (type: 'formulaire' | 'piece_jointe', nom: string): UploadedDocument | undefined => {
    return documents.find(d => d.type === type && d.nom === nom);
  };

  if (!domaineActivite || !activiteData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune activité réglementée sélectionnée</p>
      </div>
    );
  }

  const allRequiredDocumentsUploaded = () => {
    // Vérifier que le formulaire est uploadé
    const formulaireUploaded = isDocumentUploaded('formulaire', activiteData.formulaire.nom);
    if (!formulaireUploaded) return false;

    // Vérifier que toutes les pièces obligatoires sont uploadées
    const obligatoires = piecesRequises.filter(p => p.obligatoire);
    return obligatoires.every(piece => isDocumentUploaded('piece_jointe', piece.nom));
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Documents réglementaires requis
        </h2>
        <p className="text-gray-700">
          <span className="font-semibold">Activité:</span> {activiteData.nom}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Type:</span> {typePersonne === 'physique' ? 'Personne physique' : 'Personne morale'}
        </p>
      </div>

      {/* Section Formulaire */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <CloudArrowDownIcon className="h-6 w-6 mr-3" />
            Formulaire officiel
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg mb-1">
                {activiteData.formulaire.nom}
              </h4>
              {activiteData.formulaire.description && (
                <p className="text-sm text-gray-600 mb-2">{activiteData.formulaire.description}</p>
              )}
              <p className="text-xs text-green-700 font-medium">
                Format: {activiteData.formulaire.fichier.endsWith('.pdf') ? 'PDF' : 'Word'}
              </p>
            </div>
            <button
              onClick={handleDownloadFormulaire}
              className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold text-sm"
            >
              <CloudArrowDownIcon className="h-5 w-5" />
              <span>Télécharger</span>
            </button>
          </div>

          {/* Upload du formulaire signé */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Uploader le formulaire signé et timbré <span className="text-red-500">*</span>
            </label>
            
            {!isDocumentUploaded('formulaire', activiteData.formulaire.nom) ? (
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload('formulaire', activiteData.formulaire.nom, file);
                    }
                  }}
                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {getUploadedDocument('formulaire', activiteData.formulaire.nom)?.file.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {(getUploadedDocument('formulaire', activiteData.formulaire.nom)?.file.size || 0 / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDocument('formulaire', activiteData.formulaire.nom)}
                  className="text-red-600 hover:text-red-800 font-semibold text-sm"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Pièces jointes */}
      {piecesRequises.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <DocumentArrowUpIcon className="h-6 w-6 mr-3" />
              Pièces jointes requises
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {piecesRequises.map((piece, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {piece.nom}
                      {piece.obligatoire && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    {piece.description && (
                      <p className="text-sm text-gray-600">{piece.description}</p>
                    )}
                  </div>
                  {isDocumentUploaded('piece_jointe', piece.nom) && (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 ml-3" />
                  )}
                </div>

                {!isDocumentUploaded('piece_jointe', piece.nom) ? (
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload('piece_jointe', piece.nom, file);
                      }
                    }}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {getUploadedDocument('piece_jointe', piece.nom)?.file.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {((getUploadedDocument('piece_jointe', piece.nom)?.file.size || 0) / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDocument('piece_jointe', piece.nom)}
                      className="text-red-600 hover:text-red-800 font-semibold text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résumé */}
      <div className={`p-4 rounded-xl border-2 ${allRequiredDocumentsUploaded() ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
        <div className="flex items-center space-x-3">
          {allRequiredDocumentsUploaded() ? (
            <>
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <p className="text-green-800 font-semibold">
                Tous les documents obligatoires ont été uploadés
              </p>
            </>
          ) : (
            <>
              <XCircleIcon className="h-6 w-6 text-yellow-600" />
              <p className="text-yellow-800 font-semibold">
                Veuillez uploader tous les documents obligatoires (marqués d'un *)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsReglementairesStep;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
