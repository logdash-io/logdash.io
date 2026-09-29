import {
  AnonymousStartError,
  clusterNameFromUrl,
} from '../domain/anonymous-preview';
import { anonymousSessionService } from '../infrastructure/anonymous-session.service';
import { sessionService } from '../infrastructure/session.service';

export type AnonymousSession = {
  token: string;
  clusterId: string;
  clusterName: string;
  anonymous: boolean;
};

export const hasClaimedAccount = async (): Promise<boolean> => {
  const { user } = await sessionService.probeSession();

  return !!user && user.accountClaimStatus !== 'anonymous';
};

export const ensureAnonymousSession = async (
  firstUrl: string,
): Promise<AnonymousSession> => {
  const clusterName = clusterNameFromUrl(firstUrl);
  const session = await sessionService.probeSession();

  if (session.unavailable) {
    throw AnonymousStartError.fromStatus();
  }

  if (session.user && session.token) {
    const clusters = await anonymousSessionService.listClusters(session.token);
    const cluster = clusters[0];

    if (!cluster) {
      throw new Error('The signed in user has no cluster');
    }

    return {
      token: session.token,
      clusterId: cluster.id,
      clusterName: cluster.name,
      anonymous: session.user.accountClaimStatus === 'anonymous',
    };
  }

  const anonymousUser = await anonymousSessionService.createAnonymousUser(
    await clusterName,
  );

  await sessionService.installSession(anonymousUser.token);

  return { ...anonymousUser, anonymous: true };
};
