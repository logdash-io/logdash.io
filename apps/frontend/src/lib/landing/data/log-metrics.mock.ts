import type { LogGranularity } from '$lib/clusters/projects/domain/log-granularity';
import type { LogMetric } from '$lib/clusters/projects/domain/log-metric';

// Helper function to generate dates relative to current time
function getRelativeDate(daysAgo = 0, hoursAgo = 0, minutesAgo = 0): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setHours(date.getHours() - hoursAgo);
	date.setMinutes(date.getMinutes() - minutesAgo);
	date.setSeconds(0);
	date.setMilliseconds(0);
	return date.toISOString();
}

// Function to generate time-relative log metrics with proper aggregation
function generateLogMetrics(): Record<LogGranularity, LogMetric[]> {
	// First generate minute data
	const minuteData = generateMinuteData();

	// Aggregate minute data into hourly data
	const hourData = aggregateToHourly(minuteData);

	// Aggregate hourly data into daily data
	const dayData = aggregateToDaily(hourData);

	return {
		day: dayData,
		hour: hourData,
		minute: minuteData,
	};
}

// Generate minute-by-minute data for the last ~2 hours
function generateMinuteData(): LogMetric[] {
	const minuteData: LogMetric[] = [];

	// Generate data for the last ~2 hours (similar pattern to original data)
	for (let i = 120; i >= 0; i--) {
		const values: Record<string, number> = {
			info: i <= 60 ? 6 : 7, // 7 for older entries, 6 for newer
		};

		// Add some warning logs at specific intervals
		if (i % 30 === 0) {
			values.warning = 1;
		}

		// Add some variation
		if (i % 45 === 0) {
			values.info += 3; // Occasionally higher info count
		}

		// Add error spikes
		if (i === 125) {
			// Major error spike about 95 minutes ago
			values.error = 14;
		} else if (i === 94 || i === 96) {
			// Neighboring minutes have fewer errors
			values.error = 5;
		} else if (i === 17 || i === 13) {
			// Trailing error counts
			values.error = 2;
		}

		// Add a smaller, more recent error spike
		if (i === 25) {
			values.error = 8;
			values.warning = 3; // Often errors come with warnings
		} else if (i === 24 || i === 26) {
			values.error = 3;
		}

		minuteData.push({
			date: getRelativeDate(0, 0, i),
			values,
		});
	}

	return minuteData;
}

// Aggregate minute data into hourly data
function aggregateToHourly(minuteData: LogMetric[]): LogMetric[] {
	const hourMap = new Map<
		string,
		{ date: string; values: Record<string, number> }
	>();

	// Process each minute entry
	minuteData.forEach((entry) => {
		// Get the hour part of the timestamp (YYYY-MM-DDTHH:00:00.000Z)
		const date = new Date(entry.date);
		date.setMinutes(0, 0, 0);
		const hourKey = date.toISOString();

		// Initialize or retrieve the hour data
		if (!hourMap.has(hourKey)) {
			hourMap.set(hourKey, { date: hourKey, values: {} });
		}

		const hourEntry = hourMap.get(hourKey)!;

		// Aggregate values from each log level
		Object.entries(entry.values).forEach(([level, count]) => {
			hourEntry.values[level] = (hourEntry.values[level] || 0) + count;
		});
	});

	// Convert to array and sort by date
	return Array.from(hourMap.values()).sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);
}

// Aggregate hourly data into daily data
function aggregateToDaily(hourData: LogMetric[]): LogMetric[] {
	const dayMap = new Map<
		string,
		{ date: string; values: Record<string, number> }
	>();

	// Process each hour entry
	hourData.forEach((entry) => {
		// Get the day part of the timestamp (YYYY-MM-DDT00:00:00.000Z)
		const date = new Date(entry.date);
		date.setHours(0, 0, 0, 0);
		const dayKey = date.toISOString();

		// Initialize or retrieve the day data
		if (!dayMap.has(dayKey)) {
			dayMap.set(dayKey, { date: dayKey, values: {} });
		}

		const dayEntry = dayMap.get(dayKey)!;

		// Aggregate values from each log level
		Object.entries(entry.values).forEach(([level, count]) => {
			dayEntry.values[level] = (dayEntry.values[level] || 0) + count;
		});
	});

	// Convert to array and sort by date
	return Array.from(dayMap.values()).sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);
}

// Generate dynamic log metrics
export const FAKE_LOG_METRICS = generateLogMetrics();
