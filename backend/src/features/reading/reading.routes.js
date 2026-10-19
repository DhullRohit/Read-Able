/**
 * reading.routes.js
 *
 * Express routes for reading progress endpoints.
 * Mounted at /api/reading in backend/src/routes/index.js.
 */

import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import {
  getProgress,
  saveProgress,
  getUserProgressList,
} from "./reading.controller.js";

const router = Router();

// Protect all reading endpoints with JWT authentication
router.use(authenticate);

// GET /api/reading/progress
router.get("/progress", getUserProgressList);

// GET /api/reading/progress/:documentId
router.get("/progress/:documentId", getProgress);

// POST /api/reading/progress/:documentId
router.post("/progress/:documentId", saveProgress);

export default router;
