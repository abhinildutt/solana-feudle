import React, { useState } from 'react'
import './LoginPage.css' // Ensure you have this CSS file in the same directory
import Connect2Phantom from './components/auth/Phantom'
import { useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)

  const handleConnected = (connected: boolean) => {
    setIsConnected(connected) // Update state based on wallet connection
  }
  const handlePlayGame = () => {
    navigate('/main') // Navigate to the main page
  }

  const handleConnectWallet = () => {
    // Placeholder for wallet connect functionality
    console.log('Connecting wallet...')
    // Redirect to main page or enable access to the application
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Feudle</h1>
        <button className="connect-wallet-btn" onClick={handleConnectWallet}>
          <Connect2Phantom onConnected={handleConnected} />{' '}
          {/* Pass the callback */}
          {isConnected && (
            <button className="play-game-btn" onClick={handlePlayGame}>
              Play Game
            </button>
          )}
        </button>
      </div>
    </div>
  )
}

export default LoginPage
