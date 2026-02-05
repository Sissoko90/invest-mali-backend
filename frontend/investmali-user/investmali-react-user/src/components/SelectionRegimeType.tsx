import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface RegimeOption {
  code: string;
  libelle: string;
  montant: number;
  description: string;
}

interface TypeDemandeOption {
  code: string;
  libelle: string;
  requiresRegime: boolean;
  montantFixe: number | null;
  description: string;
}

interface SelectionRegimeTypeProps {
  onSelectionChange: (regime: string | null, type: string) => void;
  selectedRegime?: string | null;
  selectedType?: string;
}

const SelectionRegimeType: React.FC<SelectionRegimeTypeProps> = ({
  onSelectionChange,
  selectedRegime,
  selectedType
}) => {
  const [regimes, setRegimes] = useState<RegimeOption[]>([]);
  const [types, setTypes] = useState<TypeDemandeOption[]>([]);
  const [currentType, setCurrentType] = useState<string>(selectedType || 'NOUVEAU');
  const [currentRegime, setCurrentRegime] = useState<string | null>(selectedRegime || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      
      // Charger les régimes
      const regimesResponse = await fetch(`${apiUrl}/api/v1/agrement-workflow/regimes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!regimesResponse.ok) throw new Error('Erreur lors du chargement des régimes');
      const regimesData = await regimesResponse.json();
      setRegimes(regimesData);

      // Charger les types de demande
      const typesResponse = await fetch(`${apiUrl}/api/v1/agrement-workflow/types-demande`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!typesResponse.ok) throw new Error('Erreur lors du chargement des types');
      const typesData = await typesResponse.json();
      setTypes(typesData);

      // Sélectionner le premier régime par défaut si nouvelle demande
      if (!currentRegime && typesData.length > 0) {
        const nouveauType = typesData.find((t: TypeDemandeOption) => t.code === 'NOUVEAU');
        if (nouveauType?.requiresRegime && regimesData.length > 0) {
          setCurrentRegime(regimesData[0].code);
          onSelectionChange(regimesData[0].code, currentType);
        }
      }
    } catch (err: any) {
      console.error('Erreur chargement options:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (typeCode: string) => {
    setCurrentType(typeCode);
    const selectedTypeObj = types.find(t => t.code === typeCode);
    
    if (selectedTypeObj?.requiresRegime) {
      // Si le type nécessite un régime et qu'aucun n'est sélectionné, sélectionner le premier
      const regime = currentRegime || (regimes.length > 0 ? regimes[0].code : null);
      setCurrentRegime(regime);
      onSelectionChange(regime, typeCode);
    } else {
      // Si le type ne nécessite pas de régime, le mettre à null
      setCurrentRegime(null);
      onSelectionChange(null, typeCode);
    }
  };

  const handleRegimeChange = (regimeCode: string) => {
    setCurrentRegime(regimeCode);
    onSelectionChange(regimeCode, currentType);
  };

  const selectedTypeObj = types.find(t => t.code === currentType);
  const selectedRegimeObj = regimes.find(r => r.code === currentRegime);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement des options...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection du type de demande */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Type de demande d'agrément <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {types.map((type) => (
            <button
              key={type.code}
              onClick={() => handleTypeChange(type.code)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                currentType === type.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`font-semibold ${
                    currentType === type.code ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {type.libelle}
                  </p>
                  <p className={`text-sm mt-1 ${
                    currentType === type.code ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {type.requiresRegime ? 'Montant selon régime' : `${type.montantFixe?.toLocaleString()} FCFA`}
                  </p>
                </div>
                {currentType === type.code && (
                  <div className="ml-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sélection du régime (si nécessaire) */}
      {selectedTypeObj?.requiresRegime && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Régime d'investissement <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regimes.map((regime) => (
              <button
                key={regime.code}
                onClick={() => handleRegimeChange(regime.code)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  currentRegime === regime.code
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      currentRegime === regime.code ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {regime.libelle}
                    </p>
                    <p className={`text-lg font-bold mt-1 ${
                      currentRegime === regime.code ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {regime.montant.toLocaleString()} FCFA
                    </p>
                  </div>
                  {currentRegime === regime.code && (
                    <div className="ml-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Récapitulatif */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">Récapitulatif de votre demande</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Type de demande:</span>
                <span className="font-semibold text-gray-900">{selectedTypeObj?.libelle}</span>
              </div>
              {selectedTypeObj?.requiresRegime && selectedRegimeObj && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Régime:</span>
                  <span className="font-semibold text-gray-900">{selectedRegimeObj.libelle}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-gray-700 font-medium">Frais de dépôt:</span>
                <span className="text-xl font-bold text-green-600">
                  {selectedTypeObj?.requiresRegime && selectedRegimeObj
                    ? `${selectedRegimeObj.montant.toLocaleString()} FCFA`
                    : selectedTypeObj?.montantFixe
                    ? `${selectedTypeObj.montantFixe.toLocaleString()} FCFA`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information importante */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">⚠️ Information importante</p>
            <p>
              Les frais de dépôt seront à régler lors de l'étape de traitement par le régisseur.
              Le paiement se fera via TresorPay de manière sécurisée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionRegimeType;
