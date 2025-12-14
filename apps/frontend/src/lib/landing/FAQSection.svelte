<script lang="ts">
  // Define a type for your FAQ items
  type FaqItem = {
    question: string;
    answer: string;
  };

  // Sample FAQ data - replace with your actual data source
  const faqs: FaqItem[] = [
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
      question: 'What is your refund policy?',
      answer:
        'We offer a questions-free full refund within 30 days of your subscription.',
    },
    {
      question: 'Free plan or trial?',
      answer:
        "Yep! We've got a free plan that's great for smaller projects, and you can take the premium features for a spin with our trial. No strings attached.",
    },
    {
      question: 'What kind of support?',
      answer:
        "We've got your back. There's plenty of info in our docs, a community forum to chat with other users, and if you're on a paid plan, we can come onboard to help you out.",
    },
    {
      question: 'Can Logdash scale?',
      answer:
        'For sure! Logdash is built to grow with you. It can handle tons of log data, no sweat, whether your app is tiny or massive.',
    },
    {
      question: 'How is pricing set?',
      answer:
        "It's mainly about how much data you send, how long you want to keep it, and which features you're using. Pop over to our pricing page – it lays everything out clearly.",
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

<section id="faq" class="">
  <div class="mx-auto max-w-4xl px-8 sm:px-6 lg:px-8">
    <div class="text-center">
      <h2
        class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white"
      >
        Frequently Asked Questions
      </h2>
      <p class="mt-2 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
        Have a different question? <a
          href="https://discord.gg/naftPW4Hxe"
          target="_blank"
          class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
        >
          Reach out on Discord
        </a>
      </p>
    </div>

    <div class="mt-12">
      <!-- 
              Grid layout:
              - 1 column by default (mobile)
              - 2 columns on medium screens and up (md:grid-cols-2)
              - gap-x-8 for horizontal space between columns
              - gap-y-10 for vertical space between FAQ items
            -->
      <dl class="gap-x-8 md:columns-2">
        {#each faqs as faq (faq.question)}
          <div class="mb-10 break-inside-avoid lg:mb-12">
            <dt class="text-base-content text-lg font-semibold leading-7">
              {faq.question}
            </dt>
            <dd class="text-base-content/70 mt-2 text-base">
              {faq.answer}
            </dd>
          </div>
        {/each}
      </dl>
    </div>
  </div>
</section>
