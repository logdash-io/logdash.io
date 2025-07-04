<script lang="ts">
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { logAnalyticsState } from '$lib/domains/logs/application/log-analytics.state.svelte.js';
  import type { LogsAnalyticsResponse } from '$lib/domains/logs/domain/logs-analytics-response.js';

  type Props = {
    projectId: string;
    onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  };

  const { projectId, onDateRangeChange }: Props = $props();

  let chartContainer: HTMLElement;
  let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  let isDragging = $state(false);
  let dragStart: Date | null = $state(null);
  let dragEnd: Date | null = $state(null);
  let selectedRange = $state<{ start: Date; end: Date } | null>(null);
  let currentTooltipBucket: LogsAnalyticsResponse['buckets'][0] | null = null;
  let zoomedTimeRange = $state<{ start: Date; end: Date } | null>(null);

  const CHART_HEIGHT = 60;
  const MARGIN = { top: 5, right: 10, bottom: 15, left: 5 };
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
    '#262626',
    '#262626',
    '#262626',
    '#262626',
    '#262626',
  ];

  async function fetchAnalyticsData(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<void> {
    if (!projectId) return;

    try {
      const now = new Date();
      const endTime = timeRange?.end || now;
      const startTime =
        timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await logAnalyticsState.fetchAnalytics(
        projectId,
        startTime.toISOString(),
        endTime.toISOString(),
        0, // UTC offset, can be made configurable
      );
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // The error will be handled by the state and displayed in the UI
    }
  }

  const analyticsData = $derived(logAnalyticsState.analyticsData);
  const isLoading = $derived(logAnalyticsState.isLoading);
  const error = $derived(logAnalyticsState.error);

  function createChart(container: HTMLElement, data: LogsAnalyticsResponse) {
    if (!container) return;

    d3.select(container).selectAll('*').remove();

    if (data.buckets.length === 0) {
      renderEmptyState(container);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const width = Math.max(
      containerRect.width || 800,
      container.clientWidth || 800,
      container.offsetWidth || 800,
    );
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', CHART_HEIGHT)
      .attr('viewBox', `0 0 ${width} ${CHART_HEIGHT}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('max-width', '100%')
      .style('overflow', 'visible');

    const chart = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain([
        new Date(data.buckets[0].bucketStart),
        new Date(data.buckets[data.buckets.length - 1].bucketEnd),
      ])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data.buckets, (d) => d.countTotal)!])
      .nice()
      .range([innerHeight, 0]);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(LOG_TYPES)
      .range(LOG_COLORS);

    // No grid lines needed without Y axis

    // Draw bars
    const barWidth = (innerWidth / data.buckets.length) * 0.8;

    data.buckets.forEach((bucket, index) => {
      const bucketStart = new Date(bucket.bucketStart);
      const bucketEnd = new Date(bucket.bucketEnd);

      // Position bars to fill the space between bucket start and end
      const xStart = xScale(bucketStart);
      const xEnd = xScale(bucketEnd);
      const actualBarWidth = Math.max(1, (xEnd - xStart) * 0.8);
      const barX = xStart + (xEnd - xStart - actualBarWidth) / 2;

      let yOffset = innerHeight;

      LOG_TYPES.forEach((logType) => {
        const count = bucket.countByLevel[logType];
        if (count > 0) {
          const barHeight = innerHeight - yScale(count);

          chart
            .append('rect')
            .attr('class', `bar-${logType}`)
            .attr('x', barX)
            .attr('y', yOffset - barHeight)
            .attr('width', actualBarWidth)
            .attr('height', barHeight)
            .attr('fill', colorScale(logType))
            .attr('opacity', 0.9);

          yOffset -= barHeight;
        }
      });
    });

    // Draw axes (X axis only)
    chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(4)
          .tickFormat((d: Date) => {
            return d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
          }),
      )
      .attr('color', '#94a3b8')
      .selectAll('text')
      .style('font-size', '9px');

    // Add drag selection
    addDragSelection(chart, xScale, innerWidth, innerHeight);

    // Draw selected range if exists
    if (selectedRange) {
      drawSelectedRange(chart, xScale, innerWidth, innerHeight, selectedRange);
    }
  }

  function addDragSelection(
    chart: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number>,
    width: number,
    height: number,
  ) {
    let dragSelection: d3.Selection<
      SVGRectElement,
      unknown,
      null,
      undefined
    > | null = null;

    const dragBehavior = d3
      .drag<SVGRectElement, unknown>()
      .on('start', (event) => {
        isDragging = true;
        const [x] = d3.pointer(event);
        dragStart = xScale.invert(x);
        dragEnd = null;

        // Hide tooltip when starting drag
        hideTooltip();

        // Create selection rectangle - use raw pixel coordinates
        dragSelection = chart
          .append('rect')
          .attr('class', 'drag-selection')
          .attr('x', x)
          .attr('y', 0)
          .attr('width', 0)
          .attr('height', height)
          .attr('fill', 'rgba(59, 130, 246, 0.2)')
          .attr('stroke', 'rgba(59, 130, 246, 0.5)')
          .attr('stroke-width', 1);
      })
      .on('drag', (event) => {
        if (!dragSelection || !dragStart) return;

        const [x] = d3.pointer(event);
        dragEnd = xScale.invert(x);

        // Work with raw pixel coordinates for visual selection
        const startX = xScale(dragStart);
        const endX = x;

        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);

        dragSelection.attr('x', minX).attr('width', maxX - minX);
      })
      .on('end', () => {
        isDragging = false;

        if (dragSelection) {
          dragSelection.remove();
          dragSelection = null;
        }

        if (dragStart && dragEnd) {
          const start = dragStart < dragEnd ? dragStart : dragEnd;
          const end = dragStart < dragEnd ? dragEnd : dragStart;

          // Only update if there's a meaningful range (more than 5 minutes)
          if (end.getTime() - start.getTime() > 5 * 60000) {
            selectedRange = { start, end };
            onDateRangeChange?.(start, end);

            // Zoom to 90% of the selected range
            zoomToRange(start, end);
          }
        }

        dragStart = null;
        dragEnd = null;
      });

    // Add invisible overlay for drag interaction
    chart
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .call(dragBehavior)
      .on('mousemove', (event) => {
        if (!isDragging) {
          handleOverlayMouseMove(event, xScale);
        }
      })
      .on('mouseout', () => {
        if (!isDragging) {
          hideTooltip();
        }
      });
  }

  function handleOverlayMouseMove(
    event: any,
    xScale: d3.ScaleTime<number, number>,
  ) {
    const [x] = d3.pointer(event);
    const hoverDate = xScale.invert(x);

    // Find the bucket that corresponds to this x position
    const bucket = analyticsData?.buckets.find((b) => {
      const bucketStart = new Date(b.bucketStart);
      const bucketEnd = new Date(b.bucketEnd);
      return hoverDate >= bucketStart && hoverDate < bucketEnd;
    });

    if (bucket) {
      // Show tooltip if bucket changed or tooltip is not visible
      if (currentTooltipBucket !== bucket) {
        currentTooltipBucket = bucket;
        showTooltip(event, bucket);
      } else {
        // Same bucket, just move the tooltip
        moveTooltip(event);
      }
    } else {
      currentTooltipBucket = null;
      hideTooltip();
    }
  }

  function drawSelectedRange(
    chart: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number>,
    width: number,
    height: number,
    range: { start: Date; end: Date },
  ) {
    const startX = xScale(range.start);
    const endX = xScale(range.end);

    chart
      .append('rect')
      .attr('class', 'selected-range')
      .attr('x', startX)
      .attr('y', 0)
      .attr('width', endX - startX)
      .attr('height', height)
      .attr('fill', 'rgba(59, 130, 246, 0.1)')
      .attr('stroke', 'rgba(59, 130, 246, 0.8)')
      .attr('stroke-width', 2)
      .attr('pointer-events', 'none');
  }

  function showTooltip(
    event: any,
    bucket: LogsAnalyticsResponse['buckets'][0],
  ) {
    const bucketStart = new Date(bucket.bucketStart);
    const formattedDate = bucketStart.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(LOG_TYPES)
      .range(LOG_COLORS);

    // Position tooltip above the chart to prevent it going off-screen
    const tooltipX = Math.min(event.pageX + 10, window.innerWidth - 200);
    const tooltipY = event.pageY - 100;

    tooltip
      .style('display', 'block')
      .style('left', `${tooltipX}px`)
      .style('top', `${tooltipY}px`).html(`
        <div class="font-semibold font-mono">${formattedDate}</div>
        ${LOG_TYPES.map((logType) => {
          const count = bucket.countByLevel[logType];
          return count > 0
            ? `
            <div class="flex items-center mt-1 font-mono">
              <span class="w-3 h-3 inline-block mr-2" style="background-color: ${colorScale(logType)}"></span>
              <span>${logType}: ${count}</span>
            </div>
          `
            : '';
        }).join('')}
        <div class="mt-2 pt-1 border-t border-gray-600 font-semibold font-mono">
          Total: ${bucket.countTotal}
        </div>
      `);
  }

  function hideTooltip() {
    tooltip.style('display', 'none');
    currentTooltipBucket = null;
  }

  function moveTooltip(event: any) {
    const tooltipX = Math.min(event.pageX + 10, window.innerWidth - 200);
    const tooltipY = event.pageY - 100;

    tooltip.style('left', `${tooltipX}px`).style('top', `${tooltipY}px`);
  }

  function renderEmptyState(container: HTMLElement) {
    d3.select(container)
      .append('div')
      .attr('class', 'flex items-center justify-center h-15 text-gray-400')
      .html('<p>No log data available</p>');
  }

  function zoomToRange(start: Date, end: Date) {
    // Calculate 90% zoom - add 5% padding on each side
    const rangeDuration = end.getTime() - start.getTime();
    const paddingDuration = rangeDuration * 0.05; // 5% padding on each side

    const zoomStart = new Date(start.getTime() - paddingDuration);
    const zoomEnd = new Date(end.getTime() + paddingDuration);

    zoomedTimeRange = { start: zoomStart, end: zoomEnd };

    // Fetch new data for the zoomed range
    fetchAnalyticsData(zoomedTimeRange);
  }

  function clearSelection() {
    selectedRange = null;
    zoomedTimeRange = null;

    // Fetch data for the original time range (last 24 hours)
    fetchAnalyticsData();
  }

  onMount(() => {
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

    // Fetch initial data
    fetchAnalyticsData();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (analyticsData) {
          createChart(chartContainer, analyticsData);
        }
      }, 150);
    });

    if (chartContainer) {
      resizeObserver.observe(chartContainer);
    }

    return () => {
      if (tooltip) tooltip.remove();
      resizeObserver.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  });

  // Re-render chart when analytics data changes
  $effect(() => {
    if (analyticsData && chartContainer) {
      createChart(chartContainer, analyticsData);
    }
  });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">
      Logs Analytics
      {#if zoomedTimeRange}
        <span class="text-sm font-normal text-blue-400">(Zoomed)</span>
      {/if}
    </h3>

    <div class="flex items-center gap-2">
      {#if isLoading}
        <span class="text-sm text-gray-400">
          <span class="loading loading-spinner loading-xs mr-1"></span>
          Fetching data...
        </span>
      {:else if zoomedTimeRange}
        <span class="text-sm text-gray-400">
          Zoomed: {zoomedTimeRange.start.toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
          })} - {zoomedTimeRange.end.toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <button class="btn btn-sm btn-outline" onclick={clearSelection}>
          Reset Zoom
        </button>
      {:else if selectedRange}
        <span class="text-sm text-gray-400">
          Selected: {selectedRange.start.toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
          })} - {selectedRange.end.toLocaleString([], {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <button class="btn btn-sm btn-outline" onclick={clearSelection}>
          Clear
        </button>
      {:else}
        <span class="text-sm text-gray-400">
          Drag to select date range • Last 24 hours
        </span>
      {/if}
    </div>
  </div>

  <div class="chart-container">
    {#if isLoading}
      <div class="flex h-15 items-center justify-center text-gray-400">
        <span class="loading loading-spinner loading-sm mr-2"></span>
        Loading analytics data...
      </div>
    {:else if error}
      <div class="flex h-15 items-center justify-center text-red-400">
        <span class="mr-2">⚠️</span>
        Failed to load analytics data: {error}
      </div>
    {:else}
      <div class="chart-wrapper w-full" bind:this={chartContainer}></div>
    {/if}
  </div>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
  }

  .chart-wrapper {
    width: 100%;
    min-height: 60px;
    overflow: hidden;
  }

  :global(.chart-tooltip) {
    font-size: 0.875rem;
    min-width: 150px;
    white-space: nowrap;
    z-index: 1000;
  }
</style>
