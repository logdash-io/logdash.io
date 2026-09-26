<script lang="ts">
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "class"> & {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    variant?: "spinner" | "ring" | "infinity";
    class?: ClassValue;
  };

  let {
    size = "md",
    variant = "spinner",
    class: className,
    ...rest
  }: Props = $props();
</script>

<span
  role="status"
  aria-label="Loading"
  {...rest}
  class={["ld-spinner", className]}
  data-size={size}
  data-variant={variant}
></span>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-spinner {
      display: inline-block;
      width: 1.5rem;
      aspect-ratio: 1;
      vertical-align: middle;
      pointer-events: none;
      background-color: currentColor;
      mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' stroke='black' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform-origin='center'%3E%3Ccircle cx='12' cy='12' r='9.5' fill='none' stroke-width='3' stroke-linecap='round'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='2s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dasharray' values='0,150;42,150;42,150' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-dashoffset' values='0;-16;-59' keyTimes='0;0.475;1' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/g%3E%3C/svg%3E");
      mask-position: 50%;
      mask-size: 100%;
      mask-repeat: no-repeat;
    }

    .ld-spinner[data-size="xs"] {
      width: 1rem;
    }

    .ld-spinner[data-size="sm"] {
      width: 1.25rem;
    }

    .ld-spinner[data-size="lg"] {
      width: 1.75rem;
    }

    .ld-spinner[data-size="xl"] {
      width: 2rem;
    }

    .ld-spinner[data-variant="ring"] {
      mask-image: url("data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg' stroke='white'%3E%3Cg fill='none' fill-rule='evenodd' stroke-width='2'%3E%3Ccircle cx='22' cy='22' r='1'%3E%3Canimate attributeName='r' begin='0s' dur='1.8s' values='1;20' calcMode='spline' keyTimes='0;1' keySplines='0.165,0.84,0.44,1' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-opacity' begin='0s' dur='1.8s' values='1;0' calcMode='spline' keyTimes='0;1' keySplines='0.3,0.61,0.355,1' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='22' cy='22' r='1'%3E%3Canimate attributeName='r' begin='-0.9s' dur='1.8s' values='1;20' calcMode='spline' keyTimes='0;1' keySplines='0.165,0.84,0.44,1' repeatCount='indefinite'/%3E%3Canimate attributeName='stroke-opacity' begin='-0.9s' dur='1.8s' values='1;0' calcMode='spline' keyTimes='0;1' keySplines='0.3,0.61,0.355,1' repeatCount='indefinite'/%3E%3C/circle%3E%3C/g%3E%3C/svg%3E");
    }

    .ld-spinner[data-variant="infinity"] {
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' style='shape-rendering:auto;' width='200px' height='200px' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid'%3E%3Cpath fill='none' stroke='black' stroke-width='10' stroke-dasharray='205.271 51.318' d='M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z' stroke-linecap='round' style='transform:scale(0.8);transform-origin:50px 50px'%3E%3Canimate attributeName='stroke-dashoffset' repeatCount='indefinite' dur='2s' keyTimes='0;1' values='0;256.589'/%3E%3C/path%3E%3C/svg%3E");
    }
  }
</style>
