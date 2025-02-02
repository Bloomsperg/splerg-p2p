import {
  PublicKey,
  Connection,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
} from '@solana/web3.js';
import { InitializeOrderInstruction } from '../../../sdk/src/instruction';

/**
 * Creates an Initialize Order instruction
 */
export const createInitializeOrderInstruction = async (
  programId: PublicKey,
  walletPubkey: PublicKey,
  makerTokenMint: PublicKey,
  takerTokenMint: PublicKey,
  makerAmount: bigint,
  takerAmount: bigint
): Promise<TransactionInstruction> => {
  return (await InitializeOrderInstruction.create(
    programId,
    walletPubkey,
    makerTokenMint,
    takerTokenMint,
    makerAmount,
    takerAmount
  )) as TransactionInstruction;
};

/**
 * Sends and confirms a transaction
 */
export const sendAndConfirmTransaction = async ({
  connection,
  instruction,
  payer,
  signTransaction,
}: {
  connection: Connection;
  instruction: TransactionInstruction;
  payer: PublicKey;
  signTransaction: (
    transaction: VersionedTransaction
  ) => Promise<VersionedTransaction>;
}): Promise<string> => {
  const { blockhash } = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [instruction],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(message);

  const signedTx = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature);

  return signature;
};
