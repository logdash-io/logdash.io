export type PartialRecord<K extends PropertyKey, T> = {
  [P in K]?: T;
};
