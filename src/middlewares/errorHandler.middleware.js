// 404 Not Found Middleware
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  // Handle Multer upload errors cleanly
  if (err.name === 'MulterError') {
    let message = err.message;
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected file field '${err.field}'. Please verify your form-data field keys.`;
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large. Maximum allowed size is 15MB.';
    }

    return res.status(400).json({
      success: false,
      message,
      field: err.field,
      code: err.code,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
