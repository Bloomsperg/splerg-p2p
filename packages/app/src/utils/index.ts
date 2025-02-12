import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(
  'GKTd9AGFpPGNKK28ncHeGGuT7rBJLzPxNjCUPKn8Yik8'
);

export const formatPubkey = (pubkey: string): string => {
  if (!pubkey || pubkey.length < 8) return pubkey;
  return `${pubkey.slice(0, 4)}...${pubkey.slice(-3)}`;
};

export function formatTokenAmount(
  amount: string,
  decimals: number = 9
): string {
  const amountBigInt = BigInt(amount.toString());
  const scaleFactor = BigInt(10) ** BigInt(decimals);
  const actualAmount = Number(amountBigInt) / Number(scaleFactor);

  if (actualAmount === 0) return '0';
  if (Math.abs(actualAmount) < 1) return Math.floor(actualAmount).toString();

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.min(
    Math.floor(Math.log10(Math.abs(actualAmount)) / 3),
    suffixes.length - 1
  );

  if (tier === 0) {
    return Math.floor(actualAmount).toString();
  }

  const scale = Math.pow(10, tier * 3);
  const scaled = actualAmount / scale;
  const rounded = Math.round(scaled * 10) / 10;

  return `${rounded}${suffixes[tier]}`;
}

export const getOrderPDA = (
  maker: PublicKey,
  makerTokenMint: PublicKey,
  takerTokenMint: PublicKey
): { pda: PublicKey; bump: number } => {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      maker.toBytes(),
      makerTokenMint.toBytes(),
      takerTokenMint.toBytes(),
    ],
    PROGRAM_ID
  );

  return { pda, bump };
};

// Mock wallet for testing
export const MY_WALLET = new PublicKey(
  'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'
);

export const USDC_MINT = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
);
export const SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);
export const BONK_MINT = new PublicKey(
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
);
