<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, InformationCircleIcon, CloudArrowUpIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { enumsAPI } from '../services/api';

interface InvestmentData {
  // Promoteur info
  promoteurNom: string;
  promoteurNationalite: string;
  promoteurAdresse: string;
  
  // 1. Identification du projet
  nomRaisonSociale: string;
  activite: string;
  formeJuridique: string;
  localisation: string;
  adresse: string;
  numeroNina: string;
  numeroRccm: string;
  
  // 2. Caractéristiques du projet
  investissementTotal: number;
  immobilisations: number;
  fondsRoulement: number;
  
  // Plan de financement
  fondsPropres: number;
  credits: number;
  autres: number;
  
  // Taux de participation
  tauxNationaux: number;
  tauxExpatries: number;
  
  // Emplois
  emploisNationaux: number;
  emploisExpatries: number;
  
  // Autres données
  tauxValeurAjoutee: number;
  capaciteProduction: string;
  marcheLocal: number;
  marcheExterieur: number;
  
  // Régime sollicité
  regimeSollicite: 'A' | 'B' | 'C' | 'D' | 'ZONES_ECONOMIQUES';
  
  // Documents uploadés
  documents?: UploadedDocument[];
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
  documentType: 'DEMANDE_TIMBREE' | 'ETUDE_FAISABILITE' | 'STATUTS' | 'AUTORISATION_EXERCICE' | 'AUTRE';
}

interface InvestmentAgreementRequestProps {
  onSubmit: (data: InvestmentData) => void;
  initialData?: Partial<InvestmentData>;
}

const InvestmentAgreementRequest: React.FC<InvestmentAgreementRequestProps> = ({
  onSubmit,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<InvestmentData>({
    promoteurNom: '',
    promoteurNationalite: 'MALIENNE',
    promoteurAdresse: '',
    nomRaisonSociale: '',
    activite: '',
    formeJuridique: '',
    localisation: '',
    adresse: '',
    numeroNina: '',
    numeroRccm: '',
    investissementTotal: 0,
    immobilisations: 0,
    fondsRoulement: 0,
    fondsPropres: 0,
    credits: 0,
    autres: 0,
    tauxNationaux: 100,
    tauxExpatries: 0,
    emploisNationaux: 0,
    emploisExpatries: 0,
    tauxValeurAjoutee: 0,
    capaciteProduction: '',
    marcheLocal: 100,
    marcheExterieur: 0,
    regimeSollicite: 'A',
    documents: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  
  // États pour les enums du backend
  const [nationalites, setNationalites] = useState<Array<{key: string, value: string}>>([]);
  const [domaineActivites, setDomaineActivites] = useState<Array<{key: string, value: string}>>([]);
  const [formesJuridiques, setFormesJuridiques] = useState<Array<{key: string, value: string}>>([]);
  const [loadingEnums, setLoadingEnums] = useState(true);

  const regimeOptions = [
    { code: 'A', label: 'Régime A', frais: 350000 },
    { code: 'B', label: 'Régime B', frais: 450000 },
    { code: 'C', label: 'Régime C', frais: 550000 },
    { code: 'D', label: 'Régime D', frais: 600000 },
    { code: 'ZONES_ECONOMIQUES', label: 'Régime des Zones Économiques', frais: 600000 }
  ];

  const documentTypes = [
    { code: 'DEMANDE_TIMBREE', label: 'Demande timbrée', required: true },
    { code: 'ETUDE_FAISABILITE', label: 'Étude de faisabilité', required: true },
    { code: 'STATUTS', label: 'Statuts (pour les sociétés)', required: false },
    { code: 'AUTORISATION_EXERCICE', label: 'Autorisation d\'exercice', required: false },
    { code: 'AUTRE', label: 'Autre document', required: false }
  ];

  // Charger les enums du backend au démarrage
  useEffect(() => {
    const loadEnums = async () => {
      try {
        setLoadingEnums(true);
        
        // Charger les enums en parallèle
        const [nationalitesData, domaineActivitesData, formesJuridiquesData] = await Promise.all([
          enumsAPI.getNationalites(),
          enumsAPI.getDomaineActivitesNr(),
          enumsAPI.getSocieteJuridictions()
        ]);

        console.log('🔍 DIAGNOSTIC ENUMS - Données reçues:', { nationalitesData, domaineActivitesData, formesJuridiquesData });
        console.log('🔍 Type de formesJuridiquesData:', typeof formesJuridiquesData);
        console.log('🔍 Contenu formesJuridiquesData:', formesJuridiquesData);
        console.log('🔍 Keys de formesJuridiquesData:', formesJuridiquesData ? Object.keys(formesJuridiquesData) : 'null');

        // Transformer les données pour le format attendu
        if (nationalitesData) {
          let nationalitesOptions: Array<{key: string, value: string}> = [];
          if (Array.isArray(nationalitesData)) {
            // Les données sont déjà un tableau avec {key, label, value}
            nationalitesOptions = nationalitesData.map((item: any) => ({
              key: item.key,
              value: item.label || item.value || item.key
            }));
          } else if (typeof nationalitesData === 'object') {
            nationalitesOptions = Object.entries(nationalitesData).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : String(value)
            }));
          }
          setNationalites(nationalitesOptions);
        }

        if (domaineActivitesData) {
          let domaineOptions: Array<{key: string, value: string}> = [];
          if (Array.isArray(domaineActivitesData)) {
            // Les données sont déjà un tableau avec {key, label, value}
            domaineOptions = domaineActivitesData.map((item: any) => ({
              key: item.key,
              value: item.label || item.value || item.key
            }));
          } else if (typeof domaineActivitesData === 'object') {
            domaineOptions = Object.entries(domaineActivitesData).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : String(value)
            }));
          }
          setDomaineActivites(domaineOptions);
        }

        if (formesJuridiquesData) {
          console.log('🔧 Transformation formesJuridiques - Données brutes:', formesJuridiquesData);
          let formeOptions: Array<{key: string, value: string}> = [];
          if (Array.isArray(formesJuridiquesData)) {
            console.log('🔧 formesJuridiquesData est un tableau, transformation...');
            // Les données sont un tableau avec {key, label, value}
            formeOptions = formesJuridiquesData.map((item: any) => ({
              key: item.key,
              value: item.label || item.value || item.key
            }));
            console.log('🔧 formeOptions transformées:', formeOptions);
          } else if (typeof formesJuridiquesData === 'object') {
            console.log('🔧 formesJuridiquesData est un objet, transformation en cours...');
            formeOptions = Object.entries(formesJuridiquesData).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : String(value)
            }));
            console.log('🔧 formeOptions transformées:', formeOptions);
          }
          setFormesJuridiques(formeOptions);
          console.log('🔧 setFormesJuridiques appelé avec:', formeOptions);
        } else {
          console.log('🔧 formesJuridiquesData est null ou undefined');
        }

      } catch (error) {
        console.error('Erreur lors du chargement des enums:', error);
        console.error('Détails de l\'erreur:', error instanceof Error ? error.message : String(error));
        // En cas d'erreur, utiliser des valeurs par défaut
        setNationalites([{ key: 'MALIENNE', value: 'Malienne' }]);
        setFormesJuridiques([
          { key: 'SARL', value: 'SARL' },
          { key: 'SA', value: 'SA' },
          { key: 'SAS', value: 'SAS' },
          { key: 'E_I', value: 'Entreprise Individuelle' }
        ]);
      } finally {
        setLoadingEnums(false);
        // Utiliser setTimeout pour vérifier l'état après la mise à jour
        setTimeout(() => {
          console.log('📊 États finaux des enums après mise à jour:', { 
            nationalites: nationalites.length, 
            domaineActivites: domaineActivites.length, 
            formesJuridiques: formesJuridiques.length 
          });
          console.log('📊 Contenu formesJuridiques:', formesJuridiques);
        }, 100);
      }
    };

    loadEnums();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [`upload_${documentType}`]: 'Le fichier ne peut pas dépasser 10MB'
      }));
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [`upload_${documentType}`]: 'Format de fichier non supporté. Utilisez PDF, Word, ou images (JPG, PNG)'
      }));
      return;
    }

    const newDocument: UploadedDocument = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      documentType: documentType as any
    };

    setUploadedDocuments(prev => {
      // Remove existing document of same type
      const filtered = prev.filter(doc => doc.documentType !== documentType);
      return [...filtered, newDocument];
    });

    // Clear any upload errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`upload_${documentType}`];
      return newErrors;
    });
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleInputChange = (field: keyof InvestmentData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.promoteurNom.trim()) newErrors.promoteurNom = 'Le nom du promoteur est requis';
    if (!formData.nomRaisonSociale.trim()) newErrors.nomRaisonSociale = 'Le nom ou raison sociale est requis';
    if (!formData.activite.trim()) newErrors.activite = 'L\'activité est requise';
    if (!formData.formeJuridique) newErrors.formeJuridique = 'La forme juridique est requise';
    if (!formData.localisation.trim()) newErrors.localisation = 'La localisation est requise';
    if (!formData.numeroNina.trim()) newErrors.numeroNina = 'Le numéro NINA est requis';
    if (!formData.numeroRccm.trim()) newErrors.numeroRccm = 'Le numéro RCCM est requis';

    // Format validation
    if (formData.numeroNina.trim() && !/^[0-9A-Z]{15}$|^[0-9A-Z]{21}$/.test(formData.numeroNina.trim())) {
      newErrors.numeroNina = 'Le numéro NINA doit contenir 15 ou 21 caractères (chiffres et lettres)';
    }
    if (formData.numeroRccm.trim() && !/^ML-[A-Z]{3}-\d{2}-\d{4}-[A-Z]-\d{5}$/.test(formData.numeroRccm.trim())) {
      newErrors.numeroRccm = 'Format RCCM invalide (Ex: ML-BKO-01-2026-A-00003)';
    }

    // Financial validation
    if (formData.fondsPropres + formData.credits + formData.autres !== formData.investissementTotal) {
      newErrors.fondsPropres = 'Le plan de financement doit égaler l\'investissement total';
    }

    // Percentage validation
    if (formData.tauxNationaux + formData.tauxExpatries !== 100) {
      newErrors.tauxNationaux = 'Les taux de participation doivent totaliser 100%';
    }
    if (formData.marcheLocal + formData.marcheExterieur !== 100) {
      newErrors.marcheLocal = 'Les parts de marché doivent totaliser 100%';
    }

    // Document validation
    const requiredDocTypes = documentTypes.filter(dt => dt.required).map(dt => dt.code);
    const uploadedDocTypes = uploadedDocuments.map(doc => doc.documentType);
    
    for (const requiredType of requiredDocTypes) {
      if (!uploadedDocTypes.includes(requiredType as any)) {
        const docLabel = documentTypes.find(dt => dt.code === requiredType)?.label || requiredType;
        newErrors[`upload_${requiredType}`] = `Le document "${docLabel}" est obligatoire`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submissionData = {
        ...formData,
        documents: uploadedDocuments
      };
      onSubmit(submissionData);
    }
  };

  const selectedRegime = regimeOptions.find(r => r.code === formData.regimeSollicite);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Introduction */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-800">
            <strong>Monsieur le Ministre,</strong><br/>
            J'ai l'honneur de solliciter auprès de votre haute bienveillance, l'agrément au Code des Investissements 
            de mon projet tel que présenté ci-après :
          </p>
        </div>

        {/* Promoteur Information */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Informations du Promoteur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom ou Raison Sociale <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.promoteurNom}
                onChange={(e) => handleInputChange('promoteurNom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.promoteurNom ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.promoteurNom && <p className="text-red-500 text-sm mt-1">{errors.promoteurNom}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité</label>
              <select
                value={formData.promoteurNationalite}
                onChange={(e) => handleInputChange('promoteurNationalite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loadingEnums}
              >
                <option value="">Sélectionner une nationalité...</option>
                {nationalites && nationalites.length > 0 && nationalites.map((nationalite) => {
                  if (!nationalite || typeof nationalite !== 'object' || !nationalite.key) return null;
                  return (
                    <option key={nationalite.key} value={nationalite.key}>
                      {String(nationalite.value || nationalite.key)}
                    </option>
                  );
                })}
              </select>
              {loadingEnums && <p className="text-sm text-gray-500 mt-1">Chargement des nationalités...</p>}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
              <textarea
                value={formData.promoteurAdresse}
                onChange={(e) => handleInputChange('promoteurAdresse', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 1. Identification du projet */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">1. Identification du projet</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1.1. Nom ou Raison sociale <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nomRaisonSociale}
                onChange={(e) => handleInputChange('nomRaisonSociale', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.nomRaisonSociale ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.nomRaisonSociale && <p className="text-red-500 text-sm mt-1">{errors.nomRaisonSociale}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1.2. Activité <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.activite}
                onChange={(e) => handleInputChange('activite', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.activite ? 'border-red-500' : 'border-gray-300'}`}
                disabled={loadingEnums}
              >
                <option value="">Sélectionner une activité...</option>
                {domaineActivites && domaineActivites.length > 0 && domaineActivites.map((domaine) => {
                  if (!domaine || typeof domaine !== 'object' || !domaine.key) return null;
                  return (
                    <option key={domaine.key} value={domaine.key}>
                      {String(domaine.value || domaine.key)}
                    </option>
                  );
                })}
              </select>
              {loadingEnums && <p className="text-sm text-gray-500 mt-1">Chargement des activités...</p>}
              {errors.activite && <p className="text-red-500 text-sm mt-1">{errors.activite}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.3. Forme juridique <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.formeJuridique}
                  onChange={(e) => handleInputChange('formeJuridique', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.formeJuridique ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={loadingEnums}
                >
                  <option value="">Sélectionner une forme juridique...</option>
                  {formesJuridiques && formesJuridiques.length > 0 && formesJuridiques.map((forme) => {
                    if (!forme || typeof forme !== 'object' || !forme.key) return null;
                    return (
                      <option key={forme.key} value={forme.key}>
                        {String(forme.value || forme.key)}
                      </option>
                    );
                  })}
                </select>
                {loadingEnums && <p className="text-sm text-gray-500 mt-1">Chargement des formes juridiques...</p>}
                {errors.formeJuridique && <p className="text-red-500 text-sm mt-1">{errors.formeJuridique}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.4. Localisation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.localisation}
                  onChange={(e) => handleInputChange('localisation', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.localisation ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.localisation && <p className="text-red-500 text-sm mt-1">{errors.localisation}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">1.5. Adresse</label>
              <textarea
                value={formData.adresse}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.6. Numéro NINA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numeroNina}
                  onChange={(e) => handleInputChange('numeroNina', e.target.value)}
                  placeholder="Ex: 3259...............D0001X"
                  className={`w-full px-3 py-2 border rounded-md ${errors.numeroNina ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.numeroNina && <p className="text-red-500 text-sm mt-1">{errors.numeroNina}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.7. Numéro RCCM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numeroRccm}
                  onChange={(e) => handleInputChange('numeroRccm', e.target.value)}
                  placeholder="Ex: ML-BKO-...........-00003"
                  className={`w-full px-3 py-2 border rounded-md ${errors.numeroRccm ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.numeroRccm && <p className="text-red-500 text-sm mt-1">{errors.numeroRccm}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Caractéristiques du projet */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">2. Caractéristiques du projet</h3>
          
          {/* Investissements */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.1. Investissements (en F CFA)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investissement Total</label>
                <input
                  type="number"
                  value={formData.investissementTotal}
                  onChange={(e) => handleInputChange('investissementTotal', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.investissementTotal ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.investissementTotal && <p className="text-red-500 text-sm mt-1">{errors.investissementTotal}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Immobilisations</label>
                <input
                  type="number"
                  value={formData.immobilisations}
                  onChange={(e) => handleInputChange('immobilisations', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.immobilisations ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.immobilisations && <p className="text-red-500 text-sm mt-1">{errors.immobilisations}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fonds de roulement</label>
                <input
                  type="number"
                  value={formData.fondsRoulement}
                  onChange={(e) => handleInputChange('fondsRoulement', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Plan de financement */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.2. Plan de financement</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fonds propres</label>
                <input
                  type="number"
                  value={formData.fondsPropres}
                  onChange={(e) => handleInputChange('fondsPropres', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.fondsPropres ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.fondsPropres && <p className="text-red-500 text-sm mt-1">{errors.fondsPropres}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crédits</label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => handleInputChange('credits', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Autres</label>
                <input
                  type="number"
                  value={formData.autres}
                  onChange={(e) => handleInputChange('autres', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Taux de participation */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.3. Taux de participation au capital</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationaux (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tauxNationaux}
                  onChange={(e) => handleInputChange('tauxNationaux', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.tauxNationaux ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.tauxNationaux && <p className="text-red-500 text-sm mt-1">{errors.tauxNationaux}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expatriés (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tauxExpatries}
                  onChange={(e) => handleInputChange('tauxExpatries', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Emplois */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.4. Nombre d'emplois à créer</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationaux</label>
                <input
                  type="number"
                  min="0"
                  value={formData.emploisNationaux}
                  onChange={(e) => handleInputChange('emploisNationaux', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expatriés</label>
                <input
                  type="number"
                  min="0"
                  value={formData.emploisExpatries}
                  onChange={(e) => handleInputChange('emploisExpatries', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Autres caractéristiques */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">2.5. Taux de valeur ajoutée (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.tauxValeurAjoutee}
                onChange={(e) => handleInputChange('tauxValeurAjoutee', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">2.6. Capacité théorique de production</label>
              <textarea
                value={formData.capaciteProduction}
                onChange={(e) => handleInputChange('capaciteProduction', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-3">2.7. Marché visé</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Local (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.marcheLocal}
                    onChange={(e) => handleInputChange('marcheLocal', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md ${errors.marcheLocal ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.marcheLocal && <p className="text-red-500 text-sm mt-1">{errors.marcheLocal}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extérieur (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.marcheExterieur}
                    onChange={(e) => handleInputChange('marcheExterieur', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Régime sollicité */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">2.8. Régime sollicité</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regimeOptions.map((regime) => (
              <button
                key={regime.code}
                type="button"
                onClick={() => handleInputChange('regimeSollicite', regime.code)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.regimeSollicite === regime.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${
                      formData.regimeSollicite === regime.code ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {regime.label}
                    </p>
                    <p className={`text-sm mt-1 ${
                      formData.regimeSollicite === regime.code ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {regime.frais.toLocaleString()} FCFA
                    </p>
                  </div>
                  {formData.regimeSollicite === regime.code && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-2">Récapitulatif de votre demande</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Régime sollicité:</span>
                  <span className="font-semibold text-gray-900">{selectedRegime?.label}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-700 font-medium">Frais de dépôt:</span>
                  <span className="text-xl font-bold text-green-600">
                    {selectedRegime?.frais.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload des pièces jointes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Upload des pièces jointes</h4>
          </div>
          
          <div className="space-y-4">
            {documentTypes.map((docType) => {
              const uploadedDoc = uploadedDocuments.find(doc => doc.documentType === docType.code);
              const hasError = errors[`upload_${docType.code}`];
              
              return (
                <div key={docType.code} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {docType.label}
                      {docType.required && <span className="text-red-500">*</span>}
                    </label>
                    {uploadedDoc && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  {!uploadedDoc ? (
                    <div>
                      <input
                        type="file"
                        id={`upload_${docType.code}`}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, docType.code)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`upload_${docType.code}`}
                        className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          hasError 
                            ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-center">
                          <CloudArrowUpIcon className={`h-8 w-8 mx-auto mb-2 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
                          <p className={`text-sm ${hasError ? 'text-red-600' : 'text-gray-600'}`}>
                            Cliquez pour sélectionner un fichier
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, Word, Images (Max 10MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-green-900">{uploadedDoc.name}</p>
                          <p className="text-xs text-green-700">{formatFileSize(uploadedDoc.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(uploadedDoc.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  
                  {hasError && (
                    <p className="text-red-600 text-sm mt-2">{hasError}</p>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="font-medium text-yellow-800 mb-2">Informations importantes :</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• La demande timbrée doit être signée et tamponnée</li>
              <li>• L'étude de faisabilité doit être complète et détaillée</li>
              <li>• Formats acceptés : PDF, Word, Images (JPG, PNG)</li>
              <li>• Taille maximale par fichier : 10MB</li>
            </ul>
          </div>
        </div>


        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Soumettre la demande d'agrément
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvestmentAgreementRequest;
=======
import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, InformationCircleIcon, CloudArrowUpIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { enumsAPI } from '../services/api';

interface InvestmentData {
  // Promoteur info
  promoteurNom: string;
  promoteurNationalite: string;
  promoteurAdresse: string;
  
  // 1. Identification du projet
  nomRaisonSociale: string;
  activite: string;
  formeJuridique: string;
  localisation: string;
  adresse: string;
  numeroNina: string;
  numeroRccm: string;
  
  // 2. Caractéristiques du projet
  investissementTotal: number;
  immobilisations: number;
  fondsRoulement: number;
  
  // Plan de financement
  fondsPropres: number;
  credits: number;
  autres: number;
  
  // Taux de participation
  tauxNationaux: number;
  tauxExpatries: number;
  
  // Emplois
  emploisNationaux: number;
  emploisExpatries: number;
  
  // Autres données
  tauxValeurAjoutee: number;
  capaciteProduction: string;
  marcheLocal: number;
  marcheExterieur: number;
  
  // Régime sollicité
  regimeSollicite: 'A' | 'B' | 'C' | 'D' | 'ZONES_ECONOMIQUES';
  
  // Documents uploadés
  documents?: UploadedDocument[];
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
  documentType: 'DEMANDE_TIMBREE' | 'ETUDE_FAISABILITE' | 'STATUTS' | 'AUTORISATION_EXERCICE' | 'AUTRE';
}

interface InvestmentAgreementRequestProps {
  onSubmit: (data: InvestmentData) => void;
  initialData?: Partial<InvestmentData>;
}

const InvestmentAgreementRequest: React.FC<InvestmentAgreementRequestProps> = ({
  onSubmit,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<InvestmentData>({
    promoteurNom: '',
    promoteurNationalite: 'MALIENNE',
    promoteurAdresse: '',
    nomRaisonSociale: '',
    activite: '',
    formeJuridique: '',
    localisation: '',
    adresse: '',
    numeroNina: '',
    numeroRccm: '',
    investissementTotal: 0,
    immobilisations: 0,
    fondsRoulement: 0,
    fondsPropres: 0,
    credits: 0,
    autres: 0,
    tauxNationaux: 100,
    tauxExpatries: 0,
    emploisNationaux: 0,
    emploisExpatries: 0,
    tauxValeurAjoutee: 0,
    capaciteProduction: '',
    marcheLocal: 100,
    marcheExterieur: 0,
    regimeSollicite: 'A',
    documents: [],
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  
  // États pour les enums du backend
  const [nationalites, setNationalites] = useState<Array<{key: string, value: string}>>([]);
  const [domaineActivites, setDomaineActivites] = useState<Array<{key: string, value: string}>>([]);
  const [formesJuridiques, setFormesJuridiques] = useState<Array<{key: string, value: string}>>([]);
  const [loadingEnums, setLoadingEnums] = useState(true);

  const regimeOptions = [
    { code: 'A', label: 'Régime A', frais: 350000 },
    { code: 'B', label: 'Régime B', frais: 450000 },
    { code: 'C', label: 'Régime C', frais: 550000 },
    { code: 'D', label: 'Régime D', frais: 600000 },
    { code: 'ZONES_ECONOMIQUES', label: 'Régime des Zones Économiques', frais: 600000 }
  ];

  const documentTypes = [
    { code: 'DEMANDE_TIMBREE', label: 'Demande timbrée', required: true },
    { code: 'ETUDE_FAISABILITE', label: 'Étude de faisabilité', required: true },
    { code: 'STATUTS', label: 'Statuts (pour les sociétés)', required: false },
    { code: 'AUTORISATION_EXERCICE', label: 'Autorisation d\'exercice', required: false },
    { code: 'AUTRE', label: 'Autre document', required: false }
  ];

  // Charger les enums du backend au démarrage
  useEffect(() => {
    const loadEnums = async () => {
      try {
        setLoadingEnums(true);
        
        // Charger les enums en parallèle
        const [nationalitesData, domaineActivitesData, formesJuridiquesData] = await Promise.all([
          enumsAPI.getNationalites(),
          enumsAPI.getDomaineActivitesNr(),
          enumsAPI.getSocieteJuridictions()
        ]);

        console.log('🔍 DIAGNOSTIC ENUMS - Données reçues:', { nationalitesData, domaineActivitesData, formesJuridiquesData });
        console.log('🔍 Type de formesJuridiquesData:', typeof formesJuridiquesData);
        console.log('🔍 Contenu formesJuridiquesData:', formesJuridiquesData);
        console.log('🔍 Keys de formesJuridiquesData:', formesJuridiquesData ? Object.keys(formesJuridiquesData) : 'null');

        // Transformer les données pour le format attendu
        if (nationalitesData) {
          let nationalitesOptions: Array<{key: string, value: string}> = [];
          if (Array.isArray(nationalitesData)) {
            // Les données sont déjà un tableau avec {key, label, value}
            nationalitesOptions = nationalitesData.map((item: any) => ({
              key: item.key,
              value: item.label || item.value || item.key
            }));
          } else if (typeof nationalitesData === 'object') {
            nationalitesOptions = Object.entries(nationalitesData).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : String(value)
            }));
          }
          setNationalites(nationalitesOptions);
        }

        if (domaineActivitesData) {
          let domaineOptions: Array<{key: string, value: string}> = [];
          if (Array.isArray(domaineActivitesData)) {
            // Les données sont déjà un tableau avec {key, label, value}
            domaineOptions = domaineActivitesData.map((item: any) => ({
              key: item.key,
              value: item.label || item.value || item.key
            }));
          } else if (typeof domaineActivitesData === 'object') {
            domaineOptions = Object.entries(domaineActivitesData).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : String(value)
            }));
          }
          setDomaineActivites(domaineOptions);
        }

        if (formesJuridiquesData) {
          console.log('🔧 Transformation formesJuridiques - Données brutes:', formesJuridiquesData);
          let formeOptions: Array<{key: string, value: string}> = [];
          if (Array.isArray(formesJuridiquesData)) {
            console.log('🔧 formesJuridiquesData est un tableau, transformation...');
            // Les données sont un tableau avec {key, label, value}
            formeOptions = formesJuridiquesData.map((item: any) => ({
              key: item.key,
              value: item.label || item.value || item.key
            }));
            console.log('🔧 formeOptions transformées:', formeOptions);
          } else if (typeof formesJuridiquesData === 'object') {
            console.log('🔧 formesJuridiquesData est un objet, transformation en cours...');
            formeOptions = Object.entries(formesJuridiquesData).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : String(value)
            }));
            console.log('🔧 formeOptions transformées:', formeOptions);
          }
          setFormesJuridiques(formeOptions);
          console.log('🔧 setFormesJuridiques appelé avec:', formeOptions);
        } else {
          console.log('🔧 formesJuridiquesData est null ou undefined');
        }

      } catch (error) {
        console.error('Erreur lors du chargement des enums:', error);
        console.error('Détails de l\'erreur:', error instanceof Error ? error.message : String(error));
        // En cas d'erreur, utiliser des valeurs par défaut
        setNationalites([{ key: 'MALIENNE', value: 'Malienne' }]);
        setFormesJuridiques([
          { key: 'SARL', value: 'SARL' },
          { key: 'SA', value: 'SA' },
          { key: 'SAS', value: 'SAS' },
          { key: 'E_I', value: 'Entreprise Individuelle' }
        ]);
      } finally {
        setLoadingEnums(false);
        // Utiliser setTimeout pour vérifier l'état après la mise à jour
        setTimeout(() => {
          console.log('📊 États finaux des enums après mise à jour:', { 
            nationalites: nationalites.length, 
            domaineActivites: domaineActivites.length, 
            formesJuridiques: formesJuridiques.length 
          });
          console.log('📊 Contenu formesJuridiques:', formesJuridiques);
        }, 100);
      }
    };

    loadEnums();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [`upload_${documentType}`]: 'Le fichier ne peut pas dépasser 10MB'
      }));
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [`upload_${documentType}`]: 'Format de fichier non supporté. Utilisez PDF, Word, ou images (JPG, PNG)'
      }));
      return;
    }

    const newDocument: UploadedDocument = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      documentType: documentType as any
    };

    setUploadedDocuments(prev => {
      // Remove existing document of same type
      const filtered = prev.filter(doc => doc.documentType !== documentType);
      return [...filtered, newDocument];
    });

    // Clear any upload errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`upload_${documentType}`];
      return newErrors;
    });
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleInputChange = (field: keyof InvestmentData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.promoteurNom.trim()) newErrors.promoteurNom = 'Le nom du promoteur est requis';
    if (!formData.nomRaisonSociale.trim()) newErrors.nomRaisonSociale = 'Le nom ou raison sociale est requis';
    if (!formData.activite.trim()) newErrors.activite = 'L\'activité est requise';
    if (!formData.formeJuridique) newErrors.formeJuridique = 'La forme juridique est requise';
    if (!formData.localisation.trim()) newErrors.localisation = 'La localisation est requise';
    if (!formData.numeroNina.trim()) newErrors.numeroNina = 'Le numéro NINA est requis';
    if (!formData.numeroRccm.trim()) newErrors.numeroRccm = 'Le numéro RCCM est requis';

    // Format validation
    if (formData.numeroNina.trim() && !/^[0-9A-Z]{15}$|^[0-9A-Z]{21}$/.test(formData.numeroNina.trim())) {
      newErrors.numeroNina = 'Le numéro NINA doit contenir 15 ou 21 caractères (chiffres et lettres)';
    }
    if (formData.numeroRccm.trim() && !/^ML-[A-Z]{3}-\d{2}-\d{4}-[A-Z]-\d{5}$/.test(formData.numeroRccm.trim())) {
      newErrors.numeroRccm = 'Format RCCM invalide (Ex: ML-BKO-01-2026-A-00003)';
    }

    // Financial validation
    if (formData.fondsPropres + formData.credits + formData.autres !== formData.investissementTotal) {
      newErrors.fondsPropres = 'Le plan de financement doit égaler l\'investissement total';
    }

    // Percentage validation
    if (formData.tauxNationaux + formData.tauxExpatries !== 100) {
      newErrors.tauxNationaux = 'Les taux de participation doivent totaliser 100%';
    }
    if (formData.marcheLocal + formData.marcheExterieur !== 100) {
      newErrors.marcheLocal = 'Les parts de marché doivent totaliser 100%';
    }

    // Document validation
    const requiredDocTypes = documentTypes.filter(dt => dt.required).map(dt => dt.code);
    const uploadedDocTypes = uploadedDocuments.map(doc => doc.documentType);
    
    for (const requiredType of requiredDocTypes) {
      if (!uploadedDocTypes.includes(requiredType as any)) {
        const docLabel = documentTypes.find(dt => dt.code === requiredType)?.label || requiredType;
        newErrors[`upload_${requiredType}`] = `Le document "${docLabel}" est obligatoire`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submissionData = {
        ...formData,
        documents: uploadedDocuments
      };
      onSubmit(submissionData);
    }
  };

  const selectedRegime = regimeOptions.find(r => r.code === formData.regimeSollicite);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Introduction */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-800">
            <strong>Monsieur le Ministre,</strong><br/>
            J'ai l'honneur de solliciter auprès de votre haute bienveillance, l'agrément au Code des Investissements 
            de mon projet tel que présenté ci-après :
          </p>
        </div>

        {/* Promoteur Information */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Informations du Promoteur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom ou Raison Sociale <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.promoteurNom}
                onChange={(e) => handleInputChange('promoteurNom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.promoteurNom ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.promoteurNom && <p className="text-red-500 text-sm mt-1">{errors.promoteurNom}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité</label>
              <select
                value={formData.promoteurNationalite}
                onChange={(e) => handleInputChange('promoteurNationalite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loadingEnums}
              >
                <option value="">Sélectionner une nationalité...</option>
                {nationalites && nationalites.length > 0 && nationalites.map((nationalite) => {
                  if (!nationalite || typeof nationalite !== 'object' || !nationalite.key) return null;
                  return (
                    <option key={nationalite.key} value={nationalite.key}>
                      {String(nationalite.value || nationalite.key)}
                    </option>
                  );
                })}
              </select>
              {loadingEnums && <p className="text-sm text-gray-500 mt-1">Chargement des nationalités...</p>}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
              <textarea
                value={formData.promoteurAdresse}
                onChange={(e) => handleInputChange('promoteurAdresse', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 1. Identification du projet */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">1. Identification du projet</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1.1. Nom ou Raison sociale <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nomRaisonSociale}
                onChange={(e) => handleInputChange('nomRaisonSociale', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.nomRaisonSociale ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.nomRaisonSociale && <p className="text-red-500 text-sm mt-1">{errors.nomRaisonSociale}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1.2. Activité <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.activite}
                onChange={(e) => handleInputChange('activite', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.activite ? 'border-red-500' : 'border-gray-300'}`}
                disabled={loadingEnums}
              >
                <option value="">Sélectionner une activité...</option>
                {domaineActivites && domaineActivites.length > 0 && domaineActivites.map((domaine) => {
                  if (!domaine || typeof domaine !== 'object' || !domaine.key) return null;
                  return (
                    <option key={domaine.key} value={domaine.key}>
                      {String(domaine.value || domaine.key)}
                    </option>
                  );
                })}
              </select>
              {loadingEnums && <p className="text-sm text-gray-500 mt-1">Chargement des activités...</p>}
              {errors.activite && <p className="text-red-500 text-sm mt-1">{errors.activite}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.3. Forme juridique <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.formeJuridique}
                  onChange={(e) => handleInputChange('formeJuridique', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.formeJuridique ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={loadingEnums}
                >
                  <option value="">Sélectionner une forme juridique...</option>
                  {formesJuridiques && formesJuridiques.length > 0 && formesJuridiques.map((forme) => {
                    if (!forme || typeof forme !== 'object' || !forme.key) return null;
                    return (
                      <option key={forme.key} value={forme.key}>
                        {String(forme.value || forme.key)}
                      </option>
                    );
                  })}
                </select>
                {loadingEnums && <p className="text-sm text-gray-500 mt-1">Chargement des formes juridiques...</p>}
                {errors.formeJuridique && <p className="text-red-500 text-sm mt-1">{errors.formeJuridique}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.4. Localisation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.localisation}
                  onChange={(e) => handleInputChange('localisation', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.localisation ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.localisation && <p className="text-red-500 text-sm mt-1">{errors.localisation}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">1.5. Adresse</label>
              <textarea
                value={formData.adresse}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.6. Numéro NINA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numeroNina}
                  onChange={(e) => handleInputChange('numeroNina', e.target.value)}
                  placeholder="Ex: 3259...............D0001X"
                  className={`w-full px-3 py-2 border rounded-md ${errors.numeroNina ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.numeroNina && <p className="text-red-500 text-sm mt-1">{errors.numeroNina}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1.7. Numéro RCCM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numeroRccm}
                  onChange={(e) => handleInputChange('numeroRccm', e.target.value)}
                  placeholder="Ex: ML-BKO-...........-00003"
                  className={`w-full px-3 py-2 border rounded-md ${errors.numeroRccm ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.numeroRccm && <p className="text-red-500 text-sm mt-1">{errors.numeroRccm}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Caractéristiques du projet */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">2. Caractéristiques du projet</h3>
          
          {/* Investissements */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.1. Investissements (en F CFA)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investissement Total</label>
                <input
                  type="number"
                  value={formData.investissementTotal}
                  onChange={(e) => handleInputChange('investissementTotal', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.investissementTotal ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.investissementTotal && <p className="text-red-500 text-sm mt-1">{errors.investissementTotal}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Immobilisations</label>
                <input
                  type="number"
                  value={formData.immobilisations}
                  onChange={(e) => handleInputChange('immobilisations', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.immobilisations ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.immobilisations && <p className="text-red-500 text-sm mt-1">{errors.immobilisations}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fonds de roulement</label>
                <input
                  type="number"
                  value={formData.fondsRoulement}
                  onChange={(e) => handleInputChange('fondsRoulement', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Plan de financement */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.2. Plan de financement</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fonds propres</label>
                <input
                  type="number"
                  value={formData.fondsPropres}
                  onChange={(e) => handleInputChange('fondsPropres', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.fondsPropres ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.fondsPropres && <p className="text-red-500 text-sm mt-1">{errors.fondsPropres}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crédits</label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => handleInputChange('credits', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Autres</label>
                <input
                  type="number"
                  value={formData.autres}
                  onChange={(e) => handleInputChange('autres', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Taux de participation */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.3. Taux de participation au capital</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationaux (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tauxNationaux}
                  onChange={(e) => handleInputChange('tauxNationaux', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${errors.tauxNationaux ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.tauxNationaux && <p className="text-red-500 text-sm mt-1">{errors.tauxNationaux}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expatriés (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tauxExpatries}
                  onChange={(e) => handleInputChange('tauxExpatries', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Emplois */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">2.4. Nombre d'emplois à créer</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationaux</label>
                <input
                  type="number"
                  min="0"
                  value={formData.emploisNationaux}
                  onChange={(e) => handleInputChange('emploisNationaux', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expatriés</label>
                <input
                  type="number"
                  min="0"
                  value={formData.emploisExpatries}
                  onChange={(e) => handleInputChange('emploisExpatries', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Autres caractéristiques */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">2.5. Taux de valeur ajoutée (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.tauxValeurAjoutee}
                onChange={(e) => handleInputChange('tauxValeurAjoutee', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">2.6. Capacité théorique de production</label>
              <textarea
                value={formData.capaciteProduction}
                onChange={(e) => handleInputChange('capaciteProduction', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-3">2.7. Marché visé</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Local (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.marcheLocal}
                    onChange={(e) => handleInputChange('marcheLocal', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md ${errors.marcheLocal ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.marcheLocal && <p className="text-red-500 text-sm mt-1">{errors.marcheLocal}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extérieur (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.marcheExterieur}
                    onChange={(e) => handleInputChange('marcheExterieur', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Régime sollicité */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">2.8. Régime sollicité</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regimeOptions.map((regime) => (
              <button
                key={regime.code}
                type="button"
                onClick={() => handleInputChange('regimeSollicite', regime.code)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.regimeSollicite === regime.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${
                      formData.regimeSollicite === regime.code ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {regime.label}
                    </p>
                    <p className={`text-sm mt-1 ${
                      formData.regimeSollicite === regime.code ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {regime.frais.toLocaleString()} FCFA
                    </p>
                  </div>
                  {formData.regimeSollicite === regime.code && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-2">Récapitulatif de votre demande</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Régime sollicité:</span>
                  <span className="font-semibold text-gray-900">{selectedRegime?.label}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-700 font-medium">Frais de dépôt:</span>
                  <span className="text-xl font-bold text-green-600">
                    {selectedRegime?.frais.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload des pièces jointes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Upload des pièces jointes</h4>
          </div>
          
          <div className="space-y-4">
            {documentTypes.map((docType) => {
              const uploadedDoc = uploadedDocuments.find(doc => doc.documentType === docType.code);
              const hasError = errors[`upload_${docType.code}`];
              
              return (
                <div key={docType.code} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {docType.label}
                      {docType.required && <span className="text-red-500">*</span>}
                    </label>
                    {uploadedDoc && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  {!uploadedDoc ? (
                    <div>
                      <input
                        type="file"
                        id={`upload_${docType.code}`}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, docType.code)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`upload_${docType.code}`}
                        className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          hasError 
                            ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-center">
                          <CloudArrowUpIcon className={`h-8 w-8 mx-auto mb-2 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
                          <p className={`text-sm ${hasError ? 'text-red-600' : 'text-gray-600'}`}>
                            Cliquez pour sélectionner un fichier
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, Word, Images (Max 10MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-green-900">{uploadedDoc.name}</p>
                          <p className="text-xs text-green-700">{formatFileSize(uploadedDoc.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(uploadedDoc.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  
                  {hasError && (
                    <p className="text-red-600 text-sm mt-2">{hasError}</p>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="font-medium text-yellow-800 mb-2">Informations importantes :</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• La demande timbrée doit être signée et tamponnée</li>
              <li>• L'étude de faisabilité doit être complète et détaillée</li>
              <li>• Formats acceptés : PDF, Word, Images (JPG, PNG)</li>
              <li>• Taille maximale par fichier : 10MB</li>
            </ul>
          </div>
        </div>


        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Soumettre la demande d'agrément
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvestmentAgreementRequest;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
