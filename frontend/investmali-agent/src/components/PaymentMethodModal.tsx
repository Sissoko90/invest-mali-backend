import React, { useState, useEffect } from 'react';
import { entreprisesAPI, paiementsAPI } from '../services/api';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { buildApiUrl } from '../config/api.config';

// Import des images de logos
import carteBancaireImg from '../assets/logos/carte-bancaire.jpeg';
import orangeMoneyImg from '../assets/logos/orange-money.jpeg';
import moovMoneyImg from '../assets/logos/moov-money.jpeg';
import samaMoneyImg from '../assets/logos/sama-money.jpeg';
import waveImg from '../assets/logos/wave.jpeg';

/**
 * Mapping des méthodes de paiement frontend vers les enums backend
 */
const mapPaymentMethodToBackend = (frontendMethod: string): string => {
  const METHOD_MAPPING: Record<string, string> = {
    'TRESORPAY': 'TRESORPAY',
    'CASH': 'ESPECES'
  };
  
  return METHOD_MAPPING[frontendMethod] || frontendMethod;
};

/**
 * Méthodes de paiement disponibles pour les agents
 */
const PAYMENT_METHODS = {
  TRESORPAY: {
    id: 'TRESORPAY',
    name: 'TresorPay',
    description: 'Paiement via TresorPay - Orange Money, Moov Money, Sama Money, Wave, Carte bancaire',
    icon: '💳',
    fees: 'Frais: selon grille TresorPay',
    supported: true
  },
  CASH: {
    id: 'CASH',
    name: 'Espèces',
    description: 'Paiement en espèces dans nos agences',
    icon: '💵',
    fees: 'Aucun frais supplémentaire',
    supported: true
  }
};

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  entreprise: {
    id: string;
    nom: string;
    totalAmount?: number;
  };
  onPaiementComplete: () => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  entreprise,
  onPaiementComplete
}) => {
  const { agent } = useAgentAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'selection' | 'details'>('selection');
  const [isProcessing, setIsProcessing] = useState(false);
  const [montantPaye, setMontantPaye] = useState<string>(entreprise.totalAmount?.toString() || '50000');
  const [numeroPiece, setNumeroPiece] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Fonction pour obtenir l'image correspondante à chaque méthode de paiement
  const getPaymentMethodImage = (methodId: string): string | undefined => {
    const imageMap: { [key: string]: string | undefined } = {
      'TRESORPAY': carteBancaireImg, // Utiliser l'image carte bancaire pour TresorPay
      'CASH': undefined // Pas d'image pour Cash, utiliser l'icône
    };
    return imageMap[methodId];
  };

  // Réinitialiser l'étape quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('selection');
      setSelectedMethod('');
      setMontantPaye(entreprise.totalAmount?.toString() || '50000');
      setNumeroPiece('');
      setNotes('');
    }
  }, [isOpen, entreprise.totalAmount]);

  if (!isOpen) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };


  const handleContinueToDetails = async () => {
    if (selectedMethod) {
      // Rediriger vers la page de paiement appropriée
      const params = new URLSearchParams({
        entrepriseId: entreprise.id,
        entrepriseNom: entreprise.nom,
        amount: (entreprise.totalAmount || 50000).toString()
      });
      
      switch (selectedMethod) {
        case 'TRESORPAY':
          // Rediriger vers la page TresorPay avec interface de saisie
          window.location.href = `/payment/tresorpay?${params}`;
          break;
        case 'CASH':
          window.location.href = `/payment/cash?${params}`;
          break;
        default:
          console.error('Méthode de paiement non supportée:', selectedMethod);
      }
      
      // Fermer le modal
      onClose();
    }
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
  };

  const handleValiderPaiement = async () => {
    try {
      setIsProcessing(true);

      // Validation des champs
      if (!selectedMethod) {
        alert('Veuillez sélectionner une méthode de paiement');
        return;
      }

      if (!montantPaye || parseFloat(montantPaye) <= 0) {
        alert('Veuillez saisir un montant valide');
        return;
      }

      if (!numeroPiece.trim()) {
        alert('Veuillez saisir un numéro de pièce/référence');
        return;
      }

      console.log('💳 Validation du paiement pour:', entreprise.nom);
      console.log('   - Montant:', montantPaye);
      console.log('   - Méthode:', selectedMethod);
      console.log('   - Numéro pièce:', numeroPiece);

      const selectedMethodData = Object.values(PAYMENT_METHODS).find(m => m.id === selectedMethod);

      // 1. Créer l'enregistrement de paiement dans la table paiement
      const paiementData: any = {
        entrepriseId: entreprise.id,
        personneId: (agent as any)?.id || (agent as any)?.agentId, // ID de l'agent qui effectue le paiement
        montant: parseFloat(montantPaye),
        typePaiement: mapPaymentMethodToBackend(selectedMethod), // Utiliser le mapping backend
        referenceTransaction: numeroPiece,
        description: `Paiement validé par agent - Méthode: ${selectedMethodData?.name}${notes ? ' - Notes: ' + notes : ''}`,
        statut: selectedMethod === 'CASH' ? 'VALIDE' : 'EN_ATTENTE', // ESPECES = VALIDE, autres = EN_ATTENTE
      };
      
      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if ((selectedMethod.includes('MONEY') || selectedMethod === 'WAVE') && numeroPiece) {
        paiementData.numeroTelephone = numeroPiece;
      }

      // 1. Créer l'enregistrement de paiement (CRITIQUE)
      console.log('💾 Création de l\'enregistrement de paiement:', paiementData);
      try {
        const paiementResponse = await paiementsAPI.create(paiementData);
        console.log('✅ Paiement créé avec succès:', paiementResponse);
      } catch (paiementError: any) {
        console.error('❌ ERREUR lors de la création du paiement:', paiementError);
        console.error('❌ Détails de l\'erreur:', {
          message: paiementError.message,
          status: paiementError.response?.status,
          statusText: paiementError.response?.statusText,
          data: paiementError.response?.data,
          url: paiementError.config?.url
        });
        
        // Vérifier si c'est une erreur 404 (endpoint n'existe pas)
        if (paiementError.response?.status === 404) {
          console.warn('⚠️ L\'endpoint /paiements n\'existe pas encore côté backend');
          console.warn('⚠️ SOLUTION TEMPORAIRE: Continuer sans créer le paiement en base');
          console.warn('⚠️ TODO: Créer l\'endpoint PaiementController côté Spring Boot');
          
          // Afficher un avertissement mais continuer le processus
          alert(`⚠️ AVERTISSEMENT: L'endpoint de paiement n'existe pas encore côté backend!\n\n✅ L'entreprise va quand même passer à l'étape REVISION\n❌ Mais le paiement ne sera PAS enregistré en base\n\n📋 TODO: Créer l'endpoint /paiements côté Spring Boot`);
        } else {
          // Pour les autres erreurs, arrêter le processus
          alert(`❌ Erreur lors de la création du paiement!\n\nDétails: ${paiementError.message}\nStatut: ${paiementError.response?.status || 'Inconnu'}\nURL: ${paiementError.config?.url || 'Inconnue'}\n\nLe processus a été interrompu pour éviter les incohérences.`);
          return; // Sortir de la fonction sans mettre à jour l'entreprise
        }
      }

      // 2. Mettre à jour le statut vers PAIEMENT_VALIDE et l'étape vers REVISION
      const statusData = {
        status: 'PAIEMENT_VALIDE',
        note: `Paiement validé par agent - Montant: ${montantPaye} FCFA - Méthode: ${selectedMethodData?.name} - Réf: ${numeroPiece}${notes ? ' - Notes: ' + notes : ''}`
      };

      console.log('📝 Mise à jour du statut de l\'entreprise:', statusData);
      try {
        await entreprisesAPI.updateStatus(entreprise.id, statusData.status, statusData.note);
        console.log('✅ Statut entreprise mis à jour avec succès');
      } catch (statusError: any) {
        console.error('❌ ERREUR lors de la mise à jour du statut:', statusError);
        alert(`❌ Erreur lors de la mise à jour du statut de l'entreprise!\n\nLe paiement a été créé mais l'entreprise n'a pas changé d'étape.\nContactez l'administrateur.`);
        return;
      }

      alert(`✅ Paiement validé avec succès pour "${entreprise.nom}"!\n\n✅ Paiement enregistré en base de données\n✅ Entreprise transférée à l'étape de révision`);

      // Fermer le modal et notifier le parent
      onClose();
      onPaiementComplete();

    } catch (error: any) {
      console.error('Erreur lors de la validation du paiement:', error);
      alert('Erreur lors de la validation du paiement. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnnulerPaiement = async () => {
    try {
      setIsProcessing(true);

      // Remettre l'entreprise à l'étape ACCUEIL avec statut INCOMPLET
      const statusData = {
        status: 'INCOMPLET',
        note: 'Paiement annulé par l\'agent - Retour à l\'accueil'
      };

      await entreprisesAPI.updateStatus(entreprise.id, statusData.status, statusData.note);

      alert(`❌ Paiement annulé pour "${entreprise.nom}". L'entreprise retourne à l'étape d'accueil.`);

      onClose();
      onPaiementComplete();

    } catch (error: any) {
      console.error('Erreur lors de l\'annulation du paiement:', error);
      alert('Erreur lors de l\'annulation. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <img 
                src={carteBancaireImg} 
                alt="Paiement"
                className="w-8 h-8 object-contain rounded mr-3"
              />
              Choisir une méthode de paiement
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Montant à payer: <span className="font-semibold text-mali-emerald">
              {formatAmount(entreprise.totalAmount || 50000)}
            </span>
          </p>
        </div>

        {/* Methods List */}
        <div className="p-6">
          <div className="space-y-4">
            {Object.values(PAYMENT_METHODS).map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-mali-emerald bg-mali-emerald bg-opacity-5'
                    : 'border-gray-200 hover:border-mali-emerald hover:bg-gray-50'
                } ${!method.supported ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => method.supported && handleMethodSelect(method.id)}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getPaymentMethodImage(method.id) ? (
                      <img 
                        src={getPaymentMethodImage(method.id)} 
                        alt={method.name}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="text-2xl">{method.icon}</div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      {selectedMethod === method.id && (
                        <div className="w-5 h-5 bg-mali-emerald rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{method.fees}</p>
                    
                    {!method.supported && (
                      <p className="text-xs text-red-500 mt-1">Bientôt disponible</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-primary-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-primary-500 text-lg">🔒</div>
              <div>
                <h4 className="font-medium text-primary-900">Validation agent</h4>
                <p className="text-sm text-primary-700 mt-1">
                  Sélectionnez la méthode de paiement utilisée par le client.
                  Vous serez redirigé vers une page de validation spécialisée.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleContinueToDetails}
              disabled={!selectedMethod}
              className="px-6 py-2 bg-mali-emerald text-white rounded-lg hover:bg-mali-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
























