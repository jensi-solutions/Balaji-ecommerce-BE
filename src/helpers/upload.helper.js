import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Define the root uploads directory
const rootUploadsDir = path.resolve(process.cwd(), 'uploads');
const userUploadsDir = path.join(rootUploadsDir, 'users');

// Ensure root and subdirectories exist
if (!fs.existsSync(rootUploadsDir)) {
  fs.mkdirSync(rootUploadsDir, { recursive: true });
}
if (!fs.existsSync(userUploadsDir)) {
  fs.mkdirSync(userUploadsDir, { recursive: true });
}

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetDir = rootUploadsDir;
    if (file.fieldname === 'profile_picture') {
      targetDir = userUploadsDir;
    }
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${timestamp}-${sanitizedOriginalName}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check if the uploaded file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures!'), false);
    }
  },
});

/**
 * Returns file path starting with uploads/ (without base_url prepended)
 * @param {object} req - Express request object
 * @param {string} filePath - File path stored in DB
 * @returns {string|null} Relative path starting with uploads/ (e.g. uploads/users/1728775600000-avatar.png)
 */
export const getFullFileUrl = (req, filePath) => {
  if (!filePath) return null;

  // External URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Normalize backslashes to forward slashes and trim leading slashes
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');

  // If path already starts with uploads/
  if (normalizedPath.startsWith('uploads/')) {
    return normalizedPath;
  }

  // Default to uploads/users/
  return `uploads/users/${normalizedPath}`;
};

export const getFileUrl = getFullFileUrl;
