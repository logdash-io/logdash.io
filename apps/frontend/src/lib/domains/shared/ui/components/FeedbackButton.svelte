<script lang="ts">
  import LightbulbIcon from '$lib/domains/shared/icons/LightbulbIcon.svelte';
  import { Button, Rating } from '@logdash/hyper-ui/presentational';
  import type { PostHog } from 'posthog-js';
  import { getContext } from 'svelte';

  let message = $state('');
  let open = $state(false);
  let rating = $state(5);
  // svelte-ignore non_reactive_update
  let textarea: HTMLTextAreaElement | undefined;
  const posthog = getContext<PostHog>('posthog');

  const captureFeedback = () => {
    posthog.capture('feedback_collected', {
      message,
      rating,
    });
    message = '';
  };

  $effect(() => {
    if (open) {
      textarea?.focus();
    }
  });
</script>

<div class="relative">
  <button
    onclick={() => {
      open = !open;
    }}
    class={[
      'flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-sm',
      open
        ? 'bg-surface-100 text-fg-default'
        : 'text-neutral-400 hover:bg-surface-hover hover:text-fg-default',
    ]}
    data-posthog-id="share-feedback-button"
  >
    <LightbulbIcon class="size-4 shrink-0" />
    Suggest improvement
  </button>

  {#if open}
    <div
      class="ld-card-base absolute bottom-10 left-0 z-50 flex h-52 w-72 flex-col rounded-xl shadow-lg"
    >
      <textarea
        bind:this={textarea}
        class="h-full w-full resize-none rounded-xl border-none p-4 text-base outline-0"
        placeholder="What can we do to make your life easier with Logdash?"
        bind:value={message}
      ></textarea>

      <div class="flex items-center justify-end gap-2 p-2">
        <Rating
          bind:value={rating}
          class="mx-auto gap-0.5"
          aria-label="Rating"
        />

        <Button size="sm" variant="primary" onclick={() => (open = false)}>
          Cancel
        </Button>

        <Button
          size="sm"
          variant="primary"
          onclick={() => {
            captureFeedback();
            open = false;
          }}
        >
          Send
        </Button>
      </div>
    </div>
  {/if}
</div>
