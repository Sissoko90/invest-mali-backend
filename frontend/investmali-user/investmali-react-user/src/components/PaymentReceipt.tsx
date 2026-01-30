
﻿import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  UserIcon,
  DocumentArrowDownIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import apiLogo from '../assets/images/api-logo.png';

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
    processedByAgent?: boolean;
    agentName?: string;
    prenom?: string;
    nom?: string;
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
    }).format(amount).replace('XOF', 'F CFA');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateQRCode = () => {
    // Utiliser prénom+nom si entrepriseName est vide
    const entrepriseDisplay = paymentData.entrepriseName || 
      (paymentData.prenom && paymentData.nom ? `${paymentData.prenom} ${paymentData.nom}` : 'N/A');
    
    // Données complètes pour le QR code avec statut de paiement
    const qrData = JSON.stringify({
      dossier: paymentData.dossierNumber,
      entreprise: entrepriseDisplay,
      montant: paymentData.amount,
      statut: paymentData.status === 'success' ? 'PAYE' : 'NON_PAYE',
      date: paymentData.paymentDate,
      transaction: paymentData.transactionId,
      agent: paymentData.processedByAgent ? paymentData.agentName || 'Agent API-INVEST' : 'Client',
      verification: `API-INVEST-${paymentData.dossierNumber}`
    });
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

      const fileName = paymentData.processedByAgent 
        ? `Recu_Paiement_Agent_${paymentData.dossierNumber}.pdf`
        : `Recu_Paiement_${paymentData.dossierNumber}.pdf`;
      
      pdf.save(fileName);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    }
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Cloner le contenu du reçu
    const receiptContent = receiptRef.current.innerHTML;

    // Écrire le HTML dans la nouvelle fenêtre
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu de Paiement - ${paymentData.dossierNumber}</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              margin: 0;
              padding: 8mm;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              font-size: 9px;
              line-height: 1.3;
              color: #000;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            h1 {
              font-size: 14px;
              margin-bottom: 3px;
            }
            h2 {
              font-size: 15px;
              margin-bottom: 5px;
            }
            h3 {
              font-size: 11px;
              margin-bottom: 4px;
            }
            h4 {
              font-size: 10px;
              margin-bottom: 3px;
            }
            p {
              margin: 2px 0;
            }
            .text-xs { font-size: 7px; }
            .text-sm { font-size: 8px; }
            .text-base { font-size: 9px; }
            .text-lg { font-size: 10px; }
            .text-xl { font-size: 11px; }
            .text-2xl { font-size: 14px; }
            .text-3xl { font-size: 15px; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .mb-2 { margin-bottom: 3px; }
            .mb-3 { margin-bottom: 4px; }
            .mb-4 { margin-bottom: 5px; }
            .mb-6 { margin-bottom: 7px; }
            .mb-8 { margin-bottom: 9px; }
            .mt-1 { margin-top: 2px; }
            .mt-2 { margin-top: 3px; }
            .mt-4 { margin-top: 5px; }
            .mt-8 { margin-top: 7px; }
            .p-3 { padding: 5px; }
            .p-4 { padding: 6px; }
            .p-6 { padding: 7px; }
            .p-8 { padding: 9px; }
            .pt-6 { padding-top: 7px; }
            .space-y-2 > * + * { margin-top: 3px; }
            .space-y-4 > * + * { margin-top: 5px; }
            .gap-8 { gap: 7px; }
            .space-x-4 > * + * { margin-left: 5px; }
            .flex { display: flex; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .border { border: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-2 { border-width: 1px; }
            .border-4 { border-width: 2px; }
            .rounded-lg { border-radius: 4px; }
            .rounded-full { border-radius: 9999px; }
            .bg-green-50 { background-color: #f0fdf4; }
            .border-green-300 { border-color: #86efac; }
            .border-green-500 { border-color: #22c55e; }
            .text-green-600 { color: #16a34a; }
            .text-green-700 { color: #15803d; }
            .text-green-800 { color: #166534; }
            .bg-red-100 { background-color: #fee2e2; }
            .border-red-300 { border-color: #fca5a5; }
            .text-red-600 { color: #dc2626; }
            .text-red-800 { color: #991b1b; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-900 { color: #111827; }
            .inline-flex { display: inline-flex; }
            .w-24 { width: 50px; }
            .h-24 { height: 50px; }
            .w-32 { width: 65px; }
            .h-32 { height: 65px; }
            .w-4 { width: 8px; }
            .h-4 { height: 8px; }
            .w-5 { width: 10px; }
            .h-5 { height: 10px; }
            .w-6 { width: 12px; }
            .h-6 { height: 12px; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .relative { position: relative; }
            .transform { transform: translateZ(0); }
            .rotate-12 { transform: rotate(12deg); }
            .gap-2 { gap: 2px; }
            .px-4 { padding-left: 4px; padding-right: 4px; }
            .py-2 { padding-top: 2px; padding-bottom: 2px; }
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              body {
                margin: 0;
                padding: 3mm;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const getStatusBadge = () => {
    switch (paymentData.status) {
      case 'success':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold bg-green-100 text-green-800 border-2 border-green-300">
            <CheckCircleIcon className="h-6 w-6" />
            PAYÉ
            {paymentData.processedByAgent && ' - AGENT'}
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold bg-red-100 text-red-800 border-2 border-red-300">
            <XCircleIcon className="h-6 w-6" />
            NON PAYÉ
          </div>
        );
      case 'failed':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-5 w-5" />
            Échec
          </div>
        );
    }
  };

  return (
    <>
      
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b no-print">
          <h2 className="text-2xl font-bold text-gray-900">
            Reçu de Paiement {paymentData.processedByAgent && '(Agent)'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div id="receipt-content" ref={receiptRef} className="bg-white p-8 border border-gray-200 rounded-lg">
            {/* Header with Logo */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-4">
                {/* Logo API-MALI */}
                <img 
                  src={apiLogo} 
                  alt="API-MALI Logo" 
                  className="w-24 h-24 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-[#2d85c9]">API-MALI</h1>
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
              {paymentData.processedByAgent && (
                <div className="mt-2 p-3 bg-[#2d85c9]/10 rounded-lg border border-[#2d85c9]/20">
                  <div className="flex items-center justify-center gap-2">
                    <UserIcon className="h-5 w-5 text-[#2d85c9]" />
                    <p className="text-sm text-[#2d85c9] font-medium">
                      <strong>Traité par agent</strong>
                      {paymentData.agentName && ` - ${paymentData.agentName}`}
                    </p>
                  </div>
                </div>
              )}
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
                    <p className="text-xl font-bold text-gray-900">
                      {paymentData.entrepriseName || 
                        (paymentData.prenom && paymentData.nom ? `${paymentData.prenom} ${paymentData.nom}` : 'N/A')}
                    </p>
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
                      <span className="text-gray-600">Statut:</span>
                      <span className={`font-bold text-lg flex items-center gap-2 ${
                        paymentData.status === 'success' ? 'text-green-600' : 
                        paymentData.status === 'pending' ? 'text-red-600' : 'text-red-600'
                      }`}>
                        {paymentData.status === 'success' ? (
                          <><CheckCircleIcon className="h-5 w-5" /> PAYÉ</>
                        ) : paymentData.status === 'pending' ? (
                          <><XCircleIcon className="h-5 w-5" /> NON PAYÉ</>
                        ) : (
                          <><XCircleIcon className="h-5 w-5" /> ÉCHEC</>
                        )}
                      </span>
                    </div>
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
                    {paymentData.processedByAgent && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mode:</span>
                        <span className="font-medium text-[#2d85c9]">Traité par Agent</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <h4 className="font-semibold text-gray-900 mb-3">Montant</h4>
                  <div className="text-3xl font-bold text-[#2d85c9]">
                    {formatAmount(paymentData.amount)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Frais de création d'entreprise</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              {/* Tampon PAYÉ - Affiché seulement si le statut est 'success' */}
              {paymentData.status === 'success' && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="bg-green-50 border-4 border-green-500 rounded-full w-32 h-32 flex items-center justify-center transform rotate-12">
                      <div className="text-center">
                        <div className="text-2xl font-black text-green-700">PAYÉ</div>
                        <div className="text-xs font-bold text-green-600">{formatDate(paymentData.paymentDate).split(' ')[0]}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center text-sm text-gray-600">
                <p>
                  {paymentData.status === 'success' 
                    ? 'Ce reçu confirme le paiement des frais de création d\'entreprise.'
                    : 'Ce reçu indique les frais à payer pour la création d\'entreprise.'
                  }
                </p>
                <p>Conservez ce document pour vos dossiers.</p>
                {paymentData.processedByAgent && (
                  <p className="text-sm text-[#2d85c9] flex items-center justify-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <strong>Traité par agent</strong> - {paymentData.agentName || 'Agent API-INVEST'}
                  </p>
                )}
                <p className="mt-2 font-medium">API-INVEST MALI - Agence pour la Promotion des Investissements</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4 mt-6 no-print">
            <button
              onClick={downloadPDF}
              className="bg-[#2d85c9] text-white px-6 py-3 rounded-lg hover:bg-[#2d85c9]/90 
                       transition-colors flex items-center gap-2 font-medium shadow-lg"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Télécharger PDF</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 
                       transition-colors flex items-center gap-2 font-medium"
            >
              <PrinterIcon className="h-5 w-5" />
              <span>Imprimer</span>
            </button>
            
            <button
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default PaymentReceipt;























