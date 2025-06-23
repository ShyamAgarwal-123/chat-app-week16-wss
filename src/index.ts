import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8081 });

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
    } catch (error) {
      return;
    }

    if (ms.type === "join") {
      if (!allRoom[ms.payload.room]) {
        allRoom[ms.payload.room] = [socket];
      }
      allRoom[ms.payload.room].push(socket);
      console.log(allRoom);
    }

    if (ms.type === "message") {
      const roomSocket = allRoom[ms.payload.room];
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
