<script lang="ts">
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import { Button } from '@logdash/hyper-ui/presentational';

  type Props = {
    chatName: string;
    clusterName: string;
    onSubmit: () => void;
  };

  let { chatName, clusterName, onSubmit }: Props = $props();
</script>

<div class="flex flex-col gap-5">
  <div class="flex items-center gap-4">
    <div
      class="bg-surface-150-bg text-success flex size-9 shrink-0 items-center justify-center rounded-lg"
    >
      <CheckIcon class="size-4.5" />
    </div>
    <div class="flex min-w-0 flex-col gap-0.5">
      <h2 class="text-base font-semibold">Telegram channel found</h2>
      <p class="text-fg-tertiary text-sm">
        Save it and every monitor on this domain alerts it.
      </p>
    </div>
  </div>

  <p
    class="bg-surface-50-bg edge truncate rounded-lg px-4 py-3 text-center font-mono text-lg font-medium"
  >
    {chatName}
  </p>

  <div class="flex justify-end">
    <Button variant="primary" onclick={onSubmit}>
      Save channel to {clusterName}
    </Button>
  </div>
</div>
