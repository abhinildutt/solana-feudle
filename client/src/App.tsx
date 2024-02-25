import { useState, useEffect } from 'react'
import { Grid, Grid2 } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
import { InfoModal } from './components/modals/InfoModal'
import { StatsModal } from './components/modals/StatsModal'
import { SettingsModal } from './components/modals/SettingsModal'
import {
  WIN_MESSAGES,
  GAME_COPIED_MESSAGE,
  NOT_ENOUGH_LETTERS_MESSAGE,
  WORD_NOT_FOUND_MESSAGE,
  CORRECT_WORD_MESSAGE,
  HARD_MODE_ALERT_MESSAGE,
  DISCOURAGE_INAPP_BROWSER_TEXT,
} from './constants/strings'
import {
  MAX_CHALLENGES,
  REVEAL_TIME_MS as REVEAL_TIME_MS_NORMAL,
  REVEAL_TIME_MS_SPEEDRUN,
  WELCOME_INFO_MODAL_MS,
  DISCOURAGE_INAPP_BROWSERS,
} from './constants/settings'
import {
  isWordInWordList,
  isWinningWord,
  isWinningWordOfDay,
  solution as solutionOfDay,
  findFirstUnusedReveal,
  unicodeLength,
  solutionIndex as solutionIndexOfDay,
} from './lib/words'
import { addStatsForCompletedGame, loadStats } from './lib/stats'
import {
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  loadGameOfDayStateFromLocalStorage,
  saveGameOfDayStateToLocalStorage,
  setStoredIsHighContrastMode,
  getStoredIsHighContrastMode,
} from './lib/localStorage'
import { default as GraphemeSplitter } from 'grapheme-splitter'

import './App.css'
import { AlertContainer } from './components/alerts/AlertContainer'
import { useAlert } from './context/AlertContext'
import { Navbar } from './components/navbar/Navbar'
import { navigateAndRefresh } from './lib/navigation'
import { isInAppBrowser } from './lib/browser'
import { MigrateStatsModal } from './components/modals/MigrateStatsModal'

import scoreService from './services/scores'
import { generateEmojiGrid, getEmojiTiles } from './lib/share'

import { useMatch, useNavigate } from 'react-router-dom'
import { getWordBySolutionIndex } from './lib/words'
import { exampleIds } from './constants/exampleIds'
import { WORDS } from './constants/wordlist'
import { RandomGameText } from './components/gametext/RandomGameText'
import { StopwatchText } from './components/gametext/StopwatchText'
import { PromoText } from './components/gametext/PromoText'
import { useWalletPublicKey } from './constants/Wallet'
import { useOppWalletPublicKey } from './constants/OppWallet'
import { Connection, PublicKey, clusterApiUrl, Transaction, SystemProgram, Keypair, TransactionInstruction } from '@solana/web3.js';

import { createGameDataAccount } from './services/gameAccount'
import { initializeGame, fetchGameState, sendGuess, subscribeToGameStateChanges, SOLANA_NETWORK, GameState } from './services/solanaService'
import io from 'socket.io-client';

import { GameOverModal } from './components/modals/GameOverModal'

declare var window: any;

const SOCKET_SERVER_URL = "https://solana-feudle.onrender.com";

function App() {
  const navigate = useNavigate()

  const solution = 'CHORE'

  const prefersDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  const { showError: showErrorAlert, showSuccess: showSuccessAlert } =
    useAlert()
  const [currentGuess, setCurrentGuess] = useState('')
  const [currentGuess2, setCurrentGuess2] = useState('')

  const [isGameWon, setIsGameWon] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isMigrateStatsModalOpen, setIsMigrateStatsModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isSolutionTextOpen, setIsSolutionTextOpen] = useState(false)

  const [currentRowClass, setCurrentRowClass] = useState('')
  const [currentRowClass2, setCurrentRowClass2] = useState('')

  const [isGameLost, setIsGameLost] = useState(false)
  const [walletPubKey, updateWalletPublicKey] = useWalletPublicKey();
  const [OppWalletPubKey, updateOppWalletPublicKey] = useOppWalletPublicKey();
  const PROGRAM_ID = "yUyg4pKYPrh7KdcWSMygA3bj1REKeswbE7NYoVxU2W8";
  const [gameDataAccount, setGameDataAccount] = useState('');
  const [gameState, setGameState] = useState<GameState>(new GameState());
  const [isGameWonByOpponent, setIsGameWonByOpponent] = useState(false);
  const [isGameLostByOpponent, setIsGameLostByOpponent] = useState(false);

  // Initialize subscription
  // subscribeToGameStateChanges(gameDataAccount);
  useEffect(() => {
        let subscriptionId: number | null = null;
        const connection = new Connection(SOLANA_NETWORK, "confirmed");

        const subscribe = async () => {
            // Define the callback function inside useEffect to access fetchGameState and setGameState
            const callback = async (accountInfo: any, context: any) => {
                const updatedGameState = await fetchGameState(gameDataAccount);
                if(updatedGameState) setGameState(updatedGameState);
            };

            // Subscribe to account changes
            subscriptionId = connection.onAccountChange(new PublicKey(gameDataAccount), callback, 'confirmed');
        };

        subscribe();

        // Cleanup function to unsubscribe
        return () => {
            if (subscriptionId) {
                connection.removeAccountChangeListener(subscriptionId);
            }
        };
    }, [gameDataAccount]); // Depend on gameKey to re-subscribe if it changes
 
  useEffect(() => {
    const isPlayer1 = walletPubKey < OppWalletPubKey;
    if (isPlayer1) {
      createGameDataAccount({player1: walletPubKey, player2: OppWalletPubKey, programId: PROGRAM_ID, onCreate : setGameDataAccount});
    }
  }, [walletPubKey, OppWalletPubKey])

  useEffect(() => {
    const isPlayer1 = walletPubKey < OppWalletPubKey;
    if (!isPlayer1) {
      const socket = io(SOCKET_SERVER_URL);
      socket.on('receiveGameDataAccount', (data) => {
        console.log('Received gameDataAccount from Client 1:', data.gameDataAccount);
      
        setGameDataAccount(data.gameDataAccount);
        // Now you can use the received gameDataAccount for game initialization or other logic
      });
      // Clean up on component unmount
      return () => {
        socket.off('receiveGameDataAccount');
        socket.disconnect();
      };
    }
  }, [])

  useEffect(() => {
    console.log("Changed game pub key : ", gameDataAccount)
    const isPlayer1 = walletPubKey < OppWalletPubKey;
    if (isPlayer1) {
      const socket = io(SOCKET_SERVER_URL);
      socket.emit('sendGameDataAccount', { gameDataAccount });
      initializeGame(gameDataAccount, PROGRAM_ID, walletPubKey, OppWalletPubKey)
    }
  }, [gameDataAccount])

  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme')
      ? localStorage.getItem('theme') === 'dark'
      : prefersDarkMode
      ? true
      : false
  )
  const [isHighContrastMode, setIsHighContrastMode] = useState(
    getStoredIsHighContrastMode()
  )

  // GRID
  const [isRevealing, setIsRevealing] = useState(false)
  const [isRevealing2, setIsRevealing2] = useState(true)

  const [stats, setStats] = useState(() => loadStats())

  const [guesses, setGuesses] = useState<string[]>([])
  const [guesses2, setGuesses2] = useState<string[]>([])


  // KEYBOARD
  const onChar = (value: string) => {
    if (
      unicodeLength(`${currentGuess}${value}`) <= solution.length &&
      guesses.length < MAX_CHALLENGES &&
      !isGameWon
    ) {
      setCurrentGuess(`${currentGuess}${value}`)
    }
  }

  const onDelete = () => {
    setCurrentGuess(
      new GraphemeSplitter().splitGraphemes(currentGuess).slice(0, -1).join('')
    )
  }

  const onEnter = () => {
    if (!(unicodeLength(currentGuess) === solution.length)) {
      setCurrentRowClass('jiggle')
      return showErrorAlert(NOT_ENOUGH_LETTERS_MESSAGE, {
        onClose: clearCurrentRowClass,
      })
    }

    if (!isWordInWordList(currentGuess)) {
      setCurrentRowClass('jiggle')
      return showErrorAlert(WORD_NOT_FOUND_MESSAGE, {
        onClose: clearCurrentRowClass,
      })
    }

    setIsRevealing(true)
    // turn this back off after all
    // chars have been revealed
    setTimeout(() => {
      setIsRevealing(false)
    }, REVEAL_TIME_MS_NORMAL * solution.length)

    const winningWord = isWinningWord(currentGuess, solution)
    if (
      unicodeLength(currentGuess) === solution.length &&
      guesses.length < MAX_CHALLENGES &&
      !isGameWon
    ) {

      console.log("pub key : ", gameDataAccount)
      const isPlayer1 = walletPubKey < OppWalletPubKey;
      if (isPlayer1) {
        sendGuess(gameDataAccount, PROGRAM_ID, currentGuess, 1, walletPubKey, OppWalletPubKey)
      }
      else sendGuess(gameDataAccount, PROGRAM_ID, currentGuess, 2, walletPubKey, OppWalletPubKey)
      setGuesses([...guesses, currentGuess])
      setCurrentGuess('')

      if (winningWord) {
        return setIsGameWon(true)
      }
    }

    if (guesses.length === MAX_CHALLENGES - 1) {
      setIsGameLost(true)
      showErrorAlert(CORRECT_WORD_MESSAGE(solution), {
        persist: true,
        delayMs: REVEAL_TIME_MS_NORMAL * solution.length + 1,
      })
    }
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    if (isHighContrastMode) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [isDarkMode, isHighContrastMode])

  const handleDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  const handleHighContrastMode = (isHighContrast: boolean) => {
    setIsHighContrastMode(isHighContrast)
    setStoredIsHighContrastMode(isHighContrast)
  }

  const clearCurrentRowClass = () => {
    setCurrentRowClass('')
  }

  useEffect(() => {
    let guesses2_ = guesses2
    if (guesses2_[0] === '') {
      guesses2_ = guesses2_.slice(1)
    }
    if (guesses2_.length >= 1 && guesses2_[guesses2_.length - 1] === solution) {
      setIsGameLostByOpponent(true)
      setIsGameLost(true)
    } else if (guesses2_.length === MAX_CHALLENGES) {
      setIsGameWonByOpponent(true)
      setIsGameWon(true)
    }
  }, [guesses2])

  // Game over stats panel
  const isGameComplete = isGameWon || isGameLost
  useEffect(() => {
    const delayMs = REVEAL_TIME_MS_NORMAL * solution.length - 1337
    if (isGameWon) {
      const winMessage =
        WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]

      showSuccessAlert(winMessage, {
        delayMs,
        onClose: () => setIsStatsModalOpen(true),
      })
    }

    if (isGameLost) {
      setTimeout(() => {
        setIsStatsModalOpen(true)
      }, (solution.length + 1) * REVEAL_TIME_MS_NORMAL)
    }

    if (isGameComplete) {
      setTimeout(() => {
        setIsSolutionTextOpen(true)
      }, delayMs)
    }
  }, [isGameWon, isGameLost, showSuccessAlert])


  // Stopwatch
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(true)
  const [timeMs, setTimeMs] = useState(0)

  useEffect(() => {
    setIsStopwatchRunning(/*guesses.length >= 1 &&*/ !isGameComplete)
  }, [guesses, isGameComplete])

  useEffect(() => {
    const timeIncrementMs = 10
    let interval: NodeJS.Timeout | null = null

    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setTimeMs((timeMs) => timeMs + timeIncrementMs)
      }, timeIncrementMs)
    } else if (interval !== null) {
      clearInterval(interval)
    }
    return () => {
      if (interval !== null) {
        clearInterval(interval)
      }
    }
  }, [isStopwatchRunning])

  useEffect(() => {
    const isPlayer1 = walletPubKey < OppWalletPubKey;
    if(isPlayer1) {
      // if (gameState.game_status == 2) {
      //   setIsGameWon(false)
      //   setIsGameLost(true)
      // }

      if(gameState.player2_guess != "inval") {
        setGuesses2([...guesses2, gameState.player2_guess])
      }

    }
    if (!isPlayer1) {
      // if (gameState.game_status == 1) {
      //   setIsGameWon(false)
      //   setIsGameLost(true)
      // }

      if(gameState.player1_guess != "inval") {
        setGuesses2([...guesses2, gameState.player1_guess])
      }

    }
  }, [gameState])
  

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        setIsInfoModalOpen={setIsInfoModalOpen}
        setIsStatsModalOpen={setIsStatsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />
      <div className="pt-2 px-1 pb-8 md:max-w-7xl w-full mx-auto sm:px-6 lg:px-8 flex flex-col grow">
        <div className="pb-6 grow flex">
            <div className="absolute-left">
                <StopwatchText timeMs={timeMs} show />
            </div>
            <div className="flex justify-center w-full" style={{ marginLeft: '17.5vw' }}>
                <Grid
                    solution={solution}
                    guesses={guesses}
                    currentGuess={currentGuess}
                    isRevealing={isRevealing}
                    currentRowClassName={currentRowClass}
                />
            </div>
            <Grid2
                solution={solution}
                guesses={guesses2}
                currentGuess={currentGuess2}
                isRevealing={isRevealing2}
                currentRowClassName={currentRowClass2}
            />
        </div>

        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          solution={solution}
          guesses={guesses}
          isRevealing={isRevealing}
        />
        <InfoModal
          isOpen={isInfoModalOpen}
          handleClose={() => setIsInfoModalOpen(false)}
        />
        <GameOverModal
          isOpen={isStatsModalOpen}
          handleClose={() => setIsStatsModalOpen(false)}
        />
        {/* <StatsModal
          isOpen={isStatsModalOpen}
          handleClose={() => setIsStatsModalOpen(false)}
          solution={solution}
          solutionIndex={solutionIndex}
          guesses={guesses}
          gameStats={stats}
          isGameLost={isGameLost}
          isGameWon={isGameWon}
          handleShareToClipboard={() => showSuccessAlert(GAME_COPIED_MESSAGE)}
          handleMigrateStatsButton={() => {
            setIsStatsModalOpen(false)
            setIsMigrateStatsModalOpen(true)
          }}
          isHardMode={isHardMode}
          isDarkMode={isDarkMode}
          isHighContrastMode={isHighContrastMode}
          numberOfGuessesMade={guesses.length}
          isPlayingExample={isPlayingExample}
          isPlayingRandom={isPlayingRandom}
          isManualShareText={isManualShareText}
        />
        <MigrateStatsModal
          isOpen={isMigrateStatsModalOpen}
          handleClose={() => setIsMigrateStatsModalOpen(false)}
        />
         */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          handleClose={() => setIsSettingsModalOpen(false)}
          isHardMode={false}
          handleHardMode={() => { }}
          isDarkMode={isDarkMode}
          handleDarkMode={handleDarkMode}
          isHighContrastMode={isHighContrastMode}
          handleHighContrastMode={handleHighContrastMode}
          isSpeedrunMode={false}
          handleSpeedrunMode={() => { }}
          isManualShareText={false}
          handleManualShareText={() => {}}
        />
        <AlertContainer />
      </div>
    </div>
  )
}

export default App
