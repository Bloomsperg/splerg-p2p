import { PublicKey } from '@solana/web3.js';

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: PublicKey;
  icon?: string;
  decimals?: number;
  is2022?: boolean;
}

export type TokenDirectory = {
  [key: string]: TokenInfo;
};

export interface TokenInputProps {
  token: PublicKey;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  label: string;
  balance?: string;
}
