const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
  dialect: "postgres",
  logging: false,
});

// Models
const Board = sequelize.define("Board", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
});

const Column = sequelize.define("Column", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const Card = sequelize.define("Card", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  assignee: { type: DataTypes.STRING },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
  version: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const AuditLog = sequelize.define("AuditLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  boardId: { type: DataTypes.UUID },
  event: { type: DataTypes.STRING },
  payload: { type: DataTypes.JSONB },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Associations
Board.hasMany(Column, { onDelete: "cascade" });
Column.belongsTo(Board);
Column.hasMany(Card, { onDelete: "cascade" });
Card.belongsTo(Column);

module.exports = { sequelize, Board, Column, Card, AuditLog };
