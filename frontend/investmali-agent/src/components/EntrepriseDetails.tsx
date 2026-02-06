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
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editedEntreprise, setEditedEntreprise] = useState<any>(null);
  const [editingMembres, setEditingMembres] = useState(false);
  const [editedMembres, setEditedMembres] = useState<any[]>([]);

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2d85c9]">
                    Informations générales
                  </h2>
                </div>
                {!editingGeneral ? (
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
                ) : (
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
                          const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(editedEntreprise)
                          });
                          if (response.ok) {
                            alert('✅ Informations modifiées avec succès!');
                            setEditingGeneral(false);
                            loadData();
                          } else {
                            alert('❌ Erreur lors de la modification');
                          }
                        } catch (error) {
                          console.error('Erreur:', error);
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
                    <span>{entreprise.typeEntreprise === 'ENTREPRISE_INDIVIDUELLE' ? 'Nom du gérant' : 'Nom de l\'entreprise'}</span>
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
                    <input
                      type="text"
                      value={editedEntreprise?.domaineActiviteLabel || editedEntreprise?.domaineActiviteNr || ''}
                      onChange={(e) => setEditedEntreprise({...editedEntreprise, domaineActiviteLabel: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d85c9]"
                    />
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
                {!editingMembres ? (
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
                ) : (
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
                          const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}/membres`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ membres: editedMembres })
                          });
                          
                          const data = await response.json();
                          
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
                                  newMembres[index] = {...newMembres[index], situationMatrimonialeStr: e.target.value};
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
                          
                          {/* Informations des conjoints si marié */}
                          {membre.situationMatrimonialeStr === 'MARIE' && membre.conjoints && membre.conjoints.length > 0 && (
                            <>
                              <div className="col-span-full mt-3 mb-2">
                                <h4 className="text-sm font-bold text-[#2d85c9] border-b border-[#2d85c9] pb-1">
                                  Informations des conjoint(s) ({membre.conjoints.length})
                                </h4>
                              </div>
                              
                              {membre.conjoints.map((conjoint: any, conjointIndex: number) => (
                                <React.Fragment key={conjoint.id || conjointIndex}>
                                  {conjointIndex > 0 && (
                                    <div className="col-span-full my-2 border-t border-gray-300"></div>
                                  )}
                                  
                                  {membre.conjoints.length > 1 && (
                                    <div className="col-span-full">
                                      <p className="text-xs font-semibold text-gray-600">Conjoint {conjointIndex + 1}</p>
                                    </div>
                                  )}
                              
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
  // Informations du déposant
  nomDeposant?: string;
  prenomDeposant?: string;
  telephoneDeposant?: string;
  emailDeposant?: string;
  nomCabinet?: string;
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

  // Fonction pour grouper les documents par type et filtrer les doublons
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

    // Filtrer les doublons : garder uniquement les documents avec numéros longs (EXTRAIT-, DECLARATION-, CASIER-, etc.)
    // et ignorer ceux avec numéros courts (EN-, DH-, CJ-)
    const filtered: Record<string, Document[]> = {};
    
    for (const [typeName, docList] of Object.entries(grouped)) {
      // Si un seul document, le garder
      if (docList.length === 1) {
        filtered[typeName] = docList;
        continue;
      }
      
      // S'il y a plusieurs documents du même type, garder uniquement ceux avec numéros longs
      const longFormatDocs = docList.filter(doc => {
        const numero = doc.numero || doc.num_piece || '';
        // Garder les documents qui commencent par des préfixes longs (contiennent un tiret suivi d'un prénom/nom)
        return numero.includes('-') && (
          numero.startsWith('EXTRAIT-') || 
          numero.startsWith('DECLARATION-') || 
          numero.startsWith('CASIER-') ||
          numero.startsWith('MARIAGE-') ||
          numero.startsWith('RCCM-') ||
          numero.startsWith('STATUTS-') ||
          numero.startsWith('RC-') ||
          numero.startsWith('PV-') ||
          numero.startsWith('DN-') ||
          numero.startsWith('AB-') ||
          numero.startsWith('CR-') ||
          numero.startsWith('PN-')
        );
      });
      
      // Si on a trouvé des documents avec format long, les utiliser, sinon garder tous
      filtered[typeName] = longFormatDocs.length > 0 ? longFormatDocs : docList;
    }

    return filtered;
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

            {/* Informations du déposant (uniquement pour les sociétés) */}
            {entreprise.typeEntreprise === 'SOCIETE' && (entreprise.nomDeposant || entreprise.prenomDeposant || entreprise.telephoneDeposant || entreprise.emailDeposant || entreprise.nomCabinet) && (
              <div className="bg-white rounded-2xl shadow-lg border p-4">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-[#2d85c9] rounded-xl shadow-lg mr-3">
                    <UserCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[#2d85c9]">
                    Informations du déposant
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {entreprise.nomDeposant && (
                    <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                      <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                        <UserCircleIcon className="w-4 h-4" />
                        <span>Nom</span>
                      </label>
                      <p className="text-base font-semibold text-slate-800 break-words">{entreprise.nomDeposant}</p>
                    </div>
                  )}
                  
                  {entreprise.prenomDeposant && (
                    <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                      <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                        <UserCircleIcon className="w-4 h-4" />
                        <span>Prénom</span>
                      </label>
                      <p className="text-base font-semibold text-slate-800 break-words">{entreprise.prenomDeposant}</p>
                    </div>
                  )}
                  
                  {entreprise.telephoneDeposant && (
                    <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                      <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                        <PhoneIcon className="w-4 h-4" />
                        <span>Téléphone</span>
                      </label>
                      <p className="text-base font-semibold text-slate-800 break-words">{entreprise.telephoneDeposant}</p>
                    </div>
                  )}
                  
                  {entreprise.emailDeposant && (
                    <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                      <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                        <EnvelopeIcon className="w-4 h-4" />
                        <span>Email</span>
                      </label>
                      <p className="text-base font-semibold text-slate-800 break-words">{entreprise.emailDeposant}</p>
                    </div>
                  )}
                  
                  {entreprise.nomCabinet && (
                    <div className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                      <label className="flex items-center space-x-2 text-sm font-bold text-[#2d85c9] mb-2">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        <span>Nom du cabinet</span>
                      </label>
                      <p className="text-base font-semibold text-slate-800 break-words">{entreprise.nomCabinet}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      {/* Masquer les parts pour les GIE */}
                      {entreprise.formeJuridique !== 'GIE' && (
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-[#2d85c9] transition-all duration-200">
                          <label className="flex items-center space-x-1 text-xs font-bold text-[#2d85c9] mb-1">
                            <ChartBarIcon className="w-3 h-3" />
                            <span>Parts</span>
                          </label>
                          <p className="text-sm font-bold text-slate-800">{membre.pourcentageParts}%</p>
                        </div>
                      )}
                      
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
                                        {(() => {
                                          const fullNumero = doc.numero || doc.num_piece || 'Numéro manquant';
                                          // Tronquer la partie après le nom (enlever -CE-YYYY-MM-DD-XXXXX)
                                          const match = fullNumero.match(/^([A-Z]+-[^-]+-[^-]+)/);
                                          return match ? match[1] : fullNumero;
                                        })()}
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
                
                {/* Masquer le total des parts pour les GIE */}
                {entreprise.formeJuridique !== 'GIE' && (
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
                )}
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





















>>>>>>> c4076667291e5752bab0de894b602c8b5d52d9c0
