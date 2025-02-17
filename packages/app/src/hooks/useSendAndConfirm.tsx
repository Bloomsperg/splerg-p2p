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

    setError(null);
    let signature = '';

    try {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);
      const signedTx = await signTransaction(transaction);

      signature = await connection.sendRawTransaction(signedTx.serialize());

      setLoading(true);

      try {
        const confirmationPromise = connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          'confirmed'
        );

        await Promise.race([
          confirmationPromise,
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ]);
      } catch (confirmError) {
        console.warn('Confirmation error:', confirmError);
      }

      return signature;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      // Force a small delay after setting loading false
      await new Promise((resolve) => setTimeout(resolve, 100));
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
