import React, { useEffect } from 'react';
import AgentBusinessCreation from './AgentBusinessCreation';
import { useModal } from '../contexts/ModalContext';

interface BusinessCreationModalProps {
  open: boolean;
  onClose: () => void;
}

const BusinessCreationModal: React.FC<BusinessCreationModalProps> = ({ open, onClose }) => {
  const { openModal, closeModal } = useModal();

  // Gérer l'état global du modal
  useEffect(() => {
    if (open) {
      openModal();
      console.log('🔔 Modal BusinessCreation ouvert - état global mis à jour');
    } else {
      closeModal();
      console.log('🔔 Modal BusinessCreation fermé - état global mis à jour');
    }

    return () => {
      if (open) {
        closeModal();
      }
    };
  }, [open, openModal, closeModal]);

  if (!open) return null;
  
  // Empêcher la fermeture accidentelle du modal par les clics sur le backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Ne fermer que si le clic est directement sur le backdrop, pas sur ses enfants
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={handleBackdropClick}
      />

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
























