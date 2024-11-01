import { createLogger, format, transports, addColors } from 'winston';

// Define custom log levels, including 'success'
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    success: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    success: 'green',
    debug: 'gray'
  }
};

addColors(customLevels.colors);

const logger = createLogger({
  levels: customLevels.levels,
  level: 'debug',
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
