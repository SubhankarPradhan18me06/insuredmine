const path = require('path');
const uploadService = require('../service/upload.service');

async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required (field name "file")' });
    const filepath = path.resolve(req.file.path);
    const result = await uploadService.runParseWorker(filepath);
    return res.json({ ok: true, insertedPolicies: result.inserted || 0 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { uploadFile };
