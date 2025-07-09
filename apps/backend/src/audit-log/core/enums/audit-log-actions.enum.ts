export enum AuditLogEntityAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export enum AuditLogUserAction {
  GithubLogin = 'githubLogin',
  GotInvitedToCluster = 'gotInvitedToCluster',
  AcceptedInviteToCluster = 'acceptedInviteToCluster',
  RevokedRoleFromCluster = 'revokedRoleFromCluster',
}

export enum AuditLogNotificationChannelAction {
  AddedToMonitor = 'addedToMonitor',
  RemovedFromMonitor = 'removedFromMonitor',
}

export enum AuditLogHttpMonitorAction {
  AddedNotificationChannel = 'addedNotificationChannel',
  RemovedNotificationChannel = 'removedNotificationChannel',
}

export enum AuditLogClusterAction {
  InvitedUser = 'invitedUser',
  AcceptedInvite = 'acceptedInvite',
  RevokedRole = 'revokedRole',
  DeletedInvite = 'deletedInvite',
}

export enum AuditLogCustomDomainAction {
  AttemptIncrease = 'attemptIncrease',
  VerificationSucceeded = 'verificationSucceeded',
  VerificationFailed = 'verificationFailed',
}
