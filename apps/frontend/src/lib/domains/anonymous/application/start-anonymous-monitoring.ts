import { tryPrependProtocol } from '$lib/domains/shared/utils/url';
import {
  AnonymousStartError,
  type AnonymousPreview,
  type AnonymousStartStep,
} from '../domain/anonymous-preview';
import { previewNameFromUrl } from '$lib/domains/shared/utils/address-names';
import { anonymousSessionService } from '../infrastructure/anonymous-session.service';
import { ensureAnonymousSession } from './create-anonymous-session';

export const startAnonymousMonitoring = async (dto: {
  url: string;
  onStep?: (step: AnonymousStartStep) => void;
  onClusterName?: (clusterName: string) => void;
}): Promise<AnonymousPreview> => {
  const url = tryPrependProtocol(dto.url.trim());
  const name = previewNameFromUrl(url);

  try {
    dto.onStep?.('account');
    const { token, clusterId, clusterName, anonymous } =
      await ensureAnonymousSession(url);
    dto.onClusterName?.(clusterName);

    dto.onStep?.('check');
    const monitor = await anonymousSessionService.createMonitor(
      clusterId,
      { name, url },
      token,
    );
    await anonymousSessionService.claimMonitor(monitor.id, token);

    return {
      token,
      clusterId,
      clusterName,
      monitorId: monitor.id,
      url,
      createdAt: Date.now(),
      anonymous,
    };
  } catch (error) {
    throw AnonymousStartError.from(error);
  }
};
