// declarations.d.ts
import { PhantomProvider } from "@solana/wallet-adapter-wallets";

interface Window {
  solana?: PhantomProvider;
}
