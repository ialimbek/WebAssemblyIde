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
export declare function ok<T>(value: T): Success<T>;
/** Create a failure result */
export declare function err<E = Error>(error: E): Failure<E>;
//# sourceMappingURL=result.d.ts.map