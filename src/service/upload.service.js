const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');
const { requestLogger } = require('../logger/index.logger');

function runParseWorker(filepath) {
  return new Promise((resolve, reject) => {
    const workerFile = path.resolve(__dirname, 'parse.worker.js');
    const worker = new Worker(workerFile, { workerData: { filepath } });

    // Helper: safely delete a file
    const deleteFile = () => {
      try {
        fs.unlinkSync(filepath);
        requestLogger.info(`Deleted successfully processed file: ${filepath}`);
      } catch (e) {
        requestLogger.warn(`Could not delete file ${filepath}: ${e.message}`);
      }
    };

    // Helper: move failed file into timestamped folder
    const moveToFailedWithTimestamp = (errorMsg) => {
      try {
        const failedBaseDir = path.resolve('failed_uploads');
        // Format timestamp (YYYY-MM-DD_HH-MM-SS)
        const timestamp = new Date().toISOString()
          .replace(/:/g, '-')
          .replace('T', '_')
          .split('.')[0]; // e.g., 2025-11-10_22-48-12
        const failedDir = path.join(failedBaseDir, timestamp);

        // Ensure folder exists
        fs.mkdirSync(failedDir, { recursive: true });

        // Move file into new folder
        const fileName = path.basename(filepath);
        const failedPath = path.join(failedDir, fileName);

        fs.renameSync(filepath, failedPath);
        requestLogger.error(`Upload failed. File saved to: ${failedPath}`, { error: errorMsg });
      } catch (err) {
        requestLogger.error(`Failed to move errored file ${filepath}: ${err.message}`);
      }
    };

    // Worker listeners
    worker.on('message', (msg) => {
      if (msg && msg.error) {
        // Worker error — keep file for debugging
        moveToFailedWithTimestamp(msg.error);
        return reject(new Error(msg.error));
      } else {
        // Worker success — delete file
        deleteFile();
        return resolve(msg);
      }
    });

    worker.on('error', (err) => {
      // Worker crashed — move file for debugging
      moveToFailedWithTimestamp(err.message);
      requestLogger.error('Worker thread crashed', { message: err.message, stack: err.stack });
      return reject(err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        requestLogger.error(`Worker stopped unexpectedly with exit code ${code}`);
      }
    });
  });
}

module.exports = { runParseWorker };
