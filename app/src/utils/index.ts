import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Order } from '../model';
import { TokenInfo, TokenDirectory } from '../model/token';

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

export const KNOWN_TOKENS: TokenDirectory = {
  So11111111111111111111111111111111111111112: {
    symbol: 'SOL',
    icon: '/solana.png',
  },
  '4vKEwZ2ZHmHFuQEE69emXV2Zq1EKeJYVCESsMqydpump': {
    symbol: 'SPERG',
    icon: '/sperg.png',
  },
};

export const defaultTokens: TokenInfo[] = [
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'SPERG', name: 'Bloomsperg' },
  { symbol: 'RAY', name: 'Raydium' },
  { symbol: 'BONK', name: 'Bonk' },
];

export const handleOpenModal = (index: number): void => {
  const modal = document.getElementById(`swap_modal_${index}`);
  if (modal instanceof HTMLDialogElement) {
    modal.showModal();
  }
};

// Mock wallet for testing
export const MY_WALLET = new PublicKey(
  'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'
);

// Mock token mints
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const BONK_MINT = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');

export const mockOrders = [
  {
    id: new PublicKey('11111111111111111111111111111111'),
    maker: MY_WALLET,
    taker: new PublicKey('5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG'),
    makerTokenMint: USDC_MINT,
    takerTokenMint: SOL_MINT,
    makerAmount: new BN(100000000),
    takerAmount: new BN(1000000000),
    bump: 254,
  },
  {
    id: new PublicKey('11111111111111111111111111111111'),
    maker: new PublicKey('7WNkj3JvBZJvk8zKzLgdpFEzGP6PhJ6VqxvYDnGwR6nC'),
    taker: MY_WALLET,
    makerTokenMint: SOL_MINT,
    takerTokenMint: BONK_MINT,
    makerAmount: new BN(2000000000),
    takerAmount: new BN(1000000000000),
    bump: 253,
  },
  {
    id: new PublicKey('11111111111111111111111111111111'),
    maker: MY_WALLET,
    taker: new PublicKey('9ZNTfG4NyQgxy2SWjSPQpRE84dkiBwriRSqh9DHHyv6W'),
    makerTokenMint: BONK_MINT,
    takerTokenMint: USDC_MINT,
    makerAmount: new BN(500000000000),
    takerAmount: new BN(50000000),
    bump: 252,
  },
  {
    id: new PublicKey('11111111111111111111111111111111'),
    maker: new PublicKey('3XMrhSfc5VaJ1GkqS1biMkaB2pjgHhz8GxGi3qBBnr1N'),
    taker: MY_WALLET,
    makerTokenMint: USDC_MINT,
    takerTokenMint: SOL_MINT,
    makerAmount: new BN(200000000),
    takerAmount: new BN(2000000000),
    bump: 251,
  },
];
