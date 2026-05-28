export type AccessRestriction =
  | { kind: 'all' }
  | { kind: 'clusters'; ids: string[] }
  | { kind: 'projects'; ids: string[] };
