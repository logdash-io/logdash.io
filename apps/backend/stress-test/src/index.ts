import { Logdash } from '@logdash/node';
import dns from 'dns/promises';

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
  // const logdash1 = new Logdash('m409bnFcnhmpfQ3hozI2YkP49WTmto31', {
  //   host: 'https://dev-api.logdash.io',
  // });

  // for (let i = 0; i < 100; i++) {
  //   logdash1.setMetric(`test${i}`, i);
  // }

  const logdash2 = new Logdash('mnL6qiDcki0FZYqOWlaQD50K7pZ5gLtn', {
    host: 'https://dev-api.logdash.io',
  });

  for (let i = 0; i < 100; i++) {
    logdash2.mutateMetric(`new${i}`, 1);
  }
}

async function checkCnameRecord(domain: string) {
  try {
    const cname = await dns.resolveCname(domain);
    console.log(`CNAME records for ${domain}:`, cname);
    return cname;
  } catch (error) {
    const dnsError = error as { code?: string; message?: string };
    if (dnsError.code === 'ENOTFOUND') {
      console.log(`No CNAME record found for ${domain}`);
    } else if (dnsError.code === 'ENODATA') {
      console.log(`Domain ${domain} exists but has no CNAME record`);
    } else {
      console.log(`Error resolving CNAME for ${domain}:`, dnsError.message || 'Unknown error');
    }
    return null;
  }
}

checkCnameRecord('dupa-romana.ablaszkiewicz.pl');
