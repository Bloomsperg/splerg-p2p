import { useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Navbar } from './components/navbar';
import { Dashboard } from './components/dashboard';
import { ProgramProvider } from './context/program-context';
import { ModalProvider } from './context/modal-context';

function App() {
  const endpoint = import.meta.env.VITE_SOLANA_RPC_ENDPOINT;
  const wallets = useMemo(() => [], []);

  if (!endpoint) {
    throw new Error('Missing VITE_SOLANA_RPC_ENDPOINT environment variable');
  }

  return (
    <BrowserRouter>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <ProgramProvider>
              <ModalProvider>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <Dashboard />
                </div>
              </ModalProvider>
            </ProgramProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </BrowserRouter>
  );
}

export default App;
