import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TokenList } from '../components/token/token-list';
import { TOKENS, getTokenMintFromSymbol } from '../utils/tokens';
import { TokenInput } from '../components/token/token-input';
import { useModal } from '../context/modal-context';
import { SwapDirectionButton } from '../components/ui/buttons';
import { ActionButtons } from '../components/action-buttons';
import { BN } from 'bn.js';
import { getOrderPDA } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { Order } from '../model';

export const Swap: React.FC = () => {
  const [fromToken, setFromToken] = useState('SPERG');
  const [toToken, setToToken] = useState('SOL');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const { publicKey } = useWallet();
  const { openModal, closeModal } = useModal();

  const handleSwapTokens = () => {
    if (fromToken === toToken) return;
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const isSwapDisabled =
    !fromToken || !toToken || !fromAmount || !toAmount || fromToken === toToken;

  useEffect(() => {
    if (!publicKey) {
      setOrder(null);
      return;
    }

    const makerMint = getTokenMintFromSymbol(fromToken);
    const takerMint = getTokenMintFromSymbol(toToken);
    const { pda, bump } = getOrderPDA(publicKey, makerMint, takerMint);

    setOrder({
      id: pda,
      maker: publicKey,
      taker: PublicKey.default,
      makerTokenMint: makerMint,
      takerTokenMint: takerMint,
      makerAmount: new BN(fromAmount || '0'),
      takerAmount: new BN(toAmount || '0'),
      bump,
    });
  }, [publicKey, fromToken, toToken, fromAmount, toAmount]);

  return (
    <>
      <div className="card flex-1 py-16 max-w-sm mx-auto">
        <div className="card-body flex-1 justify-evenly max-h-120  md:bg-base-300 rounded">
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

          <div className="w-full mt-4">
            {order && (
              <ActionButtons
                context="create"
                order={order}
                disabled={isSwapDisabled}
              />
            )}
          </div>
        </div>
      </div>

      <dialog id="from_token_modal" className="modal">
        <TokenList
          tokens={TOKENS}
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
          tokens={TOKENS}
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
