import type { Cluster } from '$lib/domains/app/clusters/domain/cluster';
import type { Log } from '$lib/domains/app/projects/domain/log';
import type { LogGranularity } from '$lib/domains/app/projects/domain/log-granularity';
import type { LogMetric } from '$lib/domains/app/projects/domain/log-metric';
import type { Metric } from '$lib/domains/app/projects/domain/metric';
import type { HttpPing } from '$lib/domains/app/projects/domain/monitoring/http-ping.js';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
import type { Project } from '$lib/domains/app/projects/domain/project';
import type { PublicDashboardData } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard-data.js';
import type { PublicDashboard } from '$lib/domains/app/projects/domain/public-dashboards/public-dashboard.js';
import type {
  NotificationChannel,
  TelegramChatInfo,
} from '$lib/domains/app/projects/domain/telegram/telegram.types';
import { redirect } from '@sveltejs/kit';
import queryString from 'query-string';
import { envConfig } from '$lib/domains/shared/utils/env-config';
import type { User } from '$lib/domains/shared/user/domain/user';
import { bffLogger } from '$lib/domains/shared/bff-logger';
import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config';

type UnauthorizedHandler = () => void;

/**
 * @deprecated Use infrastructure layer services instead (e.g., ClusterInvitesService)
 * This class is being phased out in favor of the layered architecture approach
 */
class LogdashAPI {
  private static readonly v0baseUrl = envConfig.apiBaseUrl;
  private unauthorizedHandlers: UnauthorizedHandler[] = [];

  registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
    this.unauthorizedHandlers.push(handler);
    return () => {
      this.unauthorizedHandlers = this.unauthorizedHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  create_anonymous_user(): Promise<{
    access_token: string;
    cluster_id: string;
  }> {
    return this.post<{ token: string; cluster: { id: string } }>(
      `${LogdashAPI.v0baseUrl}/users/anonymous`,
      {},
      '',
    ).then(({ token, cluster }) => ({
      access_token: token,
      cluster_id: cluster.id,
    }));
  }

  create_cluster(name: string, access_token: string): Promise<Cluster> {
    return this.post<Cluster>(
      `${LogdashAPI.v0baseUrl}/users/me/clusters`,
      { name },
      access_token,
    );
  }

  update_cluster(
    cluster_id: string,
    update: Partial<{ name: string }>,
    access_token: string,
  ): Promise<Cluster> {
    return this.put<Cluster>(
      `${LogdashAPI.v0baseUrl}/clusters/${cluster_id}`,
      update,
      access_token,
    );
  }

  delete_cluster(cluster_id: string, access_token: string): Promise<void> {
    return this.performFetch<void>(
      `${LogdashAPI.v0baseUrl}/clusters/${cluster_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      access_token,
    );
  }

  create_project(
    name: string,
    cluster_id: string,
    access_token: string,
  ): Promise<{ project: Project; apiKey: string }> {
    return this.post<{ project: Project; apiKey: string }>(
      `${LogdashAPI.v0baseUrl}/clusters/${cluster_id}/projects`,
      { name },
      access_token,
    );
  }

  update_project(
    project_id: string,
    update: Partial<{ name: string }>,
    access_token: string,
  ): Promise<Project> {
    return this.put<Project>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}`,
      update,
      access_token,
    );
  }

  delete_project(project_id: string, access_token: string): Promise<void> {
    return this.performFetch<void>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      access_token,
    );
  }

  github_login(dto: {
    code: string;
    terms_accepted: boolean;
    email_accepted: boolean;
    is_local_env: boolean;
  }): Promise<{
    access_token?: string;
    error?: string;
  }> {
    return this.post<{ token: string }>(
      `${LogdashAPI.v0baseUrl}/auth/github/login`,
      {
        githubCode: dto.code,
        termsAccepted: dto.terms_accepted,
        emailAccepted: dto.email_accepted,
        forceLocalLogin: dto.is_local_env,
      },
    )
      .then((data) => ({ access_token: data.token }))
      .catch((error) => ({ error }));
  }

  get_project_api_keys(
    access_token: string,
    project_id: string,
  ): Promise<string[]> {
    return this.get<
      {
        id: string;
        value: string;
        projectId: string;
      }[]
    >(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/api_keys`,
      access_token,
    ).then((keys) => keys.map((k) => k.value));
  }

  get_project_logs(
    project_id: string,
    access_token: string,
    limit: number = 50,
    before?: string,
  ): Promise<Log[]> {
    const qs = queryString.stringify({
      limit,
      lastId: before,
      ...(before && { direction: 'before' }),
    });

    return this.get<Log[]>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/logs/v2?${qs}`,
      access_token,
    );
  }

  get_project_log_metrics(
    project_id: string,
    access_token: string,
  ): Promise<Record<LogGranularity, LogMetric[]>> {
    return this.get<Record<LogGranularity, LogMetric[]>>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/log_metrics`,
      access_token,
    );
  }

  delete_metric(
    project_id: string,
    metric_id: string,
    access_token: string,
  ): Promise<void> {
    return this.performFetch<void>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/metric-register/${metric_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      access_token,
    );
  }

  async claim_account(dto: {
    github_code: string;
    anon_jwt_token: string;
    terms_accepted: boolean;
    email_accepted: boolean;
    is_local_env: boolean;
  }): Promise<{
    access_token?: string;
    error?: string;
  }> {
    return this.post<{ token: string }>(
      `${LogdashAPI.v0baseUrl}/auth/github/claim`,
      {
        githubCode: dto.github_code,
        accessToken: dto.anon_jwt_token,
        termsAccepted: dto.terms_accepted,
        emailAccepted: dto.email_accepted,
        forceLocalLogin: dto.is_local_env,
      },
      dto.anon_jwt_token,
    )
      .then((data) => ({ access_token: data.token }))
      .catch((error) => ({ error }));
  }

  async get_me(access_token: string): Promise<User> {
    return this.get<User>(`${LogdashAPI.v0baseUrl}/users/me`, access_token);
  }

  get_cluster_projects(
    cluster_id: string,
    access_token: string,
  ): Promise<Project[]> {
    return this.get<Project[]>(
      `${LogdashAPI.v0baseUrl}/clusters/${cluster_id}/projects`,
      access_token,
    );
  }

  /**
   * @deprecated Use ClusterService.getClusters() instead
   * @param access_token
   * @returns
   */
  get_user_clusters(access_token: string): Promise<Cluster[]> {
    return this.get<Cluster[]>(
      `${LogdashAPI.v0baseUrl}/users/me/clusters`,
      access_token,
    );
  }

  get_telegram_invite_link(access_token: string): Promise<{ url: string }> {
    return this.get<{ url: string }>(
      `${LogdashAPI.v0baseUrl}/support/telegram/invite-link`,
      access_token,
    );
  }

  get_telegram_chat_info(passphrase: string): Promise<TelegramChatInfo> {
    const cookies = document?.cookie || '';
    const tokenMatch = cookies.match(/access_token=([^;]+)/);
    const accessToken = tokenMatch ? tokenMatch[1] : '';

    return this.get<TelegramChatInfo>(
      `${LogdashAPI.v0baseUrl}/notification_channel_setup/telegram/chat_info?passphrase=${encodeURIComponent(passphrase)}`,
      accessToken,
    );
  }

  create_telegram_notification_channel(
    clusterId: string,
    options: { chatId: string },
  ): Promise<NotificationChannel> {
    const cookies = document?.cookie || '';
    const tokenMatch = cookies.match(/access_token=([^;]+)/);
    const accessToken = tokenMatch ? tokenMatch[1] : '';

    return this.post<NotificationChannel>(
      `${LogdashAPI.v0baseUrl}/clusters/${clusterId}/notification_channels`,
      {
        type: 'telegram',
        options: {
          chatId: options.chatId,
        },
      },
      accessToken,
    );
  }

  get_project_metrics(
    project_id: string,
    access_token: string,
  ): Promise<Metric[]> {
    return this.get<Metric[]>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/metrics`,
      access_token,
    );
  }

  get_metric_details(
    project_id: string,
    metric_id: string,
    access_token: string,
  ): Promise<Metric> {
    return this.get<Metric>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/metrics/${metric_id}`,
      access_token,
    );
  }

  stripe_checkout(access_token: string): Promise<{ checkoutUrl: string }> {
    return this.get<{ checkoutUrl: string }>(
      `${LogdashAPI.v0baseUrl}/payments/stripe/checkout`,
      access_token,
    );
  }

  stripe_billing_portal(
    access_token: string,
  ): Promise<{ customerPortalUrl: string }> {
    return this.get<{ customerPortalUrl: string }>(
      `${LogdashAPI.v0baseUrl}/payments/stripe/customer_portal`,
      access_token,
    );
  }

  get_demo_project_config(): Promise<{
    projectId: Project['id'];
    clusterId: Cluster['id'];
  }> {
    return this.get<{
      projectId: Project['id'];
      clusterId: Cluster['id'];
    }>(`${LogdashAPI.v0baseUrl}/demo`, '');
  }

  send_test_log(
    project_id: string,
    client_ip: string,
    access_token: string,
  ): Promise<void> {
    bffLogger.debug(
      `Sending test log to project ${project_id} from client IP ${client_ip}`,
    );
    return this.post<void>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/test-log`,
      {
        ip: client_ip,
      },
      access_token,
    );
  }

  get_exposed_config(): Promise<ExposedConfig> {
    console.log(
      '`${LogdashAPI.v0baseUrl}/exposed_config`:',
      `${LogdashAPI.v0baseUrl}/exposed_config`,
    );
    return this.get<ExposedConfig>(
      `${LogdashAPI.v0baseUrl}/exposed_config`,
      '',
    );
  }

  get_monitors(cluster_id: string, access_token: string): Promise<Monitor[]> {
    return this.get<Monitor[]>(
      `${LogdashAPI.v0baseUrl}/clusters/${cluster_id}/http_monitors`,
      access_token,
    );
  }

  get_monitor_pings(dto: {
    project_id: string;
    monitor_id: string;
    access_token: string;
    limit: number;
  }): Promise<HttpPing[]> {
    const qs = queryString.stringify({
      limit: dto.limit ?? 50,
    });
    return this.get<HttpPing[]>(
      `${LogdashAPI.v0baseUrl}/projects/${dto.project_id}/monitors/${dto.monitor_id}/http_pings?${qs}`,
      dto.access_token,
    );
  }

  create_monitor(
    project_id: string,
    monitor: {
      url: string;
      name: string;
    },
    access_token: string,
  ): Promise<Monitor> {
    console.log(
      `Creating monitor for project ${project_id} with data:`,
      monitor,
      access_token,
    );

    return this.post<Monitor>(
      `${LogdashAPI.v0baseUrl}/projects/${project_id}/http_monitors`,
      monitor,
      access_token,
    );
  }

  create_public_dashboard(
    cluster_id: string,
    access_token: string,
  ): Promise<PublicDashboard> {
    return this.post<PublicDashboard>(
      `${LogdashAPI.v0baseUrl}/clusters/${cluster_id}/public_dashboards`,
      {
        name: `Status Page`,
        isPublic: false,
      },
      access_token,
    );
  }

  update_public_dashboard(
    dashboard_id: string,
    update: Partial<{ name: string; isPublic: boolean }>,
    access_token: string,
  ): Promise<PublicDashboard> {
    return this.put<PublicDashboard>(
      `${LogdashAPI.v0baseUrl}/public_dashboards/${dashboard_id}`,
      update,
      access_token,
    );
  }

  get_public_dashboards(
    cluster_id: string,
    access_token: string,
  ): Promise<PublicDashboard[]> {
    return this.get<PublicDashboard[]>(
      `${LogdashAPI.v0baseUrl}/clusters/${cluster_id}/public_dashboards`,
      access_token,
    );
  }

  get_public_dashboard_data(
    dashboard_id: string,
    access_token: string,
    period: '24h' | '7d' | '90d' = '90d',
  ): Promise<PublicDashboardData> {
    return this.get<PublicDashboardData>(
      `${LogdashAPI.v0baseUrl}/public_dashboards/${dashboard_id}/data?period=${period}`,
      access_token,
    );
  }

  get_public_dashboard_public_data(
    dashboard_id: string,
    period: '24h' | '7d' | '90d' = '90d',
  ): Promise<PublicDashboardData> {
    return this.get<PublicDashboardData>(
      `${LogdashAPI.v0baseUrl}/public_dashboards/${dashboard_id}/public_data?period=${period}`,
      '',
    );
  }

  add_http_monitor_to_public_dashboard(
    dashboard_id: string,
    monitor_id: string,
    access_token: string,
  ): Promise<PublicDashboard> {
    return this.post<PublicDashboard>(
      `${LogdashAPI.v0baseUrl}/public_dashboards/${dashboard_id}/monitors/${monitor_id}`,
      {},
      access_token,
    );
  }

  remove_http_monitor_from_public_dashboard(
    dashboard_id: string,
    monitor_id: string,
    access_token: string,
  ): Promise<PublicDashboard> {
    return this.performFetch<PublicDashboard>(
      `${LogdashAPI.v0baseUrl}/public_dashboards/${dashboard_id}/monitors/${monitor_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      access_token,
    );
  }

  private triggerUnauthorized(): void {
    for (const handler of this.unauthorizedHandlers) {
      handler();
    }
  }

  private async performFetch<T>(
    url: string,
    options: RequestInit,
    access_token?: string,
  ): Promise<T> {
    if (access_token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${access_token}`,
      };
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
      this.triggerUnauthorized();
      throw new Error('Unauthorized: Your session has expired');
    }

    if (!response.ok) {
      const p = await response.json();
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}${
          response.body ? ` {${JSON.stringify(p)}}` : ''
        }`,
      );
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  private get<T>(url: string, access_token: string): Promise<T> {
    return this.performFetch<T>(
      url,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      access_token,
    );
  }

  private post<T>(
    url: string,
    body: unknown,
    access_token?: string,
  ): Promise<T> {
    bffLogger.info(
      JSON.stringify({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token && {
            Authorization: `Bearer {access_token}`,
          }),
        },
        body: JSON.stringify(body),
      }),
    );

    return this.performFetch<T>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      access_token,
    );
  }

  private put<T>(
    url: string,
    body: unknown,
    access_token?: string,
  ): Promise<T> {
    return this.performFetch<T>(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      access_token,
    );
  }
}

const logdashAPI = new LogdashAPI();

logdashAPI.registerUnauthorizedHandler(() => {
  console.log('Unauthorized: Your session has expired');
  redirect(302, '/app/auth');
});

/**
 * @deprecated Use infrastructure layer services instead (e.g., ClusterInvitesService)
 */
export { logdashAPI };
