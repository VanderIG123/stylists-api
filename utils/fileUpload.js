import multer from 'multer';
import { paths } from '../config/paths.js';
import { env } from '../config/env.js';

// Allowed image MIME types and extensions for uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// Max file sizes (from environment variables)
const MAX_PROFILE_PICTURE_SIZE = env.MAX_PROFILE_PICTURE_SIZE;
const MAX_PORTFOLIO_PICTURE_SIZE = env.MAX_PORTFOLIO_PICTURE_SIZE;

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      cb(null, paths.profilesDir);
    } else if (file.fieldname === 'portfolioPictures') {
      cb(null, paths.portfolioDir);
    } else {
      cb(null, paths.uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname || '';
    const ext = originalName.includes('.') ? originalName.split('.').pop().toLowerCase() : '';
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : 'bin';
    cb(null, `${file.fieldname}-${uniqueSuffix}.${safeExt}`);
  }
});

// File filter to validate type and per-field size
const fileFilter = (req, file, cb) => {
  const mimeType = file.mimetype;
  const originalName = file.originalname || '';
  const ext = originalName.includes('.') ? originalName.split('.').pop().toLowerCase() : '';

  // Validate MIME type and extension
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mimeType);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!isMimeAllowed || !isExtAllowed) {
    return cb(
      Object.assign(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'), {
        status: 400
      })
    );
  }

  // Note: Multer's global file size limit is enforced via `limits.fileSize` below.
  // Here we can enforce stricter per-field limits based on the `content-length` header
  // as an approximation (exact per-file size is only known after streaming).
  try {
    const contentLengthHeader = req.headers['content-length'];
    const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;

    if (Number.isFinite(totalBytes)) {
      if (file.fieldname === 'profilePicture' && totalBytes > MAX_PROFILE_PICTURE_SIZE) {
        const maxMB = Math.round(MAX_PROFILE_PICTURE_SIZE / 1024 / 1024);
        return cb(
          Object.assign(new Error(`Profile picture is too large. Maximum size is ${maxMB}MB.`), {
            status: 400
          })
        );
      }

      if (file.fieldname === 'portfolioPictures' && totalBytes > MAX_PORTFOLIO_PICTURE_SIZE) {
        const maxMB = Math.round(MAX_PORTFOLIO_PICTURE_SIZE / 1024 / 1024);
        return cb(
          Object.assign(new Error(`Portfolio image is too large. Maximum size is ${maxMB}MB.`), {
            status: 400
          })
        );
      }
    }
  } catch {
    // If we cannot parse content length, fall back to Multer's global limit
  }

  cb(null, true);
};

// Placeholder for malware scanning hook.
// In a real production environment, integrate with an antivirus engine
// (e.g., ClamAV) here, after upload and before using the file.
// For now, this is a no-op that always resolves successfully.
export const scanUploadedFile = async (file) => {
  // Example shape of `file`: { path, mimetype, size, filename, fieldname, ... }
  // TODO: Integrate with a real malware scanning service.
  return true;
};

export const upload = multer({
  storage,
  fileFilter,
  // Global hard limit (safety net). Per-field checks above are stricter.
  limits: { fileSize: env.MAX_FILE_SIZE }
});

