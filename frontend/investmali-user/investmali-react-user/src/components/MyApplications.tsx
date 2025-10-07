import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { businessAPI } from '../services/api';

interface ApplicationItem {
  id: string;
  businessName: string;
  status?: string;
  documentsJson?: string | null;
  createdAt?: string;
}

const MyApplications: React.FC = () => {
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const buildUrl = (p: string) => {
    if (!p) return '#';
    if (/^https?:\/\//i.test(p)) return p;
    // Ensure single slash
    const path = p.startsWith('/') ? p : `/${p}`;
    if (API_BASE) return `${API_BASE}${path}`;
    return path; // same origin via CRA proxy
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await businessAPI.getMyApplications();
        // res could be an array of applications; adapt if wrapped
        const list: ApplicationItem[] = Array.isArray(res) ? res : (res?.data ?? []);
        setItems(list as any);
      } catch (e: any) {
        setError(e?.message || 'Impossible de charger vos demandes');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderDocs = (app: ApplicationItem) => {
    if (!app.documentsJson) return <span className="text-gray-400">Aucun document</span>;
    let docs: any = null;
    try {
      docs = JSON.parse(app.documentsJson);
    } catch {
      return <span className="text-red-500">Documents illisibles</span>;
    }
    const entries: Array<{ key: string; label: string; path?: string }> = [
      { key: 'statutesName', label: 'Statuts', path: docs?.statutesName },
      { key: 'residenceCertificateName', label: 'Certificat de résidence', path: docs?.residenceCertificateName },
      { key: 'commerceRegistryName', label: 'Registre de commerce', path: docs?.commerceRegistryName },
    ];

    const available = entries.filter(e => typeof e.path === 'string' && e.path);
    if (available.length === 0) return <span className="text-gray-400">Aucun document</span>;

    return (
      <div className="space-y-1">
        {available.map(e => (
          <div key={e.key} className="text-sm">
            <span className="text-gray-600 mr-2">{e.label}:</span>
            <a className="text-mali-emerald hover:underline" href={buildUrl(e.path!)} target="_blank" rel="noreferrer">
              Ouvrir
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold mb-6">Mes demandes</h1>

        {loading && <div>Chargement...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="overflow-hidden bg-white shadow rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dossier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{app.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{app.businessName || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{app.status || '-'}</span>
                    </td>
                    <td className="px-6 py-4">{renderDocs(app)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>Aucune demande pour l'instant.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyApplications;
