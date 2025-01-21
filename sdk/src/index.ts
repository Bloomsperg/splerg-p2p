import { Connection } from "@solana/web3.js";
import { loadKeypairFromFile } from "./utils";

async function main() {
  try {
    const connection = new Connection("http://localhost:8899", "confirmed");    
    const keypair = loadKeypairFromFile();
    const balance = await connection.getBalance(keypair.publicKey);
    
    console.log("Wallet public key:", keypair.publicKey.toString());
    console.log("Balance:", balance / 1e9, "SOL"); // Convert lamports to SOL
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
