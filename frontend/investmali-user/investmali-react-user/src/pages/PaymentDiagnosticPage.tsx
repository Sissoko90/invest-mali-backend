import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

interface DiagnosticResult {
  entrepriseId: string;
  timestamp: string;
  entreprise_existe: boolean;
  entreprise_nom?: string;
  entreprise_statut?: string;
  nombre_membres?: number;
  nombre_paiements?: number;
  association_bidirectionnelle?: boolean;
  paiements_details?: any[];
  dernier_paiement?: any;
  erreur?: string;
}

const PaymentDiagnosticPage: React.FC = () => {
  const [entrepriseId, setEntrepriseId] = useState('5d3f3e7f-d6e1-4544-ad69-2daaf19d0688');
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runDiagnostic = async () => {
    if (!entrepriseId.trim()) {
      setError('Veuillez saisir un ID d\'entreprise');
      return;
    }

    setLoading(true);
    setError('');
    setDiagnostic(null);

    try {
      console.log('🔍 Lancement diagnostic pour:', entrepriseId);
      const response = await apiRequest(`/test/diagnostic/entreprise/${entrepriseId}`);
      console.log('📊 Résultat diagnostic:', response);
      setDiagnostic(response);
    } catch (err: any) {
      console.error('❌ Erreur diagnostic:', err);
      setError(err.message || 'Erreur lors du diagnostic');
    } finally {
      setLoading(false);
    }
  };

  const testPaymentIntent = async () => {
    if (!entrepriseId.trim()) {
      setError('Veuillez saisir un ID d\'entreprise');
      return;
    }

    try {
      console.log('🧪 Test PaymentIntent pour:', entrepriseId);
      const response = await apiRequest(`/test/stripe/payment-intent/${entrepriseId}`, {
        method: 'POST'
      });
      console.log('✅ Test PaymentIntent:', response);
      alert(`Test PaymentIntent: ${response.status}\n${response.message}`);
    } catch (err: any) {
      console.error('❌ Erreur test PaymentIntent:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  const simulateSync = async () => {
    if (!entrepriseId.trim()) {
      setError('Veuillez saisir un ID d\'entreprise');
      return;
    }

    const paymentIntentId = `pi_test_${Date.now()}`;
    
    try {
      console.log('🎭 Simulation sync pour:', paymentIntentId);
      const response = await apiRequest(`/test/stripe/simulate-sync/${paymentIntentId}?entrepriseId=${entrepriseId}&amount=25000`, {
        method: 'POST'
      });
      console.log('✅ Simulation sync:', response);
      alert(`Simulation sync: ${response.status}\n${response.message}`);
    } catch (err: any) {
      console.error('❌ Erreur simulation sync:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  useEffect(() => {
    // Lancer le diagnostic automatiquement au chargement
    if (entrepriseId) {
      runDiagnostic();
    }
  }, []);

  const getStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return 'text-gray-500';
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return '❓';
    return status ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🔍 Diagnostic Paiement ↔ Entreprise
        </h1>

        {/* Formulaire de test */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🧪 Configuration du test
          </h2>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de l'entreprise
              </label>
              <input
                type="text"
                value={entrepriseId}
                onChange={(e) => setEntrepriseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                placeholder="5d3f3e7f-d6e1-4544-ad69-2daaf19d0688"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={runDiagnostic}
              disabled={loading}
              className="px-4 py-2 bg-investmali-accent text-white rounded-lg hover:bg-investmali-accent-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Diagnostic...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Lancer Diagnostic</span>
                </>
              )}
            </button>

            <button
              onClick={testPaymentIntent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>🧪</span>
              <span>Test PaymentIntent</span>
            </button>

            <button
              onClick={simulateSync}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <span>🎭</span>
              <span>Simuler Sync</span>
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2">
              <span className="text-red-500 text-xl">❌</span>
              <span className="text-red-700 font-medium">Erreur</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}

        {/* Résultats du diagnostic */}
        {diagnostic && (
          <div className="space-y-6">
            {/* Résumé */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📊 Résumé du diagnostic
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl ${getStatusColor(diagnostic.entreprise_existe)}`}>
                    {getStatusIcon(diagnostic.entreprise_existe)}
                  </div>
                  <div className="font-semibold text-gray-900 mt-2">Entreprise</div>
                  <div className="text-sm text-gray-600">
                    {diagnostic.entreprise_existe ? 'Trouvée' : 'Non trouvée'}
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl text-blue-600">👥</div>
                  <div className="font-semibold text-gray-900 mt-2">Membres</div>
                  <div className="text-sm text-gray-600">
                    {diagnostic.nombre_membres || 0} membre(s)
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl text-green-600">💳</div>
                  <div className="font-semibold text-gray-900 mt-2">Paiements</div>
                  <div className="text-sm text-gray-600">
                    {diagnostic.nombre_paiements || 0} paiement(s)
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl ${getStatusColor(diagnostic.association_bidirectionnelle)}`}>
                    {getStatusIcon(diagnostic.association_bidirectionnelle)}
                  </div>
                  <div className="font-semibold text-gray-900 mt-2">Association</div>
                  <div className="text-sm text-gray-600">
                    {diagnostic.association_bidirectionnelle ? 'Liée' : 'Non liée'}
                  </div>
                </div>
              </div>
            </div>

            {/* Détails de l'entreprise */}
            {diagnostic.entreprise_existe && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🏢 Détails de l'entreprise
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <p className="text-gray-900 font-semibold">{diagnostic.entreprise_nom}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <p className="text-gray-900">{diagnostic.entreprise_statut}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <p className="text-gray-600 text-sm font-mono">{diagnostic.entrepriseId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Diagnostic</label>
                    <p className="text-gray-600 text-sm">{diagnostic.timestamp}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Paiements */}
            {diagnostic.nombre_paiements && diagnostic.nombre_paiements > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  💳 Paiements ({diagnostic.nombre_paiements})
                </h2>

                {/* Dernier paiement */}
                {diagnostic.dernier_paiement && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-green-900 mb-2">💰 Dernier paiement</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Montant:</span>
                        <span className="ml-2 font-semibold text-green-700">
                          {diagnostic.dernier_paiement.montant} XOF
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Statut:</span>
                        <span className="ml-2 font-semibold text-green-700">
                          {diagnostic.dernier_paiement.statut}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 text-gray-700">
                          {new Date(diagnostic.dernier_paiement.date).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Référence:</span>
                        <span className="ml-2 text-gray-700 font-mono text-xs">
                          {diagnostic.dernier_paiement.reference}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste des paiements */}
                {diagnostic.paiements_details && diagnostic.paiements_details.length > 1 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">📋 Tous les paiements</h3>
                    <div className="space-y-2">
                      {diagnostic.paiements_details.map((paiement, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Montant:</span>
                              <span className="ml-2 font-semibold">{paiement.montant} XOF</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Statut:</span>
                              <span className="ml-2">{paiement.statut}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <span className="ml-2">{paiement.type}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Référence:</span>
                              <span className="ml-2 font-mono text-xs">{paiement.reference}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Association bidirectionnelle */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔗 Association bidirectionnelle
              </h2>
              
              {diagnostic.association_bidirectionnelle ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-500 text-xl">✅</span>
                    <span className="font-semibold text-green-900">Association établie</span>
                  </div>
                  <p className="text-green-700 text-sm">
                    L'entreprise est correctement liée à son paiement. L'API devrait retourner les champs de paiement.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-red-500 text-xl">❌</span>
                    <span className="font-semibold text-red-900">Association manquante</span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">
                    L'entreprise n'est pas liée à un paiement via la relation @OneToOne. 
                    Les champs de paiement ne seront pas retournés par l'API.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-sm font-medium">💡 Solution :</p>
                    <p className="text-yellow-700 text-sm">
                      Effectuer un nouveau paiement ou corriger l'association bidirectionnelle dans PaiementServiceImpl.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* JSON brut */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📄 Données brutes (JSON)
              </h2>
              <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
                {JSON.stringify(diagnostic, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDiagnosticPage;

