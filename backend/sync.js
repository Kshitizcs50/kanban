const { sequelize } = require("./db");

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ DB synced");
    process.exit();
  } catch (err) {
    console.error("❌ DB sync error:", err);
  }
})();
