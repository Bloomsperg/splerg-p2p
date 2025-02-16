import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface Order {
  id: PublicKey;
  maker: PublicKey;
  taker: PublicKey;
  makerToken: PublicKey;
  takerToken: PublicKey;
  makerAmount: BN;
  takerAmount: BN;
  bump: number;
}

export interface OrderTableProps {
  orders?: Order[];
}

export type ModalType =
  | 'fromTokenSelect'
  | 'toTokenSelect'
  | `modifySwap_${number}`
  | `swapDetails_${number}`;
