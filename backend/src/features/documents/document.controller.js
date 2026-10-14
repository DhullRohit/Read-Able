// Handles HTTP requests and responses for document management endpoints (upload, retrieve, delete)
import * as documentService from "./document.service.js";
import { sendSuccess } from "../../shared/utils/response.js";

export const getDocuments = async (req, res, next) => {
  try {
    const documents = await documentService.getDocumentsByUser(req.user.id);
    sendSuccess(res, documents);
  } catch (err) {
    next(err);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const document = await documentService.getDocumentById(id, req.user.id);
    sendSuccess(res, document);
  } catch (err) {
    next(err);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const document = await documentService.createDocument(req.user.id, req.body);
    sendSuccess(res, document, "Document created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const document = await documentService.updateDocument(id, req.user.id, req.body);
    sendSuccess(res, document, "Document updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await documentService.deleteDocument(id, req.user.id);
    sendSuccess(res, result, "Document deleted successfully");
  } catch (err) {
    next(err);
  }
};
