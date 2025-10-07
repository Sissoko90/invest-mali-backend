import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentAuth } from '../contexts/AgentAuthContext';
import KpiCards, { AgentStats } from '../components/KpiCards';
import ApplicationFilters, { Filters } from '../components/ApplicationFilters';
import ApplicationsTable, { ApplicationRow } from '../components/ApplicationsTable';
import ApplicationDrawer, { ApplicationDetail } from '../components/ApplicationDrawer';
import { agentBusinessAPI, notificationsAPI } from '../services/api';

import NotificationBell from '../components/NotificationBell';
import RoleNotification from '../components/RoleNotification';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import ProfileModal from '../components/ProfileModal';
import BusinessCreationModal from '../components/BusinessCreationModal';

const AgentDashboard: React.FC = () => {
  const { agent, logout, updateAgent, canEditStep, canViewStep, hasRole } = useAgentAuth();
  const navigate = useNavigate();

  const [stats, setStats] = React.useState<AgentStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(false);

  const [filters, setFilters] = React.useState<Filters>({ sort: '-submitted_at', assigned: 'all' });
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [rows, setRows] = React.useState<ApplicationRow[]>([]);
  const [listLoading, setListLoading] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ApplicationDetail | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'demandes' | 'validation' | 'besoins'>('dashboard');

  // Theme (light/dark) with persistence
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? (saved as 'light' | 'dark') : 'light';
  });
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Localize backend status codes for display
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
        return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  // Notifications state (can be wired to API later)
  type NotificationItem = {
    id: string;
    title: string;
    description?: string;
    time?: string;
    read?: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  };
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    { id: 'n1', title: "Nouvelle demande assignée", description: "Dossier #2487", time: "il y a 2 min", type: 'info' },
    { id: 'n2', title: "Validation requise", description: "TechMali Solutions", time: "il y a 1 h", type: 'warning' },
    { id: 'n3', title: "Paiement reçu", description: "Demande #2410", time: "hier", type: 'success', read: true },
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Fonction pour obtenir les informations du rôle
  const getRoleInfo = () => {
    const roleMapping = {
      'AGENT_ACCEUIL': {
        name: 'Agent d\'Accueil',
        description: 'Gestion de l\'étape d\'accueil et intake',
        step: 'ACCUEIL',
        color: 'bg-blue-500',
        icon: '🏢'
      },
      'REGISSEUR': {
        name: 'Régisseur',
        description: 'Gestion de l\'étape de régie',
        step: 'REGISSEUR',
        color: 'bg-green-500',
        icon: '📋'
      },
      'AGENT_REVISION': {
        name: 'Agent de Révision',
        description: 'Contrôle et révision des documents',
        step: 'REVISION',
        color: 'bg-yellow-500',
        icon: '🔍'
      },
      'AGENT_IMPOT': {
        name: 'Agent Impôts',
        description: 'Traitement fiscal et déclarations',
        step: 'IMPOT',
        color: 'bg-red-500',
        icon: '💰'
      },
      'AGENT_RCCM1': {
        name: 'Agent RCCM Phase 1',
        description: 'Première phase du registre de commerce',
        step: 'RCCM1',
        color: 'bg-purple-500',
        icon: '📄'
      },
      'AGENT_RCCM2': {
        name: 'Agent RCCM Phase 2',
        description: 'Finalisation du registre de commerce',
        step: 'RCCM2',
        color: 'bg-indigo-500',
        icon: '✅'
      },
      'AGENT_NINA': {
        name: 'Agent NINA',
        description: 'Numéro d\'identification nationale',
        step: 'NINA',
        color: 'bg-pink-500',
        icon: '🆔'
      },
      'AGENT_RETRAIT': {
        name: 'Agent Retrait',
        description: 'Finalisation et remise des documents',
        step: 'RETRAIT',
        color: 'bg-gray-500',
        icon: '📦'
      },
      'SUPER_ADMIN': {
        name: 'Super Administrateur',
        description: 'Accès complet à toutes les étapes',
        step: 'ALL',
        color: 'bg-mali-emerald',
        icon: '👑'
      }
    };
    
    return roleMapping[agent?.role as keyof typeof roleMapping] || {
      name: 'Agent',
      description: 'Rôle non défini',
      step: 'UNKNOWN',
      color: 'bg-gray-400',
      icon: '👤'
    };
  };

  const roleInfo = getRoleInfo();

  // Load notifications from backend on mount
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await notificationsAPI.list({ limit: 20 });
        const payload = (data?.data ?? data) as any;
        const arr = (payload?.notifications ?? payload?.rows ?? payload ?? []) as any[];
        const mapped = arr.map((it) => ({
          id: String(it.id ?? it._id ?? Math.random()),
          title: it.title ?? it.message ?? it.type ?? 'Notification',
          description: it.description ?? it.body ?? '',
          time: it.time ?? it.created_at ?? it.createdAt ?? '',
          read: Boolean(it.read ?? it.is_read ?? it.read_at),
          type: (it.type === 'success' || it.type === 'warning' || it.type === 'error') ? it.type : 'info',
        }));
        if (mapped.length) setNotifications(mapped);
      } catch (e) {
        // optional: keep local demo data on failure
      }
    })();
  }, []);

  // Sync read state to backend when NotificationBell changes items
  const handleNotificationsChange = async (next: typeof notifications) => {
    const prevById = new Map(notifications.map(n => [n.id, n]));
    const newlyRead = next.filter(n => n.read && prevById.get(n.id)?.read === false);
    setNotifications(next);
    try {
      if (newlyRead.length > 3) {
        await notificationsAPI.markAllRead();
      } else {
        await Promise.all(newlyRead.map(n => notificationsAPI.markRead(n.id)));
      }
    } catch (_) {
      // ignore errors for now
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/agent-login');
  };

  const handleProfileSaved = (updated: any) => {
    // Normalize potential backend shapes
    const src = updated || {};
    updateAgent({
      firstName: src.firstName || src.first_name || agent?.firstName || '',
      lastName: src.lastName || src.last_name || agent?.lastName || '',
      email: src.email || agent?.email || '',
      phone: src.phone || agent?.phone || '',
      avatarUrl: src.avatarUrl || src.avatar_url || agent?.avatarUrl || '',
    });
  };

  const fetchStats = React.useCallback(async () => {
    try {
      setStatsLoading(true);
      const { data } = await agentBusinessAPI.getStats();
      setStats(data.data || data);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchList = React.useCallback(async () => {
    try {
      setListLoading(true);
      const params: any = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.assigned) params.assigned = filters.assigned;
      if (filters.q) params.q = filters.q;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.sort) params.sort = filters.sort;
      const { data } = await agentBusinessAPI.listApplications(params);
      const payload = data.data || data; // support both shapes
      setRows(payload.applications || payload.rows || []);
      setTotal(payload.pagination?.total ?? payload.total ?? 0);
    } finally {
      setListLoading(false);
    }
  }, [page, limit, filters]);

  React.useEffect(() => { fetchStats(); }, [fetchStats]);
  React.useEffect(() => { fetchList(); }, [fetchList]);

  // Close creation modal and refresh lists when a creation succeeds (event dispatched by AgentBusinessCreation)
  React.useEffect(() => {
    const handler = () => {
      setCreateOpen(false);
      fetchList();
      fetchStats();
    };
    window.addEventListener('agent-applications:refresh', handler as EventListener);
    return () => window.removeEventListener('agent-applications:refresh', handler as EventListener);
  }, [fetchList, fetchStats]);

  const openDrawer = async (row: ApplicationRow) => {
    // Optionally refetch full detail
    try {
      const { data } = await agentBusinessAPI.getApplication(row.id);
      const detail = (data.data || data) as ApplicationDetail;
      setSelected(detail);
    } catch {
      setSelected(row as ApplicationDetail);
    } finally {
      setDrawerOpen(true);
    }
  };

  const onUpdated = (updated: ApplicationDetail) => {
    // refresh list and possibly stats
    setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    fetchStats();
  };

  const resetFilters = () => {
    setFilters({ sort: '-submitted_at', assigned: 'all' });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-mali-light dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="relative text-white shadow animate-fade-in-down">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-mali-emerald to-mali-gold" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/90 text-primary-700 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                <span className="text-sm font-extrabold">IM</span>
              </div>
              <div className="ml-2">
                <h1 className="text-xl font-bold tracking-tight">API-MALI</h1>
                <p className="text-white/80 text-sm">Agent Création d'Entreprise - {roleInfo.name}</p>
              </div>
              
              {/* Badge du rôle */}
              <div className="ml-4 flex items-center space-x-2">
                <div className={`${roleInfo.color} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
                  <span>{roleInfo.icon}</span>
                  <span>{roleInfo.step !== 'ALL' ? `Étape ${roleInfo.step}` : 'Toutes Étapes'}</span>
                </div>
                {hasRole('SUPER_ADMIN') && (
                  <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ADMIN
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setProfileOpen(true)}
                className="group flex items-center gap-3 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 px-2 py-1"
                aria-label="Ouvrir le profil"
                title="Modifier le profil"
              >
                <div className="text-right">
                  <p className="text-sm font-medium group-hover:underline">{agent?.firstName || agent?.email}</p>
                  <p className="text-xs text-white/80">{agent?.role || 'Agent'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 backdrop-blur flex items-center justify-center">
                  {agent?.avatarUrl ? (
                    <img src={agent.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{(agent?.firstName?.[0] || 'A')}{(agent?.lastName?.[0] || '')}</span>
                  )}
                </div>
              </button>
              <NotificationBell items={notifications} onChangeItems={handleNotificationsChange} />
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur transition-colors"
                aria-label="Basculer le thème"
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-lg transition-colors font-medium">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 dark:bg-gray-900/60 dark:border-gray-800 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6">
            {([
              { key: 'dashboard', label: 'Tableau de Bord' },
              { key: 'demandes', label: 'Demandes de Création' },
              { key: 'validation', label: 'Validation' },
              { key: 'besoins', label: 'Expression des Besoins' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative whitespace-nowrap py-3 px-1 text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {t.label}
                  {t.key === 'dashboard' && unreadCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full bg-mali-gold text-white">
                      {unreadCount}
                    </span>
                  )}
                </span>
                {activeTab === t.key && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-primary-500 via-mali-emerald to-mali-gold rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Dashboard tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <KpiCards stats={stats} loading={statsLoading} />

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
              <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in-up" style={{animationDelay: '20ms'}}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-emerald-600">🏢</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Créer une entreprise</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Démarrer une nouvelle demande</p>
                  <button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Créer
                  </button>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in-up" style={{animationDelay: '60ms'}}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-mali-emerald/10 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-mali-emerald">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Workflow RBAC</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Gestion par étapes et rôles</p>
                  <button onClick={() => navigate('/dossier')} className="bg-mali-emerald hover:bg-mali-emerald-dark text-white px-4 py-2 rounded-lg transition-colors">
                    Accéder
                  </button>
                </div>
              </div>
              {/* Action spécifique au rôle */}
              <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in-up" style={{animationDelay: '80ms'}}>
                <div className="text-center">
                  <div className={`w-16 h-16 ${roleInfo.color}/10 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl">{roleInfo.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mon Étape</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{roleInfo.description}</p>
                  <button 
                    onClick={() => navigate('/dossier')} 
                    className={`${roleInfo.color} hover:opacity-90 text-white px-4 py-2 rounded-lg transition-colors`}
                    disabled={!canEditStep(roleInfo.step) && roleInfo.step !== 'ALL'}
                  >
                    {canEditStep(roleInfo.step) || roleInfo.step === 'ALL' ? 'Gérer' : 'Consulter'}
                  </button>
                </div>
              </div>
              
              <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-primary-600">👁️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Examiner Demandes</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Réviser les nouvelles demandes</p>
                  <button onClick={() => setActiveTab('demandes')} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Accéder
                  </button>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in-up" style={{animationDelay: '140ms'}}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-green-600">✔️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Validation Rapide</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Valider les dossiers complets</p>
                  <button onClick={() => setActiveTab('validation')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Valider
                  </button>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in-up" style={{animationDelay: '220ms'}}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-purple-600">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Expression des Besoins</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Gérer les besoins exprimés</p>
                  <button onClick={() => setActiveTab('besoins')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Accéder
                  </button>
                </div>
              </div>
            </div>

            {/* Informations RBAC */}
            <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mes Permissions</h2>
                <div className="flex items-center space-x-2">
                  <span className={`${roleInfo.color} text-white px-2 py-1 rounded text-xs font-medium`}>
                    {agent?.role}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Étapes Autorisées (Édition)</h3>
                  <div className="space-y-1">
                    {['ACCUEIL', 'REGISSEUR', 'REVISION', 'IMPOT', 'RCCM1', 'RCCM2', 'NINA', 'RETRAIT'].map(step => (
                      <div key={step} className="flex items-center space-x-2">
                        {canEditStep(step) ? (
                          <span className="text-green-600 dark:text-green-400">✅</span>
                        ) : (
                          <span className="text-gray-400">❌</span>
                        )}
                        <span className={`text-sm ${canEditStep(step) ? 'text-green-700 dark:text-green-300' : 'text-gray-500'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Étapes Visibles (Lecture)</h3>
                  <div className="space-y-1">
                    {['ACCUEIL', 'REGISSEUR', 'REVISION', 'IMPOT', 'RCCM1', 'RCCM2', 'NINA', 'RETRAIT'].map(step => (
                      <div key={step} className="flex items-center space-x-2">
                        {canViewStep(step) ? (
                          <span className="text-blue-600 dark:text-blue-400">👁️</span>
                        ) : (
                          <span className="text-gray-400">🔒</span>
                        )}
                        <span className={`text-sm ${canViewStep(step) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Privilèges Spéciaux</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {hasRole('SUPER_ADMIN') ? (
                        <span className="text-yellow-600 dark:text-yellow-400">👑</span>
                      ) : (
                        <span className="text-gray-400">❌</span>
                      )}
                      <span className={`text-sm ${hasRole('SUPER_ADMIN') ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-500'}`}>
                        Super Admin
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasRole('SUPER_ADMIN') ? (
                        <span className="text-yellow-600 dark:text-yellow-400">⚡</span>
                      ) : (
                        <span className="text-gray-400">❌</span>
                      )}
                      <span className={`text-sm ${hasRole('SUPER_ADMIN') ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-500'}`}>
                        Transition Forcée
                      </span>
                    </div>
                    
                    {/* Bouton de debug temporaire */}
                    {!hasRole('SUPER_ADMIN') && (
                      <div className="mt-3 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                        <button
                          onClick={() => {
                            const currentAgent = JSON.parse(localStorage.getItem('investmali_agent') || '{}');
                            const updatedAgent = { ...currentAgent, role: 'SUPER_ADMIN' };
                            localStorage.setItem('investmali_agent', JSON.stringify(updatedAgent));
                            updateAgent(updatedAgent);
                            window.location.reload();
                          }}
                          className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                        >
                          🔧 Forcer SUPER_ADMIN (Debug)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent demandes */}
            <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Demandes Récentes</h2>
              <div className="space-y-4">
                {(rows.slice(0, 5)).map((r, idx) => (
                  <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-fade-in-up" style={{animationDelay: `${idx * 80}ms`}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-primary-600">🏢</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{r.company_name || `Demande #${r.id}`}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-300">ID #{r.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {formatStatus(String(r.status))}
                        </span>
                        <button onClick={() => openDrawer(r)} className="text-primary-600 hover:text-primary-800 font-medium">Examiner</button>
                      </div>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && <p className="text-gray-500 dark:text-gray-300 text-sm">Aucune demande récente.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Demandes tab */}
        {activeTab === 'demandes' && (
          <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Demandes de Création d'Entreprise</h2>
            </div>
            <ApplicationFilters value={filters} onChange={(f) => { setFilters(f); setPage(1); }} onReset={resetFilters} loading={listLoading} />
            <div className="mt-4">
              <ApplicationsTable
                rows={rows}
                page={page}
                limit={limit}
                total={total}
                loading={listLoading}
                onPageChange={setPage}
                onRowClick={openDrawer}
              />
            </div>
          </div>
        )}

        {/* Validation tab */}
        {activeTab === 'validation' && (
          <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Validation des Demandes</h2>
            <div className="space-y-4">
              {rows
                .filter((r) => ['in_review', 'ready_for_validation'].includes(String(r.status)))
                .slice(0, 10)
                .map((r) => (
                  <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{r.company_name || `Demande #${r.id}`}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300">ID #{r.id}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            await agentBusinessAPI.updateStatus(r.id, 'approved');
                            fetchList();
                            fetchStats();
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Valider
                        </button>
                        <button
                          onClick={async () => {
                            await agentBusinessAPI.updateStatus(r.id, 'rejected');
                            fetchList();
                            fetchStats();
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg">
                        <span className="font-medium">Demandeur:</span> {r.user?.firstName} {r.user?.lastName}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg">
                        <span className="font-medium">Statut:</span> {formatStatus(String(r.status))}
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg">
                        <span className="font-medium">Assigné à:</span> {r.assigned_agent ? `${r.assigned_agent.firstName} ${r.assigned_agent.lastName}` : 'Non assigné'}
                      </div>
                    </div>
                  </div>
                ))}
              {rows.filter((r) => ['in_review', 'ready_for_validation'].includes(String(r.status))).length === 0 && (
                <p className="text-gray-500 dark:text-gray-300 text-sm">Aucune demande en attente de validation.</p>
              )}
            </div>
          </div>
        )}

        {/* Besoins tab (placeholder) */}
        {activeTab === 'besoins' && (
          <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expression des Besoins</h2>
              <a href="#" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">Gestion Complète</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Besoins</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">--</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">En cours</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">--</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Traités</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">--</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Prioritaires</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">--</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Besoins récents</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Exemple de besoin</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Description courte...</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">Prioritaire</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ApplicationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} application={selected} onUpdated={onUpdated} />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        agent={agent}
        onSaved={handleProfileSaved}
      />
      <BusinessCreationModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <RoleNotification />
    </div>
  );
};

export default AgentDashboard;
