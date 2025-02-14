import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Buffer } from 'buffer';
import BN from 'bn.js';

// Constants
const PROGRAM_ID = new PublicKey(
  'GKTd9AGFpPGNKK28ncHeGGuT7rBJLzPxNjCUPKn8Yik8'
);
const INITIALIZE_IX_DISCRIMINATOR = Buffer.from([3]);
const CHANGE_ORDER_AMOUNTS_IX_DISCRIMINATOR = Buffer.from([4]);
const CHANGE_TAKER_IX_DISCRIMINATOR = Buffer.from([5]);
const COMPLETE_SWAP_IX_DISCRIMINATOR = Buffer.from([6]);
const CLOSE_ORDER_IX_DISCRIMINATOR = Buffer.from([7]);

interface InitializeOrderAccounts {
  maker: PublicKey;
  order: PublicKey;
  makerAta: PublicKey;
  pdaMakerAta: PublicKey;
  makerMint: PublicKey;
  takerMint: PublicKey;
  systemProgram?: PublicKey;
  rent?: PublicKey;
  tokenProgram?: PublicKey;
}

interface InitializeOrderArgs {
  makerAmount: BN;
  takerAmount: BN;
}

export function createInitializeOrderInstruction(
  accounts: InitializeOrderAccounts,
  args: InitializeOrderArgs,
  programId = PROGRAM_ID
): TransactionInstruction {
  // Serialize the instruction data
  const data = Buffer.concat([
    INITIALIZE_IX_DISCRIMINATOR,
    Buffer.from(args.makerAmount.toArray('le', 8)),
    Buffer.from(args.takerAmount.toArray('le', 8)),
  ]);

  const keys = [
    { pubkey: accounts.maker, isWritable: false, isSigner: true },
    { pubkey: accounts.order, isWritable: true, isSigner: false },
    { pubkey: accounts.makerAta, isWritable: true, isSigner: false },
    { pubkey: accounts.pdaMakerAta, isWritable: true, isSigner: false },
    { pubkey: accounts.makerMint, isWritable: false, isSigner: false },
    { pubkey: accounts.takerMint, isWritable: false, isSigner: false },
    {
      pubkey: accounts.systemProgram ?? SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.rent ?? SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
  ];

  return new TransactionInstruction({
    programId,
    keys,
    data,
  });
}

interface ChangeOrderAmountsAccounts {
  maker: PublicKey;
  order: PublicKey;
  escrowTokenAccount: PublicKey;
  makerTokenAccount: PublicKey;
  mint: PublicKey;
  tokenProgram?: PublicKey;
}

interface ChangeOrderAmountsArgs {
  newMakerAmount: BN;
  newTakerAmount: BN;
}

export function createChangeOrderAmountsInstruction(
  accounts: ChangeOrderAmountsAccounts,
  args: ChangeOrderAmountsArgs,
  programId = PROGRAM_ID
): TransactionInstruction {
  // Serialize the instruction data
  const data = Buffer.concat([
    CHANGE_ORDER_AMOUNTS_IX_DISCRIMINATOR,
    Buffer.from(args.newMakerAmount.toArray('le', 8)),
    Buffer.from(args.newTakerAmount.toArray('le', 8)),
  ]);

  const keys = [
    { pubkey: accounts.maker, isWritable: false, isSigner: true },
    { pubkey: accounts.order, isWritable: true, isSigner: false },
    { pubkey: accounts.escrowTokenAccount, isWritable: true, isSigner: false },
    { pubkey: accounts.makerTokenAccount, isWritable: true, isSigner: false },
    { pubkey: accounts.mint, isWritable: false, isSigner: false },
    {
      pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
  ];

  return new TransactionInstruction({
    programId,
    keys,
    data,
  });
}

interface ChangeTakerAccounts {
  maker: PublicKey;
  order: PublicKey;
  newTaker: PublicKey;
}

interface ChangeTakerArgs {
  newTaker: number[]; // size: 32
}

export function createChangeTakerInstruction(
  accounts: ChangeTakerAccounts,
  args: ChangeTakerArgs,
  programId = PROGRAM_ID
): TransactionInstruction {
  // Serialize the instruction data
  const data = Buffer.concat([
    CHANGE_TAKER_IX_DISCRIMINATOR,
    Buffer.from(args.newTaker), // Already a 32-byte array
  ]);

  const keys = [
    { pubkey: accounts.maker, isWritable: false, isSigner: true },
    { pubkey: accounts.order, isWritable: true, isSigner: false },
    { pubkey: accounts.newTaker, isWritable: false, isSigner: false },
  ];

  return new TransactionInstruction({
    programId,
    keys,
    data,
  });
}

interface CloseOrderAccounts {
  authority: PublicKey;
  order: PublicKey;
}

// Note: No args interface needed since this instruction only has a discriminator

export function createCloseOrderInstruction(
  accounts: CloseOrderAccounts,
  programId = PROGRAM_ID
): TransactionInstruction {
  // Serialize the instruction data - just the discriminator since no args
  const data = CLOSE_ORDER_IX_DISCRIMINATOR;

  const keys = [
    { pubkey: accounts.authority, isWritable: false, isSigner: true },
    { pubkey: accounts.order, isWritable: true, isSigner: false },
  ];

  return new TransactionInstruction({
    programId,
    keys,
    data,
  });
}

interface CompleteSwapAccounts {
  taker: PublicKey;
  order: PublicKey;
  makerReceivingAccount: PublicKey;
  takerSendingAccount: PublicKey;
  takerReceivingAccount: PublicKey;
  escrowTokenAccount: PublicKey;
  makerMint: PublicKey;
  takerMint: PublicKey;
  tokenProgram?: PublicKey;
  tokenAuthority: PublicKey;
}

export function createCompleteSwapInstruction(
  accounts: CompleteSwapAccounts,
  programId = PROGRAM_ID
): TransactionInstruction {
  // Serialize the instruction data - just the discriminator since no args
  const data = COMPLETE_SWAP_IX_DISCRIMINATOR;

  const keys = [
    { pubkey: accounts.taker, isWritable: false, isSigner: true },
    { pubkey: accounts.order, isWritable: true, isSigner: false },
    {
      pubkey: accounts.makerReceivingAccount,
      isWritable: true,
      isSigner: false,
    },
    { pubkey: accounts.takerSendingAccount, isWritable: true, isSigner: false },
    {
      pubkey: accounts.takerReceivingAccount,
      isWritable: true,
      isSigner: false,
    },
    { pubkey: accounts.escrowTokenAccount, isWritable: true, isSigner: false },
    { pubkey: accounts.makerMint, isWritable: false, isSigner: false },
    { pubkey: accounts.takerMint, isWritable: false, isSigner: false },
    {
      pubkey: accounts.tokenProgram ?? TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    { pubkey: accounts.tokenAuthority, isWritable: false, isSigner: false },
  ];

  return new TransactionInstruction({
    programId,
    keys,
    data,
  });
}
