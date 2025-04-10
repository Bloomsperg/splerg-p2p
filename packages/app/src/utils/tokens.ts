import { Connection, PublicKey } from '@solana/web3.js';
import { TokenInfo } from '../model/token';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import BN from 'bn.js';

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
    mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    icon: '/usdc.png',
    decimals: 6,
  },
];

/*
export const TOKENS: TokenInfo[] = [
  {
    symbol: 'TOKA',
    name: 'Token A',
    mint: new PublicKey('7AqwHcg9jfTrr7Rvwb8L2TVYQBRxTBk6Wj4ma4rZ7dmh'),
    icon: '/solana.png',
    decimals: 9,
    is2022: false,
  },
  {
    symbol: 'TOKB',
    name: 'Token B',
    mint: new PublicKey('FR43N4i1fGQFEvrmtQ7NJa1NHFpnC1KebqNjuiVyGDZX'),
    icon: '/sperg.png',
    decimals: 9,
    is2022: false,
  },
  {
    symbol: 'TOK22A',
    name: 'Token22 A',
    mint: new PublicKey('9BVYGzH8ipAaFwUbETJjSJbXAxVCTqbXkUpQ5q7jr9y3'),
    icon: '/bonk.png',
    decimals: 9,
    is2022: true,
  },
  {
    symbol: 'TOK22B',
    name: 'Token22 B',
    mint: new PublicKey('6N356CSXBCSxmDDaJF6dttqPkvAwVrrcvL5Ep8W1eZjA'),
    icon: '/usdc.png',
    decimals: 9,
    is2022: true,
  },
];
*/
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

export const getTokenSymbolFromMint = (mint: PublicKey | string): string => {
  const mintStr = mint instanceof PublicKey ? mint.toString() : mint;
  const token = TOKENS.find((token) => token.mint.toString() === mintStr);
  if (!token) throw new Error(`Unknown token mint: ${mintStr}`);
  return token.symbol;
};

export const getTokenDecimalsFromMint = (
  mint: PublicKey | string
): number | undefined => {
  const mintStr = mint instanceof PublicKey ? mint.toString() : mint;
  const token = TOKENS.find((token) => token.mint.toString() === mintStr);
  return token?.decimals;
};

export const getCreateATAInstructionsIfNeeded = async (
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  offCurve?: boolean
) => {
  const ata = getAssociatedTokenAddressSync(mint, owner, offCurve);

  const account = await connection.getAccountInfo(ata);

  if (account) {
    return;
  } else {
    return createAssociatedTokenAccountInstruction(payer, ata, owner, mint);
  }
};

export const scaleAmount = (
  amount: string | undefined,
  decimals: number
): BN => {
  if (!amount || isNaN(Number(amount))) {
    return new BN(0);
  }

  // Convert the amount to a number first
  const parsedAmount = parseFloat(amount);

  // Multiply by 10^decimals and handle decimal places
  const scaledAmount = parsedAmount * Math.pow(10, decimals);

  // Round to handle any floating point precision issues
  const roundedAmount = Math.round(scaledAmount);

  // Convert to BN
  return new BN(roundedAmount.toString());
};
