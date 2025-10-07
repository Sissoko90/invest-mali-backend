import React from 'react';

export type ApplicationRow = {
  id: number;
  company_name?: string;
  status?: string;
  priority?: string;
  payment_status?: string;
  submitted_at?: string;
  user?: { firstName?: string; lastName?: string; email?: string } | null;
  assigned_agent?: { firstName?: string; lastName?: string; email?: string } | null;
};

type Props = {
  rows: ApplicationRow[];
  page: number;
  limit: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onRowClick?: (row: ApplicationRow) => void;
};

const ApplicationsTable: React.FC<Props> = ({ rows, page, limit, total, loading, onPageChange, onRowClick }) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  const formatStatus = (status?: string) => {
    if (!status) return '—';
    switch (status) {
      case 'pending_validation':
        return 'En attente de validation';
      case 'in_review':
        return 'En cours de révision';
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      default:
        // Fallback: titre-case du code
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  const formatPriority = (priority?: string) => {
    if (!priority) return '—';
    switch (priority) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Élevée';
      case 'urgent':
        return 'Urgente';
      default:
        return priority.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  const formatPayment = (payment?: string) => {
    if (!payment) return '—';
    switch (payment) {
      case 'paid':
        return 'Payé';
      case 'unpaid':
        return 'Impayé';
      case 'pending':
        return 'En attente';
      case 'refunded':
        return 'Remboursé';
      default:
        return payment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandeur</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Soumise</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr><td className="px-4 py-4 text-sm text-gray-500" colSpan={8}>Chargement…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td className="px-4 py-4 text-sm text-gray-500" colSpan={8}>Aucun résultat</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick?.(r)}>
                <td className="px-4 py-3 text-sm text-gray-900">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.company_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.user ? `${r.user.firstName} ${r.user.lastName}` : '—'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{formatStatus(r.status)}</span>
                </td>
                <td className="px-4 py-3 text-sm">{formatPriority(r.priority)}</td>
                <td className="px-4 py-3 text-sm">{formatPayment(r.payment_status)}</td>
                <td className="px-4 py-3 text-sm">{r.assigned_agent ? `${r.assigned_agent.firstName} ${r.assigned_agent.lastName}` : '—'}</td>
                <td className="px-4 py-3 text-sm text-right">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('fr-FR') : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
        <div className="space-x-2">
          <button className="px-3 py-1 text-sm rounded border disabled:opacity-50" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Précédent</button>
          <button className="px-3 py-1 text-sm rounded border disabled:opacity-50" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Suivant</button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsTable;
