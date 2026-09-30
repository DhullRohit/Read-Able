// Creates and configures the Express application with middleware, routes, and error handling
import express from "express";
import cors from "cors";
import "dotenv/config";
import routes from "./routes/index.js";
import { errorMiddleware } from "./shared/middleware/error.middleware.js";

const app = express();

// CORS — allow frontend dev server
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// All API routes
app.use("/api", routes);

// Global error handler
app.use(errorMiddleware);

export default app;
