// Defines Express routes for document management endpoints and maps them to controller methods
import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  streamDocument,
  getDocumentContent,
} from "./document.controller.js";
import { uploadDocumentMiddleware } from "../../shared/middleware/upload.middleware.js";

const router = Router();

// Protect all document endpoints with JWT authentication
router.use(authenticate);

router.get("/", getDocuments);
router.post("/", uploadDocumentMiddleware, createDocument);
router.get("/:id", getDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);
router.get("/:id/stream", streamDocument);
router.get("/:id/content", getDocumentContent);

export default router;
