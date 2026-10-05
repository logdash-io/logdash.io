<script lang="ts">
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { match } from 'ts-pattern';
  import { thinTicks } from './data.utils.js';

  type Format = 'minute' | 'hour' | 'day';
  type DataPoint = {
    x: number | string | Date;
    y: number | null;
  };
  type Props = {
    data: DataPoint[];
    isLoading?: boolean;
    failed?: boolean;
    color?: string;
    height?: number;
    format?: Format;
    timeRange: 'small' | 'large';
  };
  const {
    isLoading = false,
    failed = false,
    data,
    color = 'var(--fg-default)',
    height = 200,
    format = 'minute',
    timeRange = 'small',
  }: Props = $props();

  let chartContainer: HTMLElement;
  let tooltip: HTMLElement;
  const MARGIN = { top: 12, right: 8, bottom: 20, left: 44 };
  const AXIS_COLOR = 'var(--fg-muted)';
  const AXIS_LINE_COLOR = 'var(--surface-50-border)';
  function createChart() {
    if (!chartContainer || !data || data.length === 0) {
      d3.select(chartContainer).selectAll('*').remove();
      return;
    }
    d3.select(chartContainer).selectAll('*').remove();
    const width = chartContainer.clientWidth;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;
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
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => String(d.x)))
      .range([0, innerWidth])
      .padding(0.1);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.y) || 0])
      .range([innerHeight, 0]);
    const xCenter = (d: DataPoint): number =>
      xScale(String(d.x))! + xScale.bandwidth() / 2;

    function getTickLabelForDisplay(
      value: string,
      currentFormat: Format,
      currentTimeRange: 'small' | 'large',
    ): string {
      return match(currentFormat)
        .with('minute', () => {
          const minute = parseInt(value.split(':')[1], 10);
          if (currentTimeRange === 'small') {
            return minute % 5 === 0 ? value : '';
          }
          return minute === 0 || minute === 30 ? value : '';
        })
        .with('hour', () => {
          const hour = parseInt(value.split(' ')[1].split(':')[0], 10);
          if (currentTimeRange === 'small') {
            return value;
          }
          return hour === 0 || hour === 12 ? value : '';
        })
        .with('day', () => value)
        .exhaustive();
    }

    const tickValues = thinTicks(
      xScale
        .domain()
        .filter(
          (tick) => getTickLabelForDisplay(tick, format, timeRange) !== '',
        ),
      innerWidth,
    );

    const xAxis = chart
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickValues)
          .tickSize(0)
          .tickPadding(8)
          .tickFormat((tick) =>
            getTickLabelForDisplay(tick, format, timeRange),
          ),
      )
      .attr('color', AXIS_COLOR);

    xAxis.selectAll('path, line').attr('stroke', AXIS_LINE_COLOR);
    xAxis
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-family', 'var(--font-mono)');

    chart
      .append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(0).tickPadding(8))
      .attr('color', AXIS_COLOR)
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('text')
          .style('font-size', '10px')
          .style('font-family', 'var(--font-mono)'),
      );
    const line = d3
      .line<DataPoint>()
      .defined((d) => d.y !== null)
      .x((d) => xCenter(d))
      .y((d) => yScale(d.y!))
      .curve(d3.curveMonotoneX);
    chart
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);
    chart
      .selectAll('.data-point')
      .data(data.filter((d) => d.y !== null))
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xCenter(d))
      .attr('cy', (d) => yScale(d.y!))
      .attr('r', 2.5)
      .attr('fill', color);
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
              .style('position', 'absolute')
              .html(
                `<strong>Date:</strong> ${String(d.x)}<br><strong>Value:</strong> ${d.y}`,
              );
          } else {
            d3.select(tooltip).style('visibility', 'hidden');
          }
        }
      })
      .on('mouseout', function () {
        d3.select(tooltip).style('visibility', 'hidden');
      });

    d3.select(tooltip).style('position', 'absolute');
  }
  onMount(() => {
    createChart();
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

<div class="chart-wrapper relative h-full">
  {#if isLoading}
    <Spinner
      size="sm"
      class="text-fg-muted absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    />
  {/if}

  {#if !isLoading && data.length === 0}
    <div
      class="text-fg-muted absolute inset-0 flex items-center justify-center gap-2 text-sm"
    >
      {#if failed}
        <DangerIcon class="size-4" />
        Could not load this metric
      {:else}
        No data in this range
      {/if}
    </div>
  {/if}
  <div class="chart-container w-full" bind:this={chartContainer}></div>
  <div class="point-tooltip" bind:this={tooltip}></div>
</div>

<style>
  .chart-container {
    position: relative;
  }
  .point-tooltip {
    position: absolute;
    visibility: hidden;
    background-color: var(--surface-elevated-bg);
    color: var(--fg-default);
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 12px;
    pointer-events: none;
    z-index: 10;
    transform: translate(-50%, -100%);
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>
