<<<<<<< HEAD
import React from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface InvestmentDetailsModalProps {
  investmentData: any;
  onClose: () => void;
}

const InvestmentDetailsModal: React.FC<InvestmentDetailsModalProps> = ({
  investmentData,
  onClose
}) => {
  if (!investmentData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getRegimeLabel = (regime: string) => {
    const regimes: Record<string, string> = {
      'A': 'Régime A - Entreprise exportatrice',
      'B': 'Régime B - Entreprise de substitution aux importations',
      'C': 'Régime C - Entreprise à promotion spéciale'
    };
    return regimes[regime] || regime;
  };

  const getFormeJuridiqueLabel = (forme: string) => {
    const formes: Record<string, string> = {
      'SA': 'Société Anonyme',
      'SARL': 'Société à Responsabilité Limitée',
      'E_I': 'Entreprise Individuelle',
      'SNC': 'Société en Nom Collectif',
      'SCS': 'Société en Commandite Simple'
    };
    return formes[forme] || forme;
  };

  const identification = investmentData.identification || {};
  const promoteur = investmentData.promoteur || {};
  const caracteristiques = investmentData.caracteristiques || {};
  const investissement = caracteristiques.investissements || {};
  const emploi = caracteristiques.emplois || {};
  const marche = caracteristiques.marche || {};
  const financement = caracteristiques.planFinancement || {};
  const participation = caracteristiques.participation || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-6 w-6 text-sky-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de la demande d'investissement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Identification */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom/Raison sociale</label>
                  <p className="text-sm text-gray-900">{identification.nomRaisonSociale || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Référence</label>
                  <p className="text-sm text-gray-900">{investmentData.referenceNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forme juridique</label>
                  <p className="text-sm text-gray-900">{getFormeJuridiqueLabel(identification.formeJuridique)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activité</label>
                  <p className="text-sm text-gray-900">{identification.activite || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <p className="text-sm text-gray-900">{identification.adresse || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Localisation</label>
                  <p className="text-sm text-gray-900">{identification.localisation || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Régime sollicité</label>
                  <p className="text-sm text-gray-900">{getRegimeLabel(investmentData.regimeSollicite)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm text-gray-900">{investmentData.statut || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Promoteur */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Promoteur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom du promoteur</label>
                  <p className="text-sm text-gray-900">{promoteur.nom || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationalité</label>
                  <p className="text-sm text-gray-900">{promoteur.nationalite || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Adresse du promoteur</label>
                  <p className="text-sm text-gray-900">{promoteur.adresse || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Investissement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Investissement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Investissement total</label>
                  <p className="text-sm text-gray-900 font-medium">{formatCurrency(investissement.total || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Immobilisations</label>
                  <p className="text-sm text-gray-900">{formatCurrency(investissement.immobilisations || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fonds de roulement</label>
                  <p className="text-sm text-gray-900">{formatCurrency(investissement.fondsRoulement || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacité de production</label>
                  <p className="text-sm text-gray-900">{caracteristiques.capaciteProduction || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux de valeur ajoutée</label>
                  <p className="text-sm text-gray-900">{caracteristiques.tauxValeurAjoutee || 0}%</p>
                </div>
              </div>
            </div>

            {/* Emploi */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emploi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emplois nationaux</label>
                  <p className="text-sm text-gray-900">{emploi.nationaux || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emplois expatriés</label>
                  <p className="text-sm text-gray-900">{emploi.expatries || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux participation nationaux</label>
                  <p className="text-sm text-gray-900">{participation.tauxNationaux || 0}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux participation expatriés</label>
                  <p className="text-sm text-gray-900">{participation.tauxExpatries || 0}%</p>
                </div>
              </div>
            </div>

            {/* Marché */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Marché</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marché local</label>
                  <p className="text-sm text-gray-900">{marche.local || 0}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marché extérieur</label>
                  <p className="text-sm text-gray-900">{marche.exterieur || 0}%</p>
                </div>
              </div>
            </div>

            {/* Financement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fonds propres</label>
                  <p className="text-sm text-gray-900">{formatCurrency(financement.fondsPropres || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Crédits</label>
                  <p className="text-sm text-gray-900">{formatCurrency(financement.credits || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Autres financements</label>
                  <p className="text-sm text-gray-900">{formatCurrency(financement.autres || 0)}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations système</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de création</label>
                  <p className="text-sm text-gray-900">{formatDate(investmentData.dateCreation)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de modification</label>
                  <p className="text-sm text-gray-900">{formatDate(investmentData.dateModification)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de traitement</label>
                  <p className="text-sm text-gray-900">{formatDate(investmentData.dateTraitement)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agent traitant</label>
                  <p className="text-sm text-gray-900">{investmentData.agentTraitant || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Observations */}
            {investmentData.observations && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observations</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{investmentData.observations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailsModal;
=======
import React from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface InvestmentDetailsModalProps {
  investmentData: any;
  onClose: () => void;
}

const InvestmentDetailsModal: React.FC<InvestmentDetailsModalProps> = ({
  investmentData,
  onClose
}) => {
  if (!investmentData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getRegimeLabel = (regime: string) => {
    const regimes: Record<string, string> = {
      'A': 'Régime A - Entreprise exportatrice',
      'B': 'Régime B - Entreprise de substitution aux importations',
      'C': 'Régime C - Entreprise à promotion spéciale'
    };
    return regimes[regime] || regime;
  };

  const getFormeJuridiqueLabel = (forme: string) => {
    const formes: Record<string, string> = {
      'SA': 'Société Anonyme',
      'SARL': 'Société à Responsabilité Limitée',
      'E_I': 'Entreprise Individuelle',
      'SNC': 'Société en Nom Collectif',
      'SCS': 'Société en Commandite Simple'
    };
    return formes[forme] || forme;
  };

  const identification = investmentData.identification || {};
  const promoteur = investmentData.promoteur || {};
  const caracteristiques = investmentData.caracteristiques || {};
  const investissement = caracteristiques.investissements || {};
  const emploi = caracteristiques.emplois || {};
  const marche = caracteristiques.marche || {};
  const financement = caracteristiques.planFinancement || {};
  const participation = caracteristiques.participation || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <InformationCircleIcon className="h-6 w-6 text-sky-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de la demande d'investissement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Identification */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom/Raison sociale</label>
                  <p className="text-sm text-gray-900">{identification.nomRaisonSociale || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Référence</label>
                  <p className="text-sm text-gray-900">{investmentData.referenceNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forme juridique</label>
                  <p className="text-sm text-gray-900">{getFormeJuridiqueLabel(identification.formeJuridique)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activité</label>
                  <p className="text-sm text-gray-900">{identification.activite || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse</label>
                  <p className="text-sm text-gray-900">{identification.adresse || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Localisation</label>
                  <p className="text-sm text-gray-900">{identification.localisation || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Régime sollicité</label>
                  <p className="text-sm text-gray-900">{getRegimeLabel(investmentData.regimeSollicite)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <p className="text-sm text-gray-900">{investmentData.statut || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Promoteur */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Promoteur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom du promoteur</label>
                  <p className="text-sm text-gray-900">{promoteur.nom || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationalité</label>
                  <p className="text-sm text-gray-900">{promoteur.nationalite || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Adresse du promoteur</label>
                  <p className="text-sm text-gray-900">{promoteur.adresse || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Investissement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Investissement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Investissement total</label>
                  <p className="text-sm text-gray-900 font-medium">{formatCurrency(investissement.total || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Immobilisations</label>
                  <p className="text-sm text-gray-900">{formatCurrency(investissement.immobilisations || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fonds de roulement</label>
                  <p className="text-sm text-gray-900">{formatCurrency(investissement.fondsRoulement || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacité de production</label>
                  <p className="text-sm text-gray-900">{caracteristiques.capaciteProduction || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux de valeur ajoutée</label>
                  <p className="text-sm text-gray-900">{caracteristiques.tauxValeurAjoutee || 0}%</p>
                </div>
              </div>
            </div>

            {/* Emploi */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emploi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emplois nationaux</label>
                  <p className="text-sm text-gray-900">{emploi.nationaux || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emplois expatriés</label>
                  <p className="text-sm text-gray-900">{emploi.expatries || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux participation nationaux</label>
                  <p className="text-sm text-gray-900">{participation.tauxNationaux || 0}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux participation expatriés</label>
                  <p className="text-sm text-gray-900">{participation.tauxExpatries || 0}%</p>
                </div>
              </div>
            </div>

            {/* Marché */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Marché</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marché local</label>
                  <p className="text-sm text-gray-900">{marche.local || 0}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marché extérieur</label>
                  <p className="text-sm text-gray-900">{marche.exterieur || 0}%</p>
                </div>
              </div>
            </div>

            {/* Financement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fonds propres</label>
                  <p className="text-sm text-gray-900">{formatCurrency(financement.fondsPropres || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Crédits</label>
                  <p className="text-sm text-gray-900">{formatCurrency(financement.credits || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Autres financements</label>
                  <p className="text-sm text-gray-900">{formatCurrency(financement.autres || 0)}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations système</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de création</label>
                  <p className="text-sm text-gray-900">{formatDate(investmentData.dateCreation)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de modification</label>
                  <p className="text-sm text-gray-900">{formatDate(investmentData.dateModification)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de traitement</label>
                  <p className="text-sm text-gray-900">{formatDate(investmentData.dateTraitement)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agent traitant</label>
                  <p className="text-sm text-gray-900">{investmentData.agentTraitant || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Observations */}
            {investmentData.observations && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observations</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{investmentData.observations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailsModal;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
