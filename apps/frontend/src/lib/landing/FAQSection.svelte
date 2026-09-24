<script lang="ts">
  import { FAQS } from './data/faq.data';
  import FaqList from './FaqList.svelte';
  import type { DocFaqItem } from './guides/documentation.data';
  import LandingSection from './LandingSection.svelte';

  type Props = {
    faqs?: DocFaqItem[];
    title?: string;
  };

  const { faqs = FAQS, title = 'Frequently asked questions' }: Props = $props();
</script>

<LandingSection id="faq">
  <div
    class="grid grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-5 lg:gap-12 lg:px-10 lg:py-28"
  >
    <div class="flex flex-col gap-3 select-none lg:col-span-2">
      <h2
        class="text-3xl font-medium tracking-[-0.03em] text-balance sm:text-4xl"
      >
        {title}
      </h2>

      <p class="text-neutral-400 text-lg text-pretty">
        Have a different question?
        <a
          href="https://discord.gg/naftPW4Hxe"
          target="_blank"
          rel="noreferrer"
          class="link link-hover text-base-content font-medium"
        >
          Reach out on Discord
        </a>
      </p>
    </div>

    <FaqList {faqs} class="lg:col-span-3" />
  </div>
</LandingSection>
