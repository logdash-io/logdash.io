<script lang="ts">
  import TrustProof from './Testimonial.svelte';
  import Marquee from '$lib/domains/shared/ui/components/Marquee.svelte';

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

<section class="container mx-auto px-4">
  <div class="mb-12 text-center">
    <h2 class="mb-2 text-3xl font-bold md:text-4xl">
      But don't just take our word for it
    </h2>
    <p class="mx-auto max-w-3xl text-xl opacity-80">
      Real words from founders and solo devs already shipping without critical
      services interruptions.
    </p>
  </div>

  <div class="relative flex flex-col gap-6">
    <Marquee pauseOnHover={true} duration="45s" gap="1.5rem" className="w-full">
      {#each REVIEWS as review (review.person)}
        <div class="card ld-card w-[340px] shrink-0 p-6 sm:w-[420px]">
          <TrustProof
            quote={review.quote}
            person={review.person}
            company={review.company}
            img={review.img}
          />
        </div>
      {/each}
    </Marquee>

    <Marquee
      pauseOnHover={true}
      duration="45s"
      gap="1.5rem"
      reverse={true}
      className="w-full"
    >
      {#each REVIEWS as review (review.person)}
        <div class="card ld-card w-[340px] shrink-0 p-6 sm:w-[420px]">
          <TrustProof
            quote={review.quote}
            person={review.person}
            company={review.company}
            img={review.img}
          />
        </div>
      {/each}
    </Marquee>

    <div
      class="from-base-300 pointer-events-none absolute inset-y-0 -left-1 w-1/4 bg-gradient-to-r"
    ></div>
    <div
      class="from-base-300 pointer-events-none absolute inset-y-0 -right-1 w-1/4 bg-gradient-to-l"
    ></div>
  </div>
</section>
