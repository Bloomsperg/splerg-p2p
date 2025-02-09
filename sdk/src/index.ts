import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createInitializeOrderInstruction } from '../generated';
import { getAssociatedTokenAddress, createMint, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';
import { loadKeypairFromFile } from './utils';

async function main() {
 const connection = new Connection('http://localhost:8899', 'confirmed');
 const payer = loadKeypairFromFile();

 // Create test mints
 const makerMint = await createMint(
   connection,
   payer,
   payer.publicKey, 
   null,
   9
 );

 const takerMint = await createMint(
   connection,
   payer,
   payer.publicKey,
   null, 
   9
 );

 const [orderPDA] = PublicKey.findProgramAddressSync(
   [
     Buffer.from('order'),
     payer.publicKey.toBuffer(),
     makerMint.toBuffer(),
     takerMint.toBuffer()
   ],
   new PublicKey('GKTd9AGFpPGNKK28ncHeGGuT7rBJLzPxNjCUPKn8Yik8')
 );

 const makerATA = await getAssociatedTokenAddress(makerMint, payer.publicKey);
 const pdaMakerATA = await getAssociatedTokenAddress(makerMint, orderPDA, true);

 const tx = new Transaction().add(
   createAssociatedTokenAccountInstruction(
     payer.publicKey,
     makerATA,
     payer.publicKey, 
     makerMint
   ),
   createAssociatedTokenAccountInstruction(
     payer.publicKey,
     pdaMakerATA,
     orderPDA,
     makerMint  
   ),
   createMintToInstruction(makerMint, makerATA, payer.publicKey, 1000000000),
   createInitializeOrderInstruction(
     {
       maker: payer.publicKey,
       order: orderPDA,
       makerAta: makerATA,
       pdaMakerAta: pdaMakerATA,
       makerMint,
       takerMint,
     },
     {
       makerAmount: BigInt(100),
       takerAmount: BigInt(100), 
     }
   )
 );

 const sig = await connection.sendTransaction(tx, [payer]);
 console.log('Signature:', sig);
}

main().catch(console.error);