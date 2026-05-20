/**
 * Debounce a function call
 */
export declare function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle a function call
 */
export declare function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=timing.d.ts.map