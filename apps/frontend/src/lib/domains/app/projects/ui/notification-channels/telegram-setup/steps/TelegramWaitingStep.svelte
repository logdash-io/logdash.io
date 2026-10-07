<script lang="ts">
  import { Button, Kbd, Spinner } from '@logdash/hyper-ui/presentational';

  type Props = {
    passphrase: string;
    onCancel: () => void;
    onBack: () => void;
  };

  let { passphrase, onCancel, onBack }: Props = $props();
</script>

<div class="flex flex-col gap-5">
  <div class="flex flex-col items-center gap-3 py-4 text-center">
    <Spinner variant="infinity" size="xl" />
    <h2 class="text-base font-semibold">Waiting for the message</h2>
    <p class="text-fg-tertiary text-sm">
      We're checking if your passphrase <Kbd size="sm">{passphrase}</Kbd>
      arrived... Hold tight!
    </p>
  </div>

  <div class="flex justify-end gap-2">
    <Button variant="ghost" onclick={onCancel}>Cancel</Button>
    <Button onclick={onBack}>Back</Button>
  </div>
</div>
