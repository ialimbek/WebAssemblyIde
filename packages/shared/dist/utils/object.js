/**
 * Deep clone an object using structured clone
 */
export function deepClone(obj) {
    return structuredClone(obj);
}
/**
 * Deep merge two objects (source into target)
 */
export function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceVal = source[key];
            const targetVal = result[key];
            if (sourceVal !== null &&
                typeof sourceVal === "object" &&
                !Array.isArray(sourceVal) &&
                targetVal !== null &&
                typeof targetVal === "object" &&
                !Array.isArray(targetVal)) {
                result[key] = deepMerge(targetVal, sourceVal);
            }
            else {
                result[key] = sourceVal;
            }
        }
    }
    return result;
}
//# sourceMappingURL=object.js.map