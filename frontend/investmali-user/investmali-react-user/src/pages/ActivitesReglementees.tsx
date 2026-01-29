import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  BuildingOfficeIcon, 
  HomeModernIcon, 
  TruckIcon, 
  MapIcon,
  CogIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CloudArrowDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/solid';

interface PieceJointe {
  nom: string;
  description?: string;
}

interface FormulaireTelechargeable {
  nom: string;
  fichier: string;
  description?: string;
}

interface TypePersonne {
  type: 'physique' | 'morale';
  pieces: PieceJointe[];
}

interface ActiviteReglementee {
  id: string;
  nom: string;
  description?: string;
  icon: React.ComponentType<any>;
  color: string;
  types: TypePersonne[];
  piecesCommunes?: PieceJointe[];
  formulaires?: FormulaireTelechargeable[];
  categories?: {
    nom: string;
    pieces: PieceJointe[];
  }[];
}

const activitesData: ActiviteReglementee[] = [
  {
    id: 'admin-biens-immobiliers',
    nom: 'Administrateur de biens immobiliers ou Agent immobilier',
    icon: BuildingOfficeIcon,
    color: 'from-investmali-primary to-investmali-primary',
    formulaires: [
      { nom: 'Formulaire de demande d\'autorisation', fichier: 'Administrateurs et Agents Immobiliers 2023.doc', description: 'Formulaire officiel pour l\'autorisation d\'exercice' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu' },
          { nom: 'Certificat de nationalité' },
          { nom: 'Deux photos d\'identité du promoteur' },
          { nom: 'Copie certifiée conforme du diplôme ou attestation délivrée par l\'employeur' },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois' },
          { nom: 'Document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou certificat d\'inscription hypothécaire' },
          { nom: 'Police d\'assurance de responsabilité civile professionnelle' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Copies authentiques des statuts' },
          { nom: 'Extraits de l\'acte de naissance, certificat de nationalité et du casier judiciaire datant de moins de 3 mois du responsable dirigeant' },
          { nom: 'Curriculum vitae, deux photos d\'identité et copie certifiée conforme du diplôme ou certificat professionnel du responsable dirigeant' },
          { nom: 'Document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou certificat d\'inscription hypothécaire' },
          { nom: 'Police d\'assurance de responsabilité civile professionnelle' }
        ]
      }
    ]
  },
  {
    id: 'architecte',
    nom: 'Architecte',
    icon: HomeModernIcon,
    color: 'from-investmali-accent to-investmali-accent',
    formulaires: [
      { nom: 'Formulaire de demande d\'autorisation', fichier: 'Architecte 2023.doc', description: 'Formulaire officiel pour l\'autorisation d\'exercice d\'architecte' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae' },
          { nom: 'Copie du diplôme ou tout autre certificat universitaire d\'Architecte' },
          { nom: 'Attestation d\'inscription à l\'Ordre des Architectes' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Statuts de la Société' },
          { nom: 'Copies certifiées des diplômes des architectes de la Société' },
          { nom: 'Attestation d\'inscription à l\'Ordre des Architectes' }
        ]
      }
    ]
  },
  {
    id: 'implantation-sans-avantages',
    nom: 'Implantation sans avantages du Code des Investissements',
    icon: CogIcon,
    color: 'from-investmali-accent to-investmali-accent',
    formulaires: [
      { nom: 'Formulaire Code des Investissements', fichier: 'Code des Investissements 2023.doc', description: 'Formulaire pour les demandes d\'implantation' }
    ],
    piecesCommunes: [
      { nom: 'Étude de faisabilité (2 copies)' },
      { nom: 'Statuts (pour les sociétés)' },
      { nom: 'Titre de propriété ou contrat de bail' }
    ],
    types: []
  },
  {
    id: 'entrepreneur-batiment',
    nom: 'Entrepreneur du Bâtiment, des Travaux Publics et des Travaux Particuliers',
    icon: BuildingOfficeIcon,
    color: 'from-investmali-warning to-investmali-warning',
    formulaires: [
      { nom: 'Formulaire BTP', fichier: 'BTP 2023.doc', description: 'Formulaire pour les entrepreneurs du bâtiment et travaux publics' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Extrait d\'acte de naissance' },
          { nom: 'Certificat de nationalité' },
          { nom: 'Copie certifiée conforme du diplôme ou tout autre certificat établissant la qualification professionnelle requise' },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois' },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Statuts de la Société' },
          { nom: 'Diplôme ou tout autre certificat établissant la qualification du responsable dirigeant' },
          { nom: 'Liste nominative du personnel d\'encadrement' },
          { nom: 'Demande de déclaration d\'ouverture d\'établissement dûment remplie par l\'Agence Nationale pour l\'Emploi' },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé' }
        ]
      }
    ]
  },
  {
    id: 'entrepreneur-cartographique',
    nom: 'Entrepreneur des Travaux Cartographiques et Topographiques',
    icon: MapIcon,
    color: 'from-investmali-accent to-investmali-accent',
    formulaires: [
      { nom: 'Formulaire Cartographie Topographie', fichier: 'Cartographie Topographie 2023.doc', description: 'Formulaire pour les travaux cartographiques et topographiques' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Extrait d\'acte de naissance' },
          { nom: 'Certificat de nationalité' },
          { nom: 'Copie certifiée conforme du diplôme ou tout autre certificat établissant la qualification professionnelle requise' },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois' },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Statuts de la Société' },
          { nom: 'Diplôme ou tout autre certificat établissant la qualification du responsable dirigeant' },
          { nom: 'Liste nominative du personnel d\'encadrement' },
          { nom: 'Demande de déclaration d\'ouverture d\'établissement dûment remplie par l\'Agence Nationale pour l\'Emploi' },
          { nom: 'Liste des immobilisations corporelles de l\'entreprise accompagnée d\'un rapport d\'évaluation établi par un expert industriel agréé' }
        ]
      }
    ]
  },
  {
    id: 'agrement-code-investissements',
    nom: 'Agrément au Code des Investissements',
    icon: ShieldCheckIcon,
    color: 'from-investmali-primary to-investmali-primary',
    formulaires: [
      { nom: 'Formulaire Agrément Code des Investissements', fichier: 'Code des Investissements 2023.doc', description: 'Formulaire pour l\'agrément au code des investissements' }
    ],
    piecesCommunes: [
      { nom: 'Étude de faisabilité (15 copies pour les régimes A, B, C, D et 14 copies pour le régime des zones économiques)' },
      { nom: 'Statuts (pour les sociétés)' },
      { nom: 'Autorisation d\'exercice le cas échéant' }
    ],
    types: []
  },
  {
    id: 'geometre-expert',
    nom: 'Géomètre-expert',
    icon: MapIcon,
    color: 'from-investmali-accent to-investmali-accent',
    formulaires: [
      { nom: 'Formulaire Géomètre-Expert', fichier: 'Géomètres - Experts 2023.doc', description: 'Formulaire pour l\'autorisation d\'exercice de géomètre-expert' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu' },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois' },
          { nom: 'Certificat de nationalité' },
          { nom: 'Certificat d\'identité ou de résidence' },
          { nom: 'Curriculum vitae' },
          { nom: 'Copie du diplôme' },
          { nom: 'Attestation d\'inscription à l\'Ordre des Géomètres-Experts' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Copies authentiques des statuts' },
          { nom: 'Extrait de l\'acte de naissance, casier judiciaire datant de moins de 3 mois, curriculum vitae et copie certifiée conforme du diplôme du responsable dirigeant' },
          { nom: 'Attestation d\'inscription à l\'ordre des Géomètres-Experts' }
        ]
      }
    ]
  },
  {
    id: 'ingenieur-conseil',
    nom: 'Ingénieur-Conseil',
    icon: CogIcon,
    color: 'from-investmali-primary to-investmali-primary',
    formulaires: [
      { nom: 'Formulaire Ingénieur-Conseil', fichier: 'Ingénieur - Conseil 2023.doc', description: 'Formulaire pour l\'autorisation d\'exercice d\'ingénieur-conseil' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Copie du diplôme d\'ingénieur' },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae' },
          { nom: 'Attestation d\'ouverture de l\'Agence Nationale pour l\'Emploi (ANPE)' },
          { nom: 'Attestation de l\'Office Malien de l\'Habitat (OMH)' },
          { nom: 'Attestation de l\'Institut national de Prévoyance Sociale (INPS)' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Statuts de la Société' },
          { nom: 'Copie des diplômes et CV des ingénieurs de la Société et du responsable dirigeant' },
          { nom: 'Attestation d\'ouverture de l\'Agence Nationale pour l\'Emploi (ANPE)' },
          { nom: 'Attestation de l\'Office Malien de l\'Habitat (OMH)' },
          { nom: 'Attestation de l\'Institut national de Prévoyance Sociale (INPS)' }
        ]
      }
    ]
  },
  {
    id: 'etablissement-classe',
    nom: 'Ouverture d\'un établissement classé dangereux, insalubre et incommode (ex: stations d\'essence)',
    icon: ShieldCheckIcon,
    color: 'from-investmali-warning to-investmali-warning',
    formulaires: [
      { nom: 'Formulaire Stations-service', fichier: 'Stations 2023.doc', description: 'Formulaire pour l\'ouverture d\'établissements classés' }
    ],
    categories: [
      {
        nom: 'Établissement des 1ère et 2ème classe',
        pieces: [
          { nom: 'Carte dont l\'échelle varie entre 1/100.000 et 1/500.000e (pour les établissements de 1ère classe)' },
          { nom: 'Plan détaillé de l\'établissement à l\'échelle de 1/200è au minimum' },
          { nom: 'Plan sommaire à l\'échelle de 1/1.000e au minimum' }
        ]
      },
      {
        nom: 'Établissement de 3ème classe',
        pieces: [
          { nom: 'Plan d\'ensemble de l\'établissement à l\'échelle de 1/200e au maximum' },
          { nom: 'Croquis des réservoirs (dépôts d\'hydrocarbures)' },
          { nom: 'Procès verbal constatant que chaque réservoir a été soumis aux essais prescrits (dépôts d\'hydrocarbures)' }
        ]
      }
    ],
    types: []
  },
  {
    id: 'transport-public',
    nom: 'Transport public de voyageurs ou de marchandises',
    icon: TruckIcon,
    color: 'from-investmali-accent to-investmali-accent',
    formulaires: [
      { nom: 'Formulaire Transport', fichier: 'Transport 2023.doc', description: 'Formulaire pour l\'autorisation de transport public' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Extrait de l\'acte de naissance ou du jugement supplétif en tenant lieu' },
          { nom: 'Extrait du casier judiciaire datant de moins de trois mois' },
          { nom: 'Certificat de nationalité' },
          { nom: 'Certificat de résidence' },
          { nom: 'Diplôme d\'enseignement secondaire au moins ou attestation de capacité professionnelle' },
          { nom: 'Certificat d\'inscription au registre des transporteurs' },
          { nom: 'Liste détaillée du matériel roulant' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Copie certifiée conforme des statuts' },
          { nom: 'Extrait de l\'acte de naissance, casier judiciaire datant de moins de 3 mois, certificat de nationalité et copie du diplôme d\'enseignement secondaire au moins ou attestation de capacité professionnelle du responsable dirigeant' },
          { nom: 'Certificat d\'inscription au registre des transporteurs' },
          { nom: 'Liste détaillée du matériel roulant' }
        ]
      }
    ]
  },
  {
    id: 'urbaniste',
    nom: 'Urbaniste',
    icon: UserGroupIcon,
    color: 'from-investmali-accent to-investmali-accent',
    formulaires: [
      { nom: 'Formulaire Urbaniste', fichier: 'Urbaniste 2023.doc', description: 'Formulaire pour l\'autorisation d\'exercice d\'urbaniste' }
    ],
    types: [
      {
        type: 'physique',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Copie du diplôme d\'urbaniste' },
          { nom: 'Acte de naissance, certificat de nationalité, casier judiciaire datant de moins de trois mois et curriculum vitae' },
          { nom: 'Attestation d\'inscription à l\'Ordre des Urbanistes' }
        ]
      },
      {
        type: 'morale',
        pieces: [
          { nom: 'Demande timbrée' },
          { nom: 'Statuts de la Société' },
          { nom: 'Copie des diplômes et CV des urbanistes de la Société et du responsable dirigeant' },
          { nom: 'Attestation d\'inscription à l\'Ordre des Urbanistes' }
        ]
      }
    ]
  }
];

const ActivitesReglementees: React.FC = () => {
  const navigate = useNavigate();
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  const toggleAccordion = (id: string) => {
    const newOpenAccordions = new Set(openAccordions);
    if (newOpenAccordions.has(id)) {
      newOpenAccordions.delete(id);
    } else {
      newOpenAccordions.add(id);
    }
    setOpenAccordions(newOpenAccordions);
  };

  const handleDownloadFormulaire = (fichier: string, nom: string) => {
    try {
      console.log(`📥 Téléchargement du formulaire: ${nom}`);
      
      // Créer un lien de téléchargement direct vers le dossier public/formulaires
      const link = document.createElement('a');
      link.href = `${process.env.PUBLIC_URL}/formulaires/${fichier}`;
      link.download = fichier;
      link.setAttribute('target', '_blank');
      
      // Ajouter temporairement au DOM et cliquer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Téléchargement initié: ${nom}`);
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert(`Erreur lors du téléchargement de "${nom}".`);
    }
  };

  const renderPiecesList = (pieces: PieceJointe[]) => (
    <ul className="space-y-1.5 sm:space-y-2 lg:space-y-3">
      {pieces.map((piece, index) => (
        <li key={index} className="flex items-start space-x-1.5 sm:space-x-2 lg:space-x-3">
          <div className="flex-shrink-0 w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-investmali-primary rounded-full mt-1.5 sm:mt-2 lg:mt-2.5"></div>
          <span className="text-gray-700 text-[11px] sm:text-xs lg:text-sm leading-relaxed flex-1">{piece.nom}</span>
        </li>
      ))}
    </ul>
  );

  const renderFormulairesList = (formulaires: FormulaireTelechargeable[]) => (
    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
      {formulaires.map((formulaire, index) => (
        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-investmali-primary/5 to-investmali-accent/5 rounded-lg sm:rounded-xl lg:rounded-2xl border border-investmali-primary/20 hover:border-investmali-primary/30 transition-all duration-300 hover:shadow-lg space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <DocumentArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-lg line-clamp-2">{formulaire.nom}</h5>
              {formulaire.description && (
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">{formulaire.description}</p>
              )}
              <p className="text-[9px] sm:text-[10px] lg:text-xs text-investmali-primary mt-0.5 sm:mt-1 font-medium">Format: {formulaire.fichier.endsWith('.pdf') ? 'PDF' : 'Word'}</p>
            </div>
          </div>
          <button
            onClick={() => handleDownloadFormulaire(formulaire.fichier, formulaire.nom)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 sm:space-x-3 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-investmali-primary to-investmali-accent text-white rounded-lg sm:rounded-xl hover:from-investmali-primary/90 hover:to-investmali-accent/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-xs sm:text-sm lg:text-base"
          >
            <CloudArrowDownIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
            <span>Télécharger</span>
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Header />
      
      {/* Bannière principale */}
      <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent text-white py-12 sm:py-16 lg:py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">Activités Réglementées au Mali</h1>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl max-w-3xl mx-auto leading-relaxed opacity-90 mb-2 sm:mb-3 lg:mb-4">
            Découvrez les pièces jointes requises pour chaque type d'activité réglementée. Préparez votre dossier en toute simplicité avec notre guide complet.
          </p>
          <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold opacity-80">
            11 activités répertoriées
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-investmali-primary/5 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Accordions */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {activitesData.map((activite) => {
            const isOpen = openAccordions.has(activite.id);
            const IconComponent = activite.icon;

            return (
              <div
                key={activite.id}
                className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl"
              >
                {/* Header */}
                <button
                  onClick={() => toggleAccordion(activite.id)}
                  className="w-full p-4 sm:p-6 lg:p-8 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-300 active:bg-gray-100"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                    <div className={`p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-r ${activite.color} shadow-xl transform transition-transform duration-300 hover:scale-110`}>
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xs sm:text-xs md:text-sm lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">{activite.nom}</h3>
                      {activite.description && (
                        <p className="text-gray-600 text-xs sm:text-sm lg:text-base line-clamp-2">{activite.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2 sm:ml-4">
                    <div className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-blue-100 rotate-180' : 'bg-gray-100'}`}>
                      <ChevronDownIcon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-colors duration-300 ${isOpen ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                  </div>
                </button>

                {/* Content */}
                {isOpen && (
                  <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                    <div className="pt-4 sm:pt-6 lg:pt-8">
                      {/* Formulaires téléchargeables */}
                      {activite.formulaires && activite.formulaires.length > 0 && (
                        <div className="mb-6 sm:mb-8 lg:mb-10">
                          <h4 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
                            <CloudArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 mr-2 sm:mr-3" />
                            Formulaires à télécharger
                          </h4>
                          {renderFormulairesList(activite.formulaires)}
                        </div>
                      )}

                      {/* Pièces communes */}
                      {activite.piecesCommunes && (
                        <div className="mb-6 sm:mb-8 lg:mb-10">
                          <h4 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
                            <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500 mr-2 sm:mr-3" />
                            Pièces jointes requises
                          </h4>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-100">
                            {renderPiecesList(activite.piecesCommunes)}
                          </div>
                        </div>
                      )}

                      {/* Catégories spéciales */}
                      {activite.categories && (
                        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                          {activite.categories.map((categorie, index) => (
                            <div key={index}>
                              <h4 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
                                <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500 mr-2 sm:mr-3" />
                                {categorie.nom}
                              </h4>
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-100">
                                {renderPiecesList(categorie.pieces)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Types de personnes */}
                      {activite.types.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                          {activite.types.map((type, index) => (
                            <div key={index} className="space-y-3 sm:space-y-4 lg:space-y-6">
                              <h4 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 flex items-center">
                                {type.type === 'physique' ? (
                                  <>
                                    <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500 mr-2 sm:mr-3" />
                                    Personnes physiques
                                  </>
                                ) : (
                                  <>
                                    <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-500 mr-2 sm:mr-3" />
                                    Personnes morales
                                  </>
                                )}
                              </h4>
                              <div className={`${
                                type.type === 'physique' 
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
                                  : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'
                                } rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border`}>
                                {renderPiecesList(type.pieces)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 sm:mt-14 lg:mt-16 text-center">
          <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 text-white">
            <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6">
              Prêt à démarrer votre activité ?
            </h3>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90 max-w-2xl mx-auto">
              Notre plateforme vous accompagne dans toutes vos démarches administratives. 
              Créez votre entreprise en ligne en quelques clics.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button 
                onClick={() => navigate('/creation-entreprise')}
                className="w-full sm:w-auto bg-white text-blue-600 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                Créer mon entreprise
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                Contacter un conseiller
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default ActivitesReglementees;
