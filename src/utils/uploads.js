const fs   = require('fs');
const path = require('path');

/**
 * Deletes a locally stored upload file given its full URL.
 * Only acts on local /uploads/ URLs — ignores null, external CDN links, etc.
 * Errors are logged but never thrown so a cleanup failure never breaks a request.
 */
const deleteLocalFile = (fileUrl) => {
  if (!fileUrl || !fileUrl.includes('/uploads/')) return;
  const filename = fileUrl.split('/uploads/')[1];
  if (!filename) return;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`Failed to delete uploaded file: ${filePath}`, err.message);
    }
  });
};

module.exports = { deleteLocalFile };
