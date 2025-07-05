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
    Array.from({ length: numberOfProjects }).map(() => apiClient.createProject()),
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
    const values = await apiClient.readProjectStats(project.value, project.projectId);

    console.log(values);
  }
}

function test() {
  // const logdash1 = createLogDash({
  //   apiKey: 'm409bnFcnhmpfQ3hozI2YkP49WTmto31',
  //   host: 'https://dev-api.logdash.io',
  // });

  // for (let i = 0; i < 100; i++) {
  //   logdash1.metrics.set(`test${i}`, i);
  // }

  const logdash2 = createLogDash({
    apiKey: 'mnL6qiDcki0FZYqOWlaQD50K7pZ5gLtn',
    host: 'http://localhost:3000',
  });

  // for (let i = 0; i < 100; i++) {
  // }
  logdash2.metrics.mutate(`new2`, 1);
}

test();

[
  {
    metricRegisterEntryId: '6869096c581bb38041e448fa',
    value: 199,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e44903',
    value: 2260,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e44902',
    value: 428,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e4491e',
    value: 1344,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e44908',
    value: 657,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e448fc',
    value: 1802,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e44901',
    value: 1573,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e448fe',
    value: 2031,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e44900',
    value: 886,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6869096c581bb38041e4490a',
    value: 1115,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6828db49fad05294a46ad6a1',
    value: 38600.566666666666,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '682b8f298408d6cc05fd4b41',
    value: 102071,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '682899cbed72982c571d8c7f',
    value: 781,
    operation: 'change',
  },
  {
    metricRegisterEntryId: '6828916934a29393fcc4860e',
    value: 7929359,
    operation: 'change',
  },
  {
    metricRegisterEntryId: '6828c09fb17f2e7230b4510a',
    value: 271,
    operation: 'change',
  },
  {
    metricRegisterEntryId: '682b8be18408d6cc05fcee08',
    value: 217920,
    operation: 'change',
  },
  {
    metricRegisterEntryId: '6828db49fad05294a46ad6a0',
    value: 12343.233333333334,
    operation: 'set',
  },
  {
    metricRegisterEntryId: '6828e125c70d78306d64afbe',
    value: 11919.666666666666,
    operation: 'set',
  },
];
