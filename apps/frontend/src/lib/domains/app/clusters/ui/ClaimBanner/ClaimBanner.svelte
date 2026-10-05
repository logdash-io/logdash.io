<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils';
  import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils';
  import { decodeJwtPayload } from '$lib/domains/shared/utils/jwt.utils';
  import { Button, StatusDot } from '@logdash/hyper-ui/presentational';
  import { onMount } from 'svelte';

  const MINUTE_MS = 60_000;
  const HOUR_MS = 60 * MINUTE_MS;
  const DAY_MS = 24 * HOUR_MS;

  function readRemainingMs(): number | null {
    const token = getCookieValue(ACCESS_TOKEN_COOKIE_NAME, document.cookie);
    const exp = token ? decodeJwtPayload(token)?.exp : undefined;

    if (!exp) {
      return null;
    }

    return Math.max(exp * 1000 - Date.now(), 0);
  }

  let remainingMs = $state<number | null>(null);

  const timeLeft = $derived(formatTimeLeft(remainingMs ?? 0));

  function formatTimeLeft(ms: number): string {
    const days = Math.floor(ms / DAY_MS);
    const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
    const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }

  onMount(() => {
    remainingMs = readRemainingMs();

    const interval = setInterval(() => {
      remainingMs = readRemainingMs();
    }, MINUTE_MS);

    return () => clearInterval(interval);
  });
</script>

<aside
  aria-label="Temporary dashboard"
  class="claim-bar bg-surface-elevated-bg border-surface-elevated-border sticky bottom-19 z-10 mx-4 mt-auto mb-19 flex items-center gap-3 rounded-xl border py-3 pr-3 pl-4 shadow-[0_2px_4px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.9)] transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none starting:translate-y-2 starting:opacity-0 sm:w-[calc(100%-4rem)] sm:max-w-160 sm:self-center lg:bottom-4 lg:mb-4"
>
  <span class="flex h-5 shrink-0 items-center self-start">
    <StatusDot variant="warning" />
  </span>

  <div class="flex min-w-0 flex-1 flex-wrap gap-x-1.5 text-sm">
    <span class="text-fg-default truncate font-medium max-md:basis-full">
      Temporary dashboard
    </span>
    <span
      class={[
        'flex gap-x-1.5 whitespace-nowrap',
        { invisible: remainingMs === null },
      ]}
    >
      <span class="text-fg-faint max-md:hidden" aria-hidden="true">·</span>
      <span
        class="text-fg-tertiary md:text-fg-default tabular-nums md:font-medium"
      >
        {timeLeft} left
      </span>
    </span>
    <span class="text-fg-tertiary basis-full truncate max-md:hidden">
      Claim it to keep your monitors, logs and metrics.
    </span>
  </div>

  <Button
    href={resolve(
      `/app/auth?flow=claim&next_url=${encodeURIComponent(`${page.url.pathname}?claimed=1`)}`,
    )}
    data-posthog-id="claim-banner-claim-cta"
    variant="primary"
  >
    <span class="md:hidden">Claim</span>
    <span class="max-md:hidden">Claim with GitHub or Google</span>
  </Button>
</aside>

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
