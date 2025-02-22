import {
  Connection,
  GetProgramAccountsFilter,
  PublicKey,
} from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID } from '.';
import { Order } from '../model';

const SWAP_ORDER_SIZE = 32 + 32 + 32 + 32 + 32 + 8 + 8 + 1; // 177 bytes total

function deserializeOrder(address: PublicKey, data: Buffer): Order {
  let offset = 0;

  const maker = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const taker = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const id = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const makerToken = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const takerToken = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const makerAmount = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const takerAmount = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const bump = data[offset];

  return {
    address,
    id,
    maker,
    taker,
    makerToken,
    takerToken,
    makerAmount,
    takerAmount,
    bump,
  };
}

export async function fetchProgramAccounts(
  connection: Connection,
  owner?: PublicKey
): Promise<Order[]> {
  const filters: GetProgramAccountsFilter[] = [
    {
      dataSize: SWAP_ORDER_SIZE,
    },
  ];

  if (owner) {
    filters.push({
      memcmp: {
        offset: 0, // maker is the first field
        bytes: owner.toBase58(),
      },
    });
  }

  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters,
    });

    return accounts.map((account) => ({
      ...deserializeOrder(account.pubkey, account.account.data),
      publicKey: account.pubkey,
    }));
  } catch (error) {
    console.error('Error fetching program accounts:', error);
    throw error;
  }
}

export const getOrderPDA = (
  id: PublicKey,
  maker: PublicKey,
  makerTokenMint: PublicKey,
  takerTokenMint: PublicKey
): { pda: PublicKey; bump: number } => {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('order'),
      id.toBytes(),
      maker.toBytes(),
      makerTokenMint.toBytes(),
      takerTokenMint.toBytes(),
    ],
    PROGRAM_ID
  );

  return { pda, bump };
};
