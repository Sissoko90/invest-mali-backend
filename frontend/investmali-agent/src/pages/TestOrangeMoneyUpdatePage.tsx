import React, { useState } from 'react';

/**
 * Page de test pour forcer la mise à jour du statut d'un paiement Orange Money V2
 */
const TestOrangeMoneyUpdatePage: React.FC = () => {
  const [orderId, setOrderId] = useState('merchant_order_159');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleForceUpdate = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🔄 Force update pour OrderID:', orderId);

      const apiUrl = process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:8080/api/v1';
      // Essayer plusieurs clés de token pour compatibilité
      const authToken = localStorage.getItem('investmali_agent_token') || 
                       localStorage.getItem('agentToken') || 
                       localStorage.getItem('authToken') ||
                       localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/orange-money/v2/force-update-status/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
      }

      console.log('✅ Force update réponse:', data);
      setResult(data);

    } catch (error: any) {
      console.error('❌ Erreur force update:', error);
      setError(error.message || 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔄 Test Force Update Orange Money V2
          </h1>

          {/* Formulaire */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID à mettre à jour:
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="merchant_order_159"
              />
            </div>

            <button
              onClick={handleForceUpdate}
              disabled={loading || !orderId}
              className="bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🔄 Mise à jour...' : '🔄 Forcer la mise à jour du statut'}
            </button>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ Erreur</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Résultat */}
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">📋 Résultat:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Order ID</p>
                  <p className="text-lg text-gray-900">{result.order_id}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Statut actuel</p>
                  <p className="text-lg text-gray-900">{result.current_status}</p>
                </div>
                
                {result.updated && (
                  <>
                    <div className="bg-primary-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-primary-600">Nouveau statut</p>
                      <p className="text-lg text-primary-900">{result.new_status}</p>
                    </div>
                    
                    <div className="bg-primary-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-primary-600">Transaction ID</p>
                      <p className="text-lg text-primary-900">{result.txnid}</p>
                    </div>
                  </>
                )}
                
                <div className="bg-primary-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-primary-600">Statut Orange Money</p>
                  <p className="text-lg text-primary-900">{result.orange_money_status}</p>
                </div>
                
                <div className={`p-3 rounded-lg ${result.updated ? 'bg-primary-50' : 'bg-primary-50'}`}>
                  <p className={`text-sm font-medium ${result.updated ? 'text-primary-600' : 'text-primary-600'}`}>
                    Mis à jour
                  </p>
                  <p className={`text-lg ${result.updated ? 'text-sky-900' : 'text-primary-900'}`}>
                    {result.updated ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>

              {result.message && (
                <div className="bg-sky-50 border border-primary-200 rounded-lg p-4">
                  <p className="text-primary-800">{result.message}</p>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                  Réponse complète (JSON)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="font-medium text-primary-900 mb-2">Instructions:</h4>
            <ol className="text-sm text-primary-800 space-y-1">
              <li>1. Saisissez l'Order ID du paiement (merchant_order_159 par défaut)</li>
              <li>2. Cliquez sur "Forcer la mise à jour du statut"</li>
              <li>3. L'endpoint va vérifier le statut auprès d'Orange Money</li>
              <li>4. Si le statut est SUCCESS, le paiement sera mis à jour en base</li>
            </ol>
            <div className="mt-2 p-2 bg-primary-100 rounded text-xs text-primary-700">
              <strong>Cas actuel:</strong> merchant_order_159 payé avec succès (MP251121.1039.A01216) mais statut EN_ATTENTE en base.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestOrangeMoneyUpdatePage;
























