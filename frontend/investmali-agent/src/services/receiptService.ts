import { entreprisesAPI } from './api';

export interface PaymentReceiptData {
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
}

/**
 * Génère un numéro de dossier au format CEX-YYYY-MM-DD-XXXXX
 * Compatible avec le format côté utilisateur
 */
export const generateDossierNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `CEX-${year}-${month}-${day}-${random}`;
};

/**
 * Récupère les données d'une entreprise et génère les données de reçu
 * avec les informations réelles (localisation, commune, référence serveur)
 */
export const generateReceiptData = async (
  entrepriseId: string,
  entrepriseNom: string,
  amount: number,
  paymentMethod: string,
  transactionId: string,
  agentName: string = 'Agent API-INVEST'
): Promise<PaymentReceiptData> => {
  
  // Récupérer les données réelles de l'entreprise
  let entrepriseData = null;
  try {
    const response = await entreprisesAPI.getById(entrepriseId);
    entrepriseData = response.data;
  } catch (error) {
    // Silently handle error
  }

  // Construire la localisation en essayant différentes sources
  const getLocalisation = (data: any): string => {
    
    // PRIORITÉ 1: Champs directs de l'API (structure plate)
    if (data?.divisionNom) {
      return data.divisionNom;
    }
    if (data?.quartierNom) {
      return data.quartierNom;
    }
    if (data?.arrondissementNom) {
      return data.arrondissementNom;
    }
    if (data?.regionNom) {
      return data.regionNom;
    }
    
    // PRIORITÉ 2: Structures d'objets (ancienne logique)
    if (data?.division?.nom) {
      return data.division.nom;
    }
    if (data?.localisation) {
      return data.localisation;
    }
    if (data?.quartier?.nom) {
      return data.quartier.nom;
    }
    if (data?.quartier) {
      return data.quartier;
    }
    if (data?.arrondissement?.nom) {
      return data.arrondissement.nom;
    }
    if (data?.arrondissement) {
      return data.arrondissement;
    }
    if (data?.region?.nom) {
      return data.region.nom;
    }
    if (data?.region) {
      return data.region;
    }
    
    // PRIORITÉ 3: Autres champs possibles
    if (data?.adresse) {
      return data.adresse;
    }
    if (data?.ville) {
      return data.ville;
    }
    if (data?.lieu) {
      return data.lieu;
    }
    if (data?.emplacement) {
      return data.emplacement;
    }
    if (data?.secteur) {
      return data.secteur;
    }
    if (data?.zone) {
      return data.zone;
    }
    if (data?.pays) {
      return data.pays;
    }
    
    return 'Non spécifiée';
  };

  const getCommune = (data: any): string => {
    
    // PRIORITÉ 1: Champs directs de l'API (structure plate) - RÉGION EN PREMIER
    if (data?.regionNom) {
      return data.regionNom;
    }
    if (data?.communeNom) {
      return data.communeNom;
    }
    if (data?.arrondissementNom) {
      return data.arrondissementNom;
    }
    if (data?.cercleNom) {
      return data.cercleNom;
    }
    
    // PRIORITÉ 2: Structures d'objets (ancienne logique) - RÉGION EN PREMIER
    if (data?.region?.nom) {
      return data.region.nom;
    }
    if (data?.region) {
      return data.region;
    }
    if (data?.commune?.nom) {
      return data.commune.nom;
    }
    if (data?.commune) {
      return data.commune;
    }
    if (data?.arrondissement?.nom) {
      return data.arrondissement.nom;
    }
    if (data?.arrondissement) {
      return data.arrondissement;
    }
    
    // PRIORITÉ 3: Autres champs possibles
    if (data?.ville) {
      return data.ville;
    }
    if (data?.codePostal) {
      return data.codePostal;
    }
    if (data?.secteur) {
      return data.secteur;
    }
    if (data?.zone) {
      return data.zone;
    }
    if (data?.region?.nom) {
      return data.region.nom;
    }
    if (data?.region) {
      return data.region;
    }
    if (data?.pays) {
      return data.pays;
    }
    
    return 'Non spécifiée';
  };

  // Fonction pour obtenir la vraie référence de l'entreprise
  const getReferenceEntreprise = (data: any): string => {
    
    // PRIORITÉ 1: Champs de référence métier
    if (data?.reference) {
      return data.reference;
    }
    if (data?.referenceServeur) {
      return data.referenceServeur;
    }
    if (data?.numeroReference) {
      return data.numeroReference;
    }
    if (data?.codeReference) {
      return data.codeReference;
    }
    if (data?.numeroEntreprise) {
      return data.numeroEntreprise;
    }
    if (data?.numeroInscription) {
      return data.numeroInscription;
    }
    if (data?.numeroDossier) {
      return data.numeroDossier;
    }
    
    // FALLBACK: Générer une référence temporaire
    return generateDossierNumber();
  };

  let localisation = getLocalisation(entrepriseData);
  let commune = getCommune(entrepriseData);
  let referenceEntreprise = getReferenceEntreprise(entrepriseData);

  // Si aucune localisation n'est trouvée, utiliser des valeurs par défaut contextuelles
  if (localisation === 'Non spécifiée') {
    localisation = 'Mali'; // Pays par défaut
  }
  
  if (commune === 'Non spécifiée') {
    commune = 'Bamako'; // Capitale par défaut
  }


  // Construire les données du reçu avec les vraies informations
  const receiptData: PaymentReceiptData = {
    entrepriseId: entrepriseId,
    entrepriseName: entrepriseData?.nom || entrepriseNom,
    entrepriseType: entrepriseData?.typeEntreprise || 'Entreprise',
    localisation: localisation,
    commune: commune,
    amount: amount,
    paymentMethod: paymentMethod,
    transactionId: transactionId,
    paymentDate: new Date().toISOString(),
    status: 'success' as const,
    dossierNumber: referenceEntreprise,
    processedByAgent: true,
    agentName: agentName
  };

  
  return receiptData;
};

/**
 * Génère un reçu temporaire "NON PAYÉ" pour une entreprise nouvellement créée
 * Ce reçu n'est pas persisté en base de données
 */
export const generateUnpaidReceiptData = (
  entrepriseData: any,
  amount: number,
  agentName: string = 'Agent API-INVEST'
): PaymentReceiptData => {
  

  // Fonction locale pour extraire la localisation
  const getLocalisation = (data: any): string => {
    if (data?.divisionNom) return data.divisionNom;
    if (data?.quartierNom) return data.quartierNom;
    if (data?.arrondissementNom) return data.arrondissementNom;
    if (data?.regionNom) return data.regionNom;
    if (data?.division?.nom) return data.division.nom;
    if (data?.localisation) return data.localisation;
    if (data?.quartier?.nom) return data.quartier.nom;
    if (data?.adresse) return data.adresse;
    if (data?.ville) return data.ville;
    return 'Non spécifiée';
  };

  // Fonction locale pour extraire la commune
  const getCommune = (data: any): string => {
    if (data?.regionNom) return data.regionNom;
    if (data?.communeNom) return data.communeNom;
    if (data?.arrondissementNom) return data.arrondissementNom;
    if (data?.region?.nom) return data.region.nom;
    if (data?.commune?.nom) return data.commune.nom;
    if (data?.ville) return data.ville;
    return 'Non spécifiée';
  };

  // Fonction locale pour extraire la référence
  const getReferenceEntreprise = (data: any): string => {
    if (data?.reference) return data.reference;
    if (data?.referenceServeur) return data.referenceServeur;
    if (data?.numeroReference) return data.numeroReference;
    if (data?.numeroEntreprise) return data.numeroEntreprise;
    if (data?.numeroInscription) return data.numeroInscription;
    if (data?.numeroDossier) return data.numeroDossier;
    return generateDossierNumber();
  };

  let localisation = getLocalisation(entrepriseData);
  let commune = getCommune(entrepriseData);
  let referenceEntreprise = getReferenceEntreprise(entrepriseData);

  // Si aucune localisation n'est trouvée, utiliser des valeurs par défaut
  if (localisation === 'Non spécifiée') {
    localisation = 'Mali';
  }
  
  if (commune === 'Non spécifiée') {
    commune = 'Bamako';
  }

  // Construire les données du reçu temporaire NON PAYÉ
  const receiptData: PaymentReceiptData = {
    entrepriseId: entrepriseData?.id || 'temp-' + Date.now(),
    entrepriseName: entrepriseData?.nom || entrepriseData?.companyName || 'Entreprise',
    entrepriseType: entrepriseData?.typeEntreprise || entrepriseData?.businessType || 'Entreprise',
    localisation: localisation,
    commune: commune,
    amount: amount,
    paymentMethod: 'À définir',
    transactionId: 'TEMP-' + generateDossierNumber(),
    paymentDate: new Date().toISOString(),
    status: 'pending' as const, // NON PAYÉ = pending
    dossierNumber: referenceEntreprise,
    processedByAgent: true,
    agentName: agentName
  };

  
  return receiptData;
};

/**
 * Formate le montant pour l'affichage
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount);
};
