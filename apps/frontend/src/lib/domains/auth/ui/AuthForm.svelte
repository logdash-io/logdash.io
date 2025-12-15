<script lang="ts">
  import { page } from '$app/state';
  import { cubicInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { generateGithubOAuthUrl } from '$lib/domains/shared/utils/generate-github-oauth-url';
  import { generateGoogleOAuthUrl } from '$lib/domains/shared/utils/generate-google-oauth-url';
  import NewsletterCheckbox from '$lib/domains/shared/ui/components/NewsletterCheckbox.svelte';
  import TosCheckbox from '$lib/domains/shared/ui/components/TOSCheckbox.svelte';
  import GoogleIcon from '$lib/domains/shared/icons/GoogleIcon.svelte';
  import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';

  const params = $derived(page.url.searchParams);
  const needsAccount = $derived(params.get('needs_account'));
  const tier = $derived(params.get('tier'));

  let termsAccepted = $state(false);
  let emailAccepted = $state(false);
  let loggingInProvider = $state<string | null>(null);

  const isButtonDisabled = $derived(
    (needsAccount && !termsAccepted) || !!loggingInProvider,
  );

  const onGithubLogin = () => {
    loggingInProvider = 'github';
    window.location.href = generateGithubOAuthUrl({
      terms_accepted: termsAccepted,
      email_accepted: emailAccepted,
      flow: 'login',
      fallback_url: '/app/auth?needs_account=true',
      tier: tier as any,
      next_url: '/app/clusters',
    });
  };

  const onGoogleLogin = () => {
    loggingInProvider = 'google';
    window.location.href = generateGoogleOAuthUrl({
      terms_accepted: termsAccepted,
      email_accepted: emailAccepted,
      flow: 'login',
      fallback_url: '/app/auth?needs_account=true',
      tier: tier as any,
      next_url: '/app/clusters',
    });
  };

  onMount(() => {
    return () => {
      loggingInProvider = null;
      termsAccepted = false;
      emailAccepted = false;
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
        {needsAccount ? 'Welcome' : 'Welcome back'}
      </h2>
      <p class="text-base-content/70 mb-6">
        {needsAccount
          ? 'Create your account to continue'
          : 'Sign in to your account'}
      </p>

      <div
        class={[
          'card-actions w-full items-start justify-start gap-2 rounded-2xl',
          {
            'border-primary/30 bg-base-200 border p-4': needsAccount,
            'p-2 pt-0': !needsAccount,
          },
        ]}
      >
        {#if needsAccount}
          <div class="flex flex-col gap-2">
            <TosCheckbox bind:termsAccepted />
            <NewsletterCheckbox bind:emailAccepted />
          </div>
        {/if}

        <button
          disabled={isButtonDisabled}
          class="btn btn-secondary w-full gap-2"
          onclick={onGithubLogin}
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
          Sign {needsAccount ? 'up' : 'in'} with GitHub
        </button>

        <button
          disabled={isButtonDisabled}
          class="btn btn-secondary w-full gap-2"
          onclick={onGoogleLogin}
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
          Sign {needsAccount ? 'up' : 'in'} with Google
        </button>
      </div>

      <div class="mt-6 text-sm">
        {#if needsAccount}
          <span class="text-base-content/70">Already have an account?</span>
          <a href="/app/auth" class="text-primary font-medium hover:underline">
            Sign in
          </a>
        {:else}
          <span class="text-base-content/70">Don't have an account?</span>
          <a
            href="/app/auth?needs_account=true"
            class="text-primary font-medium hover:underline"
          >
            Sign up
          </a>
        {/if}
      </div>
    </div>
  </div>
</div>
