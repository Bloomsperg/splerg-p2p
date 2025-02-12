import { PublicKey } from '@solana/web3.js';
import { TokenInfo } from '../model/token';

export const TOKENS: TokenInfo[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: new PublicKey('So11111111111111111111111111111111111111112'),
    icon: '/solana.png',
    decimals: 9,
  },
  {
    symbol: 'SPERG',
    name: 'Bloomsperg',
    mint: new PublicKey('4vKEwZ2ZHmHFuQEE69emXV2Zq1EKeJYVCESsMqydpump'),
    icon: '/sperg.png',
    decimals: 9,
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
    icon: '/bonk.png',
    decimals: 9,
  },
  {
    symbol: 'USDC',
    name: 'USD Circle',
    mint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
    icon: '/usdc.png',
    decimals: 6,
  },
];

// No need for TOKEN_LIST since TOKENS is already an array

export const getTokenMintFromSymbol = (symbol: string): PublicKey => {
  const token = TOKENS.find((t) => t.symbol === symbol);
  if (!token) throw new Error(`Unknown token symbol: ${symbol}`);
  return token.mint;
};

export const getTokenInfoFromMint = (
  mint: PublicKey | string
): TokenInfo | undefined => {
  const mintStr = mint instanceof PublicKey ? mint.toString() : mint;
  return TOKENS.find((token) => token.mint.toString() === mintStr);
};
