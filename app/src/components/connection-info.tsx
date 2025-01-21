import  { useState, useEffect } from 'react';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const ConnectionInfo = () => {
  const { connection } = useConnection();
  const { wallet, connected } = useWallet();
  const [connectionDetails, setConnectionDetails] = useState({
    endpoint: '',
    commitment: 'confirmed'
  });

  useEffect(() => {
    if (connected && wallet) {
      const currentConnection = connection

      setConnectionDetails({
        endpoint: currentConnection.rpcEndpoint,
        commitment: connection.commitment!
      });
    } else {
      // Reset to default state when disconnected
      setConnectionDetails({
        endpoint: connection.rpcEndpoint,
        commitment: connection.commitment!
      });
    }
  }, [connected, wallet, connection]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Connection Details</h2>
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="font-medium mr-2">RPC Endpoint:</span>
          <span className="text-gray-600 text-sm break-all">
            {connectionDetails.endpoint}
          </span>
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-2">Commitment:</span>
          <span className="text-gray-600 text-sm">
            {connectionDetails.commitment}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionInfo;