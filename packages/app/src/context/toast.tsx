// toast-context.tsx
import React, { createContext, useContext, useState } from 'react';

interface ToastContextType {
  showToast: (show: boolean) => void;
  isVisible: boolean;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <ToastContext.Provider value={{ showToast: setIsVisible, isVisible }}>
      {children}
      {isVisible && (
        <div className="toast z-[9999] bottom-12 md:bottom-4">
          <div className="alert alert-outline border-sunset md:mb-0">
            <span className="loading loading-spinner" />
            <span>Confirming transaction</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
