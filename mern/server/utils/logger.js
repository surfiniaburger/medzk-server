// server/utils/logger.js
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Define log directory
const logDirectory = path.join(process.cwd(), 'logs');

// Create a daily rotate file transport
const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: 'application-%DATE%.log',
  dirname: logDirectory,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d' // Keep logs for 14 days
});

// Create the logger instance
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Capture stack traces
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    dailyRotateFileTransport
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDirectory, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDirectory, 'rejections.log') })
  ]
});

export default logger;
