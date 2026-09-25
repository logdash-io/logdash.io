<script lang="ts">
  import { resolve } from '$app/paths';
  import { acceptConsents } from '$lib/domains/onboarding/application/save-onboarding';

  type Props = {
    oncomplete: () => void;
  };

  let { oncomplete }: Props = $props();

  let termsAccepted = $state(false);
  let marketingConsent = $state(false);
  let saving = $state(false);
  let failed = $state(false);

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    saving = true;
    failed = false;

    try {
      await acceptConsents(marketingConsent);
    } catch {
      saving = false;
      failed = true;

      return;
    }

    oncomplete();
  }
</script>

<form class="flex flex-col" onsubmit={onSubmit}>
  <h2
    tabindex="-1"
    class="text-2xl font-semibold tracking-tight text-balance focus:outline-none"
  >
    One last thing
  </h2>
  <p class="text-neutral-400 mt-1.5 text-sm text-pretty">
    Confirm the terms to finish setting up your account.
  </p>

  <div class="mt-6 flex flex-col gap-3.5">
    <label class="flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        class="checkbox checkbox-primary checkbox-sm border-neutral-600 checked:border-primary"
        required
        bind:checked={termsAccepted}
      />
      <span class="text-neutral-300">
        I agree to the
        <a
          href={resolve('/terms-of-service')}
          target="_blank"
          rel="noopener"
          class="text-neutral-100 whitespace-nowrap underline decoration-neutral-600 underline-offset-2 transition-ink hover:decoration-neutral-300"
        >
          Terms of Service
        </a>
        and
        <a
          href={resolve('/privacy-policy')}
          target="_blank"
          rel="noopener"
          class="text-neutral-100 whitespace-nowrap underline decoration-neutral-600 underline-offset-2 transition-ink hover:decoration-neutral-300"
        >
          Privacy Policy
        </a>
      </span>
    </label>

    <label class="flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        class="checkbox checkbox-primary checkbox-sm border-neutral-600 checked:border-primary"
        bind:checked={marketingConsent}
      />
      <span class="text-neutral-300">
        Send me product updates. Rarely, no spam.
      </span>
    </label>
  </div>

  <button
    type="submit"
    class="btn btn-primary mt-7 w-full gap-2"
    disabled={!termsAccepted || saving}
  >
    {#if saving}
      <span class="loading loading-spinner size-4"></span>
    {/if}
    Continue
  </button>

  {#if failed}
    <p class="text-error mt-3 text-sm" role="alert">
      We could not save that. Try again.
    </p>
  {/if}
</form>
