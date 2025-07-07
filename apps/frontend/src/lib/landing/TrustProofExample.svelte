<script lang="ts">
  import TrustProof from './TrustProof.svelte';
</script>

<section class="container mx-auto px-4">
  <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
    <div class="card ld-card p-6">
      <TrustProof
        quote="Logs appear instantly—no lag, no waiting. The real-time speed is unmatched."
        person="Maciej Kulon"
        company={{
          who: 'Director Of Engineering',
          name: 'Flip',
          url: 'https://flip.shop?ref=logdash.io',
        }}
        img="/images/testimonials/maciej_k.webp"
      />
    </div>
    <div class="card ld-card p-6">
      <TrustProof
        quote="Working with Logdash feels like having an extra team on your side. They actually listen, ship fast, and genuinely care about your success."
        person="Yaroslaw Korshak"
        company={{
          who: 'CEO',
          name: 'Resurgo.ai',
          url: 'https://resurgo.ai?ref=logdash.io',
        }}
        img="/images/testimonials/yaroslaw.png"
      />
    </div>
    <div class="card ld-card p-6">
      <TrustProof
        quote="Lightweight, powerful, and fast. The best parts of many tools, without the clutter."
        person="Jerzy Wiśniewski"
        company={{
          who: 'Software Engineer',
          name: 'Megaron',
          url: 'https://megaron.com.pl/?ref=logdash.io',
        }}
        img="/images/testimonials/bialyjurek.webp"
      />
    </div>
  </div>
</section>
