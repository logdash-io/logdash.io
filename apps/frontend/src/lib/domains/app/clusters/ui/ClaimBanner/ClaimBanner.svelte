<script lang="ts">
  import { page } from '$app/state';
  import { accountClaim } from '$lib/domains/auth/application/account-claim.state.svelte';
  import {
    oauthProviderName,
    type OAuthProvider,
  } from '$lib/domains/auth/domain/oauth-provider';
  import OnboardingConsentStep from '$lib/domains/onboarding/ui/OnboardingConsentStep.svelte';
  import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
  import GoogleIcon from '$lib/domains/shared/icons/GoogleIcon.svelte';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils';
  import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils';
  import { decodeJwtPayload } from '$lib/domains/shared/utils/jwt.utils';
  import { Button, Spinner, StatusDot } from '@logdash/hyper-ui/presentational';
  import { onMount } from 'svelte';

  const MINUTE_MS = 60_000;
  const HOUR_MS = 60 * MINUTE_MS;
  const DAY_MS = 24 * HOUR_MS;

  const PROVIDERS: {
    provider: OAuthProvider;
    variant: 'primary' | 'secondary';
  }[] = [
    { provider: 'github', variant: 'primary' },
    { provider: 'google', variant: 'secondary' },
  ];

  let remainingMs = $state<number | null>(null);

  const step = $derived(accountClaim.step);
  const timeLeft = $derived(formatTimeLeft(remainingMs ?? 0));

  onMount(() => {
    remainingMs = readRemainingMs();

    const interval = setInterval(() => {
      remainingMs = readRemainingMs();
    }, MINUTE_MS);

    return () => clearInterval(interval);
  });

  function onClaim(provider: OAuthProvider): void {
    accountClaim.start(provider, `${page.url.pathname}?claimed=1`);
  }

  function onPageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      accountClaim.resume();
    }
  }

  function readRemainingMs(): number | null {
    const token = getCookieValue(ACCESS_TOKEN_COOKIE_NAME, document.cookie);
    const exp = token ? decodeJwtPayload(token)?.exp : undefined;

    if (!exp) {
      return null;
    }

    return Math.max(exp * 1000 - Date.now(), 0);
  }

  function formatTimeLeft(ms: number): string {
    const days = Math.floor(ms / DAY_MS);
    const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
    const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }
</script>

<svelte:window onpageshow={onPageShow} />

<div
  class="claim-bar pointer-events-none sticky bottom-0 z-10 mt-auto flex justify-center px-4 pt-8 pb-19 sm:px-8 lg:pb-4"
>
  <div
    class="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,transparent,black_2rem)]"
    aria-hidden="true"
  ></div>

  <aside
    aria-label="Temporary dashboard"
    class="bg-surface-elevated-bg border-surface-elevated-border pointer-events-auto relative flex min-h-15 w-full max-w-160 items-center gap-3 rounded-xl border py-3 pr-3 pl-4 shadow-[0_2px_4px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.9)] transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none starting:translate-y-2 starting:opacity-0"
  >
    {#if step.kind === 'idle'}
      <span class="flex h-5 shrink-0 items-center self-start md:self-center">
        <StatusDot variant="warning" />
      </span>

      <p class="flex min-w-0 flex-1 flex-wrap gap-x-1.5 text-[15px]">
        <span class="text-fg-default font-medium max-md:basis-full">
          Keep this dashboard
        </span>
        <span
          class={[
            'flex gap-x-1.5 whitespace-nowrap',
            { invisible: remainingMs === null },
          ]}
        >
          <span class="text-fg-muted max-md:hidden" aria-hidden="true">·</span>
          <span class="text-fg-secondary tabular-nums">{timeLeft} left</span>
        </span>
      </p>

      <div class="flex shrink-0 items-center gap-2">
        {#each PROVIDERS as { provider, variant } (provider)}
          <Button
            {variant}
            class="max-md:px-0 max-md:aspect-square"
            aria-label="Keep with {oauthProviderName(provider)}"
            data-posthog-id="claim-banner-{provider}-cta"
            onclick={() => onClaim(provider)}
          >
            {#if provider === 'github'}
              <GitHubIcon class="size-4" />
            {:else}
              <GoogleIcon class="size-4" />
            {/if}
            <span class="max-md:hidden">{oauthProviderName(provider)}</span>
          </Button>
        {/each}
      </div>
    {:else if step.kind === 'waiting'}
      <span class="flex h-5 shrink-0 items-center">
        <Spinner size="xs" class="text-fg-tertiary" aria-hidden="true" />
      </span>

      <p class="min-w-0 flex-1 truncate text-[15px]" role="status">
        Finish in the {oauthProviderName(step.provider)} window
      </p>

      <div class="flex shrink-0 items-center gap-1">
        <Button variant="ghost" onclick={() => accountClaim.focusPopup()}>
          Reopen
        </Button>
        <Button variant="ghost" onclick={() => accountClaim.cancel()}>
          Cancel
        </Button>
      </div>
    {:else}
      <span class="flex h-5 shrink-0 items-center">
        <Spinner size="xs" class="text-fg-tertiary" aria-hidden="true" />
      </span>

      <p class="min-w-0 flex-1 truncate text-[15px]" role="status">
        {step.kind === 'busy' ? step.label : 'Confirm the terms to finish'}
      </p>
    {/if}
  </aside>
</div>

<Modal
  isOpen={step.kind === 'consent'}
  onClose={() => {}}
  dismissible={false}
  class="w-md p-6"
>
  <OnboardingConsentStep oncomplete={() => accountClaim.finishConsent()} />
</Modal>

<style>
  :global(html:has(.claim-bar)) {
    --toaster-bottom: 9.375rem;
  }

  @media (width >= 64rem) {
    :global(html:has(.claim-bar)) {
      --toaster-bottom: 5.625rem;
    }
  }
</style>
