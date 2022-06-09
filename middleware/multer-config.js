const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = MIME_TYPES[file.mimetype];
    callback(null, `${uniqueName}.${extension}`);
  }
});

module.exports = multer({ storage: storage, fileFilter: (req, file, callback) => {
  if (!MIME_TYPES[file.mimetype]) {
    return callback(new Error('Seuls les fichiers .jpeg, .jpg et .png sont autorisés'), false);
  } else {
    callback(null, true);
  }
} }).single('image');