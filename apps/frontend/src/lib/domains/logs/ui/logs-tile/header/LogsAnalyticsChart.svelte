<script lang="ts">
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { logAnalyticsState } from '$lib/domains/logs/application/log-analytics.state.svelte.js';
  import type { LogsAnalyticsResponse } from '$lib/domains/logs/domain/logs-analytics-response.js';
  import type { LogLevel } from '$lib/domains/logs/domain/log-level.js';
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { cubicOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';

  type Props = {
    onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  };

  const { onDateRangeChange }: Props = $props();

  let chartContainer: HTMLElement;
  let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  let isDragging = $state(false);
  let dragStart: Date | null = $state(null);
  let dragEnd: Date | null = $state(null);
  let currentTooltipBucket: LogsAnalyticsResponse['buckets'][0] | null = null;

  const CHART_HEIGHT = 72;
  const MARGIN = { top: 4, right: 0, bottom: 20, left: 0 };
  const AXIS_COLOR = 'var(--fg-muted)';
  const AXIS_LINE_COLOR = 'var(--surface-50-border)';
  const SELECTION_COLOR = 'var(--surface-50-selected-bg)';
  const TIME_FORMAT: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  };
  const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };
  const LOG_TYPES: LogLevel[] = [
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
    'var(--surface-200-bg)',
    'var(--surface-200-bg)',
    'var(--surface-200-bg)',
    'var(--surface-200-bg)',
    'var(--surface-200-bg)',
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

    data.buckets.forEach((bucket) => {
      const bucketStart = new Date(bucket.bucketStart);
      const bucketEnd = new Date(bucket.bucketEnd);

      const xStart = xScale(bucketStart);
      const xEnd = xScale(bucketEnd);
      const actualBarWidth = Math.max(1, (xEnd - xStart) * 0.8);
      const barX = xStart + (xEnd - xStart - actualBarWidth) / 2;

      const other = LOG_TYPES.slice(2).reduce(
        (sum, logType) => sum + bucket.countByLevel[logType],
        0,
      );
      const segments = [
        { count: bucket.countByLevel.error, color: colorScale('error') },
        { count: bucket.countByLevel.warning, color: colorScale('warning') },
        { count: other, color: colorScale('info') },
      ];

      let yOffset = innerHeight;

      segments.forEach(({ count, color }) => {
        if (count <= 0) {
          return;
        }

        const barHeight = innerHeight - yScale(count);

        chart
          .append('rect')
          .attr('x', barX)
          .attr('y', yOffset - barHeight)
          .attr('width', actualBarWidth)
          .attr('height', barHeight)
          .attr('fill', color)
          .attr('shape-rendering', 'crispEdges');

        yOffset -= barHeight;
      });
    });

    const xAxis = chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom<Date>(xScale)
          .tickSize(0)
          .tickPadding(8)
          .ticks(Math.max(2, Math.min(6, Math.floor(innerWidth / 90))))
          .tickFormat((d: Date) =>
            timeRangeToUse.end.getTime() - timeRangeToUse.start.getTime() >
            2 * 86_400_000
              ? d.toLocaleDateString([], DATE_FORMAT)
              : d.toLocaleTimeString([], TIME_FORMAT),
          ),
      )
      .attr('color', AXIS_COLOR);

    xAxis
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-family', 'var(--font-mono)');
    xAxis.selectAll('path, line').attr('stroke', AXIS_LINE_COLOR);

    xAxis.selectAll('text').each(function (d, i, nodes) {
      const text = d3.select(this);
      if (i === 0) {
        text.attr('text-anchor', 'start');
      } else if (i === nodes.length - 1) {
        text.attr('text-anchor', 'end');
      } else {
        text.attr('text-anchor', 'middle');
      }
    });

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
        const [rawX] = d3.pointer(event, overlay.node());
        const x = Math.max(0, Math.min(width, rawX));
        dragStartX = x;
        dragStart = xScale.invert(x);
        dragEnd = null;

        hideTooltip();

        dragSelection = chart
          .append('rect')
          .attr('class', 'drag-selection')
          .attr('x', x)
          .attr('y', 0)
          .attr('width', 0)
          .attr('height', height)
          .attr('fill', SELECTION_COLOR)
          .lower();
      })
      .on('drag', (event) => {
        if (!dragSelection || dragStartX === null) return;

        const [rawX] = d3.pointer(event, overlay.node());
        const x = Math.max(0, Math.min(width, rawX));
        dragEnd = xScale.invert(x);

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

          if (end.getTime() - start.getTime() > 1 * 60000) {
            onDateRangeChange?.(start, end);
          }
        }

        dragStart = null;
        dragEnd = null;
        dragStartX = null;
      });

    overlay
      .call(dragBehavior)
      .on('mousemove', (event: MouseEvent) => {
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
    event: MouseEvent,
    xScale: d3.ScaleTime<number, number>,
    width: number,
  ) {
    const [rawX] = d3.pointer(event);
    const x = Math.max(0, Math.min(width, rawX));
    const hoverDate = xScale.invert(x);

    const bucket = analyticsData?.buckets.find((b) => {
      const bucketStart = new Date(b.bucketStart);
      const bucketEnd = new Date(b.bucketEnd);
      return hoverDate >= bucketStart && hoverDate < bucketEnd;
    });

    if (bucket) {
      if (currentTooltipBucket !== bucket) {
        currentTooltipBucket = bucket;
        showTooltip(event, bucket);
      } else {
        moveTooltip(event);
      }
    } else {
      currentTooltipBucket = null;
      hideTooltip();
    }
  }

  function showTooltip(
    event: MouseEvent,
    bucket: LogsAnalyticsResponse['buckets'][0],
  ) {
    const bucketStart = new Date(bucket.bucketStart);
    const bucketEnd = new Date(bucket.bucketEnd);

    const formattedDateRange = `${bucketStart.toLocaleDateString()} ${bucketStart.toLocaleTimeString([], TIME_FORMAT)} - ${bucketEnd.toLocaleTimeString([], TIME_FORMAT)}`;

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(LOG_TYPES)
      .range(LOG_COLORS);

    const tooltipX = Math.min(event.pageX + 10, window.innerWidth - 200);
    const tooltipY = event.pageY - 100;

    tooltip
      .style('display', 'block')
      .style('left', `${tooltipX}px`)
      .style('top', `${tooltipY}px`).html(`
        <div class="font-medium font-mono">${formattedDateRange}</div>
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
        <div class="mt-2 pt-1 border-t border-surface-elevated-border font-medium font-mono">
          Total: ${bucket.countTotal}
        </div>
      `);
  }

  function hideTooltip() {
    tooltip.style('display', 'none');
    currentTooltipBucket = null;
  }

  function moveTooltip(event: MouseEvent) {
    const tooltipX = Math.min(event.pageX + 10, window.innerWidth - 200);
    const tooltipY = event.pageY - 100;

    tooltip.style('left', `${tooltipX}px`).style('top', `${tooltipY}px`);
  }

  function renderEmptyState(container: HTMLElement) {
    d3.select(container)
      .append('div')
      .attr('class', 'flex items-center text-xs text-fg-muted')
      .style('height', `${CHART_HEIGHT}px`)
      .text('No logs in this range');
  }

  onMount(() => {
    tooltip = d3
      .select(document.body)
      .append('div')
      .attr(
        'class',
        'chart-tooltip bg-surface-elevated-bg border-surface-elevated-border rounded-xl border',
      )
      .style('display', 'none')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('color', 'var(--fg-default)')
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

  $effect(() => {
    if (analyticsData && chartContainer) {
      createChart(chartContainer, analyticsData);
    }
  });
</script>

<div class="chart-container relative">
  {#if isLoading}
    <div
      transition:fade={{ duration: 200, easing: cubicOut }}
      class="bg-surface-50-bg text-fg-muted absolute inset-0 flex items-center gap-2 text-xs"
      style="height: {CHART_HEIGHT}px"
    >
      <Spinner size="xs" aria-hidden="true" />
      Loading log volume
    </div>
  {:else if error}
    <div
      class="bg-surface-50-bg text-fg-muted absolute inset-0 flex items-center gap-2 text-xs"
      style="height: {CHART_HEIGHT}px"
    >
      <DangerIcon class="size-4" />
      Could not load log volume
    </div>
  {/if}
  <div class="chart-wrapper w-full" bind:this={chartContainer}></div>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
  }

  .chart-wrapper {
    width: 100%;
    min-height: 72px;
    overflow: hidden;
  }

  :global(.chart-tooltip) {
    font-size: 0.875rem;
    min-width: 150px;
    white-space: nowrap;
    z-index: 1000;
  }
</style>
