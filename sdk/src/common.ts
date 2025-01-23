import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('99kEphRNAS1E77nF2Wai9pXGBxgRX4BuNtMTKtY9Mg21');

import { Connection, clusterApiUrl, Commitment } from '@solana/web3.js';

export type EndpointTypes = 'localnet' | 'devnet' | 'testnet' | 'mainnet-beta';

export const ENDPOINTS = {
  localnet: 'http://127.0.0.1:8899',
  devnet: clusterApiUrl('devnet'),
  testnet: clusterApiUrl('testnet'),
  'mainnet-beta': clusterApiUrl('mainnet-beta'),
} as const;

export const DEFAULT_COMMITMENT: Commitment = 'confirmed';

export function createConnection(
  endpoint: EndpointTypes = 'localnet',
  commitment: Commitment = DEFAULT_COMMITMENT,
): Connection {
  return new Connection(ENDPOINTS[endpoint], {
    commitment,
    wsEndpoint: endpoint === 'localnet' ? 'ws://127.0.0.1:8900' : undefined,
    disableRetryOnRateLimit: true,
  });
}

// Example usage:
// const connection = createConnection('localnet');
// const devnetConnection = createConnection('devnet');
