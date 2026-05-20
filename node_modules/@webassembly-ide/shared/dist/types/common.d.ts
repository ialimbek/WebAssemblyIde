/** Make all properties of T optional recursively */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
/** A value that can be null */
export type Nullable<T> = T | null;
/** A value that can be undefined */
export type Optional<T> = T | undefined;
/** Async result wrapper */
export type AsyncResult<T> = Promise<T>;
/** Generic callback */
export type Callback<T = void> = () => T;
/** Generic callback with one argument */
export type CallbackWithArg<TArg, TResult = void> = (arg: TArg) => TResult;
//# sourceMappingURL=common.d.ts.map