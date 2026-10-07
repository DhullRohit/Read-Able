import "dotenv/config";

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set.");
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error("FATAL: JWT_SECRET must be at least 32 characters long.");
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
  nodeEnv: process.env.NODE_ENV,
};