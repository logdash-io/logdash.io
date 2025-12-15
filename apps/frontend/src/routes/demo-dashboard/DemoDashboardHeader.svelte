<script lang="ts">
  import FoundersCard from '$lib/landing/FoundersCard.svelte';
</script>

<FoundersCard class="max-w-7xl">
  <p class="mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">
    Logdash Live Demo
  </p>
  <p class="mb-6 text-lg font-extrabold">Our Production Dashboard</p>

  <p class="mb-4">
    You're currently viewing a live demonstration of Logdash, powered by our own
    production data (with any sensitive information anonymized). This is your
    chance to experience the clarity and power of Logdash firsthand.
  </p>

  <p class="mb-2 font-semibold">Here's what you can explore:</p>
  <ul class="mb-4 list-inside list-disc">
    <li>
      <strong>Real-time Log Streams:</strong>
      See how our logs flow in and how easily you can navigate them.
    </li>
    <li>
      <strong>Live Production Metrics:</strong>
      Interact with visualizations of our key performance indicators.
    </li>
    <li>
      <strong>Clean & Uncluttered Interface:</strong>
      Notice the focus on essential information, free from distractions.
    </li>
  </ul>

  <p class="mb-6">
    This demo showcases how Logdash helps you cut through the noise of
    traditional observability tools. If you're looking for a streamlined,
    developer-first solution without the self-hosting headaches, you're in the
    right place.
  </p>
</FoundersCard>
