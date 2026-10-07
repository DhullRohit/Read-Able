// Utility functions for sending standardized API responses (success, error, paginated) across all endpoints

export const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res, message = "Internal server error", statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};
