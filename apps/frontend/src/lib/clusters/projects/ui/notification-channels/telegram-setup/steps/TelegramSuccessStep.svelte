<script lang="ts">
  import { CheckIcon } from 'lucide-svelte';

  type Props = {
    chatName: string;
    clusterName: string;
    onSubmit: () => void;
  };

  let { chatName, clusterName, onSubmit }: Props = $props();
</script>

<div class="space-y-8 text-center">
  <div class="flex items-center justify-start gap-4">
    <div
      class="success-card flex h-14 w-14 items-center justify-center rounded-full"
    >
      <CheckIcon class="h-6 w-6" />
    </div>

    <div class="flex flex-col items-start">
      <h3 class="text-xl font-semibold">Telegram Channel Found</h3>
      <p class="text-secondary/70 text-sm">
        You can now save it to your project.
      </p>
    </div>
  </div>

  <p
    class="ld-card-base mx-auto w-fit truncate rounded-xl p-4 px-6 font-mono text-3xl font-semibold uppercase"
  >
    {chatName}
  </p>

  <button type="button" class="btn btn-primary w-full" onclick={onSubmit}>
    Save channel to {clusterName} project
  </button>
</div>
