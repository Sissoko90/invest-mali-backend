<<<<<<< HEAD
﻿import React, { useState, useEffect } from 'react';
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
  onBack: () => void;
  onStatusUpdate?: (id: string, status: string) => void;
}

interface Membre {
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
  // Champs spécifiques aux personnes morales
  paysEmissionRccm?: string;
  denominationEntreprise?: string;
}

interface Document {
  id: string;
  numero?: string;
  num_piece?: string;
  typeDocument?: string;
  type_document?: string;
  typePiece?: string;
  type_piece?: string;
  dateExpiration?: string | null;
  date_expiration?: string | null;
  dateCreation?: string;
  created_at?: string;
  personneId?: string;
  personne_id?: string;
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
  onStatusUpdate 
}) => {
  const [entreprise, setEntreprise] = useState<EntrepriseDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [entrepriseId]);

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
      setEntreprise(data);

      // Charger les documents
      try {
        const docResponse = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
          }
        });

        if (docResponse.ok) {
          const docData = await docResponse.json();
          // Filtrer les doublons basés sur l'ID
          const uniqueDocuments = docData.filter((doc: any, index: number, self: any[]) => 
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
    } catch (error) {
      setError('Erreur lors du chargement des détails de l\'entreprise');
      setEntreprise(null);
    } finally {
      setLoading(false);
    }
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
      const docType = (doc.typeDocument || doc.type_document) || (doc.typePiece || doc.type_piece) || 'AUTRES';
      const typeName = (doc.typeDocument || doc.type_document) ? 
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
              <button
                onClick={onBack}
                className="group px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span>Retour</span>
                </div>
              </button>
              
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 w-full min-w-0">
          
          {/* Colonne principale */}
          <div className="xl:col-span-2 space-y-4">
            
            {/* Informations générales modernisées */}
            <div className="bg-white rounded-2xl shadow-lg border p-4">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                  <BuildingOfficeIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#2d85c9]">
                  Informations générales
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span>{entreprise.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'Nom du gérant' : 'Nom de l\'entreprise'}</span>
                  </label>
                  <p className="text-base font-semibold text-slate-800 break-words">
                    {entreprise.nom || (() => {
                      const gerant = entreprise.membres?.find(m => m.role === 'GERANT' || m.role === 'PROMOTEUR');
                      return gerant ? `${gerant.prenom} ${gerant.nom}` : 'Non renseigné';
                    })()}
                  </p>
                </div>
                
                <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                  <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                    <TagIcon className="w-4 h-4" />
                    <span>Sigle</span>
                  </label>
                  <p className="text-base font-semibold text-slate-800 break-words">{entreprise.sigle || 'Non spécifié'}</p>
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
                  <p className="text-base font-semibold text-slate-800 break-words">{entreprise.domaineActiviteLabel || entreprise.domaineActiviteNr || 'Non spécifié'}</p>
                </div>
                
                {(entreprise.domaineActiviteSecondaireLabel || entreprise.domaineActiviteSecondaireNr) && (
                  <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                    <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                      <BriefcaseIcon className="w-4 h-4" />
                      <span>Activité secondaire</span>
                    </label>
                    <p className="text-base font-semibold text-slate-800 break-words">{entreprise.domaineActiviteSecondaireLabel || entreprise.domaineActiviteSecondaireNr}</p>
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
              <div className="flex items-center mb-4">
                <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#2d85c9]">
                  Membres ({entreprise.membres.length})
                </h2>
              </div>
              
              <div className="space-y-3">
                {entreprise.membres.map((membre, index) => (
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
                        <div>
                          {isPersonneMorale(membre) ? (
                            <div>
                              <h3 className="text-lg font-bold text-slate-800">
                                {membre.denominationEntreprise}
                              </h3>
                              <p className="text-sm text-slate-600 font-medium">
                                Représentant légal: {membre.prenom} {membre.nom}
                              </p>
                            </div>
                          ) : (
                            <h3 className="text-lg font-bold text-slate-800">
                              {membre.prenom} {membre.nom}
                            </h3>
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
                            <p className="text-sm font-semibold text-slate-800 break-words">{membre.email || 'Non renseigné'}</p>
                          </div>
                          
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <PhoneIcon className="w-3 h-3" />
                              <span>Téléphone</span>
                            </label>
                            <p className="text-sm font-semibold text-slate-800 break-words">{membre.telephone || 'Non renseigné'}</p>
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
                            <p className="text-sm font-semibold text-slate-800 break-words">{formatDate(membre.dateNaissance)}</p>
                          </div>
                          
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                            <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                              <HeartIcon className="w-3 h-3" />
                              <span>Situation</span>
                            </label>
                            <p className="text-sm font-semibold text-slate-800 break-words">
                              {membre.situationMatrimonialeStr === 'MARIE' ? 'Marié(e)' : 
                               membre.situationMatrimonialeStr === 'CELIBATAIRE' ? 'Célibataire' : 
                               membre.situationMatrimonialeStr === 'DIVORCE' ? 'Divorcé(e)' : 
                               membre.situationMatrimonialeStr === 'VEUF' ? 'Veuf/Veuve' : 
                               membre.situationMatrimonialeStr || 'Non renseigné'}
                            </p>
                          </div>
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
                                      <span className={(doc.numero || doc.num_piece) ? 'text-gray-900' : 'text-red-500 italic'}>
                                        {doc.numero || doc.num_piece || 'Numéro manquant'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Créé le : </span> 
                                      <span className="text-gray-900">{formatDate((doc.dateCreation || doc.created_at) || '')}</span>
                                    </div>
                                    {(doc.dateExpiration || doc.date_expiration) && (
                                      <div>
                                        <span className="font-medium">Expire le : </span> 
                                        <span className="text-gray-900">
                                          {formatDate((doc.dateExpiration || doc.date_expiration) || '')}
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
    </div>
  );
};

export default EntrepriseDetails;
























=======
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
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface EntrepriseDetailsProps {
  entrepriseId: string;
  onBack: () => void;
  onStatusUpdate?: (id: string, status: string) => void;
}

interface Membre {
  personId: string;
  nom: string;
  prenom: string;
  role: string;
  pourcentageParts: number;
  dateDebut: string;
  dateFin: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string;
  situationMatrimoniale?: boolean | string;
}

interface Document {
  id: string;
  numero?: string;
  num_piece?: string;
  typeDocument?: string;
  type_document?: string;
  typePiece?: string;
  type_piece?: string;
  dateExpiration?: string | null;
  date_expiration?: string | null;
  dateCreation?: string;
  created_at?: string;
  personneId?: string;
  personne_id?: string;
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
  onStatusUpdate 
}) => {
  const [entreprise, setEntreprise] = useState<EntrepriseDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>('');

  useEffect(() => {
    loadEntrepriseDetails();
    loadDocuments();
  }, [entrepriseId]);

  const loadEntrepriseDetails = async () => {
    try {
      console.log('🔍 Chargement des détails de l\'entreprise:', entrepriseId);
      
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
      console.log('📋 Détails entreprise:', data);
      setEntreprise(data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des détails:', error);
      setError('Erreur lors du chargement des détails de l\'entreprise');
    }
  };

  const loadDocuments = async () => {
    try {
      console.log('📄 Chargement des documents de l\'entreprise:', entrepriseId);
      
      // Appel API pour récupérer les documents
      const response = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📄 Documents:', data);
        setDocuments(data);
      } else {
        console.log('⚠️ Aucun document trouvé ou endpoint non disponible');
        setDocuments([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!entreprise) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entreprise.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          statutCreation: status,
          etapeValidation: status === 'VALIDEE' ? 'REGISSEUR' : 'ACCUEIL'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Recharger les détails
      await loadEntrepriseDetails();
      
      // Notifier le parent
      onStatusUpdate?.(entreprise.id, status);
      
      console.log(`✅ Statut mis à jour vers ${status}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsUpdating(false);
    }
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'EN_ATTENTE': { color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      'EN_COURS': { color: 'bg-blue-100 text-blue-800', text: 'En cours' },
      'VALIDEE': { color: 'bg-green-100 text-green-800', text: 'Validée' },
      'REFUSEE': { color: 'bg-red-100 text-red-800', text: 'Refusée' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['EN_COURS'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'GERANT': { color: 'bg-purple-100 text-purple-800', text: 'Gérant' },
      'DIRIGEANT': { color: 'bg-blue-100 text-blue-800', text: 'Dirigeant' },
      'ASSOCIE': { color: 'bg-gray-100 text-gray-800', text: 'Associé' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig['ASSOCIE'];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
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
      'ATTESTATION': 'Attestation',
      'CERTIFICAT': 'Certificat',
      'CONTRAT': 'Contrat',
      'FACTURE': 'Facture',
      'RECU': 'Reçu'
    };
    
    return typeNames[type.toUpperCase() as keyof typeof typeNames] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPieceTypeName = (type: string) => {
    if (!type) return 'Pièce d\'identité';
    
    const typeNames = {
      'PASSEPORT': 'Passeport',
      'CNI': 'Carte Nationale d\'Identité',
      'CARTE_CONSULAIRE': 'Carte consulaire',
      'PERMIS_CONDUIRE': 'Permis de conduire',
      'CARTE_ELECTEUR': 'Carte d\'électeur',
      'CARTE_IDENTITE': 'Carte d\'identité',
      'ACTE_NAISSANCE': 'Acte de naissance'
    };
    
    return typeNames[type.toUpperCase() as keyof typeof typeNames] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mali-emerald"></div>
          <p className="mt-2 text-gray-500">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error || !entreprise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={onBack}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-mali-emerald hover:bg-mali-emerald-dark"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour
              </button>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-gray-900">Détails de l'entreprise</h1>
                <p className="text-sm text-gray-500">Référence: {entreprise.reference}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusUpdate('VALIDEE')}
                disabled={isUpdating || entreprise.statutCreation === 'VALIDEE'}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Valider
              </button>
              
              <button
                onClick={() => handleStatusUpdate('EN_ATTENTE')}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Info requise
              </button>
              
              <button
                onClick={() => handleStatusUpdate('REFUSEE')}
                disabled={isUpdating || entreprise.statutCreation === 'REFUSEE'}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Refuser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Informations générales */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Informations générales</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nom de l'entreprise</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.nom}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Sigle</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.sigle || 'Non spécifié'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Forme juridique</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.formeJuridique}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type d'entreprise</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.typeEntreprise}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Domaine d'activité</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.domaineActivite}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Statut</label>
                  <div className="mt-1">
                    {getStatusBadge(entreprise.statutCreation)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Étape de validation</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.etapeValidation}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Statuts de société</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {entreprise.statutSociete ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Localisation</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Code division</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.divisionCode}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Division</label>
                  <p className="mt-1 text-sm text-gray-900">{entreprise.divisionNom}</p>
                </div>
                
                {entreprise.regionNom && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Région</label>
                    <p className="mt-1 text-sm text-gray-900">{entreprise.regionNom}</p>
                  </div>
                )}
                
                {entreprise.quartierNom && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Quartier</label>
                    <p className="mt-1 text-sm text-gray-900">{entreprise.quartierNom}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Membres */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Membres ({entreprise.membres.length})</h2>
              </div>
              
              <div className="space-y-4">
                {entreprise.membres.map((membre, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {membre.prenom} {membre.nom}
                        </h3>
                      </div>
                      {getRoleBadge(membre.role)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Parts</label>
                        <p className="text-sm text-gray-900">{membre.pourcentageParts}%</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{membre.email || 'Non renseigné'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Téléphone</label>
                        <p className="text-sm text-gray-900">{membre.telephone || 'Non renseigné'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Date de naissance</label>
                        <p className="text-sm text-gray-900">
                          {membre.dateNaissance ? 
                            new Date(membre.dateNaissance).toLocaleDateString('fr-FR') : 
                            'Non renseignée'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Situation matrimoniale</label>
                        <p className="text-sm text-gray-900">
                          {(membre.situationMatrimoniale === 'true' || membre.situationMatrimoniale === true) ? 
                            'Marié(e)' : 
                            (membre.situationMatrimoniale === 'false' || membre.situationMatrimoniale === false) ? 
                            'Célibataire' : 
                            'Non renseignée'
                          }
                        </p>
                      </div>
                      
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

            {/* Documents */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Documents ({documents.length})</h2>
              </div>
              
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {(doc.typeDocument || doc.type_document) ? 
                                getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                               (doc.typePiece || doc.type_piece) ? 
                                getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document sans type'}
                            </h3>
                            {(doc.typePiece || doc.type_piece) && (doc.typeDocument || doc.type_document) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getPieceTypeName((doc.typePiece || doc.type_piece) || '')}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Numéro:</span> 
                              <span className={(doc.numero || doc.num_piece) ? 'text-gray-900' : 'text-red-500 italic'}>
                                {doc.numero || doc.num_piece || 'Numéro manquant'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Créé le:</span> 
                              <span className="text-gray-900">{formatDate((doc.dateCreation || doc.created_at) || '')}</span>
                            </div>
                            {(doc.dateExpiration || doc.date_expiration) && (
                              <div>
                                <span className="font-medium">Expire le:</span> 
                                <span className="text-gray-900">
                                  {formatDate((doc.dateExpiration || doc.date_expiration) || '')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button 
                            onClick={() => handleViewDocument(
                              doc.id, 
                              (doc.typeDocument || doc.type_document) ? getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                              (doc.typePiece || doc.type_piece) ? getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document'
                            )}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Voir
                          </button>
                          <button 
                            onClick={() => handleDownloadDocument(
                              doc.id, 
                              (doc.typeDocument || doc.type_document) ? getDocumentTypeName((doc.typeDocument || doc.type_document) || '') : 
                              (doc.typePiece || doc.type_piece) ? getPieceTypeName((doc.typePiece || doc.type_piece) || '') : 'Document'
                            )}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                            Télécharger
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2">Aucun document disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Informations système */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Informations système</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Référence</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{entreprise.reference}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date de création</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(entreprise.creation)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Dernière modification</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(entreprise.modification)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Statut bannissement</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {entreprise.banni ? (
                      <span className="text-red-600">Bannie</span>
                    ) : (
                      <span className="text-green-600">Active</span>
                    )}
                  </p>
                </div>
                
                {entreprise.banni && entreprise.motifBannissement && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Motif bannissement</label>
                    <p className="mt-1 text-sm text-gray-900">{entreprise.motifBannissement}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Résumé validation */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <IdentificationIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Résumé validation</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Statut actuel</span>
                  {getStatusBadge(entreprise.statutCreation)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Étape</span>
                  <span className="text-sm font-medium text-gray-900">{entreprise.etapeValidation}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Membres</span>
                  <span className="text-sm font-medium text-gray-900">{entreprise.membres.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Documents</span>
                  <span className="text-sm font-medium text-gray-900">{documents.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Gérants</span>
                  <span className="text-sm font-medium text-gray-900">
                    {entreprise.membres.filter(m => m.role === 'GERANT').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total parts</span>
                  <span className="text-sm font-medium text-gray-900">
                    {entreprise.membres.reduce((sum, m) => sum + m.pourcentageParts, 0)}%
                  </span>
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
    </div>
  );
};

export default EntrepriseDetails;
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
