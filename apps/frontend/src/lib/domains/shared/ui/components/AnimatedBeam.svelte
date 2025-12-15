<script lang="ts">
  import { cn } from '$lib/domains/shared/utils/cn';
  import { onMount } from 'svelte';

  // Svelte 5 Props
  interface Props {
    class?: string;
    containerRef: HTMLDivElement | null; // Container Element
    fromRef: HTMLDivElement | null; // Element 1 (Start)
    toRef: HTMLDivElement | null; // Element 2 (End)
    curvature?: number; // Curvature of the beam
    reverse?: boolean; // Reverse the animation
    pathColor?: string; // Color of the path
    pathWidth?: number; // Width of the path
    pathOpacity?: number; // Opacity of the path
    gradientStartColor?: string; // Gradient Start Color
    gradientStopColor?: string; // Gradient Stop Color
    delay?: number; // Delay of the animation
    duration?: number; // Duration of the animation
    startXOffset?: number; // Start X Offset
    startYOffset?: number; // Start Y Offset
    endXOffset?: number; // End X Offset
    endYOffset?: number; // End Y Offset
  }

  let {
    class: className,
    containerRef,
    fromRef,
    toRef,
    curvature = 0,
    reverse = false,
    duration = Math.random() * 3 + 4,
    delay = 0,
    pathColor = 'gray',
    pathWidth = 2,
    pathOpacity = 0.2,
    gradientStartColor = '#ffaa40',
    gradientStopColor = '#9c40ff',
    startXOffset = 0,
    startYOffset = 0,
    endXOffset = 0,
    endYOffset = 0,
  }: Props = $props();

  let id = crypto.randomUUID();
  let pathD = $state('');
  let svgDimensions = $state({ width: 0, height: 0 });

  // Calculate the gradient coordinates based on the reverse prop
  let gradientCoordinates = $derived(
    reverse
      ? {
          x1: '90%',
          x2: '-5%',
          y1: '0%',
          y2: '0%',
        }
      : {
          x1: '10%',
          x2: '110%',
          y1: '0%',
          y2: '0%',
        },
  );

  let updatePath = () => {
    if (containerRef && fromRef && toRef) {
      const containerRect = containerRef.getBoundingClientRect();
      const rectA = fromRef.getBoundingClientRect();
      const rectB = toRef.getBoundingClientRect();

      const svgWidth = containerRect.width;
      const svgHeight = containerRect.height;
      svgDimensions = { width: svgWidth, height: svgHeight };

      const startX =
        rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
      const startY =
        rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
      const endX =
        rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
      const endY =
        rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

      const controlY = startY - curvature;
      const d = `M ${startX},${startY} Q ${
        (startX + endX) / 2
      },${controlY} ${endX},${endY}`;
      pathD = d;
    }
  };

  onMount(() => {
    // Initial update
    updatePath();

    // Use ResizeObserver to handle size changes
    const resizeObserver = new ResizeObserver(() => {
      updatePath();
    });

    if (containerRef) {
      resizeObserver.observe(containerRef);
    }

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<svg
  fill="none"
  width={svgDimensions.width}
  height={svgDimensions.height}
  xmlns="http://www.w3.org/2000/svg"
  class={cn(
    'pointer-events-none absolute left-0 top-0 transform-gpu stroke-2',
    className,
  )}
  viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
>
  <path
    d={pathD}
    style="stroke: {pathColor}; stroke-width: {pathWidth}; stroke-opacity: {pathOpacity};"
  />
  <path
    d={pathD}
    style="stroke: url(#gradient-{id}); stroke-width: {pathWidth}; stroke-opacity: 1;"
  />
  <defs>
    <linearGradient
      id="gradient-{id}"
      gradientUnits="userSpaceOnUse"
      x1="0%"
      x2="0%"
      y1="0%"
      y2="0%"
    >
      <stop stop-color={gradientStartColor} stop-opacity="0"></stop>
      <stop stop-color={gradientStartColor}></stop>
      <stop offset="32.5%" stop-color={gradientStopColor}></stop>
      <stop
        offset="100%"
        stop-color={gradientStopColor}
        stop-opacity="0"
      ></stop>
      <animate
        attributeName="x1"
        values={gradientCoordinates.x1}
        dur="{duration}s"
        keyTimes="0; 1"
        repeatCount="indefinite"
        begin="{delay}s"
      ></animate>
      <animate
        attributeName="x2"
        values={gradientCoordinates.x2}
        dur="{duration}s"
        keyTimes="0; 1"
        repeatCount="indefinite"
        begin="{delay}s"
      ></animate>
    </linearGradient>
  </defs>
</svg>
