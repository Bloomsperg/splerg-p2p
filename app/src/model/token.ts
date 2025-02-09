export interface TokenInfo {
  symbol?: string;
  icon?: string;
  name?: string;
  mint?: string;
}

export type TokenDirectory = {
  [key: string]: TokenInfo;
};

export interface TokenInputProps {
  token: string;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  label: string;
  balance?: string;
}
