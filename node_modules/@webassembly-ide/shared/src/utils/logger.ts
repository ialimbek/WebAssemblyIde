/** Log levels */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/** Logger interface */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Create a scoped logger
 */
export function createLogger(
  scope: string,
  level: LogLevel = LogLevel.INFO,
): Logger {
  const format = (msg: string): string => `[${scope}] ${msg}`;

  return {
    debug(message, ...args) {
      if (level <= LogLevel.DEBUG) {
        console.debug(format(message), ...args);
      }
    },
    info(message, ...args) {
      if (level <= LogLevel.INFO) {
        console.info(format(message), ...args);
      }
    },
    warn(message, ...args) {
      if (level <= LogLevel.WARN) {
        console.warn(format(message), ...args);
      }
    },
    error(message, ...args) {
      if (level <= LogLevel.ERROR) {
        console.error(format(message), ...args);
      }
    },
  };
}
