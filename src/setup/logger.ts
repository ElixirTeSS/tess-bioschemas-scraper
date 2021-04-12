import { Logger, createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const logger: Logger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
    format.printf((info) => `[${info.timestamp}] ${info.message}`)
  ),
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/%DATE%.log',
      maxFiles: '14d',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
        format.printf((info) => `[${info.timestamp}] ${info.message}`)
      ),
    })
  );
}

export { logger };
