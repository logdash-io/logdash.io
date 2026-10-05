<script lang="ts">
  import { page } from '$app/state';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import ClaudeIcon from '$lib/domains/shared/icons/ClaudeIcon.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import CursorIcon from '$lib/domains/shared/icons/CursorIcon.svelte';
  import OpenAIIcon from '$lib/domains/shared/icons/OpenAIIcon.svelte';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import { Button } from '@logdash/hyper-ui/presentational';
  import type { WebAnalyticsSetupState } from '../application/web-analytics-setup.state.svelte';

  type Props = {
    connection: WebAnalyticsSetupState;
    services: { id: string; name: string }[];
  };

  const { connection, services }: Props = $props();
  const id = $props.id();

  let copying = $state(false);
  let copied = $state(false);
  let error = $state<string | null>(null);

  const hint = $derived(
    !connection.site
      ? 'Start tracking your website first.'
      : services.length === 0
        ? 'Add a service to this domain to set up backend logging.'
        : null,
  );

  async function onCopy(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (services.length === 0) return;
    copying = true;
    error = null;
    try {
      const prompt = await connection.buildPrompt(services, page.url.origin);
      await navigator.clipboard.writeText(prompt);
      copied = true;
    } catch (cause) {
      error =
        readHttpErrorMessage(cause) ??
        'Could not copy the setup prompt. Try again.';
    } finally {
      copying = false;
    }
  }
</script>

<form onsubmit={onCopy} class="flex flex-col">
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <Button
      type="submit"
      loading={copying}
      disabled={Boolean(hint)}
      aria-describedby={hint ? `${id}-hint` : undefined}
      class="group gap-2 pr-3.5 pl-2"
    >
      <span class="flex -space-x-2">
        {#each [ClaudeIcon, OpenAIIcon, CursorIcon] as Logo, index (index)}
          <span
            class="grid size-6 place-items-center rounded-full bg-surface-150-bg text-fg-default ring-1 ring-surface-150-border group-hover:bg-surface-150-hover-bg group-hover:ring-surface-200-border"
          >
            <Logo class="size-3.5" />
          </span>
        {/each}
      </span>
      Onboard your agent
      {#if copied}
        <CheckIcon class="ml-1.5 size-4 text-fg-tertiary" />
      {:else}
        <CopyIcon class="ml-1.5 size-4 text-fg-tertiary" />
      {/if}
    </Button>
    {#if hint}
      <p id="{id}-hint" class="text-sm text-fg-muted">{hint}</p>
    {/if}
  </div>

  <div aria-live="polite" class="text-sm not-empty:mt-3">
    {#if error}
      <p class="text-error">{error}</p>
    {:else if copied}
      <p class="text-fg-tertiary">
        Copied. Paste it into your coding agent, then open your website to send
        the first visit.
      </p>
    {/if}
  </div>
</form>
