import { redirect, type ServerLoadEvent } from '@sveltejs/kit';
import queryString from 'query-string';

export const load = async ({ url }: ServerLoadEvent): Promise<void> => {
  const feature = url.searchParams.get('feature');
  const project_id = url.searchParams.get('project_id');

  if (project_id) {
    const qs = queryString.stringify({
      ...queryString.parse(url.search),
      project_id,
      feature: undefined,
    });
    redirect(302, `/app/clusters/default/setup/${feature}?${qs}`);
  }

  redirect(302, '/app/auth?needs_account=true');
};
