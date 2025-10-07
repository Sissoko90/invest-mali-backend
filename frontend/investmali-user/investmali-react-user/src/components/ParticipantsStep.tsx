import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BusinessCreationData, Participant, EntrepriseRole } from './BusinessCreation';
import SignatureCanvas from './SignatureCanvas';

interface ParticipantsStepProps {
  data: BusinessCreationData;
  updateData: (field: keyof BusinessCreationData, value: any) => void;
  onNext: () => void;
}

const ParticipantsStep: React.FC<ParticipantsStepProps> = ({ data, updateData, onNext }) => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);

  // Fonction pour ouvrir la déclaration sur l'honneur dans une nouvelle fenêtre
  const handleDeclarationHonneur = () => {
    // Vérifier que les champs nom et prénom sont remplis
    if (!formData.nom || !formData.prenom) {
      setErrors(['Veuillez remplir le nom et le prénom avant de faire une déclaration sur l\'honneur.']);
      return;
    }
    
    // Vérifier que la signature est présente
    if (!formData.signatureDataUrl) {
      setErrors(['Veuillez signer la déclaration sur l\'honneur avant de la générer.']);
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

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showUserRoleForm, setShowUserRoleForm] = useState(false);
  // Rôle par défaut selon le type d'entreprise
  const defaultRole = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'DIRIGEANT' : 'ASSOCIE';
  const [userRole, setUserRole] = useState<EntrepriseRole>(defaultRole);
  const [formData, setFormData] = useState<Participant>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    dateNaissance: '',
    lieuNaissance: '',
    role: defaultRole,
    pourcentageParts: 0,
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '9999-12-31', // Date par défaut pour relation courante
    typePiece: '',
    numeroPiece: '',
    documentFile: undefined,
    documentUrl: '',
    casierJudiciaireFile: undefined,
    declarationHonneurFile: undefined,
    extraitNaissanceFile: undefined,
    acteMariageFile: undefined,
    signatureDataUrl: undefined
  });

  // Fonction utilitaire pour valider et compresser les fichiers
  const validateAndCompressFile = async (file: File, inputElement: HTMLInputElement): Promise<File | undefined> => {
    const maxSize = 50 * 1024 * 1024; // 50MB en bytes
    const mysqlLimit = 1 * 1024 * 1024; // 1MB limite MySQL actuelle
    
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux. Taille maximum autorisée : 50MB');
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
          alert(`Image compressée avec succès ! Nouvelle taille : ${newSizeMB}MB`);
          return compressedFile;
        } catch (error) {
          console.error('Erreur lors de la compression:', error);
          alert('Erreur lors de la compression. Le fichier original sera utilisé.');
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
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileUploadSuccess, setFileUploadSuccess] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà dans les participants
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isUserInParticipants = data.participants?.some(p => p.personId === currentUser.personne_id) || false;

  // Mettre à jour le rôle par défaut quand le type d'entreprise change
  React.useEffect(() => {
    const newDefaultRole = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'DIRIGEANT' : 'ASSOCIE';
    setUserRole(newDefaultRole);
    setFormData(prev => ({ ...prev, role: newDefaultRole, pourcentageParts: newDefaultRole === 'DIRIGEANT' && data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 100 : prev.pourcentageParts }));
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
        validationErrors.push('Une entreprise individuelle ne peut avoir qu\'un seul participant (le dirigeant)');
      }

      // 2. Le seul rôle autorisé est DIRIGEANT
      const nonDirigeants = participants.filter(p => p.role !== 'DIRIGEANT');
      if (nonDirigeants.length > 0) {
        validationErrors.push('Pour une entreprise individuelle, le seul rôle autorisé est "Dirigeant"');
      }

      // 3. Le dirigeant doit avoir 100% des parts
      const dirigeant = participants.find(p => p.role === 'DIRIGEANT');
      if (dirigeant && Math.abs(dirigeant.pourcentageParts - 100) > 1) {
        validationErrors.push('Le dirigeant d\'une entreprise individuelle doit avoir 100% des parts');
      }

      // 4. Vérifier les documents requis (mêmes que pour un gérant)
      participants.forEach((p, idx) => {
        const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
        if (!p.typePiece || !p.numeroPiece || !p.documentFile) {
          validationErrors.push(`${label}: type de pièce, numéro et document sont obligatoires`);
        }
        // Documents requis comme pour un gérant
        if (data.personalInfo?.hasCriminalRecord && !p.casierJudiciaireFile) {
          validationErrors.push(`${label}: casier judiciaire requis`);
        }
        if (!data.personalInfo?.hasCriminalRecord && !p.declarationHonneurFile) {
          validationErrors.push(`${label}: déclaration d'honneur requise (sans casier judiciaire)`);
        }
        if (data.personalInfo?.isMarried && !p.acteMariageFile) {
          validationErrors.push(`${label}: acte de mariage requis (si marié)`);
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
    const Dirigeants = participants.filter(p => p.role === 'DIRIGEANT');
    if (Dirigeants.length === 0) {
      validationErrors.push('Au moins un dirigeant est requis');
    }

    // Vérifier que la somme des parts = 100%
    const totalParts = participants
      .filter(p => p.role === 'DIRIGEANT' || p.role === 'ASSOCIE' || p.role === 'GERANT')
      .reduce((sum, p) => sum + p.pourcentageParts, 0);
    
    if (Math.abs(totalParts - 100) > 1) {
      validationErrors.push(`La somme des parts doit être égale à 100% (actuellement: ${totalParts.toFixed(2)}%)`);
    }

    // Vérifier pièces d'identité et documents pour chaque participant
    participants.forEach((p, idx) => {
      const label = p.prenom && p.nom ? `${p.prenom} ${p.nom}` : `Participant ${idx + 1}`;
      if (!p.typePiece || !p.numeroPiece || !p.documentFile) {
        validationErrors.push(`${label}: type de pièce, numéro et document sont obligatoires`);
      }
      if (p.role === 'GERANT' && data.personalInfo?.hasCriminalRecord && !p.casierJudiciaireFile) {
        validationErrors.push(`${label}: casier judiciaire requis (gérant)`);
      }
      if (p.role === 'GERANT' && !data.personalInfo?.hasCriminalRecord && !p.declarationHonneurFile) {
        validationErrors.push(`${label}: déclaration d'honneur requise (gérant sans casier judiciaire)`);
      }
      if (p.role === 'GERANT' && data.personalInfo?.isMarried && !p.acteMariageFile) {
        validationErrors.push(`${label}: acte de mariage requis (gérant marié)`);
      }
    });

    return validationErrors;
  };

  const handleAddParticipant = () => {
    // Validation des champs obligatoires
    if (!formData.nom || !formData.prenom || !formData.telephone || 
        !formData.dateNaissance || !formData.lieuNaissance || 
        !formData.typePiece || !formData.numeroPiece || !formData.documentFile) {
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

    // Validation spécifique pour les gérants ET dirigeants d'entreprise individuelle
    const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
    const requiresManagerDocuments = formData.role === 'GERANT' || (formData.role === 'DIRIGEANT' && isEntrepriseIndividuelle);
    
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

    const newParticipant: Participant = { 
      ...formData,
      // Pour les gérants et dirigeants d'entreprise individuelle, définir automatiquement la situation matrimoniale
      situationMatrimoniale: (formData.role === 'GERANT' || (formData.role === 'DIRIGEANT' && isEntrepriseIndividuelle))
        ? (data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE')
        : formData.situationMatrimoniale
    };
    const updatedParticipants = [...(data.participants || []), newParticipant];
    
    updateData('participants', updatedParticipants);
    setFormData({
      personId: '',
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      dateNaissance: '',
      lieuNaissance: '',
      nationnalite: '',
      situationMatrimoniale: '',
      role: 'DIRIGEANT' as EntrepriseRole,
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
      declarationHonneurFile: undefined,
      signatureDataUrl: undefined
    });
    setShowAddForm(false);
  };

  const handleEditParticipant = (index: number) => {
    setFormData(data.participants[index]);
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleUpdateParticipant = () => {
    if (editingIndex !== null) {
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
      
      const updatedParticipants = [...data.participants];
      const isEntrepriseIndividuelle = data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE';
      const updatedParticipant = { 
        ...formData,
        // Pour les gérants et dirigeants d'entreprise individuelle, définir automatiquement la situation matrimoniale
        situationMatrimoniale: (formData.role === 'GERANT' || (formData.role === 'DIRIGEANT' && isEntrepriseIndividuelle))
          ? (data.personalInfo?.isMarried ? 'MARIE' : 'CELIBATAIRE')
          : formData.situationMatrimoniale
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
        email: '',
        dateNaissance: '',
        lieuNaissance: '',
        nationnalite: '',
        situationMatrimoniale: '',
        role: 'DIRIGEANT' as EntrepriseRole,
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
    console.log('🔍 Données de localisation disponibles pour utilisateur:', {
      'data.personalInfo?.divisionId': data.personalInfo?.divisionId,
      'data.personalInfo?.localite': data.personalInfo?.localite,
      'data.companyInfo?.divisionCode': data.companyInfo?.divisionCode,
      'currentUser': currentUser
    });
    
    // Debug: Afficher tous les champs personnels récupérés
    console.log('🔍 DEBUG - Champs personnels récupérés pour participant:', {
      'birthPlace': data.personalInfo?.birthPlace,
      'nationality': data.personalInfo?.nationality,
      'civility': data.personalInfo?.civility,
      'sexe': data.personalInfo?.sexe,
      'situationMatrimoniale': data.personalInfo?.situationMatrimoniale,
      'data.personalInfo (all)': data.personalInfo
    });
    
    // Debug: Vérifier le rôle utilisateur
    console.log('🔍 DEBUG - Rôle utilisateur:', {
      'userRole': userRole,
      'userRole type': typeof userRole,
      'userRole length': userRole?.length
    });
    
    // Valider et nettoyer le rôle utilisateur
    const validRoles: EntrepriseRole[] = ['GERANT', 'DIRIGEANT', 'ASSOCIE'];
    const cleanUserRole = userRole?.toString().trim().toUpperCase() as EntrepriseRole;
    
    if (!validRoles.includes(cleanUserRole)) {
      setErrors(['Rôle utilisateur invalide. Veuillez sélectionner un rôle valide.']);
      return;
    }
    
    console.log('🔍 DEBUG - Rôle nettoyé:', cleanUserRole);

    const userParticipant: Participant = {
      personId: currentUser.personne_id,
      nom: currentUser.nom || '',
      prenom: currentUser.prenom || '',
      telephone: currentUser.telephone || '',
      email: currentUser.email || '',
      dateNaissance: data.personalInfo?.birthDate || '',
      lieuNaissance: data.personalInfo?.birthPlace || '',
      nationnalite: data.personalInfo?.nationality || 'MALIENNE',
      civilite: data.personalInfo?.civility || 'MONSIEUR',
      sexe: data.personalInfo?.sexe || 'MASCULIN',
      situationMatrimoniale: data.personalInfo?.situationMatrimoniale || 'CELIBATAIRE',
      role: cleanUserRole,
      pourcentageParts: data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 100 : (cleanUserRole === 'GERANT' ? 0 : 100), // Entreprise individuelle = 100%, Gérant n'a pas forcément de parts
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '9999-12-31',
      typePiece: '',
      numeroPiece: '',
      documentFile: undefined,
      documentUrl: '',
      casierJudiciaireFile: undefined,
      acteMariageFile: undefined,
      // Ajouter les champs de localisation depuis les données personnelles
      divisionId: data.personalInfo?.divisionId,
      division_id: data.personalInfo?.divisionId, // Utiliser divisionId comme fallback
      divisionCode: data.companyInfo?.divisionCode,
      localite: data.personalInfo?.localite
    };

    const updatedParticipants = [...(data.participants || []), userParticipant];
    updateData('participants', updatedParticipants);
    setShowUserRoleForm(false);
    // Ouvrir immédiatement le formulaire d'édition pour compléter la pièce et le document
    setEditingIndex(updatedParticipants.length - 1);
    setFormData(updatedParticipants[updatedParticipants.length - 1]);
    setShowAddForm(true);
  };

  const handleAutoDistributeParts = () => {
    // Calculer le total actuel des parts
    const eligibleParticipants = data.participants.filter(p => 
      p.role === 'DIRIGEANT' || p.role === 'ASSOCIE' || p.role === 'GERANT'
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
      if (participant.role === 'DIRIGEANT' || participant.role === 'ASSOCIE' || participant.role === 'GERANT') {
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

          const personRequest = {
            nom: associate.nom,
            prenom: associate.prenom,
            telephone1: associate.telephone || '',
            email: associate.email || '',
            dateNaissance: associate.dateNaissance || '',
            lieuNaissance: associate.lieuNaissance || '',
            nationnalite: associate.nationnalite || 'MALIENNE',
            sexe: associate.sexe || 'MASCULIN',
            situationMatrimoniale: associate.situationMatrimoniale || 'CELIBATAIRE',
            civilite: associate.civilite || 'MONSIEUR',
            // Ajouter les champs de localisation - utiliser null au lieu de undefined
            division_id: associate.divisionId || associate.division_id || data.personalInfo?.divisionId || null,
            divisionCode: associate.divisionCode || data.companyInfo?.divisionCode || null,
            localite: associate.localite || data.personalInfo?.localite || null,
            role: 'USER',
            entrepriseRole: 'ASSOCIE'
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
      case 'DIRIGEANT': return 'Dirigeant';
      case 'ASSOCIE': return 'Associé';
      default: return role;
    }
  };

  const getRoleColor = (role: EntrepriseRole): string => {
    switch (role) {
      case 'GERANT': return 'bg-red-100 text-red-800';
      case 'DIRIGEANT': return 'bg-blue-100 text-blue-800';
      case 'ASSOCIE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-mali-dark mb-2">Participants de l'Entreprise</h2>
      <p className="text-gray-600 mb-8">
        Commencez par définir votre rôle dans l'entreprise, puis ajoutez les autres participants selon les règles légales.
      </p>

      {/* Règles importantes */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Règles importantes</h3>
            <div className="mt-2 text-sm text-blue-700">
              {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? (
                <ul className="list-disc list-inside space-y-1">
                  <li>Un seul participant autorisé (le dirigeant)</li>
                  <li>Le dirigeant doit avoir 100% des parts</li>
                  <li>Documents requis : pièce d'identité, casier judiciaire ou déclaration d'honneur</li>
                  <li>Si marié(e) : acte de mariage obligatoire</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  <li>Un seul gérant autorisé par entreprise</li>
                  <li>Au moins un Dirigeant requis</li>
                  <li>La somme des parts (Dirigeants + associés) doit égaler 100%</li>
                  <li>Le gérant peut aussi être Dirigeant ou associé</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message de succès pour l'upload de fichier */}
      {fileUploadSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{fileUploadSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Erreurs de validation */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreurs à corriger</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de rôle utilisateur */}
      {showUserRoleForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-semibold text-blue-800">Définissez votre rôle dans l'entreprise</h3>
          </div>
          <p className="text-blue-700 mb-4">
            En tant que créateur de cette entreprise, vous devez d'abord définir votre rôle avant d'ajouter d'autres participants.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-blue-800">Votre rôle :</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as EntrepriseRole)}
              className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? (
                <option value="DIRIGEANT">Dirigeant</option>
              ) : (
                <>
                  <option value="DIRIGEANT">Dirigeant</option>
                  <option value="ASSOCIE">Associé</option>
                  <option value="GERANT">Gérant</option>
                </>
              )}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddUserAsParticipant}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Confirmer mon rôle
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Bouton d'ajout */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-mali-dark">Liste des Participants</h3>
          {!showUserRoleForm && data.companyInfo?.typeEntreprise !== 'ENTREPRISE_INDIVIDUELLE' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-mali-emerald hover:bg-mali-emerald/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter une personne physique/morale
            </button>
          )}
        </div>

        {/* Liste des participants */}
        {data.participants && data.participants.length > 0 ? (
          <div className="space-y-4 mb-6">
            {data.participants.map((participant, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(participant.role)}`}>
                        {getRoleLabel(participant.role)}
                      </span>
                      <div className="text-sm text-gray-600">
                        <p><strong>Type de pièce:</strong> {participant.typePiece || 'Non spécifié'}</p>
                        <p><strong>Numéro:</strong> {participant.numeroPiece || 'Non spécifié'}</p>
                        <p><strong>Document:</strong> {participant.documentFile?.name || 'Non téléchargé'}</p>
                        {participant.role === 'GERANT' && data.personalInfo?.hasCriminalRecord && (
                          <p><strong>Casier judiciaire:</strong> {participant.casierJudiciaireFile?.name || 'Non téléchargé'}</p>
                        )}
                        {participant.role === 'GERANT' && !data.personalInfo?.hasCriminalRecord && (
                          <p><strong>Déclaration sur l'honneur:</strong> {participant.declarationHonneurFile?.name || 'Non téléchargé'}</p>
                        )}
                        {participant.role === 'GERANT' && data.personalInfo?.isMarried && (
                          <p><strong>Acte de mariage:</strong> {participant.acteMariageFile?.name || 'Non téléchargé'}</p>
                        )}
                        {participant.role === 'GERANT' && (
                          <p><strong>Extrait de naissance:</strong> {participant.extraitNaissanceFile?.name || 'Non téléchargé'}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                      <div className="md:col-span-2">
                        <span className="font-medium">Document: </span>
                        {participant.documentFile ? participant.documentFile.name : 'Aucun fichier'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditParticipant(index)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteParticipant(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 mb-6">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Aucun participant ajouté</p>
            <p className="text-sm">{showUserRoleForm ? 'Définissez d\'abord votre rôle ci-dessus' : 'Commencez par vous ajouter comme participant'}</p>
          </div>
        )}

        {/* Formulaire d'ajout/modification */}
        {showAddForm && !showUserRoleForm && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-mali-dark mb-4">
              {editingIndex !== null ? 'Modifier le participant' : 'Ajouter un participant'}
            </h4>
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
                <input
                  type="tel"
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Numéro de téléphone"
                  required
                />
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
                  Date de naissance * <span className="text-xs text-gray-500">(18 ans minimum)</span>
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
                <p className="text-xs text-gray-500 mt-1">Le participant doit avoir au moins 18 ans</p>
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
                  Situation matrimoniale *
                </label>
                {formData.role === 'GERANT' ? (
                  <div>
                    <input
                      type="text"
                      value={data.personalInfo?.isMarried ? 'Marié(e)' : 'Célibataire'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {data.personalInfo?.isMarried 
                        ? "Défini automatiquement selon votre réponse 'Êtes-vous marié(e) ?' = Oui"
                        : "Défini automatiquement selon votre réponse 'Êtes-vous marié(e) ?' = Non"
                      }
                    </p>
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
                    <option value="DIRIGEANT">Dirigeant</option>
                  ) : (
                    <>
                      <option value="DIRIGEANT">Dirigeant</option>
                      <option value="ASSOCIE">Associé</option>
                      <option value="GERANT">Gérant</option>
                    </>
                  )}
                </select>
                {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Le rôle est fixé à "Dirigeant" pour une entreprise individuelle
                  </p>
                )}
              </div>

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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                      : 'border-gray-300 focus:ring-mali-emerald'
                  }`}
                  disabled={data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE'}
                  placeholder="0.00"
                  required
                />
                {data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Le dirigeant doit avoir 100% des parts pour une entreprise individuelle
                  </p>
                )}
              </div>

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
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour une relation en cours (sans date de fin)
                </p>
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
                  <option value="CNI">Carte Nationale d'Identité</option>
                  <option value="PASSEPORT">Passeport</option>
                  <option value="PERMIS_CONDUIRE">Permis de conduire</option>
                  <option value="CARTE_CONSULAIRE">Carte consulaire</option>
                  <option value="CARTE_ELECTEUR">Carte électorale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de la pièce *
                </label>
                <input
                  type="text"
                  value={formData.numeroPiece || ''}
                  onChange={(e) => setFormData({ ...formData, numeroPiece: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Numéro de la pièce d'identité"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document à télécharger *
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mali-emerald file:text-white hover:file:bg-mali-emerald/90"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés: PDF, JPG, JPEG, PNG (max 50MB)
                </p>
              </div>

              {/* Champ casier judiciaire pour les gérants ET dirigeants d'entreprise individuelle */}
              {((formData.role === 'GERANT') || (formData.role === 'DIRIGEANT' && data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE')) && data.personalInfo?.hasCriminalRecord && (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600"
                    required
                  />
                  <p className="text-xs text-red-600 mt-1">
                    📜 Obligatoire - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                  </p>
                </div>
              )}

              {/* Champ acte de mariage pour les gérants ET dirigeants d'entreprise individuelle */}
              {((formData.role === 'GERANT') || (formData.role === 'DIRIGEANT' && data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE')) && data.personalInfo?.isMarried && (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    required
                  />
                  <p className="text-xs text-purple-600 mt-1">
                    💍 Obligatoire si marié(e) - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                  </p>
                </div>
              )}

              {/* Champ extrait de naissance pour les gérants ET dirigeants d'entreprise individuelle */}
              {((formData.role === 'GERANT') || (formData.role === 'DIRIGEANT' && data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE')) && (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                    required
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    🎂 Obligatoire - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                  </p>
                </div>
              )}

              {/* Bouton déclaration sur l'honneur pour les gérants ET dirigeants d'entreprise individuelle sans casier judiciaire */}
              {((formData.role === 'GERANT') || (formData.role === 'DIRIGEANT' && data.companyInfo?.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE')) && !data.personalInfo?.hasCriminalRecord && (
                <div className="md:col-span-2 mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          📜 Pas de casier judiciaire ?
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
                          <label className="block text-sm font-medium text-blue-900 mb-3">
                            ✍️ Signature de la déclaration sur l'honneur *
                          </label>
                          <SignatureCanvas
                            onSignatureChange={(dataUrl) => {
                              setFormData({ ...formData, signatureDataUrl: dataUrl || undefined });
                            }}
                            existingSignature={formData.signatureDataUrl}
                          />
                          <p className="text-xs text-blue-600 mt-2">
                            📋 Signez directement ou uploadez une signature scannée
                          </p>
                        </div>
                        
                        {/* Champ d'upload pour la déclaration sur l'honneur générée (optionnel) */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            📄 Uploader la déclaration sur l'honneur (optionnel)
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setFormData({ ...formData, declarationHonneurFile: file });
                            }}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
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
                          <p className="text-xs text-blue-600 mt-1">
                            📋 Uploadez le PDF généré ou un document scanné - Formats: PDF, JPG, JPEG, PNG (max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingIndex !== null ? handleUpdateParticipant : handleAddParticipant}
                className="bg-mali-emerald hover:bg-mali-emerald/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
              >
                {editingIndex !== null ? 'Mettre à jour' : 'Ajouter'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingIndex(null);
                  setFormData({
                    personId: '',
                    nom: '',
                    prenom: '',
                    telephone: '',
                    email: '',
                    dateNaissance: '',
                    lieuNaissance: '',
                    nationnalite: '',
                    situationMatrimoniale: '',
                    role: 'DIRIGEANT' as EntrepriseRole,
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
                    declarationHonneurFile: undefined,
                    signatureDataUrl: undefined
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-300"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Résumé des parts */}
        {data.participants && data.participants.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-mali-dark mb-4">Résumé des participations</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-violet-50 p-4 rounded-lg">
                <div className="text-sm text-violet-600 font-medium">Total des parts</div>
                <div className="text-2xl font-bold text-violet-800">
                  {data.participants
                    .filter(p => p.role === 'DIRIGEANT' || p.role === 'ASSOCIE' || p.role === 'GERANT')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0)
                    .toFixed(2)}%
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                Math.abs(100 - data.participants
                  .filter(p => p.role === 'DIRIGEANT' || p.role === 'ASSOCIE' || p.role === 'GERANT')
                  .reduce((sum, p) => sum + p.pourcentageParts, 0)) < 0.01 
                  ? 'bg-green-50' : 'bg-orange-50'
              }`}>
                <div className={`text-sm font-medium ${
                  Math.abs(100 - data.participants
                    .filter(p => p.role === 'DIRIGEANT' || p.role === 'ASSOCIE' || p.role === 'GERANT')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0)) < 0.01 
                    ? 'text-green-600' : 'text-orange-600'
                }`}>Parts restantes</div>
                <div className={`text-2xl font-bold ${
                  Math.abs(100 - data.participants
                    .filter(p => p.role === 'DIRIGEANT' || p.role === 'ASSOCIE' || p.role === 'GERANT')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0)) < 0.01 
                    ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {(100 - data.participants
                    .filter(p => p.role === 'DIRIGEANT' || p.role === 'ASSOCIE' || p.role === 'GERANT')
                    .reduce((sum, p) => sum + p.pourcentageParts, 0))
                    .toFixed(2)}%
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Dirigeants</div>
                <div className="text-2xl font-bold text-green-800">
                  {data.participants.filter(p => p.role === 'DIRIGEANT').length}
                </div>
              </div>
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

        {/* Bouton de répartition automatique des parts */}
        {data.participants.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-yellow-800">Répartition automatique des parts</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  Répartir équitablement les parts restantes entre tous les participants éligibles
                </p>
              </div>
              <button
                onClick={handleAutoDistributeParts}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Répartir automatiquement
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full bg-mali-emerald hover:bg-mali-emerald/90 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Création des associés...
              </div>
            ) : (
              'Continuer vers les documents'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsStep;
