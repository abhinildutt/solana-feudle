// phantomWallet.ts
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';

// Extend the Window interface to include solana object
interface Window {
    solana?: PhantomWallet;
  }
  
  interface PhantomWallet {
    isPhantom: boolean | PhantomWallet;
    connect: (options?: { onlyIfTrusted: boolean }) => Promise<{ publicKey: string }>;
    signTransaction: (transaction: Transaction) => Promise<any>; // Simplified; adjust based on actual usage
    publicKey: PublicKey;
    // Include other Phantom wallet methods as needed
  }
  
  declare global {
    interface Window {
      solana: PhantomWallet;
    }
  }
  
  export const getPhantomWallet = (): PhantomWallet | undefined => {
    if (typeof window !== "undefined" && window.solana && window.solana.isPhantom) {
      return window.solana;
    }
    return undefined;
  };
  