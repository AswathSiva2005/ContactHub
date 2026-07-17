import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';

interface MongoServerError extends Error { code?: number; keyValue?: Record<string, unknown> }

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const requestId = String(response.locals.requestId ?? '');
  console.error({ requestId, method: request.method, path: request.path, error });
  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: Object.values(error.errors).map((item) => item.message), requestId },
    });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({ success: false, error: { message: `Invalid ${error.path}`, requestId } });
    return;
  }
  const mongoError = error as MongoServerError;
  if (mongoError.code === 11000) {
    response.status(409).json({ success: false, error: { message: 'A record with this identifier already exists', fields: mongoError.keyValue, requestId } });
    return;
  }
  response.status(500).json({ success: false, error: { message: 'Internal server error', requestId } });
};
