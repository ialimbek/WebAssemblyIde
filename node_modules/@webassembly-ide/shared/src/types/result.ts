/** Success result */
export interface Success<T> {
  ok: true;
  value: T;
}

/** Failure result */
export interface Failure<E = Error> {
  ok: false;
  error: E;
}

/** Result type for operations that can fail */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/** Create a success result */
export function ok<T>(value: T): Success<T> {
  return { ok: true, value };
}

/** Create a failure result */
export function err<E = Error>(error: E): Failure<E> {
  return { ok: false, error };
}
