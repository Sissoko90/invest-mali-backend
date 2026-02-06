
import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.config';
import { 
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DocumentViewerProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documentId, 
  documentName, 
  onClose 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('');

  useEffect(() => {
    loadDocument();
    
    // Cleanup function pour révoquer l'URL blob
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/${documentId}/file`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Récupérer le type de contenu
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      setContentType(contentType);
      
      // Créer un blob et une URL pour l'affichage
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement du document:', error);
      setError('Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName || `document_${documentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderDocumentContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald"></div>
            <p className="mt-2 text-gray-500">Chargement du document...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={loadDocument}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-mali-emerald hover:bg-mali-emerald-dark"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    if (!documentUrl) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">Aucun document à afficher</p>
          </div>
        </div>
      );
    }

    // Déterminer le type de rendu selon le type de contenu
    if (contentType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center p-4">
          <img
            src={documentUrl}
            alt={documentName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            onError={() => setError('Impossible d\'afficher cette image')}
          />
        </div>
      );
    } else if (contentType === 'application/pdf') {
      return (
        <div className="h-[70vh]">
          <iframe
            src={documentUrl}
            title={documentName}
            className="w-full h-full border-0 rounded-lg"
            onError={() => setError('Impossible d\'afficher ce PDF')}
          />
        </div>
      );
    } else {
      // Pour les autres types de fichiers, proposer le téléchargement
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aperçu non disponible</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ce type de fichier ({contentType}) ne peut pas être affiché directement.
            </p>
            <button
              onClick={handleDownload}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-mali-emerald hover:bg-mali-emerald-dark"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Télécharger le fichier
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {documentName || 'Document'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  ID: {documentId}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {documentUrl && (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Télécharger
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50">
            {renderDocumentContent()}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mali-emerald sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;






















