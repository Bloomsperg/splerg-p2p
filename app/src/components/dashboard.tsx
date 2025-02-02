import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TradesTable from './trades';
import { SwapForm } from './swap-form';
import { Inbox } from './inbox';
import { MailIcon } from './ui/icon';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('trades');

  return (
    <div className="flex flex-1 flex-col h-full w-full max-w-4xl">
      <div className="flex flex-col flex-1">
        {activeTab === 'trades' && (
          <div className="w-full">
            <TradesTable orders={[]} /> {/* Pass your orders array here */}
          </div>
        )}
        {activeTab === 'order' && <SwapForm />}
        {activeTab === 'requests' && <Inbox />}
      </div>

      {/* Bottom Tabs */}
      <div
        role="tablist"
        className="tabs tabs-lift tabs-lg justify-end border-t border-t-sunset/50"
      >
        <a
          role="tab"
          className={`tab ${activeTab === 'trades' ? 'tab-active text-sunset' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          trade
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === 'order' ? 'tab-active text-sunset' : ''}`}
          onClick={() => setActiveTab('order')}
        >
          order
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === 'requests' ? 'tab-active text-sunset' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <MailIcon />
        </a>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <main className="container mx-auto flex flex-1 flex-col justify-center items-between">
      {connected && publicKey ? (
        <DashboardContent />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Connect your wallet to continue</h2>
          <WalletMultiButton />
        </div>
      )}
    </main>
  );
};
