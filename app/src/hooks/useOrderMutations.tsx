import { PublicKey } from '@solana/web3.js';
import {
  createInitializeOrderInstruction,
  createChangeOrderAmountsInstruction,
  createChangeTakerInstruction,
  createCloseOrderInstruction,
  createCompleteSwapInstruction,
} from '../../../sdk/generated/instructions';
import { useSendAndConfirm } from './useSendAndConfirm';

export const useOrderMutations = () => {
  const { sendAndConfirmTransaction, loading, error, publicKey } =
    useSendAndConfirm();

  const initializeOrder = async (params: {
    order: PublicKey;
    makerAta: PublicKey;
    pdaMakerAta: PublicKey;
    makerMint: PublicKey;
    takerMint: PublicKey;
    makerAmount: bigint;
    takerAmount: bigint;
  }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instruction = createInitializeOrderInstruction(
      {
        maker: publicKey,
        order: params.order,
        makerAta: params.makerAta,
        pdaMakerAta: params.pdaMakerAta,
        makerMint: params.makerMint,
        takerMint: params.takerMint,
      },
      {
        makerAmount: params.makerAmount,
        takerAmount: params.takerAmount,
      }
    );

    return sendAndConfirmTransaction(instruction);
  };

  const changeOrderAmounts = async (params: {
    order: PublicKey;
    escrowTokenAccount: PublicKey;
    makerTokenAccount: PublicKey;
    mint: PublicKey;
    newMakerAmount: bigint;
    newTakerAmount: bigint;
  }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instruction = createChangeOrderAmountsInstruction(
      {
        maker: publicKey,
        order: params.order,
        escrowTokenAccount: params.escrowTokenAccount,
        makerTokenAccount: params.makerTokenAccount,
        mint: params.mint,
      },
      {
        newMakerAmount: params.newMakerAmount,
        newTakerAmount: params.newTakerAmount,
      }
    );

    return sendAndConfirmTransaction(instruction);
  };

  const changeTaker = async (params: {
    order: PublicKey;
    newTaker: PublicKey;
  }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instruction = createChangeTakerInstruction(
      {
        maker: publicKey,
        order: params.order,
        newTaker: params.newTaker,
      },
      {
        newTaker: Array.from(params.newTaker.toBytes()),
      }
    );

    return sendAndConfirmTransaction(instruction);
  };

  const closeOrder = async (params: { order: PublicKey }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instruction = createCloseOrderInstruction({
      authority: publicKey,
      order: params.order,
    });

    return sendAndConfirmTransaction(instruction);
  };

  const completeSwap = async (params: {
    order: PublicKey;
    makerReceivingAccount: PublicKey;
    takerSendingAccount: PublicKey;
    takerReceivingAccount: PublicKey;
    escrowTokenAccount: PublicKey;
    makerMint: PublicKey;
    takerMint: PublicKey;
    tokenAuthority: PublicKey;
  }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instruction = createCompleteSwapInstruction({
      taker: publicKey,
      order: params.order,
      makerReceivingAccount: params.makerReceivingAccount,
      takerSendingAccount: params.takerSendingAccount,
      takerReceivingAccount: params.takerReceivingAccount,
      escrowTokenAccount: params.escrowTokenAccount,
      makerMint: params.makerMint,
      takerMint: params.takerMint,
      tokenAuthority: params.tokenAuthority,
    });

    return sendAndConfirmTransaction(instruction);
  };

  return {
    initializeOrder,
    changeOrderAmounts,
    closeOrder,
    changeTaker,
    completeSwap,
    loading,
    error,
  };
};
