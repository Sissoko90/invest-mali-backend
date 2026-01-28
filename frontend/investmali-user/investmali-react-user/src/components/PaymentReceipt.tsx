import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PaymentReceiptProps {
  paymentData: {
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
  onClose: () => void;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ paymentData, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generateQRCode = () => {
    // Données pour le QR code
    const qrData = `API-INVEST-${paymentData.dossierNumber}-${paymentData.transactionId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Recu_Paiement_${paymentData.dossierNumber}.pdf`);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    }
  };

  const getStatusBadge = () => {
    switch (paymentData.status) {
      case 'success':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Paiement Confirmé
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            En Attente
          </div>
        );
      case 'failed':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Échec
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Reçu de Paiement</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div ref={receiptRef} className="bg-white p-8 border border-gray-200 rounded-lg">
            {/* Header with Logo */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-4">
                {/* Logo API-MALI */}
                <div className="w-20 h-20 bg-gradient-to-br from-investmali-accent to-investmali-warning rounded-full flex items-center justify-center">
                  <div className="text-white font-bold text-lg">API</div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">API-MALI</h1>
                  <p className="text-sm text-gray-600">Bd Abderraziz Bouteflika</p>
                  <p className="text-sm text-gray-600">Quartier du Fleuve</p>
                  <p className="text-sm text-gray-600">BP 1980</p>
                  <p className="text-sm text-gray-600">Bamako</p>
                  <p className="text-sm text-gray-600">Tél: +223 20 22 95 25/26</p>
                </div>
              </div>
              
              {/* QR Code */}
              <div className="text-center">
                <img 
                  src={generateQRCode()} 
                  alt="QR Code" 
                  className="w-24 h-24 mx-auto mb-2"
                />
                <p className="text-xs text-gray-500">Code de vérification</p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Fiche de paiement des frais
              </h2>
              <div className="flex justify-center">
                {getStatusBadge()}
              </div>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {paymentData.entrepriseType}
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Nom:</span>
                    <p className="text-xl font-bold text-gray-900">{paymentData.entrepriseName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Localité:</span>
                    <p className="text-gray-900">{paymentData.localisation}</p>
                    <p className="text-gray-600">{paymentData.commune}</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Dossier N°:</span>
                    <p className="text-lg font-bold text-gray-900">{paymentData.dossierNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date de remboursement:</span>
                    <p className="text-gray-900">{formatDate(paymentData.paymentDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Détails du Paiement</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Méthode:</span>
                      <span className="font-medium">{paymentData.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs">{paymentData.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(paymentData.paymentDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <h4 className="font-semibold text-gray-900 mb-3">Montant</h4>
                  <div className="text-3xl font-bold text-investmali-accent">
                    {formatAmount(paymentData.amount)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Frais de création d'entreprise</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <div className="text-center text-sm text-gray-600">
                <p>Ce reçu confirme le paiement des frais de création d'entreprise.</p>
                <p>Conservez ce document pour vos dossiers.</p>
                <p className="mt-2 font-medium">API-INVEST MALI - Agence pour la Promotion des Investissements</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={downloadPDF}
              className="bg-investmali-accent text-white px-6 py-3 rounded-lg hover:bg-investmali-accent/90 
                       transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Télécharger PDF</span>
            </button>
            
            <button
              onClick={() => window.print()}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 
                       transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimer</span>
            </button>
            
            <button
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;

