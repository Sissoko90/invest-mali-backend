import React, { useState, useEffect } from 'react';
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
      
      const response = await fetch(`http://localhost:8080/api/v1/entreprises/${entrepriseId}`, {
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
      const response = await fetch(`http://localhost:8080/api/v1/documents/entreprise/${entrepriseId}`, {
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
      const response = await fetch(`http://localhost:8080/api/v1/entreprises/${entreprise.id}`, {
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
      const response = await fetch(`http://localhost:8080/api/v1/documents/${documentId}/file`, {
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
