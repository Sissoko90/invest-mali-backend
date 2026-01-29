import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import { entreprisesAPI, ninaAPI } from '../services/api';
import { API_CONFIG } from '../config/api.config';
import { Entreprise } from '../types';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import Certificate from './Certificate';

interface NinaStepProps {
  onEntrepriseUpdate?: (entreprise: Entreprise) => void;
}

interface NinaGenerationResponse {
  status: string;
  message?: string; // Pour les messages d'erreur
  res?: {
    nina: string;
  };
}

const NinaStep: React.FC<NinaStepProps> = ({ onEntrepriseUpdate }) => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureValidation, setSignatureValidation] = useState<{isValid: boolean, message: string} | null>(null);
  const [signatureMetadata, setSignatureMetadata] = useState<{size: number, type: string, name: string} | null>(null);
  const [showSignatureUpload, setShowSignatureUpload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCertificatePreview, setShowCertificatePreview] = useState<string | null>(null);
  const [isChangingEtape, setIsChangingEtape] = useState<string | null>(null);

  useEffect(() => {
    loadEntreprises();
  }, []);

  // Vérifier le VFQ avec l'API INSTAT quand une entreprise est sélectionnée pour prévisualisation
  useEffect(() => {
    if (showCertificatePreview) {
      const entreprise = entreprises.find(e => e.id === showCertificatePreview);
      if (entreprise) {
        // Récupérer les détails complets de l'entreprise pour avoir les vraies infos du gérant
        fetchEntrepriseComplete(entreprise.id);
        
        // Vérifier le VFQ avec l'API INSTAT
        if (entreprise.divisionCode) {
          console.log(`🔍 Vérification VFQ pour l'entreprise ${entreprise.nom}: ${entreprise.divisionCode}`);
          fetchLocationFromINSTAT(entreprise.divisionCode).then(result => {
            if (result) {
              console.log(`✅ VFQ résolu pour ${entreprise.nom}: ${result}`);
            } else {
              console.warn(`⚠️ VFQ non résolu pour ${entreprise.nom}: ${entreprise.divisionCode}`);
            }
          });
        }
      }
    }
  }, [showCertificatePreview, entreprises]);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Charger les entreprises à l'étape NINA
      const response = await entreprisesAPI.getByEtape('NINA');
      const entreprisesData = response.data || [];
      
      setEntreprises(entreprisesData);
    } catch (error) {
      console.error('❌ [NinaStep] Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des entreprises');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangerEtape = async (entrepriseId: string, nouvelleEtape: string, action: string) => {
    try {
      setIsChangingEtape(entrepriseId);
      console.log(`🔄 [NinaStep] Changement d'étape pour ${entrepriseId} vers ${nouvelleEtape}`);
      
      // Créer l'objet de mise à jour avec le bon type
      const updateData: Record<string, any> = {
        etapeValidation: nouvelleEtape
      };
      
      const response = await entreprisesAPI.update(entrepriseId, updateData);
      
      console.log(`✅ [NinaStep] Étape changée avec succès:`, response);
      alert(`Entreprise ${action} avec succès !`);
      
      // Recharger la liste
      loadEntreprises();
    } catch (error: any) {
      console.error(`❌ [NinaStep] Erreur lors du changement d'étape:`, error);
      alert(`Erreur lors du changement d'étape: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsChangingEtape(null);
    }
  };

  const handlePasserARetrait = (entrepriseId: string) => {
    if (window.confirm('Voulez-vous vraiment faire passer cette entreprise à l\'étape RETRAIT ?')) {
      handleChangerEtape(entrepriseId, 'RETRAIT', 'passée à RETRAIT');
    }
  };

  const handleRetourArriere = (entrepriseId: string) => {
    if (window.confirm('Voulez-vous vraiment faire retourner cette entreprise à l\'étape RCCM2 ?')) {
      handleChangerEtape(entrepriseId, 'RCCM2', 'retournée à RCCM2');
    }
  };

  const handleGenerateNina = async (entreprise: Entreprise) => {
    // Récupérer le numéro RCCM depuis la base de données
    const rccm = entreprise.numeroRccm;
    
    if (!rccm || rccm.trim() === '') {
      setError('Aucun numéro RCCM trouvé pour cette entreprise. Veuillez d\'abord générer le RCCM.');
      return;
    }

    try {
      setIsGenerating(entreprise.id);
      setError(null);
      
      console.log('🔄 [NinaStep] Génération NINA pour:', entreprise.nom, 'RCCM:', rccm);
      
      // TEMPORAIRE : Tester d'abord l'endpoint ULTRA SIMPLE
      console.log('🧪 [NinaStep] Test PING...');
      try {
        const pingResponse = await ninaAPI.ping();
        console.log('✅ [NinaStep] Ping réussi:', pingResponse.data);
      } catch (pingError) {
        console.error('❌ [NinaStep] Ping échoué:', pingError);
        throw new Error('Contrôleur NINA non accessible');
      }
      
      // Test SANS authentification
      console.log('🧪 [NinaStep] Test SANS authentification...');
      try {
        const noAuthResponse = await ninaAPI.testNoAuth(entreprise.id, rccm);
        console.log('✅ [NinaStep] Test sans auth réussi:', noAuthResponse.data);
      } catch (noAuthError) {
        console.error('❌ [NinaStep] Test sans auth échoué:', noAuthError);
      }
      
      // Test avec authentification
      console.log('🧪 [NinaStep] Test AVEC authentification...');
      const testResponse = await ninaAPI.testGenerate(entreprise.id, rccm);
      console.log('✅ [NinaStep] Test avec auth réussi:', testResponse.data);
      
      // Si le test fonctionne, essayer le vrai endpoint
      console.log('🔄 [NinaStep] Appel du vrai endpoint...');
      const response = await ninaAPI.generateNina(entreprise.id, rccm);
      const result: NinaGenerationResponse = response.data;
      
      if (result.status === 'success' && result.res?.nina) {
        console.log('✅ [NinaStep] NINA généré:', result.res.nina);
        
        // Recharger les entreprises pour voir le NINA mis à jour
        await loadEntreprises();
        
        // Notifier le parent si nécessaire
        if (onEntrepriseUpdate) {
          const updatedEntreprise = { ...entreprise, numeroNina: result.res.nina };
          onEntrepriseUpdate(updatedEntreprise);
        }
        
      } else {
        // Gérer les erreurs de l'API INSTAT
        console.error('❌ [NinaStep] Erreur API INSTAT:', result);
        
        if (result.status === 'error' && result.message) {
          // Nettoyer le message d'erreur (supprimer les balises HTML)
          const cleanMessage = result.message.replace(/<[^>]*>/g, '');
          throw new Error(cleanMessage);
        } else {
          throw new Error('Réponse invalide de l\'API NINA');
        }
      }
      
    } catch (error: any) {
      console.error('❌ [NinaStep] Erreur génération NINA:', error);
      
      // Gérer les erreurs spécifiques de l'API
      let errorMessage = 'Erreur inconnue';
      
      if (error.response?.data?.message) {
        // Erreur de l'API avec message spécifique
        errorMessage = error.response.data.message.replace(/<[^>]*>/g, '');
      } else if (error.message) {
        // Erreur JavaScript standard
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Ajouter des conseils spécifiques selon le type d'erreur
      let finalMessage = `Erreur lors de la génération du NINA: ${errorMessage}`;
      
      if (errorMessage.includes('rccm') && errorMessage.includes('unique')) {
        finalMessage += '\n\n💡 Conseil: Ce numéro RCCM a déjà été utilisé pour générer un NINA. Veuillez utiliser un numéro RCCM différent.';
      } else if (errorMessage.includes('vfq') && errorMessage.includes('invalid')) {
        finalMessage += '\n\n💡 Conseil: Le code de localisation (VFQ) de cette entreprise n\'est pas reconnu par l\'API INSTAT. Veuillez vérifier les données de localisation.';
      }
      
      setError(finalMessage);
    } finally {
      setIsGenerating(null);
    }
  };


  const handleGenerateCertificate = async (entreprise: Entreprise) => {
    if (!entreprise.numeroNina) {
      setError('Aucun numéro NINA disponible pour générer le certificat');
      return;
    }

    setError(null);
    setIsGenerating(entreprise.id);

    try {
      console.log('🎯 [NinaStep] Génération certificat pour:', entreprise.nom);
      
      // Charger les membres de l'entreprise AVANT de générer le certificat
      console.log('👥 [NinaStep] Chargement des membres de l\'entreprise...');
      await fetchEntrepriseComplete(entreprise.id);
      
      // FORCER l'ouverture de la prévisualisation d'abord
      console.log('📂 [NinaStep] Ouverture forcée de la prévisualisation...');
      setShowCertificatePreview(entreprise.id);
      
      // Attendre que la prévisualisation soit complètement rendue
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Vérifier si la prévisualisation est bien ouverte
      const previewModal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      console.log('🔍 [NinaStep] Modal de prévisualisation trouvée:', !!previewModal);
      
      let blob: Blob;
      
      // TEMPORAIRE : Forcer l'utilisation de la génération locale pour tester
      console.log('🧪 [NinaStep] Test forcé de la génération locale (ignorant l\'API)');
      blob = await generateNinaCertificatePDF(entreprise);
      
      // Code API commenté temporairement pour test
      /*
      try {
        const response = await ninaAPI.generateCertificate(entreprise.id);
        blob = response.data;
        console.log('✅ [NinaStep] Certificat reçu de l\'API, taille:', blob.size, 'bytes');
      } catch (apiError) {
        console.warn('⚠️ [NinaStep] API certificat non disponible, utilisation génération locale');
        
        // Utiliser la nouvelle méthode de génération PDF intégrée au composant Certificate
        blob = await generateNinaCertificatePDF(entreprise);
      }
      */
      
      // Fermer la prévisualisation après génération
      setShowCertificatePreview(null);
      
      // Uploader le certificat NINA dans la table Documents
      console.log('📤 [NinaStep] Upload du certificat NINA dans la base de données...');
      
      try {
        // Récupérer l'entreprise complète pour obtenir les membres
        const entrepriseResponse = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entreprise.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!entrepriseResponse.ok) {
          throw new Error('Impossible de récupérer les détails de l\'entreprise');
        }
        
        const entrepriseData = await entrepriseResponse.json();
        console.log('📋 [NinaStep] Entreprise récupérée:', entrepriseData);
        
        // Trouver un membre valide pour l'upload
        let personneId = null;
        if (entrepriseData.membres && entrepriseData.membres.length > 0) {
          const membre = entrepriseData.membres.find((m: any) => 
            m.role === 'FONDATEUR' || m.role === 'GERANT' || m.role === 'PROMOTEUR' || m.role === 'PRESIDENT'
          ) || entrepriseData.membres[0];
          
          personneId = membre.personId || membre.personne?.id;
        }
        
        if (!personneId && entrepriseData.createdBy?.id) {
          personneId = entrepriseData.createdBy.id;
        }
        
        if (!personneId) {
          console.warn('⚠️ [NinaStep] Aucun personneId trouvé, skip upload dans la BDD');
        } else {
          // Créer le FormData pour l'upload
          const formData = new FormData();
          const file = new File([blob], `certificat-nina-${entreprise.numeroNina}.pdf`, { type: 'application/pdf' });
          formData.append('file', file);
          formData.append('typeDocument', 'NINA'); // Certificat NINA signé
          formData.append('entrepriseId', entreprise.id);
          formData.append('personneId', personneId);
          formData.append('numero', `NINA-${entreprise.numeroNina}`);
          
          console.log('📤 [NinaStep] Upload du certificat NINA avec personneId:', personneId);
          
          const uploadResponse = await fetch(`${API_CONFIG.BASE_URL}/documents/document`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`
            },
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log('✅ [NinaStep] Certificat NINA uploadé dans la BDD:', uploadResult);
          } else {
            console.warn('⚠️ [NinaStep] Erreur upload certificat NINA:', uploadResponse.status);
          }
        }
      } catch (uploadError) {
        console.error('❌ [NinaStep] Erreur lors de l\'upload du certificat:', uploadError);
        // Continuer même en cas d'erreur d'upload
      }
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `certificat-nina-${entreprise.numeroNina}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ [NinaStep] Certificat téléchargé avec succès');
      
    } catch (error) {
      console.error('❌ [NinaStep] Erreur génération certificat:', error);
      setError('Erreur lors de la génération du certificat');
      // Fermer la prévisualisation en cas d'erreur aussi
      setShowCertificatePreview(null);
    } finally {
      setIsGenerating(null);
    }
  };

  // Fonction de diagnostic pour créer un PDF de test
  const createTestPDF = async (entreprise: Entreprise): Promise<Blob> => {
    console.log('🧪 Création d\'un PDF de test pour diagnostic...');
    
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Ajouter du contenu de test
    pdf.setFontSize(20);
    pdf.text('CERTIFICAT D\'IMMATRICULATION - TEST', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text('MINISTERE EN CHARGE DE LA STATISTIQUE', 20, 50);
    pdf.text('REPUBLIQUE DU MALI', 120, 50);
    
    pdf.setFontSize(16);
    pdf.text(`NINA: ${entreprise.numeroNina}`, 20, 80);
    pdf.text(`Entreprise: ${entreprise.nom}`, 20, 100);
    
    // Ajouter un tableau simple
    pdf.text('Informations:', 20, 130);
    pdf.text('Sigle: ' + (entreprise.sigle || 'N/A'), 20, 150);
    pdf.text('Forme juridique: ' + (entreprise.formeJuridique || 'N/A'), 20, 170);
    
    console.log('✅ PDF de test créé');
    return pdf.output('blob');
  };

  const generateNinaCertificatePDF = async (entreprise: Entreprise): Promise<Blob> => {
    console.log('📄 Génération PDF pour:', entreprise.nom);
    
    return new Promise(async (resolve, reject) => {
      try {
        // Attendre un peu plus pour que la prévisualisation soit complètement chargée
        console.log('⏳ Attente du chargement de la prévisualisation...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Trouver le certificat dans la prévisualisation
        let certificateElement = document.querySelector('.certificate-container');
        
        if (!certificateElement) {
          console.log('🔍 Certificat non trouvé, recherche dans toutes les modals...');
          
          // Chercher dans toutes les modals possibles
          const modals = document.querySelectorAll('.fixed, [role="dialog"], .modal');
          console.log(`📋 ${modals.length} modals trouvées`);
          
          for (let i = 0; i < modals.length; i++) {
            const modal = modals[i];
            const cert = modal.querySelector('.certificate-container');
            if (cert) {
              certificateElement = cert;
              console.log(`✅ Certificat trouvé dans la modal ${i + 1}`);
              break;
            }
          }
        }
        
        if (!certificateElement) {
          // Dernière tentative : chercher n'importe où dans le document
          console.log('🔍 Recherche globale du certificat...');
          const allElements = Array.from(document.querySelectorAll('*'));
          for (let element of allElements) {
            if (element.className && element.className.toString().includes('certificate-container')) {
              certificateElement = element;
              console.log('✅ Certificat trouvé par recherche globale');
              break;
            }
          }
        }
        
        if (!certificateElement) {
          console.error('❌ Aucun certificat trouvé dans le DOM');
          console.log('🔍 Éléments disponibles:', {
            modals: document.querySelectorAll('.fixed').length,
            containers: document.querySelectorAll('[class*="container"]').length,
            certificates: document.querySelectorAll('[class*="certificate"]').length
          });
          reject(new Error('Certificat non trouvé dans la prévisualisation'));
          return;
        }

        console.log('📋 Certificat trouvé, déclenchement de l\'export PDF...');
        console.log('📐 Dimensions certificat:', {
          width: (certificateElement as HTMLElement).offsetWidth,
          height: (certificateElement as HTMLElement).offsetHeight,
          visible: (certificateElement as HTMLElement).offsetParent !== null
        });
        
        // Stocker les callbacks dans une variable globale temporaire
        (window as any).pdfCallbacks = { resolve, reject };
        
        // Créer un événement simple pour déclencher l'export PDF
        const exportEvent = new CustomEvent('exportPDF');
        certificateElement.dispatchEvent(exportEvent);
        
      } catch (error) {
        console.error('❌ Erreur dans generateNinaCertificatePDF:', error);
        reject(error);
      }
    });
  };

  // Ces fonctions ne sont plus nécessaires car la génération PDF 
  // est maintenant gérée directement dans le composant Certificate

  const getStatusBadge = (entreprise: Entreprise) => {
    if (entreprise.numeroNina) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          NINA Généré
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
        <ClockIcon className="w-4 h-4 mr-1" />
        En attente
      </span>
    );
  };

  const formatTypeEntreprise = (type: string) => {
    const mapping: Record<string, string> = {
      'ENTREPRISE_INDIVIDUELLE': 'Entreprise Individuelle (Type 3)',
      'SOCIETE': 'Société (Type 4)',
      'GIE': 'GIE (Type 5)'
    };
    return mapping[type] || type;
  };

  // Cache pour les données de localisation INSTAT
  const [locationCache, setLocationCache] = useState<Record<string, string>>({});
  // État pour forcer le re-render du certificat quand le cache est mis à jour
  const [cacheUpdateTrigger, setCacheUpdateTrigger] = useState(0);

  // Fonction pour utiliser l'API INSTAT directe (comme les curls qui fonctionnent)
  const fetchLocationFromINSTAT = async (divisionCode: string): Promise<string | null> => {
    // Vérifier le cache d'abord
    if (locationCache[divisionCode]) {
      return locationCache[divisionCode];
    }

    try {
      console.log(`🔍 Recherche INSTAT directe pour divisionCode: ${divisionCode}`);
      
      // Extraire les codes selon le format INSTAT (comme le backend qui fonctionne)
      const regionCode = divisionCode.substring(0, 2);
      const cercleCode = divisionCode.substring(2, 4);
      const communeCode = divisionCode.substring(0, 8); // Format: RRCCCCCC
      const vfqCode = divisionCode.substring(8);
      
      console.log(`📋 Codes extraits - région: ${regionCode}, cercle: ${cercleCode}, commune: ${communeCode}, vfq: ${vfqCode}`);
      console.log(`📋 [INSTAT] Région: ${regionCode}, Cercle: ${regionCode}${cercleCode}, Commune: ${communeCode}, Quartier: ${divisionCode}`);
      
      // Utiliser l'API INSTAT directe avec les mêmes endpoints que le backend
      const apiUrl = `https://apimali.test.instat.ml/api/get/vfq/${communeCode}`;
      console.log(`🌐 [InstatApiService] Appel API INSTAT directe: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer MTI1OTEyNjkxNDQ5MTIzOTE0NDkxMDc5MTA2OTEzMDkxMTY5MTA0OTEzMjkxMjY5MTI2OTE1NTkxMjI5MTI0OTEzMjkxMDU5MTQ0OTEwNzkxMjc5MTA1OTY1OTEwNTkxMTU5MTA0OTYw',
          'Accept': '*/*',
          'X-CSRF-TOKEN': ''
        }
      });
      
      console.log(`📡 [InstatApiService] Statut réponse: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 [InstatApiService] Réponse reçue: ${Array.isArray(data) ? data.length : 'objet'} éléments`);
        
        const vfqList = Array.isArray(data) ? data : (data.data || []);
        
        // Chercher le VFQ correspondant au divisionCode complet
        const matchingVfq = vfqList.find((vfq: any) => {
          const vfqCodeFromApi = String(vfq.code || vfq.id || '');
          console.log(`🔍 Comparaison VFQ: API="${vfqCodeFromApi}" vs recherché="${divisionCode}"`);
          return vfqCodeFromApi === divisionCode;
        });
        
        if (matchingVfq) {
          const vfqName = matchingVfq.nom || matchingVfq.libelle || matchingVfq.designation;
          const communeName = matchingVfq.commune_nom || matchingVfq.commune || 
                             matchingVfq.parent_nom || matchingVfq.parent;
          
          console.log(`✅ [INSTAT] Quartier trouvé: ${divisionCode} -> ${vfqName}`);
          console.log(`📋 [INSTAT] Division code: ${divisionCode} -> Nom: ${vfqName}`);
          console.log(`🏛️ [INSTAT] Commune extraite de l'API: "${communeName}"`);
          console.log(`🔍 [INSTAT] Objet VFQ complet:`, matchingVfq);
          
          // Déterminer la commune selon le code commune complet (comme DossierCreationForm)
          let finalCommuneName = communeName;
          if (!communeName && regionCode === '90') {
            // Utiliser le même mapping que DossierCreationForm
            const communeCodeToName: Record<string, string> = {
              '90010101': 'COMMUNE I',
              '90010201': 'COMMUNE II', 
              '90010301': 'COMMUNE III',
              '90010401': 'COMMUNE IV',
              '90010501': 'COMMUNE V',
              '90010601': 'COMMUNE VI',
              '90010701': 'COMMUNE VII'
            };
            finalCommuneName = communeCodeToName[communeCode] || 'COMMUNE I';
            console.log(`🎯 [INSTAT] Commune déterminée par code commune ${communeCode}: ${finalCommuneName}`);
          }
          
          // Mettre en cache le résultat - localité seule pour VFQ, commune séparée
          setLocationCache(prev => ({
            ...prev,
            [divisionCode]: vfqName || vfqCode,
            [`commune_${divisionCode}`]: finalCommuneName || 'COMMUNE I'
          }));
          setCacheUpdateTrigger(prev => prev + 1);
          
          return vfqName || vfqCode;
        } else {
          console.warn(`⚠️ VFQ ${divisionCode} non trouvé dans la liste`);
          console.log(`📋 VFQ disponibles:`, vfqList.map((v: any) => ({ 
            code: v.code || v.id, 
            nom: v.nom || v.name,
            commune: v.commune_nom || v.commune 
          })));
        }
      }
      
      console.warn(`❌ Aucune information trouvée via API INSTAT pour ${divisionCode}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'appel API INSTAT pour ${divisionCode}:`, error);
      return null;
    }
  };

  const extractLocationFromDivisionCode = (divisionCode: string): { region: string, cercle: string, commune: string, vfq: string } => {
    if (!divisionCode || divisionCode.length < 8) {
      return {
        region: 'BAMAKO',
        cercle: 'BAMAKO',
        commune: 'Non spécifiée',
        vfq: 'Non spécifié'
      };
    }
    
    // Format du code INSTAT : RRCCCCCCVVVV (12 caractères)
    // RR = Région (2 chiffres), CCCCCC = Commune (6 chiffres), VVVV = Village/Fraction/Quartier (4 chiffres)
    
    // Mapping des codes région INSTAT Mali - Toutes les 21 régions
    const regions: Record<string, string> = {
      '10': 'KAYES',
      '20': 'KOULIKORO', 
      '30': 'SIKASSO',
      '40': 'SÉGOU',
      '50': 'MOPTI',
      '60': 'TOMBOUCTOU',
      '70': 'GAO',
      '80': 'KIDAL',
      '90': 'BAMAKO',
      // Autres régions du Mali selon INSTAT
      '01': 'KAYES',
      '02': 'KOULIKORO',
      '03': 'SIKASSO', 
      '04': 'SÉGOU',
      '05': 'MOPTI',
      '06': 'TOMBOUCTOU',
      '07': 'GAO',
      '08': 'KIDAL',
      '09': 'BAMAKO',
      '11': 'TAOUDÉNI',
      '12': 'MÉNAKA',
      '13': 'DOUENTZA'
    };
    
    const regionCode = divisionCode.substring(0, 2);
    const cercleCode = divisionCode.substring(2, 4);
    const communeCode = divisionCode.substring(0, 8);
    const vfqCode = divisionCode.substring(8);
    
    console.log(`🔍 Extraction codes - divisionCode: ${divisionCode}, regionCode: ${regionCode}, cercleCode: ${cercleCode}, communeCode: ${communeCode}, vfqCode: ${vfqCode}`);
    
    const region = regions[regionCode] || 'RÉGION NON IDENTIFIÉE';
    
    // Mapping des cercles pour Bamako (District de Bamako)
    let cercle = region; // Par défaut, cercle = région
    if (regionCode === '90') {
      cercle = 'BAMAKO'; // Pour Bamako, le cercle est aussi Bamako
    }
    
    // Utiliser le cache API INSTAT pour récupérer les noms de commune et VFQ
    let commune = 'Commune en cours de résolution...';
    let vfq = 'VFQ en cours de résolution...';
    
    // Vérifier le cache d'abord pour les performances
    const cachedCommune = locationCache[`commune_${divisionCode}`];
    const cachedVfq = locationCache[divisionCode];
    
    if (cachedCommune) {
      commune = cachedCommune;
      console.log(`📦 Commune récupérée du cache: ${commune}`);
    } else {
      // Mapping spécial pour les communes de Bamako
      if (regionCode === '90') {
        const communeCodeToName: Record<string, string> = {
          '90010101': 'COMMUNE I',
          '90010201': 'COMMUNE II', 
          '90010301': 'COMMUNE III',
          '90010401': 'COMMUNE IV',
          '90010501': 'COMMUNE V',
          '90010601': 'COMMUNE VI',
          '90010701': 'COMMUNE VII'
        };
        commune = communeCodeToName[communeCode] || 'COMMUNE I';
        console.log(`🎯 Commune Bamako déterminée: ${commune} pour code ${communeCode}`);
      } else {
        // Pour les autres régions, déclencher l'appel API INSTAT
        console.log(`🌐 Interrogation API INSTAT pour divisionCode: ${divisionCode}`);
        fetchLocationFromINSTAT(divisionCode).then(result => {
          if (result) {
            console.log(`✅ Localisation récupérée via API INSTAT: ${result}`);
          }
        });
      }
    }
    
    if (cachedVfq) {
      vfq = cachedVfq;
      console.log(`📦 VFQ récupéré du cache: ${vfq}`);
    } else {
      // Déclencher la récupération via l'API INSTAT si pas en cache
      console.log(`🌐 Interrogation API INSTAT pour VFQ: ${divisionCode}`);
      fetchLocationFromINSTAT(divisionCode).then(result => {
        if (result) {
          console.log(`✅ VFQ récupéré via API INSTAT: ${result}`);
        }
      });
      // Utiliser un nom temporaire basé sur le code en attendant
      vfq = `Quartier ${vfqCode}`;
    }
    
    console.log(`📍 Extraction localisation finale - Code: ${divisionCode}, Région: ${region}, Cercle: ${cercle}, Commune: ${commune}, VFQ: ${vfq}`);
    
    return { region, cercle, commune, vfq };
  };

  const validateSignatureFile = (file: File) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'];

    if (file.size > maxSize) {
      setSignatureValidation({
        isValid: false,
        message: `La taille du fichier dépasse la limite autorisée de 2MB.`
      });
      return;
    }

    if (!acceptedTypes.includes(file.type)) {
      setSignatureValidation({
        isValid: false,
        message: `Le type de fichier n'est pas autorisé. Seuls les fichiers PNG, JPG, GIF et SVG sont acceptés.`
      });
      return;
    }

    setSignatureValidation({
      isValid: true,
      message: `Fichier de signature valide.`
    });

    setSignatureMetadata({
      size: file.size,
      type: file.type,
      name: file.name
    });

    setSignatureFile(file);
  };

  const handleUploadSignature = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateSignatureFile(file);
    }
  };

  const getActivitePrincipale = (entreprise: Entreprise): string => {
    // Utiliser domaineActiviteNr de l'entreprise au lieu de valeurs codées en dur
    if (entreprise.domaineActiviteNr) {
      // Convertir le code en texte lisible
      const domainesActivite: Record<string, string> = {
        'COMMERCE_ET_DISTRIBUTION': 'Commerce et distribution',
        'SERVICES_AUX_ENTREPRISES': 'Services aux entreprises',
        'INDUSTRIE_ET_PRODUCTION': 'Industrie et production',
        'AGRICULTURE_ET_ELEVAGE': 'Agriculture et élevage',
        'TRANSPORT_ET_LOGISTIQUE': 'Transport et logistique',
        'BATIMENT_ET_TRAVAUX_PUBLICS': 'Bâtiment et travaux publics',
        'SANTE_ET_ACTION_SOCIALE': 'Santé et action sociale',
        'EDUCATION_ET_FORMATION': 'Éducation et formation',
        'TOURISME_ET_HOTELLERIE': 'Tourisme et hôtellerie',
        'TECHNOLOGIES_ET_COMMUNICATION': 'Technologies et communication'
      };
      return domainesActivite[entreprise.domaineActiviteNr] || entreprise.domaineActiviteNr;
    }
    
    // Fallback si domaineActiviteNr n'est pas défini
    return '';
  };

  const getDetailsActivite = (entreprise: Entreprise): string => {
    // Utiliser activiteSecondaire de l'entreprise
    if (entreprise.activiteSecondaire && entreprise.activiteSecondaire.trim()) {
      return entreprise.activiteSecondaire.trim();
    }
    
    // Si activiteSecondaire est vide, retourner une chaîne vide
    return '';
  };

  const getAdresseSiege = (entreprise: Entreprise): string => {
    // Utiliser les informations de localisation disponibles
    const location = extractLocationFromDivisionCode(entreprise.divisionCode || "");
    
    return `${location.commune}, ${location.vfq}, ${location.region}`;
  };

  const getPhoneNumber = (entreprise: Entreprise): string => {
    // Chercher le gérant ou promoteur dans les membres de l'entreprise
    const gerant = membresEntreprise.find(membre => 
      membre.role === 'GERANT' || membre.role === 'PROMOTEUR'
    );
    
    if (gerant && gerant.telephone) {
      console.log('✅ Téléphone du gérant trouvé:', gerant.telephone);
      return gerant.telephone;
    }
    
    // Fallback : numéro générique si aucun gérant trouvé
    console.warn('⚠️ Aucun téléphone de gérant trouvé, utilisation du numéro par défaut');
    return '+223 70 00 00 00';
  };

  const [membresEntreprise, setMembresEntreprise] = useState<any[]>([]);
  const [entrepriseComplete, setEntrepriseComplete] = useState<Entreprise | null>(null);

  // Récupérer les détails complets de l'entreprise (incluant les membres)
  const fetchEntrepriseComplete = async (entrepriseId: string) => {
    try {
      console.log('🔍 Récupération des détails complets pour l\'entreprise:', entrepriseId);
      const response = await fetch(`${API_CONFIG.BASE_URL}/entreprises/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('investmali_agent_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const entrepriseData = await response.json();
        console.log('✅ Entreprise complète récupérée:', entrepriseData);
        console.log('🔍 domaineActiviteNr:', entrepriseData.domaineActiviteNr);
        console.log('🔍 activiteSecondaire:', entrepriseData.activiteSecondaire);
        
        // Stocker l'entreprise complète avec toutes ses données
        setEntrepriseComplete(entrepriseData);
        
        // Extraire les membres de la réponse
        if (entrepriseData.membres && Array.isArray(entrepriseData.membres)) {
          console.log('✅ Membres trouvés dans l\'entreprise:', entrepriseData.membres);
          setMembresEntreprise(entrepriseData.membres);
          return entrepriseData.membres;
        } else {
          console.warn('⚠️ Aucun membre trouvé dans la réponse entreprise');
          setMembresEntreprise([]);
          return [];
        }
      } else {
        console.warn('⚠️ Erreur lors de la récupération de l\'entreprise:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur API entreprise complète:', error);
      return [];
    }
  };

  const getGerantInfo = (entreprise: Entreprise): { nom: string, prenom: string } => {
    // Chercher le gérant ou promoteur dans les membres de l'entreprise (si disponibles)
    const gerant = membresEntreprise.find(membre => 
      membre.role === 'GERANT' || membre.role === 'PROMOTEUR'
    );
    
    if (gerant && gerant.nom && gerant.prenom) {
      console.log('✅ Gérant trouvé dans les membres:', gerant);
      return {
        nom: gerant.nom,
        prenom: gerant.prenom
      };
    }
    
    // Fallback robuste avec valeurs par défaut pour éviter les champs vides dans le PDF
    console.warn('⚠️ Aucun gérant trouvé, utilisation de valeurs par défaut');
    return {
      nom: "Gérant",
      prenom: "Entreprise"
    };
  };


  const extractLocationFromDivisionCodeOld = (divisionCode: string | undefined): string => {
    if (!divisionCode || divisionCode.length < 8) {
      return 'Code division invalide';
    }
    
    // Format du code INSTAT : RRCCCCCCVVVV (12 caractères)
    // RR = Région, CCCCCC = Commune, VVVV = Village/Quartier/Fraction
    const region = divisionCode.substring(0, 2);
    const cercle = divisionCode.substring(0, 4);
    const commune = divisionCode.substring(0, 8);
    const vfq = divisionCode;
    
    return `Région: ${region}, Cercle: ${cercle}, Commune: ${commune}, VFQ: ${vfq}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des entreprises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-2 text-primary-600" />
              Génération des Numéros NINA
            </h2>
            <p className="text-gray-600 mt-1">
              Générer les numéros d'identification nationale des entreprises via l'API INSTAT Mali
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Agent: {agent?.firstName} {agent?.lastName}</p>
            <p className="text-sm text-gray-500">Rôle: {agent?.role}</p>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium text-sm mb-1">Erreur de génération NINA</h4>
              <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
              <div className="mt-2">
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 text-xs underline"
                >
                  Fermer ce message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des entreprises */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Entreprises à l'étape NINA ({entreprises.length})
          </h3>
        </div>

        {entreprises.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune entreprise à l'étape NINA</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {entreprises.map((entreprise) => (
              <div key={entreprise.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {entreprise.nom}
                      </h4>
                      {getStatusBadge(entreprise)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Référence:</span> {entreprise.reference}
                      </div>
                      <div>
                        <span className="font-medium">Sigle:</span> {entreprise.sigle || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {formatTypeEntreprise(entreprise.typeEntreprise)}
                      </div>
                      <div>
                        <span className="font-medium">Code Division:</span> {entreprise.divisionCode || 'N/A'}
                      </div>
                    </div>

                    {/* Affichage détaillé de la localisation */}
                    {entreprise.divisionCode && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                        <h5 className="text-primary-800 font-medium text-sm mb-1">Localisation INSTAT</h5>
                        <p className="text-primary-700 text-xs">
                          {(() => {
                            const location = extractLocationFromDivisionCode(entreprise.divisionCode);
                            return `${location.region} - ${location.cercle} - ${location.commune} - ${location.vfq}`;
                          })()}
                        </p>
                      </div>
                    )}

                    {/* Affichage du NINA s'il existe */}
                    {entreprise.numeroNina && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-5 w-5 text-primary-400 mr-2" />
                            <div>
                              <p className="text-primary-800 font-medium">Numéro NINA généré</p>
                              <p className="text-primary-700 font-mono text-lg">{entreprise.numeroNina}</p>
                            </div>
                          </div>
                          
                          {/* Boutons d'actions pour le NINA */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setShowCertificatePreview(entreprise.id)}
                              className="inline-flex items-center px-3 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              title="Prévisualiser le certificat NINA"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              Prévisualiser
                            </button>
                            
                            <button
                              onClick={() => setShowSignatureUpload(entreprise.id)}
                              className="inline-flex items-center px-3 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              title="Ajouter une signature au certificat"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Signature
                            </button>
                            
                            <button
                              onClick={() => handleGenerateCertificate(entreprise)}
                              className="inline-flex items-center px-3 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              title="Télécharger le certificat NINA"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                              Certificat PDF
                            </button>
                            
                            <button
                              onClick={() => window.print()}
                              className="inline-flex items-center px-3 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                              title="Imprimer le certificat NINA"
                            >
                              <PrinterIcon className="w-4 h-4 mr-1" />
                              Imprimer
                            </button>
                          </div>
                        </div>
                        
                        {/* Informations supplémentaires */}
                        <div className="mt-3 pt-3 border-t border-primary-200">
                          <p className="text-primary-600 text-xs">
                            📄 Vous pouvez maintenant générer le certificat d'immatriculation officiel NINA
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Boutons de gestion d'étape */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      {entreprise.numeroNina && (
                        <button
                          onClick={() => handlePasserARetrait(entreprise.id)}
                          disabled={isChangingEtape === entreprise.id}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Faire passer l'entreprise à l'étape RETRAIT"
                        >
                          {isChangingEtape === entreprise.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Traitement...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              Passer à RETRAIT
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRetourArriere(entreprise.id)}
                        disabled={isChangingEtape === entreprise.id}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Faire retourner l'entreprise à l'étape RCCM2"
                      >
                        {isChangingEtape === entreprise.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                            Traitement...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            Retour à RCCM2
                          </>
                        )}
                      </button>
                    </div>

                    {/* Formulaire de génération NINA */}
                    {!entreprise.numeroNina && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="space-y-4">
                          {/* Affichage du numéro RCCM depuis la BDD */}
                          {entreprise.numeroRccm ? (
                            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                              <label className="block text-sm font-medium text-primary-800 mb-1">
                                Numéro RCCM (depuis la base de données)
                              </label>
                              <p className="text-primary-900 font-mono text-lg font-semibold">
                                {entreprise.numeroRccm}
                              </p>
                              <p className="text-xs text-primary-600 mt-1">
                                ✅ Ce numéro RCCM sera utilisé pour générer le NINA via l'API INSTAT
                              </p>
                            </div>
                          ) : (
                            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                              <p className="text-primary-800 text-sm">
                                ⚠️ Aucun numéro RCCM trouvé. Veuillez d'abord générer le RCCM pour cette entreprise.
                              </p>
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleGenerateNina(entreprise)}
                            disabled={isGenerating === entreprise.id || !entreprise.numeroRccm?.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating === entreprise.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Génération en cours...
                              </>
                            ) : (
                              <>
                                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                Générer le NINA
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations sur l'API NINA */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-start">
          <EyeIcon className="h-5 w-5 text-primary-400 mr-2 mt-0.5" />
          <div>
            <h4 className="text-primary-800 font-medium">À propos de l'API NINA INSTAT Mali</h4>
            <p className="text-primary-700 text-sm mt-1">
              Le système génère automatiquement les numéros NINA en utilisant les informations de l'entreprise :
              nom, sigle, gérant, localisation INSTAT, et type d'entreprise. Le numéro RCCM doit être fourni manuellement.
            </p>
            <ul className="text-primary-700 text-sm mt-2 space-y-1">
              <li>• Type 3 : Entreprise Individuelle</li>
              <li>• Type 4 : Société</li>
              <li>• Type 5 : GIE (Groupement d'Intérêt Économique)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de prévisualisation du certificat */}
      {showCertificatePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Prévisualisation du Certificat NINA</h3>
              <button
                onClick={() => setShowCertificatePreview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {(() => {
                const entreprise = entreprises.find(e => e.id === showCertificatePreview);
                if (!entreprise) return null;
                
                // Utiliser entrepriseComplete si disponible, sinon entreprise de base
                const entrepriseToUse = entrepriseComplete || entreprise;
                console.log('🔍 Entreprise utilisée pour le certificat:', entrepriseToUse);
                console.log('🔍 domaineActiviteNr dans certificat:', entrepriseToUse.domaineActiviteNr);
                console.log('🔍 numeroNina dans certificat:', entrepriseToUse.numeroNina);
                
                // Extraire les informations de localisation du divisionCode
                console.log('🔍 divisionCode utilisé pour le certificat:', entrepriseToUse.divisionCode);
                
                // Vérifier si on utilise un code par défaut problématique
                if (!entrepriseToUse.divisionCode || entrepriseToUse.divisionCode === '10040102') {
                  console.warn('⚠️ ATTENTION: Code de division par défaut détecté!', {
                    divisionCode: entrepriseToUse.divisionCode,
                    entrepriseId: entrepriseToUse.id,
                    entrepriseNom: entrepriseToUse.nom
                  });
                }
                
                const location = extractLocationFromDivisionCode(entrepriseToUse.divisionCode || "");
                const region = location.region;
                const cercle = location.cercle;
                const commune = location.commune;
                const localite = location.vfq;
                
                console.log('📍 Localisation extraite pour le certificat:', {
                  divisionCode: entrepriseToUse.divisionCode,
                  region,
                  cercle, 
                  commune,
                  localite
                });
                
                // Formatage des dates
                const today = new Date();
                const dateDemande = entreprise.creation ? new Date(entreprise.creation).toLocaleDateString('fr-FR') : today.toLocaleDateString('fr-FR');
                const dateSignature = today.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                
                // Récupérer les informations du gérant
                const gerantInfo = getGerantInfo(entreprise);
                console.log('👤 Informations du gérant pour le certificat:', gerantInfo);
                
                return (
                  <Certificate
                    nina={entrepriseToUse.numeroNina || entreprise.numeroNina || "N/A"}
                    sigle={entrepriseToUse.sigle || ""}
                    nomResponsable={gerantInfo.nom}
                    prenomResponsable={gerantInfo.prenom}
                    rccmDate={dateDemande}
                    rccmNumber={entrepriseToUse.numeroRccm || entreprise.numeroRccm || ""}
                    region={region}
                    cercle={cercle}
                    commune={commune}
                    localite={localite}
                    formeJuridique={entrepriseToUse.formeJuridique || "Entreprise Individuelle"}
                    activitePrincipale={getActivitePrincipale(entrepriseToUse)}
                    detailsActivite={getDetailsActivite(entrepriseToUse) || ""}
                    adresseSiege={getAdresseSiege(entrepriseToUse)}
                    telephone1={getPhoneNumber(entrepriseToUse)}
                    telephone2=""
                    dateDemande={dateDemande}
                    dateSignature={dateSignature}
                    signatureFile={signatureFile}
                    signaturePreview={signaturePreview}
                  />
                );
              })()}
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowCertificatePreview(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const entreprise = entreprises.find(e => e.id === showCertificatePreview);
                  if (entreprise) {
                    handleGenerateCertificate(entreprise);
                    // NE PAS fermer la modal ici - elle sera fermée dans handleGenerateCertificate après génération
                  }
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'upload de signature amélioré */}
      {showSignatureUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ajouter une signature électronique au certificat
              </h3>
              
              <div className="mb-4">
                <label htmlFor="signature-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une image de signature :
                </label>
                <input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      validateSignatureFile(file);
                      // Générer l'aperçu
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setSignaturePreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés : PNG, JPG, GIF, SVG (recommandé : PNG avec fond transparent)
                  <br />Taille max : 2MB, dimensions recommandées : 300x150px
                </p>
                
                {/* Validation de la signature */}
                {signatureValidation && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    signatureValidation.isValid 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {signatureValidation.isValid ? (
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {signatureValidation.message}
                    </div>
                    {signatureMetadata && signatureValidation.isValid && (
                      <div className="mt-1 text-xs text-gray-600">
                        Fichier : {signatureMetadata.name} ({(signatureMetadata.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {signaturePreview && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Aperçu de la signature :</p>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="relative">
                      <img 
                        src={signaturePreview} 
                        alt="Aperçu signature" 
                        className="max-w-full max-h-24 mx-auto block"
                        style={{ maxWidth: '200px' }}
                      />
                      {/* Bouton pour supprimer la signature */}
                      <button
                        onClick={() => {
                          setSignatureFile(null);
                          setSignaturePreview(null);
                          setSignatureValidation(null);
                          setSignatureMetadata(null);
                        }}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Supprimer la signature"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-600">Cette signature sera intégrée au certificat NINA</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSignatureUpload(null);
                    setSignatureFile(null);
                    setSignaturePreview(null);
                    setSignatureValidation(null);
                    setSignatureMetadata(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (signatureFile) {
                      // Générer et sauvegarder automatiquement le certificat signé
                      const entrepriseId = showSignatureUpload;
                      const entreprise = entreprises.find(e => e.id === entrepriseId);
                      if (entreprise) {
                        await handleGenerateCertificate(entreprise);
                      }
                    }
                    setShowSignatureUpload(null);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  disabled={!!(signatureFile && signatureValidation && !signatureValidation.isValid)}
                >
                  {signatureFile ? 'Générer et sauvegarder le certificat' : 'Continuer sans signature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NinaStep;
























