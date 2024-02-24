import { FC, useEffect, useState } from 'react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'

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
  }, [connected, onConnected])

  return (
    <div className="wallet-connection">
    {walletAvail ? (
      <div className="wallet-buttons">
        <div className="wallet-button">
          <button disabled={connected} onClick={connectHandler}>
            Connect to Phantom
          </button>
        </div>
        <div className="wallet-button">
          <button disabled={!connected} onClick={disconnectHandler}>
            Disconnect from Phantom
          </button>
        </div>
        {connected && (
          <div className="public-key-display">
            <p>Your public key is: {pubKey?.toBase58()}</p>
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
