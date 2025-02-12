import React, { createContext, useContext, useCallback } from 'react';
import { ModalType } from '../model';

interface ModalContextType {
  openModal: (modal: ModalType) => void;
  closeModal: (modal: ModalType) => void;
  isModalOpen: (modal: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const openModal = useCallback((modal: ModalType) => {
    const dialog = document.getElementById(modal) as HTMLDialogElement;
    if (dialog) dialog.showModal();
  }, []);

  const closeModal = useCallback((modal: ModalType) => {
    const dialog = document.getElementById(modal) as HTMLDialogElement;
    if (dialog) dialog.close();
  }, []);

  const isModalOpen = useCallback((modal: ModalType) => {
    const dialog = document.getElementById(modal) as HTMLDialogElement;
    return dialog ? dialog.open : false;
  }, []);

  return (
    <ModalContext.Provider
      value={{
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
