import { Connection, PublicKey, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, Transaction, VersionedTransaction, Message, MessageArgs, Signer } from "@solana/web3.js";
import { PROGRAM_ID } from "./common";
import { InitializeOrderArgs } from "./instruction";
import * as borsh from 'borsh';
import bs58 from 'bs58'

export class P2PSwapSDK {
  constructor(
    private connection: Connection,
    private programId: PublicKey = PROGRAM_ID
  ) {}

  /**
   * Find the order PDA address
   */
  async findOrderAddress(
    maker: PublicKey,
    makerTokenMint: PublicKey,
    takerTokenMint: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        Buffer.from('order'),
        maker.toBuffer(),
        makerTokenMint.toBuffer(),
        takerTokenMint.toBuffer(),
      ],
      this.programId
    );
  }

  async createInitializeOrderInstruction(
    maker: PublicKey,
    makerTokenMint: PublicKey,
    takerTokenMint: PublicKey,
    makerAmount: bigint,
    takerAmount: bigint
): Promise<Message> {
    const [orderPda] = await this.findOrderAddress(
        maker,
        makerTokenMint,
        takerTokenMint
    );

    const { blockhash } = await this.connection.getLatestBlockhash();

    const args = new InitializeOrderArgs({
        makerAmount,
        takerAmount,
    });
    
    const instructionData = Buffer.from(borsh.serialize(
        InitializeOrderArgs.borshInstructionSchema,
        args
    ));

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
    ];

    const accountKeyIndexes = instruction.keys.map(key => 
        accountKeys.findIndex(ak => ak.equals(key.pubkey))
    );

    const compiledInstruction = {
        programIdIndex: accountKeys.findIndex(ak => ak.equals(instruction.programId)),
        accounts: accountKeyIndexes,
        data: bs58.encode(instruction.data), // Need to import bs58
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
    takerAmount: bigint
  ): Promise<string> {
    const message = await this.createInitializeOrderInstruction(
        maker.publicKey,
        makerTokenMint,
        takerTokenMint,
        makerAmount,
        takerAmount
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
}
