// Defines Express routes for document management endpoints and maps them to controller methods
import { Router } from "express";
import { authenticate } from "../../shared/middleware/auth.middleware.js";
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "./document.controller.js";

const router = Router();

// Protect all document endpoints with JWT authentication
router.use(authenticate);

router.get("/", getDocuments);
router.post("/", createDocument);
router.get("/:id", getDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
