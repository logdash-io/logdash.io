export type CustomDomain = {
  id: string;
  domain: string;
  publicDashboardId: string;
  attemptCount: number;
  status: 'verifying' | 'verified' | 'failed';
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomDomainDTO = {
  domain: string;
};
