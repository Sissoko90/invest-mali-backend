import React, { useState } from 'react';

const TestOrangeMoneyV2Page: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🔧 Test de connectivité Orange Money V2');
      
      const response = await fetch('/api/v1/orange-money/v2/test-connection', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        console.log('✅ Test de connectivité réussi:', data);
      } else {
        console.error('❌ Test de connectivité échoué:', data);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du test:', error);
      setError(error.message || 'Une erreur est survenue lors du test');
    } finally {
      setLoading(false);
    }
  };

  const testPayment = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('💳 Test de paiement Orange Money V2');
      
      const response = await fetch('/api/v1/orange-money/v2/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          entrepriseId: 'test-entreprise-123',
          amount: 1000 // 1000 XOF pour test
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        console.log('✅ Test de paiement réussi:', data);
      } else {
        console.error('❌ Test de paiement échoué:', data);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du test de paiement:', error);
      setError(error.message || 'Une erreur est survenue lors du test de paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            🧪 Test Orange Money V2
          </h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testConnection}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Test en cours...' : '🔧 Tester la connectivité OAuth2'}
            </button>
            
            <button
              onClick={testPayment}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Test en cours...' : '💳 Tester l\'initialisation de paiement'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-medium mb-2">❌ Erreur</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-gray-800 font-medium mb-2">
                {result.success ? '✅ Résultat' : '❌ Erreur'}
              </h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-medium mb-2">ℹ️ Informations</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Endpoint OAuth2:</strong> https://api.orange.com/oauth/v3/token</p>
              <p>• <strong>Endpoint Webpay:</strong> https://api.orange.com/orange-money-webpay/dev/v1/webpayment</p>
              <p>• <strong>Client ID:</strong> kjTUZBtBr5DCrM2SX2shgJqxi0mA0wb2</p>
              <p>• <strong>Merchant Key:</strong> 24330c34</p>
              <p>• <strong>Devise:</strong> OUV (selon test Postman)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestOrangeMoneyV2Page;
