// swap-form-components.tsx
import React from 'react';
import TokenList from './token-list';
import { SwapVerticalIcon } from './ui/icon';
import { defaultTokens } from '../utils';
import { TokenIcon } from './ui/icon';

export interface TokenInputProps {
  token: string;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  label: string;
  balance?: string;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  label,
  balance = '$0',
}) => (
  <>
    <div className="p text-ghost shadow-xl flex justify-between">
      <div>{label}</div>
      <div className="text-[8px]">
        <span className="text-sunset text-xs">{balance}</span> balance
      </div>
    </div>

    <label className="input input-xl flex items-center gap shadow-xl bg-base-300 border-none shadow-base">
      {token && <TokenIcon mint={token} />}
      <input
        type="number"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        className="grow"
        placeholder="0.0"
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={onTokenSelect}
      >
        {token || 'select'}
      </button>
    </label>
  </>
);

export const SwapButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
}> = ({ onClick, disabled }) => (
  <div className="card-actions justify-end mt-4">
    <button
      type="button"
      className="btn bg-sunset w-full rounded"
      onClick={onClick}
      disabled={disabled}
    >
      Swap
    </button>
  </div>
);

export const SwapDirectionButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <div className="flex justify-center my-2">
    <button
      type="button"
      onClick={onClick}
      className="btn btn-circle btn-ghost"
    >
      <SwapVerticalIcon />
    </button>
  </div>
);

export const useTokenSwap = (
  initialFromToken = 'SPERG',
  initialToToken = 'SOL'
) => {
  const [fromToken, setFromToken] = React.useState(initialFromToken);
  const [toToken, setToToken] = React.useState(initialToToken);
  const [fromAmount, setFromAmount] = React.useState('');
  const [toAmount, setToAmount] = React.useState('');

  const handleSwapTokens = () => {
    if (fromToken === toToken) return;

    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const openModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    setFromToken,
    setToToken,
    setFromAmount,
    setToAmount,
    handleSwapTokens,
    openModal,
  };
};

export const SwapForm: React.FC = () => {
  const {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    setFromToken,
    setToToken,
    setFromAmount,
    setToAmount,
    handleSwapTokens,
    openModal,
  } = useTokenSwap();

  const handleSwap = () => {
    console.log('Swapping:', {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
    });
  };

  return (
    <>
      <div className="card flex-1 py-16">
        <div className="card-body flex-1 justify-evenly">
          <TokenInput
            token={fromToken}
            amount={fromAmount}
            onAmountChange={setFromAmount}
            onTokenSelect={() => openModal('from_token_modal')}
            label="selling"
          />

          <SwapDirectionButton onClick={handleSwapTokens} />

          <TokenInput
            token={toToken}
            amount={toAmount}
            onAmountChange={setToAmount}
            onTokenSelect={() => openModal('to_token_modal')}
            label="buying"
          />

          <SwapButton
            onClick={handleSwap}
            disabled={
              !fromToken ||
              !toToken ||
              !fromAmount ||
              !toAmount ||
              fromToken === toToken
            }
          />
        </div>
      </div>

      {/* Token Selection Modals */}
      <TokenList
        tokens={defaultTokens}
        onSelect={setFromToken}
        currentToken={fromToken}
        otherToken={toToken}
        modalId="from_token_modal"
      />

      <TokenList
        tokens={defaultTokens}
        onSelect={setToToken}
        currentToken={toToken}
        otherToken={fromToken}
        modalId="to_token_modal"
      />
    </>
  );
};
