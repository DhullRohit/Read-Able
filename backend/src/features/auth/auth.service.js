// Contains business logic for authentication operations like token generation, password hashing, and user verification
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/database.js";
import { config } from "../../config/env.js";
import { ConflictError, UnauthorizedError } from "../../shared/utils/errors.js";

const SALT_ROUNDS = 10;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, phone: user.phone, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

export const registerUser = async ({ name, email, phone, password }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : null;
  const cleanPhone = phone ? phone.trim() : null;

  if (cleanEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      throw new ConflictError("An account with this email address already exists.");
    }
  }

  if (cleanPhone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) {
      throw new ConflictError("An account with this mobile number already exists.");
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
    },
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  };
};

export const loginUser = async ({ email, phone, password }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : null;
  const cleanPhone = phone ? phone.trim() : null;

  let user = null;

  if (cleanEmail) {
    user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  } else if (cleanPhone) {
    user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  }

  if (!user) {
    throw new UnauthorizedError("Invalid email/phone or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email/phone or password.");
  }

  const token = signToken(user);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  };
};

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  return user;
};
