<script lang="ts">
  import Testimonial from './Testimonial.svelte';

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

<section class="testimonials">
  <div class="inner">
    <div class="label">From founders like you</div>
    <h2>Set up between two coffees</h2>

    <div class="grid">
      {#each REVIEWS as review (review.person)}
        <Testimonial
          quote={review.quote}
          person={review.person}
          company={review.company}
          img={review.img}
        />
      {/each}
    </div>
  </div>
</section>

<style>
  .testimonials {
    width: 100%;
    background: var(--surface);
    padding: clamp(64px, 9vh, 96px) 24px;
  }
  .inner {
    max-width: 1080px;
    margin: 0 auto;
  }
  .label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--brand-soft);
    text-align: center;
    margin-bottom: 14px;
  }
  h2 {
    font-size: clamp(28px, 3.6vw, 42px);
    line-height: 1.08;
    letter-spacing: -0.025em;
    font-weight: 800;
    color: var(--fg);
    text-align: center;
    margin: 0 auto;
    max-width: 20ch;
  }
  .grid {
    margin-top: clamp(36px, 5vh, 56px);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  @media (max-width: 820px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
