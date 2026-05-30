<script lang="ts">
  // ── verifiable value props (NO invented user/event counts) ───────
  const props: string[] = [
    'Live in 60 seconds',
    'One line of SDK',
    'No credit card',
    'Open-source SDK',
  ];

  // ── stack the SDK works with ─────────────────────────────────────
  const stack: string[] = [
    'Node.js',
    'Next.js',
    'Python',
    'Go',
    'Rust',
    'Bun',
    'Deno',
    'REST API',
  ];
</script>

<section class="proofstrip">
  <div class="inner">
    <div class="props">
      {#each props as prop, i (prop)}
        {#if i > 0}
          <span class="dot" aria-hidden="true"></span>
        {/if}
        <span class="prop">
          <span class="check" aria-hidden="true"></span>
          {prop}
        </span>
      {/each}
    </div>

    <div class="stack">
      <span class="stack-label">Works with your stack</span>
      <div class="chips">
        {#each stack as item (item)}
          <span class="chip">{item}</span>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .proofstrip {
    width: 100%;
    background: var(--surface);
  }
  .inner {
    max-width: 1080px;
    margin-inline: auto;
    padding: clamp(56px, 8vh, 88px) 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  /* value props row */
  .props {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px 18px;
  }
  .prop {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--fg);
  }
  .check {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-green-600);
    flex-shrink: 0;
  }
  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--fg-faint);
  }

  /* stack chips */
  .stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .stack-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--fg-faint);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .chip {
    font-size: 12.5px;
    color: var(--fg-muted);
    border: 1px solid var(--line);
    background: color-mix(in srgb, var(--fg) 3%, transparent);
    padding: 6px 12px;
    border-radius: 999px;
  }

  /* responsive: stack the dot separators away, let props wrap cleanly */
  @media (max-width: 820px) {
    .inner {
      gap: 28px;
    }
    .dot {
      display: none;
    }
    .props {
      gap: 10px 20px;
    }
  }
</style>
