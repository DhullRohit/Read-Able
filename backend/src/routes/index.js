// Central route aggregator that mounts all feature routes under their respective API prefixes
import { Router } from "express";
import authRoutes from "../features/auth/auth.routes.js";

const router = Router();

router.use("/auth", authRoutes);

export default router;
