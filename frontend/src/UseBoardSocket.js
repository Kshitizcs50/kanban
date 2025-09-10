import { useEffect } from "react";
import { io } from "socket.io-client";

export function useBoardSocket(boardId, user, handlers) {
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000");

    socket.emit("joinBoard", { boardId, user });

    socket.on("card:created", handlers.cardCreated);
    socket.on("card:moved", handlers.cardMoved);
    socket.on("presence:update", handlers.presenceUpdate);

    return () => {
      socket.emit("leaveBoard", { boardId, userId: user.id });
      socket.disconnect();
    };
  }, [boardId]);
}
