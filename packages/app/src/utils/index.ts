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
  // Convert the amount to a number first
  const rawAmount = parseFloat(amount);

  // Calculate the actual amount by dividing by the scale factor
  const scaleFactor = Math.pow(10, decimals);
  const actualAmount = rawAmount / scaleFactor;

  if (actualAmount === 0) return '0';
  if (Math.abs(actualAmount) < 1) return actualAmount.toFixed(4);

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.min(
    Math.floor(Math.log10(Math.abs(actualAmount)) / 3),
    suffixes.length - 1
  );

  if (tier === 0) {
    if (actualAmount % 1 === 0) {
      return actualAmount.toString();
    }
    return actualAmount.toFixed(2);
  }

  const scale = Math.pow(10, tier * 3);
  const scaled = actualAmount / scale;

  // If the scaled number is exactly an integer, don't show decimals
  if (scaled % 1 === 0) {
    return `${scaled}${suffixes[tier]}`;
  }

  // Otherwise round to one decimal place
  const rounded = Math.floor(scaled * 10) / 10;
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

export const getTreasuryPDA = (): { pda: PublicKey; bump: number } => {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('treasury')],
    PROGRAM_ID
  );

  return { pda, bump };
};
