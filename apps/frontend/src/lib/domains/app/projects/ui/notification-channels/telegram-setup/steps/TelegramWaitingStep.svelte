<script lang="ts">
  import { Button, Kbd, Spinner } from '@logdash/hyper-ui/presentational';

  type Props = {
    passphrase: string;
    onCancel: () => void;
    onBack: () => void;
  };

  let { passphrase, onCancel, onBack }: Props = $props();
</script>

<div class="text-center">
  <Spinner variant="infinity" size="xl" class="mb-4" />

  <h3 class="mb-2 text-lg font-medium">Waiting for the message</h3>

  <p class="text-neutral-400 mb-6 text-sm">
    We're checking if your passphrase <Kbd size="sm">
      {passphrase}
    </Kbd>
    arrived... Hold tight!
  </p>

  <div class="flex gap-3">
    <Button variant="neutral" class="flex-1" onclick={onCancel}>Cancel</Button>
    <Button variant="primary" class="flex-1" onclick={onBack}>Back</Button>
  </div>
</div>
