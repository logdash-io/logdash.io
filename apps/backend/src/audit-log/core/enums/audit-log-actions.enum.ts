export enum AuditLogEntityAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export enum AuditLogUserAction {
  GithubLogin = 'githubLogin',
}

export enum AuditLogNotificationChannelAction {
  AddedToMonitor = 'addedToMonitor',
  RemovedFromMonitor = 'removedFromMonitor',
}

export enum AuditLogHttpMonitorAction {
  AddedNotificationChannel = 'addedNotificationChannel',
  RemovedNotificationChannel = 'removedNotificationChannel',
}
