import React, { useState, useEffect } from 'react';

interface DocumentViewerProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, documentName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📄 Chargement du document pour visualisation:', documentId);
        
        // Utiliser le même endpoint que pour le téléchargement
        const response = await fetch(`${process.env.REACT_APP_USER_API_URL}/documents/${documentId}/file`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_user_token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDocumentUrl(url);
        
        console.log('✅ Document chargé pour visualisation');
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du document:', err);
        setError(err.message || 'Erreur lors du chargement du document');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadDocument();
    }

    // Cleanup function pour libérer l'URL blob
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{documentName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Chargement du document...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h4>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {documentUrl && !loading && !error && (
            <div className="h-full">
              <iframe
                src={documentUrl}
                className="w-full h-full border-0 rounded"
                title={documentName}
                onLoad={() => console.log('✅ Document affiché dans l\'iframe')}
                onError={() => setError('Impossible d\'afficher ce type de document')}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
