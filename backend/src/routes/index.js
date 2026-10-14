// Central route aggregator that mounts all feature routes under their respective API prefixes
import { Router } from "express";
import authRoutes from "../features/auth/auth.routes.js";
import documentRoutes from "../features/documents/document.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);

export default router;
