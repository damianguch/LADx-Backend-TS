import { createLogger, format, transports, addColors } from 'winston';

addColors({
  info: 'blue',
  error: 'red',
  warn: 'yellow'
});

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }), // Apply color to level
        format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      )
    }),
    new transports.File({ filename: 'app.log' })
  ]
});

export default logger;
