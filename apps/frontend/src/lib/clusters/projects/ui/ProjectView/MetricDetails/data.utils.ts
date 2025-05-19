import {
	MetricGranularity,
	type Metric,
	type MetricDataPoint,
} from '$lib/clusters/projects/domain/metric.js';

export interface GraphReadyPoint {
	x: string;
	y: number;
}

export function formatDateWithGranularity(
	date: Date,
	granularity: MetricGranularity,
): string {
	switch (granularity) {
		// return YYYY-MM-DDTHH:MM:00.000Z
		case MetricGranularity.MINUTE:
			return date.toISOString().slice(0, 16) + ':00.000Z';
		// return YYYY-MM-DDTHH:00:00.000Z
		case MetricGranularity.HOUR:
			return date.toISOString().slice(0, 13) + ':00:00.000Z';
		// return YYYY-MM-DDT00:00:00.000Z
		case MetricGranularity.DAY:
			return date.toISOString().slice(0, 10) + 'T00:00:00.000Z';
		default:
			throw new Error('Invalid granularity');
	}
}

export function tryEnrichRawPointsWithMetrics(
	rawPoints: MetricDataPoint[],
	metrics: Metric[],
	baselineValue: number,
): MetricDataPoint[] {
	const firstKnownDate = metrics[0]?.date || null;

	// here we try to match data from API to the prepared buckets
	const enrichedPoints = rawPoints.map((point) => {
		const metric = metrics.find((metric) => metric.date === point.date);
		return {
			...point,
			value: metric?.value,
		};
	});

	// fill in first point with baseline value
	enrichedPoints[0].value = baselineValue;

	// here we will fill missing values. So any time we start seeing a gap, we will fill it with the next known value
	// First pass - fill gaps with next known value (from right to left)
	for (let i = enrichedPoints.length - 1; i >= 0; i--) {
		if (enrichedPoints[i].value === undefined) {
			enrichedPoints[i].value = enrichedPoints[i + 1]?.value;
		}
	}

	// Second pass - fill remaining gaps with previous known value (from left to right)
	for (let i = 0; i < enrichedPoints.length; i++) {
		if (enrichedPoints[i].value === undefined) {
			enrichedPoints[i].value = enrichedPoints[i - 1]?.value;
		}
	}

	// put for each below first known date
	if (firstKnownDate) {
		for (let i = 0; i < enrichedPoints.length; i++) {
			if (enrichedPoints[i].date < firstKnownDate) {
				enrichedPoints[i].value = null;
			}
		}
	} else {
		for (let i = 0; i < enrichedPoints.length; i++) {
			enrichedPoints[i].value = baselineValue;
		}
	}

	return enrichedPoints;
}

export function generateMinuteRawPoints(
	numberOfBuckets: number,
): MetricDataPoint[] {
	const now = new Date();
	const points: MetricDataPoint[] = [];

	for (let i = 0; i < numberOfBuckets; i++) {
		const date = new Date(now.getTime() - i * 60 * 1000);

		points.push({
			date: formatDateWithGranularity(date, MetricGranularity.MINUTE),
			value: undefined,
		});
	}
	return points;
}

export function generateHourRawPoints(
	numberOfBuckets: number,
): MetricDataPoint[] {
	const now = new Date();
	const points: MetricDataPoint[] = [];

	for (let i = 0; i < numberOfBuckets; i++) {
		const date = new Date(now.getTime() - i * 60 * 60 * 1000);

		points.push({
			date: formatDateWithGranularity(date, MetricGranularity.HOUR),
			value: undefined,
		});
	}
	return points;
}

export function generateDayRawPoints(
	numberOfBuckets: number,
): MetricDataPoint[] {
	const now = new Date();
	const points: MetricDataPoint[] = [];

	for (let i = 0; i < numberOfBuckets; i++) {
		const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

		points.push({
			date: formatDateWithGranularity(date, MetricGranularity.DAY),
			value: undefined,
		});
	}

	return points;
}

export function getMetricWithGranularitySortAndLimit(
	metrics: Metric[],
	granularity: MetricGranularity,
	limit: number,
) {
	return metrics
		.filter((metric) => metric.granularity === granularity)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		.slice(-limit);
}

export function convertRawPointsToGraphReadyPoints(
	rawPoints: MetricDataPoint[],
	granularity: MetricGranularity,
): GraphReadyPoint[] {
	return rawPoints.map((point) => ({
		x: getDateToDisplayOnGraph(point.date, granularity),
		y: point.value,
	}));
}

export function getDateToDisplayOnGraph(
	date: string,
	granularity: MetricGranularity,
): string {
	switch (granularity) {
		// display as HH:MM
		case MetricGranularity.MINUTE: {
			const dateObject = new Date(date);
			const hours = dateObject.getHours().toString().padStart(2, '0');
			const minutes = dateObject.getMinutes().toString().padStart(2, '0');
			return `${hours}:${minutes}`;
		}
		// display as HH:00
		case MetricGranularity.HOUR: {
			const dateObject = new Date(date);

			const day = dateObject.getDate().toString().padStart(2, '0');
			const month = (dateObject.getMonth() + 1)
				.toString()
				.padStart(2, '0');
			const hours = dateObject.getHours().toString().padStart(2, '0');
			return `${day}-${month} ${hours}:00`;
		}
		// display as MM-DD
		case MetricGranularity.DAY: {
			const dateObject = new Date(date);
			const month = (dateObject.getMonth() + 1)
				.toString()
				.padStart(2, '0');
			const day = dateObject.getDate().toString().padStart(2, '0');
			return `${day}-${month}`;
		}
		default:
			throw new Error('Invalid granularity');
	}
}

export function getGraphReadyPoints(
	metrics: Metric[],
	dataPointsCounts: {
		minute: number;
		hour: number;
		day: number;
	},
): {
	minuteData: GraphReadyPoint[];
	hourData: GraphReadyPoint[];
	dayData: GraphReadyPoint[];
} {
	const baselineValue = metrics.find(
		(metric) => metric.granularity === MetricGranularity.ALL_TIME,
	)!.value;

	// minute points
	const minuteMetrics = getMetricWithGranularitySortAndLimit(
		metrics,
		MetricGranularity.MINUTE,
		dataPointsCounts.minute,
	);

	const minuteRawPoints = generateMinuteRawPoints(dataPointsCounts.minute);

	const enrichedRawMinutePoints = tryEnrichRawPointsWithMetrics(
		minuteRawPoints,
		minuteMetrics,
		baselineValue,
	);

	const graphReadyMinutePoints = convertRawPointsToGraphReadyPoints(
		enrichedRawMinutePoints,
		MetricGranularity.MINUTE,
	).reverse();

	// hour points
	const hourMetrics = getMetricWithGranularitySortAndLimit(
		metrics,
		MetricGranularity.HOUR,
		dataPointsCounts.hour,
	);

	const hourRawPoints = generateHourRawPoints(dataPointsCounts.hour);

	const enrichedRawHourPoints = tryEnrichRawPointsWithMetrics(
		hourRawPoints,
		hourMetrics,
		baselineValue,
	);

	const graphReadyHourPoints = convertRawPointsToGraphReadyPoints(
		enrichedRawHourPoints,
		MetricGranularity.HOUR,
	).reverse();

	// day points
	const dayMetrics = getMetricWithGranularitySortAndLimit(
		metrics,
		MetricGranularity.DAY,
		dataPointsCounts.day,
	);

	const dayRawPoints = generateDayRawPoints(dataPointsCounts.day);

	const enrichedRawDayPoints = tryEnrichRawPointsWithMetrics(
		dayRawPoints,
		dayMetrics,
		baselineValue,
	);

	const graphReadyDayPoints = convertRawPointsToGraphReadyPoints(
		enrichedRawDayPoints,
		MetricGranularity.DAY,
	).reverse();

	return {
		minuteData: graphReadyMinutePoints,
		hourData: graphReadyHourPoints,
		dayData: graphReadyDayPoints,
	};
}
