<script lang="ts">
  type Tab = 'node' | 'python';
  let active = $state<Tab>('node');
</script>

<section class="install">
  <div class="inner">
    <div class="label">Ridiculously simple</div>
    <h2>Live in 60 seconds. One line, not a weekend.</h2>
    <p class="lead">
      Install the SDK, drop in a few lines, and your logs, metrics and uptime
      show up instantly. No agents. No infra. No YAML graveyard.
    </p>

    <div class="code">
      <div class="code-tabs" role="tablist" aria-label="SDK language">
        <button
          class="code-tab"
          class:on={active === 'node'}
          role="tab"
          aria-selected={active === 'node'}
          onclick={() => (active = 'node')}
        >
          Node.js
        </button>
        <button
          class="code-tab"
          class:on={active === 'python'}
          role="tab"
          aria-selected={active === 'python'}
          onclick={() => (active = 'python')}
        >
          Python
        </button>
      </div>

      {#if active === 'node'}
        <pre><span class="c">// npm install @logdash/node</span>
<span class="k">import</span> &lbrace; Logdash &rbrace; <span
            class="k">from</span> <span class="s">'@logdash/node'</span>;

<span class="k">const</span> logdash = <span class="k">new</span> Logdash(<span
            class="s">"&lt;your-api-key&gt;"</span>);

logdash.<span class="k">info</span>(<span
            class="s">"Application started successfully"</span>);
logdash.<span class="k">warn</span>(<span
            class="s">"Low disk space warning"</span>);
logdash.<span class="k">error</span>(<span
            class="s">"An unexpected error occurred"</span>);</pre>
      {:else}
        <pre><span class="c"># pip install logdash</span>
<span class="k">from</span> logdash <span class="k">import</span> create_logdash

logdash = create_logdash(&lbrace; <span class="s">"api_key"</span>: <span
            class="s">"&lt;your-api-key&gt;"</span> &rbrace;)
logger = logdash.logger

logger.<span class="k">info</span>(<span
            class="s">"Application started successfully"</span>)
logger.<span class="k">error</span>(<span
            class="s">"An unexpected error occurred"</span>)</pre>
      {/if}
    </div>

    <p class="cap">
      That's the whole integration. It shows up in your dashboard instantly.
    </p>
  </div>
</section>

<style>
  .install {
    width: 100%;
    background: var(--surface);
    padding: clamp(64px, 9vh, 96px) 24px;
  }
  .inner {
    max-width: 760px;
    margin: 0 auto;
    text-align: center;
  }
  .label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--brand-soft);
    margin-bottom: 14px;
  }
  h2 {
    font-size: clamp(28px, 3.6vw, 42px);
    line-height: 1.08;
    letter-spacing: -0.025em;
    font-weight: 800;
    color: var(--fg);
    margin: 0 auto;
    max-width: 20ch;
  }
  .lead {
    font-size: clamp(15px, 1.5vw, 18px);
    color: var(--fg-muted);
    line-height: 1.55;
    max-width: 56ch;
    margin: 16px auto 0;
  }

  .code {
    margin: 32px auto 0;
    text-align: left;
    background: var(--surface-raised);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.7);
  }
  .code-tabs {
    display: flex;
    gap: 4px;
    padding: 10px 12px 0;
    border-bottom: 1px solid var(--line-soft);
    background: var(--surface-overlay);
  }
  .code-tab {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--fg-faint);
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    font-weight: 500;
    padding: 9px 16px;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition:
      color 0.18s,
      border-color 0.18s,
      background 0.18s;
  }
  .code-tab:hover {
    color: var(--fg-muted);
  }
  .code-tab.on {
    color: var(--fg);
    background: var(--surface-raised);
    border-bottom-color: var(--brand);
  }

  pre {
    margin: 0;
    padding: 20px clamp(16px, 3vw, 26px);
    overflow-x: auto;
    font-family: var(--font-mono, monospace);
    font-size: clamp(12.5px, 1.5vw, 14px);
    line-height: 1.75;
    color: var(--fg-muted);
    white-space: pre;
    tab-size: 2;
  }
  pre .c {
    color: var(--fg-faint);
  }
  pre .k {
    color: var(--brand-soft);
  }
  pre .s {
    color: #86efac;
  }

  .cap {
    font-size: 14px;
    color: var(--fg-faint);
    margin: 20px auto 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .code-tab {
      transition: none;
    }
  }
</style>
