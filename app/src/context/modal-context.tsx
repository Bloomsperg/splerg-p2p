import React, { createContext, useContext, useCallback } from 'react';
import { ModalType } from '../model';

interface ModalContextType {
  activeModals: Set<ModalType>;
  openModal: (modal: ModalType) => void;
  closeModal: (modal: ModalType) => void;
  isModalOpen: (modal: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeModals, setActiveModals] = React.useState<Set<ModalType>>(
    new Set()
  );

  const openModal = useCallback((modal: ModalType) => {
    setActiveModals((prev) => new Set(prev).add(modal));
  }, []);

  const closeModal = useCallback((modal: ModalType) => {
    setActiveModals((prev) => {
      const next = new Set(prev);
      next.delete(modal);
      return next;
    });
  }, []);

  const isModalOpen = useCallback(
    (modal: ModalType) => {
      return activeModals.has(modal);
    },
    [activeModals]
  );

  return (
    <ModalContext.Provider
      value={{
        activeModals,
        openModal,
        closeModal,
        isModalOpen,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
