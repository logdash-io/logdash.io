<script lang="ts">
  type FaqItem = {
    question: string;
    answer: string;
  };

  const faqs: FaqItem[] = [
    {
      question: 'Do I have to host anything?',
      answer:
        "No. logdash is fully managed — no servers, no agents, no storage to babysit. Add the SDK and you're done.",
    },
    {
      question: 'What languages & frameworks work?',
      answer:
        'Node, Next.js, Python, Go, Rust, Bun, Deno — and a plain REST API for everything else.',
    },
    {
      question: 'How is this different from Grafana/Prometheus?',
      answer:
        'Same visibility, none of the setup or maintenance. You skip the weekend of wiring and the forever of babysitting.',
    },
    {
      question: 'Will it slow my app down?',
      answer:
        'No — the SDK is async and fire-and-forget. Sending data never blocks your request path.',
    },
    {
      question: 'Is there really a free tier?',
      answer:
        'Yes, no credit card. Perfect for side projects; upgrade only when you need more.',
    },
  ];

  let open = $state<number | null>(0);

  function toggle(i: number) {
    open = open === i ? null : i;
  }
</script>

<section id="faq" class="faq">
  <div class="inner">
    <div class="head">
      <span class="label">Questions</span>
      <h2>The short answers</h2>
    </div>

    <ul class="list">
      {#each faqs as faq, i (faq.question)}
        <li class="card" class:open={open === i}>
          <button
            class="q"
            type="button"
            aria-expanded={open === i}
            onclick={() => toggle(i)}
          >
            <span class="qtext">{faq.question}</span>
            <span class="chev" aria-hidden="true"></span>
          </button>
          <div class="a" hidden={open !== i}>
            <p>{faq.answer}</p>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .faq {
    width: 100%;
    background: var(--surface);
    padding: clamp(64px, 9vw, 120px) 24px;
  }
  .inner {
    max-width: 760px;
    margin: 0 auto;
  }

  .head {
    text-align: center;
    margin-bottom: clamp(36px, 5vw, 56px);
  }
  .label {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--brand);
    margin-bottom: 12px;
  }
  .head h2 {
    font-size: clamp(28px, 4vw, 44px);
    line-height: 1.08;
    letter-spacing: -0.025em;
    font-weight: 800;
    color: var(--fg);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .card {
    background: var(--surface-raised);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s ease;
  }
  .card.open {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--line));
  }

  .q {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--fg);
    font-size: clamp(15px, 1.5vw, 17px);
    font-weight: 600;
    line-height: 1.4;
  }
  .q:hover {
    color: var(--fg);
  }
  .qtext {
    flex: 1;
    min-width: 0;
  }

  .chev {
    position: relative;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    transition: transform 0.25s ease;
  }
  .chev::before,
  .chev::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 11px;
    height: 2px;
    border-radius: 2px;
    background: var(--fg-muted);
    transform: translate(-50%, -50%);
    transition:
      transform 0.25s ease,
      background 0.2s ease;
  }
  .chev::after {
    transform: translate(-50%, -50%) rotate(90deg);
  }
  .card.open .chev::after {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  .card.open .chev::before,
  .card.open .chev::after {
    background: var(--brand);
  }

  .a {
    padding: 0 20px 18px;
  }
  .a p {
    margin: 0;
    color: var(--fg-muted);
    font-size: clamp(14px, 1.4vw, 16px);
    line-height: 1.6;
    max-width: 60ch;
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .chev,
    .chev::before,
    .chev::after {
      transition: none;
    }
  }
</style>
