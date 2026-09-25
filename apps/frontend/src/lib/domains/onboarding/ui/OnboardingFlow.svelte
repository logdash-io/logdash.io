<script lang="ts">
  import { pendingOnboardingSteps } from '$lib/domains/onboarding/application/needs-onboarding';
  import type { OnboardingStep } from '$lib/domains/onboarding/domain/onboarding-questions';
  import type { User } from '$lib/domains/shared/user/domain/user';
  import { onMount, tick } from 'svelte';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fly } from 'svelte/transition';
  import OnboardingConsentStep from './OnboardingConsentStep.svelte';
  import OnboardingQuestionsStep from './OnboardingQuestionsStep.svelte';

  type Props = {
    user: User;
    submitLabel?: string;
    oncomplete: () => void;
  };

  const RESIZE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const LEAVE_DURATION = 150;

  let { user, submitLabel, oncomplete }: Props = $props();

  let saved = $state<OnboardingStep[]>([]);
  let frame = $state<HTMLDivElement>();
  let resizing = $state(false);
  let hasAdvanced = false;

  const remaining = $derived(
    pendingOnboardingSteps(user).filter((step) => !saved.includes(step)),
  );
  const step = $derived(remaining[0]);
  const offset = $derived(prefersReducedMotion.current ? 0 : 16);

  onMount(() => {
    if (remaining.length === 0) {
      oncomplete();
    }
  });

  async function onStepComplete(done: OnboardingStep): Promise<void> {
    if (remaining.every((pending) => pending === done)) {
      oncomplete();

      return;
    }

    const fromHeight = frame?.offsetHeight ?? 0;

    hasAdvanced = true;
    saved = [...saved, done];

    await tick();
    resizeFrame(fromHeight);
  }

  function resizeFrame(fromHeight: number): void {
    if (!frame || prefersReducedMotion.current) {
      return;
    }

    resizing = true;

    const animation = frame.animate(
      [{ height: `${fromHeight}px` }, { height: `${frame.offsetHeight}px` }],
      { duration: 320, easing: RESIZE_EASING },
    );

    animation.onfinish = () => {
      resizing = false;
    };
  }

  function focusHeading(node: HTMLElement): void {
    if (hasAdvanced) {
      node.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    }
  }
</script>

<div
  bind:this={frame}
  class={['relative grid', { 'overflow-y-clip': resizing }]}
>
  {#key step}
    <div
      class="col-start-1 row-start-1 inert:absolute inert:inset-x-0 inert:top-0"
      in:fly={{
        x: offset,
        duration: 240,
        delay: LEAVE_DURATION,
        easing: cubicOut,
      }}
      out:fly={{ x: -offset, duration: LEAVE_DURATION, easing: cubicIn }}
      {@attach focusHeading}
    >
      {#if step === 'consents'}
        <OnboardingConsentStep oncomplete={() => onStepComplete('consents')} />
      {:else if step === 'questions'}
        <OnboardingQuestionsStep
          {submitLabel}
          oncomplete={() => onStepComplete('questions')}
        />
      {/if}
    </div>
  {/key}
</div>
