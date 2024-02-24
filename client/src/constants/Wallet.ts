import { useState, useEffect, useCallback } from 'react';

let _walletPublicKey: string = '';

const listeners: Set<(newPublicKey: string) => void> = new Set();

const notifyListeners = (newPublicKey: string): void => {
  listeners.forEach(listener => listener(newPublicKey));
};

export const useWalletPublicKey = (): [string, (newPublicKey: string) => void] => {
  const [walletPublicKey, setWalletPublicKey] = useState<string>(_walletPublicKey);

  useEffect(() => {
    const listener = (newPublicKey: string): void => {
      setWalletPublicKey(newPublicKey);
    };

    listeners.add(listener);

    return (): void => {
      listeners.delete(listener);
    };
  }, []);

  const updateWalletPublicKey = useCallback((newPublicKey: string): void => {
    _walletPublicKey = newPublicKey;
    notifyListeners(newPublicKey);
  }, []);

  return [walletPublicKey, updateWalletPublicKey];
};