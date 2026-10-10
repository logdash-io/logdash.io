<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button } from '@logdash/hyper-ui/presentational';

  type Props = {
    title: string;
    description: string;
    backLabel?: string;
    onBack: () => void;
    onSubmit?: () => void;
    children: Snippet;
    action?: Snippet;
  };

  const {
    title,
    description,
    backLabel = 'Back',
    onBack,
    onSubmit,
    children,
    action,
  }: Props = $props();

  function onFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    onSubmit?.();
  }
</script>

<form class="flex flex-col gap-5" onsubmit={onFormSubmit}>
  <div class="flex flex-col gap-1.5">
    <h2 id="notification-channel-setup-title" class="text-lg font-medium">
      {title}
    </h2>
    <p class="text-fg-tertiary text-sm">{description}</p>
  </div>

  {@render children()}

  <div class="flex items-center justify-between gap-2 pt-1">
    <Button variant="ghost" class="-ml-4" onclick={onBack}>{backLabel}</Button>
    {@render action?.()}
  </div>
</form>
