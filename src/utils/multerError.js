// Middleware to handle error during file upload
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: 'E00',
      message: 'File upload error: ' + err.message
    });
  }
  next(err);
};

module.exports = {
  uploadErrorHandler
};
