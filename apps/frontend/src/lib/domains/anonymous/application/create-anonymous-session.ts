import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error';
import { Feature } from '$lib/domains/shared/types';
import { AnonymousStartError } from '../domain/anonymous-preview';
import { anonymousSessionService } from '../infrastructure/anonymous-session.service';
import { sessionService } from '../infrastructure/session.service';

const QUICK_SETUP_PROJECT_NAME = 'My first service';

const ALL_FEATURES = [Feature.LOGGING, Feature.METRICS, Feature.MONITORING];

export type AnonymousSession = {
  token: string;
  clusterId: string;
};

export type AnonymousSessionProject = {
  clusterId: string;
  projectId: string;
};

export const createAnonymousSession =
  async (): Promise<AnonymousSessionProject> => {
    try {
      const { token, clusterId } = await ensureAnonymousSession();
      const { projectId } = await anonymousSessionService.createProject(
        clusterId,
        QUICK_SETUP_PROJECT_NAME,
        ALL_FEATURES,
        token,
      );

      return { clusterId, projectId };
    } catch (error) {
      throw AnonymousStartError.fromStatus(readHttpErrorStatus(error));
    }
  };

export const ensureAnonymousSession = async (): Promise<AnonymousSession> => {
  const session = await sessionService.probeSession();

  if (session.user && session.token) {
    const clusters = await anonymousSessionService.listClusters(session.token);
    const clusterId = clusters[0]?.id;

    if (!clusterId) {
      throw new Error('The signed in user has no cluster');
    }

    return { token: session.token, clusterId };
  }

  const anonymousUser = await anonymousSessionService.createAnonymousUser();

  await sessionService.installSession(anonymousUser.token);

  return anonymousUser;
};
