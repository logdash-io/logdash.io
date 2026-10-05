<script lang="ts" module>
  export type LiveDot = 'success' | 'error' | 'neutral';
</script>

<script lang="ts">
  import { Spinner } from '@logdash/hyper-ui/presentational';

  type Props = {
    label: string;
    dot?: LiveDot;
    pending?: boolean;
  };

  const { label, dot = 'success', pending = false }: Props = $props();

  const DOT_CLASS: Record<LiveDot, string> = {
    success: 'bg-success',
    error: 'bg-error',
    neutral: 'bg-idle',
  };
</script>

<span
  class="text-fg-tertiary ml-auto flex shrink-0 items-center gap-1.5 pl-3 text-xs"
>
  {#if pending}
    <Spinner class="size-3" aria-hidden="true" />
  {:else}
    <span class={['size-1.5 rounded-full', DOT_CLASS[dot]]}></span>
  {/if}
  {label}
</span>
