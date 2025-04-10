import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TokenList } from '../components/token/token-list';
import {
  TOKENS,
  getTokenDecimalsFromMint,
  getTokenMintFromSymbol,
  scaleAmount,
} from '../utils/tokens';
import { TokenInput } from '../components/token/token-input';
import { useModal } from '../context/modal-context';
import { SwapDirectionButton } from '../components/ui/buttons';
import { ActionButtons } from '../components/action-buttons';
import { getOrderPDA } from '../utils/orders';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Order } from '../model';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Swap: React.FC = () => {
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('SPERG');
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
    const id = Keypair.generate().publicKey;
    const { pda, bump } = getOrderPDA(id, publicKey, makerMint, takerMint);
    const makerDecimals = getTokenDecimalsFromMint(makerMint);
    const takerDecimals = getTokenDecimalsFromMint(takerMint);

    setOrder({
      address: pda,
      id,
      maker: publicKey,
      taker: PublicKey.default,
      makerToken: makerMint,
      takerToken: takerMint,
      makerAmount: scaleAmount(fromAmount, makerDecimals ? makerDecimals : 9),
      takerAmount: scaleAmount(toAmount, takerDecimals ? takerDecimals : 9),
      bump,
    });
  }, [publicKey, fromToken, toToken, fromAmount, toAmount]);

  return (
    <>
      <div className="card flex-1 md:py-16 max-w-sm mx-auto flex flex-col justify-center">
        <div className="card-body flex-1 justify-evenly max-h-120  bg-base-300 rounded-xl">
          <TokenInput
            token={getTokenMintFromSymbol(fromToken)}
            amount={fromAmount}
            onAmountChange={setFromAmount}
            onTokenSelect={() => openModal('fromTokenSelect')}
            label="selling"
          />

          <SwapDirectionButton onClick={handleSwapTokens} />

          <TokenInput
            token={getTokenMintFromSymbol(toToken)}
            amount={toAmount}
            onAmountChange={setToAmount}
            onTokenSelect={() => openModal('toTokenSelect')}
            label="buying"
          />

          <div className="w-full mt-4 mx-auto flex justify-center">
            {!order && <WalletMultiButton className="" />}
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

      <dialog id="fromTokenSelect" className="modal">
        <TokenList
          tokens={TOKENS}
          onSelect={(token) => {
            setFromToken(token);
            closeModal('fromTokenSelect');
          }}
          currentToken={fromToken}
          otherToken={toToken}
          modalId="fromTokenSelect"
          modalType="fromTokenSelect"
        />
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => closeModal('fromTokenSelect')}>close</button>
        </form>
      </dialog>

      <dialog id="toTokenSelect" className="modal">
        <TokenList
          tokens={TOKENS}
          onSelect={(token) => {
            setToToken(token);
            closeModal('toTokenSelect');
          }}
          currentToken={toToken}
          otherToken={fromToken}
          modalId="toTokenSelect"
          modalType="toTokenSelect"
        />
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => closeModal('toTokenSelect')}>close</button>
        </form>
      </dialog>
    </>
  );
};
