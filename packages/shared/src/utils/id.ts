let counter = 0;

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix = "id"): string {
  counter += 1;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}_${counter}`;
}

/**
 * Generate a short ID (8 characters)
 */
export function shortId(): string {
  return Math.random().toString(36).substring(2, 10);
}
