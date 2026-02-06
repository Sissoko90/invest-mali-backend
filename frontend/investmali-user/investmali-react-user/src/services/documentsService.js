import api from './api';

const documentsService = {
  // Upload un document supplémentaire de type AUTRES
  uploadAutresDocument: async (personneId, entrepriseId, nom, description, file) => {
    const formData = new FormData();
    formData.append('personneId', personneId);
    formData.append('entrepriseId', entrepriseId);
    formData.append('nom', nom);
    if (description) {
      formData.append('description', description);
    }
    formData.append('file', file);

    const response = await api.post('/documents/autres', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Upload plusieurs documents supplémentaires
  uploadMultipleAutresDocuments: async (personneId, entrepriseId, documents) => {
    const results = [];
    
    for (const doc of documents) {
      if (doc.file && doc.name) {
        try {
          const result = await documentsService.uploadAutresDocument(
            personneId,
            entrepriseId,
            doc.name,
            doc.description,
            doc.file
          );
          results.push({
            success: true,
            document: result,
            originalDoc: doc
          });
        } catch (error) {
          console.error('Erreur upload document AUTRES:', error);
          results.push({
            success: false,
            error: error.response?.data?.message || error.message,
            originalDoc: doc
          });
        }
      }
    }
    
    return results;
  },

  // Récupérer les documents d'une entreprise
  getDocumentsByEntreprise: async (entrepriseId) => {
    const response = await api.get(`/documents/entreprise/${entrepriseId}`);
    return response.data;
  },

  // Supprimer un document
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  }
};

export default documentsService;
