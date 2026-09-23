<script lang="ts">
  import { logoInk } from './logo-ink';

  type Props = {
    class?: string;
  };

  const { class: className = '' }: Props = $props();

  let isLive = $state(false);

  function onLive(live: boolean): void {
    isLive = live;
  }
</script>

<!--
  The mark: three lines on a tile with 16% corners, all in a 100 x 100 box.
  The tile follows the colour scheme, light on dark pages and dark on light
  ones. The lines show a quarter-turn fan (blue, ember, amber) centred on the
  bottom-left corner of the square the lines span, so every size and scheme
  shows the same colours in the same places. The exported files
  (static/images/logo-2026.svg, the favicons and app icons) are this light
  tile.

  The CSS below draws the still mark: the server render, and the fallback
  without WebGL2 or with reduced motion. Otherwise the canvas takes over
  with the live mark from logo-ink.ts, whose colour keeps moving in the
  lines and floods the tile while the mark (or the link around it) is
  hovered.
-->
<span
  class={['logo-mark', className, { 'is-live': isLive }]}
  aria-hidden="true"
>
  <canvas use:logoInk={{ onLive }}></canvas>
</span>

<style>
  .logo-mark {
    position: relative;
    display: inline-block;
    aspect-ratio: 1;
    border-radius: 16%;
    /* The tile colour; logo-ripple.ts reads it from here for the canvas. */
    color: #f2f2f3;
    color: light-dark(#101012, #f2f2f3);
    background-color: currentColor;
  }

  .logo-mark::after {
    content: '';
    position: absolute;
    inset: 0;
    /* 270deg onwards is the empty quadrant left of the pivot; blue there keeps the middle line's left tip blue. */
    background-image: conic-gradient(
      at 21.99% 78.01%,
      #0255ff 0deg,
      #ef3c00 45deg,
      #ffb700 90deg 270deg,
      #0255ff 270deg
    );
    background-image: conic-gradient(
      in oklab at 21.99% 78.01%,
      #0255ff 0deg,
      #ef3c00 45deg,
      #ffb700 90deg 270deg,
      #0255ff 270deg
    );
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='46.69' y='34.07' width='31.32' height='5.79' rx='2.89'/%3E%3Crect x='21.99' y='47.11' width='41.11' height='5.79' rx='2.89'/%3E%3Crect x='40.93' y='60.14' width='29.16' height='5.79' rx='2.89'/%3E%3C/svg%3E")
      0 0 / 100% 100% no-repeat;
  }

  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .logo-mark.is-live {
    background-color: transparent;
  }

  .logo-mark.is-live::after {
    content: none;
  }
</style>
