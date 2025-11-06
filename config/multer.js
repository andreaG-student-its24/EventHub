import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crea la directory uploads se non esiste
const uploadDir = './public/uploads/events';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurazione storage per Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Genera un nome unico per il file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'event-' + uniqueSuffix + ext);
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  // Tipi MIME accettati
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato file non supportato. Usa solo: JPG, JPEG, PNG, GIF, WEBP'), false);
  }
};

// Configurazione Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite 5MB
  }
});

export default upload;
