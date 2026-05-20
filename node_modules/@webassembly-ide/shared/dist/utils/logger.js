/** Log levels */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * Create a scoped logger
 */
export function createLogger(scope, level = LogLevel.INFO) {
    const format = (msg) => `[${scope}] ${msg}`;
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
//# sourceMappingURL=logger.js.map