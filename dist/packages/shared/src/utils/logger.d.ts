/** Log levels */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
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
export declare function createLogger(scope: string, level?: LogLevel): Logger;
//# sourceMappingURL=logger.d.ts.map