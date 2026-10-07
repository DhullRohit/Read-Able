// Entry point that starts the HTTP server, connects to the database, and listens on the configured port
import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";
import prisma from "./config/database.js";

const start = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();
