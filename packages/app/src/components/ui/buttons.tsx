import React from 'react';
import { CancelIcon, SwapVerticalIcon } from './icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  loading = false,
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';

  return (
    <button
      type="button"
      className={`${baseClasses} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <span className="loading loading-spinner" /> : children}
    </button>
  );
};

export const SwapButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}> = ({ onClick, disabled, loading }) => (
  <div className="card-actions justify-end mt-4 w-full">
    <Button
      className="bg-sunset w-full rounded"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      Swap
    </Button>
  </div>
);

export const SwapDirectionButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <div className="flex justify-center my-2">
    <Button className="btn-circle btn-ghost" onClick={onClick}>
      <SwapVerticalIcon />
    </Button>
  </div>
);

export const CancelButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <Button className="btn-circle" onClick={onClick}>
    <CancelIcon />
  </Button>
);
