<script lang="ts">
  import LandingSection from './LandingSection.svelte';
  import Testimonial from './Testimonial.svelte';

  const TRUSTED_BY = [
    { text: 'Trusted by ', strong: false },
    { text: 'founders', strong: true },
    { text: ', ', strong: false },
    { text: 'solo devs', strong: true },
    { text: ', and ', strong: false },
    { text: 'small teams', strong: true },
    { text: ' shipping without interruptions.', strong: false },
  ];

  const REVIEWS = [
    {
      quote:
        'Most tools feel like they were made for enterprises. Logdash feels like it was made for me.',
      person: 'Bartosz Świtalski',
      company: {
        who: 'Co-Founder',
        name: 'Cryptly',
        url: 'https://cryptly.dev?ref=logdash.io',
      },
      img: '/images/testimonials/bsw.webp',
    },
    {
      quote:
        'I don’t have time for complex dashboards. I just want to know what went wrong and fix it fast. Logdash nailed that.',
      person: 'Yaroslaw Korshak',
      company: {
        who: 'CEO',
        name: 'Resurgo.ai',
        url: 'https://resurgo.ai?ref=logdash.io',
      },
      img: '/images/testimonials/yaroslaw.png',
    },
    {
      quote:
        'I’m the only dev on my app. When something breaks, it’s on me. Logdash gives me answers before I even ask the question.',
      person: 'Jerzy Wiśniewski',
      company: {
        who: 'Co-Founder',
        name: 'BlueMenu',
        url: 'https://bluemenu.io/?ref=logdash.io',
      },
      img: '/images/testimonials/bialyjurek.webp',
    },
  ];
</script>

<LandingSection id="testimonials">
  <div class="flex flex-col pb-8 lg:pb-12">
    <h2
      class="text-neutral-500 px-4 pt-8 pb-6 text-center text-base font-medium text-balance sm:px-6 lg:pt-12 lg:pb-8"
    >
      {#each TRUSTED_BY as part (part.text)}
        {#if part.strong}
          <span class="text-base-content">{part.text}</span>
        {:else}
          {part.text}
        {/if}
      {/each}
    </h2>

    <div
      class="border-hairline divide-hairline grid grid-cols-1 divide-y border-y lg:grid-cols-3 lg:divide-x lg:divide-y-0"
    >
      {#each REVIEWS as review (review.person)}
        <figure class="group px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Testimonial {...review} />
        </figure>
      {/each}
    </div>
  </div>
</LandingSection>
