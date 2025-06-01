<script lang="ts">
	import type { LogGranularity } from '$lib/clusters/projects/domain/log-granularity';
	import type { LogMetric } from '$lib/clusters/projects/domain/log-metric';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	// Component props with per-granularity time ranges
	type TimeRanges = {
		minute?: number;
		hour?: number;
		day?: number;
	};

	type Props = {
		logMetrics: Record<LogGranularity, LogMetric[]>;
		timeRanges?: TimeRanges; // New optional prop for per-granularity time ranges
	};

	// Set defaults (12 hours for minute, 24 hours for hour, 7 days for day)
	const {
		logMetrics,
		timeRanges = {
			minute: 12,
			hour: 24,
			day: 24 * 7,
		},
	}: Props = $props();
	// Chart container references
	let minuteChartContainer: HTMLElement;
	let hourChartContainer: HTMLElement;
	let dayChartContainer: HTMLElement;
	let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

	// Interval timer for auto updates
	let updateInterval: ReturnType<typeof setInterval>;

	// Constants for chart configuration
	const CHART_HEIGHT = 200;
	const MARGIN = { top: 20, right: 30, bottom: 30, left: 50 };
	const LOG_TYPES = [
		'error',
		'warning',
		'info',
		'http',
		'verbose',
		'debug',
		'silly',
	];
	const LOG_COLORS = [
		'#e7000b',
		'#fe9a00',
		'#155dfc',
		'#00a6a6',
		'#00a600',
		'#00a600',
		'#505050',
	];

	const MIN_BAR_HEIGHT = 1;

	// Helper to get time range for specific granularity
	function getTimeRangeForGranularity(granularity: LogGranularity): number {
		return timeRanges[granularity] || 12; // Default to 12 hours if not specified
	}

	// Data processing functions
	function createDatasetForGranularity(
		granularity: LogGranularity,
	): ChartDataPoint[] {
		if (!logMetrics[granularity] || logMetrics[granularity].length === 0) {
			return [];
		}

		// Get granularity-specific time range
		const timeRangeHours = getTimeRangeForGranularity(granularity);

		// Filter data to specified time range
		const now = new Date();
		const timeWindow = new Date(
			now.getTime() - timeRangeHours * 60 * 60 * 1000,
		);
		return logMetrics[granularity]
			.filter(
				(metric) =>
					new Date(metric.date) >= timeWindow &&
					new Date(metric.date) <= now,
			)
			.map((metric) => {
				const date = new Date(metric.date);

				return {
					date,
					granularity,
					error: ensureNumber(metric.values.error),
					warning: ensureNumber(metric.values.warning),
					info: ensureNumber(metric.values.info),
					http: ensureNumber(metric.values.http),
					verbose: ensureNumber(metric.values.verbose),
					debug: ensureNumber(metric.values.debug),
					silly: ensureNumber(metric.values.silly),
					total: ensureNumber(
						(metric.values.error ?? 0) +
							(metric.values.warning ?? 0) +
							(metric.values.info ?? 0) +
							(metric.values.http ?? 0) +
							(metric.values.verbose ?? 0) +
							(metric.values.debug ?? 0) +
							(metric.values.silly ?? 0),
					),
					// Calculate bar width based on granularity
					startDate: date,
					endDate: calculateEndDate(date, granularity),
					// Include the time range used for this data point
					timeRangeHours,
				};
			})
			.filter((point) => point.total > 0) // Only include points with data
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	}

	function calculateEndDate(date: Date, granularity: LogGranularity): Date {
		switch (granularity) {
			case 'minute':
				return new Date(date.getTime() + 60 * 1000);
			case 'hour':
				return new Date(date.getTime() + 60 * 60 * 1000);
			case 'day':
				return new Date(date.getTime() + 24 * 60 * 60 * 1000);
			default:
				return new Date(date.getTime() + 60 * 1000);
		}
	}

	function ensureNumber(value: any): number {
		return isNaN(value) ? 0 : Number(value);
	}

	// Chart rendering functions
	function createChart(
		container: HTMLElement,
		data: ChartDataPoint[],
		granularity: LogGranularity,
	) {
		// Don't render if container is missing or no data
		if (!container) return;

		// Clean up previous chart
		d3.select(container).selectAll('*').remove();

		// Handle empty data case
		if (data.length === 0) {
			renderEmptyState(container, granularity);
			return;
		}

		// Prepare chart dimensions - ensure we get the full container width
		const containerRect = container.getBoundingClientRect();
		const width = Math.max(
			containerRect.width,
			container.clientWidth,
			container.offsetWidth,
		);
		const innerWidth = width - MARGIN.left - MARGIN.right;
		const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

		// Get the granularity-specific time range
		const timeRangeHours = getTimeRangeForGranularity(granularity);

		// Time window for x-axis
		const now = new Date();
		const timeWindow = new Date(
			now.getTime() - timeRangeHours * 60 * 60 * 1000,
		);

		// Create SVG and chart group - ensure SVG takes full width
		const svg = d3
			.select(container)
			.append('svg')
			.attr('width', '100%')
			.attr('height', CHART_HEIGHT)
			.attr('viewBox', `0 0 ${width} ${CHART_HEIGHT}`)
			.attr('preserveAspectRatio', 'none');

		const chart = svg
			.append('g')
			.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

		// Create a clipping path to ensure bars don't overflow
		const clipId = `clip-${granularity}-${Date.now()}`;
		svg.append('defs')
			.append('clipPath')
			.attr('id', clipId)
			.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', innerWidth)
			.attr('height', innerHeight);

		// Create scales
		const xScale = createXScale(timeWindow, now, innerWidth);
		const yScale = createYScale(data, innerHeight);

		// Add chart elements - REORDERED to put axes and grid first
		drawAxes(chart, xScale, yScale, innerWidth, innerHeight);
		drawBars(chart, data, xScale, yScale, granularity, clipId);
		drawInteractionLayer(
			chart,
			data,
			xScale,
			yScale,
			innerWidth,
			innerHeight,
		);

		// Show outlier note if needed
		const yMax = yScale.domain()[1];
		if (data.some((d) => d.total > yMax)) {
			drawOutlierNote(svg, width);
		}
	}

	function createXScale(
		startTime: Date,
		endTime: Date,
		width: number,
	): d3.ScaleTime<number, number> {
		return d3.scaleTime().domain([startTime, endTime]).range([0, width]);
	}

	function createYScale(
		data: ChartDataPoint[],
		height: number,
	): d3.ScaleLinear<number, number> {
		// Calculate appropriate y domain based on data distribution
		const values = data
			.map((d) => d.total)
			.filter((v) => v > 0)
			.sort((a, b) => a - b);
		const medianValue = values[Math.floor(values.length / 2)] || 1;
		const p90Value =
			values[Math.floor(values.length * 0.9)] || medianValue * 2;
		const yMax = Math.max(p90Value * 1.5, medianValue * 3, 1);

		return d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);
	}

	function drawBars(
		chart: d3.Selection<SVGGElement, unknown, null, undefined>,
		data: ChartDataPoint[],
		xScale: d3.ScaleTime<number, number>,
		yScale: d3.ScaleLinear<number, number>,
		granularity: LogGranularity,
		clipId: string,
	) {
		// Create a group for bars with clipping applied
		const barsGroup = chart
			.append('g')
			.attr('clip-path', `url(#${clipId})`);

		// Color scale for log types
		const colorScale = d3
			.scaleOrdinal<string>()
			.domain(LOG_TYPES)
			.range(LOG_COLORS);

		// Get chart dimensions for bounds checking
		const chartWidth = xScale.range()[1];
		const chartHeight = yScale.range()[0];

		// Process each data point
		data.forEach((point) => {
			// Calculate bar dimensions
			const barStart = xScale(point.startDate);
			const barEnd = xScale(point.endDate);

			// Ensure bars don't overflow horizontally - clamp to chart bounds
			const clampedBarStart = Math.max(0, Math.min(barStart, chartWidth));
			const clampedBarEnd = Math.max(0, Math.min(barEnd, chartWidth));
			const barWidth = Math.max(1, clampedBarEnd - clampedBarStart);

			// Skip bars that are completely outside the visible area
			if (clampedBarStart >= chartWidth || clampedBarEnd <= 0) {
				return;
			}

			// Get the Y-axis maximum for clamping
			const yMax = yScale.domain()[1];
			let currentTotal = 0;
			let y0 = chartHeight;

			// Draw each log type segment, stacking them from bottom to top
			LOG_TYPES.forEach((logType) => {
				if (point[logType] > 0) {
					// Calculate cumulative total and clamp to Y-axis bounds
					const segmentValue = Math.min(
						point[logType],
						yMax - currentTotal,
					);
					if (segmentValue <= 0) return; // Skip if we've exceeded the Y-axis limit

					// Calculate the Y position for this segment
					const y1 = Math.max(0, yScale(currentTotal + segmentValue));
					const segmentHeight = Math.max(MIN_BAR_HEIGHT, y0 - y1);

					drawBarSegment(
						barsGroup,
						clampedBarStart,
						barWidth,
						y0,
						y1,
						colorScale(logType),
						point,
						logType,
						granularity,
					);

					// Update for next segment
					currentTotal += segmentValue;
					y0 = y1;
				}
			});

			// Add border for the entire bar (also clipped)
			barsGroup
				.append('rect')
				.attr('class', `bar-outline-${granularity}`)
				.attr('x', clampedBarStart)
				.attr('y', y0)
				.attr('width', barWidth)
				.attr('height', chartHeight - y0)
				.attr('fill', 'none')
				.attr('stroke', '#ffffff')
				.attr('stroke-opacity', 0.3)
				.attr('stroke-width', 0.5)
				.style('pointer-events', 'none');
		});
	}

	function drawBarSegment(
		chart: d3.Selection<SVGGElement, unknown, null, undefined>,
		x: number,
		width: number,
		y0: number,
		y1: number,
		color: string,
		data: ChartDataPoint,
		logType: string,
		granularity: LogGranularity,
	) {
		// Ensure height is at least 1px for visibility
		const height = Math.max(MIN_BAR_HEIGHT, y0 - y1);

		chart
			.append('rect')
			.attr('class', `bar-${logType}`)
			.attr('data-date', data.date.getTime())
			.attr('data-granularity', granularity)
			.attr('x', x)
			.attr('y', y1)
			.attr('width', width)
			.attr('height', height)
			.attr('fill', color)
			.attr('opacity', 1)
			.on('mouseover', function (event) {
				highlightBar(granularity, data.date.getTime());
				showTooltip(event, data);
			})
			.on('mouseout', function () {
				resetBarHighlighting();
				hideTooltip();
			})
			.on('mousemove', moveTooltip);
	}

	function drawAxes(
		chart: d3.Selection<SVGGElement, unknown, null, undefined>,
		xScale: d3.ScaleTime<number, number>,
		yScale: d3.ScaleLinear<number, number>,
		width: number,
		height: number,
	) {
		// Draw horizontal grid lines FIRST so they appear behind bars
		chart
			.append('g')
			.attr('class', 'grid')
			.call(
				d3
					.axisLeft(yScale)
					.ticks(5)
					.tickSize(-width)
					.tickFormat(() => ''),
			)
			.attr('color', '#94a3b8')
			.style('opacity', 0.3)
			.selectAll('.domain')
			.remove();

		// X-axis with formatted ticks
		chart
			.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(
				d3
					.axisBottom(xScale)
					.ticks(6)
					.tickFormat((d: Date) => {
						// Show hour and minute, add date at midnight
						if (d.getHours() === 0 && d.getMinutes() === 0) {
							return d.toLocaleDateString([], {
								month: 'short',
								day: 'numeric',
							});
						}
						return d.toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						});
					}),
			)
			.attr('color', '#94a3b8')
			.selectAll('text')
			.style('font-size', '11px');

		// Y-axis
		chart
			.append('g')
			.call(d3.axisLeft(yScale).ticks(5))
			.attr('color', '#94a3b8');
	}

	function drawInteractionLayer(
		chart: d3.Selection<SVGGElement, unknown, null, undefined>,
		data: ChartDataPoint[],
		xScale: d3.ScaleTime<number, number>,
		yScale: d3.ScaleLinear<number, number>,
		width: number,
		height: number,
	) {
		chart
			.append('rect')
			.attr('width', width)
			.attr('height', height)
			.attr('fill', 'none')
			.attr('pointer-events', 'all')
			.on('mousemove', function (event) {
				handleChartHover(event, data, xScale);
			})
			.on('mouseout', function () {
				resetBarHighlighting();
				hideTooltip();
			});
	}

	function handleChartHover(
		event: any,
		data: ChartDataPoint[],
		xScale: d3.ScaleTime<number, number>,
	) {
		const mouseX = d3.pointer(event)[0];
		const hoverDate = xScale.invert(mouseX);
		const hoverTime = hoverDate.getTime();

		// Find data point that contains this time
		let closestPoint = null;
		let minDistance = Infinity;
		let isWithinBar = false;

		data.forEach((point) => {
			const startTime = point.startDate.getTime();
			const endTime = point.endDate.getTime();

			// Check if mouse is directly over a bar
			if (hoverTime >= startTime && hoverTime < endTime) {
				closestPoint = point;
				isWithinBar = true;
				minDistance = 0;
			} else {
				// Otherwise find the closest bar
				const distToStart = Math.abs(hoverTime - startTime);
				const distToEnd = Math.abs(hoverTime - endTime);
				const distance = Math.min(distToStart, distToEnd);

				if (distance < minDistance) {
					minDistance = distance;
					closestPoint = point;
				}
			}
		});

		// Show tooltip if over or very near a bar (within 2 minutes)
		const nearThreshold = 2 * 60 * 1000;
		if (isWithinBar || (closestPoint && minDistance < nearThreshold)) {
			highlightBar(closestPoint.granularity, closestPoint.date.getTime());
			showTooltip(event, closestPoint);
		} else {
			resetBarHighlighting();
			hideTooltip();
		}
	}

	function highlightBar(granularity: LogGranularity, timestamp: number) {
		return;
		// Dim all bars
		d3.selectAll('rect.bar-info, rect.bar-warning, rect.bar-error').attr(
			'opacity',
			0.7,
		);

		// Highlight matching bar
		d3.selectAll(
			`rect[data-date="${timestamp}"][data-granularity="${granularity}"]`,
		).attr('opacity', 1);
	}

	function resetBarHighlighting() {
		d3.selectAll('rect.bar-info, rect.bar-warning, rect.bar-error').attr(
			'opacity',
			0.9,
		);
	}

	// Tooltip functions
	function showTooltip(event: any, data: ChartDataPoint) {
		const formattedDate = formatDateByGranularity(
			data.date,
			data.granularity,
		);
		const colorScale = d3
			.scaleOrdinal<string>()
			.domain(LOG_TYPES)
			.range(LOG_COLORS);

		tooltip
			.style('display', 'block')
			.style('left', `${event.pageX + 10}px`)
			.style('top', `${event.pageY - 28}px`).html(`
                <div class="font-semibold font-mono">${formattedDate}</div>
                ${
					data.error > 0
						? `<div class="flex items-center mt-2 font-mono">
                    <span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale('error')}"></span>
                    <span>Error: ${data.error}</span>
                </div>`
						: ''
				}
                ${
					data.warning > 0
						? `<div class="flex items-center mt-1 font-mono">
                    <span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale('warning')}"></span>
                    <span>Warning: ${data.warning}</span>
                </div>`
						: ''
				}
                ${
					data.info > 0
						? `<div class="flex items-center mt-1 font-mono">
                    <span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale('info')}"></span>
                    <span>Info: ${data.info}</span>
                </div>`
						: ''
				}
				${
					data.http > 0
						? `<div class="flex items-center mt-1 font-mono">
					<span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale('http')}"></span>
					<span>HTTP: ${data.http}</span>
				</div>`
						: ''
				}
				${
					data.verbose > 0
						? `<div class="flex items-center mt-1 font-mono">
					<span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale('verbose')}"></span>
					<span>Verbose: ${data.verbose}</span>
				</div>`
						: ''
				}
				${
					data.debug > 0
						? `<div class="flex items-center mt-1 font-mono">
					<span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale('debug')}"></span>
					<span>Debug: ${data.debug}</span>
				</div>`
						: ''
				}
				${
					data.silly > 0
						? `<div class="flex items-center mt-1 font-mono">
					<span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale('silly')}"></span>
					<span>Silly: ${data.silly}</span>
				</div>`
						: ''
				}
                <div class="mt-2 pt-1 border-t border-gray-600 font-semibold font-mono">
                    Total: ${data.total}
                </div>
            `);
	}

	function hideTooltip() {
		tooltip.style('display', 'none');
	}

	function moveTooltip(event: any) {
		tooltip
			.style('left', `${event.pageX + 10}px`)
			.style('top', `${event.pageY - 28}px`);
	}

	// Helper functions
	function formatDateByGranularity(
		date: Date,
		granularity: LogGranularity,
	): string {
		switch (granularity) {
			case 'minute':
				return date.toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
					day: 'numeric',
					month: 'short',
				});
			case 'hour':
				return date.toLocaleString([], {
					hour: '2-digit',
					minute: '2-digit',
					day: 'numeric',
					month: 'short',
				});
			case 'day':
				return date.toLocaleDateString([], {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
				});
			default:
				return date.toLocaleString();
		}
	}

	function renderEmptyState(
		container: HTMLElement,
		granularity: LogGranularity,
	) {
		const timeRangeHours = getTimeRangeForGranularity(granularity);

		// Format time range nicely
		let timeRangeDisplay = `${timeRangeHours} hours`;
		if (timeRangeHours >= 24) {
			const days = Math.floor(timeRangeHours / 24);
			timeRangeDisplay = days === 1 ? '1 day' : `${days} days`;
		}

		d3.select(container)
			.append('div')
			.attr(
				'class',
				'flex items-center justify-center h-32 text-gray-400',
			)
			.html(
				`<p>No ${granularity} log data available for the last ${timeRangeDisplay}</p>`,
			);
	}

	function drawOutlierNote(
		svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
		width: number,
	) {
		svg.append('text')
			.attr('x', width - MARGIN.right - 140)
			.attr('y', MARGIN.top + 15)
			.attr('text-anchor', 'end')
			.attr('font-size', '10px')
			.attr('fill', '#94a3b8')
			.text('* Some values exceed the maximum y-axis value');
	}

	// Type definitions
	interface ChartDataPoint {
		date: Date;
		granularity: LogGranularity;
		error: number;
		warning: number;
		info: number;
		http: number;
		verbose: number;
		debug: number;
		silly: number;
		total: number;
		startDate: Date;
		endDate: Date;
		timeRangeHours: number;
	}

	// Initialize charts on mount
	onMount(() => {
		// Create tooltip
		tooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'chart-tooltip')
			.style('display', 'none')
			.style('position', 'absolute')
			.style('padding', '10px')
			.style('background', '#1e293b')
			.style('color', '#f1f5f9')
			.style('border-radius', '4px')
			.style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
			.style('pointer-events', 'none')
			.style('z-index', '10')
			.style('max-width', '300px')
			.style('font-family', 'system-ui, -apple-system, sans-serif');

		// Initial render
		renderAllCharts();

		// Handle resize with debouncing to improve performance
		let resizeTimeout: ReturnType<typeof setTimeout>;
		const resizeObserver = new ResizeObserver(() => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				renderAllCharts();
			}, 150); // Debounce resize events
		});

		// Observe all chart containers
		[minuteChartContainer, hourChartContainer, dayChartContainer].forEach(
			(container) => {
				if (container) resizeObserver.observe(container);
			},
		);

		// Set up automatic update every minute to reflect time passing
		updateInterval = setInterval(() => {
			renderAllCharts();
		}, 60000); // Update every 60 seconds

		return () => {
			// Clean up
			if (tooltip) tooltip.remove();
			resizeObserver.disconnect();
			clearInterval(updateInterval);
			if (resizeTimeout) clearTimeout(resizeTimeout);
		};
	});

	// Re-render charts when data changes
	function renderAllCharts() {
		if (!logMetrics) {
			return;
		}

		// Wait for next tick to ensure containers are properly sized
		setTimeout(() => {
			const minuteData = createDatasetForGranularity('minute');
			const hourData = createDatasetForGranularity('hour');
			const dayData = createDatasetForGranularity('day');

			if (minuteChartContainer && minuteChartContainer.clientWidth > 0) {
				createChart(minuteChartContainer, minuteData, 'minute');
			}
			if (hourChartContainer && hourChartContainer.clientWidth > 0) {
				createChart(hourChartContainer, hourData, 'hour');
			}
			if (dayChartContainer && dayChartContainer.clientWidth > 0) {
				createChart(dayChartContainer, dayData, 'day');
			}
		}, 0);
	}

	$effect(() => {
		if (logMetrics && timeRanges) {
			renderAllCharts();
		}
	});

	function formatTimeRange(hours: number): string {
		if (hours < 24) {
			return `${hours} hour${hours === 1 ? '' : 's'}`;
		} else {
			const days = Math.floor(hours / 24);
			return `${days} day${days === 1 ? '' : 's'}`;
		}
	}
</script>

{#if logMetrics}
	<div class="flex flex-col gap-8">
		<div class="flex items-center justify-between gap-4">
			<h2 class="font-semibold">Logs delta</h2>

			<span class="loading loading-ring loading-sm"></span>
		</div>

		<div class="space-y-10">
			<!-- Minute granularity chart -->
			<div class="chart-container">
				<div class="mb-2 flex justify-between">
					<h3 class="text-sm font-medium text-gray-300">By Minute</h3>
					<span class="text-xs text-gray-400">
						Last {formatTimeRange(
							getTimeRangeForGranularity('minute'),
						)}
					</span>
				</div>
				<div
					class="chart-wrapper w-full"
					bind:this={minuteChartContainer}
				></div>
			</div>

			<!-- Hour granularity chart -->
			<div class="chart-container">
				<div class="mb-2 flex justify-between">
					<h3 class="text-sm font-medium text-gray-300">By Hour</h3>
					<span class="text-xs text-gray-400">
						Last {formatTimeRange(
							getTimeRangeForGranularity('hour'),
						)}
					</span>
				</div>
				<div
					class="chart-wrapper w-full"
					bind:this={hourChartContainer}
				></div>
			</div>

			<!-- Day granularity chart -->
			<div class="chart-container">
				<div class="mb-2 flex justify-between">
					<h3 class="text-sm font-medium text-gray-300">By Day</h3>
					<span class="text-xs text-gray-400">
						Last {formatTimeRange(
							getTimeRangeForGranularity('day'),
						)}
					</span>
				</div>
				<div
					class="chart-wrapper w-full"
					bind:this={dayChartContainer}
				></div>
			</div>
		</div>
	</div>
{:else}
	<div
		class="text-primary mx-auto flex items-center gap-2 font-semibold opacity-90"
	>
		<span class="loading loading-ring loading-xl"></span>
		Loading metrics...
	</div>
{/if}

<style>
	.chart-container {
		position: relative;
		width: 100%;
	}

	.chart-wrapper {
		width: 100%;
		min-height: 200px;
		overflow: hidden;
	}

	:global(.chart-tooltip) {
		font-size: 0.875rem;
		min-width: 150px;
		white-space: nowrap;
		z-index: 1000;
	}
</style>
