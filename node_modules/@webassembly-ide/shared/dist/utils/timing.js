/**
 * Debounce a function call
 */
export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = undefined;
        }, delay);
    };
}
/**
 * Throttle a function call
 */
export function throttle(fn, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
//# sourceMappingURL=timing.js.map