<script lang="ts">
  import LightbulbIcon from '$lib/domains/shared/icons/LightbulbIcon.svelte';
  import { Button, Rating, Tooltip } from '@logdash/hyper-ui/presentational';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';

  let message = $state('');
  let rating = $state(5);
  const posthog = getContext<PostHog>('posthog');

  const captureFeedback = () => {
    posthog.capture('feedback_collected', {
      message,
      rating,
    });
    message = '';
  };
</script>

<Tooltip
  content={feedbackForm}
  interactive={true}
  placement="top"
  align="left"
  trigger="click"
  closeOnOutsideTooltipClick={true}
>
  <button
    class="text-neutral-400 hover:bg-surface-hover hover:text-fg-default flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md"
    aria-label="Suggest improvement"
    title="Suggest improvement"
    data-posthog-id="share-feedback-button"
  >
    <LightbulbIcon class="size-4" />
  </button>
</Tooltip>

{#snippet feedbackForm(close: () => void)}
  <div class="ld-card-base flex h-52 w-72 flex-col rounded-xl shadow-lg">
    <textarea
      {@attach (node: HTMLTextAreaElement) => node.focus()}
      class="h-full w-full resize-none rounded-xl border-none p-4 text-base outline-0"
      placeholder="What can we do to make your life easier with Logdash?"
      bind:value={message}
    ></textarea>

    <div class="flex items-center justify-end gap-2 p-2">
      <Rating bind:value={rating} class="mx-auto gap-0.5" aria-label="Rating" />

      <Button size="sm" variant="ghost" onclick={close}>Cancel</Button>

      <Button
        size="sm"
        variant="primary"
        onclick={() => {
          captureFeedback();
          close();
        }}
      >
        Send
      </Button>
    </div>
  </div>
{/snippet}
