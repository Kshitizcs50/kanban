const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Redis = require("ioredis");
require("dotenv").config();

const { sequelize, Board, Column, Card, AuditLog } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Redis
const redis = new Redis(process.env.REDIS_URL);

// Create board with default columns
app.post("/api/boards", async (req, res) => {
  const board = await Board.create({ title: req.body.title });
  const todo = await Column.create({ title: "Todo", position: 0, BoardId: board.id });
  const doing = await Column.create({ title: "In Progress", position: 1, BoardId: board.id });
  const done = await Column.create({ title: "Done", position: 2, BoardId: board.id });

  await AuditLog.create({ boardId: board.id, event: "board.created", payload: { title: board.title } });
  res.json({ board, columns: [todo, doing, done] });
});

// Get board with columns + cards
app.get("/api/boards/:id", async (req, res) => {
  const board = await Board.findByPk(req.params.id, {
    include: { model: Column, include: Card },
    order: [[Column, "position", "ASC"]],
  });
  res.json(board);
});

// HTTP server + Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

async function broadcastPresence(boardId) {
  const vals = await redis.hgetall(`board:${boardId}:presence`);
  const users = Object.values(vals).map((v) => JSON.parse(v));
  io.to(boardId).emit("presence:update", users);
}

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("joinBoard", async ({ boardId, user }) => {
    socket.join(boardId);
    await redis.hset(`board:${boardId}:presence`, user.id, JSON.stringify(user));
    broadcastPresence(boardId);
  });

  socket.on("leaveBoard", async ({ boardId, userId }) => {
    await redis.hdel(`board:${boardId}:presence`, userId);
    broadcastPresence(boardId);
  });

  socket.on("card:create", async (data) => {
    const card = await Card.create({
      title: data.title,
      ColumnId: data.columnId,
      position: data.position,
    });
    await AuditLog.create({ boardId: data.boardId, event: "card.created", payload: { cardId: card.id } });
    io.to(data.boardId).emit("card:created", { card, tempId: data.tempId });
  });

  socket.on("card:move", async (data) => {
    await Card.update(
      { ColumnId: data.toColumnId, position: data.position, version: data.version + 1 },
      { where: { id: data.cardId } }
    );
    await AuditLog.create({ boardId: data.boardId, event: "card.moved", payload: data });
    io.to(data.boardId).emit("card:moved", data);
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
