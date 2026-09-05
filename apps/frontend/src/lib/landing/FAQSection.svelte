<script lang="ts">
  import LandingSection from './LandingSection.svelte';

  type FaqItem = {
    question: string;
    answer: string;
  };

  const FAQS: FaqItem[] = [
    {
      question: 'Do I need an account?',
      answer:
        'No. Paste a URL and you get a dashboard instantly. Claim it with GitHub or Google within 24 hours to keep it.',
    },
    {
      question: 'What happens to my temporary dashboard?',
      answer:
        'It expires 24 hours after you create it unless you claim it. Claim it and everything stays: your monitors, logs and metrics.',
    },
    {
      question: 'What is Logdash?',
      answer:
        "Think of Logdash as your go-to buddy for keeping an eye on your apps. It's a modern platform that helps you see what's happening in real-time, super easily.",
    },
    {
      question: 'How to integrate?',
      answer:
        "Not tough at all! We've got straightforward guides and tools for most setups. You'll likely be up and running faster than you can make a coffee.",
    },
    {
      question: 'Can I try it before paying?',
      answer:
        'Yes. Start with a live dashboard without an account or a card, and take your time with logs, metrics and monitoring. You only pay once Logdash is worth paying for.',
    },
    {
      question: 'What is your refund policy?',
      answer:
        'We offer a no-questions-asked full refund within 30 days of your subscription.',
    },
    {
      question: 'What kind of support?',
      answer:
        "We've got your back. There's plenty of info in our docs, a community forum to chat with other users, and if you're a paying customer, we can come onboard to help you out.",
    },
    {
      question: 'Can Logdash scale?',
      answer:
        'For sure! Logdash is built to grow with you. It can handle tons of log data, no sweat, whether your app is tiny or massive.',
    },
    {
      question: 'How is pricing set?',
      answer:
        "It's mainly about how much data you send, how long you want to keep it, and which features you're using. Pop over to our pricing page - it lays everything out clearly.",
    },
    {
      question: 'What is "zero config"?',
      answer:
        'It means you can get started really quickly without a lot of complicated setup. We try to make things as plug-and-play as possible so you can focus on your app, not on configuring your infrastructure.',
    },
    {
      question: 'Can I self-host Logdash?',
      answer:
        'Not as a one-command install yet. Logdash is MIT and runs locally for development. Production self-hosting is tracked on GitHub, see /docs/self-hosting.',
    },
  ];
</script>

<!-- Heading on the left, questions on the right. -->
<LandingSection id="faq">
  <div
    class="grid grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-5 lg:gap-12 lg:px-10 lg:py-20"
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
        <details class="collapse-arrow collapse rounded-none">
          <summary
            class="collapse-title px-0 py-5 pr-10 text-base font-medium after:end-1"
          >
            {faq.question}
          </summary>

          <div class="collapse-content text-neutral-400 px-0 pr-10 text-base">
            {faq.answer}
          </div>
        </details>
      {/each}
    </div>
  </div>
</LandingSection>
