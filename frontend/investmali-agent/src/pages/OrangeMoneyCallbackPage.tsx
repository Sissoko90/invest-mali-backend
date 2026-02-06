import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Page de callback pour Orange Money V2 - Interface Agent
 * Cette page gère les redirections depuis Orange Money et envoie les données à la fenêtre parent
 */
const OrangeMoneyCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Extraire les paramètres de l'URL
    const order_id = searchParams.get('order_id');
    const status = searchParams.get('status');
    const txnid = searchParams.get('txnid') || searchParams.get('transaction_id');
    const reason = searchParams.get('reason');

    console.log('🔄 [OrangeMoneyCallbackPage - Agent] Paramètres reçus:', {
      order_id,
      status,
      txnid,
      reason
    });

    // Déterminer le type de callback
    let callbackType: 'ORANGE_MONEY_RETURN' | 'ORANGE_MONEY_CANCEL';
    let callbackData: any;

    if (status === 'SUCCESS' || (status && status.toLowerCase() === 'success')) {
      callbackType = 'ORANGE_MONEY_RETURN';
      callbackData = {
        order_id,
        status: 'SUCCESS',
        txnid
      };
    } else {
      callbackType = 'ORANGE_MONEY_CANCEL';
      callbackData = {
        order_id,
        status: status || 'CANCELLED',
        reason: reason || 'Paiement annulé ou échoué'
      };
    }

    // Envoyer le message à la fenêtre parent
    const messageData = {
      type: callbackType,
      data: callbackData
    };

    console.log('📞 [OrangeMoneyCallbackPage - Agent] Envoi du message:', messageData);

    // Essayer d'envoyer le message à la fenêtre parent
    try {
      if (window.opener) {
        window.opener.postMessage(messageData, window.location.origin);
        console.log('✅ [OrangeMoneyCallbackPage - Agent] Message envoyé à window.opener');
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(messageData, window.location.origin);
        console.log('✅ [OrangeMoneyCallbackPage - Agent] Message envoyé à window.parent');
      } else {
        console.warn('⚠️ [OrangeMoneyCallbackPage - Agent] Aucune fenêtre parent trouvée');
      }
    } catch (error) {
      console.error('❌ [OrangeMoneyCallbackPage - Agent] Erreur lors de l\'envoi du message:', error);
    }

    // Fermer la fenêtre après un délai
    setTimeout(() => {
      try {
        window.close();
      } catch (error) {
        console.log('ℹ️ [OrangeMoneyCallbackPage - Agent] Impossible de fermer la fenêtre automatiquement');
      }
    }, 2000);

  }, [searchParams]);

  // Déterminer l'affichage selon le statut
  const status = searchParams.get('status');
  const isSuccess = status === 'SUCCESS' || (status && status.toLowerCase() === 'success');
  const txnid = searchParams.get('txnid') || searchParams.get('transaction_id');
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className={`text-6xl mb-4 ${isSuccess ? 'text-primary-500' : 'text-red-500'}`}>
          {isSuccess ? '✅' : '❌'}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isSuccess ? 'Paiement réussi !' : 'Paiement annulé'}
        </h1>
        
        <p className="text-gray-600 mb-4">
          {isSuccess 
            ? 'Votre paiement Orange Money a été traité avec succès.'
            : 'Le paiement Orange Money a été annulé ou a échoué.'
          }
        </p>

        {isSuccess && txnid && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-primary-800">
              <strong>Transaction ID:</strong> {txnid}
            </p>
          </div>
        )}

        {!isSuccess && reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>Raison:</strong> {reason}
            </p>
          </div>
        )}

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-primary-800">
            Cette fenêtre se fermera automatiquement dans quelques secondes...
          </p>
        </div>

        <button
          onClick={() => window.close()}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Fermer
        </button>

        {/* Informations de debug en mode développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Debug (dev) :</p>
              <p>• order_id: {searchParams.get('order_id') || 'N/A'}</p>
              <p>• status: {searchParams.get('status') || 'N/A'}</p>
              <p>• txnid: {searchParams.get('txnid') || 'N/A'}</p>
              <p>• reason: {searchParams.get('reason') || 'N/A'}</p>
              <p>• Interface: Agent Callback</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrangeMoneyCallbackPage;
























