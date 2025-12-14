<script>
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte.js';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { githubDark } from 'svelte-highlight/styles';
  import FrameworksList from './FrameworksList.svelte';

  const steps = [
    {
      number: 1,
      badgeClass: 'bg-primary text-primary-content shadow-primary/20',
      title: 'You: Configure project',
      description:
        'Create a project and enable features. Usually takes 3-5 minutes.',
    },
    {
      number: 2,
      badgeClass: 'bg-secondary text-secondary-content shadow-secondary/20',
      title: 'LLM: Integrates Logdash into your codebase',
      descriptionHtml: `Paste our <code>llms.txt</code> context. Your AI assistant writes the integration code for you instantly.`,
    },
    {
      number: 3,
      badgeClass: 'bg-accent text-accent-content shadow-accent/20',
      title: 'We: Watch your back',
      description:
        'We monitor your app 24/7 so you can focus on building and getting ahead. Sleep soundly.',
    },
  ];
</script>

<svelte:head>
  {@html githubDark}
</svelte:head>

<section id="how-it-works" class="w-full rounded-3xl px-4">
  <div class="mx-auto max-w-5xl">
    <div class="mb-12 text-center">
      <h2 class="text-secondary mb-4 text-4xl font-extrabold tracking-tight">
        How it works
      </h2>
      <p class="text-base-content/70 text-lg">
        From setup to insights in 3 simple steps. We handle the infrastructure.
      </p>
    </div>

    <div
      class="bg-base-200/80 border-base-100 flex flex-col gap-12 rounded-3xl border-t p-8"
    >
      {#each steps as step}
        <div class="flex flex-col gap-6 md:flex-row">
          <div class="shrink-0">
            <div
              class={[
                'flex size-14 items-center justify-center rounded-2xl text-2xl font-bold bg-base-100/60 border-base-100 border-t',
              ]}
            >
              {step.number}
            </div>
          </div>

          <div class="flex flex-col">
            <h3 class="text-base-content text-xl font-semibold">
              {step.title}
            </h3>

            {#if step.descriptionHtml}
              <p class="text-base-content/70 text-base leading-relaxed">
                {@html step.descriptionHtml}
              </p>
            {:else}
              <p class="text-base-content/70 text-base leading-relaxed">
                {step.description}
              </p>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="mt-12 mx-auto w-fit">
      <a
        onclick={() => {
          animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
        }}
        href="/demo-dashboard"
        class="btn btn-secondary gap-1"
      >
        See the live demo
        <ArrowRightIcon class="size-4" />
      </a>
    </div>

    <div class="mt-8">
      <FrameworksList />
    </div>
  </div>
</section>
