import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Define the root uploads directory
const rootUploadsDir = path.resolve(process.cwd(), 'uploads');
const userUploadsDir = path.join(rootUploadsDir, 'users');
const categoryUploadsDir = path.join(rootUploadsDir, 'categories');
const collectionUploadsDir = path.join(rootUploadsDir, 'collections');
const productUploadsDir = path.join(rootUploadsDir, 'products');

// Ensure root and subdirectories exist
[rootUploadsDir, userUploadsDir, categoryUploadsDir, collectionUploadsDir, productUploadsDir].forEach(
  (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
);

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetDir = rootUploadsDir;

    const baseUrl = req.baseUrl || '';

    if (file.fieldname === 'profile_picture') {
      targetDir = userUploadsDir;
    } else if (baseUrl.includes('categories') || file.fieldname === 'category_image') {
      targetDir = categoryUploadsDir;
    } else if (baseUrl.includes('collections') || file.fieldname === 'banner_image') {
      targetDir = collectionUploadsDir;
    } else if (
      baseUrl.includes('products') ||
      file.fieldname === 'main_image' ||
      file.fieldname === 'multiple_images'
    ) {
      targetDir = productUploadsDir;
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
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check if the uploaded file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

/**
 * Returns relative file path starting with uploads/
 * @param {object} req - Express request object
 * @param {string} filePath - File path stored in DB
 * @param {string} defaultFolder - Default folder if not prefixed (e.g. 'users', 'categories', 'products')
 * @returns {string|null} Relative path starting with uploads/
 */
export const getFullFileUrl = (req, filePath, defaultFolder = 'users') => {
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

  return `uploads/${defaultFolder}/${normalizedPath}`;
};

export const getFileUrl = getFullFileUrl;
