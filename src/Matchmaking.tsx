import React, { useState, useEffect } from 'react';
import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:8000";

interface MatchmakingProps {
    onMatchFound: () => void; // Callback when a match is found
  }

const Matchmaking: React.FC<MatchmakingProps>  = ({onMatchFound}) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.emit('readyToPlay');

    newSocket.on('matchFound', (data: { roomId: string }) => {
      console.log('Match found!', data);
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
