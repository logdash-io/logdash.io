<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { getStatusFromPings } from '$lib/domains/app/projects/application/get-status-from-pings';
  import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
  import OnboardingFlow from '$lib/domains/onboarding/ui/OnboardingFlow.svelte';
  import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
  import GoogleIcon from '$lib/domains/shared/icons/GoogleIcon.svelte';
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import { cubicOut, quintOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fade, type TransitionConfig } from 'svelte/transition';
  import { match } from 'ts-pattern';
  import {
    heroClaim,
    providerName,
    type HeroClaimStep,
  } from './hero-claim.svelte';
  import { toChartPings } from './hero-pings';

  type LiveStatus = {
    dotClass: string;
    text: string;
  };

  const NUDGE_DELAY_MS = 1_200;
  const SCRIM_IN_MS = 320;
  const SCRIM_OUT_MS = 220;
  const CARD_IN_MS = 460;
  const CARD_IN_DELAY_MS = 60;
  const CARD_OUT_MS = 200;
  const CARD_RISE_PX = 24;
  const CARD_SINK_PX = 8;
  const CARD_IN_SCALE = 0.98;
  const STEP_IN_MS = 220;
  const STEP_IN_DELAY_MS = 50;
  const STEP_OUT_MS = 140;
  const REDUCED_MS = 180;
  const LINK_CLASS =
    'focus-visible:outline-neutral-500 rounded-md px-1 text-sm transition-ink duration-150 focus-visible:outline-2';

  let returnFocus: HTMLElement | null = null;

  const visible = $derived(heroClaim.visible);
  const step = $derived(heroClaim.step);
  const host = $derived(anonymousPreviewState.previewHost ?? 'your app');
  const title = $derived(`Keep watching ${host}`);
  const stepDelay = $derived(
    prefersReducedMotion.current ? 0 : STEP_IN_DELAY_MS,
  );
  const stepKey = $derived(
    step.kind === 'busy' ? `busy:${step.label}` : step.kind,
  );

  const nudgeKey = $derived.by(() => {
    const preview = anonymousPreviewState.preview;

    if (
      !preview ||
      !heroClaim.eligible ||
      !anonymousPreviewState.pings.length
    ) {
      return null;
    }

    return preview.projectId;
  });

  const live = $derived.by<LiveStatus>(() => {
    const pings = toChartPings(anonymousPreviewState.pings);
    const last = pings.at(-1);

    if (!last) {
      return {
        dotClass: 'bg-neutral-600',
        text: 'Waiting for the first check',
      };
    }

    return match(getStatusFromPings(pings))
      .with('down', () => ({
        dotClass: 'bg-error',
        text: `${host} is down · ${last.statusCode}`,
      }))
      .with('degraded', () => ({
        dotClass: 'bg-warning',
        text: `${host} is unstable · ${last.responseTimeMs} ms`,
      }))
      .otherwise(() => ({
        dotClass: 'bg-success',
        text: `${host} is up · ${last.responseTimeMs} ms`,
      }));
  });

  $effect(() => {
    const key = nudgeKey;

    if (!key) {
      return;
    }

    const timer = setTimeout(() => heroClaim.nudge(key), NUDGE_DELAY_MS);

    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (visible) {
      return;
    }

    const target = returnFocus;

    returnFocus = null;

    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    }
  });

  function onContinue(provider: OAuthProvider): void {
    heroClaim.start(provider);
  }

  function onNotNow(): void {
    heroClaim.hide();
  }

  function onReopenWindow(): void {
    heroClaim.focusPopup();
  }

  function onCancel(): void {
    heroClaim.cancel();
  }

  function onOnboarded(): void {
    heroClaim.finishOnboarding();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented || !visible) {
      return;
    }

    event.preventDefault();
    heroClaim.hide();
  }

  function onPageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      heroClaim.resume();
    }
  }

  function holdFocus(node: HTMLElement): void {
    const active = document.activeElement;

    returnFocus =
      active instanceof HTMLElement && !node.contains(active) ? active : null;
    node.focus({ preventScroll: true });
  }

  function fitHeight(content: HTMLElement): () => void {
    const card = content.parentElement;
    const observer = new ResizeObserver(() => {
      if (card) {
        card.style.height = `${content.offsetHeight}px`;
      }
    });

    observer.observe(content);

    return () => observer.disconnect();
  }

  function cardIn(node: Element): TransitionConfig {
    if (prefersReducedMotion.current) {
      return fade(node, { duration: REDUCED_MS, easing: cubicOut });
    }

    return {
      duration: CARD_IN_MS,
      delay: CARD_IN_DELAY_MS,
      easing: quintOut,
      css: (t, u) =>
        `opacity: ${t}; transform: translateY(${u * CARD_RISE_PX}px) scale(${1 - u * (1 - CARD_IN_SCALE)})`,
    };
  }

  function cardOut(node: Element): TransitionConfig {
    if (prefersReducedMotion.current) {
      return fade(node, { duration: REDUCED_MS, easing: cubicOut });
    }

    return {
      duration: CARD_OUT_MS,
      easing: cubicOut,
      css: (t, u) =>
        `opacity: ${t}; transform: translateY(${u * CARD_SINK_PX}px)`,
    };
  }

  function stepOut(node: HTMLElement): TransitionConfig {
    node.style.position = 'absolute';
    node.style.insetInline = '0';
    node.style.top = '0';

    return fade(node, { duration: STEP_OUT_MS, easing: cubicOut });
  }
</script>

<svelte:window onkeydown={onKeydown} onpageshow={onPageShow} />

{#if visible}
  <div class="fixed inset-0 z-10 flex overflow-y-auto overscroll-contain p-4">
    <div
      class="bg-surface-root/70 fixed inset-0"
      aria-hidden="true"
      in:fade={{ duration: SCRIM_IN_MS, easing: cubicOut }}
      out:fade={{ duration: SCRIM_OUT_MS, easing: cubicOut }}
    ></div>

    <div
      class="bg-surface-elevated relative m-auto w-full max-w-md overflow-hidden rounded-2xl shadow-[0_12px_24px_-16px_rgba(0,0,0,0.6)] ring-1 ring-neutral-800 outline-none transition-[height] duration-320 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabindex="-1"
      in:cardIn
      out:cardOut
      {@attach holdFocus}
    >
      <div class="relative" {@attach fitHeight}>
        {#key stepKey}
          <div
            in:fade={{
              duration: STEP_IN_MS,
              delay: stepDelay,
              easing: cubicOut,
            }}
            out:stepOut
          >
            {@render stepView(step)}
          </div>
        {/key}
      </div>
    </div>
  </div>
{/if}

{#snippet stepView(current: HeroClaimStep)}
  {#if current.kind === 'intro'}
    {@render intro()}
  {:else if current.kind === 'waiting'}
    {@render waiting(current.provider)}
  {:else if current.kind === 'onboarding'}
    <div class="p-6">
      <OnboardingFlow
        user={current.user}
        submitLabel="Take me to my dashboard"
        oncomplete={onOnboarded}
      />
    </div>
  {:else if current.kind === 'busy'}
    {@render busy(current.label)}
  {/if}
{/snippet}

{#snippet intro()}
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-2">
      <span class="text-neutral-400 flex items-center gap-2 text-xs">
        <span class={['size-1.5 shrink-0 rounded-full', live.dotClass]}></span>
        <span class="truncate tabular-nums">{live.text}</span>
      </span>

      <h2
        class="text-2xl font-semibold tracking-tight text-balance wrap-break-word"
      >
        {title}
      </h2>

      <p class="text-neutral-400 text-sm leading-relaxed text-pretty">
        Claim this dashboard with a free account. We keep checking it and tell
        you the moment it goes down.
      </p>
    </div>

    {#if heroClaim.error}
      <p class="text-error text-sm leading-relaxed text-pretty" role="alert">
        {heroClaim.error}
      </p>
    {/if}

    <div class="flex flex-col gap-2">
      <Button
        variant="primary"
        block
        class="gap-2 font-medium"
        data-posthog-id="hero-claim-github-cta"
        onclick={() => onContinue('github')}
      >
        <GitHubIcon class="size-4" />
        Continue with GitHub
      </Button>

      <Button
        variant="subtle"
        block
        class="gap-2 font-medium"
        data-posthog-id="hero-claim-google-cta"
        onclick={() => onContinue('google')}
      >
        <GoogleIcon class="size-4" />
        Continue with Google
      </Button>

      <button
        type="button"
        class={[
          LINK_CLASS,
          'text-neutral-500 hover:text-neutral-300 mx-auto mt-2 py-1',
        ]}
        data-posthog-id="hero-claim-dismiss"
        onclick={onNotNow}
      >
        Not now
      </button>
    </div>
  </div>
{/snippet}

{#snippet waiting(provider: OAuthProvider)}
  <div class="flex flex-col items-center gap-5 px-6 py-8 text-center">
    <Spinner size="sm" class="text-neutral-400" aria-hidden="true" />

    <div class="flex flex-col gap-1.5">
      <h2 class="text-base font-medium text-balance">
        Finish signing in with {providerName(provider)} in the window that opened
      </h2>
      <p class="text-neutral-400 text-sm">Your dashboard stays right here.</p>
    </div>

    <div class="flex items-center gap-4">
      <button
        type="button"
        class={[LINK_CLASS, 'text-neutral-300 hover:text-fg-default']}
        onclick={onReopenWindow}
      >
        Open the window again
      </button>
      <button
        type="button"
        class={[LINK_CLASS, 'text-neutral-500 hover:text-neutral-300']}
        onclick={onCancel}
      >
        Cancel
      </button>
    </div>
  </div>
{/snippet}

{#snippet busy(label: string)}
  <div
    class="flex flex-col items-center gap-5 px-6 py-8 text-center"
    role="status"
  >
    <Spinner size="sm" class="text-neutral-400" aria-hidden="true" />
    <h2 class="text-base font-medium">{label}</h2>
  </div>
{/snippet}
