<script lang="ts">
  type Props = {
    passphrase: string;
    onCancel: () => void;
    onBack: () => void;
  };

  let { passphrase, onCancel, onBack }: Props = $props();
</script>

<div class="text-center">
  <div class="avatar placeholder mb-4">
    <span class="loading loading-infinity loading-xl"></span>
  </div>

  <h3 class="mb-2 text-lg font-semibold">Waiting for the message</h3>

  <p class="mb-6 text-sm opacity-70">
    We're checking if your passphrase <code class="kbd kbd-sm">
      {passphrase}
    </code>
    arrived... Hold tight!
  </p>

  <div class="flex gap-3">
    <button type="button" class="btn btn-neutral flex-1" onclick={onCancel}>
      Cancel
    </button>
    <button type="button" class="btn btn-secondary flex-1" onclick={onBack}>
      Back
    </button>
  </div>
</div>
