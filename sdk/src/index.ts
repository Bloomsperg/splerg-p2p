import { Connection, Keypair } from '@solana/web3.js';
import { loadKeypairFromFile } from './utils';
import { P2PSwapSDK } from './client';

async function main() {
  try {
    const connection = new Connection('http://localhost:8899', 'confirmed');
    const keypair = loadKeypairFromFile();
    const balance = await connection.getBalance(keypair.publicKey);

    console.log('Wallet public key:', keypair.publicKey.toString());
    console.log('Balance:', balance / 1e9, 'SOL'); // Convert lamports to SOL

    const sdk = new P2PSwapSDK(connection);
    const mintA = Keypair.generate();
    const mintB = Keypair.generate();

    const sig = await sdk.initializeOrder(
      keypair,
      mintA.publicKey,
      mintB.publicKey,
      BigInt(100),
      BigInt(100),
    );

    console.log(sig);

    const order = await sdk.getOrder(keypair.publicKey, mintA.publicKey, mintB.publicKey);

    console.log(order);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
