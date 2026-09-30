// Loads and validates environment variables, exporting a centralized config object for the application
import "dotenv/config";

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || "readable_super_secret_jwt_key_change_in_prod",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
};
