import React, { useState } from 'react';
import PaymentReceipt from './PaymentReceipt';

interface PaymentStatusProps {
  status: 'success' | 'error' | 'pending' | 'processing';
  title: string;
  message: string;
  details?: string;
  transactionRef?: string;
  paymentData?: {
    entrepriseId: string;
    entrepriseName: string;
    entrepriseType: string;
    localisation: string;
    commune: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    paymentDate: string;
    status: 'success' | 'pending' | 'failed';
    dossierNumber: string;
  };
  onContinue: () => void;
  onRetry?: () => void;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  title,
  message,
  details,
  transactionRef,
  paymentData,
  onContinue,
  onRetry
}) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'pending':
        return {
          icon: '⏳',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'processing':
        return {
          icon: '🔄',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          icon: '❓',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className={`bg-white rounded-xl shadow-lg p-8 text-center ${config.bgColor} border ${config.borderColor}`}>
          {/* Icon */}
          <div className="text-6xl mb-4">
            {status === 'processing' ? (
              <div className="animate-spin text-4xl">🔄</div>
            ) : (
              config.icon
            )}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-4 ${config.textColor}`}>
            {title}
          </h1>

          {/* Message */}
          <p className={`text-lg mb-6 ${config.textColor}`}>
            {message}
          </p>

          {/* Transaction Reference */}
          {transactionRef && (
            <div className="mb-6 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Référence de transaction:</p>
              <p className="font-mono text-sm font-semibold text-gray-800">
                {transactionRef}
              </p>
            </div>
          )}

          {/* Details */}
          {details && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions:</h3>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {details}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            {/* Bouton Générer le reçu pour les paiements réussis */}
            {status === 'success' && paymentData && (
              <button
                onClick={() => setShowReceipt(true)}
                className="flex-1 px-6 py-3 bg-investmali-warning text-white rounded-lg 
                         hover:bg-investmali-warning/90 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Générer le reçu</span>
              </button>
            )}
            
            <button
              onClick={onContinue}
              className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors ${config.buttonColor}`}
            >
              Continuer
            </button>
            
            {onRetry && status === 'error' && (
              <button
                onClick={onRetry}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg 
                         hover:bg-gray-50 transition-colors"
              >
                Réessayer
              </button>
            )}
          </div>

          {/* Additional Info */}
          {status === 'pending' && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 Gardez cette page ouverte et suivez les instructions sur votre téléphone
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700">
                🎉 Votre demande sera traitée dans les plus brefs délais
              </p>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Besoin d'aide ? Contactez notre support au{' '}
            <a href="tel:+22320123456" className="text-investmali-accent hover:underline">
              +223 20 12 34 56
            </a>
          </p>
        </div>
      </div>

      {/* Modal du reçu */}
      {showReceipt && paymentData && (
        <PaymentReceipt
          paymentData={paymentData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};

export default PaymentStatus;

