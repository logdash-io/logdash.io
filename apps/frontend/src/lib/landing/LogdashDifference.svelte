<script lang="ts">
  import MagicWandIcon from '$lib/domains/shared/icons/MagicWandIcon.svelte';
  import {
    BellIcon,
    ClockIcon,
    FocusIcon,
    MegaphoneIcon,
    SearchIcon,
    ShieldCheckIcon,
    TriangleAlertIcon,
    WrenchIcon,
    ZapIcon,
  } from 'lucide-svelte';
  import type { Icon } from 'lucide-svelte';
  import type { Component, ComponentType } from 'svelte';
  import LandingSection from './LandingSection.svelte';

  type FeatureItem = {
    icon: Component<{ class?: string }> | ComponentType<Icon>;
    title: string;
    description: string;
  };

  type ComparisonCard = {
    headerPrefix: string;
    headerLabel: string;
    variant: 'primary' | 'error';
    features: FeatureItem[];
    resultLabel: string;
    resultSuffix: string;
  };

  const logdashCard: ComparisonCard = {
    headerPrefix: 'Shipping with',
    headerLabel: 'Logdash',
    variant: 'primary',
    features: [
      {
        icon: ZapIcon,
        title: 'You (30 seconds):',
        description:
          'Paste your URL and uptime checks start right away. No account, nothing to install.',
      },
      {
        icon: MagicWandIcon,
        title: 'You (a few minutes, optional):',
        description:
          'Want logs and metrics too? Paste our prompt into your LLM and it wires them in.',
      },
      {
        icon: FocusIcon,
        title: 'Us (one dashboard):',
        description:
          'Uptime, logs and metrics in one view. No jumping between AWS, Vercel and other tools.',
      },
      {
        icon: BellIcon,
        title: 'Us (watching your back):',
        description:
          'We check your app every 15 seconds and ping you on Telegram or a webhook only when it matters.',
      },
      {
        icon: ShieldCheckIcon,
        title: 'You (peace of mind):',
        description: 'Ship features. We watch your back, even while you sleep.',
      },
    ],
    resultLabel: '30 s setup',
    resultSuffix: 'then full clarity',
  };

  const diyCard: ComparisonCard = {
    headerPrefix: 'Shipping',
    headerLabel: 'on your own',
    variant: 'error',
    features: [
      {
        icon: SearchIcon,
        title: 'You (manual config):',
        description:
          'Spend days setting up Prometheus, Grafana, or configuring dispersed cloud logs.',
      },
      {
        icon: TriangleAlertIcon,
        title: 'You (gluing together fragmented data):',
        description:
          'Manually correlating timestamps across Vercel logs and database metrics.',
      },
      {
        icon: WrenchIcon,
        title: 'You (maintenance):',
        description:
          'Managing self-hosted instances, updates, and storage costs.',
      },
      {
        icon: ClockIcon,
        title: 'You (constant worry):',
        description:
          'Manually checking "is the app still up?" every few hours.',
      },
      {
        icon: MegaphoneIcon,
        title: 'You (damage control):',
        description:
          'Writing the "we are aware" post by hand while the app is still down.',
      },
    ],
    resultLabel: 'Hours wasted',
    resultSuffix: 'with burnout risk',
  };

  const cards = [logdashCard, diyCard];
</script>

<LandingSection id="logdash-difference">
  <div class="flex flex-col gap-12 px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
    <div class="text-center">
      <h2 class="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
        The Logdash difference
      </h2>

      <p class="text-neutral-400 mt-3 text-lg">
        Compare doing this yourself vs. having Logdash handle it.
      </p>
    </div>

    <!--
      Two columns on the page, split by a hairline. The pills and the result
      rows carry the contrast; the icons on the do-it-yourself side stay muted
      so red is reserved for the verdict.
    -->
    <div
      class="divide-hairline grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0"
    >
      {#each cards as card (card.variant)}
        {@const isPrimary = card.variant === 'primary'}
        <div
          class="flex flex-col gap-8 py-10 first:pt-0 last:pb-0 md:py-0 md:first:pr-10 md:last:pl-10"
        >
          <h3
            class="flex flex-wrap items-center gap-2 text-xl font-medium tracking-tight"
          >
            {card.headerPrefix}
            <span
              class={[
                'rounded-md px-2 py-0.5 text-base',
                {
                  'bg-primary text-primary-content': isPrimary,
                  'bg-error text-error-content': !isPrimary,
                },
              ]}
            >
              {card.headerLabel}
            </span>
          </h3>

          <ul class="flex flex-col gap-5">
            {#each card.features as feature (feature.title)}
              <li class="flex gap-4">
                <feature.icon
                  class="mt-0.5 size-5 shrink-0 {isPrimary
                    ? 'text-base-content'
                    : 'text-neutral-600'}"
                />

                <p class="text-neutral-400 leading-relaxed">
                  <span class="text-base-content font-medium">
                    {feature.title}
                  </span>
                  {feature.description}
                </p>
              </li>
            {/each}
          </ul>

          <div
            class="border-hairline mt-auto flex flex-wrap items-center gap-3 border-t pt-6"
          >
            <span class="font-medium">Result:</span>

            <span
              class={[
                'rounded-md px-2.5 py-0.5 font-medium',
                {
                  'bg-primary text-primary-content': isPrimary,
                  'bg-error text-error-content': !isPrimary,
                },
              ]}
            >
              {card.resultLabel}
            </span>

            <span class="text-neutral-400">{card.resultSuffix}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</LandingSection>
