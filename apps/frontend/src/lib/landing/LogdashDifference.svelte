<script lang="ts">
  import type { Icon } from 'lucide-svelte';
  import {
    BellIcon,
    ClockIcon,
    FocusIcon,
    SearchIcon,
    ShieldCheckIcon,
    TriangleAlertIcon,
    WrenchIcon,
    ZapIcon,
  } from 'lucide-svelte';
  import type { ComponentType } from 'svelte';

  type FeatureItem = {
    icon: ComponentType<Icon>;
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
        title: 'You (5 min setup):',
        description:
          "Install the SDK, add a few lines of code, and you're collecting data instantly.",
      },
      {
        icon: FocusIcon,
        title: 'We (unified dashboard):',
        description:
          'Logs, metrics, and uptime in one view. No jumping between AWS, Vercel, and other tools.',
      },
      {
        icon: BellIcon,
        title: 'We (watching your back):',
        description:
          'We check up on your app once per 15 seconds. Get notified on Telegram/Discord only when it matters.',
      },
      {
        icon: ShieldCheckIcon,
        title: 'You (peace of mind):',
        description:
          'Focus on shipping features. We watch your back even when you sleep.',
      },
    ],
    resultLabel: '5 min setup',
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
        title: 'You (glueing together fragmented data):',
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
    ],
    resultLabel: 'Hours wasted',
    resultSuffix: 'with burnout risk',
  };

  const cards = [logdashCard, diyCard];
</script>

<section id="logdash-difference" class="container mx-auto px-4">
  <div class="mb-12 text-center">
    <h2 class="mb-2 text-3xl font-bold md:text-4xl">The Logdash difference</h2>
    <p class="mx-auto max-w-3xl text-xl opacity-80">
      Compare doing this yourself vs. having Logdash handle it.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each cards as card}
      {@const isPrimary = card.variant === 'primary'}
      <div
        class={[
          'relative flex flex-col gap-8 overflow-hidden rounded-3xl border p-8',
          {
            'ld-card-base text-base-content': isPrimary,
            'from-error/10 border-red-950 bg-gradient-to-br to-transparent':
              !isPrimary,
          },
        ]}
      >
        <div class="mb-6">
          <h3 class="flex items-center gap-2 text-2xl font-bold">
            {card.headerPrefix}
            <span
              class={[
                'rounded-lg px-2 py-1 text-lg',
                {
                  'bg-primary text-primary-content': isPrimary,
                  'bg-error text-error-content': !isPrimary,
                },
              ]}
            >
              {card.headerLabel}
            </span>
          </h3>
        </div>

        <ul class="space-y-6">
          {#each card.features as feature}
            <li class="flex gap-4">
              <div class="mt-1 shrink-0">
                <feature.icon
                  class="h-6 w-6 {isPrimary ? 'text-primary' : 'text-error'}"
                />
              </div>
              <div>
                <span class="font-bold">{feature.title}</span>
                <span class="opacity-80">{feature.description}</span>
              </div>
            </li>
          {/each}
        </ul>

        <div
          class={[
            'mt-auto border-t pt-6',
            {
              'border-base-100/80': isPrimary,
              'mt-8 border-error/20': !isPrimary,
            },
          ]}
        >
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-lg font-bold">Result:</span>
            <span
              class={[
                'rounded-lg px-3 py-1 font-bold',
                {
                  'bg-primary text-primary-content': isPrimary,
                  'bg-error text-error-content': !isPrimary,
                },
              ]}
            >
              {card.resultLabel}
            </span>
            <span class="font-semibold">{card.resultSuffix}</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>
