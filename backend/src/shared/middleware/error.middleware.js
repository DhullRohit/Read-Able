// Global error handling middleware that catches and formats all application errors into consistent API responses
import { AppError } from "../utils/errors.js";

export const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Prisma unique constraint violation — determine which field caused the conflict
  if (err.code === "P2002") {
    const target = err.meta?.target;
    const targetStr = Array.isArray(target) ? target.join(",") : String(target || "");
    if (targetStr.toLowerCase().includes("phone")) {
      return res.status(409).json({ success: false, message: "An account with this phone number already exists." });
    }
    if (targetStr.toLowerCase().includes("email")) {
      return res.status(409).json({ success: false, message: "An account with this email address already exists." });
    }
    return res.status(409).json({ success: false, message: "This value is already in use." });
  }

  return res.status(500).json({ success: false, message: "Internal server error" });
};
