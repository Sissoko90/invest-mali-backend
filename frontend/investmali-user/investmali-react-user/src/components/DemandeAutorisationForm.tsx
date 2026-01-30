<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import DocumentUpload from './DocumentUpload';
import { buildApiUrl } from '../config/api.config';

interface TypeDemandeInfo {
  type: string;
  libelle: string;
  montant: number;
  description: string;
  delaiTraitement: string;
  documentsRequis: string[];
}

interface DemandeData {
  // Type de demande
  typeDemande: string;
  
  // Informations du demandeur
  nomDemandeur: string;
  prenomDemandeur: string;
  emailDemandeur: string;
  telephoneDemandeur: string;
  adresseDemandeur: string;
  
  // Informations de l'entreprise/activité
  nomEntreprise: string;
  sigleEntreprise: string;
  secteurActivite: string;
  descriptionActivite: string;
  adresseEntreprise: string;
  villeEntreprise: string;
  regionEntreprise: string;
  
  // Type d'entité pour les documents
  typeEntite?: 'PERSONNE_MORALE' | 'PERSONNE_PHYSIQUE';
  
  // Documents d'agrément
  documents: {
    // Documents communs
    demandeTimbre?: File | null;
    demandeTimbreName?: string;
    
    // Pour personnes morales
    statutsSociete?: File | null;
    statutsSocieteName?: string;
    diplomesArchitectes?: File | null;
    diplomesArchitectesName?: string;
    attestationOrdre?: File | null;
    attestationOrdreName?: string;
    
    // Pour personnes physiques
    acteNaissance?: File | null;
    acteNaissanceName?: string;
    certificatNationalite?: File | null;
    certificatNationaliteName?: string;
    casierJudiciaire?: File | null;
    casierJudiciaireName?: string;
    curriculumVitae?: File | null;
    curriculumVitaeName?: string;
    diplomeArchitecte?: File | null;
    diplomeArchitecteName?: string;
    attestationOrdrePhysique?: File | null;
    attestationOrdrePhysiqueName?: string;
  };
  
  // Informations financières
  capitalSocial: number;
  chiffreAffairesPrevisionnel: number;
  nombreEmployesPrevus: number;
}

interface DemandeAutorisationFormProps {
  onSubmit?: (demande: DemandeData) => void;
  onCancel?: () => void;
}

const DemandeAutorisationForm: React.FC<DemandeAutorisationFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<TypeDemandeInfo | null>(null);
  const [formData, setFormData] = useState<DemandeData>({
    typeDemande: '',
    nomDemandeur: '',
    prenomDemandeur: '',
    emailDemandeur: '',
    telephoneDemandeur: '',
    adresseDemandeur: '',
    nomEntreprise: '',
    sigleEntreprise: '',
    secteurActivite: '',
    descriptionActivite: '',
    adresseEntreprise: '',
    villeEntreprise: '',
    regionEntreprise: '',
    typeEntite: undefined,
    documents: {},
    capitalSocial: 0,
    chiffreAffairesPrevisionnel: 0,
    nombreEmployesPrevus: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const typesDisponibles: TypeDemandeInfo[] = [
    {
      type: 'AGREMENT',
      libelle: 'Demande d\'Agrément',
      montant: 300000,
      description: 'Procédure complète avec validation présidentielle pour les activités nécessitant un agrément officiel',
      delaiTraitement: '60-90 jours ouvrables',
      documentsRequis: [
        'Certificat d\'incorporation',
        'Statuts de l\'entreprise',
        'CV du dirigeant',
        'Justificatif de domicile',
        'Attestation bancaire',
        'Plan d\'affaires'
      ]
    },
    {
      type: 'DECISION',
      libelle: 'Demande de Décision',
      montant: 150000,
      description: 'Procédure intermédiaire via MIC et SGG pour les activités réglementées',
      delaiTraitement: '30-45 jours ouvrables',
      documentsRequis: [
        'Certificat d\'incorporation',
        'Statuts de l\'entreprise',
        'CV du dirigeant',
        'Justificatif de domicile'
      ]
    },
    {
      type: 'ENREGISTREMENT',
      libelle: 'Enregistrement Simple',
      montant: 50000,
      description: 'Procédure simplifiée pour les activités ne nécessitant qu\'un enregistrement',
      delaiTraitement: '5-10 jours ouvrables',
      documentsRequis: [
        'Certificat d\'incorporation',
        'CV du dirigeant'
      ]
    }
  ];

  const secteurs = [
    // SECTION A - AGRICULTURE, SYLVICULTURE ET PÊCHE
    'Culture de céréales (sauf riz), de légumineuses et de graines oléagineuses',
    'Culture du riz',
    'Culture de légumes et de melons, racines et tubercules',
    'Culture de la canne à sucre',
    'Culture du tabac',
    'Culture de plantes à fibres',
    'Culture d\'autres plantes non permanentes',
    'Culture de raisins',
    'Culture de fruits tropicaux et subtropicaux',
    'Culture d\'agrumes',
    'Culture de fruits à pépins et à noyau',
    'Culture d\'autres fruits d\'arbres ou d\'arbustes et de fruits à coque',
    'Culture d\'oléagineux',
    'Culture de plantes à boissons',
    'Culture de plantes à épices, aromatiques, médicinales et pharmaceutiques',
    'Culture d\'autres plantes permanentes',
    'Reproduction de plantes',
    'Élevage de bovins laitiers',
    'Élevage d\'autres bovins et de buffles',
    'Élevage de chevaux et d\'autres équidés',
    'Élevage de chameaux et d\'autres camélidés',
    'Élevage de porcins',
    'Élevage de volailles',
    'Élevage d\'autres animaux',
    'Culture et élevage associés',
    'Activités de soutien aux cultures',
    'Activités de soutien à la production animale',
    'Chasse, piégeage et services annexes',
    'Sylviculture et autres activités forestières',
    'Exploitation forestière',
    'Récolte de produits forestiers non ligneux poussant à l\'état sauvage',
    'Services de soutien à l\'exploitation forestière',
    'Pêche en mer',
    'Pêche en eau douce',
    'Aquaculture en mer',
    'Aquaculture en eau douce',

    // SECTION B - ACTIVITÉS EXTRACTIVES
    'Extraction de houille',
    'Extraction de lignite',
    'Extraction de pétrole brut',
    'Extraction de gaz naturel',
    'Extraction de minerais de fer',
    'Extraction de minerais de métaux non ferreux',
    'Extraction de pierres ornementales et de construction, de calcaire industriel, de gypse, de craie et d\'ardoise',
    'Exploitation de gravières et sablières, extraction d\'argiles et de kaolin',
    'Activités extractives n.c.a.',
    'Activités de soutien à l\'extraction d\'hydrocarbures',
    'Activités de soutien à d\'autres activités extractives',

    // SECTION C - ACTIVITÉS DE FABRICATION
    'Transformation et conservation de la viande',
    'Transformation et conservation de poissons, de crustacés et de mollusques',
    'Transformation et conservation de fruits et légumes',
    'Fabrication d\'huiles et graisses végétales et animales',
    'Fabrication de produits laitiers',
    'Travail des grains ; fabrication de produits amylacés',
    'Fabrication de produits de boulangerie-pâtisserie et de pâtes alimentaires',
    'Fabrication d\'autres produits alimentaires',
    'Fabrication d\'aliments pour animaux',
    'Fabrication de boissons',
    'Fabrication de produits à base de tabac',
    'Préparation de fibres textiles et filature',
    'Tissage',
    'Ennoblissement textile',
    'Fabrication d\'autres articles textiles',
    'Fabrication d\'étoffes à mailles',
    'Fabrication d\'articles d\'habillement, à l\'exception des vêtements en fourrure',
    'Fabrication d\'articles en fourrure',
    'Fabrication d\'articles chaussants',
    'Sciage et rabotage du bois',
    'Fabrication d\'articles en bois, liège, vannerie et sparterie',
    'Fabrication de papier et de produits en papier',
    'Imprimerie et reproduction d\'enregistrements',
    'Cokéfaction',
    'Fabrication de produits de raffinage pétrolier',
    'Fabrication de produits chimiques de base, de produits azotés et d\'engrais, de matières plastiques de base et de caoutchouc synthétique',
    'Fabrication d\'autres produits chimiques',
    'Fabrication de fibres artificielles ou synthétiques',
    'Fabrication de produits pharmaceutiques, de produits chimiques à usage médicinal et de produits d\'herboristerie',
    'Fabrication de produits en caoutchouc',
    'Fabrication de produits en matières plastiques',
    'Fabrication de verre et d\'articles en verre',
    'Fabrication de produits réfractaires',
    'Fabrication de matériaux de construction en terre cuite',
    'Fabrication d\'autres produits en porcelaine et en céramique',
    'Fabrication de ciment, chaux et plâtre',
    'Fabrication d\'ouvrages en béton, en ciment et en plâtre',
    'Taille, façonnage et finissage de pierres',
    'Fabrication d\'autres produits minéraux non métalliques',
    'Sidérurgie',
    'Fabrication de tubes, tuyaux, profilés creux et accessoires correspondants en acier',
    'Fabrication d\'autres produits de première transformation de l\'acier',
    'Production de métaux précieux',
    'Métallurgie de l\'aluminium',
    'Métallurgie du plomb, du zinc et de l\'étain',
    'Métallurgie d\'autres métaux non ferreux',
    'Fonderie',
    'Fabrication d\'éléments en métal pour la construction',
    'Fabrication d\'ouvrages de chaudronnerie',
    'Fabrication d\'armes et de munitions',
    'Forge, emboutissage, estampage ; métallurgie des poudres',
    'Traitement et revêtement des métaux ; usinage',
    'Fabrication de coutellerie, d\'outillage et de quincaillerie',
    'Fabrication d\'autres ouvrages en métaux',
    'Fabrication de composants et cartes électroniques',
    'Fabrication d\'ordinateurs et d\'équipements périphériques',
    'Fabrication d\'équipements de communication',
    'Fabrication de produits électroniques grand public',
    'Fabrication d\'instruments et fournitures à usage médical et dentaire',
    'Fabrication d\'instruments de mesure, d\'essai et de navigation ; horlogerie',
    'Fabrication d\'équipements d\'irradiation médicale, d\'équipements électromédicaux et électrothérapeutiques',
    'Fabrication d\'instruments d\'optique et d\'équipements photographiques',
    'Fabrication de supports magnétiques et optiques',
    'Fabrication de moteurs, génératrices et transformateurs électriques',
    'Fabrication de matériel de distribution et de commande électrique',
    'Fabrication de fils et câbles et de dispositifs de câblage',
    'Fabrication de piles et d\'accumulateurs électriques',
    'Fabrication d\'appareils d\'éclairage électrique',
    'Fabrication d\'appareils ménagers',
    'Fabrication d\'autres matériels électriques',
    'Fabrication de machines d\'usage général',
    'Fabrication d\'autres machines d\'usage spécifique',
    'Fabrication de véhicules automobiles',
    'Fabrication de carrosseries et remorques',
    'Fabrication d\'équipements automobiles',
    'Construction navale',
    'Construction de locomotives et d\'autre matériel ferroviaire roulant',
    'Construction aéronautique et spatiale',
    'Fabrication de matériels de transport n.c.a.',
    'Fabrication de meubles',
    'Fabrication d\'articles de bijouterie, joaillerie et articles similaires',
    'Fabrication d\'instruments de musique',
    'Fabrication d\'articles de sport',
    'Fabrication de jeux et jouets',
    'Fabrication de dispositifs médicaux et dentaires',
    'Autres activités de fabrication',
    'Réparation et installation de machines et d\'équipements',

    // SECTION D - PRODUCTION ET DISTRIBUTION D\'ÉLECTRICITÉ, DE GAZ, DE VAPEUR ET D\'AIR CONDITIONNÉ
    'Production, transport et distribution d\'électricité',
    'Production et distribution de combustibles gazeux',
    'Production et distribution de vapeur et d\'air conditionné',

    // SECTION E - PRODUCTION ET DISTRIBUTION D\'EAU ; ASSAINISSEMENT, GESTION DES DÉCHETS ET DÉPOLLUTION
    'Captage, traitement et distribution d\'eau',
    'Collecte et traitement des eaux usées',
    'Collecte des déchets',
    'Traitement et élimination des déchets',
    'Récupération',
    'Dépollution et autres services de gestion des déchets',

    // SECTION F - CONSTRUCTION
    'Promotion immobilière',
    'Construction de bâtiments résidentiels et non résidentiels',
    'Génie civil',
    'Travaux de construction spécialisés',

    // SECTION G - COMMERCE ; RÉPARATION D\'AUTOMOBILES ET DE MOTOCYCLES
    'Commerce de véhicules automobiles',
    'Entretien et réparation de véhicules automobiles',
    'Commerce d\'équipements automobiles',
    'Commerce et réparation de motocycles',
    'Commerce de gros, à l\'exception des véhicules automobiles et des motocycles',
    'Commerce de détail, à l\'exception des véhicules automobiles et des motocycles',

    // SECTION H - TRANSPORTS ET ENTREPOSAGE
    'Transport ferroviaire interurbain de voyageurs',
    'Transport ferroviaire de fret',
    'Transports urbains et suburbains de voyageurs',
    'Transport de voyageurs par taxis',
    'Autres transports terrestres de voyageurs',
    'Transport routier de fret',
    'Transport par conduites',
    'Transports maritimes et côtiers de voyageurs',
    'Transports maritimes et côtiers de fret',
    'Transports par voies d\'eau intérieures',
    'Transport aérien de voyageurs',
    'Transport aérien de fret',
    'Entreposage et services auxiliaires des transports',
    'Activités de poste et de courrier',

    // SECTION I - HÉBERGEMENT ET RESTAURATION
    'Hébergement',
    'Restauration',

    // SECTION J - INFORMATION ET COMMUNICATION
    'Édition',
    'Production de films cinématographiques, de vidéo et de programmes de télévision ; enregistrement sonore et édition musicale',
    'Programmation et diffusion',
    'Télécommunications',
    'Programmation, conseil et autres activités informatiques',
    'Services d\'information',

    // SECTION K - ACTIVITÉS FINANCIÈRES ET D\'ASSURANCE
    'Activités des services financiers, hors assurance et caisses de retraite',
    'Assurance',
    'Activités auxiliaires de services financiers et d\'assurance',

    // SECTION L - ACTIVITÉS IMMOBILIÈRES
    'Activités immobilières',

    // SECTION M - ACTIVITÉS SPÉCIALISÉES, SCIENTIFIQUES ET TECHNIQUES
    'Activités juridiques et comptables',
    'Activités de sièges sociaux ; conseil de gestion',
    'Activités d\'architecture et d\'ingénierie ; activités de contrôle et analyses techniques',
    'Recherche-développement scientifique',
    'Publicité et études de marché',
    'Autres activités spécialisées, scientifiques et techniques',
    'Activités vétérinaires',

    // SECTION N - ACTIVITÉS DE SERVICES ADMINISTRATIFS ET DE SOUTIEN
    'Activités de location et location-bail',
    'Activités liées à l\'emploi',
    'Activités des agences de voyage, voyagistes, services de réservation et activités connexes',
    'Enquêtes et sécurité',
    'Services relatifs aux bâtiments et aménagement paysager',
    'Activités administratives et autres activités de soutien aux entreprises',

    // SECTION O - ADMINISTRATION PUBLIQUE ET DÉFENSE ; SÉCURITÉ SOCIALE OBLIGATOIRE
    'Administration publique et défense ; sécurité sociale obligatoire',

    // SECTION P - ENSEIGNEMENT
    'Enseignement',

    // SECTION Q - SANTÉ HUMAINE ET ACTION SOCIALE
    'Activités pour la santé humaine',
    'Hébergement médico-social et social',
    'Action sociale sans hébergement',

    // SECTION R - ARTS, SPECTACLES ET ACTIVITÉS RÉCRÉATIVES
    'Activités créatives, artistiques et de spectacle',
    'Fonctionnement de bibliothèques, archives, musées et autres activités culturelles',
    'Organisation de jeux de hasard et d\'argent',
    'Activités sportives, récréatives et de loisirs',

    // SECTION S - AUTRES ACTIVITÉS DE SERVICES
    'Activités des organisations associatives',
    'Réparation d\'ordinateurs et de biens personnels et domestiques',
    'Autres services personnels',

    // SECTION T - ACTIVITÉS DES MÉNAGES EN TANT QU\'EMPLOYEURS ; ACTIVITÉS INDIFFÉRENCIÉES DES MÉNAGES EN TANT QUE PRODUCTEURS DE BIENS ET SERVICES POUR USAGE PROPRE
    'Activités des ménages en tant qu\'employeurs de personnel domestique',
    'Activités indifférenciées des ménages en tant que producteurs de biens et services pour usage propre',

    // SECTION U - ACTIVITÉS DES ORGANISATIONS ET ORGANISMES EXTRATERRITORIAUX
    'Activités des organisations et organismes extraterritoriaux'
  ];

  const regions = [
    'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 
    'Tombouctou', 'Gao', 'Kidal', 'Taoudéni', 'Ménaka', 'Bamako'
  ];

  const handleInputChange = (field: keyof DemandeData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleDocumentUpload = (field: string, file: File | null | undefined, fileName?: string) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file || null,
        ...(fileName && { [`${field}Name`]: fileName })
      }
    }));
    setError(null);
  };

  const handleTypeSelection = (type: TypeDemandeInfo) => {
    setSelectedType(type);
    setFormData(prev => ({
      ...prev,
      typeDemande: type.type
    }));
    setError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!selectedType;
      case 2:
        return !!(formData.nomDemandeur && formData.prenomDemandeur && formData.emailDemandeur);
      case 3:
        return !!(formData.nomEntreprise && formData.secteurActivite && formData.descriptionActivite);
      case 4:
        // Validation des documents requis pour l'agrément
        if (selectedType?.type === 'AGREMENT') {
          // Vérifier que le type d'entité est sélectionné et la demande timbrée uploadée
          return !!(formData.typeEntite && formData.documents.demandeTimbre);
        }
        return true; // Pas de documents requis pour les autres types
      case 5:
        return true; // Étape optionnelle
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      setError('Veuillez remplir tous les champs obligatoires');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      setError('Veuillez vérifier toutes les informations');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Créer une nouvelle demande d'agrément indépendante (pas liée aux entreprises existantes)
      const { documents, ...formDataWithoutDocuments } = formData;
      
      const nouvelleDemandeData = {
        // Informations de base de la demande
        typeDemande: selectedType?.type || 'AGREMENT',
        statut: 'EN_ATTENTE',
        dateCreation: new Date().toISOString(),
        
        // Informations du demandeur
        demandeur: {
          nom: formData.nomDemandeur,
          prenom: formData.prenomDemandeur,
          email: formData.emailDemandeur,
          telephone: formData.telephoneDemandeur,
          adresse: formData.adresseDemandeur
        },
        
        // Informations de l'entreprise/projet
        entreprise: {
          nom: formData.nomEntreprise,
          sigle: formData.sigleEntreprise,
          secteurActivite: formData.secteurActivite,
          descriptionActivite: formData.descriptionActivite,
          adresse: formData.adresseEntreprise,
          ville: formData.villeEntreprise,
          region: formData.regionEntreprise,
          typeEntite: formData.typeEntite
        },
        
        // Informations financières (optionnelles)
        informationsFinancieres: {
          capitalSocial: formData.capitalSocial || 0,
          chiffreAffairesPrevisionnel: formData.chiffreAffairesPrevisionnel || 0,
          nombreEmployesPrevus: formData.nombreEmployesPrevus || 0
        },
        
        // Documents uploadés
        documentsJoints: selectedType?.type === 'AGREMENT' ? {
          demandeTimbre: {
            nom: documents.demandeTimbreName || null,
            uploaded: !!documents.demandeTimbre,
            obligatoire: true
          },
          ...(formData.typeEntite === 'PERSONNE_MORALE' && {
            statutsSociete: {
              nom: documents.statutsSocieteName || null,
              uploaded: !!documents.statutsSociete,
              obligatoire: false
            },
            diplomesArchitectes: {
              nom: documents.diplomesArchitectesName || null,
              uploaded: !!documents.diplomesArchitectes,
              obligatoire: false
            },
            attestationOrdre: {
              nom: documents.attestationOrdreName || null,
              uploaded: !!documents.attestationOrdre,
              obligatoire: false
            }
          }),
          ...(formData.typeEntite === 'PERSONNE_PHYSIQUE' && {
            acteNaissance: {
              nom: documents.acteNaissanceName || null,
              uploaded: !!documents.acteNaissance,
              obligatoire: false
            },
            certificatNationalite: {
              nom: documents.certificatNationaliteName || null,
              uploaded: !!documents.certificatNationalite,
              obligatoire: false
            },
            casierJudiciaire: {
              nom: documents.casierJudiciaireName || null,
              uploaded: !!documents.casierJudiciaire,
              obligatoire: false
            },
            curriculumVitae: {
              nom: documents.curriculumVitaeName || null,
              uploaded: !!documents.curriculumVitae,
              obligatoire: false
            },
            diplomeArchitecte: {
              nom: documents.diplomeArchitecteName || null,
              uploaded: !!documents.diplomeArchitecte,
              obligatoire: false
            },
            attestationOrdrePhysique: {
              nom: documents.attestationOrdrePhysiqueName || null,
              uploaded: !!documents.attestationOrdrePhysique,
              obligatoire: false
            }
          })
        } : {}
      };

      // Format pour le nouvel endpoint de demandes indépendantes
      const demandeEntity = {
        demandeDetails: {
          typeDemande: selectedType?.type || 'AGREMENT',
          
          // Informations du demandeur
          nomDemandeur: formData.nomDemandeur,
          prenomDemandeur: formData.prenomDemandeur,
          emailDemandeur: formData.emailDemandeur,
          telephoneDemandeur: formData.telephoneDemandeur,
          adresseDemandeur: formData.adresseDemandeur,
          
          // Informations de l'entreprise
          nomEntreprise: formData.nomEntreprise,
          sigleEntreprise: formData.sigleEntreprise,
          secteurActivite: formData.secteurActivite,
          descriptionActivite: formData.descriptionActivite,
          adresseEntreprise: formData.adresseEntreprise,
          villeEntreprise: formData.villeEntreprise,
          regionEntreprise: formData.regionEntreprise,
          
          // Informations financières
          capitalSocial: formData.capitalSocial || 0,
          chiffreAffairesPrevisionnel: formData.chiffreAffairesPrevisionnel || 0,
          nombreEmployesPrevus: formData.nombreEmployesPrevus || 0,
          
          // Documents fournis
          documentsJoints: nouvelleDemandeData.documentsJoints,
          typeEntite: formData.typeEntite
        }
      };

      console.log('📋 Envoi de la nouvelle demande indépendante:', demandeEntity);

      // Utiliser le nouvel endpoint pour les demandes indépendantes
      const apiUrl = buildApiUrl('autorisation-exercice/nouvelle-demande');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demandeEntity)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la demande');
      }

      const result = await response.json();
      setSuccess(`Demande d'agrément créée avec succès ! Numéro de demande: ${result.numeroDemande || result.id}`);
      setCurrentStep(6);

      if (onSubmit) {
        onSubmit(formData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choisissez le type de demande
              </h2>
              <p className="text-gray-600">
                Sélectionnez le type d'autorisation d'exercice adapté à votre activité
              </p>
            </div>

            <div className="grid gap-6">
              {typesDisponibles.map((type) => (
                <div
                  key={type.type}
                  className={`
                    p-6 border-2 rounded-xl cursor-pointer transition-all duration-200
                    ${selectedType?.type === type.type
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                  `}
                  onClick={() => handleTypeSelection(type)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {type.libelle}
                        </h3>
                        {selectedType?.type === type.type && (
                          <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {type.description}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                          <span><strong>{formatMontant(type.montant)}</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <InformationCircleIcon className="w-4 h-4 text-gray-500" />
                          <span>{type.delaiTraitement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <UserIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Informations du demandeur
              </h2>
              <p className="text-gray-600">
                Renseignez vos informations personnelles
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nomDemandeur}
                  onChange={(e) => handleInputChange('nomDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Votre nom de famille"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.prenomDemandeur}
                  onChange={(e) => handleInputChange('prenomDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.emailDemandeur}
                  onChange={(e) => handleInputChange('emailDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="votre.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephoneDemandeur}
                  onChange={(e) => handleInputChange('telephoneDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="+223 XX XX XX XX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <textarea
                  value={formData.adresseDemandeur}
                  onChange={(e) => handleInputChange('adresseDemandeur', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Votre adresse complète"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <BuildingOfficeIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Informations de l'entreprise
              </h2>
              <p className="text-gray-600">
                Décrivez votre entreprise et votre activité
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nomEntreprise}
                  onChange={(e) => handleInputChange('nomEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sigle (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.sigleEntreprise}
                  onChange={(e) => handleInputChange('sigleEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Sigle de l'entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d'activité <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.secteurActivite}
                  onChange={(e) => handleInputChange('secteurActivite', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                >
                  <option value="">Sélectionnez un secteur</option>
                  {secteurs.map(secteur => (
                    <option key={secteur} value={secteur}>{secteur}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Région
                </label>
                <select
                  value={formData.regionEntreprise}
                  onChange={(e) => handleInputChange('regionEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                >
                  <option value="">Sélectionnez une région</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.villeEntreprise}
                  onChange={(e) => handleInputChange('villeEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Ville de l'entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de l'entreprise
                </label>
                <input
                  type="text"
                  value={formData.adresseEntreprise}
                  onChange={(e) => handleInputChange('adresseEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Adresse complète"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de l'activité <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.descriptionActivite}
                  onChange={(e) => handleInputChange('descriptionActivite', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="Décrivez en détail votre activité, vos services ou produits..."
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CloudArrowUpIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Documents d'Agrément
              </h2>
              <p className="text-gray-600">
                {selectedType?.type === 'AGREMENT' 
                  ? 'Téléchargez les documents requis pour votre demande d\'agrément'
                  : 'Cette étape est optionnelle pour votre type de demande'
                }
              </p>
            </div>

            {selectedType?.type === 'AGREMENT' && (
              <>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-orange-800">Documents Requis</h3>
                      <p className="text-orange-600 font-medium">
                        Sélectionnez votre type d'entité puis téléchargez les documents requis.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sélection du type d'entité */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
                    Type d'entité
                    <span className="text-red-500 ml-1">*</span>
                  </h4>
                  <p className="text-gray-600 mb-4 text-sm">
                    Choisissez le type d'entité correspondant à votre entreprise
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div
                      onClick={() => handleInputChange('typeEntite', 'PERSONNE_MORALE')}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.typeEntite === 'PERSONNE_MORALE'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${formData.typeEntite === 'PERSONNE_MORALE'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {formData.typeEntite === 'PERSONNE_MORALE' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Personne Morale</h5>
                          <p className="text-sm text-gray-600">Société, SARL, SA, etc.</p>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => handleInputChange('typeEntite', 'PERSONNE_PHYSIQUE')}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.typeEntite === 'PERSONNE_PHYSIQUE'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${formData.typeEntite === 'PERSONNE_PHYSIQUE'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {formData.typeEntite === 'PERSONNE_PHYSIQUE' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Personne Physique</h5>
                          <p className="text-sm text-gray-600">Entreprise individuelle</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents requis selon le type d'entité sélectionné */}
                {formData.typeEntite && (
                  <div className="space-y-6">
                    {/* Document commun obligatoire */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
                        Demande timbrée
                        <span className="text-red-500 ml-1">*</span>
                      </h4>
                      <p className="text-gray-600 mb-4 text-sm">
                        Demande officielle sur papier timbré (obligatoire pour tous)
                      </p>
                      
                      <DocumentUpload
                        onFileChange={(file) => handleDocumentUpload('demandeTimbre', file, file?.name)}
                        file={formData.documents.demandeTimbre || undefined}
                        label="Télécharger la demande timbrée"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        required={true}
                      />
                      
                      {formData.documents.demandeTimbreName && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">{formData.documents.demandeTimbreName}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documents pour personnes morales */}
                    {formData.typeEntite === 'PERSONNE_MORALE' && (
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                          <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
                          Documents pour Personne Morale
                        </h4>
                        <p className="text-blue-700 mb-4 text-sm">
                          Documents requis pour les sociétés (SARL, SA, etc.)
                        </p>
                        
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Statuts de la Société</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('statutsSociete', file, file?.name)}
                              file={formData.documents.statutsSociete || undefined}
                              label="Télécharger les statuts"
                              accept=".pdf,.doc,.docx"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Copies certifiées des diplômes des architectes</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('diplomesArchitectes', file, file?.name)}
                              file={formData.documents.diplomesArchitectes || undefined}
                              label="Télécharger les diplômes"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Attestation d'inscription à l'Ordre des Architectes</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('attestationOrdre', file, file?.name)}
                              file={formData.documents.attestationOrdre || undefined}
                              label="Télécharger l'attestation"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Documents pour personnes physiques */}
                    {formData.typeEntite === 'PERSONNE_PHYSIQUE' && (
                      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                        <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                          <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
                          Documents pour Personne Physique
                        </h4>
                        <p className="text-green-700 mb-4 text-sm">
                          Documents requis pour les entreprises individuelles
                        </p>
                        
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Acte de naissance</h5>
                            <p className="text-sm text-gray-600 mb-2">Datant de moins de trois mois</p>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('acteNaissance', file, file?.name)}
                              file={formData.documents.acteNaissance || undefined}
                              label="Télécharger l'acte de naissance"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Certificat de nationalité</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('certificatNationalite', file, file?.name)}
                              file={formData.documents.certificatNationalite || undefined}
                              label="Télécharger le certificat"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Casier judiciaire</h5>
                            <p className="text-sm text-gray-600 mb-2">Datant de moins de trois mois</p>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('casierJudiciaire', file, file?.name)}
                              file={formData.documents.casierJudiciaire || undefined}
                              label="Télécharger le casier judiciaire"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Curriculum vitae</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('curriculumVitae', file, file?.name)}
                              file={formData.documents.curriculumVitae || undefined}
                              label="Télécharger le CV"
                              accept=".pdf,.doc,.docx"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Copie du diplôme </h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('diplomeArchitecte', file, file?.name)}
                              file={formData.documents.diplomeArchitecte || undefined}
                              label="Télécharger le diplôme"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Attestation d'inscription à l'Ordre </h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('attestationOrdrePhysique', file, file?.name)}
                              file={formData.documents.attestationOrdrePhysique || undefined}
                              label="Télécharger l'attestation"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message si aucun type d'entité sélectionné */}
                {!formData.typeEntite && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez votre type d'entité</h3>
                    <p className="text-gray-600">
                      Choisissez d'abord si vous êtes une personne morale ou physique pour voir les documents requis.
                    </p>
                  </div>
                )}
              </>
            )}

            {selectedType?.type !== 'AGREMENT' && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document requis</h3>
                <p className="text-gray-600">
                  Votre type de demande ne nécessite pas de documents spécifiques à cette étape.
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CurrencyDollarIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Informations financières
              </h2>
              <p className="text-gray-600">
                Renseignez les informations financières (optionnel)
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capital social (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.capitalSocial || ''}
                  onChange={(e) => handleInputChange('capitalSocial', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chiffre d'affaires prévisionnel (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.chiffreAffairesPrevisionnel || ''}
                  onChange={(e) => handleInputChange('chiffreAffairesPrevisionnel', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'employés prévus
                </label>
                <input
                  type="number"
                  value={formData.nombreEmployesPrevus || ''}
                  onChange={(e) => handleInputChange('nombreEmployesPrevus', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Résumé de la demande */}
            <div className="mt-8 space-y-6">
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Résumé de votre demande
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type de demande:</span>
                    <span className="ml-2 font-medium">{selectedType?.libelle}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Montant:</span>
                    <span className="ml-2 font-medium">{selectedType ? formatMontant(selectedType.montant) : ''}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Demandeur:</span>
                    <span className="ml-2 font-medium">{formData.nomDemandeur} {formData.prenomDemandeur}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Entreprise:</span>
                    <span className="ml-2 font-medium">{formData.nomEntreprise}</span>
                  </div>
                  {formData.typeEntite && (
                    <div>
                      <span className="text-gray-600">Type d'entité:</span>
                      <span className="ml-2 font-medium">
                        {formData.typeEntite === 'PERSONNE_MORALE' ? 'Personne Morale' : 'Personne Physique'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Résumé des documents */}
              {selectedType?.type === 'AGREMENT' && formData.typeEntite && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Documents à soumettre
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Document commun */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-sm font-medium">Demande timbrée</span>
                      <div className="flex items-center space-x-2">
                        {formData.documents.demandeTimbre ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600">Téléchargé</span>
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-600">Requis</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Documents selon le type d'entité */}
                    {formData.typeEntite === 'PERSONNE_MORALE' && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm font-medium">Statuts de la Société</span>
                          <div className="flex items-center space-x-2">
                            {formData.documents.statutsSociete ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Téléchargé</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">Optionnel</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm font-medium">Diplômes des architectes</span>
                          <div className="flex items-center space-x-2">
                            {formData.documents.diplomesArchitectes ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Téléchargé</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">Optionnel</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm font-medium">Attestation Ordre des Architectes</span>
                          <div className="flex items-center space-x-2">
                            {formData.documents.attestationOrdre ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Téléchargé</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">Optionnel</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {formData.typeEntite === 'PERSONNE_PHYSIQUE' && (
                      <>
                        {[
                          { key: 'acteNaissance', label: 'Acte de naissance' },
                          { key: 'certificatNationalite', label: 'Certificat de nationalité' },
                          { key: 'casierJudiciaire', label: 'Casier judiciaire' },
                          { key: 'curriculumVitae', label: 'Curriculum vitae' },
                          { key: 'diplomeArchitecte', label: 'Diplôme d\'Architecte' },
                          { key: 'attestationOrdrePhysique', label: 'Attestation Ordre des Architectes' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <span className="text-sm font-medium">{label}</span>
                            <div className="flex items-center space-x-2">
                              {formData.documents[key as keyof typeof formData.documents] ? (
                                <>
                                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600">Téléchargé</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">Optionnel</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Information importante</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Votre demande et tous les documents seront transmis aux agents concernés pour traitement. 
                          Vous recevrez une confirmation par email une fois la demande soumise.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Demande créée avec succès !
            </h2>
            {success && (
              <p className="text-green-600 text-lg">{success}</p>
            )}
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Vous recevrez un email de confirmation</li>
                <li>• Préparez les documents requis</li>
                <li>• Suivez l'avancement de votre demande</li>
                {selectedType?.type === 'AGREMENT' && (
                  <li>• Un paiement sera requis lors du traitement</li>
                )}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Progress bar */}
        {currentStep < 6 && (
          <div className="bg-gray-50 px-8 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Étape {currentStep} sur 5</span>
              <span>{Math.round((currentStep / 5) * 100)}% complété</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {renderStepContent()}

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="font-medium">Erreur</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Navigation */}
          {currentStep < 6 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                )}
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Précédent</span>
                  </button>
                )}
              </div>

              <div>
                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className={`
                      flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all
                      ${validateStep(currentStep)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    <span>Suivant</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`
                      flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all
                      ${loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Soumettre aux agents</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandeAutorisationForm;
=======
import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import DocumentUpload from './DocumentUpload';
import { buildApiUrl } from '../config/api.config';

interface TypeDemandeInfo {
  type: string;
  libelle: string;
  montant: number;
  description: string;
  delaiTraitement: string;
  documentsRequis: string[];
}

interface DemandeData {
  // Type de demande
  typeDemande: string;
  
  // Informations du demandeur
  nomDemandeur: string;
  prenomDemandeur: string;
  emailDemandeur: string;
  telephoneDemandeur: string;
  adresseDemandeur: string;
  
  // Informations de l'entreprise/activité
  nomEntreprise: string;
  sigleEntreprise: string;
  secteurActivite: string;
  descriptionActivite: string;
  adresseEntreprise: string;
  villeEntreprise: string;
  regionEntreprise: string;
  
  // Type d'entité pour les documents
  typeEntite?: 'PERSONNE_MORALE' | 'PERSONNE_PHYSIQUE';
  
  // Documents d'agrément
  documents: {
    // Documents communs
    demandeTimbre?: File | null;
    demandeTimbreName?: string;
    
    // Pour personnes morales
    statutsSociete?: File | null;
    statutsSocieteName?: string;
    diplomesArchitectes?: File | null;
    diplomesArchitectesName?: string;
    attestationOrdre?: File | null;
    attestationOrdreName?: string;
    
    // Pour personnes physiques
    acteNaissance?: File | null;
    acteNaissanceName?: string;
    certificatNationalite?: File | null;
    certificatNationaliteName?: string;
    casierJudiciaire?: File | null;
    casierJudiciaireName?: string;
    curriculumVitae?: File | null;
    curriculumVitaeName?: string;
    diplomeArchitecte?: File | null;
    diplomeArchitecteName?: string;
    attestationOrdrePhysique?: File | null;
    attestationOrdrePhysiqueName?: string;
  };
  
  // Informations financières
  capitalSocial: number;
  chiffreAffairesPrevisionnel: number;
  nombreEmployesPrevus: number;
}

interface DemandeAutorisationFormProps {
  onSubmit?: (demande: DemandeData) => void;
  onCancel?: () => void;
}

const DemandeAutorisationForm: React.FC<DemandeAutorisationFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<TypeDemandeInfo | null>(null);
  const [formData, setFormData] = useState<DemandeData>({
    typeDemande: '',
    nomDemandeur: '',
    prenomDemandeur: '',
    emailDemandeur: '',
    telephoneDemandeur: '',
    adresseDemandeur: '',
    nomEntreprise: '',
    sigleEntreprise: '',
    secteurActivite: '',
    descriptionActivite: '',
    adresseEntreprise: '',
    villeEntreprise: '',
    regionEntreprise: '',
    typeEntite: undefined,
    documents: {},
    capitalSocial: 0,
    chiffreAffairesPrevisionnel: 0,
    nombreEmployesPrevus: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const typesDisponibles: TypeDemandeInfo[] = [
    {
      type: 'AGREMENT',
      libelle: 'Demande d\'Agrément',
      montant: 300000,
      description: 'Procédure complète avec validation présidentielle pour les activités nécessitant un agrément officiel',
      delaiTraitement: '60-90 jours ouvrables',
      documentsRequis: [
        'Certificat d\'incorporation',
        'Statuts de l\'entreprise',
        'CV du dirigeant',
        'Justificatif de domicile',
        'Attestation bancaire',
        'Plan d\'affaires'
      ]
    },
    {
      type: 'DECISION',
      libelle: 'Demande de Décision',
      montant: 150000,
      description: 'Procédure intermédiaire via MIC et SGG pour les activités réglementées',
      delaiTraitement: '30-45 jours ouvrables',
      documentsRequis: [
        'Certificat d\'incorporation',
        'Statuts de l\'entreprise',
        'CV du dirigeant',
        'Justificatif de domicile'
      ]
    },
    {
      type: 'ENREGISTREMENT',
      libelle: 'Enregistrement Simple',
      montant: 50000,
      description: 'Procédure simplifiée pour les activités ne nécessitant qu\'un enregistrement',
      delaiTraitement: '5-10 jours ouvrables',
      documentsRequis: [
        'Certificat d\'incorporation',
        'CV du dirigeant'
      ]
    }
  ];

  const secteurs = [
    // SECTION A - AGRICULTURE, SYLVICULTURE ET PÊCHE
    'Culture de céréales (sauf riz), de légumineuses et de graines oléagineuses',
    'Culture du riz',
    'Culture de légumes et de melons, racines et tubercules',
    'Culture de la canne à sucre',
    'Culture du tabac',
    'Culture de plantes à fibres',
    'Culture d\'autres plantes non permanentes',
    'Culture de raisins',
    'Culture de fruits tropicaux et subtropicaux',
    'Culture d\'agrumes',
    'Culture de fruits à pépins et à noyau',
    'Culture d\'autres fruits d\'arbres ou d\'arbustes et de fruits à coque',
    'Culture d\'oléagineux',
    'Culture de plantes à boissons',
    'Culture de plantes à épices, aromatiques, médicinales et pharmaceutiques',
    'Culture d\'autres plantes permanentes',
    'Reproduction de plantes',
    'Élevage de bovins laitiers',
    'Élevage d\'autres bovins et de buffles',
    'Élevage de chevaux et d\'autres équidés',
    'Élevage de chameaux et d\'autres camélidés',
    'Élevage de porcins',
    'Élevage de volailles',
    'Élevage d\'autres animaux',
    'Culture et élevage associés',
    'Activités de soutien aux cultures',
    'Activités de soutien à la production animale',
    'Chasse, piégeage et services annexes',
    'Sylviculture et autres activités forestières',
    'Exploitation forestière',
    'Récolte de produits forestiers non ligneux poussant à l\'état sauvage',
    'Services de soutien à l\'exploitation forestière',
    'Pêche en mer',
    'Pêche en eau douce',
    'Aquaculture en mer',
    'Aquaculture en eau douce',

    // SECTION B - ACTIVITÉS EXTRACTIVES
    'Extraction de houille',
    'Extraction de lignite',
    'Extraction de pétrole brut',
    'Extraction de gaz naturel',
    'Extraction de minerais de fer',
    'Extraction de minerais de métaux non ferreux',
    'Extraction de pierres ornementales et de construction, de calcaire industriel, de gypse, de craie et d\'ardoise',
    'Exploitation de gravières et sablières, extraction d\'argiles et de kaolin',
    'Activités extractives n.c.a.',
    'Activités de soutien à l\'extraction d\'hydrocarbures',
    'Activités de soutien à d\'autres activités extractives',

    // SECTION C - ACTIVITÉS DE FABRICATION
    'Transformation et conservation de la viande',
    'Transformation et conservation de poissons, de crustacés et de mollusques',
    'Transformation et conservation de fruits et légumes',
    'Fabrication d\'huiles et graisses végétales et animales',
    'Fabrication de produits laitiers',
    'Travail des grains ; fabrication de produits amylacés',
    'Fabrication de produits de boulangerie-pâtisserie et de pâtes alimentaires',
    'Fabrication d\'autres produits alimentaires',
    'Fabrication d\'aliments pour animaux',
    'Fabrication de boissons',
    'Fabrication de produits à base de tabac',
    'Préparation de fibres textiles et filature',
    'Tissage',
    'Ennoblissement textile',
    'Fabrication d\'autres articles textiles',
    'Fabrication d\'étoffes à mailles',
    'Fabrication d\'articles d\'habillement, à l\'exception des vêtements en fourrure',
    'Fabrication d\'articles en fourrure',
    'Fabrication d\'articles chaussants',
    'Sciage et rabotage du bois',
    'Fabrication d\'articles en bois, liège, vannerie et sparterie',
    'Fabrication de papier et de produits en papier',
    'Imprimerie et reproduction d\'enregistrements',
    'Cokéfaction',
    'Fabrication de produits de raffinage pétrolier',
    'Fabrication de produits chimiques de base, de produits azotés et d\'engrais, de matières plastiques de base et de caoutchouc synthétique',
    'Fabrication d\'autres produits chimiques',
    'Fabrication de fibres artificielles ou synthétiques',
    'Fabrication de produits pharmaceutiques, de produits chimiques à usage médicinal et de produits d\'herboristerie',
    'Fabrication de produits en caoutchouc',
    'Fabrication de produits en matières plastiques',
    'Fabrication de verre et d\'articles en verre',
    'Fabrication de produits réfractaires',
    'Fabrication de matériaux de construction en terre cuite',
    'Fabrication d\'autres produits en porcelaine et en céramique',
    'Fabrication de ciment, chaux et plâtre',
    'Fabrication d\'ouvrages en béton, en ciment et en plâtre',
    'Taille, façonnage et finissage de pierres',
    'Fabrication d\'autres produits minéraux non métalliques',
    'Sidérurgie',
    'Fabrication de tubes, tuyaux, profilés creux et accessoires correspondants en acier',
    'Fabrication d\'autres produits de première transformation de l\'acier',
    'Production de métaux précieux',
    'Métallurgie de l\'aluminium',
    'Métallurgie du plomb, du zinc et de l\'étain',
    'Métallurgie d\'autres métaux non ferreux',
    'Fonderie',
    'Fabrication d\'éléments en métal pour la construction',
    'Fabrication d\'ouvrages de chaudronnerie',
    'Fabrication d\'armes et de munitions',
    'Forge, emboutissage, estampage ; métallurgie des poudres',
    'Traitement et revêtement des métaux ; usinage',
    'Fabrication de coutellerie, d\'outillage et de quincaillerie',
    'Fabrication d\'autres ouvrages en métaux',
    'Fabrication de composants et cartes électroniques',
    'Fabrication d\'ordinateurs et d\'équipements périphériques',
    'Fabrication d\'équipements de communication',
    'Fabrication de produits électroniques grand public',
    'Fabrication d\'instruments et fournitures à usage médical et dentaire',
    'Fabrication d\'instruments de mesure, d\'essai et de navigation ; horlogerie',
    'Fabrication d\'équipements d\'irradiation médicale, d\'équipements électromédicaux et électrothérapeutiques',
    'Fabrication d\'instruments d\'optique et d\'équipements photographiques',
    'Fabrication de supports magnétiques et optiques',
    'Fabrication de moteurs, génératrices et transformateurs électriques',
    'Fabrication de matériel de distribution et de commande électrique',
    'Fabrication de fils et câbles et de dispositifs de câblage',
    'Fabrication de piles et d\'accumulateurs électriques',
    'Fabrication d\'appareils d\'éclairage électrique',
    'Fabrication d\'appareils ménagers',
    'Fabrication d\'autres matériels électriques',
    'Fabrication de machines d\'usage général',
    'Fabrication d\'autres machines d\'usage spécifique',
    'Fabrication de véhicules automobiles',
    'Fabrication de carrosseries et remorques',
    'Fabrication d\'équipements automobiles',
    'Construction navale',
    'Construction de locomotives et d\'autre matériel ferroviaire roulant',
    'Construction aéronautique et spatiale',
    'Fabrication de matériels de transport n.c.a.',
    'Fabrication de meubles',
    'Fabrication d\'articles de bijouterie, joaillerie et articles similaires',
    'Fabrication d\'instruments de musique',
    'Fabrication d\'articles de sport',
    'Fabrication de jeux et jouets',
    'Fabrication de dispositifs médicaux et dentaires',
    'Autres activités de fabrication',
    'Réparation et installation de machines et d\'équipements',

    // SECTION D - PRODUCTION ET DISTRIBUTION D\'ÉLECTRICITÉ, DE GAZ, DE VAPEUR ET D\'AIR CONDITIONNÉ
    'Production, transport et distribution d\'électricité',
    'Production et distribution de combustibles gazeux',
    'Production et distribution de vapeur et d\'air conditionné',

    // SECTION E - PRODUCTION ET DISTRIBUTION D\'EAU ; ASSAINISSEMENT, GESTION DES DÉCHETS ET DÉPOLLUTION
    'Captage, traitement et distribution d\'eau',
    'Collecte et traitement des eaux usées',
    'Collecte des déchets',
    'Traitement et élimination des déchets',
    'Récupération',
    'Dépollution et autres services de gestion des déchets',

    // SECTION F - CONSTRUCTION
    'Promotion immobilière',
    'Construction de bâtiments résidentiels et non résidentiels',
    'Génie civil',
    'Travaux de construction spécialisés',

    // SECTION G - COMMERCE ; RÉPARATION D\'AUTOMOBILES ET DE MOTOCYCLES
    'Commerce de véhicules automobiles',
    'Entretien et réparation de véhicules automobiles',
    'Commerce d\'équipements automobiles',
    'Commerce et réparation de motocycles',
    'Commerce de gros, à l\'exception des véhicules automobiles et des motocycles',
    'Commerce de détail, à l\'exception des véhicules automobiles et des motocycles',

    // SECTION H - TRANSPORTS ET ENTREPOSAGE
    'Transport ferroviaire interurbain de voyageurs',
    'Transport ferroviaire de fret',
    'Transports urbains et suburbains de voyageurs',
    'Transport de voyageurs par taxis',
    'Autres transports terrestres de voyageurs',
    'Transport routier de fret',
    'Transport par conduites',
    'Transports maritimes et côtiers de voyageurs',
    'Transports maritimes et côtiers de fret',
    'Transports par voies d\'eau intérieures',
    'Transport aérien de voyageurs',
    'Transport aérien de fret',
    'Entreposage et services auxiliaires des transports',
    'Activités de poste et de courrier',

    // SECTION I - HÉBERGEMENT ET RESTAURATION
    'Hébergement',
    'Restauration',

    // SECTION J - INFORMATION ET COMMUNICATION
    'Édition',
    'Production de films cinématographiques, de vidéo et de programmes de télévision ; enregistrement sonore et édition musicale',
    'Programmation et diffusion',
    'Télécommunications',
    'Programmation, conseil et autres activités informatiques',
    'Services d\'information',

    // SECTION K - ACTIVITÉS FINANCIÈRES ET D\'ASSURANCE
    'Activités des services financiers, hors assurance et caisses de retraite',
    'Assurance',
    'Activités auxiliaires de services financiers et d\'assurance',

    // SECTION L - ACTIVITÉS IMMOBILIÈRES
    'Activités immobilières',

    // SECTION M - ACTIVITÉS SPÉCIALISÉES, SCIENTIFIQUES ET TECHNIQUES
    'Activités juridiques et comptables',
    'Activités de sièges sociaux ; conseil de gestion',
    'Activités d\'architecture et d\'ingénierie ; activités de contrôle et analyses techniques',
    'Recherche-développement scientifique',
    'Publicité et études de marché',
    'Autres activités spécialisées, scientifiques et techniques',
    'Activités vétérinaires',

    // SECTION N - ACTIVITÉS DE SERVICES ADMINISTRATIFS ET DE SOUTIEN
    'Activités de location et location-bail',
    'Activités liées à l\'emploi',
    'Activités des agences de voyage, voyagistes, services de réservation et activités connexes',
    'Enquêtes et sécurité',
    'Services relatifs aux bâtiments et aménagement paysager',
    'Activités administratives et autres activités de soutien aux entreprises',

    // SECTION O - ADMINISTRATION PUBLIQUE ET DÉFENSE ; SÉCURITÉ SOCIALE OBLIGATOIRE
    'Administration publique et défense ; sécurité sociale obligatoire',

    // SECTION P - ENSEIGNEMENT
    'Enseignement',

    // SECTION Q - SANTÉ HUMAINE ET ACTION SOCIALE
    'Activités pour la santé humaine',
    'Hébergement médico-social et social',
    'Action sociale sans hébergement',

    // SECTION R - ARTS, SPECTACLES ET ACTIVITÉS RÉCRÉATIVES
    'Activités créatives, artistiques et de spectacle',
    'Fonctionnement de bibliothèques, archives, musées et autres activités culturelles',
    'Organisation de jeux de hasard et d\'argent',
    'Activités sportives, récréatives et de loisirs',

    // SECTION S - AUTRES ACTIVITÉS DE SERVICES
    'Activités des organisations associatives',
    'Réparation d\'ordinateurs et de biens personnels et domestiques',
    'Autres services personnels',

    // SECTION T - ACTIVITÉS DES MÉNAGES EN TANT QU\'EMPLOYEURS ; ACTIVITÉS INDIFFÉRENCIÉES DES MÉNAGES EN TANT QUE PRODUCTEURS DE BIENS ET SERVICES POUR USAGE PROPRE
    'Activités des ménages en tant qu\'employeurs de personnel domestique',
    'Activités indifférenciées des ménages en tant que producteurs de biens et services pour usage propre',

    // SECTION U - ACTIVITÉS DES ORGANISATIONS ET ORGANISMES EXTRATERRITORIAUX
    'Activités des organisations et organismes extraterritoriaux'
  ];

  const regions = [
    'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 
    'Tombouctou', 'Gao', 'Kidal', 'Taoudéni', 'Ménaka', 'Bamako'
  ];

  const handleInputChange = (field: keyof DemandeData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleDocumentUpload = (field: string, file: File | null | undefined, fileName?: string) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file || null,
        ...(fileName && { [`${field}Name`]: fileName })
      }
    }));
    setError(null);
  };

  const handleTypeSelection = (type: TypeDemandeInfo) => {
    setSelectedType(type);
    setFormData(prev => ({
      ...prev,
      typeDemande: type.type
    }));
    setError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!selectedType;
      case 2:
        return !!(formData.nomDemandeur && formData.prenomDemandeur && formData.emailDemandeur);
      case 3:
        return !!(formData.nomEntreprise && formData.secteurActivite && formData.descriptionActivite);
      case 4:
        // Validation des documents requis pour l'agrément
        if (selectedType?.type === 'AGREMENT') {
          // Vérifier que le type d'entité est sélectionné et la demande timbrée uploadée
          return !!(formData.typeEntite && formData.documents.demandeTimbre);
        }
        return true; // Pas de documents requis pour les autres types
      case 5:
        return true; // Étape optionnelle
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      setError('Veuillez remplir tous les champs obligatoires');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      setError('Veuillez vérifier toutes les informations');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Créer une nouvelle demande d'agrément indépendante (pas liée aux entreprises existantes)
      const { documents, ...formDataWithoutDocuments } = formData;
      
      const nouvelleDemandeData = {
        // Informations de base de la demande
        typeDemande: selectedType?.type || 'AGREMENT',
        statut: 'EN_ATTENTE',
        dateCreation: new Date().toISOString(),
        
        // Informations du demandeur
        demandeur: {
          nom: formData.nomDemandeur,
          prenom: formData.prenomDemandeur,
          email: formData.emailDemandeur,
          telephone: formData.telephoneDemandeur,
          adresse: formData.adresseDemandeur
        },
        
        // Informations de l'entreprise/projet
        entreprise: {
          nom: formData.nomEntreprise,
          sigle: formData.sigleEntreprise,
          secteurActivite: formData.secteurActivite,
          descriptionActivite: formData.descriptionActivite,
          adresse: formData.adresseEntreprise,
          ville: formData.villeEntreprise,
          region: formData.regionEntreprise,
          typeEntite: formData.typeEntite
        },
        
        // Informations financières (optionnelles)
        informationsFinancieres: {
          capitalSocial: formData.capitalSocial || 0,
          chiffreAffairesPrevisionnel: formData.chiffreAffairesPrevisionnel || 0,
          nombreEmployesPrevus: formData.nombreEmployesPrevus || 0
        },
        
        // Documents uploadés
        documentsJoints: selectedType?.type === 'AGREMENT' ? {
          demandeTimbre: {
            nom: documents.demandeTimbreName || null,
            uploaded: !!documents.demandeTimbre,
            obligatoire: true
          },
          ...(formData.typeEntite === 'PERSONNE_MORALE' && {
            statutsSociete: {
              nom: documents.statutsSocieteName || null,
              uploaded: !!documents.statutsSociete,
              obligatoire: false
            },
            diplomesArchitectes: {
              nom: documents.diplomesArchitectesName || null,
              uploaded: !!documents.diplomesArchitectes,
              obligatoire: false
            },
            attestationOrdre: {
              nom: documents.attestationOrdreName || null,
              uploaded: !!documents.attestationOrdre,
              obligatoire: false
            }
          }),
          ...(formData.typeEntite === 'PERSONNE_PHYSIQUE' && {
            acteNaissance: {
              nom: documents.acteNaissanceName || null,
              uploaded: !!documents.acteNaissance,
              obligatoire: false
            },
            certificatNationalite: {
              nom: documents.certificatNationaliteName || null,
              uploaded: !!documents.certificatNationalite,
              obligatoire: false
            },
            casierJudiciaire: {
              nom: documents.casierJudiciaireName || null,
              uploaded: !!documents.casierJudiciaire,
              obligatoire: false
            },
            curriculumVitae: {
              nom: documents.curriculumVitaeName || null,
              uploaded: !!documents.curriculumVitae,
              obligatoire: false
            },
            diplomeArchitecte: {
              nom: documents.diplomeArchitecteName || null,
              uploaded: !!documents.diplomeArchitecte,
              obligatoire: false
            },
            attestationOrdrePhysique: {
              nom: documents.attestationOrdrePhysiqueName || null,
              uploaded: !!documents.attestationOrdrePhysique,
              obligatoire: false
            }
          })
        } : {}
      };

      // Format pour le nouvel endpoint de demandes indépendantes
      const demandeEntity = {
        demandeDetails: {
          typeDemande: selectedType?.type || 'AGREMENT',
          
          // Informations du demandeur
          nomDemandeur: formData.nomDemandeur,
          prenomDemandeur: formData.prenomDemandeur,
          emailDemandeur: formData.emailDemandeur,
          telephoneDemandeur: formData.telephoneDemandeur,
          adresseDemandeur: formData.adresseDemandeur,
          
          // Informations de l'entreprise
          nomEntreprise: formData.nomEntreprise,
          sigleEntreprise: formData.sigleEntreprise,
          secteurActivite: formData.secteurActivite,
          descriptionActivite: formData.descriptionActivite,
          adresseEntreprise: formData.adresseEntreprise,
          villeEntreprise: formData.villeEntreprise,
          regionEntreprise: formData.regionEntreprise,
          
          // Informations financières
          capitalSocial: formData.capitalSocial || 0,
          chiffreAffairesPrevisionnel: formData.chiffreAffairesPrevisionnel || 0,
          nombreEmployesPrevus: formData.nombreEmployesPrevus || 0,
          
          // Documents fournis
          documentsJoints: nouvelleDemandeData.documentsJoints,
          typeEntite: formData.typeEntite
        }
      };

      console.log('📋 Envoi de la nouvelle demande indépendante:', demandeEntity);

      // Utiliser le nouvel endpoint pour les demandes indépendantes
      const apiUrl = buildApiUrl('autorisation-exercice/nouvelle-demande');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demandeEntity)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la demande');
      }

      const result = await response.json();
      setSuccess(`Demande d'agrément créée avec succès ! Numéro de demande: ${result.numeroDemande || result.id}`);
      setCurrentStep(6);

      if (onSubmit) {
        onSubmit(formData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choisissez le type de demande
              </h2>
              <p className="text-gray-600">
                Sélectionnez le type d'autorisation d'exercice adapté à votre activité
              </p>
            </div>

            <div className="grid gap-6">
              {typesDisponibles.map((type) => (
                <div
                  key={type.type}
                  className={`
                    p-6 border-2 rounded-xl cursor-pointer transition-all duration-200
                    ${selectedType?.type === type.type
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                  `}
                  onClick={() => handleTypeSelection(type)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {type.libelle}
                        </h3>
                        {selectedType?.type === type.type && (
                          <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {type.description}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
                          <span><strong>{formatMontant(type.montant)}</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <InformationCircleIcon className="w-4 h-4 text-gray-500" />
                          <span>{type.delaiTraitement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <UserIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Informations du demandeur
              </h2>
              <p className="text-gray-600">
                Renseignez vos informations personnelles
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nomDemandeur}
                  onChange={(e) => handleInputChange('nomDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom de famille"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.prenomDemandeur}
                  onChange={(e) => handleInputChange('prenomDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.emailDemandeur}
                  onChange={(e) => handleInputChange('emailDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephoneDemandeur}
                  onChange={(e) => handleInputChange('telephoneDemandeur', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+223 XX XX XX XX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <textarea
                  value={formData.adresseDemandeur}
                  onChange={(e) => handleInputChange('adresseDemandeur', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre adresse complète"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <BuildingOfficeIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Informations de l'entreprise
              </h2>
              <p className="text-gray-600">
                Décrivez votre entreprise et votre activité
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nomEntreprise}
                  onChange={(e) => handleInputChange('nomEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sigle (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.sigleEntreprise}
                  onChange={(e) => handleInputChange('sigleEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sigle de l'entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d'activité <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.secteurActivite}
                  onChange={(e) => handleInputChange('secteurActivite', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un secteur</option>
                  {secteurs.map(secteur => (
                    <option key={secteur} value={secteur}>{secteur}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Région
                </label>
                <select
                  value={formData.regionEntreprise}
                  onChange={(e) => handleInputChange('regionEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez une région</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.villeEntreprise}
                  onChange={(e) => handleInputChange('villeEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ville de l'entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de l'entreprise
                </label>
                <input
                  type="text"
                  value={formData.adresseEntreprise}
                  onChange={(e) => handleInputChange('adresseEntreprise', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adresse complète"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de l'activité <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.descriptionActivite}
                  onChange={(e) => handleInputChange('descriptionActivite', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez en détail votre activité, vos services ou produits..."
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CloudArrowUpIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Documents d'Agrément
              </h2>
              <p className="text-gray-600">
                {selectedType?.type === 'AGREMENT' 
                  ? 'Téléchargez les documents requis pour votre demande d\'agrément'
                  : 'Cette étape est optionnelle pour votre type de demande'
                }
              </p>
            </div>

            {selectedType?.type === 'AGREMENT' && (
              <>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-orange-800">Documents Requis</h3>
                      <p className="text-orange-600 font-medium">
                        Sélectionnez votre type d'entité puis téléchargez les documents requis.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sélection du type d'entité */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
                    Type d'entité
                    <span className="text-red-500 ml-1">*</span>
                  </h4>
                  <p className="text-gray-600 mb-4 text-sm">
                    Choisissez le type d'entité correspondant à votre entreprise
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div
                      onClick={() => handleInputChange('typeEntite', 'PERSONNE_MORALE')}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.typeEntite === 'PERSONNE_MORALE'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${formData.typeEntite === 'PERSONNE_MORALE'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {formData.typeEntite === 'PERSONNE_MORALE' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Personne Morale</h5>
                          <p className="text-sm text-gray-600">Société, SARL, SA, etc.</p>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => handleInputChange('typeEntite', 'PERSONNE_PHYSIQUE')}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.typeEntite === 'PERSONNE_PHYSIQUE'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${formData.typeEntite === 'PERSONNE_PHYSIQUE'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {formData.typeEntite === 'PERSONNE_PHYSIQUE' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Personne Physique</h5>
                          <p className="text-sm text-gray-600">Entreprise individuelle</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents requis selon le type d'entité sélectionné */}
                {formData.typeEntite && (
                  <div className="space-y-6">
                    {/* Document commun obligatoire */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
                        Demande timbrée
                        <span className="text-red-500 ml-1">*</span>
                      </h4>
                      <p className="text-gray-600 mb-4 text-sm">
                        Demande officielle sur papier timbré (obligatoire pour tous)
                      </p>
                      
                      <DocumentUpload
                        onFileChange={(file) => handleDocumentUpload('demandeTimbre', file, file?.name)}
                        file={formData.documents.demandeTimbre || undefined}
                        label="Télécharger la demande timbrée"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        required={true}
                      />
                      
                      {formData.documents.demandeTimbreName && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">{formData.documents.demandeTimbreName}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documents pour personnes morales */}
                    {formData.typeEntite === 'PERSONNE_MORALE' && (
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                          <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
                          Documents pour Personne Morale
                        </h4>
                        <p className="text-blue-700 mb-4 text-sm">
                          Documents requis pour les sociétés (SARL, SA, etc.)
                        </p>
                        
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Statuts de la Société</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('statutsSociete', file, file?.name)}
                              file={formData.documents.statutsSociete || undefined}
                              label="Télécharger les statuts"
                              accept=".pdf,.doc,.docx"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Copies certifiées des diplômes des architectes</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('diplomesArchitectes', file, file?.name)}
                              file={formData.documents.diplomesArchitectes || undefined}
                              label="Télécharger les diplômes"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Attestation d'inscription à l'Ordre des Architectes</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('attestationOrdre', file, file?.name)}
                              file={formData.documents.attestationOrdre || undefined}
                              label="Télécharger l'attestation"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Documents pour personnes physiques */}
                    {formData.typeEntite === 'PERSONNE_PHYSIQUE' && (
                      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                        <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                          <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
                          Documents pour Personne Physique
                        </h4>
                        <p className="text-green-700 mb-4 text-sm">
                          Documents requis pour les entreprises individuelles
                        </p>
                        
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Acte de naissance</h5>
                            <p className="text-sm text-gray-600 mb-2">Datant de moins de trois mois</p>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('acteNaissance', file, file?.name)}
                              file={formData.documents.acteNaissance || undefined}
                              label="Télécharger l'acte de naissance"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Certificat de nationalité</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('certificatNationalite', file, file?.name)}
                              file={formData.documents.certificatNationalite || undefined}
                              label="Télécharger le certificat"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Casier judiciaire</h5>
                            <p className="text-sm text-gray-600 mb-2">Datant de moins de trois mois</p>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('casierJudiciaire', file, file?.name)}
                              file={formData.documents.casierJudiciaire || undefined}
                              label="Télécharger le casier judiciaire"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Curriculum vitae</h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('curriculumVitae', file, file?.name)}
                              file={formData.documents.curriculumVitae || undefined}
                              label="Télécharger le CV"
                              accept=".pdf,.doc,.docx"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Copie du diplôme </h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('diplomeArchitecte', file, file?.name)}
                              file={formData.documents.diplomeArchitecte || undefined}
                              label="Télécharger le diplôme"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium mb-2">Attestation d'inscription à l'Ordre </h5>
                            <DocumentUpload
                              onFileChange={(file) => handleDocumentUpload('attestationOrdrePhysique', file, file?.name)}
                              file={formData.documents.attestationOrdrePhysique || undefined}
                              label="Télécharger l'attestation"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message si aucun type d'entité sélectionné */}
                {!formData.typeEntite && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez votre type d'entité</h3>
                    <p className="text-gray-600">
                      Choisissez d'abord si vous êtes une personne morale ou physique pour voir les documents requis.
                    </p>
                  </div>
                )}
              </>
            )}

            {selectedType?.type !== 'AGREMENT' && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document requis</h3>
                <p className="text-gray-600">
                  Votre type de demande ne nécessite pas de documents spécifiques à cette étape.
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CurrencyDollarIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Informations financières
              </h2>
              <p className="text-gray-600">
                Renseignez les informations financières (optionnel)
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capital social (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.capitalSocial || ''}
                  onChange={(e) => handleInputChange('capitalSocial', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chiffre d'affaires prévisionnel (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.chiffreAffairesPrevisionnel || ''}
                  onChange={(e) => handleInputChange('chiffreAffairesPrevisionnel', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'employés prévus
                </label>
                <input
                  type="number"
                  value={formData.nombreEmployesPrevus || ''}
                  onChange={(e) => handleInputChange('nombreEmployesPrevus', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Résumé de la demande */}
            <div className="mt-8 space-y-6">
              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Résumé de votre demande
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type de demande:</span>
                    <span className="ml-2 font-medium">{selectedType?.libelle}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Montant:</span>
                    <span className="ml-2 font-medium">{selectedType ? formatMontant(selectedType.montant) : ''}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Demandeur:</span>
                    <span className="ml-2 font-medium">{formData.nomDemandeur} {formData.prenomDemandeur}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Entreprise:</span>
                    <span className="ml-2 font-medium">{formData.nomEntreprise}</span>
                  </div>
                  {formData.typeEntite && (
                    <div>
                      <span className="text-gray-600">Type d'entité:</span>
                      <span className="ml-2 font-medium">
                        {formData.typeEntite === 'PERSONNE_MORALE' ? 'Personne Morale' : 'Personne Physique'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Résumé des documents */}
              {selectedType?.type === 'AGREMENT' && formData.typeEntite && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Documents à soumettre
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Document commun */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="text-sm font-medium">Demande timbrée</span>
                      <div className="flex items-center space-x-2">
                        {formData.documents.demandeTimbre ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600">Téléchargé</span>
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-600">Requis</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Documents selon le type d'entité */}
                    {formData.typeEntite === 'PERSONNE_MORALE' && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm font-medium">Statuts de la Société</span>
                          <div className="flex items-center space-x-2">
                            {formData.documents.statutsSociete ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Téléchargé</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">Optionnel</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm font-medium">Diplômes des architectes</span>
                          <div className="flex items-center space-x-2">
                            {formData.documents.diplomesArchitectes ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Téléchargé</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">Optionnel</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="text-sm font-medium">Attestation Ordre des Architectes</span>
                          <div className="flex items-center space-x-2">
                            {formData.documents.attestationOrdre ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">Téléchargé</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">Optionnel</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {formData.typeEntite === 'PERSONNE_PHYSIQUE' && (
                      <>
                        {[
                          { key: 'acteNaissance', label: 'Acte de naissance' },
                          { key: 'certificatNationalite', label: 'Certificat de nationalité' },
                          { key: 'casierJudiciaire', label: 'Casier judiciaire' },
                          { key: 'curriculumVitae', label: 'Curriculum vitae' },
                          { key: 'diplomeArchitecte', label: 'Diplôme d\'Architecte' },
                          { key: 'attestationOrdrePhysique', label: 'Attestation Ordre des Architectes' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <span className="text-sm font-medium">{label}</span>
                            <div className="flex items-center space-x-2">
                              {formData.documents[key as keyof typeof formData.documents] ? (
                                <>
                                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600">Téléchargé</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">Optionnel</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Information importante</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Votre demande et tous les documents seront transmis aux agents concernés pour traitement. 
                          Vous recevrez une confirmation par email une fois la demande soumise.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Demande créée avec succès !
            </h2>
            {success && (
              <p className="text-green-600 text-lg">{success}</p>
            )}
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Vous recevrez un email de confirmation</li>
                <li>• Préparez les documents requis</li>
                <li>• Suivez l'avancement de votre demande</li>
                {selectedType?.type === 'AGREMENT' && (
                  <li>• Un paiement sera requis lors du traitement</li>
                )}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Progress bar */}
        {currentStep < 6 && (
          <div className="bg-gray-50 px-8 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Étape {currentStep} sur 5</span>
              <span>{Math.round((currentStep / 5) * 100)}% complété</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {renderStepContent()}

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-600">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="font-medium">Erreur</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Navigation */}
          {currentStep < 6 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                )}
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Précédent</span>
                  </button>
                )}
              </div>

              <div>
                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className={`
                      flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all
                      ${validateStep(currentStep)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    <span>Suivant</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`
                      flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all
                      ${loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Soumettre aux agents</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandeAutorisationForm;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
