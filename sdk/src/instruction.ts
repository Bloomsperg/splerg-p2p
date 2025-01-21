import { Schema } from "borsh";

// Instruction enum for serialization
enum SwapInstructionKind {
    InitializeOrder = 0,
    DepositMakerTokens = 1,
    AssignTaker = 2,
    CompleteSwap = 3,
    CloseOrder = 4,
  }
  
  export class InitializeOrderArgs {
    instruction: number;
    makerAmount: bigint;
    takerAmount: bigint;
  
    constructor(args: { makerAmount: bigint; takerAmount: bigint }) {
      this.instruction = SwapInstructionKind.InitializeOrder;
      this.makerAmount = args.makerAmount;
      this.takerAmount = args.takerAmount;
    }
  
    static borshInstructionSchema: Schema = {
        kind: 'struct',
        fields: [
          ['instruction', { kind: 'u8' }],
          ['makerAmount', { kind: 'u64' }],
          ['takerAmount', { kind: 'u64' }],
        ]
      } as unknown as Schema;
  }
  