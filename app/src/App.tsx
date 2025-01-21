import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { 
  PublicKey, 
  VersionedTransaction,
  TransactionMessage, 
  TransactionInstruction
} from "@solana/web3.js";
import { FC, useState } from "react";
import "./App.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { PROGRAM_ID } from "../../sdk/src/common";
import { InitializeOrderInstruction } from "../../sdk/src/instruction";
import ConnectionInfo from "./components/connection-info";

const P2PSwapComponent: FC = () => {
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
        <div className="text-center mt-4">
          Please connect your wallet to continue
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Initialize P2P Swap Order</h2>
          {/* Add your form/UI components here */}
          <button 
            onClick={() => {
              // Example usage - replace with your actual UI inputs
              const testMintA = new PublicKey("11111111111111111111111111111111");
              const testMintB = new PublicKey("11111111111111111111111111111111");
              handleInitializeOrder(
                testMintA,
                testMintB,
                BigInt(1000000),
                BigInt(2000000)
              );
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Initialize Test Order"}
          </button>
          {isLoading && <div className="mt-2">Processing transaction...</div>}
        </div>
      )}
    </div>
  );
};

function App() {
  const endpoint = "http://127.0.0.1:8899";
  const wallets = useMemo(() => [], [endpoint]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-100">
            <nav className="p-4 bg-white shadow flex justify-between items-center">
              <h1 className="text-xl font-bold">P2P Swap Demo</h1>
              <WalletMultiButton />
            </nav>
            <main className="container mx-auto py-8">
              <P2PSwapComponent />
              <ConnectionInfo />
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;