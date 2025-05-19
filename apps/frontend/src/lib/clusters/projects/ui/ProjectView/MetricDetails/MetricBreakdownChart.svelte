<script lang="ts">
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	type Format = 'minute' | 'hour' | 'day';
	type DataPoint = {
		x: number | string | Date;
		y: number | null;
	};
	type Props = {
		data: DataPoint[];
		isLoading?: boolean;
		title?: string;
		color?: string;
		height?: number;
		format?: Format;
		timeRange: 'small' | 'large';
	};
	const {
		isLoading = false,
		data,
		title,
		color = '#e60076',
		height = 200,
		format = 'minute',
		timeRange = 'small',
	}: Props = $props();

	let chartContainer: HTMLElement;
	let tooltip: HTMLElement;
	// Constants for chart configuration
	const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };
	const LABELS_OFFSET = 25;
	function createChart() {
		if (!chartContainer || !data || data.length === 0) {
			//clear chart if no data
			d3.select(chartContainer).selectAll('*').remove();
			return;
		}
		// Clean up previous chart
		d3.select(chartContainer).selectAll('*').remove();
		// Prepare chart dimensions
		const width = chartContainer.clientWidth;
		const innerWidth = width - MARGIN.left - MARGIN.right;
		const innerHeight = height - MARGIN.top - MARGIN.bottom - LABELS_OFFSET;
		// Create SVG and chart group
		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', [0, 0, width, height])
			.attr('style', 'max-width: 100%; height: auto;');
		const chart = svg
			.append('g')
			.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
		// Create scales - assuming data is properly formatted
		const xScale = d3
			.scaleBand()
			.domain(data.map((d) => String(d.x)))
			.range([0, innerWidth])
			.padding(0.1);
		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => d.y) || 0])
			.range([innerHeight, 0]);
		// Function to get the center of each band for line positioning
		const xCenter = (d) => xScale(String(d.x))! + xScale.bandwidth() / 2;

		// Helper function to determine tick label display
		function getTickLabelForDisplay(
			value: string,
			currentFormat: Format,
			currentTimeRange: 'small' | 'large',
		): string {
			switch (currentFormat) {
				case 'minute':
					const minute = parseInt(value.split(':')[1], 10);
					if (currentTimeRange === 'small') {
						return minute % 5 === 0 ? value : '';
					}
					return minute === 0 || minute === 30 ? value : '';
				case 'hour':
					const hour = parseInt(
						value.split(' ')[1].split(':')[0],
						10,
					);
					if (currentTimeRange === 'small') {
						return value;
					}
					return hour === 0 || hour === 12 ? value : '';
				case 'day':
					return value; // For 'day' format, always show the label if the tick is decided to be present
				default:
					return value;
			}
		}

		// Determine tick values based on format and timeRange
		const tickValues = xScale
			.domain()
			.filter(
				(tick) =>
					getTickLabelForDisplay(tick, format, timeRange) !== '',
			);

		// Draw axes
		chart
			.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(
				d3
					.axisBottom(xScale)
					.tickValues(tickValues)
					.tickFormat((tick) =>
						getTickLabelForDisplay(tick, format, timeRange),
					),
			)
			.attr('color', '#94a3b8')
			.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)');
		chart
			.append('g')
			.call(d3.axisLeft(yScale))
			.attr('color', '#94a3b8')
			.call((g) => g.select('.domain').remove());
		// Create a line generator
		const line = d3
			.line<DataPoint>()
			.defined((d) => d.y !== null)
			.x((d) => xCenter(d))
			.y((d) => yScale(d.y!))
			.curve(d3.curveMonotoneX);
		// Add the line path
		chart
			.append('path')
			.datum(data)
			.attr('fill', 'none')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('d', line);
		// Add circles at each data point where y is not null
		chart
			.selectAll('.data-point')
			.data(data.filter((d) => d.y !== null))
			.join('circle')
			.attr('class', 'data-point')
			.attr('cx', (d) => xCenter(d))
			.attr('cy', (d) => yScale(d.y!))
			.attr('r', 2.5)
			.attr('fill', color);
		// Add a transparent layer for capturing hover events
		chart
			.append('rect')
			.attr('width', innerWidth)
			.attr('height', innerHeight)
			.attr('fill', 'transparent')
			.style('pointer-events', 'all')
			.on('mousemove', function (event) {
				const [mouseX, mouseY] = d3.pointer(event, chartContainer);
				const xPositions = data.map((d) => xCenter(d));
				const index = d3.bisectCenter(xPositions, mouseX - MARGIN.left);

				if (index >= 0 && index < data.length) {
					const d = data[index];
					if (d.y !== null) {
						d3.select(tooltip)
							.style('visibility', 'visible')
							.style('left', `${mouseX}px`)
							.style('top', `${mouseY - 20}px`)
							.html(
								`<strong>Date:</strong> ${d.x}<br><strong>Value:</strong> ${d.y}`,
							);
					} else {
						d3.select(tooltip).style('visibility', 'hidden');
					}
				}
			})
			.on('mouseout', function () {
				// Hide the tooltip
				d3.select(tooltip).style('visibility', 'hidden');
			});
	}
	onMount(() => {
		createChart();
		// Handle resize
		const resizeObserver = new ResizeObserver(() => {
			createChart();
		});
		if (chartContainer) {
			resizeObserver.observe(chartContainer);
		}
		return () => {
			resizeObserver.disconnect();
		};
	});
	$effect(() => {
		if (data && chartContainer) {
			createChart();
		}
	});
</script>

<div class="chart-wrapper relative">
	{#if isLoading}
		<div
			class="text-primary loading loading-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		></div>
	{/if}

	{#if !isLoading && data.length === 0}
		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-500"
		>
			No data available
		</div>
	{/if}
	<div class="chart-container w-full" bind:this={chartContainer}></div>
	<div class="tooltip" bind:this={tooltip}></div>
</div>

<style>
	.chart-wrapper {
		margin-bottom: 1.5rem;
	}
	.chart-container {
		position: relative;
		height: auto;
		min-height: 200px;
	}
	.tooltip {
		position: absolute;
		visibility: hidden;
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 10px;
		border-radius: 4px;
		font-size: 12px;
		pointer-events: none;
		z-index: 10;
		transform: translate(-50%, -100%);
		white-space: nowrap;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
</style>
