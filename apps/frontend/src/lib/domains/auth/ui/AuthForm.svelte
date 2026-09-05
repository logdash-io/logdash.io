<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { cubicInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { match } from 'ts-pattern';
  import { posthog } from 'posthog-js';
  import { startOAuthLogin } from '$lib/domains/auth/application/start-oauth-login';
  import type { OAuthProvider } from '$lib/domains/auth/domain/oauth-provider';
  import NewsletterCheckbox from '$lib/domains/shared/ui/components/NewsletterCheckbox.svelte';
  import TosCheckbox from '$lib/domains/shared/ui/components/TOSCheckbox.svelte';
  import GoogleIcon from '$lib/domains/shared/icons/GoogleIcon.svelte';
  import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
  import type { UserTier } from '$lib/domains/shared/types.js';

  type AuthMode = 'claim' | 'signup' | 'login';

  const CLAIMED_NEXT_URL = '/app/clusters?claimed=1';

  const params = $derived(page.url.searchParams);
  const mode: AuthMode = $derived(
    params.get('flow') === 'claim'
      ? 'claim'
      : params.get('needs_account')
        ? 'signup'
        : 'login',
  );
  const tier = $derived(params.get('tier') as UserTier | null);
  const isExpired = $derived(params.get('expired') === '1');
  const claimErrorMessage = $derived(
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
      .otherwise(() => null),
  );
  const requiresConsent = $derived(mode !== 'login');
  const nextUrl = $derived(
    mode === 'claim'
      ? (params.get('next_url') ?? CLAIMED_NEXT_URL)
      : '/app/clusters',
  );
  const heading = $derived(
    match(mode)
      .with('claim', () => 'Keep your dashboard')
      .with('signup', () => 'Welcome')
      .with('login', () => 'Welcome back')
      .exhaustive(),
  );
  const subheading = $derived(
    match(mode)
      .with(
        'claim',
        () =>
          'Claim it with GitHub or Google. Your monitors, logs and metrics stay.',
      )
      .with('signup', () => 'Create your account to continue')
      .with('login', () => 'Sign in to your account')
      .exhaustive(),
  );
  const actionLabel = $derived(
    match(mode)
      .with('claim', () => 'Claim')
      .with('signup', () => 'Sign up')
      .with('login', () => 'Sign in')
      .exhaustive(),
  );
  const githubButtonId = $derived(
    mode === 'claim' ? 'auth-claim-github-button' : undefined,
  );
  const googleButtonId = $derived(
    mode === 'claim' ? 'auth-claim-google-button' : undefined,
  );

  let termsAccepted = $state(false);
  let emailAccepted = $state(false);
  let loggingInProvider = $state<string | null>(null);
  let loginError = $state<string | null>(null);

  const isButtonDisabled = $derived(
    (requiresConsent && !termsAccepted) || !!loggingInProvider,
  );

  const onLogin = async (provider: OAuthProvider) => {
    loggingInProvider = provider;
    loginError = null;

    if (mode === 'claim') {
      posthog.capture('account_claim_started', { provider });
    }

    try {
      await startOAuthLogin({
        provider,
        terms_accepted: termsAccepted,
        email_accepted: emailAccepted,
        tier,
        next_url: nextUrl,
        flow: mode === 'claim' ? 'claim' : 'login',
      });
    } catch {
      loggingInProvider = null;
      loginError = 'Something went wrong. Please try again.';
    }
  };

  onMount(() => {
    return () => {
      loggingInProvider = null;
      termsAccepted = false;
      emailAccepted = false;
      loginError = null;
    };
  });
</script>

<div class="flex flex-1 items-center justify-center">
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
    class="card w-md rounded-2xl"
  >
    <div class="card-body items-center p-6 text-center">
      <h2 class="card-title mb-2 text-3xl font-bold">
        {heading}
      </h2>
      <p class="text-neutral-400 mb-6">
        {subheading}
      </p>

      {#if isExpired}
        <div
          class="alert alert-warning bg-warning/10 border-warning/30 mb-6 rounded-xl text-left text-sm"
          role="status"
        >
          Your temporary dashboard expired. Start a new one or sign in.
        </div>
      {/if}

      {#if claimErrorMessage}
        <div
          class="alert alert-error bg-error/10 border-error/30 mb-6 rounded-xl text-left text-sm"
          role="alert"
        >
          {claimErrorMessage}
        </div>
      {/if}

      <div
        class={[
          'card-actions w-full items-start justify-start gap-2 rounded-2xl',
          {
            'border-primary/30 bg-base-200 border p-4': requiresConsent,
            'p-2 pt-0': !requiresConsent,
          },
        ]}
      >
        {#if requiresConsent}
          <div class="flex flex-col gap-2">
            <TosCheckbox bind:termsAccepted />
            <NewsletterCheckbox bind:emailAccepted />
          </div>
        {/if}

        <button
          disabled={isButtonDisabled}
          class="btn btn-secondary w-full gap-2"
          data-posthog-id={githubButtonId}
          onclick={() => onLogin('github')}
        >
          {#if loggingInProvider === 'github'}
            <div
              in:fade={{ duration: 150 }}
              class="flex size-6 items-center justify-center"
            >
              <span class="loading loading-spinner size-4"></span>
            </div>
          {:else}
            <GitHubIcon class="size-6" />
          {/if}
          {actionLabel} with GitHub
        </button>

        <button
          disabled={isButtonDisabled}
          class="btn btn-secondary w-full gap-2"
          data-posthog-id={googleButtonId}
          onclick={() => onLogin('google')}
        >
          {#if loggingInProvider === 'google'}
            <div
              in:fade={{ duration: 150 }}
              class="flex size-6 items-center justify-center"
            >
              <span class="loading loading-spinner size-4"></span>
            </div>
          {:else}
            <GoogleIcon
              class="size-6 {isButtonDisabled ? 'grayscale opacity-50' : ''}"
            />
          {/if}
          {actionLabel} with Google
        </button>
      </div>

      {#if loginError}
        <p class="text-error mt-4 text-sm">{loginError}</p>
      {/if}

      {#if mode !== 'claim'}
        <div class="mt-6 text-sm">
          {#if mode === 'signup'}
            <span class="text-neutral-400">Already have an account?</span>
            <a
              href={resolve('/app/auth')}
              class="text-primary font-medium hover:underline"
            >
              Sign in
            </a>
          {:else}
            <span class="text-neutral-400">Don't have an account?</span>
            <a
              href={resolve('/app/auth?needs_account=true')}
              class="text-primary font-medium hover:underline"
            >
              Sign up
            </a>
          {/if}
        </div>
      {/if}

      {#if mode === 'signup'}
        <a
          href={resolve('/app/quick-setup')}
          data-posthog-id="auth-continue-anonymous-cta"
          class="text-neutral-500 hover:text-neutral-300 mt-2 text-sm transition-ink"
        >
          Continue without an account
        </a>
      {/if}
    </div>
  </div>
</div>
