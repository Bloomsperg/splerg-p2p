import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button, CancelButton } from './ui/buttons';
import { useOrderMutations } from '../hooks/useOrderMutations';
import { PublicKey } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import BN from 'bn.js';

interface Order {
  id: PublicKey;
  maker: PublicKey;
  taker: PublicKey;
  makerTokenMint: PublicKey;
  takerTokenMint: PublicKey;
  makerAmount: BN;
  takerAmount: BN;
  bump: number;
}

interface ActionButtonsProps {
  context: string;
  order: Order;
  newMakerAmount?: number;
  newTakerAmount?: number;
  newTakerPubkey?: string;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  context,
  order,
  newMakerAmount,
  newTakerAmount,
  newTakerPubkey,
  disabled,
}) => {
  const { publicKey } = useWallet();
  const {
    initializeOrder,
    completeSwap,
    closeOrder,
    changeOrderAmounts,
    changeTaker,
    loading,
  } = useOrderMutations();
  const navigate = useNavigate();

  if (!publicKey) {
    return <WalletMultiButton />;
  }

  const handleSwap = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await completeSwap({
      order: order.id,
      makerReceivingAccount: order.maker,
      takerSendingAccount: publicKey,
      takerReceivingAccount: publicKey,
      escrowTokenAccount: order.id,
      makerMint: order.makerTokenMint,
      takerMint: order.takerTokenMint,
      tokenAuthority: order.maker,
    });
  };

  const handleCancel = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await closeOrder({ order: order.id });
  };

  const handleCreate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await initializeOrder({
      order: order.id,
      makerAta: publicKey,
      pdaMakerAta: order.id,
      makerMint: order.makerTokenMint,
      takerMint: order.takerTokenMint,
      makerAmount: BigInt(order.makerAmount.toString()),
      takerAmount: BigInt(order.takerAmount.toString()),
    });
  };

  const handleModify = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Validate non-zero amounts if they're being changed
    if (
      (newMakerAmount !== undefined && newMakerAmount === 0) ||
      (newTakerAmount !== undefined && newTakerAmount === 0)
    ) {
      console.error('Maker and taker amounts cannot be zero');
      return;
    }

    try {
      // Handle taker change if needed
      if (
        newTakerPubkey &&
        newTakerPubkey !== order.taker.toString() &&
        newTakerPubkey !== PublicKey.default.toBase58()
      ) {
        await changeTaker({
          order: order.id,
          newTaker: new PublicKey(newTakerPubkey),
        });
      }

      // Handle amount changes if needed
      const amountsChanged =
        (newMakerAmount !== undefined &&
          newMakerAmount !== order.makerAmount.toNumber()) ||
        (newTakerAmount !== undefined &&
          newTakerAmount !== order.takerAmount.toNumber());

      if (amountsChanged) {
        let newMA = newMakerAmount
          ? BigInt(newMakerAmount)
          : BigInt(order.makerAmount.toString());
        let newTA = newTakerAmount
          ? BigInt(newTakerAmount)
          : BigInt(order.takerAmount.toString());

        await changeOrderAmounts({
          order: order.id,
          escrowTokenAccount: order.id,
          makerTokenAccount: publicKey,
          mint: order.makerTokenMint,
          newMakerAmount: newMA,
          newTakerAmount: newTA,
        });
      }

      navigate('/requests');
    } catch (error) {
      console.error('Error modifying order:', error);
    }
  };

  switch (context) {
    case 'create':
      return (
        <div className="card-actions justify-end mt-4">
          <Button
            className="bg-sunset w-full rounded"
            onClick={handleCreate}
            disabled={disabled}
            loading={loading}
          >
            Swap
          </Button>
        </div>
      );

    case 'trades':
      return (
        <div className="flex gap-2">
          <Button
            className="btn-ghost border-sunset/90 border-2 text-gray-300"
            onClick={handleSwap}
            disabled={loading || disabled}
          >
            {loading ? 'Processing...' : 'Accept Swap'}
          </Button>
        </div>
      );

    case 'inbox':
      return (
        <div className="flex gap-2">
          <Button
            className="btn-ghost border-sunset/90 border-2 text-gray-300"
            onClick={handleSwap}
            disabled={loading || disabled}
          >
            {loading ? 'Processing...' : 'Accept'}
          </Button>
        </div>
      );

    case 'modify':
      return (
        <div className="flex gap-2 w-full px-4">
          <CancelButton onClick={() => navigate('/requests')} />
          <Button
            className="btn-ghost border-2 border-sunset/90 flex-1"
            onClick={handleModify}
            disabled={loading || disabled}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      );

    case 'cancel':
      return (
        <div className="flex gap-2">
          <Button
            onClick={handleCancel}
            className="btn-ghost border-red-500 border-2 text-gray-300"
          >
            Cancel
          </Button>
        </div>
      );

    default:
      return null;
  }
};
