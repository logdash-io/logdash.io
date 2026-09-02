<script lang="ts">
  import { resolve } from '$app/paths';
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';
  import { scrollIntoViewCentered } from '$lib/domains/shared/utils/scroll';
  import { HERO_URL_INPUT_ID } from '$lib/landing/hero/HeroUrlForm.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';

  const INCLUDED = [
    'Uptime checks and alerts',
    'Logs and metrics',
    'Public status pages',
    'Telegram, Discord and webhook alerts',
    'Open source',
  ];

  function onStartFree(): void {
    const input = document.getElementById(HERO_URL_INPUT_ID);

    if (!input) {
      return;
    }

    scrollIntoViewCentered(input);
    input.focus({ preventScroll: true });
  }

  function onSeeAllPlans(): void {
    animatedViewState.nextAnimationDirection = AnimationDirection.RIGHT;
  }
</script>

<section id="pricing-cta" class="w-full">
  <div class="ld-radial-glow relative mx-auto w-full max-w-3xl">
    <div
      class="ld-card-base relative z-1 flex flex-col items-center gap-7 rounded-3xl px-6 py-10 text-center sm:px-10 sm:py-14"
    >
      <h2
        class="text-3xl font-extrabold tracking-tighter sm:text-4xl lg:text-5xl"
      >
        Start now. Pay when it's worth it.
      </h2>

      <ul class="mx-auto flex w-fit flex-col gap-3 text-left">
        {#each INCLUDED as item (item)}
          <li class="flex items-start gap-2.5">
            <CheckIcon class="text-success mt-0.5 size-5 shrink-0" />

            <span class="text-base-content/80">{item}</span>
          </li>
        {/each}
      </ul>

      <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button
          type="button"
          class="btn btn-primary h-12 rounded-full px-6 font-semibold"
          data-posthog-id="pricing-cta-start-cta"
          onclick={onStartFree}
        >
          Start free
          <ArrowRightIcon class="size-4" />
        </button>

        <a
          href={resolve('/pricing')}
          class="btn btn-ghost btn-subtle h-12 rounded-full px-6 font-semibold"
          data-posthog-id="pricing-cta-plans-cta"
          onclick={onSeeAllPlans}
        >
          See all plans
        </a>
      </div>
    </div>
  </div>
</section>
