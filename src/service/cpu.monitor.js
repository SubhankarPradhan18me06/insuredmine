const pidusage = require('pidusage');
const { responseLogger } = require('../logger/index.logger');

class CpuMonitor {
  constructor({ checkIntervalMs = 5000, thresholdPercent = 70, consecutiveLimit = 2, onThreshold } = {}) {
    this.checkIntervalMs = checkIntervalMs;
    this.thresholdPercent = thresholdPercent;
    this.consecutiveLimit = consecutiveLimit;
    this.onThreshold = onThreshold;
    this._timer = null;
    this._consecutiveCount = 0;
  }

  async _check() {
    try {
      const stats = await pidusage(process.pid);
      const cpu = Math.round(stats.cpu * 100) / 100; // percent
      responseLogger.info('CPU Monitor check', { cpu });
      if (cpu >= this.thresholdPercent) {
        this._consecutiveCount++;
      } else {
        this._consecutiveCount = 0;
      }

      if (this._consecutiveCount >= this.consecutiveLimit) {
        responseLogger.warn('CPU threshold exceeded', { cpu, threshold: this.thresholdPercent, consecutive: this._consecutiveCount });
        this._consecutiveCount = 0;
        if (typeof this.onThreshold === 'function') {
          try { this.onThreshold({ cpu }); } catch (e) { responseLogger.error('onThreshold handler error', { message: e.message }); }
        }
      }
    } catch (err) {
      responseLogger.error('CPU monitor error', { message: err.message });
    }
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this._check(), this.checkIntervalMs);
    responseLogger.info('CPU Monitor started', { intervalMs: this.checkIntervalMs, threshold: this.thresholdPercent });
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
    responseLogger.info('CPU Monitor stopped');
  }
}

module.exports = CpuMonitor;
