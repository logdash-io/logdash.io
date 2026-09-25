<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { quartOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fade, fly, type TransitionConfig } from 'svelte/transition';
  import { match } from 'ts-pattern';

  type NudgeCopy = {
    status: string | null;
    title: string;
    body: string;
  };

  const RISE_PX = 12;
  const RISE_MS = 300;
  const RISE_DELAY_MS = 900;

  const uid = $props.id();

  let isClaiming = $state(false);

  const copy = $derived.by<NudgeCopy | null>(() => {
    const preview = anonymousPreviewState.preview;
    const host = anonymousPreviewState.previewHost;

    if (!preview || !host || preview.anonymous === false) {
      return null;
    }

    return match(anonymousPreviewState.phase)
      .with('previewing', () => ({
        status: 'Temporary dashboard',
        title: `Keep ${host} monitored`,
        body: 'This preview stops after 10 minutes. Claim it with a free account to keep the checks running and get alerts when it goes down.',
      }))
      .with('ended', () => ({
        status: null,
        title: 'Your preview ended',
        body: `Claim it with a free account to bring the checks for ${host} back and get alerts when it goes down.`,
      }))
      .otherwise(() => null);
  });

  async function onClaim(): Promise<void> {
    if (isClaiming) {
      return;
    }

    isClaiming = true;

    await anonymousPreviewState.claimDashboard();
  }

  function onPageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      isClaiming = false;
    }
  }

  function rise(node: Element): TransitionConfig {
    if (prefersReducedMotion.current) {
      return fade(node, { duration: RISE_MS });
    }

    return fly(node, {
      y: RISE_PX,
      duration: RISE_MS,
      delay: RISE_DELAY_MS,
      easing: quartOut,
    });
  }
</script>

<svelte:window onpageshow={onPageShow} />

{#if copy}
  <aside
    class="ring-hairline bg-base-200 absolute inset-x-3 bottom-3 z-10 flex flex-col gap-4 rounded-xl p-4 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.7)] ring-1 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-90"
    aria-labelledby="{uid}-title"
    in:rise|global
  >
    <div class="flex flex-col gap-1.5">
      {#if copy.status}
        <span class="text-neutral-400 flex items-center gap-2 text-xs">
          <span class="bg-warning size-1.5 shrink-0 rounded-full"></span>
          {copy.status}
        </span>
      {/if}

      <h2 id="{uid}-title" class="text-base font-medium wrap-break-word">
        {copy.title}
      </h2>

      <p class="text-neutral-400 text-sm leading-relaxed text-pretty">
        {copy.body}
      </p>
    </div>

    <div class="flex flex-col items-start gap-2">
      <button
        type="button"
        class="btn btn-primary btn-sm rounded-full px-5 font-medium"
        data-posthog-id="hero-claim-nudge-cta"
        disabled={isClaiming}
        onclick={onClaim}
      >
        Claim it free
        {#if isClaiming}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          <ArrowRightIcon class="size-4" />
        {/if}
      </button>

      <span class="text-neutral-500 text-xs">
        GitHub or Google · No credit card
      </span>
    </div>
  </aside>
{/if}
