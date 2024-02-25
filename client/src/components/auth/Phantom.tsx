import { FC, useEffect, useState } from 'react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import Matchmaking from '../../Matchmaking'
import { useWalletPublicKey } from '../../constants/Wallet'

type PhantomEvent = 'disconnect' | 'connect' | 'accountChanged'

interface ConnectOpts {
  onlyIfTrusted: boolean
}

interface PhantomProvider {
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  on: (event: PhantomEvent, callback: (args: any) => void) => void
  isPhantom: boolean
}

type WindowWithSolana = Window & {
  solana?: PhantomProvider
}

interface Connect2PhantomProps {
  onConnected: (connected: boolean) => void
}

const Connect2Phantom: FC<Connect2PhantomProps> = ({onConnected}) => {
  const [walletAvail, setWalletAvail] = useState(false)
  const [provider, setProvider] = useState<PhantomProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [pubKey, setPubKey] = useState<PublicKey | null>(null)
  const [, updateWalletPublicKey] = useWalletPublicKey();

  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    if ('solana' in window) {
      const solWindow = window as WindowWithSolana
      if (solWindow?.solana?.isPhantom) {
        setProvider(solWindow.solana)
        setWalletAvail(true)
        // Attemp an eager connection
        solWindow.solana.connect({ onlyIfTrusted: true })
      }
    }
  }, [])

  useEffect(() => {
    provider?.on('connect', (publicKey: PublicKey) => {
      console.log(`connect event: ${publicKey}`)
      setConnected(true)
      setPubKey(publicKey)
    })
    provider?.on('disconnect', () => {
      console.log('disconnect event')
      setConnected(false)
      setPubKey(null)
    })
  }, [provider])

  const connectHandler: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    console.log(`connect handler`)
    provider?.connect().catch((err) => {
      console.error('connect ERROR:', err)
    })
  }

  const disconnectHandler: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    console.log('disconnect handler')
    provider?.disconnect().catch((err) => {
      console.error('disconnect ERROR:', err)
    })
  }

  useEffect(() => {
    if (connected) {
      onConnected(true) // Notify parent component when connected
    }
    if (!connected) {
      onConnected(false)
    }
  }, [connected, onConnected])

  useEffect(() => {
    updateWalletPublicKey(pubKey ? pubKey.toBase58() : "");
  }, [pubKey, updateWalletPublicKey])

  return (
    <div>
    {walletAvail ? (
      <div>
        <div>
          {!connected ? (
            <button disabled={connected} onClick={connectHandler}>
              <p
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  fontFamily: 'monospace',
                }}
              > CONNECT TO PHANTOM</p>
            </button>
          ) : (
            <button disabled={!connected} onClick={disconnectHandler}>
              <p
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  fontFamily: 'monospace',
                }}
              >DISCONNECT FROM PHANTOM</p>
            </button>
          )}
        </div>

        {connected && (
          <div className="public-key-container">
            <div className="public-key-display"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '5rem',
              }}
            >
              <p
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  fontFamily: 'monospace',
                }}
                onClick={() => {
                  navigator.clipboard.writeText(pubKey?.toBase58() || '').then(() => {
                    setShowCopied(true);
                    setTimeout(() => setShowCopied(false), 2000);
                  })
                  .catch(err => {
                    console.error('Error copying to clipboard: ', err);
                  });
                }}
              >Click to copy your public key</p>
              <p
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: 'green',
                  visibility: showCopied ? 'visible' : 'hidden',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  fontFamily: 'monospace',
                }}
              >Copied!</p>
            </div>
          </div>
        )}
    </div>
    ) : (
      <div className="phantom-not-available">
        <p>
          Oops!!! Phantom is not available. Go get it{' '}
          <a href="https://phantom.app/">https://phantom.app/</a>.
        </p>
      </div>
    )}
  </div>
  )
}

export default Connect2Phantom
