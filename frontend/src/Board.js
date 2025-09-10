import React, { useEffect, useState } from "react";
import API from "./api";
import { useBoardSocket } from "./UseBoardSocket";
import { v4 as uuidv4 } from "uuid";

export default function Board({ boardId, user }) {
  const [board, setBoard] = useState(null);
  const [presence, setPresence] = useState([]);

  useEffect(() => {
    API.get(`/boards/${boardId}`).then((res) => setBoard(res.data));
  }, [boardId]);

  useBoardSocket(boardId, user, {
    cardCreated: ({ card, tempId }) => {
      setBoard((prev) => {
        const cols = prev.Columns.map((c) =>
          c.id === card.ColumnId
            ? { ...c, Cards: [...c.Cards.filter((x) => x.id !== tempId), card] }
            : c
        );
        return { ...prev, Columns: cols };
      });
    },
    cardMoved: (data) => {
      // simple re-fetch for now
      API.get(`/boards/${boardId}`).then((res) => setBoard(res.data));
    },
    presenceUpdate: (users) => setPresence(users),
  });

  const createCard = async (colId) => {
    const tempId = uuidv4();
    setBoard((prev) => {
      const cols = prev.Columns.map((c) =>
        c.id === colId ? { ...c, Cards: [...c.Cards, { id: tempId, title: "New Card" }] } : c
      );
      return { ...prev, Columns: cols };
    });

    // emit via socket
    const socket = window.socket; // simplified; ideally pass socket from hook
    socket.emit("card:create", { boardId, columnId: colId, title: "New Card", position: 0, tempId, user });
  };

  if (!board) return <p>Loading...</p>;

  return (
    <div>
      <h2>{board.title}</h2>
      <div style={{ display: "flex", gap: "20px" }}>
        {board.Columns.map((col) => (
          <div key={col.id} style={{ border: "1px solid gray", padding: "10px", width: "200px" }}>
            <h4>{col.title}</h4>
            {col.Cards.map((card) => (
              <div key={card.id} style={{ border: "1px solid #ccc", margin: "5px", padding: "5px" }}>
                {card.title}
              </div>
            ))}
            <button onClick={() => createCard(col.id)}>+ Card</button>
          </div>
        ))}
      </div>
      <div>
        <h3>Online Users:</h3>
        {presence.map((u) => (
          <span key={u.id}>{u.name} </span>
        ))}
      </div>
    </div>
  );
}
