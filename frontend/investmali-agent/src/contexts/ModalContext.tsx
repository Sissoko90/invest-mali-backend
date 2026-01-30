<<<<<<< HEAD
﻿import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  modalCount: number;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalCount, setModalCount] = useState(0);

  const openModal = () => {
    setModalCount(prev => prev + 1);
  };

  const closeModal = () => {
    setModalCount(prev => Math.max(0, prev - 1));
  };

  const setModalOpen = (open: boolean) => {
    if (open) {
      openModal();
    } else {
      closeModal();
    }
  };

  const isModalOpen = modalCount > 0;

  return (
    <ModalContext.Provider value={{
      isModalOpen,
      setModalOpen,
      modalCount,
      openModal,
      closeModal
    }}>
      {children}
    </ModalContext.Provider>
  );
};
























=======
﻿import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  modalCount: number;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalCount, setModalCount] = useState(0);

  const openModal = () => {
    setModalCount(prev => prev + 1);
  };

  const closeModal = () => {
    setModalCount(prev => Math.max(0, prev - 1));
  };

  const setModalOpen = (open: boolean) => {
    if (open) {
      openModal();
    } else {
      closeModal();
    }
  };

  const isModalOpen = modalCount > 0;

  return (
    <ModalContext.Provider value={{
      isModalOpen,
      setModalOpen,
      modalCount,
      openModal,
      closeModal
    }}>
      {children}
    </ModalContext.Provider>
  );
};
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
