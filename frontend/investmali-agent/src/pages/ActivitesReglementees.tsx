import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  BuildingOfficeIcon, 
  HomeModernIcon, 
  TruckIcon, 
  MapIcon,
  CogIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';

interface PieceJointe {
  nom: string;
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-red-500 to-red-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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
    color: 'from-primary-500 to-primary-700',
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

  const renderPiecesList = (pieces: PieceJointe[]) => (
    <ul className="space-y-1.5 sm:space-y-2 lg:space-y-3">
      {pieces.map((piece, index) => (
        <li key={index} className="flex items-start space-x-1.5 sm:space-x-2 lg:space-x-3">
          <div className="flex-shrink-0 w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-primary-500 rounded-full mt-1.5 sm:mt-2 lg:mt-2.5"></div>
          <span className="text-gray-700 text-[11px] sm:text-xs lg:text-sm leading-relaxed flex-1">{piece.nom}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Bannière principale */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-600 text-white py-12 sm:py-16 lg:py-20">
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 py-6 sm:py-8 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Accordions */}
        <div className="space-y-4 sm:space-y-6">
          {activitesData.map((activite) => {
            const isOpen = openAccordions.has(activite.id);
            const IconComponent = activite.icon;

            return (
              <div
                key={activite.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                {/* Header */}
                <button
                  onClick={() => toggleAccordion(activite.id)}
                  className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 active:bg-gray-100"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r ${activite.color} shadow-lg`}>
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xs sm:text-xs md:text-sm lg:text-xl font-bold text-gray-900 line-clamp-2">{activite.nom}</h3>
                      {activite.description && (
                        <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base line-clamp-2">{activite.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {isOpen ? (
                      <ChevronUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Content */}
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
                    <div className="pt-4 sm:pt-6">
                      {/* Pièces communes */}
                      {activite.piecesCommunes && (
                        <div className="mb-8">
                          <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 flex items-center">
                            <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary-500 mr-1.5 sm:mr-2" />
                            Pièces jointes requises
                          </h4>
                          <div className="bg-primary-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                            {renderPiecesList(activite.piecesCommunes)}
                          </div>
                        </div>
                      )}

                      {/* Catégories spéciales */}
                      {activite.categories && (
                        <div className="space-y-6">
                          {activite.categories.map((categorie, index) => (
                            <div key={index}>
                              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 flex items-center">
                                <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary-500 mr-1.5 sm:mr-2" />
                                {categorie.nom}
                              </h4>
                              <div className="bg-primary-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                                {renderPiecesList(categorie.pieces)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Types de personnes */}
                      {activite.types.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          {activite.types.map((type, index) => (
                            <div key={index}>
                              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 flex items-center">
                                {type.type === 'physique' ? (
                                  <>
                                    <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary-500 mr-1.5 sm:mr-2" />
                                    Personnes physiques
                                  </>
                                ) : (
                                  <>
                                    <BuildingOfficeIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary-500 mr-1.5 sm:mr-2" />
                                    Personnes morales
                                  </>
                                )}
                              </h4>
                              <div className={`${type.type === 'physique' ? 'bg-primary-50' : 'bg-primary-50'} rounded-lg sm:rounded-xl p-4 sm:p-6`}>
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

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
              Besoin d'aide ?
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 lg:mb-6 text-[11px] sm:text-sm lg:text-base">
              Notre équipe est là pour vous accompagner dans vos démarches administratives.
            </p>
            <button className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-primary-600 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-primary-700 hover:to-primary-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-[11px] sm:text-sm lg:text-base">
              Contacter un agent
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ActivitesReglementees;
























