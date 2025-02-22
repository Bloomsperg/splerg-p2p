import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button, CancelButton } from './ui/buttons';
import { useOrderMutations } from '../hooks/useOrderMutations';
import { PublicKey } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import BN from 'bn.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { getOrderPDA } from '../utils/orders';
import { useProgramContext } from '../context/program-context';
import { TOKENS } from '../utils/tokens';
import { Order } from '../model';
import { useToast } from '../context/toast';
import { getTreasuryPDA } from '../utils';

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
  const { getBalance, removeOrder, addOrder, updateOrder, fetchTokenBalances } =
    useProgramContext();

  const { showToast } = useToast();

  useEffect(() => {
    showToast(loading);
  }, [loading, showToast]);

  if (!publicKey) {
    return <WalletMultiButton />;
  }

  const handleSwap = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const treasuryPDA = getTreasuryPDA();

    // Maker's ATA for taker's token (where maker will receive taker's tokens)
    const makerTakerAta = getAssociatedTokenAddressSync(
      order.takerToken,
      order.maker
    );

    // Taker's ATA for taker's token (where taker's tokens come from)
    const takerAta = getAssociatedTokenAddressSync(order.takerToken, publicKey);

    // Taker's ATA for maker's token (where taker will receive maker's tokens)
    const takerMakerAta = getAssociatedTokenAddressSync(
      order.makerToken,
      publicKey
    );

    // Order's ATA for maker's token (escrow account)
    const orderMakerAta = getAssociatedTokenAddressSync(
      order.makerToken,
      order.address,
      true
    );

    // Treasury's ATAs
    const treasuryMakerAta = getAssociatedTokenAddressSync(
      order.makerToken,
      treasuryPDA.pda,
      true
    );

    const treasuryTakerAta = getAssociatedTokenAddressSync(
      order.takerToken,
      treasuryPDA.pda,
      true
    );

    await completeSwap({
      order: order.address,
      makerTakerAta,
      takerAta,
      takerMakerAta,
      orderMakerAta,
      treasury: treasuryPDA.pda,
      treasuryMakerAta,
      treasuryTakerAta,
      makerMint: order.makerToken,
      takerMint: order.takerToken,
    });

    removeOrder(order.address);
    navigate('/trades');
  };

  const handleCancel = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await closeOrder({ order: order.address });

    removeOrder(order.address);
    navigate('/requests');
  };

  const handleCreate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const orderPDA = getOrderPDA(
      order.id,
      publicKey,
      order.makerToken,
      order.takerToken
    );

    const makerAta = getAssociatedTokenAddressSync(order.makerToken, publicKey);
    const pdaMakerAta = getAssociatedTokenAddressSync(
      order.makerToken,
      orderPDA.pda,
      true
    );

    const tokenBalance = getBalance(order.makerToken);
    if (tokenBalance === undefined) {
      throw new Error('Failed to fetch token balance');
    }

    const tokenDecimals =
      TOKENS.find((t) => t.mint.equals(order.makerToken))?.decimals || 0;
    const requiredAmount =
      Number(order.makerAmount) / Math.pow(10, tokenDecimals);

    if (tokenBalance < requiredAmount) {
      throw new Error(
        `Insufficient balance. Required: ${requiredAmount}, Available: ${tokenBalance}`
      );
    }

    console.log(orderPDA.pda.toBase58())
    console.log(order.address.toBase58())


    await initializeOrder({
      order: order.address,
      id: order.id,
      makerAta,
      pdaMakerAta,
      makerMint: order.makerToken,
      takerMint: order.takerToken,
      makerAmount: new BN(order.makerAmount.toString()),
      takerAmount: new BN(order.takerAmount.toString()),
    });

    addOrder(order);
    fetchTokenBalances();
  };

  const handleModify = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      // Handle taker change if needed
      if (
        newTakerPubkey &&
        newTakerPubkey !== order.taker.toString() &&
        newTakerPubkey !== PublicKey.default.toBase58()
      ) {
        await changeTaker({
          order: order.address,
          newTaker: new PublicKey(newTakerPubkey),
        });

        updateOrder(order.address, { taker: new PublicKey(newTakerPubkey) });
      }

      // Handle amount changes if needed
      if (newMakerAmount !== undefined || newTakerAmount !== undefined) {
        const makerToken = TOKENS.find((t) => t.mint.equals(order.makerToken));
        const takerToken = TOKENS.find((t) => t.mint.equals(order.takerToken));

        if (!makerToken || !takerToken) {
          throw new Error('Token information not found');
        }

        const makerMultiplier = Math.pow(10, makerToken.decimals!);
        const takerMultiplier = Math.pow(10, takerToken.decimals!);

        // Derive necessary token accounts
        const escrowTokenAccount = getAssociatedTokenAddressSync(
          order.makerToken,
          order.address,
          true
        );

        const makerTokenAccount = getAssociatedTokenAddressSync(
          order.makerToken,
          publicKey
        );

        // Convert decimal inputs to smallest unit integers
        const newMA =
          newMakerAmount !== undefined
            ? new BN(Math.round(newMakerAmount * makerMultiplier))
            : new BN(order.makerAmount.toString());

        const newTA =
          newTakerAmount !== undefined
            ? new BN(Math.round(newTakerAmount * takerMultiplier))
            : new BN(order.takerAmount.toString());

        // Only proceed if amounts have actually changed
        const currentMA = new BN(order.makerAmount.toString());
        const currentTA = new BN(order.takerAmount.toString());

        if (!newMA.eq(currentMA) || !newTA.eq(currentTA)) {
          await changeOrderAmounts({
            order: order.address,
            escrowTokenAccount,
            makerTokenAccount,
            mint: order.makerToken,
            newMakerAmount: newMA,
            newTakerAmount: newTA,
          });

          updateOrder(order.address, {
            makerAmount: newMA,
            takerAmount: newTA,
          });

          fetchTokenBalances();
        }
      }

      navigate('/requests');
    } catch (error) {
      console.error('Error modifying order:', error);
      throw error;
    }
  };

  switch (context) {
    case 'create':
      return (
        <div className="card-actions justify-end mt-4 w-full">
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
            {loading ? 'Processing...' : 'Swap'}
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
