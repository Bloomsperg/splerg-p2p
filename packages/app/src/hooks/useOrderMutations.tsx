import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  createInitializeOrderInstruction,
  createChangeOrderAmountsInstruction,
  createChangeTakerInstruction,
  createCloseOrderInstruction,
  createCompleteSwapInstruction,
} from '../instructions';
import { useSendAndConfirm } from './useSendAndConfirm';
import BN from 'bn.js';
import { getCreateATAInstructionsIfNeeded } from '../utils/tokens';

export const useOrderMutations = () => {
  const { sendAndConfirmTransaction, loading, error, publicKey, connection } =
    useSendAndConfirm();

  const initializeOrder = async (params: {
    order: PublicKey;
    makerAta: PublicKey;
    pdaMakerAta: PublicKey;
    makerMint: PublicKey;
    takerMint: PublicKey;
    makerAmount: BN;
    takerAmount: BN;
  }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instructions: TransactionInstruction[] = [];

    // Create ATAs if needed
    const [makerAtaIx, pdaMakerAtaIx] = await Promise.all([
      getCreateATAInstructionsIfNeeded(
        connection,
        publicKey,
        publicKey,
        params.makerMint
      ),
      getCreateATAInstructionsIfNeeded(
        connection,
        publicKey,
        params.order,
        params.makerMint,
        true
      ),
    ]);

    // Add ATA creation instructions if needed
    if (makerAtaIx) instructions.push(makerAtaIx);
    if (pdaMakerAtaIx) instructions.push(pdaMakerAtaIx);

    // Create and add the initialize order instruction
    const initOrderIx = createInitializeOrderInstruction(
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
    instructions.push(initOrderIx);

    return sendAndConfirmTransaction(instructions);
  };

  const changeOrderAmounts = async (params: {
    order: PublicKey;
    escrowTokenAccount: PublicKey;
    makerTokenAccount: PublicKey;
    mint: PublicKey;
    newMakerAmount: BN;
    newTakerAmount: BN;
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

    return sendAndConfirmTransaction([instruction]);
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

    return sendAndConfirmTransaction([instruction]);
  };

  const closeOrder = async (params: { order: PublicKey }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instruction = createCloseOrderInstruction({
      authority: publicKey,
      order: params.order,
    });

    return sendAndConfirmTransaction([instruction]);
  };

  const completeSwap = async (params: {
    order: PublicKey;
    makerTakerAta: PublicKey; // maker's ATA for taker's token
    takerAta: PublicKey; // taker's ATA for taker's token
    takerMakerAta: PublicKey; // taker's ATA for maker's token
    orderMakerAta: PublicKey; // order's ATA for maker's token
    treasury: PublicKey; // treasury account
    treasuryMakerAta: PublicKey; // treasury's ATA for maker's token
    treasuryTakerAta: PublicKey; // treasury's ATA for taker's token
    makerMint: PublicKey;
    takerMint: PublicKey;
  }) => {
    if (!publicKey) throw new Error('Wallet not connected');

    const instructions: TransactionInstruction[] = [];

    // Check and create ATAs if needed
    const [
      takerMakerAtaIx, // Taker's ATA for maker's token
      takerTakerAtaIx, // Taker's ATA for taker's token
      treasuryMakerAtaIx, // Treasury's ATA for maker's token
      treasuryTakerAtaIx, // Treasury's ATA for taker's token
    ] = await Promise.all([
      getCreateATAInstructionsIfNeeded(
        connection,
        publicKey,
        publicKey,
        params.makerMint
      ),
      getCreateATAInstructionsIfNeeded(
        connection,
        publicKey,
        publicKey,
        params.takerMint
      ),
      getCreateATAInstructionsIfNeeded(
        connection,
        publicKey,
        params.treasury,
        params.makerMint,
        true
      ),
      getCreateATAInstructionsIfNeeded(
        connection,
        publicKey,
        params.treasury,
        params.takerMint,
        true
      ),
    ]);

    // Add ATA creation instructions if needed
    if (takerMakerAtaIx) instructions.push(takerMakerAtaIx);
    if (takerTakerAtaIx) instructions.push(takerTakerAtaIx);
    if (treasuryMakerAtaIx) instructions.push(treasuryMakerAtaIx);
    if (treasuryTakerAtaIx) instructions.push(treasuryTakerAtaIx);

    // Create and add the complete swap instruction
    const completeSwapIx = createCompleteSwapInstruction({
      taker: publicKey,
      order: params.order,
      makerTakerAta: params.makerTakerAta,
      takerAta: params.takerAta,
      takerMakerAta: params.takerMakerAta,
      orderMakerAta: params.orderMakerAta,
      treasury: params.treasury,
      treasuryMakerAta: params.treasuryMakerAta,
      treasuryTakerAta: params.treasuryTakerAta,
      makerMint: params.makerMint,
      takerMint: params.takerMint,
    });

    instructions.push(completeSwapIx);

    return sendAndConfirmTransaction(instructions);
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
