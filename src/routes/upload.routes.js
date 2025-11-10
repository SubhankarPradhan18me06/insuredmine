const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const uploadController = require('../controller/upload.controller');

// multer storage to uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

router.post('/', upload.single('file'), uploadController.uploadFile);

module.exports = router;
