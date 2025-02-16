import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { useState } from 'react';

export const useSendAndConfirm = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendAndConfirmTransaction = async (
    instructions: TransactionInstruction[]
  ): Promise<string> => {
    if (!publicKey || !signTransaction) throw new Error('Wallet not connected');

    setLoading(true);
    setError(null);

    try {
      const { blockhash } = await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      await connection.confirmTransaction(signature);

      return signature;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendAndConfirmTransaction,
    loading,
    error,
    publicKey,
    connection,
  };
};
