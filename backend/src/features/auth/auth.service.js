// Contains business logic for authentication operations: token generation, password hashing, and user verification
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/database.js";
import { config } from "../../config/env.js";
import { ConflictError, UnauthorizedError } from "../../shared/utils/errors.js";

// JWT payload contains only the user ID (minimum required information)
const signToken = (userId) =>
  jwt.sign(
    { id: userId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

// Normalize phone: strip all spaces, dashes, and parentheses for consistent storage/lookup
const normalizePhone = (phone) =>
  phone.replace(/[\s\-().]/g, "").trim();

export const registerUser = async ({ name, email, phone, password }) => {
  const cleanEmail = email ? email.toLowerCase().trim() : null;
  const cleanPhone = phone ? normalizePhone(phone) : null;

  if (cleanEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      throw new ConflictError("An account with this email address already exists.");
    }
  }

  if (cleanPhone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existingPhone) {
      throw new ConflictError("An account with this phone number already exists.");
    }
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
    },
  });

  const token = signToken(user.id);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  };
};

export const loginUser = async ({ email, phone, identifier, password }) => {
  let lookupEmail = email;
  let lookupPhone = phone;

  if (identifier && !lookupEmail && !lookupPhone) {
    if (identifier.includes("@")) {
      lookupEmail = identifier;
    } else {
      lookupPhone = identifier;
    }
  }

  const cleanEmail = lookupEmail ? lookupEmail.toLowerCase().trim() : null;
  const cleanPhone = lookupPhone ? normalizePhone(lookupPhone) : null;

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

  const token = signToken(user.id);
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

  if (!user) {
    throw new UnauthorizedError("User no longer exists.");
  }

  return user;
};