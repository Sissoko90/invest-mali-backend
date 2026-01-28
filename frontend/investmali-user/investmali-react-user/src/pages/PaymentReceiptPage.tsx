import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentReceipt from '../components/PaymentReceipt';

const PaymentReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // Récupérer les données depuis les paramètres URL
    const entrepriseId = searchParams.get('entrepriseId');
    const amount = searchParams.get('amount');
    const transactionId = searchParams.get('transactionId');
    const paymentMethod = searchParams.get('paymentMethod') || 'Paiement par carte';

    if (!entrepriseId || !amount || !transactionId) {
      // Si les données manquent, rediriger vers le profil
      navigate('/profile?tab=applications');
      return;
    }

    // Construire les données du reçu
    const reference = searchParams.get('reference');
    const localisationParam = searchParams.get('localisation');
    const communeParam = searchParams.get('commune');
    
    // Debug: Afficher les paramètres reçus
    console.log('📄 Paramètres reçus dans PaymentReceiptPage:', {
      localisation: localisationParam,
      commune: communeParam,
      entrepriseName: searchParams.get('entrepriseName'),
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    const receiptData = {
      entrepriseId: entrepriseId,
      entrepriseName: searchParams.get('entrepriseName') || "SAMA TECH",
      entrepriseType: searchParams.get('entrepriseType') || "Entreprise Individuelle",
      localisation: localisationParam || "Non spécifiée",
      commune: communeParam || "Non spécifiée",
      amount: parseInt(amount),
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      paymentDate: new Date().toISOString(),
      status: 'success' as const,
      dossierNumber: reference || generateDossierNumber()
    };

    setPaymentData(receiptData);
  }, [searchParams, navigate]);

  const generateDossierNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return `CEX-${year}-${month}-${day}-${random}`;
  };

  const handleClose = () => {
    navigate('/profile?tab=applications&payment=success');
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-investmali-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Génération du reçu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentReceipt
        paymentData={paymentData}
        onClose={handleClose}
      />
    </div>
  );
};

export default PaymentReceiptPage;

