<script>
  import TrustProof from './Testimonial.svelte';
</script>

<div class="flex flex-col items-start gap-2 px-6">
  <TrustProof
    quote="I wasted days configuring Grafana, Prometheus, and Loki. Logdash gave me the same visibility with zero configuration in just 3 minutes."
    person="Maciej Adryan"
    company={{
      who: 'Software Engineer',
      name: 'S&P Global',
      url: 'https://spglobal.com?ref=logdash.io',
    }}
    img="/images/testimonials/maciej_a.webp"
  />

  <div class="rating rating-xs pointer-events-none hidden">
    <input
      type="radio"
      name="rating-4"
      class="mask mask-star-2 bg-amber-300"
      aria-label="1 star"
      readonly
    />
    <input
      type="radio"
      name="rating-4"
      class="mask mask-star-2 bg-amber-300"
      aria-label="2 star"
      readonly
    />
    <input
      type="radio"
      name="rating-4"
      class="mask mask-star-2 bg-amber-300"
      aria-label="3 star"
      readonly
    />
    <input
      type="radio"
      name="rating-4"
      class="mask mask-star-2 bg-amber-300"
      aria-label="4 star"
      readonly
    />
    <input
      type="radio"
      name="rating-4"
      class="mask mask-star-2 bg-amber-300"
      aria-label="5 star"
      checked={true}
      readonly
    />
  </div>
</div>
