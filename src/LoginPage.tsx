import React, { useState } from 'react'
import './LoginPage.css' // Ensure you have this CSS file in the same directory
import Connect2Phantom from './components/auth/Phantom'
import { useNavigate } from 'react-router-dom'
import Matchmaking from './Matchmaking'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)
  const [isMatchmaking, setIsMatchmaking] = useState(false); // New state to control matchmaking

  const handleConnected = (connected: boolean) => {
    setIsConnected(connected) // Update state based on wallet connection
  }

  const handlePlayGame = () => {
    setIsMatchmaking(true); // Start matchmaking on button click
  };

  const handleMatchFound = () => {
    navigate('/main'); // Navigate to the game page once a match is found
  };

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
        </button>
        {isConnected && !isMatchmaking && (
            <button className="play-game-btn" onClick={handlePlayGame}>
              Play Game
            </button>
        )}
        {isMatchmaking && <Matchmaking onMatchFound={handleMatchFound} />}
      </div>
    </div>
  )
}

export default LoginPage
