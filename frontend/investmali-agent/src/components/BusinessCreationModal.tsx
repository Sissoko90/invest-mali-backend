import React from 'react';
import AgentBusinessCreation from './AgentBusinessCreation';

interface BusinessCreationModalProps {
  open: boolean;
  onClose: () => void;
}

const BusinessCreationModal: React.FC<BusinessCreationModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Créer une entreprise</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Fermer"
            title="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <AgentBusinessCreation />
        </div>
      </div>
    </div>
  );
};

export default BusinessCreationModal;
