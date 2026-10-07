// Handles HTTP requests and responses for authentication endpoints (login, register, logout)
import { registerUser, loginUser, getMe } from "./auth.service.js";
import { validateRegister, validateLogin } from "./auth.validation.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { ValidationError, UnauthorizedError } from "../../shared/utils/errors.js";
import { authenticate } from "../../shared/middleware/auth.middleware.js";

export const register = async (req, res, next) => {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) throw new ValidationError(errors[0]);

    const result = await registerUser(req.body);
    sendSuccess(res, result, "Account created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validateLogin(req.body);
    if (errors.length) throw new ValidationError(errors[0]);

    const result = await loginUser(req.body);
    sendSuccess(res, result, "Logged in successfully");
  } catch (err) {
    next(err);
  }
};

export const me = [
  authenticate,
  async (req, res, next) => {
    try {
      const user = await getMe(req.user.id);
      // If the user was deleted after the token was issued, return Unauthorized
      if (!user) {
        return next(new UnauthorizedError("User no longer exists."));
      }
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },
];
