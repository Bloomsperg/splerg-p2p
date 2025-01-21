import { FC, useMemo, useState } from 'react';
import { ConnectionProvider, useConnection, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { PROGRAM_ID } from '../../../sdk/src/common';
import { InitializeOrderInstruction } from '../../../sdk/src/instruction';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

export const P2PSwapComponent: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleInitializeOrder = async (
    makerTokenMint: PublicKey,
    takerTokenMint: PublicKey,
    makerAmount: bigint,
    takerAmount: bigint
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }
  
    setIsLoading(true);
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      
      const instruction = await InitializeOrderInstruction.create(
        PROGRAM_ID,
        publicKey,
        makerTokenMint,
        takerTokenMint,
        makerAmount,
        takerAmount
      );
  
      const transaction = new VersionedTransaction(
        new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: [instruction as TransactionInstruction]
        }).compileToV0Message()
      );
  
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);
  
      console.log('Order initialized:', signature);
      return signature;
    } catch (error) {
      console.error('Error initializing order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      {!publicKey ? (
        <div>Please connect your wallet to continue</div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Initialize P2P Swap Order</h2>
          {/* Add your form/UI components here */}
          {isLoading && <div>Processing transaction...</div>}
        </div>
      )}
    </div>
  );
};

// App wrapper with required providers
export const App: FC = () => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

  // Only include wallets you want to support
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Add other wallet adapters as needed
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-100">
            <nav className="p-4 bg-white shadow">
              <WalletMultiButton />
            </nav>
            <main className="container mx-auto py-8">
              <P2PSwapComponent />
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};