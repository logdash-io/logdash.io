<script lang="ts">
  import { Spinner } from '@logdash/hyper-ui/presentational';

  type Props = {
    label: string;
  };

  const { label }: Props = $props();
</script>

<span
  class="text-neutral-500 flex h-5 items-center gap-2 text-sm"
  role="status"
>
  <Spinner class="size-3.5 shrink-0" aria-hidden="true" />
  {label}
</span>
