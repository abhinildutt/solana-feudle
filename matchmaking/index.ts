import { Server, Socket } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
  },
});

let waitingPlayers: PlayerDetail[] = [];

class PlayerDetail {
  socket: Socket;
  publicKey: string;
  constructor(socket: Socket, publicKey: string) {
    this.socket = socket;
    this.publicKey = publicKey;
  }
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("readyToPlay", (data) => {
    const playerDetail = new PlayerDetail(socket, data.publicKey);
    waitingPlayers.push(playerDetail);

    if (waitingPlayers.length >= 2) {
      const playerOneDetail = waitingPlayers.shift();
      const playerTwoDetail = waitingPlayers.shift();
    
      if (playerOneDetail && playerTwoDetail) {
        const room = `room_${playerOneDetail.socket.id}_${playerTwoDetail.socket.id}`;
        playerOneDetail.socket.join(room);
        playerTwoDetail.socket.join(room);
    
        // Emit to each player with the opponent's public key
        playerOneDetail.socket.emit("matchFound", { roomId: room, opponentPublicKey: playerTwoDetail.publicKey });
        playerTwoDetail.socket.emit("matchFound", { roomId: room, opponentPublicKey: playerOneDetail.publicKey });
    
        console.log("Public keys : ", playerOneDetail.publicKey, playerTwoDetail.publicKey)
        console.log(`Match found, room: ${room}, exchanging public keys`);
      }
    }

  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const index = waitingPlayers.findIndex(player => player.socket.id === socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1); // Remove the player from the waiting list
      console.log(`Removed waiting player: ${socket.id}`);
    }
  });
});

const PORT = 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
