import { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Navbar } from './components/navbar';
import { Dashboard } from './components/dashboard';

function App() {
  const endpoint = 'http://127.0.0.1:8899';
  const wallets = useMemo(() => [], [endpoint]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <Dashboard />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
