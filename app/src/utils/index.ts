import { Order } from '../model';
import { TokenInfo, TokenDirectory } from '../model/token';

export const KNOWN_TOKENS: TokenDirectory = {
  So11111111111111111111111111111111111111112: {
    symbol: 'SOL',
    icon: '/solana.png',
  },
  '4vKEwZ2ZHmHFuQEE69emXV2Zq1EKeJYVCESsMqydpump': {
    symbol: 'SPERG',
    icon: '/sperg.png',
  },
  // Add more tokens as needed
};

export const defaultTokens: TokenInfo[] = [
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'SPERG', name: 'Bloomsperg' },
  { symbol: 'RAY', name: 'Raydium' },
  { symbol: 'BONK', name: 'Bonk' },
];

export const placeholderOrders: Order[] = [
  {
    maker: 'GZXxxxYYYzzz123456789abcdef...',
    taker: 'ABC123xxxYYYzzz456789abcdef...',
    maker_token_mint: 'So11111111111111111111111111111111111111112',
    taker_token_mint: 'USDC123xxxYYYzzz456789abcdef...',
    maker_amount: 1000000000,
    taker_amount: 20000000,
  },
  {
    maker: 'DEFxxxYYYzzz123456789abcdef...',
    taker: 'GHI123xxxYYYzzz456789abcdef...',
    maker_token_mint: 'RAY123xxxYYYzzz456789abcdef...',
    taker_token_mint: '4vKEwZ2ZHmHFuQEE69emXV2Zq1EKeJYVCESsMqydpump',
    maker_amount: 5000000000,
    taker_amount: 500000000,
  },
];

export const formatAmount = (amount: number): string =>
  (amount / 1000000000).toFixed(2);

export const handleOpenModal = (index: number): void => {
  const modal = document.getElementById(`swap_modal_${index}`);
  if (modal instanceof HTMLDialogElement) {
    modal.showModal();
  }
};
