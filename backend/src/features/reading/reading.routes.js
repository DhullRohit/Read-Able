/**
 * reading.routes.js
 *
 * Aggregate reading endpoints mounted at /api/reading in backend/src/routes/index.js.
 */

import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import {
  getRecent,
  getBookmarks,
  getNotes,
  getReading,
  saveProgress,
} from "./reading.controller.js";
import documentReadingRoutes from "./reading.document.routes.js";

const router = Router();

// Protect all reading endpoints with JWT authentication
router.use(authenticate);

// Aggregate endpoints
router.get("/recent", getRecent);
router.get("/bookmarks", getBookmarks);
router.get("/notes", getNotes);

// Compatibility / direct reading routes under /api/reading/:documentId/*
router.get("/progress/:documentId", (req, res, next) => {
  req.params.documentId = req.params.documentId;
  return getReading(req, res, next);
});
router.post("/progress/:documentId", (req, res, next) => {
  req.params.documentId = req.params.documentId;
  return saveProgress(req, res, next);
});
router.put("/progress/:documentId", (req, res, next) => {
  req.params.documentId = req.params.documentId;
  return saveProgress(req, res, next);
});

router.use("/:documentId", documentReadingRoutes);

export default router;
