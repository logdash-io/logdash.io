<script lang="ts">
  import { page } from '$app/state';
  import NewsletterCheckbox from '$lib/domains/shared/ui/components/NewsletterCheckbox.svelte';
  import TosCheckbox from '$lib/domains/shared/ui/components/TOSCheckbox.svelte';
  import { generateGithubOAuthUrl } from '$lib/domains/shared/utils/generate-github-oauth-url.js';
  import { fade } from 'svelte/transition';

  type Props = {
    canClaim: boolean;
    nextUrl: string;
  };
  const { canClaim, nextUrl }: Props = $props();
  const cluster_id = page.params.cluster_id;

  let termsAccepted = $state(false);
  let emailAccepted = $state(false);
  let tryingToClaim = $state(false);

  function authGithub() {
    window.location.href = generateGithubOAuthUrl({
      terms_accepted: termsAccepted,
      email_accepted: emailAccepted,
      flow: 'claim',
      fallback_url: '/',
      cluster_id,
      next_url: nextUrl,
    });
  }
</script>

<div class={['mt-auto flex w-full flex-1 flex-col items-center gap-4']}>
  <div
    class={[
      'bg-base-100/60 border-base-100 flex h-fit w-full flex-col gap-2 rounded-xl border text-sm select-none',
      {
        'p-4': canClaim,
      },
    ]}
  >
    {#if canClaim}
      <div>
        <h5 class="text-lg font-semibold">You are almost there!</h5>
        <p class="text-base-content opacity-80">
          Claim your anonymous service to unlock the dashboard
        </p>
      </div>
    {/if}

    {#if canClaim}
      <TosCheckbox bind:termsAccepted />
      <NewsletterCheckbox bind:emailAccepted />
    {/if}

    <button
      onclick={() => {
        if (termsAccepted) {
          tryingToClaim = true;
          authGithub();
        }
      }}
      in:fade={{ duration: 100 }}
      disabled={!termsAccepted || tryingToClaim}
      class={['btn btn-primary whitespace-nowrap']}
      data-posthog-id="claim-project-button"
    >
      {#if tryingToClaim}
        <span class="loading loading-xs"></span>
      {/if}
      Claim service
    </button>
  </div>
</div>
