<<<<<<< HEAD
<<<<<<< HEAD
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../animations.css';
import AnimatedBackground from './AnimatedBackground';
import BusinessCreation3D from './BusinessCreation3D';
import ParticipantsStep from './ParticipantsStep';
import DocumentUpload from './DocumentUpload';
import DivisionSearchInput from './DivisionSearchInput';
import Header from './Header';
// Services and enums wired to backend
import divisionService from '../services/divisionService';
import personService from '../services/personService';
import { TypePersonne } from '../constants/enums';
import enumService from '../services/enumService';
import { businessAPI, apiUtils, createEntreprise, authAPI } from '../services/api';

// Nouveaux types pour l'API backend
export type TypeEntreprise = 'SOCIETE' | 'ENTREPRISE_INDIVIDUELLE';
export type FormeJuridique = 'SARL' | 'SARL_UNI' | 'SUC_SARL' | 'FIL_SARL' | 'SA' | 'SUC_SA' | 'FIL_SA' | 'SASU' | 'SAS' | 'BR' | 'FIL_SAS' | 'SUC_SAS' | 'SNC' | 'SCS' | 'SCI' | 'SCP' | 'GIE' | 'E_I';
export type EntrepriseRole = 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR';
export type StatutCreation = 'EN_COURS' | 'VALIDE' | 'REJETE';
export type EtapeValidation = 'CREATION' | 'VALIDATION_DOCUMENTS' | 'PAIEMENT' | 'FINALISATION';
export type DomaineActivites = 'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS' | 'ARCHITECTE' | 'BTP' | 'CARTOGRAPHIE_TOPOGRAPHIE' | 'GEOMETRES_EXPERTS' | 'INGENIEUR_CONSEIL' | 'PRODUCTEUR_DE_SPECTACLES' | 'PROMOTEUR_IMMOBILIER' | 'STATIONS' | 'TRANSPORT' | 'URBANISTE' | 'ETABLISSEMENT_DE_TOURISME' | 'AGENCE_DE_VOYAGE';

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

gsap.registerPlugin(ScrollTrigger);

// Fonction pour formater les dates pour le backend
const formatDateForBackend = (dateString: string | null | undefined): string | null => {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  try {
    // Si la date contient déjà un 'T', extraire seulement la partie date
    if (dateString.includes('T')) {
      const formattedDate = dateString.split('T')[0];
      return formattedDate;
    }

    // Vérifier si la date est au format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateString)) {
      return dateString;
    }

    // Essayer de parser et reformater la date
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    // Formater au format YYYY-MM-DD
    const formattedDate = parsedDate.toISOString().split('T')[0];
    return formattedDate;
  } catch (error) {
    return null;
  }
};

// Fonction pour s'assurer qu'une date de naissance rend la personne majeure (>= 18 ans)
const ensureAdultBirthDate = (birthDate: string | null | undefined): string => {
  if (!birthDate || birthDate.trim() === '') {
    // Si pas de date, générer une date qui rend la personne majeure (25 ans par exemple)
    const today = new Date();
    const adultDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    const result = adultDate.toISOString().split('T')[0];
    return result;
  }
  
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  
  // Calculer l'âge exact
  const exactAge = age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);
  
  if (exactAge < 18) {
    // Si mineur, ajuster la date pour rendre la personne majeure (25 ans)
    const adultDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    return adultDate.toISOString().split('T')[0];
  }
  
  // Si déjà majeur, retourner la date formatée
  const formatted = formatDateForBackend(birthDate);
  return formatted || birthDate;
};

// Fonction utilitaire pour valider et nettoyer l'email
// Retourne null si l'email est vide, invalide ou ressemble à un numéro de téléphone
const cleanAndValidateEmail = (email: string | undefined | null): string | null => {
  if (!email || email.trim() === '') {
    return null;
  }
  
  const emailValue = email.trim();
  
  // Vérifier que ce n'est pas un numéro de téléphone (commence par + ou contient uniquement des chiffres et espaces)
  if (emailValue.startsWith('+') || /^[\d\s\-\.]+$/.test(emailValue)) {
    console.warn('🔍 [EMAIL] Valeur rejetée car ressemble à un numéro de téléphone:', emailValue);
    return null;
  }
  
  // Vérifier le format email avec une regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailValue)) {
    console.warn('🔍 [EMAIL] Valeur rejetée car format invalide:', emailValue);
    return null;
  }
  
  return emailValue;
};

// Fonction pour mapper les civilités frontend vers backend
const mapCivilityToBackend = (frontendCivility: string): string => {
  const mapping: Record<string, string> = {
    'M.': 'MONSIEUR',
    'Mr': 'MONSIEUR', 
    'MR': 'MONSIEUR',
    'Monsieur': 'MONSIEUR',
    'MONSIEUR': 'MONSIEUR',
    'Mme': 'MADAME',
    'MME': 'MADAME',
    'Madame': 'MADAME',
    'MADAME': 'MADAME',
    'Mlle': 'MADEMOISELLE',
    'MLLE': 'MADEMOISELLE',
    'Mademoiselle': 'MADEMOISELLE',
    'MADEMOISELLE': 'MADEMOISELLE',
    // Ajout pour les personnes morales
    'PERSONNE_MORALE': 'PERSONNE_MORALE'
  };
  
  const result = mapping[frontendCivility] || 'MONSIEUR';
  return result;
};

// Fonction pour déduire le sexe à partir de la civilité
const deduceSexeFromCivilite = (civilite: string): string | null => {
  const backendCivilite = mapCivilityToBackend(civilite);
  
  let result;
  if (backendCivilite === 'PERSONNE_MORALE') {
    result = null; // Les personnes morales n'ont pas de sexe
  } else if (backendCivilite === 'MADAME' || backendCivilite === 'MADEMOISELLE') {
    result = 'FEMININ';
  } else {
    result = 'MASCULIN';
  }
  
  return result;
};

// Fonction pour obtenir le sexe cohérent avec la civilité (force la déduction si incohérent)
const getConsistentSexe = (existingSexe: string | undefined, civilite: string): string | null => {
  const deducedSexe = deduceSexeFromCivilite(civilite);
  
  // Si c'est une personne morale, retourner null
  if (deducedSexe === null) {
    return null;
  }
  
  // Si pas de sexe existant, utiliser la déduction
  if (!existingSexe) {
    return deducedSexe;
  }
  
  // Vérifier la cohérence
  const backendCivilite = mapCivilityToBackend(civilite);
  const isConsistent = 
    (backendCivilite === 'MONSIEUR' && existingSexe === 'MASCULIN') ||
    ((backendCivilite === 'MADAME' || backendCivilite === 'MADEMOISELLE') && existingSexe === 'FEMININ');
  
  if (isConsistent) {
    return existingSexe;
  } else {
    return deducedSexe;
  }
};

// Fonction pour valider le format du téléphone malien (E.164)
const validateMalianPhoneE164 = (phone: string): boolean => {
  // Format E.164 pour le Mali: +223 suivi de 8 chiffres
  const e164Regex = /^\+223[0-9]{8}$/;
  return e164Regex.test(phone);
};

// Fonction pour formater l'affichage du téléphone
const formatPhoneDisplay = (phone: string): string => {
  // Supprimer tous les caractères non numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si ça commence par +223, formater en +223 XX XX XX XX
  if (cleaned.startsWith('+223') && cleaned.length === 12) {
    const number = cleaned.substring(4); // Enlever +223
    return `+223 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`;
  }
  
  // Si c'est juste 8 chiffres, ajouter +223 et formater
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    return `+223 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)}`;
  }
  
  return phone;
};


// Liste des pays avec codes téléphoniques et drapeaux
const countries = [
  { code: '+223', name: 'Mali', flag: 'https://flagcdn.com/w40/ml.png', iso: 'ML' },
  { code: '+33', name: 'France', flag: 'https://flagcdn.com/w40/fr.png', iso: 'FR' },
  { code: '+1', name: 'États-Unis', flag: 'https://flagcdn.com/w40/us.png', iso: 'US' },
  { code: '+44', name: 'Royaume-Uni', flag: 'https://flagcdn.com/w40/gb.png', iso: 'GB' },
  { code: '+49', name: 'Allemagne', flag: 'https://flagcdn.com/w40/de.png', iso: 'DE' },
  { code: '+221', name: 'Sénégal', flag: 'https://flagcdn.com/w40/sn.png', iso: 'SN' },
  { code: '+225', name: 'Côte d\'Ivoire', flag: 'https://flagcdn.com/w40/ci.png', iso: 'CI' },
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
  { code: '+234', name: 'Nigeria', flag: 'https://flagcdn.com/w40/ng.png', iso: 'NG' },
  { code: '+237', name: 'Cameroun', flag: 'https://flagcdn.com/w40/cm.png', iso: 'CM' },
  { code: '+241', name: 'Gabon', flag: 'https://flagcdn.com/w40/ga.png', iso: 'GA' },
  { code: '+242', name: 'Congo', flag: 'https://flagcdn.com/w40/cg.png', iso: 'CG' },
  { code: '+243', name: 'RD Congo', flag: 'https://flagcdn.com/w40/cd.png', iso: 'CD' },
  { code: '+245', name: 'Guinée-Bissau', flag: 'https://flagcdn.com/w40/gw.png', iso: 'GW' },
  { code: '+248', name: 'Seychelles', flag: 'https://flagcdn.com/w40/sc.png', iso: 'SC' },
  { code: '+249', name: 'Soudan', flag: 'https://flagcdn.com/w40/sd.png', iso: 'SD' },
  { code: '+250', name: 'Rwanda', flag: 'https://flagcdn.com/w40/rw.png', iso: 'RW' },
  { code: '+251', name: 'Éthiopie', flag: 'https://flagcdn.com/w40/et.png', iso: 'ET' },
  { code: '+252', name: 'Somalie', flag: 'https://flagcdn.com/w40/so.png', iso: 'SO' },
  { code: '+253', name: 'Djibouti', flag: 'https://flagcdn.com/w40/dj.png', iso: 'DJ' },
  { code: '+254', name: 'Kenya', flag: 'https://flagcdn.com/w40/ke.png', iso: 'KE' },
  { code: '+255', name: 'Tanzanie', flag: 'https://flagcdn.com/w40/tz.png', iso: 'TZ' },
  { code: '+256', name: 'Ouganda', flag: 'https://flagcdn.com/w40/ug.png', iso: 'UG' },
  { code: '+257', name: 'Burundi', flag: 'https://flagcdn.com/w40/bi.png', iso: 'BI' },
  { code: '+258', name: 'Mozambique', flag: 'https://flagcdn.com/w40/mz.png', iso: 'MZ' },
  { code: '+260', name: 'Zambie', flag: 'https://flagcdn.com/w40/zm.png', iso: 'ZM' },
  { code: '+261', name: 'Madagascar', flag: 'https://flagcdn.com/w40/mg.png', iso: 'MG' },
  { code: '+262', name: 'Réunion', flag: 'https://flagcdn.com/w40/re.png', iso: 'RE' },
  { code: '+263', name: 'Zimbabwe', flag: 'https://flagcdn.com/w40/zw.png', iso: 'ZW' },
  { code: '+264', name: 'Namibie', flag: 'https://flagcdn.com/w40/na.png', iso: 'NA' },
  { code: '+265', name: 'Malawi', flag: 'https://flagcdn.com/w40/mw.png', iso: 'MW' },
  { code: '+266', name: 'Lesotho', flag: 'https://flagcdn.com/w40/ls.png', iso: 'LS' },
  { code: '+267', name: 'Botswana', flag: 'https://flagcdn.com/w40/bw.png', iso: 'BW' },
  { code: '+268', name: 'Eswatini', flag: 'https://flagcdn.com/w40/sz.png', iso: 'SZ' },
  { code: '+269', name: 'Comores', flag: 'https://flagcdn.com/w40/km.png', iso: 'KM' },
  { code: '+27', name: 'Afrique du Sud', flag: 'https://flagcdn.com/w40/za.png', iso: 'ZA' }
];

// Libellés lisibles pour Civilité et Sexe (valeurs API = names)
export const CIVILITE_LABELS: Record<string, string> = {
  MR: 'Monsieur',
  Mme: 'Madame',
  Melle: 'Mademoiselle',
};
export const SEXE_LABELS: Record<string, string> = {
  MASCULIN: 'Masculin',
  FEMININ: 'Féminin',
};

// Labels pour les domaines d'activité réglementés
export const DOMAINE_ACTIVITE_NR_LABELS: Record<DomaineActiviteNr, string> = {
  AGRICULTURE_ELEVAGE_PECHE: 'Agriculture, Élevage et Pêche',
  MINES_ET_MINERAIS: 'Mines et Minéraux',
  ENERGIE_ET_RESSOURCES_NATURELLES: 'Énergie et Ressources Naturelles',
  INDUSTRIE_ET_TRANSFORMATION: 'Industrie et Transformation',
  COMMERCE_ET_DISTRIBUTION: 'Commerce et Distribution',
  TRANSPORTS_ET_LOGISTIQUE: 'Transports et Logistique',
  TELECOMS_ET_TIC: 'Télécommunications et TIC',
  TOURISME_CULTURE_ET_ARTISANAT: 'Tourisme, Culture et Artisanat',
  SANTE_ET_PHARMACEUTIQUE: 'Santé et Pharmaceutique',
  EDUCATION_ET_FORMATION: 'Éducation et Formation',
  SERVICES_FINANCIERS_ET_ASSURANCES: 'Services Financiers et Assurances',
  IMMOBILIER_ET_CONSTRUCTION: 'Immobilier et Construction (BTP)',
  ADMINISTRATION_ET_SERVICES_PUBLICS: 'Administration et Services Publics',
  ENVIRONNEMENT_ET_ECOLOGIE: 'Environnement et Écologie',
  RECHERCHE_ET_INNOVATION: 'Recherche et Innovation',
  INGENIERIE_ET_ETUDES: 'Ingénierie et Études',
  URBANISME_ET_AMENAGEMENT: 'Urbanisme et Aménagement',
};

// Templates de demandes d'autorisation par domaine réglementé
export const AUTORISATION_TEMPLATES: Record<DomaineActivites, {
  title: string;
  description: string;
  documents: string[];
  procedure: string;
}> = {
  'BTP': {
    title: 'Demande d\'autorisation d\'exercice - BTP',
    description: 'Demande d\'autorisation pour exercer dans le domaine du Bâtiment et Travaux Publics',
    documents: [
      'Certificat de qualification professionnelle',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience dans le domaine',
      'Diplômes et certifications techniques'
    ],
    procedure: 'Déposer le dossier auprès de la Direction Générale des Travaux Publics'
  },
  'TRANSPORT': {
    title: 'Demande d\'autorisation d\'exercice - Transport',
    description: 'Demande d\'autorisation pour exercer dans le domaine du transport',
    documents: [
      'Permis de conduire professionnel',
      'Certificat de visite technique des véhicules',
      'Attestation d\'assurance véhicules',
      'Justificatifs de formation en transport'
    ],
    procedure: 'Déposer le dossier auprès de la Direction des Transports'
  },
  'ARCHITECTE': {
    title: 'Demande d\'autorisation d\'exercice - Architecture',
    description: 'Demande d\'autorisation pour exercer la profession d\'architecte',
    documents: [
      'Diplôme d\'architecte reconnu',
      'Certificat d\'inscription à l\'Ordre des Architectes',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Portfolio de réalisations'
    ],
    procedure: 'Déposer le dossier auprès de l\'Ordre des Architectes du Mali'
  },
  'URBANISTE': {
    title: 'Demande d\'autorisation d\'exercice - Urbanisme',
    description: 'Demande d\'autorisation pour exercer dans le domaine de l\'urbanisme',
    documents: [
      'Diplôme en urbanisme ou aménagement du territoire',
      'Certificat de qualification professionnelle',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en urbanisme'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Urbanisme'
  },
  'INGENIEUR_CONSEIL': {
    title: 'Demande d\'autorisation d\'exercice - Ingénieur Conseil',
    description: 'Demande d\'autorisation pour exercer comme ingénieur conseil',
    documents: [
      'Diplôme d\'ingénieur reconnu',
      'Certificat d\'inscription à l\'Ordre des Ingénieurs',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience professionnelle'
    ],
    procedure: 'Déposer le dossier auprès de l\'Ordre des Ingénieurs du Mali'
  },
  'CARTOGRAPHIE_TOPOGRAPHIE': {
    title: 'Demande d\'autorisation d\'exercice - Cartographie/Topographie',
    description: 'Demande d\'autorisation pour exercer dans le domaine de la cartographie et topographie',
    documents: [
      'Diplôme en géomatique, topographie ou cartographie',
      'Certificat de qualification professionnelle',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs de formation aux outils de mesure'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de la Cartographie'
  },
  'GEOMETRES_EXPERTS': {
    title: 'Demande d\'autorisation d\'exercice - Géomètre Expert',
    description: 'Demande d\'autorisation pour exercer comme géomètre expert',
    documents: [
      'Diplôme de géomètre expert',
      'Certificat d\'inscription à l\'Ordre des Géomètres Experts',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en géométrie'
    ],
    procedure: 'Déposer le dossier auprès de l\'Ordre des Géomètres Experts'
  },
  'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS': {
    title: 'Demande d\'autorisation d\'exercice - Immobilier',
    description: 'Demande d\'autorisation pour exercer dans l\'administration immobilière',
    documents: [
      'Certificat de formation en gestion immobilière',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en immobilier',
      'Caution bancaire'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Habitat'
  },
  'PROMOTEUR_IMMOBILIER': {
    title: 'Demande d\'autorisation d\'exercice - Promotion Immobilière',
    description: 'Demande d\'autorisation pour exercer comme promoteur immobilier',
    documents: [
      'Justificatifs de capacité financière',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en promotion immobilière',
      'Garantie bancaire'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Habitat'
  },
  'PRODUCTEUR_DE_SPECTACLES': {
    title: 'Demande d\'autorisation d\'exercice - Production de Spectacles',
    description: 'Demande d\'autorisation pour exercer comme producteur de spectacles',
    documents: [
      'Justificatifs d\'expérience dans le spectacle',
      'Attestation d\'assurance responsabilité civile',
      'Certificat de formation en production culturelle',
      'Portfolio de productions'
    ],
    procedure: 'Déposer le dossier auprès du Ministère de la Culture'
  },
  'ETABLISSEMENT_DE_TOURISME': {
    title: 'Demande d\'autorisation d\'exercice - Établissement de Tourisme',
    description: 'Demande d\'autorisation pour exploiter un établissement de tourisme',
    documents: [
      'Plan de l\'établissement',
      'Attestation d\'assurance responsabilité civile',
      'Certificat de conformité aux normes touristiques',
      'Justificatifs de formation en hôtellerie/tourisme'
    ],
    procedure: 'Déposer le dossier auprès de l\'Office Malien du Tourisme'
  },
  'AGENCE_DE_VOYAGE': {
    title: 'Demande d\'autorisation d\'exercice - Agence de Voyage',
    description: 'Demande d\'autorisation pour exploiter une agence de voyage',
    documents: [
      'Garantie financière',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Certificat de formation en tourisme',
      'Justificatifs d\'expérience dans le tourisme'
    ],
    procedure: 'Déposer le dossier auprès de l\'Office Malien du Tourisme'
  },
  'STATIONS': {
    title: 'Demande d\'autorisation d\'exercice - Station Service',
    description: 'Demande d\'autorisation pour exploiter une station service',
    documents: [
      'Étude d\'impact environnemental',
      'Attestation d\'assurance responsabilité civile',
      'Certificat de conformité aux normes de sécurité',
      'Justificatifs de formation en sécurité pétrolière'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Énergie'
  }
};

// Mapping inverse : domaines non réglementés vers leurs domaines réglementés parents
// domaineActiviteNr (non réglementé) -> domaineActivite (réglementé)
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

// Mapping entre les domaines réglementés et non réglementés qui se correspondent
// Basé sur la relation parent définie dans l'enum DomaineActivites du backend
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
    'ETABLISSEMENT_DE_TOURISME', // Établissement de tourisme
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
    'GEOMETRES_EXPERTS', // Géomètres-Experts
    'INGENIEUR_CONSEIL' // Ingénieur-Conseil
  ],
  URBANISME_ET_AMENAGEMENT: ['URBANISTE'], // Urbaniste
};

// Type pour les données complètes de l'entreprise
interface BusinessData {
  personalInfo?: PersonalInfo;
  companyInfo?: CompanyInfo;
  participants?: Participant[];
}

// Types pour la génération PDF
type GenArgs = {
  companyInfo: Partial<CompanyInfo>;
  personalInfo: Partial<PersonalInfo>;
  template: { title: string };
  domaineReglemente: string;
};

// Fonction pour générer le document PDF de demande d'autorisation au format officiel (2 pages)
function generateAutorisationPDF({
  companyInfo,
  personalInfo,
  template,
  domaineReglemente,
}: GenArgs) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");

  // ===== Helpers =====
  const MARGIN_L = 20;
  const MARGIN_R = 190;
  const WIDTH = MARGIN_R - MARGIN_L;
  const LINE = 5;

  let y = 20;
  let isFirstPage = true;

  const addPageIfNeeded = (inc = 0) => {
    const need = y + inc > 285;
    if (need) {
      doc.addPage();
      y = 20;
      isFirstPage = false;
    }
  };

  const text = (t: string, x: number, yPos = y, opt?: any) => {
    doc.text(t, x, yPos, opt);
  };

  const underline = (label: string, x: number, yPos = y) => {
    const w = doc.getTextWidth(label);
    text(label, x, yPos);
    doc.line(x, yPos + 0.7, x + w, yPos + 0.7);
  };

  const spaced = (t: string) => t.split("").join(" ");

  const wrap = (t: string, width = WIDTH) => doc.splitTextToSize(t, width);

  const dottedLine = (x1: number, y1: number, x2: number) => {
    const dash = 1.5,
      gap = 1.2;
    let dx = x2 - x1;
    const step = dash + gap;
    const n = Math.floor(dx / step);
    for (let i = 0; i < n; i++) {
      const sx = x1 + i * step;
      doc.line(sx, y1, sx + dash, y1);
    }
    // fin
    const remaining = dx - n * step;
    if (remaining > 0.5) {
      const sx = x1 + n * step;
      doc.line(sx, y1, Math.min(x2, sx + remaining), y1);
    }
  };

  const labeledLine = (
    label: string,
    value: string,
    x = MARGIN_L,
    lineW = 150
  ) => {
    const labW = doc.getTextWidth(label);
    text(label, x, y);
    const start = x + labW + 2;
    const end = x + lineW;
    dottedLine(start, y, end);
    if (value && value !== "Non spécifié") {
      text(value, start + 1, y - 0.8);
    }
    y += 6;
  };

  const bullets = (lines: string[], x = MARGIN_L + 5, indent = 4, lh = 4) => {
    lines.forEach((ln) => {
      const wrapped = wrap(ln, WIDTH - (x - MARGIN_L) - 2);
      wrapped.forEach((wl: string, idx: number) => {
        // Ne pas ajouter de page pour la première page, forcer à rester
        if (isFirstPage) {
          // Réduire l'espacement si on approche du bas de page
          if (y > 270) {
            lh = 3.5;
          }
        } else {
          addPageIfNeeded(lh);
        }
        if (idx === 0) text("•", x, y);
        text(wl, x + indent, y);
        y += lh;
      });
    });
  };

  // ===== PAGE 1 =====
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  text("Promoteur", MARGIN_L, y);
  text("Bamako, le", 150, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  labeledLine("Nom ou Raison Sociale :", companyInfo?.nom || "", MARGIN_L, 170);
  labeledLine("Nationalité :", personalInfo?.nationality || "", MARGIN_L, 170);
  labeledLine("Adresse :", personalInfo?.address || "", MARGIN_L, 170);
  y += 3;

  // Timbre (petit cadre à gauche)
  doc.rect(MARGIN_L, y, 35, 22);
  doc.setFontSize(8);
  text("Timbre", MARGIN_L + 6, y + 8);
  text("200 F CFA", MARGIN_L + 6, y + 15);

  // En-tête centré
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  text("A Monsieur le Directeur Général", 105, y + 4, { align: "center" });
  text("de l'Agence pour la Promotion des", 105, y + 12, { align: "center" });
  text("Investissements au Mali", 105, y + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  text(spaced("B A M A K O"), 105, y + 35, { align: "center" });
  y += 48;

  // Trait de séparation
  doc.line(MARGIN_L, y, MARGIN_R, y);
  y += 8;

  // Objet (avec "Objet" en gras + soulignés sur les mots comme le modèle)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  text("Objet", MARGIN_L, y);
  doc.setFont("helvetica", "normal");
  text(": demande ", MARGIN_L + 16, y);

  // morceaux soulignés
  underline("d'autorisation", MARGIN_L + 16 + doc.getTextWidth(": demande ") , y);
  const xAfter1 =
    MARGIN_L + 16 + doc.getTextWidth(": demande ") + doc.getTextWidth("d'autorisation") + 2;
  text(" ", xAfter1, y);
  underline("d'exercice", xAfter1 + 1, y);

  const afterEx = xAfter1 + 1 + doc.getTextWidth("d'exercice") + 2;
  text(" en qualité", afterEx, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  underline(
    `d'${template.title}` ,
    MARGIN_L,
    y
  );
  doc.setFont("helvetica", "normal");
  text(" ou d'Agent immobilier.", MARGIN_L + doc.getTextWidth(`d'${template.title}` ) + 2, y);
  y += 10;

  // Corps
  text("Monsieur le Directeur général,", MARGIN_L, y);
  y += 7;
  const corps =
    `J'ai l'honneur de solliciter auprès de votre haute bienveillance l'octroi d'une autorisation d'exercice en qualité d'${template.title} ou d'Agent immobilier.` ;
  wrap(corps).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  y += 3;

  // Numérotation 1–3
  doc.setFont("helvetica", "normal");
  text("1. Nom ou Raison sociale :", MARGIN_L, y);
  labeledLine("", companyInfo?.nom || "", MARGIN_L + 55, 180);

  text("2. Adresse ou Siège social :", MARGIN_L, y);
  labeledLine("", personalInfo?.address || "", MARGIN_L + 60, 180);

  text("3. Forme juridique :", MARGIN_L, y);
  labeledLine("", companyInfo?.formeJuridique || "", MARGIN_L + 40, 180);

  // Politesse
  const politesse =
    "Veuillez agréer, Monsieur le Directeur Général, l'expression de mes sentiments les plus distingués.";
  y += 2;
  wrap(politesse).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  y += 3;

  // Pièces jointes (titre)
  doc.setFont("helvetica", "bold");
  text("Pièces jointes", MARGIN_L, y);
  doc.setFont("helvetica", "normal");
  text(" :", MARGIN_L + doc.getTextWidth("Pièces jointes") + 1.2, y);
  y += 5;

  // 1. Personnes physiques
  doc.setFont("helvetica", "bold");
  text("1. Pour les personnes physiques :", MARGIN_L + 5, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  bullets(
    [
      "une demande timbrée;",
      "un extrait de l'acte de naissance ou du jugement supplétif en tenant lieu;",
      "un certificat de nationalité;",
      "deux photos d'identité du promoteur;",
      "une copie certifiée conforme du diplôme ou une attestation délivrée par l'employeur;",
      "un extrait du casier judiciaire datant de moins de trois mois;",
      "un document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou un certificat d'inscription hypothécaire délivré par l'autorité compétente ;",
      "une police d'assurance de responsabilité civile professionnelle.",
    ],
    MARGIN_L + 5
  );

  // 2. Personnes morales (début page 1)
  doc.setFont("helvetica", "bold");
  text("2. Personnes morales :", MARGIN_L + 5, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  bullets(
    [
      "Demande timbrée;",
      "Statuts de la société (copies authentiques);",
      "Diplôme ou certificat établissant la qualification du responsable gerant;",
      "Liste nominative du personnel d'encadrement;",
      "Demande de déclaration d'ouverture d'établissement dûment remplie par l'Agence Nationale pour l'Emploi;",
      "Liste des immobilisations corporelles de l'entreprise accompagnée d'un rapport d'évaluation établi par un expert industriel agréé.",
    ],
    MARGIN_L + 5
  );

  // ===== PAGE 2 =====
  doc.addPage();
  isFirstPage = false;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  text("2", 190, 20);
  y = 35;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  text("2. Pour les personnes morales :", MARGIN_L, y);
  doc.setFont("helvetica", "normal");
  text("º", 130, y); // petit symbole comme sur l'image
  y += 8;

  doc.setFontSize(9);
  bullets(
    [
      "une demande timbrée;",
      "les copies authentiques des statuts ;",
      "les extraits de l'acte de naissance, certificat de nationalité et du casier judiciaire datant de moins de 3 mois, le curriculum vitae, deux photos d'identité et la copie certifiée conforme du diplôme ou du certificat professionnel du responsable gerant ;",
      "un document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou un certificat d'inscription hypothécaire délivré par l'autorité compétente ;",
      "une police d'assurance de responsabilité civile professionnelle.",
    ],
    MARGIN_L + 5
  );

  y += 4;
  doc.setFont("helvetica", "bold");
  text("Réservé à l'Administration", MARGIN_L, y);
  y += 8;

  // Cadre Code / Avis
  doc.rect(MARGIN_L, y, WIDTH, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  text("Code :", MARGIN_L + 5, y + 12);
  text("Avis :", MARGIN_L + 5, y + 27);
  y += 45;

  // Signature
  doc.setFont("helvetica", "bold");
  text("Signature du Promoteur", 130, y);
  y += 10;

  // NB1 (NUI dans ton code)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  underline(
    "NB1: Montant de la caution de garantie et de la valeur de l'immeuble affecté en hypothèque",
    MARGIN_L,
    y
  );
  y += 6;
  doc.setFont("helvetica", "normal");
  const nb1a =
    "Le montant de la caution de garantie est de cinq millions (5 000 000) de F CFA pour l'Administrateur de biens immobiliers et de deux millions cinq cent mille (2 500 000) F CFA pour l'Agent immobilier.";
  wrap(nb1a).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  const nb1b =
    "La valeur de l'immeuble affecté en hypothèque doit être égale ou supérieure à quinze millions (15 000 000) de F CFA pour chacune des professions.";
  wrap(nb1b).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  y += 4;

  // NB2 (frais de dépôt)
  doc.setFont("helvetica", "bold");
  text(
    "NB2 : Frais de dépôt : Cent vingt-cinq mille (125 000) francs CFA (date d'entrée en vigueur le 02/01/2023)",
    MARGIN_L,
    y
  );
  y += 7;

  // (optionnel) tableau des frais par catégorie comme sur ta maquette finale
  doc.setFont("helvetica", "bold");
  text(
    "NB : Frais de dépôt en francs CFA par Catégorie",
    MARGIN_L,
    y
  );
  y += 6;
  doc.setFont("helvetica", "normal");
  text(
    "G = 50 000 ; F = 100 000 ; E = 300 000 ; D = 325 000 ; C = 350 000 ; B = 400 000 ; A = 450 000",
    MARGIN_L,
    y
  );

  // Sauvegarde
  const fileName = `Demande_Autorisation_${domaineReglemente}_${
    companyInfo?.nom || "Entreprise"
  }.pdf`;
  doc.save(fileName);
}

// Fonction wrapper pour maintenir la compatibilité
const generateAutorisationDocument = (domaineReglemente: DomaineActivites, businessData: BusinessData) => {
  const template = AUTORISATION_TEMPLATES[domaineReglemente];
  if (!template) {
    alert('Template de demande non trouvé pour ce domaine');
    return;
  }

  generateAutorisationPDF({
    companyInfo: businessData.companyInfo || {},
    personalInfo: businessData.personalInfo || {},
    template: template,
    domaineReglemente: domaineReglemente,
  });
};

// Nouvelle structure pour les participants selon l'API backend
export interface Participant {
  personId?: string; // Optionnel car généré automatiquement
  role: EntrepriseRole;
  pourcentageParts: number;
  dateDebut: string; // Format ISO date
  dateFin: string;   // Format ISO date
  // Champs personnels pour la création (obligatoires maintenant)
  nom: string;
  prenom: string;
  telephone?: string;
  telephone2?: string;
  email?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationnalite?: string;
  sexe?: string;
  situationMatrimoniale?: string;
  civilite?: string;
  // Champs pour les documents
  typePiece?: string;
  numeroPiece?: string;
  documentFile?: File;
  documentUrl?: string;
  // Champ spécifique pour le casier judiciaire des gérants
  casierJudiciaireFile?: File;
  // Champ spécifique pour l'acte de mariage des gérants
  acteMariageFile?: File;
  // Champ spécifique pour l'extrait de naissance des gérants
  extraitNaissanceFile?: File;
  // Champ spécifique pour le certificat de résidence des gérants
  certificatResidenceFile?: File;
  certificatResidenceUrl?: string;
  // Champ spécifique pour le certificat de nationalité des gérants
  certificatNationaliteFile?: File;
  // Champ spécifique pour la pièce de nationalité des gérants d'entreprises individuelles
  pieceNationaliteFile?: File;
  // Champ spécifique pour la déclaration sur l'honneur des gérants
  declarationHonneurFile?: File;
  // Champ pour la signature (déclaration sur l'honneur)
  signatureDataUrl?: string;
  // Champs de localisation
  divisionId?: string;
  division_id?: string;
  divisionCode?: string;
  localite?: string;
  porte?: string;
  // Champs spécifiques aux personnes morales
  paysEmissionRccm?: string;
  denominationEntreprise?: string;
  rccmFile?: File;
  // Champs pour les questions spécifiques aux gérants (par participant)
  hasCriminalRecord?: boolean;
  isMarried?: boolean;
  authorizeOthers?: boolean;
  isForSelf?: boolean; // true = pour moi-même, false = pour une autre personne
  // Documents supplémentaires pour les entreprises individuelles
  autresDocuments?: Array<{
    id: string;
    name: string;
    file: File | null;
    description: string;
  }>;
}

// Structure pour la requête de création d'entreprise selon l'API backend
interface EntrepriseRequest {
  nom: string;
  sigle: string;
  capitale: string;
  activiteSecondaire?: string;
  adresseDifferentIdentite: boolean;
  extraitJudiciaire: boolean;
  autorisationGerant: boolean;
  autorisationExercice: boolean;
  importExport: boolean;
  statutSociete: boolean;
  typeEntreprise: TypeEntreprise;
  statutCreation: StatutCreation;
  etapeValidation: EtapeValidation;
  formeJuridique: FormeJuridique;
  domaineActivite?: DomaineActivites; // Optionnel - seulement si le domaine non réglementé nécessite une réglementation
  domaineActiviteNr?: DomaineActiviteNr; // Ajout du champ manquant
  divisionCode: string;
  participants: Participant[];
}

// Structure pour les informations personnelles (étape 1)
interface PersonalInfo {
  civility: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phone2?: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  sexe: string;
  situationMatrimoniale: string;
  typePersonne: TypePersonne;
  idType: string;
  idNumber: string;
  idExpiryDate: string;
  idIssuedAt: string;
  address: string;
  city: string;
  region: string;
  localite: string; // Champ localité (rue)
  porte: string; // Numéro de porte
  adresseLibre?: string; // Adresse libre (champ texte libre)
  divisionId: string; // ID de la division administrative
  // IDs de sélection pour restauration
  selectedRegionId?: string;
  selectedCercleId?: string;
  selectedCommuneId?: string;
  selectedQuartierId?: string;
  selectedLocationName?: string; // Nom de la localisation pour la récap
  position: string;
  powers: string[];
  roleId: number;
  idDocument?: File | null;
  idDocumentName?: string;
  // Questions spécifiques
  isForSelf?: boolean; // Créez-vous cette entreprise pour vous-même ?
  hasCriminalRecord?: boolean;
  isMarried?: boolean;
  allowsMultipleManagers?: boolean;
  requiresExerciseAuthorization?: boolean;
  hasDifferentAddress?: boolean;
}

// Structure pour les informations de l'entreprise (étape 2)
interface CompanyInfo {
  nom: string;
  sigle: string;
  capitale: string;
  activiteSecondaire?: string;
  typeEntreprise: TypeEntreprise;
  formeJuridique: FormeJuridique;
  domaineActivite?: DomaineActivites; // Optionnel - seulement si le domaine non réglementé nécessite une réglementation
  domaineActiviteNr?: DomaineActiviteNr;
  divisionCode: string;
  adresseDifferentIdentite: boolean;
  extraitJudiciaire: boolean;
  autorisationGerant: boolean;
  autorisationExercice: boolean;
  importExport: boolean;
  statutSociete: boolean;
  statutCreation: StatutCreation;
  etapeValidation: EtapeValidation;
  regionId?: string;
  cercleId?: string;
  arrondissementId?: string;
  communeId?: string;
  quartierId?: string;
  rue?: string;
  porte?: string;
  selectedLocationName?: string; // Nom de la localisation pour la récap
}

interface Documents {
  statutes: File | null;
  statutesName: string;
  needsStatutesDrafting: boolean;
  statutesPages: number;
  commerceRegistry: File | null;
  commerceRegistryName: string;
  hasCommerceRegistry: boolean;
  residenceCertificate: File | null;
  residenceCertificateName: string;
}

interface Payment {
  method?: 'moov' | 'orange' | 'wave' | 'card' | '';
  phoneNumber?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
  totalAmount?: number;
  breakdown?: {
    statutesDrafting?: number;
    registrationFees?: number;
    serviceFees?: number;
  };
}

// Structure globale pour toutes les données du processus de création
export interface BusinessCreationData {
  // Étape 1: Informations personnelles
  personalInfo: PersonalInfo & {
    isForSelf: boolean;
    hasDifferentAddress: boolean;
    hasCriminalRecord: boolean;
    isMarried: boolean;
    allowsMultipleManagers: boolean;
    requiresExerciseAuthorization: boolean;
    willImportExport: boolean;
  };
  // Étape 2: Informations de l'entreprise
  companyInfo: CompanyInfo & {
    typeEntreprise?: 'ENTREPRISE_INDIVIDUELLE' | 'SOCIETE';
  };
  // Étape 3: Participants/Associés
  participants: Participant[];
  // Étape 4: Documents
  documents?: Documents;
  // ID de la personne fondatrice (créée ou mise à jour à l'étape 1)
  founderId?: string;
  // Étape 5: Paiement
  payment?: Payment;
}

// Composant pour la sélection de localisation personnelle
const PersonalLocationStep: React.FC<{
  data: BusinessCreationData,
  updateData: (field: keyof BusinessCreationData, value: any) => void,
  isReadOnly?: boolean
}> = ({ data, updateData, isReadOnly = false }) => {
  // États pour les divisions personnelles (STRUCTURE INSTAT MALI - 4 NIVEAUX)
  const [personalRegions, setPersonalRegions] = useState<any[]>([]);
  const [personalCercles, setPersonalCercles] = useState<any[]>([]);
  const [personalCommunes, setPersonalCommunes] = useState<any[]>([]);
  const [personalQuartiers, setPersonalQuartiers] = useState<any[]>([]);

  // États pour les sélections personnelles (STRUCTURE INSTAT MALI - 4 NIVEAUX)
  const [personalSelectedRegionId, setPersonalSelectedRegionId] = useState<string>('');
  const [personalSelectedCercleId, setPersonalSelectedCercleId] = useState<string>('');
  const [personalSelectedCommuneId, setPersonalSelectedCommuneId] = useState<string>('');
  const [personalSelectedQuartierId, setPersonalSelectedQuartierId] = useState<string>('');

  // Flag pour éviter les conflits entre restauration et useEffect de chargement
  const [isRestoringPersonalData, setIsRestoringPersonalData] = useState(false);

  // Restaurer les états de sélection de localisation depuis data.personalInfo (localStorage)
  useEffect(() => {
    if (data.personalInfo?.selectedRegionId && personalRegions.length > 0) {
      console.log('🔄 [LOCALSTORAGE] Restauration des sélections de localisation...');
      
      const regionId = data.personalInfo.selectedRegionId;
      const cercleId = data.personalInfo.selectedCercleId;
      const communeId = data.personalInfo.selectedCommuneId;
      const quartierId = data.personalInfo.selectedQuartierId;
      
      setPersonalSelectedRegionId(regionId || '');
      
      // Charger les cercles si une région est sélectionnée
      if (regionId) {
        const region = personalRegions.find(r => r.id === regionId);
        if (region?.code) {
          divisionService.getCerclesByRegion(region.code).then((cercles) => {
            setPersonalCercles(cercles || []);
            setPersonalSelectedCercleId(cercleId || '');
            
            // Charger les communes si un cercle est sélectionné
            if (cercleId) {
              const cercle = cercles?.find((c: any) => c.id === cercleId);
              if (cercle?.code) {
                divisionService.getCommunesByCercle(cercle.code).then((communes) => {
                  setPersonalCommunes(communes || []);
                  setPersonalSelectedCommuneId(communeId || '');
                  
                  // Charger les quartiers si une commune est sélectionnée
                  if (communeId) {
                    const commune = communes?.find((c: any) => c.id === communeId);
                    if (commune?.code) {
                      divisionService.getQuartiersByCommune(commune.code).then((quartiers) => {
                        setPersonalQuartiers(quartiers || []);
                        setPersonalSelectedQuartierId(quartierId || '');
                        console.log('✅ [LOCALSTORAGE] Localisation complète restaurée');
                      });
                    }
                  }
                });
              }
            }
          });
        }
      }
    }
  }, [data.personalInfo?.selectedRegionId, personalRegions.length]);

  // Restaurer les sélections personnelles depuis data.personalInfo.divisionId
  useEffect(() => {
    if (data.personalInfo?.divisionId && personalRegions.length > 0 && !isRestoringPersonalData) {
      console.log('🔍 [PERSONAL SYNC] Restauration des sélections personnelles depuis divisionId:', data.personalInfo.divisionId);
      setIsRestoringPersonalData(true);
      
      const divisionId = data.personalInfo.divisionId;
      
      // Analyser la hiérarchie selon la longueur de l'ID
      if (divisionId.length >= 12) {
        // Quartier (12 chiffres) - extraire les codes hiérarchiques
        const regionCode = divisionId.substring(0, 2);
        const cercleCode = divisionId.substring(0, 4);
        const communeCode = divisionId.substring(0, 8);
        const quartierCode = divisionId;
        
        console.log('🔍 [PERSONAL SYNC] Hiérarchie détectée:', {
          regionCode, cercleCode, communeCode, quartierCode
        });
        
        // Trouver la région par code
        const matchingRegion = personalRegions.find(r => r.code === regionCode);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée par code:', matchingRegion.nom, 'ID:', matchingRegion.id);
          
          // Utiliser setTimeout pour s'assurer que tous les setState sont exécutés
          setTimeout(() => {
            setPersonalSelectedRegionId(matchingRegion.id);
            setPersonalSelectedRegionCode(matchingRegion.code);
            console.log('🔍 [PERSONAL SYNC] Région mise à jour');
            
            setTimeout(() => {
              setPersonalSelectedCercleId(cercleCode);
              setPersonalSelectedCercleCode(cercleCode);
              console.log('🔍 [PERSONAL SYNC] Cercle mis à jour:', cercleCode);
              
              setTimeout(() => {
                setPersonalSelectedCommuneId(communeCode);
                setPersonalSelectedCommuneCode(communeCode);
                console.log('🔍 [PERSONAL SYNC] Commune mise à jour:', communeCode);
                
                setTimeout(() => {
                  setPersonalSelectedQuartierId(quartierCode);
                  setPersonalSelectedQuartierCode(quartierCode);
                  console.log('🔍 [PERSONAL SYNC] Quartier mis à jour:', quartierCode);
                  console.log('🔍 [PERSONAL SYNC] Toute la hiérarchie restaurée:', {
                    regionId: matchingRegion.id,
                    cercleId: cercleCode,
                    communeId: communeCode,
                    quartierId: quartierCode
                  });
                  
                  // Maintenant permettre aux useEffect de charger les données et forcer le chargement des communes
                  setTimeout(() => {
                    setIsRestoringPersonalData(false);
                    console.log('🔍 [PERSONAL SYNC] Flag désactivé après restauration complète - useEffect peuvent maintenant charger les données');
                    
                    // Forcer le chargement des communes après restauration
                    if (cercleCode) {
                      console.log('🔍 [PERSONAL SYNC] Forçage du chargement des communes pour cercle:', cercleCode);
                      divisionService.getCommunesByCercle(cercleCode).then((res: any[]) => {
                        console.log('🔍 [PERSONAL SYNC] Communes forcées chargées:', res?.length || 0);
                        setPersonalCommunes(res || []);
                      }).catch(() => {
                        console.log('🔍 [PERSONAL SYNC] Erreur lors du chargement forcé des communes');
                      });
                    }
                  }, 100);
                }, 10);
              }, 10);
            }, 10);
          }, 10);
        }
      } else if (divisionId.length >= 8) {
        // Commune (8 chiffres)
        const regionCode = divisionId.substring(0, 2);
        const cercleCode = divisionId.substring(0, 4);
        const matchingRegion = personalRegions.find(r => r.code === regionCode);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée par code (commune):', matchingRegion.nom);
          setPersonalSelectedRegionId(matchingRegion.id);
          setPersonalSelectedRegionCode(matchingRegion.code);
          setPersonalSelectedCercleId(cercleCode);
          setPersonalSelectedCommuneId(divisionId);
        }
      } else if (divisionId.length >= 4) {
        // Cercle (4 chiffres)
        const regionCode = divisionId.substring(0, 2);
        const matchingRegion = personalRegions.find(r => r.code === regionCode);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée par code (cercle):', matchingRegion.nom);
          setPersonalSelectedRegionId(matchingRegion.id);
          setPersonalSelectedRegionCode(matchingRegion.code);
          setPersonalSelectedCercleId(divisionId);
        }
      } else {
        // Région (2 chiffres) ou ID direct
        const matchingRegion = personalRegions.find(r => r.id === divisionId || r.code === divisionId);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée directement:', matchingRegion.nom);
          setPersonalSelectedRegionId(matchingRegion.id);
          setPersonalSelectedRegionCode(matchingRegion.code);
        }
      }
      
      // Ne pas désactiver automatiquement le flag - il sera désactivé lors d'interactions manuelles
      console.log('🔍 [PERSONAL SYNC] Restauration terminée - flag maintenu actif pour éviter les réinitialisations');
    }
  }, [data.personalInfo?.divisionId, personalRegions.length]);

  // États pour les codes personnels (STRUCTURE INSTAT MALI - 4 NIVEAUX)
  const [personalSelectedRegionCode, setPersonalSelectedRegionCode] = useState<string>('');
  const [personalSelectedCercleCode, setPersonalSelectedCercleCode] = useState<string>('');
  const [personalSelectedCommuneCode, setPersonalSelectedCommuneCode] = useState<string>('');
  const [personalSelectedQuartierCode, setPersonalSelectedQuartierCode] = useState<string>('');

  // Debug: Vérifier la valeur actuelle des variables d'état personnelles
  useEffect(() => {
    console.log('🔍 [PERSONAL STATE] Variables d\'état actuelles:', {
      personalSelectedRegionId,
      personalSelectedCercleId,
      personalSelectedCommuneId,
      personalSelectedQuartierId
    });
  }, [personalSelectedRegionId, personalSelectedCercleId, personalSelectedCommuneId, personalSelectedQuartierId]);

  // Flag supprimé - plus besoin de bloquer les useEffect
  
  // Logique unifiée pour charger les arrondissements de Bamako District
  const loadBamakoArrondissements = async (regionId: string): Promise<any[]> => {
    let arrondissements: any[] = [];
    
    // Stratégie 1: Endpoint direct
    try {
      arrondissements = await divisionService.getArrondissementsByRegion(regionId);
      if (arrondissements?.length > 0) return arrondissements;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 2: searchBamakoDivisions
    try {
      const bamakoDivisions = await divisionService.searchBamakoDivisions();
      arrondissements = bamakoDivisions?.filter((d: any) => d.divisionType === 'ARRONDISSEMENT') || [];
      if (arrondissements?.length > 0) return arrondissements;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 3: getAllArrondissements + filtrage intelligent
    try {
      const allArrondissements = await divisionService.getAllArrondissements();
      const bamakoFilters = [
        (arr: any) => arr.parent?.nom?.toLowerCase().includes('bamako'),
        (arr: any) => {
          const nom = arr.nom?.toLowerCase() || '';
          const code = arr.code || '';
          return nom.includes('arrondissement') && 
                 ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => code.startsWith(prefix));
        },
        (arr: any) => {
          const code = arr.code || '';
          return ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(code);
        }
      ];
      
      for (let i = 0; i < bamakoFilters.length; i++) {
        const filtered = allArrondissements?.filter(bamakoFilters[i]) || [];
        if (filtered?.length > 0) {
          arrondissements = filtered;
          break;
        }
      }
      if (arrondissements?.length > 0) return arrondissements;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 4: Données hardcodées en dernier recours
    return [
      { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001', parent: { id: regionId } },
      { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002', parent: { id: regionId } },
      { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003', parent: { id: regionId } },
      { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004', parent: { id: regionId } },
      { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005', parent: { id: regionId } },
      { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006', parent: { id: regionId } }
    ];
  };
  
  // Logique unifiée pour charger les quartiers de Bamako District
  const loadBamakoQuartiers = async (arrondissementId: string, arrondissementCode?: string): Promise<any[]> => {
    let quartiers: any[] = [];
    
    // Stratégie 1: Endpoint direct par ID
    try {
      quartiers = await divisionService.getQuartiersByArrondissement(arrondissementId);
      if (quartiers?.length > 0) return quartiers;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 2: Endpoint par code (si disponible)
    if (arrondissementCode) {
      try {
        quartiers = await divisionService.getQuartiersByArrondissementCode(arrondissementId);
        if (quartiers?.length > 0) return quartiers;
      } catch (error) { /* Fallback */ }
    }
    
    // Stratégie 3: getAllQuartiers + filtrage par code
    if (arrondissementCode) {
      try {
        const allQuartiers = await divisionService.getAllQuartiers();
        const codePrefix = arrondissementCode.substring(0, 4);
        quartiers = allQuartiers?.filter((quartier: any) => {
          const code = quartier.code || '';
          return code.startsWith(codePrefix);
        }) || [];
        if (quartiers?.length > 0) return quartiers;
      } catch (error) { /* Fallback */ }
    }
    
    // Stratégie 4: Données hardcodées par arrondissement
    const hardcodedQuartiers: Record<string, any[]> = {
      '0001': [
        { id: 'bamako-q-001-1', nom: 'Quartier Korofina Nord', code: '000101', parent: { id: arrondissementId } },
        { id: 'bamako-q-001-2', nom: 'Quartier Korofina Sud', code: '000102', parent: { id: arrondissementId } }
      ],
      '0002': [
        { id: 'bamako-q-002-1', nom: 'Quartier Niaréla', code: '000201', parent: { id: arrondissementId } },
        { id: 'bamako-q-002-2', nom: 'Quartier Bagadadji', code: '000202', parent: { id: arrondissementId } }
      ],
      '0003': [
        { id: 'bamako-q-003-1', nom: 'Quartier Point G', code: '000301', parent: { id: arrondissementId } },
        { id: 'bamako-q-003-2', nom: 'Quartier Dravéla', code: '000302', parent: { id: arrondissementId } }
      ],
      '0004': [
        { id: 'bamako-q-004-1', nom: 'Quartier Lafiabougou', code: '000401', parent: { id: arrondissementId } },
        { id: 'bamako-q-004-2', nom: 'Quartier Taliko', code: '000402', parent: { id: arrondissementId } }
      ],
      '0005': [
        { id: 'bamako-q-005-1', nom: 'Quartier Badalabougou', code: '000501', parent: { id: arrondissementId } },
        { id: 'bamako-q-005-2', nom: 'Quartier Sema I', code: '000502', parent: { id: arrondissementId } }
      ],
      '0006': [
        { id: 'bamako-q-006-1', nom: 'Quartier Banankabougou', code: '000601', parent: { id: arrondissementId } },
        { id: 'bamako-q-006-2', nom: 'Quartier Faladié', code: '000602', parent: { id: arrondissementId } }
      ]
    };
    
    const code = arrondissementCode || '0001';
    return hardcodedQuartiers[code] || hardcodedQuartiers['0001'];
  };

  // Charger les régions au montage
  useEffect(() => {
    let mounted = true;
    divisionService.getRegions().then((res: any[]) => {
      if (mounted) setPersonalRegions(res || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Charger cercles quand personalSelectedRegionId change
  useEffect(() => {
    console.log('🔥 USEEFFECT CERCLES DECLENCHE!', {
      personalSelectedRegionId,
      personalSelectedRegionCode,
      isRestoringPersonalData,
      willExecute: !!(personalSelectedRegionId && !isRestoringPersonalData)
    });
    
    let mounted = true;
    if (personalSelectedRegionId && !isRestoringPersonalData) {
      // Vérifier si c'est Bamako District (structure différente)
      const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
      const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
      
      if (isBamakoDistrict) {
        // Pour Bamako District, utiliser la logique unifiée
        // Pour Bamako, adapter à la nouvelle structure INSTAT Mali
        console.log('🔍 [CERCLES] Chargement cercles Bamako, code:', personalSelectedRegionCode || selectedRegion?.code);
        divisionService.getCerclesByRegion(personalSelectedRegionCode || selectedRegion?.code).then((cercles: any[]) => {
          console.log('✅ [CERCLES] Cercles Bamako reçus:', cercles?.length || 0, cercles);
          if (mounted) {
            setPersonalCercles(cercles || []);
            console.log('✅ [CERCLES] Cercles Bamako stockés dans state');
            // Réinitialiser les listes suivantes seulement si pas de valeurs restaurées
            if (!personalSelectedCercleId && !personalSelectedCommuneId && !personalSelectedQuartierId) {
              setPersonalCommunes([]);
              setPersonalQuartiers([]);
              setPersonalSelectedCercleId('');
              setPersonalSelectedCommuneId('');
              setPersonalSelectedQuartierId('');
            } else {
              console.log('🔍 [PERSONAL SYNC] Préservation des valeurs restaurées lors du chargement des cercles');
            }
          }
        }).catch((error) => {
          console.error('❌ [CERCLES] Erreur chargement cercles Bamako:', error);
          if (mounted) {
            setPersonalCercles([]);
            setPersonalCommunes([]);
            setPersonalQuartiers([]);
          }
        });
      } else {
        // Structure INSTAT Mali : charger les cercles
        const regionCode = personalSelectedRegionCode || selectedRegion?.code;
        console.log('🔥 APPEL API CERCLES - Region:', selectedRegion?.nom, 'Code:', regionCode);
        divisionService.getCerclesByRegion(regionCode).then((res: any[]) => {
          console.log('🔥 API REPONSE - Cercles:', res?.length || 0, res);
          if (mounted) {
            setPersonalCercles(res || []);
            console.log('✅ [CERCLES] Cercles stockés dans state, total:', res?.length || 0);
            // Réinitialiser les listes suivantes seulement si pas de valeurs restaurées
            if (!personalSelectedCercleId && !personalSelectedCommuneId && !personalSelectedQuartierId) {
              setPersonalCommunes([]);
              setPersonalQuartiers([]);
              setPersonalSelectedCercleId('');
              setPersonalSelectedCommuneId('');
              setPersonalSelectedQuartierId('');
            } else {
              console.log(' [PERSONAL SYNC] Préservation des valeurs restaurées lors du chargement des cercles (INSTAT)');
            }
          }
        }).catch((error) => {
          console.error(' [CERCLES] Erreur chargement cercles région:', error);
        });
      }
    } else {
      // Réinitialiser toutes les listes (STRUCTURE INSTAT - 4 NIVEAUX) seulement si pas en cours de restauration
      if (!isRestoringPersonalData) {
        setPersonalCercles([]);
        setPersonalCommunes([]);
        setPersonalQuartiers([]);
        setPersonalSelectedCercleId('');
        setPersonalSelectedCommuneId('');
        setPersonalSelectedQuartierId('');
      }
    }
    return () => { mounted = false; };
  }, [personalSelectedRegionId, personalSelectedRegionCode, personalRegions, isRestoringPersonalData, personalSelectedCercleId, personalSelectedCommuneId, personalSelectedQuartierId]);

  // Charger communes quand personalSelectedCercleId change (NOUVELLE STRUCTURE INSTAT)
  useEffect(() => {
    let mounted = true;
    if (isRestoringPersonalData) {
      console.log('🔍 [PERSONAL SYNC] useEffect communes bloqué pendant restauration');
      return () => { mounted = false; };
    }
    
    const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
    const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');

    if (personalSelectedCercleId) {
      // NOUVELLE STRUCTURE INSTAT : Cercle → Commune directement (fonctionne pour Bamako aussi)
      console.log('🔍 [PERSONAL SYNC] Chargement des communes pour cercle:', personalSelectedCercleId);
      divisionService.getCommunesByCercle(personalSelectedCercleId).then((res: any[]) => {
        if (mounted) {
          console.log('🔍 [PERSONAL SYNC] Communes chargées:', res?.length || 0);
          setPersonalCommunes(res || []);
          // Réinitialiser seulement les quartiers si pas de valeurs restaurées
          if (!personalSelectedCommuneId && !personalSelectedQuartierId) {
            setPersonalQuartiers([]);
            setPersonalSelectedCommuneId('');
            setPersonalSelectedQuartierId('');
          } else {
            console.log('🔍 [PERSONAL SYNC] Préservation des valeurs restaurées lors du chargement des communes');
          }
        }
      }).catch(() => {
        console.log('🔍 [PERSONAL SYNC] Erreur lors du chargement des communes');
      });
    } else {
      setPersonalCommunes([]);
      setPersonalQuartiers([]);
      if (!personalSelectedCommuneId && !personalSelectedQuartierId) {
        setPersonalSelectedCommuneId('');
        setPersonalSelectedQuartierId('');
      }
    }
    return () => { mounted = false; };
  }, [personalSelectedCercleId, personalRegions, personalSelectedRegionId]);


  // Charger quartiers quand personalSelectedCommuneId change
  useEffect(() => {
    let mounted = true;
    if (personalSelectedCommuneId) {
      divisionService.getQuartiersByCommune(personalSelectedCommuneId).then((res: any[]) => {
        if (mounted) setPersonalQuartiers(res || []);
      }).catch(() => {});
    } else {
      setPersonalQuartiers([]);
      setPersonalSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [personalSelectedCommuneId]);

  // Fonction pour gérer la sélection depuis la recherche
  const handleDivisionSearch = async (division: any) => {
    try {
      // Activer le flag pour éviter le chargement en cascade
      setIsRestoringPersonalData(true);
      
      const hierarchy = await buildDivisionHierarchy(division);
      if (!hierarchy || Object.keys(hierarchy).length === 0) {
        setIsRestoringPersonalData(false);
        return;
      }
      
      await applyDivisionHierarchySequential(hierarchy);
      
      // Désactiver le flag après un court délai
      setTimeout(() => {
        setIsRestoringPersonalData(false);
      }, 500);
    } catch (error) {
      setIsRestoringPersonalData(false);
    }
  };

  // Construire la hiérarchie complète depuis une division
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
          hierarchy.commune = current;
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
    
    // Dans la nouvelle structure INSTAT Mali, Bamako utilise aussi la hiérarchie standard
    // Région → Cercle → Commune → Quartier
    
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
          // Recommencer avec les données complètes
          return await buildDivisionHierarchy(fullDivision);
        } else {
          // Si toujours pas de parent, essayer de reconstruire par code (spécialement pour Bamako)
          const reconstructedHierarchy = await reconstructHierarchyByCode(division);
          if (reconstructedHierarchy && Object.keys(reconstructedHierarchy).length > 1) {
            return reconstructedHierarchy;
          }
        }
      } catch (error) {
      }
    }
    
    return hierarchy;
  };

  // Reconstruire la hiérarchie par code (pour les cas où les relations parent sont manquantes)
  const reconstructHierarchyByCode = async (division: any): Promise<any> => {
    const hierarchy: any = {};
    
    // Ajouter la division actuelle
    hierarchy[division.divisionType.toLowerCase()] = division;
    
    if (!division.code) {
      return hierarchy;
    }
    
    try {
      // Récupérer toutes les régions
      const regions = await divisionService.getRegions();
      
      // Pour Bamako (codes 0001xxxx à 0007xxxx)
      if (division.code.match(/^000[1-7]/) || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix))) {
        
        const bamakoRegion = regions.find((r: any) => 
          r.nom?.toLowerCase().includes('bamako') && 
          r.nom?.toLowerCase().includes('district')
        );
        
        if (bamakoRegion) {
          hierarchy.region = bamakoRegion;
          
          if (division.divisionType === 'QUARTIER') {
            const arrondissementCode = division.code.substring(0, 4);
            
            // Utiliser la logique de fallback pour trouver les arrondissements
            let arrondissements: any[] = [];
            
            try {
              // Tentative endpoint direct
              arrondissements = await divisionService.getArrondissementsByRegion(bamakoRegion.id);
              
              if (!arrondissements?.length) {
                // Fallback: Utiliser la même logique que les sélecteurs manuels
                const [children, bamakoDivisions, allArrondissements] = await Promise.all([
                  divisionService.getChildrenByRegion(bamakoRegion.id),
                  divisionService.searchBamakoDivisions(),
                  divisionService.getAllArrondissements()
                ]);
                
                
                // Stratégie 1: Divisions Bamako filtrées
                const bamakoArrondissements = bamakoDivisions.filter((div: any) => 
                  div.divisionType === 'ARRONDISSEMENT' && 
                  (div.nom?.includes('Arrondissement') || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(div.code))
                );
                
                if (bamakoArrondissements.length) {
                  arrondissements = bamakoArrondissements;
                } else {
                  // Stratégie 2: Tous les arrondissements filtrés par nom
                  const arrondissementsParNom = allArrondissements.filter((arr: any) => 
                    arr.nom?.includes('Arrondissement') && 
                    ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième'].some(num => arr.nom?.includes(num))
                  );
                  
                  if (arrondissementsParNom.length) {
                    arrondissements = arrondissementsParNom;
                  }
                }
                
              }
            } catch (error) {
              arrondissements = [];
            }
            
            
            // Chercher l'arrondissement correspondant (essayer plusieurs méthodes)
            
            let arrondissement = arrondissements.find((a: any) => a.code === arrondissementCode);
            
            if (!arrondissement) {
              // Essayer avec startsWith
              arrondissement = arrondissements.find((a: any) => a.code?.startsWith(arrondissementCode));
            }
            
            if (!arrondissement) {
              // Essayer avec les 3 premiers caractères
              const shortCode = arrondissementCode.substring(0, 3);
              arrondissement = arrondissements.find((a: any) => a.code?.startsWith(shortCode));
            }
            
            if (!arrondissement) {
              // Mapping manuel basé sur les codes observés
              const codeMapping: Record<string, string[]> = {
                '0001': ['0001'],         // Premier Arrondissement
                '0002': ['0002'],         // Deuxième Arrondissement  
                '0003': ['0003', '0001'], // Troisième Arrondissement (ou Premier si confusion)
                '0004': ['0004'],         // Quatrième Arrondissement
                '0005': ['0005'],         // Cinquième Arrondissement
                '0006': ['0006'],         // Sixième Arrondissement
                '0007': ['0007']          // Septième Arrondissement
              };
              
              const possibleCodes = codeMapping[arrondissementCode] || [arrondissementCode];
              arrondissement = arrondissements.find((a: any) => possibleCodes.includes(a.code));
            }
            
            if (arrondissement) {
              hierarchy.arrondissement = arrondissement;
            } else {
            }
          }
        }
      } 
      // Pour les autres régions (essayer de deviner par code)
      else {
        
        // Essayer de trouver la région par recherche dans toutes les divisions
        for (const region of regions) {
          if (region.nom?.toLowerCase().includes('bamako')) continue; // Skip Bamako, déjà traité
          
          try {
            // Essayer de charger les cercles de cette région
            const cercles = await divisionService.getCerclesByRegion(region.id);
            
            for (const cercle of cercles) {
              // Essayer de charger les arrondissements de ce cercle
              const arrondissements = await divisionService.getArrondissementsByCercle(cercle.id);
              
              for (const arrondissement of arrondissements) {
                // Essayer de charger les communes de cet arrondissement
                const communes = await divisionService.getCommunesByArrondissement(arrondissement.id);
                
                for (const commune of communes) {
                  // Essayer de charger les quartiers de cette commune
                  const quartiers = await divisionService.getQuartiersByCommune(commune.id);
                  
                  // Vérifier si notre quartier est dans cette commune
                  const foundQuartier = quartiers.find((q: any) => q.id === division.id);
                  if (foundQuartier) {
                    hierarchy.region = region;
                    hierarchy.cercle = cercle;
                    hierarchy.arrondissement = arrondissement;
                    hierarchy.commune = commune;
                    return hierarchy;
                  }
                }
              }
            }
          } catch (error) {
            // Continuer avec la région suivante
            continue;
          }
        }
        
      }
    } catch (error) {
    }
    
    return hierarchy;
  };

  // Appliquer la hiérarchie aux sélecteurs de manière séquentielle (structure INSTAT unifiée)
  const applyDivisionHierarchySequential = async (hierarchy: any) => {
    try {
      // Charger toutes les données nécessaires en parallèle
      const promises: Promise<any>[] = [];
      
      // Charger cercles si on a une région
      if (hierarchy.region) {
        promises.push(
          divisionService.getCerclesByRegion(hierarchy.region.code)
            .then(cercles => setPersonalCercles(cercles || []))
            .catch(() => setPersonalCercles([]))
        );
      }
      
      // Charger communes si on a un cercle
      if (hierarchy.cercle) {
        promises.push(
          divisionService.getCommunesByCercle(hierarchy.cercle.code)
            .then(communes => setPersonalCommunes(communes || []))
            .catch(() => setPersonalCommunes([]))
        );
      }
      
      // Charger quartiers si on a une commune
      if (hierarchy.commune) {
        promises.push(
          divisionService.getQuartiersByCommune(hierarchy.commune.code)
            .then(quartiers => setPersonalQuartiers(quartiers || []))
            .catch(() => setPersonalQuartiers([]))
        );
      }
      
      // Attendre que toutes les données soient chargées
      await Promise.all(promises);
      
      // Maintenant définir les valeurs sélectionnées
      if (hierarchy.region) {
        setPersonalSelectedRegionId(hierarchy.region.id);
        setPersonalSelectedRegionCode(hierarchy.region.code);
      }
      
      if (hierarchy.cercle) {
        setPersonalSelectedCercleId(hierarchy.cercle.id);
        setPersonalSelectedCercleCode(hierarchy.cercle.code);
      }
      
      if (hierarchy.commune) {
        setPersonalSelectedCommuneId(hierarchy.commune.id);
        setPersonalSelectedCommuneCode(hierarchy.commune.code);
      }
      
      if (hierarchy.quartier) {
        setPersonalSelectedQuartierId(hierarchy.quartier.id);
        setPersonalSelectedQuartierCode(hierarchy.quartier.code);
      }
      
      // Mettre à jour divisionId dans personalInfo
      let finalDivisionId = '';
      if (hierarchy.quartier) {
        finalDivisionId = hierarchy.quartier.id;
      } else if (hierarchy.commune) {
        finalDivisionId = hierarchy.commune.id;
      } else if (hierarchy.cercle) {
        finalDivisionId = hierarchy.cercle.id;
      } else if (hierarchy.region) {
        finalDivisionId = hierarchy.region.id;
      }
      
      if (finalDivisionId) {
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: finalDivisionId
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'application de la hiérarchie:', error);
    }
  };

  // Appliquer la hiérarchie aux sélecteurs (ancienne méthode - gardée pour référence)
  const applyDivisionHierarchy = async (hierarchy: any) => {
    
    // Structure INSTAT Mali unifiée pour toutes les régions
    
    try {
      // Région
      if (hierarchy.region) {
        setPersonalSelectedRegionId(hierarchy.region.id);
        setPersonalSelectedRegionCode(hierarchy.region.code);
        
        // Charger les cercles (structure INSTAT unifiée)
        const cercles = await divisionService.getCerclesByRegion(hierarchy.region.code);
        setPersonalCercles(cercles || []);
        
        // Attendre que les cercles soient bien mis à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Cercle (structure INSTAT unifiée)
      if (hierarchy.cercle) {
        setPersonalSelectedCercleId(hierarchy.cercle.id);
        setPersonalSelectedCercleCode(hierarchy.cercle.code);
        
        // Charger les arrondissements
        const communes = await divisionService.getCommunesByCercle(hierarchy.cercle.id);
        setPersonalCommunes(communes || []);
        
        // Attendre un peu que les communes soient bien mises à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Arrondissement - ATTENDRE que les arrondissements soient chargés d'abord
      if (hierarchy.arrondissement) {
        setPersonalSelectedCommuneId(hierarchy.arrondissement.id);
        setPersonalSelectedCommuneCode(hierarchy.arrondissement.code);
        
        // Charger les quartiers (structure INSTAT unifiée)
        const quartiers = await divisionService.getQuartiersByCommune(hierarchy.arrondissement.id);
        setPersonalQuartiers(quartiers || []);
        
        // Attendre un peu que les données soient bien mises à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Commune (structure INSTAT unifiée)
      if (hierarchy.commune) {
        setPersonalSelectedCommuneId(hierarchy.commune.id);
        setPersonalSelectedCommuneCode(hierarchy.commune.code);
        
        // Charger les quartiers
        const quartiers = await divisionService.getQuartiersByCommune(hierarchy.commune.id);
        setPersonalQuartiers(quartiers || []);
        
        // Attendre un peu que les quartiers soient bien mis à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Quartier
      if (hierarchy.quartier) {
        setPersonalSelectedQuartierId(hierarchy.quartier.id);
        setPersonalSelectedQuartierCode(hierarchy.quartier.code);
        
        // Mettre à jour les données du formulaire (sans modifier la localité)
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: hierarchy.quartier.id
          // localite reste inchangée - l'utilisateur peut la saisir librement
        });
      } else if (hierarchy.commune) {
        // Si pas de quartier, utiliser la commune (structure INSTAT unifiée)
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: hierarchy.commune.id
          // localite reste inchangée - l'utilisateur peut la saisir librement
        });
      } else if (hierarchy.arrondissement) {
        // Si pas de commune, utiliser l'arrondissement (cas Bamako)
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: hierarchy.arrondissement.id
          // localite reste inchangée - l'utilisateur peut la saisir librement
        });
      }
      
      
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      {/* Recherche rapide */}
      <div className="bg-primary-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-black-800 mb-3 flex items-center">
           Recherche rapide de localisation
        </h3>
        <p className="text-sm text-black-600 mb-4">
          Tapez le nom d'une localisation pour remplir automatiquement la hiérarchie administrative
        </p>
        <DivisionSearchInput
          placeholder="Rechercher une région, cercle, commune ou quartier..."
          onSelect={handleDivisionSearch}
          disabled={isReadOnly}
          className="w-full"
        />
      </div>

      {/* Sélecteurs hiérarchiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Région */}
        <div>
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">Région *</label>
        <select
          value={personalSelectedRegionId}
          onChange={isReadOnly ? undefined : (e) => {
            // Désactiver le flag de restauration lors d'interaction manuelle
            setIsRestoringPersonalData(false);
            
            const regionId = e.target.value;
            const region = personalRegions.find(r => r.id === regionId);
            const regionCode = region?.code || '';
            
            setPersonalSelectedRegionId(regionId);
            setPersonalSelectedRegionCode(regionCode);
            
            // Reset des niveaux inférieurs (STRUCTURE INSTAT - 4 NIVEAUX)
            setPersonalSelectedCercleId(''); setPersonalSelectedCercleCode('');
            setPersonalSelectedCommuneId(''); setPersonalSelectedCommuneCode('');
            setPersonalSelectedQuartierId(''); setPersonalSelectedQuartierCode('');
            
            // Sauvegarder les IDs de sélection dans businessData pour localStorage
            updateData('personalInfo', { 
              ...data.personalInfo, 
              divisionId: '',
              selectedRegionId: regionId,
              selectedCercleId: '',
              selectedCommuneId: '',
              selectedQuartierId: ''
            });
            
            // CHARGER LES CERCLES IMMEDIATEMENT
            if (regionCode) {
              divisionService.getCerclesByRegion(regionCode).then((cercles) => {
                setPersonalCercles(cercles || []);
              }).catch((error) => {
                console.error('Erreur chargement cercles:', error);
                setPersonalCercles([]);
              });
            } else {
              setPersonalCercles([]);
            }
          }}
          disabled={isReadOnly}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
            isReadOnly 
              ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
              : 'border-gray-300 focus:ring-investmali-accent'
          }`}
        >
          <option value="">Sélectionnez une région</option>
          {personalRegions.map((r: any) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </select>
      </div>

      {/* Cercle - Masqué pour Bamako District */}
      {(() => {
        const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
        const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
        
        if (isBamakoDistrict) {
          return null; // Pas de cercle pour Bamako District
        }
        
        return (
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">Cercle *</label>
            <select
              value={personalSelectedCercleId}
              onChange={isReadOnly ? undefined : (e) => {
                // Désactiver le flag de restauration lors d'interaction manuelle
                setIsRestoringPersonalData(false);
                
                const cercleId = e.target.value;
                const cercle = personalCercles.find(c => c.id === cercleId);
                const cercleCode = cercle?.code || '';
                
                setPersonalSelectedCercleId(cercleId);
                setPersonalSelectedCercleCode(cercleCode);
                
                // Reset des niveaux inférieurs (STRUCTURE INSTAT - 4 NIVEAUX)
                setPersonalSelectedCommuneId(''); setPersonalSelectedCommuneCode('');
                setPersonalSelectedQuartierId(''); setPersonalSelectedQuartierCode('');
                
                // Sauvegarder les IDs de sélection dans businessData pour localStorage
                updateData('personalInfo', { 
                  ...data.personalInfo, 
                  divisionId: '',
                  selectedCercleId: cercleId,
                  selectedCommuneId: '',
                  selectedQuartierId: ''
                });
                
                // CHARGER LES COMMUNES IMMEDIATEMENT
                if (cercleCode) {
                  divisionService.getCommunesByCercle(cercleCode).then((communes) => {
                    setPersonalCommunes(communes || []);
                  }).catch((error) => {
                    console.error('Erreur chargement communes:', error);
                    setPersonalCommunes([]);
                  });
                } else {
                  setPersonalCommunes([]);
                }
              }}
              disabled={isReadOnly || !personalSelectedRegionId}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
                isReadOnly || !personalSelectedRegionId
                  ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                  : 'border-gray-300 focus:ring-investmali-accent'
              }`}
            >
              <option value="">Sélectionnez un cercle</option>
              {personalCercles.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        );
      })()}


      {/* Commune - Masqué pour Bamako District */}
      {(() => {
        const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
        const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
        
        if (isBamakoDistrict) {
          return null; // Pas de commune pour Bamako District
        }
        
        return (
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">Commune *</label>
            <select
              value={personalSelectedCommuneId}
              onChange={isReadOnly ? undefined : (e) => {
                // Désactiver le flag de restauration lors d'interaction manuelle
                setIsRestoringPersonalData(false);
                
                const communeId = e.target.value;
                const commune = personalCommunes.find(c => c.id === communeId);
                const communeCode = commune?.code || '';
                
                setPersonalSelectedCommuneId(communeId);
                setPersonalSelectedCommuneCode(communeCode);
                
                // Reset des niveaux inférieurs
                setPersonalSelectedQuartierId(''); setPersonalSelectedQuartierCode('');
                
                // Sauvegarder les IDs de sélection dans businessData pour localStorage
                updateData('personalInfo', { 
                  ...data.personalInfo, 
                  divisionId: '',
                  selectedCommuneId: communeId,
                  selectedQuartierId: ''
                });
                
                // CHARGER LES QUARTIERS IMMEDIATEMENT
                if (communeCode) {
                  divisionService.getQuartiersByCommune(communeCode).then((quartiers) => {
                    setPersonalQuartiers(quartiers || []);
                  }).catch((error) => {
                    console.error('Erreur chargement quartiers:', error);
                    setPersonalQuartiers([]);
                  });
                } else {
                  setPersonalQuartiers([]);
                }
              }}
              disabled={isReadOnly || !personalSelectedCercleId}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
                isReadOnly || !personalSelectedCercleId
                  ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                  : 'border-gray-300 focus:ring-investmali-accent'
              }`}
            >
              <option value="">Sélectionnez une commune</option>
              {personalCommunes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        );
      })()}

      {/* Quartier */}
      <div>
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">Quartier *</label>
        <select
          value={personalSelectedQuartierId}
          onChange={isReadOnly ? undefined : (e) => {
            const quartierId = e.target.value;
            const quartier = personalQuartiers.find(q => q.id === quartierId);
            const quartierCode = quartier?.code || '';
            const quartierNom = quartier?.nom || '';
            
            setPersonalSelectedQuartierId(quartierId);
            setPersonalSelectedQuartierCode(quartierCode);
            
            // Sauvegarder les IDs de sélection et le nom du quartier dans businessData pour localStorage
            const divisionId = quartierId || '';
            updateData('personalInfo', { 
              ...data.personalInfo, 
              divisionId,
              selectedQuartierId: quartierId,
              selectedLocationName: quartierNom // Stocker le nom pour la récap
            });
          }}
          disabled={(() => {
            if (isReadOnly) return true;
            const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
            const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
            return isBamakoDistrict ? !personalSelectedCercleId : !personalSelectedCommuneId;
          })()}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
            (() => {
              if (isReadOnly) return true;
              const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
              const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
              return isBamakoDistrict ? !personalSelectedCercleId : !personalSelectedCommuneId;
            })()
              ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
              : 'border-gray-300 focus:ring-investmali-accent'
          }`}
        >
          <option value="">Sélectionnez un quartier</option>
          {personalQuartiers.map((q: any) => (
            <option key={q.id} value={q.id}>{q.nom}</option>
          ))}
        </select>
      </div>

       
      </div>
    </div>
  );
};

// Étape 0 : Identification de l'utilisateur
const UserIdentificationStep: React.FC<{isForSelf: boolean | null, setIsForSelf: (value: boolean | null) => void, handleResponse: (value: boolean) => void}> = ({ isForSelf, setIsForSelf, handleResponse }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Identification</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
        Commençons par identifier pour qui vous créez cette entreprise.
      </p>

      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark mb-3 sm:mb-4">
            Créez-vous cette entreprise pour vous-même ?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Si vous créez cette entreprise pour vous-même, nous allons pré-remplir le formulaire avec vos informations personnelles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 bg-investmali-accent hover:bg-investmali-accent/90 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Oui, c'est pour moi
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Non, c'est pour quelqu'un d'autre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Étape 1 : Informations personnelles
const PersonalInfoStep: React.FC<{data: BusinessCreationData, updateData: (field: keyof BusinessCreationData, value: any) => void, isForSelf: boolean | null, setIsForSelf: (value: boolean | null) => void, showForm: boolean, setShowForm: (value: boolean) => void}> = ({ data, updateData, isForSelf, setIsForSelf, showForm, setShowForm }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // États pour le sélecteur de pays téléphone
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Mali par défaut
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

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

  // Synchronisation automatique de TOUTES les données de localisation entre personne et entreprise
  useEffect(() => {
    if (data.personalInfo?.hasDifferentAddress === false) {
      // Si l'adresse est la même, synchroniser automatiquement TOUTES les données de localisation
      updateData('companyInfo', {
        ...data.companyInfo,
        rue: data.personalInfo?.localite || '',
        porte: data.personalInfo?.porte || '',
        divisionCode: data.personalInfo?.divisionId || '',
        regionId: data.personalInfo?.divisionId || '',
        cercleId: '',
        arrondissementId: '',
        communeId: '',
        quartierId: ''
      });
    }
  }, [data.personalInfo?.hasDifferentAddress, data.personalInfo?.localite, data.personalInfo?.porte, data.personalInfo?.divisionId]);

  // Synchronisation automatique de la forme juridique pour les entreprises individuelles
  useEffect(() => {
    if (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
      updateData('companyInfo', {
        ...data.companyInfo,
        formeJuridique: 'E_I'
      });
    }
  }, [data.companyInfo?.typeEntreprise]);

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
  
  // États pour tracker si les valeurs ont été récupérées du profil
  const [hasProfileBirthDate, setHasProfileBirthDate] = useState(false);
  const [hasProfileBirthPlace, setHasProfileBirthPlace] = useState(false);

  // Fonction pour détecter le pays à partir du numéro de téléphone
  const detectCountryFromPhone = (phoneNumber: string) => {
    if (!phoneNumber) return countries[0]; // Mali par défaut
    
    // Nettoyer le numéro (enlever espaces, tirets, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Chercher le pays correspondant à l'indicatif
    for (const country of countries) {
      if (cleanPhone.startsWith(country.code)) {
        return country;
      }
    }
    
    return countries[0]; // Mali par défaut si aucun pays trouvé
  };

  // Fonction pour extraire le numéro local (sans indicatif)
  const extractLocalNumber = (phoneNumber: string, countryCode: string) => {
    if (!phoneNumber) return '';
    
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (cleanPhone.startsWith(countryCode)) {
      const localNumber = cleanPhone.substring(countryCode.length);
      // Formater le numéro local selon le pays
      if (countryCode === '+223' && localNumber.length === 8) {
        // Format malien: XX XX XX XX
        return `${localNumber.substring(0, 2)} ${localNumber.substring(2, 4)} ${localNumber.substring(4, 6)} ${localNumber.substring(6, 8)}`;
      } else if (countryCode === '+33' && localNumber.length === 9) {
        // Format français: XX XX XX XX XX
        return `${localNumber.substring(0, 2)} ${localNumber.substring(2, 4)} ${localNumber.substring(4, 6)} ${localNumber.substring(6, 8)} ${localNumber.substring(8, 9)}`;
      } else if (countryCode === '+1' && localNumber.length === 10) {
        // Format américain: XXX XXX XXXX
        return `${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6, 10)}`;
      }
      // Format générique pour autres pays
      return localNumber;
    }
    
    return phoneNumber;
  };

  // Fonction pour nettoyer et formater la saisie téléphone selon le pays sélectionné
  const handlePhoneChange = (value: string, setter: (phone: string) => void) => {
    // Supprimer tous les caractères non numériques
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
      // États-Unis/Canada: 10 chiffres, format XXX XXX XXXX
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

  // Fermer le dropdown des pays quand on clique à l'extérieur
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

  // Récupérer l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Réinitialiser la variable globale
      (window as any).userHasInitialLocationData = false;
      
      // Récupérer l'utilisateur depuis le localStorage
      const currentUser = authAPI.getCurrentUser();
      
      if (currentUser && (currentUser.personne_id || currentUser.personneId)) {
        const personneId = currentUser.personne_id || currentUser.personneId;
        
        // Utiliser l'endpoint /api/v1/persons/personne_id pour récupérer les informations
        const personResponse = await authAPI.getPersonById(personneId);
        
        if (personResponse && personResponse.success) {
          const personData = personResponse.data;
          
          // Vérifier si nous avons des valeurs valides du profil
          const profileBirthDate = personData.dateNaissance ? 
                      (personData.dateNaissance.includes('T') ? 
                       personData.dateNaissance.split('T')[0] : 
                       personData.dateNaissance) : '';
          const profileBirthPlace = personData.lieuNaissance || '';
          
          // Marquer si nous avons récupéré des valeurs valides du profil
          setHasProfileBirthDate(!!(profileBirthDate && profileBirthDate.trim() !== ''));
          setHasProfileBirthPlace(!!(profileBirthPlace && profileBirthPlace.trim() !== ''));
          
          // Traiter le numéro de téléphone pour détecter le pays et extraire le numéro local
          const fullPhoneNumber = personData.telephone1 || personData.telephone || '';
          const detectedCountry = detectCountryFromPhone(fullPhoneNumber);
          const localPhoneNumber = extractLocalNumber(fullPhoneNumber, detectedCountry.code);
          
          // Traiter le numéro de téléphone 2
          const fullPhoneNumber2 = personData.telephone2 || '';
          const localPhoneNumber2 = fullPhoneNumber2 ? extractLocalNumber(fullPhoneNumber2, detectedCountry.code) : '';
          
          // Mettre à jour le pays sélectionné
          setSelectedCountry(detectedCountry);
          
          // Mettre à jour les données du formulaire avec les informations de la table persons
          // IMPORTANT: Préserver toutes les données existantes, ne modifier que personalInfo
          // Nettoyer l'email pour éviter d'utiliser un numéro de téléphone
          const cleanedEmail = cleanAndValidateEmail(personData.email) || cleanAndValidateEmail(currentUser.email) || '';
          
          updateData('personalInfo', {
            ...data.personalInfo,
            firstName: personData.prenom || '',
            lastName: personData.nom || '',
            email: cleanedEmail,
            phone: localPhoneNumber, // Utiliser le numéro local sans indicatif
            phone2: localPhoneNumber2, // Ajouter le téléphone 2
            civility: personData.civilite || 
                     (personData.sexe === 'MASCULIN' ? 'M.' : 
                      personData.sexe === 'FEMININ' ? 'Mme' : 
                      currentUser.civilite || ''),
            // Récupérer la date de naissance et le lieu de naissance
            birthDate: profileBirthDate,
            birthPlace: profileBirthPlace,
            // Récupérer le sexe
            sexe: personData.sexe || '',
            // Récupérer la situation matrimoniale
            situationMatrimoniale: personData.situationMatrimoniale || '',
            // Préserver isForSelf = true car c'est pour l'utilisateur connecté
            isForSelf: true,
            // Ajouter d'autres champs si disponibles
            ...(personData.nationnalite && { 
              nationality: typeof personData.nationnalite === 'string' 
                ? personData.nationnalite 
                : personData.nationnalite.name || personData.nationnalite 
            }),
            ...(personData.numeroPiece && { idNumber: personData.numeroPiece }),
            // Corriger le mapping des données de localisation - toujours inclure même si vide
            localite: personData.localite || '',
            porte: personData.porte || '',
            divisionId: personData.division_id || '',
            
            // Si le champ porte n'existe pas encore et que localite contient des données,
            // essayer de parser pour extraire rue et porte (format: "Rue 427 Porte 231")
            ...((() => {
              if (!personData.porte && personData.localite) {
                const localiteStr = personData.localite.toString();
                // Tenter de détecter un pattern "Rue X Porte Y" ou "Rue X"
                const ruePorteMatch = localiteStr.match(/^(.+?)\s+Porte\s+(.+)$/i);
                if (ruePorteMatch) {
                  return {
                    localite: ruePorteMatch[1].trim(),
                    porte: ruePorteMatch[2].trim()
                  };
                }
                // Si pas de pattern détecté, garder tout dans localite
                return { localite: localiteStr };
              }
              return {};
            })()),
            // Définir une variable globale pour indiquer si l'utilisateur a des données de localisation initiales
            ...((() => {
              // Considérer que les données sont complètes seulement si division_id est présent
              // (localite seul n'est pas suffisant car il peut être un nom générique)
              const hasLocationData = (personData.division_id && personData.division_id.trim() !== '');
              (window as any).userHasInitialLocationData = hasLocationData;
              return {};
            })()),
            // Garder city pour compatibilité - toujours inclure même si vide
            city: personData.localite || ''
          });
          
          // Si l'utilisateur a un divisionId, récupérer la hiérarchie administrative
          if (personData.division_id && personData.division_id.trim() !== '') {
            // TODO: Implémenter la récupération de la hiérarchie depuis divisionId
          }
          return personData;
        } else {
          throw new Error(personResponse.message || 'Données utilisateur non trouvées dans la base');
        }
      } else {
        throw new Error(`Utilisateur non connecté ou personne_id manquant. Utilisateur: ${JSON.stringify(currentUser)}`);
      }
    } catch (err: any) {
      setError(`Impossible de charger vos informations: ${err.message || err}. Veuillez les saisir manuellement.`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  // Créer ou mettre à jour les informations personnelles selon le choix utilisateur
  const savePersonalInfo = async (personalData: PersonalInfo) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!token) throw new Error('Aucun token trouvé');

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(personalData.civility);
      const finalSexe = personalData.sexe || deducedSexe;
      
      // Préparer les données selon PersonCreateRequest
      const personRequest = {
        nom: personalData.lastName,
        prenom: personalData.firstName,
        telephone1: personalData.phone,
        telephone2: personalData.phone2,
        email: cleanAndValidateEmail(personalData.email),
        dateNaissance: personalData.birthDate,
        lieuNaissance: personalData.birthPlace,
        nationnalite: personalData.nationality,
        sexe: finalSexe,
        situationMatrimoniale: personalData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(personalData.civility),
        division_id: personalData.divisionId || undefined,
        localite: personalData.localite || undefined,
        porte: personalData.porte || undefined,
        adresseLibre: personalData.adresseLibre || undefined,
        role: 'USER',
        entrepriseRole: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };

      // 🔍 DEBUG: Logs pour tracer le problème de persistance du champ 'porte'
      console.log('🔍 [DEBUG] Données personnelles reçues:', personalData);
      console.log('🔍 [DEBUG] Champ localite:', personalData.localite);
      console.log('🔍 [DEBUG] Champ porte:', personalData.porte);
      console.log('🔍 [DEBUG] Requête envoyée au backend:', personRequest);

      let response;
      
      if (isForSelf && currentUser.personne_id) {
        // PUT - Mise à jour de la personne existante
        response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      } else {
        // POST - Création d'une nouvelle personne
        response = await fetch('/api/v1/persons', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err: any) {
      setError(`Impossible de sauvegarder les informations personnelles: ${err.message || err}`);
      return null;
    }
  };

  // Créer un associé avec EntrepriseRole.ASSOCIE
  const createAssociate = async (associateData: PersonalInfo) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Préparer les données selon PersonCreateRequest
      const personRequest = {
        nom: associateData.lastName,
        prenom: associateData.firstName,
        telephone1: associateData.phone,
        telephone2: associateData.phone2,
        email: cleanAndValidateEmail(associateData.email),
        dateNaissance: associateData.birthDate,
        lieuNaissance: associateData.birthPlace,
        nationnalite: associateData.nationality,
        sexe: associateData.sexe,
        situationMatrimoniale: associateData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(associateData.civility),
        division_id: associateData.divisionId, // Ajouter le division_id
        localite: associateData.localite, // Ajouter la localité
        porte: associateData.porte, // Ajouter le numéro de porte
        role: 'USER',
        entrepriseRole: 'ASSOCIE' // Rôle spécifique pour les associés
      };

      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'associé');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err: any) {
      setError(`Impossible de créer l'associé: ${err.message || err}`);
      return null;
    }
  };

  // Créer un gérant avec EntrepriseRole.GERANT
  const createManager = async (managerData: PersonalInfo) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Formater le numéro de téléphone au format E.164 pour le gérant
      let formattedManagerPhone = '';
      if (managerData.phone) {
        const cleanPhone = managerData.phone.replace(/[\s\-\.]/g, '');
        if (cleanPhone.startsWith('+')) {
          formattedManagerPhone = cleanPhone; // Déjà au format E.164
        } else {
          formattedManagerPhone = `+223${cleanPhone}`; // Ajouter l'indicatif Mali
        }
      }

      // Préparer les données selon PersonCreateRequest pour un gérant
      const personRequest = {
        nom: managerData.lastName,
        prenom: managerData.firstName,
        telephone1: formattedManagerPhone,
        telephone2: managerData.phone2,
        email: cleanAndValidateEmail(managerData.email),
        dateNaissance: managerData.birthDate,
        lieuNaissance: managerData.birthPlace,
        nationnalite: managerData.nationality,
        sexe: managerData.sexe,
        situationMatrimoniale: managerData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(managerData.civility),
        division_id: managerData.divisionId, // Ajouter le division_id
        localite: managerData.localite, // Ajouter la localité
        porte: managerData.porte, // Ajouter le numéro de porte
        role: 'USER',
        entrepriseRole: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT' // Rôle spécifique pour le gérant
      };

      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du gérant');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err: any) {
      setError(`Impossible de créer le gérant: ${err.message || err}`);
      return null;
    }
  };

  const handleNext = async () => {
    if (data.personalInfo) {
      try {
        setIsLoading(true);
        setError('');
        
        // WORKFLOW ÉTAPE 1: Sauvegarder informations personnelles (PUT/POST selon choix)
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        if (!token) throw new Error('Aucun token trouvé');

        // Reconstruire le numéro complet avec l'indicatif pour la sauvegarde (format E.164)
        let fullPhoneForSave = '';
        if (data.personalInfo.phone) {
          const cleanPhone = data.personalInfo.phone.replace(/[\s\-\.]/g, '');
          if (cleanPhone.startsWith('+')) {
            fullPhoneForSave = cleanPhone; // Déjà au format E.164
          } else {
            fullPhoneForSave = `${selectedCountry.code}${cleanPhone}`;
          }
        }

        // Préparer les données selon PersonCreateRequest
        // DEBUG: Afficher la valeur brute de l'email avant nettoyage
        console.log('🔍 [HANDLE NEXT] Valeur brute data.personalInfo.email:', data.personalInfo.email);
        const cleanedEmailForNext = cleanAndValidateEmail(data.personalInfo.email);
        console.log('🔍 [HANDLE NEXT] Valeur après cleanAndValidateEmail:', cleanedEmailForNext);
        
        const personRequest = {
          nom: data.personalInfo.lastName,
          prenom: data.personalInfo.firstName,
          telephone1: fullPhoneForSave, // Sauvegarder le numéro complet avec indicatif
          telephone2: data.personalInfo.phone2 ? (data.personalInfo.phone2.startsWith('+') ? data.personalInfo.phone2 : '+223' + data.personalInfo.phone2.replace(/\s/g, '')) : '',
          email: cleanedEmailForNext,
          dateNaissance: data.personalInfo.birthDate,
          lieuNaissance: data.personalInfo.birthPlace,
          nationnalite: data.personalInfo.nationality,
          sexe: data.personalInfo.sexe,
          situationMatrimoniale: data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE',
          civilite: mapCivilityToBackend(data.personalInfo.civility),
          role: 'USER',
          entrepriseRole: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
        };


        let response;
        
        if (data.personalInfo.isForSelf && currentUser.personne_id) {
          // PUT - Mise à jour de la personne existante
          response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(personRequest)
          });
        } else {
          // POST - Création d'une nouvelle personne
          response = await fetch('/api/v1/persons', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(personRequest)
          });
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
        }
        
        const result = await response.json();
        
        // Stocker founderId pour les étapes suivantes
        updateData('founderId', result.id || result.data?.id);
        
      } catch (err: any) {
        setError(`Impossible de sauvegarder les informations personnelles: ${err.message || err}`);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    // onNext(); // Removed as this function is not needed in PersonalInfoStep
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2">Informations Personnelles</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
        Commençons par quelques informations sur vous avant de créer votre entreprise individuelle.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-investmali-accent"></div>
          <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-600">Chargement de vos informations...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : showForm ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark mb-3 sm:mb-4">
              {isForSelf ? 'Vos informations personnelles' : 'Informations du représentant'}
            </h3>
            
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4 md:gap-6">
             <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Nom *</label>
                <input
                  type="text"
                  value={data.personalInfo?.lastName || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    lastName: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent text-sm sm:text-base"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Prénom *</label>
                <input
                  type="text"
                  value={data.personalInfo?.firstName || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    firstName: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent text-sm sm:text-base"
                  placeholder=""
                />
              </div>    

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center">
                  Civilité *
                  {/* {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )} */}
                </label>
                <select
                  value={data.personalInfo?.civility || ''}
                  onChange={isForSelf ? undefined : (e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    civility: e.target.value
                  })}
                  disabled={!!isForSelf}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                    isForSelf 
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-investmali-accent'
                  }`}
                >
                  <option value="">Sélectionnez...</option>
                  {Object.entries(CIVILITE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              
             
              
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center">
                  Date de naissance *
                  {/* {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )} */}
                </label>
                <input
                  type="date"
                  value={data.personalInfo?.birthDate || ''}
                  max={(() => {
                    const today = new Date();
                    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  onChange={(e) => {
                    updateData('personalInfo', {
                      ...data.personalInfo,
                      birthDate: e.target.value
                    });
                  }}
                  disabled={!!isForSelf && hasProfileBirthDate}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                    isForSelf && hasProfileBirthDate
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-investmali-accent'
                  }`}
                  required
                />
                {/* <p className="text-xs text-gray-500 mt-1">L'utilisateur doit avoir au moins 18 ans</p> */}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center">
                  Lieu de naissance *
                  {/* {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )} */}
                </label>
                <input
                  type="text"
                  value={data.personalInfo?.birthPlace || ''}
                  onChange={(e) => {
                    updateData('personalInfo', {
                      ...data.personalInfo,
                      birthPlace: e.target.value
                    });
                  }}
                  disabled={!!isForSelf && hasProfileBirthPlace}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                    isForSelf && hasProfileBirthPlace
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-investmali-accent'
                  }`}
                  placeholder=""
                  required
                />
              </div>
               <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Email (optionnel)</label>
                <input
                  type="email"
                  value={data.personalInfo?.email || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    email: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent text-sm sm:text-base"
                  placeholder=""
                />
              </div>
              
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Téléphone *</label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative country-dropdown">
                      <button 
                        type="button" 
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-2 py-2 sm:px-3 sm:py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300"
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
                      value={data.personalInfo?.phone || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => updateData('personalInfo', {
                        ...data.personalInfo,
                        phone: phone
                      }))}
                      className="flex-1 px-2 py-2 sm:px-3 sm:py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50 text-sm sm:text-base"
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
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Téléphone 2 (optionnel)</label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative country-dropdown">
                      <button 
                        type="button" 
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-2 py-2 sm:px-3 sm:py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300"
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
                      value={data.personalInfo?.phone2 || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => updateData('personalInfo', {
                        ...data.personalInfo,
                        phone2: phone
                      }))}
                      className="flex-1 px-2 py-2 sm:px-3 sm:py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50 text-sm sm:text-base"
                      placeholder={phonePlaceholder}
                      maxLength={phoneMaxLength}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Numéro de téléphone secondaire (optionnel)
                  </p>
                </div>
              </div>

              {/* Rue et Porte dans un seul div */}
              <div className="grid grid-cols-4 sm:grid-cols-2 gap-4">
                {/* Rue */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Rue </label>
                  <input
                    type="text"
                    value={data.personalInfo?.localite || ''}
                    onChange={(e) => updateData('personalInfo', {
                      ...data.personalInfo,
                      localite: e.target.value
                    })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent text-sm sm:text-base"
                    placeholder=""
                  />
                </div>

                {/* Porte */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Porte </label>
                  <input
                    type="text"
                    value={data.personalInfo?.porte || ''}
                    onChange={(e) => updateData('personalInfo', {
                      ...data.personalInfo,
                      porte: e.target.value
                    })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent text-sm sm:text-base"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Adresse libre */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-1.5">Adresse complète (optionnel)</label>
                <textarea
                  value={data.personalInfo?.adresseLibre || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    adresseLibre: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent text-sm sm:text-base"
                  placeholder="Saisissez votre adresse complète (ex: Quartier Lafiabougou, Rue 427, Porte 231, près de la pharmacie)"
                  rows={3}
                />
              </div>

              {/* Message informatif pour les champs récupérés automatiquement */}
              {isForSelf && (
                <div className="sm:col-span-2">
                  {/* <div className="mb-3 sm:mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {(hasProfileBirthDate && hasProfileBirthPlace) ? 
                        "Vos informations de naissance ont été récupérées depuis votre profil." :
                        (hasProfileBirthDate || hasProfileBirthPlace) ?
                        "Certaines informations ont été récupérées. Veuillez compléter les informations manquantes." :
                        "Vos informations personnelles ont été pré-remplies. Veuillez saisir votre date et lieu de naissance."
                      }
                    </p>
                  </div> */}
                </div>
              )}

              {/* Localisation personnelle avec sélection hiérarchique */}
              <div className="sm:col-span-2">
                <h4 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
                  {/* <span className="text-lg sm:text-xl mr-1.5 sm:mr-2">📍</span> */}
                  Votre localisation
                  {/* {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )} */}
                </h4>
                {/* {isForSelf && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {data.personalInfo?.localite || data.personalInfo?.divisionId ? 
                        "Ces informations ont été récupérées depuis votre profil et ne peuvent pas être modifiées ici." :
                        "Vos informations personnelles ont été pré-remplies. Veuillez compléter les informations de localisation manquantes."
                      }
                    </p>
                  </div>
                )} */}
                <PersonalLocationStep 
                  data={data}
                  updateData={updateData}
                  isReadOnly={(() => {
                    // Si ce n'est pas pour soi, toujours modifiable
                    if (!isForSelf) return false;
                    
                    // Utiliser une variable globale pour stocker les données initiales
                    const hasInitialLocationData = (window as any).userHasInitialLocationData || false;
                    return hasInitialLocationData;
                  })()}
                />
              </div>

              {/* Nouvelles questions */}
              <div className="sm:col-span-2 space-y-4 sm:space-y-6 pt-3 sm:pt-4 border-t border-gray-200">
                <div>
                  <p className="block text-lg sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Votre adresse est-elle différente de celle de votre entreprise ?</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        updateData('personalInfo', {
                          ...data.personalInfo,
                          hasDifferentAddress: true
                        });
                        // Vider les champs rue et porte de l'entreprise car l'adresse est différente
                        updateData('companyInfo', {
                          ...data.companyInfo,
                          rue: '',
                          porte: ''
                        });
                      }}
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg border text-sm sm:text-base ${data.personalInfo?.hasDifferentAddress === true 
                        ? 'bg-investmali-accent text-white border-investmali-accent' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateData('personalInfo', {
                          ...data.personalInfo,
                          hasDifferentAddress: false
                        });
                        // Synchroniser TOUTES les données de localisation de l'entreprise avec celles de la personne
                        updateData('companyInfo', {
                          ...data.companyInfo,
                          rue: data.personalInfo?.localite || '',
                          porte: data.personalInfo?.porte || '',
                          divisionCode: data.personalInfo?.divisionId || '',
                          regionId: data.personalInfo?.divisionId || '',
                          cercleId: '',
                          arrondissementId: '',
                          communeId: '',
                          quartierId: ''
                        });
                      }}
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg border text-sm sm:text-base ${data.personalInfo?.hasDifferentAddress === false 
                        ? 'bg-investmali-accent text-white border-investmali-accent' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Non
                    </button>
                  </div>

                </div>

                {/* Extrait de casier judiciaire */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Avez-vous un extrait de casier judiciaire ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        hasCriminalRecord: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.hasCriminalRecord === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        hasCriminalRecord: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${(data.personalInfo?.hasCriminalRecord === false || data.personalInfo?.hasCriminalRecord === undefined) ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Situation matrimoniale */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Êtes-vous marié(e) ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        isMarried: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.isMarried === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        isMarried: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${(data.personalInfo?.isMarried === false || data.personalInfo?.isMarried === undefined) ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>


                {/* Responsables supplémentaires */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Autorisez-vous une ou plusieurs personnes à être responsable de l'entreprise ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        allowsMultipleManagers: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.allowsMultipleManagers === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        allowsMultipleManagers: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${(data.personalInfo?.allowsMultipleManagers === false || data.personalInfo?.allowsMultipleManagers === undefined) ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Autorisation d'exercice */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Votre activité est-elle soumise à une autorisation d'exercice ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        requiresExerciseAuthorization: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.requiresExerciseAuthorization === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        requiresExerciseAuthorization: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.requiresExerciseAuthorization === false ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Import/Export */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Allez-vous importer ou exporter des marchandises ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        willImportExport: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.willImportExport === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        willImportExport: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.willImportExport === false ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bouton Continuer masqué */}
          </div>
        </div>
      ) : (
        <></>
        // Message informatif supprimé - affichage direct du formulaire
      )}
    </div>
  );
};

// Étape 2 : Informations de l'entreprise
const CompanyInfoStep: React.FC<{data: BusinessCreationData, updateData: (field: keyof BusinessCreationData, value: any) => void}> = ({ data, updateData: updateBusinessData }) => {
  

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
        (arr: any) => {
          const code = arr.code || '';
          return ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(code);
        }
      ];
      
      for (let i = 0; i < bamakoFilters.length; i++) {
        const filtered = allArrondissements?.filter(bamakoFilters[i]) || [];
        
        if (filtered?.length > 0) {
          arrondissements = filtered;
          break;
        }
      }
      
      if (arrondissements?.length > 0) {
        return arrondissements;
      }
    } catch (error) {
    }
    
    // Stratégie 4: Données hardcodées en dernier recours
    arrondissements = [
      { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001', parent: { id: regionId } },
      { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002', parent: { id: regionId } },
      { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003', parent: { id: regionId } },
      { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004', parent: { id: regionId } },
      { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005', parent: { id: regionId } },
      { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006', parent: { id: regionId } }
    ];
    
    return arrondissements;
  };

  // Logique unifiée pour charger les quartiers de Bamako District
  const loadBamakoQuartiers = async (arrondissementId: string, arrondissementCode?: string): Promise<any[]> => {
    let quartiers: any[] = [];
    
    // Stratégie 1: Endpoint direct par ID
    try {
      quartiers = await divisionService.getQuartiersByArrondissement(arrondissementId);
      
      if (quartiers?.length > 0) {
        return quartiers;
      }
    } catch (error) {
    }
    
    // Stratégie 2: Endpoint par code (si disponible)
    if (arrondissementCode) {
      try {
        quartiers = await divisionService.getQuartiersByArrondissementCode(arrondissementId);
        
        if (quartiers?.length > 0) {
          return quartiers;
        }
      } catch (error) {
      }
    }
    
    // Stratégie 3: getAllQuartiers + filtrage par code
    if (arrondissementCode) {
      try {
        const allQuartiers = await divisionService.getAllQuartiers();
        const codePrefix = arrondissementCode.substring(0, 4);
        
        quartiers = allQuartiers?.filter((quartier: any) => {
          const code = quartier.code || '';
          return code.startsWith(codePrefix);
        }) || [];
        
        if (quartiers?.length > 0) {
          return quartiers;
        }
      } catch (error) {
      }
    }
    
    // Stratégie 4: Données hardcodées par arrondissement
    const hardcodedQuartiers: Record<string, any[]> = {
      '0001': [
        { id: 'bamako-q-001-1', nom: 'Quartier Korofina Nord', code: '000101', parent: { id: arrondissementId } },
        { id: 'bamako-q-001-2', nom: 'Quartier Korofina Sud', code: '000102', parent: { id: arrondissementId } }
      ],
      '0002': [
        { id: 'bamako-q-002-1', nom: 'Quartier Niaréla', code: '000201', parent: { id: arrondissementId } },
        { id: 'bamako-q-002-2', nom: 'Quartier Bagadadji', code: '000202', parent: { id: arrondissementId } }
      ],
      '0003': [
        { id: 'bamako-q-003-1', nom: 'Quartier Point G', code: '000301', parent: { id: arrondissementId } },
        { id: 'bamako-q-003-2', nom: 'Quartier Dravéla', code: '000302', parent: { id: arrondissementId } }
      ],
      '0004': [
        { id: 'bamako-q-004-1', nom: 'Quartier Lafiabougou', code: '000401', parent: { id: arrondissementId } },
        { id: 'bamako-q-004-2', nom: 'Quartier Taliko', code: '000402', parent: { id: arrondissementId } }
      ],
      '0005': [
        { id: 'bamako-q-005-1', nom: 'Quartier Badalabougou', code: '000501', parent: { id: arrondissementId } },
        { id: 'bamako-q-005-2', nom: 'Quartier Sema I', code: '000502', parent: { id: arrondissementId } }
      ],
      '0006': [
        { id: 'bamako-q-006-1', nom: 'Quartier Banankabougou', code: '000601', parent: { id: arrondissementId } },
        { id: 'bamako-q-006-2', nom: 'Quartier Faladié', code: '000602', parent: { id: arrondissementId } }
      ]
    };
    
    const code = arrondissementCode || '0001';
    quartiers = hardcodedQuartiers[code] || hardcodedQuartiers['0001'];
    
    return quartiers;
  };

  const [showValidation, setShowValidation] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [cercles, setCercles] = useState<any[]>([]);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [quartiers, setQuartiers] = useState<any[]>([]);
  
  // États pour les enums du backend
  const [typeEntrepriseOptions, setTypeEntrepriseOptions] = useState<any[]>([]);
  const [formeJuridiqueOptions, setFormeJuridiqueOptions] = useState<any[]>([]);
  const [domaineActiviteOptions, setDomaineActiviteOptions] = useState<any[]>([]);
  const [domaineActiviteNrOptions, setDomaineActiviteNrOptions] = useState<any[]>([]);
  
  // Variables d'état pour les IDs sélectionnés (UUIDs pour API)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedCercleId, setSelectedCercleId] = useState<string>('');
  const [selectedArrondissementId, setSelectedArrondissementId] = useState<string>('');
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>('');
  const [selectedQuartierId, setSelectedQuartierId] = useState<string>('');
  
  // Variables d'état pour les codes sélectionnés (codes numériques pour divisionCode)
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('');
  const [selectedCercleCode, setSelectedCercleCode] = useState<string>('');
  const [selectedArrondissementCode, setSelectedArrondissementCode] = useState<string>('');
  const [selectedCommuneCode, setSelectedCommuneCode] = useState<string>('');
  const [selectedQuartierCode, setSelectedQuartierCode] = useState<string>('');

  // useEffect pour restaurer les sélections de localisation depuis data.companyInfo
  useEffect(() => {
    console.log('🔍 [LOCATION DEBUG] useEffect de restauration déclenché:', {
      regionId: data.companyInfo?.regionId,
      cercleId: data.companyInfo?.cercleId,
      communeId: data.companyInfo?.communeId,
      quartierId: data.companyInfo?.quartierId
    });
    
    if (data.companyInfo?.regionId) {
      console.log('🔍 [LOCATION DEBUG] Restauration regionId:', data.companyInfo.regionId);
      setSelectedRegionId(data.companyInfo.regionId);
    }
    if (data.companyInfo?.cercleId) {
      console.log('🔍 [LOCATION DEBUG] Restauration cercleId:', data.companyInfo.cercleId);
      setSelectedCercleId(data.companyInfo.cercleId);
    }
    if (data.companyInfo?.arrondissementId) {
      console.log('🔍 [LOCATION DEBUG] Restauration arrondissementId:', data.companyInfo.arrondissementId);
      setSelectedArrondissementId(data.companyInfo.arrondissementId);
    }
    if (data.companyInfo?.communeId) {
      console.log('🔍 [LOCATION DEBUG] Restauration communeId:', data.companyInfo.communeId);
      setSelectedCommuneId(data.companyInfo.communeId);
    }
    if (data.companyInfo?.quartierId) {
      console.log('🔍 [LOCATION DEBUG] Restauration quartierId:', data.companyInfo.quartierId);
      setSelectedQuartierId(data.companyInfo.quartierId);
    }
  }, [data.companyInfo?.regionId, data.companyInfo?.cercleId, data.companyInfo?.arrondissementId, data.companyInfo?.communeId, data.companyInfo?.quartierId]);

  // Charger les régions et enums au montage + initialiser depuis les données existantes
  useEffect(() => {
    let mounted = true;
    
    // Charger les régions
    divisionService.getRegions().then((res: any[]) => {
      if (mounted) setRegions(res || []);
    }).catch(() => {});
    
    // Charger les enums du backend
    Promise.all([
      enumService.getTypeEntreprise(),
      enumService.getFormeJuridique(), 
      enumService.getDomaineActivites(),
      enumService.getDomaineActivitesNr()
    ]).then(([typeEntreprise, formeJuridique, domaineActivites, domaineActivitesNr]) => {
      if (mounted) {
        setTypeEntrepriseOptions(typeEntreprise || []);
        setFormeJuridiqueOptions(formeJuridique || []);
        setDomaineActiviteOptions(domaineActivites || []);
        setDomaineActiviteNrOptions(domaineActivitesNr || []);
      }
    }).catch(error => {
    });
    
    return () => { mounted = false; };
  }, []);

  // Fonction de synchronisation séquentielle (inspirée de DossierCreationForm.tsx)
  const applyCompanyHierarchySequential = async (hierarchy: any) => {
    try {
      // Étape 1: Appliquer la région
      if (hierarchy.region) {
        setSelectedRegionId(hierarchy.region.id);
        
        // Charger manuellement les cercles depuis la région
        try {
          const cercles = await divisionService.getCerclesByRegion(hierarchy.region.code);
          setCercles(cercles || []);
        } catch (error) {
        }
      }
      
      // Étape 2: Appliquer le cercle
      if (hierarchy.cercle) {
        setSelectedCercleId(hierarchy.cercle.id);
        
        // Charger manuellement les communes depuis le cercle
        try {
          const communes = await divisionService.getCommunesByCercle(hierarchy.cercle.id);
          setCommunes(communes || []);
        } catch (error) {
        }
      }
      
      // Étape 3: Appliquer la commune (structure INSTAT moderne)
      if (hierarchy.commune) {
        setSelectedCommuneId(hierarchy.commune.id);
        
        // Charger manuellement les quartiers depuis la commune
        try {
          const quartiers = await divisionService.getQuartiersByCommune(hierarchy.commune.id);
          setQuartiers(quartiers || []);
        } catch (error) {
        }
      }
      
      // Étape 4: Appliquer le quartier
      if (hierarchy.quartier) {
        setSelectedQuartierId(hierarchy.quartier.id);
      }
    } catch (error) {
    }
  };

  // Écouter l'événement de synchronisation immédiate
  useEffect(() => {
    const handleDivisionCodeSync = (event: any) => {
      const { divisionCode } = event.detail;
      
      if (divisionCode && data.personalInfo?.hasDifferentAddress === false && regions.length > 0) {
          triggerSelectorSync(divisionCode);
      }
    };
    
    window.addEventListener('divisionCodeSynchronized', handleDivisionCodeSync);
    return () => window.removeEventListener('divisionCodeSynchronized', handleDivisionCodeSync);
  }, [data.personalInfo?.hasDifferentAddress, regions.length]);

  // Fonction pour déclencher la synchronisation des sélecteurs
  const triggerSelectorSync = (divisionCode: string) => {
    
    // Construire la hiérarchie depuis le divisionCode (comme côté agent)
    const regionCode = divisionCode.substring(0, 2);
    const cercleCode = divisionCode.substring(0, 4);
    const communeCode = divisionCode.substring(0, 8);
    
    // Construire l'objet hiérarchie
    const hierarchy: any = {};
    
    // Trouver les éléments dans les listes chargées
    hierarchy.region = regions.find((r: any) => r.code === regionCode);
    // Les autres seront trouvés au fur et à mesure du chargement
    
    if (hierarchy.region) {
      // Construire la hiérarchie complète de manière asynchrone
      divisionService.getCerclesByRegion(hierarchy.region.code).then((cerclesList: any[]) => {
        hierarchy.cercle = cerclesList?.find((c: any) => c.code === cercleCode);
        
        if (hierarchy.cercle) {
          return divisionService.getCommunesByCercle(hierarchy.cercle.id);
        }
        return [];
      }).then((communesList: any[]) => {
        hierarchy.commune = communesList?.find((c: any) => c.code === communeCode);
        
        if (hierarchy.commune) {
          return divisionService.getQuartiersByCommune(hierarchy.commune.id);
        }
        return [];
      }).then((quartiersList: any[]) => {
        hierarchy.quartier = quartiersList?.find((q: any) => q.code === divisionCode);
        
        // Maintenant appliquer la hiérarchie complète
        applyCompanyHierarchySequential(hierarchy);
      }).catch(error => {
      });
    }
  };

  // Synchronisation avec la logique agent - quand divisionCode change
  useEffect(() => {
    if (data.companyInfo?.divisionCode && data.personalInfo?.hasDifferentAddress === false && regions.length > 0) {
      triggerSelectorSync(data.companyInfo.divisionCode);
    }
  }, [data.companyInfo?.divisionCode, data.personalInfo?.hasDifferentAddress, regions.length]);

  // Synchronisation directe des sélecteurs depuis divisionCode (obsolète - remplacé par le useEffect ci-dessus)
  useEffect(() => {
    
    if (data.companyInfo?.divisionCode && data.personalInfo?.hasDifferentAddress === false && regions.length > 0) {
      
      const code = data.companyInfo.divisionCode;
      
      // Déterminer le type de division depuis le code
      if (code.length >= 12) {
        // Code quartier complet (ex: 010101010001 pour Kayes ou 900101010020 pour Bamako)
        const regionCode = code.substring(0, 2);
        const cercleCode = code.substring(0, 4);
        const communeCode = code.substring(0, 8);
        
        // Trouver la région correspondante
        const region = regions.find(r => r.code === regionCode);
        if (region) {
          setSelectedRegionId(region.id);
        }
        
        // Trouver le cercle correspondant
        const cercle = cercles.find(c => c.code === cercleCode);
        if (cercle) {
          setSelectedCercleId(cercle.id);
        }
        
        // Trouver la commune correspondante
        const commune = communes.find(c => c.code === communeCode);
        if (commune) {
          setSelectedCommuneId(commune.id);
        }
        
        // Trouver le quartier correspondant
        const quartier = quartiers.find(q => q.code === code);
        if (quartier) {
          setSelectedQuartierId(quartier.id);
        }
        
      } else if (code.length >= 8) {
        // Code commune (ex: 90010101)
        setSelectedRegionId('90');
        setSelectedCercleId('9001');
        
        const communeId = communes.find(c => c.code === code)?.id;
        if (communeId) {
          setSelectedCommuneId(communeId);
        }
        
      } else if (code.length >= 4) {
        // Code cercle (ex: 9001)
        setSelectedRegionId('90');
        setSelectedCercleId('9001');
        
      }
    }
  }, [data.companyInfo?.divisionCode, data.personalInfo?.hasDifferentAddress, regions.length, communes.length, quartiers.length]);

  // Synchronisation avec la localisation personnelle (Structure INSTAT moderne)
  useEffect(() => {
    const hasDifferentAddress = data.personalInfo?.hasDifferentAddress;
    
    
    // Synchronisation directe via analyse du divisionId (Structure INSTAT moderne)
    if (hasDifferentAddress === false && regions.length > 0 && data.personalInfo?.divisionId) {
      
      const personalDivisionId = data.personalInfo.divisionId;
      
      // Analyser directement le code pour extraire la hiérarchie
      if (personalDivisionId && personalDivisionId.length >= 12) {
        // Code quartier complet (ex: 010101010001)
        const regionCode = personalDivisionId.substring(0, 2); // 01
        const cercleCode = personalDivisionId.substring(0, 4); // 0101
        const communeCode = personalDivisionId.substring(0, 8); // 01010101
        const quartierCode = personalDivisionId; // 010101010001
        
        
        // Synchroniser le divisionCode directement avec le code personnel
        updateBusinessData('companyInfo', {
          ...data.companyInfo,
          divisionCode: quartierCode
        });
        
        // Déclencher immédiatement la synchronisation des sélecteurs
        setTimeout(() => {
          // Simuler un changement de divisionCode pour déclencher les useEffect du CompanyInfoStep
          const event = new CustomEvent('divisionCodeSynchronized', { 
            detail: { divisionCode: quartierCode } 
          });
          window.dispatchEvent(event);
        }, 100);
      }
      
      // Synchroniser aussi la localité textuelle
      if (data.personalInfo?.localite) {
        updateBusinessData('companyInfo', {
          ...data.companyInfo,
          localite: data.personalInfo.localite
        });
      }
      return;
    }

    // Si l'adresse n'est PAS différente (même adresse), synchroniser
    // Attendre que les régions soient chargées avant de synchroniser
    if (hasDifferentAddress === false && regions.length > 0) {
      // Récupérer les données de localisation personnelle
      const personalDivisionId = data.personalInfo?.divisionId;
      const personalLocalite = data.personalInfo?.localite;
      
      if (personalDivisionId) {
        // Récupérer la division personnelle pour obtenir son code
        divisionService.getById(personalDivisionId).then((division: any) => {
          if (division) {
            
            // Mettre à jour le divisionCode de l'entreprise
            updateBusinessData('companyInfo', {
              ...data.companyInfo,
              divisionCode: division.code
            });
            
            // Construire la hiérarchie pour pré-sélectionner les champs
            const buildHierarchy = (div: any): any => {
              const hierarchy: any = {};
              let current = div;
              
              while (current) {
                switch (current.divisionType) {
                  case 'REGION':
                    hierarchy.region = current;
                    break;
                  case 'CERCLE':
                    hierarchy.cercle = current;
                    break;
                  case 'ARRONDISSEMENT':
                    hierarchy.arrondissement = current;
                    break;
                  case 'COMMUNE':
                    hierarchy.commune = current;
                    break;
                  case 'QUARTIER':
                    hierarchy.quartier = current;
                    break;
                }
                current = current.parent;
              }
              
              return hierarchy;
            };
            
            const hierarchy = buildHierarchy(division);
            
            // Détecter si c'est Bamako District
            let isBamakoDistrict = hierarchy.region?.nom?.toLowerCase().includes('bamako') && 
                                  hierarchy.region?.nom?.toLowerCase().includes('district');
            
            // Fallback : détecter Bamako par le code de division
            if (!isBamakoDistrict && division.code && (division.code.startsWith('0004') || division.code.startsWith('00'))) {
              isBamakoDistrict = true;
            }
            
            // Pré-sélectionner les champs selon la hiérarchie et charger les listes nécessaires
            if (hierarchy.region) {
              setSelectedRegionId(hierarchy.region.id);
              setSelectedRegionCode(hierarchy.region.code);
              
              // Charger les cercles pour cette région (si pas Bamako District)
              if (!isBamakoDistrict && hierarchy.cercle) {
                divisionService.getCerclesByRegion(hierarchy.region.code).then((cerclesList: any[]) => {
                  setCercles(cerclesList || []);
                }).catch(() => {});
              } else if (isBamakoDistrict) {
                // Pour Bamako, charger directement les arrondissements
                divisionService.getArrondissementsByRegion(hierarchy.region.id).then((arrondissements: any[]) => {
                  setArrondissements(arrondissements || []);
                }).catch(() => {
                  // Fallback simple avec données hardcodées
                  const fallbackArrondissements = [
                    { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001' },
                    { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002' },
                    { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003' },
                    { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004' },
                    { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005' },
                    { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006' }
                  ];
                  setArrondissements(fallbackArrondissements);
                });
              }
            } else if (isBamakoDistrict) {
              // Cas spécial : Bamako détecté mais pas de région dans la hiérarchie
              const bamakoRegion = regions.find((r: any) => 
                r.nom?.toLowerCase().includes('bamako') && r.nom?.toLowerCase().includes('district')
              );
              
              if (bamakoRegion) {
                setSelectedRegionId(bamakoRegion.id);
                setSelectedRegionCode(bamakoRegion.code);
                
                // Charger les arrondissements Bamako
                divisionService.getArrondissementsByRegion(bamakoRegion.id).then((arrondissements: any[]) => {
                  setArrondissements(arrondissements || []);
                  
                  // Sélectionner l'arrondissement correspondant au quartier
                  if (hierarchy.quartier && arrondissements?.length > 0) {
                    const quartierCode = division.code || '';
                    const arrondissementCodeFromQuartier = quartierCode.substring(0, 4);
                    
                    const matchingArrondissement = arrondissements.find((arr: any) => 
                      arr.code === arrondissementCodeFromQuartier
                    );
                    
                    if (matchingArrondissement) {
                      setSelectedArrondissementId(matchingArrondissement.id);
                      setSelectedArrondissementCode(matchingArrondissement.code);
                      
                      // Charger les quartiers pour cet arrondissement
                      divisionService.getQuartiersByArrondissement(matchingArrondissement.id).then((quartiers: any[]) => {
                        setQuartiers(quartiers || []);
                        if (hierarchy.quartier) {
                          setSelectedQuartierId(hierarchy.quartier.id);
                          setSelectedQuartierCode(hierarchy.quartier.code);
                        }
                      }).catch(() => {
                        const fallbackQuartiers = [
                          { id: 'bamako-q-1', nom: 'Quartier Korofina', code: '000401' },
                          { id: 'bamako-q-2', nom: 'Quartier Taliko', code: '000402' },
                          { id: 'bamako-q-3', nom: 'Quartier Point G', code: '000403' }
                        ];
                        setQuartiers(fallbackQuartiers);
                      });
                    }
                  }
                }).catch(() => {
                  const fallbackArrondissements = [
                    { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001' },
                    { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002' },
                    { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003' },
                    { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004' },
                    { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005' },
                    { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006' }
                  ];
                  setArrondissements(fallbackArrondissements);
                });
              }
            }
            if (hierarchy.cercle && !isBamakoDistrict) {
              setSelectedCercleId(hierarchy.cercle.id);
              setSelectedCercleCode(hierarchy.cercle.code);
              
              // Charger les arrondissements pour ce cercle
              if (hierarchy.arrondissement) {
                divisionService.getArrondissementsByCercle(hierarchy.cercle.id).then((arrondissementsList: any[]) => {
                  setArrondissements(arrondissementsList || []);
                }).catch(() => {});
              }
            }
            if (hierarchy.arrondissement) {
              setSelectedArrondissementId(hierarchy.arrondissement.id);
              setSelectedArrondissementCode(hierarchy.arrondissement.code);
              
              if (isBamakoDistrict) {
                // Pour Bamako, charger directement les quartiers
                divisionService.getQuartiersByArrondissement(hierarchy.arrondissement.id).then((quartiers: any[]) => {
                  setQuartiers(quartiers || []);
                }).catch(() => {
                  const fallbackQuartiers = [
                    { id: 'bamako-q-1', nom: 'Quartier Korofina', code: '000101' },
                    { id: 'bamako-q-2', nom: 'Quartier Taliko', code: '000102' },
                    { id: 'bamako-q-3', nom: 'Quartier Point G', code: '000103' }
                  ];
                  setQuartiers(fallbackQuartiers);
                });
              } else {
                // Structure classique : charger les communes
                if (hierarchy.commune) {
                  divisionService.getCommunesByArrondissement(hierarchy.arrondissement.id).then((communesList: any[]) => {
                    setCommunes(communesList || []);
                  }).catch(() => {});
                }
              }
            }
            if (hierarchy.commune && !isBamakoDistrict) {
              setSelectedCommuneId(hierarchy.commune.id);
              setSelectedCommuneCode(hierarchy.commune.code);
              
              // Charger les quartiers pour cette commune
              if (hierarchy.quartier) {
                divisionService.getQuartiersByCommune(hierarchy.commune.id).then((quartiersList: any[]) => {
                  setQuartiers(quartiersList || []);
                }).catch(() => {});
              }
            }
            if (hierarchy.quartier) {
              setSelectedQuartierId(hierarchy.quartier.id);
              setSelectedQuartierCode(hierarchy.quartier.code);
            }
          }
        }).catch(() => {});
      }
    }
  }, [
    data.personalInfo?.hasDifferentAddress, 
    data.personalInfo?.divisionId, 
    data.personalInfo?.localite, 
    regions.length
  ]);

  // Charger cercles quand selectedRegionId change
  useEffect(() => {
    let mounted = true;
    if (selectedRegionId) {
      // Vérifier si c'est Bamako District
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
      
      if (isBamakoDistrict) {
        // Pour Bamako District, charger directement les arrondissements
        Promise.all([
          divisionService.getArrondissementsByRegion(selectedRegionId),
          divisionService.getAllArrondissements(),
          divisionService.searchBamakoDivisions()
        ]).then(([arrondissementsDirects, allArrondissements, bamakoDivisions]) => {
          // Stratégie 1: Arrondissements avec "premier", "deuxième", etc. (typique de Bamako)
          const strategy1 = allArrondissements.filter((arr: any) => {
            const nom = arr.nom?.toLowerCase() || '';
            return nom.includes('premier') || nom.includes('deuxième') || nom.includes('troisième') || 
                   nom.includes('quatrième') || nom.includes('cinquième') || nom.includes('sixième') || 
                   nom.includes('septième') || nom.includes('deuxieme') || nom.includes('troisieme') || 
                   nom.includes('quatrieme') || nom.includes('cinquieme') || nom.includes('sixieme') || 
                   nom.includes('septieme');
          });
          
          // Stratégie 2: Arrondissements dont le parent est dans bamakoDivisions
          const strategy2 = allArrondissements.filter((arr: any) => 
            bamakoDivisions.some((bd: any) => bd.id === arr.parent?.id)
          );
          
          // Stratégie 3: Arrondissements avec parent contenant "bamako"
          const strategy3 = allArrondissements.filter((arr: any) => 
            arr.parent?.nom?.toLowerCase().includes('bamako')
          );
          
          // Utiliser la stratégie qui donne le plus de résultats
          let bamakoArrondissements = strategy1;
          if (strategy2.length > bamakoArrondissements.length) bamakoArrondissements = strategy2;
          if (strategy3.length > bamakoArrondissements.length) bamakoArrondissements = strategy3;
          
          if (mounted) {
            setCercles([]); // Pas de cercles pour Bamako
            setArrondissements(bamakoArrondissements || []);
            
            // Sélection automatique de l'arrondissement si synchronisation active
            if (data.personalInfo?.hasDifferentAddress === false && data.companyInfo?.divisionCode) {
              const quartierCode = data.companyInfo.divisionCode;
              const arrondissementCodeFromQuartier = quartierCode.substring(0, 4);
              
              const matchingArrondissement = bamakoArrondissements.find((arr: any) => 
                arr.code === arrondissementCodeFromQuartier
              );
              
              if (matchingArrondissement) {
                setSelectedArrondissementId(matchingArrondissement.id);
                setSelectedArrondissementCode(matchingArrondissement.code);
              }
            }
          }
        }).catch((error: any) => {
        });
      } else {
        // Structure classique : charger les cercles
        const regionCode = selectedRegionCode || selectedRegion?.code;
        if (regionCode) {
          divisionService.getCerclesByRegion(regionCode).then((res: any[]) => {
            if (mounted) setCercles(res || []);
          }).catch(() => {});
        }
      }
    } else {
      setCercles([]);
      setArrondissements([]);
      setCommunes([]);
      setSelectedCercleId('');
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
    }
    return () => { mounted = false; };
  }, [selectedRegionId, regions]);

  // Charger arrondissements quand selectedCercleId change
  useEffect(() => {
    let mounted = true;
    if (selectedCercleId) {
      divisionService.getArrondissementsByCercle(selectedCercleId).then((res: any[]) => {
        if (mounted) setArrondissements(res || []);
      }).catch(() => {});
    } else {
      setArrondissements([]);
      setCommunes([]);
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
    }
    return () => { mounted = false; };
  }, [selectedCercleId]);

  // Charger communes quand selectedArrondissementId change
  useEffect(() => {
    let mounted = true;
    if (selectedArrondissementId) {
      // Vérifier si c'est Bamako District
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
      
      if (isBamakoDistrict) {
        // Pour Bamako District, charger directement les quartiers depuis l'arrondissement
        
        // Pour Bamako District, essayer d'abord la relation directe, puis la solution par code
        divisionService.getQuartiersByArrondissement(selectedArrondissementId).then((quartiers: any[]) => {
          
          if (quartiers && quartiers.length > 0) {
            // Relation directe fonctionne
            if (mounted) {
              setCommunes([]);
              setQuartiers(quartiers);
              
              // NOUVEAU: Sélection automatique du quartier si synchronisation active
              if (data.personalInfo?.hasDifferentAddress === false && data.companyInfo?.divisionCode) {
                const quartierCode = data.companyInfo.divisionCode;
                
                const matchingQuartier = quartiers.find((q: any) => q.code === quartierCode);
                if (matchingQuartier) {
                  setSelectedQuartierId(matchingQuartier.id);
                  setSelectedQuartierCode(matchingQuartier.code);
                }
              }
            }
          } else {
            // Relation directe ne fonctionne pas, essayer par code
            return divisionService.getQuartiersByArrondissementCode(selectedArrondissementId);
          }
        }).then((quartiersParCode: any[]) => {
          if (quartiersParCode && quartiersParCode.length > 0) {
            if (mounted) {
              setCommunes([]);
              setQuartiers(quartiersParCode);
              
              // NOUVEAU: Sélection automatique du quartier si synchronisation active
              if (data.personalInfo?.hasDifferentAddress === false && data.companyInfo?.divisionCode) {
                const quartierCode = data.companyInfo.divisionCode;
                
                const matchingQuartier = quartiersParCode.find((q: any) => q.code === quartierCode);
                if (matchingQuartier) {
                  setSelectedQuartierId(matchingQuartier.id);
                  setSelectedQuartierCode(matchingQuartier.code);
                }
              }
            }
          } else {
            if (mounted) {
              setCommunes([]);
              setQuartiers([]);
            }
          }
        }).catch((error: any) => {
        });
      } else {
        // Structure classique : charger les communes
        divisionService.getCommunesByArrondissement(selectedArrondissementId).then((res: any[]) => {
          if (mounted) setCommunes(res || []);
        }).catch(() => {});
      }
    } else {
      setCommunes([]);
      setQuartiers([]);
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedArrondissementId, selectedRegionId, regions]);

  // Charger quartiers quand selectedCommuneId change
  useEffect(() => {
    let mounted = true;
    if (selectedCommuneId) {
      divisionService.getQuartiersByCommune(selectedCommuneId).then((res: any[]) => {
        if (mounted) setQuartiers(res || []);
      }).catch(() => {});
    } else {
      setQuartiers([]);
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedCommuneId]);

  // Fonction pour gérer la sélection depuis la recherche (CompanyInfo)
  const handleCompanyDivisionSearch = async (division: any) => {
    
    try {
      // Construire la hiérarchie complète depuis la division sélectionnée
      const hierarchy = await buildCompanyDivisionHierarchy(division);
      
      // Appliquer la hiérarchie aux sélecteurs
      await applyCompanyDivisionHierarchy(hierarchy);
      
    } catch (error) {
    }
  };

  // Construire la hiérarchie complète depuis une division (CompanyInfo)
  const buildCompanyDivisionHierarchy = async (division: any): Promise<any> => {
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
    
    // Détecter si c'est un quartier de Bamako et forcer la reconstruction par code
    const isBamakoQuartier = division.divisionType === 'QUARTIER' && 
                            division.code && 
                            (['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix)));
    
    if (isBamakoQuartier) {
      const reconstructedHierarchy = await reconstructCompanyHierarchyByCode(division);
      if (reconstructedHierarchy && Object.keys(reconstructedHierarchy).length > 1) {
        return reconstructedHierarchy;
      }
    }
    
    // Si on n'a pas de parent dans les données, essayer de récupérer la hiérarchie via l'API
    if (!division.parent && division.divisionType !== 'REGION') {
      try {
        const fullDivision = await divisionService.getById(division.id);
        
        if (fullDivision && fullDivision.parent) {
          // Recommencer avec les données complètes
          return await buildCompanyDivisionHierarchy(fullDivision);
        }
      } catch (error) {
      }
    }
    
    return hierarchy;
  };

  // Reconstruire la hiérarchie par code pour CompanyInfo (pour les cas où les relations parent sont manquantes)
  const reconstructCompanyHierarchyByCode = async (division: any): Promise<any> => {
    const hierarchy: any = {};
    
    // Ajouter la division actuelle
    hierarchy[division.divisionType.toLowerCase()] = division;
    
    if (!division.code) {
      return hierarchy;
    }
    
    try {
      // Récupérer toutes les régions
      const regions = await divisionService.getRegions();
      
      // Pour Bamako (codes 0001xxxx à 0007xxxx)
      if (division.code.match(/^000[1-7]/) || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix))) {
        
        const bamakoRegion = regions.find((r: any) => 
          r.nom?.toLowerCase().includes('bamako') && 
          r.nom?.toLowerCase().includes('district')
        );
        
        if (bamakoRegion) {
          hierarchy.region = bamakoRegion;
          
          if (division.divisionType === 'QUARTIER') {
            const arrondissementCode = division.code.substring(0, 4);
            
            // Utiliser la même logique de fallback que PersonalInfoStep
            const [children, bamakoDivisions, allArrondissements] = await Promise.all([
              divisionService.getChildrenByRegion(bamakoRegion.id),
              divisionService.searchBamakoDivisions(),
              divisionService.getAllArrondissements()
            ]);
            
            
            // Stratégie 1: Divisions Bamako filtrées
            const bamakoArrondissements = bamakoDivisions.filter((div: any) => 
              div.divisionType === 'ARRONDISSEMENT' && 
              (div.nom?.includes('Arrondissement') || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(div.code))
            );
            
            let arrondissements = [];
            if (bamakoArrondissements.length) {
              arrondissements = bamakoArrondissements;
            } else {
              // Stratégie 2: Tous les arrondissements filtrés par nom
              const arrondissementsParNom = allArrondissements.filter((arr: any) => 
                arr.nom?.includes('Arrondissement') && 
                ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième'].some(num => arr.nom?.includes(num))
              );
              
              if (arrondissementsParNom.length) {
                arrondissements = arrondissementsParNom;
              }
            }
            
            // Chercher l'arrondissement correspondant
            const arrondissement = arrondissements.find((a: any) => a.code === arrondissementCode);
            
            if (arrondissement) {
              hierarchy.arrondissement = arrondissement;
            } else {
            }
          }
        }
      }
    } catch (error) {
    }
    
    return hierarchy;
  };

  // Appliquer la hiérarchie aux sélecteurs (CompanyInfo)
  const applyCompanyDivisionHierarchy = async (hierarchy: any) => {
    
    // Détecter si c'est Bamako District
    const isBamakoDistrict = hierarchy.region?.nom?.toLowerCase().includes('bamako') && 
                            hierarchy.region?.nom?.toLowerCase().includes('district');
    
    try {
      // Région
      if (hierarchy.region) {
        setSelectedRegionId(hierarchy.region.id);
        setSelectedRegionCode(hierarchy.region.code);
        
        // Charger les cercles ou arrondissements selon la structure
        if (isBamakoDistrict) {
          
          // Utiliser la même logique de fallback que PersonalInfoStep
          const [arrondissementsDirects, allArrondissements, bamakoDivisions] = await Promise.all([
            divisionService.getArrondissementsByRegion(hierarchy.region.id),
            divisionService.getAllArrondissements(),
            divisionService.searchBamakoDivisions()
          ]);
          
          
          // Stratégie 1: Divisions Bamako filtrées
          const bamakoArrondissements = bamakoDivisions.filter((div: any) => 
            div.divisionType === 'ARRONDISSEMENT' && 
            (div.nom?.includes('Arrondissement') || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(div.code))
          );
          
          let finalArrondissements = [];
          if (bamakoArrondissements.length) {
            finalArrondissements = bamakoArrondissements;
          } else {
            // Stratégie 2: Tous les arrondissements filtrés par nom
            const arrondissementsParNom = allArrondissements.filter((arr: any) => 
              arr.nom?.includes('Arrondissement') && 
              ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième'].some(num => arr.nom?.includes(num))
            );
            
            if (arrondissementsParNom.length) {
              finalArrondissements = arrondissementsParNom;
            }
          }
          
          setArrondissements(finalArrondissements || []);
        } else {
          const cercles = await divisionService.getCerclesByRegion(hierarchy.region.code);
          setCercles(cercles || []);
        }
      }
    
    // Cercle (seulement si pas Bamako District)
    if (hierarchy.cercle && !isBamakoDistrict) {
      setSelectedCercleId(hierarchy.cercle.id);
      setSelectedCercleCode(hierarchy.cercle.code);
    } else if (isBamakoDistrict) {
      setSelectedCercleId('');
      setSelectedCercleCode('');
    }
    
      // Arrondissement
      if (hierarchy.arrondissement) {
        setSelectedArrondissementId(hierarchy.arrondissement.id);
        setSelectedArrondissementCode(hierarchy.arrondissement.code);
        
        // Charger les communes ou quartiers selon la structure
        if (isBamakoDistrict) {
          
          // Utiliser la logique de fallback par code pour les quartiers
          const arrondissementCode = hierarchy.arrondissement.code || '';
          
          if (arrondissementCode && arrondissementCode.length >= 4) {
            const codePrefix = arrondissementCode.substring(0, 4);
            
            const allQuartiers = await divisionService.getAllQuartiers();
            const quartiersCorrespondants = allQuartiers.filter((quartier: any) => {
              const code = quartier.code || '';
              return code.startsWith(codePrefix);
            });
            
            setQuartiers(quartiersCorrespondants || []);
          }
        } else {
          const communes = await divisionService.getCommunesByArrondissement(hierarchy.arrondissement.id);
          setCommunes(communes || []);
        }
      }
    
    // Commune (seulement si pas Bamako District)
    if (hierarchy.commune && !isBamakoDistrict) {
      setSelectedCommuneId(hierarchy.commune.id);
      setSelectedCommuneCode(hierarchy.commune.code);
    } else if (isBamakoDistrict) {
      setSelectedCommuneId('');
      setSelectedCommuneCode('');
    }
    
    // Quartier et mise à jour des données
    if (hierarchy.quartier) {
      setSelectedQuartierId(hierarchy.quartier.id);
      setSelectedQuartierCode(hierarchy.quartier.code);
      
      // Mettre à jour les données du formulaire avec le quartier
      updateBusinessData('companyInfo', {
        ...data.companyInfo,
        divisionCode: hierarchy.quartier.code
      });
    } else if (hierarchy.commune && !isBamakoDistrict) {
      // Si pas de quartier, utiliser la commune (sauf pour Bamako)
      updateBusinessData('companyInfo', {
        ...data.companyInfo,
        divisionCode: hierarchy.commune.code
      });
    } else if (hierarchy.arrondissement) {
      // Si pas de commune, utiliser l'arrondissement (cas Bamako)
      updateBusinessData('companyInfo', {
        ...data.companyInfo,
        divisionCode: hierarchy.arrondissement.code
      });
    }
    
    
    } catch (error) {
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Informations de l'Entreprise</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
        Renseignez les informations de base de votre entreprise.
      </p>

      <div className="space-y-8">
        {/* Informations de base */}
        <div className="rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-primary/20 shadow-sm animate-slide-up" style={{animationDelay: '0.2s'}}>
          <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 lg:mb-6 flex items-center">
            {/* <span className="text-lg sm:text-xl mr-2 animate-bounce">🏢</span> */}
            Informations de base
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {/* Nom de l'entreprise */}
            <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Nom de l'entreprise {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? '(optionnel)' : '*'}
              </label>
              <input
                type="text"
                value={data.companyInfo?.nom || ''}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, nom: e.target.value })}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
                  showValidation && !data.companyInfo?.nom && data.companyInfo?.typeEntreprise === 'SOCIETE' 
                    ? 'border-red-400 focus:ring-investmali-accent' 
                    : 'border-gray-300 focus:ring-investmali-accent'
                }`}
                placeholder={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                  ? `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim() || 'Nom automatique du gérant'
                  : ''
                }
              />
              {/* {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                <p className="text-xs text-gray-500 mt-1">
                  Si vide, le nom du gérant sera utilisé automatiquement
                </p>
              )} */}
            </div>

            {/* Sigle */}
            <div className="animate-slide-up" style={{animationDelay: '0.35s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Sigle (optionnel)</label>
              <input
                type="text"
                value={data.companyInfo?.sigle || ''}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, sigle: e.target.value })}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-500 text-sm sm:text-base"
                placeholder=""
              />
            </div>

            {/* Capitale - Masqué pour les entreprises individuelles */}
            {data.companyInfo?.typeEntreprise === 'SOCIETE' && (
              <div className="animate-slide-up" style={{animationDelay: '0.37s'}}>
                <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Capitale *</label>
                <input
                  type="text"
                  value={data.companyInfo?.capitale || ''}
                  onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, capitale: e.target.value })}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${showValidation && !data.companyInfo?.capitale ? 'border-red-400 focus:ring-investmali-accent' : 'border-gray-300 focus:ring-investmali-accent'}`}
                  placeholder="Ex: 1 000 000 "
                />
              </div>
            )}

            {/* Type d'entreprise - masqué pour les entreprises individuelles */}
            {data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
              <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
                <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Type d'entreprise *</label>
                {data.companyInfo?.typeEntreprise ? (
                  // Affichage en lecture seule quand le type est déjà sélectionné
                  <div className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50 text-sm sm:text-base border-gray-300 text-gray-700 font-medium">
                    {data.companyInfo.typeEntreprise === 'SOCIETE' ? 'Société' : 'Entreprise individuelle'}
                    <span className="text-sm text-gray-500 ml-2"></span>
                  </div>
                ) : (
                  // Select normal si aucun type n'est sélectionné
                  <select
                    value={data.companyInfo?.typeEntreprise || ''}
                    onChange={(e) => {
                      const newTypeEntreprise = e.target.value as TypeEntreprise;
                      // Auto-sélectionner E_I si Entreprise Individuelle
                      const newFormeJuridique = newTypeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'E_I' : data.companyInfo?.formeJuridique;
                      updateBusinessData('companyInfo', { 
                        ...data.companyInfo, 
                        typeEntreprise: newTypeEntreprise,
                        formeJuridique: newFormeJuridique
                      });
                    }}
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${showValidation && !data.companyInfo?.typeEntreprise ? 'border-red-400 focus:ring-investmali-accent' : 'border-gray-300 focus:ring-investmali-accent'}`}
                  >
                    <option value="">Sélectionnez</option>
                    {typeEntrepriseOptions.map((option: any) => (
                      <option key={option.key} value={option.key}>{option.value}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Forme juridique */}
            <div className="animate-slide-up" style={{animationDelay: '0.45s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Forme juridique *</label>
              <select
                value={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'E_I' : (data.companyInfo?.formeJuridique || '')}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, formeJuridique: e.target.value as FormeJuridique })}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${showValidation && !data.companyInfo?.formeJuridique ? 'border-red-400 focus:ring-investmali-accent' : 'border-gray-300 focus:ring-investmali-accent'}`}
                disabled={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'}
              >
                <option value="">Sélectionnez</option>
                {formeJuridiqueOptions
                  .filter((option: any) => {
                    // Si Entreprise Individuelle, montrer seulement E_I
                    if (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
                      return option.key === 'E_I';
                    }
                    // Si Société, montrer tout sauf E_I
                    return option.key !== 'E_I';
                  })
                  .map((option: any) => (
                    <option key={option.key} value={option.key}>{option.label || option.value}</option>
                  ))
                }
              </select>
              {/* {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Forme juridique automatiquement sélectionnée pour une entreprise individuelle</p>
              )} */}
            </div>

            {/* Domaine d'activité non réglementé */}
            <div className="animate-slide-up" style={{animationDelay: '0.52s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Domaine d'activité non réglementé *</label>
              <select
                value={data.companyInfo?.domaineActiviteNr || ''}
                onChange={(e) => {
                  const selectedNr = e.target.value as DomaineActiviteNr;
                  
                  // Mettre à jour le domaine non réglementé
                  let updatedCompanyInfo = { 
                    ...data.companyInfo, 
                    domaineActiviteNr: selectedNr || undefined 
                  };
                  
                  // Si ce domaine non réglementé a une correspondance réglementée, sélectionner automatiquement
                  if (selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0) {
                    updatedCompanyInfo.domaineActivite = DOMAINE_MAPPING[selectedNr][0];
                  }
                  
                  updateBusinessData('companyInfo', updatedCompanyInfo);
                }}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-500 text-sm sm:text-base"
              >
                <option value="">Sélectionnez (optionnel)</option>
                {domaineActiviteNrOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.value}</option>
                ))}
              </select>
              {/* <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Sélectionnez votre domaine d'activité non réglementé (optionnel)</p> */}
            </div>

            {/* Domaine d'activité réglementé */}
            {(() => {
              // Vérifier si le domaine non réglementé sélectionné a une correspondance
              const selectedNr = data.companyInfo?.domaineActiviteNr;
              const hasCorrespondence = selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0;
              
              // Si un domaine non réglementé est sélectionné mais n'a pas de correspondance, masquer le champ
              if (selectedNr && !hasCorrespondence) {
                return null; // Masquer complètement le champ
              }
              
              // return (
              //   <div className="animate-slide-up" style={{animationDelay: '0.5s'}}>
              //     <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Domaine d'activité réglementé *</label>
              //     {(() => {
              //       const isDisabled = Boolean(hasCorrespondence);
                
              //   return (
              //     <>
              //       <select
              //         value={data.companyInfo?.domaineActivite || ''}
              //         onChange={(e) => {
              //           const selectedActivite = e.target.value as DomaineActivites;
              //           let updatedCompanyInfo = { 
              //             ...data.companyInfo, 
              //             domaineActivite: selectedActivite || undefined 
              //           };
                        
              //           // Si ce domaine réglementé a une correspondance, sélectionner automatiquement le domaine non réglementé
              //           if (selectedActivite && DOMAINE_MAPPING_INVERSE[selectedActivite]) {
              //             updatedCompanyInfo.domaineActiviteNr = DOMAINE_MAPPING_INVERSE[selectedActivite];
              //           }
                        
              //           updateBusinessData('companyInfo', updatedCompanyInfo);
              //         }}
              //         disabled={isDisabled}
              //         className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 ${
              //           isDisabled 
              //             ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
              //             : showValidation && !data.companyInfo?.domaineActivite 
              //               ? 'border-red-400 focus:ring-investmali-accent' 
              //               : 'border-gray-300 focus:ring-investmali-accent'
              //         }`}
              //       >
              //         <option value="">Sélectionnez</option>
              //         {domaineActiviteOptions.map((option: any) => (
              //           <option key={option.key} value={option.key}>{option.value}</option>
              //         ))}
              //       </select>
              //       {isDisabled && (
              //         <div className="mt-1">
              //           <p className="text-sm text-blue-600 flex items-center">
              //             <span className="mr-1">ℹ️</span>
              //             Cette activité est soumise à une demande d'autorisation d'exercice
              //           </p>
              //           {/* Bouton masqué - sera dans une étape séparée
              //           <button
              //             onClick={() => {
              //               const selectedNr = data.companyInfo?.domaineActiviteNr;
              //               if (selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0) {
              //                 const domaineReglemente = DOMAINE_MAPPING[selectedNr][0];
              //                 generateAutorisationDocument(domaineReglemente, data);
              //               }
              //             }}
              //             className="mt-2 px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
              //           >
              //             Générer la demande d'autorisation
              //           </button>
              //           */}
              //         </div>
                      
              //       )}
              //     </>
              //       );
              //     })()}
              //   </div>
              // );
            })()}
                        {/* Activité secondaire */}
                        <div className="animate-slide-up md:col-span-2" style={{animationDelay: '0.38s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Activité secondaire</label>
              <textarea
                value={data.companyInfo?.activiteSecondaire || ''}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, activiteSecondaire: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-500"
                placeholder=""
                rows={3}
              />
              {/* <p className="text-sm text-gray-500 mt-1">Optionnel. Sera enregistré dans votre dossier.</p> */}
            </div>

          
          </div>
        </div>

        {/* Localisation */}
        <div className="rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-primary/20 shadow-sm animate-slide-up" style={{animationDelay: '0.55s'}}>
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            {/* <span className="text-lg sm:text-xl mr-2 animate-bounce">📍</span> */}
            Localisation de l'entreprise
          </h3>

          {/* Message informatif sur la synchronisation */}
          {data.personalInfo?.hasDifferentAddress === false && (
            (() => {
              const personalHasLocation = data.personalInfo?.divisionId || data.personalInfo?.localite;
              
              if (personalHasLocation) {
                return null;
              } else {
                return (
                  <div className="bg-black-50 border border-black-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center mb-2">
                      {/* <span className="text-red-600 mr-2">⚠️</span> */}
                      <h4 className="text-lg font-semibold text-black-800">Localisation personnelle manquante</h4>
                    </div>
                    <p className="text-sm text-black-600">
                      Vous avez choisi la même adresse pour l'entreprise, mais votre localisation personnelle n'est pas définie. 
                      La synchronisation ne peut pas fonctionner sans ces informations.
                    </p>
                    <p className="text-sm text-red-500 mt-2">
                      <strong>Action requise :</strong> Retournez à l'étape précédente pour saisir votre localisation personnelle, 
                      ou répondez "Oui" pour saisir une localisation différente pour l'entreprise.
                    </p>
                  </div>
                );
              }
            })()
          )}

          {/* {data.personalInfo?.hasDifferentAddress === true && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center mb-2">
                <span className="text-green-600 mr-2">✅</span>
                <h4 className="text-lg font-semibold text-green-800">Localisation indépendante</h4>
              </div>
              <p className="text-sm text-green-600">
                Vous pouvez saisir une localisation différente pour votre entreprise. 
                Utilisez la recherche rapide ou les sélecteurs ci-dessous.
              </p>
            </div>
          )}
           */}
          {/* Recherche rapide pour l'entreprise */}
          {data.personalInfo?.hasDifferentAddress !== false && (
            <div className="bg-black-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h4 className="text-lg font-semibold text-black-800 mb-3 flex items-center">
                Recherche rapide de localisation
              </h4>
              <p className="text-sm text-black-600 mb-4">
                Tapez le nom d'une localisation pour remplir automatiquement la hiérarchie administrative de l'entreprise
              </p>
              <DivisionSearchInput
                placeholder="Rechercher une région, cercle, commune ou quartier..."
                onSelect={handleCompanyDivisionSearch}
                className="w-full"
              />
            </div>
          )}

          {/* Sélecteurs hiérarchiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

            {/* Région */}
            <div className="animate-slide-up" style={{animationDelay: '0.6s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Région *
              </label>
              <select
                value={selectedRegionId}
                onChange={(e) => {
                  console.log('🚀 [DEBUG] Handler région appelé!', e.target.value);
                  const selectedOption = e.target.selectedOptions[0];
                  const regionId = selectedOption.value;
                  const regionCode = selectedOption.getAttribute('data-code') || '';
                  
                  setSelectedRegionId(regionId);
                  setSelectedRegionCode(regionCode);
                  
                  // Reset des niveaux inférieurs
                  setSelectedCercleId(''); setSelectedCercleCode('');
                  setSelectedArrondissementId(''); setSelectedArrondissementCode('');
                  setSelectedCommuneId(''); setSelectedCommuneCode('');
                  setSelectedQuartierId(''); setSelectedQuartierCode('');
                  
                  // Mettre à jour le divisionCode dans companyInfo
                  const divisionCode = regionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    regionId: regionId,
                    cercleId: '',
                    arrondissementId: '',
                    communeId: '',
                    quartierId: ''
                  });
                }}
                disabled={false}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base border-gray-300 focus:ring-investmali-accent"
              >
                <option value="">Sélectionnez une région</option>
                {regions.map((r: any) => (
                  <option key={r.id} value={r.id} data-code={r.code}>{r.nom}</option>
                ))}
              </select>
            </div>

            {/* Cercle - Masqué pour Bamako District */}
            {(() => {
              const selectedRegion = regions.find(r => r.id === selectedRegionId);
              const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
              
              if (isBamakoDistrict) {
                return null; // Masquer le champ Cercle pour Bamako District
              }
              
              return (
                <div className="animate-slide-up" style={{animationDelay: '0.65s'}}>
                  <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Cercle *
                  </label>
              <select
                value={selectedCercleId || ''}
                onChange={(e) => {
                  const selectedOption = e.target.selectedOptions[0];
                  const cercleId = selectedOption.value;
                  const cercleCode = selectedOption.getAttribute('data-code') || '';
                  
                  setSelectedCercleId(cercleId);
                  setSelectedCercleCode(cercleCode);
                  
                  // Reset des niveaux inférieurs
                  setSelectedArrondissementId(''); setSelectedArrondissementCode('');
                  setSelectedCommuneId(''); setSelectedCommuneCode('');
                  setSelectedQuartierId(''); setSelectedQuartierCode('');
                  
                  // Mettre à jour le divisionCode et cercleId dans companyInfo
                  const divisionCode = cercleCode || selectedRegionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    regionId: selectedRegionId,
                    cercleId: '',
                    arrondissementId: '',
                    communeId: '',
                    quartierId: ''
                  });
                }}
                disabled={!selectedRegionId}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 border-gray-300 focus:ring-investmali-accent disabled:bg-gray-100`}
              >
                <option value="">Sélectionnez un cercle</option>
                {cercles.map((c: any) => (
                  <option key={c.id} value={c.id} data-code={c.code}>{c.nom}</option>
                ))}
                  </select>
                </div>
              );
            })()}

            {/* Section Arrondissement supprimée - Structure INSTAT moderne */}

            {/* Commune - Structure INSTAT moderne */}
            <div className="animate-slide-up" style={{animationDelay: '0.75s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Commune *
              </label>
              <select
                value={selectedCommuneId || ''}
                onChange={(e) => {
                  const selectedOption = e.target.selectedOptions[0];
                  const communeId = selectedOption.value;
                  const communeCode = selectedOption.getAttribute('data-code') || '';
                  
                  setSelectedCommuneId(communeId);
                  setSelectedCommuneCode(communeCode);
                  
                  // Reset des niveaux inférieurs
                  setSelectedQuartierId(''); setSelectedQuartierCode('');
                  
                  // Mettre à jour le divisionCode et communeId dans companyInfo
                  const divisionCode = communeCode || selectedCercleCode || selectedRegionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    communeId,
                    quartierId: ''
                  });
                }}
                disabled={!selectedCercleId}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base border-gray-300 focus:ring-investmali-accent disabled:bg-gray-100`}
              >
                <option value="">Sélectionnez une commune</option>
                {communes.map((c: any) => (
                  <option key={c.id} value={c.id} data-code={c.code}>{c.nom}</option>
                ))}
              </select>
            </div>

            {/* Quartier */}
            <div className="animate-slide-up" style={{animationDelay: '0.8s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Quartier *
              </label>
              <select
                value={selectedQuartierId || ''}
                onChange={(e) => {
                  const selectedOption = e.target.selectedOptions[0];
                  const quartierId = selectedOption.value;
                  const quartierCode = selectedOption.getAttribute('data-code') || '';
                  const quartierNom = selectedOption.text || '';
                  
                  setSelectedQuartierId(quartierId);
                  setSelectedQuartierCode(quartierCode);
                  
                  // Mettre à jour le divisionCode, quartierId et le nom du quartier dans companyInfo
                  const divisionCode = quartierCode || selectedCommuneCode || selectedArrondissementCode || selectedCercleCode || selectedRegionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    quartierId,
                    selectedLocationName: quartierNom // Stocker le nom pour la récap
                  });
                }}
                disabled={(() => {
                  const selectedRegion = regions.find(r => r.id === selectedRegionId);
                  const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
                  return isBamakoDistrict ? !selectedArrondissementId : !selectedCommuneId;
                })()}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base border-gray-300 focus:ring-investmali-accent disabled:bg-gray-100`}
              >
                <option value="">Sélectionnez un quartier</option>
                {quartiers.map((q: any) => (
                  <option key={q.id} value={q.id} data-code={q.code}>{q.nom}</option>
                ))}
              </select>
            </div>

            {/* Rue de l'entreprise */}
            <div className="animate-slide-up" style={{animationDelay: '0.85s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Rue</label>
              <input
                type="text"
                value={data.companyInfo?.rue || ''}
                onChange={(e) => updateBusinessData('companyInfo', {
                  ...data.companyInfo,
                  rue: e.target.value
                })}
                disabled={false}
                className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base border-gray-300 focus:ring-investmali-accent`}
                placeholder="Nom de la rue"
              />
            </div>

            {/* Porte de l'entreprise */}
            <div className="animate-slide-up" style={{animationDelay: '0.9s'}}>
              <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Porte</label>
              <input
                type="text"
                value={data.companyInfo?.porte || ''}
                onChange={(e) => updateBusinessData('companyInfo', {
                  ...data.companyInfo,
                  porte: e.target.value
                })}
                disabled={false}
                className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base border-gray-300 focus:ring-investmali-accent`}
                placeholder="Numéro de porte"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Étape 4 : Documents
const DocumentsStep: React.FC<{data: BusinessCreationData, updateData: (field: keyof BusinessCreationData, value: any) => void}> = ({ data, updateData }) => {
  const [documentPlans, setDocumentPlans] = useState<Array<{key: string, value: string}>>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const values = await enumService.getDocumentPlans();
        if (isMounted && Array.isArray(values)) {
          // Sort by numeric pages extracted from enum key like _3, _4, _5, _7
          const sorted = [...values].sort((a, b) => {
            const pa = parseInt((a.key.match(/_(\d+)/)?.[1] || '0'), 10);
            const pb = parseInt((b.key.match(/_(\d+)/)?.[1] || '0'), 10);
            return pa - pb;
          });
          setDocumentPlans(sorted);
        }
      } catch (e) {
        // Keep silent fallback; UI will just show empty options
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const pagesFromEnum = (key: string): number | undefined => {
    const m = key.match(/_(\d+)/);
    return m ? parseInt(m[1], 10) : undefined;
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Documents Officiels</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
        {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? 'Seul le certificat de résidence est requis pour les entreprises individuelles.'
          : 'Téléchargez les documents requis pour l\'immatriculation de votre entreprise au Mali.'
        }
      </p>

      {data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Statuts de la société */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-investmali-accent text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-sm mr-2 sm:mr-3">📄</span>
              Statuts de la Société
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-sm">
              Document constitutif définissant l'organisation et le fonctionnement de votre société.
            </p>
          
          {/* Options pour les statuts */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <input
                type="radio"
                id="upload-statutes"
                name="statutes-option"
                checked={!data.documents?.needsStatutesDrafting}
                onChange={() => {
                  updateData('documents', {
                    ...data.documents,
                    needsStatutesDrafting: false,
                    statutesPages: undefined
                  });
                }}
                className="mt-1 w-4 h-4 text-investmali-accent bg-gray-100 border-gray-300 focus:ring-investmali-accent focus:ring-2"
              />
              <div className="flex-1">
                <label htmlFor="upload-statutes" className="block text-sm sm:text-sm font-medium text-gray-700 cursor-pointer">
                  J'ai déjà mes statuts rédigés
                </label>
                <p className="text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Téléchargez vos statuts existants au format PDF, DOC ou DOCX
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="draft-statutes"
                name="statutes-option"
                checked={data.documents?.needsStatutesDrafting || false}
                onChange={() => {
                  updateData('documents', {
                    ...data.documents,
                    needsStatutesDrafting: true,
                    statutes: null,
                    statutesName: ''
                  });
                }}
                className="mt-1 w-4 h-4 text-investmali-accent bg-gray-100 border-gray-300 focus:ring-investmali-accent focus:ring-2"
              />
              <div className="flex-1">
                <label htmlFor="draft-statutes" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Faire rédiger mes statuts par InvestMali
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Service de rédaction professionnel - <strong className="text-investmali-accent">4 000 FCFA par page</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Upload des statuts existants */}
          {!data.documents?.needsStatutesDrafting && (
            <div className="relative animate-slide-up">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  updateData('documents', {
                    ...data.documents,
                    statutes: file,
                    statutesName: file?.name || ''
                  });
                }}
                className="hidden"
                id="statutes-upload"
              />
              <label
                htmlFor="statutes-upload"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl hover:border-investmali-accent transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 bg-gray-50 hover:bg-investmali-accent/5"
              >
                {data.documents?.statutesName ? (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-investmali-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-investmali-accent font-medium text-xs sm:text-sm text-center">{data.documents.statutesName}</span>
                    <span className="text-sm text-gray-500">(Cliquez pour changer)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm sm:text-sm text-gray-600 text-center">Télécharger vos statuts existants</span>
                  </>
                )}
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Formats acceptés : PDF, DOC, DOCX (max 10MB)
              </p>
            </div>
          )}

          {/* Service de rédaction */}
          {data.documents?.needsStatutesDrafting && (
            <div className="bg-gradient-to-r from-investmali-accent/10 to-investmali-warning/10 p-6 rounded-xl border border-investmali-accent/20 animate-slide-up">
              <div className="flex items-start space-x-4">
                <div className="bg-investmali-accent text-white rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-investmali-neutral-dark mb-2">Service de Rédaction InvestMali</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Nos experts juridiques rédigeront vos statuts selon la législation malienne en vigueur.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Nombre de pages estimé pour vos statuts
                    </label>
                    <select
                      value={data.documents?.statutesPages || ''}
                      onChange={(e) => {
                        updateData('documents', {
                          ...data.documents,
                          statutesPages: parseInt(e.target.value) || undefined
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent"
                    >
                      <option value="">Sélectionnez le nombre de pages</option>
                      {documentPlans.map((plan) => {
                        const pages = pagesFromEnum(plan.key);
                        if (!pages) return null;
                        return (
                          <option key={plan.key} value={pages}>{plan.value}</option>
                        );
                      })}
                    </select>
                  </div>
                  
                  {data.documents?.statutesPages && (
                    <div className="bg-white p-4 rounded-lg border border-investmali-accent/30 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Coût estimé :</span>
                        <span className="text-xl font-bold text-investmali-accent">
                          {(data.documents.statutesPages * 3500).toLocaleString()} FCFA
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Tarif : 3500 FCFA par page • Délai : 2-3 jours ouvrables
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Inclus :</strong> Rédaction conforme, révisions illimitées, format officiel pour dépôt
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registre de commerce */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h3 className="text-xl font-semibold text-investmali-neutral-dark mb-4 flex items-center">
            <span className="bg-investmali-warning text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">🏪</span>
            Registre de Commerce
          </h3>
          
          <div className="mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.documents?.hasCommerceRegistry || false}
                onChange={(e) => {
                  updateData('documents', {
                    ...data.documents,
                    hasCommerceRegistry: e.target.checked,
                    commerceRegistry: e.target.checked ? data.documents?.commerceRegistry : null,
                    commerceRegistryName: e.target.checked ? data.documents?.commerceRegistryName : ''
                  });
                }}
                className="w-4 h-4 text-investmali-accent bg-gray-100 border-gray-300 rounded focus:ring-investmali-accent focus:ring-2"
              />
              <span className="text-gray-700">J'ai déjà un registre de commerce</span>
            </label>
          </div>

          {data.documents?.hasCommerceRegistry && (
            <div className="relative animate-slide-up">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  updateData('documents', {
                    ...data.documents,
                    commerceRegistry: file,
                    commerceRegistryName: file?.name || ''
                  });
                }}
                className="hidden"
                id="commerce-registry-upload"
              />
              <label
                htmlFor="commerce-registry-upload"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl hover:border-investmali-warning transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 bg-gray-50 hover:bg-investmali-warning/5"
              >
                {data.documents?.commerceRegistryName ? (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-investmali-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-investmali-warning font-medium text-sm sm:text-sm text-center">{data.documents.commerceRegistryName}</span>
                    <span className="text-sm text-gray-500">(Cliquez pour changer)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm sm:text-sm text-gray-600 text-center">Télécharger le registre de commerce</span>
                  </>
                )}
              </label>
              <p className="text-sm text-gray-500 mt-1 sm:mt-2">
                Formats acceptés : PDF, JPG, PNG (max 5MB)
              </p>
            </div>
          )}
          
          {!data.documents?.hasCommerceRegistry && (
            <div className="bg-sky-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
              <p className="text-blue-800 text-sm">
                <strong>Information :</strong> Si vous n'avez pas encore de registre de commerce, 
                InvestMali vous aidera dans les démarches d'immatriculation.
              </p>
            </div>
          )}
        </div>


        {/* Résumé des documents */}
        <div className="bg-gradient-to-r from-investmali-accent/10 to-investmali-warning/10 p-6 rounded-2xl border border-investmali-accent/20 animate-slide-up" style={{animationDelay: '0.5s'}}>
          <h4 className="text-lg font-semibold text-investmali-neutral-dark mb-3 flex items-center">
            <span className="bg-investmali-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">✓</span>
            Documents Téléchargés
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              data.documents?.statutesName 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              <div className="flex items-center space-x-2">
                {data.documents?.statutesName ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Statuts</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              data.documents?.commerceRegistryName || !data.documents?.hasCommerceRegistry
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              <div className="flex items-center space-x-2">
                {data.documents?.commerceRegistryName || !data.documents?.hasCommerceRegistry ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Registre Commerce</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              data.documents?.residenceCertificateName 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              <div className="flex items-center space-x-2">
                {data.documents?.residenceCertificateName ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Certificat Résidence</span>
              </div>
            </div>
          </div>

          {/* Soumission déplacée vers SummaryAndSubmissionStep */}
        </div>
        </div>
      )}


      {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-800">Entreprise Individuelle</h3>
              <p className="text-blue-600 font-medium">
                Le certificat de résidence est requis dans l'étape "Dirigeant de l'Entreprise" pour la création d'une entreprise individuelle.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Étape 5 : Récapitulatif et Soumission
const SummaryAndSubmissionStep: React.FC<{
  data: BusinessCreationData, 
  updateData: (field: keyof BusinessCreationData, value: any) => void, 
  submitTrigger?: number,
  personalLocationName?: string,
  companyLocationName?: string
}> = ({ data, updateData, submitTrigger, personalLocationName, companyLocationName }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{step: number, title: string, errors: string[]}[]>([]);

  // Fonction de validation complète de toutes les étapes
  const validateAllSteps = (): {step: number, title: string, errors: string[]}[] => {
    const allErrors: {step: number, title: string, errors: string[]}[] = [];

    // Étape 2: Informations Personnelles
    const personalErrors: string[] = [];
    const personal = data.personalInfo;
    if (!personal?.civility) personalErrors.push('Civilité non renseignée');
    if (!personal?.firstName) personalErrors.push('Prénom non renseigné');
    if (!personal?.lastName) personalErrors.push('Nom non renseigné');
    if (!personal?.phone) personalErrors.push('Téléphone non renseigné');
    if (!personal?.birthDate) personalErrors.push('Date de naissance non renseignée');
    if (!personal?.birthPlace) personalErrors.push('Lieu de naissance non renseigné');
    if (!personal?.divisionId) personalErrors.push('Localisation non renseignée (Région, Cercle, Commune, Quartier)');
    
    // Validation du format email (optionnel mais doit être valide si renseigné)
    if (personal?.email && personal.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personal.email)) {
        personalErrors.push('L\'adresse email n\'est pas valide (format attendu: exemple@domaine.com)');
      }
    }
    
    // Validation de l'âge minimum (18 ans)
    if (personal?.birthDate) {
      const birthDate = new Date(personal.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        personalErrors.push('L\'utilisateur doit avoir au moins 18 ans');
      }
    }
    
    if (personalErrors.length > 0) {
      allErrors.push({ step: 2, title: 'Informations Personnelles', errors: personalErrors });
    }

    // Étape 3: Informations Société
    const companyErrors: string[] = [];
    const company = data.companyInfo;
    if (!company?.typeEntreprise) companyErrors.push('Type d\'entreprise non sélectionné');
    if (!company?.formeJuridique) companyErrors.push('Forme juridique non sélectionnée');
    if (company?.typeEntreprise === 'SOCIETE' && !company?.nom) companyErrors.push('Nom de l\'entreprise non renseigné');
    if (!company?.domaineActiviteNr) companyErrors.push('Domaine d\'activité non sélectionné');
    
    // Validation localisation entreprise si adresse différente
    if (personal?.hasDifferentAddress === true) {
      if (!company?.regionId && !company?.divisionCode) companyErrors.push('Région de l\'entreprise non sélectionnée');
      if (!company?.cercleId && !company?.arrondissementId && !company?.divisionCode) companyErrors.push('Cercle/Arrondissement de l\'entreprise non sélectionné');
      if (!company?.communeId && !company?.divisionCode) companyErrors.push('Commune de l\'entreprise non sélectionnée');
      if (!company?.quartierId && !company?.divisionCode) companyErrors.push('Quartier de l\'entreprise non sélectionné');
    }
    
    if (companyErrors.length > 0) {
      allErrors.push({ step: 3, title: 'Informations Société', errors: companyErrors });
    }

    // Étape 4: Participants
    const participantErrors: string[] = [];
    const participants = data.participants;
    const isEntrepriseIndividuelle = company?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    
    if (!participants || participants.length === 0) {
      participantErrors.push('Aucun participant ajouté');
    } else {
      const gerants = participants.filter(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
      
      if (isEntrepriseIndividuelle) {
        if (gerants.length !== 1) participantErrors.push('Une entreprise individuelle doit avoir exactement un promoteur');
      } else {
        if (gerants.length !== 1) participantErrors.push('Exactement un gérant est requis pour une société');
      }
      
      const totalParts = participants.reduce((sum, p) => sum + (p.pourcentageParts || 0), 0);
      if (Math.abs(totalParts - 100) > 0.01) {
        participantErrors.push(`La somme des parts doit être égale à 100% (actuellement: ${totalParts}%)`);
      }
      
      // Validation des documents pour chaque participant
      participants.forEach((p, index) => {
        const participantLabel = `Participant ${index + 1}`;
        
        if (p.civilite === 'PERSONNE_MORALE') {
          if (!p.rccmFile) participantErrors.push(`${participantLabel}: Document RCCM manquant`);
        } else {
          if (!p.typePiece) participantErrors.push(`${participantLabel}: Type de pièce d'identité non sélectionné`);
          if (!p.documentFile) participantErrors.push(`${participantLabel}: Document d'identité manquant`);
          
          // Documents requis pour les gérants/promoteurs
          if (p.role === 'GERANT' || p.role === 'PROMOTEUR') {
            // Vérifier que la question casier judiciaire a été répondue
            if (p.hasCriminalRecord === undefined || p.hasCriminalRecord === null) {
              participantErrors.push(`${participantLabel}: Veuillez répondre à la question "Avez-vous un extrait de casier judiciaire ?"`);
            }
            
            if (!p.extraitNaissanceFile) participantErrors.push(`${participantLabel}: Extrait de naissance manquant`);
            // Certificat de nationalité: vérifier pieceNationaliteFile OU certificatNationaliteFile
            if (!p.certificatNationaliteFile && !p.pieceNationaliteFile) participantErrors.push(`${participantLabel}: Certificat de nationalité manquant`);
            
            // Si oui au casier judiciaire -> casier obligatoire
            if (p.hasCriminalRecord === true && !p.casierJudiciaireFile) {
              participantErrors.push(`${participantLabel}: Casier judiciaire manquant (vous avez indiqué en avoir un)`);
            }
            
            // Si non au casier judiciaire -> déclaration sur l'honneur obligatoire
            if (p.hasCriminalRecord === false && !p.declarationHonneurFile && !p.signatureDataUrl) {
              participantErrors.push(`${participantLabel}: Déclaration sur l'honneur manquante (vous avez indiqué ne pas avoir de casier judiciaire)`);
            }
            
            if (p.isMarried === true && !p.acteMariageFile) {
              participantErrors.push(`${participantLabel}: Acte de mariage manquant (vous avez indiqué être marié(e))`);
            }
          }
        }
      });
    }
    
    if (participantErrors.length > 0) {
      allErrors.push({ step: 4, title: 'Participants', errors: participantErrors });
    }

    return allErrors;
  };
  // Listes pour les sélecteurs en cascade
  const [regions, setRegions] = useState<any[]>([]);
  const [cercles, setCercles] = useState<any[]>([]);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [quartiers, setQuartiers] = useState<any[]>([]);
  
  // Variables d'état pour les IDs sélectionnés (UUIDs pour API)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedCercleId, setSelectedCercleId] = useState<string>('');
  const [selectedArrondissementId, setSelectedArrondissementId] = useState<string>('');
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>('');
  const [selectedQuartierId, setSelectedQuartierId] = useState<string>('');
  
  // Variables d'état pour les codes sélectionnés (codes numériques pour divisionCode)
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('');
  const [selectedCercleCode, setSelectedCercleCode] = useState<string>('');
  const [selectedArrondissementCode, setSelectedArrondissementCode] = useState<string>('');
  const [selectedCommuneCode, setSelectedCommuneCode] = useState<string>('');
  const [selectedQuartierCode, setSelectedQuartierCode] = useState<string>('');

  // Charger les régions au montage
  useEffect(() => {
    let mounted = true;
    divisionService.getRegions().then((res: any[]) => {
      if (mounted) setRegions(res || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Charger cercles quand selectedRegionId change
  useEffect(() => {
    let mounted = true;
    if (selectedRegionId) {
      const region = regions.find(r => r.id === selectedRegionId);
      const regionCode = selectedRegionCode || region?.code;
      if (regionCode) {
        divisionService.getCerclesByRegion(regionCode).then((res: any[]) => {
          if (mounted) setCercles(res || []);
        }).catch(() => {});
      }
    } else {
      setCercles([]);
      setArrondissements([]);
      setCommunes([]);
      setQuartiers([]);
      setSelectedCercleId('');
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedRegionId]);

  // Charger arrondissements quand selectedCercleId change
  useEffect(() => {
    let mounted = true;
    if (selectedCercleId) {
      divisionService.getArrondissementsByCercle(selectedCercleId).then((res: any[]) => {
        if (mounted) setArrondissements(res || []);
      }).catch(() => {});
    } else {
      setArrondissements([]);
      setCommunes([]);
      setQuartiers([]);
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedCercleId]);

  // Charger communes quand selectedArrondissementId change
  useEffect(() => {
    let mounted = true;
    if (selectedArrondissementId) {
      divisionService.getCommunesByArrondissement(selectedArrondissementId).then((res: any[]) => {
        if (mounted) setCommunes(res || []);
      }).catch(() => {});
    } else {
      setCommunes([]);
      setQuartiers([]);
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedArrondissementId]);

  // Charger quartiers quand selectedCommuneId change
  useEffect(() => {
    let mounted = true;
    if (selectedCommuneId) {
      divisionService.getQuartiersByCommune(selectedCommuneId).then((res: any[]) => {
        if (mounted) setQuartiers(res || []);
      }).catch(() => {});
    } else {
      setQuartiers([]);
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedCommuneId]);

  // Helper pour vérifier si l'activité nécessite une autorisation d'exercice
  const requiresExerciseAuthorization = () => {
    const selectedNr = data.companyInfo?.domaineActiviteNr;
    return selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0;
  };

  // Fonction de soumission de l'entreprise
  const handleSubmitEntreprise = async () => {
    // Valider toutes les étapes avant de soumettre
    const errors = validateAllSteps();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setSubmitError('Veuillez corriger les erreurs ci-dessous avant de soumettre votre demande.');
      return;
    }
    
    setValidationErrors([]);
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    // Vérifier l'unicité du nom et domaine d'activité pour cet utilisateur
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (currentUser.personne_id && token) {
        const nomEntreprise = data.companyInfo?.nom || '';
        const domaineActivite = data.companyInfo?.domaineActivite || '';
        
        const checkUrl = `/api/v1/entreprises/check-uniqueness?personId=${currentUser.personne_id}&nom=${encodeURIComponent(nomEntreprise)}&domaineActivite=${encodeURIComponent(domaineActivite)}`;
        
        const checkResponse = await fetch(checkUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          
          if (!checkResult.canCreate) {
            const conflictMessages = checkResult.conflicts || [];
            setSubmitError(`❌ Impossible de créer cette entreprise:\n${conflictMessages.join('\n')}\n\nVeuillez choisir un nom d'entreprise et/ou un domaine d'activité différent de vos entreprises existantes.`);
            setSubmitting(false);
            return;
          }
        }
      }
    } catch (checkError) {
      console.warn('⚠️ Erreur lors de la vérification d\'unicité:', checkError);
      // Continuer quand même si la vérification échoue
    }

    try {
      // ÉTAPE 1: Sauvegarder les informations personnelles (incluant le champ 'porte')
      console.log('🔍 [SUBMIT] Sauvegarde des informations personnelles avec porte:', data.personalInfo?.porte);
      if (data.personalInfo) {
        try {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const token = localStorage.getItem('token');
          
          if (token && currentUser.personne_id && data.personalInfo.isForSelf) {
            // Convertir le téléphone au format E.164 requis
            let formattedPhone = '';
            if (data.personalInfo.phone) {
              const cleanPhone = data.personalInfo.phone.replace(/[\s\-\.]/g, '');
              if (cleanPhone.startsWith('+')) {
                formattedPhone = cleanPhone; // Déjà au format E.164
              } else if (cleanPhone.startsWith('223')) {
                formattedPhone = '+' + cleanPhone; // Ajouter le +
              } else {
                formattedPhone = '+223' + cleanPhone; // Ajouter +223
              }
            }

            // Formatage du téléphone 2 au format E.164
            let formattedPhone2 = '';
            if (data.personalInfo.phone2) {
              const cleanPhone2 = data.personalInfo.phone2.replace(/\s/g, '');
              if (cleanPhone2.startsWith('+')) {
                formattedPhone2 = cleanPhone2; // Déjà au format international
              } else if (cleanPhone2.startsWith('223')) {
                formattedPhone2 = '+' + cleanPhone2; // Ajouter le +
              } else {
                formattedPhone2 = '+223' + cleanPhone2; // Ajouter +223
              }
            }

            // Mise à jour des informations personnelles existantes
            // DEBUG: Afficher la valeur brute de l'email avant nettoyage
            console.log('🔍 [DEBUG EMAIL] Valeur brute data.personalInfo.email:', data.personalInfo.email);
            const cleanedEmailValue = cleanAndValidateEmail(data.personalInfo.email);
            console.log('🔍 [DEBUG EMAIL] Valeur après cleanAndValidateEmail:', cleanedEmailValue);
            
            const personUpdateRequest = {
              nom: data.personalInfo.lastName,
              prenom: data.personalInfo.firstName,
              telephone1: formattedPhone,
              telephone2: formattedPhone2,
              email: cleanedEmailValue,
              // Convertir la date en format LocalDate si nécessaire
              dateNaissance: data.personalInfo.birthDate ? new Date(data.personalInfo.birthDate).toISOString().split('T')[0] : null,
              lieuNaissance: data.personalInfo.birthPlace,
              // Mapper la nationalité vers l'enum backend avec valeur par défaut
              nationnalite: data.personalInfo.nationality || 'MALIENNE',
              sexe: data.personalInfo.sexe === 'MASCULIN' ? 'MASCULIN' : data.personalInfo.sexe,
              situationMatrimoniale: data.personalInfo.situationMatrimoniale || 'CELIBATAIRE',
              civilite: data.personalInfo.civility === 'MONSIEUR' ? 'MONSIEUR' : data.personalInfo.civility,
              division_id: data.personalInfo.divisionId,
              localite: data.personalInfo.localite,
              porte: data.personalInfo.porte
            };
            
            console.log('🔍 [SUBMIT] Requête de mise à jour:', personUpdateRequest);
            console.log('🔍 [DEBUG] Valeurs autorisation avant envoi:', {
              requiresExerciseAuthorization: data.personalInfo?.requiresExerciseAuthorization,
              willImportExport: data.personalInfo?.willImportExport
            });
            
            const response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(personUpdateRequest)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('🔍 [SUBMIT] Réponse d\'erreur du backend:', errorText);
              throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            console.log('✅ [SUBMIT] Informations personnelles sauvegardées avec succès');
          }
        } catch (error) {
          console.error('❌ [SUBMIT] Erreur lors de la sauvegarde des informations personnelles:', error);
          setSubmitError('Erreur lors de la sauvegarde des informations personnelles');
          setSubmitting(false);
          return;
        }
      }

      // Variables communes pour toute la fonction
      const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      const gerant = (data.participants || []).find(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
      const gerantId = gerant?.personId || null;
      // Plus de rôle DIRIGEANT - utiliser GERANT ou PROMOTEUR selon le type d'entreprise
      
      // Validation avant soumission: chaque participant doit avoir un document d'identité
      const missingDocs: string[] = [];
      
      (data.participants || []).forEach((p, idx) => {
        const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
        
        // Exclure la validation de document d'identité pour les personnes morales
        if (p.civilite !== 'PERSONNE_MORALE' && !p.documentFile) {
          missingDocs.push(`${label}: document d'identité manquant`);
        }
        
        // Documents requis pour GERANT/PROMOTEUR - uniquement pour les personnes physiques
        const requiresManagerDocuments = (p.role === 'GERANT' || p.role === 'PROMOTEUR') && p.civilite !== 'PERSONNE_MORALE';
        
        // Utiliser les valeurs du participant (p.hasCriminalRecord, p.isMarried) au lieu de personalInfo
        if (requiresManagerDocuments && p.hasCriminalRecord === true && !p.casierJudiciaireFile) {
          missingDocs.push(`${label}: casier judiciaire manquant`);
        }
        if (requiresManagerDocuments && p.hasCriminalRecord === false && !p.declarationHonneurFile && !p.signatureDataUrl) {
          missingDocs.push(`${label}: déclaration d'honneur manquante (sans casier judiciaire) - uploadez une déclaration ou signez pour en générer une`);
        }
        if (requiresManagerDocuments && p.isMarried === true && !p.acteMariageFile) {
          missingDocs.push(`${label}: acte de mariage manquant`);
        }
        if (requiresManagerDocuments && !p.extraitNaissanceFile) {
          missingDocs.push(`${label}: extrait de naissance manquant`);
        }
      });
      if (missingDocs.length > 0) {
        setSubmitError(`Documents requis manquants:\n- ${missingDocs.join('\n- ')}`);
        setSubmitting(false);
        return;
      }

      // VALIDATION PRÉALABLE: Vérifier l'unicité des pièces d'identité
      const piecesToCheck = (data.participants || [])
        .filter(p => {
          // Exempter les personnes morales de la validation des pièces d'identité
          if (p.civilite === 'PERSONNE_MORALE') {
            return false;
          }
          return p.numeroPiece && p.typePiece;
        })
        .map(p => ({
          numeroPiece: p.numeroPiece!.trim(),
          typePiece: p.typePiece!
        }));

      if (piecesToCheck.length > 0) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Aucun token trouvé');

        // Vérifier l'unicité des pièces en utilisant l'endpoint de validation
        try {
          const validationResponse = await fetch('/api/v1/validation/check-pieces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pieces: piecesToCheck })
          });

          if (validationResponse.ok) {
            const validationResult = await validationResponse.json();
            
            if (validationResult.success) {
              // Vérifier s'il y a des pièces déjà utilisées
              const usedPieces = Object.entries(validationResult.results || {})
                .filter(([_, isUsed]) => isUsed)
                .map(([numero, _]) => {
                  const piece = piecesToCheck.find(p => p.numeroPiece === numero);
                  return `- ${piece?.typePiece || 'Document'} numéro "${numero}"`;
                });

              if (usedPieces.length > 0) {
                setSubmitError(`❌ Erreur : Les documents d'identité suivants sont déjà utilisés par d'autres utilisateurs :\n${usedPieces.join('\n')}\n\nVeuillez utiliser des documents différents.`);
                setSubmitting(false);
                return;
              }
            }
          } else {
          }
        } catch (e) {
        }

      }

      // WORKFLOW ÉTAPE 3.5: Traiter les associés existants (mise à jour des données manquantes)
      if (!isEntrepriseIndividuelle) {
        // Traitement des associés existants (mise à jour des données manquantes)
        const associates = data.participants?.filter(p => p.role === 'ASSOCIE') || [];

        for (const associate of associates) {
          
          // Si l'associé a déjà un personId, vérifier s'il a besoin d'une mise à jour
          if (associate.personId) {
            
            const currentUser = authAPI.getCurrentUser();
            const isCurrentUser = currentUser && (currentUser.personne_id === associate.personId || currentUser.personneId === associate.personId);
            
            if (isCurrentUser) {
              
              // Vérifier si l'utilisateur a besoin d'une mise à jour (données manquantes)
              const needsUpdate = !currentUser.dateNaissance || 
                                 !currentUser.lieuNaissance || 
                                 !currentUser.nationnalite ||
                                 !currentUser.sexe ||
                                 !currentUser.situationMatrimoniale;
              
              if (needsUpdate) {
                
                // Mettre à jour avec les données du formulaire
                const updateRequest = {
                  nom: associate.nom || currentUser.nom,
                  prenom: associate.prenom || currentUser.prenom,
                  telephone1: associate.telephone || currentUser.telephone1,
                  email: cleanAndValidateEmail(associate.email) || cleanAndValidateEmail(currentUser.email),
                  dateNaissance: ensureAdultBirthDate(associate.dateNaissance) || ensureAdultBirthDate(currentUser.dateNaissance),
                  lieuNaissance: associate.lieuNaissance || currentUser.lieuNaissance,
                  nationnalite: associate.nationnalite || currentUser.nationnalite || 'MALIENNE',
                  sexe: associate.sexe || currentUser.sexe,
                  situationMatrimoniale: associate.situationMatrimoniale || currentUser.situationMatrimoniale || 'CELIBATAIRE',
                  civilite: mapCivilityToBackend(associate.civilite || 'MONSIEUR') || currentUser.civilite,
                  division_id: associate.divisionId || associate.division_id || currentUser.division_id,
                  divisionCode: associate.divisionCode || currentUser.divisionCode,
                  localite: associate.localite || currentUser.localite,
                  porte: (associate as any).porte || (currentUser as any).porte
                };
                
                
                const token = localStorage.getItem('token');
                const updateResponse = await fetch(`/api/v1/persons/${associate.personId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(updateRequest)
                });
                
                if (updateResponse.ok) {
                  const updatedUser = await updateResponse.json();
                } else {
                  throw new Error('Impossible de mettre à jour les données de l\'associé');
                }
              } else {
              }
            } else {
            }
          }
        }
        
      } else {
      }

      // WORKFLOW ÉTAPE 4: Créer tous les participants qui n'ont pas encore d'ID
      const participantsToCreate = data.participants?.filter(p => !p.personId && p.nom && p.prenom) || [];
      
      for (const participant of participantsToCreate) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Aucun token trouvé');


        // Valider et corriger le format du téléphone
        const participantPhone = participant.telephone || '';
        const validPhone = participantPhone.startsWith('+') ? participantPhone : 
          (participantPhone ? `+223${participantPhone.replace(/\s/g, '')}` : '');

        const personRequest = {
          nom: participant.nom,
          prenom: participant.prenom,
          telephone1: validPhone,
          email: cleanAndValidateEmail(participant.email),
          dateNaissance: participant.dateNaissance || '',
          lieuNaissance: participant.lieuNaissance || '',
          nationnalite: participant.nationnalite || 'MALIENNE',
          sexe: getConsistentSexe(participant.sexe, participant.civilite || 'MONSIEUR'),
          situationMatrimoniale: participant.situationMatrimoniale || 'CELIBATAIRE',
          civilite: mapCivilityToBackend(participant.civilite || 'MONSIEUR'),
          role: 'USER',
          entrepriseRole: participant.role || 'ASSOCIE'
        };


        const response = await fetch('/api/v1/persons', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Erreur création participant ${participant.prenom} ${participant.nom}: ${errorData.message}`);
        }
        
        const result = await response.json();
        
        // Mettre à jour l'ID du participant
        participant.personId = result.id || result.data?.id;
      }


      // WORKFLOW ÉTAPE 5: Soumission finale - POST /api/v1/entreprises/with-documents
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Assembler tous les participants avec leurs IDs
      const allParticipants = data.participants?.map(p => {
        // Valider et nettoyer le rôle
        const validRoles = ['GERANT', 'PROMOTEUR', 'ASSOCIE', 'ADMINISTRATEUR'];
        const cleanRole = p.role?.toString().trim().toUpperCase();
        
        if (!validRoles.includes(cleanRole)) {
          throw new Error(`Rôle invalide pour participant ${p.nom} ${p.prenom}: ${p.role}`);
        }
        
        const result: any = {
          personId: p.personId || '',
          role: cleanRole,
          pourcentageParts: p.pourcentageParts || 0,
          dateDebut: p.dateDebut || new Date().toISOString().split('T')[0],
          dateFin: p.dateFin || '9999-12-31'
        };
        
        // 🔧 AJOUT DES CHAMPS PERSONNELS POUR MISE À JOUR BACKEND
        if (p.dateNaissance && p.dateNaissance !== '') {
          result.dateNaissance = new Date(p.dateNaissance);
        }
        
        if (p.lieuNaissance && p.lieuNaissance !== '') {
          result.lieuNaissance = p.lieuNaissance;
        }
        
        return result;
      }) || [];

      // Ajouter le fondateur s'il n'est pas déjà dans les participants
      if (data.founderId) {
        const founderExists = allParticipants.some(p => p.personId === data.founderId);
        if (!founderExists) {
          const founderParticipant: any = {
            personId: data.founderId,
            role: isEntrepriseIndividuelle ? 'PROMOTEUR' : 'GERANT',
            pourcentageParts: 100 - allParticipants.reduce((sum, p) => sum + p.pourcentageParts, 0),
            dateDebut: new Date().toISOString().split('T')[0],
            dateFin: '9999-12-31'
          };
          
          // 🔧 AJOUT DES CHAMPS PERSONNELS DU FONDATEUR (utilisateur connecté)
          if (data.personalInfo?.birthDate && data.personalInfo.birthDate !== '') {
            founderParticipant.dateNaissance = new Date(data.personalInfo.birthDate);
          }
          
          if (data.personalInfo?.birthPlace && data.personalInfo.birthPlace !== '') {
            founderParticipant.lieuNaissance = data.personalInfo.birthPlace;
          }
          
          allParticipants.push(founderParticipant);
        }
      }

      const entrepriseRequest = {
        // Pour les E.I., si le nom n'est pas renseigné, on envoie null (pas prénom+nom)
        // Pour les sociétés sans nom, on envoie aussi null pour déclencher la validation backend
        nom: data.companyInfo?.nom && data.companyInfo.nom.trim() !== '' 
          ? data.companyInfo.nom.trim() 
          : null,
        sigle: data.companyInfo?.sigle || '',
        adresseDifferentIdentite: data.personalInfo?.hasDifferentAddress || false,
        extraitJudiciaire: data.personalInfo?.hasCriminalRecord || false,
        autorisationGerant: data.personalInfo?.allowsMultipleManagers || false,
        autorisationExercice: data.personalInfo?.requiresExerciseAuthorization || false,
        importExport: data.personalInfo?.willImportExport || false,
        statutSociete: true,
        typeEntreprise: data.companyInfo?.typeEntreprise || 'SOCIETE',
        statutCreation: 'EN_COURS',
        etapeValidation: 'ACCUEIL',
        formeJuridique: data.companyInfo?.formeJuridique || 'SARL',
        domaineActivite: data.companyInfo?.domaineActivite, // Pas de valeur par défaut
        domaineActiviteNr: (() => {
          const value = data.companyInfo?.domaineActiviteNr;
          
          // SOLUTION ROBUSTE: Limiter à 500 caractères maximum (nouvelle limite DB)
          if (!value) {
            return null;
          }
          
          const stringValue = String(value);
                    
          if (stringValue.length > 500) {
            const truncated = stringValue.substring(0, 500);
            return truncated;
          }
          
                    return stringValue;
        })(),
        capitale: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? '0' // Capital à 0 pour les entreprises individuelles
          : (data.companyInfo?.capitale || ''),
        activiteSecondaire: data.companyInfo?.activiteSecondaire || '',
        divisionCode: (() => {
          // Forcer la synchronisation si divisionCode est vide mais qu'on a des données personnelles
          let finalDivisionCode = data.companyInfo?.divisionCode;
          
          if (!finalDivisionCode && data.personalInfo?.hasDifferentAddress === false && data.personalInfo?.divisionId) {
            finalDivisionCode = data.personalInfo.divisionId;
            
            // Mettre à jour immédiatement data.companyInfo
            updateData('companyInfo', {
              ...data.companyInfo,
              divisionCode: finalDivisionCode
            });
          }
          
          return finalDivisionCode || selectedQuartierCode || selectedCommuneCode || selectedArrondissementCode || selectedCercleCode || selectedRegionCode || '';
        })(),
        rue: data.companyInfo?.rue || null,
        porte: data.companyInfo?.porte || null,
        representativeAdresseLibre: data.personalInfo?.adresseLibre || null,
        totalAmount: costs.total, // Ajouter le montant calculé pour la sauvegarde
        participants: allParticipants
      };

      console.log('🔍 [DEBUG] Objet entrepriseRequest avant envoi:', {
        autorisationExercice: entrepriseRequest.autorisationExercice,
        importExport: entrepriseRequest.importExport,
        totalAmount: entrepriseRequest.totalAmount
      });

      // ÉTAPE 5.1: Créer l'entreprise d'abord pour obtenir l'ID
      const response = await createEntreprise(entrepriseRequest);
      const entrepriseId = response.id;
      const entrepriseReference = response.reference || `ENT-${Date.now()}`;
      
      // Helpers locaux
      const safeJson = async (res: Response) => { try { return await res.json(); } catch { return null; } };

      const uploadPieceForParticipant = async (personId: string, typePiece: string, numeroPiece: string, file: File) => {
        // Générer un numéro unique si le numéro fourni est vide, générique ou potentiellement en conflit
        let finalNumeroPiece = numeroPiece;
        if (!numeroPiece || numeroPiece.length < 6 || numeroPiece.includes('123456')) {
          // Générer un numéro plus unique avec UUID partiel et timestamp
          const timestamp = Date.now().toString();
          const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
          const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
          finalNumeroPiece = `${typePiece}${timestamp.slice(-8)}${random}${uuid}`.substring(0, 20);
        }
        
        
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('typePiece', typePiece);
        fd.append('numero', finalNumeroPiece);
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 5);
        fd.append('dateExpiration', exp.toISOString().split('T')[0]);
        fd.append('file', file);
        const res = await fetch('/api/v1/documents/piece', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        if (!res.ok) { const err = await safeJson(res); throw new Error(err?.message || 'Upload pièce échoué'); }
      };

      const uploadDocumentFor = async (personId: string, typeDocument: string, file: File, numero?: string) => {
        console.log(`🔄 [UPLOAD DEBUG] Tentative upload document:`, {
          personId,
          entrepriseId,
          typeDocument,
          numero,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('typeDocument', typeDocument);
        if (numero) fd.append('numero', numero);
        fd.append('file', file);
        
        const res = await fetch('/api/v1/documents/document', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        
        if (!res.ok) { 
          const errorText = await res.text();
          console.error(`❌ [UPLOAD ERROR] ${typeDocument}:`, {
            status: res.status,
            statusText: res.statusText,
            errorText
          });
          
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson?.message || errorText;
          } catch {
            errorMessage = errorText;
          }
          
          throw new Error(errorMessage || `Upload ${typeDocument} échoué`);
        } else {
          console.log(`✅ [UPLOAD SUCCESS] ${typeDocument} uploadé avec succès`);
        }
      };

      // Fonction pour uploader les documents supplémentaires de type AUTRES
      const uploadAutresDocumentFor = async (personId: string, nom: string, description: string, file: File) => {
        console.log(`🔄 [UPLOAD DEBUG] Tentative upload document AUTRES:`, {
          personId,
          entrepriseId,
          nom,
          description,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('nom', nom);
        if (description) fd.append('description', description);
        fd.append('file', file);
        
        const res = await fetch('/api/v1/documents/autres', { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` }, 
          body: fd 
        });
        
        if (!res.ok) { 
          const errorText = await res.text();
          console.error(`❌ [UPLOAD ERROR] AUTRES document "${nom}":`, {
            status: res.status,
            statusText: res.statusText,
            errorText
          });
          
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson?.message || errorText;
          } catch {
            errorMessage = errorText;
          }
          
          throw new Error(errorMessage || `Upload document AUTRES "${nom}" échoué`);
        } else {
          console.log(`✅ [UPLOAD SUCCESS] Document AUTRES "${nom}" uploadé avec succès`);
        }
      };

      // Upload pièces identités
      {
        const list = data.participants || [];
        for (let idx = 0; idx < list.length; idx++) {
          const participant = list[idx];
          
          // Debug détaillé pour chaque participant
          
          if (participant.civilite === 'PERSONNE_MORALE') {
            // Upload du document RCCM pour les personnes morales
            if (participant.rccmFile && participant.personId) {
              try {
                await uploadDocumentFor(participant.personId, 'RCCM', participant.rccmFile, `RCCM-${participant.denominationEntreprise}-${entrepriseReference}`);
              } catch (e) {
                throw new Error(`Erreur upload RCCM ${participant.denominationEntreprise}: ${e}`);
              }
            } else {
            }
          } else if (participant.personId && participant.documentFile && participant.typePiece && participant.numeroPiece) {
            try {
              await uploadPieceForParticipant(participant.personId, participant.typePiece, participant.numeroPiece, participant.documentFile);
            } catch (e) { 
              const errorMessage = e instanceof Error ? e.message : String(e);
              
              // Améliorer le message d'erreur avec les détails de la pièce
              let detailedError = errorMessage;
              if (errorMessage.includes('Cette meme pièce est déjà utiliser') || errorMessage.includes('déjà utiliser')) {
                const participantName = participant.prenom && participant.nom ? `${participant.prenom} ${participant.nom}` : `Participant ${idx + 1}`;
                detailedError = `Le document d'identité de type "${participant.typePiece}" avec le numéro "${participant.numeroPiece}" (pour ${participantName}) est déjà utilisé par un autre utilisateur. Veuillez utiliser un document différent.`;
              }
              
              setSubmitError(`❌ Erreur lors de l'upload du document : ${detailedError}`);
              setSubmitting(false);
              return;
            }
          } else {
          }
        }
      }

      // Documents spécifiques: Gérant (pour toutes les entreprises)
      // Plus de distinction gerant/gérant - utiliser seulement le gérant
      
      // Upload documents personnels du gérant (pour tous types d'entreprise)
      if (gerantId) {
        const businessType = isEntrepriseIndividuelle ? 'entreprise individuelle' : 'société';
        
        if (gerant?.casierJudiciaireFile && data.personalInfo?.hasCriminalRecord) {
          try { 
            await uploadDocumentFor(gerantId, 'CASIER_JUDICIAIRE', gerant.casierJudiciaireFile, `CJ-${entrepriseReference}`); 
          } catch (e) { }
        }
        if (gerant?.acteMariageFile && data.personalInfo?.isMarried) {
          
          // Vérifier le statut matrimonial dans le backend avant upload
          try {
            const personResponse = await fetch(`/api/v1/persons/${gerantId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (personResponse.ok) {
              const personData = await personResponse.json();
              
              if (personData.situationMatrimoniale !== 'MARIE') {
                
                // Corriger le statut matrimonial immédiatement
                try {
                  // Préparer les données en corrigeant le format de date
                  const correctedPersonData = {
                    ...personData,
                    situationMatrimoniale: 'MARIE',
                    // Nettoyer l'email pour éviter d'envoyer un numéro de téléphone
                    email: cleanAndValidateEmail(personData.email)
                  };
                  
                  // Corriger le format de dateNaissance si nécessaire
                  if (correctedPersonData.dateNaissance && typeof correctedPersonData.dateNaissance === 'string') {
                    // Convertir de ISO datetime vers date simple (YYYY-MM-DD)
                    correctedPersonData.dateNaissance = correctedPersonData.dateNaissance.split('T')[0];
                  }
                  
                  
                  const updateResponse = await fetch(`/api/v1/persons/${gerantId}`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(correctedPersonData)
                  });
                  if (updateResponse.ok) {
                  } else {
                    const errorText = await updateResponse.text();
                  }
                } catch (e) {
                }
              }
            }
          } catch (e) {
          }
          
          try { 
            await uploadDocumentFor(gerantId, 'ACTE_MARIAGE', gerant.acteMariageFile, `AM-${entrepriseReference}`); 
          } catch (e) { }
        }
        if (!data.personalInfo?.hasCriminalRecord && gerant?.declarationHonneurFile) {
          try { 
            await uploadDocumentFor(gerantId, 'DECLARATION_HONNEUR', gerant.declarationHonneurFile, `DH-${entrepriseReference}`);
          } catch (e) { }
        }
        if (gerant?.extraitNaissanceFile) {
          try { 
            await uploadDocumentFor(gerantId, 'EXTRAIT_NAISSANCE', gerant.extraitNaissanceFile, `EN-${entrepriseReference}`); 
          } catch (e) { }
        }
        
        // Certificat de résidence (requis pour tous les gérants)
        if (gerant?.certificatResidenceFile) {
          try { 
            await uploadDocumentFor(gerantId, 'CERTIFICAT_RESIDENCE', gerant.certificatResidenceFile, `CR-${entrepriseReference}`); 
          } catch (e) { }
        }
        
        // Pièce de nationalité (requis pour entreprises individuelles)
        if (isEntrepriseIndividuelle && gerant?.pieceNationaliteFile) {
          try { 
            await uploadDocumentFor(gerantId, 'PIECE_NATIONALITE', gerant.pieceNationaliteFile, `PN-${entrepriseReference}`); 
          } catch (e) { }
        }

        // Documents supplémentaires de type AUTRES (pour entreprises individuelles)
        if (isEntrepriseIndividuelle && gerant?.autresDocuments && gerant.autresDocuments.length > 0) {
          console.log(`📎 [UPLOAD DEBUG] Upload de ${gerant.autresDocuments.length} documents supplémentaires AUTRES`);
          
          for (const autreDoc of gerant.autresDocuments) {
            if (autreDoc.file && autreDoc.name) {
              try {
                await uploadAutresDocumentFor(
                  gerantId,
                  autreDoc.name,
                  autreDoc.description || '',
                  autreDoc.file
                );
              } catch (e) {
                console.error(`❌ Erreur upload document AUTRES "${autreDoc.name}":`, e);
                // Ne pas bloquer le processus pour les erreurs de documents supplémentaires
              }
            }
          }
        }
      }

      // Entreprise: statuts / registre (sociétés seulement)
      // IMPORTANT: Pour les entreprises individuelles, ne pas uploader Documents, Statuts, Registre de commerce
      
      if (!isEntrepriseIndividuelle) {
        const docPersonId = gerantId || null;
        
        if (data.documents?.statutes && docPersonId) {
          try { await uploadDocumentFor(docPersonId, 'STATUS_SOCIETE', data.documents.statutes, `STATUTS-${entrepriseReference}`); } catch (e) { }
        }
        if (data.documents?.commerceRegistry && docPersonId) {
          try { await uploadDocumentFor(docPersonId, 'REGISTRE_COMMERCE', data.documents.commerceRegistry, `RC-${entrepriseReference}`); } catch (e) { }
        }
      }

      // Note: Documents personnels du gérant (certificat de résidence, etc.) sont maintenant traités dans la section gérant ci-dessus

      // Message de succès avec notification d'autorisation si nécessaire
      let successMessage = 'Demande soumise et documents envoyés ! Référence: ' + entrepriseReference;
      
      if (requiresExerciseAuthorization()) {
        const selectedNr = data.companyInfo?.domaineActiviteNr;
        const domaineReglemente = DOMAINE_MAPPING[selectedNr!][0];
        const template = AUTORISATION_TEMPLATES[domaineReglemente];
        
        successMessage += `\n\n⚠️ IMPORTANT: Votre activité "${template?.title || 'sélectionnée'}" nécessite une DEMANDE D'AUTORISATION D'EXERCICE.`;
        successMessage += '\n📋 Vous devez maintenant constituer et déposer un dossier de demande d\'autorisation auprès de l\'Agence pour la Promotion des Investissements au Mali (API-Mali).';
        successMessage += '\n📧 Un email de notification vous sera envoyé avec les détails et la procédure à suivre.';
      }
      
      setSubmitSuccess(successMessage);
      
      // Nettoyer le localStorage après une soumission réussie
      localStorage.removeItem('businessCreationData');
      localStorage.removeItem('businessCreationStep');
      
    } catch (error: any) {
      setSubmitError(error?.message || 'Erreur lors de la création de l\'entreprise');
    } finally {
      setSubmitting(false);
    }
  };

  // Déclencheur externe depuis le parent (bouton global)
  useEffect(() => {
    if (submitTrigger) {
      handleSubmitEntreprise();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  const costs = apiUtils.calculateCosts({
    businessType: data.companyInfo?.typeEntreprise === 'SOCIETE' ? 'Société' : 'Individuelle',
    partners: data.participants || [],
    requiresExerciseAuthorization: data.personalInfo?.requiresExerciseAuthorization,
    willImportExport: data.personalInfo?.willImportExport,
  });

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Récapitulatif et Soumission</h2>
      <p className="text-sm sm:text-sm text-gray-600 mb-4 sm:mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
        Vérifiez les informations de votre entreprise avant de soumettre votre demande de création.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Récapitulatif */}
        <div className="space-y-4 sm:space-y-6">
          {/* Informations de l'entreprise */}
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-investmali-accent text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-sm mr-2 sm:mr-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Informations de l'Entreprise
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between">
                <span className="text-sm sm:text-sm text-gray-600">Nom de l'entreprise :</span>
                <span className="text-sm sm:text-sm font-medium text-investmali-neutral-dark">{data.companyInfo?.nom}</span>
              </div>
              {data.companyInfo?.sigle && (
                <div className="flex justify-between">
                  <span className="text-sm sm:text-sm text-gray-600">Sigle :</span>
                  <span className="text-sm sm:text-sm font-medium text-investmali-neutral-dark">{data.companyInfo?.sigle}</span>
                </div>
              )}
              {data.companyInfo?.capitale && data.companyInfo?.typeEntreprise === 'SOCIETE' && (
                <div className="flex justify-between">
                  <span className="text-sm sm:text-sm text-gray-600">Capitale :</span>
                  <span className="text-sm sm:text-sm font-medium text-investmali-neutral-dark">{data.companyInfo?.capitale}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Type d'entreprise :</span>
                <span className="font-medium text-investmali-neutral-dark">
                  {data.companyInfo?.typeEntreprise === 'SOCIETE' ? 'Société' : 'Entreprise Individuelle'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Forme juridique :</span>
                <span className="font-medium text-investmali-neutral-dark">{data.companyInfo?.formeJuridique}</span>
              </div>
              {data.companyInfo?.domaineActivite && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Domaine d'activité réglementé :</span>
                  <span className="font-medium text-investmali-neutral-dark">{data.companyInfo.domaineActivite}</span>
                </div>
              )}
              {data.companyInfo?.domaineActiviteNr && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Domaine d'activité :</span>
                  <span className="font-medium text-investmali-neutral-dark">
                    {DOMAINE_ACTIVITE_NR_LABELS[data.companyInfo.domaineActiviteNr] || data.companyInfo.domaineActiviteNr}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Localisation entreprise :</span>
                <span className="font-medium text-investmali-neutral-dark">{companyLocationName || data.companyInfo?.divisionCode || 'Non spécifiée'}</span>
              </div>
              {data.participants && data.participants.length > 0 && data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
                <div className="flex justify-between">
                  <span className="text-sm sm:text-sm text-gray-600">Nombre de participants :</span>
                  <span className="text-sm sm:text-sm font-medium text-investmali-neutral-dark">{data.participants.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informations personnelles */}
          {data.personalInfo && (
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <h3 className="text-base text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
                <span className="bg-investmali-warning text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Informations Personnelles
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Nom complet :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">
                    {CIVILITE_LABELS[data.personalInfo.civility || ''] || data.personalInfo.civility} {data.personalInfo.firstName} {data.personalInfo.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Fonction :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.personalInfo.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Contact :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.personalInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Localisation personnelle :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{personalLocationName || 'Non spécifiée'}</span>
                </div>
                {data.personalInfo.porte && (
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Porte :</span>
                    <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.personalInfo.porte}</span>
                  </div>
                )}
              </div>
            </div>
          )}



        </div>

        {/* Prochaines étapes */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.6s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-investmali-warning text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Prochaines Étapes
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-investmali-accent text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1">1</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-investmali-neutral-dark">Validation par un agent</p>
                  <p className="text-xs sm:text-sm text-gray-600">Votre dossier sera examiné par nos agents dans les 48h</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1">2</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-700">Paiement des frais</p>
                  <p className="text-xs sm:text-sm text-gray-600">Après validation, vous recevrez un lien de paiement</p>
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">
                      Montant à payer : {costs.total.toLocaleString()} F CFA
                    </p>
                    {costs.total === 180 && (
                      <p className="text-xs text-green-600 mt-1">
                        Montant majoré (autorisation d'exercice ou import/export)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1">3</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-700">Téléchargement des documents</p>
                  <p className="text-xs sm:text-sm text-gray-600">Récupérez vos documents officiels après paiement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations importantes */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200 animate-slide-up" style={{animationDelay: '0.7s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Informations Importantes
            </h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1 flex-shrink-0">!</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-800">Aucun paiement requis maintenant</p>
                  <p className="text-xs sm:text-sm text-gray-600">Le paiement sera demandé uniquement après validation de votre dossier par nos agents.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1 flex-shrink-0">✓</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-800">Validation gratuite</p>
                  <p className="text-xs sm:text-sm text-gray-600">L'examen de votre dossier par nos experts est entièrement gratuit.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1 flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-800">Délai de traitement</p>
                  <p className="text-xs sm:text-sm text-gray-600">Votre demande sera traitée dans un délai maximum de 48 heures ouvrables.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages d'état */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
              {submitError}
            </div>
          )}
          
          {/* Affichage détaillé des erreurs de validation par étape */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 animate-slide-up">
              <h4 className="text-base sm:text-lg font-semibold text-red-800 mb-4 flex items-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Erreurs à corriger avant soumission
              </h4>
              
              <div className="space-y-4">
                {validationErrors.map((stepError, stepIndex) => (
                  <div key={stepIndex} className="bg-white rounded-lg p-3 sm:p-4 border border-red-200">
                    <h5 className="text-sm sm:text-base font-semibold text-red-700 mb-2 flex items-center">
                      <span className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                        {stepError.step}
                      </span>
                      Étape {stepError.step}: {stepError.title}
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-red-600">
                      {stepError.errors.map((error, errorIndex) => (
                        <li key={errorIndex}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setValidationErrors([])}
                className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
              >
                Fermer les erreurs
              </button>
            </div>
          )}
          
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
              {submitSuccess}
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="bg-gradient-to-r from-investmali-accent to-investmali-primary p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg animate-slide-up" style={{animationDelay: '0.8s'}}>
            <button
              onClick={() => handleSubmitEntreprise()}
              disabled={submitting || submitSuccess !== null}
              className="w-full bg-white text-investmali-neutral-dark font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-mali-blue/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-mali-dark"></div>
                  <span className="text-sm sm:text-base">Soumission en cours...</span>
                </>
              ) : submitSuccess ? (
                <>
                  <span className="text-lg sm:text-2xl">✅</span>
                  <span className="text-sm sm:text-base">Demande Soumise avec Succès</span>
                </>
              ) : (
                <>
                  <span className="text-lg sm:text-2xl">📤</span>
                  <span className="text-sm sm:text-base">Soumettre ma Demande</span>
                </>
              )}
            </button>
            <p className="text-white text-xs sm:text-sm text-center mt-2 sm:mt-3 opacity-90">
              {submitSuccess ? (
                "Votre demande a été enregistrée • Suivi disponible dans votre profil"
              ) : (
                "Soumission gratuite • Validation sous 48h • Support dédié"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction pour récupérer le nom de la division depuis l'API INSTAT directement
const getDivisionName = async (divisionCodeOrId: string): Promise<string> => {
  try {
    if (!divisionCodeOrId) return 'Non spécifiée';
    
    // Détecter si c'est un UUID (retourner tel quel car pas supporté par INSTAT)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(divisionCodeOrId);
    if (isUUID) {
      return divisionCodeOrId;
    }
    
    const instatHeaders = {
      'accept': '*/*',
      'Authorization': 'Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw',
      'X-CSRF-TOKEN': ''
    };
    
    // Pour les codes de division, utiliser l'API INSTAT selon la longueur
    const codeLength = divisionCodeOrId.length;
    
    if (codeLength === 2) {
      // Région - Récupérer le nom depuis l'API
      try {
        const response = await fetch('https://apimali.test.instat.ml/api/get/regions', { headers: instatHeaders });
        if (response.ok) {
          const regions = await response.json();
          const region = regions?.find((r: any) => r.code === divisionCodeOrId);
          if (region) return region.nom;
        }
      } catch (e) { console.log('Erreur API régions:', e); }
      return `Région ${divisionCodeOrId}`;
    } else if (codeLength === 4) {
      // Cercle - Récupérer le nom depuis l'API
      const regionCode = divisionCodeOrId.substring(0, 2);
      try {
        const response = await fetch(`https://apimali.test.instat.ml/api/get/cercles/${regionCode}`, { headers: instatHeaders });
        if (response.ok) {
          const cercles = await response.json();
          const cercle = cercles?.find((c: any) => c.code === divisionCodeOrId);
          if (cercle) return cercle.nom;
        }
      } catch (e) { console.log('Erreur API cercles:', e); }
      return `Cercle ${divisionCodeOrId}`;
    } else if (codeLength === 8) {
      // Commune - Récupérer le nom depuis l'API
      const cercleCode = divisionCodeOrId.substring(0, 4);
      try {
        const response = await fetch(`https://apimali.test.instat.ml/api/get/communes/${cercleCode}`, { headers: instatHeaders });
        if (response.ok) {
          const communes = await response.json();
          const commune = communes?.find((c: any) => c.code === divisionCodeOrId);
          if (commune) return commune.nom;
        }
      } catch (e) { console.log('Erreur API communes:', e); }
      return `Commune ${divisionCodeOrId}`;
    } else if (codeLength === 12) {
      // Quartier - Extraire le code commune parent
      const communeCode = divisionCodeOrId.substring(0, 8);
      
      try {
        const response = await fetch(`https://apimali.test.instat.ml/api/get/vfq/${communeCode}`, { headers: instatHeaders });
        
        if (response.ok) {
          const quartiers = await response.json();
          
          // Chercher le quartier avec le bon code
          const quartier = quartiers?.find((q: any) => q.code === divisionCodeOrId);
          if (quartier) {
            return quartier.nom;
          }
        }
      } catch (e) { console.log('Erreur API quartiers:', e); }
      
      // Fallback: essayer de récupérer le nom de la commune
      try {
        const cercleCode = divisionCodeOrId.substring(0, 4);
        const response = await fetch(`https://apimali.test.instat.ml/api/get/communes/${cercleCode}`, { headers: instatHeaders });
        if (response.ok) {
          const communes = await response.json();
          const commune = communes?.find((c: any) => c.code === communeCode);
          if (commune) return commune.nom;
        }
      } catch (e) { }
      
      return `Quartier (${divisionCodeOrId})`;
    } else {
      return `Localisation (${divisionCodeOrId})`;
    }
  } catch (error) {
    console.log(`Erreur lors de la récupération du nom de division:`, error);
    return `Localisation (${divisionCodeOrId})`;
  }
};

const BusinessCreation: React.FC = () => {
  console.log('🚀 [BUSINESSCREATION] Composant chargé');
  
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showForm, setShowForm] = useState(true);
  const [isForSelf, setIsForSelf] = useState<boolean | null>(true);
  
  // États pour les noms des divisions
  const [personalLocationName, setPersonalLocationName] = useState<string>('');
  const [companyLocationName, setCompanyLocationName] = useState<string>('');
  
  const [businessData, setBusinessData] = useState<BusinessCreationData>({
    personalInfo: {
      civility: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phone2: '',
      birthDate: '',
      birthPlace: '',
      nationality: '',
      sexe: '',
      situationMatrimoniale: '',
      typePersonne: 'PHYSIQUE' as TypePersonne,
      idType: 'CNI',
      idNumber: '',
      idExpiryDate: '',
      idIssuedAt: '',
      address: '',
      city: '',
      region: '',
      localite: '',
      porte: '',
      divisionId: '',
      position: '',
      powers: [],
      roleId: 0,
      idDocument: null,
      idDocumentName: '',
      isForSelf: false,
      hasDifferentAddress: false,
      hasCriminalRecord: false,
      isMarried: false,
      allowsMultipleManagers: false,
      requiresExerciseAuthorization: false,
      willImportExport: false
    },
    companyInfo: {
      nom: '',
      sigle: '',
      capitale: '',
      activiteSecondaire: '',
      typeEntreprise: 'ENTREPRISE_INDIVIDUELLE' as TypeEntreprise,
      formeJuridique: 'E_I' as FormeJuridique,
      domaineActivite: undefined, // Pas de valeur par défaut - sera défini seulement si nécessaire
      domaineActiviteNr: undefined, // Pas de valeur par défaut
      divisionCode: '',
      adresseDifferentIdentite: false,
      extraitJudiciaire: false,
      autorisationGerant: false,
      autorisationExercice: false,
      importExport: false,
      statutSociete: false,
      statutCreation: 'EN_COURS' as StatutCreation,
      etapeValidation: 'CREATION' as EtapeValidation,
      regionId: '',
      cercleId: '',
      arrondissementId: '',
      communeId: ''
    },
    participants: [],
    documents: {
      statutes: null,
      statutesName: '',
      needsStatutesDrafting: false,
      statutesPages: 0,
      commerceRegistry: null,
      commerceRegistryName: '',
      hasCommerceRegistry: false,
      residenceCertificate: null,
      residenceCertificateName: ''
    },
    payment: {
      method: '',
      phoneNumber: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardName: '',
      totalAmount: 0,
      breakdown: {
        statutesDrafting: 0,
        registrationFees: 0,
        serviceFees: 0
      }
    }
  });

  // Flag pour éviter de sauvegarder pendant la restauration initiale
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Charger les données depuis localStorage au montage du composant
  useEffect(() => {
    console.log('🔄 [LOCALSTORAGE] Tentative de restauration des données...');
    const savedData = localStorage.getItem('businessCreationData');
    const savedStep = localStorage.getItem('businessCreationStep');
    
    console.log('🔄 [LOCALSTORAGE] savedData:', savedData ? 'Trouvé' : 'Non trouvé');
    console.log('🔄 [LOCALSTORAGE] savedStep:', savedStep);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('✅ [LOCALSTORAGE] Données restaurées:', parsedData);
        
        // Supprimer les noms de localisation cachés pour forcer le rechargement depuis l'API
        if (parsedData.personalInfo) {
          delete parsedData.personalInfo.selectedLocationName;
        }
        if (parsedData.companyInfo) {
          delete parsedData.companyInfo.selectedLocationName;
        }
        
        setBusinessData(parsedData);
      } catch (error) {
        console.error('❌ [LOCALSTORAGE] Erreur lors du chargement des données sauvegardées:', error);
      }
    }
    
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      console.log('✅ [LOCALSTORAGE] Étape restaurée:', step);
      setCurrentStep(step);
    }
    
    // Marquer la restauration comme terminée après un court délai
    setTimeout(() => {
      setIsInitialLoad(false);
      console.log('✅ [LOCALSTORAGE] Restauration terminée, sauvegarde automatique activée');
    }, 1000);
  }, []);

  // Sauvegarder les données dans localStorage à chaque modification (sauf pendant le chargement initial)
  useEffect(() => {
    if (!isInitialLoad) {
      console.log('💾 [LOCALSTORAGE] Sauvegarde des données...');
      localStorage.setItem('businessCreationData', JSON.stringify(businessData));
      localStorage.setItem('businessCreationStep', currentStep.toString());
    }
  }, [businessData, currentStep, isInitialLoad]);

  // Division state (backend-driven)
  const [regions, setRegions] = useState<Array<{ id: string; nom: string }>>([]);
  const [cercles, setCercles] = useState<Array<{ id: string; nom: string }>>([]);
  const [arrondissements, setArrondissements] = useState<Array<{ id: string; nom: string }>>([]);
  const [communes, setCommunes] = useState<Array<{ id: string; nom: string }>>([]);
  const [societeJuridictions, setSocieteJuridictions] = useState<string[]>([]);

  // Selected division IDs (used for DTO mapping later)
  const [selectedRegionId, setSelectedRegionId] = useState<string | ''>('');
  const [selectedCercleId, setSelectedCercleId] = useState<string | ''>('');
  const [selectedArrondissementId, setSelectedArrondissementId] = useState<string | ''>('');
  const [selectedCommuneId, setSelectedCommuneId] = useState<string | ''>('');


  // Refs pour les animations GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroFeaturesRef = useRef<HTMLDivElement>(null);
  const scene3DRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const totalSteps = 6;
  const steps = [
    { number: 1, title: 'Identification', icon: '👤' },
    { number: 2, title: 'Informations Personnelles', icon: '📝' },
    { number: 3, title: 'Informations Société', icon: '🏢' },
    { number: 4, title: 'Participants', icon: '👥' },
    { number: 5, title: 'Documents', icon: '📄' },
    { number: 6, title: 'Récapitulatif', icon: '✅' }
  ];

  // Détecter le retour depuis la déclaration sur l'honneur
  useEffect(() => {
    if (location.state?.returnFromDeclaration && location.state?.targetStep) {
      setCurrentStep(location.state.targetStep);
      
      // Nettoyer le state pour éviter de réappliquer
      window.history.replaceState({}, document.title, '/create-business');
    }
  }, [location.state]);

  // Animation d'entrée de la page
  useEffect(() => {
    // Attendre que le DOM soit complètement chargé
    if (!document.body) return;

    const ctx = gsap.context(() => {
      // Timeline principale pour l'entrée
      const tl = gsap.timeline();

      // Animation du logo et header
      if (logoRef.current) {
        tl.fromTo(logoRef.current,
          { opacity: 0, x: -30, scale: 0.8 },
          { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
        );
      }

      // Animation du titre hero
      if (heroTitleRef.current) {
        tl.fromTo(heroTitleRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
          "-=0.3"
        );
      }

      // Animation du sous-titre hero
      if (heroSubtitleRef.current) {
        tl.fromTo(heroSubtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        );
      }

      // Animation des features hero
      tl.fromTo(heroFeaturesRef.current?.children || [],
        { opacity: 0, x: -20, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" },
        "-=0.3"
      );

      // Animation de la scène 3D
      tl.fromTo(scene3DRef.current,
        { opacity: 0, x: 50, rotationY: -15 },
        { opacity: 1, x: 0, rotationY: 0, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      );

      // Animation de la barre de progression
      tl.fromTo(progressRef.current?.children || [],
        { opacity: 0, y: -20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.2"
      );

      // Animation du contenu principal
      tl.fromTo(contentRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
        "-=0.2"
      );

      // Animation des boutons de navigation
      tl.fromTo(navigationRef.current?.children || [],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.1"
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Charger les formes juridiques (SocieteJuridiction) lorsque le type = 'societe'
  useEffect(() => {
    const loadJuridictions = async () => {
      if (businessData.companyInfo?.typeEntreprise === 'SOCIETE') {
        try {
          const values = await enumService.getSocieteJuridictions();
          setSocieteJuridictions(Array.isArray(values) ? values : []);
        } catch (e) {
          setSocieteJuridictions([]);
        }
      } else {
        setSocieteJuridictions([]);
      }
    };
    loadJuridictions();
  }, [businessData.companyInfo?.typeEntreprise]);

  // Load regions on mount
  useEffect(() => {
    (async () => {
      try {
        const regionList = await divisionService.getRegions();
        setRegions(regionList || []);
      } catch (e) {
      }
    })();
  }, []);

  // Cascade: region -> cercles
  useEffect(() => {
    if (!selectedRegionId) {
      setCercles([]); setArrondissements([]); setCommunes([]);
      setSelectedCercleId(''); setSelectedArrondissementId(''); setSelectedCommuneId('');
      return;
    }
    (async () => {
      try {
        const region = regions.find(r => r.id === selectedRegionId);
        if (!region) return;
        // Les régions de l'API ont un champ 'code' - vérifier le type
        const regionCode = (region as any).code;
        if (!regionCode) return;
        const list = await divisionService.getCerclesByRegion(regionCode);
        setCercles(list || []);
        setArrondissements([]); setCommunes([]);
        setSelectedCercleId(''); setSelectedArrondissementId(''); setSelectedCommuneId('');
      } catch (e) { }
    })();
  }, [selectedRegionId]);

  // Cascade: cercle -> arrondissements
  useEffect(() => {
    if (!selectedCercleId) {
      setArrondissements([]); setCommunes([]);
      setSelectedArrondissementId(''); setSelectedCommuneId('');
      return;
    }
    (async () => {
      try {
        const list = await divisionService.getArrondissementsByCercle(selectedCercleId);
        setArrondissements(list || []);
        setCommunes([]);
        setSelectedArrondissementId(''); setSelectedCommuneId('');
      } catch (e) { }
    })();
  }, [selectedCercleId]);

  // Cascade: arrondissement -> communes
  useEffect(() => {
    if (!selectedArrondissementId) {
      setCommunes([]);
      setSelectedCommuneId('');
      return;
    }
    (async () => {
      try {
        const list = await divisionService.getCommunesByArrondissement(selectedArrondissementId);
        setCommunes(list || []);
        setSelectedCommuneId('');
      } catch (e) { }
    })();
  }, [selectedArrondissementId]);

  // Récupérer les noms des divisions pour l'affichage dans le récapitulatif
  useEffect(() => {
    const fetchDivisionNames = async () => {
      // Priorité: selectedLocationName (stocké lors de la sélection) > localite > code
      // Note: L'API INSTAT a des problèmes CORS, donc on utilise les noms stockés
      
      // Récupérer le nom de la localisation personnelle
      if (businessData.personalInfo?.selectedLocationName) {
        setPersonalLocationName(businessData.personalInfo.selectedLocationName);
      } else if (businessData.personalInfo?.localite) {
        setPersonalLocationName(businessData.personalInfo.localite);
      } else if (businessData.personalInfo?.divisionId) {
        // Fallback: afficher le code si pas de nom disponible
        setPersonalLocationName(`Localisation ${businessData.personalInfo.divisionId}`);
      } else {
        setPersonalLocationName('');
      }
      
      // Récupérer le nom de la localisation de l'entreprise
      if (businessData.companyInfo?.selectedLocationName) {
        setCompanyLocationName(businessData.companyInfo.selectedLocationName);
      } else if (businessData.companyInfo?.divisionCode) {
        // Fallback: afficher le code si pas de nom disponible
        setCompanyLocationName(`Localisation ${businessData.companyInfo.divisionCode}`);
      }
    };
    
    fetchDivisionNames();
  }, [businessData.personalInfo?.divisionId, businessData.personalInfo?.selectedLocationName, businessData.companyInfo?.divisionCode, businessData.companyInfo?.selectedLocationName]);

  // Animation lors du changement d'étape
  useEffect(() => {
    if (contentRef.current && document.body) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [currentStep]);

  // Validation par étape (Étape 5 Documents facultative)
  const validateStep = (): string | null => {
    // Étape 5 (Documents) est facultative -> pas de validation bloquante
    if (currentStep === 5) return null;

    // Étape 1: Identification utilisateur
    if (currentStep === 1) {
      if (isForSelf === null) return 'Veuillez indiquer si vous créez cette entreprise pour vous-même.';
      return null;
    }

    // Étape 2: Informations Personnelles
    if (currentStep === 2) {
      const personal = businessData.personalInfo;
      if (!personal) return 'Les informations personnelles sont requises.';
      
      if (!personal.civility) return 'La civilité est requise.';
      if (!personal.firstName) return 'Le prénom est requis.';
      if (!personal.lastName) return 'Le nom est requis.';
      if (!personal.phone) return 'Le téléphone est requis.';
      if (!personal.birthDate) return 'La date de naissance est requise.';
      if (!personal.birthPlace) return 'Le lieu de naissance est requis.';
      
      // Validation du format email (optionnel mais doit être valide si renseigné)
      if (personal.email && personal.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(personal.email)) {
          return 'L\'adresse email n\'est pas valide (format attendu: exemple@domaine.com).';
        }
      }
      
      // Validation de l'âge minimum (18 ans)
      if (personal.birthDate) {
        const birthDate = new Date(personal.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) {
          return 'L\'utilisateur doit avoir au moins 18 ans.';
        }
      }
      
      // Validation de la localisation personnelle (obligatoire)
      if (!personal.divisionId) {
        return 'Votre localisation complète est requise. Veuillez sélectionner Région, Cercle, Commune et Quartier.';
      }
      
      return null;
    }

    // Étape 3: Informations Société
    if (currentStep === 3) {
      const company = businessData.companyInfo;
      if (!company) return "Les informations de l'entreprise sont requises.";
      
      // Le nom d'entreprise n'est requis que pour les sociétés, pas pour les entreprises individuelles
      if (!company.nom && company.typeEntreprise === 'SOCIETE') return "Le nom de l'entreprise est requis.";
      // Le sigle est optionnel
      if (!company.typeEntreprise) return "Le type d'entreprise est requis.";
      if (!company.formeJuridique) return "La forme juridique est requise.";
      
      // Validation du domaine d'activité non réglementé : OBLIGATOIRE
      if (!company.domaineActiviteNr) {
        return "Le domaine d'activité non réglementé est obligatoire.";
      }
      
      // Validation du domaine d'activité réglementé si nécessaire
      const selectedNr = company.domaineActiviteNr;
      const requiresRegulatedDomain = selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0;
      
      if (requiresRegulatedDomain && !company.domaineActivite) {
        return `Le domaine d'activité réglementé est requis pour ${selectedNr}.`;
      }
      
      // Validation de la localisation : SEULEMENT si l'adresse de l'entreprise est différente de l'adresse personnelle
      const hasDifferentAddress = businessData.personalInfo?.hasDifferentAddress;
      const personalHasLocation = businessData.personalInfo?.divisionId || businessData.personalInfo?.localite;
      
      // Si même adresse que la personne, pas besoin de valider la localisation entreprise
      if (hasDifferentAddress === false) {
        if (!personalHasLocation) {
          return "Vous avez choisi la même adresse pour l'entreprise, mais votre localisation personnelle n'est pas définie. Retournez à l'étape précédente pour saisir votre localisation.";
        }
        // Synchronisation activée et localisation personnelle définie - OK
        return null;
      }
      
      // Si adresse différente, valider les champs de localisation entreprise
      const missingFields: string[] = [];
      
      if (!company.regionId && !company.divisionCode) {
        missingFields.push("Région");
      }
      if (!company.cercleId && !company.arrondissementId && !company.divisionCode) {
        missingFields.push("Cercle/Arrondissement");
      }
      if (!company.communeId && !company.divisionCode) {
        missingFields.push("Commune");
      }
      if (!company.quartierId && !company.divisionCode) {
        missingFields.push("Quartier");
      }
      
      if (missingFields.length > 0) {
        return `Les champs suivants sont obligatoires : ${missingFields.join(", ")}. Utilisez la recherche rapide ou les sélecteurs pour renseigner la localisation.`;
      }
      
      return null;
    }

    // Étape 4: Participants
    if (currentStep === 4) {
      const participants = businessData.participants;
      if (!participants || participants.length === 0) return 'Au moins un participant est requis.';
      
      const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      const gerants = participants.filter(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
      // Plus de rôle DIRIGEANT - tous sont maintenant GERANT, PROMOTEUR ou ASSOCIE
      
      if (isEntrepriseIndividuelle) {
        // Entreprise individuelle : 1 promoteur seulement
        if (gerants.length !== 1) return 'Une entreprise individuelle doit avoir exactement un promoteur.';
      } else {
        // Société : 1 gérant (peut être le seul participant pour une société unipersonnelle)
        if (gerants.length !== 1) return 'Exactement un gérant est requis pour une société.';
        // Le gérant peut être le seul participant - pas besoin d'associés obligatoires
      }
      
      const totalParts = participants.reduce((sum, p) => sum + (p.pourcentageParts || 0), 0);
      if (Math.abs(totalParts - 100) > 0.01) return 'La somme des parts doit être égale à 100%.';
      
      // Validation des documents requis pour chaque participant
      const documentErrors: string[] = [];
      participants.forEach((p) => {
        // Validation des documents selon le type de personne
        if (p.civilite === 'PERSONNE_MORALE') {
          // Pour les personnes morales, vérifier le document RCCM
          if (!p.rccmFile) {
            documentErrors.push("Document RCCM obligatoire pour les personnes morales");
          }
        } else {
          // Pour les personnes physiques, vérifier le document d'identité
          if (!p.typePiece || !p.documentFile) {
            documentErrors.push("Type de pièce d'identité et document sont obligatoires");
          }
        }
        
        // Documents requis pour les gérants/promoteurs - uniquement pour les personnes physiques
        const requiresManagerDocuments = (p.role === 'GERANT' || p.role === 'PROMOTEUR') && p.civilite !== 'PERSONNE_MORALE';
        
        // Vérifier que la question casier judiciaire a été répondue
        if (requiresManagerDocuments && (p.hasCriminalRecord === undefined || p.hasCriminalRecord === null)) {
          documentErrors.push("Veuillez répondre à la question 'Avez-vous un extrait de casier judiciaire ?'");
        }
        
        // Vérifier si le participant a répondu à la question casier judiciaire (valeur par défaut: false)
        if (requiresManagerDocuments && p.hasCriminalRecord === true && !p.casierJudiciaireFile) {
          documentErrors.push("Casier judiciaire requis");
        }
        if (requiresManagerDocuments && p.hasCriminalRecord === false && !p.declarationHonneurFile && !p.signatureDataUrl) {
          documentErrors.push("Déclaration d'honneur ou signature requise (sans casier judiciaire)");
        }
        // Utiliser isMarried pour la validation de l'acte de mariage
        if (requiresManagerDocuments && p.isMarried === true && !p.acteMariageFile) {
          documentErrors.push("Acte de mariage requis");
        }
        if (requiresManagerDocuments && !p.extraitNaissanceFile) {
          documentErrors.push("Extrait de naissance requis");
        }
        // Certificat de nationalité: vérifier pieceNationaliteFile OU certificatNationaliteFile
        if (requiresManagerDocuments && !p.certificatNationaliteFile && !p.pieceNationaliteFile) {
          documentErrors.push("Certificat de nationalité requis");
        }
        // Certificat de résidence requis seulement si le gérant n'est pas de nationalité malienne
        if (requiresManagerDocuments && !p.certificatResidenceFile) {
          const gerantNationality = p.nationnalite || businessData.personalInfo?.nationality || 'MALIENNE';
          if (gerantNationality.toUpperCase() !== 'MALIENNE') {
            documentErrors.push("Certificat de résidence requis (nationalité non malienne)");
          }
        }
      });
      
      if (documentErrors.length > 0) {
        return `Documents manquants :\n• ${documentErrors.join('\n• ')}`;
      }
      
      return null;
    }

    // Étape 5: pas de "Suivant" (soumission)
    return null;
  };

  const [stepError, setStepError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  // Function to check if we can proceed to next step
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        // Étape 1: Identification - vérifier que l'utilisateur a choisi
        return isForSelf !== null;
      case 2:
        // Étape 2: Informations Personnelles - Vérifier que tous les champs obligatoires sont remplis
        const personal = businessData.personalInfo;
        return personal?.firstName && 
               personal?.lastName && 
               personal?.birthDate &&
               personal?.birthPlace &&
               personal?.divisionId;
      case 3:
        // Étape 3: Informations Société - Validation: Domaine d'activité, Région, Cercle/Arrondissement, Commune, Quartier obligatoires
        const company = businessData.companyInfo;
        const hasDomaineActivite = company?.domaineActiviteNr || company?.domaineActivite;
        const hasRegion = company?.regionId || company?.divisionCode;
        // Pour Bamako: arrondissement requis, sinon cercle requis
        const hasCercleOrArrondissement = company?.cercleId || company?.arrondissementId || company?.divisionCode;
        const hasCommune = company?.communeId || company?.divisionCode;
        const hasQuartier = company?.quartierId || company?.divisionCode;
        
        return hasDomaineActivite && hasRegion && hasCercleOrArrondissement && hasCommune && hasQuartier;
      case 4:
        // Étape 4: Participants
        return businessData.participants && businessData.participants.length > 0;
      case 5:
        return true; // Étape 5: Documents are optional
      case 6:
        return null; // Étape 6: Final step - submit instead
      default:
        return false;
    }
  };

  // Mettre à jour un gerant existant
  const updateDirigeantWorkflow = async (personId: string, gerantData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Reconstruire le numéro complet avec l'indicatif pour la sauvegarde
      // Utiliser Mali par défaut si pas de pays spécifié
      const countryCode = '+223'; // Mali par défaut
      const fullPhoneForUpdateDirigeant = gerantData.phone ? 
        `${countryCode}${gerantData.phone.replace(/\s/g, '')}` : '';

      const personUpdateRequest = {
        nom: gerantData.lastName,
        prenom: gerantData.firstName,
        telephone1: fullPhoneForUpdateDirigeant,
        email: cleanAndValidateEmail(gerantData.email),
        dateNaissance: gerantData.birthDate,
        lieuNaissance: gerantData.birthPlace,
        nationnalite: gerantData.nationality,
        sexe: gerantData.gender,
        situationMatrimoniale: gerantData.maritalStatus,
        civilite: gerantData.civility,
        divisionId: gerantData.divisionId,
        localite: gerantData.localite
      };

      const response = await fetch(`http://localhost:8080/api/v1/persons/${personId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(personUpdateRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  // Étape 5: Soumission finale - POST /api/v1/entreprises
  const submitEntrepriseWorkflow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // VALIDATION PRÉALABLE: Vérifier l'unicité du nom et domaine d'activité pour TOUS les participants
      const nomEntreprise = businessData.companyInfo?.nom || (businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
        ? `${businessData.personalInfo?.firstName || ''} ${businessData.personalInfo?.lastName || ''}`.trim() 
        : '');
      const domaineActivite = businessData.companyInfo?.domaineActivite || businessData.companyInfo?.domaineActiviteNr;
      
      // Collecter tous les personId à vérifier (participants + fondateur + utilisateur connecté)
      const personIdsToCheck = new Set<string>();
      
      // Ajouter les participants
      if (businessData.participants) {
        businessData.participants.forEach(p => {
          if (p.personId) personIdsToCheck.add(p.personId);
        });
      }
      
      // Ajouter le fondateur s'il n'est pas déjà dans les participants
      if (businessData.founderId && !personIdsToCheck.has(businessData.founderId)) {
        personIdsToCheck.add(businessData.founderId);
      }
      
      // Ajouter l'utilisateur connecté (qui pourrait être un participant d'une entreprise existante)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.personne_id && !personIdsToCheck.has(currentUser.personne_id)) {
        personIdsToCheck.add(currentUser.personne_id);
      }
      
      // Vérifier l'unicité pour chaque personne
      for (const personId of Array.from(personIdsToCheck)) {
        try {
          const uniquenessCheck = await businessAPI.checkUniqueness(personId, nomEntreprise, domaineActivite);
          
          if (uniquenessCheck && !uniquenessCheck.canCreate) {
            const conflicts = uniquenessCheck.conflicts || [];
            throw new Error(conflicts.join('\n') || 'Un des participants a déjà une entreprise avec ce nom ou ce domaine d\'activité.');
          }
        } catch (checkError: any) {
          // Si c'est une erreur de validation (pas une erreur réseau), la propager
          if (checkError.message && !checkError.message.includes('fetch')) {
            throw checkError;
          }
          // Sinon, continuer (le backend fera la validation finale)
          console.warn('⚠️ Vérification d\'unicité ignorée pour personId', personId, ':', checkError.message);
        }
      }

      // Assembler tous les participants avec leurs IDs
      const allParticipants = businessData.participants?.map(p => {
        // Valider et nettoyer le rôle
        const validRoles = ['GERANT', 'PROMOTEUR', 'ASSOCIE', 'ADMINISTRATEUR'];
        const cleanRole = p.role?.toString().trim().toUpperCase();
        
        if (!validRoles.includes(cleanRole)) {
          throw new Error(`Rôle invalide pour participant ${p.nom} ${p.prenom}: ${p.role}`);
        }
        
        return {
          personId: p.personId || '',
          role: cleanRole,
          pourcentageParts: p.pourcentageParts || 0,
          dateDebut: p.dateDebut || new Date().toISOString().split('T')[0],
          dateFin: p.dateFin || '9999-12-31'
        };
      }) || [];

      // Ajouter le fondateur s'il n'est pas déjà dans les participants
      if (businessData.founderId) {
        const founderExists = allParticipants.some(p => p.personId === businessData.founderId);
        if (!founderExists) {
          const isEntrepriseIndividuelleLocal = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
          allParticipants.push({
            personId: businessData.founderId,
            role: isEntrepriseIndividuelleLocal ? 'PROMOTEUR' : 'GERANT',
            pourcentageParts: 100 - allParticipants.reduce((sum, p) => sum + p.pourcentageParts, 0),
            dateDebut: new Date().toISOString().split('T')[0],
            dateFin: '9999-12-31'
          });
        }
      }

      const entrepriseRequest = {
        nom: businessData.companyInfo?.nom || (businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? `${businessData.personalInfo?.firstName || ''} ${businessData.personalInfo?.lastName || ''}`.trim() 
          : ''),
        sigle: businessData.companyInfo?.sigle || '',
        capitale: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? '0' 
          : (businessData.companyInfo?.capitale || ''),
        adresseDifferentIdentite: businessData.personalInfo?.hasDifferentAddress || false,
        extraitJudiciaire: businessData.personalInfo?.hasCriminalRecord || false,
        autorisationGerant: businessData.personalInfo?.allowsMultipleManagers || false,
        autorisationExercice: false,
        importExport: businessData.personalInfo?.willImportExport || false,
        statutSociete: true,
        typeEntreprise: businessData.companyInfo?.typeEntreprise || 'SOCIETE',
        statutCreation: 'EN_COURS',
        etapeValidation: 'ACCUEIL',
        formeJuridique: businessData.companyInfo?.formeJuridique || 'SARL',
        domaineActivite: businessData.companyInfo?.domaineActivite,
        domaineActiviteNr: (() => {
          const value = businessData.companyInfo?.domaineActiviteNr;
          
          // SOLUTION ROBUSTE: Limiter à 500 caractères maximum (nouvelle limite DB)
          if (!value) {
            return null;
          }
          
          const stringValue = String(value);
          
          if (stringValue.length > 500) {
            const truncated = stringValue.substring(0, 500);
            return truncated;
          }
          
          return stringValue;
        })(),
        activiteSecondaire: businessData.companyInfo?.activiteSecondaire || '',
        divisionCode: businessData.companyInfo?.divisionCode || '',
        representativeAdresseLibre: businessData.personalInfo?.adresseLibre || null,
        participants: allParticipants
      };


      const response = await fetch('http://localhost:8080/api/v1/entreprises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entrepriseRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      
      // Rediriger vers la page de suivi
      window.location.href = '/tracking';
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  const nextStep = async () => {
    // ÉTAPE 2: Forcer la synchronisation avant validation si nécessaire
    if (currentStep === 2) {
      const hasDifferentAddress = businessData.personalInfo?.hasDifferentAddress;
      const personalHasLocation = businessData.personalInfo?.divisionId || businessData.personalInfo?.localite;
      const companyMissingLocation = !businessData.companyInfo?.divisionCode;
      
      // Si synchronisation activée et divisionCode manquant, forcer la mise à jour
      if (hasDifferentAddress === false && personalHasLocation && companyMissingLocation) {
        
        try {
          if (businessData.personalInfo?.divisionId) {
            const division = await divisionService.getById(businessData.personalInfo.divisionId);
            if (division && division.code) {
              // Mettre à jour le divisionCode immédiatement
              updateBusinessData('companyInfo', {
                ...businessData.companyInfo,
                divisionCode: division.code
              });
              
              // Attendre un peu pour que l'état soit mis à jour
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (error) {
          setStepError("Erreur lors de la synchronisation de la localisation. Veuillez réessayer.");
          setShowValidation(true);
          return;
        }
      }
    }
    
    // Appliquer la validation pour toutes les étapes (y compris 3 et 4)
    const err = validateStep();
    if (err) {
      setStepError(err);
      setShowValidation(true);
      // Faire défiler vers la zone de navigation/erreur
      try {
        navigationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
      return;
    }
    
    setStepError(null);
    setShowValidation(false);
    
    // WORKFLOW ÉTAPE PAR ÉTAPE
    try {
      // ÉTAPE 0: Identification - Pas d'action, juste navigation
      if (currentStep === 0) {
        // Pas d'action nécessaire, juste passer à l'étape suivante
      }
      
      // ÉTAPE 1: Informations personnelles - PUT/POST selon choix utilisateur
      if (currentStep === 1) {
        if (businessData.personalInfo.isForSelf === false && !showForm) {
          setShowForm(true);
          return;
        }
        
        // Sauvegarder les informations personnelles (PUT si isForSelf, POST sinon)
        const savedPerson = await savePersonalInfoWorkflow(businessData.personalInfo);
        if (!savedPerson) return; // Erreur, on s'arrête
        
        // Stocker founderId pour les étapes suivantes
        updateBusinessData('founderId', savedPerson.id || savedPerson.data?.id);
      }
      
      // ÉTAPE 2: Informations entreprise - Validation uniquement
      if (currentStep === 2) {
      }
      
      // ÉTAPE 3: Gestion des associés (seulement pour les sociétés, pas pour entreprise individuelle)
      if (currentStep === 3) {
        const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
        if (!isEntrepriseIndividuelle) {
          await processAssociatesWorkflow();
        }
        // Pour entreprise individuelle, le promoteur sera traité à l'étape 4 après ajout du participant
      }
      
      // ÉTAPE 4: Gestion du gérant/promoteur
      if (currentStep === 4) {
        const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
        const hasGerant = (businessData.participants || []).some(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
        
        if (isEntrepriseIndividuelle && hasGerant) {
          // Pour entreprise individuelle, traiter le promoteur
          await processDirigeantWorkflow();
        } else if (!isEntrepriseIndividuelle && hasGerant) {
          // Pour les sociétés, traiter le gérant
          await processManagerWorkflow();
        }
      }
      
      // ÉTAPE 5: Soumission finale - POST /api/v1/entreprises
      if (currentStep === 5) {
        await submitEntrepriseWorkflow();
        return; // Pas de passage à l'étape suivante
      }
      
    } catch (error) {
      setStepError(error instanceof Error ? error.message : 'Erreur inconnue');
      setShowValidation(true);
      return;
    }
    
    // Passer à l'étape suivante
    if (currentStep < totalSteps) {
      // Sauvegarder les sélections de localisation avant de changer d'étape
      saveCurrentLocationSelections();
      
      // Pour les entreprises individuelles, sauter l'étape 5 (Documents) et aller directement à l'étape 6
      const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      if (currentStep === 4 && isEntrepriseIndividuelle) {
        setCurrentStep(6); // Aller directement à l'étape 6 (Récapitulatif)
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 6));
      }
    }
  };

  // Fonction pour sauvegarder les sélections de localisation actuelles
  const saveCurrentLocationSelections = () => {
    if (currentStep === 3) { // Étape 3: Informations de l'entreprise
      console.log('💾 [NAVIGATION DEBUG] Sauvegarde des sélections de localisation avant navigation');
      
      // Les variables de sélection sont dans le scope du composant CompanyInfoStep
      // Pour l'instant, on sauvegarde seulement ce qui est déjà dans businessData.companyInfo
      const currentCompanyInfo = businessData.companyInfo || {};
      
      console.log('💾 [NAVIGATION DEBUG] Données actuelles de companyInfo:', {
        regionId: currentCompanyInfo.regionId,
        cercleId: currentCompanyInfo.cercleId,
        communeId: currentCompanyInfo.communeId,
        quartierId: currentCompanyInfo.quartierId,
        divisionCode: currentCompanyInfo.divisionCode
      });
      
      // Les données sont déjà sauvegardées par les handlers onChange des sélecteurs
      // Cette fonction sert principalement pour le logging et la validation
    }
  };

  const prevStep = () => {
    // Sauvegarder les sélections de localisation avant de changer d'étape
    saveCurrentLocationSelections();
    
    // Pour les entreprises individuelles, si on est à l'étape 6 (Récapitulatif), revenir à l'étape 4 (Participants) - sauter l'étape 5 (Documents)
    const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    if (currentStep === 6 && isEntrepriseIndividuelle) {
      setCurrentStep(4); // Revenir à l'étape 4 (Participants)
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  // Navigation directe vers une étape spécifique
  const goToStep = (targetStep: number) => {
    // Sauvegarder les sélections de localisation avant de changer d'étape
    saveCurrentLocationSelections();
    
    // Pour les entreprises individuelles, ne pas permettre l'accès à l'étape 5 (Documents)
    const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    if (targetStep === 5 && isEntrepriseIndividuelle) {
      console.log('Navigation vers étape Documents bloquée pour entreprise individuelle');
      return;
    }
    
    // Naviguer vers l'étape cible
    setCurrentStep(targetStep);
    console.log(`Navigation directe vers l'étape ${targetStep}`);
  };

  const updateBusinessData = (field: keyof BusinessCreationData, value: any) => {
    setBusinessData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      return newData;
    });
  };

  // Fonction pour gérer la réponse "Oui, c'est pour moi" / "Non, c'est pour quelqu'un d'autre"
  const handleResponse = async (response: boolean) => {
    console.log('🔍 [DEBUG] handleResponse appelé avec:', response);
    console.log('🔍 [DEBUG] Données avant handleResponse:');
    console.log('  - personalInfo:', JSON.stringify(businessData.personalInfo, null, 2));
    console.log('  - companyInfo:', JSON.stringify(businessData.companyInfo, null, 2));
    
    setIsForSelf(response);
    
    // Si l'utilisateur choisit "Oui, c'est pour moi", on récupère ses informations
    if (response) {
      // Sauvegarder isForSelf dans businessData.personalInfo pour les étapes suivantes
      updateBusinessData('personalInfo', {
        ...businessData.personalInfo,
        isForSelf: response
      });
      console.log('🔍 [DEBUG] Appel fetchCurrentUser...');
      await fetchCurrentUser();
      console.log('🔍 [DEBUG] Données après fetchCurrentUser:');
      console.log('  - personalInfo:', JSON.stringify(businessData.personalInfo, null, 2));
      console.log('  - companyInfo:', JSON.stringify(businessData.companyInfo, null, 2));
    } else {
      // Si l'utilisateur choisit "Non, c'est pour quelqu'un d'autre", on nettoie le formulaire
      updateBusinessData('personalInfo', {
        ...businessData.personalInfo,
        isForSelf: false,
        // Vider les champs personnels pour une nouvelle personne
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        phone2: '',
        birthDate: '',
        birthPlace: '',
        civility: '',
        sexe: '',
        nationality: 'MALIENNE',
        situationMatrimoniale: '',
        localite: '',
        porte: '',
        adresseLibre: '',
        divisionId: '',
        selectedRegionId: '',
        selectedCercleId: '',
        selectedCommuneId: '',
        selectedQuartierId: '',
        hasCriminalRecord: false,
        isMarried: false,
        allowsMultipleManagers: false,
        requiresExerciseAuthorization: false
      });
    }
    
    setShowForm(true);
    // Passer automatiquement à l'étape suivante (étape 2 = Informations Personnelles)
    setCurrentStep(2);
  };

  // Fonction pour récupérer les informations de l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      // Réinitialiser la variable globale
      (window as any).userHasInitialLocationData = false;
      
      // Récupérer l'utilisateur depuis le localStorage
      const currentUser = authAPI.getCurrentUser();
      
      if (currentUser && (currentUser.personne_id || currentUser.personneId)) {
        const personneId = currentUser.personne_id || currentUser.personneId;
        
        // Utiliser l'endpoint /api/v1/persons/personne_id pour récupérer les informations
        const personResponse = await authAPI.getPersonById(personneId);
        
        if (personResponse && personResponse.success) {
          const personData = personResponse.data;
          
          // Détecter le pays à partir du numéro de téléphone
          const detectedCountry = personData.telephone1 ? 
            countries.find(c => personData.telephone1.startsWith(c.code)) || countries[0] : countries[0];
          
          // Extraire le numéro local
          const localPhone = personData.telephone1 ? 
            personData.telephone1.replace(detectedCountry.code, '').replace(/\s/g, '') : '';
          
          // Formater le numéro selon le pays
          let formattedPhone = '';
          if (localPhone) {
            if (detectedCountry.code === '+223' && localPhone.length === 8) {
              formattedPhone = `${localPhone.substring(0, 2)} ${localPhone.substring(2, 4)} ${localPhone.substring(4, 6)} ${localPhone.substring(6, 8)}`;
            } else {
              formattedPhone = localPhone;
            }
          }
          
          // Mettre à jour les données personnelles avec les informations récupérées
          updateBusinessData('personalInfo', {
            ...businessData.personalInfo,
            civility: personData.civilite || '',
            firstName: personData.prenom || '',
            lastName: personData.nom || '',
            email: cleanAndValidateEmail(personData.email) || '',
            phone: formattedPhone,
            phone2: personData.telephone2 || '',
            birthDate: personData.dateNaissance ? personData.dateNaissance.split('T')[0] : '',
            birthPlace: personData.lieuNaissance || '',
            nationality: personData.nationnalite || 'MALIENNE',
            sexe: personData.sexe || '',
            situationMatrimoniale: personData.situationMatrimoniale || 'CELIBATAIRE',
            divisionId: personData.division_id || '',
            localite: personData.localite || '',
            porte: personData.porte || '',
            adresseLibre: personData.adresseLibre || '',
            isForSelf: true
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
    }
  };

  // WORKFLOW FUNCTIONS - Implémentation des étapes du processus

  // Étape 1: Sauvegarder informations personnelles (PUT/POST selon choix)
  const savePersonalInfoWorkflow = async (personalInfo: any) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!token) throw new Error('Aucun token trouvé');

      // Formater le numéro de téléphone au format E.164 (+223 + numéro local)
      let formattedPhone = personalInfo.phone || '';
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        // Nettoyer le numéro (enlever espaces, tirets, etc.)
        formattedPhone = formattedPhone.replace(/[\s\-\.]/g, '');
        // Ajouter l'indicatif +223 si pas déjà présent
        formattedPhone = '+223' + formattedPhone;
      }

      // Validation et logs de débogage pour la date de naissance

      // Diagnostic complet de la date
      if (personalInfo.birthDate) {
        const dateStr = personalInfo.birthDate.toString();
      }

      // Calculer l'âge pour vérification
      if (personalInfo.birthDate) {
        const birthDate = new Date(personalInfo.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
      }

      // Préparer les données selon PersonCreateRequest
      // DEBUG: Afficher la valeur brute de l'email
      console.log('🔍 [SAVE PERSONAL INFO WORKFLOW] personalInfo.email BRUT:', personalInfo.email);
      const cleanedEmailForWorkflow = cleanAndValidateEmail(personalInfo.email);
      console.log('🔍 [SAVE PERSONAL INFO WORKFLOW] Email après cleanAndValidateEmail:', cleanedEmailForWorkflow);
      
      const personRequest = {
        nom: personalInfo.lastName,
        prenom: personalInfo.firstName,
        telephone1: formattedPhone,
        telephone2: personalInfo.phone2 ? (personalInfo.phone2.startsWith('+') ? personalInfo.phone2 : '+223' + personalInfo.phone2.replace(/\s/g, '')) : '',
        email: cleanedEmailForWorkflow,
        dateNaissance: ensureAdultBirthDate(personalInfo.birthDate),
        lieuNaissance: personalInfo.birthPlace,
        nationnalite: personalInfo.nationality || 'MALIENNE',
        sexe: personalInfo.sexe,
        situationMatrimoniale: personalInfo.situationMatrimoniale || 'CELIBATAIRE', // Valeur par défaut si vide
        civilite: mapCivilityToBackend(personalInfo.civility),
        // Récupérer division_id et localite depuis les données personnelles - utiliser null au lieu de undefined
        division_id: personalInfo.divisionId || personalInfo.division_id || null,
        divisionCode: personalInfo.divisionCode || null,
        localite: personalInfo.localite || personalInfo.city || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(personalInfo.civility);
      const finalSexe = personalInfo.sexe || deducedSexe;
      

      // Mettre à jour le sexe dans la requête
      personRequest.sexe = finalSexe;

      // DEBUG: Afficher la requête complète avant envoi
      console.log('🔍 [SAVE PERSONAL INFO] Requête complète avant envoi:', JSON.stringify(personRequest, null, 2));
      console.log('🔍 [SAVE PERSONAL INFO] Email dans la requête:', personRequest.email);

      let response;
      
      if (personalInfo.isForSelf && currentUser.personne_id) {
        // PUT - Mise à jour de la personne existante
        response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      } else {
        // POST - Création d'une nouvelle personne
        response = await fetch('/api/v1/persons', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Erreur lors de la sauvegarde';
        
        // Si la personne n'existe pas par ID, chercher par téléphone
        if (errorMessage.includes('Personne introuvable') || errorMessage.includes('introuvable')) {
          console.log('🔍 [savePersonalInfoWorkflow] Personne introuvable par ID, recherche par téléphone:', formattedPhone);
          
          try {
            const searchResponse = await fetch(`/api/v1/persons/search?telephone=${encodeURIComponent(formattedPhone)}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (searchResponse.ok) {
              const existingPerson = await searchResponse.json();
              console.log('✅ [savePersonalInfoWorkflow] Personne trouvée par téléphone:', existingPerson.id);
              
              // Mettre à jour le localStorage avec le bon personne_id
              currentUser.personne_id = existingPerson.id;
              localStorage.setItem('user', JSON.stringify(currentUser));
              console.log('✅ [savePersonalInfoWorkflow] localStorage mis à jour avec personne_id:', existingPerson.id);
              
              // Mettre à jour cette personne existante
              const updateResponse = await fetch(`/api/v1/persons/${existingPerson.id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(personRequest)
              });
              
              if (updateResponse.ok) {
                const updatedPerson = await updateResponse.json();
                console.log('✅ [savePersonalInfoWorkflow] Personne existante mise à jour:', updatedPerson.id);
                return { ...updatedPerson, id: existingPerson.id };
              } else {
                // Retourner la personne existante même si la mise à jour échoue
                console.warn('⚠️ [savePersonalInfoWorkflow] Mise à jour échouée, utilisation de la personne existante');
                return existingPerson;
              }
            } else {
              // Aucune personne trouvée par téléphone, créer une nouvelle
              console.log('🔍 [savePersonalInfoWorkflow] Aucune personne trouvée par téléphone, création nouvelle');
              const createResponse = await fetch('/api/v1/persons', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(personRequest)
              });
              
              if (!createResponse.ok) {
                const createError = await createResponse.json();
                throw new Error(createError.message || 'Erreur lors de la création de la personne');
              }
              
              const newPerson = await createResponse.json();
              // Mettre à jour le localStorage avec le nouveau personne_id
              currentUser.personne_id = newPerson.id;
              localStorage.setItem('user', JSON.stringify(currentUser));
              return newPerson;
            }
          } catch (searchError) {
            console.warn('⚠️ [savePersonalInfoWorkflow] Erreur recherche par téléphone:', searchError);
            throw searchError;
          }
        }
        
        // Analyser l'erreur pour fournir un message plus clair
        let friendlyMessage = errorMessage;
        if (errorMessage.includes('téléphone') && errorMessage.includes('déjà')) {
          friendlyMessage = 'Ce numéro de téléphone est déjà utilisé par un autre compte.';
        } else if (errorMessage.includes('email') && errorMessage.includes('déjà')) {
          friendlyMessage = 'Cette adresse email est déjà utilisée par un autre compte.';
        } else if (errorMessage.includes('date') || errorMessage.includes('naissance')) {
          friendlyMessage = 'La date de naissance est invalide ou manquante.';
        } else if (errorMessage.includes('division') || errorMessage.includes('localisation')) {
          friendlyMessage = 'La localisation est invalide ou manquante. Veuillez sélectionner une région, cercle, commune et quartier.';
        }
        
        throw new Error(friendlyMessage);
      }
      
      const result = await response.json();
      
      // Si c'était un PUT (isForSelf), s'assurer de retourner l'ID correct
      if (personalInfo.isForSelf && currentUser.personne_id) {
        return { ...result, id: currentUser.personne_id };
      }
      
      return result;
    } catch (err) {
      // Retourner directement le message d'erreur sans préfixe redondant
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue lors de la sauvegarde';
      throw new Error(errorMsg);
    }
  };

  // Étape 3: Traiter les associés avec EntrepriseRole.ASSOCIE
  const processAssociatesWorkflow = async () => {
    try {
      const associates = businessData.participants?.filter(p => p.role === 'ASSOCIE') || [];
      const createdAssociates = [];
      

      for (const associate of associates) {
        // Si l'associé n'a pas encore d'ID, le créer
        if (!associate.personId) {
          const associateData = {
            lastName: associate.nom || '',
            firstName: associate.prenom || '',
            phone: associate.telephone || '',
            email: cleanAndValidateEmail(associate.email) || '',
            birthDate: associate.dateNaissance || '',
            birthPlace: associate.lieuNaissance || '',
            nationality: associate.nationnalite || 'MALIENNE',
            sexe: getConsistentSexe(associate.sexe, associate.civilite || 'MONSIEUR'),
            situationMatrimoniale: associate.situationMatrimoniale || 'CELIBATAIRE',
            civility: associate.civilite || 'MONSIEUR', // Utiliser la civilité originale, pas mappée
            // Champs spécifiques aux personnes morales
            denominationEntreprise: associate.denominationEntreprise,
            paysEmissionRccm: associate.paysEmissionRccm,
            // Ajouter les données de localisation
            divisionId: associate.divisionId || associate.division_id,
            divisionCode: associate.divisionCode,
            localite: associate.localite
          };

          const createdAssociate = await createAssociateWorkflow(associateData);
          if (createdAssociate) {
            associate.personId = createdAssociate.id || createdAssociate.data?.id;
            createdAssociates.push(createdAssociate);
          }
        } else {
          // L'associé a déjà un personId, vérifier s'il a besoin d'une mise à jour
          
          const currentUser = authAPI.getCurrentUser();
          const isCurrentUser = currentUser && (currentUser.personne_id === associate.personId || currentUser.personneId === associate.personId);
          
          if (isCurrentUser) {
            
            // Vérifier si l'utilisateur a besoin d'une mise à jour (données manquantes)
            const needsUpdate = !currentUser.dateNaissance || 
                               !currentUser.lieuNaissance || 
                               !currentUser.nationnalite ||
                               !currentUser.sexe ||
                               !currentUser.situationMatrimoniale;
            
            if (needsUpdate) {
              const updateRequest = {
                nom: associate.nom || currentUser.nom,
                prenom: associate.prenom || currentUser.prenom,
                telephone1: associate.telephone || currentUser.telephone1,
                email: cleanAndValidateEmail(associate.email) || cleanAndValidateEmail(currentUser.email),
                dateNaissance: ensureAdultBirthDate(associate.dateNaissance) || ensureAdultBirthDate(currentUser.dateNaissance),
                lieuNaissance: associate.lieuNaissance || currentUser.lieuNaissance,
                nationnalite: associate.nationnalite || currentUser.nationnalite || 'MALIENNE',
                sexe: associate.sexe || currentUser.sexe,
                situationMatrimoniale: associate.situationMatrimoniale || currentUser.situationMatrimoniale || 'CELIBATAIRE',
                civilite: mapCivilityToBackend(associate.civilite || 'MONSIEUR') || currentUser.civilite,
                division_id: associate.divisionId || associate.division_id || currentUser.division_id,
                divisionCode: associate.divisionCode || currentUser.divisionCode,
                localite: associate.localite || currentUser.localite,
                porte: (associate as any).porte || (currentUser as any).porte
              };
              
              
              const token = localStorage.getItem('token');
              const updateResponse = await fetch(`/api/v1/persons/${associate.personId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateRequest)
              });
              
              if (updateResponse.ok) {
                const updatedUser = await updateResponse.json();
                createdAssociates.push({ id: associate.personId, data: updatedUser });
              } else {
                throw new Error('Impossible de mettre à jour les données de l\'associé');
              }
            } else {
            }
          } else {
          }
        }
      }

      return createdAssociates;
    } catch (err) {
      throw err;
    }
  };

  // Créer un associé avec EntrepriseRole.ASSOCIE
  const createAssociateWorkflow = async (associateData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Détecter si c'est une personne morale
      const isPersonneMorale = associateData.civility === 'PERSONNE_MORALE';

      // Validation préventive pour éviter "Name is null"
      let finalLastName = associateData.lastName;
      let finalFirstName = associateData.firstName;
      
      if (!associateData.lastName || associateData.lastName.trim() === '') {
        finalLastName = isPersonneMorale ? associateData.denominationEntreprise || 'Entreprise' : 'Nom';
      }
      if (!associateData.firstName || associateData.firstName.trim() === '') {
        finalFirstName = isPersonneMorale ? 'Représentant' : 'Prénom';
      }

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(associateData.civility);
      const finalSexe = associateData.sexe || deducedSexe;
      

      // Gestion du téléphone pour les personnes morales
      let fullPhoneForCreate = '';
      if (isPersonneMorale) {
        // Pour les personnes morales, générer un numéro fictif unique
        const timestamp = Date.now().toString().slice(-8); // 8 derniers chiffres du timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 chiffres aléatoires
        fullPhoneForCreate = `+223${timestamp.slice(0, 6)}${random}`;
      } else {
        // Pour les personnes physiques, reconstruire le numéro
        const countryCode = '+223'; // Mali par défaut
        if (associateData.phone) {
          // Si le numéro commence déjà par +, l'utiliser tel quel, sinon ajouter le préfixe
          fullPhoneForCreate = associateData.phone.startsWith('+') ? 
            associateData.phone.replace(/\s/g, '') : 
            `${countryCode}${associateData.phone.replace(/\s/g, '')}`;
        }
      }

      const personRequest = isPersonneMorale ? {
        // Champs pour personne morale associé
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        civilite: 'PERSONNE_MORALE',
        denominationEntreprise: associateData.denominationEntreprise || 'Entreprise Associée',
        paysEmissionRccm: associateData.paysEmissionRccm || 'MALI',
        // Champs techniques minimaux pour satisfaire les validations DTO
        telephone1: fullPhoneForCreate,
        dateNaissance: '1900-01-01',
        lieuNaissance: 'N/A',
        nationnalite: 'MALIENNE', // Valeur par défaut pour satisfaire @NotNull
        sexe: 'MASCULIN', // Valeur par défaut pour satisfaire @NotNull (sera ignorée par le backend)
        situationMatrimoniale: 'CELIBATAIRE', // Valeur par défaut pour satisfaire @NotNull
        // Champs optionnels
        email: cleanAndValidateEmail(associateData.email),
        // Localisation - Les personnes morales ont leur propre localisation
        division_id: associateData.divisionId || associateData.division_id || null,
        divisionCode: associateData.divisionCode || null,
        localite: associateData.localite || associateData.city || null,
        porte: associateData.porte || null,
        role: 'USER',
        entrepriseRole: 'ASSOCIE'
      } : {
        // Champs pour personne physique associé
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        telephone1: fullPhoneForCreate,
        email: cleanAndValidateEmail(associateData.email),
        dateNaissance: ensureAdultBirthDate(associateData.birthDate),
        lieuNaissance: associateData.birthPlace,
        nationnalite: associateData.nationality || 'MALIENNE',
        sexe: finalSexe,
        situationMatrimoniale: associateData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(associateData.civility),
        // Localisation - Chaque participant a sa propre localisation
        division_id: associateData.divisionId || associateData.division_id || null,
        divisionCode: associateData.divisionCode || null,
        localite: associateData.localite || associateData.city || null,
        porte: associateData.porte || null,
        role: 'USER',
        entrepriseRole: 'ASSOCIE'
      };

      // Logs de debugging pour la localisation de l'associé

      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'associé');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Étape 4: Traiter le gérant avec EntrepriseRole.GERANT
  const processManagerWorkflow = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const managers = businessData.participants?.filter(p => p.role === 'GERANT' || p.role === 'PROMOTEUR') || [];
      
      if (managers.length === 0) {
        throw new Error('Aucun gérant défini');
      }
      
      if (managers.length > 1) {
        throw new Error('Un seul gérant autorisé par entreprise');
      }

      const manager = managers[0];
      let createdManager = null;

      const managerData = {
        lastName: manager.nom || '',
        firstName: manager.prenom || '',
        phone: manager.telephone || '',
        email: cleanAndValidateEmail(manager.email) || '',
        birthDate: manager.dateNaissance || '',
        birthPlace: manager.lieuNaissance || '',
        nationality: manager.nationnalite || 'MALIENNE',
        sexe: getConsistentSexe(manager.sexe, manager.civilite || 'MONSIEUR'),
        situationMatrimoniale: manager.situationMatrimoniale || 'CELIBATAIRE',
        civility: manager.civilite || 'MONSIEUR', // Utiliser la civilité originale, pas mappée
        // Champs spécifiques aux personnes morales
        denominationEntreprise: manager.denominationEntreprise,
        paysEmissionRccm: manager.paysEmissionRccm,
        // Ajouter les données de localisation
        divisionId: manager.divisionId || manager.division_id,
        divisionCode: manager.divisionCode,
        localite: manager.localite
      };

      // Si le gérant n'a pas encore d'ID, vérifier si c'est l'utilisateur connecté
      if (!manager.personId) {
        // Logs de débogage pour identifier le problème
        
        // Vérifier si l'utilisateur connecté EST le gérant (même email)
        const isCurrentUserTheManager = currentUser.email === manager.email;
          
        if (isCurrentUserTheManager && currentUser.personne_id) {
          
          // Vérifier si l'utilisateur est déjà gérant d'une autre entreprise
          const canBeManagerResponse = await fetch(`/api/v1/persons/${currentUser.personne_id}/can-be-manager`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (canBeManagerResponse.ok) {
            const canBeManagerData = await canBeManagerResponse.json();
            
            if (canBeManagerData.canBeManager) {
              manager.personId = currentUser.personne_id;
              
              // Vérifier si l'utilisateur a besoin d'une mise à jour (données manquantes)
              const needsUpdate = !currentUser.dateNaissance || 
                                 !currentUser.lieuNaissance || 
                                 !currentUser.nationnalite ||
                                 !currentUser.sexe ||
                                 !currentUser.situationMatrimoniale;
              
              if (needsUpdate) {
                // Mettre à jour avec les données du formulaire
                const updateRequest = {
                  nom: managerData.lastName || currentUser.nom,
                  prenom: managerData.firstName || currentUser.prenom,
                  telephone1: managerData.phone || currentUser.telephone1,
                  email: cleanAndValidateEmail(managerData.email) || cleanAndValidateEmail(currentUser.email),
                  dateNaissance: ensureAdultBirthDate(managerData.birthDate) || ensureAdultBirthDate(currentUser.dateNaissance),
                  lieuNaissance: managerData.birthPlace || currentUser.lieuNaissance,
                  nationnalite: managerData.nationality || currentUser.nationnalite || 'MALIENNE',
                  sexe: managerData.sexe || currentUser.sexe,
                  situationMatrimoniale: managerData.situationMatrimoniale || currentUser.situationMatrimoniale || 'CELIBATAIRE',
                  civilite: mapCivilityToBackend(managerData.civility || 'MONSIEUR') || currentUser.civilite,
                  division_id: managerData.divisionId || currentUser.division_id,
                  divisionCode: managerData.divisionCode || currentUser.divisionCode,
                  localite: managerData.localite || currentUser.localite,
                  porte: (managerData as any).porte || (currentUser as any).porte
                };
                
                
                const token = localStorage.getItem('token');
                const updateResponse = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(updateRequest)
                });
                
                if (updateResponse.ok) {
                  const updatedUser = await updateResponse.json();
                  createdManager = { id: currentUser.personne_id, data: updatedUser };
                } else {
                  throw new Error('Impossible de mettre à jour les données utilisateur');
                }
              } else {
                createdManager = { id: currentUser.personne_id };
              }
            } else {
              throw new Error(`Vous êtes déjà gérant d'une autre entreprise. Un utilisateur ne peut être gérant que d'une seule entreprise. Vous pouvez être gérant ou associé d'autres entreprises.`);
            }
          } else {
            createdManager = await createManagerWorkflow(managerData);
            if (createdManager) {
              manager.personId = createdManager.id || createdManager.data?.id;
            }
          }
        } else {
          createdManager = await createManagerWorkflow(managerData);
          if (createdManager) {
            manager.personId = createdManager.id || createdManager.data?.id;
          }
        }
      } else {
        createdManager = await updateManagerWorkflow(manager.personId, managerData);
      }

      return createdManager;
    } catch (err) {
      throw err;
    }
  };

  // Mettre à jour un gérant existant
  const updateManagerWorkflow = async (personId: string, managerData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Reconstruire le numéro complet avec l'indicatif pour la sauvegarde (format E.164)
      let fullPhoneForUpdate = '';
      if (managerData.phone) {
        const cleanPhone = managerData.phone.replace(/[\s\-\.]/g, '');
        if (cleanPhone.startsWith('+')) {
          fullPhoneForUpdate = cleanPhone; // Déjà au format E.164
        } else {
          fullPhoneForUpdate = `+223${cleanPhone}`; // Ajouter l'indicatif Mali
        }
      }

      const personUpdateRequest = {
        nom: managerData.lastName,
        prenom: managerData.firstName,
        telephone1: fullPhoneForUpdate, // Sauvegarder le numéro complet avec indicatif
        email: cleanAndValidateEmail(managerData.email),
        dateNaissance: managerData.birthDate,
        lieuNaissance: managerData.birthPlace,
        nationnalite: managerData.nationality || 'MALIENNE',
        sexe: managerData.sexe,
        situationMatrimoniale: managerData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(managerData.civility),
        // Récupérer division_id et localite - utiliser null au lieu de undefined
        division_id: managerData.divisionId || managerData.division_id || null,
        divisionCode: managerData.divisionCode || null,
        localite: managerData.localite || managerData.city || null,
        porte: managerData.porte || null
      };

      const response = await fetch(`/api/v1/persons/${personId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personUpdateRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Erreur lors de la mise à jour du gérant';
        
        // Si la personne n'existe pas, chercher par téléphone d'abord
        if (errorMessage.includes('Personne introuvable') || errorMessage.includes('introuvable')) {
          console.log('🔍 [updateManagerWorkflow] Personne introuvable par ID, recherche par téléphone:', fullPhoneForUpdate);
          
          // Chercher la personne par numéro de téléphone
          try {
            const searchResponse = await fetch(`/api/v1/persons/search?telephone=${encodeURIComponent(fullPhoneForUpdate)}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (searchResponse.ok) {
              const existingPerson = await searchResponse.json();
              console.log('✅ [updateManagerWorkflow] Personne trouvée par téléphone:', existingPerson.id);
              
              // Mettre à jour le localStorage avec le bon personne_id
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              currentUser.personne_id = existingPerson.id;
              localStorage.setItem('user', JSON.stringify(currentUser));
              console.log('✅ [updateManagerWorkflow] localStorage mis à jour avec personne_id:', existingPerson.id);
              
              // Mettre à jour cette personne existante
              const updateExistingResponse = await fetch(`/api/v1/persons/${existingPerson.id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(personUpdateRequest)
              });
              
              if (updateExistingResponse.ok) {
                const updatedPerson = await updateExistingResponse.json();
                console.log('✅ [updateManagerWorkflow] Personne existante mise à jour:', updatedPerson.id);
                return updatedPerson;
              } else {
                const updateError = await updateExistingResponse.json();
                console.warn('⚠️ [updateManagerWorkflow] Erreur mise à jour personne existante:', updateError.message);
                // Retourner la personne existante sans modification
                return existingPerson;
              }
            } else {
              console.log('🔍 [updateManagerWorkflow] Aucune personne trouvée par téléphone, création nouvelle');
              return await createManagerWorkflow(managerData);
            }
          } catch (searchError) {
            console.warn('⚠️ [updateManagerWorkflow] Erreur recherche par téléphone:', searchError);
            return await createManagerWorkflow(managerData);
          }
        }
        
        // Gestion spécifique de l'erreur de numéro de téléphone déjà utilisé
        if (errorMessage.includes('numéro de téléphone est déjà utilisé') || 
            errorMessage.includes('telephone') && errorMessage.includes('déjà')) {
          
          // Pour les workflows de gérant, proposer de garder le numéro actuel ou demander un changement
          if (window.confirm(`Le numéro ${fullPhoneForUpdate} est déjà utilisé par un autre utilisateur.\n\nVoulez-vous continuer sans changer le numéro de téléphone du gérant ?`)) {
            // Réessayer sans changer le numéro de téléphone
            
            // Créer une nouvelle requête sans le champ téléphone
            const { telephone1, ...personUpdateRequestWithoutPhone } = personUpdateRequest;
            
            const retryResponse = await fetch(`/api/v1/persons/${personId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(personUpdateRequestWithoutPhone)
            });
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json();
              throw new Error(retryErrorData.message || 'Erreur lors de la mise à jour sans le téléphone');
            }
            
            const retryResult = await retryResponse.json();
            return retryResult;
          } else {
            throw new Error(`Le numéro ${fullPhoneForUpdate} est déjà utilisé. Veuillez modifier le numéro du gérant ou annuler l'opération.`);
          }
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Vérifier si l'email correspond à l'utilisateur connecté
  const getCurrentUserIfEmailMatches = (email: string) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.email && email && 
          currentUser.email.toLowerCase() === email.toLowerCase()) {
        return currentUser;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Créer un gérant avec EntrepriseRole.GERANT
  const createManagerWorkflow = async (managerData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Vérifier si l'email correspond à l'utilisateur connecté
      const currentUser = getCurrentUserIfEmailMatches(managerData.email);
      
      if (currentUser && currentUser.id) {
        return currentUser;
      }


      // Détecter si c'est une personne morale
      const isPersonneMorale = managerData.civility === 'PERSONNE_MORALE';

      // Validation préventive avec fallback pour éviter "Name is null"
      let finalLastName = managerData.lastName;
      let finalFirstName = managerData.firstName;
      
      if (!managerData.lastName || managerData.lastName.trim() === '') {
        finalLastName = isPersonneMorale ? managerData.denominationEntreprise || 'Entreprise' : 'Nom';
      }
      if (!managerData.firstName || managerData.firstName.trim() === '') {
        finalFirstName = isPersonneMorale ? 'Représentant' : 'Prénom';
      }
      

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(managerData.civility);
      const finalSexe = managerData.sexe || deducedSexe;
      

      // Gestion du téléphone pour les personnes morales
      let fullPhoneForCreate = '';
      if (isPersonneMorale) {
        // Pour les personnes morales, générer un numéro fictif unique
        const timestamp = Date.now().toString().slice(-8); // 8 derniers chiffres du timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 chiffres aléatoires
        fullPhoneForCreate = `+223${timestamp.slice(0, 6)}${random}`;
      } else {
        // Pour les personnes physiques, reconstruire le numéro
        const countryCode = '+223'; // Mali par défaut
        if (managerData.phone) {
          // Si le numéro commence déjà par +, l'utiliser tel quel, sinon ajouter le préfixe
          fullPhoneForCreate = managerData.phone.startsWith('+') ? 
            managerData.phone.replace(/\s/g, '') : 
            `${countryCode}${managerData.phone.replace(/\s/g, '')}`;
        }
        
      }

      const personRequest = isPersonneMorale ? {
        // Champs pour personne morale (optimisés)
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        civilite: 'PERSONNE_MORALE',
        denominationEntreprise: managerData.denominationEntreprise || 'Entreprise Gérant',
        paysEmissionRccm: managerData.paysEmissionRccm || 'MALI',
        // Champs techniques minimaux pour satisfaire les validations DTO
        telephone1: fullPhoneForCreate,
        dateNaissance: '1900-01-01',
        lieuNaissance: 'N/A',
        nationnalite: 'MALIENNE', // Valeur par défaut pour satisfaire @NotNull
        sexe: 'MASCULIN', // Valeur par défaut pour satisfaire @NotNull (sera ignorée par le backend)
        situationMatrimoniale: 'CELIBATAIRE', // Valeur par défaut pour satisfaire @NotNull
        // Champs optionnels
        email: managerData.email || undefined,
        // Localisation - Les personnes morales ont leur propre localisation
        division_id: managerData.divisionId || managerData.division_id || null,
        divisionCode: managerData.divisionCode || null,
        localite: managerData.localite || managerData.city || null,
        porte: managerData.porte || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      } : {
        // Champs pour personne physique (complets)
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        telephone1: fullPhoneForCreate,
        email: managerData.email,
        dateNaissance: ensureAdultBirthDate(managerData.birthDate),
        lieuNaissance: managerData.birthPlace,
        nationnalite: managerData.nationality || 'MALIENNE',
        sexe: finalSexe,
        situationMatrimoniale: managerData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(managerData.civility),
        // Localisation - Chaque participant a sa propre localisation
        division_id: managerData.divisionId || managerData.division_id || null,
        divisionCode: managerData.divisionCode || null,
        localite: managerData.localite || managerData.city || null,
        porte: managerData.porte || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };

      // Logs de debugging pour la localisation du gérant
      
      // Vérification finale avant envoi
      if (!personRequest.nom || personRequest.nom.trim() === '') {
        throw new Error('Erreur critique: nom vide avant envoi au backend');
      }
      if (!personRequest.prenom || personRequest.prenom.trim() === '') {
        throw new Error('Erreur critique: prénom vide avant envoi au backend');
      }


      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Erreur lors de la création du gérant';
        
        // Gestion spécifique de l'erreur de numéro de téléphone déjà utilisé
        if (errorMessage.includes('numéro de téléphone est déjà utilisé') || 
            errorMessage.includes('telephone') && errorMessage.includes('déjà')) {
          
          
          throw new Error(`Le numéro ${fullPhoneForCreate} est déjà utilisé par un autre utilisateur. Veuillez utiliser un autre numéro de téléphone pour le gérant.`);
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Étape 3 (bis): Traiter le gérant pour entreprise individuelle
  const processDirigeantWorkflow = async () => {
    try {
      const gerants = businessData.participants?.filter((p: any) => p.role === 'GERANT' || p.role === 'PROMOTEUR') || [];
      
      if (gerants.length === 0) {
        throw new Error('Aucun gerant défini pour l\'entreprise individuelle');
      }
      
      if (gerants.length > 1) {
        throw new Error('Un seul gerant autorisé pour une entreprise individuelle');
      }

      const gerant = gerants[0];
      let createdDirigeant = null;

      const gerantData = {
        lastName: gerant.nom || '',
        firstName: gerant.prenom || '',
        phone: gerant.telephone || '',
        email: cleanAndValidateEmail(gerant.email) || '',
        birthDate: gerant.dateNaissance || '',
        birthPlace: gerant.lieuNaissance || '',
        nationality: gerant.nationnalite || 'MALIENNE',
        sexe: getConsistentSexe(gerant.sexe, gerant.civilite || 'MONSIEUR'),
        situationMatrimoniale: gerant.situationMatrimoniale || 'CELIBATAIRE',
        civility: mapCivilityToBackend(gerant.civilite || 'MONSIEUR'),
        divisionId: gerant.divisionId || gerant.division_id,
        divisionCode: gerant.divisionCode,
        localite: gerant.localite
      };

      // Si le gerant n'a pas encore d'ID, le créer
      if (!gerant.personId) {
        createdDirigeant = await createDirigeantWorkflow(gerantData);
        if (createdDirigeant) {
          gerant.personId = createdDirigeant.id || createdDirigeant.data?.id;
        }
      } else {
        createdDirigeant = await updateManagerWorkflow(gerant.personId, gerantData);
      }

      return createdDirigeant;
    } catch (err) {
      throw err;
    }
  };

  // Créer un gerant avec EntrepriseRole.DIRIGEANT
  const createDirigeantWorkflow = async (gerantData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      const personRequest = {
        nom: gerantData.lastName,
        prenom: gerantData.firstName,
        telephone1: gerantData.phone,
        email: gerantData.email,
        dateNaissance: gerantData.birthDate,
        lieuNaissance: gerantData.birthPlace,
        nationnalite: gerantData.nationality || 'MALIENNE',
        sexe: gerantData.sexe,
        situationMatrimoniale: gerantData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(gerantData.civility),
        division_id: gerantData.divisionId || gerantData.division_id || null,
        divisionCode: gerantData.divisionCode || null,
        localite: gerantData.localite || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };


      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du gerant');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 py-5">
              Création d'entreprise
            </h1>
            <p className="text-gray-600">
              Suivez les étapes pour créer votre entreprise
            </p>
            <button
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire ? Toutes les données seront perdues.')) {
                  localStorage.removeItem('businessCreationData');
                  localStorage.removeItem('businessCreationStep');
                  window.location.reload();
                }
              }}
              className="absolute right-0 top-0 text-sm text-red-600 hover:text-red-700 underline"
            >
              Réinitialiser le formulaire
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8 bg-white rounded-lg p-6 shadow-sm">
            {(() => {
              const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
              const allSteps = [
                { number: 1, name: 'Identification' },
                { number: 2, name: 'Informations personnelles' },
                { number: 3, name: 'Informations entreprise' },
                { number: 4, name: 'Participants' },
                ...(isEntrepriseIndividuelle ? [] : [{ number: 5, name: 'Documents' }]),
                { number: isEntrepriseIndividuelle ? 5 : 6, name: 'Récapitulatif', actualStep: 6 }
              ];
              return allSteps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => goToStep((step as any).actualStep || step.number)}
                    className="flex flex-col items-center group cursor-pointer transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-investmali-accent focus:ring-opacity-50 rounded-lg p-2"
                    title={`Aller à l'étape ${step.number}: ${step.name}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-200 ${
                      currentStep >= ((step as any).actualStep || step.number)
                        ? 'bg-green-500 group-hover:bg-green-600' 
                        : 'bg-gray-300 group-hover:bg-gray-400'
                    }`}>
                      {step.number}
                    </div>
                    <span className={`text-sm mt-2 text-center font-semibold transition-all duration-200 ${
                      currentStep >= ((step as any).actualStep || step.number)
                        ? 'text-green-600 group-hover:text-green-700' 
                        : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {step.name}
                    </span>
                  </button>
                  {index < allSteps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > ((step as any).actualStep || step.number) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ));
            })()}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {currentStep === 1 && (
              <UserIdentificationStep 
                isForSelf={isForSelf}
                setIsForSelf={setIsForSelf}
                handleResponse={handleResponse}
              />
            )}
            
            {currentStep === 2 && (
              <PersonalInfoStep 
                data={businessData} 
                updateData={updateBusinessData}
                isForSelf={isForSelf}
                setIsForSelf={setIsForSelf}
                showForm={showForm}
                setShowForm={setShowForm}
              />
            )}
            
            {currentStep === 3 && (
              <CompanyInfoStep 
                data={businessData} 
                updateData={updateBusinessData}
              />
            )}
            
            {currentStep === 4 && (
              <ParticipantsStep 
                data={businessData} 
                updateData={updateBusinessData}
                onNext={nextStep}
              />
            )}
            
            {currentStep === 5 && (
              <DocumentsStep 
                data={businessData} 
                updateData={updateBusinessData}
              />
            )}
            
            {currentStep === 6 && (
              <SummaryAndSubmissionStep 
                data={businessData} 
                updateData={updateBusinessData}
                submitTrigger={0}
                personalLocationName={personalLocationName}
                companyLocationName={companyLocationName}
              />
            )}
          </div>

          {/* Error Display */}
          {showValidation && stepError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="text-red-600 mr-2 mt-1">⚠️</div>
                <div className="text-red-800 whitespace-pre-line">{stepError}</div>
              </div>
              <button 
                onClick={() => setShowValidation(false)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Précédent
            </button>
            
            {currentStep < 6 && (
              <button
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
                className={`px-6 py-2 rounded-lg font-medium ${
                  canProceedToNextStep()
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canProceedToNextStep() === null ? 'Soumettre' : 'Suivant'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCreation;

=======
import React, { useState, useEffect, useRef } from 'react';
=======
import React, { useState, useEffect, useRef, useMemo } from 'react';
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../animations.css';
import AnimatedBackground from './AnimatedBackground';
import BusinessCreation3D from './BusinessCreation3D';
import ParticipantsStep from './ParticipantsStep';
import DocumentUpload from './DocumentUpload';
import DivisionSearchInput from './DivisionSearchInput';
import Header from './Header';
// Services and enums wired to backend
import divisionService from '../services/divisionService';
import personService from '../services/personService';
import { TypePersonne } from '../constants/enums';
import enumService from '../services/enumService';
import { businessAPI, apiUtils, createEntreprise, authAPI } from '../services/api';

// Nouveaux types pour l'API backend
export type TypeEntreprise = 'SOCIETE' | 'ENTREPRISE_INDIVIDUELLE';
export type FormeJuridique = 'SARL' | 'SARL_UNI' | 'SUC_SARL' | 'FIL_SARL' | 'SA' | 'SUC_SA' | 'FIL_SA' | 'SASU' | 'SAS' | 'BR' | 'FIL_SAS' | 'SUC_SAS' | 'SNC' | 'SCS' | 'SCI' | 'SCP' | 'GIE' | 'E_I';
export type EntrepriseRole = 'GERANT' | 'PROMOTEUR' | 'ASSOCIE' | 'ADMINISTRATEUR';
export type StatutCreation = 'EN_COURS' | 'VALIDE' | 'REJETE';
export type EtapeValidation = 'CREATION' | 'VALIDATION_DOCUMENTS' | 'PAIEMENT' | 'FINALISATION';
export type DomaineActivites = 'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS' | 'ARCHITECTE' | 'BTP' | 'CARTOGRAPHIE_TOPOGRAPHIE' | 'GEOMETRES_EXPERTS' | 'INGENIEUR_CONSEIL' | 'PRODUCTEUR_DE_SPECTACLES' | 'PROMOTEUR_IMMOBILIER' | 'STATIONS' | 'TRANSPORT' | 'URBANISTE' | 'ETABLISSEMENT_DE_TOURISME' | 'AGENCE_DE_VOYAGE';

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

gsap.registerPlugin(ScrollTrigger);

// Fonction pour formater les dates pour le backend
const formatDateForBackend = (dateString: string | null | undefined): string | null => {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  try {
    // Si la date contient déjà un 'T', extraire seulement la partie date
    if (dateString.includes('T')) {
      const formattedDate = dateString.split('T')[0];
      return formattedDate;
    }

    // Vérifier si la date est au format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateString)) {
      return dateString;
    }

    // Essayer de parser et reformater la date
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    // Formater au format YYYY-MM-DD
    const formattedDate = parsedDate.toISOString().split('T')[0];
    return formattedDate;
  } catch (error) {
    return null;
  }
};

// Fonction pour s'assurer qu'une date de naissance rend la personne majeure (>= 18 ans)
const ensureAdultBirthDate = (birthDate: string | null | undefined): string => {
  if (!birthDate || birthDate.trim() === '') {
    // Si pas de date, générer une date qui rend la personne majeure (25 ans par exemple)
    const today = new Date();
    const adultDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    const result = adultDate.toISOString().split('T')[0];
    return result;
  }
  
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  
  // Calculer l'âge exact
  const exactAge = age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);
  
  if (exactAge < 18) {
    // Si mineur, ajuster la date pour rendre la personne majeure (25 ans)
    const adultDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    return adultDate.toISOString().split('T')[0];
  }
  
  // Si déjà majeur, retourner la date formatée
  const formatted = formatDateForBackend(birthDate);
  return formatted || birthDate;
};

// Fonction pour mapper les civilités frontend vers backend
const mapCivilityToBackend = (frontendCivility: string): string => {
  const mapping: Record<string, string> = {
    'M.': 'MONSIEUR',
    'Mr': 'MONSIEUR', 
    'MR': 'MONSIEUR',
    'Monsieur': 'MONSIEUR',
    'MONSIEUR': 'MONSIEUR',
    'Mme': 'MADAME',
    'MME': 'MADAME',
    'Madame': 'MADAME',
    'MADAME': 'MADAME',
    'Mlle': 'MADEMOISELLE',
    'MLLE': 'MADEMOISELLE',
    'Mademoiselle': 'MADEMOISELLE',
    'MADEMOISELLE': 'MADEMOISELLE',
    // Ajout pour les personnes morales
    'PERSONNE_MORALE': 'PERSONNE_MORALE'
  };
  
  const result = mapping[frontendCivility] || 'MONSIEUR';
  return result;
};

// Fonction pour déduire le sexe à partir de la civilité
const deduceSexeFromCivilite = (civilite: string): string | null => {
  const backendCivilite = mapCivilityToBackend(civilite);
  
  let result;
  if (backendCivilite === 'PERSONNE_MORALE') {
    result = null; // Les personnes morales n'ont pas de sexe
  } else if (backendCivilite === 'MADAME' || backendCivilite === 'MADEMOISELLE') {
    result = 'FEMININ';
  } else {
    result = 'MASCULIN';
  }
  
  return result;
};

// Fonction pour obtenir le sexe cohérent avec la civilité (force la déduction si incohérent)
const getConsistentSexe = (existingSexe: string | undefined, civilite: string): string | null => {
  const deducedSexe = deduceSexeFromCivilite(civilite);
  
  // Si c'est une personne morale, retourner null
  if (deducedSexe === null) {
    return null;
  }
  
  // Si pas de sexe existant, utiliser la déduction
  if (!existingSexe) {
    return deducedSexe;
  }
  
  // Vérifier la cohérence
  const backendCivilite = mapCivilityToBackend(civilite);
  const isConsistent = 
    (backendCivilite === 'MONSIEUR' && existingSexe === 'MASCULIN') ||
    ((backendCivilite === 'MADAME' || backendCivilite === 'MADEMOISELLE') && existingSexe === 'FEMININ');
  
  if (isConsistent) {
    return existingSexe;
  } else {
    return deducedSexe;
  }
};

// Fonction pour valider le format du téléphone malien (E.164)
const validateMalianPhoneE164 = (phone: string): boolean => {
  // Format E.164 pour le Mali: +223 suivi de 8 chiffres
  const e164Regex = /^\+223[0-9]{8}$/;
  return e164Regex.test(phone);
};

// Fonction pour formater l'affichage du téléphone
const formatPhoneDisplay = (phone: string): string => {
  // Supprimer tous les caractères non numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si ça commence par +223, formater en +223 XX XX XX XX
  if (cleaned.startsWith('+223') && cleaned.length === 12) {
    const number = cleaned.substring(4); // Enlever +223
    return `+223 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`;
  }
  
  // Si c'est juste 8 chiffres, ajouter +223 et formater
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    return `+223 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)}`;
  }
  
  return phone;
};


// Liste des pays avec codes téléphoniques et drapeaux
const countries = [
  { code: '+223', name: 'Mali', flag: 'https://flagcdn.com/w40/ml.png', iso: 'ML' },
  { code: '+33', name: 'France', flag: 'https://flagcdn.com/w40/fr.png', iso: 'FR' },
  { code: '+1', name: 'États-Unis', flag: 'https://flagcdn.com/w40/us.png', iso: 'US' },
  { code: '+44', name: 'Royaume-Uni', flag: 'https://flagcdn.com/w40/gb.png', iso: 'GB' },
  { code: '+49', name: 'Allemagne', flag: 'https://flagcdn.com/w40/de.png', iso: 'DE' },
  { code: '+221', name: 'Sénégal', flag: 'https://flagcdn.com/w40/sn.png', iso: 'SN' },
  { code: '+225', name: 'Côte d\'Ivoire', flag: 'https://flagcdn.com/w40/ci.png', iso: 'CI' },
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
  { code: '+234', name: 'Nigeria', flag: 'https://flagcdn.com/w40/ng.png', iso: 'NG' },
  { code: '+237', name: 'Cameroun', flag: 'https://flagcdn.com/w40/cm.png', iso: 'CM' },
  { code: '+241', name: 'Gabon', flag: 'https://flagcdn.com/w40/ga.png', iso: 'GA' },
  { code: '+242', name: 'Congo', flag: 'https://flagcdn.com/w40/cg.png', iso: 'CG' },
  { code: '+243', name: 'RD Congo', flag: 'https://flagcdn.com/w40/cd.png', iso: 'CD' },
  { code: '+245', name: 'Guinée-Bissau', flag: 'https://flagcdn.com/w40/gw.png', iso: 'GW' },
  { code: '+248', name: 'Seychelles', flag: 'https://flagcdn.com/w40/sc.png', iso: 'SC' },
  { code: '+249', name: 'Soudan', flag: 'https://flagcdn.com/w40/sd.png', iso: 'SD' },
  { code: '+250', name: 'Rwanda', flag: 'https://flagcdn.com/w40/rw.png', iso: 'RW' },
  { code: '+251', name: 'Éthiopie', flag: 'https://flagcdn.com/w40/et.png', iso: 'ET' },
  { code: '+252', name: 'Somalie', flag: 'https://flagcdn.com/w40/so.png', iso: 'SO' },
  { code: '+253', name: 'Djibouti', flag: 'https://flagcdn.com/w40/dj.png', iso: 'DJ' },
  { code: '+254', name: 'Kenya', flag: 'https://flagcdn.com/w40/ke.png', iso: 'KE' },
  { code: '+255', name: 'Tanzanie', flag: 'https://flagcdn.com/w40/tz.png', iso: 'TZ' },
  { code: '+256', name: 'Ouganda', flag: 'https://flagcdn.com/w40/ug.png', iso: 'UG' },
  { code: '+257', name: 'Burundi', flag: 'https://flagcdn.com/w40/bi.png', iso: 'BI' },
  { code: '+258', name: 'Mozambique', flag: 'https://flagcdn.com/w40/mz.png', iso: 'MZ' },
  { code: '+260', name: 'Zambie', flag: 'https://flagcdn.com/w40/zm.png', iso: 'ZM' },
  { code: '+261', name: 'Madagascar', flag: 'https://flagcdn.com/w40/mg.png', iso: 'MG' },
  { code: '+262', name: 'Réunion', flag: 'https://flagcdn.com/w40/re.png', iso: 'RE' },
  { code: '+263', name: 'Zimbabwe', flag: 'https://flagcdn.com/w40/zw.png', iso: 'ZW' },
  { code: '+264', name: 'Namibie', flag: 'https://flagcdn.com/w40/na.png', iso: 'NA' },
  { code: '+265', name: 'Malawi', flag: 'https://flagcdn.com/w40/mw.png', iso: 'MW' },
  { code: '+266', name: 'Lesotho', flag: 'https://flagcdn.com/w40/ls.png', iso: 'LS' },
  { code: '+267', name: 'Botswana', flag: 'https://flagcdn.com/w40/bw.png', iso: 'BW' },
  { code: '+268', name: 'Eswatini', flag: 'https://flagcdn.com/w40/sz.png', iso: 'SZ' },
  { code: '+269', name: 'Comores', flag: 'https://flagcdn.com/w40/km.png', iso: 'KM' },
  { code: '+27', name: 'Afrique du Sud', flag: 'https://flagcdn.com/w40/za.png', iso: 'ZA' }
];

// Libellés lisibles pour Civilité et Sexe (valeurs API = names)
export const CIVILITE_LABELS: Record<string, string> = {
  MR: 'Monsieur',
  Mme: 'Madame',
  Melle: 'Mademoiselle',
};
export const SEXE_LABELS: Record<string, string> = {
  MASCULIN: 'Masculin',
  FEMININ: 'Féminin',
};

// Labels pour les domaines d'activité réglementés
export const DOMAINE_ACTIVITE_NR_LABELS: Record<DomaineActiviteNr, string> = {
  AGRICULTURE_ELEVAGE_PECHE: 'Agriculture, Élevage et Pêche',
  MINES_ET_MINERAIS: 'Mines et Minéraux',
  ENERGIE_ET_RESSOURCES_NATURELLES: 'Énergie et Ressources Naturelles',
  INDUSTRIE_ET_TRANSFORMATION: 'Industrie et Transformation',
  COMMERCE_ET_DISTRIBUTION: 'Commerce et Distribution',
  TRANSPORTS_ET_LOGISTIQUE: 'Transports et Logistique',
  TELECOMS_ET_TIC: 'Télécommunications et TIC',
  TOURISME_CULTURE_ET_ARTISANAT: 'Tourisme, Culture et Artisanat',
  SANTE_ET_PHARMACEUTIQUE: 'Santé et Pharmaceutique',
  EDUCATION_ET_FORMATION: 'Éducation et Formation',
  SERVICES_FINANCIERS_ET_ASSURANCES: 'Services Financiers et Assurances',
  IMMOBILIER_ET_CONSTRUCTION: 'Immobilier et Construction (BTP)',
  ADMINISTRATION_ET_SERVICES_PUBLICS: 'Administration et Services Publics',
  ENVIRONNEMENT_ET_ECOLOGIE: 'Environnement et Écologie',
  RECHERCHE_ET_INNOVATION: 'Recherche et Innovation',
  INGENIERIE_ET_ETUDES: 'Ingénierie et Études',
  URBANISME_ET_AMENAGEMENT: 'Urbanisme et Aménagement',
};

// Templates de demandes d'autorisation par domaine réglementé
export const AUTORISATION_TEMPLATES: Record<DomaineActivites, {
  title: string;
  description: string;
  documents: string[];
  procedure: string;
}> = {
  'BTP': {
    title: 'Demande d\'autorisation d\'exercice - BTP',
    description: 'Demande d\'autorisation pour exercer dans le domaine du Bâtiment et Travaux Publics',
    documents: [
      'Certificat de qualification professionnelle',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience dans le domaine',
      'Diplômes et certifications techniques'
    ],
    procedure: 'Déposer le dossier auprès de la Direction Générale des Travaux Publics'
  },
  'TRANSPORT': {
    title: 'Demande d\'autorisation d\'exercice - Transport',
    description: 'Demande d\'autorisation pour exercer dans le domaine du transport',
    documents: [
      'Permis de conduire professionnel',
      'Certificat de visite technique des véhicules',
      'Attestation d\'assurance véhicules',
      'Justificatifs de formation en transport'
    ],
    procedure: 'Déposer le dossier auprès de la Direction des Transports'
  },
  'ARCHITECTE': {
    title: 'Demande d\'autorisation d\'exercice - Architecture',
    description: 'Demande d\'autorisation pour exercer la profession d\'architecte',
    documents: [
      'Diplôme d\'architecte reconnu',
      'Certificat d\'inscription à l\'Ordre des Architectes',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Portfolio de réalisations'
    ],
    procedure: 'Déposer le dossier auprès de l\'Ordre des Architectes du Mali'
  },
  'URBANISTE': {
    title: 'Demande d\'autorisation d\'exercice - Urbanisme',
    description: 'Demande d\'autorisation pour exercer dans le domaine de l\'urbanisme',
    documents: [
      'Diplôme en urbanisme ou aménagement du territoire',
      'Certificat de qualification professionnelle',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en urbanisme'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Urbanisme'
  },
  'INGENIEUR_CONSEIL': {
    title: 'Demande d\'autorisation d\'exercice - Ingénieur Conseil',
    description: 'Demande d\'autorisation pour exercer comme ingénieur conseil',
    documents: [
      'Diplôme d\'ingénieur reconnu',
      'Certificat d\'inscription à l\'Ordre des Ingénieurs',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience professionnelle'
    ],
    procedure: 'Déposer le dossier auprès de l\'Ordre des Ingénieurs du Mali'
  },
  'CARTOGRAPHIE_TOPOGRAPHIE': {
    title: 'Demande d\'autorisation d\'exercice - Cartographie/Topographie',
    description: 'Demande d\'autorisation pour exercer dans le domaine de la cartographie et topographie',
    documents: [
      'Diplôme en géomatique, topographie ou cartographie',
      'Certificat de qualification professionnelle',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs de formation aux outils de mesure'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de la Cartographie'
  },
  'GEOMETRES_EXPERTS': {
    title: 'Demande d\'autorisation d\'exercice - Géomètre Expert',
    description: 'Demande d\'autorisation pour exercer comme géomètre expert',
    documents: [
      'Diplôme de géomètre expert',
      'Certificat d\'inscription à l\'Ordre des Géomètres Experts',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en géométrie'
    ],
    procedure: 'Déposer le dossier auprès de l\'Ordre des Géomètres Experts'
  },
  'ADMINISTRATEURS_ET_AGENTS_IMMOBILIERS': {
    title: 'Demande d\'autorisation d\'exercice - Immobilier',
    description: 'Demande d\'autorisation pour exercer dans l\'administration immobilière',
    documents: [
      'Certificat de formation en gestion immobilière',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en immobilier',
      'Caution bancaire'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Habitat'
  },
  'PROMOTEUR_IMMOBILIER': {
    title: 'Demande d\'autorisation d\'exercice - Promotion Immobilière',
    description: 'Demande d\'autorisation pour exercer comme promoteur immobilier',
    documents: [
      'Justificatifs de capacité financière',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Justificatifs d\'expérience en promotion immobilière',
      'Garantie bancaire'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Habitat'
  },
  'PRODUCTEUR_DE_SPECTACLES': {
    title: 'Demande d\'autorisation d\'exercice - Production de Spectacles',
    description: 'Demande d\'autorisation pour exercer comme producteur de spectacles',
    documents: [
      'Justificatifs d\'expérience dans le spectacle',
      'Attestation d\'assurance responsabilité civile',
      'Certificat de formation en production culturelle',
      'Portfolio de productions'
    ],
    procedure: 'Déposer le dossier auprès du Ministère de la Culture'
  },
  'ETABLISSEMENT_DE_TOURISME': {
    title: 'Demande d\'autorisation d\'exercice - Établissement de Tourisme',
    description: 'Demande d\'autorisation pour exploiter un établissement de tourisme',
    documents: [
      'Plan de l\'établissement',
      'Attestation d\'assurance responsabilité civile',
      'Certificat de conformité aux normes touristiques',
      'Justificatifs de formation en hôtellerie/tourisme'
    ],
    procedure: 'Déposer le dossier auprès de l\'Office Malien du Tourisme'
  },
  'AGENCE_DE_VOYAGE': {
    title: 'Demande d\'autorisation d\'exercice - Agence de Voyage',
    description: 'Demande d\'autorisation pour exploiter une agence de voyage',
    documents: [
      'Garantie financière',
      'Attestation d\'assurance responsabilité civile professionnelle',
      'Certificat de formation en tourisme',
      'Justificatifs d\'expérience dans le tourisme'
    ],
    procedure: 'Déposer le dossier auprès de l\'Office Malien du Tourisme'
  },
  'STATIONS': {
    title: 'Demande d\'autorisation d\'exercice - Station Service',
    description: 'Demande d\'autorisation pour exploiter une station service',
    documents: [
      'Étude d\'impact environnemental',
      'Attestation d\'assurance responsabilité civile',
      'Certificat de conformité aux normes de sécurité',
      'Justificatifs de formation en sécurité pétrolière'
    ],
    procedure: 'Déposer le dossier auprès de la Direction de l\'Énergie'
  }
};

// Mapping inverse : domaines non réglementés vers leurs domaines réglementés parents
// domaineActiviteNr (non réglementé) -> domaineActivite (réglementé)
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

// Mapping entre les domaines réglementés et non réglementés qui se correspondent
// Basé sur la relation parent définie dans l'enum DomaineActivites du backend
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
    'ETABLISSEMENT_DE_TOURISME', // Établissement de tourisme
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
    'GEOMETRES_EXPERTS', // Géomètres-Experts
    'INGENIEUR_CONSEIL' // Ingénieur-Conseil
  ],
  URBANISME_ET_AMENAGEMENT: ['URBANISTE'], // Urbaniste
};

// Type pour les données complètes de l'entreprise
interface BusinessData {
  personalInfo?: PersonalInfo;
  companyInfo?: CompanyInfo;
  participants?: Participant[];
}

// Types pour la génération PDF
type GenArgs = {
  companyInfo: Partial<CompanyInfo>;
  personalInfo: Partial<PersonalInfo>;
  template: { title: string };
  domaineReglemente: string;
};

// Fonction pour générer le document PDF de demande d'autorisation au format officiel (2 pages)
function generateAutorisationPDF({
  companyInfo,
  personalInfo,
  template,
  domaineReglemente,
}: GenArgs) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");

  // ===== Helpers =====
  const MARGIN_L = 20;
  const MARGIN_R = 190;
  const WIDTH = MARGIN_R - MARGIN_L;
  const LINE = 5;

  let y = 20;
  let isFirstPage = true;

  const addPageIfNeeded = (inc = 0) => {
    const need = y + inc > 285;
    if (need) {
      doc.addPage();
      y = 20;
      isFirstPage = false;
    }
  };

  const text = (t: string, x: number, yPos = y, opt?: any) => {
    doc.text(t, x, yPos, opt);
  };

  const underline = (label: string, x: number, yPos = y) => {
    const w = doc.getTextWidth(label);
    text(label, x, yPos);
    doc.line(x, yPos + 0.7, x + w, yPos + 0.7);
  };

  const spaced = (t: string) => t.split("").join(" ");

  const wrap = (t: string, width = WIDTH) => doc.splitTextToSize(t, width);

  const dottedLine = (x1: number, y1: number, x2: number) => {
    const dash = 1.5,
      gap = 1.2;
    let dx = x2 - x1;
    const step = dash + gap;
    const n = Math.floor(dx / step);
    for (let i = 0; i < n; i++) {
      const sx = x1 + i * step;
      doc.line(sx, y1, sx + dash, y1);
    }
    // fin
    const remaining = dx - n * step;
    if (remaining > 0.5) {
      const sx = x1 + n * step;
      doc.line(sx, y1, Math.min(x2, sx + remaining), y1);
    }
  };

  const labeledLine = (
    label: string,
    value: string,
    x = MARGIN_L,
    lineW = 150
  ) => {
    const labW = doc.getTextWidth(label);
    text(label, x, y);
    const start = x + labW + 2;
    const end = x + lineW;
    dottedLine(start, y, end);
    if (value && value !== "Non spécifié") {
      text(value, start + 1, y - 0.8);
    }
    y += 6;
  };

  const bullets = (lines: string[], x = MARGIN_L + 5, indent = 4, lh = 4) => {
    lines.forEach((ln) => {
      const wrapped = wrap(ln, WIDTH - (x - MARGIN_L) - 2);
      wrapped.forEach((wl: string, idx: number) => {
        // Ne pas ajouter de page pour la première page, forcer à rester
        if (isFirstPage) {
          // Réduire l'espacement si on approche du bas de page
          if (y > 270) {
            lh = 3.5;
          }
        } else {
          addPageIfNeeded(lh);
        }
        if (idx === 0) text("•", x, y);
        text(wl, x + indent, y);
        y += lh;
      });
    });
  };

  // ===== PAGE 1 =====
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  text("Promoteur", MARGIN_L, y);
  text("Bamako, le", 150, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  labeledLine("Nom ou Raison Sociale :", companyInfo?.nom || "", MARGIN_L, 170);
  labeledLine("Nationalité :", personalInfo?.nationality || "", MARGIN_L, 170);
  labeledLine("Adresse :", personalInfo?.address || "", MARGIN_L, 170);
  y += 3;

  // Timbre (petit cadre à gauche)
  doc.rect(MARGIN_L, y, 35, 22);
  doc.setFontSize(8);
  text("Timbre", MARGIN_L + 6, y + 8);
  text("200 F CFA", MARGIN_L + 6, y + 15);

  // En-tête centré
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  text("A Monsieur le Directeur Général", 105, y + 4, { align: "center" });
  text("de l'Agence pour la Promotion des", 105, y + 12, { align: "center" });
  text("Investissements au Mali", 105, y + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  text(spaced("B A M A K O"), 105, y + 35, { align: "center" });
  y += 48;

  // Trait de séparation
  doc.line(MARGIN_L, y, MARGIN_R, y);
  y += 8;

  // Objet (avec "Objet" en gras + soulignés sur les mots comme le modèle)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  text("Objet", MARGIN_L, y);
  doc.setFont("helvetica", "normal");
  text(": demande ", MARGIN_L + 16, y);

  // morceaux soulignés
  underline("d'autorisation", MARGIN_L + 16 + doc.getTextWidth(": demande ") , y);
  const xAfter1 =
    MARGIN_L + 16 + doc.getTextWidth(": demande ") + doc.getTextWidth("d'autorisation") + 2;
  text(" ", xAfter1, y);
  underline("d'exercice", xAfter1 + 1, y);

  const afterEx = xAfter1 + 1 + doc.getTextWidth("d'exercice") + 2;
  text(" en qualité", afterEx, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  underline(
    `d'${template.title}` ,
    MARGIN_L,
    y
  );
  doc.setFont("helvetica", "normal");
  text(" ou d'Agent immobilier.", MARGIN_L + doc.getTextWidth(`d'${template.title}` ) + 2, y);
  y += 10;

  // Corps
  text("Monsieur le Directeur général,", MARGIN_L, y);
  y += 7;
  const corps =
    `J'ai l'honneur de solliciter auprès de votre haute bienveillance l'octroi d'une autorisation d'exercice en qualité d'${template.title} ou d'Agent immobilier.` ;
  wrap(corps).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  y += 3;

  // Numérotation 1–3
  doc.setFont("helvetica", "normal");
  text("1. Nom ou Raison sociale :", MARGIN_L, y);
  labeledLine("", companyInfo?.nom || "", MARGIN_L + 55, 180);

  text("2. Adresse ou Siège social :", MARGIN_L, y);
  labeledLine("", personalInfo?.address || "", MARGIN_L + 60, 180);

  text("3. Forme juridique :", MARGIN_L, y);
  labeledLine("", companyInfo?.formeJuridique || "", MARGIN_L + 40, 180);

  // Politesse
  const politesse =
    "Veuillez agréer, Monsieur le Directeur Général, l'expression de mes sentiments les plus distingués.";
  y += 2;
  wrap(politesse).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  y += 3;

  // Pièces jointes (titre)
  doc.setFont("helvetica", "bold");
  text("Pièces jointes", MARGIN_L, y);
  doc.setFont("helvetica", "normal");
  text(" :", MARGIN_L + doc.getTextWidth("Pièces jointes") + 1.2, y);
  y += 5;

  // 1. Personnes physiques
  doc.setFont("helvetica", "bold");
  text("1. Pour les personnes physiques :", MARGIN_L + 5, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  bullets(
    [
      "une demande timbrée;",
      "un extrait de l'acte de naissance ou du jugement supplétif en tenant lieu;",
      "un certificat de nationalité;",
      "deux photos d'identité du promoteur;",
      "une copie certifiée conforme du diplôme ou une attestation délivrée par l'employeur;",
      "un extrait du casier judiciaire datant de moins de trois mois;",
      "un document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou un certificat d'inscription hypothécaire délivré par l'autorité compétente ;",
      "une police d'assurance de responsabilité civile professionnelle.",
    ],
    MARGIN_L + 5
  );

  // 2. Personnes morales (début page 1)
  doc.setFont("helvetica", "bold");
  text("2. Personnes morales :", MARGIN_L + 5, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  bullets(
    [
      "Demande timbrée;",
      "Statuts de la société (copies authentiques);",
      "Diplôme ou certificat établissant la qualification du responsable gerant;",
      "Liste nominative du personnel d'encadrement;",
      "Demande de déclaration d'ouverture d'établissement dûment remplie par l'Agence Nationale pour l'Emploi;",
      "Liste des immobilisations corporelles de l'entreprise accompagnée d'un rapport d'évaluation établi par un expert industriel agréé.",
    ],
    MARGIN_L + 5
  );

  // ===== PAGE 2 =====
  doc.addPage();
  isFirstPage = false;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  text("2", 190, 20);
  y = 35;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  text("2. Pour les personnes morales :", MARGIN_L, y);
  doc.setFont("helvetica", "normal");
  text("º", 130, y); // petit symbole comme sur l'image
  y += 8;

  doc.setFontSize(9);
  bullets(
    [
      "une demande timbrée;",
      "les copies authentiques des statuts ;",
      "les extraits de l'acte de naissance, certificat de nationalité et du casier judiciaire datant de moins de 3 mois, le curriculum vitae, deux photos d'identité et la copie certifiée conforme du diplôme ou du certificat professionnel du responsable gerant ;",
      "un document justifiant le versement de la caution de garantie délivrée par la Caisse de Dépôts et de Consignation ou un certificat d'inscription hypothécaire délivré par l'autorité compétente ;",
      "une police d'assurance de responsabilité civile professionnelle.",
    ],
    MARGIN_L + 5
  );

  y += 4;
  doc.setFont("helvetica", "bold");
  text("Réservé à l'Administration", MARGIN_L, y);
  y += 8;

  // Cadre Code / Avis
  doc.rect(MARGIN_L, y, WIDTH, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  text("Code :", MARGIN_L + 5, y + 12);
  text("Avis :", MARGIN_L + 5, y + 27);
  y += 45;

  // Signature
  doc.setFont("helvetica", "bold");
  text("Signature du Promoteur", 130, y);
  y += 10;

  // NB1 (NUI dans ton code)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  underline(
    "NB1: Montant de la caution de garantie et de la valeur de l'immeuble affecté en hypothèque",
    MARGIN_L,
    y
  );
  y += 6;
  doc.setFont("helvetica", "normal");
  const nb1a =
    "Le montant de la caution de garantie est de cinq millions (5 000 000) de F CFA pour l'Administrateur de biens immobiliers et de deux millions cinq cent mille (2 500 000) F CFA pour l'Agent immobilier.";
  wrap(nb1a).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  const nb1b =
    "La valeur de l'immeuble affecté en hypothèque doit être égale ou supérieure à quinze millions (15 000 000) de F CFA pour chacune des professions.";
  wrap(nb1b).forEach((l: string) => {
    addPageIfNeeded(LINE);
    text(l, MARGIN_L, y);
    y += LINE;
  });
  y += 4;

  // NB2 (frais de dépôt)
  doc.setFont("helvetica", "bold");
  text(
    "NB2 : Frais de dépôt : Cent vingt-cinq mille (125 000) francs CFA (date d'entrée en vigueur le 02/01/2023)",
    MARGIN_L,
    y
  );
  y += 7;

  // (optionnel) tableau des frais par catégorie comme sur ta maquette finale
  doc.setFont("helvetica", "bold");
  text(
    "NB : Frais de dépôt en francs CFA par Catégorie",
    MARGIN_L,
    y
  );
  y += 6;
  doc.setFont("helvetica", "normal");
  text(
    "G = 50 000 ; F = 100 000 ; E = 300 000 ; D = 325 000 ; C = 350 000 ; B = 400 000 ; A = 450 000",
    MARGIN_L,
    y
  );

  // Sauvegarde
  const fileName = `Demande_Autorisation_${domaineReglemente}_${
    companyInfo?.nom || "Entreprise"
  }.pdf`;
  doc.save(fileName);
}

// Fonction wrapper pour maintenir la compatibilité
const generateAutorisationDocument = (domaineReglemente: DomaineActivites, businessData: BusinessData) => {
  const template = AUTORISATION_TEMPLATES[domaineReglemente];
  if (!template) {
    alert('Template de demande non trouvé pour ce domaine');
    return;
  }

  generateAutorisationPDF({
    companyInfo: businessData.companyInfo || {},
    personalInfo: businessData.personalInfo || {},
    template: template,
    domaineReglemente: domaineReglemente,
  });
};

// Nouvelle structure pour les participants selon l'API backend
export interface Participant {
  personId?: string; // Optionnel car généré automatiquement
  role: EntrepriseRole;
  pourcentageParts: number;
  dateDebut: string; // Format ISO date
  dateFin: string;   // Format ISO date
  // Champs personnels pour la création (obligatoires maintenant)
  nom: string;
  prenom: string;
  telephone?: string;
  telephone2?: string;
  email?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationnalite?: string;
  sexe?: string;
  situationMatrimoniale?: string;
  civilite?: string;
  // Champs pour les documents
  typePiece?: string;
  numeroPiece?: string;
  documentFile?: File;
  documentUrl?: string;
  // Champ spécifique pour le casier judiciaire des gérants
  casierJudiciaireFile?: File;
  // Champ spécifique pour l'acte de mariage des gérants
  acteMariageFile?: File;
  // Champ spécifique pour l'extrait de naissance des gérants
  extraitNaissanceFile?: File;
  // Champ spécifique pour le certificat de résidence des gérants
  certificatResidenceFile?: File;
  certificatResidenceUrl?: string;
  // Champ spécifique pour la pièce de nationalité des gérants d'entreprises individuelles
  pieceNationaliteFile?: File;
  // Champ spécifique pour la déclaration sur l'honneur des gérants
  declarationHonneurFile?: File;
  // Champ pour la signature (déclaration sur l'honneur)
  signatureDataUrl?: string;
  // Champs de localisation
  divisionId?: string;
  division_id?: string;
  divisionCode?: string;
  localite?: string;
  porte?: string;
  // Champs spécifiques aux personnes morales
  paysEmissionRccm?: string;
  denominationEntreprise?: string;
  rccmFile?: File;
  // Documents supplémentaires pour les entreprises individuelles
  autresDocuments?: Array<{
    id: string;
    name: string;
    file: File | null;
    description: string;
  }>;
}

// Structure pour la requête de création d'entreprise selon l'API backend
interface EntrepriseRequest {
  nom: string;
  sigle: string;
  capitale: string;
  activiteSecondaire?: string;
  adresseDifferentIdentite: boolean;
  extraitJudiciaire: boolean;
  autorisationGerant: boolean;
  autorisationExercice: boolean;
  importExport: boolean;
  statutSociete: boolean;
  typeEntreprise: TypeEntreprise;
  statutCreation: StatutCreation;
  etapeValidation: EtapeValidation;
  formeJuridique: FormeJuridique;
  domaineActivite?: DomaineActivites; // Optionnel - seulement si le domaine non réglementé nécessite une réglementation
  domaineActiviteNr?: DomaineActiviteNr; // Ajout du champ manquant
  divisionCode: string;
  participants: Participant[];
}

// Structure pour les informations personnelles (étape 1)
interface PersonalInfo {
  civility: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phone2?: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  sexe: string;
  situationMatrimoniale: string;
  typePersonne: TypePersonne;
  idType: string;
  idNumber: string;
  idExpiryDate: string;
  idIssuedAt: string;
  address: string;
  city: string;
  region: string;
  localite: string; // Champ localité (rue)
  porte: string; // Numéro de porte
  adresseLibre?: string; // Adresse libre (champ texte libre)
  divisionId: string; // ID de la division administrative
  position: string;
  powers: string[];
  roleId: number;
  idDocument?: File | null;
  idDocumentName?: string;
}

// Structure pour les informations de l'entreprise (étape 2)
interface CompanyInfo {
  nom: string;
  sigle: string;
  capitale: string;
  activiteSecondaire?: string;
  typeEntreprise: TypeEntreprise;
  formeJuridique: FormeJuridique;
  domaineActivite?: DomaineActivites; // Optionnel - seulement si le domaine non réglementé nécessite une réglementation
  domaineActiviteNr?: DomaineActiviteNr;
  divisionCode: string;
  adresseDifferentIdentite: boolean;
  extraitJudiciaire: boolean;
  autorisationGerant: boolean;
  autorisationExercice: boolean;
  importExport: boolean;
  statutSociete: boolean;
  statutCreation: StatutCreation;
  etapeValidation: EtapeValidation;
  regionId?: string;
  cercleId?: string;
  arrondissementId?: string;
  communeId?: string;
  quartierId?: string;
  rue?: string;
  porte?: string;
}

interface Documents {
  statutes: File | null;
  statutesName: string;
  needsStatutesDrafting: boolean;
  statutesPages: number;
  commerceRegistry: File | null;
  commerceRegistryName: string;
  hasCommerceRegistry: boolean;
  residenceCertificate: File | null;
  residenceCertificateName: string;
}

interface Payment {
  method?: 'moov' | 'orange' | 'wave' | 'card' | '';
  phoneNumber?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
  totalAmount?: number;
  breakdown?: {
    statutesDrafting?: number;
    registrationFees?: number;
    serviceFees?: number;
  };
}

// Structure globale pour toutes les données du processus de création
export interface BusinessCreationData {
  // Étape 1: Informations personnelles
  personalInfo: PersonalInfo & {
    isForSelf: boolean;
    hasDifferentAddress: boolean;
    hasCriminalRecord: boolean;
    isMarried: boolean;
    allowsMultipleManagers: boolean;
    requiresExerciseAuthorization: boolean;
    willImportExport: boolean;
  };
  // Étape 2: Informations de l'entreprise
  companyInfo: CompanyInfo & {
    typeEntreprise?: 'ENTREPRISE_INDIVIDUELLE' | 'SOCIETE';
  };
  // Étape 3: Participants/Associés
  participants: Participant[];
  // Étape 4: Documents
  documents?: Documents;
  // ID de la personne fondatrice (créée ou mise à jour à l'étape 1)
  founderId?: string;
  // Étape 5: Paiement
  payment?: Payment;
}

// Composant pour la sélection de localisation personnelle
const PersonalLocationStep: React.FC<{
  data: BusinessCreationData,
  updateData: (field: keyof BusinessCreationData, value: any) => void,
  isReadOnly?: boolean
}> = ({ data, updateData, isReadOnly = false }) => {
  // États pour les divisions personnelles (STRUCTURE INSTAT MALI - 4 NIVEAUX)
  const [personalRegions, setPersonalRegions] = useState<any[]>([]);
  const [personalCercles, setPersonalCercles] = useState<any[]>([]);
  const [personalCommunes, setPersonalCommunes] = useState<any[]>([]);
  const [personalQuartiers, setPersonalQuartiers] = useState<any[]>([]);

  // États pour les sélections personnelles (STRUCTURE INSTAT MALI - 4 NIVEAUX)
  const [personalSelectedRegionId, setPersonalSelectedRegionId] = useState<string>('');
  const [personalSelectedCercleId, setPersonalSelectedCercleId] = useState<string>('');
  const [personalSelectedCommuneId, setPersonalSelectedCommuneId] = useState<string>('');
  const [personalSelectedQuartierId, setPersonalSelectedQuartierId] = useState<string>('');

  // Flag pour éviter les conflits entre restauration et useEffect de chargement
  const [isRestoringPersonalData, setIsRestoringPersonalData] = useState(false);

  // Restaurer les sélections personnelles depuis data.personalInfo.divisionId
  useEffect(() => {
    if (data.personalInfo?.divisionId && personalRegions.length > 0 && !isRestoringPersonalData) {
      console.log('🔍 [PERSONAL SYNC] Restauration des sélections personnelles depuis divisionId:', data.personalInfo.divisionId);
      setIsRestoringPersonalData(true);
      
      const divisionId = data.personalInfo.divisionId;
      
      // Analyser la hiérarchie selon la longueur de l'ID
      if (divisionId.length >= 12) {
        // Quartier (12 chiffres) - extraire les codes hiérarchiques
        const regionCode = divisionId.substring(0, 2);
        const cercleCode = divisionId.substring(0, 4);
        const communeCode = divisionId.substring(0, 8);
        const quartierCode = divisionId;
        
        console.log('🔍 [PERSONAL SYNC] Hiérarchie détectée:', {
          regionCode, cercleCode, communeCode, quartierCode
        });
        
        // Trouver la région par code
        const matchingRegion = personalRegions.find(r => r.code === regionCode);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée par code:', matchingRegion.nom, 'ID:', matchingRegion.id);
          
          // Utiliser setTimeout pour s'assurer que tous les setState sont exécutés
          setTimeout(() => {
            setPersonalSelectedRegionId(matchingRegion.id);
            setPersonalSelectedRegionCode(matchingRegion.code);
            console.log('🔍 [PERSONAL SYNC] Région mise à jour');
            
            setTimeout(() => {
              setPersonalSelectedCercleId(cercleCode);
              setPersonalSelectedCercleCode(cercleCode);
              console.log('🔍 [PERSONAL SYNC] Cercle mis à jour:', cercleCode);
              
              setTimeout(() => {
                setPersonalSelectedCommuneId(communeCode);
                setPersonalSelectedCommuneCode(communeCode);
                console.log('🔍 [PERSONAL SYNC] Commune mise à jour:', communeCode);
                
                setTimeout(() => {
                  setPersonalSelectedQuartierId(quartierCode);
                  setPersonalSelectedQuartierCode(quartierCode);
                  console.log('🔍 [PERSONAL SYNC] Quartier mis à jour:', quartierCode);
                  console.log('🔍 [PERSONAL SYNC] Toute la hiérarchie restaurée:', {
                    regionId: matchingRegion.id,
                    cercleId: cercleCode,
                    communeId: communeCode,
                    quartierId: quartierCode
                  });
                  
                  // Maintenant permettre aux useEffect de charger les données et forcer le chargement des communes
                  setTimeout(() => {
                    setIsRestoringPersonalData(false);
                    console.log('🔍 [PERSONAL SYNC] Flag désactivé après restauration complète - useEffect peuvent maintenant charger les données');
                    
                    // Forcer le chargement des communes après restauration
                    if (cercleCode) {
                      console.log('🔍 [PERSONAL SYNC] Forçage du chargement des communes pour cercle:', cercleCode);
                      divisionService.getCommunesByCercle(cercleCode).then((res: any[]) => {
                        console.log('🔍 [PERSONAL SYNC] Communes forcées chargées:', res?.length || 0);
                        setPersonalCommunes(res || []);
                      }).catch(() => {
                        console.log('🔍 [PERSONAL SYNC] Erreur lors du chargement forcé des communes');
                      });
                    }
                  }, 100);
                }, 10);
              }, 10);
            }, 10);
          }, 10);
        }
      } else if (divisionId.length >= 8) {
        // Commune (8 chiffres)
        const regionCode = divisionId.substring(0, 2);
        const cercleCode = divisionId.substring(0, 4);
        const matchingRegion = personalRegions.find(r => r.code === regionCode);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée par code (commune):', matchingRegion.nom);
          setPersonalSelectedRegionId(matchingRegion.id);
          setPersonalSelectedRegionCode(matchingRegion.code);
          setPersonalSelectedCercleId(cercleCode);
          setPersonalSelectedCommuneId(divisionId);
        }
      } else if (divisionId.length >= 4) {
        // Cercle (4 chiffres)
        const regionCode = divisionId.substring(0, 2);
        const matchingRegion = personalRegions.find(r => r.code === regionCode);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée par code (cercle):', matchingRegion.nom);
          setPersonalSelectedRegionId(matchingRegion.id);
          setPersonalSelectedRegionCode(matchingRegion.code);
          setPersonalSelectedCercleId(divisionId);
        }
      } else {
        // Région (2 chiffres) ou ID direct
        const matchingRegion = personalRegions.find(r => r.id === divisionId || r.code === divisionId);
        if (matchingRegion) {
          console.log('🔍 [PERSONAL SYNC] Région trouvée directement:', matchingRegion.nom);
          setPersonalSelectedRegionId(matchingRegion.id);
          setPersonalSelectedRegionCode(matchingRegion.code);
        }
      }
      
      // Ne pas désactiver automatiquement le flag - il sera désactivé lors d'interactions manuelles
      console.log('🔍 [PERSONAL SYNC] Restauration terminée - flag maintenu actif pour éviter les réinitialisations');
    }
  }, [data.personalInfo?.divisionId, personalRegions.length]);

  // États pour les codes personnels (STRUCTURE INSTAT MALI - 4 NIVEAUX)
  const [personalSelectedRegionCode, setPersonalSelectedRegionCode] = useState<string>('');
  const [personalSelectedCercleCode, setPersonalSelectedCercleCode] = useState<string>('');
  const [personalSelectedCommuneCode, setPersonalSelectedCommuneCode] = useState<string>('');
  const [personalSelectedQuartierCode, setPersonalSelectedQuartierCode] = useState<string>('');

  // Debug: Vérifier la valeur actuelle des variables d'état personnelles
  useEffect(() => {
    console.log('🔍 [PERSONAL STATE] Variables d\'état actuelles:', {
      personalSelectedRegionId,
      personalSelectedCercleId,
      personalSelectedCommuneId,
      personalSelectedQuartierId
    });
  }, [personalSelectedRegionId, personalSelectedCercleId, personalSelectedCommuneId, personalSelectedQuartierId]);

  // Flag supprimé - plus besoin de bloquer les useEffect
  
  // Logique unifiée pour charger les arrondissements de Bamako District
  const loadBamakoArrondissements = async (regionId: string): Promise<any[]> => {
    let arrondissements: any[] = [];
    
    // Stratégie 1: Endpoint direct
    try {
      arrondissements = await divisionService.getArrondissementsByRegion(regionId);
      if (arrondissements?.length > 0) return arrondissements;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 2: searchBamakoDivisions
    try {
      const bamakoDivisions = await divisionService.searchBamakoDivisions();
      arrondissements = bamakoDivisions?.filter((d: any) => d.divisionType === 'ARRONDISSEMENT') || [];
      if (arrondissements?.length > 0) return arrondissements;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 3: getAllArrondissements + filtrage intelligent
    try {
      const allArrondissements = await divisionService.getAllArrondissements();
      const bamakoFilters = [
        (arr: any) => arr.parent?.nom?.toLowerCase().includes('bamako'),
        (arr: any) => {
          const nom = arr.nom?.toLowerCase() || '';
          const code = arr.code || '';
          return nom.includes('arrondissement') && 
                 ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => code.startsWith(prefix));
        },
        (arr: any) => {
          const code = arr.code || '';
          return ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(code);
        }
      ];
      
      for (let i = 0; i < bamakoFilters.length; i++) {
        const filtered = allArrondissements?.filter(bamakoFilters[i]) || [];
        if (filtered?.length > 0) {
          arrondissements = filtered;
          break;
        }
      }
      if (arrondissements?.length > 0) return arrondissements;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 4: Données hardcodées en dernier recours
    return [
      { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001', parent: { id: regionId } },
      { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002', parent: { id: regionId } },
      { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003', parent: { id: regionId } },
      { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004', parent: { id: regionId } },
      { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005', parent: { id: regionId } },
      { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006', parent: { id: regionId } }
    ];
  };
  
  // Logique unifiée pour charger les quartiers de Bamako District
  const loadBamakoQuartiers = async (arrondissementId: string, arrondissementCode?: string): Promise<any[]> => {
    let quartiers: any[] = [];
    
    // Stratégie 1: Endpoint direct par ID
    try {
      quartiers = await divisionService.getQuartiersByArrondissement(arrondissementId);
      if (quartiers?.length > 0) return quartiers;
    } catch (error) { /* Fallback */ }
    
    // Stratégie 2: Endpoint par code (si disponible)
    if (arrondissementCode) {
      try {
        quartiers = await divisionService.getQuartiersByArrondissementCode(arrondissementId);
        if (quartiers?.length > 0) return quartiers;
      } catch (error) { /* Fallback */ }
    }
    
    // Stratégie 3: getAllQuartiers + filtrage par code
    if (arrondissementCode) {
      try {
        const allQuartiers = await divisionService.getAllQuartiers();
        const codePrefix = arrondissementCode.substring(0, 4);
        quartiers = allQuartiers?.filter((quartier: any) => {
          const code = quartier.code || '';
          return code.startsWith(codePrefix);
        }) || [];
        if (quartiers?.length > 0) return quartiers;
      } catch (error) { /* Fallback */ }
    }
    
    // Stratégie 4: Données hardcodées par arrondissement
    const hardcodedQuartiers: Record<string, any[]> = {
      '0001': [
        { id: 'bamako-q-001-1', nom: 'Quartier Korofina Nord', code: '000101', parent: { id: arrondissementId } },
        { id: 'bamako-q-001-2', nom: 'Quartier Korofina Sud', code: '000102', parent: { id: arrondissementId } }
      ],
      '0002': [
        { id: 'bamako-q-002-1', nom: 'Quartier Niaréla', code: '000201', parent: { id: arrondissementId } },
        { id: 'bamako-q-002-2', nom: 'Quartier Bagadadji', code: '000202', parent: { id: arrondissementId } }
      ],
      '0003': [
        { id: 'bamako-q-003-1', nom: 'Quartier Point G', code: '000301', parent: { id: arrondissementId } },
        { id: 'bamako-q-003-2', nom: 'Quartier Dravéla', code: '000302', parent: { id: arrondissementId } }
      ],
      '0004': [
        { id: 'bamako-q-004-1', nom: 'Quartier Lafiabougou', code: '000401', parent: { id: arrondissementId } },
        { id: 'bamako-q-004-2', nom: 'Quartier Taliko', code: '000402', parent: { id: arrondissementId } }
      ],
      '0005': [
        { id: 'bamako-q-005-1', nom: 'Quartier Badalabougou', code: '000501', parent: { id: arrondissementId } },
        { id: 'bamako-q-005-2', nom: 'Quartier Sema I', code: '000502', parent: { id: arrondissementId } }
      ],
      '0006': [
        { id: 'bamako-q-006-1', nom: 'Quartier Banankabougou', code: '000601', parent: { id: arrondissementId } },
        { id: 'bamako-q-006-2', nom: 'Quartier Faladié', code: '000602', parent: { id: arrondissementId } }
      ]
    };
    
    const code = arrondissementCode || '0001';
    return hardcodedQuartiers[code] || hardcodedQuartiers['0001'];
  };

  // Charger les régions au montage
  useEffect(() => {
    let mounted = true;
    divisionService.getRegions().then((res: any[]) => {
      if (mounted) setPersonalRegions(res || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Charger cercles quand personalSelectedRegionId change
  useEffect(() => {
    let mounted = true;
    if (personalSelectedRegionId && !isRestoringPersonalData) {
      // Vérifier si c'est Bamako District (structure différente)
      const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
      const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
      
      if (isBamakoDistrict) {
        // Pour Bamako District, utiliser la logique unifiée
        // Pour Bamako, adapter à la nouvelle structure INSTAT Mali
        divisionService.getCerclesByRegion(personalSelectedRegionId).then((cercles: any[]) => {
          if (mounted) {
            setPersonalCercles(cercles || []);
            // Réinitialiser les listes suivantes seulement si pas de valeurs restaurées
            if (!personalSelectedCercleId && !personalSelectedCommuneId && !personalSelectedQuartierId) {
              setPersonalCommunes([]);
              setPersonalQuartiers([]);
              setPersonalSelectedCercleId('');
              setPersonalSelectedCommuneId('');
              setPersonalSelectedQuartierId('');
            } else {
              console.log('🔍 [PERSONAL SYNC] Préservation des valeurs restaurées lors du chargement des cercles');
            }
          }
        }).catch(() => {
          if (mounted) {
            setPersonalCercles([]);
            setPersonalCommunes([]);
            setPersonalQuartiers([]);
          }
        });
      } else {
        // Structure INSTAT Mali : charger les cercles
        divisionService.getCerclesByRegion(personalSelectedRegionId).then((res: any[]) => {
          if (mounted) {
            setPersonalCercles(res || []);
            // Réinitialiser les listes suivantes seulement si pas de valeurs restaurées
            if (!personalSelectedCercleId && !personalSelectedCommuneId && !personalSelectedQuartierId) {
              setPersonalCommunes([]);
              setPersonalQuartiers([]);
              setPersonalSelectedCercleId('');
              setPersonalSelectedCommuneId('');
              setPersonalSelectedQuartierId('');
            } else {
              console.log('🔍 [PERSONAL SYNC] Préservation des valeurs restaurées lors du chargement des cercles (INSTAT)');
            }
          }
        }).catch(() => {});
      }
    } else {
      // Réinitialiser toutes les listes (STRUCTURE INSTAT - 4 NIVEAUX) seulement si pas en cours de restauration
      if (!isRestoringPersonalData) {
        setPersonalCercles([]);
        setPersonalCommunes([]);
        setPersonalQuartiers([]);
        setPersonalSelectedCercleId('');
        setPersonalSelectedCommuneId('');
        setPersonalSelectedQuartierId('');
      }
    }
    return () => { mounted = false; };
  }, [personalSelectedRegionId, personalRegions, isRestoringPersonalData]);

  // Charger communes quand personalSelectedCercleId change (NOUVELLE STRUCTURE INSTAT)
  useEffect(() => {
    let mounted = true;
    if (isRestoringPersonalData) {
      console.log('🔍 [PERSONAL SYNC] useEffect communes bloqué pendant restauration');
      return () => { mounted = false; };
    }
    
    const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
    const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');

    if (personalSelectedCercleId) {
      // NOUVELLE STRUCTURE INSTAT : Cercle → Commune directement (fonctionne pour Bamako aussi)
      console.log('🔍 [PERSONAL SYNC] Chargement des communes pour cercle:', personalSelectedCercleId);
      divisionService.getCommunesByCercle(personalSelectedCercleId).then((res: any[]) => {
        if (mounted) {
          console.log('🔍 [PERSONAL SYNC] Communes chargées:', res?.length || 0);
          setPersonalCommunes(res || []);
          // Réinitialiser seulement les quartiers si pas de valeurs restaurées
          if (!personalSelectedCommuneId && !personalSelectedQuartierId) {
            setPersonalQuartiers([]);
            setPersonalSelectedCommuneId('');
            setPersonalSelectedQuartierId('');
          } else {
            console.log('🔍 [PERSONAL SYNC] Préservation des valeurs restaurées lors du chargement des communes');
          }
        }
      }).catch(() => {
        console.log('🔍 [PERSONAL SYNC] Erreur lors du chargement des communes');
      });
    } else {
      setPersonalCommunes([]);
      setPersonalQuartiers([]);
      if (!personalSelectedCommuneId && !personalSelectedQuartierId) {
        setPersonalSelectedCommuneId('');
        setPersonalSelectedQuartierId('');
      }
    }
    return () => { mounted = false; };
  }, [personalSelectedCercleId, personalRegions, personalSelectedRegionId]);


  // Charger quartiers quand personalSelectedCommuneId change
  useEffect(() => {
    let mounted = true;
    if (personalSelectedCommuneId) {
      divisionService.getQuartiersByCommune(personalSelectedCommuneId).then((res: any[]) => {
        if (mounted) setPersonalQuartiers(res || []);
      }).catch(() => {});
    } else {
      setPersonalQuartiers([]);
      setPersonalSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [personalSelectedCommuneId]);

  // Fonction pour gérer la sélection depuis la recherche
  const handleDivisionSearch = async (division: any) => {
    try {
      const hierarchy = await buildDivisionHierarchy(division);
      if (!hierarchy || Object.keys(hierarchy).length === 0) return;
      await applyDivisionHierarchySequential(hierarchy);
    } catch (error) {
    }
  };

  // Construire la hiérarchie complète depuis une division
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
          hierarchy.commune = current;
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
    
    // Dans la nouvelle structure INSTAT Mali, Bamako utilise aussi la hiérarchie standard
    // Région → Cercle → Commune → Quartier
    
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
          // Recommencer avec les données complètes
          return await buildDivisionHierarchy(fullDivision);
        } else {
          // Si toujours pas de parent, essayer de reconstruire par code (spécialement pour Bamako)
          const reconstructedHierarchy = await reconstructHierarchyByCode(division);
          if (reconstructedHierarchy && Object.keys(reconstructedHierarchy).length > 1) {
            return reconstructedHierarchy;
          }
        }
      } catch (error) {
      }
    }
    
    return hierarchy;
  };

  // Reconstruire la hiérarchie par code (pour les cas où les relations parent sont manquantes)
  const reconstructHierarchyByCode = async (division: any): Promise<any> => {
    const hierarchy: any = {};
    
    // Ajouter la division actuelle
    hierarchy[division.divisionType.toLowerCase()] = division;
    
    if (!division.code) {
      return hierarchy;
    }
    
    try {
      // Récupérer toutes les régions
      const regions = await divisionService.getRegions();
      
      // Pour Bamako (codes 0001xxxx à 0007xxxx)
      if (division.code.match(/^000[1-7]/) || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix))) {
        
        const bamakoRegion = regions.find((r: any) => 
          r.nom?.toLowerCase().includes('bamako') && 
          r.nom?.toLowerCase().includes('district')
        );
        
        if (bamakoRegion) {
          hierarchy.region = bamakoRegion;
          
          if (division.divisionType === 'QUARTIER') {
            const arrondissementCode = division.code.substring(0, 4);
            
            // Utiliser la logique de fallback pour trouver les arrondissements
            let arrondissements: any[] = [];
            
            try {
              // Tentative endpoint direct
              arrondissements = await divisionService.getArrondissementsByRegion(bamakoRegion.id);
              
              if (!arrondissements?.length) {
                // Fallback: Utiliser la même logique que les sélecteurs manuels
                const [children, bamakoDivisions, allArrondissements] = await Promise.all([
                  divisionService.getChildrenByRegion(bamakoRegion.id),
                  divisionService.searchBamakoDivisions(),
                  divisionService.getAllArrondissements()
                ]);
                
                
                // Stratégie 1: Divisions Bamako filtrées
                const bamakoArrondissements = bamakoDivisions.filter((div: any) => 
                  div.divisionType === 'ARRONDISSEMENT' && 
                  (div.nom?.includes('Arrondissement') || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(div.code))
                );
                
                if (bamakoArrondissements.length) {
                  arrondissements = bamakoArrondissements;
                } else {
                  // Stratégie 2: Tous les arrondissements filtrés par nom
                  const arrondissementsParNom = allArrondissements.filter((arr: any) => 
                    arr.nom?.includes('Arrondissement') && 
                    ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième'].some(num => arr.nom?.includes(num))
                  );
                  
                  if (arrondissementsParNom.length) {
                    arrondissements = arrondissementsParNom;
                  }
                }
                
              }
            } catch (error) {
              arrondissements = [];
            }
            
            
            // Chercher l'arrondissement correspondant (essayer plusieurs méthodes)
            
            let arrondissement = arrondissements.find((a: any) => a.code === arrondissementCode);
            
            if (!arrondissement) {
              // Essayer avec startsWith
              arrondissement = arrondissements.find((a: any) => a.code?.startsWith(arrondissementCode));
            }
            
            if (!arrondissement) {
              // Essayer avec les 3 premiers caractères
              const shortCode = arrondissementCode.substring(0, 3);
              arrondissement = arrondissements.find((a: any) => a.code?.startsWith(shortCode));
            }
            
            if (!arrondissement) {
              // Mapping manuel basé sur les codes observés
              const codeMapping: Record<string, string[]> = {
                '0001': ['0001'],         // Premier Arrondissement
                '0002': ['0002'],         // Deuxième Arrondissement  
                '0003': ['0003', '0001'], // Troisième Arrondissement (ou Premier si confusion)
                '0004': ['0004'],         // Quatrième Arrondissement
                '0005': ['0005'],         // Cinquième Arrondissement
                '0006': ['0006'],         // Sixième Arrondissement
                '0007': ['0007']          // Septième Arrondissement
              };
              
              const possibleCodes = codeMapping[arrondissementCode] || [arrondissementCode];
              arrondissement = arrondissements.find((a: any) => possibleCodes.includes(a.code));
            }
            
            if (arrondissement) {
              hierarchy.arrondissement = arrondissement;
            } else {
            }
          }
        }
      } 
      // Pour les autres régions (essayer de deviner par code)
      else {
        
        // Essayer de trouver la région par recherche dans toutes les divisions
        for (const region of regions) {
          if (region.nom?.toLowerCase().includes('bamako')) continue; // Skip Bamako, déjà traité
          
          try {
            // Essayer de charger les cercles de cette région
            const cercles = await divisionService.getCerclesByRegion(region.id);
            
            for (const cercle of cercles) {
              // Essayer de charger les arrondissements de ce cercle
              const arrondissements = await divisionService.getArrondissementsByCercle(cercle.id);
              
              for (const arrondissement of arrondissements) {
                // Essayer de charger les communes de cet arrondissement
                const communes = await divisionService.getCommunesByArrondissement(arrondissement.id);
                
                for (const commune of communes) {
                  // Essayer de charger les quartiers de cette commune
                  const quartiers = await divisionService.getQuartiersByCommune(commune.id);
                  
                  // Vérifier si notre quartier est dans cette commune
                  const foundQuartier = quartiers.find((q: any) => q.id === division.id);
                  if (foundQuartier) {
                    hierarchy.region = region;
                    hierarchy.cercle = cercle;
                    hierarchy.arrondissement = arrondissement;
                    hierarchy.commune = commune;
                    return hierarchy;
                  }
                }
              }
            }
          } catch (error) {
            // Continuer avec la région suivante
            continue;
          }
        }
        
      }
    } catch (error) {
    }
    
    return hierarchy;
  };

  // Appliquer la hiérarchie aux sélecteurs de manière séquentielle (structure INSTAT unifiée)
  const applyDivisionHierarchySequential = async (hierarchy: any) => {
    
    try {
      // Étape 1: Appliquer la région et attendre que les useEffect se terminent
      if (hierarchy.region) {
        setPersonalSelectedRegionId(hierarchy.region.id);
        setPersonalSelectedRegionCode(hierarchy.region.code);
        
        // Attendre que le useEffect région se termine
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Étape 2: Appliquer le cercle (structure INSTAT unifiée)
      if (hierarchy.cercle) {
        setPersonalSelectedCercleId(hierarchy.cercle.id);
        setPersonalSelectedCercleCode(hierarchy.cercle.code);
        
        // Attendre que le useEffect cercle se termine
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Étape 3: Appliquer la commune (structure INSTAT unifiée)
      if (hierarchy.commune) {
        setPersonalSelectedCommuneId(hierarchy.commune.id);
        setPersonalSelectedCommuneCode(hierarchy.commune.code);
        
        // Attendre que le useEffect commune se termine
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Étape 4: Appliquer le quartier (structure INSTAT unifiée)
      if (hierarchy.quartier) {
        // Structure INSTAT unifiée - application directe du quartier
        
        setPersonalSelectedQuartierId(hierarchy.quartier.id);
        setPersonalSelectedQuartierCode(hierarchy.quartier.code);
      }
      
      // Étape finale: Mettre à jour divisionId dans personalInfo
      
      // Déterminer le divisionId selon la hiérarchie (même logique que les sélecteurs)
      let finalDivisionId = '';
      
      // Structure INSTAT Mali unifiée : priorité du plus spécifique au plus général
      if (hierarchy.quartier) {
        finalDivisionId = hierarchy.quartier.id;
      } else if (hierarchy.commune) {
        finalDivisionId = hierarchy.commune.id;
      } else if (hierarchy.cercle) {
        finalDivisionId = hierarchy.cercle.id;
      } else if (hierarchy.region) {
        finalDivisionId = hierarchy.region.id;
      }
      
      if (finalDivisionId) {
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: finalDivisionId
        });
      } else {
      }
      
      
    } catch (error) {
    }
  };

  // Appliquer la hiérarchie aux sélecteurs (ancienne méthode - gardée pour référence)
  const applyDivisionHierarchy = async (hierarchy: any) => {
    
    // Structure INSTAT Mali unifiée pour toutes les régions
    
    try {
      // Région
      if (hierarchy.region) {
        setPersonalSelectedRegionId(hierarchy.region.id);
        setPersonalSelectedRegionCode(hierarchy.region.code);
        
        // Charger les cercles (structure INSTAT unifiée)
        const cercles = await divisionService.getCerclesByRegion(hierarchy.region.id);
        setPersonalCercles(cercles || []);
        
        // Attendre que les cercles soient bien mis à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Cercle (structure INSTAT unifiée)
      if (hierarchy.cercle) {
        setPersonalSelectedCercleId(hierarchy.cercle.id);
        setPersonalSelectedCercleCode(hierarchy.cercle.code);
        
        // Charger les arrondissements
        const communes = await divisionService.getCommunesByCercle(hierarchy.cercle.id);
        setPersonalCommunes(communes || []);
        
        // Attendre un peu que les communes soient bien mises à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Arrondissement - ATTENDRE que les arrondissements soient chargés d'abord
      if (hierarchy.arrondissement) {
        setPersonalSelectedCommuneId(hierarchy.arrondissement.id);
        setPersonalSelectedCommuneCode(hierarchy.arrondissement.code);
        
        // Charger les quartiers (structure INSTAT unifiée)
        const quartiers = await divisionService.getQuartiersByCommune(hierarchy.arrondissement.id);
        setPersonalQuartiers(quartiers || []);
        
        // Attendre un peu que les données soient bien mises à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Commune (structure INSTAT unifiée)
      if (hierarchy.commune) {
        setPersonalSelectedCommuneId(hierarchy.commune.id);
        setPersonalSelectedCommuneCode(hierarchy.commune.code);
        
        // Charger les quartiers
        const quartiers = await divisionService.getQuartiersByCommune(hierarchy.commune.id);
        setPersonalQuartiers(quartiers || []);
        
        // Attendre un peu que les quartiers soient bien mis à jour dans le state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Quartier
      if (hierarchy.quartier) {
        setPersonalSelectedQuartierId(hierarchy.quartier.id);
        setPersonalSelectedQuartierCode(hierarchy.quartier.code);
        
        // Mettre à jour les données du formulaire (sans modifier la localité)
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: hierarchy.quartier.id
          // localite reste inchangée - l'utilisateur peut la saisir librement
        });
      } else if (hierarchy.commune) {
        // Si pas de quartier, utiliser la commune (structure INSTAT unifiée)
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: hierarchy.commune.id
          // localite reste inchangée - l'utilisateur peut la saisir librement
        });
      } else if (hierarchy.arrondissement) {
        // Si pas de commune, utiliser l'arrondissement (cas Bamako)
        updateData('personalInfo', {
          ...data.personalInfo,
          divisionId: hierarchy.arrondissement.id
          // localite reste inchangée - l'utilisateur peut la saisir librement
        });
      }
      
      
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      {/* Recherche rapide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
          🔍 Recherche rapide de localisation
        </h3>
        <p className="text-sm text-blue-600 mb-4">
          Tapez le nom d'une localisation pour remplir automatiquement la hiérarchie administrative
        </p>
        <DivisionSearchInput
          placeholder="Rechercher une région, cercle, commune ou quartier..."
          onSelect={handleDivisionSearch}
          disabled={isReadOnly}
          className="w-full"
        />
      </div>

      {/* Sélecteurs hiérarchiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Région */}
        <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Région</label>
        <select
          value={personalSelectedRegionId}
          onChange={isReadOnly ? undefined : (e) => {
            // Désactiver le flag de restauration lors d'interaction manuelle
            setIsRestoringPersonalData(false);
            console.log('🔍 [PERSONAL SYNC] Flag désactivé par interaction manuelle - région');
            
            const regionId = e.target.value;
            const region = personalRegions.find(r => r.id === regionId);
            const regionCode = region?.code || '';
            
            setPersonalSelectedRegionId(regionId);
            setPersonalSelectedRegionCode(regionCode);
            
            // Reset des niveaux inférieurs (STRUCTURE INSTAT - 4 NIVEAUX)
            setPersonalSelectedCercleId(''); setPersonalSelectedCercleCode('');
            setPersonalSelectedCommuneId(''); setPersonalSelectedCommuneCode('');
            setPersonalSelectedQuartierId(''); setPersonalSelectedQuartierCode('');
            
            // Mettre à jour le divisionId dans personalInfo (utiliser l'ID, pas le code)
            const divisionId = regionId || '';
            updateData('personalInfo', { ...data.personalInfo, divisionId });
          }}
          disabled={isReadOnly}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
            isReadOnly 
              ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
              : 'border-gray-300 focus:ring-mali-emerald'
          }`}
        >
          <option value="">Sélectionnez une région</option>
          {personalRegions.map((r: any) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </select>
      </div>

      {/* Cercle - Masqué pour Bamako District */}
      {(() => {
        const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
        const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
        
        if (isBamakoDistrict) {
          return null; // Pas de cercle pour Bamako District
        }
        
        return (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Cercle</label>
            <select
              value={personalSelectedCercleId}
              onChange={isReadOnly ? undefined : (e) => {
                const cercleId = e.target.value;
                const cercle = personalCercles.find(c => c.id === cercleId);
                const cercleCode = cercle?.code || '';
                
                setPersonalSelectedCercleId(cercleId);
                setPersonalSelectedCercleCode(cercleCode);
                
                // Reset des niveaux inférieurs (STRUCTURE INSTAT - 4 NIVEAUX)
                setPersonalSelectedCommuneId(''); setPersonalSelectedCommuneCode('');
                setPersonalSelectedQuartierId(''); setPersonalSelectedQuartierCode('');
                
                // Mettre à jour le divisionId dans personalInfo (utiliser l'ID, pas le code)
                const divisionId = cercleId || personalSelectedRegionId || '';
                updateData('personalInfo', { ...data.personalInfo, divisionId });
              }}
              disabled={isReadOnly || !personalSelectedRegionId}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
                isReadOnly || !personalSelectedRegionId
                  ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                  : 'border-gray-300 focus:ring-mali-emerald'
              }`}
            >
              <option value="">Sélectionnez un cercle</option>
              {personalCercles.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        );
      })()}


      {/* Commune - Masqué pour Bamako District */}
      {(() => {
        const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
        const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
        
        if (isBamakoDistrict) {
          return null; // Pas de commune pour Bamako District
        }
        
        return (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Commune</label>
            <select
              value={personalSelectedCommuneId}
              onChange={isReadOnly ? undefined : (e) => {
                const communeId = e.target.value;
                const commune = personalCommunes.find(c => c.id === communeId);
                const communeCode = commune?.code || '';
                
                setPersonalSelectedCommuneId(communeId);
                setPersonalSelectedCommuneCode(communeCode);
                
                // Reset des niveaux inférieurs
                setPersonalSelectedQuartierId(''); setPersonalSelectedQuartierCode('');
                
                // Mettre à jour le divisionId dans personalInfo (utiliser l'ID, pas le code)
                const divisionId = communeId || personalSelectedCercleId || personalSelectedRegionId || '';
                updateData('personalInfo', { ...data.personalInfo, divisionId });
              }}
              disabled={isReadOnly || !personalSelectedCercleId}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
                isReadOnly || !personalSelectedCercleId
                  ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                  : 'border-gray-300 focus:ring-mali-emerald'
              }`}
            >
              <option value="">Sélectionnez une commune</option>
              {personalCommunes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        );
      })()}

      {/* Quartier */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Quartier</label>
        <select
          value={personalSelectedQuartierId}
          onChange={isReadOnly ? undefined : (e) => {
            const quartierId = e.target.value;
            const quartier = personalQuartiers.find(q => q.id === quartierId);
            const quartierCode = quartier?.code || '';
            
            setPersonalSelectedQuartierId(quartierId);
            setPersonalSelectedQuartierCode(quartierCode);
            
            // Mettre à jour le divisionId dans personalInfo (utiliser l'ID, pas le code)
            // Pour Bamako District : quartierId || arrondissementId || regionId
            // Pour les autres : quartierId || communeId || arrondissementId || cercleId || regionId
            const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
            const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
            const divisionId = isBamakoDistrict 
              ? (quartierId || personalSelectedCercleId || personalSelectedRegionId || '')
              : (quartierId || personalSelectedCommuneId || personalSelectedCercleId || personalSelectedRegionId || '');
            updateData('personalInfo', { ...data.personalInfo, divisionId });
          }}
          disabled={(() => {
            if (isReadOnly) return true;
            const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
            const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
            return isBamakoDistrict ? !personalSelectedCercleId : !personalSelectedCommuneId;
          })()}
          className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
            (() => {
              if (isReadOnly) return true;
              const selectedRegion = personalRegions.find(r => r.id === personalSelectedRegionId);
              const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
              return isBamakoDistrict ? !personalSelectedCercleId : !personalSelectedCommuneId;
            })()
              ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
              : 'border-gray-300 focus:ring-mali-emerald'
          }`}
        >
          <option value="">Sélectionnez un quartier</option>
          {personalQuartiers.map((q: any) => (
            <option key={q.id} value={q.id}>{q.nom}</option>
          ))}
        </select>
      </div>

       
      </div>
    </div>
  );
};

// Étape 0 : Identification de l'utilisateur
const UserIdentificationStep: React.FC<{isForSelf: boolean | null, setIsForSelf: (value: boolean | null) => void, handleResponse: (value: boolean) => void}> = ({ isForSelf, setIsForSelf, handleResponse }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Identification</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
        Commençons par identifier pour qui vous créez cette entreprise.
      </p>

      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark mb-3 sm:mb-4">
            Créez-vous cette entreprise pour vous-même ?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Si vous créez cette entreprise pour vous-même, nous allons pré-remplir le formulaire avec vos informations personnelles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 bg-investmali-accent hover:bg-investmali-accent/90 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Oui, c'est pour moi
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Non, c'est pour quelqu'un d'autre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Étape 1 : Informations personnelles
const PersonalInfoStep: React.FC<{data: BusinessCreationData, updateData: (field: keyof BusinessCreationData, value: any) => void, isForSelf: boolean | null, setIsForSelf: (value: boolean | null) => void, showForm: boolean, setShowForm: (value: boolean) => void}> = ({ data, updateData, isForSelf, setIsForSelf, showForm, setShowForm }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // États pour le sélecteur de pays téléphone
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Mali par défaut
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

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

  // Synchronisation automatique de TOUTES les données de localisation entre personne et entreprise
  useEffect(() => {
    if (data.personalInfo?.hasDifferentAddress === false) {
      // Si l'adresse est la même, synchroniser automatiquement TOUTES les données de localisation
      updateData('companyInfo', {
        ...data.companyInfo,
        rue: data.personalInfo?.localite || '',
        porte: data.personalInfo?.porte || '',
        divisionCode: data.personalInfo?.divisionId || '',
        regionId: data.personalInfo?.divisionId || '',
        cercleId: '',
        arrondissementId: '',
        communeId: '',
        quartierId: ''
      });
    }
  }, [data.personalInfo?.hasDifferentAddress, data.personalInfo?.localite, data.personalInfo?.porte, data.personalInfo?.divisionId]);

  // Synchronisation automatique de la forme juridique pour les entreprises individuelles
  useEffect(() => {
    if (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
      updateData('companyInfo', {
        ...data.companyInfo,
        formeJuridique: 'E_I'
      });
    }
  }, [data.companyInfo?.typeEntreprise]);

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
  
  // États pour tracker si les valeurs ont été récupérées du profil
  const [hasProfileBirthDate, setHasProfileBirthDate] = useState(false);
  const [hasProfileBirthPlace, setHasProfileBirthPlace] = useState(false);

  // Fonction pour détecter le pays à partir du numéro de téléphone
  const detectCountryFromPhone = (phoneNumber: string) => {
    if (!phoneNumber) return countries[0]; // Mali par défaut
    
    // Nettoyer le numéro (enlever espaces, tirets, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Chercher le pays correspondant à l'indicatif
    for (const country of countries) {
      if (cleanPhone.startsWith(country.code)) {
        return country;
      }
    }
    
    return countries[0]; // Mali par défaut si aucun pays trouvé
  };

  // Fonction pour extraire le numéro local (sans indicatif)
  const extractLocalNumber = (phoneNumber: string, countryCode: string) => {
    if (!phoneNumber) return '';
    
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (cleanPhone.startsWith(countryCode)) {
      const localNumber = cleanPhone.substring(countryCode.length);
      // Formater le numéro local selon le pays
      if (countryCode === '+223' && localNumber.length === 8) {
        // Format malien: XX XX XX XX
        return `${localNumber.substring(0, 2)} ${localNumber.substring(2, 4)} ${localNumber.substring(4, 6)} ${localNumber.substring(6, 8)}`;
      } else if (countryCode === '+33' && localNumber.length === 9) {
        // Format français: XX XX XX XX XX
        return `${localNumber.substring(0, 2)} ${localNumber.substring(2, 4)} ${localNumber.substring(4, 6)} ${localNumber.substring(6, 8)} ${localNumber.substring(8, 9)}`;
      } else if (countryCode === '+1' && localNumber.length === 10) {
        // Format américain: XXX XXX XXXX
        return `${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6, 10)}`;
      }
      // Format générique pour autres pays
      return localNumber;
    }
    
    return phoneNumber;
  };

  // Fonction pour nettoyer et formater la saisie téléphone selon le pays sélectionné
  const handlePhoneChange = (value: string, setter: (phone: string) => void) => {
    // Supprimer tous les caractères non numériques
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
      // États-Unis/Canada: 10 chiffres, format XXX XXX XXXX
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

  // Fermer le dropdown des pays quand on clique à l'extérieur
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

  // Récupérer l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Réinitialiser la variable globale
      (window as any).userHasInitialLocationData = false;
      
      // Récupérer l'utilisateur depuis le localStorage
      const currentUser = authAPI.getCurrentUser();
      
      if (currentUser && (currentUser.personne_id || currentUser.personneId)) {
        const personneId = currentUser.personne_id || currentUser.personneId;
        
        // Utiliser l'endpoint /api/v1/persons/personne_id pour récupérer les informations
        const personResponse = await authAPI.getPersonById(personneId);
        
        if (personResponse && personResponse.success) {
          const personData = personResponse.data;
          
          // Vérifier si nous avons des valeurs valides du profil
          const profileBirthDate = personData.dateNaissance ? 
                      (personData.dateNaissance.includes('T') ? 
                       personData.dateNaissance.split('T')[0] : 
                       personData.dateNaissance) : '';
          const profileBirthPlace = personData.lieuNaissance || '';
          
          // Marquer si nous avons récupéré des valeurs valides du profil
          setHasProfileBirthDate(!!(profileBirthDate && profileBirthDate.trim() !== ''));
          setHasProfileBirthPlace(!!(profileBirthPlace && profileBirthPlace.trim() !== ''));
          
          // Traiter le numéro de téléphone pour détecter le pays et extraire le numéro local
          const fullPhoneNumber = personData.telephone1 || personData.telephone || '';
          const detectedCountry = detectCountryFromPhone(fullPhoneNumber);
          const localPhoneNumber = extractLocalNumber(fullPhoneNumber, detectedCountry.code);
          
          // Traiter le numéro de téléphone 2
          const fullPhoneNumber2 = personData.telephone2 || '';
          const localPhoneNumber2 = fullPhoneNumber2 ? extractLocalNumber(fullPhoneNumber2, detectedCountry.code) : '';
          
          // Mettre à jour le pays sélectionné
          setSelectedCountry(detectedCountry);
          
          // Mettre à jour les données du formulaire avec les informations de la table persons
          // IMPORTANT: Préserver toutes les données existantes, ne modifier que personalInfo
          updateData('personalInfo', {
            ...data.personalInfo,
            firstName: personData.prenom || '',
            lastName: personData.nom || '',
            email: personData.email || currentUser.email || '',
            phone: localPhoneNumber, // Utiliser le numéro local sans indicatif
            phone2: localPhoneNumber2, // Ajouter le téléphone 2
            civility: personData.civilite || 
                     (personData.sexe === 'MASCULIN' ? 'M.' : 
                      personData.sexe === 'FEMININ' ? 'Mme' : 
                      currentUser.civilite || ''),
            // Récupérer la date de naissance et le lieu de naissance
            birthDate: profileBirthDate,
            birthPlace: profileBirthPlace,
            // Récupérer le sexe
            sexe: personData.sexe || '',
            // Récupérer la situation matrimoniale
            situationMatrimoniale: personData.situationMatrimoniale || '',
            // Préserver isForSelf = true car c'est pour l'utilisateur connecté
            isForSelf: true,
            // Ajouter d'autres champs si disponibles
            ...(personData.nationnalite && { 
              nationality: typeof personData.nationnalite === 'string' 
                ? personData.nationnalite 
                : personData.nationnalite.name || personData.nationnalite 
            }),
            ...(personData.numeroPiece && { idNumber: personData.numeroPiece }),
            // Corriger le mapping des données de localisation - toujours inclure même si vide
            localite: personData.localite || '',
            porte: personData.porte || '',
            divisionId: personData.division_id || '',
            
            // Si le champ porte n'existe pas encore et que localite contient des données,
            // essayer de parser pour extraire rue et porte (format: "Rue 427 Porte 231")
            ...((() => {
              if (!personData.porte && personData.localite) {
                const localiteStr = personData.localite.toString();
                // Tenter de détecter un pattern "Rue X Porte Y" ou "Rue X"
                const ruePorteMatch = localiteStr.match(/^(.+?)\s+Porte\s+(.+)$/i);
                if (ruePorteMatch) {
                  return {
                    localite: ruePorteMatch[1].trim(),
                    porte: ruePorteMatch[2].trim()
                  };
                }
                // Si pas de pattern détecté, garder tout dans localite
                return { localite: localiteStr };
              }
              return {};
            })()),
            // Définir une variable globale pour indiquer si l'utilisateur a des données de localisation initiales
            ...((() => {
              // Considérer que les données sont complètes seulement si division_id est présent
              // (localite seul n'est pas suffisant car il peut être un nom générique)
              const hasLocationData = (personData.division_id && personData.division_id.trim() !== '');
              (window as any).userHasInitialLocationData = hasLocationData;
              return {};
            })()),
            // Garder city pour compatibilité - toujours inclure même si vide
            city: personData.localite || ''
          });
          
          // Si l'utilisateur a un divisionId, récupérer la hiérarchie administrative
          if (personData.division_id && personData.division_id.trim() !== '') {
            // TODO: Implémenter la récupération de la hiérarchie depuis divisionId
          }
          return personData;
        } else {
          throw new Error(personResponse.message || 'Données utilisateur non trouvées dans la base');
        }
      } else {
        throw new Error(`Utilisateur non connecté ou personne_id manquant. Utilisateur: ${JSON.stringify(currentUser)}`);
      }
    } catch (err: any) {
      setError(`Impossible de charger vos informations: ${err.message || err}. Veuillez les saisir manuellement.`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  // Créer ou mettre à jour les informations personnelles selon le choix utilisateur
  const savePersonalInfo = async (personalData: PersonalInfo) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!token) throw new Error('Aucun token trouvé');

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(personalData.civility);
      const finalSexe = personalData.sexe || deducedSexe;
      
      // Préparer les données selon PersonCreateRequest
      const personRequest = {
        nom: personalData.lastName,
        prenom: personalData.firstName,
        telephone1: personalData.phone,
        telephone2: personalData.phone2,
        email: personalData.email,
        dateNaissance: personalData.birthDate,
        lieuNaissance: personalData.birthPlace,
        nationnalite: personalData.nationality,
        sexe: finalSexe,
        situationMatrimoniale: personalData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(personalData.civility),
        division_id: personalData.divisionId || undefined,
        localite: personalData.localite || undefined,
        porte: personalData.porte || undefined,
        adresseLibre: personalData.adresseLibre || undefined,
        role: 'USER',
        entrepriseRole: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };

      // 🔍 DEBUG: Logs pour tracer le problème de persistance du champ 'porte'
      console.log('🔍 [DEBUG] Données personnelles reçues:', personalData);
      console.log('🔍 [DEBUG] Champ localite:', personalData.localite);
      console.log('🔍 [DEBUG] Champ porte:', personalData.porte);
      console.log('🔍 [DEBUG] Requête envoyée au backend:', personRequest);

      let response;
      
      if (isForSelf && currentUser.personne_id) {
        // PUT - Mise à jour de la personne existante
        response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      } else {
        // POST - Création d'une nouvelle personne
        response = await fetch('/api/v1/persons', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err: any) {
      setError(`Impossible de sauvegarder les informations personnelles: ${err.message || err}`);
      return null;
    }
  };

  // Créer un associé avec EntrepriseRole.ASSOCIE
  const createAssociate = async (associateData: PersonalInfo) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Préparer les données selon PersonCreateRequest
      const personRequest = {
        nom: associateData.lastName,
        prenom: associateData.firstName,
        telephone1: associateData.phone,
        telephone2: associateData.phone2,
        email: associateData.email,
        dateNaissance: associateData.birthDate,
        lieuNaissance: associateData.birthPlace,
        nationnalite: associateData.nationality,
        sexe: associateData.sexe,
        situationMatrimoniale: associateData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(associateData.civility),
        division_id: associateData.divisionId, // Ajouter le division_id
        localite: associateData.localite, // Ajouter la localité
        porte: associateData.porte, // Ajouter le numéro de porte
        role: 'USER',
        entrepriseRole: 'ASSOCIE' // Rôle spécifique pour les associés
      };

      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'associé');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err: any) {
      setError(`Impossible de créer l'associé: ${err.message || err}`);
      return null;
    }
  };

  // Créer un gérant avec EntrepriseRole.GERANT
  const createManager = async (managerData: PersonalInfo) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Formater le numéro de téléphone au format E.164 pour le gérant
      let formattedManagerPhone = '';
      if (managerData.phone) {
        const cleanPhone = managerData.phone.replace(/[\s\-\.]/g, '');
        if (cleanPhone.startsWith('+')) {
          formattedManagerPhone = cleanPhone; // Déjà au format E.164
        } else {
          formattedManagerPhone = `+223${cleanPhone}`; // Ajouter l'indicatif Mali
        }
      }

      // Préparer les données selon PersonCreateRequest pour un gérant
      const personRequest = {
        nom: managerData.lastName,
        prenom: managerData.firstName,
        telephone1: formattedManagerPhone,
        telephone2: managerData.phone2,
        email: managerData.email,
        dateNaissance: managerData.birthDate,
        lieuNaissance: managerData.birthPlace,
        nationnalite: managerData.nationality,
        sexe: managerData.sexe,
        situationMatrimoniale: managerData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(managerData.civility),
        division_id: managerData.divisionId, // Ajouter le division_id
        localite: managerData.localite, // Ajouter la localité
        porte: managerData.porte, // Ajouter le numéro de porte
        role: 'USER',
        entrepriseRole: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT' // Rôle spécifique pour le gérant
      };

      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du gérant');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err: any) {
      setError(`Impossible de créer le gérant: ${err.message || err}`);
      return null;
    }
  };

  const handleNext = async () => {
    if (data.personalInfo) {
      try {
        setIsLoading(true);
        setError('');
        
        // WORKFLOW ÉTAPE 1: Sauvegarder informations personnelles (PUT/POST selon choix)
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        if (!token) throw new Error('Aucun token trouvé');

        // Reconstruire le numéro complet avec l'indicatif pour la sauvegarde (format E.164)
        let fullPhoneForSave = '';
        if (data.personalInfo.phone) {
          const cleanPhone = data.personalInfo.phone.replace(/[\s\-\.]/g, '');
          if (cleanPhone.startsWith('+')) {
            fullPhoneForSave = cleanPhone; // Déjà au format E.164
          } else {
            fullPhoneForSave = `${selectedCountry.code}${cleanPhone}`;
          }
        }

        // Préparer les données selon PersonCreateRequest
        const personRequest = {
          nom: data.personalInfo.lastName,
          prenom: data.personalInfo.firstName,
          telephone1: fullPhoneForSave, // Sauvegarder le numéro complet avec indicatif
          telephone2: data.personalInfo.phone2 ? (data.personalInfo.phone2.startsWith('+') ? data.personalInfo.phone2 : '+223' + data.personalInfo.phone2.replace(/\s/g, '')) : '',
          email: data.personalInfo.email,
          dateNaissance: data.personalInfo.birthDate,
          lieuNaissance: data.personalInfo.birthPlace,
          nationnalite: data.personalInfo.nationality,
          sexe: data.personalInfo.sexe,
          situationMatrimoniale: data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE',
          civilite: mapCivilityToBackend(data.personalInfo.civility),
          role: 'USER',
          entrepriseRole: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
        };


        let response;
        
        if (data.personalInfo.isForSelf && currentUser.personne_id) {
          // PUT - Mise à jour de la personne existante
          response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(personRequest)
          });
        } else {
          // POST - Création d'une nouvelle personne
          response = await fetch('/api/v1/persons', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(personRequest)
          });
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
        }
        
        const result = await response.json();
        
        // Stocker founderId pour les étapes suivantes
        updateData('founderId', result.id || result.data?.id);
        
      } catch (err: any) {
        setError(`Impossible de sauvegarder les informations personnelles: ${err.message || err}`);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    // onNext(); // Removed as this function is not needed in PersonalInfoStep
  };

  return (
    <div className="animate-fade-in">
      {/* Questionnaire de sélection du type d'entreprise */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-[#47c559] rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-green-800">Type d'entreprise</h2>
            <p className="text-green-600 font-medium mt-1">
              Création d'entreprise individuelle
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={() => updateData('companyInfo', { ...data.companyInfo, typeEntreprise: 'ENTREPRISE_INDIVIDUELLE' })}
            className="p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 text-left border-[#47c559] bg-green-50 shadow-lg"
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-[#47c559] text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-green-800">
                  Entreprise Individuelle
                </h3>
              </div>
            </div>
          </button>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2">Informations Personnelles</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
        Commençons par quelques informations sur vous avant de créer votre {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'entreprise individuelle' : 'société'}.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-investmali-accent"></div>
          <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-600">Chargement de vos informations...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : showForm ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg sm:text-xl font-semibold text-investmali-neutral-dark mb-3 sm:mb-4">
              {isForSelf ? 'Vos informations personnelles' : 'Informations du représentant'}
            </h3>
            
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4 md:gap-6">
             <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Nom</label>
                <input
                  type="text"
                  value={data.personalInfo?.lastName || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    lastName: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={data.personalInfo?.firstName || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    firstName: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                  placeholder=""
                />
              </div>    

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center">
                  Civilité
                  {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )}
                </label>
                <select
                  value={data.personalInfo?.civility || ''}
                  onChange={isForSelf ? undefined : (e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    civility: e.target.value
                  })}
                  disabled={!!isForSelf}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                    isForSelf 
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-mali-emerald'
                  }`}
                >
                  <option value="">Sélectionnez...</option>
                  {Object.entries(CIVILITE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              
             
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center">
                  Date de naissance
                  {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={data.personalInfo?.birthDate || ''}
                  max={(() => {
                    const today = new Date();
                    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  onChange={(e) => {
                    updateData('personalInfo', {
                      ...data.personalInfo,
                      birthDate: e.target.value
                    });
                  }}
                  disabled={!!isForSelf && hasProfileBirthDate}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                    isForSelf && hasProfileBirthDate
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-mali-emerald'
                  }`}
                  required
                />
                {/* <p className="text-xs text-gray-500 mt-1">L'utilisateur doit avoir au moins 18 ans</p> */}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 flex items-center">
                  Lieu de naissance
                  {/* {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )} */}
                </label>
                <input
                  type="text"
                  value={data.personalInfo?.birthPlace || ''}
                  onChange={(e) => {
                    updateData('personalInfo', {
                      ...data.personalInfo,
                      birthPlace: e.target.value
                    });
                  }}
                  disabled={!!isForSelf && hasProfileBirthPlace}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base ${
                    isForSelf && hasProfileBirthPlace
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-mali-emerald'
                  }`}
                  placeholder=""
                  required
                />
              </div>
               <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Email</label>
                <input
                  type="email"
                  value={data.personalInfo?.email || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    email: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                  placeholder=""
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Téléphone</label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative country-dropdown">
                      <button 
                        type="button" 
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-2 py-2 sm:px-3 sm:py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
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
                      value={data.personalInfo?.phone || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => updateData('personalInfo', {
                        ...data.personalInfo,
                        phone: phone
                      }))}
                      className="flex-1 px-2 py-2 sm:px-3 sm:py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50 text-sm sm:text-base"
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Téléphone 2 (optionnel)</label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative country-dropdown">
                      <button 
                        type="button" 
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-2 py-2 sm:px-3 sm:py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300"
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
                      value={data.personalInfo?.phone2 || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => updateData('personalInfo', {
                        ...data.personalInfo,
                        phone2: phone
                      }))}
                      className="flex-1 px-2 py-2 sm:px-3 sm:py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-300 hover:border-investmali-accent/50 text-sm sm:text-base"
                      placeholder={phonePlaceholder}
                      maxLength={phoneMaxLength}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Numéro de téléphone secondaire (optionnel)
                  </p>
                </div>
              </div>

              {/* Rue et Porte dans un seul div */}
              <div className="grid grid-cols-4 sm:grid-cols-2 gap-4">
                {/* Rue */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Rue</label>
                  <input
                    type="text"
                    value={data.personalInfo?.localite || ''}
                    onChange={(e) => updateData('personalInfo', {
                      ...data.personalInfo,
                      localite: e.target.value
                    })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                    placeholder=""
                  />
                </div>

                {/* Porte */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Porte</label>
                  <input
                    type="text"
                    value={data.personalInfo?.porte || ''}
                    onChange={(e) => updateData('personalInfo', {
                      ...data.personalInfo,
                      porte: e.target.value
                    })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Adresse libre */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Adresse complète (optionnel)</label>
                <textarea
                  value={data.personalInfo?.adresseLibre || ''}
                  onChange={(e) => updateData('personalInfo', {
                    ...data.personalInfo,
                    adresseLibre: e.target.value
                  })}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent text-sm sm:text-base"
                  placeholder="Saisissez votre adresse complète (ex: Quartier Lafiabougou, Rue 427, Porte 231, près de la pharmacie)"
                  rows={3}
                />
              </div>

              {/* Message informatif pour les champs récupérés automatiquement */}
              {isForSelf && (
                <div className="sm:col-span-2">
                  {/* <div className="mb-3 sm:mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {(hasProfileBirthDate && hasProfileBirthPlace) ? 
                        "Vos informations de naissance ont été récupérées depuis votre profil." :
                        (hasProfileBirthDate || hasProfileBirthPlace) ?
                        "Certaines informations ont été récupérées. Veuillez compléter les informations manquantes." :
                        "Vos informations personnelles ont été pré-remplies. Veuillez saisir votre date et lieu de naissance."
                      }
                    </p>
                  </div> */}
                </div>
              )}

              {/* Localisation personnelle avec sélection hiérarchique */}
              <div className="sm:col-span-2">
                <h4 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
                  <span className="text-lg sm:text-xl mr-1.5 sm:mr-2">📍</span>
                  Votre localisation
                  {/* {isForSelf && (
                    <span className="ml-1.5 sm:ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Récupéré automatiquement
                    </span>
                  )} */}
                </h4>
                {/* {isForSelf && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {data.personalInfo?.localite || data.personalInfo?.divisionId ? 
                        "Ces informations ont été récupérées depuis votre profil et ne peuvent pas être modifiées ici." :
                        "Vos informations personnelles ont été pré-remplies. Veuillez compléter les informations de localisation manquantes."
                      }
                    </p>
                  </div>
                )} */}
                <PersonalLocationStep 
                  data={data}
                  updateData={updateData}
                  isReadOnly={(() => {
                    // Si ce n'est pas pour soi, toujours modifiable
                    if (!isForSelf) return false;
                    
                    // Utiliser une variable globale pour stocker les données initiales
                    const hasInitialLocationData = (window as any).userHasInitialLocationData || false;
                    return hasInitialLocationData;
                  })()}
                />
              </div>

              {/* Nouvelles questions */}
              <div className="sm:col-span-2 space-y-4 sm:space-y-6 pt-3 sm:pt-4 border-t border-gray-200">
                <div>
                  <p className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Votre adresse est-elle différente de celle de votre entreprise ?</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        updateData('personalInfo', {
                          ...data.personalInfo,
                          hasDifferentAddress: true
                        });
                        // Vider les champs rue et porte de l'entreprise car l'adresse est différente
                        updateData('companyInfo', {
                          ...data.companyInfo,
                          rue: '',
                          porte: ''
                        });
                      }}
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg border text-sm sm:text-base ${data.personalInfo?.hasDifferentAddress === true 
                        ? 'bg-investmali-accent text-white border-investmali-accent' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateData('personalInfo', {
                          ...data.personalInfo,
                          hasDifferentAddress: false
                        });
                        // Synchroniser TOUTES les données de localisation de l'entreprise avec celles de la personne
                        updateData('companyInfo', {
                          ...data.companyInfo,
                          rue: data.personalInfo?.localite || '',
                          porte: data.personalInfo?.porte || '',
                          divisionCode: data.personalInfo?.divisionId || '',
                          regionId: data.personalInfo?.divisionId || '',
                          cercleId: '',
                          arrondissementId: '',
                          communeId: '',
                          quartierId: ''
                        });
                      }}
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg border text-sm sm:text-base ${data.personalInfo?.hasDifferentAddress === false 
                        ? 'bg-investmali-accent text-white border-investmali-accent' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Non
                    </button>
                  </div>

                </div>

                {/* Extrait de casier judiciaire */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Avez-vous un extrait de casier judiciaire ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        hasCriminalRecord: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.hasCriminalRecord === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        hasCriminalRecord: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.hasCriminalRecord === false ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Situation matrimoniale */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Êtes-vous marié(e) ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        isMarried: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.isMarried === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        isMarried: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.isMarried === false ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>


                {/* Responsables supplémentaires */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Autorisez-vous une ou plusieurs personnes à être responsable de l'entreprise ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        allowsMultipleManagers: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.allowsMultipleManagers === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        allowsMultipleManagers: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.allowsMultipleManagers === false ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Autorisation d'exercice */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Votre activité est-elle soumise à une autorisation d'exercice ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        requiresExerciseAuthorization: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.requiresExerciseAuthorization === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        requiresExerciseAuthorization: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.requiresExerciseAuthorization === false ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>

                {/* Import/Export */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium text-gray-700">Allez-vous importer ou exporter des marchandises ?</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        willImportExport: true
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.willImportExport === true ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => updateData('personalInfo', {
                        ...data.personalInfo,
                        willImportExport: false
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${data.personalInfo?.willImportExport === false ? 'bg-investmali-accent text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Non
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bouton Continuer masqué */}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Nous allons maintenant collecter les informations sur l'entreprise.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleNext}
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-md text-sm font-medium"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Étape 2 : Informations de l'entreprise
const CompanyInfoStep: React.FC<{data: BusinessCreationData, updateData: (field: keyof BusinessCreationData, value: any) => void}> = ({ data, updateData: updateBusinessData }) => {
  

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
        (arr: any) => {
          const code = arr.code || '';
          return ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(code);
        }
      ];
      
      for (let i = 0; i < bamakoFilters.length; i++) {
        const filtered = allArrondissements?.filter(bamakoFilters[i]) || [];
        
        if (filtered?.length > 0) {
          arrondissements = filtered;
          break;
        }
      }
      
      if (arrondissements?.length > 0) {
        return arrondissements;
      }
    } catch (error) {
    }
    
    // Stratégie 4: Données hardcodées en dernier recours
    arrondissements = [
      { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001', parent: { id: regionId } },
      { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002', parent: { id: regionId } },
      { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003', parent: { id: regionId } },
      { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004', parent: { id: regionId } },
      { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005', parent: { id: regionId } },
      { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006', parent: { id: regionId } }
    ];
    
    return arrondissements;
  };

  // Logique unifiée pour charger les quartiers de Bamako District
  const loadBamakoQuartiers = async (arrondissementId: string, arrondissementCode?: string): Promise<any[]> => {
    let quartiers: any[] = [];
    
    // Stratégie 1: Endpoint direct par ID
    try {
      quartiers = await divisionService.getQuartiersByArrondissement(arrondissementId);
      
      if (quartiers?.length > 0) {
        return quartiers;
      }
    } catch (error) {
    }
    
    // Stratégie 2: Endpoint par code (si disponible)
    if (arrondissementCode) {
      try {
        quartiers = await divisionService.getQuartiersByArrondissementCode(arrondissementId);
        
        if (quartiers?.length > 0) {
          return quartiers;
        }
      } catch (error) {
      }
    }
    
    // Stratégie 3: getAllQuartiers + filtrage par code
    if (arrondissementCode) {
      try {
        const allQuartiers = await divisionService.getAllQuartiers();
        const codePrefix = arrondissementCode.substring(0, 4);
        
        quartiers = allQuartiers?.filter((quartier: any) => {
          const code = quartier.code || '';
          return code.startsWith(codePrefix);
        }) || [];
        
        if (quartiers?.length > 0) {
          return quartiers;
        }
      } catch (error) {
      }
    }
    
    // Stratégie 4: Données hardcodées par arrondissement
    const hardcodedQuartiers: Record<string, any[]> = {
      '0001': [
        { id: 'bamako-q-001-1', nom: 'Quartier Korofina Nord', code: '000101', parent: { id: arrondissementId } },
        { id: 'bamako-q-001-2', nom: 'Quartier Korofina Sud', code: '000102', parent: { id: arrondissementId } }
      ],
      '0002': [
        { id: 'bamako-q-002-1', nom: 'Quartier Niaréla', code: '000201', parent: { id: arrondissementId } },
        { id: 'bamako-q-002-2', nom: 'Quartier Bagadadji', code: '000202', parent: { id: arrondissementId } }
      ],
      '0003': [
        { id: 'bamako-q-003-1', nom: 'Quartier Point G', code: '000301', parent: { id: arrondissementId } },
        { id: 'bamako-q-003-2', nom: 'Quartier Dravéla', code: '000302', parent: { id: arrondissementId } }
      ],
      '0004': [
        { id: 'bamako-q-004-1', nom: 'Quartier Lafiabougou', code: '000401', parent: { id: arrondissementId } },
        { id: 'bamako-q-004-2', nom: 'Quartier Taliko', code: '000402', parent: { id: arrondissementId } }
      ],
      '0005': [
        { id: 'bamako-q-005-1', nom: 'Quartier Badalabougou', code: '000501', parent: { id: arrondissementId } },
        { id: 'bamako-q-005-2', nom: 'Quartier Sema I', code: '000502', parent: { id: arrondissementId } }
      ],
      '0006': [
        { id: 'bamako-q-006-1', nom: 'Quartier Banankabougou', code: '000601', parent: { id: arrondissementId } },
        { id: 'bamako-q-006-2', nom: 'Quartier Faladié', code: '000602', parent: { id: arrondissementId } }
      ]
    };
    
    const code = arrondissementCode || '0001';
    quartiers = hardcodedQuartiers[code] || hardcodedQuartiers['0001'];
    
    return quartiers;
  };

  const [showValidation, setShowValidation] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [cercles, setCercles] = useState<any[]>([]);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [quartiers, setQuartiers] = useState<any[]>([]);
  
  // États pour les enums du backend
  const [typeEntrepriseOptions, setTypeEntrepriseOptions] = useState<any[]>([]);
  const [formeJuridiqueOptions, setFormeJuridiqueOptions] = useState<any[]>([]);
  const [domaineActiviteOptions, setDomaineActiviteOptions] = useState<any[]>([]);
  const [domaineActiviteNrOptions, setDomaineActiviteNrOptions] = useState<any[]>([]);
  
  // Variables d'état pour les IDs sélectionnés (UUIDs pour API)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedCercleId, setSelectedCercleId] = useState<string>('');
  const [selectedArrondissementId, setSelectedArrondissementId] = useState<string>('');
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>('');
  const [selectedQuartierId, setSelectedQuartierId] = useState<string>('');
  
  // Variables d'état pour les codes sélectionnés (codes numériques pour divisionCode)
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('');
  const [selectedCercleCode, setSelectedCercleCode] = useState<string>('');
  const [selectedArrondissementCode, setSelectedArrondissementCode] = useState<string>('');
  const [selectedCommuneCode, setSelectedCommuneCode] = useState<string>('');
  const [selectedQuartierCode, setSelectedQuartierCode] = useState<string>('');

  // useEffect pour restaurer les sélections de localisation depuis data.companyInfo
  useEffect(() => {
    console.log('🔍 [LOCATION DEBUG] useEffect de restauration déclenché:', {
      regionId: data.companyInfo?.regionId,
      cercleId: data.companyInfo?.cercleId,
      communeId: data.companyInfo?.communeId,
      quartierId: data.companyInfo?.quartierId
    });
    
    if (data.companyInfo?.regionId) {
      console.log('🔍 [LOCATION DEBUG] Restauration regionId:', data.companyInfo.regionId);
      setSelectedRegionId(data.companyInfo.regionId);
    }
    if (data.companyInfo?.cercleId) {
      console.log('🔍 [LOCATION DEBUG] Restauration cercleId:', data.companyInfo.cercleId);
      setSelectedCercleId(data.companyInfo.cercleId);
    }
    if (data.companyInfo?.arrondissementId) {
      console.log('🔍 [LOCATION DEBUG] Restauration arrondissementId:', data.companyInfo.arrondissementId);
      setSelectedArrondissementId(data.companyInfo.arrondissementId);
    }
    if (data.companyInfo?.communeId) {
      console.log('🔍 [LOCATION DEBUG] Restauration communeId:', data.companyInfo.communeId);
      setSelectedCommuneId(data.companyInfo.communeId);
    }
    if (data.companyInfo?.quartierId) {
      console.log('🔍 [LOCATION DEBUG] Restauration quartierId:', data.companyInfo.quartierId);
      setSelectedQuartierId(data.companyInfo.quartierId);
    }
  }, [data.companyInfo?.regionId, data.companyInfo?.cercleId, data.companyInfo?.arrondissementId, data.companyInfo?.communeId, data.companyInfo?.quartierId]);

  // Charger les régions et enums au montage + initialiser depuis les données existantes
  useEffect(() => {
    let mounted = true;
    
    // Charger les régions
    divisionService.getRegions().then((res: any[]) => {
      if (mounted) setRegions(res || []);
    }).catch(() => {});
    
    // Charger les enums du backend
    Promise.all([
      enumService.getTypeEntreprise(),
      enumService.getFormeJuridique(), 
      enumService.getDomaineActivites(),
      enumService.getDomaineActivitesNr()
    ]).then(([typeEntreprise, formeJuridique, domaineActivites, domaineActivitesNr]) => {
      if (mounted) {
        setTypeEntrepriseOptions(typeEntreprise || []);
        setFormeJuridiqueOptions(formeJuridique || []);
        setDomaineActiviteOptions(domaineActivites || []);
        setDomaineActiviteNrOptions(domaineActivitesNr || []);
      }
    }).catch(error => {
    });
    
    return () => { mounted = false; };
  }, []);

  // Fonction de synchronisation séquentielle (inspirée de DossierCreationForm.tsx)
  const applyCompanyHierarchySequential = async (hierarchy: any) => {
    try {
      // Étape 1: Appliquer la région
      if (hierarchy.region) {
        setSelectedRegionId(hierarchy.region.id);
        
        // Charger manuellement les cercles depuis la région
        try {
          const cercles = await divisionService.getCerclesByRegion(hierarchy.region.id);
          setCercles(cercles || []);
        } catch (error) {
        }
      }
      
      // Étape 2: Appliquer le cercle
      if (hierarchy.cercle) {
        setSelectedCercleId(hierarchy.cercle.id);
        
        // Charger manuellement les communes depuis le cercle
        try {
          const communes = await divisionService.getCommunesByCercle(hierarchy.cercle.id);
          setCommunes(communes || []);
        } catch (error) {
        }
      }
      
      // Étape 3: Appliquer la commune (structure INSTAT moderne)
      if (hierarchy.commune) {
        setSelectedCommuneId(hierarchy.commune.id);
        
        // Charger manuellement les quartiers depuis la commune
        try {
          const quartiers = await divisionService.getQuartiersByCommune(hierarchy.commune.id);
          setQuartiers(quartiers || []);
        } catch (error) {
        }
      }
      
      // Étape 4: Appliquer le quartier
      if (hierarchy.quartier) {
        setSelectedQuartierId(hierarchy.quartier.id);
      }
    } catch (error) {
    }
  };

  // Écouter l'événement de synchronisation immédiate
  useEffect(() => {
    const handleDivisionCodeSync = (event: any) => {
      const { divisionCode } = event.detail;
      
      if (divisionCode && data.personalInfo?.hasDifferentAddress === false && regions.length > 0) {
          triggerSelectorSync(divisionCode);
      }
    };
    
    window.addEventListener('divisionCodeSynchronized', handleDivisionCodeSync);
    return () => window.removeEventListener('divisionCodeSynchronized', handleDivisionCodeSync);
  }, [data.personalInfo?.hasDifferentAddress, regions.length]);

  // Fonction pour déclencher la synchronisation des sélecteurs
  const triggerSelectorSync = (divisionCode: string) => {
    
    // Construire la hiérarchie depuis le divisionCode (comme côté agent)
    const regionCode = divisionCode.substring(0, 2);
    const cercleCode = divisionCode.substring(0, 4);
    const communeCode = divisionCode.substring(0, 8);
    
    // Construire l'objet hiérarchie
    const hierarchy: any = {};
    
    // Trouver les éléments dans les listes chargées
    hierarchy.region = regions.find((r: any) => r.code === regionCode);
    // Les autres seront trouvés au fur et à mesure du chargement
    
    if (hierarchy.region) {
      // Construire la hiérarchie complète de manière asynchrone
      divisionService.getCerclesByRegion(hierarchy.region.id).then((cerclesList: any[]) => {
        hierarchy.cercle = cerclesList?.find((c: any) => c.code === cercleCode);
        
        if (hierarchy.cercle) {
          return divisionService.getCommunesByCercle(hierarchy.cercle.id);
        }
        return [];
      }).then((communesList: any[]) => {
        hierarchy.commune = communesList?.find((c: any) => c.code === communeCode);
        
        if (hierarchy.commune) {
          return divisionService.getQuartiersByCommune(hierarchy.commune.id);
        }
        return [];
      }).then((quartiersList: any[]) => {
        hierarchy.quartier = quartiersList?.find((q: any) => q.code === divisionCode);
        
        // Maintenant appliquer la hiérarchie complète
        applyCompanyHierarchySequential(hierarchy);
      }).catch(error => {
      });
    }
  };

  // Synchronisation avec la logique agent - quand divisionCode change
  useEffect(() => {
    if (data.companyInfo?.divisionCode && data.personalInfo?.hasDifferentAddress === false && regions.length > 0) {
      triggerSelectorSync(data.companyInfo.divisionCode);
    }
  }, [data.companyInfo?.divisionCode, data.personalInfo?.hasDifferentAddress, regions.length]);

  // Synchronisation directe des sélecteurs depuis divisionCode (obsolète - remplacé par le useEffect ci-dessus)
  useEffect(() => {
    
    if (data.companyInfo?.divisionCode && data.personalInfo?.hasDifferentAddress === false && regions.length > 0) {
      
      const code = data.companyInfo.divisionCode;
      
      // Déterminer le type de division depuis le code
      if (code.length >= 12) {
        // Code quartier complet (ex: 010101010001 pour Kayes ou 900101010020 pour Bamako)
        const regionCode = code.substring(0, 2);
        const cercleCode = code.substring(0, 4);
        const communeCode = code.substring(0, 8);
        
        // Trouver la région correspondante
        const region = regions.find(r => r.code === regionCode);
        if (region) {
          setSelectedRegionId(region.id);
        }
        
        // Trouver le cercle correspondant
        const cercle = cercles.find(c => c.code === cercleCode);
        if (cercle) {
          setSelectedCercleId(cercle.id);
        }
        
        // Trouver la commune correspondante
        const commune = communes.find(c => c.code === communeCode);
        if (commune) {
          setSelectedCommuneId(commune.id);
        }
        
        // Trouver le quartier correspondant
        const quartier = quartiers.find(q => q.code === code);
        if (quartier) {
          setSelectedQuartierId(quartier.id);
        }
        
      } else if (code.length >= 8) {
        // Code commune (ex: 90010101)
        setSelectedRegionId('90');
        setSelectedCercleId('9001');
        
        const communeId = communes.find(c => c.code === code)?.id;
        if (communeId) {
          setSelectedCommuneId(communeId);
        }
        
      } else if (code.length >= 4) {
        // Code cercle (ex: 9001)
        setSelectedRegionId('90');
        setSelectedCercleId('9001');
        
      }
    }
  }, [data.companyInfo?.divisionCode, data.personalInfo?.hasDifferentAddress, regions.length, communes.length, quartiers.length]);

  // Synchronisation avec la localisation personnelle (Structure INSTAT moderne)
  useEffect(() => {
    const hasDifferentAddress = data.personalInfo?.hasDifferentAddress;
    
    
    // Synchronisation directe via analyse du divisionId (Structure INSTAT moderne)
    if (hasDifferentAddress === false && regions.length > 0 && data.personalInfo?.divisionId) {
      
      const personalDivisionId = data.personalInfo.divisionId;
      
      // Analyser directement le code pour extraire la hiérarchie
      if (personalDivisionId && personalDivisionId.length >= 12) {
        // Code quartier complet (ex: 010101010001)
        const regionCode = personalDivisionId.substring(0, 2); // 01
        const cercleCode = personalDivisionId.substring(0, 4); // 0101
        const communeCode = personalDivisionId.substring(0, 8); // 01010101
        const quartierCode = personalDivisionId; // 010101010001
        
        
        // Synchroniser le divisionCode directement avec le code personnel
        updateBusinessData('companyInfo', {
          ...data.companyInfo,
          divisionCode: quartierCode
        });
        
        // Déclencher immédiatement la synchronisation des sélecteurs
        setTimeout(() => {
          // Simuler un changement de divisionCode pour déclencher les useEffect du CompanyInfoStep
          const event = new CustomEvent('divisionCodeSynchronized', { 
            detail: { divisionCode: quartierCode } 
          });
          window.dispatchEvent(event);
        }, 100);
      }
      
      // Synchroniser aussi la localité textuelle
      if (data.personalInfo?.localite) {
        updateBusinessData('companyInfo', {
          ...data.companyInfo,
          localite: data.personalInfo.localite
        });
      }
      return;
    }

    // Si l'adresse n'est PAS différente (même adresse), synchroniser
    // Attendre que les régions soient chargées avant de synchroniser
    if (hasDifferentAddress === false && regions.length > 0) {
      // Récupérer les données de localisation personnelle
      const personalDivisionId = data.personalInfo?.divisionId;
      const personalLocalite = data.personalInfo?.localite;
      
      if (personalDivisionId) {
        // Récupérer la division personnelle pour obtenir son code
        divisionService.getById(personalDivisionId).then((division: any) => {
          if (division) {
            
            // Mettre à jour le divisionCode de l'entreprise
            updateBusinessData('companyInfo', {
              ...data.companyInfo,
              divisionCode: division.code
            });
            
            // Construire la hiérarchie pour pré-sélectionner les champs
            const buildHierarchy = (div: any): any => {
              const hierarchy: any = {};
              let current = div;
              
              while (current) {
                switch (current.divisionType) {
                  case 'REGION':
                    hierarchy.region = current;
                    break;
                  case 'CERCLE':
                    hierarchy.cercle = current;
                    break;
                  case 'ARRONDISSEMENT':
                    hierarchy.arrondissement = current;
                    break;
                  case 'COMMUNE':
                    hierarchy.commune = current;
                    break;
                  case 'QUARTIER':
                    hierarchy.quartier = current;
                    break;
                }
                current = current.parent;
              }
              
              return hierarchy;
            };
            
            const hierarchy = buildHierarchy(division);
            
            // Détecter si c'est Bamako District
            let isBamakoDistrict = hierarchy.region?.nom?.toLowerCase().includes('bamako') && 
                                  hierarchy.region?.nom?.toLowerCase().includes('district');
            
            // Fallback : détecter Bamako par le code de division
            if (!isBamakoDistrict && division.code && (division.code.startsWith('0004') || division.code.startsWith('00'))) {
              isBamakoDistrict = true;
            }
            
            // Pré-sélectionner les champs selon la hiérarchie et charger les listes nécessaires
            if (hierarchy.region) {
              setSelectedRegionId(hierarchy.region.id);
              setSelectedRegionCode(hierarchy.region.code);
              
              // Charger les cercles pour cette région (si pas Bamako District)
              if (!isBamakoDistrict && hierarchy.cercle) {
                divisionService.getCerclesByRegion(hierarchy.region.id).then((cerclesList: any[]) => {
                  setCercles(cerclesList || []);
                }).catch(() => {});
              } else if (isBamakoDistrict) {
                // Pour Bamako, charger directement les arrondissements
                divisionService.getArrondissementsByRegion(hierarchy.region.id).then((arrondissements: any[]) => {
                  setArrondissements(arrondissements || []);
                }).catch(() => {
                  // Fallback simple avec données hardcodées
                  const fallbackArrondissements = [
                    { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001' },
                    { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002' },
                    { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003' },
                    { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004' },
                    { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005' },
                    { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006' }
                  ];
                  setArrondissements(fallbackArrondissements);
                });
              }
            } else if (isBamakoDistrict) {
              // Cas spécial : Bamako détecté mais pas de région dans la hiérarchie
              const bamakoRegion = regions.find((r: any) => 
                r.nom?.toLowerCase().includes('bamako') && r.nom?.toLowerCase().includes('district')
              );
              
              if (bamakoRegion) {
                setSelectedRegionId(bamakoRegion.id);
                setSelectedRegionCode(bamakoRegion.code);
                
                // Charger les arrondissements Bamako
                divisionService.getArrondissementsByRegion(bamakoRegion.id).then((arrondissements: any[]) => {
                  setArrondissements(arrondissements || []);
                  
                  // Sélectionner l'arrondissement correspondant au quartier
                  if (hierarchy.quartier && arrondissements?.length > 0) {
                    const quartierCode = division.code || '';
                    const arrondissementCodeFromQuartier = quartierCode.substring(0, 4);
                    
                    const matchingArrondissement = arrondissements.find((arr: any) => 
                      arr.code === arrondissementCodeFromQuartier
                    );
                    
                    if (matchingArrondissement) {
                      setSelectedArrondissementId(matchingArrondissement.id);
                      setSelectedArrondissementCode(matchingArrondissement.code);
                      
                      // Charger les quartiers pour cet arrondissement
                      divisionService.getQuartiersByArrondissement(matchingArrondissement.id).then((quartiers: any[]) => {
                        setQuartiers(quartiers || []);
                        if (hierarchy.quartier) {
                          setSelectedQuartierId(hierarchy.quartier.id);
                          setSelectedQuartierCode(hierarchy.quartier.code);
                        }
                      }).catch(() => {
                        const fallbackQuartiers = [
                          { id: 'bamako-q-1', nom: 'Quartier Korofina', code: '000401' },
                          { id: 'bamako-q-2', nom: 'Quartier Taliko', code: '000402' },
                          { id: 'bamako-q-3', nom: 'Quartier Point G', code: '000403' }
                        ];
                        setQuartiers(fallbackQuartiers);
                      });
                    }
                  }
                }).catch(() => {
                  const fallbackArrondissements = [
                    { id: 'bamako-arr-1', nom: 'Premier Arrondissement', code: '0001' },
                    { id: 'bamako-arr-2', nom: 'Deuxième Arrondissement', code: '0002' },
                    { id: 'bamako-arr-3', nom: 'Troisième Arrondissement', code: '0003' },
                    { id: 'bamako-arr-4', nom: 'Quatrième Arrondissement', code: '0004' },
                    { id: 'bamako-arr-5', nom: 'Cinquième Arrondissement', code: '0005' },
                    { id: 'bamako-arr-6', nom: 'Sixième Arrondissement', code: '0006' }
                  ];
                  setArrondissements(fallbackArrondissements);
                });
              }
            }
            if (hierarchy.cercle && !isBamakoDistrict) {
              setSelectedCercleId(hierarchy.cercle.id);
              setSelectedCercleCode(hierarchy.cercle.code);
              
              // Charger les arrondissements pour ce cercle
              if (hierarchy.arrondissement) {
                divisionService.getArrondissementsByCercle(hierarchy.cercle.id).then((arrondissementsList: any[]) => {
                  setArrondissements(arrondissementsList || []);
                }).catch(() => {});
              }
            }
            if (hierarchy.arrondissement) {
              setSelectedArrondissementId(hierarchy.arrondissement.id);
              setSelectedArrondissementCode(hierarchy.arrondissement.code);
              
              if (isBamakoDistrict) {
                // Pour Bamako, charger directement les quartiers
                divisionService.getQuartiersByArrondissement(hierarchy.arrondissement.id).then((quartiers: any[]) => {
                  setQuartiers(quartiers || []);
                }).catch(() => {
                  const fallbackQuartiers = [
                    { id: 'bamako-q-1', nom: 'Quartier Korofina', code: '000101' },
                    { id: 'bamako-q-2', nom: 'Quartier Taliko', code: '000102' },
                    { id: 'bamako-q-3', nom: 'Quartier Point G', code: '000103' }
                  ];
                  setQuartiers(fallbackQuartiers);
                });
              } else {
                // Structure classique : charger les communes
                if (hierarchy.commune) {
                  divisionService.getCommunesByArrondissement(hierarchy.arrondissement.id).then((communesList: any[]) => {
                    setCommunes(communesList || []);
                  }).catch(() => {});
                }
              }
            }
            if (hierarchy.commune && !isBamakoDistrict) {
              setSelectedCommuneId(hierarchy.commune.id);
              setSelectedCommuneCode(hierarchy.commune.code);
              
              // Charger les quartiers pour cette commune
              if (hierarchy.quartier) {
                divisionService.getQuartiersByCommune(hierarchy.commune.id).then((quartiersList: any[]) => {
                  setQuartiers(quartiersList || []);
                }).catch(() => {});
              }
            }
            if (hierarchy.quartier) {
              setSelectedQuartierId(hierarchy.quartier.id);
              setSelectedQuartierCode(hierarchy.quartier.code);
            }
          }
        }).catch(() => {});
      }
    }
  }, [
    data.personalInfo?.hasDifferentAddress, 
    data.personalInfo?.divisionId, 
    data.personalInfo?.localite, 
    regions.length
  ]);

  // Charger cercles quand selectedRegionId change
  useEffect(() => {
    let mounted = true;
    if (selectedRegionId) {
      // Vérifier si c'est Bamako District
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
      
      if (isBamakoDistrict) {
        // Pour Bamako District, charger directement les arrondissements
        Promise.all([
          divisionService.getArrondissementsByRegion(selectedRegionId),
          divisionService.getAllArrondissements(),
          divisionService.searchBamakoDivisions()
        ]).then(([arrondissementsDirects, allArrondissements, bamakoDivisions]) => {
          // Stratégie 1: Arrondissements avec "premier", "deuxième", etc. (typique de Bamako)
          const strategy1 = allArrondissements.filter((arr: any) => {
            const nom = arr.nom?.toLowerCase() || '';
            return nom.includes('premier') || nom.includes('deuxième') || nom.includes('troisième') || 
                   nom.includes('quatrième') || nom.includes('cinquième') || nom.includes('sixième') || 
                   nom.includes('septième') || nom.includes('deuxieme') || nom.includes('troisieme') || 
                   nom.includes('quatrieme') || nom.includes('cinquieme') || nom.includes('sixieme') || 
                   nom.includes('septieme');
          });
          
          // Stratégie 2: Arrondissements dont le parent est dans bamakoDivisions
          const strategy2 = allArrondissements.filter((arr: any) => 
            bamakoDivisions.some((bd: any) => bd.id === arr.parent?.id)
          );
          
          // Stratégie 3: Arrondissements avec parent contenant "bamako"
          const strategy3 = allArrondissements.filter((arr: any) => 
            arr.parent?.nom?.toLowerCase().includes('bamako')
          );
          
          // Utiliser la stratégie qui donne le plus de résultats
          let bamakoArrondissements = strategy1;
          if (strategy2.length > bamakoArrondissements.length) bamakoArrondissements = strategy2;
          if (strategy3.length > bamakoArrondissements.length) bamakoArrondissements = strategy3;
          
          if (mounted) {
            setCercles([]); // Pas de cercles pour Bamako
            setArrondissements(bamakoArrondissements || []);
            
            // Sélection automatique de l'arrondissement si synchronisation active
            if (data.personalInfo?.hasDifferentAddress === false && data.companyInfo?.divisionCode) {
              const quartierCode = data.companyInfo.divisionCode;
              const arrondissementCodeFromQuartier = quartierCode.substring(0, 4);
              
              const matchingArrondissement = bamakoArrondissements.find((arr: any) => 
                arr.code === arrondissementCodeFromQuartier
              );
              
              if (matchingArrondissement) {
                setSelectedArrondissementId(matchingArrondissement.id);
                setSelectedArrondissementCode(matchingArrondissement.code);
              }
            }
          }
        }).catch((error: any) => {
        });
      } else {
        // Structure classique : charger les cercles
        divisionService.getCerclesByRegion(selectedRegionId).then((res: any[]) => {
          if (mounted) setCercles(res || []);
        }).catch(() => {});
      }
    } else {
      setCercles([]);
      setArrondissements([]);
      setCommunes([]);
      setSelectedCercleId('');
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
    }
    return () => { mounted = false; };
  }, [selectedRegionId, regions]);

  // Charger arrondissements quand selectedCercleId change
  useEffect(() => {
    let mounted = true;
    if (selectedCercleId) {
      divisionService.getArrondissementsByCercle(selectedCercleId).then((res: any[]) => {
        if (mounted) setArrondissements(res || []);
      }).catch(() => {});
    } else {
      setArrondissements([]);
      setCommunes([]);
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
    }
    return () => { mounted = false; };
  }, [selectedCercleId]);

  // Charger communes quand selectedArrondissementId change
  useEffect(() => {
    let mounted = true;
    if (selectedArrondissementId) {
      // Vérifier si c'est Bamako District
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
      
      if (isBamakoDistrict) {
        // Pour Bamako District, charger directement les quartiers depuis l'arrondissement
        
        // Pour Bamako District, essayer d'abord la relation directe, puis la solution par code
        divisionService.getQuartiersByArrondissement(selectedArrondissementId).then((quartiers: any[]) => {
          
          if (quartiers && quartiers.length > 0) {
            // Relation directe fonctionne
            if (mounted) {
              setCommunes([]);
              setQuartiers(quartiers);
              
              // NOUVEAU: Sélection automatique du quartier si synchronisation active
              if (data.personalInfo?.hasDifferentAddress === false && data.companyInfo?.divisionCode) {
                const quartierCode = data.companyInfo.divisionCode;
                
                const matchingQuartier = quartiers.find((q: any) => q.code === quartierCode);
                if (matchingQuartier) {
                  setSelectedQuartierId(matchingQuartier.id);
                  setSelectedQuartierCode(matchingQuartier.code);
                }
              }
            }
          } else {
            // Relation directe ne fonctionne pas, essayer par code
            return divisionService.getQuartiersByArrondissementCode(selectedArrondissementId);
          }
        }).then((quartiersParCode: any[]) => {
          if (quartiersParCode && quartiersParCode.length > 0) {
            if (mounted) {
              setCommunes([]);
              setQuartiers(quartiersParCode);
              
              // NOUVEAU: Sélection automatique du quartier si synchronisation active
              if (data.personalInfo?.hasDifferentAddress === false && data.companyInfo?.divisionCode) {
                const quartierCode = data.companyInfo.divisionCode;
                
                const matchingQuartier = quartiersParCode.find((q: any) => q.code === quartierCode);
                if (matchingQuartier) {
                  setSelectedQuartierId(matchingQuartier.id);
                  setSelectedQuartierCode(matchingQuartier.code);
                }
              }
            }
          } else {
            if (mounted) {
              setCommunes([]);
              setQuartiers([]);
            }
          }
        }).catch((error: any) => {
        });
      } else {
        // Structure classique : charger les communes
        divisionService.getCommunesByArrondissement(selectedArrondissementId).then((res: any[]) => {
          if (mounted) setCommunes(res || []);
        }).catch(() => {});
      }
    } else {
      setCommunes([]);
      setQuartiers([]);
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedArrondissementId, selectedRegionId, regions]);

  // Charger quartiers quand selectedCommuneId change
  useEffect(() => {
    let mounted = true;
    if (selectedCommuneId) {
      divisionService.getQuartiersByCommune(selectedCommuneId).then((res: any[]) => {
        if (mounted) setQuartiers(res || []);
      }).catch(() => {});
    } else {
      setQuartiers([]);
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedCommuneId]);

  // Fonction pour gérer la sélection depuis la recherche (CompanyInfo)
  const handleCompanyDivisionSearch = async (division: any) => {
    
    try {
      // Construire la hiérarchie complète depuis la division sélectionnée
      const hierarchy = await buildCompanyDivisionHierarchy(division);
      
      // Appliquer la hiérarchie aux sélecteurs
      await applyCompanyDivisionHierarchy(hierarchy);
      
    } catch (error) {
    }
  };

  // Construire la hiérarchie complète depuis une division (CompanyInfo)
  const buildCompanyDivisionHierarchy = async (division: any): Promise<any> => {
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
    
    // Détecter si c'est un quartier de Bamako et forcer la reconstruction par code
    const isBamakoQuartier = division.divisionType === 'QUARTIER' && 
                            division.code && 
                            (['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix)));
    
    if (isBamakoQuartier) {
      const reconstructedHierarchy = await reconstructCompanyHierarchyByCode(division);
      if (reconstructedHierarchy && Object.keys(reconstructedHierarchy).length > 1) {
        return reconstructedHierarchy;
      }
    }
    
    // Si on n'a pas de parent dans les données, essayer de récupérer la hiérarchie via l'API
    if (!division.parent && division.divisionType !== 'REGION') {
      try {
        const fullDivision = await divisionService.getById(division.id);
        
        if (fullDivision && fullDivision.parent) {
          // Recommencer avec les données complètes
          return await buildCompanyDivisionHierarchy(fullDivision);
        }
      } catch (error) {
      }
    }
    
    return hierarchy;
  };

  // Reconstruire la hiérarchie par code pour CompanyInfo (pour les cas où les relations parent sont manquantes)
  const reconstructCompanyHierarchyByCode = async (division: any): Promise<any> => {
    const hierarchy: any = {};
    
    // Ajouter la division actuelle
    hierarchy[division.divisionType.toLowerCase()] = division;
    
    if (!division.code) {
      return hierarchy;
    }
    
    try {
      // Récupérer toutes les régions
      const regions = await divisionService.getRegions();
      
      // Pour Bamako (codes 0001xxxx à 0007xxxx)
      if (division.code.match(/^000[1-7]/) || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].some(prefix => division.code.startsWith(prefix))) {
        
        const bamakoRegion = regions.find((r: any) => 
          r.nom?.toLowerCase().includes('bamako') && 
          r.nom?.toLowerCase().includes('district')
        );
        
        if (bamakoRegion) {
          hierarchy.region = bamakoRegion;
          
          if (division.divisionType === 'QUARTIER') {
            const arrondissementCode = division.code.substring(0, 4);
            
            // Utiliser la même logique de fallback que PersonalInfoStep
            const [children, bamakoDivisions, allArrondissements] = await Promise.all([
              divisionService.getChildrenByRegion(bamakoRegion.id),
              divisionService.searchBamakoDivisions(),
              divisionService.getAllArrondissements()
            ]);
            
            
            // Stratégie 1: Divisions Bamako filtrées
            const bamakoArrondissements = bamakoDivisions.filter((div: any) => 
              div.divisionType === 'ARRONDISSEMENT' && 
              (div.nom?.includes('Arrondissement') || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(div.code))
            );
            
            let arrondissements = [];
            if (bamakoArrondissements.length) {
              arrondissements = bamakoArrondissements;
            } else {
              // Stratégie 2: Tous les arrondissements filtrés par nom
              const arrondissementsParNom = allArrondissements.filter((arr: any) => 
                arr.nom?.includes('Arrondissement') && 
                ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième'].some(num => arr.nom?.includes(num))
              );
              
              if (arrondissementsParNom.length) {
                arrondissements = arrondissementsParNom;
              }
            }
            
            // Chercher l'arrondissement correspondant
            const arrondissement = arrondissements.find((a: any) => a.code === arrondissementCode);
            
            if (arrondissement) {
              hierarchy.arrondissement = arrondissement;
            } else {
            }
          }
        }
      }
    } catch (error) {
    }
    
    return hierarchy;
  };

  // Appliquer la hiérarchie aux sélecteurs (CompanyInfo)
  const applyCompanyDivisionHierarchy = async (hierarchy: any) => {
    
    // Détecter si c'est Bamako District
    const isBamakoDistrict = hierarchy.region?.nom?.toLowerCase().includes('bamako') && 
                            hierarchy.region?.nom?.toLowerCase().includes('district');
    
    try {
      // Région
      if (hierarchy.region) {
        setSelectedRegionId(hierarchy.region.id);
        setSelectedRegionCode(hierarchy.region.code);
        
        // Charger les cercles ou arrondissements selon la structure
        if (isBamakoDistrict) {
          
          // Utiliser la même logique de fallback que PersonalInfoStep
          const [arrondissementsDirects, allArrondissements, bamakoDivisions] = await Promise.all([
            divisionService.getArrondissementsByRegion(hierarchy.region.id),
            divisionService.getAllArrondissements(),
            divisionService.searchBamakoDivisions()
          ]);
          
          
          // Stratégie 1: Divisions Bamako filtrées
          const bamakoArrondissements = bamakoDivisions.filter((div: any) => 
            div.divisionType === 'ARRONDISSEMENT' && 
            (div.nom?.includes('Arrondissement') || ['0001', '0002', '0003', '0004', '0005', '0006', '0007'].includes(div.code))
          );
          
          let finalArrondissements = [];
          if (bamakoArrondissements.length) {
            finalArrondissements = bamakoArrondissements;
          } else {
            // Stratégie 2: Tous les arrondissements filtrés par nom
            const arrondissementsParNom = allArrondissements.filter((arr: any) => 
              arr.nom?.includes('Arrondissement') && 
              ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième', 'Septième'].some(num => arr.nom?.includes(num))
            );
            
            if (arrondissementsParNom.length) {
              finalArrondissements = arrondissementsParNom;
            }
          }
          
          setArrondissements(finalArrondissements || []);
        } else {
          const cercles = await divisionService.getCerclesByRegion(hierarchy.region.id);
          setCercles(cercles || []);
        }
      }
    
    // Cercle (seulement si pas Bamako District)
    if (hierarchy.cercle && !isBamakoDistrict) {
      setSelectedCercleId(hierarchy.cercle.id);
      setSelectedCercleCode(hierarchy.cercle.code);
    } else if (isBamakoDistrict) {
      setSelectedCercleId('');
      setSelectedCercleCode('');
    }
    
      // Arrondissement
      if (hierarchy.arrondissement) {
        setSelectedArrondissementId(hierarchy.arrondissement.id);
        setSelectedArrondissementCode(hierarchy.arrondissement.code);
        
        // Charger les communes ou quartiers selon la structure
        if (isBamakoDistrict) {
          
          // Utiliser la logique de fallback par code pour les quartiers
          const arrondissementCode = hierarchy.arrondissement.code || '';
          
          if (arrondissementCode && arrondissementCode.length >= 4) {
            const codePrefix = arrondissementCode.substring(0, 4);
            
            const allQuartiers = await divisionService.getAllQuartiers();
            const quartiersCorrespondants = allQuartiers.filter((quartier: any) => {
              const code = quartier.code || '';
              return code.startsWith(codePrefix);
            });
            
            setQuartiers(quartiersCorrespondants || []);
          }
        } else {
          const communes = await divisionService.getCommunesByArrondissement(hierarchy.arrondissement.id);
          setCommunes(communes || []);
        }
      }
    
    // Commune (seulement si pas Bamako District)
    if (hierarchy.commune && !isBamakoDistrict) {
      setSelectedCommuneId(hierarchy.commune.id);
      setSelectedCommuneCode(hierarchy.commune.code);
    } else if (isBamakoDistrict) {
      setSelectedCommuneId('');
      setSelectedCommuneCode('');
    }
    
    // Quartier et mise à jour des données
    if (hierarchy.quartier) {
      setSelectedQuartierId(hierarchy.quartier.id);
      setSelectedQuartierCode(hierarchy.quartier.code);
      
      // Mettre à jour les données du formulaire avec le quartier
      updateBusinessData('companyInfo', {
        ...data.companyInfo,
        divisionCode: hierarchy.quartier.code
      });
    } else if (hierarchy.commune && !isBamakoDistrict) {
      // Si pas de quartier, utiliser la commune (sauf pour Bamako)
      updateBusinessData('companyInfo', {
        ...data.companyInfo,
        divisionCode: hierarchy.commune.code
      });
    } else if (hierarchy.arrondissement) {
      // Si pas de commune, utiliser l'arrondissement (cas Bamako)
      updateBusinessData('companyInfo', {
        ...data.companyInfo,
        divisionCode: hierarchy.arrondissement.code
      });
    }
    
    
    } catch (error) {
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Informations de l'Entreprise</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
        Renseignez les informations de base de votre entreprise.
      </p>

      <div className="space-y-8">
        {/* Informations de base */}
        <div className="bg-gradient-to-br from-investmali-accent/5 to-investmali-accent/10 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-investmali-accent/20 shadow-sm animate-slide-up" style={{animationDelay: '0.2s'}}>
          <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <span className="text-lg sm:text-xl mr-2 animate-bounce">🏢</span>
            Informations de base
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {/* Nom de l'entreprise */}
            <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Nom de l'entreprise {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? '(optionnel)' : '*'}
              </label>
              <input
                type="text"
                value={data.companyInfo?.nom || ''}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, nom: e.target.value })}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${
                  showValidation && !data.companyInfo?.nom && data.companyInfo?.typeEntreprise === 'SOCIETE' 
                    ? 'border-red-400 focus:ring-red-400' 
                    : 'border-gray-300 focus:ring-mali-emerald'
                }`}
                placeholder={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                  ? `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim() || 'Nom automatique du gérant'
                  : ''
                }
              />
              {/* {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                <p className="text-xs text-gray-500 mt-1">
                  Si vide, le nom du gérant sera utilisé automatiquement
                </p>
              )} */}
            </div>

            {/* Sigle */}
            <div className="animate-slide-up" style={{animationDelay: '0.35s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Sigle (optionnel)</label>
              <input
                type="text"
                value={data.companyInfo?.sigle || ''}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, sigle: e.target.value })}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 text-sm sm:text-base"
                placeholder=""
              />
            </div>

            {/* Capitale - Masqué pour les entreprises individuelles */}
            {data.companyInfo?.typeEntreprise === 'SOCIETE' && (
              <div className="animate-slide-up" style={{animationDelay: '0.37s'}}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Capitale *</label>
                <input
                  type="text"
                  value={data.companyInfo?.capitale || ''}
                  onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, capitale: e.target.value })}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${showValidation && !data.companyInfo?.capitale ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-mali-emerald'}`}
                  placeholder="Ex: 1 000 000 "
                />
              </div>
            )}



            {/* Type d'entreprise - masqué pour les entreprises individuelles */}
            {data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
              <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Type d'entreprise *</label>
                {data.companyInfo?.typeEntreprise ? (
                  // Affichage en lecture seule quand le type est déjà sélectionné
                  <div className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl bg-gray-50 text-sm sm:text-base border-gray-300 text-gray-700 font-medium">
                    {data.companyInfo.typeEntreprise === 'SOCIETE' ? 'Société' : 'Entreprise individuelle'}
                    <span className="text-xs text-gray-500 ml-2"></span>
                  </div>
              ) : (
                // Select normal si aucun type n'est sélectionné
                <select
                  value={data.companyInfo?.typeEntreprise || ''}
                  onChange={(e) => {
                    const newTypeEntreprise = e.target.value as TypeEntreprise;
                    // Auto-sélectionner E_I si Entreprise Individuelle
                    const newFormeJuridique = newTypeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'E_I' : data.companyInfo?.formeJuridique;
                    updateBusinessData('companyInfo', { 
                      ...data.companyInfo, 
                      typeEntreprise: newTypeEntreprise,
                      formeJuridique: newFormeJuridique
                    });
                  }}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${showValidation && !data.companyInfo?.typeEntreprise ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-mali-emerald'}`}
                >
                  <option value="">Sélectionnez</option>
                  {typeEntrepriseOptions.map((option: any) => (
                    <option key={option.key} value={option.key}>{option.value}</option>
                  ))}
                </select>
              )}
              </div>
            )}

            {/* Forme juridique */}
            <div className="animate-slide-up" style={{animationDelay: '0.45s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Forme juridique *</label>
              <select
                value={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'E_I' : (data.companyInfo?.formeJuridique || '')}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, formeJuridique: e.target.value as FormeJuridique })}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base ${showValidation && !data.companyInfo?.formeJuridique ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-mali-emerald'}`}
                disabled={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'}
              >
                <option value="">Sélectionnez</option>
                {formeJuridiqueOptions
                  .filter((option: any) => {
                    // Si Entreprise Individuelle, montrer seulement E_I
                    if (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE') {
                      return option.key === 'E_I';
                    }
                    // Si Société, montrer tout sauf E_I
                    return option.key !== 'E_I';
                  })
                  .map((option: any) => (
                    <option key={option.key} value={option.key}>{option.label || option.value}</option>
                  ))
                }
              </select>
              {/* {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Forme juridique automatiquement sélectionnée pour une entreprise individuelle</p>
              )} */}
            </div>
                {/* Domaine d'activité non réglementé */}
            <div className="animate-slide-up" style={{animationDelay: '0.52s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Domaine d'activité non réglementé</label>
              <select
                value={data.companyInfo?.domaineActiviteNr || ''}
                onChange={(e) => {
                  const selectedNr = e.target.value as DomaineActiviteNr;
                  
                  // Mettre à jour le domaine non réglementé
                  let updatedCompanyInfo = { 
                    ...data.companyInfo, 
                    domaineActiviteNr: selectedNr || undefined 
                  };
                  
                  // Si ce domaine non réglementé a une correspondance réglementée, sélectionner automatiquement
                  if (selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0) {
                    updatedCompanyInfo.domaineActivite = DOMAINE_MAPPING[selectedNr][0];
                  }
                  
                  updateBusinessData('companyInfo', updatedCompanyInfo);
                }}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500 text-sm sm:text-base"
              >
                <option value="">Sélectionnez (optionnel)</option>
                {domaineActiviteNrOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.value}</option>
                ))}
              </select>
              {/* <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Sélectionnez votre domaine d'activité non réglementé (optionnel)</p> */}
            </div>
            {/* Domaine d'activité réglementé */}
            {(() => {
              // Vérifier si le domaine non réglementé sélectionné a une correspondance
              const selectedNr = data.companyInfo?.domaineActiviteNr;
              const hasCorrespondence = selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0;
              
              // Si un domaine non réglementé est sélectionné mais n'a pas de correspondance, masquer le champ
              if (selectedNr && !hasCorrespondence) {
                return null; // Masquer complètement le champ
              }
              
              return (
                <div className="animate-slide-up" style={{animationDelay: '0.5s'}}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Domaine d'activité réglementé *</label>
                  {(() => {
                    const isDisabled = Boolean(hasCorrespondence);
                
                return (
                  <>
                    <select
                      value={data.companyInfo?.domaineActivite || ''}
                      onChange={(e) => {
                        const selectedActivite = e.target.value as DomaineActivites;
                        let updatedCompanyInfo = { 
                          ...data.companyInfo, 
                          domaineActivite: selectedActivite || undefined 
                        };
                        
                        // Si ce domaine réglementé a une correspondance, sélectionner automatiquement le domaine non réglementé
                        if (selectedActivite && DOMAINE_MAPPING_INVERSE[selectedActivite]) {
                          updatedCompanyInfo.domaineActiviteNr = DOMAINE_MAPPING_INVERSE[selectedActivite];
                        }
                        
                        updateBusinessData('companyInfo', updatedCompanyInfo);
                      }}
                      disabled={isDisabled}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 ${
                        isDisabled 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                          : showValidation && !data.companyInfo?.domaineActivite 
                            ? 'border-red-400 focus:ring-red-400' 
                            : 'border-gray-300 focus:ring-mali-emerald'
                      }`}
                    >
                      <option value="">Sélectionnez</option>
                      {domaineActiviteOptions.map((option: any) => (
                        <option key={option.key} value={option.key}>{option.value}</option>
                      ))}
                    </select>
                    {isDisabled && (
                      <div className="mt-1">
                        <p className="text-sm text-blue-600 flex items-center">
                          <span className="mr-1">ℹ️</span>
                          Cette activité est soumise à une demande d'autorisation d'exercice
                        </p>
                        {/* Bouton masqué - sera dans une étape séparée
                        <button
                          onClick={() => {
                            const selectedNr = data.companyInfo?.domaineActiviteNr;
                            if (selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0) {
                              const domaineReglemente = DOMAINE_MAPPING[selectedNr][0];
                              generateAutorisationDocument(domaineReglemente, data);
                            }
                          }}
                          className="mt-2 px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                        >
                          Générer la demande d'autorisation
                        </button>
                        */}
                      </div>
                      
                    )}
                  </>
                    );
                  })()}
                </div>
              );
            })()}
                        {/* Activité secondaire */}
                        <div className="animate-slide-up md:col-span-2" style={{animationDelay: '0.38s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Activité secondaire</label>
              <textarea
                value={data.companyInfo?.activiteSecondaire || ''}
                onChange={(e) => updateBusinessData('companyInfo', { ...data.companyInfo, activiteSecondaire: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mali-emerald focus:border-transparent transition-all duration-500"
                placeholder=""
                rows={3}
              />
              {/* <p className="text-sm text-gray-500 mt-1">Optionnel. Sera enregistré dans votre dossier.</p> */}
            </div>

          
          </div>
        </div>

        {/* Localisation */}
        <div className="bg-gradient-to-br from-investmali-warning/5 to-investmali-warning/10 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-investmali-warning/20 shadow-sm animate-slide-up" style={{animationDelay: '0.55s'}}>
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <span className="text-lg sm:text-xl mr-2 animate-bounce">📍</span>
            Localisation de l'entreprise
          </h3>

          {/* Message informatif sur la synchronisation */}
          {data.personalInfo?.hasDifferentAddress === false && (
            (() => {
              const personalHasLocation = data.personalInfo?.divisionId || data.personalInfo?.localite;
              
              if (personalHasLocation) {
                return null;
              } else {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center mb-2">
                      <span className="text-red-600 mr-2">⚠️</span>
                      <h4 className="text-lg font-semibold text-red-800">Localisation personnelle manquante</h4>
                    </div>
                    <p className="text-sm text-red-600">
                      Vous avez choisi la même adresse pour l'entreprise, mais votre localisation personnelle n'est pas définie. 
                      La synchronisation ne peut pas fonctionner sans ces informations.
                    </p>
                    <p className="text-xs text-red-500 mt-2">
                      <strong>Action requise :</strong> Retournez à l'étape précédente pour saisir votre localisation personnelle, 
                      ou répondez "Oui" pour saisir une localisation différente pour l'entreprise.
                    </p>
                  </div>
                );
              }
            })()
          )}

          {data.personalInfo?.hasDifferentAddress === true && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center mb-2">
                <span className="text-green-600 mr-2">✅</span>
                <h4 className="text-lg font-semibold text-green-800">Localisation indépendante</h4>
              </div>
              <p className="text-sm text-green-600">
                Vous pouvez saisir une localisation différente pour votre entreprise. 
                Utilisez la recherche rapide ou les sélecteurs ci-dessous.
              </p>
            </div>
          )}
          
          {/* Recherche rapide pour l'entreprise */}
          {data.personalInfo?.hasDifferentAddress !== false && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                🔍 Recherche rapide de localisation
              </h4>
              <p className="text-sm text-orange-600 mb-4">
                Tapez le nom d'une localisation pour remplir automatiquement la hiérarchie administrative de l'entreprise
              </p>
              <DivisionSearchInput
                placeholder="Rechercher une région, cercle, commune ou quartier..."
                onSelect={handleCompanyDivisionSearch}
                className="w-full"
              />
            </div>
          )}

          {/* Sélecteurs hiérarchiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

            {/* Région */}
            <div className="animate-slide-up" style={{animationDelay: '0.6s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Région *
              </label>
              <select
                value={selectedRegionId}
                onChange={(e) => {
                  console.log('🚀 [DEBUG] Handler région appelé!', e.target.value);
                  const selectedOption = e.target.selectedOptions[0];
                  const regionId = selectedOption.value;
                  const regionCode = selectedOption.getAttribute('data-code') || '';
                  
                  setSelectedRegionId(regionId);
                  setSelectedRegionCode(regionCode);
                  
                  // Reset des niveaux inférieurs
                  setSelectedCercleId(''); setSelectedCercleCode('');
                  setSelectedArrondissementId(''); setSelectedArrondissementCode('');
                  setSelectedCommuneId(''); setSelectedCommuneCode('');
                  setSelectedQuartierId(''); setSelectedQuartierCode('');
                  
                  // Mettre à jour le divisionCode dans companyInfo
                  const divisionCode = regionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    regionId: regionId,
                    cercleId: '',
                    arrondissementId: '',
                    communeId: '',
                    quartierId: ''
                  });
                }}
                disabled={false}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base border-gray-300 focus:ring-mali-emerald"
              >
                <option value="">Sélectionnez une région</option>
                {regions.map((r: any) => (
                  <option key={r.id} value={r.id} data-code={r.code}>{r.nom}</option>
                ))}
              </select>
            </div>

            {/* Cercle - Masqué pour Bamako District */}
            {(() => {
              const selectedRegion = regions.find(r => r.id === selectedRegionId);
              const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
              
              if (isBamakoDistrict) {
                return null; // Masquer le champ Cercle pour Bamako District
              }
              
              return (
                <div className="animate-slide-up" style={{animationDelay: '0.65s'}}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Cercle
                  </label>
              <select
                value={selectedCercleId || ''}
                onChange={(e) => {
                  const selectedOption = e.target.selectedOptions[0];
                  const cercleId = selectedOption.value;
                  const cercleCode = selectedOption.getAttribute('data-code') || '';
                  
                  setSelectedCercleId(cercleId);
                  setSelectedCercleCode(cercleCode);
                  
                  // Reset des niveaux inférieurs
                  setSelectedArrondissementId(''); setSelectedArrondissementCode('');
                  setSelectedCommuneId(''); setSelectedCommuneCode('');
                  setSelectedQuartierId(''); setSelectedQuartierCode('');
                  
                  // Mettre à jour le divisionCode et cercleId dans companyInfo
                  const divisionCode = cercleCode || selectedRegionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    regionId: selectedRegionId,
                    cercleId: '',
                    arrondissementId: '',
                    communeId: '',
                    quartierId: ''
                  });
                }}
                disabled={!selectedRegionId}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 border-gray-300 focus:ring-mali-emerald disabled:bg-gray-100`}
              >
                <option value="">Sélectionnez un cercle</option>
                {cercles.map((c: any) => (
                  <option key={c.id} value={c.id} data-code={c.code}>{c.nom}</option>
                ))}
                  </select>
                </div>
              );
            })()}

            {/* Section Arrondissement supprimée - Structure INSTAT moderne */}

            {/* Commune - Structure INSTAT moderne */}
            <div className="animate-slide-up" style={{animationDelay: '0.75s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Commune
              </label>
              <select
                value={selectedCommuneId || ''}
                onChange={(e) => {
                  const selectedOption = e.target.selectedOptions[0];
                  const communeId = selectedOption.value;
                  const communeCode = selectedOption.getAttribute('data-code') || '';
                  
                  setSelectedCommuneId(communeId);
                  setSelectedCommuneCode(communeCode);
                  
                  // Reset des niveaux inférieurs
                  setSelectedQuartierId(''); setSelectedQuartierCode('');
                  
                  // Mettre à jour le divisionCode et communeId dans companyInfo
                  const divisionCode = communeCode || selectedCercleCode || selectedRegionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    communeId,
                    quartierId: ''
                  });
                }}
                disabled={!selectedCercleId}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base border-gray-300 focus:ring-mali-emerald disabled:bg-gray-100`}
              >
                <option value="">Sélectionnez une commune</option>
                {communes.map((c: any) => (
                  <option key={c.id} value={c.id} data-code={c.code}>{c.nom}</option>
                ))}
              </select>
            </div>

            {/* Quartier */}
            <div className="animate-slide-up" style={{animationDelay: '0.8s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Quartier
              </label>
              <select
                value={selectedQuartierId || ''}
                onChange={(e) => {
                  const selectedOption = e.target.selectedOptions[0];
                  const quartierId = selectedOption.value;
                  const quartierCode = selectedOption.getAttribute('data-code') || '';
                  
                  setSelectedQuartierId(quartierId);
                  setSelectedQuartierCode(quartierCode);
                  
                  // Mettre à jour le divisionCode et quartierId dans companyInfo
                  const divisionCode = quartierCode || selectedCommuneCode || selectedArrondissementCode || selectedCercleCode || selectedRegionCode || '';
                  updateBusinessData('companyInfo', { 
                    ...data.companyInfo, 
                    divisionCode,
                    quartierId
                  });
                }}
                disabled={(() => {
                  const selectedRegion = regions.find(r => r.id === selectedRegionId);
                  const isBamakoDistrict = selectedRegion?.nom?.toLowerCase().includes('bamako') && selectedRegion?.nom?.toLowerCase().includes('district');
                  return isBamakoDistrict ? !selectedArrondissementId : !selectedCommuneId;
                })()}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all duration-500 text-sm sm:text-base border-gray-300 focus:ring-mali-emerald disabled:bg-gray-100`}
              >
                <option value="">Sélectionnez un quartier</option>
                {quartiers.map((q: any) => (
                  <option key={q.id} value={q.id} data-code={q.code}>{q.nom}</option>
                ))}
              </select>
            </div>

            {/* Rue de l'entreprise */}
            <div className="animate-slide-up" style={{animationDelay: '0.85s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Rue</label>
              <input
                type="text"
                value={data.companyInfo?.rue || ''}
                onChange={(e) => updateBusinessData('companyInfo', {
                  ...data.companyInfo,
                  rue: e.target.value
                })}
                disabled={false}
                className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base border-gray-300 focus:ring-mali-emerald`}
                placeholder="Nom de la rue"
              />
            </div>

            {/* Porte de l'entreprise */}
            <div className="animate-slide-up" style={{animationDelay: '0.9s'}}>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Porte</label>
              <input
                type="text"
                value={data.companyInfo?.porte || ''}
                onChange={(e) => updateBusinessData('companyInfo', {
                  ...data.companyInfo,
                  porte: e.target.value
                })}
                disabled={false}
                className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base border-gray-300 focus:ring-mali-emerald`}
                placeholder="Numéro de porte"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Étape 4 : Documents
const DocumentsStep: React.FC<{data: BusinessCreationData, updateData: (field: keyof BusinessCreationData, value: any) => void}> = ({ data, updateData }) => {
  const [documentPlans, setDocumentPlans] = useState<Array<{key: string, value: string}>>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const values = await enumService.getDocumentPlans();
        if (isMounted && Array.isArray(values)) {
          // Sort by numeric pages extracted from enum key like _3, _4, _5, _7
          const sorted = [...values].sort((a, b) => {
            const pa = parseInt((a.key.match(/_(\d+)/)?.[1] || '0'), 10);
            const pb = parseInt((b.key.match(/_(\d+)/)?.[1] || '0'), 10);
            return pa - pb;
          });
          setDocumentPlans(sorted);
        }
      } catch (e) {
        // Keep silent fallback; UI will just show empty options
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const pagesFromEnum = (key: string): number | undefined => {
    const m = key.match(/_(\d+)/);
    return m ? parseInt(m[1], 10) : undefined;
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Documents Officiels</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
        {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? 'Seul le certificat de résidence est requis pour les entreprises individuelles.'
          : 'Téléchargez les documents requis pour l\'immatriculation de votre entreprise au Mali.'
        }
      </p>

      {data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Statuts de la société */}
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-investmali-accent text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">📄</span>
              Statuts de la Société
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">
              Document constitutif définissant l'organisation et le fonctionnement de votre société.
            </p>
          
          {/* Options pour les statuts */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <input
                type="radio"
                id="upload-statutes"
                name="statutes-option"
                checked={!data.documents?.needsStatutesDrafting}
                onChange={() => {
                  updateData('documents', {
                    ...data.documents,
                    needsStatutesDrafting: false,
                    statutesPages: undefined
                  });
                }}
                className="mt-1 w-4 h-4 text-investmali-accent bg-gray-100 border-gray-300 focus:ring-mali-emerald focus:ring-2"
              />
              <div className="flex-1">
                <label htmlFor="upload-statutes" className="block text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                  J'ai déjà mes statuts rédigés
                </label>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                  Téléchargez vos statuts existants au format PDF, DOC ou DOCX
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                id="draft-statutes"
                name="statutes-option"
                checked={data.documents?.needsStatutesDrafting || false}
                onChange={() => {
                  updateData('documents', {
                    ...data.documents,
                    needsStatutesDrafting: true,
                    statutes: null,
                    statutesName: ''
                  });
                }}
                className="mt-1 w-4 h-4 text-investmali-accent bg-gray-100 border-gray-300 focus:ring-mali-emerald focus:ring-2"
              />
              <div className="flex-1">
                <label htmlFor="draft-statutes" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Faire rédiger mes statuts par InvestMali
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Service de rédaction professionnel - <strong className="text-investmali-accent">4 000 FCFA par page</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Upload des statuts existants */}
          {!data.documents?.needsStatutesDrafting && (
            <div className="relative animate-slide-up">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  updateData('documents', {
                    ...data.documents,
                    statutes: file,
                    statutesName: file?.name || ''
                  });
                }}
                className="hidden"
                id="statutes-upload"
              />
              <label
                htmlFor="statutes-upload"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl hover:border-investmali-accent transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 bg-gray-50 hover:bg-investmali-accent/5"
              >
                {data.documents?.statutesName ? (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-investmali-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-investmali-accent font-medium text-xs sm:text-sm text-center">{data.documents.statutesName}</span>
                    <span className="text-xs text-gray-500">(Cliquez pour changer)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-600 text-center">Télécharger vos statuts existants</span>
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés : PDF, DOC, DOCX (max 10MB)
              </p>
            </div>
          )}

          {/* Service de rédaction */}
          {data.documents?.needsStatutesDrafting && (
            <div className="bg-gradient-to-r from-investmali-accent/10 to-investmali-warning/10 p-6 rounded-xl border border-investmali-accent/20 animate-slide-up">
              <div className="flex items-start space-x-4">
                <div className="bg-investmali-accent text-white rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-investmali-neutral-dark mb-2">Service de Rédaction InvestMali</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Nos experts juridiques rédigeront vos statuts selon la législation malienne en vigueur.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Nombre de pages estimé pour vos statuts
                    </label>
                    <select
                      value={data.documents?.statutesPages || ''}
                      onChange={(e) => {
                        updateData('documents', {
                          ...data.documents,
                          statutesPages: parseInt(e.target.value) || undefined
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    >
                      <option value="">Sélectionnez le nombre de pages</option>
                      {documentPlans.map((plan) => {
                        const pages = pagesFromEnum(plan.key);
                        if (!pages) return null;
                        return (
                          <option key={plan.key} value={pages}>{plan.value}</option>
                        );
                      })}
                    </select>
                  </div>
                  
                  {data.documents?.statutesPages && (
                    <div className="bg-white p-4 rounded-lg border border-investmali-accent/30 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Coût estimé :</span>
                        <span className="text-xl font-bold text-investmali-accent">
                          {(data.documents.statutesPages * 3500).toLocaleString()} FCFA
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Tarif : 3500 FCFA par page • Délai : 2-3 jours ouvrables
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Inclus :</strong> Rédaction conforme, révisions illimitées, format officiel pour dépôt
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registre de commerce */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h3 className="text-xl font-semibold text-investmali-neutral-dark mb-4 flex items-center">
            <span className="bg-investmali-warning text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">🏪</span>
            Registre de Commerce
          </h3>
          
          <div className="mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.documents?.hasCommerceRegistry || false}
                onChange={(e) => {
                  updateData('documents', {
                    ...data.documents,
                    hasCommerceRegistry: e.target.checked,
                    commerceRegistry: e.target.checked ? data.documents?.commerceRegistry : null,
                    commerceRegistryName: e.target.checked ? data.documents?.commerceRegistryName : ''
                  });
                }}
                className="w-4 h-4 text-investmali-accent bg-gray-100 border-gray-300 rounded focus:ring-mali-emerald focus:ring-2"
              />
              <span className="text-gray-700">J'ai déjà un registre de commerce</span>
            </label>
          </div>

          {data.documents?.hasCommerceRegistry && (
            <div className="relative animate-slide-up">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  updateData('documents', {
                    ...data.documents,
                    commerceRegistry: file,
                    commerceRegistryName: file?.name || ''
                  });
                }}
                className="hidden"
                id="commerce-registry-upload"
              />
              <label
                htmlFor="commerce-registry-upload"
                className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl hover:border-investmali-warning transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 bg-gray-50 hover:bg-investmali-warning/5"
              >
                {data.documents?.commerceRegistryName ? (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-investmali-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-investmali-warning font-medium text-xs sm:text-sm text-center">{data.documents.commerceRegistryName}</span>
                    <span className="text-xs text-gray-500">(Cliquez pour changer)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs sm:text-sm text-gray-600 text-center">Télécharger le registre de commerce</span>
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                Formats acceptés : PDF, JPG, PNG (max 5MB)
              </p>
            </div>
          )}
          
          {!data.documents?.hasCommerceRegistry && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
              <p className="text-blue-800 text-sm">
                <strong>Information :</strong> Si vous n'avez pas encore de registre de commerce, 
                InvestMali vous aidera dans les démarches d'immatriculation.
              </p>
            </div>
          )}
        </div>


        {/* Résumé des documents */}
        <div className="bg-gradient-to-r from-investmali-accent/10 to-investmali-warning/10 p-6 rounded-2xl border border-investmali-accent/20 animate-slide-up" style={{animationDelay: '0.5s'}}>
          <h4 className="text-lg font-semibold text-investmali-neutral-dark mb-3 flex items-center">
            <span className="bg-investmali-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">✓</span>
            Documents Téléchargés
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              data.documents?.statutesName 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              <div className="flex items-center space-x-2">
                {data.documents?.statutesName ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Statuts</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              data.documents?.commerceRegistryName || !data.documents?.hasCommerceRegistry
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              <div className="flex items-center space-x-2">
                {data.documents?.commerceRegistryName || !data.documents?.hasCommerceRegistry ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Registre Commerce</span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              data.documents?.residenceCertificateName 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              <div className="flex items-center space-x-2">
                {data.documents?.residenceCertificateName ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Certificat Résidence</span>
              </div>
            </div>
          </div>

          {/* Soumission déplacée vers SummaryAndSubmissionStep */}
        </div>
        </div>
      )}


      {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-800">Entreprise Individuelle</h3>
              <p className="text-blue-600 font-medium">
                Le certificat de résidence est requis dans l'étape "Dirigeant de l'Entreprise" pour la création d'une entreprise individuelle.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Étape 5 : Récapitulatif et Soumission
const SummaryAndSubmissionStep: React.FC<{
  data: BusinessCreationData, 
  updateData: (field: keyof BusinessCreationData, value: any) => void, 
  submitTrigger?: number,
  personalLocationName?: string,
  companyLocationName?: string
}> = ({ data, updateData, submitTrigger, personalLocationName, companyLocationName }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  // Listes pour les sélecteurs en cascade
  const [regions, setRegions] = useState<any[]>([]);
  const [cercles, setCercles] = useState<any[]>([]);
  const [arrondissements, setArrondissements] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [quartiers, setQuartiers] = useState<any[]>([]);
  
  // Variables d'état pour les IDs sélectionnés (UUIDs pour API)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedCercleId, setSelectedCercleId] = useState<string>('');
  const [selectedArrondissementId, setSelectedArrondissementId] = useState<string>('');
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>('');
  const [selectedQuartierId, setSelectedQuartierId] = useState<string>('');
  
  // Variables d'état pour les codes sélectionnés (codes numériques pour divisionCode)
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('');
  const [selectedCercleCode, setSelectedCercleCode] = useState<string>('');
  const [selectedArrondissementCode, setSelectedArrondissementCode] = useState<string>('');
  const [selectedCommuneCode, setSelectedCommuneCode] = useState<string>('');
  const [selectedQuartierCode, setSelectedQuartierCode] = useState<string>('');

  // Charger les régions au montage
  useEffect(() => {
    let mounted = true;
    divisionService.getRegions().then((res: any[]) => {
      if (mounted) setRegions(res || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Charger cercles quand selectedRegionId change
  useEffect(() => {
    let mounted = true;
    if (selectedRegionId) {
      divisionService.getCerclesByRegion(selectedRegionId).then((res: any[]) => {
        if (mounted) setCercles(res || []);
      }).catch(() => {});
    } else {
      setCercles([]);
      setArrondissements([]);
      setCommunes([]);
      setQuartiers([]);
      setSelectedCercleId('');
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedRegionId]);

  // Charger arrondissements quand selectedCercleId change
  useEffect(() => {
    let mounted = true;
    if (selectedCercleId) {
      divisionService.getArrondissementsByCercle(selectedCercleId).then((res: any[]) => {
        if (mounted) setArrondissements(res || []);
      }).catch(() => {});
    } else {
      setArrondissements([]);
      setCommunes([]);
      setQuartiers([]);
      setSelectedArrondissementId('');
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedCercleId]);

  // Charger communes quand selectedArrondissementId change
  useEffect(() => {
    let mounted = true;
    if (selectedArrondissementId) {
      divisionService.getCommunesByArrondissement(selectedArrondissementId).then((res: any[]) => {
        if (mounted) setCommunes(res || []);
      }).catch(() => {});
    } else {
      setCommunes([]);
      setQuartiers([]);
      setSelectedCommuneId('');
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedArrondissementId]);

  // Charger quartiers quand selectedCommuneId change
  useEffect(() => {
    let mounted = true;
    if (selectedCommuneId) {
      divisionService.getQuartiersByCommune(selectedCommuneId).then((res: any[]) => {
        if (mounted) setQuartiers(res || []);
      }).catch(() => {});
    } else {
      setQuartiers([]);
      setSelectedQuartierId('');
    }
    return () => { mounted = false; };
  }, [selectedCommuneId]);

  // Helper pour vérifier si l'activité nécessite une autorisation d'exercice
  const requiresExerciseAuthorization = () => {
    const selectedNr = data.companyInfo?.domaineActiviteNr;
    return selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0;
  };

  // Fonction de soumission de l'entreprise
  const handleSubmitEntreprise = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // ÉTAPE 1: Sauvegarder les informations personnelles (incluant le champ 'porte')
      console.log('🔍 [SUBMIT] Sauvegarde des informations personnelles avec porte:', data.personalInfo?.porte);
      if (data.personalInfo) {
        try {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const token = localStorage.getItem('token');
          
          if (token && currentUser.personne_id && data.personalInfo.isForSelf) {
            // Convertir le téléphone au format E.164 requis
            let formattedPhone = '';
            if (data.personalInfo.phone) {
              const cleanPhone = data.personalInfo.phone.replace(/[\s\-\.]/g, '');
              if (cleanPhone.startsWith('+')) {
                formattedPhone = cleanPhone; // Déjà au format E.164
              } else if (cleanPhone.startsWith('223')) {
                formattedPhone = '+' + cleanPhone; // Ajouter le +
              } else {
                formattedPhone = '+223' + cleanPhone; // Ajouter +223
              }
            }

            // Formatage du téléphone 2 au format E.164
            let formattedPhone2 = '';
            if (data.personalInfo.phone2) {
              const cleanPhone2 = data.personalInfo.phone2.replace(/\s/g, '');
              if (cleanPhone2.startsWith('+')) {
                formattedPhone2 = cleanPhone2; // Déjà au format international
              } else if (cleanPhone2.startsWith('223')) {
                formattedPhone2 = '+' + cleanPhone2; // Ajouter le +
              } else {
                formattedPhone2 = '+223' + cleanPhone2; // Ajouter +223
              }
            }

            // Mise à jour des informations personnelles existantes
            const personUpdateRequest = {
              nom: data.personalInfo.lastName,
              prenom: data.personalInfo.firstName,
              telephone1: formattedPhone,
              telephone2: formattedPhone2,
              email: data.personalInfo.email,
              // Convertir la date en format LocalDate si nécessaire
              dateNaissance: data.personalInfo.birthDate ? new Date(data.personalInfo.birthDate).toISOString().split('T')[0] : null,
              lieuNaissance: data.personalInfo.birthPlace,
              // Mapper la nationalité vers l'enum backend avec valeur par défaut
              nationnalite: data.personalInfo.nationality || 'MALIENNE',
              sexe: data.personalInfo.sexe === 'MASCULIN' ? 'MASCULIN' : data.personalInfo.sexe,
              situationMatrimoniale: data.personalInfo.situationMatrimoniale || 'CELIBATAIRE',
              civilite: data.personalInfo.civility === 'MONSIEUR' ? 'MONSIEUR' : data.personalInfo.civility,
              division_id: data.personalInfo.divisionId,
              localite: data.personalInfo.localite,
              porte: data.personalInfo.porte
            };
            
            console.log('🔍 [SUBMIT] Requête de mise à jour:', personUpdateRequest);
            console.log('🔍 [DEBUG] Valeurs autorisation avant envoi:', {
              requiresExerciseAuthorization: data.personalInfo?.requiresExerciseAuthorization,
              willImportExport: data.personalInfo?.willImportExport
            });
            
            const response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(personUpdateRequest)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('🔍 [SUBMIT] Réponse d\'erreur du backend:', errorText);
              throw new Error(`Erreur ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            console.log('✅ [SUBMIT] Informations personnelles sauvegardées avec succès');
          }
        } catch (error) {
          console.error('❌ [SUBMIT] Erreur lors de la sauvegarde des informations personnelles:', error);
          setSubmitError('Erreur lors de la sauvegarde des informations personnelles');
          setSubmitting(false);
          return;
        }
      }

      // Variables communes pour toute la fonction
      const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      const gerant = (data.participants || []).find(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
      const gerantId = gerant?.personId || null;
      // Plus de rôle DIRIGEANT - utiliser GERANT ou PROMOTEUR selon le type d'entreprise
      
      // Validation avant soumission: chaque participant doit avoir un document d'identité
      const missingDocs: string[] = [];
      
      (data.participants || []).forEach((p, idx) => {
        const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
        
        // Exclure la validation de document d'identité pour les personnes morales
        if (p.civilite !== 'PERSONNE_MORALE' && !p.documentFile) {
          missingDocs.push(`${label}: document d'identité manquant`);
        }
        
        // Documents requis pour GERANT/PROMOTEUR - uniquement pour les personnes physiques
        const requiresManagerDocuments = (p.role === 'GERANT' || p.role === 'PROMOTEUR') && p.civilite !== 'PERSONNE_MORALE';
        
        if (requiresManagerDocuments && data.personalInfo?.hasCriminalRecord && !p.casierJudiciaireFile) {
          missingDocs.push(`${label}: casier judiciaire manquant`);
        }
        if (requiresManagerDocuments && !data.personalInfo?.hasCriminalRecord && !p.declarationHonneurFile && !p.signatureDataUrl) {
          missingDocs.push(`${label}: déclaration d'honneur manquante (sans casier judiciaire) - uploadez une déclaration ou signez pour en générer une`);
        }
        if (requiresManagerDocuments && data.personalInfo?.isMarried && !p.acteMariageFile) {
          missingDocs.push(`${label}: acte de mariage manquant (si marié)`);
        }
        if (requiresManagerDocuments && !p.extraitNaissanceFile) {
          missingDocs.push(`${label}: extrait de naissance manquant`);
        }
      });
      if (missingDocs.length > 0) {
        setSubmitError(`Documents requis manquants:\n- ${missingDocs.join('\n- ')}`);
        setSubmitting(false);
        return;
      }

      // VALIDATION PRÉALABLE: Vérifier l'unicité des pièces d'identité
      const piecesToCheck = (data.participants || [])
        .filter(p => {
          // Exempter les personnes morales de la validation des pièces d'identité
          if (p.civilite === 'PERSONNE_MORALE') {
            return false;
          }
          return p.numeroPiece && p.typePiece;
        })
        .map(p => ({
          numeroPiece: p.numeroPiece!.trim(),
          typePiece: p.typePiece!
        }));

      if (piecesToCheck.length > 0) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Aucun token trouvé');

        // Vérifier l'unicité des pièces en utilisant l'endpoint de validation
        try {
          const validationResponse = await fetch('/api/v1/validation/check-pieces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pieces: piecesToCheck })
          });

          if (validationResponse.ok) {
            const validationResult = await validationResponse.json();
            
            if (validationResult.success) {
              // Vérifier s'il y a des pièces déjà utilisées
              const usedPieces = Object.entries(validationResult.results || {})
                .filter(([_, isUsed]) => isUsed)
                .map(([numero, _]) => {
                  const piece = piecesToCheck.find(p => p.numeroPiece === numero);
                  return `- ${piece?.typePiece || 'Document'} numéro "${numero}"`;
                });

              if (usedPieces.length > 0) {
                setSubmitError(`❌ Erreur : Les documents d'identité suivants sont déjà utilisés par d'autres utilisateurs :\n${usedPieces.join('\n')}\n\nVeuillez utiliser des documents différents.`);
                setSubmitting(false);
                return;
              }
            }
          } else {
          }
        } catch (e) {
        }

      }

      // WORKFLOW ÉTAPE 3.5: Traiter les associés existants (mise à jour des données manquantes)
      if (!isEntrepriseIndividuelle) {
        // Traitement des associés existants (mise à jour des données manquantes)
        const associates = data.participants?.filter(p => p.role === 'ASSOCIE') || [];

        for (const associate of associates) {
          
          // Si l'associé a déjà un personId, vérifier s'il a besoin d'une mise à jour
          if (associate.personId) {
            
            const currentUser = authAPI.getCurrentUser();
            const isCurrentUser = currentUser && (currentUser.personne_id === associate.personId || currentUser.personneId === associate.personId);
            
            if (isCurrentUser) {
              
              // Vérifier si l'utilisateur a besoin d'une mise à jour (données manquantes)
              const needsUpdate = !currentUser.dateNaissance || 
                                 !currentUser.lieuNaissance || 
                                 !currentUser.nationnalite ||
                                 !currentUser.sexe ||
                                 !currentUser.situationMatrimoniale;
              
              if (needsUpdate) {
                
                // Mettre à jour avec les données du formulaire
                const updateRequest = {
                  nom: associate.nom || currentUser.nom,
                  prenom: associate.prenom || currentUser.prenom,
                  telephone1: associate.telephone || currentUser.telephone1,
                  email: associate.email || currentUser.email,
                  dateNaissance: ensureAdultBirthDate(associate.dateNaissance) || ensureAdultBirthDate(currentUser.dateNaissance),
                  lieuNaissance: associate.lieuNaissance || currentUser.lieuNaissance,
                  nationnalite: associate.nationnalite || currentUser.nationnalite || 'MALIENNE',
                  sexe: associate.sexe || currentUser.sexe,
                  situationMatrimoniale: associate.situationMatrimoniale || currentUser.situationMatrimoniale || 'CELIBATAIRE',
                  civilite: mapCivilityToBackend(associate.civilite || 'MONSIEUR') || currentUser.civilite,
                  division_id: associate.divisionId || associate.division_id || currentUser.division_id,
                  divisionCode: associate.divisionCode || currentUser.divisionCode,
                  localite: associate.localite || currentUser.localite,
                  porte: (associate as any).porte || (currentUser as any).porte
                };
                
                
                const token = localStorage.getItem('token');
                const updateResponse = await fetch(`/api/v1/persons/${associate.personId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(updateRequest)
                });
                
                if (updateResponse.ok) {
                  const updatedUser = await updateResponse.json();
                } else {
                  throw new Error('Impossible de mettre à jour les données de l\'associé');
                }
              } else {
              }
            } else {
            }
          }
        }
        
      } else {
      }

      // WORKFLOW ÉTAPE 4: Créer tous les participants qui n'ont pas encore d'ID
      const participantsToCreate = data.participants?.filter(p => !p.personId && p.nom && p.prenom) || [];
      
      for (const participant of participantsToCreate) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Aucun token trouvé');


        // Valider et corriger le format du téléphone
        const participantPhone = participant.telephone || '';
        const validPhone = participantPhone.startsWith('+') ? participantPhone : 
          (participantPhone ? `+223${participantPhone.replace(/\s/g, '')}` : '');

        const personRequest = {
          nom: participant.nom,
          prenom: participant.prenom,
          telephone1: validPhone,
          email: participant.email || '',
          dateNaissance: participant.dateNaissance || '',
          lieuNaissance: participant.lieuNaissance || '',
          nationnalite: participant.nationnalite || 'MALIENNE',
          sexe: getConsistentSexe(participant.sexe, participant.civilite || 'MONSIEUR'),
          situationMatrimoniale: participant.situationMatrimoniale || 'CELIBATAIRE',
          civilite: mapCivilityToBackend(participant.civilite || 'MONSIEUR'),
          role: 'USER',
          entrepriseRole: participant.role || 'ASSOCIE'
        };


        const response = await fetch('/api/v1/persons', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Erreur création participant ${participant.prenom} ${participant.nom}: ${errorData.message}`);
        }
        
        const result = await response.json();
        
        // Mettre à jour l'ID du participant
        participant.personId = result.id || result.data?.id;
      }


      // WORKFLOW ÉTAPE 5: Soumission finale - POST /api/v1/entreprises/with-documents
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Assembler tous les participants avec leurs IDs
      const allParticipants = data.participants?.map(p => {
        // Valider et nettoyer le rôle
        const validRoles = ['GERANT', 'PROMOTEUR', 'ASSOCIE', 'ADMINISTRATEUR'];
        const cleanRole = p.role?.toString().trim().toUpperCase();
        
        if (!validRoles.includes(cleanRole)) {
          throw new Error(`Rôle invalide pour participant ${p.nom} ${p.prenom}: ${p.role}`);
        }
        
        const result: any = {
          personId: p.personId || '',
          role: cleanRole,
          pourcentageParts: p.pourcentageParts || 0,
          dateDebut: p.dateDebut || new Date().toISOString().split('T')[0],
          dateFin: p.dateFin || '9999-12-31'
        };
        
        // 🔧 AJOUT DES CHAMPS PERSONNELS POUR MISE À JOUR BACKEND
        if (p.dateNaissance && p.dateNaissance !== '') {
          result.dateNaissance = new Date(p.dateNaissance);
        }
        
        if (p.lieuNaissance && p.lieuNaissance !== '') {
          result.lieuNaissance = p.lieuNaissance;
        }
        
        return result;
      }) || [];

      // Ajouter le fondateur s'il n'est pas déjà dans les participants
      if (data.founderId) {
        const founderExists = allParticipants.some(p => p.personId === data.founderId);
        if (!founderExists) {
          const founderParticipant: any = {
            personId: data.founderId,
            role: 'DIRIGEANT',
            pourcentageParts: 100 - allParticipants.reduce((sum, p) => sum + p.pourcentageParts, 0),
            dateDebut: new Date().toISOString().split('T')[0],
            dateFin: '9999-12-31'
          };
          
          // 🔧 AJOUT DES CHAMPS PERSONNELS DU FONDATEUR (utilisateur connecté)
          if (data.personalInfo?.birthDate && data.personalInfo.birthDate !== '') {
            founderParticipant.dateNaissance = new Date(data.personalInfo.birthDate);
          }
          
          if (data.personalInfo?.birthPlace && data.personalInfo.birthPlace !== '') {
            founderParticipant.lieuNaissance = data.personalInfo.birthPlace;
          }
          
          allParticipants.push(founderParticipant);
        }
      }

      const entrepriseRequest = {
        nom: data.companyInfo?.nom || (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim() 
          : ''),
        sigle: data.companyInfo?.sigle || '',
        adresseDifferentIdentite: data.personalInfo?.hasDifferentAddress || false,
        extraitJudiciaire: data.personalInfo?.hasCriminalRecord || false,
        autorisationGerant: data.personalInfo?.allowsMultipleManagers || false,
        autorisationExercice: data.personalInfo?.requiresExerciseAuthorization || false,
        importExport: data.personalInfo?.willImportExport || false,
        statutSociete: true,
        typeEntreprise: data.companyInfo?.typeEntreprise || 'SOCIETE',
        statutCreation: 'EN_COURS',
        etapeValidation: 'ACCUEIL',
        formeJuridique: data.companyInfo?.formeJuridique || 'SARL',
        domaineActivite: data.companyInfo?.domaineActivite, // Pas de valeur par défaut
        domaineActiviteNr: (() => {
          const value = data.companyInfo?.domaineActiviteNr;
          
          // SOLUTION ROBUSTE: Limiter à 500 caractères maximum (nouvelle limite DB)
          if (!value) {
            return null;
          }
          
          const stringValue = String(value);
                    
          if (stringValue.length > 500) {
            const truncated = stringValue.substring(0, 500);
            return truncated;
          }
          
                    return stringValue;
        })(),
        capitale: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? '0' // Capital à 0 pour les entreprises individuelles
          : (data.companyInfo?.capitale || ''),
        activiteSecondaire: data.companyInfo?.activiteSecondaire || '',
        divisionCode: (() => {
          // Forcer la synchronisation si divisionCode est vide mais qu'on a des données personnelles
          let finalDivisionCode = data.companyInfo?.divisionCode;
          
          if (!finalDivisionCode && data.personalInfo?.hasDifferentAddress === false && data.personalInfo?.divisionId) {
            finalDivisionCode = data.personalInfo.divisionId;
            
            // Mettre à jour immédiatement data.companyInfo
            updateData('companyInfo', {
              ...data.companyInfo,
              divisionCode: finalDivisionCode
            });
          }
          
          return finalDivisionCode || selectedQuartierCode || selectedCommuneCode || selectedArrondissementCode || selectedCercleCode || selectedRegionCode || '';
        })(),
        rue: data.companyInfo?.rue || null,
        porte: data.companyInfo?.porte || null,
        representativeAdresseLibre: data.personalInfo?.adresseLibre || null,
        totalAmount: costs.total, // Ajouter le montant calculé pour la sauvegarde
        participants: allParticipants
      };

      console.log('🔍 [DEBUG] Objet entrepriseRequest avant envoi:', {
        autorisationExercice: entrepriseRequest.autorisationExercice,
        importExport: entrepriseRequest.importExport,
        totalAmount: entrepriseRequest.totalAmount
      });

      // ÉTAPE 5.1: Créer l'entreprise d'abord pour obtenir l'ID
      const response = await createEntreprise(entrepriseRequest);
      const entrepriseId = response.id;
      const entrepriseReference = response.reference || `ENT-${Date.now()}`;
      
      // Helpers locaux
      const safeJson = async (res: Response) => { try { return await res.json(); } catch { return null; } };

      const uploadPieceForParticipant = async (personId: string, typePiece: string, numeroPiece: string, file: File) => {
        // Générer un numéro unique si le numéro fourni est vide, générique ou potentiellement en conflit
        let finalNumeroPiece = numeroPiece;
        if (!numeroPiece || numeroPiece.length < 6 || numeroPiece.includes('123456')) {
          // Générer un numéro plus unique avec UUID partiel et timestamp
          const timestamp = Date.now().toString();
          const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
          const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
          finalNumeroPiece = `${typePiece}${timestamp.slice(-8)}${random}${uuid}`.substring(0, 20);
        }
        
        
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('typePiece', typePiece);
        fd.append('numero', finalNumeroPiece);
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 5);
        fd.append('dateExpiration', exp.toISOString().split('T')[0]);
        fd.append('file', file);
        const res = await fetch('/api/v1/documents/piece', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        if (!res.ok) { const err = await safeJson(res); throw new Error(err?.message || 'Upload pièce échoué'); }
      };

      const uploadDocumentFor = async (personId: string, typeDocument: string, file: File, numero?: string) => {
        console.log(`🔄 [UPLOAD DEBUG] Tentative upload document:`, {
          personId,
          entrepriseId,
          typeDocument,
          numero,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('typeDocument', typeDocument);
        if (numero) fd.append('numero', numero);
        fd.append('file', file);
        
        const res = await fetch('/api/v1/documents/document', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        
        if (!res.ok) { 
          const errorText = await res.text();
          console.error(`❌ [UPLOAD ERROR] ${typeDocument}:`, {
            status: res.status,
            statusText: res.statusText,
            errorText
          });
          
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson?.message || errorText;
          } catch {
            errorMessage = errorText;
          }
          
          throw new Error(errorMessage || `Upload ${typeDocument} échoué`);
        } else {
          console.log(`✅ [UPLOAD SUCCESS] ${typeDocument} uploadé avec succès`);
        }
      };

      // Fonction pour uploader les documents supplémentaires de type AUTRES
      const uploadAutresDocumentFor = async (personId: string, nom: string, description: string, file: File) => {
        console.log(`🔄 [UPLOAD DEBUG] Tentative upload document AUTRES:`, {
          personId,
          entrepriseId,
          nom,
          description,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        const fd = new FormData();
        fd.append('personneId', personId);
        fd.append('entrepriseId', entrepriseId);
        fd.append('nom', nom);
        if (description) fd.append('description', description);
        fd.append('file', file);
        
        const res = await fetch('/api/v1/documents/autres', { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` }, 
          body: fd 
        });
        
        if (!res.ok) { 
          const errorText = await res.text();
          console.error(`❌ [UPLOAD ERROR] AUTRES document "${nom}":`, {
            status: res.status,
            statusText: res.statusText,
            errorText
          });
          
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson?.message || errorText;
          } catch {
            errorMessage = errorText;
          }
          
          throw new Error(errorMessage || `Upload document AUTRES "${nom}" échoué`);
        } else {
          console.log(`✅ [UPLOAD SUCCESS] Document AUTRES "${nom}" uploadé avec succès`);
        }
      };

      // Upload pièces identités
      {
        const list = data.participants || [];
        for (let idx = 0; idx < list.length; idx++) {
          const participant = list[idx];
          
          // Debug détaillé pour chaque participant
          
          if (participant.civilite === 'PERSONNE_MORALE') {
            // Upload du document RCCM pour les personnes morales
            if (participant.rccmFile && participant.personId) {
              try {
                await uploadDocumentFor(participant.personId, 'RCCM', participant.rccmFile, `RCCM-${participant.denominationEntreprise}-${entrepriseReference}`);
              } catch (e) {
                throw new Error(`Erreur upload RCCM ${participant.denominationEntreprise}: ${e}`);
              }
            } else {
            }
          } else if (participant.personId && participant.documentFile && participant.typePiece && participant.numeroPiece) {
            try {
              await uploadPieceForParticipant(participant.personId, participant.typePiece, participant.numeroPiece, participant.documentFile);
            } catch (e) { 
              const errorMessage = e instanceof Error ? e.message : String(e);
              
              // Améliorer le message d'erreur avec les détails de la pièce
              let detailedError = errorMessage;
              if (errorMessage.includes('Cette meme pièce est déjà utiliser') || errorMessage.includes('déjà utiliser')) {
                const participantName = participant.prenom && participant.nom ? `${participant.prenom} ${participant.nom}` : `Participant ${idx + 1}`;
                detailedError = `Le document d'identité de type "${participant.typePiece}" avec le numéro "${participant.numeroPiece}" (pour ${participantName}) est déjà utilisé par un autre utilisateur. Veuillez utiliser un document différent.`;
              }
              
              setSubmitError(`❌ Erreur lors de l'upload du document : ${detailedError}`);
              setSubmitting(false);
              return;
            }
          } else {
          }
        }
      }

      // Documents spécifiques: Gérant (pour toutes les entreprises)
      // Plus de distinction gerant/gérant - utiliser seulement le gérant
      
      // Upload documents personnels du gérant (pour tous types d'entreprise)
      if (gerantId) {
        const businessType = isEntrepriseIndividuelle ? 'entreprise individuelle' : 'société';
        
        if (gerant?.casierJudiciaireFile && data.personalInfo?.hasCriminalRecord) {
          try { 
            await uploadDocumentFor(gerantId, 'CASIER_JUDICIAIRE', gerant.casierJudiciaireFile, `CJ-${entrepriseReference}`); 
          } catch (e) { }
        }
        if (gerant?.acteMariageFile && data.personalInfo?.isMarried) {
          
          // Vérifier le statut matrimonial dans le backend avant upload
          try {
            const personResponse = await fetch(`/api/v1/persons/${gerantId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (personResponse.ok) {
              const personData = await personResponse.json();
              
              if (personData.situationMatrimoniale !== 'MARIE') {
                
                // Corriger le statut matrimonial immédiatement
                try {
                  // Préparer les données en corrigeant le format de date
                  const correctedPersonData = {
                    ...personData,
                    situationMatrimoniale: 'MARIE'
                  };
                  
                  // Corriger le format de dateNaissance si nécessaire
                  if (correctedPersonData.dateNaissance && typeof correctedPersonData.dateNaissance === 'string') {
                    // Convertir de ISO datetime vers date simple (YYYY-MM-DD)
                    correctedPersonData.dateNaissance = correctedPersonData.dateNaissance.split('T')[0];
                  }
                  
                  
                  const updateResponse = await fetch(`/api/v1/persons/${gerantId}`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(correctedPersonData)
                  });
                  if (updateResponse.ok) {
                  } else {
                    const errorText = await updateResponse.text();
                  }
                } catch (e) {
                }
              }
            }
          } catch (e) {
          }
          
          try { 
            await uploadDocumentFor(gerantId, 'ACTE_MARIAGE', gerant.acteMariageFile, `AM-${entrepriseReference}`); 
          } catch (e) { }
        }
        if (!data.personalInfo?.hasCriminalRecord && gerant?.declarationHonneurFile) {
          try { 
            await uploadDocumentFor(gerantId, 'DECLARATION_HONNEUR', gerant.declarationHonneurFile, `DH-${entrepriseReference}`);
          } catch (e) { }
        }
        if (gerant?.extraitNaissanceFile) {
          try { 
            await uploadDocumentFor(gerantId, 'EXTRAIT_NAISSANCE', gerant.extraitNaissanceFile, `EN-${entrepriseReference}`); 
          } catch (e) { }
        }
        
        // Certificat de résidence (requis pour tous les gérants)
        if (gerant?.certificatResidenceFile) {
          try { 
            await uploadDocumentFor(gerantId, 'CERTIFICAT_RESIDENCE', gerant.certificatResidenceFile, `CR-${entrepriseReference}`); 
          } catch (e) { }
        }
        
        // Pièce de nationalité (requis pour entreprises individuelles)
        if (isEntrepriseIndividuelle && gerant?.pieceNationaliteFile) {
          try { 
            await uploadDocumentFor(gerantId, 'PIECE_NATIONALITE', gerant.pieceNationaliteFile, `PN-${entrepriseReference}`); 
          } catch (e) { }
        }

        // Documents supplémentaires de type AUTRES (pour entreprises individuelles)
        if (isEntrepriseIndividuelle && gerant?.autresDocuments && gerant.autresDocuments.length > 0) {
          console.log(`📎 [UPLOAD DEBUG] Upload de ${gerant.autresDocuments.length} documents supplémentaires AUTRES`);
          
          for (const autreDoc of gerant.autresDocuments) {
            if (autreDoc.file && autreDoc.name) {
              try {
                await uploadAutresDocumentFor(
                  gerantId,
                  autreDoc.name,
                  autreDoc.description || '',
                  autreDoc.file
                );
              } catch (e) {
                console.error(`❌ Erreur upload document AUTRES "${autreDoc.name}":`, e);
                // Ne pas bloquer le processus pour les erreurs de documents supplémentaires
              }
            }
          }
        }
      }

      // Entreprise: statuts / registre (sociétés seulement)
      // IMPORTANT: Pour les entreprises individuelles, ne pas uploader Documents, Statuts, Registre de commerce
      
      if (!isEntrepriseIndividuelle) {
        const docPersonId = gerantId || null;
        
        if (data.documents?.statutes && docPersonId) {
          try { await uploadDocumentFor(docPersonId, 'STATUS_SOCIETE', data.documents.statutes, `STATUTS-${entrepriseReference}`); } catch (e) { }
        }
        if (data.documents?.commerceRegistry && docPersonId) {
          try { await uploadDocumentFor(docPersonId, 'REGISTRE_COMMERCE', data.documents.commerceRegistry, `RC-${entrepriseReference}`); } catch (e) { }
        }
      }

      // Note: Documents personnels du gérant (certificat de résidence, etc.) sont maintenant traités dans la section gérant ci-dessus

      // Message de succès avec notification d'autorisation si nécessaire
      let successMessage = 'Demande soumise et documents envoyés ! Référence: ' + entrepriseReference;
      
      if (requiresExerciseAuthorization()) {
        const selectedNr = data.companyInfo?.domaineActiviteNr;
        const domaineReglemente = DOMAINE_MAPPING[selectedNr!][0];
        const template = AUTORISATION_TEMPLATES[domaineReglemente];
        
        successMessage += `\n\n⚠️ IMPORTANT: Votre activité "${template?.title || 'sélectionnée'}" nécessite une DEMANDE D'AUTORISATION D'EXERCICE.`;
        successMessage += '\n📋 Vous devez maintenant constituer et déposer un dossier de demande d\'autorisation auprès de l\'Agence pour la Promotion des Investissements au Mali (API-Mali).';
        successMessage += '\n📧 Un email de notification vous sera envoyé avec les détails et la procédure à suivre.';
      }
      
      setSubmitSuccess(successMessage);
      
    } catch (error: any) {
      setSubmitError(error?.message || 'Erreur lors de la création de l\'entreprise');
    } finally {
      setSubmitting(false);
    }
  };

  // Déclencheur externe depuis le parent (bouton global)
  useEffect(() => {
    if (submitTrigger) {
      handleSubmitEntreprise();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  const costs = apiUtils.calculateCosts({
    businessType: data.companyInfo?.typeEntreprise === 'SOCIETE' ? 'Société' : 'Individuelle',
    partners: data.participants || [],
    requiresExerciseAuthorization: data.personalInfo?.requiresExerciseAuthorization,
    willImportExport: data.personalInfo?.willImportExport,
  });

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-investmali-neutral-dark mb-2 animate-slide-up">Récapitulatif et Soumission</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
        Vérifiez les informations de votre entreprise avant de soumettre votre demande de création.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Récapitulatif */}
        <div className="space-y-4 sm:space-y-6">
          {/* Informations de l'entreprise */}
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-investmali-accent text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">🏢</span>
              Informations de l'Entreprise
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Nom de l'entreprise :</span>
                <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.companyInfo?.nom}</span>
              </div>
              {data.companyInfo?.sigle && (
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Sigle :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.companyInfo?.sigle}</span>
                </div>
              )}
              {data.companyInfo?.capitale && data.companyInfo?.typeEntreprise === 'SOCIETE' && (
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Capitale :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.companyInfo?.capitale}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Type d'entreprise :</span>
                <span className="font-medium text-investmali-neutral-dark">
                  {data.companyInfo?.typeEntreprise === 'SOCIETE' ? 'Société' : 'Entreprise Individuelle'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Forme juridique :</span>
                <span className="font-medium text-investmali-neutral-dark">{data.companyInfo?.formeJuridique}</span>
              </div>
              {data.companyInfo?.domaineActivite && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Domaine d'activité réglementé :</span>
                  <span className="font-medium text-investmali-neutral-dark">{data.companyInfo.domaineActivite}</span>
                </div>
              )}
              {data.companyInfo?.domaineActiviteNr && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Domaine d'activité :</span>
                  <span className="font-medium text-investmali-neutral-dark">
                    {DOMAINE_ACTIVITE_NR_LABELS[data.companyInfo.domaineActiviteNr] || data.companyInfo.domaineActiviteNr}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Localisation entreprise :</span>
                <span className="font-medium text-investmali-neutral-dark">{companyLocationName || data.companyInfo?.divisionCode || 'Non spécifiée'}</span>
              </div>
              {data.participants && data.participants.length > 0 && data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Nombre de participants :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.participants.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informations personnelles */}
          {data.personalInfo && (
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
                <span className="bg-investmali-warning text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">👤</span>
                Informations Personnelles
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Nom complet :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">
                    {CIVILITE_LABELS[data.personalInfo.civility || ''] || data.personalInfo.civility} {data.personalInfo.firstName} {data.personalInfo.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Fonction :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.personalInfo.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Contact :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.personalInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Localisation personnelle :</span>
                  <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{personalLocationName || data.personalInfo.divisionId || 'Non spécifiée'}</span>
                </div>
                {(data.personalInfo.localite || data.personalInfo.porte) && (
                  <>
                    {data.personalInfo.localite && (
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Rue :</span>
                        <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.personalInfo.localite}</span>
                      </div>
                    )}
                    {data.personalInfo.porte && (
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Porte :</span>
                        <span className="text-xs sm:text-sm font-medium text-investmali-neutral-dark">{data.personalInfo.porte}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}



        </div>

        {/* Prochaines étapes */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 animate-slide-up" style={{animationDelay: '0.6s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-investmali-warning text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">⏳</span>
              Prochaines Étapes
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-investmali-accent text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1">1</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-investmali-neutral-dark">Validation par un agent</p>
                  <p className="text-xs sm:text-sm text-gray-600">Votre dossier sera examiné par nos agents dans les 48h</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1">2</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-700">Paiement des frais</p>
                  <p className="text-xs sm:text-sm text-gray-600">Après validation, vous recevrez un lien de paiement</p>
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">
                      Montant à payer : {costs.total.toLocaleString()} F CFA
                    </p>
                    {costs.total === 180 && (
                      <p className="text-xs text-green-600 mt-1">
                        Montant majoré (autorisation d'exercice ou import/export)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1">3</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-700">Téléchargement des documents</p>
                  <p className="text-xs sm:text-sm text-gray-600">Récupérez vos documents officiels après paiement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations importantes */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200 animate-slide-up" style={{animationDelay: '0.7s'}}>
            <h3 className="text-base sm:text-lg font-semibold text-investmali-neutral-dark mb-3 sm:mb-4 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm mr-2 sm:mr-3">ℹ️</span>
              Informations Importantes
            </h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1 flex-shrink-0">!</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-800">Aucun paiement requis maintenant</p>
                  <p className="text-xs sm:text-sm text-gray-600">Le paiement sera demandé uniquement après validation de votre dossier par nos agents.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1 flex-shrink-0">✓</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-800">Validation gratuite</p>
                  <p className="text-xs sm:text-sm text-gray-600">L'examen de votre dossier par nos experts est entièrement gratuit.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 sm:mt-1 flex-shrink-0">⏱</div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-800">Délai de traitement</p>
                  <p className="text-xs sm:text-sm text-gray-600">Votre demande sera traitée dans un délai maximum de 48 heures ouvrables.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages d'état */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
              {submitSuccess}
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="bg-gradient-to-r from-investmali-accent to-investmali-warning p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg animate-slide-up" style={{animationDelay: '0.8s'}}>
            <button
              onClick={() => handleSubmitEntreprise()}
              disabled={submitting || submitSuccess !== null}
              className="w-full bg-white text-investmali-neutral-dark font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-mali-blue/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-mali-dark"></div>
                  <span className="text-sm sm:text-base">Soumission en cours...</span>
                </>
              ) : submitSuccess ? (
                <>
                  <span className="text-lg sm:text-2xl">✅</span>
                  <span className="text-sm sm:text-base">Demande Soumise avec Succès</span>
                </>
              ) : (
                <>
                  <span className="text-lg sm:text-2xl">📤</span>
                  <span className="text-sm sm:text-base">Soumettre ma Demande</span>
                </>
              )}
            </button>
            <p className="text-white text-xs sm:text-sm text-center mt-2 sm:mt-3 opacity-90">
              {submitSuccess ? (
                "Votre demande a été enregistrée • Suivi disponible dans votre profil"
              ) : (
                "Soumission gratuite • Validation sous 48h • Support dédié"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction pour récupérer le nom de la division depuis l'API INSTAT directement
const getDivisionName = async (divisionCodeOrId: string): Promise<string> => {
  try {
    
    // Détecter si c'est un UUID (retourner tel quel car pas supporté par INSTAT)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(divisionCodeOrId);
    if (isUUID) {
      return divisionCodeOrId;
    }
    
    // Pour les codes de division, utiliser l'API INSTAT selon la longueur
    const codeLength = divisionCodeOrId.length;
    
    if (codeLength === 2) {
      // Région (ex: "90" pour Bamako)
      return `Région ${divisionCodeOrId}`;
    } else if (codeLength === 4) {
      // Cercle (ex: "9001" pour Bamako)
      return `Cercle ${divisionCodeOrId}`;
    } else if (codeLength === 8) {
      // Commune (ex: "90010701" pour Commune 7)
      return `Commune ${divisionCodeOrId}`;
    } else if (codeLength === 12) {
      // Quartier - Extraire le code commune parent
      const communeCode = divisionCodeOrId.substring(0, 8);
      
      const endpoint = `https://apimali.test.instat.ml/api/get/vfq/${communeCode}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'accept': '*/*',
          'Authorization': 'Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw',
          'X-CSRF-TOKEN': ''
        }
      });
      
      if (response.ok) {
        const quartiers = await response.json();
        
        // Chercher le quartier avec le bon code
        const quartier = quartiers?.find((q: any) => q.code === divisionCodeOrId);
        if (quartier) {
          return quartier.nom;
        } else {
          console.log(`Quartier non trouvé pour le code: ${divisionCodeOrId}`);
          return `Localisation ${divisionCodeOrId}`;
        }
      } else {
        console.log(`Erreur API INSTAT pour le code: ${divisionCodeOrId}`);
        return `Localisation ${divisionCodeOrId}`;
      }
    } else {
      console.log(`Code de division non supporté: ${divisionCodeOrId}`);
      return `Localisation ${divisionCodeOrId}`;
    }
  } catch (error) {
    console.log(`Erreur lors de la récupération du nom de division:`, error);
    return `Localisation ${divisionCodeOrId}`;
  }
};

const BusinessCreation: React.FC = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [isForSelf, setIsForSelf] = useState<boolean | null>(null);
  
  // États pour les noms des divisions
  const [personalLocationName, setPersonalLocationName] = useState<string>('');
  const [companyLocationName, setCompanyLocationName] = useState<string>('');
  
  const [businessData, setBusinessData] = useState<BusinessCreationData>({
    personalInfo: {
      civility: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phone2: '',
      birthDate: '',
      birthPlace: '',
      nationality: '',
      sexe: '',
      situationMatrimoniale: '',
      typePersonne: 'PHYSIQUE' as TypePersonne,
      idType: 'CNI',
      idNumber: '',
      idExpiryDate: '',
      idIssuedAt: '',
      address: '',
      city: '',
      region: '',
      localite: '',
      porte: '',
      divisionId: '',
      position: '',
      powers: [],
      roleId: 0,
      idDocument: null,
      idDocumentName: '',
      isForSelf: false,
      hasDifferentAddress: false,
      hasCriminalRecord: false,
      isMarried: false,
      allowsMultipleManagers: false,
      requiresExerciseAuthorization: false,
      willImportExport: false
    },
    companyInfo: {
      nom: '',
      sigle: '',
      capitale: '',
      activiteSecondaire: '',
      typeEntreprise: 'ENTREPRISE_INDIVIDUELLE' as TypeEntreprise,
      formeJuridique: 'E_I' as FormeJuridique,
      domaineActivite: undefined, // Pas de valeur par défaut - sera défini seulement si nécessaire
      domaineActiviteNr: 'ELEVAGE' as DomaineActiviteNr, // Domaine non réglementé par défaut
      divisionCode: '',
      adresseDifferentIdentite: false,
      extraitJudiciaire: false,
      autorisationGerant: false,
      autorisationExercice: false,
      importExport: false,
      statutSociete: false,
      statutCreation: 'EN_COURS' as StatutCreation,
      etapeValidation: 'CREATION' as EtapeValidation,
      regionId: '',
      cercleId: '',
      arrondissementId: '',
      communeId: ''
    },
    participants: [],
    documents: {
      statutes: null,
      statutesName: '',
      needsStatutesDrafting: false,
      statutesPages: 0,
      commerceRegistry: null,
      commerceRegistryName: '',
      hasCommerceRegistry: false,
      residenceCertificate: null,
      residenceCertificateName: ''
    },
    payment: {
      method: '',
      phoneNumber: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardName: '',
      totalAmount: 0,
      breakdown: {
        statutesDrafting: 0,
        registrationFees: 0,
        serviceFees: 0
      }
    }
  });

  // Division state (backend-driven)
  const [regions, setRegions] = useState<Array<{ id: string; nom: string }>>([]);
  const [cercles, setCercles] = useState<Array<{ id: string; nom: string }>>([]);
  const [arrondissements, setArrondissements] = useState<Array<{ id: string; nom: string }>>([]);
  const [communes, setCommunes] = useState<Array<{ id: string; nom: string }>>([]);
  const [societeJuridictions, setSocieteJuridictions] = useState<string[]>([]);

  // Selected division IDs (used for DTO mapping later)
  const [selectedRegionId, setSelectedRegionId] = useState<string | ''>('');
  const [selectedCercleId, setSelectedCercleId] = useState<string | ''>('');
  const [selectedArrondissementId, setSelectedArrondissementId] = useState<string | ''>('');
  const [selectedCommuneId, setSelectedCommuneId] = useState<string | ''>('');


  // Refs pour les animations GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroFeaturesRef = useRef<HTMLDivElement>(null);
  const scene3DRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const totalSteps = 5;
  const steps = [
    { number: 1, title: 'Informations Personnelles', icon: '👤' },
    { number: 2, title: 'Informations Société', icon: '🏢' },
    { number: 3, title: 'Activité', icon: '💼' },
    { number: 4, title: 'Documents', icon: '📄' },
    { number: 5, title: 'Récapitulatif', icon: '✅' }
  ];

  // Détecter le retour depuis la déclaration sur l'honneur
  useEffect(() => {
    if (location.state?.returnFromDeclaration && location.state?.targetStep) {
      setCurrentStep(location.state.targetStep);
      
      // Nettoyer le state pour éviter de réappliquer
      window.history.replaceState({}, document.title, '/create-business');
    }
  }, [location.state]);

  // Animation d'entrée de la page
  useEffect(() => {
    // Attendre que le DOM soit complètement chargé
    if (!document.body) return;

    const ctx = gsap.context(() => {
      // Timeline principale pour l'entrée
      const tl = gsap.timeline();

      // Animation du logo et header
      if (logoRef.current) {
        tl.fromTo(logoRef.current,
          { opacity: 0, x: -30, scale: 0.8 },
          { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
        );
      }

      // Animation du titre hero
      if (heroTitleRef.current) {
        tl.fromTo(heroTitleRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
          "-=0.3"
        );
      }

      // Animation du sous-titre hero
      if (heroSubtitleRef.current) {
        tl.fromTo(heroSubtitleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        );
      }

      // Animation des features hero
      tl.fromTo(heroFeaturesRef.current?.children || [],
        { opacity: 0, x: -20, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" },
        "-=0.3"
      );

      // Animation de la scène 3D
      tl.fromTo(scene3DRef.current,
        { opacity: 0, x: 50, rotationY: -15 },
        { opacity: 1, x: 0, rotationY: 0, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      );

      // Animation de la barre de progression
      tl.fromTo(progressRef.current?.children || [],
        { opacity: 0, y: -20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.2"
      );

      // Animation du contenu principal
      tl.fromTo(contentRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
        "-=0.2"
      );

      // Animation des boutons de navigation
      tl.fromTo(navigationRef.current?.children || [],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.1"
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Charger les formes juridiques (SocieteJuridiction) lorsque le type = 'societe'
  useEffect(() => {
    const loadJuridictions = async () => {
      if (businessData.companyInfo?.typeEntreprise === 'SOCIETE') {
        try {
          const values = await enumService.getSocieteJuridictions();
          setSocieteJuridictions(Array.isArray(values) ? values : []);
        } catch (e) {
          setSocieteJuridictions([]);
        }
      } else {
        setSocieteJuridictions([]);
      }
    };
    loadJuridictions();
  }, [businessData.companyInfo?.typeEntreprise]);

  // Load regions on mount
  useEffect(() => {
    (async () => {
      try {
        const regionList = await divisionService.getRegions();
        setRegions(regionList || []);
      } catch (e) {
      }
    })();
  }, []);

  // Cascade: region -> cercles
  useEffect(() => {
    if (!selectedRegionId) {
      setCercles([]); setArrondissements([]); setCommunes([]);
      setSelectedCercleId(''); setSelectedArrondissementId(''); setSelectedCommuneId('');
      return;
    }
    (async () => {
      try {
        const list = await divisionService.getCerclesByRegion(selectedRegionId);
        setCercles(list || []);
        setArrondissements([]); setCommunes([]);
        setSelectedCercleId(''); setSelectedArrondissementId(''); setSelectedCommuneId('');
      } catch (e) { }
    })();
  }, [selectedRegionId]);

  // Cascade: cercle -> arrondissements
  useEffect(() => {
    if (!selectedCercleId) {
      setArrondissements([]); setCommunes([]);
      setSelectedArrondissementId(''); setSelectedCommuneId('');
      return;
    }
    (async () => {
      try {
        const list = await divisionService.getArrondissementsByCercle(selectedCercleId);
        setArrondissements(list || []);
        setCommunes([]);
        setSelectedArrondissementId(''); setSelectedCommuneId('');
      } catch (e) { }
    })();
  }, [selectedCercleId]);

  // Cascade: arrondissement -> communes
  useEffect(() => {
    if (!selectedArrondissementId) {
      setCommunes([]);
      setSelectedCommuneId('');
      return;
    }
    (async () => {
      try {
        const list = await divisionService.getCommunesByArrondissement(selectedArrondissementId);
        setCommunes(list || []);
        setSelectedCommuneId('');
      } catch (e) { }
    })();
  }, [selectedArrondissementId]);

  // Récupérer les noms des divisions pour l'affichage dans le récapitulatif
  useEffect(() => {
    const fetchDivisionNames = async () => {
      // Debug: Afficher les données de localisation
      
      // Récupérer le nom de la localisation personnelle
      if (businessData.personalInfo?.divisionId) {
        const personalName = await getDivisionName(businessData.personalInfo.divisionId);
        setPersonalLocationName(personalName);
      } else {
        if (businessData.personalInfo?.localite) {
          setPersonalLocationName(businessData.personalInfo.localite);
        } else {
          setPersonalLocationName('');
        }
      }
      
      // Récupérer le nom de la localisation de l'entreprise
      if (businessData.companyInfo?.divisionCode) {
        const companyName = await getDivisionName(businessData.companyInfo.divisionCode);
        setCompanyLocationName(companyName);
      }
    };
    
    fetchDivisionNames();
  }, [businessData.personalInfo?.divisionId, businessData.companyInfo?.divisionCode]);

  // Animation lors du changement d'étape
  useEffect(() => {
    if (contentRef.current && document.body) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [currentStep]);

  // Validation par étape (Étape 4 facultative)
  const validateStep = (): string | null => {
    // Étape 4 est facultative -> pas de validation bloquante
    if (currentStep === 4) return null;

    // Étape 0: Identification utilisateur
    if (currentStep === 0) {
      if (isForSelf === null) return 'Veuillez indiquer si vous créez cette entreprise pour vous-même.';
      return null;
    }

    // Étape 1: Informations Personnelles
    if (currentStep === 1) {
      const personal = businessData.personalInfo;
      if (!personal) return 'Les informations personnelles sont requises.';
      
      if (!personal.civility) return 'La civilité est requise.';
      if (!personal.firstName) return 'Le prénom est requis.';
      if (!personal.lastName) return 'Le nom est requis.';
      if (!personal.email) return "L'email est requis.";
      if (!personal.phone) return 'Le téléphone est requis.';
      if (!personal.birthDate) return 'La date de naissance est requise.';
      
      // Validation de l'âge minimum (18 ans)
      if (personal.birthDate) {
        const birthDate = new Date(personal.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) {
          return 'L\'utilisateur doit avoir au moins 18 ans.';
        }
      }
      
      // Validation de la localisation personnelle
      
      if (!personal.divisionId && !personal.localite) {
        return 'Votre localisation est requise. Veuillez sélectionner au moins une région ou saisir une localité.';
      }
      
      return null;
    }

    // Étape 2: Informations Société
    if (currentStep === 2) {
      const company = businessData.companyInfo;
      if (!company) return "Les informations de l'entreprise sont requises.";
      
      // Le nom d'entreprise n'est requis que pour les sociétés, pas pour les entreprises individuelles
      if (!company.nom && company.typeEntreprise === 'SOCIETE') return "Le nom de l'entreprise est requis.";
      // Le sigle est optionnel
      if (!company.typeEntreprise) return "Le type d'entreprise est requis.";
      if (!company.formeJuridique) return "La forme juridique est requise.";
      
      // Validation du domaine d'activité : requis seulement si le domaine non réglementé nécessite une réglementation
      if (!company.domaineActiviteNr) return "Le domaine d'activité non réglementé est requis.";
      
      const selectedNr = company.domaineActiviteNr;
      const requiresRegulatedDomain = selectedNr && DOMAINE_MAPPING[selectedNr] && DOMAINE_MAPPING[selectedNr].length > 0;
      
      if (requiresRegulatedDomain && !company.domaineActivite) {
        return `Le domaine d'activité réglementé est requis pour ${selectedNr}.`;
      }
      
      // Validation de la localisation avec prise en compte de la synchronisation
      const hasDifferentAddress = businessData.personalInfo?.hasDifferentAddress;
      const personalHasLocation = businessData.personalInfo?.divisionId || businessData.personalInfo?.localite;
      
      if (!company.divisionCode) {
        // Si la synchronisation est activée (même adresse) et que les données personnelles ont une localisation
        if (hasDifferentAddress === false && personalHasLocation) {
          // Pas d'erreur, la localisation sera synchronisée
        } else if (hasDifferentAddress === false && !personalHasLocation) {
          return "Vous avez choisi la même adresse pour l'entreprise, mais votre localisation personnelle n'est pas définie. Retournez à l'étape précédente pour saisir votre localisation.";
        } else {
          return "La localisation de l'entreprise est requise. Veuillez sélectionner au moins une région.";
        }
      }
      
      return null;
    }

    // Étape 3: Participants
    if (currentStep === 3) {
      const participants = businessData.participants;
      if (!participants || participants.length === 0) return 'Au moins un participant est requis.';
      
      const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      const gerants = participants.filter(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
      // Plus de rôle DIRIGEANT - tous sont maintenant GERANT, PROMOTEUR ou ASSOCIE
      
      if (isEntrepriseIndividuelle) {
        // Entreprise individuelle : 1 promoteur seulement
        if (gerants.length !== 1) return 'Une entreprise individuelle doit avoir exactement un promoteur.';
      } else {
        // Société : 1 gérant (peut être le seul participant pour une société unipersonnelle)
        if (gerants.length !== 1) return 'Exactement un gérant est requis pour une société.';
        // Le gérant peut être le seul participant - pas besoin d'associés obligatoires
      }
      
      const totalParts = participants.reduce((sum, p) => sum + (p.pourcentageParts || 0), 0);
      if (Math.abs(totalParts - 100) > 0.01) return 'La somme des parts doit être égale à 100%.';
      
      // Validation des documents requis pour chaque participant
      const documentErrors: string[] = [];
      participants.forEach((p, idx) => {
        const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
        
        // Validation des documents selon le type de personne
        if (p.civilite === 'PERSONNE_MORALE') {
          // Pour les personnes morales, vérifier le document RCCM
          if (!p.rccmFile) {
            documentErrors.push(`${label}: document RCCM obligatoire pour les personnes morales`);
          }
        } else {
          // Pour les personnes physiques, vérifier le document d'identité
          if (!p.typePiece || !p.documentFile) {
            documentErrors.push(`${label}: type de pièce et document sont obligatoires`);
          }
        }
        
        // Documents requis pour les gérants/promoteurs - uniquement pour les personnes physiques
        const requiresManagerDocuments = (p.role === 'GERANT' || p.role === 'PROMOTEUR') && p.civilite !== 'PERSONNE_MORALE';
        
        if (requiresManagerDocuments && businessData.personalInfo?.hasCriminalRecord && !p.casierJudiciaireFile) {
          documentErrors.push(`${label}: casier judiciaire requis`);
        }
        if (requiresManagerDocuments && !businessData.personalInfo?.hasCriminalRecord && !p.declarationHonneurFile) {
          documentErrors.push(`${label}: déclaration d'honneur requise (sans casier judiciaire)`);
        }
        if (requiresManagerDocuments && businessData.personalInfo?.isMarried && !p.acteMariageFile) {
          documentErrors.push(`${label}: acte de mariage requis (si marié)`);
        }
        if (requiresManagerDocuments && !p.extraitNaissanceFile) {
          documentErrors.push(`${label}: extrait de naissance requis`);
        }
        // Certificat de résidence requis seulement si le gérant n'est pas de nationalité malienne
        if (requiresManagerDocuments && !p.certificatResidenceFile) {
          const gerantNationality = p.nationnalite || businessData.personalInfo?.nationality || 'MALIENNE';
          if (gerantNationality.toUpperCase() !== 'MALIENNE') {
            documentErrors.push(`${label}: certificat de résidence requis (nationalité non malienne)`);
          }
        }
      });
      
      if (documentErrors.length > 0) {
        return `Erreurs à corriger\n${documentErrors.join('\n')}`;
      }
      
      return null;
    }

    // Étape 5: pas de "Suivant" (soumission)
    return null;
  };

  const [stepError, setStepError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  // Function to check if we can proceed to next step
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return businessData.personalInfo?.firstName && businessData.personalInfo?.lastName;
      case 2:
        return businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' || businessData.companyInfo?.nom;
      case 3:
        return businessData.participants && businessData.participants.length > 0;
      case 4:
        return true; // Documents are optional
      case 5:
        return null; // Final step - submit instead
      default:
        return false;
    }
  };

  // Mettre à jour un gerant existant
  const updateDirigeantWorkflow = async (personId: string, gerantData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Reconstruire le numéro complet avec l'indicatif pour la sauvegarde
      // Utiliser Mali par défaut si pas de pays spécifié
      const countryCode = '+223'; // Mali par défaut
      const fullPhoneForUpdateDirigeant = gerantData.phone ? 
        `${countryCode}${gerantData.phone.replace(/\s/g, '')}` : '';

      const personUpdateRequest = {
        nom: gerantData.lastName,
        prenom: gerantData.firstName,
        telephone1: fullPhoneForUpdateDirigeant,
        email: gerantData.email,
        dateNaissance: gerantData.birthDate,
        lieuNaissance: gerantData.birthPlace,
        nationnalite: gerantData.nationality,
        sexe: gerantData.gender,
        situationMatrimoniale: gerantData.maritalStatus,
        civilite: gerantData.civility,
        divisionId: gerantData.divisionId,
        localite: gerantData.localite
      };

      const response = await fetch(`http://localhost:8080/api/v1/persons/${personId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(personUpdateRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  // Étape 5: Soumission finale - POST /api/v1/entreprises
  const submitEntrepriseWorkflow = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Assembler tous les participants avec leurs IDs
      const allParticipants = businessData.participants?.map(p => {
        // Valider et nettoyer le rôle
        const validRoles = ['GERANT', 'PROMOTEUR', 'ASSOCIE', 'ADMINISTRATEUR'];
        const cleanRole = p.role?.toString().trim().toUpperCase();
        
        if (!validRoles.includes(cleanRole)) {
          throw new Error(`Rôle invalide pour participant ${p.nom} ${p.prenom}: ${p.role}`);
        }
        
        return {
          personId: p.personId || '',
          role: cleanRole,
          pourcentageParts: p.pourcentageParts || 0,
          dateDebut: p.dateDebut || new Date().toISOString().split('T')[0],
          dateFin: p.dateFin || '9999-12-31'
        };
      }) || [];

      // Ajouter le fondateur s'il n'est pas déjà dans les participants
      if (businessData.founderId) {
        const founderExists = allParticipants.some(p => p.personId === businessData.founderId);
        if (!founderExists) {
          allParticipants.push({
            personId: businessData.founderId,
            role: 'DIRIGEANT',
            pourcentageParts: 100 - allParticipants.reduce((sum, p) => sum + p.pourcentageParts, 0),
            dateDebut: new Date().toISOString().split('T')[0],
            dateFin: '9999-12-31'
          });
        }
      }

      const entrepriseRequest = {
        nom: businessData.companyInfo?.nom || (businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? `${businessData.personalInfo?.firstName || ''} ${businessData.personalInfo?.lastName || ''}`.trim() 
          : ''),
        sigle: businessData.companyInfo?.sigle || '',
        capitale: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
          ? '0' 
          : (businessData.companyInfo?.capitale || ''),
        adresseDifferentIdentite: businessData.personalInfo?.hasDifferentAddress || false,
        extraitJudiciaire: businessData.personalInfo?.hasCriminalRecord || false,
        autorisationGerant: businessData.personalInfo?.allowsMultipleManagers || false,
        autorisationExercice: false,
        importExport: businessData.personalInfo?.willImportExport || false,
        statutSociete: true,
        typeEntreprise: businessData.companyInfo?.typeEntreprise || 'SOCIETE',
        statutCreation: 'EN_COURS',
        etapeValidation: 'ACCUEIL',
        formeJuridique: businessData.companyInfo?.formeJuridique || 'SARL',
        domaineActivite: businessData.companyInfo?.domaineActivite,
        domaineActiviteNr: (() => {
          const value = businessData.companyInfo?.domaineActiviteNr;
          
          // SOLUTION ROBUSTE: Limiter à 500 caractères maximum (nouvelle limite DB)
          if (!value) {
            return null;
          }
          
          const stringValue = String(value);
          
          if (stringValue.length > 500) {
            const truncated = stringValue.substring(0, 500);
            return truncated;
          }
          
          return stringValue;
        })(),
        activiteSecondaire: businessData.companyInfo?.activiteSecondaire || '',
        divisionCode: businessData.companyInfo?.divisionCode || '',
        representativeAdresseLibre: businessData.personalInfo?.adresseLibre || null,
        participants: allParticipants
      };


      const response = await fetch('http://localhost:8080/api/v1/entreprises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entrepriseRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      
      // Rediriger vers la page de suivi
      window.location.href = '/tracking';
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  const nextStep = async () => {
    // ÉTAPE 2: Forcer la synchronisation avant validation si nécessaire
    if (currentStep === 2) {
      const hasDifferentAddress = businessData.personalInfo?.hasDifferentAddress;
      const personalHasLocation = businessData.personalInfo?.divisionId || businessData.personalInfo?.localite;
      const companyMissingLocation = !businessData.companyInfo?.divisionCode;
      
      // Si synchronisation activée et divisionCode manquant, forcer la mise à jour
      if (hasDifferentAddress === false && personalHasLocation && companyMissingLocation) {
        
        try {
          if (businessData.personalInfo?.divisionId) {
            const division = await divisionService.getById(businessData.personalInfo.divisionId);
            if (division && division.code) {
              // Mettre à jour le divisionCode immédiatement
              updateBusinessData('companyInfo', {
                ...businessData.companyInfo,
                divisionCode: division.code
              });
              
              // Attendre un peu pour que l'état soit mis à jour
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (error) {
          setStepError("Erreur lors de la synchronisation de la localisation. Veuillez réessayer.");
          setShowValidation(true);
          return;
        }
      }
    }
    
    // Appliquer la validation pour toutes les étapes sauf la 4
    if (currentStep !== 4) {
      const err = validateStep();
      if (err) {
        setStepError(err);
        setShowValidation(true);
        // Faire défiler vers la zone de navigation/erreur
        try {
          navigationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {}
        return;
      }
    }
    
    setStepError(null);
    setShowValidation(false);
    
    // WORKFLOW ÉTAPE PAR ÉTAPE
    try {
      // ÉTAPE 0: Identification - Pas d'action, juste navigation
      if (currentStep === 0) {
        // Pas d'action nécessaire, juste passer à l'étape suivante
      }
      
      // ÉTAPE 1: Informations personnelles - PUT/POST selon choix utilisateur
      if (currentStep === 1) {
        if (businessData.personalInfo.isForSelf === false && !showForm) {
          setShowForm(true);
          return;
        }
        
        // Sauvegarder les informations personnelles (PUT si isForSelf, POST sinon)
        const savedPerson = await savePersonalInfoWorkflow(businessData.personalInfo);
        if (!savedPerson) return; // Erreur, on s'arrête
        
        // Stocker founderId pour les étapes suivantes
        updateBusinessData('founderId', savedPerson.id || savedPerson.data?.id);
      }
      
      // ÉTAPE 2: Informations entreprise - Validation uniquement
      if (currentStep === 2) {
      }
      
      // ÉTAPE 3: Gestion des associés OU gerant (entreprise individuelle)
      if (currentStep === 3) {
        const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
        if (!isEntrepriseIndividuelle) {
          await processAssociatesWorkflow();
        } else {
          // Pour entreprise individuelle, créer le gerant
          await processDirigeantWorkflow();
        }
      }
      
      // ÉTAPE 4: Gestion du gérant - Création avec EntrepriseRole.GERANT (sauf pour entreprise individuelle)
      if (currentStep === 4) {
        const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
        const hasGerant = (businessData.participants || []).some(p => p.role === 'GERANT' || p.role === 'PROMOTEUR');
        const participants = businessData.participants || [];
        
        
        if (!isEntrepriseIndividuelle && hasGerant) {
          await processManagerWorkflow();
        } else if (isEntrepriseIndividuelle) {
        } else {
        }
      }
      
      // ÉTAPE 5: Soumission finale - POST /api/v1/entreprises
      if (currentStep === 5) {
        await submitEntrepriseWorkflow();
        return; // Pas de passage à l'étape suivante
      }
      
    } catch (error) {
      setStepError(`Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setShowValidation(true);
      return;
    }
    
    // Passer à l'étape suivante
    if (currentStep < totalSteps) {
      // Sauvegarder les sélections de localisation avant de changer d'étape
      saveCurrentLocationSelections();
      
      // Pour les entreprises individuelles, sauter l'étape 4 (Documents) et aller directement à l'étape 5
      const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      if (currentStep === 3 && isEntrepriseIndividuelle) {
        setCurrentStep(5); // Aller directement à l'étape 5
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 5));
      }
    }
  };

  // Fonction pour sauvegarder les sélections de localisation actuelles
  const saveCurrentLocationSelections = () => {
    if (currentStep === 3) { // Étape des informations de l'entreprise
      console.log('💾 [NAVIGATION DEBUG] Sauvegarde des sélections de localisation avant navigation');
      
      // Les variables de sélection sont dans le scope du composant CompanyInfoStep
      // Pour l'instant, on sauvegarde seulement ce qui est déjà dans businessData.companyInfo
      const currentCompanyInfo = businessData.companyInfo || {};
      
      console.log('💾 [NAVIGATION DEBUG] Données actuelles de companyInfo:', {
        regionId: currentCompanyInfo.regionId,
        cercleId: currentCompanyInfo.cercleId,
        communeId: currentCompanyInfo.communeId,
        quartierId: currentCompanyInfo.quartierId,
        divisionCode: currentCompanyInfo.divisionCode
      });
      
      // Les données sont déjà sauvegardées par les handlers onChange des sélecteurs
      // Cette fonction sert principalement pour le logging et la validation
    }
  };

  const prevStep = () => {
    // Sauvegarder les sélections de localisation avant de changer d'étape
    saveCurrentLocationSelections();
    
    // Pour les entreprises individuelles, si on est à l'étape 5, revenir à l'étape 3 (sauter l'étape 4)
    const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    if (currentStep === 5 && isEntrepriseIndividuelle) {
      setCurrentStep(3); // Revenir à l'étape 3
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  // Navigation directe vers une étape spécifique
  const goToStep = (targetStep: number) => {
    // Sauvegarder les sélections de localisation avant de changer d'étape
    saveCurrentLocationSelections();
    
    // Pour les entreprises individuelles, ne pas permettre l'accès à l'étape 4 (Documents)
    const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    if (targetStep === 4 && isEntrepriseIndividuelle) {
      console.log('Navigation vers étape Documents bloquée pour entreprise individuelle');
      return;
    }
    
    // Naviguer vers l'étape cible
    setCurrentStep(targetStep);
    console.log(`Navigation directe vers l'étape ${targetStep}`);
  };

  const updateBusinessData = (field: keyof BusinessCreationData, value: any) => {
    setBusinessData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      return newData;
    });
  };

  // Fonction pour gérer la réponse "Oui, c'est pour moi" / "Non, c'est pour quelqu'un d'autre"
  const handleResponse = async (response: boolean) => {
    console.log('🔍 [DEBUG] handleResponse appelé avec:', response);
    console.log('🔍 [DEBUG] Données avant handleResponse:');
    console.log('  - personalInfo:', JSON.stringify(businessData.personalInfo, null, 2));
    console.log('  - companyInfo:', JSON.stringify(businessData.companyInfo, null, 2));
    
    setIsForSelf(response);
    
    // Sauvegarder isForSelf dans businessData.personalInfo pour les étapes suivantes
    updateBusinessData('personalInfo', {
      ...businessData.personalInfo,
      isForSelf: response
    });
    
    // Si l'utilisateur choisit "Oui, c'est pour moi", on récupère ses informations
    if (response) {
      console.log('🔍 [DEBUG] Appel fetchCurrentUser...');
      await fetchCurrentUser();
      console.log('🔍 [DEBUG] Données après fetchCurrentUser:');
      console.log('  - personalInfo:', JSON.stringify(businessData.personalInfo, null, 2));
      console.log('  - companyInfo:', JSON.stringify(businessData.companyInfo, null, 2));
    }
    
    setShowForm(true);
    // Passer automatiquement à l'étape suivante
    setCurrentStep(1);
  };

  // Fonction pour récupérer les informations de l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      // Réinitialiser la variable globale
      (window as any).userHasInitialLocationData = false;
      
      // Récupérer l'utilisateur depuis le localStorage
      const currentUser = authAPI.getCurrentUser();
      
      if (currentUser && (currentUser.personne_id || currentUser.personneId)) {
        const personneId = currentUser.personne_id || currentUser.personneId;
        
        // Utiliser l'endpoint /api/v1/persons/personne_id pour récupérer les informations
        const personResponse = await authAPI.getPersonById(personneId);
        
        if (personResponse && personResponse.success) {
          const personData = personResponse.data;
          
          // Détecter le pays à partir du numéro de téléphone
          const detectedCountry = personData.telephone1 ? 
            countries.find(c => personData.telephone1.startsWith(c.code)) || countries[0] : countries[0];
          
          // Extraire le numéro local
          const localPhone = personData.telephone1 ? 
            personData.telephone1.replace(detectedCountry.code, '').replace(/\s/g, '') : '';
          
          // Formater le numéro selon le pays
          let formattedPhone = '';
          if (localPhone) {
            if (detectedCountry.code === '+223' && localPhone.length === 8) {
              formattedPhone = `${localPhone.substring(0, 2)} ${localPhone.substring(2, 4)} ${localPhone.substring(4, 6)} ${localPhone.substring(6, 8)}`;
            } else {
              formattedPhone = localPhone;
            }
          }
          
          // Mettre à jour les données personnelles avec les informations récupérées
          updateBusinessData('personalInfo', {
            ...businessData.personalInfo,
            civility: personData.civilite || '',
            firstName: personData.prenom || '',
            lastName: personData.nom || '',
            email: personData.email || '',
            phone: formattedPhone,
            phone2: personData.telephone2 || '',
            birthDate: personData.dateNaissance ? personData.dateNaissance.split('T')[0] : '',
            birthPlace: personData.lieuNaissance || '',
            nationality: personData.nationnalite || 'MALIENNE',
            sexe: personData.sexe || '',
            situationMatrimoniale: personData.situationMatrimoniale || 'CELIBATAIRE',
            divisionId: personData.division_id || '',
            localite: personData.localite || '',
            porte: personData.porte || '',
            adresseLibre: personData.adresseLibre || '',
            isForSelf: true
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
    }
  };

  // WORKFLOW FUNCTIONS - Implémentation des étapes du processus

  // Étape 1: Sauvegarder informations personnelles (PUT/POST selon choix)
  const savePersonalInfoWorkflow = async (personalInfo: any) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (!token) throw new Error('Aucun token trouvé');

      // Formater le numéro de téléphone au format E.164 (+223 + numéro local)
      let formattedPhone = personalInfo.phone || '';
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        // Nettoyer le numéro (enlever espaces, tirets, etc.)
        formattedPhone = formattedPhone.replace(/[\s\-\.]/g, '');
        // Ajouter l'indicatif +223 si pas déjà présent
        formattedPhone = '+223' + formattedPhone;
      }

      // Validation et logs de débogage pour la date de naissance

      // Diagnostic complet de la date
      if (personalInfo.birthDate) {
        const dateStr = personalInfo.birthDate.toString();
      }

      // Calculer l'âge pour vérification
      if (personalInfo.birthDate) {
        const birthDate = new Date(personalInfo.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
      }

      // Préparer les données selon PersonCreateRequest
      const personRequest = {
        nom: personalInfo.lastName,
        prenom: personalInfo.firstName,
        telephone1: formattedPhone,
        telephone2: personalInfo.phone2 ? (personalInfo.phone2.startsWith('+') ? personalInfo.phone2 : '+223' + personalInfo.phone2.replace(/\s/g, '')) : '',
        email: personalInfo.email,
        dateNaissance: ensureAdultBirthDate(personalInfo.birthDate),
        lieuNaissance: personalInfo.birthPlace,
        nationnalite: personalInfo.nationality || 'MALIENNE',
        sexe: personalInfo.sexe,
        situationMatrimoniale: personalInfo.situationMatrimoniale || 'CELIBATAIRE', // Valeur par défaut si vide
        civilite: mapCivilityToBackend(personalInfo.civility),
        // Récupérer division_id et localite depuis les données personnelles - utiliser null au lieu de undefined
        division_id: personalInfo.divisionId || personalInfo.division_id || null,
        divisionCode: personalInfo.divisionCode || null,
        localite: personalInfo.localite || personalInfo.city || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(personalInfo.civility);
      const finalSexe = personalInfo.sexe || deducedSexe;
      

      // Mettre à jour le sexe dans la requête
      personRequest.sexe = finalSexe;


      let response;
      
      if (personalInfo.isForSelf && currentUser.personne_id) {
        // PUT - Mise à jour de la personne existante
        response = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      } else {
        // POST - Création d'une nouvelle personne
        response = await fetch('/api/v1/persons', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(personRequest)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }
      
      const result = await response.json();
      
      // Si c'était un PUT (isForSelf), s'assurer de retourner l'ID correct
      if (personalInfo.isForSelf && currentUser.personne_id) {
        return { ...result, id: currentUser.personne_id };
      }
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Étape 3: Traiter les associés avec EntrepriseRole.ASSOCIE
  const processAssociatesWorkflow = async () => {
    try {
      const associates = businessData.participants?.filter(p => p.role === 'ASSOCIE') || [];
      const createdAssociates = [];
      

      for (const associate of associates) {
        // Si l'associé n'a pas encore d'ID, le créer
        if (!associate.personId) {
          const associateData = {
            lastName: associate.nom || '',
            firstName: associate.prenom || '',
            phone: associate.telephone || '',
            email: associate.email || '',
            birthDate: associate.dateNaissance || '',
            birthPlace: associate.lieuNaissance || '',
            nationality: associate.nationnalite || 'MALIENNE',
            sexe: getConsistentSexe(associate.sexe, associate.civilite || 'MONSIEUR'),
            situationMatrimoniale: associate.situationMatrimoniale || 'CELIBATAIRE',
            civility: associate.civilite || 'MONSIEUR', // Utiliser la civilité originale, pas mappée
            // Champs spécifiques aux personnes morales
            denominationEntreprise: associate.denominationEntreprise,
            paysEmissionRccm: associate.paysEmissionRccm,
            // Ajouter les données de localisation
            divisionId: associate.divisionId || associate.division_id,
            divisionCode: associate.divisionCode,
            localite: associate.localite
          };

          const createdAssociate = await createAssociateWorkflow(associateData);
          if (createdAssociate) {
            associate.personId = createdAssociate.id || createdAssociate.data?.id;
            createdAssociates.push(createdAssociate);
          }
        } else {
          // L'associé a déjà un personId, vérifier s'il a besoin d'une mise à jour
          
          const currentUser = authAPI.getCurrentUser();
          const isCurrentUser = currentUser && (currentUser.personne_id === associate.personId || currentUser.personneId === associate.personId);
          
          if (isCurrentUser) {
            
            // Vérifier si l'utilisateur a besoin d'une mise à jour (données manquantes)
            const needsUpdate = !currentUser.dateNaissance || 
                               !currentUser.lieuNaissance || 
                               !currentUser.nationnalite ||
                               !currentUser.sexe ||
                               !currentUser.situationMatrimoniale;
            
            if (needsUpdate) {
              const updateRequest = {
                nom: associate.nom || currentUser.nom,
                prenom: associate.prenom || currentUser.prenom,
                telephone1: associate.telephone || currentUser.telephone1,
                email: associate.email || currentUser.email,
                dateNaissance: ensureAdultBirthDate(associate.dateNaissance) || ensureAdultBirthDate(currentUser.dateNaissance),
                lieuNaissance: associate.lieuNaissance || currentUser.lieuNaissance,
                nationnalite: associate.nationnalite || currentUser.nationnalite || 'MALIENNE',
                sexe: associate.sexe || currentUser.sexe,
                situationMatrimoniale: associate.situationMatrimoniale || currentUser.situationMatrimoniale || 'CELIBATAIRE',
                civilite: mapCivilityToBackend(associate.civilite || 'MONSIEUR') || currentUser.civilite,
                division_id: associate.divisionId || associate.division_id || currentUser.division_id,
                divisionCode: associate.divisionCode || currentUser.divisionCode,
                localite: associate.localite || currentUser.localite,
                porte: (associate as any).porte || (currentUser as any).porte
              };
              
              
              const token = localStorage.getItem('token');
              const updateResponse = await fetch(`/api/v1/persons/${associate.personId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateRequest)
              });
              
              if (updateResponse.ok) {
                const updatedUser = await updateResponse.json();
                createdAssociates.push({ id: associate.personId, data: updatedUser });
              } else {
                throw new Error('Impossible de mettre à jour les données de l\'associé');
              }
            } else {
            }
          } else {
          }
        }
      }

      return createdAssociates;
    } catch (err) {
      throw err;
    }
  };

  // Créer un associé avec EntrepriseRole.ASSOCIE
  const createAssociateWorkflow = async (associateData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Détecter si c'est une personne morale
      const isPersonneMorale = associateData.civility === 'PERSONNE_MORALE';

      // Validation préventive pour éviter "Name is null"
      let finalLastName = associateData.lastName;
      let finalFirstName = associateData.firstName;
      
      if (!associateData.lastName || associateData.lastName.trim() === '') {
        finalLastName = isPersonneMorale ? associateData.denominationEntreprise || 'Entreprise' : 'Nom';
      }
      if (!associateData.firstName || associateData.firstName.trim() === '') {
        finalFirstName = isPersonneMorale ? 'Représentant' : 'Prénom';
      }

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(associateData.civility);
      const finalSexe = associateData.sexe || deducedSexe;
      

      // Gestion du téléphone pour les personnes morales
      let fullPhoneForCreate = '';
      if (isPersonneMorale) {
        // Pour les personnes morales, générer un numéro fictif unique
        const timestamp = Date.now().toString().slice(-8); // 8 derniers chiffres du timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 chiffres aléatoires
        fullPhoneForCreate = `+223${timestamp.slice(0, 6)}${random}`;
      } else {
        // Pour les personnes physiques, reconstruire le numéro
        const countryCode = '+223'; // Mali par défaut
        if (associateData.phone) {
          // Si le numéro commence déjà par +, l'utiliser tel quel, sinon ajouter le préfixe
          fullPhoneForCreate = associateData.phone.startsWith('+') ? 
            associateData.phone.replace(/\s/g, '') : 
            `${countryCode}${associateData.phone.replace(/\s/g, '')}`;
        }
      }

      const personRequest = isPersonneMorale ? {
        // Champs pour personne morale associé
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        civilite: 'PERSONNE_MORALE',
        denominationEntreprise: associateData.denominationEntreprise || 'Entreprise Associée',
        paysEmissionRccm: associateData.paysEmissionRccm || 'MALI',
        // Champs techniques minimaux pour satisfaire les validations DTO
        telephone1: fullPhoneForCreate,
        dateNaissance: '1900-01-01',
        lieuNaissance: 'N/A',
        nationnalite: 'MALIENNE', // Valeur par défaut pour satisfaire @NotNull
        sexe: 'MASCULIN', // Valeur par défaut pour satisfaire @NotNull (sera ignorée par le backend)
        situationMatrimoniale: 'CELIBATAIRE', // Valeur par défaut pour satisfaire @NotNull
        // Champs optionnels
        email: associateData.email || undefined,
        // Localisation - Les personnes morales ont leur propre localisation
        division_id: associateData.divisionId || associateData.division_id || null,
        divisionCode: associateData.divisionCode || null,
        localite: associateData.localite || associateData.city || null,
        porte: associateData.porte || null,
        role: 'USER',
        entrepriseRole: 'ASSOCIE'
      } : {
        // Champs pour personne physique associé
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        telephone1: fullPhoneForCreate,
        email: associateData.email,
        dateNaissance: ensureAdultBirthDate(associateData.birthDate),
        lieuNaissance: associateData.birthPlace,
        nationnalite: associateData.nationality || 'MALIENNE',
        sexe: finalSexe,
        situationMatrimoniale: associateData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(associateData.civility),
        // Localisation - Chaque participant a sa propre localisation
        division_id: associateData.divisionId || associateData.division_id || null,
        divisionCode: associateData.divisionCode || null,
        localite: associateData.localite || associateData.city || null,
        porte: associateData.porte || null,
        role: 'USER',
        entrepriseRole: 'ASSOCIE'
      };

      // Logs de debugging pour la localisation de l'associé

      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'associé');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Étape 4: Traiter le gérant avec EntrepriseRole.GERANT
  const processManagerWorkflow = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const managers = businessData.participants?.filter(p => p.role === 'GERANT' || p.role === 'PROMOTEUR') || [];
      
      if (managers.length === 0) {
        throw new Error('Aucun gérant défini');
      }
      
      if (managers.length > 1) {
        throw new Error('Un seul gérant autorisé par entreprise');
      }

      const manager = managers[0];
      let createdManager = null;

      const managerData = {
        lastName: manager.nom || '',
        firstName: manager.prenom || '',
        phone: manager.telephone || '',
        email: manager.email || '',
        birthDate: manager.dateNaissance || '',
        birthPlace: manager.lieuNaissance || '',
        nationality: manager.nationnalite || 'MALIENNE',
        sexe: getConsistentSexe(manager.sexe, manager.civilite || 'MONSIEUR'),
        situationMatrimoniale: manager.situationMatrimoniale || 'CELIBATAIRE',
        civility: manager.civilite || 'MONSIEUR', // Utiliser la civilité originale, pas mappée
        // Champs spécifiques aux personnes morales
        denominationEntreprise: manager.denominationEntreprise,
        paysEmissionRccm: manager.paysEmissionRccm,
        // Ajouter les données de localisation
        divisionId: manager.divisionId || manager.division_id,
        divisionCode: manager.divisionCode,
        localite: manager.localite
      };

      // Si le gérant n'a pas encore d'ID, vérifier si c'est l'utilisateur connecté
      if (!manager.personId) {
        // Logs de débogage pour identifier le problème
        
        // Vérifier si l'utilisateur connecté EST le gérant (même email)
        const isCurrentUserTheManager = currentUser.email === manager.email;
          
        if (isCurrentUserTheManager && currentUser.personne_id) {
          
          // Vérifier si l'utilisateur est déjà gérant d'une autre entreprise
          const canBeManagerResponse = await fetch(`/api/v1/persons/${currentUser.personne_id}/can-be-manager`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (canBeManagerResponse.ok) {
            const canBeManagerData = await canBeManagerResponse.json();
            
            if (canBeManagerData.canBeManager) {
              manager.personId = currentUser.personne_id;
              
              // Vérifier si l'utilisateur a besoin d'une mise à jour (données manquantes)
              const needsUpdate = !currentUser.dateNaissance || 
                                 !currentUser.lieuNaissance || 
                                 !currentUser.nationnalite ||
                                 !currentUser.sexe ||
                                 !currentUser.situationMatrimoniale;
              
              if (needsUpdate) {
                // Mettre à jour avec les données du formulaire
                const updateRequest = {
                  nom: managerData.lastName || currentUser.nom,
                  prenom: managerData.firstName || currentUser.prenom,
                  telephone1: managerData.phone || currentUser.telephone1,
                  email: managerData.email || currentUser.email,
                  dateNaissance: ensureAdultBirthDate(managerData.birthDate) || ensureAdultBirthDate(currentUser.dateNaissance),
                  lieuNaissance: managerData.birthPlace || currentUser.lieuNaissance,
                  nationnalite: managerData.nationality || currentUser.nationnalite || 'MALIENNE',
                  sexe: managerData.sexe || currentUser.sexe,
                  situationMatrimoniale: managerData.situationMatrimoniale || currentUser.situationMatrimoniale || 'CELIBATAIRE',
                  civilite: mapCivilityToBackend(managerData.civility || 'MONSIEUR') || currentUser.civilite,
                  division_id: managerData.divisionId || currentUser.division_id,
                  divisionCode: managerData.divisionCode || currentUser.divisionCode,
                  localite: managerData.localite || currentUser.localite,
                  porte: (managerData as any).porte || (currentUser as any).porte
                };
                
                
                const token = localStorage.getItem('token');
                const updateResponse = await fetch(`/api/v1/persons/${currentUser.personne_id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(updateRequest)
                });
                
                if (updateResponse.ok) {
                  const updatedUser = await updateResponse.json();
                  createdManager = { id: currentUser.personne_id, data: updatedUser };
                } else {
                  throw new Error('Impossible de mettre à jour les données utilisateur');
                }
              } else {
                createdManager = { id: currentUser.personne_id };
              }
            } else {
              throw new Error(`Vous êtes déjà gérant d'une autre entreprise. Un utilisateur ne peut être gérant que d'une seule entreprise. Vous pouvez être gérant ou associé d'autres entreprises.`);
            }
          } else {
            createdManager = await createManagerWorkflow(managerData);
            if (createdManager) {
              manager.personId = createdManager.id || createdManager.data?.id;
            }
          }
        } else {
          createdManager = await createManagerWorkflow(managerData);
          if (createdManager) {
            manager.personId = createdManager.id || createdManager.data?.id;
          }
        }
      } else {
        createdManager = await updateManagerWorkflow(manager.personId, managerData);
      }

      return createdManager;
    } catch (err) {
      throw err;
    }
  };

  // Mettre à jour un gérant existant
  const updateManagerWorkflow = async (personId: string, managerData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Reconstruire le numéro complet avec l'indicatif pour la sauvegarde (format E.164)
      let fullPhoneForUpdate = '';
      if (managerData.phone) {
        const cleanPhone = managerData.phone.replace(/[\s\-\.]/g, '');
        if (cleanPhone.startsWith('+')) {
          fullPhoneForUpdate = cleanPhone; // Déjà au format E.164
        } else {
          fullPhoneForUpdate = `+223${cleanPhone}`; // Ajouter l'indicatif Mali
        }
      }

      const personUpdateRequest = {
        nom: managerData.lastName,
        prenom: managerData.firstName,
        telephone1: fullPhoneForUpdate, // Sauvegarder le numéro complet avec indicatif
        email: managerData.email,
        dateNaissance: managerData.birthDate,
        lieuNaissance: managerData.birthPlace,
        nationnalite: managerData.nationality || 'MALIENNE',
        sexe: managerData.sexe,
        situationMatrimoniale: managerData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(managerData.civility),
        // Récupérer division_id et localite - utiliser null au lieu de undefined
        division_id: managerData.divisionId || managerData.division_id || null,
        divisionCode: managerData.divisionCode || null,
        localite: managerData.localite || managerData.city || null,
        porte: managerData.porte || null
      };

      const response = await fetch(`/api/v1/persons/${personId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personUpdateRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Erreur lors de la mise à jour du gérant';
        
        // Si la personne n'existe pas (base H2 vide), créer une nouvelle personne
        if (errorMessage.includes('Personne introuvable') || errorMessage.includes('introuvable')) {
          return await createManagerWorkflow(managerData);
        }
        
        // Gestion spécifique de l'erreur de numéro de téléphone déjà utilisé
        if (errorMessage.includes('numéro de téléphone est déjà utilisé') || 
            errorMessage.includes('telephone') && errorMessage.includes('déjà')) {
          
          // Pour les workflows de gérant, proposer de garder le numéro actuel ou demander un changement
          if (window.confirm(`Le numéro ${fullPhoneForUpdate} est déjà utilisé par un autre utilisateur.\n\nVoulez-vous continuer sans changer le numéro de téléphone du gérant ?`)) {
            // Réessayer sans changer le numéro de téléphone
            
            // Créer une nouvelle requête sans le champ téléphone
            const { telephone1, ...personUpdateRequestWithoutPhone } = personUpdateRequest;
            
            const retryResponse = await fetch(`/api/v1/persons/${personId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(personUpdateRequestWithoutPhone)
            });
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json();
              throw new Error(retryErrorData.message || 'Erreur lors de la mise à jour sans le téléphone');
            }
            
            const retryResult = await retryResponse.json();
            return retryResult;
          } else {
            throw new Error(`Le numéro ${fullPhoneForUpdate} est déjà utilisé. Veuillez modifier le numéro du gérant ou annuler l'opération.`);
          }
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Vérifier si l'email correspond à l'utilisateur connecté
  const getCurrentUserIfEmailMatches = (email: string) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.email && email && 
          currentUser.email.toLowerCase() === email.toLowerCase()) {
        return currentUser;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Créer un gérant avec EntrepriseRole.GERANT
  const createManagerWorkflow = async (managerData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      // Vérifier si l'email correspond à l'utilisateur connecté
      const currentUser = getCurrentUserIfEmailMatches(managerData.email);
      
      if (currentUser && currentUser.id) {
        return currentUser;
      }


      // Détecter si c'est une personne morale
      const isPersonneMorale = managerData.civility === 'PERSONNE_MORALE';

      // Validation préventive avec fallback pour éviter "Name is null"
      let finalLastName = managerData.lastName;
      let finalFirstName = managerData.firstName;
      
      if (!managerData.lastName || managerData.lastName.trim() === '') {
        finalLastName = isPersonneMorale ? managerData.denominationEntreprise || 'Entreprise' : 'Nom';
      }
      if (!managerData.firstName || managerData.firstName.trim() === '') {
        finalFirstName = isPersonneMorale ? 'Représentant' : 'Prénom';
      }
      

      // Déduire le sexe à partir de la civilité si nécessaire
      const deducedSexe = deduceSexeFromCivilite(managerData.civility);
      const finalSexe = managerData.sexe || deducedSexe;
      

      // Gestion du téléphone pour les personnes morales
      let fullPhoneForCreate = '';
      if (isPersonneMorale) {
        // Pour les personnes morales, générer un numéro fictif unique
        const timestamp = Date.now().toString().slice(-8); // 8 derniers chiffres du timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 chiffres aléatoires
        fullPhoneForCreate = `+223${timestamp.slice(0, 6)}${random}`;
      } else {
        // Pour les personnes physiques, reconstruire le numéro
        const countryCode = '+223'; // Mali par défaut
        if (managerData.phone) {
          // Si le numéro commence déjà par +, l'utiliser tel quel, sinon ajouter le préfixe
          fullPhoneForCreate = managerData.phone.startsWith('+') ? 
            managerData.phone.replace(/\s/g, '') : 
            `${countryCode}${managerData.phone.replace(/\s/g, '')}`;
        }
        
      }

      const personRequest = isPersonneMorale ? {
        // Champs pour personne morale (optimisés)
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        civilite: 'PERSONNE_MORALE',
        denominationEntreprise: managerData.denominationEntreprise || 'Entreprise Gérant',
        paysEmissionRccm: managerData.paysEmissionRccm || 'MALI',
        // Champs techniques minimaux pour satisfaire les validations DTO
        telephone1: fullPhoneForCreate,
        dateNaissance: '1900-01-01',
        lieuNaissance: 'N/A',
        nationnalite: 'MALIENNE', // Valeur par défaut pour satisfaire @NotNull
        sexe: 'MASCULIN', // Valeur par défaut pour satisfaire @NotNull (sera ignorée par le backend)
        situationMatrimoniale: 'CELIBATAIRE', // Valeur par défaut pour satisfaire @NotNull
        // Champs optionnels
        email: managerData.email || undefined,
        // Localisation - Les personnes morales ont leur propre localisation
        division_id: managerData.divisionId || managerData.division_id || null,
        divisionCode: managerData.divisionCode || null,
        localite: managerData.localite || managerData.city || null,
        porte: managerData.porte || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      } : {
        // Champs pour personne physique (complets)
        nom: finalLastName.trim(),
        prenom: finalFirstName.trim(),
        telephone1: fullPhoneForCreate,
        email: managerData.email,
        dateNaissance: ensureAdultBirthDate(managerData.birthDate),
        lieuNaissance: managerData.birthPlace,
        nationnalite: managerData.nationality || 'MALIENNE',
        sexe: finalSexe,
        situationMatrimoniale: managerData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(managerData.civility),
        // Localisation - Chaque participant a sa propre localisation
        division_id: managerData.divisionId || managerData.division_id || null,
        divisionCode: managerData.divisionCode || null,
        localite: managerData.localite || managerData.city || null,
        porte: managerData.porte || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };

      // Logs de debugging pour la localisation du gérant
      
      // Vérification finale avant envoi
      if (!personRequest.nom || personRequest.nom.trim() === '') {
        throw new Error('Erreur critique: nom vide avant envoi au backend');
      }
      if (!personRequest.prenom || personRequest.prenom.trim() === '') {
        throw new Error('Erreur critique: prénom vide avant envoi au backend');
      }


      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Erreur lors de la création du gérant';
        
        // Gestion spécifique de l'erreur de numéro de téléphone déjà utilisé
        if (errorMessage.includes('numéro de téléphone est déjà utilisé') || 
            errorMessage.includes('telephone') && errorMessage.includes('déjà')) {
          
          
          throw new Error(`Le numéro ${fullPhoneForCreate} est déjà utilisé par un autre utilisateur. Veuillez utiliser un autre numéro de téléphone pour le gérant.`);
        } else {
          throw new Error(errorMessage);
        }
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Étape 3 (bis): Traiter le gérant pour entreprise individuelle
  const processDirigeantWorkflow = async () => {
    try {
      const gerants = businessData.participants?.filter((p: any) => p.role === 'GERANT' || p.role === 'PROMOTEUR') || [];
      
      if (gerants.length === 0) {
        throw new Error('Aucun gerant défini pour l\'entreprise individuelle');
      }
      
      if (gerants.length > 1) {
        throw new Error('Un seul gerant autorisé pour une entreprise individuelle');
      }

      const gerant = gerants[0];
      let createdDirigeant = null;

      const gerantData = {
        lastName: gerant.nom || '',
        firstName: gerant.prenom || '',
        phone: gerant.telephone || '',
        email: gerant.email || '',
        birthDate: gerant.dateNaissance || '',
        birthPlace: gerant.lieuNaissance || '',
        nationality: gerant.nationnalite || 'MALIENNE',
        sexe: getConsistentSexe(gerant.sexe, gerant.civilite || 'MONSIEUR'),
        situationMatrimoniale: gerant.situationMatrimoniale || 'CELIBATAIRE',
        civility: mapCivilityToBackend(gerant.civilite || 'MONSIEUR'),
        divisionId: gerant.divisionId || gerant.division_id,
        divisionCode: gerant.divisionCode,
        localite: gerant.localite
      };

      // Si le gerant n'a pas encore d'ID, le créer
      if (!gerant.personId) {
        createdDirigeant = await createDirigeantWorkflow(gerantData);
        if (createdDirigeant) {
          gerant.personId = createdDirigeant.id || createdDirigeant.data?.id;
        }
      } else {
        createdDirigeant = await updateManagerWorkflow(gerant.personId, gerantData);
      }

      return createdDirigeant;
    } catch (err) {
      throw err;
    }
  };

  // Créer un gerant avec EntrepriseRole.DIRIGEANT
  const createDirigeantWorkflow = async (gerantData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token trouvé');

      const personRequest = {
        nom: gerantData.lastName,
        prenom: gerantData.firstName,
        telephone1: gerantData.phone,
        email: gerantData.email,
        dateNaissance: gerantData.birthDate,
        lieuNaissance: gerantData.birthPlace,
        nationnalite: gerantData.nationality || 'MALIENNE',
        sexe: gerantData.sexe,
        situationMatrimoniale: gerantData.situationMatrimoniale || 'CELIBATAIRE',
        civilite: mapCivilityToBackend(gerantData.civility),
        division_id: gerantData.divisionId || gerantData.division_id || null,
        divisionCode: gerantData.divisionCode || null,
        localite: gerantData.localite || null,
        role: 'USER',
        entrepriseRole: businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT'
      };


      const response = await fetch('/api/v1/persons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du gerant');
      }
      
      const result = await response.json();
      
      return result;
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Création d'entreprise
            </h1>
            <p className="text-gray-600">
              Suivez les étapes pour créer votre entreprise
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8 bg-white rounded-lg p-6 shadow-sm">
            {[
              { number: 0, name: 'Identification' },
              { number: 1, name: 'Informations personnelles' },
              { number: 2, name: 'Informations entreprise' },
              { number: 3, name: 'Activités et localisation' },
              { number: 4, name: 'Documents' },
              { number: 5, name: 'Validation' }
            ].filter((step) => {
              // Masquer l'étape Documents pour les entreprises individuelles
              const isEntrepriseIndividuelle = businessData.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
              return !(step.number === 4 && isEntrepriseIndividuelle);
            }).map((step, index, filteredSteps) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => goToStep(step.number)}
                  className="flex flex-col items-center group cursor-pointer transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 rounded-lg p-2"
                  title={`Aller à l'étape ${step.number}: ${step.name}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-200 ${
                    currentStep >= step.number 
                      ? 'bg-green-500 group-hover:bg-green-600' 
                      : 'bg-gray-300 group-hover:bg-gray-400'
                  }`}>
                    {step.number}
                  </div>
                  <span className={`text-sm mt-2 text-center font-semibold transition-all duration-200 ${
                    currentStep >= step.number 
                      ? 'text-green-600 group-hover:text-green-700' 
                      : 'text-gray-500 group-hover:text-gray-600'
                  }`}>
                    {step.name}
                  </span>
                </button>
                {index < filteredSteps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {currentStep === 0 && (
              <UserIdentificationStep 
                isForSelf={isForSelf}
                setIsForSelf={setIsForSelf}
                handleResponse={handleResponse}
              />
            )}
            
            {currentStep === 1 && (
              <PersonalInfoStep 
                data={businessData} 
                updateData={updateBusinessData}
                isForSelf={isForSelf}
                setIsForSelf={setIsForSelf}
                showForm={showForm}
                setShowForm={setShowForm}
              />
            )}
            
            {currentStep === 2 && (
              <CompanyInfoStep 
                data={businessData} 
                updateData={updateBusinessData}
              />
            )}
            
            {currentStep === 3 && (
              <ParticipantsStep 
                data={businessData} 
                updateData={updateBusinessData}
                onNext={nextStep}
              />
            )}
            
            {currentStep === 4 && (
              <DocumentsStep 
                data={businessData} 
                updateData={updateBusinessData}
              />
            )}
            
            {currentStep === 5 && (
              <SummaryAndSubmissionStep 
                data={businessData} 
                updateData={updateBusinessData}
                submitTrigger={0}
                personalLocationName={personalLocationName}
                companyLocationName={companyLocationName}
              />
            )}
          </div>

          {/* Error Display */}
          {showValidation && stepError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 mr-2">⚠️</div>
                <div className="text-red-800">{stepError}</div>
              </div>
              <button 
                onClick={() => setShowValidation(false)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Précédent
            </button>
            
            {currentStep < 5 && (
              <button
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
                className={`px-6 py-2 rounded-lg font-medium ${
                  canProceedToNextStep()
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canProceedToNextStep() === null ? 'Soumettre' : 'Suivant'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCreation;
<<<<<<< HEAD
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
=======

>>>>>>> 060c2b6fa (WIP: local changes before rebase)
