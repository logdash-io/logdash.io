export type MethodKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
