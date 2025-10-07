import React from 'react';
import { useParams } from 'react-router-dom';
import DossierWorkflow from '../components/DossierWorkflow';

const DossierWorkflowPage: React.FC = () => {
  const { dossierId } = useParams<{ dossierId?: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {dossierId ? `Dossier ${dossierId}` : 'Nouveau Dossier'}
          </h1>
          <p className="mt-2 text-gray-600">
            Workflow de traitement des demandes d'entreprise
          </p>
        </div>
        
        <DossierWorkflow dossierId={dossierId} />
      </div>
    </div>
  );
};

export default DossierWorkflowPage;
