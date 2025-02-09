import React, { useState } from 'react';
import { TokenList } from '../components/token/token-list';
import { defaultTokens } from '../utils';
import { TokenInput } from '../components/token/token-input';
import { useModal } from '../context/modal-context';
import { SwapDirectionButton, SwapButton } from '../components/ui/buttons';

export const Swap: React.FC = () => {
  const [fromToken, setFromToken] = useState('SPERG');
  const [toToken, setToToken] = useState('SOL');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const { openModal, closeModal, isModalOpen } = useModal();

  const handleSwapTokens = () => {
    if (fromToken === toToken) return;
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = () => {
    console.log('Swapping:', {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
    });
  };

  const isSwapDisabled =
    !fromToken || !toToken || !fromAmount || !toAmount || fromToken === toToken;

  React.useEffect(() => {
    const fromDialog = document.getElementById(
      'from_token_modal'
    ) as HTMLDialogElement;
    const toDialog = document.getElementById(
      'to_token_modal'
    ) as HTMLDialogElement;

    if (isModalOpen('fromTokenSelect')) {
      fromDialog?.showModal();
    } else {
      fromDialog?.close();
    }

    if (isModalOpen('toTokenSelect')) {
      toDialog?.showModal();
    } else {
      toDialog?.close();
    }
  }, [isModalOpen]);

  return (
    <>
      <div className="card flex-1 py-16">
        <div className="card-body flex-1 justify-evenly">
          <TokenInput
            token={fromToken}
            amount={fromAmount}
            onAmountChange={setFromAmount}
            onTokenSelect={() => openModal('fromTokenSelect')}
            label="selling"
          />

          <SwapDirectionButton onClick={handleSwapTokens} />

          <TokenInput
            token={toToken}
            amount={toAmount}
            onAmountChange={setToAmount}
            onTokenSelect={() => openModal('toTokenSelect')}
            label="buying"
          />

          <SwapButton onClick={handleSwap} disabled={isSwapDisabled} />
        </div>
      </div>

      <dialog id="from_token_modal" className="modal">
        <TokenList
          tokens={defaultTokens}
          onSelect={(token) => {
            setFromToken(token);
            closeModal('fromTokenSelect');
          }}
          currentToken={fromToken}
          otherToken={toToken}
          modalId="from_token_modal"
          modalType="fromTokenSelect"
        />
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => closeModal('fromTokenSelect')}>close</button>
        </form>
      </dialog>

      <dialog id="to_token_modal" className="modal">
        <TokenList
          tokens={defaultTokens}
          onSelect={(token) => {
            setToToken(token);
            closeModal('toTokenSelect');
          }}
          currentToken={toToken}
          otherToken={fromToken}
          modalId="to_token_modal"
          modalType="toTokenSelect"
        />
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => closeModal('toTokenSelect')}>close</button>
        </form>
      </dialog>
    </>
  );
};
