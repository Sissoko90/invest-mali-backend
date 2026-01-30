<<<<<<< HEAD
export interface PieceJointe {
  nom: string;
  description?: string;
  obligatoire: boolean;
}

export interface TypePersonne {
  type: 'physique' | 'morale';
  pieces: PieceJointe[];
}

export interface FormulaireActivite {
  nom: string;
  fichier: string;
  description?: string;
}

export interface ActiviteReglementeeData {
  domaineActivite: string; // Correspond à DomaineActivites enum
  nom: string;
  formulaire: FormulaireActivite;
  types: TypePersonne[];
  piecesCommunes?: PieceJointe[];
}

export const ACTIVITES_REGLEMENTEES_DATA: ActiviteReglementeeData[] = [
  {
    domaineActivite: 'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS',
    nom: 'Administrateur de biens immobiliers ou Agent immobilier',
    formulaire: {
      nom: 'Formulaire de demande d\'autorisation',
      fichier: 'Administrateurs et Agents Immobiliers 2023.doc',
      description: 'Formulaire officiel pour l\'autorisation d\'exercice'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Deux photos d\'identité du promoteur', obligatoire: true },
          { nom: 'Copie certifiée conforme du diplôme ou attestation délivrée par l\'employeur', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou certificat d\'inscription hypothécaire', obligatoire: true },
          { nom: 'Police d\'assurance de responsabilité civile professionnelle', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copies authentiques des statuts', obligatoire: true },
          { nom: 'Extraits de l\'acte de naissance, certificat de nationalité et du casier judiciaire datant de moins de 3 mois du responsable dirigeant', obligatoire: true },
          { nom: 'Curriculum vitae, deux photos d\'identité et copie certifiée conforme du diplôme ou certificat professionnel du responsable dirigeant', obligatoire: true },
          { nom: 'Document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou certificat d\'inscription hypothécaire', obligatoire: true },
          { nom: 'Police d\'assurance de responsabilité civile professionnelle', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'ARCHITECTE',
    nom: 'Architecte',
    formulaire: {
      nom: 'Formulaire de demande d\'autorisation',
      fichier: 'Architecte 2023.doc',
      description: 'Formulaire officiel pour l\'autorisation d\'exercice d\'architecte'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae', obligatoire: true },
          { nom: 'Copie du diplôme ou tout autre certificat universitaire d\'Architecte', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Architectes', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Copies certifiées des diplômes des architectes de la Société', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Architectes', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'BTP',
    nom: 'Entrepreneur du Bâtiment, des Travaux Publics et des Travaux Particuliers',
    formulaire: {
      nom: 'Formulaire BTP',
      fichier: 'BTP 2023.doc',
      description: 'Formulaire pour les entrepreneurs du bâtiment et travaux publics'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait d\'acte de naissance', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Copie certifiée conforme du diplôme ou tout autre certificat établissant la qualification professionnelle requise', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Diplôme ou tout autre certificat établissant la qualification du responsable dirigeant', obligatoire: true },
          { nom: 'Liste nominative du personnel d\'encadrement', obligatoire: true },
          { nom: 'Demande de déclaration d\'ouverture d\'établissement dûment remplie par l\'Agence Nationale pour l\'Emploi', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'CARTOGRAPHIE_TOPOGRAPHIE',
    nom: 'Entrepreneur des Travaux Cartographiques et Topographiques',
    formulaire: {
      nom: 'Formulaire Cartographie Topographie',
      fichier: 'Cartographie Topographie 2023.doc',
      description: 'Formulaire pour les travaux cartographiques et topographiques'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait d\'acte de naissance', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Copie certifiée conforme du diplôme ou tout autre certificat établissant la qualification professionnelle requise', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Diplôme ou tout autre certificat établissant la qualification du responsable dirigeant', obligatoire: true },
          { nom: 'Liste nominative du personnel d\'encadrement', obligatoire: true },
          { nom: 'Demande de déclaration d\'ouverture d\'établissement dûment remplie par l\'Agence Nationale pour l\'Emploi', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'GEOMETRES_EXPERTS',
    nom: 'Géomètre-expert',
    formulaire: {
      nom: 'Formulaire Géomètre-Expert',
      fichier: 'Géomètres - Experts 2023.doc',
      description: 'Formulaire pour l\'autorisation d\'exercice de géomètre-expert'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Certificat d\'identité ou de résidence', obligatoire: true },
          { nom: 'Curriculum vitae', obligatoire: true },
          { nom: 'Copie du diplôme', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Géomètres-Experts', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copies authentiques des statuts', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance, casier judiciaire datant de moins de 3 mois, curriculum vitae et copie certifiée conforme du diplôme du responsable dirigeant', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'ordre des Géomètres-Experts', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'INGENIEUR_CONSEIL',
    nom: 'Ingénieur-Conseil',
    formulaire: {
      nom: 'Formulaire Ingénieur-Conseil',
      fichier: 'Ingénieur - Conseil 2023.doc',
      description: 'Formulaire pour l\'autorisation d\'exercice d\'ingénieur-conseil'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copie du diplôme d\'ingénieur', obligatoire: true },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae', obligatoire: true },
          { nom: 'Attestation d\'ouverture de l\'Agence Nationale pour l\'Emploi (ANPE)', obligatoire: true },
          { nom: 'Attestation de l\'Office Malien de l\'Habitat (OMH)', obligatoire: true },
          { nom: 'Attestation de l\'Institut national de Prévoyance Sociale (INPS)', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Copie des diplômes et CV des ingénieurs de la Société et du responsable dirigeant', obligatoire: true },
          { nom: 'Attestation d\'ouverture de l\'Agence Nationale pour l\'Emploi (ANPE)', obligatoire: true },
          { nom: 'Attestation de l\'Office Malien de l\'Habitat (OMH)', obligatoire: true },
          { nom: 'Attestation de l\'Institut national de Prévoyance Sociale (INPS)', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'STATIONS',
    nom: 'Ouverture d\'un établissement classé dangereux, insalubre et incommode (ex: stations d\'essence)',
    formulaire: {
      nom: 'Formulaire Stations-service',
      fichier: 'Stations 2023.doc',
      description: 'Formulaire pour l\'ouverture d\'établissements classés'
    },
    types: [],
    piecesCommunes: [
      { nom: 'Plan détaillé de l\'établissement à l\'échelle de 1/200è au minimum', obligatoire: true },
      { nom: 'Plan sommaire à l\'échelle de 1/1.000e au minimum', obligatoire: true },
      { nom: 'Plan d\'ensemble de l\'établissement à l\'échelle de 1/200e au maximum', obligatoire: true },
      { nom: 'Croquis des réservoirs (dépôts d\'hydrocarbures)', obligatoire: false },
      { nom: 'Procès verbal constatant que chaque réservoir a été soumis aux essais prescrits (dépôts d\'hydrocarbures)', obligatoire: false }
    ]
  },
  {
    domaineActivite: 'TRANSPORT',
    nom: 'Transport public de voyageurs ou de marchandises',
    formulaire: {
      nom: 'Formulaire Transport',
      fichier: 'Transport 2023.doc',
      description: 'Formulaire pour l\'autorisation de transport public'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Certificat de résidence', obligatoire: true },
          { nom: 'Diplôme d\'enseignement secondaire au moins ou attestation de capacité professionnelle', obligatoire: true },
          { nom: 'Certificat d\'inscription au registre des transporteurs', obligatoire: true },
          { nom: 'Liste détaillée du matériel roulant', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copie certifiée conforme des statuts', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance, casier judiciaire datant de moins de 3 mois, certificat de nationalité et copie du diplôme d\'enseignement secondaire au moins ou attestation de capacité professionnelle du responsable dirigeant', obligatoire: true },
          { nom: 'Certificat d\'inscription au registre des transporteurs', obligatoire: true },
          { nom: 'Liste détaillée du matériel roulant', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'URBANISTE',
    nom: 'Urbaniste',
    formulaire: {
      nom: 'Formulaire Urbaniste',
      fichier: 'Urbaniste 2023.doc',
      description: 'Formulaire pour l\'autorisation d\'exercice d\'urbaniste'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copie du diplôme d\'urbaniste', obligatoire: true },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Urbanistes', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Copie des diplômes et CV des urbanistes de la Société et du responsable dirigeant', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Urbanistes', obligatoire: true }
        ]
      }
    ]
  }
];

// Helper pour obtenir les données d'une activité réglementée
export const getActiviteReglementeeData = (domaineActivite: string): ActiviteReglementeeData | undefined => {
  return ACTIVITES_REGLEMENTEES_DATA.find(a => a.domaineActivite === domaineActivite);
};

// Helper pour obtenir les pièces requises selon le type de personne
export const getPiecesRequises = (domaineActivite: string, typePersonne: 'physique' | 'morale'): PieceJointe[] => {
  const activite = getActiviteReglementeeData(domaineActivite);
  if (!activite) return [];
  
  const typeData = activite.types.find(t => t.type === typePersonne);
  if (typeData) {
    return typeData.pieces;
  }
  
  return activite.piecesCommunes || [];
};
=======
export interface PieceJointe {
  nom: string;
  description?: string;
  obligatoire: boolean;
}

export interface TypePersonne {
  type: 'physique' | 'morale';
  pieces: PieceJointe[];
}

export interface FormulaireActivite {
  nom: string;
  fichier: string;
  description?: string;
}

export interface ActiviteReglementeeData {
  domaineActivite: string; // Correspond à DomaineActivites enum
  nom: string;
  formulaire: FormulaireActivite;
  types: TypePersonne[];
  piecesCommunes?: PieceJointe[];
}

export const ACTIVITES_REGLEMENTEES_DATA: ActiviteReglementeeData[] = [
  {
    domaineActivite: 'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS',
    nom: 'Administrateur de biens immobiliers ou Agent immobilier',
    formulaire: {
      nom: 'Formulaire de demande d\'autorisation',
      fichier: 'Administrateurs et Agents Immobiliers 2023.doc',
      description: 'Formulaire officiel pour l\'autorisation d\'exercice'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Deux photos d\'identité du promoteur', obligatoire: true },
          { nom: 'Copie certifiée conforme du diplôme ou attestation délivrée par l\'employeur', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou certificat d\'inscription hypothécaire', obligatoire: true },
          { nom: 'Police d\'assurance de responsabilité civile professionnelle', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copies authentiques des statuts', obligatoire: true },
          { nom: 'Extraits de l\'acte de naissance, certificat de nationalité et du casier judiciaire datant de moins de 3 mois du responsable dirigeant', obligatoire: true },
          { nom: 'Curriculum vitae, deux photos d\'identité et copie certifiée conforme du diplôme ou certificat professionnel du responsable dirigeant', obligatoire: true },
          { nom: 'Document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou certificat d\'inscription hypothécaire', obligatoire: true },
          { nom: 'Police d\'assurance de responsabilité civile professionnelle', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'ARCHITECTE',
    nom: 'Architecte',
    formulaire: {
      nom: 'Formulaire de demande d\'autorisation',
      fichier: 'Architecte 2023.doc',
      description: 'Formulaire officiel pour l\'autorisation d\'exercice d\'architecte'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae', obligatoire: true },
          { nom: 'Copie du diplôme ou tout autre certificat universitaire d\'Architecte', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Architectes', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Copies certifiées des diplômes des architectes de la Société', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Architectes', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'BTP',
    nom: 'Entrepreneur du Bâtiment, des Travaux Publics et des Travaux Particuliers',
    formulaire: {
      nom: 'Formulaire BTP',
      fichier: 'BTP 2023.doc',
      description: 'Formulaire pour les entrepreneurs du bâtiment et travaux publics'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait d\'acte de naissance', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Copie certifiée conforme du diplôme ou tout autre certificat établissant la qualification professionnelle requise', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Diplôme ou tout autre certificat établissant la qualification du responsable dirigeant', obligatoire: true },
          { nom: 'Liste nominative du personnel d\'encadrement', obligatoire: true },
          { nom: 'Demande de déclaration d\'ouverture d\'établissement dûment remplie par l\'Agence Nationale pour l\'Emploi', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'CARTOGRAPHIE_TOPOGRAPHIE',
    nom: 'Entrepreneur des Travaux Cartographiques et Topographiques',
    formulaire: {
      nom: 'Formulaire Cartographie Topographie',
      fichier: 'Cartographie Topographie 2023.doc',
      description: 'Formulaire pour les travaux cartographiques et topographiques'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait d\'acte de naissance', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Copie certifiée conforme du diplôme ou tout autre certificat établissant la qualification professionnelle requise', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Diplôme ou tout autre certificat établissant la qualification du responsable dirigeant', obligatoire: true },
          { nom: 'Liste nominative du personnel d\'encadrement', obligatoire: true },
          { nom: 'Demande de déclaration d\'ouverture d\'établissement dûment remplie par l\'Agence Nationale pour l\'Emploi', obligatoire: true },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'GEOMETRES_EXPERTS',
    nom: 'Géomètre-expert',
    formulaire: {
      nom: 'Formulaire Géomètre-Expert',
      fichier: 'Géomètres - Experts 2023.doc',
      description: 'Formulaire pour l\'autorisation d\'exercice de géomètre-expert'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Certificat d\'identité ou de résidence', obligatoire: true },
          { nom: 'Curriculum vitae', obligatoire: true },
          { nom: 'Copie du diplôme', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Géomètres-Experts', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copies authentiques des statuts', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance, casier judiciaire datant de moins de 3 mois, curriculum vitae et copie certifiée conforme du diplôme du responsable dirigeant', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'ordre des Géomètres-Experts', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'INGENIEUR_CONSEIL',
    nom: 'Ingénieur-Conseil',
    formulaire: {
      nom: 'Formulaire Ingénieur-Conseil',
      fichier: 'Ingénieur - Conseil 2023.doc',
      description: 'Formulaire pour l\'autorisation d\'exercice d\'ingénieur-conseil'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copie du diplôme d\'ingénieur', obligatoire: true },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae', obligatoire: true },
          { nom: 'Attestation d\'ouverture de l\'Agence Nationale pour l\'Emploi (ANPE)', obligatoire: true },
          { nom: 'Attestation de l\'Office Malien de l\'Habitat (OMH)', obligatoire: true },
          { nom: 'Attestation de l\'Institut national de Prévoyance Sociale (INPS)', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Copie des diplômes et CV des ingénieurs de la Société et du responsable dirigeant', obligatoire: true },
          { nom: 'Attestation d\'ouverture de l\'Agence Nationale pour l\'Emploi (ANPE)', obligatoire: true },
          { nom: 'Attestation de l\'Office Malien de l\'Habitat (OMH)', obligatoire: true },
          { nom: 'Attestation de l\'Institut national de Prévoyance Sociale (INPS)', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'STATIONS',
    nom: 'Ouverture d\'un établissement classé dangereux, insalubre et incommode (ex: stations d\'essence)',
    formulaire: {
      nom: 'Formulaire Stations-service',
      fichier: 'Stations 2023.doc',
      description: 'Formulaire pour l\'ouverture d\'établissements classés'
    },
    types: [],
    piecesCommunes: [
      { nom: 'Plan détaillé de l\'établissement à l\'échelle de 1/200è au minimum', obligatoire: true },
      { nom: 'Plan sommaire à l\'échelle de 1/1.000e au minimum', obligatoire: true },
      { nom: 'Plan d\'ensemble de l\'établissement à l\'échelle de 1/200e au maximum', obligatoire: true },
      { nom: 'Croquis des réservoirs (dépôts d\'hydrocarbures)', obligatoire: false },
      { nom: 'Procès verbal constatant que chaque réservoir a été soumis aux essais prescrits (dépôts d\'hydrocarbures)', obligatoire: false }
    ]
  },
  {
    domaineActivite: 'TRANSPORT',
    nom: 'Transport public de voyageurs ou de marchandises',
    formulaire: {
      nom: 'Formulaire Transport',
      fichier: 'Transport 2023.doc',
      description: 'Formulaire pour l\'autorisation de transport public'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu', obligatoire: true },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois', obligatoire: true },
          { nom: 'Certificat de nationalité', obligatoire: true },
          { nom: 'Certificat de résidence', obligatoire: true },
          { nom: 'Diplôme d\'enseignement secondaire au moins ou attestation de capacité professionnelle', obligatoire: true },
          { nom: 'Certificat d\'inscription au registre des transporteurs', obligatoire: true },
          { nom: 'Liste détaillée du matériel roulant', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copie certifiée conforme des statuts', obligatoire: true },
          { nom: 'Extrait de l\'acte de naissance, casier judiciaire datant de moins de 3 mois, certificat de nationalité et copie du diplôme d\'enseignement secondaire au moins ou attestation de capacité professionnelle du responsable dirigeant', obligatoire: true },
          { nom: 'Certificat d\'inscription au registre des transporteurs', obligatoire: true },
          { nom: 'Liste détaillée du matériel roulant', obligatoire: true }
        ]
      }
    ]
  },
  {
    domaineActivite: 'URBANISTE',
    nom: 'Urbaniste',
    formulaire: {
      nom: 'Formulaire Urbaniste',
      fichier: 'Urbaniste 2023.doc',
      description: 'Formulaire pour l\'autorisation d\'exercice d\'urbaniste'
    },
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Copie du diplôme d\'urbaniste', obligatoire: true },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Urbanistes', obligatoire: true }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée', obligatoire: true },
          { nom: 'Statuts de la Société', obligatoire: true },
          { nom: 'Copie des diplômes et CV des urbanistes de la Société et du responsable dirigeant', obligatoire: true },
          { nom: 'Attestation d\'inscription à l\'Ordre des Urbanistes', obligatoire: true }
        ]
      }
    ]
  }
];

// Helper pour obtenir les données d'une activité réglementée
export const getActiviteReglementeeData = (domaineActivite: string): ActiviteReglementeeData | undefined => {
  return ACTIVITES_REGLEMENTEES_DATA.find(a => a.domaineActivite === domaineActivite);
};

// Helper pour obtenir les pièces requises selon le type de personne
export const getPiecesRequises = (domaineActivite: string, typePersonne: 'physique' | 'morale'): PieceJointe[] => {
  const activite = getActiviteReglementeeData(domaineActivite);
  if (!activite) return [];
  
  const typeData = activite.types.find(t => t.type === typePersonne);
  if (typeData) {
    return typeData.pieces;
  }
  
  return activite.piecesCommunes || [];
};
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
