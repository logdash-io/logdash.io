<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils';
  import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils';
  import { decodeJwtPayload } from '$lib/domains/shared/utils/jwt.utils';
  import { Button } from '@logdash/hyper-ui/presentational';
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

<div class="flex shrink-0 items-center gap-3 text-sm">
  <span class="text-neutral-400 hidden items-center gap-2 xl:flex">
    <span class="bg-warning size-1.5 shrink-0 rounded-full"></span>
    Temporary dashboard
    {#if remainingMs !== null}
      <span class="text-neutral-600">·</span>
      <span class="tabular-nums">{timeLeft} left</span>
    {/if}
  </span>

  <Button
    href={resolve(
      `/app/auth?flow=claim&next_url=${encodeURIComponent(`${page.url.pathname}?claimed=1`)}`,
    )}
    data-posthog-id="claim-banner-claim-cta"
    variant="primary"
    size="xs"
    class="h-7 px-3"
  >
    <span class="sm:hidden">Claim</span>
    <span class="hidden sm:inline">Claim with GitHub or Google</span>
  </Button>
</div>
