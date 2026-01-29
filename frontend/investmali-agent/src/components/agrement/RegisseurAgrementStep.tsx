import React, { useState, useEffect } from 'react';
import { useAgentAuth } from '../../contexts/AgentAuthContext';
import { entreprisesAPI } from '../../services/api';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { Entreprise } from '../../types';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface RegisseurAgrementStepProps {
  onEntrepriseUpdate?: (entreprise: Entreprise) => void;
}

const RegisseurAgrementStep: React.FC<RegisseurAgrementStepProps> = ({ onEntrepriseUpdate }) => {
  const { agent } = useAgentAuth();
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMinistere, setSelectedMinistere] = useState<Record<string, string>>({});
  const [ministeres, setMinisteres] = useState<any[]>([]);
  const [investmentDetails, setInvestmentDetails] = useState<Record<string, any>>({});

  // Calcul du montant selon le domaine d'activité ou le régime d'investissement
  const calculerMontant = (entreprise: Entreprise): number => {
    if (entreprise.montantFraisDepot) {
      return entreprise.montantFraisDepot;
    }
    
    // Pour les demandes d'investissement (INV-), utiliser les tarifs selon le régime
    if (entreprise.id && entreprise.id.startsWith('INV-')) {
      return calculerMontantInvestissement(entreprise.id);
    }
    
    // Pour les entreprises normales, utiliser les tarifs selon le domaine d'activité
    const domaine = entreprise.domaineActivite;
    if (!domaine) return 125000;
    
    const montants: Record<string, number> = {
      'URBANISTE': 300000,
      'ARCHITECTE': 300000,
      'GEOMETRES_EXPERTS': 300000,
      'TRANSPORT': 125000,
      'BTP': 150000,
      'INGENIEUR_CONSEIL': 250000,
      'ETABLISSEMENT_DE_TOURISME': 200000,
      'AGENCE_DE_VOYAGE': 150000,
      'STATIONS': 200000,
    };
    
    return montants[domaine] || 125000;
  };

  const calculerMontantInvestissement = (entrepriseId: string): number => {
    // Tarifs selon le régime d'investissement
    const tarifsRegimes: Record<string, number> = {
      'A': 350000,  // Régime A - Entreprise exportatrice
      'B': 450000,  // Régime B - Entreprise de substitution aux importations  
      'C': 550000,  // Régime C - Entreprise à promotion spéciale
      'D': 600000,  // Régime D
      'ZONES_ECONOMIQUES': 600000  // Régime des Zones Économiques
    };
    
    // Récupérer le régime depuis les détails de l'investissement
    const details = investmentDetails[entrepriseId];
    if (details && details.regimeSollicite) {
      return tarifsRegimes[details.regimeSollicite] || tarifsRegimes['B'];
    }
    
    // Par défaut, utiliser le régime B
    return tarifsRegimes['B']; // 450000 FCFA par défaut
  };

  const loadInvestmentDetails = async (entrepriseId: string) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/agrement-workflow/revision/investment-details/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvestmentDetails(prev => ({
          ...prev,
          [entrepriseId]: data.investmentAgreement
        }));
      }
    } catch (error) {
      console.error('❌ Erreur chargement détails investissement:', error);
    }
  };

  useEffect(() => {
    loadEntreprises();
    loadMinisteres();
  }, []);

  const loadEntreprises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser le nouvel endpoint qui inclut les demandes d'investissement
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/v1/agrement-workflow/regisseur/demandes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const toutesEntreprises = await response.json();
      console.log('📋 [RegisseurAgrementStep] Demandes chez le régisseur:', toutesEntreprises);
      
      setEntreprises(toutesEntreprises || []);
      
      // Charger les détails des investissements pour calculer les bons montants
      for (const entreprise of toutesEntreprises) {
        if (entreprise.id && entreprise.id.startsWith('INV-')) {
          await loadInvestmentDetails(entreprise.id);
        }
      }
    } catch (error) {
      console.error('❌ [RegisseurAgrementStep] Erreur:', error);
      setError('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenererPaiement = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      // Utiliser regenerer-paiement pour éviter les conflits de clé dupliquée
      const endpoint = entreprise.etapeValidation === 'PAIEMENT_EN_ATTENTE_AGREMENT' 
        ? 'regenerer-paiement' 
        : 'generer-paiement';

      console.log(`💰 [RegisseurAgrementStep] ${endpoint}:`, entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/regisseur/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du paiement');
      }

      const result = await response.json();
      console.log('✅ [RegisseurAgrementStep] Paiement généré:', result);

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RegisseurAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors de la génération du paiement');
    } finally {
      setIsProcessing(null);
    }
  };

  const loadMinisteres = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/ministeres`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMinisteres(data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement ministères:', error);
    }
  };

  const handleVerifierPaiement = async (entreprise: Entreprise) => {
    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('💰 [RegisseurAgrementStep] Vérification paiement:', entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/regisseur/verifier-paiement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la vérification du paiement');
      }

      console.log('✅ [RegisseurAgrementStep] Paiement vérifié');
      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RegisseurAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors de la vérification du paiement');
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePasserAuMinistere = async (entreprise: Entreprise) => {
    const ministere = selectedMinistere[entreprise.id];
    
    if (!ministere) {
      setError('Veuillez sélectionner un ministère');
      return;
    }

    try {
      setIsProcessing(entreprise.id);
      setError(null);

      console.log('✅ [RegisseurAgrementStep] Passage au ministère:', entreprise.nom);

      const response = await fetch(`${getApiBaseUrl()}/agrement-workflow/regisseur/passer-ministere`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entrepriseId: entreprise.id,
          agentId: agent?.id,
          ministere: ministere
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du passage au ministère');
      }

      console.log('✅ [RegisseurAgrementStep] Passé au ministère');

      if (onEntrepriseUpdate) {
        const result = await response.json();
        onEntrepriseUpdate(result.assignment);
      }

      await loadEntreprises();
    } catch (error: any) {
      console.error('❌ [RegisseurAgrementStep] Erreur:', error);
      setError(error.message || 'Erreur lors du passage au ministère');
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  if (entreprises.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <BanknotesIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Aucune demande à traiter</h3>
          <p className="text-sm text-gray-500">Toutes les demandes ont été traitées.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-600 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Régisseur - Demandes d'Agrément</h1>
              <p className="text-sm text-gray-500">Traitement administratif et préparation pour le ministère</p>
            </div>
          </div>
          <span className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Étape RÉGISSEUR
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 space-y-4">
          {entreprises.map((entreprise) => (
            <div
              key={entreprise.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sky-600 rounded-lg">
                    <BuildingOfficeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{entreprise.nom}</h3>
                    <span className="text-xs text-gray-500">Réf: {entreprise.reference}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {entreprise.formeJuridique}
                  </span>
                  {entreprise.domaineActivite && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                      {entreprise.domaineActivite}
                    </span>
                  )}
                  {entreprise.etapeValidation === 'PAIEMENT_EN_ATTENTE_AGREMENT' && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                      En attente de paiement
                    </span>
                  )}
                </div>
              </div>

              {/* Informations de paiement */}
              <div className="bg-sky-50 rounded-lg border border-sky-200 p-3 mb-3">
                <div className="flex items-center space-x-2 mb-3">
                  <CurrencyDollarIcon className="h-4 w-4 text-sky-600" />
                  <h4 className="text-sm font-medium text-sky-800">Informations de paiement</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-2 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Type de demande</p>
                    <p className="text-sm font-medium text-gray-800">
                      {entreprise.typeDemandeAgrement || 'Non défini'}
                    </p>
                  </div>
                  {entreprise.regimeInvestissement && (
                    <div className="bg-white rounded-lg p-2 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Régime</p>
                      <p className="text-sm font-medium text-gray-800">
                        {entreprise.regimeInvestissement.replace('REGIME_', 'Régime ')}
                      </p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-2 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Montant à payer</p>
                    <p className="text-lg font-bold text-sky-600">
                      {calculerMontant(entreprise).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              </div>

              {/* Sélection du ministère */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ministère concerné <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMinistere[entreprise.id] || ''}
                  onChange={(e) => setSelectedMinistere(prev => ({
                    ...prev,
                    [entreprise.id]: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner un ministère</option>
                  {ministeres.map((min) => (
                    <option key={min.code} value={min.code}>
                      {min.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleGenererPaiement(entreprise)}
                  disabled={isProcessing === entreprise.id}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isProcessing === entreprise.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>{entreprise.etapeValidation === 'PAIEMENT_EN_ATTENTE_AGREMENT' ? 'Régénérer' : 'Générer'} paiement</>
                  )}
                </button>
                
                {entreprise.etapeValidation === 'PAIEMENT_EN_ATTENTE_AGREMENT' && (
                  <button
                    onClick={() => handleVerifierPaiement(entreprise)}
                    disabled={isProcessing === entreprise.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isProcessing === entreprise.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Vérifier paiement
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handlePasserAuMinistere(entreprise)}
                  disabled={isProcessing === entreprise.id || !selectedMinistere[entreprise.id]}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isProcessing === entreprise.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Transmettre au Ministère
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegisseurAgrementStep;
























