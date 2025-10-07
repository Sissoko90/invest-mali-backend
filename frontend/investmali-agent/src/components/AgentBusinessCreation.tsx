import React, { useState } from 'react';
import { agentBusinessAPI } from '../services/api';

interface BusinessFormData {
  // Informations générales
  companyName: string;
  businessType: 'Société' | 'Individuelle';
  legalForm: string;
  capital: string;
  activity: string;
  
  // Représentant légal
  representative: {
    firstName: string;
    lastName: string;
    position: string;
    nationality: string;
    phone: string;
    email: string;
  };
  
  // Associés (pour les sociétés)
  partners: Array<{
    firstName: string;
    lastName: string;
    shares: number;
  }>;
  
  // Informations client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  
  // Notes agent
  agentNotes: string;
  
  // Documents
  documents: {
    representativeId?: File;
    partnersIds: File[];
    statutes?: File;
    residenceProof?: File;
    commerceRegistry?: File;
  };
}

const AgentBusinessCreation: React.FC = () => {
  const [formData, setFormData] = useState<BusinessFormData>({
    companyName: '',
    businessType: 'Société',
    legalForm: '',
    capital: '',
    activity: '',
    representative: {
      firstName: '',
      lastName: '',
      position: '',
      nationality: 'Malienne',
      phone: '',
      email: ''
    },
    partners: [],
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    agentNotes: '',
    documents: {
      partnersIds: []
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const legalForms = {
    'Société': ['SARL', 'SA', 'SAS', 'SASU', 'SNC', 'SCS'],
    'Individuelle': ['Entreprise Individuelle', 'EIRL', 'Micro-entreprise']
  };

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BusinessFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addPartner = () => {
    setFormData(prev => ({
      ...prev,
      partners: [...prev.partners, { firstName: '', lastName: '', shares: 0 }]
    }));
  };

  const updatePartner = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      partners: prev.partners.map((partner, i) => 
        i === index ? { ...partner, [field]: value } : partner
      )
    }));
  };

  const removePartner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partners: prev.partners.filter((_, i) => i !== index)
    }));
  };

  // Compute a costs breakdown dynamically from the current form data
  const computeCosts = () => {
    // Base fees (can be later adjusted per legalForm/businessType if needed)
    const base = 25000; // Immatriculation
    const service = 15000; // Service InvestMali
    const publication = 10000; // Publication
    // Extra per partner beyond 2
    const partnersExtra = Math.max(0, formData.partners.length - 2) * 5000;
    const total = base + service + publication + partnersExtra;
    return { base, service, publication, partnersExtra, total, currency: 'XOF' };
  };

  const calculateCosts = () => computeCosts().total;

  const validateBeforeSubmit = (): { ok: boolean; message?: string; step?: number } => {
    // Step 1 validations
    if (!formData.companyName?.trim()) return { ok: false, message: "Le nom de l'entreprise est requis.", step: 1 };
    if (!formData.legalForm?.trim()) return { ok: false, message: 'La forme juridique est requise.', step: 1 };
    if (!formData.capital?.toString()?.trim()) return { ok: false, message: 'Le capital social est requis.', step: 1 };
    if (!formData.activity?.trim()) return { ok: false, message: "L'activité principale est requise.", step: 1 };

    // Step 2 validations
    const r = formData.representative;
    if (!r.firstName?.trim()) return { ok: false, message: 'Prénom du représentant requis.', step: 2 };
    if (!r.lastName?.trim()) return { ok: false, message: 'Nom du représentant requis.', step: 2 };
    if (!r.position?.trim()) return { ok: false, message: 'Fonction du représentant requise.', step: 2 };
    if (!r.phone?.trim()) return { ok: false, message: 'Téléphone du représentant requis.', step: 2 };
    if (!r.email?.trim()) return { ok: false, message: 'Email du représentant requis.', step: 2 };

    // Step 3 validations for Société
    if (formData.businessType === 'Société') {
      if (formData.partners.length === 0) return { ok: false, message: 'Ajoutez au moins un associé.', step: 3 };
      if (totalShares !== 100) return { ok: false, message: 'Les parts des associés doivent totaliser 100%.', step: 3 };
    }

    // Step 4 documents validations
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const { representativeId, partnersIds, statutes, residenceProof } = formData.documents;
    if (!representativeId) return { ok: false, message: "La pièce d'identité du représentant est requise.", step: 4 };
    if (representativeId.size > maxFileSize) return { ok: false, message: 'La pièce du représentant dépasse 5MB.', step: 4 };
    if (formData.businessType === 'Société') {
      const missing = formData.partners.findIndex((_, i) => !partnersIds[i]);
      if (missing !== -1) return { ok: false, message: "Pièce d'identité manquante pour un associé.", step: 4 };
      if (partnersIds.some(f => f && f.size > maxFileSize)) return { ok: false, message: 'Un fichier associé dépasse 5MB.', step: 4 };
    }
    if (!residenceProof) return { ok: false, message: 'Le justificatif de résidence est requis.', step: 4 };
    if (residenceProof.size > maxFileSize) return { ok: false, message: 'Le justificatif de résidence dépasse 5MB.', step: 4 };
    if (statutes && statutes.size > 10 * 1024 * 1024) return { ok: false, message: 'Les statuts dépassent 10MB.', step: 4 };

    // Step 5 client info
    if (!formData.clientName?.trim()) return { ok: false, message: 'Le nom du client est requis.', step: 5 };
    if (!formData.clientEmail?.trim()) return { ok: false, message: "L'email du client est requis.", step: 5 };

    return { ok: true };
  };

  const handleSubmit = async () => {
    if (submitting) return;
    console.log('[AgentBusinessCreation] Submit clicked');
    const { ok, message, step } = validateBeforeSubmit();
    if (!ok) {
      if (step) setCurrentStep(step);
      setSubmitError(message || 'Validation échouée');
      // Fallback visuel
      alert(message);
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      // Construction du payload JSON et des fichiers (multipart)
      const payload = {
        companyName: formData.companyName,
        legalForm: formData.legalForm,
        businessType: formData.businessType,
        capital: formData.capital,
        activity: formData.activity,
        representative: formData.representative,
        partners: formData.partners,
        client: {
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone || undefined,
        },
        createdFrom: 'agent_app',
        notes: formData.agentNotes || undefined,
      } as any;

      // Attach computed costs so backend and drawer can show the same total and breakdown
      payload.costs = computeCosts();

      const form = new FormData();
      form.append('payload', JSON.stringify(payload));

      // Pièces jointes avec contrat de nommage
      if (formData.documents.representativeId) {
        form.append('representativeId', formData.documents.representativeId);
      }
      if (formData.businessType === 'Société' && formData.documents.partnersIds?.length) {
        formData.documents.partnersIds.forEach((f) => {
          if (f) form.append('partnersIds[]', f);
        });
      }
      if (formData.documents.statutes) {
        form.append('statutes', formData.documents.statutes);
      }
      if (formData.documents.residenceProof) {
        // Aligné avec contrat: residenceCertificate
        form.append('residenceCertificate', formData.documents.residenceProof);
      }
      if (formData.documents.commerceRegistry) {
        form.append('commerceRegistry', formData.documents.commerceRegistry);
      }

      console.log('[AgentBusinessCreation] Sending create request (JSON first, then multipart)');
      const response = await agentBusinessAPI.createClientApplicationSmart(payload, form);
      if (response?.data?.success) {
        alert('Demande créée avec succès !');
        // Reset du formulaire
        setCurrentStep(1);
        setFormData({
          companyName: '',
          businessType: 'Société',
          legalForm: '',
          capital: '',
          activity: '',
          representative: {
            firstName: '',
            lastName: '',
            position: '',
            nationality: 'Malienne',
            phone: '',
            email: ''
          },
          partners: [],
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          agentNotes: '',
          documents: {
            partnersIds: []
          }
        });
        window.dispatchEvent(new CustomEvent('agent-applications:refresh'));
      } else {
        const msg = response?.data?.message || 'Échec de création de la demande';
        setSubmitError(msg);
        alert(msg);
      }
    } catch (error: any) {
      console.error('[AgentBusinessCreation] Submit error', error);
      const msg = error?.response?.data?.message || error?.message || 'Erreur lors de la création de la demande';
      setSubmitError(msg);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalShares = formData.partners.reduce((sum, partner) => sum + partner.shares, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-mali-dark flex items-center">
            <svg className="w-8 h-8 mr-3 text-mali-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Création d'Entreprise - Agent
          </h2>
          <div className="text-sm text-gray-600">
            Étape {currentStep} sur 5
          </div>
        </div>

        {/* Étape 1: Informations générales */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-mali-dark mb-4">Informations Générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Ex: TechMali Solutions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'entreprise *</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                >
                  <option value="Société">Société</option>
                  <option value="Individuelle">Individuelle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forme juridique *</label>
                <select
                  value={formData.legalForm}
                  onChange={(e) => updateFormData('legalForm', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                >
                  <option value="">Sélectionnez une forme juridique</option>
                  {legalForms[formData.businessType].map(form => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capital social (FCFA) *</label>
                <input
                  type="number"
                  value={formData.capital}
                  onChange={(e) => updateFormData('capital', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Ex: 1000000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Activité principale *</label>
                <textarea
                  value={formData.activity}
                  onChange={(e) => updateFormData('activity', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  rows={3}
                  placeholder="Décrivez l'activité principale de l'entreprise"
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 2: Représentant légal */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-mali-dark mb-4">Représentant Légal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                <input
                  type="text"
                  value={formData.representative.firstName}
                  onChange={(e) => updateFormData('representative.firstName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.representative.lastName}
                  onChange={(e) => updateFormData('representative.lastName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fonction *</label>
                <input
                  type="text"
                  value={formData.representative.position}
                  onChange={(e) => updateFormData('representative.position', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Ex: Gérant, Directeur Général"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité *</label>
                <input
                  type="text"
                  value={formData.representative.nationality}
                  onChange={(e) => updateFormData('representative.nationality', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input
                  type="tel"
                  value={formData.representative.phone}
                  onChange={(e) => updateFormData('representative.phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="+223 XX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.representative.email}
                  onChange={(e) => updateFormData('representative.email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 3: Associés (si société) */}
        {currentStep === 3 && formData.businessType === 'Société' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-mali-dark">Associés</h3>
              <button
                onClick={addPartner}
                className="bg-mali-emerald text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors duration-300"
              >
                + Ajouter un associé
              </button>
            </div>

            {formData.partners.map((partner, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-800">Associé {index + 1}</h4>
                  <button
                    onClick={() => removePartner(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={partner.firstName}
                      onChange={(e) => updatePartner(index, 'firstName', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={partner.lastName}
                      onChange={(e) => updatePartner(index, 'lastName', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parts (%)</label>
                    <input
                      type="number"
                      value={partner.shares}
                      onChange={(e) => updatePartner(index, 'shares', parseFloat(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.partners.length > 0 && (
              <div className={`p-4 rounded-lg border-2 ${totalShares === 100 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total des parts :</span>
                  <span className={`font-bold ${totalShares === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalShares}%
                  </span>
                </div>
                {totalShares !== 100 && (
                  <p className="text-red-600 text-sm mt-1">⚠️ Les parts doivent totaliser 100%</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Étape 4: Pièces jointes */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-mali-dark mb-4">Pièces Jointes Requises</h3>
            
            {/* Documents du représentant légal */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Documents du Représentant Légal
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pièce d'identité du représentant légal *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          representativeId: file
                        }
                      }));
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-mali-emerald file:text-white hover:file:bg-emerald-600"
                />
                <p className="text-xs text-gray-500 mt-1">Formats acceptés: PDF, JPG, PNG (max 5MB)</p>
                {formData.documents.representativeId && (
                  <p className="text-sm text-green-600 mt-2">✓ Fichier sélectionné: {formData.documents.representativeId.name}</p>
                )}
              </div>
            </div>

            {/* Documents des associés */}
            {formData.businessType === 'Société' && formData.partners.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Documents des Associés ({formData.partners.length})
                </h4>
                
                <div className="space-y-4">
                  {formData.partners.map((partner, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pièce d'identité de {partner.firstName} {partner.lastName} *
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData(prev => {
                              const newPartnersIds = [...prev.documents.partnersIds];
                              newPartnersIds[index] = file;
                              return {
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  partnersIds: newPartnersIds
                                }
                              };
                            });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
                      />
                      {formData.documents.partnersIds[index] && (
                        <p className="text-sm text-green-600 mt-1">✓ {formData.documents.partnersIds[index].name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents de l'entreprise */}
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Documents de l'Entreprise
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statuts de l'entreprise
                    <span className="text-xs text-gray-500 ml-1">(Auto-détection du nombre de pages)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData(prev => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            statutes: file
                          }
                        }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                  />
                  {formData.documents.statutes && (
                    <p className="text-sm text-green-600 mt-1">✓ {formData.documents.statutes.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justificatif de résidence du siège *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData(prev => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            residenceProof: file
                          }
                        }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                  />
                  {formData.documents.residenceProof && (
                    <p className="text-sm text-green-600 mt-1">✓ {formData.documents.residenceProof.name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registre de commerce (si existant)
                    <span className="text-xs text-gray-500 ml-1">(Optionnel pour modification)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData(prev => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            commerceRegistry: file
                          }
                        }));
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                  />
                  {formData.documents.commerceRegistry && (
                    <p className="text-sm text-green-600 mt-1">✓ {formData.documents.commerceRegistry.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Résumé des documents */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-3">Résumé des Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className={`flex items-center ${formData.documents.representativeId ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{formData.documents.representativeId ? '✓' : '✗'}</span>
                  Pièce d'identité représentant
                </div>
                
                {formData.businessType === 'Société' && formData.partners.map((partner, index) => (
                  <div key={index} className={`flex items-center ${formData.documents.partnersIds[index] ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="mr-2">{formData.documents.partnersIds[index] ? '✓' : '✗'}</span>
                    ID {partner.firstName} {partner.lastName}
                  </div>
                ))}
                
                <div className={`flex items-center ${formData.documents.statutes ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{formData.documents.statutes ? '✓' : '○'}</span>
                  Statuts (optionnel)
                </div>
                
                <div className={`flex items-center ${formData.documents.residenceProof ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{formData.documents.residenceProof ? '✓' : '✗'}</span>
                  Justificatif de résidence
                </div>
                
                <div className={`flex items-center ${formData.documents.commerceRegistry ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{formData.documents.commerceRegistry ? '✓' : '○'}</span>
                  Registre de commerce (optionnel)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 5: Informations client et finalisation */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-mali-dark mb-4">Informations Client et Finalisation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => updateFormData('clientName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email du client *</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => updateFormData('clientEmail', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone du client</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData('clientPhone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes de l'agent</label>
                <textarea
                  value={formData.agentNotes}
                  onChange={(e) => updateFormData('agentNotes', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  rows={3}
                  placeholder="Notes internes, observations, instructions spéciales..."
                />
              </div>
            </div>

            {/* Récapitulatif des coûts */}
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-3">Récapitulatif des Coûts</h4>
              {(() => { const c = computeCosts(); return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Frais d'immatriculation :</span>
                    <span>{c.base.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais de service InvestMali :</span>
                    <span>{c.service.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais de publication :</span>
                    <span>{c.publication.toLocaleString()} FCFA</span>
                  </div>
                  {c.partnersExtra > 0 && (
                    <div className="flex justify-between">
                      <span>Frais associés supplémentaires :</span>
                      <span>{c.partnersExtra.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>TOTAL :</span>
                    <span>{c.total.toLocaleString()} FCFA</span>
                  </div>
                </div>
              ); })()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            Précédent
          </button>

          {currentStep < 5 ? (
            <button
              onClick={() => {
                if (formData.businessType === 'Individuelle' && currentStep === 2) {
                  setCurrentStep(4); // Skip partners step for individual businesses
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              className="px-6 py-2 bg-mali-emerald text-white rounded-lg hover:bg-emerald-600 transition-colors duration-300"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-mali-gold text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {submitting ? 'Création...' : 'Créer la demande'}
            </button>
          )}
        {submitError && (
          <p className="text-sm text-red-600 mt-2">{submitError}</p>
        )}
        </div>
      </div>
    </div>
  );
};

export default AgentBusinessCreation;
