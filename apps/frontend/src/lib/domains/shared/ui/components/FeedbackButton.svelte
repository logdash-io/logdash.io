<script lang="ts">
  import { MAX_FEEDBACK_LENGTH } from '$lib/domains/shared/feedback/domain/feedback';
  import { sendFeedback } from '$lib/domains/shared/feedback/infrastructure/feedback.service';
  import LightbulbIcon from '$lib/domains/shared/icons/LightbulbIcon.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button, Rating, Tooltip } from '@logdash/hyper-ui/presentational';

  let message = $state('');
  let rating = $state(5);

  async function onSend(): Promise<void> {
    const feedback = { message, rating };
    message = '';

    try {
      await sendFeedback(feedback);
      toast.success('Thanks for the feedback');
    } catch {
      message = feedback.message;
      toast.error('Feedback could not be sent');
    }
  }
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
    class="text-fg-tertiary hover:bg-surface-root-hover-bg hover:text-fg-default flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md"
    aria-label="Suggest improvement"
    title="Suggest improvement"
  >
    <LightbulbIcon class="size-4" />
  </button>
</Tooltip>

{#snippet feedbackForm(close: () => void)}
  <div
    class="bg-surface-elevated-bg border border-surface-elevated-border flex h-52 w-72 flex-col rounded-xl shadow-lg"
  >
    <textarea
      {@attach (node: HTMLTextAreaElement) => node.focus()}
      class="h-full w-full resize-none rounded-xl border-none p-4 text-base outline-0"
      placeholder="What can we do to make your life easier with Logdash?"
      maxlength={MAX_FEEDBACK_LENGTH}
      bind:value={message}
    ></textarea>

    <div class="flex items-center justify-end gap-2 p-2">
      <Rating bind:value={rating} class="mx-auto gap-0.5" aria-label="Rating" />

      <Button size="sm" variant="ghost" onclick={close}>Cancel</Button>

      <Button
        size="sm"
        variant="primary"
        disabled={!message.trim()}
        onclick={() => {
          void onSend();
          close();
        }}
      >
        Send
      </Button>
    </div>
  </div>
{/snippet}
