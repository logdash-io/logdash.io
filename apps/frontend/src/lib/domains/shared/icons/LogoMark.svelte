<script lang="ts">
  type Props = {
    class?: string;
    variant?:
      | 'slash'
      | 'diagonal-inset'
      | 'diagonal'
      | 'compact-medium'
      | 'compact-bold'
      | 'compact'
      | 'thin'
      | 'bleed-full'
      | 'bleed'
      | 'contained';
    /** `light` = pale disc, dark bars. `dark` = dark gradient disc, pale bars (13th export). */
    tone?: 'light' | 'dark';
    /** Disc shading for the light tone. The dark tone always uses the export's vertical gradient. */
    disc?: 'radial' | 'flat';
    shape?: 'rounded' | 'circle';
    /** Corner radius of the rounded shape in viewBox units (840 square). */
    cornerRadius?: number;
  };

  type Bar = {
    x: number;
    y: number;
    width: number;
    height: number;
    /** Degrees, turned about the bar's own centre. */
    rotate?: number;
  };

  const {
    class: className = '',
    variant = 'slash',
    tone = 'light',
    disc = 'flat',
    shape = 'circle',
    cornerRadius = 217.5,
  }: Props = $props();

  const id = $props.id();
  const darkGradientId = `${id}-dark`;
  const radialGradientId = `${id}-radial`;
  const discClipId = `${id}-disc`;

  const PALE = '#e6e6e6';

  const discFill = $derived(
    tone === 'dark'
      ? `url(#${darkGradientId})`
      : disc === 'radial'
        ? `url(#${radialGradientId})`
        : PALE,
  );
  const barFill = $derived(tone === 'dark' ? PALE : `url(#${darkGradientId})`);

  /** Bars traced from the 2026 Canva exports (840 x 840 viewBox). */
  const BARS: Record<NonNullable<Props['variant']>, Bar[]> = {
    slash: [
      { x: -90.23, y: 334.26, width: 950.35, height: 48, rotate: -29.59 },
      { x: 238.98, y: 510.32, width: 246.94, height: 48, rotate: -29.59 },
    ],
    'diagonal-inset': [
      { x: 210.93, y: 228.45, width: 339.34, height: 48, rotate: -45 },
      { x: -62.02, y: 389.1, width: 950.35, height: 48, rotate: -45 },
      { x: 290.66, y: 573.49, width: 262.29, height: 48, rotate: -45 },
    ],
    diagonal: [
      { x: 244.83, y: 190.06, width: 339.34, height: 48, rotate: -45 },
      { x: -62.06, y: 389.12, width: 950.35, height: 48, rotate: -45 },
      { x: 210.1, y: 646.15, width: 262.29, height: 48, rotate: -45 },
    ],
    'compact-medium': [
      { x: 387.41, y: 264.86, width: 282.85, height: 48 },
      { x: 132.53, y: 395.87, width: 395.12, height: 48 },
      { x: 319.14, y: 527.12, width: 257.07, height: 48 },
    ],
    'compact-bold': [
      { x: 387.41, y: 261.11, width: 282.85, height: 55.5 },
      { x: 132.53, y: 392.12, width: 395.12, height: 55.5 },
      { x: 319.14, y: 523.37, width: 257.07, height: 55.5 },
    ],
    compact: [
      { x: 387.41, y: 288.11, width: 282.85, height: 46.5 },
      { x: 132.53, y: 396.62, width: 395.12, height: 46.5 },
      { x: 319.14, y: 505.39, width: 257.07, height: 46.5 },
    ],
    thin: [
      { x: 387.41, y: 288.11, width: 325.16, height: 46.5 },
      { x: 84, y: 396.62, width: 443.66, height: 46.5 },
      { x: 319.14, y: 505.39, width: 257.07, height: 46.5 },
    ],
    'bleed-full': [
      { x: 344.61, y: 288.11, width: 567.04, height: 46.5 },
      { x: -109.94, y: 396.62, width: 637.6, height: 46.5 },
      { x: 283.03, y: 505.39, width: 683.09, height: 46.5 },
    ],
    bleed: [
      { x: 392.36, y: 288.11, width: 519.29, height: 46.5 },
      { x: -109.94, y: 396.62, width: 639.27, height: 46.5 },
      { x: 344.61, y: 505.39, width: 621.51, height: 46.5 },
    ],
    contained: [
      { x: 392.36, y: 282.11, width: 260.64, height: 58.5 },
      { x: 187, y: 390.62, width: 342.33, height: 58.5 },
      { x: 344.61, y: 499.39, width: 242.71, height: 58.5 },
    ],
  };

  const barTransform = (bar: Bar) =>
    bar.rotate
      ? `rotate(${bar.rotate} ${bar.x + bar.width / 2} ${bar.y + bar.height / 2})`
      : undefined;
</script>

<svg class={className} viewBox="0 0 840 840" aria-hidden="true">
  <defs>
    <linearGradient id={darkGradientId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#101012" />
      <stop offset="1" stop-color="#2c2c2e" />
    </linearGradient>

    <radialGradient id={radialGradientId} cx="0.5" cy="0.5" r="0.707">
      <stop offset="0" stop-color={PALE} />
      <stop offset="1" stop-color="#9f9f9f" />
    </radialGradient>

    <clipPath id={discClipId}>
      {@render discShape()}
    </clipPath>
  </defs>

  {@render discShape(discFill)}

  <g clip-path="url(#{discClipId})">
    {#each BARS[variant] as bar (`${bar.x}:${bar.y}`)}
      <rect
        x={bar.x}
        y={bar.y}
        width={bar.width}
        height={bar.height}
        rx={bar.height / 2}
        transform={barTransform(bar)}
        fill={barFill}
      />
    {/each}
  </g>
</svg>

{#snippet discShape(fill?: string)}
  {#if shape === 'circle'}
    <circle cx="420" cy="420" r="420" {fill} />
  {:else}
    <rect width="840" height="840" rx={cornerRadius} {fill} />
  {/if}
{/snippet}
