import multer from 'multer';
import { paths } from '../config/paths.js';

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
    const ext = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
