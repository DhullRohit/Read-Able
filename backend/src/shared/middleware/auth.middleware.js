// Middleware to verify JWT tokens and protect routes that require authentication
import jwt from "jsonwebtoken";
import { config } from "../../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};
