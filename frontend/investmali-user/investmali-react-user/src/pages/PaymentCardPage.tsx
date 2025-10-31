<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StripePaymentContainer from '../components/StripePaymentContainer';
import PaymentStatus from '../components/PaymentStatus';
import { businessAPI } from '../services/api';

const PaymentCardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/profile?tab=applications');
    }
  }, [entrepriseId, amount, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePaymentSuccess = async (result: any) => {
    console.log('✅ Paiement réussi:', result);
    
    try {
      // Récupérer les données de l'entreprise depuis l'API
      console.log('📋 Récupération données entreprise:', entrepriseId);
      const resp = await businessAPI.getApplication(entrepriseId);
      const entrepriseData = (resp && resp.data) ? resp.data : resp;
      
      console.log('📊 Données entreprise reçues:', entrepriseData);
      
      // Extraire les données avec gestion des différents noms de champs
      const entrepriseName = entrepriseData.businessName || 
                            entrepriseData.business_name || 
                            entrepriseData.nom || 
                            entrepriseData.companyName || 
                            'Entreprise';
                            
      const entrepriseType = entrepriseData.legalForm || 
                            entrepriseData.legal_form || 
                            entrepriseData.formeJuridique || 
                            'Entreprise Individuelle';
                            
      // Utiliser les vrais champs de localisation de l'EntrepriseResponse
      // Construire la localisation complète avec région
      let localisation = '';
      if (entrepriseData.quartierNom) {
        localisation = entrepriseData.quartierNom;
      } else if (entrepriseData.divisionNom) {
        localisation = entrepriseData.divisionNom;
      } else if (entrepriseData.localisation) {
        localisation = entrepriseData.localisation;
      } else if (entrepriseData.location) {
        localisation = entrepriseData.location;
      } else if (entrepriseData.adresse) {
        localisation = entrepriseData.adresse;
      }
      
      // Ajouter la région si disponible
      if (entrepriseData.regionNom) {
        if (localisation) {
          localisation += `, ${entrepriseData.regionNom}`;
        } else {
          localisation = entrepriseData.regionNom;
        }
      }
      
      if (!localisation) {
        localisation = '';
      }
                          
      const commune = entrepriseData.communeNom || 
                     entrepriseData.commune || 
                     entrepriseData.municipality || 
                     '';
                     
      const reference = entrepriseData.reference || 
                       entrepriseData.dossierNumber || 
                       entrepriseData.referenceNumber || 
                       '';
      
      // Debug: Afficher les données de localisation
      console.log('🏢 Données entreprise récupérées:', {
        quartierNom: entrepriseData.quartierNom,
        divisionNom: entrepriseData.divisionNom,
        regionNom: entrepriseData.regionNom,
        communeNom: entrepriseData.communeNom,
        localisation_finale: localisation,
        commune_finale: commune
      });
      
      // Construire les paramètres pour la page de reçu avec les vraies données
      const receiptParams = new URLSearchParams({
        entrepriseId: entrepriseId,
        amount: amount.toString(),
        transactionId: result.transactionReference || result.id || 'TXN_' + Date.now(),
        paymentMethod: 'Paiement par carte',
        entrepriseName: entrepriseName,
        entrepriseType: entrepriseType,
        localisation: localisation,
        commune: commune,
        reference: reference
      });
      
      console.log('📄 Données reçu:', Object.fromEntries(receiptParams));
      
      // Rediriger directement vers la page de reçu
      navigate(`/payment/receipt?${receiptParams.toString()}`);
      
    } catch (error) {
      console.error('❌ Erreur récupération données entreprise:', error);
      
      // En cas d'erreur, utiliser des données minimales avec l'ID
      const receiptParams = new URLSearchParams({
        entrepriseId: entrepriseId,
        amount: amount.toString(),
        transactionId: result.transactionReference || result.id || 'TXN_' + Date.now(),
        paymentMethod: 'Paiement par carte',
        entrepriseName: `Entreprise ${entrepriseId.substring(0, 8)}`,
        entrepriseType: 'Entreprise',
        localisation: '',
        commune: '',
        reference: ''
      });
      
      navigate(`/payment/receipt?${receiptParams.toString()}`);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('❌ Erreur paiement:', errorMessage);
    setError(errorMessage);
  };

  const handleCancel = () => {
    navigate('/profile?tab=applications');
  };

  // Plus besoin de cette logique car on redirige directement vers /payment/receipt

  if (error) {
    return (
      <PaymentStatus
        status="error"
        title="Erreur de paiement"
        message={error}
        onContinue={() => {
          setError('');
          navigate('/profile?tab=applications');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💳</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement par Carte
          </h1>
          <p className="text-gray-600">
            Paiement sécurisé via Stripe
          </p>
          <p className="text-lg font-semibold text-investmali-accent mt-2">
            {formatAmount(amount)}
          </p>
        </div>

        {/* Stripe Payment Container */}
        <StripePaymentContainer
          entrepriseId={entrepriseId}
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handleCancel}
        />

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleCancel}
            className="text-investmali-accent hover:text-investmali-accent-dark underline"
          >
            ← Retour aux méthodes de paiement
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCardPage;

=======
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StripePaymentContainer from '../components/StripePaymentContainer';
import PaymentStatus from '../components/PaymentStatus';
import { businessAPI } from '../services/api';

const PaymentCardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/profile?tab=applications');
    }
  }, [entrepriseId, amount, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePaymentSuccess = async (result: any) => {
    console.log('✅ Paiement réussi:', result);
    
    try {
      // Récupérer les données de l'entreprise depuis l'API
      console.log('📋 Récupération données entreprise:', entrepriseId);
      const resp = await businessAPI.getApplication(entrepriseId);
      const entrepriseData = (resp && resp.data) ? resp.data : resp;
      
      console.log('📊 Données entreprise reçues:', entrepriseData);
      
      // Extraire les données avec gestion des différents noms de champs
      const entrepriseName = entrepriseData.businessName || 
                            entrepriseData.business_name || 
                            entrepriseData.nom || 
                            entrepriseData.companyName || 
                            'Entreprise';
                            
      const entrepriseType = entrepriseData.legalForm || 
                            entrepriseData.legal_form || 
                            entrepriseData.formeJuridique || 
                            'Entreprise Individuelle';
                            
      const localisation = entrepriseData.localisation || 
                          entrepriseData.location || 
                          entrepriseData.adresse || 
                          '';
                          
      const commune = entrepriseData.commune || 
                     entrepriseData.municipality || 
                     '';
                     
      const reference = entrepriseData.reference || 
                       entrepriseData.dossierNumber || 
                       entrepriseData.referenceNumber || 
                       '';
      
      // Construire les paramètres pour la page de reçu avec les vraies données
      const receiptParams = new URLSearchParams({
        entrepriseId: entrepriseId,
        amount: amount.toString(),
        transactionId: result.transactionReference || result.id || 'TXN_' + Date.now(),
        paymentMethod: 'Paiement par carte',
        entrepriseName: entrepriseName,
        entrepriseType: entrepriseType,
        localisation: localisation,
        commune: commune,
        reference: reference
      });
      
      console.log('📄 Données reçu:', Object.fromEntries(receiptParams));
      
      // Rediriger directement vers la page de reçu
      navigate(`/payment/receipt?${receiptParams.toString()}`);
      
    } catch (error) {
      console.error('❌ Erreur récupération données entreprise:', error);
      
      // En cas d'erreur, utiliser des données minimales avec l'ID
      const receiptParams = new URLSearchParams({
        entrepriseId: entrepriseId,
        amount: amount.toString(),
        transactionId: result.transactionReference || result.id || 'TXN_' + Date.now(),
        paymentMethod: 'Paiement par carte',
        entrepriseName: `Entreprise ${entrepriseId.substring(0, 8)}`,
        entrepriseType: 'Entreprise',
        localisation: '',
        commune: '',
        reference: ''
      });
      
      navigate(`/payment/receipt?${receiptParams.toString()}`);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('❌ Erreur paiement:', errorMessage);
    setError(errorMessage);
  };

  const handleCancel = () => {
    navigate('/profile?tab=applications');
  };

  // Plus besoin de cette logique car on redirige directement vers /payment/receipt

  if (error) {
    return (
      <PaymentStatus
        status="error"
        title="Erreur de paiement"
        message={error}
        onContinue={() => {
          setError('');
          navigate('/profile?tab=applications');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💳</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement par Carte
          </h1>
          <p className="text-gray-600">
            Paiement sécurisé via Stripe
          </p>
          <p className="text-lg font-semibold text-mali-emerald mt-2">
            {formatAmount(amount)}
          </p>
        </div>

        {/* Stripe Payment Container */}
        <StripePaymentContainer
          entrepriseId={entrepriseId}
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handleCancel}
        />

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleCancel}
            className="text-mali-emerald hover:text-mali-emerald-dark underline"
          >
            ← Retour aux méthodes de paiement
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCardPage;
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
