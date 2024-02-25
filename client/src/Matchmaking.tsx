import React, { useState, useEffect } from 'react';
import { io, Socket } from "socket.io-client";
import { useWalletPublicKey } from './constants/Wallet';
import { useOppWalletPublicKey } from './constants/OppWallet';

const SOCKET_SERVER_URL = "http://localhost:8000";

interface MatchmakingProps {
    onMatchFound: () => void;
  }

const Matchmaking: React.FC<MatchmakingProps>  = ({onMatchFound}) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [walletPubKey, updateWalletPublicKey] = useWalletPublicKey();
  const [OppWalletPubKey, updateOppWalletPublicKey] = useOppWalletPublicKey();

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.emit("readyToPlay", { publicKey: walletPubKey });


    newSocket.on('matchFound', (data) => {
      console.log('Match found!', data);
      updateOppWalletPublicKey(data.opponentPublicKey)
      onMatchFound()
      setRoomId(data.roomId);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [onMatchFound]);

  return (
    <div>
      {roomId ? (
        <p>Match found! Your game room ID: {roomId}</p>
      ) : (
        <p>Waiting for a match...</p>
      )}
    </div>
  );
};

export default Matchmaking;



