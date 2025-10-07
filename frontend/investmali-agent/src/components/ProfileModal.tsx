import React from 'react';
import { agentAuthAPI } from '../services/api';

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
  agent: {
    id: string | number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
    role?: string;
    avatarUrl?: string;
  } | null;
  onSaved: (agent: any) => void;
};

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, agent, onSaved }) => {
  const [firstName, setFirstName] = React.useState(agent?.firstName || '');
  const [lastName, setLastName] = React.useState(agent?.lastName || '');
  const [email, setEmail] = React.useState(agent?.email || '');
  const [phone, setPhone] = React.useState(agent?.phone || '');
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(agent?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onPickFile = (file: File) => {
    const maxSize = 3 * 1024 * 1024; // 3MB
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Formats supportés: PNG, JPG, JPEG, WEBP');
      return;
    }
    if (file.size > maxSize) {
      setError('La taille maximale autorisée est 3 Mo');
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  React.useEffect(() => {
    if (open) {
      setFirstName(agent?.firstName || '');
      setLastName(agent?.lastName || '');
      setEmail(agent?.email || '');
      setPhone(agent?.phone || '');
      setAvatarPreview(agent?.avatarUrl || null);
      setAvatarFile(null);
      setError(null);
    }
  }, [open, agent]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const up = await agentAuthAPI.uploadAvatar(avatarFile);
        const upData = up?.data ?? up;
        const avatarObj = upData?.data || upData;
        avatarUrl = avatarObj?.avatarUrl || avatarObj?.avatar_url || avatarObj?.url || avatarObj?.path;
      }

      const payload = { firstName, lastName, email, phone } as any;
      const resp: any = await agentAuthAPI.updateProfile(payload);
      const data = resp?.data ?? resp;
      const updated = data?.data?.agent || data?.agent || data?.data || payload;
      if (avatarUrl) (updated as any).avatarUrl = avatarUrl;
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Modifier le profil</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          {/* Avatar uploader */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Photo de profil</label>
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files?.[0]; if (f) onPickFile(f); }}
              className="flex items-center gap-4 p-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50/60 dark:bg-gray-900/40"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Aperçu avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500">👤</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-300">Glissez-déposez une image ici, ou</p>
                <label className="inline-flex mt-1 text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); }} />
                  Choisir un fichier
                </label>
                <p className="text-[10px] text-gray-400">PNG, JPG, WEBP • max 3 Mo</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900">Annuler</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-60"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
