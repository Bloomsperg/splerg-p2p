import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { MY_WALLET, USDC_MINT, SOL_MINT, BONK_MINT } from '.';

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
