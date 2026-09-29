export enum Action {
  None = 'none',
  Read = 'read',
  Write = 'write',
  Delete = 'delete',
}

export const ACTION_RANK: Record<Action, number> = {
  [Action.None]: 0,
  [Action.Read]: 1,
  [Action.Write]: 2,
  [Action.Delete]: 3,
};
