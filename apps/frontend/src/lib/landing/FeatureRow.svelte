<script lang="ts">
  import { resolve } from '$app/paths';
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import LandingSection from './LandingSection.svelte';
  import StageLight from './stage/StageLight.svelte';
  import StagePanel from './stage/StagePanel.svelte';

  type FeatureRoute =
    | '/features/monitoring'
    | '/features/logging'
    | '/features/metrics';

  type Props = {
    title: string;
    body: string;
    href: FeatureRoute;
    linkLabel: string;
    posthogId: string;
    checks: string[];
    mirrored?: boolean;
    panelHeader?: Snippet;
    panel: Snippet;
  };

  const {
    title,
    body,
    href,
    linkLabel,
    posthogId,
    checks,
    mirrored = false,
    panelHeader,
    panel,
  }: Props = $props();
</script>

<LandingSection>
  <div class="grid grid-cols-1 lg:grid-cols-12">
    <div
      class={[
        'border-hairline flex flex-col px-4 py-10 sm:px-6 lg:col-span-5 lg:px-10 lg:py-12',
        mirrored ? 'lg:order-last lg:border-l' : 'lg:border-r',
      ]}
    >
      <h3 class="text-2xl font-medium tracking-[-0.02em]">{title}</h3>

      <p class="text-neutral-400 mt-3 max-w-md leading-relaxed text-pretty">
        {body}
      </p>

      <a
        href={resolve(href)}
        class="text-base-content hover:text-neutral-400 focus-visible:outline-neutral-500 mt-5 inline-flex w-fit items-center gap-1.5 rounded-full text-sm font-medium transition-ink duration-150 focus-visible:outline-2 focus-visible:outline-offset-4"
        data-posthog-id={posthogId}
      >
        {linkLabel}
        <ArrowRightIcon class="size-4" />
      </a>

      <ul
        class="border-hairline mt-10 flex flex-col gap-3 border-t pt-6 lg:mt-auto"
      >
        {#each checks as check (check)}
          <li class="flex items-start gap-3 text-sm">
            <CheckIcon class="text-neutral-500 mt-0.5 size-4 shrink-0" />
            <span class="text-neutral-300">{check}</span>
          </li>
        {/each}
      </ul>
    </div>

    <div
      class="border-hairline relative h-80 overflow-hidden border-t sm:h-96 lg:col-span-7 lg:h-auto lg:min-h-[30rem] lg:border-t-0"
    >
      <StageLight
        preset={mirrored ? 'bottom-right' : 'bottom-left'}
        class="absolute inset-0"
      />

      <StagePanel
        class={[
          'top-0 bottom-10 w-[88%] sm:bottom-12 lg:bottom-14 lg:w-[86%]',
          mirrored ? 'left-0 rounded-br-xl' : 'right-0 rounded-bl-xl',
        ]}
        header={panelHeader}
      >
        {@render panel()}
      </StagePanel>
    </div>
  </div>
</LandingSection>
