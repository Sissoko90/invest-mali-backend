import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI } from '../services/api';
import { API_CONFIG } from '../config/api.config';
import { Entreprise } from '../types';
import { 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';

interface RetraitStepProps {
  onDossierUpdate?: (dossier: any) => void;
}

const RetraitStep: React.FC<RetraitStepProps> = ({ onDossierUpdate }) => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
  const [marking, setMarking] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les entreprises à l'étape RETRAIT (prêtes pour le retrait)
      const response = await entreprisesAPI.getByEtape('RETRAIT');
      const data = response.data;
      
      // Extraire les entreprises du format de réponse
      let entreprisesList: Entreprise[] = [];
      if (Array.isArray(data)) {
        entreprisesList = data;
      } else if (data?.content) {
        entreprisesList = data.content;
      } else if (data?.data) {
        entreprisesList = data.data;
      }
      
      setEntreprises(entreprisesList);
    } catch (err: any) {
      console.error('❌ Erreur chargement entreprises:', err);
      setError(err.message || 'Erreur lors du chargement des entreprises');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (entrepriseId: string, documentType: 'RCCM' | 'NINA') => {
    try {
      setDownloading(prev => ({ ...prev, [`${entrepriseId}-${documentType}`]: true }));
      
      const entreprise = entreprises.find(e => e.id === entrepriseId);
      if (!entreprise) {
        throw new Error('Entreprise non trouvée');
      }

      // Récupérer le token une seule fois
      const token = localStorage.getItem('investmali_agent_token');
      
      // Récupérer les documents de l'entreprise depuis l'endpoint qui retourne les vrais documents
      const documentsResponse = await fetch(`${API_CONFIG.BASE_URL}/documents/entreprise/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!documentsResponse.ok) {
        throw new Error(`Erreur lors de la récupération des documents: ${documentsResponse.status}`);
      }
      
      const documents = await documentsResponse.json();
      
      console.log(`📄 Documents récupérés pour ${entreprise.nom}:`, documents);
      // Trouver le document correspondant - PRIORITÉ AU FICHIER REMPLACÉ
      let foundDocument = null;
      if (documentType === 'RCCM') {
        // Chercher le document RCCM uploadé/remplacé à l'étape RCCM2
        // Priorité aux documents avec typeDocument='RCCM' ou type='RCCM'/'REGISTRE_COMMERCE'
        foundDocument = documents.find((doc: any) => 
          doc.typeDocument === 'RCCM' || 
          doc.type === 'RCCM' || 
          doc.type === 'REGISTRE_COMMERCE'
        );
        
        console.log(`🔍 Document RCCM trouvé:`, foundDocument);
        
        if (foundDocument) {
          console.log(`✅ RCCM remplacé trouvé - téléchargement du fichier réel`);
        } else {
          console.log(`⚠️ Aucun document RCCM remplacé trouvé, génération d'un certificat...`);
        }
      } else if (documentType === 'NINA') {
        foundDocument = documents.find((doc: any) => 
          doc.typeDocument === 'NINA' || 
          doc.type === 'NINA' || 
          doc.type === 'CERTIFICAT_NINA'
        );
        
        console.log(`🔍 Document NINA trouvé:`, foundDocument);
        
        if (!foundDocument) {
          console.log(`⚠️ Aucun document NINA trouvé, génération d'un certificat...`);
        }
      }
      
      // Si on a trouvé un document réel (fichier remplacé), le télécharger
      if (foundDocument) {
        console.log(`📥 Téléchargement du fichier ${documentType} remplacé: ${foundDocument.nom || foundDocument.numero}`);
        
        // Télécharger le fichier réel en utilisant l'endpoint /file
        const downloadUrl = `${API_CONFIG.BASE_URL}/documents/${foundDocument.id}/file`;
        
        console.log(`📥 Téléchargement du document depuis: ${downloadUrl}`);
        
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur lors du téléchargement: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Utiliser le nom du fichier original ou générer un nom
        const fileName = foundDocument.nom || foundDocument.nomFichier || foundDocument.nomDocument || 
          (documentType === 'RCCM' 
            ? `RCCM_${entreprise.numeroRccm || entreprise.nom}.pdf`
            : `NINA_${entreprise.numeroNina || entreprise.nom}.pdf`);
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log(`✅ Fichier ${documentType} remplacé téléchargé: ${fileName}`);
      } else {
        // Fallback: générer un certificat si aucun fichier remplacé n'est trouvé
        console.log(`📄 Aucun fichier ${documentType} remplacé trouvé, génération d'un certificat...`);
        
        if (documentType === 'NINA') {
          // Générer le certificat NINA en PDF via l'API backend
          if (!entreprise.numeroNina) {
            throw new Error('Aucun numéro NINA disponible pour cette entreprise. Veuillez d\'abord générer le NINA.');
          }
          
          console.log(`📄 Génération du certificat NINA PDF pour ${entreprise.nom}...`);
          
          // Appeler l'API backend pour générer le certificat NINA en PDF
          const certificateUrl = `${API_CONFIG.BASE_URL}/nina/certificate/${entreprise.id}`;
          console.log(`📥 Génération du certificat NINA depuis: ${certificateUrl}`);
          
          const response = await fetch(certificateUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Erreur lors de la génération du certificat NINA: ${response.status}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Certificat_NINA_${entreprise.numeroNina || entreprise.nom}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log(`✅ Certificat NINA généré et téléchargé`);
          return;
        } else if (documentType === 'RCCM') {
          // Générer le RCCM en PDF via l'API backend
          if (!entreprise.numeroRccm) {
            throw new Error('Aucun numéro RCCM disponible pour cette entreprise. Veuillez d\'abord générer le RCCM.');
          }
          
          console.log(`📄 Génération du certificat RCCM PDF pour ${entreprise.nom}...`);
          
          // Appeler l'API backend pour générer le certificat RCCM en PDF
          const certificateUrl = `${API_CONFIG.BASE_URL}/rccm/certificate/${entreprise.id}`;
          console.log(`📥 Génération du certificat RCCM depuis: ${certificateUrl}`);
          
          const response = await fetch(certificateUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Erreur lors de la génération du certificat RCCM: ${response.status}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Certificat_RCCM_${entreprise.numeroRccm || entreprise.nom}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log(`✅ Certificat RCCM PDF généré et téléchargé`);
          return;
        }
      }
    } catch (err: any) {
      console.error(`❌ Erreur téléchargement ${documentType}:`, err);
      alert(`Erreur lors du téléchargement du document ${documentType}: ${err.message}`);
    } finally {
      setDownloading(prev => ({ ...prev, [`${entrepriseId}-${documentType}`]: false }));
    }
  };

  const generateDocumentContent = (entreprise: Entreprise, type: 'RCCM' | 'NINA'): string => {
    const date = new Date().toLocaleDateString('fr-FR');
    
    if (type === 'RCCM') {
      return `
═══════════════════════════════════════════════════════════════
        REGISTRE DE COMMERCE ET DU CRÉDIT MOBILIER (RCCM)
                         RÉPUBLIQUE DU MALI
═══════════════════════════════════════════════════════════════

Date d'émission: ${date}

INFORMATIONS DE L'ENTREPRISE
─────────────────────────────────────────────────────────────

Numéro RCCM: ${entreprise.numeroRccm || 'Non attribué'}
Nom de l'entreprise: ${entreprise.nom}
Sigle: ${entreprise.sigle || 'N/A'}
Forme juridique: ${entreprise.formeJuridique || 'N/A'}
Capital social: N/A

ACTIVITÉ
─────────────────────────────────────────────────────────────

Domaine d'activité: ${entreprise.domaineActivite || 'N/A'}
Activité secondaire: ${entreprise.activiteSecondaire || 'N/A'}

LOCALISATION
─────────────────────────────────────────────────────────────

Division: ${entreprise.divisionCode || 'N/A'}
Antenne: N/A

STATUT
─────────────────────────────────────────────────────────────

Statut de création: ${entreprise.statutCreation || 'N/A'}
Étape de validation: ${entreprise.etapeValidation || 'N/A'}
Date de création: ${entreprise.creation ? new Date(entreprise.creation).toLocaleDateString('fr-FR') : 'N/A'}

═══════════════════════════════════════════════════════════════
Ce document est délivré par l'API-MALI - Agence pour la Promotion 
des Investissements au Mali
═══════════════════════════════════════════════════════════════
      `;
    } else {
      return `
═══════════════════════════════════════════════════════════════
    NUMÉRO D'IDENTIFICATION NATIONALE D'ENTREPRISE (NINA)
                         RÉPUBLIQUE DU MALI
═══════════════════════════════════════════════════════════════

Date d'émission: ${date}

INFORMATIONS DE L'ENTREPRISE
─────────────────────────────────────────────────────────────

Numéro NINA: ${entreprise.numeroNina || 'Non attribué'}
Nom de l'entreprise: ${entreprise.nom}
Sigle: ${entreprise.sigle || 'N/A'}
Numéro RCCM: ${entreprise.numeroRccm || 'N/A'}

IDENTIFICATION FISCALE
─────────────────────────────────────────────────────────────

Type d'entreprise: ${entreprise.typeEntreprise || 'N/A'}
Forme juridique: ${entreprise.formeJuridique || 'N/A'}
Capital social: N/A

ACTIVITÉ ÉCONOMIQUE
─────────────────────────────────────────────────────────────

Domaine d'activité: ${entreprise.domaineActivite || 'N/A'}
Activité secondaire: ${entreprise.activiteSecondaire || 'N/A'}

LOCALISATION
─────────────────────────────────────────────────────────────

Code division INSTAT: ${entreprise.divisionCode || 'N/A'}
Antenne de gestion: N/A

INFORMATIONS ADMINISTRATIVES
─────────────────────────────────────────────────────────────

Référence dossier: ${entreprise.reference || 'N/A'}
Date d'enregistrement: ${entreprise.creation ? new Date(entreprise.creation).toLocaleDateString('fr-FR') : 'N/A'}
Statut: ${entreprise.statutCreation || 'N/A'}

═══════════════════════════════════════════════════════════════
Ce document est délivré par l'API-MALI en collaboration avec 
l'Institut National de la Statistique (INSTAT)
═══════════════════════════════════════════════════════════════
      `;
    }
  };

  const handleMarkAsWithdrawn = async (entrepriseId: string) => {
    try {
      setMarking(prev => ({ ...prev, [entrepriseId]: true }));
      
      // Appel API pour marquer comme retiré et passer à l'étape RETRAIT
      await entreprisesAPI.update(entrepriseId, { etapeValidation: 'RETRAIT' });
      
      console.log(`✅ Entreprise ${entrepriseId} marquée comme retirée`);
      
      // Recharger la liste
      await loadEntreprises();
      
      alert('Documents marqués comme retirés avec succès !');
    } catch (err: any) {
      console.error('❌ Erreur marquage retrait:', err);
      alert('Erreur lors du marquage comme retiré');
    } finally {
      setMarking(prev => ({ ...prev, [entrepriseId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-800">Chargement des entreprises</h3>
            <p className="text-slate-600 mt-2">Récupération des dossiers prêts pour retrait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Erreur</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadEntreprises}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-sky-600 rounded-2xl shadow-lg mr-4">
            <DocumentArrowDownIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">Étape RETRAIT</h2>
            <p className="text-lg text-slate-600 font-medium">Téléchargement et remise des documents finaux</p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-slate-600 font-bold">Dossiers prêts</p>
              <p className="text-4xl font-black text-slate-800">{entreprises.length}</p>
            </div>
            <ClockIcon className="h-10 w-10 text-sky-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-slate-600 font-bold">Documents disponibles</p>
              <p className="text-4xl font-black text-slate-800">{entreprises.length * 2}</p>
            </div>
            <DocumentTextIcon className="h-10 w-10 text-sky-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-white/95 via-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-slate-600 font-bold">En attente de retrait</p>
              <p className="text-4xl font-black text-slate-800">{entreprises.length}</p>
            </div>
            <DocumentArrowDownIcon className="h-10 w-10 text-sky-600" />
          </div>
        </div>
      </div>

      {/* Liste des entreprises */}
      {entreprises.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-sky-600 rounded-2xl shadow-lg mx-auto mb-6 w-fit">
            <ExclamationTriangleIcon className="h-12 w-12 text-white mx-auto" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-3 ">
            Aucun dossier en attente de retrait
          </h3>
          <p className="text-lg text-slate-600 font-medium max-w-md mx-auto">
            Tous les documents ont été remis ou aucune entreprise n'a encore terminé l'étape NINA.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="bg-gradient-to-r from-white/95 via-slate-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-black text-slate-800 mb-2">{entreprise.nom}</h4>
                  <div className="grid grid-cols-2 gap-3 text-lg text-slate-600">
                    <div>
                      <span className="font-medium">Référence:</span>
                      <span className="ml-2 font-semibold text-slate-800">{entreprise.reference}</span>
                    </div>
                    <div>
                      <span className="font-medium">Forme juridique:</span>
                      <span className="ml-2 font-semibold text-slate-800">{entreprise.formeJuridique || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">N° RCCM:</span>
                      <span className="ml-2 font-mono font-semibold text-blue-700">
                        {entreprise.numeroRccm || 'Non attribué'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">N° NINA:</span>
                      <span className="ml-2 font-mono font-semibold text-blue-700">
                        {entreprise.numeroNina || 'Non attribué'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons de téléchargement */}
              <div className="border-t border-white/40 pt-4 mt-4">
                <p className="text-lg font-medium text-slate-700 mb-3">Documents disponibles:</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleDownloadDocument(entreprise.id, 'RCCM')}
                    disabled={downloading[`${entreprise.id}-RCCM`] || !entreprise.numeroRccm}
                    className="flex items-center px-4 py-2 text-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    {downloading[`${entreprise.id}-RCCM`] ? 'Téléchargement...' : 'Télécharger RCCM'}
                  </button>
                  
                  <button
                    onClick={() => handleDownloadDocument(entreprise.id, 'NINA')}
                    disabled={downloading[`${entreprise.id}-NINA`] || !entreprise.numeroNina}
                    className="flex items-center px-4 py-2 text-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    {downloading[`${entreprise.id}-NINA`] ? 'Téléchargement...' : 'Télécharger NINA'}
                  </button>
                  
                  <button
                    onClick={() => handleMarkAsWithdrawn(entreprise.id)}
                    disabled={marking[entreprise.id]}
                    className="flex items-center px-4 py-2 text-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {marking[entreprise.id] ? 'Traitement...' : 'Marquer comme retiré'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RetraitStep;
























