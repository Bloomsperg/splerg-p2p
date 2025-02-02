export interface TokenInfo {
  symbol?: string;
  icon?: string;
  name?: string;
  mint?: string;
}

export type TokenDirectory = {
  [key: string]: TokenInfo;
};
