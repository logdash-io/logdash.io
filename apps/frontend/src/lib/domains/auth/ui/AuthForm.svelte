<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { cubicInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { match } from 'ts-pattern';
  import { posthog } from 'posthog-js';
  import { startOAuthLogin } from '$lib/domains/auth/application/start-oauth-login';
  import { reportOAuthPopupFailure } from '$lib/domains/auth/application/start-oauth-popup';
  import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
  import GoogleIcon from '$lib/domains/shared/icons/GoogleIcon.svelte';
  import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
  import type { UserTier } from '$lib/domains/shared/types.js';
  import {
    Alert,
    Button,
    Card,
    CardBody,
    CardTitle,
    Spinner,
  } from '@logdash/hyper-ui/presentational';

  type AuthMode = 'claim' | 'login';

  const CLAIMED_NEXT_URL = '/app/clusters?claimed=1';
  const SIGNED_IN_NEXT_URL = '/app/clusters';

  const params = $derived(page.url.searchParams);
  const mode: AuthMode = $derived(
    params.get('flow') === 'claim' ? 'claim' : 'login',
  );
  const tier = $derived((params.get('tier') as UserTier | null) ?? undefined);
  const isExpired = $derived(params.get('expired') === '1');
  const errorMessage = $derived(
    match(params.get('error'))
      .with(
        'project-limit',
        () =>
          'That account has reached its project limit. Free a slot there, then claim again. Your temporary dashboard is still here.',
      )
      .with(
        'unavailable',
        () =>
          'We could not reach the server. Your dashboard is untouched. Try again.',
      )
      .with(
        'claim-failed',
        () =>
          'Claiming did not go through. Your dashboard is untouched. Try again.',
      )
      .with('login-failed', () => 'Signing in did not go through. Try again.')
      .otherwise(() => null),
  );
  const nextUrl = $derived(
    params.get('next_url') ??
      (mode === 'claim' ? CLAIMED_NEXT_URL : SIGNED_IN_NEXT_URL),
  );
  const heading = $derived(
    match(mode)
      .with('claim', () => 'Keep your dashboard')
      .with('login', () => 'Welcome to Logdash')
      .exhaustive(),
  );
  const subheading = $derived(
    match(mode)
      .with(
        'claim',
        () =>
          'Claim it with GitHub or Google. Your monitors, logs and metrics stay.',
      )
      .with(
        'login',
        () =>
          'Continue with GitHub or Google. New here? We set up your account.',
      )
      .exhaustive(),
  );
  const actionLabel = $derived(
    match(mode)
      .with('claim', () => 'Claim')
      .with('login', () => 'Continue')
      .exhaustive(),
  );
  const githubButtonId = $derived(
    mode === 'claim' ? 'auth-claim-github-button' : undefined,
  );
  const googleButtonId = $derived(
    mode === 'claim' ? 'auth-claim-google-button' : undefined,
  );

  let loggingInProvider = $state<OAuthProvider | null>(null);
  let loginError = $state<string | null>(null);

  const isButtonDisabled = $derived(!!loggingInProvider);

  const onLogin = async (provider: OAuthProvider): Promise<void> => {
    loggingInProvider = provider;
    loginError = null;

    if (mode === 'claim') {
      posthog.capture('account_claim_started', { provider });
    }

    try {
      await startOAuthLogin({
        provider,
        tier,
        next_url: nextUrl,
        flow: mode,
      });
    } catch {
      loggingInProvider = null;
      loginError = 'Something went wrong. Please try again.';
    }
  };

  onMount(() => {
    reportOAuthPopupFailure(params.get('error'));
  });

  const onPageShow = (event: PageTransitionEvent): void => {
    if (event.persisted) {
      loggingInProvider = null;
    }
  };
</script>

<svelte:window onpageshow={onPageShow} />

<div
  in:scale={{
    duration: 300,
    start: 1.1,
    easing: cubicInOut,
  }}
  out:scale={{
    duration: 300,
    start: 1.1,
    easing: cubicInOut,
  }}
  class="w-md"
>
  <Card>
    <CardBody class="items-center p-6 text-center">
      <CardTitle class="mb-2 text-3xl font-bold">
        {heading}
      </CardTitle>
      <p class="text-neutral-400 mb-6 text-balance">
        {subheading}
      </p>

      {#if isExpired}
        <Alert variant="warning" class="mb-6" role="status">
          Your temporary dashboard expired. Start a new one or sign in.
        </Alert>
      {/if}

      {#if errorMessage}
        <Alert variant="error" class="mb-6" role="alert">
          {errorMessage}
        </Alert>
      {/if}

      <div class="flex w-full flex-col gap-2">
        <Button
          variant="primary"
          block
          class="gap-2"
          disabled={isButtonDisabled}
          data-posthog-id={githubButtonId}
          onclick={() => onLogin('github')}
        >
          {#if loggingInProvider === 'github'}
            <div
              in:fade={{ duration: 150 }}
              class="flex size-6 items-center justify-center"
            >
              <Spinner class="size-4" />
            </div>
          {:else}
            <GitHubIcon class="size-6" />
          {/if}
          {actionLabel} with GitHub
        </Button>

        <Button
          variant="primary"
          block
          class="gap-2"
          disabled={isButtonDisabled}
          data-posthog-id={googleButtonId}
          onclick={() => onLogin('google')}
        >
          {#if loggingInProvider === 'google'}
            <div
              in:fade={{ duration: 150 }}
              class="flex size-6 items-center justify-center"
            >
              <Spinner class="size-4" />
            </div>
          {:else}
            <GoogleIcon
              class={['size-6', { 'opacity-50 grayscale': isButtonDisabled }]}
            />
          {/if}
          {actionLabel} with Google
        </Button>
      </div>

      {#if loginError}
        <p class="text-error mt-4 text-sm">{loginError}</p>
      {/if}

      {#if mode === 'login'}
        <a
          href={resolve('/app/quick-setup')}
          data-posthog-id="auth-continue-anonymous-cta"
          class="text-neutral-500 hover:text-neutral-300 mt-6 text-sm transition-ink"
        >
          Continue without an account
        </a>
      {/if}
    </CardBody>
  </Card>
</div>
