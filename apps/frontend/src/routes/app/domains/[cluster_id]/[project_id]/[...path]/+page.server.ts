import { redirect } from '@sveltejs/kit';
import { match } from 'ts-pattern';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
  const domainPath = `/app/domains/${params.cluster_id}`;
  const [section, metricId] = params.path.split('/');
  const { projects } = await parent();
  const app = projects.find(({ id }) => id === params.project_id)?.name;

  redirect(
    308,
    match(section)
      .with('metrics', () =>
        metricId
          ? `${domainPath}/metrics/${metricId}`
          : `${domainPath}/metrics`,
      )
      .with('settings', () => `${domainPath}/settings`)
      .with('monitoring', () => `${domainPath}/uptime`)
      .otherwise(() =>
        app
          ? `${domainPath}/logs?app=${encodeURIComponent(app)}`
          : `${domainPath}/logs`,
      ),
  );
};
