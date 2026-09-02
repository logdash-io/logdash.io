import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error';
import { Feature } from '$lib/domains/shared/types';
import { tryPrependProtocol } from '$lib/domains/shared/utils/url';
import {
  AnonymousStartError,
  previewNameFromUrl,
  type AnonymousPreview,
  type AnonymousStartStep,
} from '../domain/anonymous-preview';
import { anonymousSessionService } from '../infrastructure/anonymous-session.service';
import { ensureAnonymousSession } from './create-anonymous-session';

export const startAnonymousMonitoring = async (dto: {
  url: string;
  // eslint-disable-next-line no-unused-vars
  onStep?: (step: AnonymousStartStep) => void;
}): Promise<AnonymousPreview> => {
  const url = tryPrependProtocol(dto.url.trim());
  const name = previewNameFromUrl(url);

  try {
    dto.onStep?.('account');
    const { token, clusterId } = await ensureAnonymousSession();

    dto.onStep?.('project');
    const { projectId } = await anonymousSessionService.createProject(
      clusterId,
      name,
      [Feature.MONITORING],
      token,
    );

    dto.onStep?.('check');
    const monitor = await anonymousSessionService.createMonitor(
      projectId,
      { name, url },
      token,
    );

    return {
      token,
      clusterId,
      projectId,
      monitorId: monitor.id,
      url,
      createdAt: Date.now(),
    };
  } catch (error) {
    throw AnonymousStartError.fromStatus(readHttpErrorStatus(error));
  }
};
