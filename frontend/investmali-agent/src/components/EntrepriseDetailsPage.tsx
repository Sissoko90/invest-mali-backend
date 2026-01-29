import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EntrepriseDetails from './EntrepriseDetails';

const EntrepriseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Retour à la page précédente
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50 to-primary-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Entreprise non trouvée</h1>
          <p className="text-slate-600 mb-6">L'ID de l'entreprise est manquant.</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <EntrepriseDetails 
      entrepriseId={id} 
      onBack={handleBack}
    />
  );
};

export default EntrepriseDetailsPage;
























