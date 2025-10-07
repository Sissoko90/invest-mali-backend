import React, { useState, useEffect } from 'react';
import { agentBusinessAPI } from '../services/api';

interface Application {
  id: string;
  companyName: string;
  reference: string;
  status: string;
  submittedAt: string;
  typeEntreprise: string;
  formeJuridique: string;
  domaineActivite: string;
  divisionCode: string;
  divisionNom: string;
}

const SimpleApplicationsList: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        console.log('Chargement des applications...');
        const response = await agentBusinessAPI.listApplications({
          page: 1,
          limit: 20,
          assigned: 'all',
          sort: '-submitted_at'
        });
        
        console.log('Réponse API:', response.data);
        setApplications(response.data.applications || []);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Liste des Applications</h2>
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Liste des Applications</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Liste des Applications ({applications.length})</h2>
      
      {applications.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Aucune application trouvée
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-blue-600">
                    {app.companyName || 'Nom non disponible'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    <strong>Référence:</strong> {app.reference}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>ID:</strong> {app.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Statut:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      app.status === 'VALIDEE' ? 'bg-green-100 text-green-800' :
                      app.status === 'REJETEE' ? 'bg-red-100 text-red-800' :
                      app.status === 'EN_COURS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {app.typeEntreprise}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Forme juridique:</strong> {app.formeJuridique}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Domaine:</strong> {app.domaineActivite}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Localisation:</strong> {app.divisionNom || app.divisionCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Soumis le:</strong> {new Date(app.submittedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleApplicationsList;
