import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { entreprisesAPI } from '../services/api';

const PaymentBankTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [montantPaye, setMontantPaye] = useState<string>('');
  const [numeroVirement, setNumeroVirement] = useState<string>('');
  const [banqueEmettrice, setBanqueEmettrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const entrepriseId = searchParams.get('entrepriseId') || '';
  const entrepriseNom = searchParams.get('entrepriseNom') || '';
  const amount = parseInt(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!entrepriseId || !amount) {
      navigate('/dashboard');
    } else {
      setMontantPaye(amount.toString());
    }
  }, [entrepriseId, amount, navigate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'F CFA');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!montantPaye || parseFloat(montantPaye) <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (!numeroVirement.trim()) {
      setError('Veuillez saisir le numéro de virement');
      return;
    }

    if (!banqueEmettrice.trim()) {
      setError('Veuillez saisir la banque émettrice');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const statusData = {
        status: 'PAIEMENT_VALIDE',
        note: `Paiement par virement bancaire validé par agent - Montant: ${montantPaye} FCFA - Virement: ${numeroVirement} - Banque: ${banqueEmettrice}${notes ? ' - Notes: ' + notes : ''}`
      };

      await entreprisesAPI.updateStatus(entrepriseId, statusData.status, statusData.note);

      alert(`✅ Paiement par virement validé avec succès pour "${entrepriseNom}"!\nL'entreprise passe maintenant à l'étape de révision.`);
      
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Erreur lors de la validation du paiement:', error);
      setError('Erreur lors de la validation du paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏦</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validation Virement Bancaire
          </h1>
          <p className="text-gray-600">Validation agent - Virement bancaire</p>
          <p className="text-lg font-semibold text-mali-emerald mt-2">
            {formatAmount(amount)}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏦</div>
              <h2 className="text-xl font-bold text-gray-900">Validation de paiement</h2>
              <p className="text-sm text-gray-600 mt-1">
                Entreprise: <span className="font-semibold">{entrepriseNom}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant payé (FCFA) *
                </label>
                <input
                  type="number"
                  value={montantPaye}
                  onChange={(e) => setMontantPaye(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mali-emerald"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de virement *
                </label>
                <input
                  type="text"
                  value={numeroVirement}
                  onChange={(e) => setNumeroVirement(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mali-emerald"
                  placeholder="Ex: VIR123456789"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banque émettrice *
                </label>
                <select
                  value={banqueEmettrice}
                  onChange={(e) => setBanqueEmettrice(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mali-emerald"
                  required
                >
                  <option value="">Sélectionnez une banque</option>
                  <option value="BDM">Banque de Développement du Mali (BDM)</option>
                  <option value="BNDA">Banque Nationale de Développement Agricole (BNDA)</option>
                  <option value="BMS">Bank of Africa Mali (BMS)</option>
                  <option value="ECOBANK">Ecobank Mali</option>
                  <option value="UBA">United Bank for Africa (UBA)</option>
                  <option value="ORABANK">Orabank Mali</option>
                  <option value="BICIM">Banque Internationale pour le Commerce et l'Industrie du Mali (BICIM)</option>
                  <option value="AUTRE">Autre banque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mali-emerald"
                  placeholder="Informations complémentaires..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-mali-emerald text-white rounded-lg hover:bg-mali-emerald-dark disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <span>✅</span>
                  <span>{loading ? 'Validation...' : 'Valider le paiement'}</span>
                </button>
              </div>
            </form>

            <div className="mt-6 p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-primary-600">
                <span>🏦</span>
                <span>Virement bancaire - Validation agent sécurisée</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleCancel}
            className="text-mali-emerald hover:text-mali-emerald-dark underline"
          >
            ← Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentBankTransferPage;
























