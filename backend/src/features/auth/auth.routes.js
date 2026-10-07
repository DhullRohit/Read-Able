// Defines Express routes for authentication endpoints and maps them to controller methods
import { Router } from "express";
import { register, login, me } from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", me);

export default router;
