import { createLogDash } from '@logdash/js-sdk';

interface ProjectResponse {
  projectId: string;
  value: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiClient {
  public async createProject(): Promise<ProjectResponse> {
    const response = await fetch('https://api.logdash.io/api_keys/anonymous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    return response.json();
  }

  public async recordLog(apiKey: string, message: string): Promise<void> {
    const response = await fetch('https://api.logdash.io/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'project-api-key': apiKey,
      },
      body: JSON.stringify({
        createdAt: new Date().toISOString(),
        level: 'info',
        message,
      }),
    });

    if (!response.ok) {
      console.log('Failed to record log');
      console.log(await response.text());
    }
  }

  public async readProjectStats(
    apiKey: string,
    projectId: string,
  ): Promise<Record<string, number>> {
    const response = await fetch('https://api.logdash.io/auth/api_key/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
      }),
    });

    if (!response.ok) {
      console.log('Failed to read token');
      console.log(await response.text());
    }

    const { token } = await response.json();

    const logMetricsResponse = await fetch(
      `https://api.logdash.io/projects/${projectId}/log_metrics?granularity=hour`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!logMetricsResponse.ok) {
      console.log('Failed to read log metrics');
      console.log(await logMetricsResponse.text());
    }

    return (await logMetricsResponse.json())[0].values ?? {};
  }
}

async function main() {
  const numberOfProjects = 20;
  const numberOfLogsPerProject = 20;

  const apiClient = new ApiClient();

  console.log('Creating projects...');

  const projects = await Promise.all(
    Array.from({ length: numberOfProjects }).map(() =>
      apiClient.createProject(),
    ),
  );

  console.log('Ingesting logs...');

  await Promise.all(
    projects.map((project) =>
      Promise.all(
        Array.from({ length: numberOfLogsPerProject }).map(() =>
          apiClient.recordLog(project.value, 'Hello, world!'),
        ),
      ),
    ),
  );

  console.log('Waiting for logs to be processed...');
  await sleep(2000);

  console.log('Reading stats...');

  for (const project of projects) {
    const values = await apiClient.readProjectStats(
      project.value,
      project.projectId,
    );

    console.log(values);
  }
}

function test() {
  const logdash = createLogDash({
    apiKey: 'metbC8naqS6CwMuKla9yC7omn6uoc62b',
    // host: 'https://dev-api.logdash.io',
  });

  logdash.metrics.set('test1', 0);
  logdash.metrics.set('test2', 1);
  logdash.metrics.set('test3', 2);
  logdash.metrics.set('test4', 3);
  logdash.metrics.set('test5', 4);
  logdash.metrics.set('test6', 5);
  logdash.metrics.set('test7', 6);
  logdash.metrics.set('test8', 7);
  logdash.metrics.set('test9', 8);
  logdash.metrics.set('test10', 9);

  logdash.logger.debug('Dupa');
}

test();
