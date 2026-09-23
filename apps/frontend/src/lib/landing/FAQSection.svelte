<script lang="ts">
  import { FAQS } from './data/faq.data';
  import FaqAsk from './FaqAsk.svelte';
  import FaqItem from './FaqItem.svelte';
  import LandingSection from './LandingSection.svelte';
</script>

<LandingSection id="faq">
  <div
    class="grid grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-5 lg:gap-12 lg:px-10 lg:py-28"
  >
    <div class="flex flex-col gap-3 lg:col-span-2">
      <h2
        class="text-3xl font-medium tracking-[-0.03em] text-balance sm:text-4xl"
      >
        Frequently asked questions
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

    <div class="divide-hairline flex flex-col divide-y lg:col-span-3">
      {#each FAQS as faq (faq.question)}
        <FaqItem question={faq.question}>{faq.answer}</FaqItem>
      {/each}

      <FaqAsk />
    </div>
  </div>
</LandingSection>
