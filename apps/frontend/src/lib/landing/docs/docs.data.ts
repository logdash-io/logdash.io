// Define table structure types
export type Table = {
	headers: string[];
	rows: string[][];
};

export type TableType =
	// logs
	| 'logsRetention'
	| 'logsRateLimits'
	| 'logSize'
	// log metrics
	| 'logMetricsRetention'
	// metrics
	| 'maximumNumberOfUniqueMetrics'
	| 'metricsRetention';

export interface TableRecord {
	[key: string]: Table;
}

// Define document structure types
export interface GeneralDocSection {
	id: string;
	title: string;
	intro: string;
	tables: Record<TableType, Table>;
	outro: string;
	type: 'general';
}

export interface SDKSection {
	id: string;
	title: string;
	docsPath: string;
	sections: {
		id: string;
		title: string;
		path: string;
	}[];
	type: 'sdk';
}

// Title mappings for tables
export const tableTitles: Record<TableType, string> = {
	// logs
	logsRetention: 'Tier based retention',
	logsRateLimits: 'Tier based rate limits',
	logSize: 'Tier based log size',
	// log metrics
	logMetricsRetention: 'Tier based log metrics retention',
	// metrics
	metricsRetention: 'Tier based metrics retention',
	maximumNumberOfUniqueMetrics: 'Tier based maximum number of unique metrics',
};

// Footer title mappings
export const footerTitles: Record<string, string> = {
	'rate-limiting': 'Handling rate limiting',
	'payload-limits': 'Handling oversized payloads',
};

// Table data
export const logTables = {
	logsRetention: {
		headers: ['Free', 'Early Bird'],
		rows: [['We keep 1k last logs', 'We keep 10k last logs']],
	},
	logsRateLimits: {
		headers: ['Free', 'Early Bird'],
		rows: [['10k / hour', '50k / hour']],
	},
	logSize: {
		headers: ['Free', 'Early Bird'],
		rows: [['4096 characters', '4096 characters']],
	},
};

export const logMetricsTables = {
	logMetricsRetention: {
		headers: ['Accuracy', 'Free', 'Early Bird'],
		rows: [
			['Minute', '1 hour', '12 hours'],
			['Hour', '12 hours', '7 days'],
			['Day', '7 days', '1 month'],
		],
	},
};

export const metricsTables = {
	metricsRetention: {
		headers: ['Accuracy', 'Free', 'Early Bird'],
		rows: [
			['Minute', '1 hour', '12 hours'],
			['Hour', '12 hours', '7 days'],
			['Day', '7 days', '1 month'],
		],
	},
	maximumNumberOfUniqueMetrics: {
		headers: ['Free', 'Early Bird'],
		rows: [['2', '10']],
	},
};

// Document sections
export const generalDocs: GeneralDocSection[] = [
	{
		id: 'overview',
		title: 'Overview',
		intro: `Logdash is a powerful platform for logging, tracking metrics, and monitoring your applications.

Our core philosophy is simplicity - zero configuration and no headaches.

Logdash is built on top of 3 pillars:
- Logging
- Metrics
- Monitoring

The last one is still in progress and will be available soon.

For users in Europe, we achieve sub-100ms latency from log transmission to dashboard display.`,
		tables: {} as Record<TableType, Table>,
		outro: '',
		type: 'general',
	},
	{
		id: 'logging',
		title: 'Logging',
		intro: `Track your system events, errors, in real-time even from multiple instances, with structured data that makes debugging and analysis simple.

Your subscription plan determines the number of most recent logs we retain, the hourly rate limits for sending logs, and the maximum size per log message (oversized logs are automatically truncated).`,
		tables: {
			logsRetention: logTables.logsRetention,
			logsRateLimits: logTables.logsRateLimits,
			logSize: logTables.logSize,
		} as Record<TableType, Table>,
		outro: '',
		type: 'general',
	},
	{
		id: 'logMetrics',
		title: 'Log metrics',
		intro: `We automatically collect and analyze data about the volume and types of logs sent to our platform.

This helps you understand peak traffic patterns through volume analysis and identify potential problems by monitoring error frequencies.

All metrics are stored with different accuracy (minute, hour, and day), each with its own retention policy based on your subscription plan.`,
		tables: {
			logMetricsRetention: logMetricsTables.logMetricsRetention,
		} as Record<TableType, Table>,
		outro: '',
		type: 'general',
	},
	{
		id: 'metrics',
		title: 'Metrics ',
		intro: `Track custom metrics directly from your application to monitor key business indicators.

Common examples include user registration numbers, order volumes, file upload statistics, and any custom data points relevant to your business.

Similar to log metrics, custom metrics are stored with different accuracy (minute, hour, and day), with retention policies determined by your subscription plan.`,
		tables: {
			metricsRetention: metricsTables.metricsRetention,
			maximumNumberOfUniqueMetrics:
				metricsTables.maximumNumberOfUniqueMetrics,
		} as Record<TableType, Table>,
		outro: '',
		type: 'general',
	},
];

export const sdkDocs: SDKSection[] = [
	{
		id: 'node-js',
		title: 'NodeJS SDK',
		docsPath: 'https://github.com/logdash-io/js-sdk?tab=readme-ov-file',
		sections: [
			{ id: 'logs', title: 'Logging', path: '#logging' },
			{ id: 'metrics', title: 'Metrics', path: '#metrics' },
			// { id: 'monitoring', title: 'Monitoring', path: '#monitoring' },
		],
		type: 'sdk',
	},
	{
		id: 'python',
		title: 'Python SDK',
		docsPath: 'https://github.com/logdash-io/python-sdk?tab=readme-ov-file',
		sections: [
			{ id: 'logs', title: 'Logging', path: '#logging' },
			{ id: 'metrics', title: 'Metrics', path: '#metrics' },
			// { id: 'monitoring', title: 'Monitoring', path: '#monitoring' },
		],
		type: 'sdk',
	},
];
