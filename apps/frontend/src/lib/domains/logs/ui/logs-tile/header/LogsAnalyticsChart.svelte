<script lang="ts">
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { logAnalyticsState } from '$lib/domains/logs/application/log-analytics.state.svelte.js';
  import type { LogsAnalyticsResponse } from '$lib/domains/logs/domain/logs-analytics-response.js';
  import { AlertTriangleIcon } from 'lucide-svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';

  type Props = {
    selectedStartDate: string | null;
    selectedEndDate: string | null;
    onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  };

  let {
    selectedStartDate = $bindable(),
    selectedEndDate = $bindable(),
    onDateRangeChange,
  }: Props = $props();

  let chartContainer: HTMLElement;
  let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  let isDragging = $state(false);
  let dragStart: Date | null = $state(null);
  let dragEnd: Date | null = $state(null);
  let currentTooltipBucket: LogsAnalyticsResponse['buckets'][0] | null = null;

  const CHART_HEIGHT = 70;
  const MARGIN = { top: 5, right: 10, bottom: 25, left: 5 };
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

  const analyticsData = $derived(logAnalyticsState.analyticsData);
  const isLoading = $derived(logAnalyticsState.isLoading);
  const error = $derived(logAnalyticsState.error);

  function createChart(container: HTMLElement, data: LogsAnalyticsResponse) {
    if (!container || isLoading) return;

    d3.select(container).selectAll('*').remove();

    if (data.buckets.length === 0 && !isLoading) {
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
    const timeRangeToUse = {
      start: new Date(data.buckets[0].bucketStart),
      end: new Date(data.buckets[data.buckets.length - 1].bucketEnd),
    };

    const xScale = d3
      .scaleTime()
      .domain([timeRangeToUse.start, timeRangeToUse.end])
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
    const xAxis = chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat((d: Date) => {
            return d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
          }),
      )
      .attr('color', '#909090');

    xAxis
      .selectAll('text')
      .style('font-size', '9px')
      .style('font-family', 'monospace');
    xAxis.selectAll('path, line').attr('stroke', '#393939');

    // Align text to prevent cutoff
    xAxis.selectAll('text').each(function (d, i, nodes) {
      const text = d3.select(this);
      if (i === 0) {
        // First tick - align to start (left)
        text.attr('text-anchor', 'start');
      } else if (i === nodes.length - 1) {
        // Last tick - align to end (right)
        text.attr('text-anchor', 'end');
      } else {
        // Middle ticks - keep centered
        text.attr('text-anchor', 'middle');
      }
    });

    // Add drag selection
    addDragSelection(chart, xScale, innerWidth, innerHeight);
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
    let dragStartX: number | null = null;

    // Add invisible overlay for drag interaction
    const overlay = chart
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    const dragBehavior = d3
      .drag<SVGRectElement, unknown>()
      .on('start', (event) => {
        isDragging = true;
        // Get coordinates relative to the chart group (overlay)
        const [rawX] = d3.pointer(event, overlay.node());
        // Clamp coordinates to chart boundaries
        const x = Math.max(0, Math.min(width, rawX));
        dragStartX = x;
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
        if (!dragSelection || dragStartX === null) return;

        // Get coordinates relative to the chart group (overlay)
        const [rawX] = d3.pointer(event, overlay.node());
        // Clamp coordinates to chart boundaries
        const x = Math.max(0, Math.min(width, rawX));
        dragEnd = xScale.invert(x);

        // Work with raw pixel coordinates for visual selection
        const minX = Math.min(dragStartX, x);
        const maxX = Math.max(dragStartX, x);

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

          // Only update if there's a meaningful range (more than 1 minute)
          if (end.getTime() - start.getTime() > 1 * 60000) {
            selectedStartDate = start.toISOString();
            selectedEndDate = end.toISOString();
            onDateRangeChange?.(start, end);
          }
        }

        dragStart = null;
        dragEnd = null;
        dragStartX = null;
      });

    overlay
      .call(dragBehavior)
      .on('mousemove', (event) => {
        if (!isDragging) {
          handleOverlayMouseMove(event, xScale, width);
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
    width: number,
  ) {
    const [rawX] = d3.pointer(event);
    // Clamp coordinates to chart boundaries
    const x = Math.max(0, Math.min(width, rawX));
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

  function showTooltip(
    event: any,
    bucket: LogsAnalyticsResponse['buckets'][0],
  ) {
    const bucketStart = new Date(bucket.bucketStart);
    const bucketEnd = new Date(bucket.bucketEnd);

    const formattedDateRange = `${bucketStart.toLocaleDateString()} ${bucketStart.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    )} - ${bucketEnd.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

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
        <div class="font-semibold font-mono">${formattedDateRange}</div>
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
      .attr('class', 'flex items-center justify-center text-gray-400')
      .style('height', `${CHART_HEIGHT}px`)
      .html('<p>No log data available</p>');
  }

  function clearSelection() {
    selectedStartDate = null;
    selectedEndDate = null;

    onDateRangeChange?.(null, null);
  }

  function handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      clearSelection();
    }
  }

  onMount(() => {
    tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip ld-card-base rounded-xl')
      .style('display', 'none')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('color', 'var(--color-base-content)')
      .style('pointer-events', 'none')
      .style('z-index', '99999')
      .style('max-width', '300px')
      .style('font-family', 'monospace');

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

  // Handle escape key to clear selection
  $effect(() => {
    if (selectedStartDate || selectedEndDate) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  });
</script>

<div class="space-y-4 p-4 pb-0 font-mono">
  <div class="chart-container relative">
    {#if isLoading}
      <div
        transition:fade={{ duration: 200, easing: cubicOut }}
        class="bg-base-300/50 text-secondary/60 absolute inset-0 flex h-full w-full items-center justify-center pb-4 text-xs"
        style="height: {CHART_HEIGHT}px"
      >
        <span class="loading loading-spinner loading-xs mr-2"></span>
        Loading analytics data...
      </div>
    {:else if error}
      <div
        class="bg-base-300/50 text-error-content absolute inset-0 flex h-full w-full items-center justify-center pb-4 text-xs"
        style="height: {CHART_HEIGHT}px"
      >
        <span class="mr-2">
          <AlertTriangleIcon class="size-4" />
        </span>
        Failed to load analytics data
      </div>
    {/if}
    <div class="chart-wrapper w-full" bind:this={chartContainer}></div>
  </div>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
  }

  .chart-wrapper {
    width: 100%;
    min-height: 70px;
    overflow: hidden;
  }

  :global(.chart-tooltip) {
    font-size: 0.875rem;
    min-width: 150px;
    white-space: nowrap;
    z-index: 1000;
  }
</style>
