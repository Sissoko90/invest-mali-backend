import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { entreprisesAPI } from '../services/api';

const PaymentMoovMoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [montantPaye, setMontantPaye] = useState<string>('');
  const [numeroTelephone, setNumeroTelephone] = useState<string>('');
  const [numeroTransaction, setNumeroTransaction] = useState<string>('');
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

  const formatPhoneNumber = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    const limited = numbers.slice(0, 8);
    
    if (limited.length >= 2) {
      return limited.replace(/(\d{2})(\d{2})?(\d{2})?(\d{2})?/, (match, p1, p2, p3, p4) => {
        let formatted = p1;
        if (p2) formatted += ' ' + p2;
        if (p3) formatted += ' ' + p3;
        if (p4) formatted += ' ' + p4;
        return formatted;
      });
    }
    
    return limited;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!montantPaye || parseFloat(montantPaye) <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (!numeroTelephone.trim()) {
      setError('Veuillez saisir le numéro Moov Money');
      return;
    }

    if (!numeroTransaction.trim()) {
      setError('Veuillez saisir le numéro de transaction');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const statusData = {
        status: 'PAIEMENT_VALIDE',
        note: `Paiement Moov Money validé par agent - Montant: ${montantPaye} FCFA - Téléphone: ${numeroTelephone} - Transaction: ${numeroTransaction}${notes ? ' - Notes: ' + notes : ''}`
      };

      await entreprisesAPI.updateStatus(entrepriseId, statusData.status, statusData.note);

      alert(`✅ Paiement Moov Money validé avec succès pour "${entrepriseNom}"!\nL'entreprise passe maintenant à l'étape de révision.`);
      
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
          <div className="text-6xl mb-4">📲</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validation Moov Money
          </h1>
          <p className="text-gray-600">Validation agent - Paiement mobile Moov</p>
          <p className="text-lg font-semibold text-mali-emerald mt-2">
            {formatAmount(amount)}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">📲</div>
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
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro Moov Money du client *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">🇲🇱 +223</span>
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={numeroTelephone}
                    onChange={(e) => setNumeroTelephone(formatPhoneNumber(e.target.value))}
                    className="block w-full pl-20 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-mali-emerald"
                    placeholder="60 12 34 56"
                    maxLength={11}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Numéro Moov Money utilisé par le client (sans l'indicatif +223)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de transaction Moov *
                </label>
                <input
                  type="text"
                  value={numeroTransaction}
                  onChange={(e) => setNumeroTransaction(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mali-emerald"
                  placeholder="Ex: MM123456789"
                  required
                />
              </div>

              {/* Instructions pour l'agent */}
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-medium text-primary-900 mb-2">Instructions de validation :</h3>
                <ol className="text-sm text-primary-700 space-y-1 list-decimal list-inside">
                  <li>Vérifiez que le client a bien effectué le paiement Moov Money</li>
                  <li>Demandez le numéro de transaction Moov Money</li>
                  <li>Vérifiez la correspondance du montant et du numéro</li>
                  <li>Validez le paiement pour faire passer l'entreprise en révision</li>
                </ol>
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
                  disabled={loading || !numeroTelephone.trim() || !numeroTransaction.trim()}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>📲</span>
                  <span>{loading ? 'Validation...' : 'Valider le paiement'}</span>
                </button>
              </div>
            </form>

            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>🔒</span>
                <span>Transaction sécurisée via Moov Money Mali - Validation agent</span>
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

export default PaymentMoovMoneyPage;
























