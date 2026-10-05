<script lang="ts">
  import FeedbackButton from '$lib/domains/shared/ui/components/FeedbackButton.svelte';

  type Props = {
    plan: string;
  };

  const { plan }: Props = $props();
</script>

<div class="flex h-12 shrink-0 items-center gap-1 px-3">
  <FeedbackButton />

  <span class="text-fg-tertiary px-1 text-[13px] font-medium">{plan} plan</span>
</div>
