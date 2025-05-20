import { MethodKeys } from './method-keys';

export type PublicMethods<T> = Pick<T, MethodKeys<T>>;
