import {
  Connection,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  VersionedTransaction,
  Message,
} from '@solana/web3.js';
import { PROGRAM_ID } from './common';
import { InitializeOrderArgs, SwapOrder } from './instruction';
import * as borsh from 'borsh';
import bs58 from 'bs58';

export class P2PSwapSDK {
  constructor(
    private connection: Connection,
    private programId: PublicKey = PROGRAM_ID,
  ) {}

  /**
   * Find the order PDA address
   */
  async findOrderAddress(
    maker: PublicKey,
    makerTokenMint: PublicKey,
    takerTokenMint: PublicKey,
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        Buffer.from('order'),
        maker.toBuffer(),
        makerTokenMint.toBuffer(),
        takerTokenMint.toBuffer(),
      ],
      this.programId,
    );
  }

  async createInitializeOrderInstruction(
    maker: PublicKey,
    makerTokenMint: PublicKey,
    takerTokenMint: PublicKey,
    makerAmount: bigint,
    takerAmount: bigint,
  ): Promise<Message> {
    const [orderPda] = await this.findOrderAddress(maker, makerTokenMint, takerTokenMint);

    const { blockhash } = await this.connection.getLatestBlockhash();

    const args = new InitializeOrderArgs({
      makerAmount,
      takerAmount,
    });

    const instructionData = Buffer.from(
      borsh.serialize(InitializeOrderArgs.borshInstructionSchema, args),
    );

    const instruction = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: maker, isSigner: true, isWritable: true },
        { pubkey: orderPda, isSigner: false, isWritable: true },
        { pubkey: makerTokenMint, isSigner: false, isWritable: false },
        { pubkey: takerTokenMint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });

    // Compute the message header
    // numRequiredSignatures = number of signers (1 - maker)
    // numReadonlySignedAccounts = number of readonly signed accounts (0)
    // numReadonlyUnsignedAccounts = number of readonly unsigned accounts (4 - makerTokenMint, takerTokenMint, SystemProgram, Rent)
    const header = {
      numRequiredSignatures: 1,
      numReadonlySignedAccounts: 0,
      numReadonlyUnsignedAccounts: 4,
    };

    // Create compiled instruction
    const accountKeys = [
      maker,
      orderPda,
      makerTokenMint,
      takerTokenMint,
      SystemProgram.programId,
      SYSVAR_RENT_PUBKEY,
      this.programId,
    ];

    const accountKeyIndexes = instruction.keys.map((key) =>
      accountKeys.findIndex((ak) => ak.equals(key.pubkey)),
    );

    const compiledInstruction = {
      programIdIndex: accountKeys.findIndex((ak) => ak.equals(instruction.programId)),
      accounts: accountKeyIndexes,
      data: bs58.encode(instruction.data),
    };

    return new Message({
      header,
      accountKeys,
      recentBlockhash: blockhash,
      instructions: [compiledInstruction],
    });
  }

  async initializeOrder(
    maker: Keypair,
    makerTokenMint: PublicKey,
    takerTokenMint: PublicKey,
    makerAmount: bigint,
    takerAmount: bigint,
  ): Promise<string> {
    const message = await this.createInitializeOrderInstruction(
      maker.publicKey,
      makerTokenMint,
      takerTokenMint,
      makerAmount,
      takerAmount,
    );

    const versionedTransaction = new VersionedTransaction(message);

    versionedTransaction.sign([maker]);

    const signature = await this.connection.sendTransaction(versionedTransaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    await this.connection.confirmTransaction(signature);

    return signature;
  }

  async getOrder(
    maker: PublicKey,
    makerTokenMint: PublicKey,
    takerTokenMint: PublicKey,
  ): Promise<SwapOrder | null> {
    const [orderPda] = await this.findOrderAddress(maker, makerTokenMint, takerTokenMint);

    try {
      const accountInfo = await this.connection.getAccountInfo(orderPda);

      if (!accountInfo) {
        return null;
      }

      const rawOrder = borsh.deserialize(SwapOrder.borshAccountSchema, accountInfo.data) as {
        maker: Uint8Array;
        taker: Uint8Array;
        maker_token_mint: Uint8Array;
        taker_token_mint: Uint8Array;
        maker_amount: bigint;
        taker_amount: bigint;
        state: number;
      };

      return new SwapOrder({
        maker: rawOrder.maker,
        taker: rawOrder.taker,
        maker_token_mint: rawOrder.maker_token_mint,
        taker_token_mint: rawOrder.taker_token_mint,
        maker_amount: rawOrder.maker_amount,
        taker_amount: rawOrder.taker_amount,
        state: rawOrder.state,
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }
}
