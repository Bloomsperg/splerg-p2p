import { Keypair } from '@solana/web3.js';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync } from 'fs';

export const DEFAULT_KEYPAIR_PATH = join(homedir(), '.config/solana/id.json');

export function loadKeypairFromFile(filepath: string = DEFAULT_KEYPAIR_PATH): Keypair {
  try {
    const raw = readFileSync(filepath, 'utf-8');
    const keypairData = Uint8Array.from(JSON.parse(raw));
    return Keypair.fromSecretKey(keypairData);
  } catch (error) {
    throw new Error(
      `Failed to load keypair from ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
