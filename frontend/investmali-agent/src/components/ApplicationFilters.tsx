import React from 'react';

export type Filters = {
  status?: string;
  priority?: string;
  paymentStatus?: string;
  assigned?: 'me' | 'unassigned' | 'all';
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string; // e.g., -submitted_at
};

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
  onReset?: () => void;
  loading?: boolean;
};

const ApplicationFilters: React.FC<Props> = ({ value, onChange, onReset, loading }) => {
  const update = (k: keyof Filters, v: any) => onChange({ ...value, [k]: v });

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <input
          type="text"
          placeholder="Recherche (société, nom)"
          className="border rounded px-3 py-2 text-sm"
          value={value.q || ''}
          onChange={(e) => update('q', e.target.value)}
        />
        <select className="border rounded px-3 py-2 text-sm" value={value.status || ''} onChange={(e) => update('status', e.target.value || undefined)}>
          <option value="">Statut</option>
          <option value="pending_validation">En attente de validation</option>
          <option value="in_review">En revue</option>
          <option value="approved">Approuvée</option>
          <option value="rejected">Rejetée</option>
        </select>
        <select className="border rounded px-3 py-2 text-sm" value={value.priority || ''} onChange={(e) => update('priority', e.target.value || undefined)}>
          <option value="">Priorité</option>
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Élevée</option>
        </select>
        <select className="border rounded px-3 py-2 text-sm" value={value.paymentStatus || ''} onChange={(e) => update('paymentStatus', e.target.value || undefined)}>
          <option value="">Paiement</option>
          <option value="unpaid">Non payé</option>
          <option value="partial">Partiel</option>
          <option value="paid">Payé</option>
        </select>
        <select className="border rounded px-3 py-2 text-sm" value={value.assigned || 'all'} onChange={(e) => update('assigned', (e.target.value || 'all') as any)}>
          <option value="all">Assignation</option>
          <option value="me">Assigné à moi</option>
          <option value="unassigned">Non assigné</option>
        </select>
        <select className="border rounded px-3 py-2 text-sm" value={value.sort || '-submitted_at'} onChange={(e) => update('sort', e.target.value)}>
          <option value="-submitted_at">Plus récent</option>
          <option value="submitted_at">Plus ancien</option>
          <option value="priority">Priorité ↑</option>
          <option value="-priority">Priorité ↓</option>
        </select>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input type="date" className="border rounded px-3 py-2 text-sm" value={value.dateFrom || ''} onChange={(e) => update('dateFrom', e.target.value || undefined)} />
        <input type="date" className="border rounded px-3 py-2 text-sm" value={value.dateTo || ''} onChange={(e) => update('dateTo', e.target.value || undefined)} />
        <button
          type="button"
          className="ml-auto inline-flex items-center px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
          onClick={onReset}
          disabled={loading}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default ApplicationFilters;
