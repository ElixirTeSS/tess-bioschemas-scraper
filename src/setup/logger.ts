const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
    winston.format.printf((info) => `[${info.timestamp}] ${info.message}`)
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/%DATE%.log',
      maxFiles: '14d',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
        winston.format.printf((info) => `[${info.timestamp}] ${info.message}`)
      ),
    })
  );
}

module.exports = logger;
export {};
