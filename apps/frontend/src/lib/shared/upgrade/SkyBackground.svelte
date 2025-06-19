<script lang="ts">
  import { getRandomNumberBetween } from '$lib/shared/utils/get-random-number-between';

  let { density = 9, speed = 2, comets = true } = $props(); // Svelte 5 props

  let skyBackgroundElement: HTMLDivElement | null = $state(null);
  let containerSize = $derived.by(() => {
    if (skyBackgroundElement) {
      const rect = skyBackgroundElement.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
      };
    }
    return { width: 400, height: 300 };
  });

  function generateStars(baseCount, seed, layerOffset = 0, starSize = 1) {
    const actualCount = Math.floor(baseCount * density);
    const stars = [];

    // Use reactive container size, but double the height since .stars has height: 200%
    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height * 2;

    for (let i = 0; i < actualCount; i++) {
      // Custom hash function for pseudo-randomness
      const hash1 = ((seed + i) * 1103515245 + 12345) % 4294967296;
      const hash2 = ((seed * 37 + i) * 69069 + 1013904223) % 4294967296;
      const hash3 = ((seed * 127 + i) * 214013 + 2531011) % 4294967296;

      // Weyl sequence for natural distribution
      const phi = 1618033989;
      const sqrt2 = 1414213562;
      const weyl1 = ((i * phi + seed * sqrt2) * 2654435761) % 4294967296;
      const weyl2 =
        (((i + 13) * phi + (seed + 4177) * sqrt2) * 2654435761) % 4294967296;

      // Generate coordinates as percentages with padding to avoid edge overflow
      const xPercent = Math.abs((hash1 + weyl1 + i * 127) % 4294967296) % 100; // 0-95%
      const baseYPercent =
        Math.abs((hash2 + weyl2 + i * 131 + hash3) % 4294967296) % 100; // 0-99%
      const yPercent = (baseYPercent + layerOffset) % 100; // Apply layer offset and wrap

      // Convert to pixel values
      const x = Math.floor((xPercent / 100) * containerWidth);
      const y = Math.floor((yPercent / 100) * containerHeight);

      stars.push(`${x}px ${y}px 0 #fff`);
    }

    return stars.join(', ');
  }

  // Generate random comets
  function generateComets() {
    if (!comets) return [];

    const cometCount = Math.floor(getRandomNumberBetween(4, 10)); // 2-9 comets
    const cometsArray = [];

    for (let i = 0; i < cometCount; i++) {
      // Start from anywhere slightly outside the parent element
      const startX = getRandomNumberBetween(-10, 110); // %
      const startY = getRandomNumberBetween(-10, 10); // %

      // Angle between 45° and 135° (π/4 to 3π/4 radians) for mostly top-to-bottom
      const angleRad = Math.PI / 4 + getRandomNumberBetween(0, Math.PI / 2);
      // Random travel distance (40% to 100%)
      const distance = getRandomNumberBetween(40, 100);

      // Calculate end point based on angle and distance
      const endX = startX + Math.cos(angleRad) * distance;
      const endY = startY + Math.sin(angleRad) * distance;
      const delay = getRandomNumberBetween(0, 2); // Random delay 0-2s
      const duration = getRandomNumberBetween(6, 14); // Duration 6-14s

      // Calculate rotation angle based on movement direction
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      if (skyBackgroundElement) {
        const rect = skyBackgroundElement.getBoundingClientRect();
        const componentWidth = rect.width;
        const componentHeight = rect.height;
        const pixelDeltaX = (deltaX / 100) * componentWidth;
        const pixelDeltaY = (deltaY / 100) * componentHeight;
        angle = Math.atan2(pixelDeltaY, pixelDeltaX) * (180 / Math.PI);
      }

      cometsArray.push({
        startX,
        startY,
        endX,
        endY,
        delay,
        duration,
        angle,
        id: i,
      });
    }

    return cometsArray;
  }

  const cometsData = $derived.by(() => generateComets());

  // Generate stars for each layer - smaller stars are denser
  // Make reactive to container size changes
  const stars1 = $derived.by(() => {
    // Include containerSize in dependency
    containerSize;
    return generateStars(40, 982451653, 0, 1); // Small stars (1px) - highest density
  });

  const stars2 = $derived.by(() => {
    containerSize;
    return generateStars(Math.floor(40 * 0.5), 2971215073, 29, 2); // Medium stars (2px) - 80% density
  });

  const stars3 = $derived.by(() => {
    containerSize;
    return generateStars(Math.floor(40 * 0.3), 4111820313, 58, 3); // Large stars (3px) - 60% density
  });
</script>

<div
  class="sky-background"
  style="--speed: {speed}; --container-height: {containerSize.height}px;"
  bind:this={skyBackgroundElement}
>
  <!-- Single set of star layers - same pattern for seamless loop -->
  <div class="stars stars-1" style="--stars: {stars1};"></div>
  <div class="stars stars-2" style="--stars: {stars2};"></div>
  <div class="stars stars-3" style="--stars: {stars3};"></div>

  <!-- Comets layer -->
  {#if comets}
    <div class="comets-layer">
      {#each cometsData as comet (comet.id)}
        <div
          class="comet"
          style="
            --start-x: {comet.startX}%;
            --start-y: {comet.startY}%;
            --end-x: {comet.endX}%;
            --end-y: {comet.endY}%;
            --delay: {comet.delay}s;
            --duration: {comet.duration}s;
            --angle: {comet.angle}deg;
          "
        ></div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .sky-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
    pointer-events: none;
  }

  .stars {
    position: absolute;
    width: 100%;
    height: 200%; /* Double height for seamless loop */
    background: transparent;

    &:before,
    &:after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      height: 1px;
      background: transparent;
      border-radius: 50%;
      animation: stars-move calc(50s / var(--speed)) linear infinite;
    }

    &:before {
      box-shadow: var(--stars);
    }

    &:after {
      top: var(--container-height);
      box-shadow: var(--stars); /* Same stars for seamless loop */
    }
  }

  .stars-2 {
    &:before,
    &:after {
      width: 2px;
      height: 2px;
      animation-duration: calc(75s / var(--speed));
    }
  }

  .stars-3 {
    &:before,
    &:after {
      width: 3px;
      height: 3px;
      animation-duration: calc(100s / var(--speed));
    }
  }

  @keyframes stars-move {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(calc(-1 * var(--container-height)));
    }
  }

  /* Comets styling */
  .comets-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }
  .comet {
    --size: 4px;
    position: absolute;
    width: var(--size);
    height: var(--size);
    background: var(--color-primary);
    border-radius: 50%;
    opacity: 0;
    animation: comet-fall var(--duration) linear var(--delay) infinite;
    transform: rotate(var(--angle));
    transform-origin: left center;

    &::after {
      --logdash-rgb: 230, 0, 118;
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80px;
      height: 2px;
      background: linear-gradient(
        90deg,
        rgba(var(--logdash-rgb), 0.1) 0%,
        rgba(var(--logdash-rgb), 0.3) 50%,
        rgba(var(--logdash-rgb), 0.6) 70%,
        rgba(var(--logdash-rgb), 1) 95%,
        transparent 1%
      );
      transform: translate(-95%, -50%);
      border-radius: 50%;
    }
  }

  @keyframes comet-fall {
    0% {
      opacity: 0;
      left: var(--start-x);
      top: var(--start-y);
    }
    5% {
      opacity: 1;
    }
    95% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      left: var(--end-x);
      top: var(--end-y);
    }
  }
</style>
