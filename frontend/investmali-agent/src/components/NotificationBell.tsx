import React from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  time?: string; // already formatted string
  read?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
};

type Props = {
  items?: NotificationItem[];
  onChangeItems?: (items: NotificationItem[]) => void;
};

const NotificationBell: React.FC<Props> = ({ items, onChangeItems }) => {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [list, setList] = React.useState<NotificationItem[]>(() =>
    items && items.length
      ? items
      : [
          { id: 'n1', title: "Nouvelle demande assignée", description: "Dossier #2487", time: "il y a 2 min", type: 'info' },
          { id: 'n2', title: "Validation requise", description: "TechMali Solutions", time: "il y a 1 h", type: 'warning' },
          { id: 'n3', title: "Paiement reçu", description: "Demande #2410", time: "hier", type: 'success', read: true },
        ]
  );

  React.useEffect(() => { if (items) setList(items); }, [items]);

  const unreadCount = list.filter((n) => !n.read).length;

  const setItems = (next: NotificationItem[]) => {
    setList(next);
    onChangeItems?.(next);
  };

  const markOne = (id: string) => setItems(list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems(list.map((n) => ({ ...n, read: true })));

  const typeColor = (t?: NotificationItem['type']) => {
    switch (t) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-primary-50 text-primary-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  // Format times in fr-FR if parsable, else show original
  const fmt = (t?: string) => {
    if (!t) return '';
    const d = new Date(t);
    if (isNaN(d.getTime())) return t; // keep given label like "il y a 2 min"
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  };

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current || !buttonRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target) && !buttonRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Keyboard: Escape to close, focus trap within menu
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'Tab' && menuRef.current) {
        const focusables = menuRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          (last as HTMLElement).focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // focus first focusable when opening
    setTimeout(() => {
      const firstBtn = menuRef.current?.querySelector<HTMLElement>('button');
      firstBtn?.focus();
    }, 0);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="notifications-menu"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full bg-mali-gold text-white shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          id="notifications-menu"
          role="menu"
          aria-labelledby="notifications-button"
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
            <button onClick={markAll} className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400" role="menuitem">Tout marquer lu</button>
          </div>
          <ul className="max-h-80 overflow-auto divide-y divide-gray-100 dark:divide-gray-700" role="none">
            {list.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-300">Aucune notification</li>
            )}
            {list.map((n) => (
              <li key={n.id} className={`px-4 py-3 ${n.read ? 'bg-white dark:bg-gray-800' : 'bg-primary-50/40 dark:bg-blue-900/10'}`} role="none">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${typeColor(n.type)}`}>{n.type || 'info'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                    {n.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{n.description}</p>
                    )}
                    {n.time && <p className="text-[11px] text-gray-400 mt-1">{fmt(n.time)}</p>}
                  </div>
                  {!n.read && (
                    <button onClick={() => markOne(n.id)} className="text-gray-400 hover:text-green-600" title="Marquer comme lue" role="menuitem">
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
