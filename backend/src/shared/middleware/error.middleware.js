// Global error handling middleware that catches and formats all application errors into consistent API responses
import { AppError } from "../utils/errors.js";

export const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Prisma unique constraint error
  if (err.code === "P2002") {
    return res.status(409).json({ success: false, message: "A user with this email already exists." });
  }

  return res.status(500).json({ success: false, message: "Internal server error" });
};
