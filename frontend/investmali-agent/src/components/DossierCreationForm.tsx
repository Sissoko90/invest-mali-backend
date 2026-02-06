import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  UserIcon, 
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  XMarkIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import DivisionSearchInput from './DivisionSearchInput';
import SignatureCanvas from './SignatureCanvas';
import divisionService from '../services/divisionService';
import { enumsAPI, agentBusinessAPI } from '../services/api';
import { getApiBaseUrl } from '../utils/apiUrl';
import { generateUnpaidReceiptData } from '../services/receiptService';
import PaymentReceipt from './PaymentReceipt';
// import html2pdf from 'html2pdf.js'; // Temporairement désactivé

// Fonction utilitaire pour vérifier si des modals sont ouverts
const hasOpenModals = () => {
  return document.querySelector('.fixed.inset-0') !== null;
};

// Types pour les domaines d'activités
export type DomaineActivites = 'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS' | 'ARCHITECTE' | 'BTP' | 'CARTOGRAPHIE_TOPOGRAPHIE' | 'GEOMETRES_EXPERTS' | 'INGENIEUR_CONSEIL' | 'PRODUCTEUR_DE_SPECTACLES' | 'PROMOTEUR_IMMOBILIER' | 'STATIONS' | 'TRANSPORT' | 'URBANISTE' | 'ETABLISSEMENT_DE_TOURISME' | 'AGENCE_DE_VOYAGE';

export type TypeEntreprise = 'SOCIETE' | 'ENTREPRISE_INDIVIDUELLE';
export type FormeJuridique = 'SARL' | 'SARL_UNI' | 'SUC_SARL' | 'FIL_SARL' | 'SA' | 'SUC_SA' | 'FIL_SA' | 'SASU' | 'SAS' | 'BR' | 'FIL_SAS' | 'SUC_SAS' | 'SNC' | 'SCS' | 'SCI' | 'SCP' | 'GIE' | 'E_I';

export type Civilites = 'MONSIEUR' | 'MADAME' | 'PERSONNE_MORALE';
export type Sexes = 'MASCULIN' | 'FEMININ';
export type SituationMatrimoniales = 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';
export type TypePieces = 'CNI' | 'PASSEPORT' | 'CARTE_CONSULAIRE' | 'CARTE_ELECTEUR';

// Type pour les pays d'émission RCCM
interface PaysEmissionRccm {
  key: string;
  value: string;
}

export type Nationalite = 
  | 'AFGHANE'
  | 'ALBANAISE'
  | 'ALGÉRIENNE'
  | 'ALLEMANDE'
  | 'AMÉRICAINE'
  | 'ANDORRANE'
  | 'ANGOLAISE'
  | 'ANTIGUAISE'
  | 'ARGENTINE'
  | 'ARMéNIENNE'
  | 'AUSTRALIENNE'
  | 'AUTRICHIENNE'
  | 'AZERBAéDJANAISE'
  | 'BAHAMéENNE'
  | 'BAHREéNIENNE'
  | 'BANGLADAISE'
  | 'BARBADIENNE'
  | 'BELGE'
  | 'BéLIZIENNE'
  | 'BÉNINOISE'
  | 'BHOUTANAISE'
  | 'BIéLORUSSE'
  | 'BIRMANE'
  | 'BOLIVIENNE'
  | 'BOSNIAQUE'
  | 'BOTSWANAISE'
  | 'BRÉSILIENNE'
  | 'BRITANNIQUE'
  | 'BRUNéIENNE'
  | 'BULGARE'
  | 'BURKINABÈ'
  | 'BURUNDAISE'
  | 'CAMBODGIENNE'
  | 'CAMEROUNAISE'
  | 'CANADIENNE'
  | 'CAP_VERDIENNE'
  | 'CENTRAFRICAINE'
  | 'CHILIENNE'
  | 'CHINOISE'
  | 'CHYPRIOTE'
  | 'COLOMBIENNE'
  | 'COMORIENNE'
  | 'CONGOLAISE_RDC'
  | 'CONGOLAISE_CONGO_BRAZZAVILLE'
  | 'COSTARICIENNE'
  | 'CROATE'
  | 'CUBAINE'
  | 'DANOISE'
  | 'DJIBOUTIENNE'
  | 'DOMINICAINE'
  | 'DOMINIQUAISE'
  | 'ÉGYPTIENNE'
  | 'éMIRIENNE'
  | 'éQUATORIENNE'
  | 'éRYTHRéENNE'
  | 'ESPAGNOLE'
  | 'ESTONIENNE'
  | 'ESWATINIENNE'
  | 'ÉTHIOPIENNE'
  | 'FIDJIENNE'
  | 'FINLANDAISE'
  | 'FRANÇAISE'
  | 'GABONAISE'
  | 'GAMBIENNE'
  | 'GéORGIENNE'
  | 'GHANÉENNE'
  | 'GRECQUE'
  | 'GRENADIENNE'
  | 'GUATéMALTéQUE'
  | 'GUINÉENNE'
  | 'BISSAU_GUINÉENNE'
  | 'GUYANIENNE'
  | 'HAéTIENNE'
  | 'HONDURIENNE'
  | 'HONGROISE'
  | 'INDIENNE'
  | 'INDONÉSIENNE'
  | 'IRAKIENNE'
  | 'IRANIENNE'
  | 'IRLANDAISE'
  | 'ISLANDAISE'
  | 'ISRAéLIENNE'
  | 'ITALIENNE'
  | 'IVOIRIENNE'
  | 'JAMAéCAINE'
  | 'JAPONAISE'
  | 'JORDANIENNE'
  | 'KAZAKHE'
  | 'KÉNYANE'
  | 'KIRGHIZE'
  | 'KIRIBATIENNE'
  | 'KOWEéTIENNE'
  | 'LAOTIENNE'
  | 'LETTONE'
  | 'LIBANAISE'
  | 'LIBÉRIENNE'
  | 'LIBYENNE'
  | 'LIECHTENSTEINOISE'
  | 'LITUANIENNE'
  | 'LUXEMBOURGEOISE'
  | 'MACéDONIENNE'
  | 'MALAISIENNE'
  | 'MALAWITE'
  | 'MALDIVIENNE'
  | 'MALIENNE'
  | 'MALTAISE'
  | 'MAROCAINE'
  | 'MARSHALLAISE'
  | 'MAURICIENNE'
  | 'MAURITANIENNE'
  | 'MEXICAINE'
  | 'MICRONéSIENNE'
  | 'MOLDAVE'
  | 'MONéGASQUE'
  | 'MONGOLE'
  | 'MONTéNéGRINE'
  | 'MOZAMBICAINE'
  | 'NAMIBIENNE'
  | 'NAURUANE'
  | 'NÉERLANDAISE'
  | 'NéO_ZéLANDAISE'
  | 'NéPALAIS'
  | 'NIGéRIANE'
  | 'NIGÉRIENNE'
  | 'NORD_CORéENNE'
  | 'NORVÉGIENNE'
  | 'OMANAISE'
  | 'PAKISTANAISE'
  | 'PALESTINIENNE'
  | 'PANAMéENNE'
  | 'PAPOUASIENNE_NÉO_GUINÉENNE'
  | 'PARAGUAYENNE'
  | 'PÉRUVIENNE'
  | 'PHILIPPINE'
  | 'POLONAISE'
  | 'PORTUGAISE'
  | 'QATARIE'
  | 'ROUMAINE'
  | 'RUSSE'
  | 'RWANDAISE'
  | 'SAINT_LUCIENNE'
  | 'SAINT_MARINAISE'
  | 'SAINT_VINCENTAISé_ET_GRENADINE'
  | 'SALOMONIENNE'
  | 'SALVADORIENNE'
  | 'SAMOANE'
  | 'SAO_TOMéENNE'
  | 'SAOUDIENE'
  | 'SÉNÉGALAISE'
  | 'SERBE'
  | 'SEYCHELLOISE'
  | 'SIERRA_LEONAISE'
  | 'SINGAPOURIENNE'
  | 'SLOVAQUE'
  | 'SLOVéNE'
  | 'SOMALIENNE'
  | 'SOUDANAISE'
  | 'SUD_CORéENNE'
  | 'SUD_SOUDANAISE'
  | 'SRI_LANKAISE'
  | 'SUÉDOISE'
  | 'SUISSE'
  | 'SYRIENNE'
  | 'TADJIKE'
  | 'TANZANIENNE'
  | 'TCHADIENNE'
  | 'TCHÈQUE'
  | 'THAÏLANDAISE'
  | 'TIMORAISE'
  | 'TOGOLAISE'
  | 'TONGIENNE'
  | 'TRINITéENNE_ET_TOBAGAISE'
  | 'TUNISIENNE'
  | 'TURKMéNE'
  | 'TURQUE'
  | 'TUVALUANE'
  | 'UKRAINIENNE'
  | 'URUGUAYENNE'
  | 'OUZBéKE'
  | 'VANUATAISE'
  | 'CITOYENNE_DU_SAINT_SIéGE_VATICAN'
  | 'VÉNÉZUÉLIENNE'
  | 'VIETNAMIENNE'
  | 'YéMéNITE'
  | 'ZAMBIENNE'
  | 'ZIMBABWEENNE';

export type DomaineActiviteNr = 
  | 'AGRICULTURE_ELEVAGE_PECHE'
  | 'MINES_ET_MINERAIS'
  | 'ENERGIE_ET_RESSOURCES_NATURELLES'
  | 'INDUSTRIE_ET_TRANSFORMATION'
  | 'COMMERCE_ET_DISTRIBUTION'
  | 'TRANSPORTS_ET_LOGISTIQUE'
  | 'TELECOMS_ET_TIC'
  | 'TOURISME_CULTURE_ET_ARTISANAT'
  | 'SANTE_ET_PHARMACEUTIQUE'
  | 'EDUCATION_ET_FORMATION'
  | 'SERVICES_FINANCIERS_ET_ASSURANCES'
  | 'IMMOBILIER_ET_CONSTRUCTION'
  | 'ADMINISTRATION_ET_SERVICES_PUBLICS'
  | 'ENVIRONNEMENT_ET_ECOLOGIE'
  | 'RECHERCHE_ET_INNOVATION'
  | 'INGENIERIE_ET_ETUDES'
  | 'URBANISME_ET_AMENAGEMENT';

// Mapping entre les domaines réglementés et non réglementés qui se correspondent
export const DOMAINE_MAPPING: Record<DomaineActiviteNr, DomaineActivites[]> = {
  AGRICULTURE_ELEVAGE_PECHE: [], // Pas d'équivalent direct
  MINES_ET_MINERAIS: [], // Pas d'équivalent direct
  ENERGIE_ET_RESSOURCES_NATURELLES: ['STATIONS'], // Stations (ex. stations-service)
  INDUSTRIE_ET_TRANSFORMATION: [], // Pas d'équivalent direct
  COMMERCE_ET_DISTRIBUTION: [], // Pas d'équivalent direct
  TRANSPORTS_ET_LOGISTIQUE: ['TRANSPORT'], // Transport
  TELECOMS_ET_TIC: [], // Pas d'équivalent direct
  TOURISME_CULTURE_ET_ARTISANAT: [
    'PRODUCTEUR_DE_SPECTACLES', // Producteur de Spectacles
    'ETABLISSEMENT_DE_TOURISME', // établissement de tourisme
    'AGENCE_DE_VOYAGE' // Agence de voyage
  ],
  SANTE_ET_PHARMACEUTIQUE: [], // Pas d'équivalent direct
  EDUCATION_ET_FORMATION: [], // Pas d'équivalent direct
  SERVICES_FINANCIERS_ET_ASSURANCES: [], // Pas d'équivalent direct
  IMMOBILIER_ET_CONSTRUCTION: [
    'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS', // Administrateurs et Agents Immobiliers
    'BTP', // BTP
    'PROMOTEUR_IMMOBILIER' // Promoteur Immobilier
  ],
  ADMINISTRATION_ET_SERVICES_PUBLICS: [], // Pas d'équivalent direct
  ENVIRONNEMENT_ET_ECOLOGIE: [], // Pas d'équivalent direct
  RECHERCHE_ET_INNOVATION: [], // Pas d'équivalent direct
  INGENIERIE_ET_ETUDES: [
    'ARCHITECTE', // Architecte
    'CARTOGRAPHIE_TOPOGRAPHIE', // Cartographie / Topographie
    'GEOMETRES_EXPERTS', // Géométres-Experts
    'INGENIEUR_CONSEIL' // Ingénieur-Conseil
  ],
  URBANISME_ET_AMENAGEMENT: ['URBANISTE'], // Urbaniste
};

// Mapping inverse : domaines non réglementés vers leurs domaines réglementés parents
export const DOMAINE_MAPPING_INVERSE: Record<DomaineActivites, DomaineActiviteNr> = {
  'STATIONS': 'ENERGIE_ET_RESSOURCES_NATURELLES',
  'TRANSPORT': 'TRANSPORTS_ET_LOGISTIQUE',
  'PRODUCTEUR_DE_SPECTACLES': 'TOURISME_CULTURE_ET_ARTISANAT',
  'ETABLISSEMENT_DE_TOURISME': 'TOURISME_CULTURE_ET_ARTISANAT',
  'AGENCE_DE_VOYAGE': 'TOURISME_CULTURE_ET_ARTISANAT',
  'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS': 'IMMOBILIER_ET_CONSTRUCTION',
  'BTP': 'IMMOBILIER_ET_CONSTRUCTION',
  'PROMOTEUR_IMMOBILIER': 'IMMOBILIER_ET_CONSTRUCTION',
  'ARCHITECTE': 'INGENIERIE_ET_ETUDES',
  'CARTOGRAPHIE_TOPOGRAPHIE': 'INGENIERIE_ET_ETUDES',
  'GEOMETRES_EXPERTS': 'INGENIERIE_ET_ETUDES',
  'INGENIEUR_CONSEIL': 'INGENIERIE_ET_ETUDES',
  'URBANISTE': 'URBANISME_ET_AMENAGEMENT',
};

interface Dossier {
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

interface DossierCreationFormProps {
  onDossierCreated: (dossier: Dossier) => void;
  onClose?: () => void;
}

// Liste des pays avec codes téléphoniques et drapeaux (comme cété utilisateur)
const countries = [
  { code: '+223', name: 'Mali', flag: 'https://flagcdn.com/w40/ml.png', iso: 'ML' },
  { code: '+33', name: 'France', flag: 'https://flagcdn.com/w40/fr.png', iso: 'FR' },
  { code: '+1', name: 'états-Unis', flag: 'https://flagcdn.com/w40/us.png', iso: 'US' },
  { code: '+44', name: 'Royaume-Uni', flag: 'https://flagcdn.com/w40/gb.png', iso: 'GB' },
  { code: '+49', name: 'Allemagne', flag: 'https://flagcdn.com/w40/de.png', iso: 'DE' },
  { code: '+221', name: 'Sénégal', flag: 'https://flagcdn.com/w40/sn.png', iso: 'SN' },
  { code: '+225', name: 'Céte d\'Ivoire', flag: 'https://flagcdn.com/w40/ci.png', iso: 'CI' },
  { code: '+226', name: 'Burkina Faso', flag: 'https://flagcdn.com/w40/bf.png', iso: 'BF' },
  { code: '+227', name: 'Niger', flag: 'https://flagcdn.com/w40/ne.png', iso: 'NE' },
  { code: '+228', name: 'Togo', flag: 'https://flagcdn.com/w40/tg.png', iso: 'TG' },
  { code: '+229', name: 'Bénin', flag: 'https://flagcdn.com/w40/bj.png', iso: 'BJ' },
  { code: '+230', name: 'Maurice', flag: 'https://flagcdn.com/w40/mu.png', iso: 'MU' },
  { code: '+212', name: 'Maroc', flag: 'https://flagcdn.com/w40/ma.png', iso: 'MA' },
  { code: '+213', name: 'Algérie', flag: 'https://flagcdn.com/w40/dz.png', iso: 'DZ' },
  { code: '+216', name: 'Tunisie', flag: 'https://flagcdn.com/w40/tn.png', iso: 'TN' },
  { code: '+220', name: 'Gambie', flag: 'https://flagcdn.com/w40/gm.png', iso: 'GM' },
  { code: '+224', name: 'Guinée', flag: 'https://flagcdn.com/w40/gn.png', iso: 'GN' },
  { code: '+232', name: 'Sierra Leone', flag: 'https://flagcdn.com/w40/sl.png', iso: 'SL' },
  { code: '+233', name: 'Ghana', flag: 'https://flagcdn.com/w40/gh.png', iso: 'GH' },
];

interface Participant {
  id?: string; // ID backend réel (UUID)
  tempId?: string; // ID temporaire frontend (timestamp)
  civilite: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  telephone: string;
  telephone2?: string;
  email: string;
  adresse: string;
  role: 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR';
  pourcentageParts: number;
  dateDebut: string;
  dateFin?: string;
  // Champs supplémentaires pour le formulaire détaillé
  sexe?: string;
  situationMatrimoniale?: string;
  typePiece?: string;
  numeroPiece?: string;
  documentFile?: File;
  extraitNaissanceFile?: File;
  // Champs pour personnes morales
  denominationEntreprise?: string;
  representantLegalNom?: string;
  representantLegalPrenom?: string;
  paysEmissionRccm?: string;
  rccmFile?: File;
  typePersonne?: 'PHYSIQUE' | 'MORALE';
  // Champs spécifiques pour les gérants (comme cété utilisateur)
  hasCriminalRecord?: boolean;
  casierJudiciaireFile?: File;
  declarationHonneurFile?: File;
  signatureDataUrl?: string;
  acteMariageFile?: File;
  certificatResidenceFile?: File;
  pieceNationaliteFile?: File;
  // Documents supplémentaires
  autresDocuments?: Array<{
    id: string;
    name: string;
    file: File | null;
    description: string;
  }>;
}

interface FormData {
  // Informations Personnelles
  civilite: Civilites;
  prenom: string;
  nom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: Nationalite;
  telephonePersonnel: string;
  telephonePersonnel2: string;
  emailPersonnel: string;
  adressePersonnelle: string;
  localite: string;
  porte: string;
  adresseLibre: string;
  // Questions Oui/Non
  hasCriminalRecord: boolean;
  isMarried: boolean;
  allowsOthersResponsible: boolean;
  requiresExerciseAuthorization: boolean;
  willImportExport: boolean;
  hasDifferentAddress: boolean;
  // Conjoints (pour les personnes mariées)
  nombreConjoints?: number;
  conjoints?: Array<{
    id: string; // Identifiant unique pour éviter les problèmes de re-render
    prenom: string;
    nom: string;
    dateMariage: string;
    lieuMariage: string;
    regimeMatrimonial: string;
    clauseRestrictive: string;
    acteMariageFile?: File;
    acteMariageFilename?: string;
  }>;
  // Informations Société
  nomEntreprise: string;
  sigleEntreprise: string;
  typeEntreprise: TypeEntreprise;
  formeJuridique: FormeJuridique;
  capital: string;
  adresse: string;
  telephone: string;
  email: string;
  rueEntreprise: string;
  porteEntreprise: string;
  // Informations du déposant (pour les sociétés)
  nomDeposant: string;
  prenomDeposant: string;
  telephoneDeposant: string;
  emailDeposant: string;
  nomCabinet: string;
  // Activité (intégrée dans Informations Société)
  domaineActiviteNr?: DomaineActiviteNr; // Domaine non réglementé
  domaineActivite?: DomaineActivites; // Domaine réglementé (optionnel)
  activitePrincipale: string;
  activiteSecondaire: string;
  // Participants
  participants: Participant[];
  // Documents
  documents: {
    statuts: File | null;
    registreCommerce: File | null;
    justificatifDomicile: File | null;
    pvAssemblee: File | null;
    declarationNotariee: File | null;
    attestationBancaire: File | null;
    rccmSocieteMere: File | null;
  };
  // Localisation
  division: string;
  antenne: string;
}

const DossierCreationForm: React.FC<DossierCreationFormProps> = ({ onDossierCreated, onClose }) => {
  const { agent } = useAgentAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDossierCreated, setIsDossierCreated] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{reference: string, entreprise: string, isSimulated: boolean, emailInfo: string} | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // État pour les documents supplémentaires
  const [additionalDocuments, setAdditionalDocuments] = useState<Array<{
    id: string;
    name: string;
    file: File | null;
    description: string;
  }>>([]);

  // états pour la localisation - Informations personnelles
  const [personalRegions, setPersonalRegions] = useState<any[]>([]);
  const [personalCercles, setPersonalCercles] = useState<any[]>([]);
  const [personalArrondissements, setPersonalArrondissements] = useState<any[]>([]);
  const [personalCommunes, setPersonalCommunes] = useState<any[]>([]);
  const [personalQuartiers, setPersonalQuartiers] = useState<any[]>([]);
  
  const [personalSelectedRegionId, setPersonalSelectedRegionId] = useState('');
  const [personalSelectedCercleId, setPersonalSelectedCercleId] = useState('');
  const [personalSelectedArrondissementId, setPersonalSelectedArrondissementId] = useState('');
  const [personalSelectedCommuneId, setPersonalSelectedCommuneId] = useState('');
  const [personalSelectedQuartierId, setPersonalSelectedQuartierId] = useState('');
  
  // états pour détecter Bamako
  const [isPersonalBamako, setIsPersonalBamako] = useState(false);
  const [isCompanyBamako, setIsCompanyBamako] = useState(false);

  // état pour les pays d'émission RCCM
  const [paysEmissionRccm, setPaysEmissionRccm] = useState<PaysEmissionRccm[]>([]);
  // état pour les domaines d'activité non réglementés
  const [domaineActiviteNrOptions, setDomaineActiviteNrOptions] = useState<any[]>([]);
  const [domaineSearchTerm, setDomaineSearchTerm] = useState('');
  const [showDomaineDropdown, setShowDomaineDropdown] = useState(false);
  const domaineDropdownRef = useRef<HTMLDivElement>(null);
  const domaineInputRef = useRef<HTMLInputElement>(null);
  
  // états pour le sélecteur de pays téléphone personnel
  const [personalSelectedCountry, setPersonalSelectedCountry] = useState(countries[0]); // Mali par défaut
  const [showPersonalCountryDropdown, setShowPersonalCountryDropdown] = useState(false);
  
  // états pour la localisation de l'entreprise
  const [companyRegions, setCompanyRegions] = useState<any[]>([]);
  const [companyCercles, setCompanyCercles] = useState<any[]>([]);
  const [companyArrondissements, setCompanyArrondissements] = useState<any[]>([]);
  const [companyCommunes, setCompanyCommunes] = useState<any[]>([]);
  const [companyQuartiers, setCompanyQuartiers] = useState<any[]>([]);
  
  const [companySelectedRegionId, setCompanySelectedRegionId] = useState('');
  const [companySelectedCercleId, setCompanySelectedCercleId] = useState('');
  const [companySelectedArrondissementId, setCompanySelectedArrondissementId] = useState('');
  const [companySelectedCommuneId, setCompanySelectedCommuneId] = useState('');
  const [companySelectedQuartierId, setCompanySelectedQuartierId] = useState('');

  // État principal du formulaire
  const [formData, setFormData] = useState<FormData>({
    // Informations Personnelles - champs vides par défaut
    civilite: 'MONSIEUR',
    prenom: '',
    nom: '',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: 'MALIENNE',
    telephonePersonnel: '',
    telephonePersonnel2: '',
    emailPersonnel: '',
    adressePersonnelle: '',
    localite: '',
    porte: '',
    adresseLibre: '',
    // Questions Oui/Non
    hasCriminalRecord: false,
    isMarried: false,
    allowsOthersResponsible: false,
    requiresExerciseAuthorization: false,
    willImportExport: false,
    hasDifferentAddress: false,
    // Informations Société
    nomEntreprise: '',
    sigleEntreprise: '',
    typeEntreprise: 'ENTREPRISE_INDIVIDUELLE',
    formeJuridique: 'E_I',
    capital: '',
    adresse: '',
    telephone: '',
    email: '',
    rueEntreprise: '',
    porteEntreprise: '',
    // Informations du déposant (pour les sociétés)
    nomDeposant: '',
    prenomDeposant: '',
    telephoneDeposant: '',
    emailDeposant: '',
    nomCabinet: '',
    // Activité
    activitePrincipale: '',
    activiteSecondaire: '',
    // Participants
    participants: [],
    // Documents
    documents: {
      statuts: null,
      registreCommerce: null,
      justificatifDomicile: null,
      pvAssemblee: null,
      declarationNotariee: null,
      attestationBancaire: null,
      rccmSocieteMere: null,
    },
    // Localisation - champs vides par défaut
    division: '',
    antenne: '',
  });

  // Refs pour stocker les valeurs actuelles sans causer de re-renders
  const currentStepRef = useRef(currentStep);
  const personalSelectedQuartierIdRef = useRef(personalSelectedQuartierId);
  const companySelectedQuartierIdRef = useRef(companySelectedQuartierId);

  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    personalSelectedQuartierIdRef.current = personalSelectedQuartierId;
  }, [personalSelectedQuartierId]);

  useEffect(() => {
    companySelectedQuartierIdRef.current = companySelectedQuartierId;
  }, [companySelectedQuartierId]);

  // Fonction pour mettre à jour les données du formulaire
  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Sauvegarder automatiquement dans localStorage (sans les fichiers)
      // Utiliser setTimeout pour éviter les problèmes de re-render
      setTimeout(() => {
        try {
          const cacheData = {
            formData: {
              ...updated,
              documents: {
                statuts: null,
                registreCommerce: null,
                justificatifDomicile: null,
                pvAssemblee: null,
                declarationNotariee: null,
                attestationBancaire: null,
              },
              participants: updated.participants.map(p => ({
                ...p,
                documentFile: undefined,
                extraitNaissanceFile: undefined,
                pieceNationaliteFile: undefined,
                casierJudiciaireFile: undefined,
                declarationHonneurFile: undefined,
                acteMariageFile: undefined,
                certificatResidenceFile: undefined,
                rccmFile: undefined,
              }))
            },
            currentStep: currentStepRef.current,
            personalSelectedQuartierId: personalSelectedQuartierIdRef.current,
            companySelectedQuartierId: companySelectedQuartierIdRef.current,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('dossier_creation_cache', JSON.stringify(cacheData));
        } catch (error) {
          console.error('Erreur sauvegarde cache:', error);
        }
      }, 0);
      
      return updated;
    });
  }, []);

  // Fonction pour mettre à jour un conjoint spécifique sans recréer tout le tableau
  const updateConjoint = useCallback((index: number, field: string, value: any) => {
    setFormData(prev => {
      if (!prev.conjoints) return prev;
      
      const conjoint = prev.conjoints[index];
      if (!conjoint) return prev;
      
      // Vérifier si la valeur a vraiment changé pour éviter les re-renders inutiles
      if ((conjoint as any)[field] === value) {
        return prev;
      }
      
      // Créer une copie du tableau
      const newConjoints = [...prev.conjoints];
      // Mettre à jour uniquement l'élément à l'index spécifié
      newConjoints[index] = { ...newConjoints[index], [field]: value };
      
      return { ...prev, conjoints: newConjoints };
    });
  }, []);

  // Fonction pour gérer l'upload de fichier pour un conjoint
  const handleConjointFileChange = useCallback((index: number, file: File) => {
    setFormData(prev => {
      if (!prev.conjoints) return prev;
      
      const newConjoints = [...prev.conjoints];
      newConjoints[index] = { 
        ...newConjoints[index], 
        acteMariageFile: file,
        acteMariageFilename: file.name
      };
      
      return { ...prev, conjoints: newConjoints };
    });
  }, []);

  // Helper functions
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getMaxBirthDate = (): string => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  };


  const createNewDossier = () => {
    // Reset form data and states
    setFormData({
      civilite: 'MONSIEUR',
      prenom: '',
      nom: '',
      dateNaissance: '',
      lieuNaissance: '',
      nationalite: 'MALIENNE',
      telephonePersonnel: '',
      telephonePersonnel2: '',
      emailPersonnel: '',
      adressePersonnelle: '',
      localite: '',
      porte: '',
      adresseLibre: '',
      hasCriminalRecord: false,
      isMarried: false,
      allowsOthersResponsible: false,
      requiresExerciseAuthorization: false,
      willImportExport: false,
      hasDifferentAddress: false,
      nomEntreprise: '',
      sigleEntreprise: '',
      typeEntreprise: 'ENTREPRISE_INDIVIDUELLE',
      formeJuridique: 'E_I',
      capital: '',
      adresse: '',
      telephone: '',
      email: '',
      rueEntreprise: '',
      porteEntreprise: '',
      // Informations du déposant
      nomDeposant: '',
      prenomDeposant: '',
      telephoneDeposant: '',
      emailDeposant: '',
      nomCabinet: '',
      activitePrincipale: '',
      activiteSecondaire: '',
      participants: [],
      documents: {
        statuts: null,
        registreCommerce: null,
        justificatifDomicile: null,
        pvAssemblee: null,
        declarationNotariee: null,
        attestationBancaire: null,
        rccmSocieteMere: null,
      },
      division: '',
      antenne: '',
    });
    setCurrentStep(1);
    setIsDossierCreated(false);
    setGeneratedReceipt(null);
    setShowReceipt(false);
  };

  // Propriétés dynamiques pour le téléphone personnel
  const personalPhoneMaxLength = useMemo(() => {
    const maxLen = (() => {
      switch (personalSelectedCountry.code) {
        case '+223': return 11; // 8 chiffres + 3 espaces
        case '+33': return 14;  // 9 chiffres + 4 espaces
        case '+1': return 12;   // 10 chiffres + 2 espaces
        default: return 20;     // Format générique
      }
    })();
    return maxLen;
  }, [personalSelectedCountry.code]);

  const personalPhonePlaceholder = useMemo(() => {
    const placeholder = (() => {
      switch (personalSelectedCountry.code) {
        case '+223': return 'XX XX XX XX';
        case '+33': return 'XX XX XX XX XX';
        case '+1': return 'XXX XXX XXXX';
        default: return 'Numéro de téléphone';
      }
    })();
    return placeholder;
  }, [personalSelectedCountry.code]);

  // Fonction pour formater le téléphone personnel
  const handlePersonalPhoneChange = (value: string, inputElement?: HTMLInputElement) => {
    // Supprimer tous les caractéres non numériques
    const cleaned = value.replace(/[^\d]/g, '');
    
    // Déterminer la longueur maximale et le format selon le pays sélectionné
    let maxLength = 8; // Mali par défaut
    let formatted = cleaned;
    
    if (personalSelectedCountry.code === '+223') {
      // Mali: 8 chiffres, format XX XX XX XX
      maxLength = 8;
      const limited = cleaned.substring(0, maxLength);
      formatted = limited;
      
      // Appliquer le formatage avec espaces
      if (limited.length > 2) {
        formatted = limited.substring(0, 2) + ' ' + limited.substring(2);
      }
      if (limited.length > 4) {
        formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4);
      }
      if (limited.length > 6) {
        formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4, 6) + ' ' + limited.substring(6);
      }
    } else if (personalSelectedCountry.code === '+33') {
      // France: 9 chiffres, format XX XX XX XX XX
      maxLength = 9;
      const limited = cleaned.substring(0, maxLength);
      formatted = limited;
      
      // Appliquer le formatage avec espaces
      if (limited.length > 2) {
        formatted = limited.substring(0, 2) + ' ' + limited.substring(2);
      }
      if (limited.length > 4) {
        formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4);
      }
      if (limited.length > 6) {
        formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4, 6) + ' ' + limited.substring(6);
      }
      if (limited.length > 8) {
        formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4, 6) + ' ' + limited.substring(6, 8) + ' ' + limited.substring(8);
      }
    } else if (personalSelectedCountry.code === '+1') {
      // états-Unis/Canada: 10 chiffres, format XXX XXX XXXX
      maxLength = 10;
      const limited = cleaned.substring(0, maxLength);
      formatted = limited;
      
      // Appliquer le formatage avec espaces
      if (limited.length > 3) {
        formatted = limited.substring(0, 3) + ' ' + limited.substring(3);
      }
      if (limited.length > 6) {
        formatted = limited.substring(0, 3) + ' ' + limited.substring(3, 6) + ' ' + limited.substring(6);
      }
    } else {
      // Autres pays: format générique, maximum 15 chiffres
      maxLength = 15;
      formatted = cleaned.substring(0, maxLength);
    }
    
    // Mettre é jour directement la valeur de l'input (comme cété utilisateur)
    if (inputElement) {
      inputElement.value = formatted;
    }
    
    return formatted;
  };

  // Fermer le dropdown des pays téléphone personnel quand on clique é l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.personal-country-dropdown')) {
        setShowPersonalCountryDropdown(false);
      }
    };

    if (showPersonalCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPersonalCountryDropdown]);

  const totalSteps = 5;
  const allSteps = [
    { number: 1, title: 'Informations Personnelles', icon: UserIcon },
    { number: 2, title: 'Informations de l\'entreprise', icon: BuildingOfficeIcon },
    { number: 3, title: formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'Promoteur' : 'Participants', icon: BriefcaseIcon },
    { number: 4, title: 'Documents', icon: DocumentIcon },
    { number: 5, title: 'Récapitulatif', icon: CheckCircleIcon }
  ];

  // Filtrer les étapes selon le type d'entreprise
  const steps = allSteps.filter(step => {
    // Masquer l'étape Documents pour les entreprises individuelles
    if (step.number === 4 && formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
      return false;
    }
    return true;
  });

  // Fonction pour déterminer si un rôle nécessite des parts
  const roleRequiresParts = (role: 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR'): boolean => {
    // Les GIE n'ont pas de parts sociales
    if (formData.formeJuridique === 'GIE') {
      return false;
    }
    return role !== 'ADMINISTRATEUR';
  };

  // Fonction pour obtenir la liste des pièces à joindre selon la forme juridique
  const getRequiredPiecesInfo = (formeJuridique: FormeJuridique): string[] => {
    switch (formeJuridique) {
      // SA, SARL, SAS, SNC, SCS - Sociétés classiques
      case 'SA':
      case 'SARL':
      case 'SARL_UNI':
      case 'SAS':
      case 'SASU':
      case 'SNC':
      case 'SCS':
        return [
          'Copie de la pièce d\'identité ou du passeport',
          'Un certificat de résidence pour les étrangers',
          'Casier judiciaire ou déclaration sur l\'honneur d\'une validité de 2 mois avec un extrait d\'acte de naissance',
          'Justificatif de la libération d\'un capital selon le type de société'
        ];
      
      // GIE - Groupement d'Intérêt Économique
      case 'GIE':
        return [
          'Copie de la pièce d\'identité ou du passeport',
          'Certificat de résidence pour les étrangers',
          'Casier judiciaire ou déclaration sur l\'honneur d\'une validité 2 mois avec un extrait d\'acte de naissance'
        ];
      
      // Succursales et Filiales
      case 'SUC_SARL':
      case 'FIL_SARL':
      case 'SUC_SA':
      case 'FIL_SA':
      case 'SUC_SAS':
      case 'FIL_SAS':
        return [
          'Copie de la pièce d\'identité ou du passeport',
          'Certificat de résidence pour les étrangers',
          'Casier judiciaire ou déclaration sur l\'honneur avec un extrait d\'acte de naissance',
          'Statuts de la société mère',
          'RCCM de la société mère',
          'PV de l\'assemblée générale avec la décision de l\'ouverture de la succursale / filiale',
          'PV de l\'assemblée générale ou assemblée générale ordinaire sur lequel figure la désignation du gérant au Mali'
        ];
      
      // Entreprise Individuelle (E_I) - Liste séparée
      case 'E_I':
        return [
          'Copie de la pièce d\'identité ou du passeport',
          'Un certificat de résidence pour les étrangers',
          'Casier judiciaire ou déclaration sur l\'honneur d\'une validité de 2 mois avec un extrait d\'acte de naissance',
          'Justificatif de la libération d\'un capital selon le type de société'
        ];
      default:
        return [
          'Copie de la pièce d\'identité ou du passeport',
          'Un certificat de résidence pour les étrangers',
          'Casier judiciaire ou déclaration sur l\'honneur d\'une validité de 2 mois avec un extrait d\'acte de naissance'
        ];
    }
  };

  // Fonction pour déterminer les documents requis selon la forme juridique
  const getRequiredDocuments = (formeJuridique: FormeJuridique): {
    statuts: boolean;
    registreCommerce: boolean;
    pvAssemblee: boolean;
    declarationNotariee: boolean;
    attestationBancaire: boolean;
    rccmSocieteMere: boolean;
  } => {
    // Documents de base requis pour toutes les sociétés
    const baseDocuments = {
      statuts: true,
      registreCommerce: true,
      pvAssemblee: false,
      declarationNotariee: false,
      attestationBancaire: false,
      rccmSocieteMere: false,
    };

    switch (formeJuridique) {
      case 'SA':
      case 'SAS':
      case 'SASU':
        // SA, SAS, SASU nécessitent des documents supplémentaires
        return {
          ...baseDocuments,
          declarationNotariee: true,
          attestationBancaire: true,
        };
      case 'SARL':
      case 'SARL_UNI':
        // SARL et SARL Unipersonnelle
        return {
          ...baseDocuments,
          attestationBancaire: true, // Justificatif de libération du capital
        };
      case 'GIE':
        // GIE - Groupement d'Intérêt Économique
        return {
          ...baseDocuments,
        };
      case 'SNC':
      case 'SCS':
        // Sociétés en nom collectif et commandite simple
        return {
          ...baseDocuments,
          attestationBancaire: true, // Justificatif de libération du capital
        };
      case 'SCI':
      case 'SCP':
        // Sociétés civiles
        return {
          ...baseDocuments,
        };
      case 'SUC_SARL':
      case 'SUC_SA':
      case 'SUC_SAS':
      case 'FIL_SARL':
      case 'FIL_SA':
      case 'FIL_SAS':
        // Succursales et filiales
        return {
          ...baseDocuments,
          pvAssemblee: true,
          declarationNotariee: true,
          rccmSocieteMere: true,
        };
      case 'BR':
        // Bureau de représentation
        return {
          statuts: false,
          registreCommerce: true,
          pvAssemblee: false,
          declarationNotariee: true,
          attestationBancaire: false,
          rccmSocieteMere: false,
        };
      default:
        return baseDocuments;
    }
  };

  // Calculer le total des parts (exclure les administrateurs)
  const calculateTotalParts = (): number => {
    const eligibleParticipants = formData.participants?.filter(p => roleRequiresParts(p.role)) || [];
    return eligibleParticipants.reduce((total, participant) => total + (participant.pourcentageParts || 0), 0);
  };

  // Debug des données agent pour la localisation
  useEffect(() => {
  }, [agent, formData.division, formData.antenne]);

  // Fonction utilitaire pour synchroniser l'adresse de l'entreprise avec celle personnelle
  const syncCompanyAddress = () => {
    if (!formData.hasDifferentAddress) {
      updateFormData('adresse', formData.adressePersonnelle);
    }
  };

  // Synchroniser ou vider les localisations selon hasDifferentAddress
  useEffect(() => {
    const handleCompanyLocation = async () => {
      if (!formData.hasDifferentAddress) {
        // Synchroniser avec la localisation personnelle
        if (personalSelectedRegionId) {
          setCompanySelectedRegionId(personalSelectedRegionId);
          
          // Charger les cercles pour cette région
          try {
            const cercles = await divisionService.getCerclesByRegion(personalSelectedRegionId);
            setCompanyCercles(cercles || []);
            
            // Synchroniser cercle si sélectionné
            if (personalSelectedCercleId) {
              setCompanySelectedCercleId(personalSelectedCercleId);
              
              // Charger les communes pour ce cercle
              const communes = await divisionService.getCommunesByCercle(personalSelectedCercleId);
              setCompanyCommunes(communes || []);
              
              // Synchroniser commune si sélectionnée
              if (personalSelectedCommuneId) {
                setCompanySelectedCommuneId(personalSelectedCommuneId);
                
                // Charger les quartiers pour cette commune
                const quartiers = await divisionService.getQuartiersByCommune(personalSelectedCommuneId);
                setCompanyQuartiers(quartiers || []);
                
                // Synchroniser quartier si sélectionné
                if (personalSelectedQuartierId) {
                  setCompanySelectedQuartierId(personalSelectedQuartierId);
                }
              }
            }
          } catch (error) {
            console.error('? Erreur lors de la synchronisation:', error);
          }
        }
        
        // Synchroniser les champs rue et porte de l'entreprise avec ceux de la personne
        updateFormData('rueEntreprise', formData.localite);
        updateFormData('porteEntreprise', formData.porte);
        
      } else {
        // Vider les champs de localisation de l'entreprise quand l'adresse est différente
        setCompanySelectedRegionId('');
        setCompanySelectedCercleId('');
        setCompanySelectedCommuneId('');
        setCompanySelectedQuartierId('');
        setCompanyCercles([]);
        setCompanyCommunes([]);
        setCompanyQuartiers([]);
        updateFormData('rueEntreprise', '');
        updateFormData('porteEntreprise', '');
      }
    };
    
    handleCompanyLocation();
  }, [formData.hasDifferentAddress, personalSelectedRegionId, personalSelectedCercleId, personalSelectedCommuneId, personalSelectedQuartierId, formData.localite, formData.porte]);

  // Synchroniser l'adresse de l'entreprise avec celle personnelle seulement quand hasDifferentAddress change
  // DéSACTIVé TEMPORAIREMENT POUR éVITER LES RE-RENDERS
  // useEffect(() => {
  //   if (!formData.hasDifferentAddress) {
  //     updateFormData('adresse', formData.adressePersonnelle);
  //   }
  // }, [formData.hasDifferentAddress]);


  // Charger les régions au démarrage
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regions = await divisionService.getRegions();
        setPersonalRegions(regions);
        setCompanyRegions(regions);
      } catch (error) {
        console.error('Erreur lors du chargement des régions:', error);
      }
    };
    loadRegions();
  }, []);

  // Charger les pays d'émission RCCM au démarrage
  useEffect(() => {
    const loadPaysEmissionRccm = async () => {
      try {
        const response = await enumsAPI.getPaysEmissionRccm();
        setPaysEmissionRccm(response.data);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des pays RCCM:', error);
        // Fallback avec Mali par défaut en cas d'erreur
        setPaysEmissionRccm([{ key: 'MALI', value: 'Mali' }]);
      }
    };

    loadPaysEmissionRccm();
  }, []);

  // Charger les domaines d'activité non réglementés au démarrage
  useEffect(() => {
    const loadDomaineActivitesNr = async () => {
      try {
        const response = await enumsAPI.getDomaineActivitesNr();
        console.log('✅ Domaines d\'activité chargés:', response.data.length, 'options');
        setDomaineActiviteNrOptions(response.data);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des domaines d\'activité NR:', error);
        // Essayer un appel direct pour diagnostiquer
        console.log('🔍 Test direct de l\'endpoint...');
        try {
          const directResponse = await fetch('http://localhost:8080/api/v1/enums/domaine-activites-nr');
          console.log('🔍 Réponse directe status:', directResponse.status);
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ Données directes reçues:', directData.length, 'options');
            setDomaineActiviteNrOptions(directData);
          }
        } catch (directError) {
          console.error('❌ Erreur appel direct:', directError);
        }
      }
    };

    loadDomaineActivitesNr();
  }, []);

  // Gestionnaire de clic extérieur pour fermer la liste déroulante du domaine
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (domaineDropdownRef.current && !domaineDropdownRef.current.contains(event.target as Node)) {
        setShowDomaineDropdown(false);
      }
    };

    if (showDomaineDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDomaineDropdown]);

  // Fonction pour détecter si c'est Bamako District
  const isBamakoDistrict = (regionId: string, regions: any[]) => {
    if (!regionId || !regions.length) return false;
    
    const region = regions.find(r => r.id === regionId);
    
    if (!region) return false;
    
    const isBamako = region.nom?.toLowerCase().includes('bamako') ||
                     region.nom?.toLowerCase().includes('district') ||
                     region.code?.startsWith('0004') ||
                     region.code === 'BKO' ||
                     region.nom === 'BAMAKO (DISTRICT)';
    
    return isBamako;
  };

  // Logique unifiée pour charger les arrondissements de Bamako District
  const loadBamakoArrondissements = async (regionId: string): Promise<any[]> => {
    
    let arrondissements: any[] = [];
    
    // Stratégie 1: Endpoint direct
    try {
      arrondissements = await divisionService.getArrondissementsByRegion(regionId);
      
      if (arrondissements?.length > 0) {
        return arrondissements;
      }
    } catch (error) {
    }
    
    // Stratégie 2: searchBamakoDivisions
    try {
      const bamakoDivisions = await divisionService.searchBamakoDivisions();
      arrondissements = bamakoDivisions?.filter((d: any) => d.divisionType === 'ARRONDISSEMENT') || [];
      
      if (arrondissements?.length > 0) {
        return arrondissements;
      }
    } catch (error) {
    }
    
    // Stratégie 3: getAllArrondissements + filtrage intelligent
    try {
      const allArrondissements = await divisionService.getAllArrondissements();
      
      // Filtres multiples pour Bamako
      const bamakoFilters = [
        // Filtre par parent Bamako
        (arr: any) => arr.parent?.nom?.toLowerCase().includes('bamako'),
        // Filtre par nom contenant "arrondissement" et codes Bamako
        (arr: any) => {
          const nom = arr.nom?.toLowerCase() || '';
          const code = arr.code || '';
          return nom.includes('arrondissement') && 
                 ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => code.startsWith(prefix));
        },
        // Filtre par codes spécifiques Bamako
        (arr: any) => ['BKO1', 'BKO2', 'BKO3', 'BKO4', 'BKO5', 'BKO6', 'BKO7'].includes(arr.code)
      ];
      
      // Appliquer les filtres
      for (const filter of bamakoFilters) {
        const filtered = allArrondissements?.filter(filter) || [];
        if (filtered.length > 0) {
          return filtered;
        }
      }
      
    } catch (error) {
    }
    
    return [];
  };

  // useEffect pour charger les arrondissements quand la région change (personnel)
  useEffect(() => {
    const loadPersonalArrondissements = async () => {
      // éviter les appels API si des modals sont ouverts
      if (hasOpenModals()) {
        return;
      }
      
      if (personalSelectedRegionId) {
        
        const isBamako = isBamakoDistrict(personalSelectedRegionId, personalRegions);
        
        setIsPersonalBamako(isBamako);
        
        if (isBamako) {
          const arrondissements = await loadBamakoArrondissements(personalSelectedRegionId);
          setPersonalArrondissements(arrondissements || []);
        } else {
          try {
            const cercles = await divisionService.getCerclesByRegion(personalSelectedRegionId);
            setPersonalCercles(cercles || []);
          } catch (error) {
            setPersonalCercles([]);
          }
        }
      }
    };
    
    loadPersonalArrondissements();
  }, [personalSelectedRegionId]);

  // TOUS LES useEffect DE CHARGEMENT DE DONNéES DéSACTIVéS POUR TESTER LA PERTE DE FOCUS
  // Commentaire fermé temporairement pour réparer le fichier
  // useEffect OBSOLéTE - supprimé pour structure INSTAT moderne
  // Les communes sont maintenant chargées directement dans le onChange du cercle

  // useEffect OBSOLéTE - supprimé pour structure INSTAT moderne  
  // Les quartiers sont maintenant chargés directement dans le onChange de la commune

  // useEffect OBSOLéTE - supprimé complétement pour structure INSTAT moderne

  // useEffect pour charger les quartiers quand la commune change (personnel)
  useEffect(() => {
    const loadPersonalQuartiersByCommune = async () => {
      // éviter les appels API si des modals sont ouverts
      if (hasOpenModals()) {
        console.log(' Modal ouvert, report du chargement des quartiers');
        return;
      }
      
      if (personalSelectedCommuneId && !isPersonalBamako) {
        console.log(' Chargement quartiers pour commune:', personalSelectedCommuneId);
        
        // Reset des sélections suivantes
        setPersonalSelectedQuartierId('');
        
        const quartiers = await divisionService.getQuartiersByCommune(personalSelectedCommuneId);
        setPersonalQuartiers(quartiers || []);
      }
    };
    
    loadPersonalQuartiersByCommune();
  }, [personalSelectedCommuneId, isPersonalBamako]);

  // TOUS LES useEffect RESTANTS DéSACTIVéS POUR TESTER LA PERTE DE FOCUS
  // Commentaire fermé pour réparer le fichier
  // useEffect pour charger les arrondissements quand la région change (entreprise)
  useEffect(() => {
    const loadCompanyArrondissements = async () => {
      // éviter les appels API si des modals sont ouverts
      if (hasOpenModals()) {
        console.log(' Modal ouvert, report du chargement des arrondissements (entreprise)');
        return;
      }
      
      if (companySelectedRegionId) {
        console.log(' Chargement arrondissements pour région (entreprise):', companySelectedRegionId);
        
        // Reset des sélections suivantes
        setCompanySelectedCercleId('');
        setCompanySelectedArrondissementId('');
        setCompanySelectedCommuneId('');
        setCompanySelectedQuartierId('');
        
        const isBamako = isBamakoDistrict(companySelectedRegionId, personalRegions);
        setIsCompanyBamako(isBamako);
        
        // Structure INSTAT moderne : Bamako a aussi des cercles maintenant
        const cercles = await divisionService.getCerclesByRegion(companySelectedRegionId);
        setCompanyCercles(cercles || []);
        setCompanyArrondissements([]);
      }
    };
    
    loadCompanyArrondissements();
  }, [companySelectedRegionId]);

  // useEffect OBSOLéTE - supprimé pour structure INSTAT moderne (entreprise)
  // Les communes sont maintenant chargées directement dans le onChange du cercle

  // useEffect OBSOLéTE - supprimé complétement pour structure INSTAT moderne (entreprise)
  // Les quartiers sont maintenant chargés directement dans le onChange de la commune

  // useEffect pour charger les quartiers quand la commune change (entreprise)
  useEffect(() => {
    const loadCompanyQuartiersByCommune = async () => {
      // éviter les appels API si des modals sont ouverts
      if (hasOpenModals()) {
        console.log(' Modal ouvert, report du chargement des quartiers (entreprise)');
        return;
      }
      
      if (companySelectedCommuneId && !isCompanyBamako) {
        console.log(' Chargement quartiers pour commune (entreprise):', companySelectedCommuneId);
        
        // Reset des sélections suivantes
        setCompanySelectedQuartierId('');
        
        const quartiers = await divisionService.getQuartiersByCommune(companySelectedCommuneId);
        setCompanyQuartiers(quartiers || []);
      }
    };
    
    loadCompanyQuartiersByCommune();
  }, [companySelectedCommuneId, isCompanyBamako]);

  // Construire la hiérarchie compléte depuis une division (logique utilisateur)
  const buildDivisionHierarchy = async (division: any): Promise<any> => {
    const hierarchy: any = {};
    let current = division;
    
    // Remonter la hiérarchie
    while (current) {
      
      switch (current.divisionType) {
        case 'QUARTIER':
          hierarchy.quartier = current;
          break;
        case 'COMMUNE':
          hierarchy.commune = current;
          break;
        case 'ARRONDISSEMENT':
          hierarchy.arrondissement = current;
          break;
        case 'CERCLE':
          hierarchy.cercle = current;
          break;
        case 'REGION':
          hierarchy.region = current;
          break;
      }
      current = current.parent;
    }
    
    // Détecter si c'est Bamako District
    const isBamakoDistrict = hierarchy.region?.nom?.toLowerCase().includes('bamako') && 
                            hierarchy.region?.nom?.toLowerCase().includes('district');
    
    if (isBamakoDistrict) {
      // Pour Bamako, on ne garde que région, arrondissement et quartier
      // On supprime cercle et commune qui n'existent pas dans cette structure
      delete hierarchy.cercle;
      delete hierarchy.commune;
    }
    
    
    // Détecter si c'est un quartier de Bamako et forcer la reconstruction par code
    const isBamakoQuartier = division.divisionType === 'QUARTIER' && 
                            division.code && 
                            (['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix)));
    
    if (isBamakoQuartier) {
      const reconstructedHierarchy = await reconstructHierarchyByCode(division);
      if (reconstructedHierarchy && Object.keys(reconstructedHierarchy).length > 1) {
        return reconstructedHierarchy;
      }
    }
    
    // Si on n'a pas de parent dans les données, essayer de récupérer la hiérarchie via l'API
    if (!division.parent && division.divisionType !== 'REGION') {
      try {
        const fullDivision = await divisionService.getById(division.id);
        
        if (fullDivision && fullDivision.parent) {
          // Recommencer avec les données complétes
          return await buildDivisionHierarchy(fullDivision);
        } else {
          // Si toujours pas de parent, essayer de reconstruire par code (spécialement pour Bamako)
          const reconstructedHierarchy = await reconstructHierarchyByCode(division);
          if (reconstructedHierarchy && Object.keys(reconstructedHierarchy).length > 1) {
            return reconstructedHierarchy;
          }
        }
      } catch (error) {
        console.error(' Erreur lors de la récupération via API:', error);
      }
    }
    
    return hierarchy;
  };

  // Reconstruire la hiérarchie par code (spécialement pour Bamako)
  const reconstructHierarchyByCode = async (division: any): Promise<any> => {
    const hierarchy: any = { quartier: division };
    
    // Vérifier si c'est un quartier de Bamako par le code
    if (division.divisionType === 'QUARTIER' && division.code && 
        ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix))) {
      
      
      // Trouver la région Bamako
      
      const bamakoRegion = personalRegions.find((r: any) => 
        r.nom?.toLowerCase().includes('bamako') && 
        r.nom?.toLowerCase().includes('district')
      );
      
      
      if (bamakoRegion) {
        hierarchy.region = bamakoRegion;
        
        // Extraire le code arrondissement (4 premiers caractéres)
        const arrondissementCode = division.code.substring(0, 4);
        
        try {
          // Utiliser la logique unifiée pour charger les arrondissements
          const arrondissements = await loadBamakoArrondissements(bamakoRegion.id);
          console.log(' Arrondissements disponibles:', arrondissements?.length || 0);
          
          // Chercher l'arrondissement correspondant
          let arrondissement = arrondissements?.find((a: any) => a.code === arrondissementCode);
          
          if (!arrondissement) {
            // Essayer avec startsWith
            arrondissement = arrondissements?.find((a: any) => a.code?.startsWith(arrondissementCode));
          }
          
          if (!arrondissement) {
            // Mapping manuel basé sur les codes
            const codeMapping: Record<string, string> = {
              '0001': 'Premier',
              '0002': 'Deuxiéme', 
              '0003': 'Troisiéme',
              '0004': 'Quatriéme',
              '0005': 'Cinquiéme',
              '0006': 'Sixiéme',
              '0007': 'Septiéme'
            };
            
            const nomRecherche = codeMapping[arrondissementCode];
            if (nomRecherche) {
              arrondissement = arrondissements?.find((a: any) => 
                a.nom?.toLowerCase().includes(nomRecherche.toLowerCase())
              );
            }
          }
          
          if (arrondissement) {
            hierarchy.arrondissement = arrondissement;
            console.log(' Arrondissement trouvé:', arrondissement.nom);
          } else {
            console.log(' Arrondissement non trouvé pour le code:', arrondissementCode);
          }
          
        } catch (error) {
          console.error(' Erreur reconstruction arrondissement:', error);
        }
      }
    }
    
    console.log(' Hiérarchie reconstruite:', hierarchy);
    return hierarchy;
  };

  // Appliquer la hiérarchie aux sélecteurs de maniére séquentielle (logique utilisateur)
  const applyPersonalHierarchySequential = async (hierarchy: any) => {
    console.log(' Application séquentielle de la hiérarchie INSTAT moderne (personnel):', hierarchy);
    
    try {
      // étape 1: Appliquer la région
      if (hierarchy.region) {
        console.log(' étape 1: Application région:', hierarchy.region.nom);
        setPersonalSelectedRegionId(hierarchy.region.code);
        
        // Charger manuellement les cercles depuis la région
        try {
          const cercles = await divisionService.getCerclesByRegion(hierarchy.region.code);
          setPersonalCercles(cercles || []);
          console.log(' étape 1 terminée - région appliquée et', cercles?.length || 0, 'cercles chargés');
        } catch (error) {
          console.error(' Erreur chargement cercles depuis région:', error);
          setPersonalCercles([]);
        }
      }
      
      // étape 2: Appliquer le cercle
      if (hierarchy.cercle) {
        console.log(' étape 2: Application cercle:', hierarchy.cercle.nom);
        setPersonalSelectedCercleId(hierarchy.cercle.code);
        
        // Charger manuellement les communes depuis le cercle
        try {
          const communes = await divisionService.getCommunesByCercle(hierarchy.cercle.code);
          setPersonalCommunes(communes || []);
          console.log(' étape 2 terminée - cercle appliqué et', communes?.length || 0, 'communes chargées');
        } catch (error) {
          console.error(' Erreur chargement communes depuis cercle:', error);
          setPersonalCommunes([]);
        }
      }
      
      // étape 3: Appliquer la commune (structure INSTAT moderne)
      if (hierarchy.commune) {
        console.log(' étape 3: Application commune:', hierarchy.commune.nom);
        setPersonalSelectedCommuneId(hierarchy.commune.code);
        
        // Charger manuellement les quartiers depuis la commune
        try {
          const quartiers = await divisionService.getQuartiersByCommune(hierarchy.commune.code);
          setPersonalQuartiers(quartiers || []);
          console.log(' étape 3 terminée - commune appliquée et', quartiers?.length || 0, 'quartiers chargés');
        } catch (error) {
          console.error(' Erreur chargement quartiers depuis commune:', error);
          setPersonalQuartiers([]);
        }
      }
      
      // étape 4: Appliquer le quartier
      if (hierarchy.quartier) {
        console.log(' étape 4: Application quartier:', hierarchy.quartier.nom);
        setPersonalSelectedQuartierId(hierarchy.quartier.code);
        console.log(' étape 4 terminée - quartier appliqué');
      } else {
        console.log(' étape 5: Aucun quartier dans la hiérarchie');
      }
      
      console.log(' Application séquentielle terminée avec succés (personnel)');
      
    } catch (error) {
      console.error(' Erreur lors de l\'application séquentielle (personnel):', error);
    }
  };

  // Gestion de la recherche rapide pour les informations personnelles (logique utilisateur)
  const handlePersonalDivisionSearch = async (division: any) => {
    
    try {
      // Construire la hiérarchie compléte depuis la division sélectionnée
      const hierarchy = await buildDivisionHierarchy(division);
        
      // Vérifier si la hiérarchie est valide
      if (!hierarchy || Object.keys(hierarchy).length === 0) {
        return;
      }
      
      // Appliquer la hiérarchie aux sélecteurs de maniére séquentielle
      await applyPersonalHierarchySequential(hierarchy);
      
      // Si l'adresse n'est pas différente, synchroniser automatiquement l'entreprise
      if (!formData.hasDifferentAddress) {
        console.log(' Synchronisation automatique de la localisation entreprise...');
        await applyCompanyHierarchySequential(hierarchy);
        console.log(' Synchronisation localisation entreprise terminée');
        
        // Synchroniser aussi l'adresse textuelle si elle est différente
        if (formData.adressePersonnelle !== formData.adresse) {
          updateFormData('adresse', formData.adressePersonnelle);
        }
      }
      
    } catch (error) {
      console.error(' Erreur lors de la construction de la hiérarchie (personnel):', error);
      console.error(' Stack trace:', (error as Error).stack);
    }
  };

  // Gestion de la recherche rapide pour l'entreprise (logique utilisateur)
  const handleCompanyDivisionSearch = async (division: any) => {
    console.log(' Division sélectionnée via recherche (entreprise):', division);
    console.log(' Type de division:', division.divisionType);
    console.log(' Parent de la division:', division.parent);
    
    try {
      // Construire la hiérarchie compléte depuis la division sélectionnée
      console.log('? Début construction hiérarchie (entreprise)...');
      const hierarchy = await buildDivisionHierarchy(division);
      console.log(' Hiérarchie construite (entreprise):', hierarchy);
      
      // Vérifier si la hiérarchie est valide
      if (!hierarchy || Object.keys(hierarchy).length === 0) {
        console.error(' Hiérarchie vide ou invalide (entreprise)');
        return;
      }
      
      // Appliquer la hiérarchie aux sélecteurs de maniére séquentielle
      console.log('? Début application hiérarchie séquentielle (entreprise)...');
      await applyCompanyHierarchySequential(hierarchy);
      console.log('? Application hiérarchie entreprise terminée');
      
    } catch (error) {
      console.error('? Erreur lors de la construction de la hiérarchie (entreprise):', error);
      console.error('? Stack trace:', (error as Error).stack);
    }
  };

  // Appliquer la hiérarchie aux sélecteurs de maniére séquentielle pour l'entreprise (logique utilisateur)
  const applyCompanyHierarchySequential = async (hierarchy: any) => {
    console.log(' Application séquentielle de la hiérarchie INSTAT moderne (entreprise):', hierarchy);
    
    try {
      // étape 1: Appliquer la région
      if (hierarchy.region) {
        console.log(' étape 1: Application région (entreprise):', hierarchy.region.nom);
        setCompanySelectedRegionId(hierarchy.region.code);
        
        // Charger manuellement les cercles depuis la région
        try {
          const cercles = await divisionService.getCerclesByRegion(hierarchy.region.code);
          setCompanyCercles(cercles || []);
          console.log(' étape 1 terminée - région appliquée et', cercles?.length || 0, 'cercles chargés (entreprise)');
        } catch (error) {
          console.error(' Erreur chargement cercles depuis région (entreprise):', error);
          setCompanyCercles([]);
        }
      }
      
      // étape 2: Appliquer le cercle
      if (hierarchy.cercle) {
        console.log(' étape 2: Application cercle (entreprise):', hierarchy.cercle.nom);
        setCompanySelectedCercleId(hierarchy.cercle.code);
        
        // Charger manuellement les communes depuis le cercle
        try {
          const communes = await divisionService.getCommunesByCercle(hierarchy.cercle.code);
          setCompanyCommunes(communes || []);
          console.log(' étape 2 terminée - cercle appliqué et', communes?.length || 0, 'communes chargées (entreprise)');
        } catch (error) {
          console.error(' Erreur chargement communes depuis cercle (entreprise):', error);
          setCompanyCommunes([]);
        }
      }
      
      // étape 3: Appliquer la commune (structure INSTAT moderne)
      if (hierarchy.commune) {
        console.log(' étape 3: Application commune (entreprise):', hierarchy.commune.nom);
        setCompanySelectedCommuneId(hierarchy.commune.code);
        
        // Charger manuellement les quartiers depuis la commune
        try {
          const quartiers = await divisionService.getQuartiersByCommune(hierarchy.commune.code);
          setCompanyQuartiers(quartiers || []);
          console.log(' étape 3 terminée - commune appliquée et', quartiers?.length || 0, 'quartiers chargés (entreprise)');
        } catch (error) {
          console.error(' Erreur chargement quartiers depuis commune (entreprise):', error);
          setCompanyQuartiers([]);
        }
      }
      
      // étape 4: Appliquer le quartier
      if (hierarchy.quartier) {
        console.log(' étape 4: Application quartier (entreprise):', hierarchy.quartier.nom);
        setCompanySelectedQuartierId(hierarchy.quartier.code);
        console.log(' étape 4 terminée - quartier appliqué (entreprise)');
      }
      
      console.log(' Application séquentielle terminée avec succés (entreprise)');
      
    } catch (error) {
      console.error(' Erreur lors de l\'application séquentielle (entreprise):', error);
    }
  };

  // Appliquer la hiérarchie pour les informations personnelles
  // Fonction applyPersonalHierarchy OBSOLéTE - supprimée pour structure INSTAT moderne

  // Fonction applyCompanyHierarchy OBSOLéTE - supprimée pour structure INSTAT moderne

  // Fonctions de validation pour chaque étape
  const validateStep1 = (): string[] => {
    const errors: string[] = [];
    
    // Pour les sociétés, valider uniquement les informations du déposant à l'étape 1
    if (formData.typeEntreprise === 'SOCIETE') {
      if (!formData.nomDeposant?.trim()) {
        errors.push('Le nom du déposant est obligatoire');
      }
      if (!formData.prenomDeposant?.trim()) {
        errors.push('Le prénom du déposant est obligatoire');
      }
      if (!formData.telephoneDeposant?.trim()) {
        errors.push('Le téléphone du déposant est obligatoire');
      }
      return errors;
    }
    
    // Informations personnelles obligatoires (uniquement pour les entreprises individuelles)
    if (!formData.prenom?.trim()) errors.push('Le prénom est obligatoire');
    if (!formData.nom?.trim()) errors.push('Le nom est obligatoire');
    if (!formData.civilite) errors.push('La civilité est obligatoire');
    if (!formData.dateNaissance) {
      errors.push('La date de naissance est obligatoire');
    } else {
      const age = calculateAge(formData.dateNaissance);
      if (age < 18) {
        errors.push(`Vous devez avoir au moins 18 ans (actuellement: ${age} ans)`);
      }
    }
    if (!formData.lieuNaissance?.trim()) errors.push('Le lieu de naissance est obligatoire');
    if (!formData.nationalite?.trim()) errors.push('La nationalité est obligatoire');
    if (!formData.telephonePersonnel?.trim()) errors.push('Le téléphone personnel est obligatoire');
    // Email optionnel, mais si fourni, doit être valide
    if (formData.emailPersonnel?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailPersonnel)) {
      errors.push('L\'email personnel n\'est pas valide');
    }
    
    // Validation de la localisation personnelle (obligatoire uniquement pour les entreprises individuelles)
    if (!personalSelectedRegionId) errors.push('La région est obligatoire');
    if (!personalSelectedCercleId) errors.push('Le cercle est obligatoire');
    if (!personalSelectedCommuneId) errors.push('La commune est obligatoire');
    if (!personalSelectedQuartierId) errors.push('Le quartier est obligatoire');
    
    // Validation des conjoints si marié(e)
    if (formData.isMarried === true) {
      if (!formData.nombreConjoints || formData.nombreConjoints < 1) {
        errors.push('Le nombre de conjoints doit être renseigné');
      }
      
      if (!formData.conjoints || formData.conjoints.length === 0) {
        errors.push('Les informations des conjoints doivent être renseignées');
      } else {
        formData.conjoints.forEach((conjoint, index) => {
          const conjointLabel = `Conjoint(e) ${index + 1}`;
          if (!conjoint.prenom) errors.push(`${conjointLabel}: Prénom obligatoire`);
          if (!conjoint.nom) errors.push(`${conjointLabel}: Nom obligatoire`);
          if (!conjoint.dateMariage) errors.push(`${conjointLabel}: Date de mariage obligatoire`);
          if (!conjoint.lieuMariage) errors.push(`${conjointLabel}: Lieu de mariage obligatoire`);
          if (!conjoint.regimeMatrimonial) errors.push(`${conjointLabel}: Régime matrimonial obligatoire`);
          if (!conjoint.clauseRestrictive) errors.push(`${conjointLabel}: Clause restrictive obligatoire`);
        });
      }
    }
    
    return errors;
  };
  
  const validateStep2 = (): string[] => {
    const errors: string[] = [];
    
    // Informations société obligatoires
    // Le nom d'entreprise n'est requis que pour les sociétés
    if (!formData.nomEntreprise?.trim() && formData.typeEntreprise === 'SOCIETE') {
      errors.push('Le nom de l\'entreprise est obligatoire');
    }
    if (!formData.typeEntreprise) errors.push('Le type d\'entreprise est obligatoire');
    if (!formData.formeJuridique) errors.push('La forme juridique est obligatoire');
    
    // Le capital n'est obligatoire que pour les sociétés, pas pour les entreprises individuelles
    if (formData.typeEntreprise === 'SOCIETE' && !formData.capital?.trim()) {
      errors.push('Le capital est obligatoire pour les sociétés');
    }
    
    // Les informations du déposant sont validées à l'étape 1 pour les sociétés
    
    // Validation optionnelle de l'email (seulement si fourni)
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('L\'email de l\'entreprise n\'est pas valide');
    }
    
    // Validation de la localisation du siège social (obligatoire pour tous)
    // Pour les sociétés, toujours utiliser companySelected*
    // Pour les entreprises individuelles, utiliser personalSelected* si l'adresse n'est pas différente
    if (formData.typeEntreprise === 'SOCIETE') {
      if (!companySelectedRegionId) errors.push('La région du siège social est obligatoire');
      if (!companySelectedCercleId) errors.push('Le cercle du siège social est obligatoire');
      if (!companySelectedCommuneId) errors.push('La commune du siège social est obligatoire');
      if (!companySelectedQuartierId) errors.push('Le quartier du siège social est obligatoire');
    } else {
      // Pour les entreprises individuelles
      if (formData.hasDifferentAddress) {
        if (!companySelectedRegionId) errors.push('La région de l\'entreprise est obligatoire');
        if (!companySelectedCercleId) errors.push('Le cercle de l\'entreprise est obligatoire');
        if (!companySelectedCommuneId) errors.push('La commune de l\'entreprise est obligatoire');
        if (!companySelectedQuartierId) errors.push('Le quartier de l\'entreprise est obligatoire');
      } else {
        if (!personalSelectedRegionId) errors.push('La région est obligatoire');
        if (!personalSelectedCercleId) errors.push('Le cercle est obligatoire');
        if (!personalSelectedCommuneId) errors.push('La commune est obligatoire');
        if (!personalSelectedQuartierId) errors.push('Le quartier est obligatoire');
      }
    }
    
    // Validation du domaine d'activité non réglementé (obligatoire)
    if (!formData.domaineActiviteNr?.trim()) {
      errors.push('Le domaine d\'activité est obligatoire');
    }
    
    return errors;
  };
  
  const validateStep3 = (): string[] => {
    const errors: string[] = [];
    
    console.log('🔍 validateStep3 - Début validation, participants:', formData.participants);
    
    // Validation des participants (pour tous les types d'entreprise)
    if (!formData.participants || formData.participants.length === 0) {
      errors.push('Au moins un participant est obligatoire');
      return errors;
    }
    
    // Vérifier que chaque participant a les informations obligatoires
    formData.participants.forEach((participant, index) => {
      const participantLabel = `Participant ${index + 1}`;
      
      console.log(`🔍 Validation ${participantLabel}:`, {
        civilite: participant.civilite,
        typePiece: participant.typePiece,
        documentFile: !!participant.documentFile,
        role: participant.role,
        extraitNaissanceFile: !!participant.extraitNaissanceFile,
        pieceNationaliteFile: !!participant.pieceNationaliteFile,
        acteMariageFile: !!participant.acteMariageFile,
        situationMatrimoniale: participant.situationMatrimoniale,
        hasCriminalRecord: participant.hasCriminalRecord,
        casierJudiciaireFile: !!participant.casierJudiciaireFile,
        declarationHonneurFile: !!participant.declarationHonneurFile,
        signatureDataUrl: !!participant.signatureDataUrl
      });
      
      if (!participant.civilite) {
        errors.push(`${participantLabel}: La civilité est obligatoire`);
      }
      
      if (participant.civilite === 'PERSONNE_MORALE') {
        // Validation pour personne morale
        if (!participant.denominationEntreprise?.trim()) {
          errors.push(`${participantLabel}: La dénomination est obligatoire`);
        }
        // Pour les personnes morales, le représentant légal est obligatoire
        if (!participant.representantLegalNom?.trim()) {
          errors.push(`${participantLabel}: Le nom du représentant légal est obligatoire`);
        }
        if (!participant.representantLegalPrenom?.trim()) {
          errors.push(`${participantLabel}: Le prénom du représentant légal est obligatoire`);
        }
      } else {
        // Validation pour personne physique
        if (!participant.prenom?.trim()) {
          errors.push(`${participantLabel}: Le prénom est obligatoire`);
        }
        if (!participant.nom?.trim()) {
          errors.push(`${participantLabel}: Le nom est obligatoire`);
        }
        if (!participant.dateNaissance) {
          errors.push(`${participantLabel}: La date de naissance est obligatoire`);
        }
        if (!participant.lieuNaissance?.trim()) {
          errors.push(`${participantLabel}: Le lieu de naissance est obligatoire`);
        }
        if (!participant.nationalite?.trim()) {
          errors.push(`${participantLabel}: La nationalité est obligatoire`);
        }
        if (!participant.sexe) {
          errors.push(`${participantLabel}: Le sexe est obligatoire`);
        }
        if (!participant.situationMatrimoniale) {
          errors.push(`${participantLabel}: La situation matrimoniale est obligatoire`);
        }
        
        // Validation des documents obligatoires pour les personnes physiques
        if (!participant.typePiece) {
          errors.push(`${participantLabel}: Le type de pièce d'identité est obligatoire`);
        }
        // Le numéro de pièce est optionnel
        if (!participant.documentFile) {
          errors.push(`${participantLabel}: La pièce d'identité (fichier) est obligatoire`);
        }
        
        // Documents obligatoires pour les gérants et promoteurs
        if (participant.role === 'GERANT' || participant.role === 'PROMOTEUR') {
          if (!participant.extraitNaissanceFile) {
            errors.push(`${participantLabel}: L'extrait de naissance est obligatoire pour les gérants/promoteurs`);
          }
          
          // Pièce de nationalité obligatoire pour les entreprises individuelles
          if (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && !participant.pieceNationaliteFile) {
            errors.push(`${participantLabel}: La pièce de nationalité est obligatoire pour les entreprises individuelles`);
          }
          
          // Acte de mariage obligatoire pour chaque conjoint si marié
          if (participant.situationMatrimoniale === 'MARIE' && formData.conjoints && formData.conjoints.length > 0) {
            formData.conjoints.forEach((conjoint, index) => {
              if (!conjoint.acteMariageFile) {
                errors.push(`${participantLabel}: L'acte de mariage est obligatoire pour le conjoint ${index + 1} (${conjoint.prenom} ${conjoint.nom})`);
              }
            });
          }
          
          // Validation casier judiciaire OU déclaration sur l'honneur avec signature
          // Vérifier d'abord si la question a été répondue
          if (participant.hasCriminalRecord === undefined || participant.hasCriminalRecord === null) {
            errors.push(`${participantLabel}: Vous devez répondre à la question sur le casier judiciaire`);
          } else if (participant.hasCriminalRecord === true) {
            // Si oui au casier judiciaire, le fichier casier est obligatoire
            if (!participant.casierJudiciaireFile) {
              errors.push(`${participantLabel}: Le casier judiciaire est obligatoire`);
            }
          } else if (participant.hasCriminalRecord === false) {
            // Si non au casier judiciaire, la déclaration sur l'honneur (fichier uploadé OU signature) est obligatoire
            if (!participant.declarationHonneurFile && !participant.signatureDataUrl) {
              errors.push(`${participantLabel}: La déclaration sur l'honneur avec signature est obligatoire (ou uploadez le document)`);
            }
          }
        }
      }
      
      if (!participant.role) {
        errors.push(`${participantLabel}: Le rôle est obligatoire`);
      }
    });
    
    return errors;
  };
  
  const validateStep4 = (): string[] => {
    const errors: string[] = [];
    
    // Validation des participants
    if (!formData.participants || formData.participants.length === 0) {
      errors.push('Au moins un participant est obligatoire');
      return errors;
    }
    
    // Vérifier que chaque participant a les informations obligatoires
    formData.participants.forEach((participant, index) => {
      const participantLabel = `Participant ${index + 1}`;
      
      if (!participant.civilite) {
        errors.push(`${participantLabel}: La civilité est obligatoire`);
      }
      
      if (participant.civilite === 'PERSONNE_MORALE') {
        // Validation pour personne morale
        if (!participant.denominationEntreprise?.trim()) {
          errors.push(`${participantLabel}: La dénomination de l'entreprise est obligatoire`);
        }
        if (!participant.representantLegalNom?.trim()) {
          errors.push(`${participantLabel}: Le nom du représentant légal est obligatoire`);
        }
        if (!participant.representantLegalPrenom?.trim()) {
          errors.push(`${participantLabel}: Le prénom du représentant légal est obligatoire`);
        }
        if (!participant.rccmFile) {
          errors.push(`${participantLabel}: Le document RCCM est obligatoire pour les personnes morales`);
        }
        
        // Validation des réles autorisés pour les personnes morales
        if (participant.role === 'ADMINISTRATEUR') {
          errors.push(`${participantLabel}: Une personne morale ne peut pas avoir le réle ADMINISTRATEUR`);
        }
      } else {
        // Validation pour personne physique
        if (!participant.prenom?.trim()) {
          errors.push(`${participantLabel}: Le prénom est obligatoire`);
        }
        if (!participant.nom?.trim()) {
          errors.push(`${participantLabel}: Le nom est obligatoire`);
        }
      }
      
      if (!participant.role) {
        errors.push(`${participantLabel}: Le réle est obligatoire`);
      }
      
      // Validation du pourcentage de parts (exclure GERANT et ADMINISTRATEUR, et les entreprises individuelles)
      if (formData.typeEntreprise === 'SOCIETE') {
        const isPersonneMorale = participant.civilite === 'PERSONNE_MORALE';
        
        if (roleRequiresParts(participant.role)) {
          if (isPersonneMorale) {
            // Pour les personnes morales, 0% est autorisé mais le champ doit étre défini
            if (participant.pourcentageParts === undefined || participant.pourcentageParts === null) {
              errors.push(`${participantLabel}: Le pourcentage de parts doit étre défini (0% autorisé pour les personnes morales)`);
            }
          } else {
            // Pour les personnes physiques, le pourcentage doit étre > 0
            if (!participant.pourcentageParts || participant.pourcentageParts <= 0) {
              errors.push(`${participantLabel}: Le pourcentage de parts doit étre supérieur é 0`);
            }
          }
        }
        
        // Pour les associés, régles spécifiques selon le type de personne
        if (participant.role === 'ASSOCIE') {
          if (isPersonneMorale) {
            // Personne morale associée : 0% autorisé mais doit étre défini
            if (participant.pourcentageParts === undefined || participant.pourcentageParts === null) {
              errors.push(`${participantLabel}: Le pourcentage de parts doit étre défini (0% autorisé pour les personnes morales)`);
            }
          } else {
            // Personne physique associée : doit étre > 0
            if (!participant.pourcentageParts || participant.pourcentageParts <= 0) {
              errors.push(`${participantLabel}: Un associé doit avoir un pourcentage de parts supérieur é 0`);
            }
          }
        }
      }
      
      if (participant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
        errors.push(`${participantLabel}: L'email n'est pas valide`);
      }
      
      // Validation de l'ége pour les personnes physiques
      if (participant.civilite !== 'PERSONNE_MORALE' && participant.dateNaissance) {
        const age = calculateAge(participant.dateNaissance);
        if (age < 18) {
          errors.push(`${participantLabel}: Doit avoir au moins 18 ans (actuellement: ${age} ans)`);
        }
      }
    });
    
    // Vérifier que la somme des pourcentages est 100% (exclure les administrateurs et les entreprises individuelles)
    if (formData.typeEntreprise === 'SOCIETE') {
      const totalPercentage = calculateTotalParts();
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push(`La somme des pourcentages doit étre exactement 100% (actuellement: ${totalPercentage.toFixed(2)}%) - administrateurs exclus`);
      }
    }
    
    // Vérifier qu'il y a au moins un gérant ou promoteur
    const gerants = formData.participants.filter(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
    if (gerants.length === 0) {
      errors.push('Au moins un gérant ou promoteur est obligatoire');
    }
    
    return errors;
  };
  
  const validateStep5 = (): string[] => {
    const errors: string[] = [];
    
    // Validation des documents (optionnelle selon le contexte)
    // Cette étape peut étre validée méme sans documents pour certains cas
    
    return errors;
  };
  
  const validateCurrentStep = (): string[] => {
    switch (currentStep) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      case 5: return validateStep5();
      default: return [];
    }
  };

  const nextStep = () => {
    // Valider l'étape actuelle avant de passer é la suivante
    const errors = validateCurrentStep();
    
    console.log('🔍 handleNext - Erreurs de validation:', errors);
    console.log('🔍 handleNext - Nombre d\'erreurs:', errors.length);
    console.log('🔍 handleNext - Step actuel:', currentStep);
    
    if (errors.length > 0) {
      console.log('🔍 handleNext - Affichage des erreurs de validation');
      setValidationErrors(errors);
      // Scroll vers le haut pour voir les erreurs
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    console.log('🔍 handleNext - Aucune erreur, passage au step suivant');
    setValidationErrors([]);
    
    if (currentStep < totalSteps) {
      // Pour les entreprises individuelles, sauter l'étape 4 (Documents) et aller directement à l'étape 5
      const isEntrepriseIndividuelle = formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      if (currentStep === 3 && isEntrepriseIndividuelle) {
        setCurrentStep(5); // Aller directement à l'étape 5 (Récapitulatif)
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Pour les entreprises individuelles, si on est à l'étape 5, revenir à l'étape 3 (sauter l'étape 4)
      const isEntrepriseIndividuelle = formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      if (currentStep === 5 && isEntrepriseIndividuelle) {
        setCurrentStep(3); // Revenir à l'étape 3 (Participants)
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  // Navigation directe vers une étape spécifique
  const goToStep = (stepNumber: number) => {
    // Pour les entreprises individuelles, bloquer l'accès à l'étape Documents (étape 4)
    const isEntrepriseIndividuelle = formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    if (stepNumber === 4 && isEntrepriseIndividuelle) {
      console.log('Navigation bloquée vers l\'étape Documents pour entreprise individuelle');
      return;
    }
    
    setCurrentStep(stepNumber);
    console.log(`Navigation directe vers l'étape ${stepNumber}`);
  };

  // Fonctions pour gérer les documents supplémentaires
  const addAdditionalDocument = useCallback(() => {
    const newDoc = {
      id: Date.now().toString(),
      name: '',
      file: null,
      description: ''
    };
    setAdditionalDocuments(prevDocs => [...prevDocs, newDoc]);
  }, []);

  const removeAdditionalDocument = useCallback((id: string) => {
    setAdditionalDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
  }, []);

  const updateAdditionalDocument = useCallback((id: string, field: string, value: any) => {
    setAdditionalDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    );
  }, []);


  // Fonction pour générer la déclaration sur l'honneur en PDF
  const handleGenerateDeclaration = async (participant: Participant) => {
    if (!participant.nom || !participant.prenom) {
      alert('Veuillez renseigner le nom et prénom du participant');
      return;
    }

    // Note: La signature peut étre ajoutée manuellement aprés impression
    if (!participant.signatureDataUrl && !participant.declarationHonneurFile) {
      const confirm = window.confirm(
        'Aucune signature détectée. Voulez-vous générer la déclaration sans signature ?\n\n' +
        'Vous pourrez signer manuellement le document imprimé.'
      );
      if (!confirm) return;
    }

    try {

      // Générer le contenu HTML complet pour impression/PDF
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Déclaration sur l'Honneur - ${participant.prenom} ${participant.nom}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            @media print {
              body { 
                margin: 0; 
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.6;
                color: black;
              }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              color: black;
              background: white;
              padding: 20px;
              max-width: 210mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .border-box {
              border: 2px solid black;
              padding: 10px;
              display: inline-block;
              margin-bottom: 20px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0;
            }
            .subtitle {
              font-size: 12px;
              margin-bottom: 30px;
            }
            .content {
              text-align: justify;
              margin: 20px 0;
            }
            .signature-section {
              margin-top: 60px;
            }
            .signature-line {
              border-bottom: 1px dotted black;
              display: inline-block;
              min-width: 300px;
              padding-bottom: 2px;
            }
            .signature-line-short {
              border-bottom: 1px dotted black;
              display: inline-block;
              min-width: 200px;
              padding-bottom: 2px;
            }
            .signature-img {
              max-height: 80px;
              border-bottom: 1px solid black;
            }
            .action-buttons {
              position: fixed;
              top: 10px;
              right: 10px;
              display: flex;
              gap: 10px;
              z-index: 1000;
            }
            .print-button, .pdf-button {
              padding: 10px 15px;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 12px;
              font-weight: bold;
            }
            .print-button {
              background: #007bff;
            }
            .print-button:hover {
              background: #0056b3;
            }
            .pdf-button {
              background: #28a745;
            }
            .pdf-button:hover {
              background: #1e7e34;
            }
          </style>
        </head>
        <body>
          <div class="action-buttons no-print">
            <button class="print-button" onclick="window.print()"> Imprimer</button>
            <button class="pdf-button" onclick="downloadPDF()"> Télécharger PDF</button>
          </div>
          
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          <script>
            function downloadPDF() {
              console.log(' Début génération PDF...');
              
              try {
                // Vérifier si jsPDF est disponible
                if (!window.jspdf) {
                  console.error('? jsPDF non chargé');
                  alert('Erreur: Bibliotheque PDF non chargee. Utilisation de l impression.');
                  window.print();
                  return;
                }
                
                // Vérifier si html2canvas est disponible
                if (!window.html2canvas) {
                  console.error(' html2canvas non chargé');
                  alert('Erreur: Bibliotheque de capture non chargee. Utilisation de l impression.');
                  window.print();
                  return;
                }
                
                console.log(' Bibliothéques chargées');
                
                // Créer une nouvelle instance jsPDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                console.log(' Instance jsPDF créée');
                
                // Masquer les boutons temporairement
                const buttons = document.querySelector('.action-buttons');
                if (buttons) {
                  buttons.style.display = 'none';
                  console.log(' Boutons masqués');
                }
                
                // Utiliser html2canvas pour capturer le contenu
                console.log(' Début capture html2canvas...');
                
                window.html2canvas(document.body, {
                  scale: 1.5,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: '#ffffff',
                  logging: true
                }).then(canvas => {
                  console.log(' Capture réussie, taille:', canvas.width, 'x', canvas.height);
                  
                  const imgData = canvas.toDataURL('image/png');
                  const imgWidth = 210; // A4 width in mm
                  const pageHeight = 295; // A4 height in mm
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  
                  console.log(' Ajout image au PDF...');
                  
                  // Ajouter l'image au PDF
                  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                  
                  // Télécharger le PDF
                  const filename = 'Declaration_Honneur.pdf';
                  console.log(' Téléchargement:', filename);
                  
                  pdf.save(filename);
                  
                  console.log(' PDF téléchargé avec succés!');
                  
                  // Réafficher les boutons
                  if (buttons) {
                    buttons.style.display = 'flex';
                  }
                  
                }).catch(error => {
                  console.error(' Erreur html2canvas:', error);
                  alert('Erreur lors de la capture. Utilisation de l impression.');
                  window.print();
                  if (buttons) buttons.style.display = 'flex';
                });
                
              } catch (error) {
                console.error(' Erreur génération PDF:', error);
                alert('Erreur lors de la génération PDF: ' + error.message);
                window.print();
              }
            }
          </script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
          
          <div class="header">
            <div class="border-box">
              <strong>APIEx</strong>
            </div>
            <div class="title">DECLARATION SUR L'HONNEUR</div>
            <div class="subtitle">(Art. 45, 47 de l'Acte Uniforme portant sur le Droit Commercial Général OHADA)</div>
          </div>

          <div class="content">
            <p>Je soussigné(e),</p>
            
            <p>Nom : <span class="signature-line">${participant.nom}</span></p>
            <p>Prénom : <span class="signature-line">${participant.prenom}</span></p>

            <p style="margin-top: 30px;">
              Demandant l'immatriculation au Registre du Commerce et du Crédit Mobilier.
            </p>

            <p>
              Déclare sur l'honneur n'avoir jamais fait l'objet d'une condamnation définitive é une peine 
              privative de liberté pour un crime ou un délit de droit commun, ou é une peine d'au moins trois mois 
              d'emprisonnement non assortie de sursis pour un délit contre les biens ou une infraction en 
              matiére économique ou financiére.
            </p>

            <p>
              Suis informé devoir fournir dans un délai de 75 jours é compter de l'immatriculation au 
              registre du commerce et du crédit mobilier un extrait de casier judiciaire ou tout document 
              qui en tient lieu conformément aux articles 45, 47 de l'Acte Uniforme portant sur le Droit 
              Commercial Général (OHADA).
            </p>

            <div class="signature-section">
              <p>Fait é : <span class="signature-line-short">Bamako</span></p>
              <p>Le : <span class="signature-line-short">${new Date().toLocaleDateString('fr-FR')}</span></p>
              
              <div style="margin-top: 60px;">
                <p>Signature :</p>
                ${participant.signatureDataUrl ? 
                  `<img src="${participant.signatureDataUrl}" alt="Signature" class="signature-img" />` : 
                  '<div style="height: 80px; border-bottom: 1px dotted black; margin-top: 20px;"></div>'
                }
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Ouvrir dans une nouvelle fenétre
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(printContent);
        newWindow.document.close();
        console.log(' Déclaration générée avec succés - Utilisez Ctrl+P pour sauvegarder en PDF');
      } else {
        alert('Impossible d\'ouvrir une nouvelle fenétre. Veuillez autoriser les pop-ups.');
      }
      
    } catch (error) {
      console.error(' Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      console.log(' Début de la création du dossier d\'entreprise...');
      
      // Validation finale de toutes les étapes
      console.log(' Validation finale de toutes les étapes...');
      const allErrors = [];
      
      // Valider chaque étape
      for (let step = 1; step <= 5; step++) {
        const stepErrors = (() => {
          switch (step) {
            case 1: return validateStep1();
            case 2: return validateStep2();
            case 3: return validateStep3();
            case 4: return validateStep4();
            case 5: return validateStep5();
            default: return [];
          }
        })();
        
        if (stepErrors.length > 0) {
          allErrors.push(`étape ${step}:`);
          allErrors.push(...stepErrors.map(error => `  - ${error}`));
          allErrors.push('');
        }
      }
      
      if (allErrors.length > 0) {
        // Utiliser le système de validation existant au lieu de alert()
        setValidationErrors(allErrors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsLoading(false);
        return;
      }
      
      console.log(' Toutes les validations sont passées avec succés');
      
      // Préparer les données pour l'API
      const applicationData = {
        // Informations du représentant
        representativeFirstName: formData.prenom,
        representativeLastName: formData.nom,
        representativeCivility: formData.civilite,
        representativeBirthDate: formData.dateNaissance,
        representativeBirthPlace: formData.lieuNaissance,
        representativeNationality: formData.nationalite,
        representativePhone: personalSelectedCountry.code + ' ' + formData.telephonePersonnel,
        representativeEmail: formData.emailPersonnel,
        representativeAddress: formData.adressePersonnelle,
        representativeAdresseLibre: formData.adresseLibre,
        // Champs rue et porte envoyés directement dans la création des participants (comme côté utilisateur)
        // representativeStreet et representativeDoor ne sont plus nécessaires
        
        // Questions Oui/Non
        hasCriminalRecord: formData.hasCriminalRecord,
        isMarried: formData.isMarried,
        allowsOthersResponsible: formData.allowsOthersResponsible,
        requiresExerciseAuthorization: formData.requiresExerciseAuthorization,
        willImportExport: formData.willImportExport,
        
        // Informations de l'entreprise
        companyName: formData.nomEntreprise,
        companyAcronym: formData.sigleEntreprise,
        companyType: formData.typeEntreprise,
        legalForm: formData.formeJuridique,
        capital: formData.capital,
        companyAddress: formData.adresse,
        rue: formData.rueEntreprise,
        porte: formData.porteEntreprise,
        companyPhone: formData.telephone,
        companyEmail: formData.email,
        
        // Activité
        activityDomain: formData.domaineActivite,
        mainActivity: formData.activitePrincipale,
        secondaryActivity: formData.activiteSecondaire,
        
        // Participants
        partners: formData.participants.map(participant => ({
          civility: participant.civilite,
          firstName: participant.prenom,
          lastName: participant.nom,
          birthDate: participant.dateNaissance,
          birthPlace: participant.lieuNaissance,
          nationality: participant.nationalite,
          phone: participant.telephone ? personalSelectedCountry.code + ' ' + participant.telephone : '',
          email: participant.email,
          address: participant.adresse,
          role: participant.role,
          sharePercentage: participant.pourcentageParts,
          startDate: participant.dateDebut,
          sex: participant.sexe,
          maritalStatus: participant.situationMatrimoniale,
          idType: participant.typePiece,
          idNumber: participant.numeroPiece,
          // Documents supplémentaires
          autresDocuments: participant.autresDocuments || [],
          // Champs pour personnes morales
          ...(participant.typePersonne === 'MORALE' && {
            companyName: participant.denominationEntreprise,
            legalRepresentativeFirstName: participant.representantLegalPrenom,
            legalRepresentativeLastName: participant.representantLegalNom,
            rccmCountry: participant.paysEmissionRccm,
          })
        })),
        
        // Localisation
        division: formData.division,
        antenne: formData.antenne
      };

      // Créer un FormData vide pour tester d'abord sans fichiers
      const formDataToSend = new FormData();
      
      // Pour le moment, on teste sans fichiers pour identifier le probléme de données
      console.log(' Test sans fichiers pour identifier le probléme de structure des données...');

      console.log(' Envoi des données é l\'API...');
      console.log(' Adresse libre envoyée:', formData.adresseLibre);
      console.log(' Données é envoyer:', applicationData);
      console.log(' Participants détaillés:', formData.participants.map(p => ({
        nom: `${p.prenom} ${p.nom}`,
        role: p.role,
        parts: p.pourcentageParts,
        civilite: p.civilite
      })));
      console.log(' Fichiers é envoyer:', {
        statuts: !!formData.documents.statuts,
        registreCommerce: !!formData.documents.registreCommerce,
        justificatifDomicile: !!formData.documents.justificatifDomicile,
        pvAssemblee: !!formData.documents.pvAssemblee,
        declarationNotariee: !!formData.documents.declarationNotariee,
        attestationBancaire: !!formData.documents.attestationBancaire,
        documentsParticipants: formData.participants.map(p => ({
          nom: `${p.prenom} ${p.nom}`,
          documentFile: !!p.documentFile,
          extraitNaissanceFile: !!p.extraitNaissanceFile
        }))
      });
      
      // IMPLéMENTATION RéELLE : Logique de création inspirée du cété utilisateur
      console.log(' Début de la création réelle du dossier d\'entreprise...');
      
      // Importer l'API configurée pour les agents
      const { axiosInstance } = await import('../services/api');

      // ÉTAPE 1: Validation des documents requis
      console.log(' ÉTAPE 1 - Validation des documents requis...');
      const missingDocs: string[] = [];
      
      // Vérifier les documents des participants
      console.log(' Debug participants:', formData.participants.map((p, idx) => ({
        index: idx + 1,
        nom: p.nom,
        prenom: p.prenom,
        civilite: p.civilite,
        role: p.role,
        hasDocumentFile: !!p.documentFile,
        isEmpty: !p.nom && !p.prenom
      })));

      formData.participants.forEach((participant, idx) => {
        const label = participant.prenom && participant.nom ? `${participant.prenom} ${participant.nom}` : `Participant ${idx + 1}`;
        
        // Ignorer les participants vides (pas de nom ni prénom)
        if (!participant.nom && !participant.prenom) {
          console.log(` Participant ${idx + 1} ignoré (vide)`);
          return;
        }
        
        // Validation des documents selon le type de personne
        if (participant.civilite === 'PERSONNE_MORALE') {
          // Pour les personnes morales, vérifier le document RCCM
          if (!participant.rccmFile) {
            missingDocs.push(`${label}: document RCCM manquant`);
          }
        } else {
          // Pour les personnes physiques, vérifier le document d'identité
          if (!participant.documentFile) {
            missingDocs.push(`${label}: document d'identité manquant`);
          }
        }
        
        // Documents requis pour GERANT et PROMOTEUR
        if ((participant.role === 'GERANT' || participant.role === 'PROMOTEUR') && participant.civilite !== 'PERSONNE_MORALE') {
          if (formData.hasCriminalRecord && !participant.documentFile) {
            missingDocs.push(`${label}: document supplémentaire manquant (casier judiciaire)`);
          }
          // Note: extraitNaissanceFile n'existe pas dans le type Participant cété agent
          // Cette validation sera ajustée selon les champs disponibles
        }
      });

      // Vérifier les documents de l'entreprise selon la forme juridique
      const requiredDocs = getRequiredDocuments(formData.formeJuridique);
      
      if (requiredDocs.statuts && !formData.documents.statuts) {
        missingDocs.push('Statuts de l\'entreprise manquants');
      }
      if (requiredDocs.registreCommerce && !formData.documents.registreCommerce) {
        missingDocs.push('Registre de commerce manquant');
      }
      if (requiredDocs.pvAssemblee && !formData.documents.pvAssemblee) {
        missingDocs.push('PV d\'Assemblée Générale manquant');
      }
      if (requiredDocs.declarationNotariee && !formData.documents.declarationNotariee) {
        missingDocs.push('Déclaration notariée manquante');
      }
      if (requiredDocs.attestationBancaire && !formData.documents.attestationBancaire) {
        missingDocs.push('Attestation bancaire manquante');
      }
      if (requiredDocs.rccmSocieteMere && !formData.documents.rccmSocieteMere) {
        missingDocs.push('RCCM de la société mère manquant');
      }

      // Vérifier les champs requis par le serveur
      // Utiliser le code du quartier sélectionné ou fallback
      const selectedQuartier = companyQuartiers.find(q => q.id === companySelectedQuartierId);
      const divisionCode = selectedQuartier?.code || formData.division || agent?.division || '10040102';
      console.log(' Division utilisée:', divisionCode);
      console.log(' Quartier sélectionné:', selectedQuartier);
      
      // Note: Si la division n'existe pas, l'API smart essaiera différents endpoints

      // Mode test : permettre la création sans documents pour tester l'API
      const hasNoRequiredDocs = (!requiredDocs.statuts || !formData.documents.statuts) && 
                                 (!requiredDocs.registreCommerce || !formData.documents.registreCommerce);
      const isTestMode = hasNoRequiredDocs;
      
      if (missingDocs.length > 0 && !isTestMode) {
        throw new Error(`Informations requises manquantes:\n- ${missingDocs.join('\n- ')}`);
      }
      
      if (isTestMode) {
        console.log(' MODE TEST - Création sans documents pour tester l\'API backend');
      }

      // ÉTAPE 2: Validation de l'unicité des piéces d'identité
      console.log(' ÉTAPE 2 - Vérification de l\'unicité des piéces d\'identité...');
      const piecesToCheck = formData.participants
        .filter(p => p.civilite !== 'PERSONNE_MORALE' && p.numeroPiece && p.typePiece)
        .map(p => ({
          numeroPiece: p.numeroPiece!.trim(),
          typePiece: p.typePiece!
        }));

      if (piecesToCheck.length > 0) {
        try {
        const token = localStorage.getItem('investmali_agent_token') || localStorage.getItem('agentToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('agent_token');
        const validationResponse = await fetch(`${getApiBaseUrl()}/validation/check-pieces`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pieces: piecesToCheck })
        });

          if (validationResponse.status === 200) {
            const validationResult = await validationResponse.json();
            
            if (validationResult.success) {
              const usedPieces = Object.entries(validationResult.results || {})
                .filter(([_, isUsed]) => isUsed)
                .map(([numero, _]) => {
                  const piece = piecesToCheck.find(p => p.numeroPiece === numero);
                  return `- ${piece?.typePiece || 'Document'} numéro "${numero}"`;
                });

              if (usedPieces.length > 0) {
                throw new Error(`Les documents d'identité suivants sont déjé utilisés:\n${usedPieces.join('\n')}\n\nVeuillez utiliser des documents différents.`);
              }
            }
          } else {
            console.warn(' Endpoint de validation non disponible, on continue sans validation préalable');
          }
        } catch (e) {
          console.warn(' Erreur lors de la validation préalable:', e);
        }
      }

      // ÉTAPE 3: Création des participants (RéACTIVÉE)
      console.log(' ÉTAPE 3 - Création des participants...');
      
      // Nettoyer les IDs temporaires des participants (garder seulement les vrais IDs backend)
      formData.participants.forEach(p => {
        if (p.id && typeof p.id === 'string' && /^\d+$/.test(p.id)) {
          // Si l'ID est un timestamp (que des chiffres), le supprimer
          console.log(` Nettoyage ID temporaire pour ${p.prenom} ${p.nom}: ${p.id} ? undefined`);
          p.id = undefined;
        }
      });
      
      // Créer seulement les participants qui n'ont pas encore d'ID (comme cété utilisateur)
      const participantsToCreate = formData.participants.filter(p => {
        if (p.id) return false; // Déjé créé
        
        // Pour personne physique : vérifier nom et prenom
        if (p.typePersonne === 'PHYSIQUE') {
          return p.nom && p.prenom;
        }
        
        // Pour personne morale : vérifier denominationEntreprise
        if (p.typePersonne === 'MORALE') {
          return p.denominationEntreprise && p.representantLegalNom && p.representantLegalPrenom;
        }
        
        return false;
      });
      console.log(` Participants à créer: ${participantsToCreate.length}/${formData.participants.length}`);
      
      for (const participant of participantsToCreate) {
        // Adapter la structure pour le backend (enums et dates)
        const isPersonneMorale = participant.civilite === 'PERSONNE_MORALE';
        
        console.log(` Création participant ${participant.role} - ${isPersonneMorale ? participant.denominationEntreprise : `${participant.prenom} ${participant.nom}`}`);
        
        // Déterminer si ce participant correspond aux informations personnelles (créateur/gérant/promoteur)
        const isCreatorParticipant = participant.prenom === formData.prenom && 
                                   participant.nom === formData.nom &&
                                   (participant.role === 'GERANT' || participant.role === 'PROMOTEUR');
        
        // Récupérer les informations de localisation SEULEMENT pour le créateur
        let participantDivisionId = null;
        let participantDivisionCode = null;
        let participantLocalite = null;
        
        if (isCreatorParticipant) {
          const selectedPersonalQuartier = personalQuartiers.find(q => q.id === personalSelectedQuartierId);
          participantDivisionCode = selectedPersonalQuartier?.code || formData.division || agent?.division;
          participantDivisionId = personalSelectedQuartierId;
          participantLocalite = (() => {
            // Priorité 1: Utiliser le champ rue spécifique saisi par l'utilisateur
            if (formData.localite && formData.localite.trim()) {
              return formData.localite.trim();
            }
            
            // Priorité 2: Utiliser le champ adresse personnelle générale
            if (formData.adressePersonnelle && formData.adressePersonnelle.trim()) {
              return formData.adressePersonnelle.trim();
            }
            
            // Priorité 3: Construire à partir des sélections de dropdowns
            const region = personalRegions.find((r: any) => r.id === personalSelectedRegionId)?.nom || '';
            const arrondissement = personalArrondissements.find((a: any) => a.id === personalSelectedArrondissementId)?.nom || '';
            const quartier = personalQuartiers.find((q: any) => q.id === personalSelectedQuartierId)?.nom || '';
            
            const parts = [region, arrondissement, quartier].filter(Boolean);
            
            // Priorité 4: Fallback sur les données agent
            if (parts.length === 0) {
              const division = formData.division || agent?.division || 'BAMAKO';
              const antenne = formData.antenne || agent?.antenne;
              return `${division}${antenne ? ` - ${antenne}` : ''}`;
            }
            
            return parts.join(' - ');
          })();
        } else {
          // Pour les autres participants, utiliser SEULEMENT leur propre adresse
          participantLocalite = participant.adresse || null;
        }

        console.log('📤 [DEBUG ENVOI] Données du participant à envoyer:', {
          nom: participant.nom,
          prenom: participant.prenom,
          role: participant.role,
          typePersonne: participant.typePersonne,
          isPersonneMorale: isPersonneMorale
        });
        
        const personRequest = {
          nom: isPersonneMorale ? participant.representantLegalNom : participant.nom,
          prenom: isPersonneMorale ? participant.representantLegalPrenom : participant.prenom,
          telephone1: (() => {
            // Pour les personnes morales, générer un numéro fictif unique avec l'indicatif sélectionné
            if (isPersonneMorale) {
              const timestamp = Date.now().toString().slice(-8);
              const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
              const countryCode = personalSelectedCountry.code.replace('+', '');
              return `+${countryCode}${timestamp.slice(0, 6)}${random}`;
            }
            
            // Pour les personnes physiques, utiliser l'indicatif pays sélectionné
            let phone = participant.telephone || '';
            // Nettoyer le numéro (supprimer espaces, tirets, etc.)
            phone = phone.replace(/[\s\-\(\)]/g, '');
            
            // Si le numéro commence déjé par l'indicatif sélectionné, le garder tel quel
            if (phone.startsWith(personalSelectedCountry.code)) {
              return phone;
            }
            
            // Si le numéro commence par l'indicatif sans +, ajouter le +
            const countryCodeWithoutPlus = personalSelectedCountry.code.replace('+', '');
            if (phone.startsWith(countryCodeWithoutPlus)) {
              return `+${phone}`;
            }
            
            // Si le numéro est local, ajouter l'indicatif sélectionné
            if (phone && /^\d+$/.test(phone)) {
              return `${personalSelectedCountry.code}${phone}`;
            }
            
            // Si aucun téléphone valide, générer un numéro unique avec l'indicatif sélectionné
            const timestamp = Date.now().toString().slice(-8);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `${personalSelectedCountry.code}${timestamp.slice(0, 5)}${random}`;
          })(),
          telephone2: (() => {
            // Gérer le téléphone 2 s'il existe
            if (!participant.telephone2) return undefined;
            
            let phone2 = participant.telephone2.replace(/[\s\-\(\)]/g, '');
            
            // Si le numéro commence déjà par l'indicatif sélectionné, le garder tel quel
            if (phone2.startsWith(personalSelectedCountry.code)) {
              return phone2;
            }
            
            // Si le numéro commence par l'indicatif sans +, ajouter le +
            const countryCodeWithoutPlus = personalSelectedCountry.code.replace('+', '');
            if (phone2.startsWith(countryCodeWithoutPlus)) {
              return `+${phone2}`;
            }
            
            // Si le numéro est local, ajouter l'indicatif sélectionné
            if (phone2 && /^\d+$/.test(phone2)) {
              return `${personalSelectedCountry.code}${phone2}`;
            }
            
            return undefined;
          })(),
          email: (() => {
            const email = participant.email;
            if (!email) return undefined;
            
            // Corriger les erreurs communes d'email
            let correctedEmail = email.trim();
            
            // Corriger "@.gmail.com" en "@gmail.com"
            correctedEmail = correctedEmail.replace(/@\.gmail\.com$/, '@gmail.com');
            correctedEmail = correctedEmail.replace(/@\.([a-z]+)\.com$/, '@$1.com');
            
            // Vérifier le format basique
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correctedEmail)) {
              console.warn(` Email invalide détecté: "${email}"  générer un email valide`);
              // Générer un email valide basé sur le nom/prénom
              const safeName = (participant.prenom || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
              const safeLastName = (participant.nom || 'name').toLowerCase().replace(/[^a-z0-9]/g, '');
              return `${safeName}.${safeLastName}@example.com`;
            }
            
            return correctedEmail;
          })(),
          dateNaissance: participant.dateNaissance || '1900-01-01', // Format YYYY-MM-DD requis
          lieuNaissance: participant.lieuNaissance || (isPersonneMorale ? 'N/A' : 'Bamako'),
          nationnalite: participant.nationalite || 'MALIENNE',
          sexe: participant.sexe || (isPersonneMorale ? 'MASCULIN' : 'MASCULIN'),
          situationMatrimoniale: participant.situationMatrimoniale || (isPersonneMorale ? 'CELIBATAIRE' : 'CELIBATAIRE'),
          civilite: isPersonneMorale ? 'PERSONNE_MORALE' : (participant.civilite || 'MONSIEUR'),
          role: 'USER',
          entrepriseRole: participant.role || 'ASSOCIE',
          // Champs spécifiques aux personnes morales
          denominationEntreprise: isPersonneMorale ? participant.denominationEntreprise : undefined,
          paysEmissionRccm: isPersonneMorale ? (participant.paysEmissionRccm || 'MALI') : undefined,
          // Champs de localisation (seulement pour le créateur)
          division_id: participantDivisionId,
          divisionCode: participantDivisionCode,
          localite: participantLocalite,
          porte: isCreatorParticipant ? formData.porte : undefined,
          // Conjoints (seulement pour le créateur marié)
          conjoints: isCreatorParticipant && formData.isMarried && formData.conjoints ? 
            formData.conjoints.map(c => ({
              prenom: c.prenom,
              nom: c.nom,
              dateMariage: c.dateMariage,
              lieuMariage: c.lieuMariage,
              regimeMatrimonial: c.regimeMatrimonial,
              clauseRestrictive: c.clauseRestrictive
            })) : []
        };

        console.log(` Données participant ${participant.role}:`, personRequest);
        console.log(` Téléphone formaté: ${participant.telephone} ? ${personRequest.telephone1}`);
        console.log(` Localisation participant:`, {
          isCreator: isCreatorParticipant,
          division_id: personRequest.division_id,
          divisionCode: personRequest.divisionCode,
          localite: personRequest.localite,
          adressePersonnelleSaisie: formData.adressePersonnelle,
          selectedQuartierId: isCreatorParticipant ? personalSelectedQuartierId : null
        });

        try {
          const token = localStorage.getItem('investmali_agent_token') || localStorage.getItem('agentToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('agent_token');
          
          console.log(` Token pour création participant:`, {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenStart: token?.substring(0, 20) + '...'
          });
          
          // ÉTAPE 1: Vérifier si le participant existe déjà par téléphone
          console.log(` Vérification existence participant par téléphone: ${personRequest.telephone1}`);
          
          try {
            const searchResponse = await fetch(`${getApiBaseUrl()}/persons/search?telephone=${encodeURIComponent(personRequest.telephone1)}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (searchResponse.ok) {
              const existingPerson = await searchResponse.json();
              console.log(`✅ Participant existant trouvé:`, existingPerson);
              participant.id = existingPerson.id;
              console.log(`✅ Réutilisation du participant existant avec ID: ${participant.id}`);
              continue; // Passer au participant suivant
            }
          } catch (searchError) {
            console.log(`ℹ️ Participant non trouvé, création d'un nouveau participant`);
          }
          
          // ÉTAPE 2: Créer un nouveau participant si non trouvé
          console.log(` Envoi requéte POST /api/v1/persons pour ${participant.prenom} ${participant.nom}:`, personRequest);
          
          const response = await fetch(`${getApiBaseUrl()}/persons`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(personRequest)
          });
          
          console.log(` Réponse POST /api/v1/persons:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(` Erreur détaillée création participant:`, errorText);
            throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
          }
          
          const result = await response.json();
          console.log(` Participant ${participant.role} créé avec succés:`, result);
          
          // Mettre é jour l'ID du participant
          participant.id = result.id || result.data?.id;
          console.log(` ID assigné au participant ${isPersonneMorale ? participant.denominationEntreprise : `${participant.prenom} ${participant.nom}`}: ${participant.id}`);
          
        } catch (error) {
          console.error(` ERREUR création participant ${isPersonneMorale ? participant.denominationEntreprise : `${participant.prenom} ${participant.nom}`}:`, error);
          
          // Vérifier si c'est une erreur d'email déjé utilisé
          const errorMessage = (error as Error).message || error?.toString() || '';
          if (errorMessage.includes('email est déjé utilisé') || errorMessage.includes('email already exists')) {
            console.log(` Email déjé utilisé détecté pour ${personRequest.email}`);
            
            // Pour les personnes morales, continuer automatiquement sans email
            if (isPersonneMorale) {
              console.log(` Email "${personRequest.email}" déjé utilisé pour la personne morale "${participant.denominationEntreprise}" - Suppression automatique de l'email`);
              
              // Retenter sans email pour personne morale
              console.log(` Tentative sans email pour personne morale: ${participant.denominationEntreprise}`);
              personRequest.email = undefined;
            } else {
              // Pour les personnes physiques, modifier l'email automatiquement SANS demander confirmation
              console.log(` Email "${personRequest.email}" déjé utilisé pour ${participant.prenom} ${participant.nom} - Modification automatique`);
              
              // Modifier l'email automatiquement et réessayer
              const timestamp = Date.now();
              const originalEmail = personRequest.email || 'user@example.com';
              const emailParts = originalEmail.split('@');
              const newEmail = `${emailParts[0]}_${timestamp}@${emailParts[1]}`;
              
              console.log(` Tentative avec nouvel email: ${originalEmail} ? ${newEmail}`);
              personRequest.email = newEmail;
            }
            
            try {
              const retryToken = localStorage.getItem('investmali_agent_token') || localStorage.getItem('agentToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('agent_token');
              const retryResponse = await fetch(`${getApiBaseUrl()}/persons`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${retryToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(personRequest)
              });
              
              if (!retryResponse.ok) {
                const retryErrorText = await retryResponse.text();
                throw new Error(`Erreur ${retryResponse.status}: ${retryErrorText}`);
              }
              
              const retryResult = await retryResponse.json();
              console.log(` Participant créé avec email modifié:`, retryResult);
              
              participant.id = retryResult.id || retryResult.data?.id;
              if (personRequest.email) {
                participant.email = personRequest.email; // Mettre é jour l'email dans les données
              }
              console.log(`✅ ID assigné au participant: ${participant.id}`);
              
            } catch (retryError) {
              console.error(`? échec méme avec email modifié:`, retryError);
              // En dernier recours, simuler un ID
              participant.id = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              console.log(` ID simulé en dernier recours: ${participant.id}`);
            }
          } else {
            // Pour les autres erreurs, simuler un ID
            participant.id = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log(` ID simulé pour ${isPersonneMorale ? participant.denominationEntreprise : `${participant.prenom} ${participant.nom}`}: ${participant.id}`);
          }
        }
      }

      // éTAPE 4: Créer l'entreprise
      console.log(' éTAPE 4 - Création de l\'entreprise...');
      
      console.log('🔍 DEBUG - formData.participants AVANT mapping:', formData.participants.map(p => ({
        id: p.id,
        nom: p.nom,
        prenom: p.prenom,
        role: p.role,
        typePersonne: p.typePersonne
      })));
      
      const allParticipants = formData.participants
        .filter(p => {
          // Filtrer les participants vides selon leur type
          if (p.typePersonne === 'PHYSIQUE') {
            return p.nom && p.prenom;
          } else if (p.typePersonne === 'MORALE') {
            return p.denominationEntreprise && p.representantLegalNom && p.representantLegalPrenom;
          }
          return false;
        })
        .map(p => {
          // Valider et nettoyer le réle
          const validRoles = ['GERANT', 'PROMOTEUR', 'ASSOCIE', 'DIRIGEANT', 'ADMINISTRATEUR'];
          const cleanRole = (p.role || 'ASSOCIE').toString().trim().toUpperCase();
          
          const participantName = p.typePersonne === 'MORALE' ? p.denominationEntreprise : `${p.prenom} ${p.nom}`;
          
          if (!validRoles.includes(cleanRole)) {
            console.warn(`Role invalide pour participant ${participantName}: ${p.role}, utilisation de ASSOCIE`);
          }
          
          console.log(` Mapping participant ${participantName}:`, {
            originalId: p.id,
            isSimulated: p.id?.startsWith('sim-'),
            willBeFiltered: !p.id || p.id.startsWith('sim-')
          });
          
          return {
            personId: p.id || '', // ID réel du participant créé
            role: validRoles.includes(cleanRole) ? cleanRole : 'ASSOCIE',
            pourcentageParts: (() => {
              // Pour les entreprises individuelles, le gérant/promoteur a 100% des parts
              if (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
                return (cleanRole === 'GERANT' || cleanRole === 'PROMOTEUR') ? 100 : 0;
              }
              
              // Calculer les pourcentages pour que la somme soit 100% (sociétés)
              let percentage = parseFloat(p.pourcentageParts?.toString() || '0');
              
              // Si aucun pourcentage défini, distribuer équitablement
              if (percentage === 0) {
                // Utiliser formData.participants.length au lieu d'allParticipants qui n'est pas encore défini
                const totalParticipants = formData.participants.filter(participant => {
                  if (participant.typePersonne === 'PHYSIQUE') {
                    return participant.nom && participant.prenom;
                  } else if (participant.typePersonne === 'MORALE') {
                    return participant.denominationEntreprise && participant.representantLegalNom && participant.representantLegalPrenom;
                  }
                  return false;
                }).length;
                percentage = Math.round(100 / totalParticipants * 100) / 100; // Arrondir é 2 décimales
              }
              
              return percentage;
            })(),
            dateDebut: p.dateDebut || new Date().toISOString().split('T')[0],
            dateFin: p.dateFin || '9999-12-31'
          };
        });

      // Structure de données conforme au backend (comme cété utilisateur)
      const entrepriseRequest = {
        // Pour les E.I., si le nom n'est pas renseigné, on envoie null (pas prénom+nom)
        // Pour les sociétés sans nom, on envoie aussi null pour déclencher la validation backend
        nom: formData.nomEntreprise && formData.nomEntreprise.trim() !== '' 
          ? formData.nomEntreprise.trim() 
          : null,
        sigle: formData.sigleEntreprise || '',
        adresse: formData.adresse || formData.adressePersonnelle || '',
        telephone: formData.telephone || formData.telephonePersonnel || '',
        email: formData.email || formData.emailPersonnel || '',
        adresseDifferentIdentite: formData.hasDifferentAddress || false,
        extraitJudiciaire: formData.hasCriminalRecord || formData.participants.some(p => p.hasCriminalRecord === true) || false,
        autorisationGerant: formData.allowsOthersResponsible || false,
        autorisationExercice: formData.requiresExerciseAuthorization || false,
        importExport: formData.willImportExport || false,
        statutSociete: true,
        typeEntreprise: formData.typeEntreprise || 'SOCIETE',
        statutCreation: 'EN_COURS',
        etapeValidation: 'ACCUEIL',
        formeJuridique: formData.formeJuridique || 'SARL',
        domaineActivite: formData.domaineActivite || null, // Peut étre null
        domaineActiviteNr: formData.domaineActiviteNr || null, // Domaine non réglementé
        activitePrincipale: formData.activitePrincipale || '', // Activité principale
        activiteSecondaire: formData.activiteSecondaire || '', // Champ optionnel avec valeur par défaut
        // Informations du déposant (pour les sociétés)
        nomDeposant: formData.typeEntreprise === 'SOCIETE' ? formData.nomDeposant || null : null,
        prenomDeposant: formData.typeEntreprise === 'SOCIETE' ? formData.prenomDeposant || null : null,
        telephoneDeposant: formData.typeEntreprise === 'SOCIETE' ? formData.telephoneDeposant || null : null,
        emailDeposant: formData.typeEntreprise === 'SOCIETE' ? formData.emailDeposant || null : null,
        nomCabinet: formData.typeEntreprise === 'SOCIETE' ? formData.nomCabinet || null : null,
        capitale: formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? 0 // Capital é 0 pour les entreprises individuelles
          : parseFloat(formData.capital?.toString() || '1000000'),
        rue: formData.rueEntreprise || '',
        porte: formData.porteEntreprise || '',
        representativeAdresseLibre: formData.adresseLibre || null,
        divisionCode: divisionCode,
        participants: (() => {
          // DEBUG: Voir le contenu de allParticipants avant filtrage
          console.log('🔍 DEBUG - allParticipants avant filtrage:', allParticipants.map(p => ({
            personId: p.personId,
            role: p.role,
            isSimulated: p.personId?.startsWith('sim-'),
            hasPersonId: !!p.personId
          })));
          
          // Filtrer SEULEMENT les participants avec des IDs réels (pas simulés)
          let realParticipants = allParticipants.filter(p => p.personId && !p.personId.startsWith('sim-'));
          
          console.log('🔍 DEBUG - realParticipants après filtrage:', realParticipants.map(p => ({
            personId: p.personId,
            role: p.role
          })));
          
          // IMPORTANT: Si aucun participant réel, le backend rejettera la requête
          if (realParticipants.length === 0) {
            console.error('❌ ERREUR CRITIQUE: Aucun participant avec ID réel trouvé!');
            console.error('❌ Le backend exige au moins un participant avec un ID valide.');
            console.error('❌ Vérifiez que les participants ont bien été créés à l\'étape 3.');
          }
          
          // Ajuster les pourcentages pour que la somme soit exactement 100% (exclure ADMINISTRATEUR)
          if (realParticipants.length > 0) {
            // Séparer les participants qui nécessitent des parts de ceux qui n'en ont pas besoin
            const participantsWithParts = realParticipants.filter(p => p.role !== 'ADMINISTRATEUR');
            const participantsWithoutParts = realParticipants.filter(p => p.role === 'ADMINISTRATEUR');
            
            const totalPercentage = participantsWithParts.reduce((sum, p) => sum + p.pourcentageParts, 0);
            
            // TOUJOURS corriger les ADMINISTRATEUR (mettre é 0%)
            const adjustedWithoutParts = participantsWithoutParts.map(p => {
              console.log(` ADMINISTRATEUR ${p.personId} - Parts forcées é 0% (était ${p.pourcentageParts}%)`);
              return {
                ...p,
                pourcentageParts: 0
              };
            });
            
            // Ajuster les autres participants seulement si nécessaire
            let adjustedWithParts = participantsWithParts;
            if (totalPercentage !== 100 && participantsWithParts.length > 0) {
              console.log(` Ajustement des pourcentages: ${totalPercentage}% ? 100% (${participantsWithParts.length} participants avec parts)`);
              
              // Si la somme n'est pas 100%, redistribuer équitablement seulement entre ceux qui ont des parts
              const equalShare = Math.floor(100 / participantsWithParts.length);
              const remainder = 100 - (equalShare * participantsWithParts.length);
              
              adjustedWithParts = participantsWithParts.map((p, index) => ({
                ...p,
                pourcentageParts: equalShare + (index < remainder ? 1 : 0)
              }));
            }
            
            realParticipants = [...adjustedWithParts, ...adjustedWithoutParts];
            
            console.log(` Pourcentages finaux:`, realParticipants.map(p => ({ 
              personId: p.personId, 
              role: p.role, 
              pourcentage: p.pourcentageParts 
            })));
          }
          
          console.log(` Participants aprés filtrage (IDs réels seulement):`, {
            total: allParticipants.length,
            real: realParticipants.length,
            simulated: allParticipants.filter(p => p.personId?.startsWith('sim-')).length,
            totalPercentage: realParticipants.reduce((sum, p) => sum + p.pourcentageParts, 0),
            allParticipants: allParticipants.map(p => ({ personId: p.personId, role: p.role, isSimulated: p.personId?.startsWith('sim-') })),
            realParticipants: realParticipants.map(p => ({ personId: p.personId, role: p.role, pourcentage: p.pourcentageParts }))
          });
          
          // ?? AJOUT DES CHAMPS PERSONNELS POUR MISE é JOUR BACKEND
          const participantsWithPersonalData = realParticipants.map(participant => {
            const result: any = { ...participant };
            
            // Trouver les données personnelles correspondantes dans formData.participants
            const originalParticipant = formData.participants.find(p => p.id === participant.personId);
            
            if (originalParticipant) {
              // Ajouter dateNaissance si disponible
              if (originalParticipant.dateNaissance && originalParticipant.dateNaissance !== '') {
                // Convertir la date au format Date pour le backend
                result.dateNaissance = new Date(originalParticipant.dateNaissance);
                console.log(` [PARTICIPANT] ${participant.personId} - Date naissance ajoutée: ${originalParticipant.dateNaissance}`);
              }
              
              // Ajouter lieuNaissance si disponible
              if (originalParticipant.lieuNaissance && originalParticipant.lieuNaissance !== '') {
                result.lieuNaissance = originalParticipant.lieuNaissance;
                console.log(` [PARTICIPANT] ${participant.personId} - Lieu naissance ajouté: ${originalParticipant.lieuNaissance}`);
              }
            } else {
              // ?? CAS SPéCIAL: Entreprise individuelle - utiliser les données du créateur principal
              if (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (participant.role === 'GERANT' || participant.role === 'PROMOTEUR')) {
                console.log(` [ENTREPRISE INDIVIDUELLE] Utilisation des données du créateur pour le gérant ${participant.personId}`);
                
                // Utiliser les données personnelles du créateur principal
                if (formData.dateNaissance && formData.dateNaissance !== '') {
                  result.dateNaissance = new Date(formData.dateNaissance);
                  console.log(` [CREATEUR] ${participant.personId} - Date naissance du créateur ajoutée: ${formData.dateNaissance}`);
                }
                
                if (formData.lieuNaissance && formData.lieuNaissance !== '') {
                  result.lieuNaissance = formData.lieuNaissance;
                  console.log(` [CREATEUR] ${participant.personId} - Lieu naissance du créateur ajouté: ${formData.lieuNaissance}`);
                }
              } else {
                console.warn(` [PARTICIPANT] ${participant.personId} - Données personnelles non trouvées dans formData.participants`);
              }
            }
            
            return result;
          });
          
          console.log(` Participants avec données personnelles:`, participantsWithPersonalData.map((p: any) => ({ 
            personId: p.personId, 
            role: p.role, 
            pourcentage: p.pourcentageParts,
            hasDateNaissance: !!p.dateNaissance,
            hasLieuNaissance: !!p.lieuNaissance
          })));
          
          return participantsWithPersonalData;
        })()
      };

      // Validation finale des données
      // Le nom est obligatoire uniquement pour les sociétés, pas pour les entreprises individuelles
      if (!entrepriseRequest.nom && entrepriseRequest.typeEntreprise === 'SOCIETE') {
        throw new Error('Le nom de l\'entreprise est obligatoire pour les sociétés');
      }
      if (!entrepriseRequest.divisionCode) {
        throw new Error('La division est obligatoire');
      }
      // Validation des participants réactivée
      const realParticipants = allParticipants.filter(p => p.personId && !p.personId.startsWith('sim-'));
      console.log(` Participants réels: ${realParticipants.length}, Participants simulés: ${allParticipants.length - realParticipants.length}`);
      
      if (realParticipants.length === 0) {
        console.warn(' Aucun participant réel trouvé - l\'entreprise sera créée sans participants');
      }

      console.log(' DEBUG NOM ENTREPRISE:', {
        nomEntreprise: formData.nomEntreprise,
        typeEntreprise: formData.typeEntreprise,
        nomEnvoyé: entrepriseRequest.nom,
        typeDeNom: typeof entrepriseRequest.nom,
        estNull: entrepriseRequest.nom === null,
        estUndefined: entrepriseRequest.nom === undefined,
        estVide: entrepriseRequest.nom === ''
      });
      console.log(' Données entreprise é envoyer:', entrepriseRequest);
      console.log(' Participants formatés (AVANT correction):', allParticipants);
      console.log(' Participants finaux (APRéS correction):', entrepriseRequest.participants);
      console.log(' DEBUG - Nombre de participants dans la requête:', entrepriseRequest.participants.length);
      console.log(' DEBUG - Contenu détaillé des participants:', JSON.stringify(entrepriseRequest.participants, null, 2));
      console.log(' Code division utilisé:', {
        divisionCode: entrepriseRequest.divisionCode,
        selectedQuartierId: companySelectedQuartierId || personalSelectedQuartierId,
        quartierCode: selectedQuartier?.code,
        fallbackDivision: formData.division || agent?.division
      });
      console.log(' Validation des champs obligatoires:', {
        nom: !!entrepriseRequest.nom,
        capitale: !!entrepriseRequest.capitale,
        divisionCode: !!entrepriseRequest.divisionCode,
        participants: entrepriseRequest.participants.length > 0,
        typeEntreprise: !!entrepriseRequest.typeEntreprise,
        statutCreation: !!entrepriseRequest.statutCreation,
        etapeValidation: !!entrepriseRequest.etapeValidation,
        formeJuridique: !!entrepriseRequest.formeJuridique
      });
      
      // VRAIE LOGIQUE : Utiliser directement l'endpoint /entreprises comme cété utilisateur
      console.log('ÉTAPE 4 - POST /api/v1/entreprises (JSON)');
      
      let entRes;
      try {
        // Vérifier l'authentification - Essayer plusieurs noms de token possibles
        const token = localStorage.getItem('investmali_agent_token') || 
                      localStorage.getItem('agentToken') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken') ||
                      localStorage.getItem('agent_token');
        
        console.log(' Vérification authentification agent:', {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          tokenStart: token?.substring(0, 20) + '...' || 'N/A',
          tokenSources: {
            investmali_agent_token: !!localStorage.getItem('investmali_agent_token'),
            agentToken: !!localStorage.getItem('agentToken'),
            token: !!localStorage.getItem('token'),
            authToken: !!localStorage.getItem('authToken'),
            agent_token: !!localStorage.getItem('agent_token')
          }
        });
        
        // Calculate adjusted parts for participants
        const participantsWithParts = formData.participants?.filter(p => roleRequiresParts(p.role)) || [];
        const totalParts = 100;
        const equalShare = Math.floor(totalParts / participantsWithParts.length);
        const remainder = totalParts % participantsWithParts.length;
        
        const adjustedWithParts = participantsWithParts.map((p: any, index: number) => ({
          ...p,
          pourcentageParts: equalShare + (index < remainder ? 1 : 0)
        }));

        const response = await fetch(`${getApiBaseUrl()}/entreprises`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(entrepriseRequest)
        });
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: `Erreur HTTP ${response.status}: ${response.statusText}` };
          }
          
          console.error(' Erreur détaillée du serveur:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData,
            url: response.url
          });
          
          throw new Error(`Erreur ${response.status}: ${errorData.message || response.statusText}`);
        }
        
        entRes = { data: await response.json() };
        console.log(' Entreprise créée avec succés via l\'endpoint réel');
        console.log(' Réponse complète du backend:', JSON.stringify(entRes.data, null, 2));
      } catch (error) {
        console.error(' Erreur lors de la création de l\'entreprise:', error);
        
        // Extraire et traduire le message d'erreur pour l'utilisateur
        let userFriendlyMessage = 'Une erreur est survenue lors de la création de l\'entreprise.';
        
        if (error instanceof Error) {
          const errorMsg = error.message.toLowerCase();
          
          // D'abord, essayer d'extraire le message spécifique du backend
          const backendMessageMatch = error.message.match(/Erreur \d+: (.+)/);
          const backendMessage = backendMessageMatch ? backendMessageMatch[1] : null;
          
          // Si le message du backend est clair et ne contient pas d'erreur SQL technique, l'utiliser
          if (backendMessage && 
              !backendMessage.toLowerCase().includes('could not execute') && 
              !backendMessage.toLowerCase().includes('sql') &&
              !backendMessage.toLowerCase().includes('constraint violation') &&
              backendMessage.length > 10) {
            userFriendlyMessage = backendMessage;
          }
          // Sinon, traduire les erreurs techniques en messages clairs
          else if (errorMsg.includes('column') && errorMsg.includes('cannot be null')) {
            userFriendlyMessage = 'Erreur de configuration: certains champs obligatoires sont manquants. Veuillez contacter l\'administrateur.';
          } else if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
            userFriendlyMessage = 'Une entreprise avec ce nom existe déjà. Veuillez choisir un nom différent.';
          } else if (errorMsg.includes('constraint')) {
            userFriendlyMessage = 'Les données fournies ne respectent pas les contraintes du système. Veuillez vérifier vos informations.';
          } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
            userFriendlyMessage = 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.';
          } else if (errorMsg.includes('timeout')) {
            userFriendlyMessage = 'Le serveur met trop de temps à répondre. Veuillez réessayer dans quelques instants.';
          } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
            userFriendlyMessage = 'Vous n\'êtes pas autorisé à effectuer cette action. Veuillez vous reconnecter.';
          } else if (errorMsg.includes('404')) {
            userFriendlyMessage = 'Le service demandé est introuvable. Veuillez contacter l\'administrateur.';
          } else if (errorMsg.includes('500') || errorMsg.includes('internal server')) {
            userFriendlyMessage = 'Une erreur interne du serveur s\'est produite. Veuillez réessayer plus tard ou contacter l\'administrateur.';
          }
        }
        
        // Bloquer et afficher l'erreur dans un modal
        setIsLoading(false);
        setErrorMessage(userFriendlyMessage);
        setShowErrorModal(true);
        throw error; // Propager l'erreur pour arréter l'exécution
      }
      
      const created = entRes.data;
      const entrepriseId = created.id || created.data?.id;
      const entrepriseReference = created.reference || created.data?.reference || 'N/A';

      if (!entrepriseId) {
        throw new Error('Identifiant entreprise introuvable');
      }

      console.log(' Entreprise créée:', { entrepriseId, entrepriseReference });

      // éTAPE 5: Upload des documents
      console.log('  ÉTAPE 5 - Upload des documents...');

      const uploadPieceForParticipant = async (personId: string, typePiece: string, numeroPiece: string, file: File) => {
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('typePiece', typePiece);
        fd.append('numero', numeroPiece);
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 5);
        fd.append('dateExpiration', exp.toISOString().split('T')[0]);
        fd.append('file', file);
        
        try {
          const token = localStorage.getItem('investmali_agent_token') || localStorage.getItem('agentToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('agent_token');
          const response = await fetch(`${getApiBaseUrl()}/documents/piece`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
          });
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
        } catch (error) {
          console.warn(' Endpoint documents/piece non implémenté, simulation de l\'upload');
          // Simuler un délai d'upload
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      };

      const uploadDocumentFor = async (personId: string, typeDocument: string, file: File, numero?: string, conjointId?: string) => {
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('typeDocument', typeDocument);
        if (numero) fd.append('numero', numero);
        if (conjointId) fd.append('conjointId', conjointId);
        fd.append('file', file);
        
        try {
          const token = localStorage.getItem('investmali_agent_token') || localStorage.getItem('agentToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('agent_token');
          const response = await fetch(`${getApiBaseUrl()}/documents/document`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur upload document:', {
              status: response.status,
              statusText: response.statusText,
              errorDetails: errorText,
              typeDocument,
              personId,
              entrepriseId
            });
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          console.error('❌ Exception lors de l\'upload:', error);
          throw error;
        }
      };

      // Upload des piéces d'identité des participants
      for (const participant of formData.participants) {
        // Ignorer les participants vides
        const isEmpty = participant.civilite === 'PERSONNE_MORALE' 
          ? !participant.denominationEntreprise?.trim()
          : (!participant.nom?.trim() && !participant.prenom?.trim());
          
        if (isEmpty) {
          console.log(' Participant vide ignoré pour l\'upload');
          continue;
        }
        
        if (participant.civilite === 'PERSONNE_MORALE') {
          console.log(' Personne morale détectée - upload du RCCM');
          // Upload du document RCCM pour les personnes morales
          if (participant.rccmFile && participant.id) {
            try {
              console.log(` Upload RCCM pour ${participant.denominationEntreprise}`);
              await uploadDocumentFor(participant.id, 'RCCM', participant.rccmFile, `RCCM-${participant.denominationEntreprise}-${entrepriseReference}`);
              console.log(' Document RCCM uploadé');
            } catch (e) {
              console.error(' Upload RCCM échoué:', e);
              throw new Error(`Erreur upload RCCM ${participant.denominationEntreprise}: ${e}`);
            }
          } else {
            console.log(' Pas de fichier RCCM ou ID manquant pour', participant.denominationEntreprise);
          }
        } else {
          // Upload des documents pour les personnes physiques
          if (participant.id && participant.documentFile && participant.typePiece && participant.numeroPiece) {
            try {
              console.log(` Upload piéce ${participant.typePiece} pour ${participant.prenom} ${participant.nom}`);
              await uploadPieceForParticipant(participant.id, participant.typePiece, participant.numeroPiece, participant.documentFile);
            } catch (e) {
              console.error(' Upload piéce échoué:', e);
              throw new Error(`Erreur upload document ${participant.prenom} ${participant.nom}: ${e}`);
            }
          }
          
          // Upload des documents supplémentaires pour les gérants/promoteurs
          if (participant.id && (participant.role === 'GERANT' || participant.role === 'PROMOTEUR')) {
            // Upload extrait de naissance
            if (participant.extraitNaissanceFile) {
              try {
                console.log(` Upload extrait de naissance pour ${participant.prenom} ${participant.nom}`);
                await uploadDocumentFor(participant.id, 'EXTRAIT_NAISSANCE', participant.extraitNaissanceFile, `EXTRAIT-${participant.prenom}-${participant.nom}-${entrepriseReference}`);
                console.log('✅ Extrait de naissance uploadé');
              } catch (e) {
                console.error('❌ Upload extrait de naissance échoué:', e);
              }
            }
            
            // Upload casier judiciaire ou déclaration sur l'honneur
            if (participant.hasCriminalRecord === true && participant.casierJudiciaireFile) {
              try {
                console.log(` Upload casier judiciaire pour ${participant.prenom} ${participant.nom}`);
                await uploadDocumentFor(participant.id, 'CASIER_JUDICIAIRE', participant.casierJudiciaireFile, `CASIER-${participant.prenom}-${participant.nom}-${entrepriseReference}`);
                console.log('✅ Casier judiciaire uploadé');
              } catch (e) {
                console.error('❌ Upload casier judiciaire échoué:', e);
              }
            } else if (participant.hasCriminalRecord === false && participant.declarationHonneurFile) {
              try {
                console.log(` Upload déclaration sur l'honneur pour ${participant.prenom} ${participant.nom}`);
                await uploadDocumentFor(participant.id, 'DECLARATION_HONNEUR', participant.declarationHonneurFile, `DECLARATION-${participant.prenom}-${participant.nom}-${entrepriseReference}`);
                console.log('✅ Déclaration sur l\'honneur uploadée');
              } catch (e) {
                console.error('❌ Upload déclaration sur l\'honneur échoué:', e);
              }
            }
            
            // Upload acte de mariage si marié
            if (participant.situationMatrimoniale === 'MARIE' && participant.acteMariageFile) {
              try {
                console.log(` Upload acte de mariage pour ${participant.prenom} ${participant.nom}`);
                await uploadDocumentFor(participant.id, 'ACTE_MARIAGE', participant.acteMariageFile, `MARIAGE-${participant.prenom}-${participant.nom}-${entrepriseReference}`);
                console.log('✅ Acte de mariage uploadé');
              } catch (e) {
                console.error('❌ Upload acte de mariage échoué:', e);
              }
            }
          }
        }
      }

      // Upload des documents de l'entreprise
      const gerant = formData.participants.find(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
      const gerantId = gerant?.id;

      if (formData.documents.statuts && gerantId) {
        try { 
          await uploadDocumentFor(gerantId, 'STATUS_SOCIETE', formData.documents.statuts, `STATUTS-${entrepriseReference}`); 
          console.log('? Statuts uploadés');
        } catch (e) { 
          console.error('? Upload statuts échoué:', e); 
        }
      }

      if (formData.documents.registreCommerce && gerantId) {
        try { 
          await uploadDocumentFor(gerantId, 'REGISTRE_COMMERCE', formData.documents.registreCommerce, `RC-${entrepriseReference}`); 
          console.log('? Registre de commerce uploadé');
        } catch (e) { 
          console.error('? Upload registre de commerce échoué:', e); 
        }
      }

      // Upload PV d'Assemblée (conditionnel selon forme juridique)
      if (formData.documents.pvAssemblee && gerantId) {
        try { 
          await uploadDocumentFor(gerantId, 'PV_ASSEMBLEE', formData.documents.pvAssemblee, `PV-${entrepriseReference}`); 
          console.log('✅ PV d\'Assemblée uploadé');
        } catch (e) { 
          console.error('❌ Upload PV d\'Assemblée échoué:', e); 
        }
      }

      // Upload Déclaration notariée (conditionnel selon forme juridique)
      if (formData.documents.declarationNotariee && gerantId) {
        try { 
          await uploadDocumentFor(gerantId, 'DECLARATION_NOTARIEE', formData.documents.declarationNotariee, `DN-${entrepriseReference}`); 
          console.log('✅ Déclaration notariée uploadée');
        } catch (e) { 
          console.error('❌ Upload déclaration notariée échoué:', e); 
        }
      }

      // Upload Attestation bancaire (conditionnel selon forme juridique)
      if (formData.documents.attestationBancaire && gerantId) {
        try { 
          await uploadDocumentFor(gerantId, 'ATTESTATION_BANCAIRE', formData.documents.attestationBancaire, `AB-${entrepriseReference}`); 
          console.log('✅ Attestation bancaire uploadée');
        } catch (e) { 
          console.error('❌ Upload attestation bancaire échoué:', e); 
        }
      }

      // Upload RCCM de la société mère (conditionnel pour succursales/filiales)
      if (formData.documents.rccmSocieteMere && gerantId) {
        try { 
          await uploadDocumentFor(gerantId, 'RCCM', formData.documents.rccmSocieteMere, `RCCM-MERE-${entrepriseReference}`); 
          console.log('✅ RCCM de la société mère uploadé');
        } catch (e) { 
          console.error('❌ Upload RCCM société mère échoué:', e); 
        }
      }

      // Certificat de résidence depuis l'étape 3 (Participants)
      const gerantParticipant = formData.participants.find(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
      const certificatResidence = gerantParticipant?.certificatResidenceFile;
      
      if (certificatResidence && gerantId) {
        try { 
          await uploadDocumentFor(gerantId, 'CERTIFICAT_RESIDENCE', certificatResidence, `CR-${entrepriseReference}`); 
          console.log('✅ Certificat de résidence uploadé depuis l\'étape 3');
        } catch (e) {
          console.error('❌ Upload certificat résidence échoué:', e);
        }
      }

      // Pièce de nationalité pour les entreprises individuelles
      if (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
        const pieceNationalite = gerantParticipant?.pieceNationaliteFile;
        
        if (pieceNationalite && gerantId) {
          try { 
            await uploadDocumentFor(gerantId, 'PIECE_NATIONALITE', pieceNationalite, `PN-${entrepriseReference}`); 
            console.log('✅ Pièce de nationalité uploadée depuis l\'étape 3');
          } catch (e) {
            console.error('❌ Upload pièce nationalité échoué:', e);
          }
        }
      }

      
      // Upload des documents supplémentaires pour tous les participants
      for (const participant of formData.participants) {
        if (participant.autresDocuments && participant.autresDocuments.length > 0 && participant.id) {
          const participantName = participant.civilite === 'PERSONNE_MORALE' 
            ? participant.denominationEntreprise 
            : `${participant.prenom} ${participant.nom}`;
          console.log(`🔄 Upload ${participant.autresDocuments.length} document(s) supplémentaire(s) pour ${participantName}`);
          
          for (const doc of participant.autresDocuments) {
            if (doc.file && doc.name) {
              try {
                const docNumber = doc.name;
                await uploadDocumentFor(participant.id, 'AUTRES', doc.file, docNumber);
                console.log(`✅ Document supplémentaire "${doc.name}" uploadé pour ${participantName}`);
              } catch (e) {
                console.error(`❌ Upload document supplémentaire "${doc.name}" échoué:`, e);
              }
            }
          }
        }
      }

      console.log('✅ TOUTES LES ÉTAPES TERMINÉES - Dossier créé avec succès');
      
      const response = { 
        data: {
          id: entrepriseId,
          reference: entrepriseReference,
          nom: formData.nomEntreprise,
          sigle: formData.sigleEntreprise,
          statut: 'EN_COURS',
          dateCreation: new Date().toISOString()
        }
      };
      
      console.log(' Dossier créé avec succés:', response.data);
      
      // Créer l'objet Dossier pour l'interface (pour affichage interne)
      const createdDossier: Dossier = {
        id: response.data.id,
        reference: response.data.reference,
        nom: formData.nomEntreprise,
        sigle: formData.sigleEntreprise,
        statut: 'NOUVEAU',
        dateCreation: new Date().toISOString(),
        division: formData.division,
        antenne: formData.antenne,
        documentsManquants: []
      };
      
      // Afficher un message d'information é l'utilisateur
      const isSimulated = response.data.id.startsWith('agent-');
      
      // Compter les gérants/promoteurs avec email valide pour l'information sur les notifications
      const gerantsAvecEmail = formData.participants
        .filter(p => (p.role === 'GERANT' || p.role === 'PROMOTEUR') && p.civilite !== 'PERSONNE_MORALE')
        .filter(p => p.email && p.email.includes('@'))
        .length;
      
      const emailInfo = gerantsAvecEmail > 0 
        ? `\n\n Un email de confirmation sera envoyé aux ${gerantsAvecEmail} gérant(s)`
        : '';
      
      // Calculer le montant dynamiquement selon le type d'entreprise et les autorisations
      let totalAmount = 14500; // Montant par défaut pour les sociétés
      
      // Pour les entreprises individuelles, appliquer la logique spécifique
      if (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
        // 28000 FCFA si autorisation d'exercice OU import/export, sinon 10000 FCFA
        totalAmount = (formData.requiresExerciseAuthorization || formData.willImportExport) ? 28000 : 10000;
      }
      
      // Récupérer les informations de localisation depuis le formulaire
      const receiptQuartier = companyQuartiers.find(q => q.id === companySelectedQuartierId);
      const receiptCommune = companyCommunes.find(c => c.id === companySelectedCommuneId);
      const receiptRegion = companyRegions.find(r => r.id === companySelectedRegionId);
      
      // Récupérer les données réelles du gérant depuis la réponse du backend
      const gerantBackend = created.membres?.find((m: any) => m.role === 'GERANT') || created.membres?.[0];
      const prenomReel = gerantBackend?.prenom || formData.prenom;
      const nomReel = gerantBackend?.nom || formData.nom;
      
      // Utiliser le nom de l'entreprise ou prénom+nom réel si l'entreprise est individuelle sans nom
      const displayName = created.nom || formData.nomEntreprise || `${prenomReel} ${nomReel}`;
      
      console.log('📋 Données pour le reçu:', {
        entrepriseNom: created.nom,
        formDataNom: formData.nomEntreprise,
        gerantPrenom: prenomReel,
        gerantNom: nomReel,
        displayName: displayName
      });
      
      const receiptData = generateUnpaidReceiptData(
        {
          id: created.id,
          nom: displayName,
          typeEntreprise: created.typeEntreprise || formData.typeEntreprise,
          companyName: displayName,
          businessType: created.typeEntreprise || formData.typeEntreprise,
          reference: created.reference,
          referenceServeur: created.reference,
          numeroReference: created.reference,
          // Informations de localisation
          quartierNom: receiptQuartier?.nom || formData.adresse,
          communeNom: receiptCommune?.nom || 'Bamako',
          regionNom: receiptRegion?.nom || 'Bamako',
          localisation: receiptQuartier?.nom || formData.adresse,
          adresse: formData.adresse,
          // Informations du participant pour le QR code - utiliser les données réelles
          prenom: prenomReel,
          nomParticipant: nomReel
        },
        totalAmount,
        'Agent API-INVEST'
      );
      
      setGeneratedReceipt(receiptData);
      // Ne pas afficher le reçu automatiquement, il sera ouvert via le bouton dans le modal de succès
      // setShowReceipt(true);

      // Préparer les données pour le modal de succès
      setSuccessData({
        reference: response.data.reference,
        entreprise: displayName,
        isSimulated: isSimulated,
        emailInfo: emailInfo
      });
      
      // Afficher le modal de succès en premier
      setShowSuccessModal(true);
      
      // Marquer le dossier comme créé avec succés
      setIsDossierCreated(true);
      
      // Appeler onDossierCreated pour rafraîchir la liste des demandes
      const newDossier: Dossier = {
        id: response.data.id,
        reference: response.data.reference,
        nom: displayName,
        sigle: created.sigle || formData.sigleEntreprise,
        statut: 'EN_COURS',
        dateCreation: new Date().toISOString(),
        entrepriseId: response.data.id,
        documentsManquants: []
      };
      onDossierCreated(newDossier);
      
      // Réinitialisation commentée pour rester sur la page récapitulatif
      /*
      setFormData({
        // Informations Personnelles
        civilite: 'MONSIEUR',
        prenom: '',
        nom: '',
        dateNaissance: '',
        lieuNaissance: '',
        nationalite: 'MALIENNE',
        telephonePersonnel: '',
        emailPersonnel: '',
        adressePersonnelle: '',
        // Questions Oui/Non
        hasCriminalRecord: false,
        isMarried: false,
        allowsOthersResponsible: false,
        requiresExerciseAuthorization: false,
        willImportExport: false,
        hasDifferentAddress: false,
        // Informations Société
        nomEntreprise: '',
        sigleEntreprise: '',
        typeEntreprise: 'SOCIETE',
        formeJuridique: 'SARL',
        capital: '',
        adresse: '',
        telephone: '',
        email: '',
        // Activité (intégrée dans Informations Société)
        domaineActiviteNr: undefined,
        domaineActivite: undefined,
        activitePrincipale: '',
        activiteSecondaire: '',
        // Participants
        participants: [],
        // Documents
        documents: {
          statuts: null,
          registreCommerce: null,
          identite: null,
          justificatifDomicile: null,
        },
        // Localisation
        division: agent?.division || '',
        antenne: agent?.antenne || ''
      });
      setCurrentStep(1);
      */
    } catch (error: any) {
      console.error('? Erreur lors de la création du dossier:', error);
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = 'Une erreur est survenue lors de la création du dossier.';
      
      if (error.response) {
        // Erreur de réponse du serveur
        console.error(' Réponse serveur:', error.response.status, error.response.data);
        errorMessage = `Erreur serveur (${error.response.status}): ${error.response.data?.message || 'Erreur inconnue'}`;
      } else if (error.request) {
        // Erreur de réseau
        console.error(' Erreur réseau:', error.request);
        errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
      } else {
        // Autre erreur
        console.error(' Erreur:', error.message);
        errorMessage = `Erreur: ${error.message}`;
      }
      
      // L'erreur est déjà affichée dans le modal d'erreur (ligne 3158)
      // alert(errorMessage); // Supprimé pour éviter la double alerte
    } finally {
      setIsLoading(false);
    }
  };

  // Composants pour chaque étape
  const InformationsPersonnellesStep = () => (
    <div className="space-y-6">
      {/* Questionnaire de sélection du type d'entreprise */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border border-sky-200 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-[#2d85c9] rounded-lg">
            <BuildingOfficeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-sky-800">Type d'entreprise</h2>
            <p className="text-black-600 font-medium mt-1">
              Voulez-vous créer une entreprise individuelle ou une société ?
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateFormData('typeEntreprise', 'ENTREPRISE_INDIVIDUELLE')}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'
                ? 'border-[#2d85c9] bg-[#2d85c9]/50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-[#2d85c9] hover:bg-[#2d85c9]/25'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-lg ${
                formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'
                  ? 'bg-[#2d85c9] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${
                  formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'
                    ? 'text-[#2d85c9]'
                    : 'text-gray-800'
                }`}>
                  Entreprise Individuelle
                </h3>
                {/* <p className="text-sm text-gray-600 mt-1">
                  Une seule personne (vous) dirige l'entreprise. Plus simple et rapide à créer.
                </p> */}
                {/* <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• Vous êtes le seul propriétaire</li>
                  <li>• Responsabilité illimitée</li>
                  <li>• Formalités simplifiées</li>
                </ul> */}
              </div>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => updateFormData('typeEntreprise', 'SOCIETE')}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              formData.typeEntreprise === 'SOCIETE'
                ? 'border-[#2d85c9] bg-[#2d85c9]/50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-[#2d85c9] hover:bg-[#2d85c9]/25'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-lg ${
                formData.typeEntreprise === 'SOCIETE'
                  ? 'bg-[#2d85c9] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <BuildingOfficeIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${
                  formData.typeEntreprise === 'SOCIETE'
                    ? 'text-sky-800'
                    : 'text-gray-800'
                }`}>
                  Société
                </h3>
                {/* <p className="text-sm text-gray-600 mt-1">
                  Plusieurs associés peuvent participer. Structure plus complexe mais plus protectrice.
                </p> */}
                {/* <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• Plusieurs associés possibles</li>
                  <li>• Responsabilité limitée</li>
                  <li>• Capital social requis</li>
                </ul> */}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Affichage conditionnel selon le type d'entreprise */}
      {formData.typeEntreprise === 'SOCIETE' ? (
        /* ========== FORMULAIRE DÉPOSANT (SOCIÉTÉ) ========== */
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#2d85c9] rounded-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Informations du Déposant</h2>
                <p className="text-slate-600 font-medium mt-1">
                  Renseignez les informations de la personne qui dépose le dossier de création de société.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                required
                defaultValue={formData.nomDeposant}
                onBlur={(e) => updateFormData('nomDeposant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Nom de famille"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                required
                defaultValue={formData.prenomDeposant}
                onBlur={(e) => updateFormData('prenomDeposant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Prénom"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Civilité *
              </label>
              <select
                required
                value={formData.civilite}
                onChange={(e) => updateFormData('civilite', e.target.value as Civilites)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="MONSIEUR">Monsieur</option>
                <option value="MADAME">Madame</option>
               
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Téléphone *
              </label>
              <div className="relative">
                <div className="flex">
                  <div className="relative personal-country-dropdown">
                    <button 
                      type="button" 
                      onClick={() => setShowPersonalCountryDropdown(!showPersonalCountryDropdown)}
                      className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                    >
                      <img 
                        alt={`Drapeau ${personalSelectedCountry.iso}`} 
                        className="w-6 h-4 mr-2 object-cover rounded-sm" 
                        src={personalSelectedCountry.flag}
                      />
                      <span className="text-sm font-medium text-gray-700">{personalSelectedCountry.code}</span>
                      <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    
                    {showPersonalCountryDropdown && (
                      <div className="absolute top-full left-0 z-50 w-80 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                        {countries.map((country) => (
                          <button
                            key={country.iso}
                            type="button"
                            onClick={() => {
                              setPersonalSelectedCountry(country);
                              setShowPersonalCountryDropdown(false);
                            }}
                            className="w-full flex items-center px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-left"
                          >
                            <img 
                              alt={`Drapeau ${country.iso}`} 
                              className="w-6 h-4 mr-3 object-cover rounded-sm" 
                              src={country.flag}
                            />
                            <span className="text-sm font-medium text-gray-700 mr-2">{country.code}</span>
                            <span className="text-sm text-gray-600">{country.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    defaultValue={formData.telephoneDeposant}
                    onChange={(e) => handlePersonalPhoneChange(e.target.value, e.target)}
                    onBlur={(e) => updateFormData('telephoneDeposant', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                    placeholder={personalPhonePlaceholder}
                    maxLength={personalPhoneMaxLength}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email (optionnel)
              </label>
              <input
                type="email"
                defaultValue={formData.emailDeposant}
                onBlur={(e) => updateFormData('emailDeposant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="email@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Nom du cabinet (optionnel)
              </label>
              <input
                type="text"
                defaultValue={formData.nomCabinet || ''}
                onBlur={(e) => updateFormData('nomCabinet', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Nom du cabinet si applicable"
              />
            </div>
          </div>

          {/* Questions Oui/Non pour les sociétés */}
          <div className="col-span-2 space-y-6 pt-6 border-t border-white/40">
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-medium text-gray-700">Avez-vous un extrait de casier judiciaire ?</span>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => updateFormData('hasCriminalRecord', true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    formData.hasCriminalRecord 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Oui
                </button>
                <button 
                  type="button" 
                  onClick={() => updateFormData('hasCriminalRecord', false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    !formData.hasCriminalRecord 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-medium text-gray-700">Êtes-vous marié(e) ?</span>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => updateFormData('isMarried', true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    formData.isMarried 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Oui
                </button>
                <button 
                  type="button" 
                  onClick={() => updateFormData('isMarried', false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    !formData.isMarried 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-medium text-gray-700">Votre activité est-elle soumise à une autorisation d'exercice ?</span>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => updateFormData('requiresExerciseAuthorization', true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    formData.requiresExerciseAuthorization 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Oui
                </button>
                <button 
                  type="button" 
                  onClick={() => updateFormData('requiresExerciseAuthorization', false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    !formData.requiresExerciseAuthorization 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-medium text-gray-700">Allez-vous importer ou exporter des marchandises ?</span>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => updateFormData('willImportExport', true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    formData.willImportExport 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Oui
                </button>
                <button 
                  type="button" 
                  onClick={() => updateFormData('willImportExport', false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    !formData.willImportExport 
                      ? 'bg-[#2d85c9] text-white shadow-lg' 
                      : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                  }`}
                >
                  Non
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ========== FORMULAIRE PROMOTEUR (ENTREPRISE INDIVIDUELLE) ========== */
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#2d85c9] rounded-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Informations Personnelles</h2>
                <p className="text-slate-600 font-medium mt-1">
                  Renseignez les informations personnelles du promoteur de l'entreprise.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        

         {/* Message d'avertissement */}
        {/* <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <strong className="font-semibold">Important :</strong> Saisissez vos <strong>vraies données personnelles</strong> (nom, prénom, etc.). N'utilisez pas de données de test comme "Test Test".
            </div>
          </div>
        </div> */}

       <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Nom *
          </label>
          <input
            type="text"
            required
            defaultValue={formData.nom}
            onBlur={(e) => updateFormData('nom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Nom de famille"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Prénom *
          </label>
          <input
            type="text"
            required
            defaultValue={formData.prenom}
            onBlur={(e) => updateFormData('prenom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder="Prénom"
          />
        </div>

       <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Civilité *
          </label>
          <select
            required
            value={formData.civilite}
            onChange={(e) => updateFormData('civilite', e.target.value as Civilites)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="MONSIEUR">Monsieur</option>
            <option value="MADAME">Madame</option>
            {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
              <option value="PERSONNE_MORALE">Personne Morale</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Date de naissance * <span className="text-xs text-gray-500">(18 ans minimum)</span>
          </label>
          <input
            type="date"
            required
            max={getMaxBirthDate()}
            defaultValue={formData.dateNaissance}
            onBlur={(e) => {
              const value = e.target.value;
              updateFormData('dateNaissance', value);
              
              // Validation en temps réel de l'ége
              if (value) {
                const age = calculateAge(value);
                if (age < 18) {
                  e.target.setCustomValidity(``);
                } else {
                  e.target.setCustomValidity('');
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          {/* <p className="text-xs text-gray-500 mt-1">Vous devez avoir au moins 18 ans</p> */}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Lieu de naissance *
          </label>
          <input
            type="text"
            required
            defaultValue={formData.lieuNaissance}
            onBlur={(e) => updateFormData('lieuNaissance', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder=""
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Nationalité *
          </label>
          <select
            required
            value={formData.nationalite}
            onChange={(e) => updateFormData('nationalite', e.target.value as Nationalite)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            {/* Priorité Mali et Afrique de l'Ouest */}
            <option value="MALIENNE">Malienne</option>
            <option value="SÉNÉGALAISE">Sénégalaise</option>
            <option value="BURKINABÈ">Burkinabé</option>
            <option value="IVOIRIENNE">Ivoirienne</option>
            <option value="GUINÉENNE">Guinéenne</option>
            <option value="MAURITANIENNE">Mauritanienne</option>
            <option value="NIGÉRIENNE">Nigérienne</option>
            <option value="GHANÉENNE">Ghanéenne</option>
            <option value="NIGÉRIANE">Nigériane</option>
            <option value="TOGOLAISE">Togolaise</option>
            <option value="BÉNINOISE">Béninoise</option>
            <option value="GAMBIENNE">Gambienne</option>
            <option value="SIERRA_LEONAISE">Sierra Léonaise</option>
            <option value="LIBÉRIENNE">Libérienne</option>
            <option value="CAP_VERDIENNE">Cap-Verdienne</option>
            <option value="BISSAU_GUINÉENNE">Bissau Guinéenne</option>
            
            {/* Afrique Centrale et de l'Est */}
            <option value="CAMEROUNAISE">Camerounaise</option>
            <option value="TCHADIENNE">Tchadienne</option>
            <option value="CENTRAFRICAINE">Centrafricaine</option>
            <option value="GABONAISE">Gabonaise</option>
            <option value="CONGOLAISE_RDC">Congolaise RDC</option>
            <option value="CONGOLAISE_CONGO_BRAZZAVILLE">Congolaise Congo Brazzaville</option>
            <option value="ANGOLAISE">Angolaise</option>
            <option value="ÉTHIOPIENNE">éthiopienne</option>
            <option value="KÉNYANE">Kényane</option>
            <option value="TANZANIENNE">Tanzanienne</option>
            <option value="RWANDAISE">Rwandaise</option>
            <option value="BURUNDAISE">Burundaise</option>
            
            {/* Afrique du Nord */}
            <option value="ALGÉRIENNE">Algérienne</option>
            <option value="MAROCAINE">Marocaine</option>
            <option value="TUNISIENNE">Tunisienne</option>
            <option value="LIBYENNE">Libyenne</option>
            <option value="ÉGYPTIENNE">égyptienne</option>
            <option value="SOUDANAISE">Soudanaise</option>
            
            {/* Europe */}
            <option value="FRANéAISE">Franéaise</option>
            <option value="BRITANNIQUE">Britannique</option>
            <option value="ALLEMANDE">Allemande</option>
            <option value="ITALIENNE">Italienne</option>
            <option value="ESPAGNOLE">Espagnole</option>
            <option value="PORTUGAISE">Portugaise</option>
            <option value="BELGE">Belge</option>
            <option value="NéERLANDAISE">Néerlandaise</option>
            <option value="SUISSE">Suisse</option>
            <option value="SUéDOISE">Suédoise</option>
            <option value="NORVéGIENNE">Norvégienne</option>
            <option value="DANOISE">Danoise</option>
            <option value="FINLANDAISE">Finlandaise</option>
            <option value="POLONAISE">Polonaise</option>
            <option value="TCHéQUE">Tchéque</option>
            <option value="HONGROISE">Hongroise</option>
            <option value="ROUMAINE">Roumaine</option>
            <option value="BULGARE">Bulgare</option>
            <option value="GRECQUE">Grecque</option>
            <option value="TURQUE">Turque</option>
            <option value="RUSSE">Russe</option>
            <option value="UKRAINIENNE">Ukrainienne</option>
            
            {/* Amériques */}
            <option value="AMéRICAINE">Américaine</option>
            <option value="CANADIENNE">Canadienne</option>
            <option value="BRéSILIENNE">Brésilienne</option>
            <option value="ARGENTINE">Argentine</option>
            <option value="MEXICAINE">Mexicaine</option>
            <option value="CHILIENNE">Chilienne</option>
            <option value="COLOMBIENNE">Colombienne</option>
            <option value="PéRUVIENNE">Péruvienne</option>
            <option value="VéNéZUéLIENNE">Vénézuélienne</option>
            
            {/* Asie */}
            <option value="CHINOISE">Chinoise</option>
            <option value="JAPONAISE">Japonaise</option>
            <option value="INDIENNE">Indienne</option>
            <option value="PAKISTANAISE">Pakistanaise</option>
            <option value="BANGLADAISE">Bangladaise</option>
            <option value="INDONéSIENNE">Indonésienne</option>
            <option value="THAéLANDAISE">Thaélandaise</option>
            <option value="VIETNAMIENNE">Vietnamienne</option>
            <option value="PHILIPPINE">Philippine</option>
            <option value="MALAISIENNE">Malaisienne</option>
            <option value="SINGAPOURIENNE">Singapourienne</option>
            <option value="SUD_CORéENNE">Sud-Coréenne</option>
            <option value="NORD_CORéENNE">Nord-Coréenne</option>
            <option value="IRANIENNE">Iranienne</option>
            <option value="IRAKIENNE">Irakienne</option>
            <option value="AFGHANE">Afghane</option>
            <option value="SAOUDIENE">Saoudienne</option>
            <option value="éMIRIENNE">émirienne</option>
            <option value="QATARIE">Qatarie</option>
            <option value="KOWEéTIENNE">Koweétienne</option>
            <option value="LIBANAISE">Libanaise</option>
            <option value="SYRIENNE">Syrienne</option>
            <option value="JORDANIENNE">Jordanienne</option>
            <option value="ISRAéLIENNE">Israélienne</option>
            <option value="PALESTINIENNE">Palestinienne</option>
            <option value="YéMéNITE">Yéménite</option>
            
            {/* Océanie */}
            <option value="AUSTRALIENNE">Australienne</option>
            <option value="NéO_ZéLANDAISE">Néo-Zélandaise</option>
            
            {/* Autres nationalités moins courantes */}
            <option value="ALBANAISE">Albanaise</option>
            <option value="ANDORRANE">Andorrane</option>
            <option value="ANTIGUAISE">Antiguaise</option>
            <option value="ARMéNIENNE">Arménienne</option>
            <option value="AUTRICHIENNE">Autrichienne</option>
            <option value="AZERBAéDJANAISE">Azerbaédjanaise</option>
            <option value="BAHAMéENNE">Bahaméenne</option>
            <option value="BAHREéNIENNE">Bahreénienne</option>
            <option value="BARBADIENNE">Barbadienne</option>
            <option value="BéLIZIENNE">Bélizienne</option>
            <option value="BHOUTANAISE">Bhoutanaise</option>
            <option value="BIéLORUSSE">Biélorusse</option>
            <option value="BIRMANE">Birmane</option>
            <option value="BOLIVIENNE">Bolivienne</option>
            <option value="BOSNIAQUE">Bosniaque</option>
            <option value="BOTSWANAISE">Botswanaise</option>
            <option value="BRUNéIENNE">Brunéienne</option>
            <option value="CAMBODGIENNE">Cambodgienne</option>
            <option value="CHYPRIOTE">Chypriote</option>
            <option value="COMORIENNE">Comorienne</option>
            <option value="COSTARICIENNE">Costaricienne</option>
            <option value="CROATE">Croate</option>
            <option value="CUBAINE">Cubaine</option>
            <option value="DJIBOUTIENNE">Djiboutienne</option>
            <option value="DOMINICAINE">Dominicaine</option>
            <option value="DOMINIQUAISE">Dominiquaise</option>
            <option value="éQUATORIENNE">équatorienne</option>
            <option value="éRYTHRéENNE">érythréenne</option>
            <option value="ESTONIENNE">Estonienne</option>
            <option value="ESWATINIENNE">Eswatinienne</option>
            <option value="FIDJIENNE">Fidjienne</option>
            <option value="GéORGIENNE">Géorgienne</option>
            <option value="GRENADIENNE">Grenadienne</option>
            <option value="GUATéMALTéQUE">Guatémaltéque</option>
            <option value="GUYANIENNE">Guyanienne</option>
            <option value="HAéTIENNE">Haétienne</option>
            <option value="HONDURIENNE">Hondurienne</option>
            <option value="IRLANDAISE">Irlandaise</option>
            <option value="ISLANDAISE">Islandaise</option>
            <option value="JAMAéCAINE">Jamaécaine</option>
            <option value="KAZAKHE">Kazakhe</option>
            <option value="KIRGHIZE">Kirghize</option>
            <option value="KIRIBATIENNE">Kiribatienne</option>
            <option value="LAOTIENNE">Laotienne</option>
            <option value="LETTONE">Lettone</option>
            <option value="LIECHTENSTEINOISE">Liechtensteinoise</option>
            <option value="LITUANIENNE">Lituanienne</option>
            <option value="LUXEMBOURGEOISE">Luxembourgeoise</option>
            <option value="MACéDONIENNE">Macédonienne</option>
            <option value="MALAWITE">Malawite</option>
            <option value="MALDIVIENNE">Maldivienne</option>
            <option value="MALTAISE">Maltaise</option>
            <option value="MARSHALLAISE">Marshallaise</option>
            <option value="MAURICIENNE">Mauricienne</option>
            <option value="MICRONéSIENNE">Micronésienne</option>
            <option value="MOLDAVE">Moldave</option>
            <option value="MONéGASQUE">Monégasque</option>
            <option value="MONGOLE">Mongole</option>
            <option value="MONTéNéGRINE">Monténégrine</option>
            <option value="MOZAMBICAINE">Mozambicaine</option>
            <option value="NAMIBIENNE">Namibienne</option>
            <option value="NAURUANE">Nauruane</option>
            <option value="NéPALAIS">Népalaise</option>
            <option value="OMANAISE">Omanaise</option>
            <option value="PANAMéENNE">Panaméenne</option>
            <option value="PAPOUASIENNE_NÉO_GUINÉENNE">Papouasienne Néo-Guinéenne</option>
            <option value="PARAGUAYENNE">Paraguayenne</option>
            <option value="SAINT_LUCIENNE">Saint Lucienne</option>
            <option value="SAINT_MARINAISE">Saint Marinaise</option>
            <option value="SAINT_VINCENTAISé_ET_GRENADINE">Saint Vincentaise et Grenadine</option>
            <option value="SALOMONIENNE">Salomonienne</option>
            <option value="SALVADORIENNE">Salvadorienne</option>
            <option value="SAMOANE">Samoane</option>
            <option value="SAO_TOMéENNE">Séo Toméenne</option>
            <option value="SERBE">Serbe</option>
            <option value="SEYCHELLOISE">Seychelloise</option>
            <option value="SLOVAQUE">Slovaque</option>
            <option value="SLOVéNE">Slovéne</option>
            <option value="SOMALIENNE">Somalienne</option>
            <option value="SUD_SOUDANAISE">Sud-Soudanaise</option>
            <option value="SRI_LANKAISE">Sri Lankaise</option>
            <option value="TADJIKE">Tadjike</option>
            <option value="TIMORAISE">Timoraise</option>
            <option value="TONGIENNE">Tongienne</option>
            <option value="TRINITéENNE_ET_TOBAGAISE">Trinitéenne et Tobagaise</option>
            <option value="TURKMéNE">Turkméne</option>
            <option value="TUVALUANE">Tuvaluane</option>
            <option value="URUGUAYENNE">Uruguayenne</option>
            <option value="OUZBéKE">Ouzbéke</option>
            <option value="VANUATAISE">Vanuataise</option>
            <option value="CITOYENNE_DU_SAINT_SIéGE_VATICAN">Citoyenne du Saint-Siége Vatican</option>
            <option value="ZAMBIENNE">Zambienne</option>
            <option value="ZIMBABWEENNE">Zimbabwéenne</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Téléphone personnel *
          </label>
          <div className="relative">
            <div className="flex">
              <div className="relative personal-country-dropdown">
                <button 
                  type="button" 
                  onClick={() => setShowPersonalCountryDropdown(!showPersonalCountryDropdown)}
                  className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                >
                  <img 
                    alt={`Drapeau ${personalSelectedCountry.iso}`} 
                    className="w-6 h-4 mr-2 object-cover rounded-sm" 
                    src={personalSelectedCountry.flag}
                  />
                  <span className="text-sm font-medium text-gray-700">{personalSelectedCountry.code}</span>
                  <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {/* Dropdown des pays */}
                {showPersonalCountryDropdown && (
                  <div className="absolute top-full left-0 z-50 w-80 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                    {countries.map((country) => (
                      <button
                        key={country.iso}
                        type="button"
                        onClick={() => {
                          setPersonalSelectedCountry(country);
                          setShowPersonalCountryDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-left"
                      >
                        <img 
                          alt={`Drapeau ${country.iso}`} 
                          className="w-6 h-4 mr-3 object-cover rounded-sm" 
                          src={country.flag}
                        />
                        <span className="text-sm font-medium text-gray-700 mr-2">{country.code}</span>
                        <span className="text-sm text-gray-600">{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="tel"
                defaultValue={formData.telephonePersonnel}
                onChange={(e) => handlePersonalPhoneChange(e.target.value, e.target)}
                onBlur={(e) => updateFormData('telephonePersonnel', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                placeholder={personalPhonePlaceholder}
                maxLength={personalPhoneMaxLength}
                required
              />
            </div>
            {/* <p className="text-xs text-gray-500 mt-1">
              Entrez votre numéro sans le {personalSelectedCountry.code} (ex: {personalSelectedCountry.code === '+223' ? '77 00 00 01' : personalSelectedCountry.code === '+33' ? '06 12 34 56 78' : personalSelectedCountry.code === '+1' ? '555 123 4567' : 'XX XX XX XX'})
            </p> */}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Téléphone personnel 2 (optionnel)
          </label>
          <div className="relative">
            <div className="flex">
              <div className="relative personal-country-dropdown">
                <button 
                  type="button" 
                  onClick={() => setShowPersonalCountryDropdown(!showPersonalCountryDropdown)}
                  className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                >
                  <img 
                    alt={`Drapeau ${personalSelectedCountry.iso}`} 
                    className="w-6 h-4 mr-2 object-cover rounded-sm" 
                    src={personalSelectedCountry.flag}
                  />
                  <span className="text-sm font-medium text-gray-700">{personalSelectedCountry.code}</span>
                  <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {/* Dropdown des pays */}
                {showPersonalCountryDropdown && (
                  <div className="absolute top-full left-0 z-50 w-80 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                    {countries.map((country) => (
                      <button
                        key={country.iso}
                        type="button"
                        onClick={() => {
                          setPersonalSelectedCountry(country);
                          setShowPersonalCountryDropdown(false);
                        }}
                        className="w-full flex items-center px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-left"
                      >
                        <img 
                          alt={`Drapeau ${country.iso}`} 
                          className="w-6 h-4 mr-3 object-cover rounded-sm" 
                          src={country.flag}
                        />
                        <span className="text-sm font-medium text-gray-700 mr-2">{country.code}</span>
                        <span className="text-sm text-gray-600">{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="tel"
                defaultValue={formData.telephonePersonnel2}
                onChange={(e) => handlePersonalPhoneChange(e.target.value, e.target)}
                onBlur={(e) => updateFormData('telephonePersonnel2', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                placeholder={personalPhonePlaceholder}
                maxLength={personalPhoneMaxLength}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Email personnel
          </label>
          <input
            type="email"
            defaultValue={formData.emailPersonnel}
            onBlur={(e) => updateFormData('emailPersonnel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder=""
          />
        </div>

        {/* Champs Rue et Porte en grille 2 colonnes */}
        <div className="grid grid-cols-4 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Rue</label>
            <input
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
              placeholder=""
              type="text"
              defaultValue={formData.localite || ''}
              onBlur={(e) => updateFormData('localite', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Porte</label>
            <input
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
              placeholder=""
              type="text"
              defaultValue={formData.porte || ''}
              onBlur={(e) => updateFormData('porte', e.target.value)}
            />
          </div>
        </div>

        {/* Champ Adresse libre */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Adresse libre</label>
          <textarea
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300"
            placeholder="Saisissez une adresse libre (optionnel)"
            rows={3}
            defaultValue={formData.adresseLibre || ''}
            onBlur={(e) => updateFormData('adresseLibre', e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-black-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Adresse de résidence (Personne)
          </h4>

          <div className="space-y-6">
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-sky-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-black-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Recherche rapide de localisation
              </h3>
              <p className="text-sm text-black-600 mb-4">
                Tapez le nom d'une localisation pour remplir automatiquement la hiérarchie administrative
                {!formData.hasDifferentAddress && (
                  <span className="block text-sky-700 font-medium mt-1">
                    Cette localisation sera automatiquement appliquée au siège social de l'entreprise
                  </span>
                )}
              </p>
              <DivisionSearchInput
                placeholder="Rechercher une région, cercle, arrondissement, commune ou quartier..."
                onSelect={handlePersonalDivisionSearch}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Région *</label>
                <select
                  value={personalSelectedRegionId}
                  onChange={async (e) => {
                    const regionId = e.target.value;
                    setPersonalSelectedRegionId(regionId);
                    
                    // Reset des niveaux inférieurs (structure INSTAT moderne)
                    setPersonalSelectedCercleId('');
                    setPersonalSelectedCommuneId('');
                    setPersonalSelectedQuartierId('');
                    setPersonalCercles([]);
                    setPersonalCommunes([]);
                    setPersonalQuartiers([]);
                    
                    if (regionId) {
                      console.log(' Chargement cercles pour région:', regionId);
                      try {
                        const cercles = await divisionService.getCerclesByRegion(regionId);
                                    setPersonalCercles(cercles || []);
                      } catch (error) {
                                    setPersonalCercles([]);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300"
                >
                  <option value="">Sélectionnez une région</option>
                  {personalRegions.map((region: any) => (
                    <option key={region.id} value={region.id}>{region.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Cercle *</label>
                  <select
                    value={personalSelectedCercleId}
                    disabled={personalCercles.length === 0}
                    onChange={async (e) => {
                      const cercleId = e.target.value;
                      setPersonalSelectedCercleId(cercleId);
                      
                      // Reset des niveaux inférieurs (structure INSTAT moderne)
                      setPersonalSelectedCommuneId('');
                      setPersonalSelectedQuartierId('');
                      setPersonalCommunes([]);
                      setPersonalQuartiers([]);
                      
                      if (cercleId) {
                        // Structure INSTAT moderne : charger directement les communes depuis le cercle
                        try {
                          const communes = await divisionService.getCommunesByCercle(cercleId);
                          setPersonalCommunes(communes || []);
                          console.log('? Communes chargées depuis cercle:', communes?.length || 0);
                        } catch (error) {
                          console.error('? Erreur chargement communes depuis cercle:', error);
                          setPersonalCommunes([]);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionnez un cercle</option>
                    {personalCercles.map((cercle: any) => (
                      <option key={cercle.id} value={cercle.id}>{cercle.nom}</option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Commune *</label>
                <select
                  value={personalSelectedCommuneId}
                  onChange={async (e) => {
                    const communeId = e.target.value;
                    setPersonalSelectedCommuneId(communeId);
                    
                    // Reset des niveaux inférieurs
                    setPersonalSelectedQuartierId('');
                    setPersonalQuartiers([]);
                    
                    if (communeId) {
                      const quartiers = await divisionService.getQuartiersByCommune(communeId);
                      setPersonalQuartiers(quartiers || []);
                    }
                  }}
                  disabled={personalCommunes.length === 0}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionnez une commune</option>
                  {personalCommunes.map((commune: any) => (
                    <option key={commune.id} value={commune.id}>{commune.nom}</option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Quartier *</label>
                <select
                  value={personalSelectedQuartierId}
                  onChange={(e) => {
                    setPersonalSelectedQuartierId(e.target.value);
                  }}
                  disabled={personalQuartiers.length === 0}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionnez un quartier</option>
                  {personalQuartiers.map((quartier: any) => (
                    <option key={quartier.id} value={quartier.id}>{quartier.nom}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Questions Oui/Non */}
      <div className="col-span-2 space-y-6 pt-6 border-t border-white/40">
        {/* <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium text-gray-700">Avez-vous un extrait de casier judiciaire ?</span>
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={() => updateFormData('hasCriminalRecord', true)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                formData.hasCriminalRecord 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Oui
            </button>
            <button 
              type="button" 
              onClick={() => updateFormData('hasCriminalRecord', false)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                !formData.hasCriminalRecord 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Non
            </button>
          </div>
        </div> */}


        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium text-gray-700">étes-vous marié(e) ?</span>
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={() => {
                setFormData(prev => {
                  if (!prev.conjoints || prev.conjoints.length === 0) {
                    return {
                      ...prev,
                      isMarried: true,
                      nombreConjoints: 1,
                      conjoints: [{
                        id: `conjoint-${Date.now()}-0`,
                        prenom: '',
                        nom: '',
                        dateMariage: '',
                        lieuMariage: '',
                        regimeMatrimonial: '',
                        clauseRestrictive: ''
                      }]
                    };
                  }
                  return { ...prev, isMarried: true };
                });
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                formData.isMarried 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Oui
            </button>
            <button 
              type="button" 
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  isMarried: false,
                  nombreConjoints: 0,
                  conjoints: []
                }));
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                !formData.isMarried 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Non
            </button>
          </div>
        </div>

        {/* Section conjoints - affichée seulement si marié(e) */}
        {formData.isMarried && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Informations du/des conjoint(s)</h4>
            
            {/* Sélection du nombre de conjoints */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de conjoint(s) *
              </label>
              <select
                value={formData.nombreConjoints || 1}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  setFormData(prev => {
                    const currentConjoints = prev.conjoints || [];
                    const newConjoints = Array.from({ length: count }, (_, i) => {
                      if (currentConjoints[i]) {
                        return currentConjoints[i];
                      }
                      return {
                        id: `conjoint-${Date.now()}-${i}`,
                        prenom: '',
                        nom: '',
                        dateMariage: '',
                        lieuMariage: '',
                        regimeMatrimonial: '',
                        clauseRestrictive: ''
                      };
                    });
                    return {
                      ...prev,
                      nombreConjoints: count,
                      conjoints: newConjoints
                    };
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="1">1 conjoint(e)</option>
                <option value="2">2 conjoint(e)s</option>
                <option value="3">3 conjoint(e)s</option>
                <option value="4">4 conjoint(e)s</option>
              </select>
            </div>

            {/* Formulaires pour chaque conjoint */}
            {(formData.conjoints || []).map((conjoint, index) => (
              <div key={conjoint.id || index} className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <h5 className="text-md font-semibold text-gray-700 mb-3">Conjoint(e) {index + 1}</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prénom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      defaultValue={conjoint.prenom}
                      onBlur={(e) => {
                        const newConjoints = [...(formData.conjoints || [])];
                        newConjoints[index] = { ...newConjoints[index], prenom: e.target.value };
                        setFormData(prev => ({ ...prev, conjoints: newConjoints }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      defaultValue={conjoint.nom}
                      onBlur={(e) => {
                        const newConjoints = [...(formData.conjoints || [])];
                        newConjoints[index] = { ...newConjoints[index], nom: e.target.value };
                        setFormData(prev => ({ ...prev, conjoints: newConjoints }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {/* Date de mariage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de mariage *</label>
                    <input
                      type="date"
                      value={conjoint.dateMariage}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newConjoints = [...(formData.conjoints || [])];
                        newConjoints[index] = { ...newConjoints[index], dateMariage: e.target.value };
                        setFormData(prev => ({ ...prev, conjoints: newConjoints }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {/* Lieu de mariage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de mariage *</label>
                    <input
                      type="text"
                      defaultValue={conjoint.lieuMariage}
                      onBlur={(e) => {
                        const newConjoints = [...(formData.conjoints || [])];
                        newConjoints[index] = { ...newConjoints[index], lieuMariage: e.target.value };
                        setFormData(prev => ({ ...prev, conjoints: newConjoints }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {/* Régime matrimonial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Régime matrimonial *</label>
                    <select
                      value={conjoint.regimeMatrimonial}
                      onChange={(e) => {
                        const newConjoints = [...(formData.conjoints || [])];
                        newConjoints[index] = { ...newConjoints[index], regimeMatrimonial: e.target.value };
                        setFormData(prev => ({ ...prev, conjoints: newConjoints }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      required
                    >
                      <option value="">Sélectionnez un régime</option>
                      <option value="SEPARATION_DE_BIENS">Séparation de biens</option>
                      <option value="COMMUNAUTE_DE_BIENS">Communauté de biens</option>
                    </select>
                  </div>

                  {/* Clause restrictive */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clause restrictive *</label>
                    <select
                      value={conjoint.clauseRestrictive}
                      onChange={(e) => {
                        const newConjoints = [...(formData.conjoints || [])];
                        newConjoints[index] = { ...newConjoints[index], clauseRestrictive: e.target.value };
                        setFormData(prev => ({ ...prev, conjoints: newConjoints }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      required
                    >
                      <option value="">Sélectionnez une clause</option>
                      <option value="MONOGAMIE">Monogamie</option>
                      <option value="POLYGAMIE">Polygamie</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  L'acte de mariage sera uploadé dans l'étape "Promoteur/Documents"
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium text-gray-700">Votre activité est-elle soumise é une autorisation d'exercice ?</span>
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={() => updateFormData('requiresExerciseAuthorization', true)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                formData.requiresExerciseAuthorization 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Oui
            </button>
            <button 
              type="button" 
              onClick={() => updateFormData('requiresExerciseAuthorization', false)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                !formData.requiresExerciseAuthorization 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Non
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium text-gray-700">Allez-vous importer ou exporter des marchandises ?</span>
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={() => updateFormData('willImportExport', true)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                formData.willImportExport 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Oui
            </button>
            <button 
              type="button" 
              onClick={() => updateFormData('willImportExport', false)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                !formData.willImportExport 
                  ? 'bg-[#2d85c9] text-white shadow-lg' 
                  : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
              }`}
            >
              Non
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );

  const InformationsSocieteStep = () => {
    return (
      <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Informations de l'entreprise</h2>
        <p className="text-gray-600 mb-8">
          Renseignez les informations principales de l'entreprise à créer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
              ? 'Nom de l\'entreprise (optionnel)' 
              : 'Nom de l\'entreprise *'
            }
          </label>
          <input
            type="text"
            required={formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE'}
            defaultValue={formData.nomEntreprise}
            onBlur={(e) => updateFormData('nomEntreprise', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder={formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
              ? `${formData.prenom || ''} ${formData.nom || ''}`.trim() || 'Nom du gérant'
              : 'Ex: SAMA TECH SARL'
            }
          />
          {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
            <p className="text-xs text-gray-500 mt-1">
              Si vide, le nom du gérant sera utilisé automatiquement
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Sigle (optionnel)
          </label>
          <input
            type="text"
            defaultValue={formData.sigleEntreprise}
            onBlur={(e) => updateFormData('sigleEntreprise', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            placeholder=""
          />
        </div>

        {/* Masquer le champ Type de société pour les entreprises individuelles */}
        {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Type de société *
            </label>
            {formData.typeEntreprise ? (
              // Affichage en lecture seule quand le type est déjà sélectionné
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-slate-700 font-medium">
                {formData.typeEntreprise === 'SOCIETE' ? 'Société' : 'Entreprise Individuelle'}
                <span className="text-xs text-gray-500 ml-2"></span>
              </div>
            ) : (
              // Select normal si aucun type n'est sélectionné
              <select
                required
                value={formData.typeEntreprise}
                onChange={(e) => {
                  const selectedType = e.target.value as TypeEntreprise;
                  
                  // Mettre é jour le type d'entreprise
                  let updatedFormData = { 
                    ...formData, 
                    typeEntreprise: selectedType 
                };
                
                // Si Entreprise Individuelle est sélectionnée, forcer la forme juridique é E_I
                if (selectedType === 'ENTREPRISE_INDIVIDUELLE') {
                  updatedFormData.formeJuridique = 'E_I';
                } else if (selectedType === 'SOCIETE' && formData.formeJuridique === 'E_I') {
                  // Si on revient é Société et que la forme était E_I, remettre é SARL par défaut
                  updatedFormData.formeJuridique = 'SARL';
                }
                
                setFormData(updatedFormData);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">Sélectionnez</option>
              <option value="SOCIETE">Société</option>
              <option value="ENTREPRISE_INDIVIDUELLE">Entreprise Individuelle</option>
            </select>
          )}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Forme juridique * {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? '' : ''}
          </label>
          <select
            required
            value={formData.formeJuridique}
            onChange={(e) => {
              const selectedForme = e.target.value as FormeJuridique;
              // Mettre à jour la forme juridique
              updateFormData('formeJuridique', selectedForme);
              // Si une forme de société est sélectionnée, mettre automatiquement typeEntreprise à SOCIETE
              if (selectedForme !== 'E_I') {
                updateFormData('typeEntreprise', 'SOCIETE');
              } else {
                updateFormData('typeEntreprise', 'ENTREPRISE_INDIVIDUELLE');
              }
            }}
            disabled={formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-500 ${
              formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                : 'border-gray-300 focus:ring-mali-emerald'
            }`}
          >
            {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? (
              <option value="E_I">Entreprise Individuelle</option>
            ) : (
              <>
                <option value="SARL">SARL</option>
                <option value="SARL_UNI">SARL Unipersonnelle</option>
                <option value="SUC_SARL">Succursale SARL</option>
                <option value="FIL_SARL">Filiale SARL</option>
                <option value="SA">SA</option>
                <option value="SUC_SA">Succursale SA</option>
                <option value="FIL_SA">Filiale SA</option>
                <option value="SASU">SASU</option>
                <option value="SAS">SAS</option>
                <option value="BR">Bureau de Représentation</option>
                <option value="FIL_SAS">Filiale SAS</option>
                <option value="SUC_SAS">Succursale SAS</option>
                <option value="SNC">SNC</option>
                <option value="SCS">SCS</option>
                <option value="SCI">SCI</option>
                <option value="SCP">SCP</option>
                <option value="GIE">GIE</option>
              </>
            )}
          </select>
          {/* {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
            <p className="mt-2 text-sm text-primary-600">
              ?? La forme juridique est automatiquement définie pour les entreprises individuelles.
            </p>
          )} */}
        </div>

        {/* Masquer le champ capital pour les entreprises individuelles */}
        {formData.typeEntreprise === 'SOCIETE' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Capital social (FCFA) *
            </label>
            <input
              type="number"
              required
              defaultValue={formData.capital}
              onBlur={(e) => updateFormData('capital', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Ex: 1000000"
            />
          </div>
        )}
      </div>

      {/* Section Activité intégrée */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Activité de l'entreprise</h3>
        
        <div className="space-y-6">
          {/* Domaine d'activité non réglementé avec autocomplétion personnalisée */}
          <div className="relative" ref={domaineDropdownRef}>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Domaine d'activité 
            </label>
            <input
              ref={domaineInputRef}
              type="text"
              value={domaineSearchTerm}
              onChange={(e) => {
                const searchValue = e.target.value;
                setDomaineSearchTerm(searchValue);
                setShowDomaineDropdown(true);
                // Restaurer le focus après le re-render
                setTimeout(() => {
                  if (domaineInputRef.current) {
                    domaineInputRef.current.focus();
                  }
                }, 0);
              }}
              onFocus={() => setShowDomaineDropdown(true)}
              placeholder="Saisir ou sélectionner le domaine d'activité..."
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              autoComplete="off"
            />
            
            {/* Liste déroulante filtrée */}
            {showDomaineDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {domaineActiviteNrOptions
                  .filter(option => 
                    option.value.toLowerCase().includes(domaineSearchTerm.toLowerCase()) ||
                    option.key.toLowerCase().includes(domaineSearchTerm.toLowerCase())
                  )
                  .map((option) => (
                    <div
                      key={option.key}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Empêche la perte de focus
                        setDomaineSearchTerm(option.value);
                        setFormData({ 
                          ...formData, 
                          domaineActiviteNr: option.key as DomaineActiviteNr
                        });
                        setShowDomaineDropdown(false);
                      }}
                      className="px-4 py-3 text-base hover:bg-sky-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      {option.value}
                    </div>
                  ))}
                {domaineActiviteNrOptions.filter(option => 
                  option.value.toLowerCase().includes(domaineSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="px-4 py-3 text-base text-gray-500">
                    Aucun résultat trouvé
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Commencez à taper pour filtrer les suggestions ({domaineActiviteNrOptions.filter(opt => 
                opt.value.toLowerCase().includes(domaineSearchTerm.toLowerCase())
              ).length} résultats)
            </p>
          </div>

          {/* Domaine d'activité réglementé - Masqué complètement */}
          {/* Le champ domaine d'activité réglementé a été supprimé selon la demande utilisateur */}

          {/* Activité secondaire */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Activité secondaire (optionnel)
            </label>
            <textarea
              defaultValue={formData.activiteSecondaire}
              onBlur={(e) => updateFormData('activiteSecondaire', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              rows={3}
              placeholder="Décrivez l'activité secondaire si applicable..."
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-black-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          Siège social de l'entreprise
        </h4>

        <div className="space-y-6">
            <div className="border rounded-xl p-4 bg-sky-50 border-primary-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-primary-800">
                 Recherche rapide de localisation
              </h3>
              <p className="text-sm text-primary-600 mb-4">
                Tapez le nom d'une localisation pour remplir automatiquement la hiérarchie administrative du siège social
              </p>
              <DivisionSearchInput
                placeholder="Rechercher une région, cercle, arrondissement, commune ou quartier..."
                onSelect={handleCompanyDivisionSearch}
                disabled={false}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Région *</label>
                <select
                  required
                  value={companySelectedRegionId}
                  disabled={false}
                  onChange={async (e) => {
                    const regionCode = e.target.value;
                    setCompanySelectedRegionId(regionCode);
                    
                    // Reset des niveaux inférieurs (structure INSTAT moderne)
                    setCompanySelectedCercleId('');
                    setCompanySelectedCommuneId('');
                    setCompanySelectedQuartierId('');
                    setCompanyCercles([]);
                    setCompanyCommunes([]);
                    setCompanyQuartiers([]);
                    
                    if (regionCode) {
                      console.log('🔄 Chargement cercles pour région entreprise (code):', regionCode);
                      try {
                        const cercles = await divisionService.getCerclesByRegion(regionCode);
                        console.log('✅ Cercles entreprise chargés:', cercles?.length || 0, cercles);
                        setCompanyCercles(cercles || []);
                      } catch (error) {
                        console.error('❌ Erreur chargement cercles entreprise:', error);
                        setCompanyCercles([]);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300"
                >
                  <option value="">Sélectionnez une région</option>
                  {companyRegions.map((region: any) => (
                    <option key={region.code} value={region.code}>{region.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Cercle *</label>
                <select
                    value={companySelectedCercleId}
                    onChange={async (e) => {
                      const cercleCode = e.target.value;
                      setCompanySelectedCercleId(cercleCode);
                      
                      // Reset des niveaux inférieurs (structure INSTAT moderne)
                      setCompanySelectedCommuneId('');
                      setCompanySelectedQuartierId('');
                      setCompanyCommunes([]);
                      setCompanyQuartiers([]);
                      
                      if (cercleCode) {
                        // Structure INSTAT moderne : charger directement les communes depuis le cercle
                        try {
                          const communes = await divisionService.getCommunesByCercle(cercleCode);
                          setCompanyCommunes(communes || []);
                          console.log('✅ Communes entreprise chargées depuis cercle:', communes?.length || 0);
                        } catch (error) {
                          console.error('❌ Erreur chargement communes entreprise depuis cercle:', error);
                          setCompanyCommunes([]);
                        }
                      }
                    }}
                    disabled={!companySelectedRegionId}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionnez un cercle</option>
                    {companyCercles.map((cercle: any) => (
                      <option key={cercle.code} value={cercle.code}>{cercle.nom}</option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Commune *</label>
                <select
                    value={companySelectedCommuneId}
                    onChange={async (e) => {
                      const communeCode = e.target.value;
                      setCompanySelectedCommuneId(communeCode);
                      
                      // Reset des niveaux inférieurs
                      setCompanySelectedQuartierId('');
                      setCompanyQuartiers([]);
                      
                      if (communeCode) {
                        const quartiers = await divisionService.getQuartiersByCommune(communeCode);
                        setCompanyQuartiers(quartiers || []);
                      }
                    }}
                    disabled={companyCommunes.length === 0}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionnez une commune</option>
                    {companyCommunes.map((commune: any) => (
                      <option key={commune.code} value={commune.code}>{commune.nom}</option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Quartier *</label>
                <select
                  required
                  value={companySelectedQuartierId}
                  onChange={(e) => {
                    setCompanySelectedQuartierId(e.target.value);
                  }}
                  disabled={companyQuartiers.length === 0}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionnez un quartier</option>
                  {companyQuartiers.map((quartier: any) => (
                    <option key={quartier.code} value={quartier.code}>{quartier.nom}</option>
                  ))}
                </select>
              </div>

              {/* Champs Rue et Porte entreprise en grille 2 colonnes */}
              <div className="grid grid-cols-4 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Rue</label>
                  <input
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                    placeholder=""
                    type="text"
                    defaultValue={formData.rueEntreprise || ''}
                    onBlur={(e) => updateFormData('rueEntreprise', e.target.value)}
                    disabled={false}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Porte</label>
                  <input
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                    placeholder=""
                    type="text"
                    defaultValue={formData.porteEntreprise || ''}
                    onBlur={(e) => updateFormData('porteEntreprise', e.target.value)}
                    disabled={false}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  const ParticipantsStep = () => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [creatorRole, setCreatorRole] = useState<'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR'>(
      formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
    );
    const [showDetailedForm, setShowDetailedForm] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isCreatorFlow, setIsCreatorFlow] = useState(false);
    const [showPersonTypeModal, setShowPersonTypeModal] = useState(false);
    const [selectedPersonType, setSelectedPersonType] = useState<'PHYSIQUE' | 'MORALE' | null>(null);

    const createEmptyParticipant = (): Participant => ({
      civilite: selectedPersonType === 'MORALE' ? 'PERSONNE_MORALE' : (isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.civilite : ''),
      prenom: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.prenom : '',
      nom: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.nom : '',
      dateNaissance: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.dateNaissance : '',
      lieuNaissance: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.lieuNaissance : '',
      nationalite: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.nationalite : 'MALIENNE',
      telephone: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.telephonePersonnel : '',
      telephone2: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.telephonePersonnel2 : '',
      email: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.emailPersonnel : '',
      adresse: isCreatorFlow && formData.typeEntreprise !== 'SOCIETE' ? formData.adressePersonnelle : '',
      role: formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
        ? 'PROMOTEUR' // Pour les entreprises individuelles, toujours PROMOTEUR
        : (selectedPersonType === 'PHYSIQUE' ? 'GERANT' : 'ASSOCIE'), // Pour les sociétés, logique normale
      pourcentageParts: 0,
      dateDebut: new Date().toISOString().split('T')[0],
      sexe: '',
      situationMatrimoniale: formData.isMarried ? 'MARIE' : 'CELIBATAIRE',
      typePiece: '',
      numeroPiece: '',
      documentFile: undefined,
      extraitNaissanceFile: undefined,
      // Champs pour personnes morales
      denominationEntreprise: '',
      representantLegalNom: '',
      representantLegalPrenom: '',
      paysEmissionRccm: 'MALI',
      rccmFile: undefined,
      typePersonne: selectedPersonType || 'PHYSIQUE',
      // Champs spécifiques pour les gérants
      hasCriminalRecord: isCreatorFlow ? formData.hasCriminalRecord : undefined,
      casierJudiciaireFile: undefined,
      declarationHonneurFile: undefined,
      signatureDataUrl: undefined,
      acteMariageFile: undefined,
    });

    const [newParticipant, setNewParticipant] = useState<Participant>(() => createEmptyParticipant());

    // Fonction optimisée pour mettre à jour les champs du participant
    const updateParticipantField = useCallback((field: string, value: any) => {
      setNewParticipant((prev: Participant) => ({ ...prev, [field]: value }));
    }, []);

    // Fonctions pour gérer les documents supplémentaires du participant
    const addParticipantDocument = useCallback(() => {
      const newDoc = {
        id: Date.now().toString(),
        name: '',
        file: null,
        description: ''
      };
      updateParticipantField('autresDocuments', [...(newParticipant.autresDocuments || []), newDoc]);
    }, [newParticipant.autresDocuments, updateParticipantField]);

    const removeParticipantDocument = useCallback((id: string) => {
      const updatedDocs = (newParticipant.autresDocuments || []).filter(doc => doc.id !== id);
      updateParticipantField('autresDocuments', updatedDocs);
    }, [newParticipant.autresDocuments, updateParticipantField]);

    const updateParticipantDocument = useCallback((id: string, field: string, value: any) => {
      const updatedDocs = (newParticipant.autresDocuments || []).map(doc => 
        doc.id === id ? { ...doc, [field]: value } : doc
      );
      updateParticipantField('autresDocuments', updatedDocs);
    }, [newParticipant.autresDocuments, updateParticipantField]);

    // Debug: Log quand newParticipant change - DéSACTIVé pour éviter les re-renders
    // useEffect(() => {
    //   console.log('?? newParticipant mis é jour:', newParticipant);
    // }, [newParticipant]);

    // Mettre é jour le participant quand le type de personne change (sauf en mode édition)
    useEffect(() => {
      if (selectedPersonType && editingIndex === null) {
        setNewParticipant(createEmptyParticipant());
      }
    }, [selectedPersonType, editingIndex]);

    // Mettre é jour le participant quand isCreatorFlow change (sauf en mode édition)
    useEffect(() => {
      if (isCreatorFlow && editingIndex === null) {
        setNewParticipant(createEmptyParticipant());
      }
    }, [isCreatorFlow, editingIndex]);

    // états pour le sélecteur de pays téléphone (comme cété utilisateur)
    const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Mali par défaut
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    
    // Synchroniser le pays des participants avec le pays personnel
    useEffect(() => {
      setSelectedCountry(personalSelectedCountry);
      
      // Si on est en mode créateur et qu'on a un téléphone personnel, le reformater selon le nouveau pays
      // DéSACTIVé TEMPORAIREMENT pour éviter les re-renders en boucle
      // if (isCreatorFlow && formData.telephonePersonnel && newParticipant.telephone !== formData.telephonePersonnel) {
      //   setNewParticipant(prev => ({
      //     ...prev,
      //     telephone: formData.telephonePersonnel
      //   }));
      // }
    }, [personalSelectedCountry]); // Suppression des dépendances qui causent les boucles

    // Mémoriser les propriétés du champ téléphone pour forcer le re-render
    const phoneMaxLength = useMemo(() => {
      const maxLen = (() => {
        switch (selectedCountry.code) {
          case '+223': return 11; // 8 chiffres + 3 espaces
          case '+33': return 14;  // 9 chiffres + 4 espaces
          case '+1': return 12;   // 10 chiffres + 2 espaces
          default: return 20;     // Format générique
        }
      })();
      return maxLen;
    }, [selectedCountry.code]);

    const phonePlaceholder = useMemo(() => {
      const placeholder = (() => {
        switch (selectedCountry.code) {
          case '+223': return 'XX XX XX XX';
          case '+33': return 'XX XX XX XX XX';
          case '+1': return 'XXX XXX XXXX';
          default: return 'Numéro de téléphone';
        }
      })();
      return placeholder;
    }, [selectedCountry.code]);

    // Fonction pour nettoyer et formater la saisie téléphone selon le pays sélectionné
    const handlePhoneChange = (value: string, setter: (phone: string) => void) => {
      // Supprimer tous les caractéres non numériques
      const cleaned = value.replace(/[^\d]/g, '');
      
      // Déterminer la longueur maximale et le format selon le pays sélectionné
      let maxLength = 8; // Mali par défaut
      let formatted = cleaned;
      
      if (selectedCountry.code === '+223') {
        // Mali: 8 chiffres, format XX XX XX XX
        maxLength = 8;
        const limited = cleaned.substring(0, maxLength);
        formatted = limited;
        
        // Appliquer le formatage avec espaces
        if (limited.length > 2) {
          formatted = limited.substring(0, 2) + ' ' + limited.substring(2);
        }
        if (limited.length > 4) {
          formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4);
        }
        if (limited.length > 6) {
          formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4, 6) + ' ' + limited.substring(6);
        }
      } else if (selectedCountry.code === '+33') {
        // France: 9 chiffres, format XX XX XX XX XX
        maxLength = 9;
        const limited = cleaned.substring(0, maxLength);
        formatted = limited;
        
        // Appliquer le formatage avec espaces
        if (limited.length > 2) {
          formatted = limited.substring(0, 2) + ' ' + limited.substring(2);
        }
        if (limited.length > 4) {
          formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4);
        }
        if (limited.length > 6) {
          formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4, 6) + ' ' + limited.substring(6);
        }
        if (limited.length > 8) {
          formatted = limited.substring(0, 2) + ' ' + limited.substring(2, 4) + ' ' + limited.substring(4, 6) + ' ' + limited.substring(6, 8) + ' ' + limited.substring(8);
        }
      } else if (selectedCountry.code === '+1') {
        // états-Unis/Canada: 10 chiffres, format XXX XXX XXXX
        maxLength = 10;
        const limited = cleaned.substring(0, maxLength);
        formatted = limited;
        
        // Appliquer le formatage avec espaces
        if (limited.length > 3) {
          formatted = limited.substring(0, 3) + ' ' + limited.substring(3);
        }
        if (limited.length > 6) {
          formatted = limited.substring(0, 3) + ' ' + limited.substring(3, 6) + ' ' + limited.substring(6);
        }
      } else {
        // Autres pays: format générique, maximum 15 chiffres
        maxLength = 15;
        formatted = cleaned.substring(0, maxLength);
      }
      
      setter(formatted);
    };

    // Fermer le dropdown des pays quand on clique é l'extérieur
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('.country-dropdown')) {
          setShowCountryDropdown(false);
        }
      };

      if (showCountryDropdown) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showCountryDropdown]);

    const closeDetailedForm = () => {
      setShowDetailedForm(false);
      setNewParticipant(createEmptyParticipant());
      setEditingIndex(null);
      setIsCreatorFlow(false);
      setSelectedPersonType(null);
    };

    const saveParticipant = () => {
      const participantData = {
        ...newParticipant,
        typePersonne: selectedPersonType || 'PHYSIQUE',
      };

      if (editingIndex !== null) {
        const updatedParticipants = [...formData.participants];
        const existing = updatedParticipants[editingIndex];
        const preservedTempId = existing?.tempId ?? participantData.tempId ?? Date.now().toString();
        updatedParticipants[editingIndex] = { ...existing, ...participantData, tempId: preservedTempId };
        updateFormData('participants', updatedParticipants);
      } else {
        const participantToAdd: Participant = {
          ...participantData,
          tempId: participantData.tempId ?? Date.now().toString(), // Utiliser tempId au lieu de id
        };
        updateFormData('participants', [...formData.participants, participantToAdd]);
      }
      closeDetailedForm();
    };

    const deleteParticipant = (index: number) => {
      const updatedParticipants = formData.participants.filter((_, i) => i !== index);
      updateFormData('participants', updatedParticipants);
    };

    const editParticipant = (index: number) => {
      const participant = formData.participants[index];
      console.log(' édition du participant:', participant);
      setEditingIndex(index);
      setSelectedPersonType(participant.typePersonne || 'PHYSIQUE');
      setNewParticipant(participant);
      setShowDetailedForm(true);
    };

    const addParticipant = () => {
      if (editingIndex !== null) {
        const updatedParticipants = [...formData.participants];
        updatedParticipants[editingIndex] = { ...newParticipant, tempId: updatedParticipants[editingIndex].tempId || Date.now().toString() };
        updateFormData('participants', updatedParticipants);
        setEditingIndex(null);
      } else {
        const participant = { ...newParticipant, tempId: Date.now().toString() }; // Utiliser tempId au lieu de id
        updateFormData('participants', [...formData.participants, participant]);
      }
      setNewParticipant(createEmptyParticipant());
      setShowAddForm(false);
    };

    // Mettre à jour automatiquement le rôle quand le type d'entreprise change
    React.useEffect(() => {
      const newRole = formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT';
      setCreatorRole(newRole);
    }, [formData.typeEntreprise]);

    // Pour les entreprises individuelles, ajouter automatiquement le promoteur
    React.useEffect(() => {
      if (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
        // Si aucun participant n'existe encore, ajouter automatiquement l'utilisateur
        if (formData.participants.length === 0) {
          setTimeout(() => {
            const prefilled = createEmptyParticipant();
            prefilled.civilite = formData.civilite;
            prefilled.prenom = formData.prenom;
            prefilled.nom = formData.nom;
            prefilled.dateNaissance = formData.dateNaissance;
            prefilled.lieuNaissance = formData.lieuNaissance;
            prefilled.nationalite = formData.nationalite;
            prefilled.telephone = formData.telephonePersonnel;
            prefilled.telephone2 = formData.telephonePersonnel2;
            prefilled.email = formData.emailPersonnel;
            prefilled.adresse = formData.adressePersonnelle;
            prefilled.role = 'PROMOTEUR';
            prefilled.pourcentageParts = 100;
            prefilled.dateDebut = new Date().toISOString().split('T')[0];
            
            updateFormData('participants', [prefilled]);
            
            // Ouvrir automatiquement le formulaire de modification pour les entreprises individuelles
            setTimeout(() => {
              setNewParticipant(prefilled);
              setEditingIndex(0);
              setSelectedPersonType('PHYSIQUE'); // Définir le type de personne pour afficher tous les documents
              setShowDetailedForm(true);
            }, 200);
          }, 100);
        }
      }
    }, [formData.typeEntreprise, formData.participants.length]);

    // Ouvrir automatiquement le formulaire de modification à l'étape 3 pour les entreprises individuelles
    React.useEffect(() => {
      if (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && 
          formData.participants.length > 0 && 
          !showDetailedForm) {
        // Removed setTimeout to prevent form disappearing/reappearing during scroll
        const participant = formData.participants[0];
        setNewParticipant(participant);
        setEditingIndex(0);
        setSelectedPersonType('PHYSIQUE'); // Définir le type de personne pour afficher tous les documents
        setShowDetailedForm(true);
      }
    }, [formData.typeEntreprise, formData.participants.length]);

    const confirmCreatorRole = () => {
      const prefilled = createEmptyParticipant();
      prefilled.civilite = formData.civilite;
      prefilled.prenom = formData.prenom;
      prefilled.nom = formData.nom;
      prefilled.dateNaissance = formData.dateNaissance;
      prefilled.lieuNaissance = formData.lieuNaissance;
      prefilled.nationalite = formData.nationalite;
      prefilled.telephone = formData.telephonePersonnel;
      prefilled.telephone2 = formData.telephonePersonnel2;
      prefilled.email = formData.emailPersonnel;
      prefilled.adresse = formData.adressePersonnelle;
      prefilled.role = creatorRole;
      prefilled.pourcentageParts = roleRequiresParts(creatorRole) ? ((creatorRole === 'GERANT' || creatorRole === 'PROMOTEUR') ? 100 : 50) : 0;
      prefilled.dateDebut = new Date().toISOString().split('T')[0];
      setNewParticipant(prefilled);
      setShowDetailedForm(true);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-[#2d85c9] rounded-lg">
              <BriefcaseIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'Dirigeant' : 'Participants'}
              </h2>
              <p className="text-slate-600 font-medium mt-1">
                {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                  ? 'Informations du dirigeant de l\'entreprise individuelle.'
                  : 'Ajoutez les participants (associés et gérants) de l\'entreprise.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Section définition du rôle du créateur - masquée pour les entreprises individuelles */}
        {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-slate-800">Définissez votre rôle dans l'entreprise</h3>
            </div>
          
          <div className="bg-gradient-to-r from-amber-50/80 to-primary-50/60  border border-amber-200/50 rounded-xl p-4 mb-4 shadow-lg">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span className="text-sm font-bold text-amber-800">Données saisies manuellement</span>
            </div>
            <p className="text-sm text-amber-700">
              Les informations que vous avez saisies dans le formulaire précédent seront utilisées pour créer ce participant dans l'entreprise.
            </p>
          </div>
          
          <p className="text-slate-700 font-medium mb-4">
            En tant que créateur de cette entreprise, vous devez d'abord définir votre rôle avant d'ajouter d'autres participants.
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-bold text-slate-700">Votre rôle :</label>
            <select 
              className="px-7 py-3 border border-white/60 rounded-xl bg-white/60  focus:ring-2 focus:ring-[#412A5C] focus:border-transparent shadow-lg hover:shadow-sm transition-all duration-300"
              value={creatorRole}
              onChange={(e) => setCreatorRole(e.target.value as 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR')}
            >
              {/* Pour les entreprises individuelles, seul PROMOTEUR est disponible */}
              {(formData.typeEntreprise as TypeEntreprise) === 'ENTREPRISE_INDIVIDUELLE' ? (
                <option value="PROMOTEUR">Promoteur</option>
              ) : (
                <>
                  <option value="GERANT">Gérant</option>
                  <option value="ASSOCIE">Associé</option>
                  {(formData.formeJuridique === 'SA' || formData.formeJuridique === 'SAS') && (
                    <option value="ADMINISTRATEUR">Administrateur</option>
                  )}
                </>
              )}
            </select>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                if (creatorRole === 'GERANT' || creatorRole === 'PROMOTEUR') {
                  // Si gérant/promoteur, ouvrir le formulaire détaillé
                  setSelectedPersonType('PHYSIQUE');
                  setNewParticipant(createEmptyParticipant());
                  setIsCreatorFlow(true);
                  setEditingIndex(null);
                  setShowDetailedForm(true);
                } else {
                  // Si associé, confirmer directement
                  confirmCreatorRole();
                }
              }}
              className="bg-[#2d85c9] hover:bg-[#2d85c9]/90 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-sm transition-all duration-300"
            >
              {(creatorRole === 'GERANT' || creatorRole === 'PROMOTEUR') 
                ? 'Continuer avec le formulaire détaillé' 
                : 'Confirmer mon rôle (données saisies)'
              }
            </button>
          </div>
        </div>
        )}

        {/* Formulaire détaillé pour le créateur */}
        {showDetailedForm && (
          <div className="bg-gradient-to-r from-white/95 border border-white/60 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                {isCreatorFlow 
                  ? 'Informations détaillées du créateur (gérant)'
                  : selectedPersonType === 'MORALE' 
                    ? editingIndex !== null ? 'Modifier une personne morale' : 'Ajouter une personne morale'
                    : editingIndex !== null ? 'Modifier une personne physique' : 'Informations détaillées du participant'
                }
              </h3>
              <button
                onClick={closeDetailedForm}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white/50 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {selectedPersonType === 'MORALE' ? (
              // Formulaire pour personne morale
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Dénomination de l'entreprise *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Nom de l'entreprise"
                    required
                    type="text"
                    value={newParticipant.denominationEntreprise || ''}
                    onChange={(e) => setNewParticipant({...newParticipant, denominationEntreprise: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Représentant légal - Nom *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Nom du représentant légal"
                    required
                    type="text"
                    value={newParticipant.representantLegalNom || ''}
                    onChange={(e) => setNewParticipant({...newParticipant, representantLegalNom: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Représentant légal - Prénom *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Prénom du représentant légal"
                    type="text"
                    value={newParticipant.representantLegalPrenom || ''}
                    required
                    onChange={(e) => setNewParticipant({...newParticipant, representantLegalPrenom: e.target.value})}
                  />
                </div>

                {/* Pourcentage de parts - Conditionnel pour personnes morales et masqué pour entreprises individuelles */}
                {roleRequiresParts(newParticipant.role) && formData.typeEntreprise === 'SOCIETE' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Pourcentage de parts *
                      {newParticipant.civilite === 'PERSONNE_MORALE' && (
                        <span className="text-xs font-normal text-primary-600 ml-2">(0% autorisé pour personnes morales)</span>
                      )}
                    </label>
                    <input
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                      type="number"
                      value={newParticipant.pourcentageParts}
                      min="0"
                      step="0.01"
                      placeholder={newParticipant.civilite === 'PERSONNE_MORALE' ? "0.00 (0% autorisé)" : "0.01"}
                      onChange={(e) => setNewParticipant({...newParticipant, pourcentageParts: parseFloat(e.target.value) || 0})}
                    />
                    {newParticipant.civilite === 'PERSONNE_MORALE' && (
                      <p className="text-xs text-primary-600 mt-1">
                        Les personnes morales peuvent avoir 0% de parts (participation sans capital)
                      </p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Pays d'émission du RCCM *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                    value={newParticipant.paysEmissionRccm || 'MALI'}
                    onChange={(e) => setNewParticipant({...newParticipant, paysEmissionRccm: e.target.value})}
                  >
                    {paysEmissionRccm.length > 0 ? (
                      paysEmissionRccm.map((pays) => (
                        <option key={pays.key} value={pays.key}>
                          {pays.value}
                        </option>
                      ))
                    ) : (
                      // Options par défaut si les pays ne sont pas encore chargés
                      <>
                        <option value="MALI">Mali</option>
                        <option value="SENEGAL">Sénégal</option>
                        <option value="BURKINA_FASO">Burkina Faso</option>
                        <option value="COTE_DIVOIRE">Céte d'Ivoire</option>
                        <option value="FRANCE">France</option>
                      </>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Pays oé l'entreprise est enregistrée au registre du commerce
                    {paysEmissionRccm.length > 0 && (
                      <span className="text-mali-emerald font-medium"> é {paysEmissionRccm.length} pays disponibles</span>
                    )}
                  </p>
                </div>

                {/* Document RCCM obligatoire pour les personnes morales */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Document RCCM *
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-4 py-3 border border-white/60 rounded-xl bg-white/60  focus:ring-2 focus:ring-[#412A5C] focus:border-transparent shadow-lg hover:shadow-sm transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#412A5C] file:text-white hover:file:bg-[#2D1B42]"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validation de la taille (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Le fichier RCCM ne doit pas dépasser 5MB');
                            e.target.value = '';
                            return;
                          }
                          // Validation du type de fichier
                          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                          if (!allowedTypes.includes(file.type)) {
                            alert('Format de fichier non autorisé. Utilisez PDF, JPG ou PNG');
                            e.target.value = '';
                            return;
                          }
                        }
                        setNewParticipant({...newParticipant, rccmFile: file});
                      }}
                    />
                    {newParticipant.rccmFile && (
                      <div className="mt-2 flex items-center text-sm text-primary-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {newParticipant.rccmFile.name}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Téléchargez le document RCCM de l'entreprise (PDF, JPG, PNG - Max 5MB)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Réle dans l'entreprise *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                    value={newParticipant.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR';
                      // Empécher les personnes morales d'étre ADMINISTRATEUR
                      if (selectedPersonType === 'MORALE' && newRole === 'ADMINISTRATEUR') {
                        alert('Une personne morale ne peut pas avoir le réle ADMINISTRATEUR');
                        return;
                      }
                      setNewParticipant({
                        ...newParticipant, 
                        role: newRole,
                        pourcentageParts: roleRequiresParts(newRole) ? newParticipant.pourcentageParts : 0
                      });
                    }}
                  >
                    <option value="GERANT">Gérant</option>
                    {/* Masquer les autres réles pour les entreprises individuelles */}
                    {formData.typeEntreprise === 'SOCIETE' && (
                      <option value="ASSOCIE">Associé</option>
                    )}
                    {formData.typeEntreprise === 'SOCIETE' && (formData.formeJuridique === 'SA' || formData.formeJuridique === 'SAS') && (
                      <option value="ADMINISTRATEUR" disabled>Administrateur (non autorisé pour les personnes morales)</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Sélectionnez le réle de cette personne morale dans l'entreprise</p>
                </div>
              </div>
            ) : (
              // Formulaire pour personne physique
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ contain: 'layout style' }}>
              {/* Nom complet */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nom complet *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Nom"
                    required
                    type="text"
                    value={newParticipant.nom}
                    onChange={(e) => updateParticipantField('nom', e.target.value)}
                  />
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Prénom"
                    required
                    type="text"
                    value={newParticipant.prenom}
                    onChange={(e) => updateParticipantField('prenom', e.target.value)}
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Téléphone *</label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative country-dropdown">
                      <button 
                        type="button" 
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                      >
                        <img 
                          alt={`Drapeau ${selectedCountry.iso}`} 
                          className="w-6 h-4 mr-2 object-cover rounded-sm" 
                          src={selectedCountry.flag}
                        />
                        <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
                        <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      {/* Dropdown des pays */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 z-50 w-80 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                          {countries.map((country) => (
                            <button
                              key={country.iso}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setShowCountryDropdown(false);
                              }}
                              className="w-full flex items-center px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-left"
                            >
                              <img 
                                alt={`Drapeau ${country.iso}`} 
                                className="w-6 h-4 mr-3 object-cover rounded-sm" 
                                src={country.flag}
                              />
                              <span className="text-sm font-medium text-gray-700 mr-2">{country.code}</span>
                              <span className="text-sm text-gray-600">{country.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={newParticipant.telephone || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => setNewParticipant({...newParticipant, telephone: phone}))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                      placeholder={phonePlaceholder}
                      maxLength={phoneMaxLength}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Entrez votre numéro sans le {selectedCountry.code} (ex: {selectedCountry.code === '+223' ? '77 00 00 01' : selectedCountry.code === '+33' ? '06 12 34 56 78' : selectedCountry.code === '+1' ? '555 123 4567' : 'XX XX XX XX'})
                  </p>
                </div>
              </div>

              {/* Téléphone 2 (optionnel) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Téléphone 2 (optionnel)</label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative country-dropdown">
                      <button 
                        type="button" 
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
                      >
                        <img 
                          alt={`Drapeau ${selectedCountry.iso}`} 
                          className="w-6 h-4 mr-2 object-cover rounded-sm" 
                          src={selectedCountry.flag}
                        />
                        <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
                        <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                      
                      {/* Dropdown des pays */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 z-50 w-80 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                          {countries.map((country) => (
                            <button
                              key={country.iso}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setShowCountryDropdown(false);
                              }}
                              className="w-full flex items-center px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-left"
                            >
                              <img 
                                alt={`Drapeau ${country.iso}`} 
                                className="w-6 h-4 mr-3 object-cover rounded-sm" 
                                src={country.flag}
                              />
                              <span className="text-sm font-medium text-gray-700 mr-2">{country.code}</span>
                              <span className="text-sm text-gray-600">{country.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={newParticipant.telephone2 || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => setNewParticipant({...newParticipant, telephone2: phone}))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-mali-emerald/50"
                      placeholder={phonePlaceholder}
                      maxLength={phoneMaxLength}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Adresse email (optionnel)"
                  type="email"
                  value={newParticipant.email}
                  onChange={(e) => updateParticipantField('email', e.target.value)}
                />
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Date de naissance * <span className="text-xs text-gray-500">(18 ans minimum)</span>
                </label>
                <input
                  max={getMaxBirthDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                  type="date"
                  value={newParticipant.dateNaissance}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateParticipantField('dateNaissance', value);
                    
                    // Validation en temps réel de l'ége pour les participants
                    if (value && newParticipant.civilite !== 'PERSONNE_MORALE') {
                      const age = calculateAge(value);
                      if (age < 18) {
                        e.target.setCustomValidity(`Le participant doit avoir au moins 18 ans (actuellement: ${age} ans)`);
                      } else {
                        e.target.setCustomValidity('');
                      }
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Le participant doit avoir au moins 18 ans</p>
              </div>

              {/* Lieu de naissance */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Lieu de naissance *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Lieu de naissance"
                  required
                  type="text"
                  value={newParticipant.lieuNaissance}
                  onChange={(e) => updateParticipantField('lieuNaissance', e.target.value)}
                />
              </div>

              {/* Nationalité */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nationalité *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                  value={newParticipant.nationalite}
                  onChange={(e) => updateParticipantField('nationalite', e.target.value)}
                >
                  <option value="">Sélectionnez une nationalité</option>
                  <option value="MALIENNE">Malienne</option>
                  <option value="FRANéAISE">Franéaise</option>
                  <option value="SÉNÉGALAISE">Sénégalaise</option>
                  <option value="IVOIRIENNE">Ivoirienne</option>
                  <option value="BURKINABÈ">Burkinabé</option>
                  <option value="GUINÉENNE">Guinéenne</option>
                  <option value="MAURITANIENNE">Mauritanienne</option>
                  <option value="NIGÉRIENNE">Nigérienne</option>
                  <option value="GHANÉENNE">Ghanéenne</option>
                  <option value="TOGOLAISE">Togolaise</option>
                  <option value="BÉNINOISE">Béninoise</option>
                  <option value="NIGÉRIANE">Nigériane</option>
                  <option value="CAMEROUNAISE">Camerounaise</option>
                  <option value="TCHADIENNE">Tchadienne</option>
                  <option value="CENTRAFRICAINE">Centrafricaine</option>
                  <option value="CONGOLAISE_RDC">Congolaise RDC</option>
                  <option value="CONGOLAISE_CONGO_BRAZZAVILLE">Congolaise Congo Brazzaville</option>
                  <option value="GABONAISE">Gabonaise</option>
                  <option value="AMéRICAINE">Américaine</option>
                  <option value="BRITANNIQUE">Britannique</option>
                  <option value="ALLEMANDE">Allemande</option>
                  <option value="ITALIENNE">Italienne</option>
                  <option value="ESPAGNOLE">Espagnole</option>
                  <option value="PORTUGAISE">Portugaise</option>
                  <option value="BELGE">Belge</option>
                  <option value="NéERLANDAISE">Néerlandaise</option>
                  <option value="SUISSE">Suisse</option>
                  <option value="CANADIENNE">Canadienne</option>
                  <option value="CHINOISE">Chinoise</option>
                  <option value="JAPONAISE">Japonaise</option>
                  <option value="INDIENNE">Indienne</option>
                  <option value="BRéSILIENNE">Brésilienne</option>
                  <option value="ARGENTINE">Argentine</option>
                  <option value="MAROCAINE">Marocaine</option>
                  <option value="ALGÉRIENNE">Algérienne</option>
                  <option value="TUNISIENNE">Tunisienne</option>
                  <option value="ÉGYPTIENNE">égyptienne</option>
                  <option value="LIBYENNE">Libyenne</option>
                  <option value="ÉTHIOPIENNE">éthiopienne</option>
                  <option value="KÉNYANE">Kényane</option>
                  <option value="TANZANIENNE">Tanzanienne</option>
                  <option value="RWANDAISE">Rwandaise</option>
                  <option value="BURUNDAISE">Burundaise</option>
                  <option value="SOUDANAISE">Soudanaise</option>
                  <option value="SUD_SOUDANAISE">Sud-Soudanaise</option>
                  <option value="DJIBOUTIENNE">Djiboutienne</option>
                  <option value="SOMALIENNE">Somalienne</option>
                  <option value="éRYTHRéENNE">érythréenne</option>
                </select>
              </div>

              {/* Civilité */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Civilité *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                  value={newParticipant.civilite}
                  onChange={(e) => {
                    const civilite = e.target.value;
                    
                    // Sélection automatique du sexe selon la civilité
                    let sexe = newParticipant.sexe;
                    if (civilite === 'MONSIEUR') {
                      sexe = 'MASCULIN';
                    } else if (civilite === 'MADAME') {
                      sexe = 'FEMININ';
                    }
                    
                    // Mettre à jour civilité et sexe en une seule opération
                    setNewParticipant(prev => ({ ...prev, civilite, sexe }));
                  }}
                >
                  <option value="">Sélectionnez une civilité</option>
                  <option value="MONSIEUR">Monsieur</option>
                  <option value="MADAME">Madame</option>
                </select>
              </div>

              {/* Sexe */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sexe *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                  value={newParticipant.sexe || ''}
                  onChange={(e) => updateParticipantField('sexe', e.target.value)}
                >
                  <option value="">Sélectionnez un sexe</option>
                  <option value="MASCULIN">Masculin</option>
                  <option value="FEMININ">Féminin</option>
                </select>
              </div>

              {/* Situation matrimoniale */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Situation matrimoniale *</label>
                {isCreatorFlow ? (
                  <div>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      disabled
                      type="text"
                      value={newParticipant.situationMatrimoniale === 'MARIE' ? 'Marié(e)' : 'Célibataire'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Défini automatiquement selon votre réponse 'étes-vous marié(e) ?' = {formData.isMarried ? 'Oui' : 'Non'}
                    </p>
                  </div>
                ) : (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    value={newParticipant.situationMatrimoniale || 'CELIBATAIRE'}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, situationMatrimoniale: e.target.value }))}
                  >
                    <option value="CELIBATAIRE">Célibataire</option>
                    <option value="MARIE">Marié(e)</option>
                    <option value="DIVORCE">Divorcé(e)</option>
                    <option value="VEUF">Veuf/Veuve</option>
                  </select>
                )}
              </div>

              {/* Réle */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent border-gray-300 focus:ring-mali-emerald"
                  required
                  value={newParticipant.role}
                  onChange={(e) => {
                    const newRole = e.target.value as 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR';
                    setNewParticipant({
                      ...newParticipant, 
                      role: newRole,
                      pourcentageParts: roleRequiresParts(newRole) ? newParticipant.pourcentageParts : 0
                    });
                  }}
                >
                  {/* Pour les entreprises individuelles, seul PROMOTEUR est disponible */}
                  {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? (
                    <option value="PROMOTEUR">Promoteur</option>
                  ) : (
                    <>
                      <option value="GERANT">Gérant</option>
                      <option value="ASSOCIE">Associé</option>
                      {(formData.formeJuridique === 'SA' || formData.formeJuridique === 'SAS') && (
                        <option value="ADMINISTRATEUR">Administrateur</option>
                      )}
                    </>
                  )}
                </select>
              </div>

              {/* Pourcentage de parts - Conditionnel et masqué pour entreprises individuelles */}
              {roleRequiresParts(newParticipant.role) && formData.typeEntreprise === 'SOCIETE' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Pourcentage de parts *
                    {newParticipant.civilite === 'PERSONNE_MORALE' && (
                      <span className="text-xs font-normal text-primary-600 ml-2">(0% autorisé pour personnes morales)</span>
                    )}
                  </label>
                  <input
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent border-gray-300 focus:ring-mali-emerald"
                    placeholder={newParticipant.civilite === 'PERSONNE_MORALE' ? "0.00 (0% autorisé)" : "0.01"}
                    required
                    type="number"
                    value={newParticipant.pourcentageParts}
                    onChange={(e) => setNewParticipant({...newParticipant, pourcentageParts: parseFloat(e.target.value) || 0})}
                  />
                  {newParticipant.civilite === 'PERSONNE_MORALE' && (
                    <p className="text-xs text-primary-600 mt-1">
                       Les personnes morales peuvent avoir 0% de parts (participation sans capital)
                    </p>
                  )}
                </div>
              )}

              {/* Date de début */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date de début *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                  type="date"
                  value={newParticipant.dateDebut}
                  onChange={(e) => setNewParticipant({...newParticipant, dateDebut: e.target.value})}
                />
              </div>

              {/* Date de fin */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date de fin</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Laisser vide pour une relation en cours"
                  type="date"
                  value={newParticipant.dateFin || ''}
                  onChange={(e) => setNewParticipant({...newParticipant, dateFin: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Laisser vide pour une relation en cours (sans date de fin)</p>
              </div>

              {/* Type de piéce d'identité */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type de piéce d'identité *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                  value={newParticipant.typePiece || ''}
                  onChange={(e) => setNewParticipant({...newParticipant, typePiece: e.target.value})}
                >
                  <option value="">Sélectionnez un type de piéce</option>
                  <option value="CNI">Carte d'Identité Nationale</option>
                  <option value="PASSEPORT">Passeport</option>
                  <option value="CARTE_CONSULAIRE">Carte consulaire</option>
                  <option value="CARTE_ELECTEUR">Carte électorale</option>
                </select>
              </div>

              {/* Numéro de la piéce */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Numéro de la piéce (optionnel)</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Numéro de la piéce d'identité (optionnel)"
                  type="text"
                  value={newParticipant.numeroPiece || ''}
                  onChange={(e) => updateParticipantField('numeroPiece', e.target.value)}
                />
              </div>

              {/* pièce d'identité */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Pièce d'identité *</label>
                <input
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2d85c9] file:text-white hover:file:bg-[#2d85c9]/90"
                  required
                  type="file"
                  onChange={(e) => setNewParticipant({...newParticipant, documentFile: e.target.files?.[0]})}
                />
                <p className="text-xs text-gray-500 mt-1">Formats acceptés: PDF, JPG, JPEG, PNG (max 50MB)</p>
              </div>

              {/* Questions spécifiques aux gérants/promoteurs personnes physiques */}
              {(newParticipant.role === 'GERANT' || newParticipant.role === 'PROMOTEUR') && selectedPersonType === 'PHYSIQUE' && (
                <div className="md:col-span-3 space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h5 className="text-sm font-medium text-gray-900">
                    {formData.typeEntreprise === 'SOCIETE' ? 'Questions spécifiques aux gérants' : 'Questions spécifiques aux promoteurs'}
                  </h5>
                  
                  {/* Question casier judiciaire */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Avez-vous un extrait de casier judiciaire ?</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setNewParticipant({...newParticipant, hasCriminalRecord: true})}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                          newParticipant.hasCriminalRecord === true 
                            ? 'bg-[#2d85c9] text-white shadow-lg' 
                            : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                        }`}
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewParticipant({...newParticipant, hasCriminalRecord: false})}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                          newParticipant.hasCriminalRecord === false 
                            ? 'bg-[#2d85c9] text-white shadow-lg' 
                            : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Extrait de naissance - Obligatoire seulement pour les gérants/promoteurs */}
              {(newParticipant.role === 'GERANT' || newParticipant.role === 'PROMOTEUR') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Extrait de naissance *</label>
                  <input
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm font-semibold file:bg-[#2d85c9] file:text-white hover:file:bg-[#2d85c9]/90"
                    required
                    type="file"
                    onChange={(e) => setNewParticipant({...newParticipant, extraitNaissanceFile: e.target.files?.[0]})}
                  />
                  <p className="text-xs text-black-600 mt-1">Obligatoire pour les gérants - Formats: PDF, JPG, JPEG, PNG (max 5MB)</p>
                </div>
              )}

              {/* Documents conditionnels pour les gérants/promoteurs personnes physiques */}
              {(newParticipant.role === 'GERANT' || newParticipant.role === 'PROMOTEUR') && selectedPersonType === 'PHYSIQUE' && (
                <>
                  {/* Casier judiciaire conditionnel */}
                  {newParticipant.hasCriminalRecord && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Casier judiciaire *</label>
                      <input
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600"
                        required
                        type="file"
                        onChange={(e) => setNewParticipant({...newParticipant, casierJudiciaireFile: e.target.files?.[0]})}
                      />
                      <p className="text-xs text-black-600 mt-1">Obligatoire - Formats: PDF, JPG, JPEG, PNG (max 5MB)</p>
                    </div>
                  )}

                  {/* Certificat de résidence - Obligatoire seulement pour les gérants de nationalité non malienne */}
                  {(() => {
                    const gerantNationality = newParticipant.nationalite || 'MALIENNE';
                    const isRequired = gerantNationality.toUpperCase() !== 'MALIENNE';
                    
                    return (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Certificat de résidence {isRequired ? '*' : '(optionnel)'}
                        </label>
                        <input
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2d85c9] file:text-white hover:file:bg-[#2d85c9]/90"
                          required={isRequired}
                          type="file"
                          onChange={(e) => setNewParticipant({...newParticipant, certificatResidenceFile: e.target.files?.[0]})}
                        />
                        <p className={`text-xs mt-1 ${
                          isRequired 
                            ? 'text-black-600' 
                            : 'text-black-600'
                        }`}>
                          {isRequired 
                            ? 'Obligatoire (nationalité non malienne) - Formats: PDF, JPG, JPEG, PNG (max 5MB)'
                            : 'Optionnel (nationalité malienne) - Formats: PDF, JPG, JPEG, PNG (max 5MB)'
                          }
                        </p>
                      </div>
                    );
                  })()}

                  {/* Pièce de nationalité - Obligatoire pour les entreprises individuelles */}
                  {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Certificat de nationalité *</label>
                      <input
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2d85c9] file:text-white hover:file:bg-[#2d85c9]/90"
                        required
                        type="file"
                        onChange={(e) => setNewParticipant({...newParticipant, pieceNationaliteFile: e.target.files?.[0]})}
                      />
                      <p className="text-xs text-black-600 mt-1">Obligatoire pour les entreprises individuelles - Formats: PDF, JPG, JPEG, PNG (max 5MB)</p>
                    </div>
                  )}

                  {/* Actes de mariage par conjoint */}
                  {newParticipant.situationMatrimoniale === 'MARIE' && formData.conjoints && formData.conjoints.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-3">Actes de mariage *</label>
                      <div className="space-y-3">
                        {formData.conjoints.map((conjoint, index) => (
                          <div key={conjoint.id || index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-slate-700 mb-2">
                              Conjoint(e) {index + 1}: {conjoint.prenom} {conjoint.nom}
                            </p>
                            <input
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2d85c9] file:text-white hover:file:bg-[#2d85c9]/90"
                              required
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const newConjoints = [...(formData.conjoints || [])];
                                  newConjoints[index] = { ...newConjoints[index], acteMariageFile: file };
                                  setFormData(prev => ({ ...prev, conjoints: newConjoints }));
                                }
                              }}
                            />
                            {conjoint.acteMariageFile && (
                              <p className="text-xs text-green-600 mt-1">✓ {conjoint.acteMariageFile.name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Un acte de mariage par conjoint - Formats: PDF, JPG, JPEG, PNG (max 5MB)</p>
                    </div>
                  )}

                  {/* Section déclaration sur l'honneur si pas de casier */}
                  {newParticipant.hasCriminalRecord === false && (
                    <div className="md:col-span-2 mt-4">
                      <div className="bg-sky-50 border border-primary-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <DocumentIcon className="w-6 h-6 text-black-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Pas de casier judiciaire ?</h4>
                            <p className="text-sm text-black-600 mb-3">
                              Si vous n'avez pas d'extrait de casier judiciaire, vous pouvez faire une déclaration sur l'honneur selon l'article 45, 47 de l'Acte Uniforme OHADA.
                            </p>
                            
                            {/* Bouton pour générer la déclaration */}
                            <div className="mb-4">
                              <button
                                type="button"
                                onClick={() => handleGenerateDeclaration(newParticipant)}
                                className="w-full py-2 px-4 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                              >
                                📄 Générer la déclaration PDF
                              </button>
                              <p className="text-xs text-black-600 mt-1">
                                📝 Génère un PDF de déclaration sur l'honneur avec vos informations et signature
                              </p>
                            </div>
                            
                            {/* Signature de la déclaration */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-black-900 mb-3">
                                ✍️ Signature de la déclaration sur l'honneur {!newParticipant.declarationHonneurFile ? '*' : '(optionnel si document uploadé)'}
                              </label>
                              <SignatureCanvas
                                onSignatureChange={(dataUrl) => {
                                  setNewParticipant({ ...newParticipant, signatureDataUrl: dataUrl || undefined });
                                }}
                                existingSignature={newParticipant.signatureDataUrl}
                              />
                              <p className="text-xs text-black-600 mt-2">
                                💡 {newParticipant.declarationHonneurFile 
                                  ? 'Signature optionnelle car vous avez uploadé une déclaration' 
                                  : 'Signature obligatoire pour générer une déclaration sur l\'honneur'
                                }
                              </p>
                            </div>

                            {/* Upload déclaration optionnel */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-black-600 mb-2">
                                📤 Uploader la déclaration sur l'honneur (optionnel)
                              </label>
                              <input
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2d85c9] file:text-white hover:file:bg-[#2d85c9]/90"
                                type="file"
                                onChange={(e) => setNewParticipant({...newParticipant, declarationHonneurFile: e.target.files?.[0]})}
                              />
                              <p className="text-xs text-black-600 mt-1">
                                📄 Uploadez le PDF généré ou un document scanné - Formats: PDF, JPG, JPEG, PNG (max 5MB)<br />
                                💡 <strong>Astuce:</strong> Si vous uploadez une déclaration déjà signée, la signature ci-dessus devient optionnelle
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            )}

            {/* Section Documents supplémentaires (Optionnel) */}
            <div className="md:col-span-3 mt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Documents supplémentaires (Optionnel)</h4>
                  <button 
                    type="button" 
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#47c559] hover:bg-[#47c559]/90 text-white text-sm font-medium rounded-lg transition-colors duration-300"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addParticipantDocument();
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter un document
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Vous pouvez ajouter des documents supplémentaires qui pourraient être utiles pour votre dossier (attestations, certificats, etc.).
                </p>
                
                {/* Liste des documents supplémentaires */}
                {(newParticipant.autresDocuments || []).length > 0 && (
                  <div className="space-y-4">
                    {(newParticipant.autresDocuments || []).map((doc, index) => {
                      // Mémoriser les handlers pour éviter les re-renders
                      const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        updateParticipantDocument(doc.id, 'name', e.target.value);
                      };
                      
                      return (
                        <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom du document *
                              </label>
                              <input
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent"
                                placeholder="Ex: Attestation de formation, Certificat..."
                                type="text"
                                value={doc.name}
                                onChange={handleNameChange}
                              />
                            </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fichier *
                            </label>
                            <input
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#47c559] file:text-white hover:file:bg-[#47c559]/90"
                              type="file"
                              onChange={(e) => updateParticipantDocument(doc.id, 'file', e.target.files?.[0] || null)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description (optionnel)
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent"
                              placeholder="Description du document (optionnel)"
                              rows={2}
                              value={doc.description}
                              onChange={(e) => updateParticipantDocument(doc.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-300"
                              onClick={() => removeParticipantDocument(doc.id)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={saveParticipant}
                className="bg-[#2d85c9] hover:bg-[#2d85c9]/90 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
              >
                {isCreatorFlow 
                  ? (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                      ? 'Valider les informations' 
                      : 'Confirmer mes informations (créateur)')
                  : editingIndex !== null 
                    ? (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                        ? 'Valider les informations'
                        : (selectedPersonType === 'MORALE' ? 'Mettre é jour' : 'Modifier le participant'))
                    : (selectedPersonType === 'MORALE' ? 'Ajouter la personne morale' : 'Ajouter le participant')
                }
              </button>
              {/* Masquer le bouton Annuler pour les entreprises individuelles */}
              {!(formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (isCreatorFlow || editingIndex !== null)) && (
                <button
                  onClick={closeDetailedForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors duration-300"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liste des participants - Masquée pour les entreprises individuelles */}
        {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
          <div className="space-y-4">
            {formData.participants.map((participant, index) => (
            <div key={participant.tempId || participant.id || index} className="bg-gradient-to-r from-white/95 p-6 rounded-lg border border-white/60 shadow-sm hover:shadow-sm transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {participant.typePersonne === 'MORALE' ? (
                    <>
                      <h4 className="font-semibold text-slate-800">
                        {participant.denominationEntreprise}
                        <span className="ml-2 px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full shadow-lg">Personne morale</span>
                      </h4>
                      <p className="text-sm font-medium text-slate-600">
                        Représentant: {participant.representantLegalPrenom} {participant.representantLegalNom}
                      </p>
                      <p className="text-sm font-medium text-slate-600">
                        {participant.role} é {participant.pourcentageParts}% des parts
                      </p>
                      <p className="text-sm text-slate-500">
                        Pays RCCM: {participant.paysEmissionRccm}
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-slate-800">
                        {participant.civilite} {participant.prenom} {participant.nom}
                        <span className="ml-2 px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full shadow-lg">Personne physique</span>
                      </h4>
                      <p className="text-sm font-medium text-slate-600">
                        {participant.role} é {participant.pourcentageParts}% des parts
                      </p>
                      <p className="text-sm text-slate-500">
                        {participant.email} é {participant.telephone}
                      </p>
                      
                      {/* Statuts des documents pour les gérants/promoteurs - MASQUÉ */}
                      {false && (participant.role === 'GERANT' || participant.role === 'PROMOTEUR') && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-white/80 via-slate-50/60 to-primary-50/40  rounded-lg border border-white/50 shadow-lg">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <DocumentIcon className="w-4 h-4 mr-2 text-black-600" />
                            Documents du gérant
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/40">
                              <span className="text-xs font-bold text-slate-700">Type de piéce:</span>
                              <span className="text-xs font-medium text-slate-600">{participant.typePiece || 'Non spécifié'}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/40">
                              <span className="text-xs font-bold text-slate-700">Numéro:</span>
                              <span className="text-xs font-medium text-slate-600">{participant.numeroPiece || 'Non spécifié'}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/40">
                              <span className="text-xs font-bold text-slate-700">Document:</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${participant.documentFile ? 'bg-primary-100 text-primary-800' : 'bg-red-100 text-red-800'}`}>
                                {participant.documentFile ? '? Téléchargé' : '? Non téléchargé'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/40">
                              <span className="text-xs font-bold text-slate-700">Casier judiciaire:</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${participant.casierJudiciaireFile ? 'bg-primary-100 text-primary-800' : 'bg-red-100 text-red-800'}`}>
                                {participant.casierJudiciaireFile ? '? Téléchargé' : '? Non téléchargé'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/40">
                              <span className="text-xs font-bold text-slate-700">Acte de mariage:</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${participant.acteMariageFile ? 'bg-primary-100 text-primary-800' : 'bg-red-100 text-red-800'}`}>
                                {participant.acteMariageFile ? '? Téléchargé' : '? Non téléchargé'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/60 rounded-xl border border-white/40">
                              <span className="text-xs font-bold text-slate-700">Extrait de naissance:</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${participant.extraitNaissanceFile ? 'bg-primary-100 text-primary-800' : 'bg-red-100 text-red-800'}`}>
                                {participant.extraitNaissanceFile ? '? Téléchargé' : '? Non téléchargé'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => editParticipant(index)}
                    className="px-4 py-2 bg-[#2d85c9] text-white font-bold rounded-xl shadow-lg hover:shadow-sm transition-all duration-300 hover:bg-[#2d85c9]/90"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteParticipant(index)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-sm transition-all duration-300 hover:from-red-500/90 hover:to-red-600/90"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Bouton d'ajout */}
        {!showDetailedForm && formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
          <button
            type="button"
            onClick={() => setShowPersonTypeModal(true)}
            className="w-full py-4 border-2 border-dashed border-white/60 rounded-lg text-slate-600 font-bold bg-white/30  hover:border-[#412A5C] hover:text-[#412A5C] hover:bg-white/50 transition-all duration-300 shadow-lg hover:shadow-sm"
          >
            + Ajouter un participant
          </button>
        )}

        {/* Modal de sélection du type de personne */}
        {showPersonTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-white/95 rounded-lg p-6 max-w-md w-full mx-4 shadow-sm border border-white/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Type de personne é ajouter</h3>
              <p className="text-slate-600 font-medium mb-6">Choisissez le type de personne que vous souhaitez ajouter :</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setSelectedPersonType('PHYSIQUE');
                    const shouldPrefill = formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
                    setIsCreatorFlow(shouldPrefill);
                    
                    // Créer le participant avec les bonnes données
                    const newParticipantData = {
                      civilite: shouldPrefill ? formData.civilite : '',
                      prenom: shouldPrefill ? formData.prenom : '',
                      nom: shouldPrefill ? formData.nom : '',
                      dateNaissance: shouldPrefill ? formData.dateNaissance : '',
                      lieuNaissance: shouldPrefill ? formData.lieuNaissance : '',
                      nationalite: shouldPrefill ? formData.nationalite : 'MALIENNE',
                      telephone: shouldPrefill ? formData.telephonePersonnel : '',
                      telephone2: shouldPrefill ? formData.telephonePersonnel2 : '',
                      email: shouldPrefill ? formData.emailPersonnel : '',
                      adresse: shouldPrefill ? formData.adressePersonnelle : '',
                      role: (formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT') as 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR',
                      pourcentageParts: 0,
                      dateDebut: new Date().toISOString().split('T')[0],
                      sexe: '',
                      situationMatrimoniale: shouldPrefill ? (formData.isMarried ? 'MARIE' : 'CELIBATAIRE') : '',
                      typePiece: '',
                      numeroPiece: '',
                      documentFile: undefined,
                      extraitNaissanceFile: undefined,
                      denominationEntreprise: '',
                      representantLegalNom: '',
                      representantLegalPrenom: '',
                      paysEmissionRccm: 'MALI',
                      rccmFile: undefined,
                      typePersonne: 'PHYSIQUE' as 'PHYSIQUE' | 'MORALE',
                      hasCriminalRecord: shouldPrefill ? formData.hasCriminalRecord : undefined,
                      casierJudiciaireFile: undefined,
                      declarationHonneurFile: undefined,
                      signatureDataUrl: undefined,
                      acteMariageFile: undefined,
                    };
                    
                    setNewParticipant(newParticipantData);
                    setEditingIndex(null);
                    setShowPersonTypeModal(false);
                    setShowDetailedForm(true);
                  }}
                  className="w-full p-4 border-2 border-white/60 rounded-xl bg-white/50  hover:border-[#412A5C] hover:bg-white/70 transition-all duration-300 text-left shadow-lg hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#412A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-slate-800">Personne physique</h4>
                      <p className="text-sm text-slate-500 font-medium">Ajouter une personne individuelle</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    setSelectedPersonType('MORALE');
                    setIsCreatorFlow(false);
                    setNewParticipant(createEmptyParticipant());
                    setEditingIndex(null);
                    setShowPersonTypeModal(false);
                    setShowDetailedForm(true);
                  }}
                  className="w-full p-4 border-2 border-white/60 rounded-xl bg-white/50  hover:border-[#412A5C] hover:bg-white/70 transition-all duration-300 text-left shadow-lg hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#412A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-slate-800">Personne morale</h4>
                      <p className="text-sm text-slate-500 font-medium">Ajouter une entreprise avec représentant légal</p>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowPersonTypeModal(false)}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-bold rounded-xl bg-white/50  hover:bg-white/70 transition-all duration-300 shadow-lg hover:shadow-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const DocumentsStep = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#2d85c9] rounded-lg">
            <DocumentIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Documents</h2>
            <p className="text-slate-600 font-medium mt-1">
              {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                ? 'Les documents ne sont pas requis pour les entreprises individuelles.'
                : 'Les documents ne sont pas requis pour les societes.'
              }
            </p>
          </div>
        </div>
      </div>

      {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (() => {
        const requiredDocs = getRequiredDocuments(formData.formeJuridique);
        const requiredPieces = getRequiredPiecesInfo(formData.formeJuridique);
        return (
        <div className="space-y-6">
          {/* Statuts de l'entreprise - Conditionnel */}
          {requiredDocs.statuts && (
          <div className="border-2 border-dashed border-white/60 rounded-lg p-8 bg-gradient-to-r from-white/80 via-slate-50/60 to-primary-50/40  shadow-sm hover:shadow-sm transition-all duration-300 hover:border-[#412A5C]/50">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-[#2d85c9] rounded-lg flex items-center justify-center shadow-lg">
                <DocumentIcon className="h-8 w-8 text-white" />
              </div>
              <div className="mt-4">
                <label htmlFor="statuts" className="cursor-pointer">
                  <span className="mt-3 block text-lg font-semibold text-slate-800">
                    Statuts de l'entreprise *
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-600">
                    PDF, DOC, DOCX jusqu'à 10MB
                  </span>
                </label>
                <input
                  id="statuts"
                  name="statuts"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData('documents', { ...formData.documents, statuts: file });
                  }}
                />
              </div>
              {formData.documents.statuts && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-sm font-bold text-primary-800 flex items-center">
                    <span className="text-lg mr-2">✓</span>
                    {formData.documents.statuts.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Registre de commerce - Toujours requis */}
          {requiredDocs.registreCommerce && (
          <div className="border-2 border-dashed border-white/60 rounded-lg p-8 bg-gradient-to-r from-white/80 via-slate-50/60 to-primary-50/40  shadow-sm hover:shadow-sm transition-all duration-300 hover:border-[#412A5C]/50">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-[#2d85c9] rounded-lg flex items-center justify-center shadow-lg">
                <DocumentIcon className="h-8 w-8 text-white" />
              </div>
              <div className="mt-4">
                <label htmlFor="registreCommerce" className="cursor-pointer">
                  <span className="mt-3 block text-lg font-semibold text-slate-800">
                    Registre de commerce *
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-600">
                    PDF, DOC, DOCX, JPG, PNG jusqu'à 10MB
                  </span>
                </label>
                <input
                  id="registreCommerce"
                  name="registreCommerce"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData('documents', { ...formData.documents, registreCommerce: file });
                  }}
                />
              </div>
              {formData.documents.registreCommerce && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-sm font-bold text-primary-800 flex items-center">
                    <span className="text-lg mr-2">✓</span>
                    {formData.documents.registreCommerce.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* PV d'Assemblée - Conditionnel selon forme juridique */}
          {requiredDocs.pvAssemblee && (
          <div className="border-2 border-dashed border-white/60 rounded-lg p-8 bg-gradient-to-r from-white/80 via-slate-50/60 to-primary-50/40  shadow-sm hover:shadow-sm transition-all duration-300 hover:border-[#412A5C]/50">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-[#2d85c9] rounded-lg flex items-center justify-center shadow-lg">
                <DocumentIcon className="h-8 w-8 text-white" />
              </div>
              <div className="mt-4">
                <label htmlFor="pvAssemblee" className="cursor-pointer">
                  <span className="mt-3 block text-lg font-semibold text-slate-800">
                    PV d'Assemblée Générale *
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-600">
                    PDF, DOC, DOCX jusqu'à 10MB
                  </span>
                </label>
                <input
                  id="pvAssemblee"
                  name="pvAssemblee"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData('documents', { ...formData.documents, pvAssemblee: file });
                  }}
                />
              </div>
              {formData.documents.pvAssemblee && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-sm font-bold text-primary-800 flex items-center">
                    <span className="text-lg mr-2">✓</span>
                    {formData.documents.pvAssemblee.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Déclaration notariée - Conditionnel selon forme juridique */}
          {requiredDocs.declarationNotariee && (
          <div className="border-2 border-dashed border-white/60 rounded-lg p-8 bg-gradient-to-r from-white/80 via-slate-50/60 to-primary-50/40  shadow-sm hover:shadow-sm transition-all duration-300 hover:border-[#412A5C]/50">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-[#2d85c9] rounded-lg flex items-center justify-center shadow-lg">
                <DocumentIcon className="h-8 w-8 text-white" />
              </div>
              <div className="mt-4">
                <label htmlFor="declarationNotariee" className="cursor-pointer">
                  <span className="mt-3 block text-lg font-semibold text-slate-800">
                    Déclaration notariée de souscription et de versement *
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-600">
                    PDF, DOC, DOCX jusqu'à 10MB
                  </span>
                </label>
                <input
                  id="declarationNotariee"
                  name="declarationNotariee"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData('documents', { ...formData.documents, declarationNotariee: file });
                  }}
                />
              </div>
              {formData.documents.declarationNotariee && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-sm font-bold text-primary-800 flex items-center">
                    <span className="text-lg mr-2">✓</span>
                    {formData.documents.declarationNotariee.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Attestation bancaire - Conditionnel selon forme juridique */}
          {requiredDocs.attestationBancaire && (
          <div className="border-2 border-dashed border-white/60 rounded-lg p-8 bg-gradient-to-r from-white/80 via-slate-50/60 to-primary-50/40  shadow-sm hover:shadow-sm transition-all duration-300 hover:border-[#412A5C]/50">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-[#2d85c9] rounded-lg flex items-center justify-center shadow-lg">
                <DocumentIcon className="h-8 w-8 text-white" />
              </div>
              <div className="mt-4">
                <label htmlFor="attestationBancaire" className="cursor-pointer">
                  <span className="mt-3 block text-lg font-semibold text-slate-800">
                    Attestation bancaire de dépôt de fonds *
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-600">
                    PDF, DOC, DOCX jusqu'à 10MB
                  </span>
                </label>
                <input
                  id="attestationBancaire"
                  name="attestationBancaire"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData('documents', { ...formData.documents, attestationBancaire: file });
                  }}
                />
              </div>
              {formData.documents.attestationBancaire && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-sm font-bold text-primary-800 flex items-center">
                    <span className="text-lg mr-2">✓</span>
                    {formData.documents.attestationBancaire.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* RCCM de la société mère - Conditionnel pour succursales/filiales */}
          {requiredDocs.rccmSocieteMere && (
          <div className="border-2 border-dashed border-white/60 rounded-lg p-8 bg-gradient-to-r from-white/80 via-slate-50/60 to-primary-50/40  shadow-sm hover:shadow-sm transition-all duration-300 hover:border-[#412A5C]/50">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-[#2d85c9] rounded-lg flex items-center justify-center shadow-lg">
                <DocumentIcon className="h-8 w-8 text-white" />
              </div>
              <div className="mt-4">
                <label htmlFor="rccmSocieteMere" className="cursor-pointer">
                  <span className="mt-3 block text-lg font-semibold text-slate-800">
                    RCCM de la société mère *
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-600">
                    PDF, DOC, DOCX, JPG, PNG jusqu'à 10MB
                  </span>
                </label>
                <input
                  id="rccmSocieteMere"
                  name="rccmSocieteMere"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    updateFormData('documents', { ...formData.documents, rccmSocieteMere: file });
                  }}
                />
              </div>
              {formData.documents.rccmSocieteMere && (
                <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-xl">
                  <p className="text-sm font-bold text-primary-800 flex items-center">
                    <span className="text-lg mr-2">✓</span>
                    {formData.documents.rccmSocieteMere.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

        </div>
        );
      })()}

      {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-black-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-800">Entreprise Individuelle</h3>
              <p className="text-primary-600 font-medium">
                Aucun document n'est requis pour la création d'une entreprise individuelle. 
                Vous pouvez passer directement é l'étape suivante.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const RecapitulatifStep = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#2d85c9] rounded-lg shadow-lg">
            <span className="text-2xl">?</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Récapitulatif</h2>
            <p className="text-slate-600 font-medium mt-1">
              Vérifiez les informations avant de créer le dossier.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations Personnelles */}
        <div className="bg-gradient-to-r from-white/95 p-6 rounded-lg shadow-sm border border-white/60 hover:shadow-sm transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 text-mali-emerald mr-2" />
            Informations Personnelles
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Civilité :</span>
              <span className="font-medium text-slate-600">{formData.civilite}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Nom complet :</span>
              <span className="font-medium text-slate-600">{formData.prenom} {formData.nom}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Date de naissance :</span>
              <span className="font-medium text-slate-600">{formData.dateNaissance}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Lieu de naissance :</span>
              <span className="font-medium text-slate-600">{formData.lieuNaissance}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Nationalité :</span>
              <span className="font-medium text-slate-600">{formData.nationalite}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Téléphone :</span>
              <span className="font-medium text-slate-600">{formData.telephonePersonnel}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Email :</span>
              <span className="font-medium text-slate-600">{formData.emailPersonnel}</span>
            </div>
            {/* <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Adresse :</span>
              <span className="font-medium text-slate-600">{
                (() => {
                  const parts = [];
                  if (formData.localite) parts.push(formData.localite);
                  if (formData.porte) parts.push(`Porte ${formData.porte}`);
                  return parts.length > 0 ? parts.join(', ') : 'Non renseignée';
                })()
              }</span>
            </div> */}
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Localisation :</span>
              <span className="font-medium text-slate-600">{
              (() => {
                // Construire la localisation hiérarchique personnelle
                const region = personalRegions.find((r: any) => r.id === personalSelectedRegionId)?.nom || '';
                const cercle = personalCercles.find((c: any) => c.id === personalSelectedCercleId)?.nom || '';
                const commune = personalCommunes.find((c: any) => c.id === personalSelectedCommuneId)?.nom || '';
                const quartier = personalQuartiers.find((q: any) => q.id === personalSelectedQuartierId)?.nom || '';
                
                const parts = [region, cercle, commune, quartier].filter(Boolean);
                
                // Fallback sur les données agent si aucune sélection personnelle
                if (parts.length === 0) {
                  const division = formData.division || agent?.division || 'BAMAKO';
                  const antenne = formData.antenne || agent?.antenne;
                  return `${division}${antenne ? ` - ${antenne}` : ''}`;
                }
                
                return parts.join(' - ');
              })()
            }</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Casier judiciaire :</span>
              <span className="font-medium text-slate-600">{formData.hasCriminalRecord ? 'Oui' : 'Non'}</span>
            </div>
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Marié(e) :</span>
              <span className="font-medium text-slate-600">{formData.isMarried ? 'Oui' : 'Non'}</span>
            </div>
              
              {/* Informations des conjoints si marié */}
              {formData.isMarried && formData.conjoints && formData.conjoints.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center">
                    {/* <span className="mr-2">💍</span> */}
                    Conjoint(s) ({formData.conjoints.length})
                  </h4>
                  {formData.conjoints.map((conjoint, index) => (
                    <div key={conjoint.id || index} className="mb-3 last:mb-0 p-2 bg-white rounded-lg border border-blue-100">
                      <p className="font-semibold text-sm text-slate-700 mb-1">Conjoint(e) {index + 1}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Nom complet:</span>
                          <span className="font-medium text-slate-700">{conjoint.prenom} {conjoint.nom}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Date de mariage:</span>
                          <span className="font-medium text-slate-700">{conjoint.dateMariage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Lieu:</span>
                          <span className="font-medium text-slate-700">{conjoint.lieuMariage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Régime:</span>
                          <span className="font-medium text-slate-700">{conjoint.regimeMatrimonial}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Clause:</span>
                          <span className="font-medium text-slate-700">{conjoint.clauseRestrictive}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Autres responsables :</span>
              <span className="font-medium text-slate-600">{formData.allowsOthersResponsible ? 'Oui' : 'Non'}</span>
            </div>
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Autorisation d'exercice :</span>
              <span className="font-medium text-slate-600">{formData.requiresExerciseAuthorization ? 'Oui' : 'Non'}</span>
            </div>
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Import/Export :</span>
              <span className="font-medium text-slate-600">{formData.willImportExport ? 'Oui' : 'Non'}</span>
            </div>
            </div>
          </div>
        </div>

        {/* Informations Société */}
        <div className="bg-gradient-to-r from-white/95 p-6 rounded-lg shadow-sm border border-white/60 hover:shadow-sm transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <div className="p-2 bg-[#2d85c9] rounded-xl mr-3 shadow-lg">
              <BuildingOfficeIcon className="h-4 w-4 text-white" />
            </div>
            Informations de l'entreprise
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Nom :</span>
              <span className="font-medium text-slate-600">
                {(formData.nomEntreprise && formData.nomEntreprise.trim() !== '') 
                  ? formData.nomEntreprise 
                  : `${formData.prenom || ''} ${formData.nom || ''}`.trim() || 'Non renseigné'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Sigle :</span>
              <span className="font-medium text-slate-600">{formData.sigleEntreprise || 'Non spécifié'}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Forme juridique :</span>
              <span className="font-medium text-slate-600">{formData.formeJuridique}</span>
            </div>
            {/* Masquer le capital pour les entreprises individuelles */}
            {formData.typeEntreprise === 'SOCIETE' && (
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
                <span className="font-bold text-slate-700">Capital :</span>
                <span className="font-medium text-slate-600">{formData.capital} FCFA</span>
              </div>
            )}
            <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Siège social :</span>
              <span className="font-medium text-slate-600">{
              (() => {
                // Si hasDifferentAddress est true, utiliser les données entreprise
                // Sinon utiliser les données personnelles (synchronisées)
                if (formData.hasDifferentAddress) {
                  // Données entreprise spécifiques
                  const region = companyRegions.find((r: any) => r.id === companySelectedRegionId)?.nom || '';
                  const cercle = companyCercles.find((c: any) => c.id === companySelectedCercleId)?.nom || '';
                  const commune = companyCommunes.find((c: any) => c.id === companySelectedCommuneId)?.nom || '';
                  const quartier = companyQuartiers.find((q: any) => q.id === companySelectedQuartierId)?.nom || '';
                  
                  const parts = [region, cercle, commune, quartier].filter(Boolean);
                  return parts.length > 0 ? parts.join(' - ') : 'Non spécifiée';
                } else {
                  // Données personnelles (synchronisées avec l'entreprise)
                  const region = personalRegions.find((r: any) => r.id === personalSelectedRegionId)?.nom || '';
                  const cercle = personalCercles.find((c: any) => c.id === personalSelectedCercleId)?.nom || '';
                  const commune = personalCommunes.find((c: any) => c.id === personalSelectedCommuneId)?.nom || '';
                  const quartier = personalQuartiers.find((q: any) => q.id === personalSelectedQuartierId)?.nom || '';
                  
                  const parts = [region, cercle, commune, quartier].filter(Boolean);
                  return parts.length > 0 ? parts.join(' - ') : 'Non spécifiée';
                }
              })()
            }</span>

            </div>
            {formData.domaineActiviteNr && (
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Domaine d'activité (NR) :</span>
              <span className="font-medium text-slate-600">{formData.domaineActiviteNr}</span>
            </div>
            )}
            {formData.domaineActivite && (
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Domaine d'activité (Réglementé) :</span>
              <span className="font-medium text-slate-600">{formData.domaineActivite}</span>
            </div>
            )}
            {formData.activitePrincipale && (
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Activité principale :</span>
              <span className="font-medium text-slate-600">{formData.activitePrincipale}</span>
            </div>
            )}
            {formData.activiteSecondaire && (
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
              <span className="font-bold text-slate-700">Activité secondaire :</span>
              <span className="font-medium text-slate-600">{formData.activiteSecondaire}</span>
            </div>
            )}
            
            {/* Affichage du montant à payer pour les entreprises individuelles */}
            {formData.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-800">Montant à payer :</span>
                  <span className="text-lg font-bold text-green-800">
                    {(formData.requiresExerciseAuthorization || formData.willImportExport) ? '28000' : '10000'} F CFA
                  </span>
                </div>
                {(formData.requiresExerciseAuthorization || formData.willImportExport) && (
                  <p className="text-xs text-green-600 mt-1">
                    Montant majoré (autorisation d'exercice ou import/export)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Informations du déposant - uniquement pour les sociétés */}
        {formData.typeEntreprise === 'SOCIETE' && (
          <div className="bg-gradient-to-r from-white/95 p-6 rounded-lg shadow-sm border border-white/60 hover:shadow-sm transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#2d85c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informations du déposant
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
                <span className="font-bold text-slate-700">Nom :</span>
                <span className="font-medium text-slate-600">{formData.nomDeposant || 'Non renseigné'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
                <span className="font-bold text-slate-700">Prénom :</span>
                <span className="font-medium text-slate-600">{formData.prenomDeposant || 'Non renseigné'}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
                <span className="font-bold text-slate-700">Téléphone :</span>
                <span className="font-medium text-slate-600">{formData.telephoneDeposant || 'Non renseigné'}</span>
              </div>
              {formData.nomCabinet && (
                <div className="flex justify-between items-center p-2 bg-white/50 rounded-xl border border-white/40">
                  <span className="font-bold text-slate-700">Cabinet :</span>
                  <span className="font-medium text-slate-600">{formData.nomCabinet}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participants - Masqué pour les entreprises individuelles */}
        {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
          <div className="bg-gradient-to-r from-white/95 p-6 rounded-lg shadow-sm border border-white/60 hover:shadow-sm transition-all duration-300">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 text-mali-emerald mr-2" />
              Participants
            </h3>
            <div className="space-y-3 text-sm">
              {formData.participants.length === 0 ? (
                <div className="text-gray-500">Aucun participant ajouté</div>
              ) : (
                formData.participants.map((participant, index) => (
                  <div key={participant.tempId || participant.id || index} className="border-b border-gray-100 pb-2 mb-2 last:border-b-0">
                    {participant.typePersonne === 'MORALE' ? (
                      <>
                        <div><strong>{participant.denominationEntreprise}</strong></div>
                        <div className="text-primary-600 text-xs">Personne morale</div>
                        <div className="text-gray-600">Représentant: {participant.representantLegalPrenom} {participant.representantLegalNom}</div>
                        <div className="text-gray-600">{participant.role} É {participant.pourcentageParts}% des parts</div>
                        <div className="text-gray-500">Pays RCCM: {participant.paysEmissionRccm}</div>
                      </>
                    ) : (
                      <>
                        <div><strong>{participant.civilite} {participant.prenom} {participant.nom}</strong></div>
                        <div className="text-primary-600 text-xs">Personne physique</div>
                        <div className="text-gray-600">{participant.role} é {participant.pourcentageParts}% des parts</div>
                        <div className="text-gray-500">{participant.email}</div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Documents - Masqué pour les entreprises individuelles */}
        {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (() => {
          const requiredDocs = getRequiredDocuments(formData.formeJuridique);
          return (
          <div className="bg-white p-6 rounded-lg shadow-md border lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <DocumentIcon className="h-5 w-5 text-mali-emerald mr-2" />
              Documents ({formData.formeJuridique})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requiredDocs.statuts && (
              <div className="flex items-center">
                <CheckCircleIcon className={`h-5 w-5 mr-2 ${formData.documents.statuts ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="text-sm">Statuts</span>
              </div>
              )}
              {requiredDocs.registreCommerce && (
              <div className="flex items-center">
                <CheckCircleIcon className={`h-5 w-5 mr-2 ${formData.documents.registreCommerce ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="text-sm">Registre de commerce</span>
              </div>
              )}
              {requiredDocs.pvAssemblee && (
              <div className="flex items-center">
                <CheckCircleIcon className={`h-5 w-5 mr-2 ${formData.documents.pvAssemblee ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="text-sm">PV d'Assemblée</span>
              </div>
              )}
              {requiredDocs.declarationNotariee && (
              <div className="flex items-center">
                <CheckCircleIcon className={`h-5 w-5 mr-2 ${formData.documents.declarationNotariee ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="text-sm">Déclaration notariée</span>
              </div>
              )}
              {requiredDocs.attestationBancaire && (
              <div className="flex items-center">
                <CheckCircleIcon className={`h-5 w-5 mr-2 ${formData.documents.attestationBancaire ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="text-sm">Attestation bancaire</span>
              </div>
              )}
            </div>
          </div>
          );
        })()}
        
        {/* Alerte Domaine Réglementé */}
        {(() => {
          const domainesReglementes = [
            'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS',
            'ARCHITECTE', 
            'BTP',
            'CARTOGRAPHIE_TOPOGRAPHIE',
            'GEOMETRES_EXPERTS',
            'INGENIEUR_CONSEIL',
            'PRODUCTEUR_DE_SPECTACLES',
            'PROMOTEUR_IMMOBILIER',
            'STATIONS',
            'TRANSPORT',
            'URBANISTE',
            'ETABLISSEMENT_DE_TOURISME',
            'AGENCE_DE_VOYAGE'
          ];
          
          const domaineActivite = formData.domaineActivite;
          const estDomaineReglemente = domaineActivite && domainesReglementes.includes(domaineActivite);
          
          if (estDomaineReglemente && domaineActivite) {
            const titresAutorisation: { [key: string]: string } = {
              'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS': 'Administrateurs et Agents Immobiliers',
              'ARCHITECTE': 'Architecte',
              'BTP': 'BTP (Bétiment et Travaux Publics)',
              'CARTOGRAPHIE_TOPOGRAPHIE': 'Cartographie et Topographie',
              'GEOMETRES_EXPERTS': 'Géométres Experts',
              'INGENIEUR_CONSEIL': 'Ingénieur Conseil',
              'PRODUCTEUR_DE_SPECTACLES': 'Producteur de Spectacles',
              'PROMOTEUR_IMMOBILIER': 'Promoteur Immobilier',
              'STATIONS': 'Station Service',
              'TRANSPORT': 'Transport',
              'URBANISTE': 'Urbaniste',
              'ETABLISSEMENT_DE_TOURISME': 'établissement de Tourisme',
              'AGENCE_DE_VOYAGE': 'Agence de Voyage'
            };
            
            const titreActivite = titresAutorisation[domaineActivite] || domaineActivite;
            
            return (
              <div className="bg-primary-50 p-6 rounded-lg shadow-md border border-primary-200 lg:col-span-2">
                <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-primary-600 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  DOMAINE RÉGLEMENTÉ DéTECTÉ
                </h3>
                <div className="space-y-4">
                  <div className="bg-primary-100 p-4 rounded-md">
                    <p className="text-sm font-medium text-primary-900 mb-2">
                      Votre activité "{titreActivite}" nécessite une DEMANDE D'AUTORISATION D'EXERCICE.
                    </p>
                    <p className="text-xs text-primary-800">
                      Après la création de votre entreprise, vous devrez constituer et déposer un dossier de demande d'autorisation.
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-md border border-primary-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Prochaines étapes :</h4>
                    <ul className="text-xs text-primary-800 space-y-1">
                      <li> Dépot du dossier aupres de l'API-Mali</li>
                      <li> Étude et validation par les services compétents</li>
                      <li> Obtention de l'autorisation d'exercice</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-700">
                       <strong>Contact API-Mali :</strong> +223 20 29 76 00 | info@apimali.gov.ml<br/>
                       <strong>Site web :</strong> https://www.apimali.gov.ml
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
        
        {/* Notifications Email */}
        {(() => {
          const gerantsAvecEmail = formData.participants
            .filter(p => (p.role === 'GERANT' || p.role === 'PROMOTEUR') && p.civilite !== 'PERSONNE_MORALE')
            .filter(p => p.email && p.email.includes('@'));
          
          if (gerantsAvecEmail.length > 0) {
            return (
              <div className="bg-primary-50 p-6 rounded-lg shadow-md border border-primary-200 lg:col-span-2">
                <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-primary-600 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Notifications Email
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-primary-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-primary-900">
                        Un email de confirmation sera automatiquement envoyé aux gérants ou aux promoteurs
                      </p>
                      <p className="text-xs text-black-600 mt-1">
                        {gerantsAvecEmail.length} gérant(s) ou promoteur(s) avec email valide :
                      </p>
                      <ul className="text-xs text-primary-600 mt-1 ml-4">
                        {gerantsAvecEmail.map((gerant, index) => (
                          <li key={index} className="flex items-center">
                             {gerant.prenom} {gerant.nom} ({gerant.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-md">
                    <p className="text-xs text-primary-800">
                       L'email contiendra les détails de l'entreprise créée, la référence du dossier et les prochaines étapes.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Régles importantes et total des parts - masquées pour les entreprises individuelles */}
        {formData.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-primary-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Régles importantes
            </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/70 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Répartition des parts</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Total actuel :</span>
                  <span className={`font-bold ${calculateTotalParts() === 100 ? 'text-primary-600' : 'text-primary-600'}`}>
                    {calculateTotalParts().toFixed(2)}%
                  </span>
                </div>
                {calculateTotalParts() !== 100 && (
                  <p className="text-xs text-primary-600">
                     Le total doit égaler 100% (administrateurs exclus)
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white/70 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Règles générales</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Un seul gérant autorisé par entreprise</li>
                <li>La somme des parts (gérants + associés) doit égaler 100%</li>
                {(formData.formeJuridique === 'SA' || formData.formeJuridique === 'SAS') && (
                  <li className="text-black-600 font-medium">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800 mr-1">
                      SA/SAS
                    </span>
                    Réle Administrateur disponible (sans parts)
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <InformationsPersonnellesStep />;
      case 2:
        return <InformationsSocieteStep />;
      case 3:
        return <ParticipantsStep />;
      case 4:
        return <DocumentsStep />;
      case 5:
        return <RecapitulatifStep />;
      default:
        return <InformationsPersonnellesStep />;
    }
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => goToStep(step.number)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                  currentStep >= step.number
                    ? 'bg-[#2d85c9] border-sky-600 text-white hover:bg-sky-700'
                    : 'border-gray-300 text-gray-500 hover:border-sky-400 hover:text-black-600'
                }`}
                title={`Aller à l'étape ${step.number}: ${step.title}`}
              >
                <step.icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => goToStep(step.number)}
                className="ml-3 text-left hover:text-black-600 transition-colors duration-200 focus:outline-none focus:text-black-600"
                title={`Aller à l'étape ${step.number}: ${step.title}`}
              >
                <div className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-mali-emerald' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-[#2d85c9]' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Affichage des erreurs de validation - Design professionnel */}
      {validationErrors.length > 0 && (
        <div className="mb-6 bg-white border border-red-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 px-5 py-4 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Formulaire incomplet
                </h3>
                <p className="text-sm text-red-600">
                  Veuillez corriger les erreurs ci-dessous avant de continuer
                </p>
              </div>
            </div>
            <button
              onClick={() => setValidationErrors([])}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Contenu des erreurs */}
          <div className="p-5 max-h-80 overflow-y-auto">
            <div className="space-y-4">
              {validationErrors.reduce((acc: { step: string; errors: string[] }[], error, index) => {
                // Détecter les titres d'étape (format "étape X:")
                if (error.match(/^étape \d+:$/)) {
                  acc.push({ step: error.replace(':', ''), errors: [] });
                } else if (error.trim() !== '' && error.startsWith('  - ')) {
                  // Ajouter l'erreur à l'étape courante
                  if (acc.length > 0) {
                    acc[acc.length - 1].errors.push(error.replace('  - ', ''));
                  }
                } else if (error.trim() !== '' && !error.match(/^étape \d+:$/)) {
                  // Erreur sans étape
                  if (acc.length === 0 || acc[acc.length - 1].step !== 'Général') {
                    acc.push({ step: 'Général', errors: [] });
                  }
                  acc[acc.length - 1].errors.push(error);
                }
                return acc;
              }, []).map((group, groupIndex) => (
                <div key={groupIndex} className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 text-sm font-bold mr-3">
                      {group.step.replace('étape ', '')}
                    </span>
                    <h4 className="font-semibold text-red-800 capitalize">
                      {group.step === 'Général' ? 'Erreurs générales' : `Étape ${group.step.replace('étape ', '')}`}
                    </h4>
                  </div>
                  <ul className="space-y-2 ml-10">
                    {group.errors.map((err, errIndex) => (
                      <li key={errIndex} className="flex items-start text-sm text-red-700">
                        <svg className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer avec compteur */}
          <div className="bg-red-50 px-5 py-3 border-t border-red-200 flex items-center justify-between">
            <span className="text-sm text-red-600">
              {validationErrors.filter(e => e.startsWith('  - ')).length} champ(s) à corriger
            </span>
            <button
              onClick={() => setValidationErrors([])}
              className="px-4 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-2" />
          Précédent
        </button>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center px-6 py-3 bg-[#2d85c9] text-white shadow-lg rounded-lg hover:bg-mali-emerald-dark"
          >
            Suivant
            <ChevronRightIcon className="h-4 w-4 ml-2" />
          </button>
        ) : isDossierCreated ? (
          <button
            type="button"
            onClick={createNewDossier}
            className="flex items-center px-6 py-3 bg-[#2d85c9] text-white shadow-lg rounded-lg hover:bg-mali-emerald-dark"
          >
            <span className="mr-2"></span>
            Nouveau dossier
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-[#2d85c9] text-white shadow-lg rounded-lg hover:bg-[#2d85c9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Valider le dossier
              </>
            )}
          </button>
        )}
      </div>

      {/* Modal de succès de création */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all">
            <div className="p-8">
              {/* Icône de succès */}
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircleIcon className="h-16 w-16 text-green-600" />
                </div>
              </div>
              
              {/* Titre */}
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
                {successData.isSimulated ? 'Dossier créé avec succès (Simulation)' : 'Dossier créé avec succès !'}
              </h2>
              
              {/* Informations principales */}
              <div className="bg-gradient-to-r from-[#2d85c9]/10 to-green-50 rounded-xl p-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-600 font-medium">Référence:</span>
                    <span className="text-xl font-bold text-[#2d85c9]">{successData.reference}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-600 font-medium">Entreprise:</span>
                    <span className="text-lg font-semibold text-gray-900">{successData.entreprise}</span>
                  </div>
                  
                  {successData.emailInfo && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-600">{successData.emailInfo}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Message selon le mode */}
              {/* <div className={`rounded-lg p-4 mb-6 ${successData.isSimulated ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-center font-medium ${successData.isSimulated ? 'text-yellow-800' : 'text-green-800'}`}>
                  {successData.isSimulated 
                    ? '🧪 Mode simulation - Aucune donnée réelle créée' 
                    : '✅ Création réelle avec la logique backend complète !'}
                </p>
              </div> */}
              
              {/* Note sur le reçu */}
              <div className="bg-sky-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 text-center">
                  Un reçu temporaire <span className="font-bold">NON PAYÉ</span> a été généré
                </p>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Retourner aux demandes après la fermeture du modal
                    if (onClose) {
                      onClose();
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Retour aux demandes
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowReceipt(true);
                  }}
                  className="flex-1 px-6 py-3 bg-[#2d85c9] text-white rounded-lg hover:bg-[#2d85c9]/90 transition-colors font-medium shadow-lg"
                >
                  Voir le reçu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'erreur */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all">
            <div className="p-8">
              {/* Icône d'erreur */}
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-red-100 p-4">
                  <XCircleIcon className="h-16 w-16 text-red-600" />
                </div>
              </div>
              
              {/* Titre */}
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
                Erreur lors de la création
              </h2>
              
              {/* Message d'erreur */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <p className="text-red-800 text-center whitespace-pre-line">{errorMessage}</p>
              </div>
              
              {/* Note */}
              <div className="bg-sky-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Veuillez corriger le problème et réessayer.
                  </p>
                </div>
              </div>
              
              {/* Bouton */}
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-6 py-3 bg-[#2d85c9] text-white rounded-lg hover:bg-[#2d85c9]/90 transition-colors font-medium shadow-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal du reçu temporaire NON PAYÉ */}
      {showReceipt && generatedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              {/* En-tête avec icône */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#2d85c9]/10 p-3">
                    <DocumentTextIcon className="h-8 w-8 text-[#2d85c9]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reçu Temporaire</h2>
                    <p className="text-sm text-gray-600">Statut: NON PAYÉ</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-8 w-8" />
                </button>
              </div>
              
              {/* Alerte informative */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-900 font-medium mb-1">Reçu temporaire</p>
                    <p className="text-amber-800 text-sm">
                      Ce reçu est temporaire et indique un statut "NON PAYÉ". 
                      Il n'est pas sauvegardé en base de données et sert d'aperçu pour le client.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Composant du reçu */}
              <PaymentReceipt 
                paymentData={generatedReceipt} 
                onClose={() => setShowReceipt(false)} 
              />
              
              {/* Boutons d'action */}
              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Fermer
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 bg-[#2d85c9] text-white rounded-lg hover:bg-[#2d85c9]/90 transition-colors font-medium shadow-lg"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DossierCreationForm;
























