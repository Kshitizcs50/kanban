import React, { useState } from "react";
import Board from "./Board";

export default function App() {
  const [boardId, setBoardId] = useState("");
  const [user, setUser] = useState({ id: "u1", name: "User 1" });

  return (
    <div>
      <h1>Kanba</h1>
      <input value={boardId} onChange={(e) => setBoardId(e.target.value)} placeholder="Enter Board ID" />
      {boardId && <Board boardId={boardId} user={user} />}
    </div>
  );
}
