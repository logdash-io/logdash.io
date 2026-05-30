<script lang="ts">
  import { ArrowRightIcon } from 'lucide-svelte';
</script>

<section class="final">
  <div class="inner">
    <div class="card">
      <span class="label">Stop shipping blind</span>
      <h2>Get your vision back in 60 seconds.</h2>
      <p class="lead">
        Free account, no credit card, no Grafana weekend. Just clarity.
      </p>
      <div class="ctas">
        <a
          href="/app/auth"
          class="btn btn-primary btn-lg"
          data-posthog-id="landing-final-cta"
        >
          Start free <ArrowRightIcon class="ml-1 size-4" />
        </a>
      </div>
    </div>
  </div>
</section>

<style>
  .final {
    width: 100%;
    background: var(--surface);
  }
  .inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: clamp(48px, 7vh, 80px) 24px;
  }
  .card {
    position: relative;
    overflow: hidden;
    text-align: center;
    border-radius: 24px;
    padding: clamp(40px, 6vw, 64px) clamp(24px, 4vw, 48px);
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--brand) 22%, var(--surface-raised)),
      var(--surface-raised)
    );
    border: 1px solid color-mix(in srgb, var(--brand) 40%, transparent);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--brand) 10%, transparent);
  }
  .label {
    display: inline-block;
    margin-bottom: 14px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--brand-soft);
  }
  h2 {
    margin-bottom: 10px;
    font-size: clamp(28px, 4vw, 44px);
    line-height: 1.08;
    letter-spacing: -0.03em;
    font-weight: 800;
    color: var(--fg);
  }
  .lead {
    max-width: 46ch;
    margin: 0 auto;
    font-size: clamp(15px, 1.5vw, 18px);
    line-height: 1.5;
    color: var(--fg-muted);
  }
  .ctas {
    display: flex;
    justify-content: center;
    margin-top: 22px;
  }
  :global(.btn-lg) {
    padding: 13px 22px;
    font-size: 15px;
  }
</style>
