import React, { useState } from 'react';
import { agentBusinessAPI } from '../services/api';
import type { ApplicationRow } from './ApplicationsTable';

export type ApplicationDetail = ApplicationRow & {
  agent_notes?: string;
  costs?: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  application: ApplicationDetail | null;
  onUpdated?: (updated: ApplicationDetail) => void;
};

const ApplicationDrawer: React.FC<Props> = ({ open, onClose, application, onUpdated }) => {
  const [saving, setSaving] = useState(false);
  const [localNotes, setLocalNotes] = useState(application?.agent_notes || '');
  const [localPriority, setLocalPriority] = useState(application?.priority || '');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalNotes(application?.agent_notes || '');
    setLocalPriority(application?.priority || '');
  }, [application]);

  if (!open || !application) return null;

  const handleSave = async () => {
    if (!application) return;
    try {
      setSaving(true);
      setError(null);
      const patch: any = {};
      if (localNotes !== application.agent_notes) patch.agent_notes = localNotes;
      if (localPriority !== application.priority) patch.priority = localPriority;
      if (Object.keys(patch).length === 0) return onClose();
      const { data } = await agentBusinessAPI.updateApplication(application.id, patch);
      onUpdated?.(data.data);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // Helpers
  const formatStatus = (status?: string) => {
    if (!status) return '—';
    switch (status) {
      case 'pending_validation': return 'En attente de validation';
      case 'in_review': return 'En cours de révision';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const getStatusChip = (status?: string) => {
    const base = 'px-2 py-1 rounded-full text-xs font-medium';
    const color = status === 'approved' ? 'bg-green-100 text-green-800'
      : status === 'rejected' ? 'bg-red-100 text-red-800'
      : status === 'in_review' ? 'bg-blue-100 text-blue-800'
      : status === 'pending_validation' || status === 'pending' ? 'bg-yellow-100 text-yellow-800'
      : 'bg-gray-100 text-gray-800';
    return <span className={`${base} ${color}`}>{formatStatus(status)}</span>;
  };

  const formatPriority = (p?: string) => {
    switch (p) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Élevée';
      case 'urgent': return 'Urgente';
      default: return p || '—';
    }
  };

  const getPriorityChip = (p?: string) => {
    const base = 'px-2 py-1 rounded-full text-xs font-medium';
    const color = p === 'urgent' ? 'bg-red-100 text-red-800'
      : p === 'high' ? 'bg-orange-100 text-orange-800'
      : p === 'medium' ? 'bg-yellow-100 text-yellow-800'
      : p === 'low' ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
    return <span className={`${base} ${color}`}>{formatPriority(p)}</span>;
  };

  // Costs helpers (prefer backend values if present)
  const resolveCosts = () => {
    const c: any = (application as any)?.costs || (application as any)?.payload?.costs;
    if (!c) return null;
    const currency = c.currency || 'XOF';
    const total = c.total ?? (c.base || 0) + (c.service || 0) + (c.publication || 0) + (c.partnersExtra || 0);
    return {
      currency,
      total,
      base: c.base,
      service: c.service,
      publication: c.publication,
      partnersExtra: c.partnersExtra,
    };
  };

  // Try to derive documents from common shapes
  const normalizeDocuments = () => {
    const docs: { label: string; items: { name: string; url?: string }[] }[] = [];
    const root: any = application || {};

    // Build a list of potential sources where documents might live
    const sources: any[] = [
      root,
      root.documents,
      root.files,
      root.attachments,
      root.payload?.documents,
      root.payload?.files,
    ].filter(Boolean);

    // Build API origin from env to prefix relative paths
    const apiOrigin = (() => {
      try {
        const raw = process.env.REACT_APP_AGENT_API_URL || '';
        if (!raw) return undefined;
        const u = new URL(raw);
        return u.origin;
      } catch {
        return undefined;
      }
    })();

    const tryResolveUrl = (obj: any): string | undefined => {
      if (!obj) return undefined;
      if (typeof obj === 'string') return obj;
      const found = obj.url
        || obj.link
        || obj.path
        || obj.fileUrl
        || obj.location
        || obj.file?.url
        || obj.file?.link
        || obj.file?.path
        || obj.document?.url
        || obj.document?.path
        || obj.data?.url;
      if (!found) return undefined;
      // If the backend returned a relative path, prefix it with API origin if available
      if (typeof found === 'string') {
        if (/^https?:\/\//i.test(found) || found.startsWith('data:')) return found;
        if (apiOrigin) {
          // handle '/path' and 'path' alike
          return found.startsWith('/') ? (apiOrigin + found) : (apiOrigin + '/' + found);
        }
      }
      return found as string | undefined;
    };

    const pushSingleFrom = (src: any, keys: string[], label: string) => {
      for (const key of keys) {
        const v = src?.[key];
        if (v == null || v === false) continue;
        if (typeof v === 'string') {
          docs.push({ label, items: [{ name: label, url: v }] });
          return;
        }
        if (typeof v === 'object') {
          const url = tryResolveUrl(v);
          const name = v?.name || v?.filename || label;
          if (url || v === true) {
            docs.push({ label, items: [{ name, url }] });
            return;
          }
        }
        if (v === true) {
          docs.push({ label, items: [{ name: label }] });
          return;
        }
      }
    };

    const pushArrayFrom = (src: any, keys: string[], label: string) => {
      for (const key of keys) {
        const arr = src?.[key];
        if (Array.isArray(arr) && arr.length > 0) {
          docs.push({
            label,
            items: arr.map((it: any, idx: number) => ({
              name: it?.name || it?.filename || it?.type || `${label} ${idx + 1}`,
              url: tryResolveUrl(it) || (typeof it === 'string' ? it : undefined),
            }))
          });
          return;
        }
      }
    };

    // Iterate over sources to collect known keys (supporting alternate naming)
    for (const src of sources) {
      pushSingleFrom(src, ['statutes', 'statute', 'company_statutes'], 'Statuts');
      pushSingleFrom(src, ['commerceRegistry', 'commerce_registry', 'rc', 'registre_commerce'], 'Registre de commerce');
      pushSingleFrom(src, ['residenceCertificate', 'residence_certificate', 'residenceProof', 'residence_proof'], 'Certificat de résidence');
      pushSingleFrom(src, ['representativeId', 'representative_id', 'id_representant'], 'Pièce d’identité représentant');
      pushArrayFrom(src, ['partnersIds', 'partners_ids', 'ids_associés', 'partners_documents'], 'Pièces d’identité associés');

      // Generic array of documents with {name,type,url}
      if (Array.isArray(src.documents)) {
        docs.push({
          label: 'Documents fournis',
          items: src.documents.map((d: any, idx: number) => ({
            name: d?.name || d?.filename || d?.type || `Document ${idx + 1}`,
            url: tryResolveUrl(d),
          }))
        });
      }
      if (Array.isArray(src.files)) {
        docs.push({
          label: 'Fichiers joints',
          items: src.files.map((d: any, idx: number) => ({
            name: d?.name || d?.filename || d?.type || `Fichier ${idx + 1}`,
            url: tryResolveUrl(d),
          }))
        });
      }
      if (Array.isArray(src.attachments)) {
        docs.push({
          label: 'Pièces jointes',
          items: src.attachments.map((d: any, idx: number) => ({
            name: d?.name || d?.filename || d?.type || `Pièce jointe ${idx + 1}`,
            url: tryResolveUrl(d),
          }))
        });
      }
    }

    // Deduplicate groups by label and items by name+url
    const byLabel = new Map<string, { name: string; url?: string }[]>();
    for (const g of docs) {
      const list = byLabel.get(g.label) || [];
      for (const it of g.items) {
        if (!list.find(x => x.name === it.name && x.url === it.url)) list.push(it);
      }
      byLabel.set(g.label, list);
    }
    return Array.from(byLabel.entries())
      .map(([label, items]) => ({ label, items }))
      .filter(g => g.items.length > 0);
  };

  const documentGroups = normalizeDocuments();
  if (process.env.NODE_ENV !== 'production' && documentGroups.length === 0) {
    // Helpful debug to understand backend payload shape for documents
    // eslint-disable-next-line no-console
    console.debug('[ApplicationDrawer] Aucun document détecté. Payload application =', application);
  }

  const assignToMe = async () => {
    try {
      setSaving(true);
      setError(null);
      await agentBusinessAPI.assignApplication(application.id, true);
      onUpdated?.({ ...application, assigned_agent: { ...(application.assigned_agent || {}), firstName: 'Moi', lastName: '' } } as any);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de l\'assignation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Demande #{application.id}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>Fermer</button>
        </div>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500">Entreprise</div>
            <div className="text-sm font-medium">{application.company_name || '—'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priorité</label>
              <select className="border rounded w-full px-3 py-2 text-sm" value={localPriority} onChange={(e) => setLocalPriority(e.target.value)}>
                <option value="">—</option>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Assignation</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">{application.assigned_agent ? `${application.assigned_agent.firstName} ${application.assigned_agent.lastName}` : 'Non assigné'}</span>
                <button disabled={saving} onClick={assignToMe} className="ml-auto px-3 py-1 text-xs rounded border">M'assigner</button>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500">Statut</div>
              <div className="mt-1">{getStatusChip(application.status)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500">Priorité</div>
              <div className="mt-1">{getPriorityChip(application.priority)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500">Soumise le</div>
              <div className="text-sm">{application.submitted_at ? new Date(application.submitted_at).toLocaleDateString('fr-FR') : '—'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500">Demandeur</div>
              <div className="text-sm">{application.user ? `${application.user.firstName || ''} ${application.user.lastName || ''}`.trim() : '—'}</div>
              <div className="text-xs text-gray-600">{application.user?.email || ''}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes agent</label>
            <textarea className="border rounded w-full px-3 py-2 text-sm" rows={6} value={localNotes} onChange={(e) => setLocalNotes(e.target.value)} />
          </div>

          {/* Costs summary if available */}
          {(() => { const c = resolveCosts(); if (!c) return null; return (
            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-2">Coûts</h4>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                {typeof c.base === 'number' && (
                  <div className="flex justify-between"><span>Immatriculation</span><span>{c.base.toLocaleString()} {c.currency}</span></div>
                )}
                {typeof c.service === 'number' && (
                  <div className="flex justify-between"><span>Service InvestMali</span><span>{c.service.toLocaleString()} {c.currency}</span></div>
                )}
                {typeof c.publication === 'number' && (
                  <div className="flex justify-between"><span>Publication</span><span>{c.publication.toLocaleString()} {c.currency}</span></div>
                )}
                {typeof c.partnersExtra === 'number' && c.partnersExtra > 0 && (
                  <div className="flex justify-between"><span>Associés supplémentaires</span><span>{c.partnersExtra.toLocaleString()} {c.currency}</span></div>
                )}
                <div className="flex justify-between font-medium border-t pt-2 mt-1">
                  <span>Total</span>
                  <span>{c.total.toLocaleString()} {c.currency}</span>
                </div>
              </div>
            </div>
          ); })()}

          {/* Documents provided at creation */}
          <div className="pt-2">
            <h4 className="text-sm font-semibold mb-2">Documents fournis</h4>
            {documentGroups.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun document détecté pour cette demande.</p>
            ) : (
              <div className="space-y-3">
                {documentGroups.map((group, gi) => (
                  <div key={gi} className="border rounded p-3">
                    <div className="text-xs text-gray-500 mb-2">{group.label}</div>
                    <ul className="space-y-1">
                      {group.items.map((it, ii) => (
                        <li key={ii} className="flex items-center justify-between text-sm">
                          <span className="text-gray-800">{it.name}</span>
                          {it.url ? (
                            <a href={it.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Ouvrir</a>
                          ) : (
                            <span className="text-gray-500 text-xs">Fourni</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2">
            <button className="px-4 py-2 text-sm rounded border" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="px-4 py-2 text-sm rounded bg-indigo-600 text-white disabled:opacity-50" onClick={handleSave} disabled={saving}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDrawer;
