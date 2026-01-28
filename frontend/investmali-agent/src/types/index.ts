// Types partagés pour l'application agent

export interface Dossier {
  id: string;
  reference: string;
  nom: string;
  sigle?: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'INCOMPLET' | 'VALIDE' | 'REJETE';
  dateCreation: string;
  division?: string;
  antenne?: string;
  documentsManquants: string[];
  personneId?: string;
  entrepriseId?: string;
}

export interface Entreprise {
  id: string;
  nom: string;
  sigle?: string;
  reference: string;
  formeJuridique: string;
  typeEntreprise: string;
  statutCreation: string;
  etapeValidation: string;
  assignedTo?: string;
  creation: string;
  numeroNina?: string;
  numeroRccm?: string;
  divisionCode?: string;
  domaineActivite?: string; // Domaine d'activité réglementé (pour agrément)
  domaineActiviteNr?: string; // Domaine d'activité non réglementé
  activiteSecondaire?: string;
  numeroAutorisation?: string;
  dateAutorisation?: string;
  typeAgrement?: 'BTP_TOURISME' | 'ETABLISSEMENT_CLASSE' | 'CODE_INVESTISSEMENT';
  delaiTraitement?: number;
  avantagesFiscaux?: boolean;
  observations?: string;
  regimeInvestissement?: string;
  typeDemandeAgrement?: string;
  montantFraisDepot?: number;
  agrementSignePath?: string;
  telechargementAutorise?: boolean;
  paiementEffectue?: boolean;
}

export interface DemandeEntreprise {
  id: string;
  nom: string;
  sigle?: string;
  formeJuridique: string;
  typeEntreprise: string;
  statut: string;
  dateCreation: string;
  demandeur: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  division?: string;
  antenne?: string;
  etapeActuelle: string;
  motifRejet?: string;
}

export interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  antenne?: string;
  division?: string;
}
