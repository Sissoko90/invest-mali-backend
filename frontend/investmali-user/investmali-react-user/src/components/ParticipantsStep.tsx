import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessCreationData, Participant, EntrepriseRole, TypeEntreprise } from './BusinessCreation';
import enumService from '../services/enumService';
import documentsService from '../services/documentsService';

import SignatureCanvas from './SignatureCanvas';

// Fonction utilitaire pour valider et nettoyer l'email
// Retourne null si l'email est vide, invalide ou ressemble à un numéro de téléphone
const cleanAndValidateEmail = (email: string | undefined | null): string | null => {
  if (!email || email.trim() === '') {
    return null;
  }
  
  const emailValue = email.trim();
  
  // Vérifier que ce n'est pas un numéro de téléphone (commence par + ou contient uniquement des chiffres et espaces)
  if (emailValue.startsWith('+') || /^[\d\s\-\.]+$/.test(emailValue)) {
    console.warn('🔍 [EMAIL PARTICIPANTS] Valeur rejetée car ressemble à un numéro de téléphone:', emailValue);
    return null;
  }
  
  // Vérifier le format email avec une regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailValue)) {
    console.warn('🔍 [EMAIL PARTICIPANTS] Valeur rejetée car format invalide:', emailValue);
    return null;
  }
  
  return emailValue;
};

/**
 * ARCHITECTURE PERSONNES MORALES - DOCUMENTATION
 * 
 * ARCHITECTURE OPTIMISÉE : Séparation des données représentant et entreprise
 * 
 * STOCKAGE DES DONNÉES :
 * 
 * 1. TABLE PERSONS (infos représentant légal) :
 *    - nom = nom du représentant légal (ex: "Doe")
 *    - prenom = prénom du représentant légal (ex: "John")
 *    - autres champs = valeurs techniques pour satisfaire les validations
 * 
 * 2. TABLE ENTREPRISE_MEMBRE (infos entreprise) :
 *    - denomination_entreprise = dénomination de l'entreprise (ex: "Moussa Yalcoye Kama Gaz")
 *    - pays_emission_rccm = pays d'émission du RCCM (ex: "MALI")
 * 
 * AVANTAGES :
 * - Pas de duplication de données
 * - Sémantique claire et logique
 * - Séparation des responsabilités
 * - Facilite la maintenance
 * 
 * LOGIQUE :
 * - persons stocke les infos de la personne physique (représentant)
 * - entreprise_membre stocke les infos de l'entité juridique (entreprise)
 */

interface ParticipantsStepProps {
  data: BusinessCreationData;
  updateData: (field: keyof BusinessCreationData, value: any) => void;
  onNext: () => void;
}

const ParticipantsStep: React.FC<ParticipantsStepProps> = ({ data, updateData, onNext }) => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showUserRoleForm, setShowUserRoleForm] = useState(false);
  const [showPersonTypeModal, setShowPersonTypeModal] = useState(false);
  const [selectedPersonType, setSelectedPersonType] = useState<'physique' | 'morale' | null>(null);
  const [paysEmissionRccm, setPaysEmissionRccm] = useState<Array<{key: string, value: string}>>([]);
  const [moralePersonData, setMoralePersonData] = useState({
    denominationEntreprise: '',
    representantNom: '',
    representantPrenom: '',
    part: 0,
    paysEmissionRccm: 'MALI',
    rccmFile: undefined as File | undefined,
    role: 'ASSOCIE' as EntrepriseRole
  });
  
  // Rôle par défaut selon le type d'entreprise
  const defaultRole = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'ASSOCIE';
  const [userRole, setUserRole] = useState<EntrepriseRole>(defaultRole);
  const [formData, setFormData] = useState<Participant>({
    personId: '',
    nom: '',
    prenom: '',
    telephone: '',
    telephone2: '',
    email: '',
    dateNaissance: '',
    lieuNaissance: '',
    civilite: 'MONSIEUR',
    sexe: 'MASCULIN',
    role: defaultRole,
    pourcentageParts: 0,
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '9999-12-31',
    typePiece: '',
    numeroPiece: '',
    documentFile: undefined,
    documentUrl: '',
    casierJudiciaireFile: undefined,
    declarationHonneurFile: undefined,
    extraitNaissanceFile: undefined,
    acteMariageFile: undefined,
    certificatResidenceFile: undefined,
    certificatResidenceUrl: '',
    signatureDataUrl: undefined,
    autresDocuments: [],
    // Questions spécifiques aux gérants - hasCriminalRecord undefined pour forcer la réponse
    hasCriminalRecord: undefined,
    isMarried: false,
    authorizeOthers: false,
    isForSelf: undefined // Pour moi-même ou pour une autre personne
  });
  
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

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileUploadSuccess, setFileUploadSuccess] = useState<string | null>(null);

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

  // Pour les entreprises individuelles, forcer l'affichage du formulaire de participants
  useEffect(() => {
    if ((data.companyInfo?.typeEntreprise as TypeEntreprise) === 'ENTREPRISE_INDIVIDUELLE') {
      // Masquer le formulaire de sélection de rôle
      setShowUserRoleForm(false);
      // Définir le rôle par défaut
      setUserRole('PROMOTEUR');
      
      // Si aucun participant n'existe encore, ajouter automatiquement l'utilisateur
      if (data.participants.length === 0) {
        // Ajouter un délai pour s'assurer que tous les états sont initialisés
        setTimeout(() => {
          handleAddUserAsParticipant();
        }, 100);
      } else if (data.participants.length === 1 && editingIndex === null) {
        // Si le promoteur existe déjà, ouvrir automatiquement le formulaire d'édition
        setTimeout(() => {
          handleEditParticipant(0);
        }, 200);
      }
    }
  }, [data.companyInfo?.typeEntreprise, data.participants.length, editingIndex]);

  // Fermer le dropdown quand on clique à l'extérieur
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

  // Fonction pour ouvrir la déclaration sur l'honneur dans une nouvelle fenêtre
  const handleDeclarationHonneur = () => {
    // Vérifier que les champs nom et prénom sont remplis
    if (!formData.nom || !formData.prenom) {
      setErrors(['Veuillez remplir le nom et le prénom avant de faire une déclaration sur l\'honneur.']);
      return;
    }
    
    // Vérifier que la signature est présente SEULEMENT si aucun fichier n'est uploadé
    if (!formData.declarationHonneurFile && !formData.signatureDataUrl) {
      setErrors(['Veuillez signer la déclaration sur l\'honneur avant de la générer, ou uploadez une déclaration déjà signée.']);
      return;
    }
    
    // Stocker les données du participant dans sessionStorage pour la nouvelle fenêtre
    sessionStorage.setItem('declarationParticipantData', JSON.stringify({
      nom: formData.nom,
      prenom: formData.prenom,
      signatureDataUrl: formData.signatureDataUrl
    }));
    
    // Ouvrir dans une nouvelle fenêtre
    const newWindow = window.open('/declaration-honneur', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  // Récupérer les pays d'émission RCCM depuis le backend
  useEffect(() => {
    const fetchPaysEmissionRccm = async () => {
      try {
        const response = await enumService.getPaysEmissionRccm();
        setPaysEmissionRccm(response || []);
      } catch (error) {
        // Fallback avec Mali par défaut en cas d'erreur
        setPaysEmissionRccm([{ key: 'MALI', value: 'Mali' }]);
      }
    };
    
    fetchPaysEmissionRccm();
  }, []);

  // Détecter automatiquement le pays quand un numéro existant est chargé
  useEffect(() => {
    if (formData.telephone && formData.telephone.startsWith('+')) {
      const detectedCountry = detectCountryFromPhone(formData.telephone);
      const localNumber = extractLocalNumber(formData.telephone, detectedCountry.code);
      
      setSelectedCountry(detectedCountry);
      // Mettre à jour le formData avec le numéro local
      setFormData(prev => ({ ...prev, telephone: localNumber }));
    }
  }, [formData.telephone]);

  // Fonction utilitaire pour valider et compresser les fichiers
  const validateAndCompressFile = async (file: File, inputElement: HTMLInputElement): Promise<File | undefined> => {
    const maxSize = 50 * 1024 * 1024; // 50MB en bytes
    const mysqlLimit = 1 * 1024 * 1024; // 1MB limite MySQL actuelle
    
    if (file.size > maxSize) {
      setErrors(['Le fichier est trop volumineux. Taille maximum autorisée : 50MB']);
      inputElement.value = '';
      return undefined;
    }
    
    // Si c'est une image et qu'elle dépasse 1MB, proposer la compression
    if (file.type.startsWith('image/') && file.size > mysqlLimit) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compress = window.confirm(`L'image fait ${sizeMB}MB. Voulez-vous la compresser automatiquement pour éviter les erreurs d'upload ?`);
      
      if (compress) {
        try {
          const compressedFile = await compressImage(file);
          const newSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
          console.log(`Image compressée avec succès ! Nouvelle taille : ${newSizeMB}MB`);
          return compressedFile;
        } catch (error) {
          console.warn('Erreur lors de la compression. Le fichier original sera utilisé.');
        }
      }
    }
    
    return file;
  };

  // Fonction de compression d'image
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions (réduire de 50%)
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob avec compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur lors de la compression'));
            }
          },
          'image/jpeg',
          0.7 // Qualité 70%
        );
      };
      
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Vérifier si l'utilisateur est déjà dans les participants
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isUserInParticipants = data.participants?.some(p => p.personId === currentUser.personne_id) || false;

  // Mettre à jour le rôle par défaut quand le type d'entreprise change
  React.useEffect(() => {
    const newDefaultRole = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'ASSOCIE';
    setUserRole(newDefaultRole);
    setFormData(prev => ({ ...prev, role: newDefaultRole, pourcentageParts: newDefaultRole === 'PROMOTEUR' && data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 100 : prev.pourcentageParts }));
  }, [data.companyInfo?.typeEntreprise]);

  // Afficher le formulaire de rôle utilisateur au chargement si pas encore participant
  React.useEffect(() => {
    if (!isUserInParticipants && data.participants?.length === 0) {
      setShowUserRoleForm(true);
    }
  }, [isUserInParticipants, data.participants?.length]);


  const validateParticipants = (): string[] => {
    const validationErrors: string[] = [];
    const participants = data.participants || [];
    const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';

    if (participants.length === 0) {
      validationErrors.push('Au moins un participant est requis');
      return validationErrors;
    }

    // ========== RÈGLES SPÉCIFIQUES POUR ENTREPRISE INDIVIDUELLE ==========
    if (isEntrepriseIndividuelle) {
      // 1. Un seul participant autorisé
      if (participants.length > 1) {
        validationErrors.push('Une entreprise individuelle ne peut avoir qu\'un seul participant (le gérant)');
      }

      // 2. Le seul rôle autorisé est PROMOTEUR
      const nonPromoteurs = participants.filter(p => p.role !== 'PROMOTEUR');
      if (nonPromoteurs.length > 0) {
        validationErrors.push('Pour une entreprise individuelle, le seul rôle autorisé est "Promoteur"');
      }

      // 3. Le promoteur doit avoir 100% des parts
      const promoteur = participants.find(p => p.role === 'PROMOTEUR');
      if (promoteur && Math.abs(promoteur.pourcentageParts - 100) > 1) {
        validationErrors.push('Le promoteur d\'une entreprise individuelle doit avoir 100% des parts');
      }

      // 4. Vérifier les documents requis (mêmes que pour un gérant)
      participants.forEach((p, idx) => {
        const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
        // Validation des documents selon le type de personne
        if (p.civilite === 'PERSONNE_MORALE') {
          // Pour les personnes morales, vérifier le document RCCM
          if (!p.rccmFile) {
            validationErrors.push(`${label}: document RCCM obligatoire pour les personnes morales`);
          }
          // Validation des rôles autorisés pour les personnes morales
          if (p.role === 'ADMINISTRATEUR') {
            validationErrors.push(`${label}: Une personne morale ne peut pas avoir le rôle ADMINISTRATEUR`);
          }
        } else {
          // Pour les personnes physiques, le document d'identité est optionnel
          // (supprimé la validation obligatoire)
        }
        // Documents optionnels - suppression des validations obligatoires
        // (Les documents peuvent être ajoutés plus tard si nécessaire)
        // Certificat de résidence requis seulement si le gérant n'est pas de nationalité malienne
        if (p.civilite !== 'PERSONNE_MORALE' && !p.certificatResidenceFile) {
          const gerantNationality = p.nationnalite || data.personalInfo?.nationality || 'MALIENNE';
          if (gerantNationality.toUpperCase() !== 'MALIENNE') {
            validationErrors.push(`${label}: certificat de résidence requis (nationalité non malienne)`);
          }
        }
      });

      return validationErrors;
    }

    // ========== RÈGLES POUR SOCIÉTÉ (logique existante) ==========
    // Vérifier qu'il y a un seul gérant (sauf si autorisation multiple)
    const gerants = participants.filter(p => p.role === 'GERANT');
    if (gerants.length === 0) {
      validationErrors.push('Un gérant est obligatoire');
    } else if (gerants.length > 1 && !data.personalInfo?.allowsMultipleManagers) {
      validationErrors.push('Un seul gérant est autorisé (sauf si autorisation multiple activée)');
    }

    // Vérifier qu'il y a au moins un Dirigeant
    const dirigeants = participants.filter(p => p.role === 'GERANT');
    if (dirigeants.length === 0) {
      validationErrors.push('Au moins un dirigeant est requis');
    }

    // Vérifier que la somme des parts = 100% (exclure les administrateurs)
    const totalParts = participants
      .filter(p => roleRequiresParts(p.role))
      .reduce((sum, p) => sum + p.pourcentageParts, 0);
    
    if (Math.abs(totalParts - 100) > 1) {
      validationErrors.push(`La somme des parts doit être égale à 100% (actuellement: ${totalParts.toFixed(2)}%)`);
    }

    // Vérifier pièces d'identité et documents pour chaque participant
    participants.forEach((p, idx) => {
      const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
      // Validation des documents selon le type de personne
      if (p.civilite === 'PERSONNE_MORALE') {
        // Pour les personnes morales, vérifier le document RCCM
        if (!p.rccmFile) {
          validationErrors.push(`${label}: document RCCM obligatoire pour les personnes morales`);
        }
        // Validation des rôles autorisés pour les personnes morales
        if (p.role === 'ADMINISTRATEUR') {
          validationErrors.push(`${label}: Une personne morale ne peut pas avoir le rôle ADMINISTRATEUR`);
        }
      } else {
        // Pour les personnes physiques, le document d'identité est optionnel
        // (supprimé la validation obligatoire)
      }
      // Documents optionnels pour tous les participants - suppression des validations obligatoires
      // (Les documents peuvent être ajoutés plus tard si nécessaire)
    });

    return validationErrors;
  };

  const handleAddMoraleParticipant = () => {
    // Validation détaillée des champs obligatoires pour personne morale
    const validationErrors = [];
    
    if (!moralePersonData.denominationEntreprise) {
      validationErrors.push('La dénomination de l\'entreprise est obligatoire');
    }
    if (!moralePersonData.representantNom) {
      validationErrors.push('Le nom du représentant légal est obligatoire');
    }
    if (!moralePersonData.representantPrenom) {
      validationErrors.push('Le prénom du représentant légal est obligatoire');
    }
    if (roleRequiresParts(moralePersonData.role) && moralePersonData.part < 0) {
      validationErrors.push('Le pourcentage de parts doit être positif');
    }
    if (!moralePersonData.role) {
      validationErrors.push('Le rôle est obligatoire');
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newParticipant: Participant = {
      // ARCHITECTURE OPTIMISÉE : Séparation des données représentant et entreprise
      // persons.nom = nom du représentant légal uniquement
      // persons.prenom = prénom du représentant légal uniquement
      nom: moralePersonData.representantNom, // → persons.nom (nom représentant)
      prenom: moralePersonData.representantPrenom, // → persons.prenom (prénom représentant)
      // CHAMPS NON OBLIGATOIRES pour personnes morales - valeurs uniques pour satisfaire les contraintes :
      telephone: `+223${Math.floor(Math.random() * 90000000) + 10000000}`, // NON OBLIGATOIRE - numéro unique généré pour éviter les conflits (format E.164)
      email: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      dateNaissance: '1900-01-01', // NON OBLIGATOIRE - valeur minimale pour satisfaire la validation backend
      lieuNaissance: 'N/A', // NON OBLIGATOIRE - valeur minimale pour satisfaire la validation backend
      nationnalite: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      numeroPiece: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      typePiece: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      documentFile: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      documentUrl: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      // Champs obligatoires pour personnes morales :
      role: moralePersonData.role,
      pourcentageParts: roleRequiresParts(moralePersonData.role) ? moralePersonData.part : 0,
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '9999-12-31',
      // Marquer comme personne morale
      civilite: 'PERSONNE_MORALE',
      // CHAMPS NON OBLIGATOIRES pour personnes morales - valeurs undefined :
      sexe: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      situationMatrimoniale: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
      // CHAMPS SPÉCIFIQUES ENTREPRISE (entreprise_membre table) :
      paysEmissionRccm: moralePersonData.paysEmissionRccm, // → entreprise_membre.pays_emission_rccm
      denominationEntreprise: moralePersonData.denominationEntreprise, // → entreprise_membre.denomination_entreprise (PLUS de duplication)
      rccmFile: moralePersonData.rccmFile
    };

    const updatedParticipants = [...(data.participants || []), newParticipant];
    updateData('participants', updatedParticipants);
    
    // Réinitialiser le formulaire
    setMoralePersonData({
      denominationEntreprise: '',
      representantNom: '',
      representantPrenom: '',
      part: 0,
      paysEmissionRccm: 'MALI',
      rccmFile: undefined,
      role: 'ASSOCIE' as EntrepriseRole
    });
    setSelectedPersonType(null);
    setShowAddForm(false);
  };

  const handleAddParticipant = () => {
    // Pour les personnes morales, utiliser handleAddMoraleParticipant directement
    if (selectedPersonType === 'morale') {
      handleAddMoraleParticipant();
      return;
    }
    
    // Validation des champs obligatoires pour les personnes physiques uniquement
    if (!formData.nom || !formData.prenom || !formData.telephone || 
        !formData.dateNaissance || !formData.lieuNaissance || 
        !formData.civilite || !formData.sexe ||
        !formData.typePiece || !formData.documentFile) {
      setErrors(['Tous les champs marqués d\'un * sont obligatoires']);
      return;
    }

    // Validation de l'âge minimum (18 ans)
    const birthDate = new Date(formData.dateNaissance);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (actualAge < 18) {
      setErrors([`Le participant doit avoir au moins 18 ans. Âge actuel: ${actualAge} ans`]);
      return;
    }

    // Validation spécifique pour les gérants ET promoteurs d'entreprise individuelle
    const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    const requiresManagerDocuments = formData.role === 'GERANT' || formData.role === 'PROMOTEUR';
    
    if (requiresManagerDocuments && data.personalInfo?.hasCriminalRecord && !formData.casierJudiciaireFile) {
      setErrors(['Le casier judiciaire est obligatoire']);
      return;
    }

    if (requiresManagerDocuments && !data.personalInfo?.hasCriminalRecord) {
      if (!formData.declarationHonneurFile && !formData.signatureDataUrl) {
        setErrors(['La déclaration d\'honneur avec signature est obligatoire (sans casier judiciaire)']);
        return;
      }
      if (!formData.signatureDataUrl) {
        setErrors(['La signature de la déclaration sur l\'honneur est obligatoire']);
        return;
      }
    }

    if (requiresManagerDocuments && data.personalInfo?.isMarried && !formData.acteMariageFile) {
      setErrors(['L\'acte de mariage est obligatoire (si marié)']);
      return;
    }

    // Validation du certificat de résidence pour les gérants et promoteurs
    if (requiresManagerDocuments && !formData.certificatResidenceFile) {
      const roleLabel = formData.role === 'PROMOTEUR' ? 'promoteurs' : 'gérants';
      setErrors([`Le certificat de résidence est obligatoire pour les ${roleLabel}`]);
      return;
    }

    // Validation de la pièce de nationalité pour les entreprises individuelles
    if (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && formData.role === 'PROMOTEUR' && !formData.pieceNationaliteFile) {
      setErrors(['La pièce de nationalité est obligatoire pour les entreprises individuelles']);
      return;
    }

    // Convertir le téléphone au format E.164
    const participantPhone = formData.telephone || '';
    const fullPhoneForParticipant = participantPhone ? 
      (participantPhone.startsWith('+') ? participantPhone : `${selectedCountry.code}${participantPhone.replace(/\s/g, '')}`) : '';
    
    // Convertir le téléphone 2 au format E.164
    const participantPhone2 = formData.telephone2 || '';
    const fullPhoneForParticipant2 = participantPhone2 ? 
      (participantPhone2.startsWith('+') ? participantPhone2 : `${selectedCountry.code}${participantPhone2.replace(/\s/g, '')}`) : '';

    const newParticipant: Participant = { 
      ...formData,
      // Convertir les téléphones au format E.164
      telephone: fullPhoneForParticipant,
      telephone2: fullPhoneForParticipant2,
      // Pour les gérants et promoteurs d'entreprise individuelle, définir automatiquement la situation matrimoniale
      situationMatrimoniale: (formData.role === 'GERANT' || formData.role === 'PROMOTEUR')
        ? (data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE')
        : formData.situationMatrimoniale,
      // Les administrateurs n'ont pas de parts
      pourcentageParts: roleRequiresParts(formData.role) ? formData.pourcentageParts : 0
    };
    const updatedParticipants = [...(data.participants || []), newParticipant];
    
    updateData('participants', updatedParticipants);
    setFormData({
      personId: '',
      nom: '',
      prenom: '',
      telephone: '',
      telephone2: '',
      email: '',
      dateNaissance: '',
      lieuNaissance: '',
      nationnalite: '',
      civilite: 'MONSIEUR', // Réinitialiser avec valeur par défaut
      sexe: 'MASCULIN', // Réinitialiser avec valeur par défaut
      situationMatrimoniale: '',
      role: (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT') as EntrepriseRole,
      pourcentageParts: 0,
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '9999-12-31',
      typePiece: '',
      numeroPiece: '',
      documentFile: undefined,
      documentUrl: '',
      casierJudiciaireFile: undefined,
      acteMariageFile: undefined,
      extraitNaissanceFile: undefined,
      certificatResidenceFile: undefined,
      declarationHonneurFile: undefined,
      signatureDataUrl: undefined,
      autresDocuments: []
    });
    setShowAddForm(false);
  };

  // Fonction pour uploader les documents supplémentaires
  const uploadAutresDocuments = async (personneId: string, entrepriseId: string, autresDocuments: Array<{id: string, name: string, file: File | null, description: string}>) => {
    if (!autresDocuments || autresDocuments.length === 0) {
      return [];
    }

    console.log('📎 Upload documents supplémentaires:', autresDocuments.length, 'documents');
    
    try {
      const results = await documentsService.uploadMultipleAutresDocuments(
        personneId,
        entrepriseId,
        autresDocuments
      );
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      console.log(`✅ Documents supplémentaires: ${successCount} uploadés, ${errorCount} erreurs`);
      
      if (errorCount > 0) {
        const errors = results.filter(r => !r.success).map(r => `${r.originalDoc.name}: ${r.error}`);
        console.warn('❌ Erreurs upload documents:', errors);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Erreur upload documents supplémentaires:', error);
      throw error;
    }
  };

  const handleEditParticipant = (index: number) => {
    const participant = data.participants[index];
    
    // Assurer que tous les champs obligatoires ont des valeurs par défaut
    const participantWithDefaults = {
      ...participant,
      nationnalite: participant.nationnalite || 'MALIENNE',
      civilite: participant.civilite === 'PERSONNE_MORALE' ? 'PERSONNE_MORALE' : (participant.civilite || 'MONSIEUR'),
      sexe: participant.sexe || 'MASCULIN',
      typePiece: participant.typePiece || 'CNI',
      situationMatrimoniale: participant.situationMatrimoniale || 'CELIBATAIRE',
      telephone2: participant.telephone2 || ''
    };
    
    setFormData(participantWithDefaults);
    setEditingIndex(index);
    
    // Détecter le type de personne
    if (participant.civilite === 'PERSONNE_MORALE') {
      setSelectedPersonType('morale');
      setMoralePersonData({
        denominationEntreprise: participant.denominationEntreprise || '',
        representantNom: participant.nom || '',
        representantPrenom: participant.prenom || '',
        paysEmissionRccm: participant.paysEmissionRccm || 'Mali',
        role: participant.role,
        rccmFile: participant.rccmFile,
        part: participant.pourcentageParts || 0
      });
    } else {
      setSelectedPersonType('physique');
    }
    
    setShowAddForm(true);
  };

  const handleUpdateMoraleParticipant = () => {
    if (editingIndex !== null) {
      // Validation détaillée des champs obligatoires pour personne morale
      const validationErrors = [];
      
      if (!moralePersonData.denominationEntreprise) {
        validationErrors.push('La dénomination de l\'entreprise est obligatoire');
      }
      if (!moralePersonData.representantNom) {
        validationErrors.push('Le nom du représentant légal est obligatoire');
      }
      if (!moralePersonData.representantPrenom) {
        validationErrors.push('Le prénom du représentant légal est obligatoire');
      }
      if (roleRequiresParts(moralePersonData.role) && moralePersonData.part < 0) {
        validationErrors.push('Le pourcentage de parts doit être positif');
      }
      if (!moralePersonData.role) {
        validationErrors.push('Le rôle est obligatoire');
      }
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      const updatedParticipant: Participant = {
        ...data.participants[editingIndex],
        // ARCHITECTURE OPTIMISÉE : Séparation des données représentant et entreprise
        nom: moralePersonData.representantNom, // → persons.nom (nom représentant)
        prenom: moralePersonData.representantPrenom, // → persons.prenom (prénom représentant)
        pourcentageParts: roleRequiresParts(moralePersonData.role) ? moralePersonData.part : 0,
        // CHAMPS SPÉCIFIQUES ENTREPRISE (entreprise_membre table) :
        paysEmissionRccm: moralePersonData.paysEmissionRccm, // → entreprise_membre.pays_emission_rccm
        denominationEntreprise: moralePersonData.denominationEntreprise, // → entreprise_membre.denomination_entreprise (PLUS de duplication)
        rccmFile: moralePersonData.rccmFile,
        role: moralePersonData.role,
        // CHAMPS NON OBLIGATOIRES pour personnes morales - valeurs uniques pour satisfaire les contraintes :
        telephone: `+223${Math.floor(Math.random() * 90000000) + 10000000}`, // NON OBLIGATOIRE - numéro unique généré pour éviter les conflits (format E.164)
        email: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
        dateNaissance: '1900-01-01', // NON OBLIGATOIRE - valeur minimale pour satisfaire la validation backend
        lieuNaissance: 'N/A', // NON OBLIGATOIRE - valeur minimale pour satisfaire la validation backend
        nationnalite: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
        numeroPiece: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
        typePiece: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
        documentFile: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
        documentUrl: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
        sexe: undefined, // NON OBLIGATOIRE - undefined pour les personnes morales
        situationMatrimoniale: undefined // NON OBLIGATOIRE - undefined pour les personnes morales
      };

      const updatedParticipants = [...data.participants];
      updatedParticipants[editingIndex] = updatedParticipant;
      updateData('participants', updatedParticipants);
      
      // Réinitialiser le formulaire
      setMoralePersonData({
        denominationEntreprise: '',
        representantNom: '',
        representantPrenom: '',
        part: 0,
        paysEmissionRccm: 'MALI',
        rccmFile: undefined,
        role: 'ASSOCIE' as EntrepriseRole
      });
      setSelectedPersonType(null);
      setEditingIndex(null);
      setShowAddForm(false);
    }
  };

  const handleUpdateParticipant = () => {
    if (editingIndex !== null) {
      // Pour les personnes morales, utiliser handleUpdateMoraleParticipant directement
      if (selectedPersonType === 'morale') {
        handleUpdateMoraleParticipant();
        return;
      }
      // Validation de l'âge minimum (18 ans)
      if (formData.dateNaissance) {
        const birthDate = new Date(formData.dateNaissance);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        
        if (actualAge < 18) {
          setErrors([`Le participant doit avoir au moins 18 ans. Âge actuel: ${actualAge} ans`]);
          return;
        }
      }
      
      // Convertir le téléphone au format E.164
      const participantPhone = formData.telephone || '';
      const fullPhoneForParticipant = participantPhone ? 
        (participantPhone.startsWith('+') ? participantPhone : `${selectedCountry.code}${participantPhone.replace(/\s/g, '')}`) : '';

      const updatedParticipants = [...data.participants];
      const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      const updatedParticipant = { 
        ...formData,
        // Convertir le téléphone au format E.164
        telephone: fullPhoneForParticipant,
        // Pour les gérants et promoteurs, définir automatiquement la situation matrimoniale
        situationMatrimoniale: (formData.role === 'GERANT' || formData.role === 'PROMOTEUR')
          ? (data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE')
          : formData.situationMatrimoniale,
        // Les administrateurs n'ont pas de parts
        pourcentageParts: roleRequiresParts(formData.role) ? formData.pourcentageParts : 0
      };
      updatedParticipants[editingIndex] = updatedParticipant;
      updateData('participants', updatedParticipants);
      setEditingIndex(null);
      setShowAddForm(false);
      setFormData({
        personId: '',
        nom: '',
        prenom: '',
        telephone: '',
        telephone2: '',
        email: '',
        dateNaissance: '',
        lieuNaissance: '',
        nationnalite: '',
        situationMatrimoniale: '',
        role: (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT') as EntrepriseRole,
        pourcentageParts: 0,
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '9999-12-31',
        typePiece: '',
        numeroPiece: '',
        documentFile: undefined,
        documentUrl: '',
        casierJudiciaireFile: undefined,
        acteMariageFile: undefined
      });
    }
  };

  const handleDeleteParticipant = (index: number) => {
    const updatedParticipants = data.participants.filter((_, i) => i !== index);
    updateData('participants', updatedParticipants);
  };

  const handleAddUserAsParticipant = () => {
    if (!currentUser.personne_id) {
      setErrors(['Impossible de récupérer vos informations utilisateur']);
      return;
    }

    // Logs de debugging pour les données de localisation utilisateur
    
    // Debug: Afficher tous les champs personnels récupérés
    
    // Debug: Vérifier le rôle utilisateur
    
    // Valider et nettoyer le rôle utilisateur
    const validRoles: EntrepriseRole[] = ['GERANT', 'PROMOTEUR', 'ASSOCIE'];
    const cleanUserRole = userRole?.toString().trim().toUpperCase() as EntrepriseRole;
    
    if (!validRoles.includes(cleanUserRole)) {
      setErrors(['Rôle utilisateur invalide. Veuillez sélectionner un rôle valide.']);
      return;
    }
    

    // Déterminer la source des données selon isForSelf
    const isForSelf = data.personalInfo?.isForSelf;

    // Debug: Afficher la date de naissance récupérée depuis personalInfo
    console.log('🔍 [PARTICIPANTS] Date de naissance depuis personalInfo:', data.personalInfo?.birthDate);
    console.log('🔍 [PARTICIPANTS] Toutes les données personalInfo:', JSON.stringify(data.personalInfo, null, 2));

    let participantData: Participant;

    if (isForSelf) {
      // Si "Oui, c'est pour moi" : utiliser les données saisies dans le formulaire (étape 2)
      participantData = {
        personId: currentUser.personne_id,
        nom: data.personalInfo?.lastName || '',
        prenom: data.personalInfo?.firstName || '',
        telephone: data.personalInfo?.phone || '',
        telephone2: data.personalInfo?.phone2 || '',
        email: data.personalInfo?.email || '',
        dateNaissance: data.personalInfo?.birthDate || '',
        lieuNaissance: data.personalInfo?.birthPlace || '',
        nationnalite: data.personalInfo?.nationality || 'MALIENNE',
        civilite: mapCivilityToBackend(data.personalInfo?.civility || 'MONSIEUR'),
        sexe: data.personalInfo?.sexe || 'MASCULIN',
        situationMatrimoniale: data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE',
        role: cleanUserRole,
        pourcentageParts: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 100 : (cleanUserRole === 'GERANT' ? 0 : 100),
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '9999-12-31',
        typePiece: '',
        numeroPiece: '',
        documentFile: undefined,
        documentUrl: '',
        casierJudiciaireFile: undefined,
        acteMariageFile: undefined,
        certificatResidenceFile: undefined,
        // Hériter les valeurs des questions spécifiques de personalInfo - undefined pour forcer la réponse
        hasCriminalRecord: data.personalInfo?.hasCriminalRecord,
        isMarried: data.personalInfo?.isMarried ?? false,
        authorizeOthers: false,
        isForSelf: true, // Pour moi-même
        // Données de localisation récupérées automatiquement
        divisionId: data.personalInfo?.divisionId,
        division_id: data.personalInfo?.divisionId,
        divisionCode: data.companyInfo?.divisionCode,
        localite: data.personalInfo?.localite
      };
    } else {
      // Si "Non, c'est pour quelqu'un d'autre" : utiliser les données saisies manuellement
      participantData = {
        personId: undefined, // Pas de personId car c'est une nouvelle personne
        nom: data.personalInfo?.lastName || '',
        prenom: data.personalInfo?.firstName || '',
        telephone: data.personalInfo?.phone || '',
        telephone2: data.personalInfo?.phone2 || '', // Ajout du champ telephone2
        email: data.personalInfo?.email || '',
        dateNaissance: data.personalInfo?.birthDate || '',
        lieuNaissance: data.personalInfo?.birthPlace || '',
        nationnalite: data.personalInfo?.nationality || 'MALIENNE',
        civilite: mapCivilityToBackend(data.personalInfo?.civility || 'MONSIEUR'),
        sexe: data.personalInfo?.sexe || 'MASCULIN',
        situationMatrimoniale: data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE',
        role: cleanUserRole,
        pourcentageParts: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 100 : (cleanUserRole === 'GERANT' ? 0 : 100),
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '9999-12-31',
        typePiece: '',
        numeroPiece: '',
        documentFile: undefined,
        documentUrl: '',
        casierJudiciaireFile: undefined,
        acteMariageFile: undefined,
        certificatResidenceFile: undefined,
        // Hériter les valeurs des questions spécifiques de personalInfo - undefined pour forcer la réponse
        hasCriminalRecord: data.personalInfo?.hasCriminalRecord,
        isMarried: data.personalInfo?.isMarried ?? false,
        authorizeOthers: false,
        isForSelf: false, // Pour une autre personne
        // Données de localisation saisies manuellement
        divisionId: data.personalInfo?.divisionId,
        division_id: data.personalInfo?.divisionId,
        divisionCode: data.companyInfo?.divisionCode,
        localite: data.personalInfo?.localite
      };
    }

    const updatedParticipants = [...(data.participants || []), participantData];
    updateData('participants', updatedParticipants);
    setShowUserRoleForm(false);
    // Ouvrir immédiatement le formulaire d'édition pour compléter la pièce et le document
    setEditingIndex(updatedParticipants.length - 1);
    setFormData(updatedParticipants[updatedParticipants.length - 1]);
    setShowAddForm(true);
  };

  const handleAutoDistributeParts = () => {
    // Calculer le total actuel des parts (exclure les administrateurs)
    const eligibleParticipants = data.participants.filter(p => 
      roleRequiresParts(p.role)
    );
    
    if (eligibleParticipants.length === 0) {
      setErrors(['Aucun participant éligible pour recevoir des parts']);
      return;
    }

    const currentTotal = eligibleParticipants.reduce((sum, p) => sum + p.pourcentageParts, 0);
    const remaining = 100 - currentTotal;
    
    if (Math.abs(remaining) < 0.01) {
      setErrors(['Les parts sont déjà réparties à 100%']);
      return;
    }

    // Répartir équitablement les parts restantes
    const partsPerParticipant = remaining / eligibleParticipants.length;
    
    const updatedParticipants = data.participants.map(participant => {
      if (roleRequiresParts(participant.role)) {
        return {
          ...participant,
          pourcentageParts: Math.round((participant.pourcentageParts + partsPerParticipant) * 100) / 100
        };
      }
      return participant;
    });

    updateData('participants', updatedParticipants);
    setErrors([]); // Effacer les erreurs après répartition
  };

  const handleNext = async () => {
    // Vérifier si l'utilisateur doit d'abord se définir comme participant
    if (!isUserInParticipants && data.participants?.length === 0) {
      setErrors(['Vous devez d\'abord vous ajouter comme participant']);
      setShowUserRoleForm(true);
      return;
    }

    const validationErrors = validateParticipants();
    setErrors(validationErrors);
    
    if (validationErrors.length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      
      // WORKFLOW ÉTAPE 3: Créer les associés avec EntrepriseRole.ASSOCIE
      const associates = data.participants?.filter(p => p.role === 'ASSOCIE') || [];
      
      for (const associate of associates) {
        // Si l'associé n'a pas encore d'ID, le créer
        if (!associate.personId && associate.nom && associate.prenom) {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Aucun token trouvé');

          // Détecter si c'est une personne morale
          const isPersonneMorale = associate.civilite === 'PERSONNE_MORALE' || 
                                   (associate.denominationEntreprise && associate.paysEmissionRccm);
          
          console.log('🔍 Détection personne morale (associé):', {
            'associate.civilite': associate.civilite,
            'denominationEntreprise': associate.denominationEntreprise,
            'paysEmissionRccm': associate.paysEmissionRccm,
            'isPersonneMorale': isPersonneMorale
          });
          
          if (isPersonneMorale) {
            console.log('🏢 Personne morale détectée - localisation définie à null pour éviter l\'héritage des données utilisateur');
          }

          // Reconstruire le numéro complet avec l'indicatif pour la sauvegarde
          const associatePhone = associate.telephone || '';
          const fullPhoneForAssociate = associatePhone ? 
            (associatePhone.startsWith('+') ? associatePhone : `${selectedCountry.code}${associatePhone.replace(/\s/g, '')}`) : '';
          
          console.log('📞 Reconstruction numéro associé:', {
            associatePhone,
            selectedCountry: selectedCountry.name,
            countryCode: selectedCountry.code,
            fullPhoneForAssociate,
            isE164Valid: fullPhoneForAssociate.match(/^\+\d{10,15}$/) ? 'OUI' : 'NON'
          });

          const personRequest = {
            nom: associate.nom,
            prenom: associate.prenom,
            telephone1: fullPhoneForAssociate, // Sauvegarder le numéro complet avec indicatif
            telephone2: associate.telephone2,
            email: cleanAndValidateEmail(associate.email),
            dateNaissance: associate.dateNaissance || '',
            lieuNaissance: associate.lieuNaissance || '',
            nationnalite: associate.nationnalite || 'MALIENNE',
            // Pour les personnes morales, utiliser des valeurs par défaut (champs obligatoires côté backend)
            sexe: isPersonneMorale ? 'MASCULIN' : (associate.sexe || 'MASCULIN'),
            situationMatrimoniale: isPersonneMorale ? 'CELIBATAIRE' : (associate.situationMatrimoniale || 'CELIBATAIRE'),
            civilite: mapCivilityToBackend(associate.civilite || 'MONSIEUR'),
            // Ajouter les champs de localisation - pour les personnes morales, ne pas utiliser les données personnelles de l'utilisateur
            division_id: isPersonneMorale ? null : (associate.divisionId || associate.division_id || data.personalInfo?.divisionId || null),
            divisionCode: isPersonneMorale ? null : (associate.divisionCode || data.companyInfo?.divisionCode || null),
            localite: isPersonneMorale ? null : (associate.localite || data.personalInfo?.localite || null),
            role: 'USER',
            entrepriseRole: 'ASSOCIE',
            // Champs spécifiques aux personnes morales
            paysEmissionRccm: associate.paysEmissionRccm,
            denominationEntreprise: associate.denominationEntreprise
          };

          // Logs de debugging pour la localisation
          console.log('🔍 Données de localisation disponibles pour associé:', {
            'associate.divisionId': associate.divisionId,
            'associate.division_id': associate.division_id,
            'associate.divisionCode': associate.divisionCode,
            'associate.localite': associate.localite,
            'data.personalInfo?.divisionId': data.personalInfo?.divisionId,
            'data.personalInfo?.localite': data.personalInfo?.localite,
            'data.companyInfo?.divisionCode': data.companyInfo?.divisionCode
          });
          console.log('👥 ÉTAPE 3 - Création associé:', personRequest);

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
            throw new Error(`Erreur création associé ${associate.prenom} ${associate.nom}: ${errorData.message}`);
          }
          
          const result = await response.json();
          console.log('✅ Associé créé:', result);
          
          // Mettre à jour l'ID de l'associé
          associate.personId = result.id || result.data?.id;
        }
      }

      console.log('✅ ÉTAPE 3 TERMINÉE - Associés traités');
      onNext();
      
    } catch (err) {
      console.error('❌ Erreur ÉTAPE 3:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setErrors([`Impossible de créer les associés: ${errorMessage}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: EntrepriseRole): string => {
    switch (role) {
      case 'GERANT': return 'Gérant';
      case 'PROMOTEUR': return data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'Promoteur' : 'Promoteur';
      case 'ASSOCIE': return 'Associé';
      case 'ADMINISTRATEUR': return 'Administrateur';
      default: return role;
    }
  };

  const getRoleColor = (role: EntrepriseRole): string => {
    switch (role) {
      case 'GERANT': return 'bg-red-100 text-red-800';
      case 'PROMOTEUR': return 'bg-blue-100 text-blue-800';
      case 'ASSOCIE': return 'bg-green-100 text-green-800';
      case 'ADMINISTRATEUR': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour déterminer si le rôle ADMINISTRATEUR est disponible
  const isAdministrateurAvailable = (): boolean => {
    const formeJuridique = data.companyInfo?.formeJuridique;
    return formeJuridique === 'SA' || formeJuridique === 'SAS';
  };

  // Fonction pour déterminer si un rôle nécessite des parts
  const roleRequiresParts = (role: EntrepriseRole): boolean => {
    return role !== 'ADMINISTRATEUR';
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-mali-dark mb-2">Dirigeant</h2>
      {/* <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
        Commencez par définir votre rôle dans l'entreprise, puis ajoutez les autres participants selon les règles légales.
      </p> */}

      {/* Règles importantes - masquées pour les entreprises individuelles */}
      {(data.companyInfo?.typeEntreprise as TypeEntreprise) !== 'ENTREPRISE_INDIVIDUELLE' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <h3 className="text-sm sm:text-sm font-medium text-blue-800">Règles importantes</h3>
              <div className="mt-1.5 sm:mt-2 text-sm sm:text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Un seul gérant autorisé par entreprise</li>
                  <li>Au moins un Dirigeant requis</li>
                  <li>La somme des parts (Dirigeants + associés) doit égaler 100%</li>
                  <li>Le gérant peut aussi être Dirigeant ou associé</li>
                  {isAdministrateurAvailable() && (
                    <li className="text-purple-700 font-medium">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-purple-100 text-purple-800 mr-1">
                        SA/SAS
                      </span>
                      Rôle Administrateur disponible (sans parts)
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message de succès pour l'upload de fichier */}
      {fileUploadSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-sm sm:text-sm font-medium text-green-800">{fileUploadSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Erreurs de validation */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <h3 className="text-sm sm:text-sm font-medium text-red-800">Erreurs à corriger</h3>
              <div className="mt-1.5 sm:mt-2 text-sm sm:text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
              {/* Message d'aide pour les documents manquants */}
              {errors.some(error => error.includes('type de pièce et document sont obligatoires') || 
                                   error.includes('casier judiciaire requis') || 
                                   error.includes('extrait de naissance requis')) && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="h-4 w-4 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm sm:text-sm font-medium text-blue-800 mb-1">💡 Comment corriger ces erreurs :</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Cliquez sur le bouton <strong>"Modifier"</strong> (icône crayon) du participant concerné</li>
                        <li>• Remplissez tous les champs obligatoires marqués d'un astérisque (*)</li>
                        <li>• Téléchargez tous les documents requis selon votre rôle</li>
                        <li>• Sauvegardez les modifications avant de continuer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de rôle utilisateur - masqué pour les entreprises individuelles */}
      {showUserRoleForm && data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-blue-800">Définissez votre rôle dans l'entreprise</h3>
          </div>
          
          {/* Message contextuel selon isForSelf */}
          {data.personalInfo?.isForSelf ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm sm:text-sm font-medium text-green-800">Données automatiques</span>
              </div>
              <p className="text-sm sm:text-sm text-green-700">
                Vos informations personnelles seront automatiquement récupérées depuis votre profil utilisateur 
                (nom, prénom, téléphone, email, lieu de naissance, nationalité, etc.).
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm sm:text-sm font-medium text-amber-800">Données saisies manuellement</span>
              </div>
              <p className="text-sm sm:text-sm text-amber-700">
                Les informations que vous avez saisies dans le formulaire précédent seront utilisées 
                pour créer ce participant dans l'entreprise.
              </p>
            </div>
          )}
          
          <p className="text-sm sm:text-sm text-blue-700 mb-3 sm:mb-4">
            En tant que créateur de cette entreprise, vous devez d'abord définir votre rôle avant d'ajouter d'autres participants.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <label className="text-sm sm:text-sm font-medium text-blue-800">Votre rôle :</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as EntrepriseRole)}
              className="px-3 py-2 sm:py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-investmali-accent focus:border-transparent bg-white text-sm sm:text-base"
            >
              {(data.companyInfo?.typeEntreprise as TypeEntreprise) === 'ENTREPRISE_INDIVIDUELLE' ? (
                <option value="PROMOTEUR">Promoteur</option>
              ) : (
                <>
                  <option value="GERANT">Gérant</option>
                  <option value="ASSOCIE">Associé</option>
                  {isAdministrateurAvailable() && (
                    <option value="ADMINISTRATEUR">Administrateur</option>
                  )}
                </>
              )}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddUserAsParticipant}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {data.personalInfo?.isForSelf ? 'Confirmer mon rôle (données automatiques)' : 'Confirmer mon rôle (données saisies)'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8">
        {/* Bouton d'ajout */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          {/* <h3 className="text-lg sm:text-xl font-semibold text-mali-dark">Liste des Participants</h3> */}
          {!showUserRoleForm && data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
            <button
              onClick={() => setShowPersonTypeModal(true)}
              className="bg-[#47c559] hover:bg-[#47c559]/90 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter une personne physique/morale
            </button>
          )}
        </div>

        {/* Liste des participants */}
        {data.participants && data.participants.length > 0 ? (
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {data.participants.map((participant, index) => (
              <div key={index} className="">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
                  {/* Section détaillée du participant - MASQUÉE */}
                  {false && (
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-sm font-medium ${getRoleColor(participant.role)}`}>
                        {getRoleLabel(participant.role)}
                      </span>
                      {/* Indicateur du type de personne */}
                      {participant.civilite === 'PERSONNE_MORALE' ? (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Personne morale
                        </span>
                      ) : (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Personne physique
                        </span>
                      )}
                      
                      {/* Indicateur de source des données */}
                      {participant.personId ? (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Données automatiques
                        </span>
                      ) : (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Données saisies
                        </span>
                      )}
                      {/* Documents - uniquement pour les personnes physiques - MASQUÉ */}
                      {false && participant.civilite !== 'PERSONNE_MORALE' && (
                        <div className="text-sm sm:text-sm text-gray-600">
                          <p><strong>Type de pièce:</strong> {participant.typePiece || 'Non spécifié'}</p>
                          <p><strong>Numéro:</strong> {participant.numeroPiece || 'Non spécifié'}</p>
                          <p><strong>Document:</strong> {participant.documentFile?.name || 'Non téléchargé'}</p>
                          {(participant.role === 'GERANT' || participant.role === 'PROMOTEUR') && data.personalInfo?.hasCriminalRecord && (
                            <p><strong>Casier judiciaire:</strong> {participant.casierJudiciaireFile?.name || 'Non téléchargé'}</p>
                          )}
                          {(participant.role === 'GERANT' || participant.role === 'PROMOTEUR') && !data.personalInfo?.hasCriminalRecord && (
                            <p><strong>Déclaration d'honneur:</strong> {participant.declarationHonneurFile?.name || participant.signatureDataUrl ? 'Générée avec signature' : 'Non téléchargée'}</p>
                          )}
                          {(participant.role === 'GERANT' || participant.role === 'PROMOTEUR') && data.personalInfo?.isMarried && (
                            <p><strong>Acte de mariage:</strong> {participant.acteMariageFile?.name || 'Non téléchargé'}</p>
                          )}
                          {(participant.role === 'GERANT' || participant.role === 'PROMOTEUR') && (
                            <p><strong>Extrait de naissance:</strong> {participant.extraitNaissanceFile?.name || 'Non téléchargé'}</p>
                          )}
                          {(participant.role === 'GERANT' || participant.role === 'PROMOTEUR') && (
                            <p><strong>Certificat de résidence:</strong> {participant.certificatResidenceFile?.name || 'Non téléchargé'}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Informations du participant */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 border border-gray-200">
                      <h5 className="text-sm sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        {participant.civilite === 'PERSONNE_MORALE' ? 'Informations de l\'entreprise' : 'Informations personnelles'}
                      </h5>
                      
                      {participant.civilite === 'PERSONNE_MORALE' ? (
                        /* Affichage pour personne morale - uniquement les champs du formulaire */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Dénomination: </span>
                            {participant.denominationEntreprise || participant.nom}
                          </div>
                          <div>
                            <span className="font-medium">Représentant légal - Nom: </span>
                            {participant.nom}
                          </div>
                          <div>
                            <span className="font-medium">Représentant légal - Prénom: </span>
                            {participant.prenom}
                          </div>
                          <div>
                            <span className="font-medium">Pays d'émission RCCM: </span>
                            {participant.paysEmissionRccm || 'Mali'}
                          </div>
                          <div>
                            <span className="font-medium">Rôle: </span>
                            {participant.role === 'GERANT' ? 'Gérant' : participant.role === 'PROMOTEUR' ? 'Promoteur' : 'Associé'}
                          </div>
                          <div>
                            <span className="font-medium">Parts: </span>
                            {participant.pourcentageParts}%
                          </div>
                        </div>
                      ) : (
                        /* Affichage pour personne physique */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Nom complet: </span>
                            {participant.prenom} {participant.nom}
                          </div>
                          <div>
                            <span className="font-medium">Email: </span>
                            {participant.email || 'Non spécifié'}
                          </div>
                          <div>
                            <span className="font-medium">Téléphone: </span>
                            {participant.telephone || 'Non spécifié'}
                          </div>
                          <div>
                            <span className="font-medium">Date de naissance: </span>
                            {participant.dateNaissance || 'Non spécifiée'}
                          </div>
                          <div>
                            <span className="font-medium">Lieu de naissance: </span>
                            {participant.lieuNaissance || 'Non spécifié'}
                          </div>
                          <div>
                            <span className="font-medium">Nationalité: </span>
                            {participant.nationnalite || 'Non spécifiée'}
                          </div>
                          <div>
                            <span className="font-medium">Civilité: </span>
                            {participant.civilite || 'Non spécifiée'}
                          </div>
                          <div>
                            <span className="font-medium">Sexe: </span>
                            {participant.sexe || 'Non spécifié'}
                          </div>
                          <div>
                            <span className="font-medium">Situation matrimoniale: </span>
                            {participant.situationMatrimoniale || 'Non spécifiée'}
                          </div>
                          <div>
                            <span className="font-medium">Localité: </span>
                            {participant.localite || 'Non spécifiée'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Parts: </span>
                        {participant.pourcentageParts}%
                      </div>
                      <div>
                        <span className="font-medium">Période: </span>
                        {participant.dateDebut} → {participant.dateFin === '9999-12-31' ? 'En cours' : participant.dateFin}
                      </div>
                      <div>
                        <span className="font-medium">Type pièce: </span>
                        {participant.typePiece || 'Non spécifié'}
                      </div>
                      <div>
                        <span className="font-medium">Numéro: </span>
                        {participant.numeroPiece || 'Non spécifié'}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-medium">Document: </span>
                        {participant.documentFile?.name || 'Aucun fichier'}
                      </div>
                    </div>
                  </div>
                  )}
                  
                  {/* Affichage simplifié du participant */}
                  {/* <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {participant.civilite === 'PERSONNE_MORALE' 
                        ? participant.denominationEntreprise || participant.nom
                        : `${participant.prenom} ${participant.nom}`
                      }
                    </div>
                  </div> */}
                  {/* <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleEditParticipant(index)}
                      className="text-blue-600 hover:text-blue-800 p-1 sm:p-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteParticipant(index)}
                      className="text-red-600 hover:text-red-800 p-1 sm:p-1.5"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500 mb-4 sm:mb-6">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm sm:text-base">Aucun participant ajouté</p>
            <p className="text-sm sm:text-sm">{showUserRoleForm ? 'Définissez d\'abord votre rôle ci-dessus' : 'Commencez par vous ajouter comme participant'}</p>
          </div>
        )}

        {/* Formulaire d'ajout/modification */}
        {showAddForm && !showUserRoleForm && (
          <div className="border-t pt-4 sm:pt-6">
            <h4 className="text-base sm:text-lg font-semibold text-mali-dark mb-3 sm:mb-4">
              {editingIndex !== null 
                ? selectedPersonType === 'morale'
                  ? 'Modifier une personne morale'
                  : 'Modifier une personne physique'
                : selectedPersonType === 'morale' 
                  ? 'Ajouter une personne morale'
                  : 'Ajouter une personne physique'
              }
            </h4>
            {/* Formulaire conditionnel selon le type de personne */}
            {selectedPersonType === 'morale' ? (
              /* Formulaire pour personne morale */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dénomination de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={moralePersonData.denominationEntreprise}
                    onChange={(e) => setMoralePersonData({ ...moralePersonData, denominationEntreprise: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    placeholder="Nom de l'entreprise"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Représentant légal - Nom *
                  </label>
                  <input
                    type="text"
                    value={moralePersonData.representantNom}
                    onChange={(e) => setMoralePersonData({ ...moralePersonData, representantNom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    placeholder="Nom du représentant légal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Représentant légal - Prénom *
                  </label>
                  <input
                    type="text"
                    value={moralePersonData.representantPrenom}
                    onChange={(e) => setMoralePersonData({ ...moralePersonData, representantPrenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    placeholder="Prénom du représentant légal"
                    required
                  />
                </div>

                {roleRequiresParts(moralePersonData.role) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pourcentage de parts *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={moralePersonData.part}
                      onChange={(e) => setMoralePersonData({ ...moralePersonData, part: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}

                {!roleRequiresParts(moralePersonData.role) && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-purple-800">Rôle sans parts</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Cette personne morale administrateur n'a pas de pourcentage de parts dans l'entreprise.
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays d'émission du RCCM *
                  </label>
                  <select
                    value={moralePersonData.paysEmissionRccm}
                    onChange={(e) => setMoralePersonData({ ...moralePersonData, paysEmissionRccm: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    required
                  >
                    {paysEmissionRccm.map((pays: {key: string, value: string}) => (
                      <option key={pays.key} value={pays.key}>
                        {pays.value}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Pays où l'entreprise est enregistrée au registre du commerce
                  </p>
                </div>

                {/* Document RCCM obligatoire pour les personnes morales */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document RCCM *
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#47c559] file:text-white hover:file:bg-[#47c559]/90"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validation de la taille (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            setErrors(['Le fichier RCCM ne doit pas dépasser 5MB']);
                            e.target.value = '';
                            return;
                          }
                          // Validation du type de fichier
                          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                          if (!allowedTypes.includes(file.type)) {
                            setErrors(['Format de fichier non autorisé. Utilisez PDF, JPG ou PNG']);
                            e.target.value = '';
                            return;
                          }
                        }
                        setMoralePersonData({ ...moralePersonData, rccmFile: file });
                      }}
                    />
                    {moralePersonData.rccmFile && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {moralePersonData.rccmFile.name}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Téléchargez le document RCCM de l'entreprise (PDF, JPG, PNG - Max 5MB)
                  </p>
                </div>

                {/* Champ de sélection du rôle */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle dans l'entreprise *
                  </label>
                  <select
                    value={moralePersonData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as EntrepriseRole;
                      // Empêcher les personnes morales d'être ADMINISTRATEUR
                      if (newRole === 'ADMINISTRATEUR') {
                        setErrors(['Une personne morale ne peut pas avoir le rôle ADMINISTRATEUR']);
                        return;
                      }
                      setMoralePersonData({ ...moralePersonData, role: newRole });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    required
                  >
                    <option value="ASSOCIE">Associé</option>
                    <option value="GERANT">Gérant</option>
                    <option value="PROMOTEUR">Promoteur</option>
                    {isAdministrateurAvailable() && (
                      <option value="ADMINISTRATEUR" disabled>Administrateur (non autorisé pour les personnes morales)</option>
                    )}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Sélectionnez le rôle de cette personne morale dans l'entreprise
                  </p>
                </div>
              </div>
            ) : (
              /* Formulaire pour personne physique complet */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.nom || ''}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    placeholder="Nom"
                    required
                  />
                  <input
                    type="text"
                    value={formData.prenom || ''}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    placeholder="Prénom"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
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
                      value={formData.telephone || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => setFormData({ ...formData, telephone: phone }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent transition-all duration-300 hover:border-[#47c559]/50"
                      placeholder={phonePlaceholder}
                      maxLength={phoneMaxLength}
                      required
                    />
                  </div>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    Entrez votre numéro sans le {selectedCountry.code} (ex: {selectedCountry.code === '+223' ? '77 00 00 01' : selectedCountry.code === '+33' ? '06 12 34 56 78' : selectedCountry.code === '+1' ? '555 123 4567' : 'XX XX XX XX'})
                  </p> */}
                </div>
              </div>

              {/* Téléphone 2 (optionnel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone 2 (optionnel)
                </label>
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
                      value={formData.telephone2 || ''}
                      onChange={(e) => handlePhoneChange(e.target.value, (phone) => setFormData({ ...formData, telephone2: phone }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent transition-all duration-300 hover:border-[#47c559]/50"
                      placeholder={phonePlaceholder}
                      maxLength={phoneMaxLength}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Adresse email (optionnel)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance * <span className="text-sm text-gray-500">(18 ans minimum)</span>
                </label>
                <input
                  type="date"
                  value={formData.dateNaissance || ''}
                  onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                  max={(() => {
                    const today = new Date();
                    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                />
                {/* <p className="text-xs text-gray-500 mt-1">Le participant doit avoir au moins 18 ans</p> */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu de naissance *
                </label>
                <input
                  type="text"
                  value={formData.lieuNaissance || ''}
                  onChange={(e) => setFormData({ ...formData, lieuNaissance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Lieu de naissance"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationalité *
                </label>
                <select
                  value={formData.nationnalite || ''}
                  onChange={(e) => setFormData({ ...formData, nationnalite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez une nationalité</option>
                  <option value="MALIENNE">Malienne</option>
                  <option value="FRANÇAISE">Française</option>
                  <option value="SÉNÉGALAISE">Sénégalaise</option>
                  <option value="IVOIRIENNE">Ivoirienne</option>
                  <option value="BURKINABÈ">Burkinabè</option>
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
                  <option value="AMÉRICAINE">Américaine</option>
                  <option value="BRITANNIQUE">Britannique</option>
                  <option value="ALLEMANDE">Allemande</option>
                  <option value="ITALIENNE">Italienne</option>
                  <option value="ESPAGNOLE">Espagnole</option>
                  <option value="PORTUGAISE">Portugaise</option>
                  <option value="BELGE">Belge</option>
                  <option value="NÉERLANDAISE">Néerlandaise</option>
                  <option value="SUISSE">Suisse</option>
                  <option value="CANADIENNE">Canadienne</option>
                  <option value="CHINOISE">Chinoise</option>
                  <option value="JAPONAISE">Japonaise</option>
                  <option value="INDIENNE">Indienne</option>
                  <option value="BRÉSILIENNE">Brésilienne</option>
                  <option value="ARGENTINE">Argentine</option>
                  <option value="MAROCAINE">Marocaine</option>
                  <option value="ALGÉRIENNE">Algérienne</option>
                  <option value="TUNISIENNE">Tunisienne</option>
                  <option value="ÉGYPTIENNE">Égyptienne</option>
                  <option value="LIBYENNE">Libyenne</option>
                  <option value="ÉTHIOPIENNE">Éthiopienne</option>
                  <option value="KÉNYANE">Kényane</option>
                  <option value="TANZANIENNE">Tanzanienne</option>
                  <option value="RWANDAISE">Rwandaise</option>
                  <option value="BURUNDAISE">Burundaise</option>
                  <option value="SOUDANAISE">Soudanaise</option>
                  <option value="SUD_SOUDANAISE">Sud-Soudanaise</option>
                  <option value="DJIBOUTIENNE">Djiboutienne</option>
                  <option value="SOMALIENNE">Somalienne</option>
                  <option value="ÉRYTHRÉENNE">Érythréenne</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Civilité *
                </label>
                <select
                  value={formData.civilite || ''}
                  onChange={(e) => setFormData({ ...formData, civilite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez une civilité</option>
                  <option value="MONSIEUR">Monsieur</option>
                  <option value="MADAME">Madame</option>
                  <option value="MADEMOISELLE">Mademoiselle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe *
                </label>
                <select
                  value={formData.sexe || ''}
                  onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un sexe</option>
                  <option value="MASCULIN">Masculin</option>
                  <option value="FEMININ">Féminin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Situation matrimoniale *
                </label>
                {(formData.role === 'GERANT' || formData.role === 'PROMOTEUR') ? (
                  <div>
                    <input
                      type="text"
                      value={data.personalInfo?.isMarried ? 'Marié(e)' : 'Célibataire'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      disabled
                    />
                    {/* <p className="text-xs text-gray-500 mt-1">
                      {data.personalInfo?.isMarried 
                        ? "Défini automatiquement selon votre réponse 'Êtes-vous marié(e) ?' = Oui"
                        : "Défini automatiquement selon votre réponse 'Êtes-vous marié(e) ?' = Non"
                      }
                    </p> */}
                  </div>
                ) : (
                  <select
                    value={formData.situationMatrimoniale || ''}
                    onChange={(e) => setFormData({ ...formData, situationMatrimoniale: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez une situation</option>
                    <option value="CELIBATAIRE">Célibataire</option>
                    <option value="MARIE">Marié(e)</option>
                    <option value="DIVORCE">Divorcé(e)</option>
                    <option value="VEUF">Veuf/Veuve</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as EntrepriseRole })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                      : 'border-gray-300 focus:ring-mali-emerald'
                  }`}
                  disabled={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'}
                  required
                >
                  {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? (
                    <option value="PROMOTEUR">Promoteur</option>
                  ) : (
                    <>
                      <option value="GERANT">Gérant</option>
                      <option value="ASSOCIE">Associé</option>
                      {isAdministrateurAvailable() && (
                        <option value="ADMINISTRATEUR">Administrateur</option>
                      )}
                    </>
                  )}
                </select>
                {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                  <p className="text-sm text-gray-500 mt-1">
                 
                  </p>
                )}
              </div>

              {roleRequiresParts(formData.role) && data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pourcentage de parts *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.pourcentageParts}
                    onChange={(e) => setFormData({ ...formData, pourcentageParts: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {!roleRequiresParts(formData.role) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-purple-800">Rôle sans parts</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Les administrateurs n'ont pas de pourcentage de parts dans l'entreprise. 
                    Ils exercent uniquement des fonctions administratives.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.dateFin === '9999-12-31' ? '' : formData.dateFin}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dateFin: e.target.value || '9999-12-31' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Laisser vide pour une relation en cours"
                />
                {/* <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour une relation en cours (sans date de fin)
                </p> */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de pièce d'identité *
                </label>
                <select
                  value={formData.typePiece || ''}
                  onChange={(e) => setFormData({ ...formData, typePiece: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un type de pièce</option>
                  <option value="CNI">Carte d'Identité Nationale</option>
                  <option value="PASSEPORT">Passeport</option>
                  <option value="CARTE_CONSULAIRE">Carte consulaire</option>
                  <option value="CARTE_ELECTEUR">Carte électorale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de la pièce (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.numeroPiece || ''}
                  onChange={(e) => setFormData({ ...formData, numeroPiece: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Numéro de la pièce d'identité (optionnel)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pieces d'identités *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const processedFile = await validateAndCompressFile(file, e.target);
                      if (processedFile) {
                        setFormData({ ...formData, documentFile: processedFile });
                      } else {
                        setFormData({ ...formData, documentFile: undefined });
                      }
                    } else {
                      setFormData({ ...formData, documentFile: undefined });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#47c559] file:text-white hover:file:bg-[#47c559]/90"
                  required
                />
                {formData.documentFile && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formData.documentFile.name}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Formats acceptés: PDF, JPG, JPEG, PNG (max 50MB)
                </p>
              </div>

              {/* Questions spécifiques aux gérants/promoteurs personnes physiques */}
              {(formData.role === 'GERANT' || formData.role === 'PROMOTEUR') && (selectedPersonType === 'physique' || formData.civilite !== 'PERSONNE_MORALE') && (
                <div className={`md:col-span-3 space-y-4 p-4 rounded-lg border ${formData.hasCriminalRecord === undefined ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                  <h5 className="text-sm font-medium text-gray-900">Questions spécifiques aux gérants</h5>
                  
                  {/* Question casier judiciaire */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className={`text-sm font-medium ${formData.hasCriminalRecord === undefined ? 'text-amber-800' : 'text-gray-700'}`}>
                      Avez-vous un extrait de casier judiciaire ? *
                    </span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, hasCriminalRecord: true})}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                          formData.hasCriminalRecord === true 
                            ? 'bg-[#47c559] text-white shadow-lg' 
                            : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                        }`}
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, hasCriminalRecord: false})}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                          formData.hasCriminalRecord === false 
                            ? 'bg-[#47c559] text-white shadow-lg' 
                            : 'bg-white/60  text-slate-700 border border-white/50 shadow-lg hover:shadow-sm'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Champ casier judiciaire pour les gérants ET promoteurs - affiché seulement si hasCriminalRecord === true */}
              {(formData.role === 'GERANT' || formData.role === 'PROMOTEUR') && formData.hasCriminalRecord === true && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Casier judiciaire *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const processedFile = await validateAndCompressFile(file, e.target);
                        if (processedFile) {
                          setFormData({ ...formData, casierJudiciaireFile: processedFile });
                        } else {
                          setFormData({ ...formData, casierJudiciaireFile: undefined });
                        }
                      } else {
                        setFormData({ ...formData, casierJudiciaireFile: undefined });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#47c559] file:text-white hover:file:bg-[#47c559]/90"
                    required
                  />
                  {formData.casierJudiciaireFile && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formData.casierJudiciaireFile.name}
                    </div>
                  )}
                  <p className="text-xm text-black-600 mt-1">
                    Obligatoire - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                  </p>
                </div>
              )}

              {/* Champ acte de mariage pour les gérants ET promoteurs - affiché seulement si marié (depuis étape 2) */}
              {(formData.role === 'GERANT' || formData.role === 'PROMOTEUR') && data.personalInfo?.isMarried === true && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acte de mariage *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormData({ ...formData, acteMariageFile: file });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-550"
                    required
                  />
                  <p className="text-sm text-black-600 mt-1">
                     Obligatoire si marié(e) - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                  </p>
                </div>
              )}

              {/* Champ extrait de naissance pour les gérants ET promoteurs */}
              {(formData.role === 'GERANT' || formData.role === 'PROMOTEUR') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extrait de naissance *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormData({ ...formData, extraitNaissanceFile: file });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#47c559] file:text-white hover:file:bg-[#47c559]/90"
                    required
                  />
                  {formData.extraitNaissanceFile && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formData.extraitNaissanceFile.name}
                    </div>
                  )}
                  <p className="text-sm text-black-600 mt-1">
                    Obligatoire - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                  </p>
                </div>
              )}

              {/* Champ certificat de résidence pour les gérants ET promoteurs */}
              {(formData.role === 'GERANT' || formData.role === 'PROMOTEUR') && (() => {
                const managerNationality = formData.nationnalite || data.personalInfo?.nationality || 'MALIENNE';
                const isRequired = managerNationality.toUpperCase() !== 'MALIENNE';
                
                return (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificat de résidence {isRequired ? '*' : '(optionnel)'}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setFormData({ ...formData, certificatResidenceFile: file });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
                      required={isRequired}
                    />
                    <p className={`text-sm mt-1 ${
                      isRequired 
                        ? 'text-green-600' 
                        : 'text-gray-500'
                    }`}>
                      {isRequired 
                        ? 'Obligatoire (nationalité non malienne) - Formats: PDF, JPG, JPEG, PNG (max 5MB)'
                        : 'Optionnel (nationalité malienne) - Formats: PDF, JPG, JPEG, PNG (max 5MB)'
                      }
                    </p>
                  </div>
                );
              })()}

              {/* Champ pièce de nationalité pour les entreprises individuelles */}
              {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (formData.role === 'PROMOTEUR') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificat de nationalité *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFormData({ ...formData, pieceNationaliteFile: file });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
                    required
                  />
                  <p className="text-sm text-black-600 mt-1">
                    Obligatoire - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                  </p>
                </div>
              )}

              {/* Bouton déclaration sur l'honneur pour les gérants ET promoteurs sans casier judiciaire */}
              {(formData.role === 'GERANT' || formData.role === 'PROMOTEUR') && formData.hasCriminalRecord === false && (
                <div className="md:col-span-2 mt-4">
                  <div className="bg-sky-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-sky-900 mb-2">
                          Pas de casier judiciaire ?
                        </h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Si vous n'avez pas d'extrait de casier judiciaire, vous pouvez faire une déclaration sur l'honneur selon l'article 45, 47 de l'Acte Uniforme OHADA.
                        </p>
                        <button
                          type="button"
                          onClick={handleDeclarationHonneur}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Faire une déclaration sur l'honneur
                        </button>
                        
                        {/* Zone de signature pour la déclaration sur l'honneur */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-sky-900 mb-3">
                            Signature de la déclaration sur l'honneur {!formData.declarationHonneurFile ? '*' : '(optionnel si document uploadé)'}
                          </label>
                          <SignatureCanvas
                            onSignatureChange={(dataUrl) => {
                              setFormData({ ...formData, signatureDataUrl: dataUrl || undefined });
                            }}
                            existingSignature={formData.signatureDataUrl}
                          />
                          <p className="text-sm text-black-600 mt-2">
                            {formData.declarationHonneurFile 
                              ? 'Signature optionnelle car vous avez uploadé une déclaration' 
                              : 'Signature obligatoire pour générer une déclaration sur l\'honneur'}
                          </p>
                        </div>
                        
                        {/* Champ d'upload pour la déclaration sur l'honneur générée (optionnel) */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            Téléverser la déclaration sur l'honneur (optionnel)
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setFormData({ ...formData, declarationHonneurFile: file });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#47c559] file:text-white hover:file:bg-[#47c559]/90"
                          />
                          {formData.declarationHonneurFile && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <strong>Fichier chargé:</strong> {formData.declarationHonneurFile.name}
                              </p>
                            </div>
                          )}
                          <p className="text-sm text-black-600 mt-1">
                             Uploadez le PDF généré ou un document scanné - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                          </p>
                          <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <strong>Astuce:</strong> Si vous uploadez une déclaration déjà signée, la signature ci-dessus devient optionnelle
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents supplémentaires pour les entreprises individuelles */}
              {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                <div className="md:col-span-3 mt-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Documents supplémentaires (Optionnel)
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newDoc = {
                            id: Date.now().toString(),
                            name: '',
                            file: null as File | null,
                            description: ''
                          };
                          setFormData({
                            ...formData,
                            autresDocuments: [...(formData.autresDocuments || []), newDoc]
                          });
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#47c559] hover:bg-[#47c559]/90 text-white text-sm font-medium rounded-lg transition-colors duration-300"
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

                    {formData.autresDocuments && formData.autresDocuments.length > 0 && (
                      <div className="space-y-4">
                        {formData.autresDocuments.map((doc, index) => (
                          <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Nom du document *
                                </label>
                                <input
                                  type="text"
                                  value={doc.name}
                                  onChange={(e) => {
                                    const updatedDocs = [...(formData.autresDocuments || [])];
                                    updatedDocs[index] = { ...doc, name: e.target.value };
                                    setFormData({ ...formData, autresDocuments: updatedDocs });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent"
                                  placeholder="Ex: Attestation de formation, Certificat..."
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Fichier *
                                </label>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const updatedDocs = [...(formData.autresDocuments || [])];
                                      updatedDocs[index] = { ...doc, file };
                                      setFormData({ ...formData, autresDocuments: updatedDocs });
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#47c559] file:text-white hover:file:bg-[#47c559]/90"
                                />
                                {doc.file && (
                                  <p className="text-sm text-green-600 mt-1">
                                    ✓ {doc.file.name}
                                  </p>
                                )}
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description (optionnel)
                                </label>
                                <textarea
                                  value={doc.description}
                                  onChange={(e) => {
                                    const updatedDocs = [...(formData.autresDocuments || [])];
                                    updatedDocs[index] = { ...doc, description: e.target.value };
                                    setFormData({ ...formData, autresDocuments: updatedDocs });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47c559] focus:border-transparent"
                                  placeholder="Description du document (optionnel)"
                                  rows={2}
                                />
                              </div>
                              
                              <div className="md:col-span-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedDocs = formData.autresDocuments?.filter((_, i) => i !== index) || [];
                                    setFormData({ ...formData, autresDocuments: updatedDocs });
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-300"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Boutons d'action conditionnels - masqués pour les entreprises individuelles */}
            {(data.companyInfo?.typeEntreprise as TypeEntreprise) !== 'ENTREPRISE_INDIVIDUELLE' && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    editingIndex !== null ? handleUpdateParticipant() : handleAddParticipant();
                  }}
                  className="bg-[#47c559] hover:bg-[#47c559]/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  {editingIndex !== null ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingIndex(null);
                    setSelectedPersonType(null);
                    setFormData({
                      personId: '',
                    nom: '',
                    prenom: '',
                    telephone: '',
                    telephone2: '',
                    email: '',
                    dateNaissance: '',
                    lieuNaissance: '',
                    nationnalite: '',
                    situationMatrimoniale: '',
                    role: (data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'PROMOTEUR' : 'GERANT') as EntrepriseRole,
                    pourcentageParts: 0,
                    dateDebut: new Date().toISOString().split('T')[0],
                    dateFin: '9999-12-31',
                    typePiece: '',
                    numeroPiece: '',
                    documentFile: undefined,
                    documentUrl: '',
                    casierJudiciaireFile: undefined,
                    acteMariageFile: undefined,
                    extraitNaissanceFile: undefined,
                    certificatResidenceFile: undefined,
                    declarationHonneurFile: undefined,
                    signatureDataUrl: undefined
                  });
                  setMoralePersonData({
                    denominationEntreprise: '',
                    representantNom: '',
                    representantPrenom: '',
                    part: 0,
                    paysEmissionRccm: 'MALI',
                    rccmFile: undefined,
                    role: 'ASSOCIE' as EntrepriseRole
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-300"
              >
                Annuler
              </button>
              </div>
            )}
          </div>
        )}

        {/* Résumé des parts - masqué pour les entreprises individuelles */}
        {data.participants && data.participants.length > 0 && (data.companyInfo?.typeEntreprise as TypeEntreprise) !== 'ENTREPRISE_INDIVIDUELLE' && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-mali-dark mb-4">Résumé des participations</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-violet-50 p-4 rounded-lg">
                <div className="text-sm text-violet-600 font-medium">Total des parts</div>
                <div className="text-2xl font-bold text-violet-800">
                  {data.participants
                    .filter(p => p.role === 'GERANT' || p.role === 'ASSOCIE')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0)
                    .toFixed(2)}%
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                Math.abs(100 - data.participants
                  .filter(p => p.role === 'GERANT' || p.role === 'ASSOCIE')
                  .reduce((sum, p) => sum + p.pourcentageParts, 0)) < 0.01 
                  ? 'bg-green-50' : 'bg-orange-50'
              }`}>
                <div className={`text-sm font-medium ${
                  Math.abs(100 - data.participants
                    .filter(p => p.role === 'GERANT' || p.role === 'ASSOCIE')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0)) < 0.01 
                    ? 'text-green-600' : 'text-orange-600'
                }`}>Parts restantes</div>
                <div className={`text-2xl font-bold ${
                  Math.abs(100 - data.participants
                    .filter(p => p.role === 'GERANT' || p.role === 'ASSOCIE')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0)) < 0.01 
                    ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {(100 - data.participants
                    .filter(p => p.role === 'GERANT' || p.role === 'ASSOCIE')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0))
                    .toFixed(2)}%
                </div>
              </div>
              {/* <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Dirigeants</div>
                <div className="text-2xl font-bold text-green-800">
                  {data.participants.filter(p => p.role === 'GERANT').length}
                </div>
              </div> */}
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600 font-medium">Gérants</div>
                <div className="text-2xl font-bold text-red-800">
                  {data.participants.filter(p => p.role === 'GERANT').length}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Associés</div>
                <div className="text-2xl font-bold text-blue-800">
                  {data.participants.filter(p => p.role === 'ASSOCIE').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de répartition automatique des parts - masqué pour les entreprises individuelles */}
        {data.participants.length > 0 && (data.companyInfo?.typeEntreprise as TypeEntreprise) !== 'ENTREPRISE_INDIVIDUELLE' && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex-1">
                <h5 className="text-sm sm:text-base font-medium text-yellow-800">Répartition automatique des parts</h5>
                <p className="text-sm sm:text-sm text-yellow-700 mt-0.5 sm:mt-1">
                  Répartir équitablement les parts restantes entre tous les participants éligibles
                </p>
              </div>
              <button
                onClick={handleAutoDistributeParts}
                className="px-3 sm:px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm sm:text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
              >
                Répartir automatiquement
              </button>
            </div>
          </div>
        )}

        {/* Modal de sélection du type de personne */}
        {showPersonTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-mali-dark mb-4">Type de personne à ajouter</h3>
              <p className="text-gray-600 mb-6">Choisissez le type de personne que vous souhaitez ajouter :</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedPersonType('physique');
                    setShowPersonTypeModal(false);
                    setShowAddForm(true);
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#47c559] hover:bg-[#47c559]/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#47c559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Personne physique</h4>
                      <p className="text-sm text-gray-500">Ajouter une personne individuelle</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setSelectedPersonType('morale');
                    setShowPersonTypeModal(false);
                    // Ouvrir le formulaire personne morale (sera ajouté après)
                    setShowAddForm(true);
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#47c559] hover:bg-[#47c559]/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#47c559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Personne morale</h4>
                      <p className="text-sm text-gray-500">Ajouter une entreprise avec représentant légal</p>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPersonTypeModal(false);
                    setSelectedPersonType(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          {/* Bouton de sauvegarde spécifique pour les entreprises individuelles */}
          {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
            <button
              onClick={async () => {
                // D'abord sauvegarder les modifications du participant si le formulaire est ouvert
                if (showAddForm && editingIndex !== null) {
                  handleUpdateParticipant();
                }
                
                // Attendre un peu pour que la sauvegarde se fasse
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const validationErrors = validateParticipants();
                setErrors(validationErrors);
                
                if (validationErrors.length > 0) {
                  return;
                }
                
                // Sauvegarder les données sans passer à l'étape suivante
                try {
                  setIsLoading(true);
                  console.log('💾 Sauvegarde des données de l\'entreprise individuelle');
                  
                  // Traiter les documents supplémentaires pour les entreprises individuelles
                  const promoteur = data.participants?.find(p => p.role === 'PROMOTEUR');
                  if (promoteur && promoteur.autresDocuments && promoteur.autresDocuments.length > 0) {
                    console.log('📎 Upload des documents supplémentaires pour le promoteur');
                    
                    // Pour les documents supplémentaires, nous devons d'abord avoir une entreprise créée
                    // Cette fonctionnalité sera disponible après la création de l'entreprise
                    console.log('ℹ️ Documents supplémentaires seront uploadés après la création de l\'entreprise');
                    
                    // TODO: Implémenter l'upload des documents après la création de l'entreprise
                    // Stocker les documents dans le state pour les uploader plus tard
                  }
                  
                  setFileUploadSuccess('Données sauvegardées avec succès !');
                  setTimeout(() => setFileUploadSuccess(''), 3000);
                } catch (error) {
                  console.error('Erreur lors de la sauvegarde:', error);
                  setErrors(['Erreur lors de la sauvegarde des données']);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full bg-[#47c559] hover:bg-[#47c559]/90 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 mb-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sauvegarde en cours...
                </div>
              ) : (
                'Sauvegarder les informations'
              )}
            </button>
          )}
          
          {/* Masquer le bouton pour les entreprises individuelles */}
          {data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="w-full bg-[#47c559] hover:bg-[#47c559]/90 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Création des associés...
                </div>
              ) : (
                'Continuer vers l\'etape suivante'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsStep;
