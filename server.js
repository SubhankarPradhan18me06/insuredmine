require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./src/config/db');
const middleware = require('./src/middleware/index.middleware');
const { responseLogger, databaseLogger } = require('./src/logger/index.logger');
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (middleware.security) app.use(middleware.security);

app.get('/healthz', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.use('/api/schedule-message', require('./src/routes/schedule.routes'));
app.use('/api/upload', require('./src/routes/upload.routes'));
app.use('/api/policies', require('./src/routes/policy.routes'));
app.use('/api/users', require('./src/routes/user.routes'));

app.use(middleware.notFound);
app.use(middleware.errorHandler);

const PORT = process.env.PORT || 8600;
let server;

async function start() {
  try {
    
    await connectDB();

    // Load pending scheduled messages from DB into node-schedule
    try {
      const scheduleService = require('./src/service/schedule.service');
      scheduleService.loadAndSchedulePending().catch(err => {
        // log but continue startup
        console.error('[server] Failed to load scheduled jobs', err);
        responseLogger.error('Failed to load scheduled jobs', { message: err.message, stack: err.stack });
      });
    } catch (err) {
      // if schedule service missing, don't crash — just log
      console.warn('[server] schedule.service not available or failed to load', err && err.message);
      responseLogger.warn('schedule.service not available or failed to load', { message: err && err.message });
    }

    // Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`[server] listening on ${PORT} (pid=${process.pid})`);
      responseLogger.info('HTTP server started', { port: PORT, pid: process.pid });
    });

    // Graceful shutdown handler (SIGINT / SIGTERM)
    const shutdown = async (signal) => {
      console.info(`[server] Received ${signal}. Shutting down...`);
      try {
        if (server) {
          server.close(() => console.log('[server] HTTP server closed'));
        }

        // close mongoose connection
        try {
          const mongoose = require('mongoose');
          if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
            databaseLogger.info('[server] MongoDB connection closed');
          }
        } catch (err) {
          databaseLogger.error('[server] Error closing MongoDB connection', { message: err.message, stack: err.stack });
        }

        process.exit(0);
      } catch (err) {
        console.error('[server] Error during shutdown', err);
        process.exit(1);
      }
    };

    // Graceful restart (used by CPU monitor) - exits with non-zero so process manager restarts
    const gracefulRestart = async (reason) => {
      console.warn('[server] Initiating graceful restart due to:', reason);
      responseLogger.warn('Initiating graceful restart', { reason });
      try {
        if (server) {
          server.close(() => responseLogger.info('HTTP server closed for restart'));
        }

        // close mongoose connection
        try {
          const mongoose = require('mongoose');
          if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
            databaseLogger.info('[server] MongoDB connection closed for restart');
          }
        } catch (err) {
          databaseLogger.error('[server] Error closing MongoDB connection for restart', { message: err.message, stack: err.stack });
        }
      } catch (err) {
        responseLogger.error('Error during graceful restart', { message: err.message, stack: err.stack });
      } finally {
        // exit with non-zero so external supervisor can restart
        setTimeout(() => process.exit(1), 1000);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Global handlers
    process.on('unhandledRejection', (reason) => {
      responseLogger.error('Unhandled Rejection', { reason: reason && (reason.stack || reason) });
      // optionally exit after logging
      setTimeout(() => process.exit(1), 1000);
    });

    process.on('uncaughtException', (err) => {
      responseLogger.error('Uncaught Exception', { message: err.message, stack: err.stack });
      // give logger a moment then exit
      setTimeout(() => process.exit(1), 1000);
    });

    // Start CPU monitor (pidusage-based). If CPU exceeds threshold, perform graceful restart.
    try {
      const CpuMonitor = require('./src/service/cpu.monitor');
      const cpuMonitor = new CpuMonitor({
        checkIntervalMs: Number(process.env.CPU_CHECK_INTERVAL_MS) || 5000,
        thresholdPercent: Number(process.env.CPU_THRESHOLD) || 70,
        consecutiveLimit: Number(process.env.CPU_CONSECUTIVE_LIMIT) || 2,
        onThreshold: async ({ cpu }) => {
          // log and trigger graceful restart
          responseLogger.warn('CPU threshold reached, starting graceful restart', { cpu });
          try {
            await gracefulRestart(`CPU_THRESHOLD:${cpu}`);
          } catch (err) {
            responseLogger.error('Error during CPU-triggered graceful restart', { message: err.message, stack: err.stack });
            // fallback forced exit
            setTimeout(() => process.exit(1), 1000);
          }
        }
      });

      cpuMonitor.start();
    } catch (err) {
      // If monitor file missing, continue (do not break server)
      console.warn('[server] cpu.monitor not available or failed to start', err && err.message);
      responseLogger.warn('cpu.monitor not available or failed to start', { message: err && err.message });
    }

  } catch (err) {
    console.error('[server] Failed to start:', err);
    try {
      responseLogger.error('Failed to start server', { message: err.message, stack: err.stack });
    } catch (e) { /* ignore logging error */ }
    process.exit(1);
  }
}

start();

module.exports = app;
