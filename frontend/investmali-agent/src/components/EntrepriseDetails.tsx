import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api.config';
import DocumentViewer from './DocumentViewer';
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  MapPinIcon,
  CalendarIcon,
  IdentificationIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TagIcon,
  ScaleIcon,
  BriefcaseIcon,
  ChartBarIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  DevicePhoneMobileIcon,
  CakeIcon,
  HeartIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
  HomeIcon,
  MapIcon,
  BuildingLibraryIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface EntrepriseDetailsProps {
  entrepriseId: string;
  onBack?: () => void;
  onStatusUpdate?: (id: string, status: string) => void;
  readOnly?: boolean;
}

interface Membre {
  id?: string; // ID du EntrepriseMembre (relation)
  personId: string;
  nom: string;
  prenom: string;
  role: string;
  pourcentageParts: number;
  dateDebut: string;
  dateFin: string;
  email?: string;
  telephone?: string;
  telephone1?: string;
  telephone2?: string;
  dateNaissance?: string;
  situationMatrimoniale?: boolean | string;
  situationMatrimonialeStr?: string;
  // Champs de localisation
  divisionCode?: string;
  divisionNom?: string;
  regionNom?: string;
  cercleNom?: string;
  arrondissementNom?: string;
  communeNom?: string;
  quartierNom?: string;
  // Champs spécifiques aux personnes morales
  paysEmissionRccm?: string;
  denominationEntreprise?: string;
  // Champs des conjoints (peut avoir plusieurs conjoints)
  conjoints?: Array<{
    id: string;
    prenom: string;
    nom: string;
    dateMariage: string;
    lieuMariage: string;
    regimeMatrimonial: string;
    clauseRestrictive: string;
  }>;
}

interface Document {
  id: string;
  numero?: string;
  typeDocument?: string;
  typePiece?: string;
  dateExpiration?: string | null;
  personneId?: string;
  entrepriseId?: string;
  url?: string;
  description?: string;
}

interface EntrepriseDetail {
  id: string;
  reference: string;
  nom: string;
  sigle: string;
  typeEntreprise: string;
  statutCreation: string;
  etapeValidation: string;
  formeJuridique: string;
  domaineActivite: string;
  domaineActiviteNr: string;
  domaineActiviteLabel: string;
  domaineActiviteSecondaire?: string;
  domaineActiviteSecondaireNr?: string;
  domaineActiviteSecondaireLabel?: string;
  statutSociete: boolean;
  divisionCode: string;
  divisionNom: string;
  regionNom: string | null;
  cercleNom: string | null;
  arrondissementNom: string | null;
  communeNom: string | null;
  quartierNom: string | null;
  membres: Membre[];
  creation: string;
  modification: string;
  banni: boolean;
  motifBannissement: string | null;
  dateBannissement: string | null;
}

const EntrepriseDetails: React.FC<EntrepriseDetailsProps> = ({ 
  entrepriseId, 
  onBack, 
  onStatusUpdate,
  readOnly = false 
}) => {
  const [entreprise, setEntreprise] = useState<EntrepriseDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editedEntreprise, setEditedEntreprise] = useState<any>(null);
  const [editingMembres, setEditingMembres] = useState(false);
  const [editedMembres, setEditedMembres] = useState<any[]>([]);
  const [activitesOptions, setActivitesOptions] = useState<Array<{key: string, value: string}>>([]);
  const [showActivitesDropdown, setShowActivitesDropdown] = useState(false);
  const [activiteSearchTerm, setActiviteSearchTerm] = useState('');
  const [missingDocuments, setMissingDocuments] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [uploadingTypePiece, setUploadingTypePiece] = useState<string | null>(null);
  const [uploadingDateExpiration, setUploadingDateExpiration] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadActivites = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/enums/domaine-activites-nr`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [EntrepriseDetails] Activités chargées:', data.length, 'options');
        console.log('📋 [EntrepriseDetails] Exemple de données:', data.slice(0, 3));
        console.log('🔍 [EntrepriseDetails] Structure premier élément:', data[0]);
        setActivitesOptions(data);
      } else {
        console.error('🔍 [EntrepriseDetails] Erreur HTTP activités:', response.status);
      }
    } catch (error) {
      console.error('🔍 [EntrepriseDetails] Erreur chargement activités:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger les détails de l'entreprise
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 [EntrepriseDetails] Données entreprise reçues:', data);
      console.log('🔍 [EntrepriseDetails] Membres:', data.membres);
      if (data.membres && data.membres.length > 0) {
        console.log('🔍 [EntrepriseDetails] Premier membre:', data.membres[0]);
        console.log('🔍 [EntrepriseDetails] Localisations membre:', {
          regionNom: data.membres[0].regionNom,
          cercleNom: data.membres[0].cercleNom,
          communeNom: data.membres[0].communeNom,
          quartierNom: data.membres[0].quartierNom
        });
        console.log('🔍 [EntrepriseDetails] Conjoints:', data.membres[0].conjoints);
      }
      setEntreprise(data);

      // Charger les documents
      let uniqueDocuments: Document[] = [];
      try {
        const docResponse = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
          }
        });

        if (docResponse.ok) {
          const docData = await docResponse.json();
          // Filtrer les doublons basés sur l'ID
          uniqueDocuments = docData.filter((doc: any, index: number, self: any[]) => 
            index === self.findIndex((d: any) => d.id === doc.id)
          );
          setDocuments(uniqueDocuments);
        } else {
          setDocuments([]);
        }
      } catch (docError) {
        // Les documents ne sont pas critiques, on continue
        setDocuments([]);
      }
      
      // Valider les documents après le chargement
      if (data && data.membres) {
        console.log('🔍 [VALIDATION] Documents chargés:', uniqueDocuments);
        console.log('🔍 [VALIDATION] Premier document:', uniqueDocuments[0]);
        validateDocuments(data, uniqueDocuments);
      }
    } catch (error) {
      setError('Erreur lors du chargement des détails de l\'entreprise');
      setEntreprise(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadActivites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrepriseId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.activite-dropdown-container')) {
        setShowActivitesDropdown(false);
      }
    };
    
    if (showActivitesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActivitesDropdown]);

  // Fonction pour valider les documents requis
  const validateDocuments = (entrepriseData: any, docs: Document[]) => {
    const missing: string[] = [];
    
    console.log('🔍 [VALIDATION] Début validation - Nombre de documents:', docs.length);
    
    // Pour chaque membre (gérant/promoteur)
    entrepriseData.membres?.forEach((membre: Membre) => {
      const membreRole = membre.role?.toUpperCase();
      
      console.log(`🔍 [VALIDATION] Membre: ${membre.prenom} ${membre.nom}, Role: ${membreRole}, PersonId: ${membre.personId}`);
      
      // Vérifier si c'est un gérant ou promoteur
      if (membreRole === 'GERANT' || membreRole === 'PROMOTEUR') {
        const membreDocs = docs.filter(d => d.personneId === membre.personId);
        
        console.log(`🔍 [VALIDATION] Documents pour ${membre.prenom} ${membre.nom}:`, membreDocs.length);
        membreDocs.forEach(d => {
          console.log(`  - TypeDocument: ${d.typeDocument}, TypePiece: ${d.typePiece}`);
        });
        
        // 1. Pièce d'identité (obligatoire)
        const hasPieceIdentite = membreDocs.some(d => {
          const result = d.typePiece && ['PASSEPORT', 'CNI', 'CARTE_CONSULAIRE', 'CARTE_ELECTEUR'].includes(d.typePiece);
          console.log(`  - Vérif pièce identité: typePiece="${d.typePiece}", result=${result}`);
          return result;
        });
        console.log(`✅ [VALIDATION] Pièce identité: ${hasPieceIdentite}`);
        if (!hasPieceIdentite) {
          missing.push(`${membre.prenom} ${membre.nom}: Pièce d'identité`);
        }
        
        // 2. Extrait de naissance (obligatoire pour gérant/promoteur)
        const hasExtraitNaissance = membreDocs.some(d => 
          d.typeDocument === 'EXTRAIT_NAISSANCE'
        );
        if (!hasExtraitNaissance) {
          missing.push(`${membre.prenom} ${membre.nom}: Extrait de naissance`);
        }
        
        // 3. Certificat de nationalité (obligatoire)
        const hasCertificatNationalite = membreDocs.some(d => 
          d.typeDocument === 'PIECE_NATIONALITE'
        );
        if (!hasCertificatNationalite) {
          missing.push(`${membre.prenom} ${membre.nom}: Certificat de nationalité`);
        }
        
        // 4. Certificat de résidence (obligatoire)
        const hasCertificatResidence = membreDocs.some(d => 
          d.typeDocument === 'CERTIFICAT_RESIDENCE'
        );
        if (!hasCertificatResidence) {
          missing.push(`${membre.prenom} ${membre.nom}: Certificat de résidence`);
        }
        
        // 5. Casier judiciaire OU déclaration sur l'honneur (obligatoire)
        const hasCasierOrDeclaration = membreDocs.some(d => 
          d.typeDocument && ['CASIER_JUDICIAIRE', 'DECLARATION_HONNEUR'].includes(d.typeDocument)
        );
        if (!hasCasierOrDeclaration) {
          missing.push(`${membre.prenom} ${membre.nom}: Casier judiciaire ou Déclaration sur l'honneur`);
        }
        
        // 6. Acte de mariage (si marié)
        const isMarie = membre.situationMatrimonialeStr?.toUpperCase() === 'MARIE' || 
                        membre.situationMatrimoniale === true;
        if (isMarie) {
          const nombreConjoints = membre.conjoints?.length || 0;
          const acteMariageDocs = membreDocs.filter(d => 
            d.typeDocument === 'ACTE_MARIAGE'
          );
          
          if (acteMariageDocs.length < nombreConjoints) {
            missing.push(`${membre.prenom} ${membre.nom}: Acte(s) de mariage (${acteMariageDocs.length}/${nombreConjoints})`);
          }
        }
      }
    });
    
    setMissingDocuments(missing);
  };


  const handleViewDocument = (documentId: string, documentName: string) => {
    setSelectedDocumentId(documentId);
    setSelectedDocumentName(documentName);
  };

  const handleCloseDocumentViewer = () => {
    setSelectedDocumentId(null);
    setSelectedDocumentName('');
  };

  const handleDownloadDocument = async (documentId: string, documentName: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/${documentId}/file`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || `document_${documentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const handleReplaceDocument = async (documentId: string, file: File, documentName: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/${documentId}/file`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      alert(`✅ Document "${documentName}" modifié avec succès!`);
      
      // Recharger les documents
      loadData();
    } catch (error) {
      console.error('❌ Erreur lors de la modification du document:', error);
      alert('Erreur lors de la modification du document');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'EN_ATTENTE': { 
        color: 'bg-[#2d85c9] text-white shadow-lg', 
        text: 'En attente',
        icon: ClockIcon
      },
      'EN_COURS': { 
        color: 'bg-sky-50 text-black shadow-lg', 
        text: 'En cours',
        icon: ArrowPathIcon
      },
      'VALIDEE': { 
        color: 'bg-green-600 text-white shadow-lg', 
        text: 'Validée',
        icon: CheckCircleIcon
      },
      'REFUSEE': { 
        color: 'bg-red-500 text-white shadow-lg', 
        text: 'Refusée',
        icon: XCircleIcon
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['EN_COURS'];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-2 rounded-xl text-base font-bold ${config.color} min-w-0 flex-shrink-0`}>
        <IconComponent className="w-5 h-5 mr-2" />
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'GERANT': { 
        color: 'bg-[#2d85c9] text-white shadow-lg', 
        text: 'Gérant',
        icon: UserCircleIcon
      },
      'PROMOTEUR': { 
        color: 'bg-[#2d85c9] text-white shadow-lg', 
        text: 'Promoteur',
        icon: BriefcaseIcon
      },
      'DIRIGEANT': { 
        color: 'bg-[#2d85c9] text-white shadow-lg', 
        text: 'Dirigeant',
        icon: ChartBarIcon
      },
      'ASSOCIE': { 
        color: 'bg-slate-600 text-white shadow-lg', 
        text: 'Associé',
        icon: UserGroupIcon
      },
      'ADMINISTRATEUR': { 
        color: 'bg-[#2d85c9] text-white shadow-lg', 
        text: 'Administrateur',
        icon: IdentificationIcon
      }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig['ASSOCIE'];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-2 rounded-xl text-base font-bold ${config.color} min-w-0 flex-shrink-0`}>
        <IconComponent className="w-5 h-5 mr-2" />
        {config.text}
      </span>
    );
  };

  const getDocumentTypeName = (type: string) => {
    if (!type) return 'Document';
    
    const typeNames = {
      'EXTRAIT_NAISSANCE': 'Extrait de naissance',
      'CERTIFICAT_RESIDENCE': 'Certificat de résidence',
      'CASIER_JUDICIAIRE': 'Casier judiciaire',
      'STATUS_SOCIETE': 'Statuts de société',
      'STATUTS_SOCIETE': 'Statuts de société',
      'ACTE_MARIAGE': 'Acte de mariage',
      'DECLARATION_HONNEUR': 'Déclaration sur l\'honneur',
      'REGISTRE_COMMERCE': 'Registre de commerce',
      'RCCM': 'RCCM',
      'NINA': 'Nina',
      'PIECE_NATIONALITE': 'Certificat de nationalité',
      'AUTRES': 'Autres',
    };
    
    return typeNames[type.toUpperCase() as keyof typeof typeNames] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Fonction pour grouper les documents par type
  const groupDocumentsByType = (docs: Document[]) => {
    const grouped = docs.reduce((acc, doc) => {
      const docType = doc.typeDocument || doc.typePiece || 'AUTRES';
      const typeName = doc.typeDocument ? 
        getDocumentTypeName(docType) : 
        getPieceTypeName(docType);
      
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

    return grouped;
  };

  const getPieceTypeName = (type: string) => {
    if (!type) return 'Pièce d\'identité';
    
    const typeNames = {
      'PASSEPORT': 'Passeport',
      'CNI': 'Carte Nationale d\'Identité',
      'CARTE_CONSULAIRE': 'Carte consulaire',
      'CARTE_ELECTEUR': 'Carte d\'électeur',
      'CARTE_IDENTITE': 'Carte d\'identité',
      'ACTE_NAISSANCE': 'Acte de naissance',
      'PIECE_NATIONALITE': 'Certificat de nationalité'
    };
    
    return typeNames[type.toUpperCase() as keyof typeof typeNames] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const isPersonneMorale = (membre: Membre) => {
    return membre.denominationEntreprise && membre.paysEmissionRccm;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center max-w-md mx-auto">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 border-4 border-[#2d85c9]/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#2d85c9] border-t-transparent rounded-full animate-spin absolute top-0"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BuildingOfficeIcon className="w-8 h-8 text-[#2d85c9] animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#2d85c9] mb-3">
            Chargement des détails
          </h3>
          <p className="text-slate-500 text-base">Récupération des informations de l'entreprise...</p>
          <div className="flex justify-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-[#2d85c9] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#2d85c9] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#2d85c9] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entreprise) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center max-w-md mx-auto">
          <div className="relative inline-block mb-6">
            <div className="p-4 bg-red-100 rounded-full shadow-lg">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-600 mb-3">
            Erreur de chargement
          </h3>
          <p className="text-slate-600 text-base mb-6">{error || "Impossible de charger les détails de l'entreprise"}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#2d85c9] text-white font-bold rounded-xl shadow-lg hover:bg-[#2563a3] transition-all duration-200 text-base"
          >
            <div className="flex items-center space-x-2">
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Retour à la liste</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden min-w-0 max-w-full">
      {/* Header moderne */}
      <div className="bg-white shadow-2xl border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 mb-4 lg:mb-0">
              {!readOnly && onBack && (
                <button
                  onClick={onBack}
                  className="group px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>Retour</span>
                  </div>
                </button>
              )}
              
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <div className="relative">
                  <div className="p-3 sm:p-4 bg-[#2d85c9] rounded-3xl shadow-xl">
                    <BuildingOfficeIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#2d85c9] rounded-full animate-pulse"></div>
                </div>
                
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2d85c9] break-words">
                    {entreprise.nom || 'Entreprise'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                    <div className="px-4 py-2 bg-[#2d85c9]/10 rounded-full border border-[#2d85c9]/30">
                      <span className="text-[#2d85c9] font-semibold text-base">Réf: {entreprise.reference}</span>
                    </div>
                    {getStatusBadge(entreprise.statutCreation || 'EN_COURS')}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Contenu principal moderne */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 w-full">
        
        {/* Alerte des documents manquants */}
        {missingDocuments.length > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-4 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-800 mb-3">Documents manquants</h3>
                <p className="text-base text-red-700 mb-4">
                  Les documents suivants sont requis pour compléter ce dossier :
                </p>
                <ul className="space-y-2 mb-4">
                  {missingDocuments.map((doc, index) => (
                    <li key={index} className="flex items-start text-red-700">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      <span className="text-base font-medium">{doc}</span>
                    </li>
                  ))}
                </ul>
                {!readOnly && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Uploader les documents manquants
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 w-full min-w-0">
          
          {/* Colonne principale */}
          <div className="xl:col-span-2 space-y-4">
            
            {/* Informations générales modernisées */}
            <div className="bg-white rounded-2xl shadow-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2d85c9]">
                    Informations générales
                  </h2>
                </div>
                {!readOnly && !editingGeneral ? (
                  <button
                    onClick={() => {
                      setEditedEntreprise({...entreprise});
                      setEditingGeneral(true);
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Modifier</span>
                    </div>
                  </button>
                ) : !readOnly && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingGeneral(false)}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('📤 [SAVE GENERAL] Données envoyées:', editedEntreprise);
                          const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(editedEntreprise)
                          });
                          if (response.ok) {
                            const data = await response.json();
                            console.log('✅ [SAVE GENERAL] Réponse:', data);
                            alert('✅ Informations modifiées avec succès!');
                            setEditingGeneral(false);
                            loadData();
                          } else {
                            const errorData = await response.text();
                            console.error('❌ [SAVE GENERAL] Erreur:', errorData);
                            
                            // Essayer de parser le message d'erreur du backend
                            let errorMessage = 'Erreur lors de la modification';
                            try {
                              const errorJson = JSON.parse(errorData);
                              errorMessage = errorJson.message || errorJson.error || errorMessage;
                            } catch {
                              // Si ce n'est pas du JSON, utiliser le texte brut s'il contient un message utile
                              if (errorData && errorData.length < 200) {
                                errorMessage = errorData;
                              }
                            }
                            
                            alert('❌ ' + errorMessage);
                          }
                        } catch (error) {
                          console.error('❌ [SAVE GENERAL] Exception:', error);
                          alert('❌ Erreur lors de la modification');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-colors"
                    >
                      Sauvegarder
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span>{entreprise.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'Nom de l\'entreprise' : 'Nom de l\'entreprise'}</span>
                  </label>
                  {editingGeneral ? (
                    <input
                      type="text"
                      value={editedEntreprise?.nom || ''}
                      onChange={(e) => setEditedEntreprise({...editedEntreprise, nom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 break-words">
                      {entreprise.nom || (() => {
                        const gerant = entreprise.membres?.find(m => m.role === 'GERANT' || m.role === 'PROMOTEUR');
                        return gerant ? `${gerant.prenom} ${gerant.nom}` : 'Non renseigné';
                      })()}
                    </p>
                  )}
                </div>
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <TagIcon className="w-4 h-4" />
                    <span>Sigle</span>
                  </label>
                  {editingGeneral ? (
                    <input
                      type="text"
                      value={editedEntreprise?.sigle || ''}
                      onChange={(e) => setEditedEntreprise({...editedEntreprise, sigle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                    />
                  ) : (
                    <p className="text-base font-semibold text-slate-800 break-words">{entreprise.sigle || 'Non spécifié'}</p>
                  )}
                </div>
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <ScaleIcon className="w-4 h-4" />
                    <span>Forme juridique</span>
                  </label>
                  <p className="text-base font-semibold text-slate-800 break-words">{entreprise.formeJuridique}</p>
                </div>
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <BuildingLibraryIcon className="w-4 h-4" />
                    <span>Type d'entreprise</span>
                  </label>
                  <p className="text-base font-semibold text-slate-800 break-words">{entreprise.typeEntreprise}</p>
                </div>
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>Activité principale</span>
                  </label>
                  {editingGeneral ? (
                    <div className="relative activite-dropdown-container">
                      <input
                        type="text"
                        value={activiteSearchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setActiviteSearchTerm(value);
                          setShowActivitesDropdown(true);
                          console.log('🔍 [DROPDOWN] onChange - showActivitesDropdown:', true, 'activitesOptions:', activitesOptions.length);
                        }}
                        onFocus={() => {
                          setShowActivitesDropdown(true);
                          console.log('🔍 [DROPDOWN] onFocus - showActivitesDropdown:', true, 'activitesOptions:', activitesOptions.length);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                        placeholder="Rechercher une activité..."
                      />
                      {showActivitesDropdown && (() => {
                        const filteredActivites = activitesOptions
                          .filter(a => 
                            !activiteSearchTerm || 
                            a.value.toLowerCase().includes(activiteSearchTerm.toLowerCase()) ||
                            a.key.toLowerCase().includes(activiteSearchTerm.toLowerCase())
                          );
                        console.log('🔍 [DROPDOWN] Activités filtrées:', filteredActivites.length, 'sur', activitesOptions.length, 'searchTerm:', activiteSearchTerm);
                        return (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredActivites.map((activite) => (
                              <div
                                key={activite.key}
                                onClick={() => {
                                  setEditedEntreprise({
                                    ...editedEntreprise,
                                    domaineActiviteLabel: activite.value,
                                    domaineActiviteNr: activite.key
                                  });
                                  setActiviteSearchTerm(activite.value);
                                  setShowActivitesDropdown(false);
                                }}
                                className="px-3 py-2 cursor-pointer transition-colors bg-white hover:bg-[#2d85c9] text-gray-900 hover:text-white"
                              >
                                <div className="font-medium text-current">{activite.value}</div>
                                <div className="text-xs opacity-70 text-current">{activite.key}</div>
                              </div>
                            ))}
                          {filteredActivites.length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-sm">Aucune activité trouvée</div>
                          )}
                        </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-base font-semibold text-slate-800 break-words">{entreprise.domaineActiviteLabel || entreprise.domaineActiviteNr || 'Non spécifié'}</p>
                  )}
                </div>
                
                {(editingGeneral || entreprise.domaineActiviteSecondaireLabel || entreprise.domaineActiviteSecondaireNr) && (
                  <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                    <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                      <BriefcaseIcon className="w-4 h-4" />
                      <span>Activité secondaire</span>
                    </label>
                    {editingGeneral ? (
                      <input
                        type="text"
                        value={editedEntreprise?.domaineActiviteSecondaireLabel || editedEntreprise?.domaineActiviteSecondaireNr || ''}
                        onChange={(e) => setEditedEntreprise({...editedEntreprise, domaineActiviteSecondaireLabel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                        placeholder="Optionnel"
                      />
                    ) : (
                      <p className="text-base font-semibold text-slate-800 break-words">{entreprise.domaineActiviteSecondaireLabel || entreprise.domaineActiviteSecondaireNr}</p>
                    )}
                  </div>
                )}
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Statut</span>
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(entreprise.statutCreation)}
                  </div>
                </div>
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Étape de validation</span>
                  </label>
                  <p className="text-base font-semibold text-slate-800">{entreprise.etapeValidation}</p>
                </div>
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span>Statuts de société</span>
                  </label>
                  <p className="text-base font-semibold text-slate-800">
                    {entreprise.statutSociete ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
            </div>

            {/* Localisation modernisée */}
            <div className="bg-white rounded-2xl shadow-lg border p-4">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#2d85c9]">
                  Localisation
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {entreprise.regionNom && (
                  <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                    <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                      <MapIcon className="w-4 h-4" />
                      <span>Région</span>
                    </label>
                    <p className="text-base font-semibold text-slate-800">{entreprise.regionNom}</p>
                  </div>
                )}
                
                {entreprise.cercleNom && (
                  <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                    <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      <span>Cercle</span>
                    </label>
                    <p className="text-base font-semibold text-slate-800">{entreprise.cercleNom}</p>
                  </div>
                )}
                
                {entreprise.communeNom && (
                  <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                    <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                      <BuildingLibraryIcon className="w-4 h-4" />
                      <span>Commune</span>
                    </label>
                    <p className="text-base font-semibold text-slate-800">{entreprise.communeNom}</p>
                  </div>
                )}
                
                {entreprise.quartierNom && (
                  <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                    <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                      <HomeIcon className="w-4 h-4" />
                      <span>Quartier</span>
                    </label>
                    <p className="text-base font-semibold text-slate-800">{entreprise.quartierNom}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Membres modernisés */}
            <div className="bg-white rounded-2xl shadow-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2d85c9]">
                    Membres ({entreprise.membres.length})
                  </h2>
                </div>
                {!readOnly && !editingMembres ? (
                  <button
                    onClick={() => {
                      setEditedMembres([...entreprise.membres]);
                      setEditingMembres(true);
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Modifier</span>
                    </div>
                  </button>
                ) : !readOnly && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingMembres(false)}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('📤 [SAVE MEMBRES] Données envoyées:', editedMembres);
                          console.log('📤 [SAVE MEMBRES] Payload complet:', { membres: editedMembres });
                          
                          const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}/membres`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ membres: editedMembres })
                          });
                          
                          const data = await response.json();
                          console.log('✅ [SAVE MEMBRES] Réponse:', data);
                          
                          if (response.ok && data.success) {
                            // Notification professionnelle de succès
                            const notification = document.createElement('div');
                            notification.className = 'fixed top-4 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg z-50 animate-slide-in';
                            notification.innerHTML = `
                              <div class="flex items-start">
                                <div class="flex-shrink-0">
                                  <svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div class="ml-3">
                                  <h3 class="text-sm font-bold text-green-800">Mise à jour réussie</h3>
                                  <p class="mt-1 text-sm text-green-700">
                                    ${data.membresUpdated} membre(s) et ${data.conjointsUpdated} conjoint(s) mis à jour
                                  </p>
                                </div>
                                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto flex-shrink-0 text-green-500 hover:text-green-700">
                                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            `;
                            document.body.appendChild(notification);
                            setTimeout(() => notification.remove(), 5000);
                            
                            setEditingMembres(false);
                            loadData();
                          } else {
                            // Notification professionnelle d'erreur
                            const notification = document.createElement('div');
                            notification.className = 'fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg z-50 animate-slide-in';
                            notification.innerHTML = `
                              <div class="flex items-start">
                                <div class="flex-shrink-0">
                                  <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div class="ml-3">
                                  <h3 class="text-sm font-bold text-red-800">Échec de la mise à jour</h3>
                                  <p class="mt-1 text-sm text-red-700">
                                    ${data.message || 'Une erreur est survenue'}
                                  </p>
                                </div>
                                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto flex-shrink-0 text-red-500 hover:text-red-700">
                                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            `;
                            document.body.appendChild(notification);
                            setTimeout(() => notification.remove(), 5000);
                          }
                        } catch (error) {
                          console.error('Erreur:', error);
                          // Notification professionnelle d'erreur technique
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg z-50 animate-slide-in';
                          notification.innerHTML = `
                            <div class="flex items-start">
                              <div class="flex-shrink-0">
                                <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div class="ml-3">
                                <h3 class="text-sm font-bold text-red-800">Erreur de connexion</h3>
                                <p class="mt-1 text-sm text-red-700">
                                  Impossible de communiquer avec le serveur
                                </p>
                              </div>
                              <button onclick="this.parentElement.parentElement.remove()" class="ml-auto flex-shrink-0 text-red-500 hover:text-red-700">
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          `;
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 5000);
                        }
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-colors"
                    >
                      Sauvegarder
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {(editingMembres ? editedMembres : entreprise.membres).map((membre, index) => (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 p-4 shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3">
                      <div className="flex items-center space-x-3 mb-3 lg:mb-0">
                        <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg">
                          {isPersonneMorale(membre) ? (
                            <BuildingOfficeIcon className="w-8 h-8 text-white" />
                          ) : (
                            <UserCircleIcon className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          {isPersonneMorale(membre) ? (
                            <div>
                              {editingMembres ? (
                                <input
                                  type="text"
                                  value={membre.denominationEntreprise || ''}
                                  onChange={(e) => {
                                    const newMembres = [...editedMembres];
                                    newMembres[index] = {...newMembres[index], denominationEntreprise: e.target.value};
                                    setEditedMembres(newMembres);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9] mb-2"
                                  placeholder="Dénomination entreprise"
                                />
                              ) : (
                                <h3 className="text-lg font-bold text-slate-800">
                                  {membre.denominationEntreprise}
                                </h3>
                              )}
                              <div className="flex gap-2">
                                {editingMembres ? (
                                  <>
                                    <input
                                      type="text"
                                      value={membre.prenom || ''}
                                      onChange={(e) => {
                                        const newMembres = [...editedMembres];
                                        newMembres[index] = {...newMembres[index], prenom: e.target.value};
                                        setEditedMembres(newMembres);
                                      }}
                                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                                      placeholder="Prénom représentant"
                                    />
                                    <input
                                      type="text"
                                      value={membre.nom || ''}
                                      onChange={(e) => {
                                        const newMembres = [...editedMembres];
                                        newMembres[index] = {...newMembres[index], nom: e.target.value};
                                        setEditedMembres(newMembres);
                                      }}
                                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                                      placeholder="Nom représentant"
                                    />
                                  </>
                                ) : (
                                  <p className="text-sm text-slate-600 font-medium">
                                    Représentant légal: {membre.prenom} {membre.nom}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {editingMembres ? (
                                <>
                                  <input
                                    type="text"
                                    value={membre.prenom || ''}
                                    onChange={(e) => {
                                      const newMembres = [...editedMembres];
                                      newMembres[index] = {...newMembres[index], prenom: e.target.value};
                                      setEditedMembres(newMembres);
                                    }}
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                                    placeholder="Prénom"
                                  />
                                  <input
                                    type="text"
                                    value={membre.nom || ''}
                                    onChange={(e) => {
                                      const newMembres = [...editedMembres];
                                      newMembres[index] = {...newMembres[index], nom: e.target.value};
                                      setEditedMembres(newMembres);
                                    }}
                                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                                    placeholder="Nom"
                                  />
                                </>
                              ) : (
                                <h3 className="text-lg font-bold text-slate-800">
                                  {membre.prenom} {membre.nom}
                                </h3>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isPersonneMorale(membre) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-bold bg-[#2d85c9] text-white shadow min-w-0 flex-shrink-0">
                            <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                            Personne Morale
                          </span>
                        )}
                        {getRoleBadge(membre.role)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                        <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                          <ChartBarIcon className="w-3 h-3" />
                          <span>Parts</span>
                        </label>
                        <p className="text-sm font-bold text-slate-800">{membre.pourcentageParts}%</p>
                      </div>
                      
                      {isPersonneMorale(membre) ? (
                        <>
                          {/* Champs spécifiques aux personnes morales */}
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <BuildingOfficeIcon className="w-3 h-3" />
                              <span>Dénomination</span>
                            </label>
                            <p className="text-sm font-semibold text-slate-800 break-words">{membre.denominationEntreprise}</p>
                          </div>
                          
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <GlobeAltIcon className="w-3 h-3" />
                              <span>Pays RCCM</span>
                            </label>
                            <p className="text-sm font-semibold text-slate-800 break-words">{membre.paysEmissionRccm}</p>
                          </div>
                          
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <UserCircleIcon className="w-3 h-3" />
                              <span>Représentant</span>
                            </label>
                            <p className="text-sm font-semibold text-slate-800 break-words">{membre.prenom} {membre.nom}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Champs spécifiques aux personnes physiques */}
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <EnvelopeIcon className="w-3 h-3" />
                              <span>Email</span>
                            </label>
                            {editingMembres ? (
                              <input
                                type="email"
                                value={membre.email || ''}
                                onChange={(e) => {
                                  const newMembres = [...editedMembres];
                                  newMembres[index] = {...newMembres[index], email: e.target.value};
                                  setEditedMembres(newMembres);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                placeholder="Email"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-slate-800 break-words">{membre.email || 'Non renseigné'}</p>
                            )}
                          </div>
                          
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <PhoneIcon className="w-3 h-3" />
                              <span>Téléphone</span>
                            </label>
                            {editingMembres ? (
                              <input
                                type="tel"
                                value={membre.telephone || ''}
                                onChange={(e) => {
                                  const newMembres = [...editedMembres];
                                  newMembres[index] = {...newMembres[index], telephone: e.target.value};
                                  setEditedMembres(newMembres);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                placeholder="Téléphone"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-slate-800 break-words">{membre.telephone || 'Non renseigné'}</p>
                            )}
                          </div>
                          
                          {membre.telephone2 && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                              <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                <DevicePhoneMobileIcon className="w-3 h-3" />
                                <span>Tél 2</span>
                              </label>
                              <p className="text-sm font-semibold text-slate-800 break-words">{membre.telephone2}</p>
                            </div>
                          )}
                          
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <CakeIcon className="w-3 h-3" />
                              <span>Naissance</span>
                            </label>
                            {editingMembres ? (
                              <input
                                type="date"
                                value={membre.dateNaissance || ''}
                                onChange={(e) => {
                                  const newMembres = [...editedMembres];
                                  newMembres[index] = {...newMembres[index], dateNaissance: e.target.value};
                                  setEditedMembres(newMembres);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-slate-800 break-words">{formatDate(membre.dateNaissance)}</p>
                            )}
                          </div>
                          
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <HeartIcon className="w-3 h-3" />
                              <span>Situation</span>
                            </label>
                            {editingMembres ? (
                              <select
                                value={membre.situationMatrimonialeStr || ''}
                                onChange={(e) => {
                                  const newMembres = [...editedMembres];
                                  const newStatus = e.target.value;
                                  
                                  // Si on change vers un statut non-marié, supprimer les conjoints
                                  if (newStatus !== 'MARIE' && membre.situationMatrimonialeStr === 'MARIE') {
                                    if (window.confirm('⚠️ Attention : Changer la situation matrimoniale supprimera tous les conjoints associés. Continuer ?')) {
                                      newMembres[index] = {...newMembres[index], situationMatrimonialeStr: newStatus, conjoints: []};
                                    } else {
                                      return; // Annuler le changement
                                    }
                                  } 
                                  // Si on change vers MARIE et qu'il n'y a pas de conjoints, initialiser un tableau vide
                                  else if (newStatus === 'MARIE' && !membre.conjoints) {
                                    newMembres[index] = {...newMembres[index], situationMatrimonialeStr: newStatus, conjoints: []};
                                  } else {
                                    newMembres[index] = {...newMembres[index], situationMatrimonialeStr: newStatus};
                                  }
                                  
                                  setEditedMembres(newMembres);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                              >
                                <option value="CELIBATAIRE">Célibataire</option>
                                <option value="MARIE">Marié(e)</option>
                                <option value="DIVORCE">Divorcé(e)</option>
                                <option value="VEUF">Veuf/Veuve</option>
                              </select>
                            ) : (
                              <p className="text-sm font-semibold text-slate-800 break-words">
                                {membre.situationMatrimonialeStr === 'MARIE' ? 'Marié(e)' : 
                                 membre.situationMatrimonialeStr === 'CELIBATAIRE' ? 'Célibataire' : 
                                 membre.situationMatrimonialeStr === 'DIVORCE' ? 'Divorcé(e)' : 
                                 membre.situationMatrimonialeStr === 'VEUF' ? 'Veuf/Veuve' : 
                                 membre.situationMatrimonialeStr || 'Non renseigné'}
                              </p>
                            )}
                          </div>
                          
                          {/* Informations de localisation du membre */}
                          {(membre.regionNom || membre.cercleNom || membre.communeNom || membre.quartierNom) && (
                            <>
                              <div className="col-span-full mt-3 mb-2">
                                <h4 className="text-sm font-bold text-[#2d85c9] border-b border-[#2d85c9] pb-1">
                                  Localisation
                                </h4>
                              </div>
                              
                              {membre.regionNom && (
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                  <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                    <MapIcon className="w-3 h-3" />
                                    <span>Région</span>
                                  </label>
                                  <p className="text-sm font-semibold text-slate-800 break-words">{membre.regionNom}</p>
                                </div>
                              )}
                              
                              {membre.cercleNom && (
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                  <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                    <MapPinIcon className="w-3 h-3" />
                                    <span>Cercle</span>
                                  </label>
                                  <p className="text-sm font-semibold text-slate-800 break-words">{membre.cercleNom}</p>
                                </div>
                              )}
                              
                              {membre.communeNom && (
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                  <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                    <BuildingLibraryIcon className="w-3 h-3" />
                                    <span>Commune</span>
                                  </label>
                                  <p className="text-sm font-semibold text-slate-800 break-words">{membre.communeNom}</p>
                                </div>
                              )}
                              
                              {membre.quartierNom && (
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                  <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                    <HomeIcon className="w-3 h-3" />
                                    <span>Quartier</span>
                                  </label>
                                  <p className="text-sm font-semibold text-slate-800 break-words">{membre.quartierNom}</p>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Informations des conjoints si marié */}
                          {membre.situationMatrimonialeStr === 'MARIE' && (
                            <>
                              <div className="col-span-full mt-3 mb-2 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[#2d85c9] border-b border-[#2d85c9] pb-1 flex-1">
                                  Informations des conjoint(s) ({membre.conjoints?.length || 0})
                                </h4>
                                {editingMembres && (
                                  <button
                                    onClick={() => {
                                      const newMembres = [...editedMembres];
                                      const newConjoints = [...(newMembres[index].conjoints || [])];
                                      newConjoints.push({
                                        id: `new-conjoint-${Date.now()}`,
                                        prenom: '',
                                        nom: '',
                                        dateMariage: '',
                                        lieuMariage: '',
                                        regimeMatrimonial: 'COMMUNAUTE',
                                        clauseRestrictive: 'NON'
                                      });
                                      newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                      setEditedMembres(newMembres);
                                    }}
                                    className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
                                  >
                                    + Ajouter conjoint
                                  </button>
                                )}
                              </div>
                              
                              {(!membre.conjoints || membre.conjoints.length === 0) && !editingMembres && (
                                <div className="col-span-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">Aucun conjoint enregistré</p>
                                </div>
                              )}
                              
                              {membre.conjoints && membre.conjoints.length > 0 && (
                                <>
                              
                              {membre.conjoints.map((conjoint: any, conjointIndex: number) => (
                                <React.Fragment key={conjoint.id || conjointIndex}>
                                  {conjointIndex > 0 && (
                                    <div className="col-span-full my-2 border-t border-gray-300"></div>
                                  )}
                                  
                                  <div className="col-span-full flex items-center justify-between">
                                    {membre.conjoints.length > 1 && (
                                      <p className="text-xs font-semibold text-gray-600">Conjoint {conjointIndex + 1}</p>
                                    )}
                                    {editingMembres && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm('⚠️ Supprimer ce conjoint ?')) {
                                            const newMembres = [...editedMembres];
                                            const newConjoints = [...(newMembres[index].conjoints || [])];
                                            newConjoints.splice(conjointIndex, 1);
                                            newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                            setEditedMembres(newMembres);
                                          }
                                        }}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow transition-colors"
                                      >
                                        🗑️ Supprimer
                                      </button>
                                    )}
                                  </div>
                              
                                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                    <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                      <UserCircleIcon className="w-3 h-3" />
                                      <span>Prénom</span>
                                    </label>
                                    {editingMembres ? (
                                      <input
                                        type="text"
                                        value={conjoint.prenom || ''}
                                        onChange={(e) => {
                                          const newMembres = [...editedMembres];
                                          const newConjoints = [...(newMembres[index].conjoints || [])];
                                          newConjoints[conjointIndex] = {...newConjoints[conjointIndex], prenom: e.target.value};
                                          newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                          setEditedMembres(newMembres);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                        placeholder="Prénom"
                                      />
                                    ) : (
                                      <p className="text-sm font-semibold text-slate-800 break-words">{conjoint.prenom || 'Non renseigné'}</p>
                                    )}
                                  </div>
                              
                                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                    <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                      <UserCircleIcon className="w-3 h-3" />
                                      <span>Nom</span>
                                    </label>
                                    {editingMembres ? (
                                      <input
                                        type="text"
                                        value={conjoint.nom || ''}
                                        onChange={(e) => {
                                          const newMembres = [...editedMembres];
                                          const newConjoints = [...(newMembres[index].conjoints || [])];
                                          newConjoints[conjointIndex] = {...newConjoints[conjointIndex], nom: e.target.value};
                                          newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                          setEditedMembres(newMembres);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                        placeholder="Nom"
                                      />
                                    ) : (
                                      <p className="text-sm font-semibold text-slate-800 break-words">{conjoint.nom || 'Non renseigné'}</p>
                                    )}
                                  </div>
                              
                              
                                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                    <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                      <HeartIcon className="w-3 h-3" />
                                      <span>Date mariage</span>
                                    </label>
                                    {editingMembres ? (
                                      <input
                                        type="date"
                                        value={conjoint.dateMariage || ''}
                                        onChange={(e) => {
                                          const newMembres = [...editedMembres];
                                          const newConjoints = [...(newMembres[index].conjoints || [])];
                                          newConjoints[conjointIndex] = {...newConjoints[conjointIndex], dateMariage: e.target.value};
                                          newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                          setEditedMembres(newMembres);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                      />
                                    ) : (
                                      <p className="text-sm font-semibold text-slate-800 break-words">{formatDate(conjoint.dateMariage) || 'Non renseigné'}</p>
                                    )}
                                  </div>
                              
                                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                    <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                      <MapPinIcon className="w-3 h-3" />
                                      <span>Lieu mariage</span>
                                    </label>
                                    {editingMembres ? (
                                      <input
                                        type="text"
                                        value={conjoint.lieuMariage || ''}
                                        onChange={(e) => {
                                          const newMembres = [...editedMembres];
                                          const newConjoints = [...(newMembres[index].conjoints || [])];
                                          newConjoints[conjointIndex] = {...newConjoints[conjointIndex], lieuMariage: e.target.value};
                                          newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                          setEditedMembres(newMembres);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                        placeholder="Lieu de mariage"
                                      />
                                    ) : (
                                      <p className="text-sm font-semibold text-slate-800 break-words">{conjoint.lieuMariage || 'Non renseigné'}</p>
                                    )}
                                  </div>
                              
                                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                    <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                      <ScaleIcon className="w-3 h-3" />
                                      <span>Régime matrimonial *</span>
                                    </label>
                                    {editingMembres ? (
                                      <select
                                        value={conjoint.regimeMatrimonial || ''}
                                        onChange={(e) => {
                                          const newMembres = [...editedMembres];
                                          const newConjoints = [...(newMembres[index].conjoints || [])];
                                          newConjoints[conjointIndex] = {...newConjoints[conjointIndex], regimeMatrimonial: e.target.value};
                                          newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                          setEditedMembres(newMembres);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                      >
                                        <option value="">Sélectionner...</option>
                                        <option value="SEPARATION_DE_BIENS">Séparation de biens</option>
                                        <option value="COMMUNAUTE_DE_BIENS">Communauté de biens</option>
                                      </select>
                                    ) : (
                                      <p className="text-sm font-semibold text-slate-800 break-words">
                                        {conjoint.regimeMatrimonial === 'SEPARATION_DE_BIENS' ? 'Séparation de biens' :
                                         conjoint.regimeMatrimonial === 'COMMUNAUTE_DE_BIENS' ? 'Communauté de biens' :
                                         conjoint.regimeMatrimonial || 'Non renseigné'}
                                      </p>
                                    )}
                                  </div>
                              
                                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                                    <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                                      <ShieldCheckIcon className="w-3 h-3" />
                                      <span>Clause restrictive *</span>
                                    </label>
                                    {editingMembres ? (
                                      <select
                                        value={conjoint.clauseRestrictive || ''}
                                        onChange={(e) => {
                                          const newMembres = [...editedMembres];
                                          const newConjoints = [...(newMembres[index].conjoints || [])];
                                          newConjoints[conjointIndex] = {...newConjoints[conjointIndex], clauseRestrictive: e.target.value};
                                          newMembres[index] = {...newMembres[index], conjoints: newConjoints};
                                          setEditedMembres(newMembres);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#2d85c9]"
                                      >
                                        <option value="">Sélectionner...</option>
                                        <option value="MONOGAMIE">Monogamie</option>
                                        <option value="POLYGAMIE">Polygamie</option>
                                      </select>
                                    ) : (
                                      <p className="text-sm font-semibold text-slate-800 break-words">
                                        {conjoint.clauseRestrictive === 'MONOGAMIE' ? 'Monogamie' :
                                         conjoint.clauseRestrictive === 'POLYGAMIE' ? 'Polygamie' :
                                         conjoint.clauseRestrictive || 'Non renseigné'}
                                      </p>
                                    )}
                                  </div>
                                </React.Fragment>
                              ))}
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                      
                      {/* Champs communs */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Date début</label>
                        <p className="text-sm text-gray-900">
                          {new Date(membre.dateDebut).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Date fin</label>
                        <p className="text-sm text-gray-900">
                          {membre.dateFin === '9999-12-31' ? 'Indéterminée' : 
                           new Date(membre.dateFin).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents modernisés */}
            <div className="bg-white rounded-2xl shadow-lg border p-4">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#2d85c9]">
                  Documents ({documents.length})
                </h2>
              </div>
              
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupDocumentsByType(documents)).map(([typeName, docs]) => (
                    <div key={typeName} className="bg-white rounded-xl border border-slate-200 p-3 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="p-2 bg-[#2d85c9] rounded-lg shadow">
                              <DocumentTextIcon className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 break-words">
                              {typeName}
                              {docs.length > 1 && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {docs.length} documents
                                </span>
                              )}
                            </h3>
                          </div>
                          
                          <div className="space-y-3">
                            {docs.map((doc, docIndex) => (
                              <div key={docIndex} className="flex items-start justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                                    <div>
                                      <span className="font-medium">Numéro : </span> 
                                      <span className={doc.numero ? 'text-gray-900' : 'text-red-500 italic'}>
                                        {doc.numero || 'Numéro manquant'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Créé le : </span> 
                                      <span className="text-gray-900">{formatDate(doc.dateExpiration || '')}</span>
                                    </div>
                                    {doc.dateExpiration && (
                                      <div>
                                        <span className="font-medium">Expire le : </span> 
                                        <span className="text-gray-900">
                                          {formatDate(doc.dateExpiration || '')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 ml-4">
                                  <button 
                                    onClick={() => handleViewDocument(
                                      doc.id, 
                                      typeName
                                    )}
                                    className="group px-4 py-2 bg-[#2d85c9] hover:bg-[#2563a3] text-white text-base font-bold rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <EyeIcon className="w-4 h-4" />
                                      <span>Voir</span>
                                    </div>
                                  </button>
                                  <button 
                                    onClick={() => handleDownloadDocument(
                                      doc.id, 
                                      typeName
                                    )}
                                    className="group px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-base font-bold rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <ArrowDownTrayIcon className="w-4 h-4" />
                                      <span>Télécharger</span>
                                    </div>
                                  </button>
                                  {!readOnly && (
                                    <label className="group px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-base font-bold rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleReplaceDocument(doc.id, file, typeName);
                                          }
                                        }}
                                      />
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span>Modifier</span>
                                      </div>
                                    </label>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative inline-block mb-8">
                    <div className="p-8 bg-slate-100 rounded-full shadow-2xl animate-pulse">
                      <DocumentTextIcon className="w-16 h-16 text-slate-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#2d85c9] rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-700 mb-4">
                    Aucun document disponible
                  </h3>
                  <p className="text-slate-500 text-xl">Les documents de l'entreprise apparaîtront ici</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Informations système modernisées */}
            <div className="bg-white rounded-2xl shadow-lg border p-4">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#2d85c9]">
                  Informations système
                </h2>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <IdentificationIcon className="w-4 h-4" />
                    <span>Référence</span>
                  </label>
                  <p className="text-base font-mono font-bold text-slate-800 bg-slate-100 px-3 py-2 rounded-lg">
                    {entreprise.reference}
                  </p>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Date de création</span>
                  </label>
                  <p className="text-sm font-semibold text-slate-800">{formatDate(entreprise.creation)}</p>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Dernière modification</span>
                  </label>
                  <p className="text-sm font-semibold text-slate-800">{formatDate(entreprise.modification)}</p>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>Statut</span>
                  </label>
                  <div className="mt-1">
                    {entreprise.banni ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-bold bg-red-500 text-white shadow min-w-0 flex-shrink-0">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Bannie
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-bold bg-green-600 text-white shadow min-w-0 flex-shrink-0">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
                
                {entreprise.banni && entreprise.motifBannissement && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <label className="flex items-center space-x-2 text-sm font-bold text-red-800 mb-2">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      <span>Motif</span>
                    </label>
                    <p className="text-sm font-semibold text-slate-800">{entreprise.motifBannissement}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Résumé validation modernisé */}
            <div className="bg-white rounded-2xl shadow-lg border p-4">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#2d85c9]">
                  Résumé
                </h2>
              </div>
              
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center space-x-2 text-xs font-bold text-[#2d85c9] min-w-0">
                      <ChartBarIcon className="w-3 h-3" />
                      <span>Statut</span>
                    </span>
                    {getStatusBadge(entreprise.statutCreation)}
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center space-x-2 text-xs font-bold text-[#2d85c9] min-w-0">
                      <ArrowPathIcon className="w-3 h-3" />
                      <span>Étape</span>
                    </span>
                    <span className="px-2 py-1 bg-[#2d85c9] text-white font-bold rounded-lg text-xs">
                      {entreprise.etapeValidation}
                    </span>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center space-x-2 text-xs font-bold text-[#2d85c9] min-w-0">
                      <UserGroupIcon className="w-3 h-3" />
                      <span>Membres</span>
                    </span>
                    <span className="px-2 py-1 bg-[#2d85c9] text-white font-bold rounded-lg text-xs">
                      {entreprise.membres.length}
                    </span>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center space-x-2 text-xs font-bold text-[#2d85c9] min-w-0">
                      <DocumentTextIcon className="w-3 h-3" />
                      <span>Documents</span>
                    </span>
                    <span className="px-2 py-1 bg-[#2d85c9] text-white font-bold rounded-lg text-xs">
                      {documents.length}
                    </span>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center space-x-2 text-xs font-bold text-[#2d85c9] min-w-0">
                      <UserCircleIcon className="w-3 h-3" />
                      <span>Gérants</span>
                    </span>
                    <span className="px-2 py-1 bg-[#2d85c9] text-white font-bold rounded-lg text-xs">
                      {entreprise.membres.filter(m => m.role === 'GERANT').length}
                    </span>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center space-x-2 text-xs font-bold text-[#2d85c9] min-w-0">
                      <ChartBarIcon className="w-3 h-3" />
                      <span>Parts</span>
                    </span>
                    <span className="px-2 py-1 bg-[#2d85c9] text-white font-bold rounded-lg text-xs">
                      {entreprise.membres.reduce((sum, m) => sum + m.pourcentageParts, 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocumentId && (
        <DocumentViewer
          documentId={selectedDocumentId}
          documentName={selectedDocumentName}
          onClose={handleCloseDocumentViewer}
        />
      )}

      {/* Modal d'upload des documents manquants */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-gray-800">Uploader les documents manquants</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingDocument(null);
                  setSelectedFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircleIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Sélectionnez le type de document à uploader et choisissez le fichier correspondant.
                </p>
                
                {/* Sélection du type de document */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de document
                  </label>
                  <select
                    value={uploadingDocument || ''}
                    onChange={(e) => {
                      setUploadingDocument(e.target.value);
                      setUploadingTypePiece(null); // Réinitialiser le type de pièce
                      setUploadingDateExpiration(''); // Réinitialiser la date d'expiration
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Sélectionner un type --</option>
                    <option value="PIECE_IDENTITE">Pièce d'identité</option>
                    <option value="EXTRAIT_NAISSANCE">Extrait de naissance</option>
                    <option value="PIECE_NATIONALITE">Certificat de nationalité</option>
                    <option value="CERTIFICAT_RESIDENCE">Certificat de résidence</option>
                    <option value="CASIER_JUDICIAIRE">Casier judiciaire</option>
                    <option value="DECLARATION_SUR_HONNEUR">Déclaration sur l'honneur</option>
                    <option value="ACTE_MARIAGE">Acte de mariage</option>
                  </select>
                </div>

                {/* Type de pièce d'identité (conditionnel) */}
                {uploadingDocument === 'PIECE_IDENTITE' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de pièce d'identité *
                      </label>
                      <select
                        value={uploadingTypePiece || ''}
                        onChange={(e) => setUploadingTypePiece(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Sélectionner un type de pièce --</option>
                        <option value="CNI">Carte d'Identité Nationale</option>
                        <option value="PASSEPORT">Passeport</option>
                        <option value="CARTE_CONSULAIRE">Carte consulaire</option>
                        <option value="CARTE_ELECTEUR">Carte électorale</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date d'expiration (optionnel)
                      </label>
                      <input
                        type="date"
                        value={uploadingDateExpiration}
                        onChange={(e) => setUploadingDateExpiration(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </>
                )}

                {/* Upload du fichier */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Formats acceptés : PDF, JPG, JPEG, PNG (max 10 MB)
                  </p>
                </div>

                {/* Bouton d'upload */}
                <button
                  onClick={async () => {
                    if (!uploadingDocument || !selectedFile) {
                      alert('Veuillez sélectionner un type de document et un fichier');
                      return;
                    }

                    // Vérifier que le type de pièce est sélectionné pour les pièces d'identité
                    if (uploadingDocument === 'PIECE_IDENTITE' && !uploadingTypePiece) {
                      alert('Veuillez sélectionner un type de pièce d\'identité');
                      return;
                    }

                    try {
                      const formData = new FormData();
                      formData.append('file', selectedFile);
                      
                      // Trouver le premier gérant/promoteur pour associer le document
                      const gerant = entreprise?.membres?.find(m => 
                        m.role?.toUpperCase() === 'GERANT' || m.role?.toUpperCase() === 'PROMOTEUR'
                      );
                      
                      if (!gerant) {
                        alert('Aucun gérant/promoteur trouvé pour associer le document');
                        return;
                      }

                      const endpoint = uploadingDocument === 'PIECE_IDENTITE' 
                        ? `${API_CONFIG.BASE_URL}/documents/piece`
                        : `${API_CONFIG.BASE_URL}/documents/document`;

                      formData.append('personneId', gerant.personId);
                      formData.append('entrepriseId', entrepriseId);
                      
                      // Pour les pièces d'identité, envoyer typePiece et dateExpiration (si renseignée)
                      if (uploadingDocument === 'PIECE_IDENTITE') {
                        formData.append('typePiece', uploadingTypePiece!);
                        if (uploadingDateExpiration) {
                          formData.append('dateExpiration', uploadingDateExpiration);
                        }
                      } else {
                        formData.append('typeDocument', uploadingDocument);
                      }

                      const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
                        },
                        body: formData
                      });

                      if (response.ok) {
                        alert('✅ Document uploadé avec succès!');
                        setShowUploadModal(false);
                        setUploadingDocument(null);
                        setUploadingTypePiece(null);
                        setUploadingDateExpiration('');
                        setSelectedFile(null);
                        loadData(); // Recharger les données pour mettre à jour la validation
                      } else {
                        const error = await response.text();
                        alert(`Erreur lors de l'upload: ${error}`);
                      }
                    } catch (error) {
                      console.error('Erreur upload:', error);
                      alert('Erreur lors de l\'upload du document');
                    }
                  }}
                  disabled={!uploadingDocument || !selectedFile || (uploadingDocument === 'PIECE_IDENTITE' && !uploadingTypePiece)}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Uploader le document
                </button>
              </div>

              {/* Liste des documents manquants */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">Documents requis :</h4>
                <ul className="space-y-2">
                  {missingDocuments.map((doc, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      <span className="text-sm">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrepriseDetails;
























