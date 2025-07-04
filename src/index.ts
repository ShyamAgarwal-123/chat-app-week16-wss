import { WebSocket, WebSocketServer } from "ws";

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const wss = new WebSocketServer({ port });

type PayloadType = {
  room: string;
  [k: string]: string;
};

type MessageType = {
  type: string;
  payload: PayloadType;
};

let allRoom: Record<string, WebSocket[]> = {};
wss.on("connection", function (socket, req) {
  socket.on("message", (data) => {
    let ms: MessageType;

    try {
      ms = JSON.parse(data.toString());
      console.log(ms);
    } catch (error) {
      return;
    }

    if (ms.type === "join") {
      if (!allRoom[ms.payload.room]) {
        allRoom[ms.payload.room] = [socket];
      } else if (allRoom[ms.payload.room].includes(socket)) {
        return;
      } else {
        allRoom[ms.payload.room].push(socket);
      }
      console.log(allRoom);
    }
    if (ms.type === "chat" && ms.payload.message) {
      const roomSocket = allRoom[ms.payload.room];
      console.log(roomSocket);

      if (roomSocket) {
        roomSocket.forEach((sc) => {
          if (sc !== socket) {
            sc.send(
              JSON.stringify({
                type: "chat",
                payload: {
                  message: ms.payload.message,
                },
              })
            );
          }
        });
      }
    }
  });

  socket.on("close", () => {
    for (const room in allRoom) {
      allRoom[room] = allRoom[room].filter((sc) => sc !== socket);
      if (!allRoom[room].length) {
        delete allRoom[room];
      }
    }
  });
});
