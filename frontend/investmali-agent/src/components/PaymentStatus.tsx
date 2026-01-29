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
    processedByAgent?: boolean;
    agentName?: string;
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
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          textColor: 'text-primary-800',
          buttonColor: 'bg-primary-600 hover:bg-primary-700'
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
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          textColor: 'text-primary-800',
          buttonColor: 'bg-primary-600 hover:bg-primary-700'
        };
      case 'processing':
        return {
          icon: '🔄',
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          textColor: 'text-primary-800',
          buttonColor: 'bg-primary-600 hover:bg-primary-700'
        };
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-auto px-4">
        <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-8 text-center`}>
          {/* Status Icon */}
          <div className="text-6xl mb-4">
            {config.icon}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold ${config.textColor} mb-4`}>
            {title}
          </h1>

          {/* Message */}
          <p className={`${config.textColor} mb-6`}>
            {message}
          </p>

          {/* Details */}
          {details && (
            <div className="bg-white rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {details}
              </p>
            </div>
          )}

          {/* Transaction Reference */}
          {transactionRef && (
            <div className="bg-white rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">Référence de transaction</p>
              <p className="font-mono text-sm text-gray-800 break-all">
                {transactionRef}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Bouton Générer Reçu pour les paiements réussis */}
            {status === 'success' && paymentData && (
              <button
                onClick={() => setShowReceipt(true)}
                className="w-full px-6 py-3 bg-mali-emerald text-white rounded-lg 
                         font-medium hover:bg-mali-emerald/90 transition-colors duration-200
                         flex items-center justify-center space-x-2"
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
              className={`w-full px-6 py-3 ${config.buttonColor} text-white rounded-lg 
                         font-medium transition-colors duration-200`}
            >
              {status === 'success' ? 'Continuer' : 'Retour au tableau de bord'}
            </button>

            {onRetry && status === 'error' && (
              <button
                onClick={onRetry}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg 
                           font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Réessayer
              </button>
            )}
          </div>

          {/* Agent Mode Notice */}
          <div className="mt-6 p-3 bg-primary-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-sm text-primary-600">
              <span>👤</span>
              <span>Mode Agent - Transaction traitée</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal PaymentReceipt */}
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
























