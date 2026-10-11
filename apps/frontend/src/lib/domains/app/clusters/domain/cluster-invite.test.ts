import { expect, test } from '@playwright/test';
import { ClusterRole, canManageTeam } from './cluster-invite';

test('only the owner and admins manage the team', () => {
  expect(canManageTeam(ClusterRole.CREATOR)).toBe(true);
  expect(canManageTeam(ClusterRole.ADMIN)).toBe(true);
  expect(canManageTeam(ClusterRole.WRITE)).toBe(false);
  expect(canManageTeam(undefined)).toBe(false);
});
