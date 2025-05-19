export type LogMetric = {
	date: string;
	values: Partial<
		Record<
			| 'error'
			| 'info'
			| 'warning'
			| 'http'
			| 'verbose'
			| 'debug'
			| 'silly',
			number
		>
	>;
};
