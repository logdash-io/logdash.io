import type { Cluster } from '$lib/clusters/clusters/domain/cluster';
import type { Log } from '$lib/clusters/projects/domain/log';
import type { LogGranularity } from '$lib/clusters/projects/domain/log-granularity';
import type { LogMetric } from '$lib/clusters/projects/domain/log-metric';
import type { Metric } from '$lib/clusters/projects/domain/metric';
import type { Project } from '$lib/clusters/projects/domain/project';
import { redirect } from '@sveltejs/kit';
import { EventSource } from 'eventsource';
import queryString from 'query-string';
import { bffLogger } from './bff-logger';
import type { User } from './user/domain/user';
import { envConfig } from './utils/env-config';
import type { ExposedConfig } from './exposed-config/domain/exposed-config.js';

type UnauthorizedHandler = () => void;

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

	private triggerUnauthorized(): void {
		for (const handler of this.unauthorizedHandlers) {
			handler();
		}
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

	github_login(dto: {
		code: string;
		terms_accepted: boolean;
		email_accepted: boolean;
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
			`${LogdashAPI.v0baseUrl}/projects/${project_id}/logs?${qs}`,
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

	poll_project_log_metrics(
		project_id: string,
		access_token: string,
	): EventSource {
		return this._es_from(
			`${LogdashAPI.v0baseUrl}/projects/${project_id}/log_metrics/sse`,
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
			},
			dto.anon_jwt_token,
		)
			.then((data) => ({ access_token: data.token }))
			.catch((error) => ({ error }));
	}

	async get_me(access_token: string): Promise<User> {
		return this.get<User>(`${LogdashAPI.v0baseUrl}/users/me`, access_token);
	}

	poll_project_logs(project_id: string, access_token: string): EventSource {
		return this._es_from(
			`${LogdashAPI.v0baseUrl}/projects/${project_id}/logs/sse`,
			access_token,
		);
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

	poll_project_metrics(
		project_id: string,
		access_token: string,
	): EventSource {
		return this._es_from(
			`${LogdashAPI.v0baseUrl}/projects/${project_id}/metrics/sse`,
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
		return this.get<ExposedConfig>(
			`${LogdashAPI.v0baseUrl}/exposed_config`,
			'',
		);
	}

	private _es_from(url: string, access_token: string): EventSource {
		return new EventSource(url, {
			fetch: (input, init) =>
				fetch(input, {
					...init,
					headers: {
						...init.headers,
						Authorization: `Bearer ${access_token}`,
					},
				}),
		});
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

		return response.json();
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

export { logdashAPI };
