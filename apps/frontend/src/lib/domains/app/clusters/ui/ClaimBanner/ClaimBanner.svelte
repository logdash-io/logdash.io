<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils';
  import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils';
  import { decodeJwtPayload } from '$lib/domains/shared/utils/jwt.utils';
  import { onMount } from 'svelte';

  const MINUTE_MS = 60_000;
  const HOUR_MS = 60 * MINUTE_MS;

  function readRemainingMs(): number | null {
    const token = getCookieValue(ACCESS_TOKEN_COOKIE_NAME, document.cookie);
    const exp = token ? decodeJwtPayload(token)?.exp : undefined;

    if (!exp) {
      return null;
    }

    return Math.max(exp * 1000 - Date.now(), 0);
  }

  let remainingMs = $state<number | null>(null);

  const hoursLeft = $derived(Math.floor((remainingMs ?? 0) / HOUR_MS));
  const minutesLeft = $derived(
    Math.floor(((remainingMs ?? 0) % HOUR_MS) / MINUTE_MS),
  );

  onMount(() => {
    remainingMs = readRemainingMs();

    const interval = setInterval(() => {
      remainingMs = readRemainingMs();
    }, MINUTE_MS);

    return () => clearInterval(interval);
  });
</script>

<div
  class="alert alert-warning bg-warning/10 border-warning/30 text-warning mb-2 flex w-full flex-col gap-2 rounded-xl text-sm sm:flex-row sm:items-center sm:justify-between"
>
  <span>
    Temporary dashboard.
    {#if remainingMs !== null}
      Expires in {hoursLeft}h {minutesLeft}m.
    {/if}
    Claim it to keep everything.
  </span>

  <a
    href={resolve(
      `/app/auth?flow=claim&next_url=${encodeURIComponent(`${page.url.pathname}?claimed=1`)}`,
    )}
    data-posthog-id="claim-banner-claim-cta"
    class="btn btn-warning btn-sm text-neutral-950 shrink-0"
  >
    Claim with GitHub or Google
  </a>
</div>
