<script lang="ts">
  import TrustProof from './TrustProof.svelte';
</script>

<section class="container mx-auto px-4">
  <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
    <div class="card ld-card p-6">
      <TrustProof
        quote="Most tools feel like they were made for teams. Logdash feels like it was made for me."
        person="Bartosz Świtalski"
        company={{
          who: 'Indie SaaS Founder',
          name: '',
          url: '',
        }}
        img="/images/testimonials/bsw.webp"
      />
    </div>
    <div class="card ld-card p-6">
      <TrustProof
        quote="I don’t have time for complex dashboards. I just want to know what went wrong and fix it fast. Logdash nailed that."
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
        quote="I’m the only dev on my app. When something breaks, it’s on me. Logdash gives me answers before I even ask the question."
        person="Jerzy Wiśniewski"
        company={{
          who: 'Co-Founder',
          name: 'BlueMenu',
          url: 'https://bluemenu.io/?ref=logdash.io',
        }}
        img="/images/testimonials/bialyjurek.webp"
      />
    </div>
  </div>
</section>
