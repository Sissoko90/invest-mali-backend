import React, { useState } from 'react';
import PaymentIntegration from '../components/PaymentIntegration';

/**
 * EXEMPLE D'UTILISATION DU SYSTÈME DE PAIEMENT STRIPE
 * 
 * Ce composant montre comment intégrer facilement le paiement Stripe
 * dans n'importe quelle page de votre application.
 */

const PaymentExample: React.FC = () => {
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  
  // ID de l'entreprise (normalement récupéré depuis le contexte/props)
  const entrepriseId = "5d3f3e7f-d6e1-4544-ad69-2daaf19d0688"; // Exemple: lolipop
  
  const handlePaymentSuccess = (result: any) => {
    console.log('🎉 Paiement terminé avec succès:', result);
    setPaymentStatus(`Paiement réussi ! ID: ${result.paymentId || result.id}`);
  };

  const handlePaymentCancel = () => {
    console.log('❌ Paiement annulé');
    setPaymentStatus('Paiement annulé');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🚀 Exemple d'intégration Paiement Stripe
        </h1>

        {/* Statut du paiement */}
        {paymentStatus && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              📋 Statut: {paymentStatus}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Exemple 1: Bouton par défaut */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              💳 Exemple 1: Bouton par défaut
            </h2>
            <p className="text-gray-600 mb-6">
              Utilisation la plus simple avec le bouton par défaut.
            </p>
            
            <PaymentIntegration
              entrepriseId={entrepriseId}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <code className="text-sm text-gray-700">
                {`<PaymentIntegration
  entrepriseId="${entrepriseId}"
  onSuccess={handlePaymentSuccess}
  onCancel={handlePaymentCancel}
/>`}
              </code>
            </div>
          </div>

          {/* Exemple 2: Bouton personnalisé */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🎨 Exemple 2: Bouton personnalisé
            </h2>
            <p className="text-gray-600 mb-6">
              Avec un bouton personnalisé et montant fixe.
            </p>
            
            <PaymentIntegration
              entrepriseId={entrepriseId}
              amount={25000} // 25,000 XOF
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              triggerButton={
                <button className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105 flex items-center justify-center space-x-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <div className="font-bold">Paiement Premium</div>
                    <div className="text-sm opacity-90">25,000 XOF</div>
                  </div>
                </button>
              }
            />
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <code className="text-sm text-gray-700">
                {`<PaymentIntegration
  entrepriseId="${entrepriseId}"
  amount={25000}
  triggerButton={<CustomButton />}
  onSuccess={handlePaymentSuccess}
/>`}
              </code>
            </div>
          </div>

          {/* Exemple 3: Dans un formulaire */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📝 Exemple 3: Dans un formulaire
            </h2>
            <p className="text-gray-600 mb-6">
              Intégration dans un formulaire de demande.
            </p>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Ma Super Entreprise"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'entreprise
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent">
                  <option>SARL</option>
                  <option>SA</option>
                  <option>SAS</option>
                </select>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <PaymentIntegration
                  entrepriseId={entrepriseId}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                  triggerButton={
                    <button
                      type="button"
                      className="w-full px-6 py-3 bg-mali-emerald text-white rounded-lg hover:bg-mali-emerald-dark transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>🚀</span>
                      <span>Finaliser et Payer</span>
                    </button>
                  }
                />
              </div>
            </form>
          </div>

          {/* Exemple 4: Avec callback avancé */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ⚡ Exemple 4: Callback avancé
            </h2>
            <p className="text-gray-600 mb-6">
              Avec gestion avancée des callbacks et redirection.
            </p>
            
            <PaymentIntegration
              entrepriseId={entrepriseId}
              onSuccess={(result) => {
                console.log('🎯 Callback avancé:', result);
                setPaymentStatus('Paiement réussi - Redirection en cours...');
                
                // Exemple: redirection après succès
                setTimeout(() => {
                  // window.location.href = '/dashboard?payment=success';
                  setPaymentStatus('Redirection simulée vers /dashboard');
                }, 2000);
              }}
              onCancel={() => {
                setPaymentStatus('Paiement annulé - Vous pouvez réessayer');
              }}
              triggerButton={
                <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                  <span>🔮</span>
                  <span>Paiement avec Callback</span>
                </button>
              }
            />
          </div>
        </div>

        {/* Guide d'utilisation */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📚 Guide d'utilisation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔧 Props disponibles
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">entrepriseId</code> - ID de l'entreprise (requis)</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">amount</code> - Montant fixe (optionnel)</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">onSuccess</code> - Callback de succès</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">onCancel</code> - Callback d'annulation</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">triggerButton</code> - Bouton personnalisé</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ⚡ Fonctionnalités
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Intégration Stripe complète</li>
                <li>✅ Sélection de méthode de paiement</li>
                <li>✅ Synchronisation automatique</li>
                <li>✅ Reçu de paiement</li>
                <li>✅ Gestion d'erreurs</li>
                <li>✅ Interface responsive</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample;
