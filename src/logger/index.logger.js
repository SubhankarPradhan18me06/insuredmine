const winston = require('winston');
const { format } = require('winston');
const { combine, timestamp, printf } = format;
require('winston-daily-rotate-file');

// Define a custom timestamp format that includes timezone offset
const customTimestamp = format((info, opts) => {
  if (opts.timezone) {
    info.timestamp = new Date().toLocaleString('en-US', {
      timeZone: opts.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  }
  return info;
});

const logFormat = printf(({ timestamp, level, message, meta }) => {
  const metaString = meta ? JSON.stringify(meta, null, 2) : '';
  return `[${timestamp}] ${level}: ${message}\n\n${metaString}\n\n`;
});

// Request logger
const requestLogger = winston.createLogger({
  level: 'debug',
  format: combine(customTimestamp({ timezone: 'Asia/Kolkata' }), format.json()),
  transports: [
    new winston.transports.Console(), // Output logs to the console
    new winston.transports.DailyRotateFile({
      level: 'debug',
      dirname: process.env.REQUEST_lOG_PATH,
      filename: 'request-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m', // Set maximum size to 10 MB
      maxFiles: '365d', // Retain logs for 365 days
    }),
  ],
  exitOnError: false,
});

// Response logger
const responseLogger = winston.createLogger({
  level: 'debug',
  format: combine(customTimestamp({ timezone: 'Asia/Kolkata' }), format.json()),
  transports: [
    new winston.transports.Console(), // Output logs to the console
    new winston.transports.DailyRotateFile({
      level: 'debug',
      dirname: process.env.RESPONSE_LOG_PATH,
      filename: 'response-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m', // Set maximum size to 10 MB
      maxFiles: '365d', // Retain logs for 365 days
    }),
  ],
  exitOnError: false,
});

// Database logger
const databaseLogger = winston.createLogger({
  level: 'debug',
  format: combine(customTimestamp({ timezone: 'Asia/Kolkata' }), format.json()),
  transports: [
    new winston.transports.Console(), // Output logs to the console
    new winston.transports.DailyRotateFile({
      level: 'debug',
      dirname: process.env.DATABASE_LOG_PATH,
      filename: 'database-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m', // Set maximum size to 10 MB
      maxFiles: '365d', // Retain logs for 365 days
    }),
  ],
  exitOnError: false,
});

module.exports = {
  requestLogger,
  responseLogger,
  databaseLogger,
};
