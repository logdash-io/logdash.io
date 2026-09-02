<script lang="ts">
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
        "Right now, Logdash is a cloud-based service. This helps us make sure it's always up, running smoothly, and easy for you to use without worrying about server maintenance. We might explore self-hosting options down the road if there's enough demand!",
    },
  ];
</script>

<section id="faq" class="w-full px-4">
  <div class="mx-auto max-w-3xl">
    <div class="text-center">
      <h2
        class="text-base-content text-4xl font-extrabold tracking-tighter sm:text-5xl"
      >
        Frequently asked questions
      </h2>

      <p class="text-base-content/70 mt-3 text-lg leading-relaxed">
        Have a different question?
        <a
          href="https://discord.gg/naftPW4Hxe"
          target="_blank"
          rel="noreferrer"
          class="link link-hover text-primary font-medium"
        >
          Reach out on Discord
        </a>
      </p>
    </div>

    <div class="mt-12 flex flex-col gap-3">
      {#each FAQS as faq (faq.question)}
        <details class="ld-card-base collapse-arrow collapse rounded-2xl">
          <summary class="collapse-title text-base font-semibold">
            {faq.question}
          </summary>

          <div class="collapse-content text-base-content/70 text-base">
            {faq.answer}
          </div>
        </details>
      {/each}
    </div>
  </div>
</section>
