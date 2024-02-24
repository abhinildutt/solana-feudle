import { useState, useEffect, useCallback } from 'react';

let _OppWalletPublicKey: string = '';

const listeners: Set<(newPublicKey: string) => void> = new Set();

const notifyListeners = (newPublicKey: string): void => {
  listeners.forEach(listener => listener(newPublicKey));
};

export const useOppWalletPublicKey = (): [string, (newPublicKey: string) => void] => {
  const [walletPublicKey, setWalletPublicKey] = useState<string>(_OppWalletPublicKey);

  useEffect(() => {
    const listener = (newPublicKey: string): void => {
      setWalletPublicKey(newPublicKey);
    };

    listeners.add(listener);

    return (): void => {
      listeners.delete(listener);
    };
  }, []);

  const updateOppWalletPublicKey = useCallback((newPublicKey: string): void => {
    _OppWalletPublicKey = newPublicKey;
    notifyListeners(newPublicKey);
  }, []);

  return [walletPublicKey, updateOppWalletPublicKey];
};
