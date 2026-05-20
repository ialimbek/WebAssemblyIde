/**
 * Deep clone an object using structured clone
 */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

/**
 * Deep merge two objects (source into target)
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceVal = source[key];
      const targetVal = result[key];

      if (
        sourceVal !== null &&
        typeof sourceVal === "object" &&
        !Array.isArray(sourceVal) &&
        targetVal !== null &&
        typeof targetVal === "object" &&
        !Array.isArray(targetVal)
      ) {
        result[key] = deepMerge(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>,
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceVal as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}
