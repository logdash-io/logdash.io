<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowRightIcon } from 'lucide-svelte';

  // ── streaming demo logs ──────────────────────────────────────────
  type Row = {
    ts: string;
    lvl: string;
    color: string;
    bg: string;
    msg: string;
  };
  const TEMPLATES: Omit<Row, 'ts'>[] = [
    {
      lvl: 'INFO',
      color: 'var(--color-green-600)',
      bg: 'rgba(34,197,94,.15)',
      msg: 'GET /api/orders 200 — 38ms',
    },
    {
      lvl: 'INFO',
      color: 'var(--color-green-600)',
      bg: 'rgba(34,197,94,.15)',
      msg: 'user.session.created uid=8f21',
    },
    {
      lvl: 'WARN',
      color: 'var(--color-amber-500)',
      bg: 'rgba(245,158,11,.15)',
      msg: 'retry queue depth 12',
    },
    {
      lvl: 'INFO',
      color: 'var(--color-green-600)',
      bg: 'rgba(34,197,94,.15)',
      msg: 'cache hit ratio 0.94',
    },
    {
      lvl: 'ERR',
      color: 'var(--brand-soft)',
      bg: 'rgba(219,39,119,.18)',
      msg: 'payment webhook failed — stripe 502',
    },
    {
      lvl: 'INFO',
      color: 'var(--color-green-600)',
      bg: 'rgba(34,197,94,.15)',
      msg: 'POST /api/checkout 201 — 51ms',
    },
    {
      lvl: 'WARN',
      color: 'var(--color-amber-500)',
      bg: 'rgba(245,158,11,.15)',
      msg: 'slow query 412ms users.find',
    },
    {
      lvl: 'INFO',
      color: 'var(--color-green-600)',
      bg: 'rgba(34,197,94,.15)',
      msg: 'healthcheck ok — 4 services',
    },
  ];
  let logs = $state<Row[]>([]);
  let i = 0;
  function nextRow(): Row {
    const t = new Date(1717000000000 + i * 43000).toTimeString().slice(0, 8);
    const tpl = TEMPLATES[i % TEMPLATES.length];
    i++;
    return { ts: t, ...tpl };
  }

  // ── reveal + scroll-scale state ──────────────────────────────────
  let scrolly = $state<HTMLElement | null>(null);
  let revealed = $state(false);
  let reduceMotion = $state(false);
  let frameScale = $state(0.8);
  let frameLift = $state(46); // vh translateY of the framewrap
  let textLift = $state(0); // vh translateY of hero text
  let textOpacity = $state(1);

  // ── active popover ──
  let openPop = $state<string | null>(null);
  function togglePop(id: string, e: MouseEvent) {
    e.stopPropagation();
    openPop = openPop === id ? null : id;
  }

  const clamp = (v: number, a: number, b: number) =>
    Math.min(Math.max(v, a), b);

  function applyProgress(p: number) {
    frameScale = 0.8 + 0.2 * p;
    frameLift = 46 * (1 - p);
    textLift = -30 * p;
    textOpacity = clamp(1 - p / 0.38, 0, 1);
    if (p > 0.5) revealed = true;
  }

  onMount(() => {
    reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // seed + stream logs
    for (let k = 0; k < 11; k++) logs.push(nextRow());
    const logTimer = setInterval(() => {
      logs.push(nextRow());
      if (logs.length > 11) logs = logs.slice(logs.length - 11);
    }, 1600);

    if (reduceMotion) {
      // static, already-revealed fallback — no scroll scrubbing
      applyProgress(1);
      revealed = true;
      return () => clearInterval(logTimer);
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!scrolly) return;
        const r = scrolly.getBoundingClientRect();
        const total = scrolly.offsetHeight - window.innerHeight;
        applyProgress(clamp(-r.top / total, 0, 1));
      });
    };
    // capture phase: catches scroll from the layout's ScrollArea viewport (scroll doesn't bubble)
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      clearInterval(logTimer);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  });

  function onFrameEnter() {
    if (!reduceMotion) revealed = true;
  }
</script>

<svelte:window onclick={() => (openPop = null)} />

<section class="scrolly" class:static={reduceMotion} bind:this={scrolly}>
  <div class="pin">
    <!-- hero copy -->
    <div
      class="herotext"
      style="transform:translateY({textLift}vh);opacity:{textOpacity};pointer-events:{textOpacity <
      0.3
        ? 'none'
        : 'auto'}"
    >
      <span class="pill">
        <span class="pdot"></span>
        Health monitoring built for solo founders
      </span>
      <h1>
        Monitoring for founders who'd rather ship. No Grafana weekend. No
        enterprise bill.
      </h1>
      <p class="sub">
        Logs, metrics, and uptime in one dashboard. One line of SDK, live in 60
        seconds — no agents, no infra, no babysitting.
      </p>
      <div class="ctas">
        <a
          href="/app/auth"
          class="btn btn-primary btn-lg"
          data-posthog-id="landing-hero-start"
        >
          Start free <ArrowRightIcon class="ml-1 size-4" />
        </a>
        <a
          href="/demo-dashboard"
          class="btn btn-ghost-token btn-lg"
          data-posthog-id="landing-hero-demo"
        >
          Explore live demo
        </a>
      </div>
      {#if !reduceMotion}
        <div class="cue">↓ scroll — the demo below is live &amp; clickable</div>
      {/if}
    </div>

    <!-- framed demo -->
    <div class="framewrap" style="transform:translateY({frameLift}vh)">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="frame"
        class:revealed
        style="transform:scale({frameScale})"
        onmouseenter={onFrameEnter}
        role="img"
        aria-label="logdash demo dashboard"
      >
        <div class="frame-bar">
          <div class="traffic">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="url"><span class="urlbar">app.logdash.io/demo</span></div>
          <div style="width:54px"></div>
        </div>

        <div class="livedot">
          <span class="b"></span>
          LIVE
        </div>

        {#if !reduceMotion}
          <div class="overlay">
            <div class="play"></div>
            <div class="ohint">Hover to step inside the live demo</div>
            <div class="osmall">
              It's the real dashboard — click the ● dots to explore
            </div>
          </div>
        {/if}

        <div class="dash">
          <aside class="side">
            <div class="sel">
              <span class="cube">◆</span>
              acme-prod
            </div>
            <div class="navi on">
              <span class="ic"></span>
              Home
            </div>
            <div class="navi">
              <span class="ic"></span>
              Settings
            </div>
            <div class="navi">
              <span class="ic"></span>
              Status pages
            </div>
            <div class="sect">Services</div>
            <div class="svc">
              <span class="hx ok"></span>
              api-gateway
            </div>
            <div class="svc">
              <span class="hx ok"></span>
              web-app
            </div>
            <div class="svc">
              <span class="hx err"></span>
              payments
            </div>
            <div class="svc">
              <span class="hx ok"></span>
              worker
            </div>
          </aside>
          <div class="main">
            <div class="tabs">
              <span class="tab on">Overview</span>
              <span class="tab">Logs</span>
              <span class="tab">Metrics</span>
              <span class="tab">Monitoring</span>
              <span class="tab">Settings</span>
            </div>
            <div class="panes">
              <div class="logs">
                {#each logs as row (row.ts + row.msg)}
                  <div class="logrow">
                    <span class="ts">{row.ts}</span>
                    <span
                      class="lvl"
                      style="color:{row.color};background:{row.bg}"
                    >
                      {row.lvl}
                    </span>
                    <span class="msg">{row.msg}</span>
                  </div>
                {/each}
              </div>
              <div class="rail">
                <div class="tile">
                  <div class="k">Requests / min</div>
                  <div class="v">1,284</div>
                  <div class="spark">
                    <i style="height:40%"></i>
                    <i style="height:65%"></i>
                    <i style="height:50%"></i>
                    <i style="height:80%"></i>
                    <i style="height:60%"></i>
                    <i style="height:90%"></i>
                    <i style="height:72%"></i>
                  </div>
                </div>
                <div class="tile">
                  <div class="k">p95 latency</div>
                  <div class="v">
                    42
                    <small>ms</small>
                  </div>
                </div>
                <div class="tile">
                  <div class="k">Error rate</div>
                  <div class="v err">
                    0.4
                    <small>%</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- click-to-explain hotspots -->
        <button
          class="hot"
          style="left:7%;top:62%"
          aria-label="About uptime monitoring"
          onclick={(e) => togglePop('uptime', e)}
        ></button>
        <button
          class="hot"
          style="left:40%;top:58%"
          aria-label="About logs"
          onclick={(e) => togglePop('logs', e)}
        ></button>
        <button
          class="hot"
          style="left:90%;top:74%"
          aria-label="About metrics"
          onclick={(e) => togglePop('metrics', e)}
        ></button>

        <div
          class="pop"
          class:show={openPop === 'uptime'}
          style="left:11%;top:66%"
        >
          <h4>
            <span class="tag">Uptime</span>
             Monitoring
          </h4>
          <p>
            We ping your services from outside and tell you the second one goes
            down — like <b>payments</b>
             here.
          </p>
        </div>
        <div
          class="pop"
          class:show={openPop === 'logs'}
          style="left:43%;top:30%"
        >
          <h4>
            <span class="tag">Logs</span>
             Real-time stream
          </h4>
          <p>
            Every request, error and event in one searchable stream. One line of
            SDK, no agents.
          </p>
        </div>
        <div
          class="pop"
          class:show={openPop === 'metrics'}
          style="left:64%;top:78%"
        >
          <h4>
            <span class="tag">Metrics</span>
             &amp; alerts
          </h4>
          <p>
            Track p95, throughput, error rate. Get pinged on Telegram the moment
            something spikes.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .scrolly {
    position: relative;
    z-index: 1;
    height: 300vh;
    width: 100%;
    flex-shrink: 0; /* layout wraps children in an h-full flex column — don't let it squash the scroll track */
    background: var(--surface);
  }
  .scrolly.static {
    height: auto;
  }
  .pin {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
  }
  .scrolly.static .pin {
    position: relative;
    height: auto;
    padding-bottom: 4rem;
  }

  .herotext {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    padding: 15vh 24px 0;
    gap: 20px;
    will-change: transform, opacity;
  }
  .scrolly.static .herotext {
    position: relative;
    padding: 8vh 24px 4vh;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: var(--fg-muted);
    background: color-mix(in srgb, var(--fg) 4%, transparent);
    border: 1px solid var(--line);
    padding: 6px 14px;
    border-radius: 999px;
  }
  .pill .pdot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-green-600);
  }
  h1 {
    font-size: clamp(36px, 5.4vw, 62px);
    line-height: 1.04;
    letter-spacing: -0.03em;
    font-weight: 800;
    max-width: 18ch;
    color: var(--fg);
  }
  .sub {
    font-size: clamp(16px, 1.6vw, 20px);
    color: var(--fg-muted);
    max-width: 54ch;
    line-height: 1.5;
  }
  .ctas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 4px;
  }
  :global(.btn-lg) {
    padding: 13px 22px;
    font-size: 15px;
  }
  .btn-ghost-token {
    background: color-mix(in srgb, var(--fg) 5%, transparent);
    color: var(--fg);
    border: 1px solid var(--line);
  }
  .cue {
    margin-top: 8px;
    font-size: 12px;
    color: var(--fg-faint);
    animation: bob 1.8s ease-in-out infinite;
  }
  @keyframes bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(6px);
    }
  }

  .framewrap {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 clamp(24px, 4vw, 80px);
    will-change: transform;
  }
  .scrolly.static .framewrap {
    position: relative;
    padding: 0 clamp(24px, 4vw, 80px) 2rem;
  }
  .frame {
    width: 100%;
    max-width: 1500px;
    background: var(--surface-raised);
    border: 1px solid color-mix(in srgb, var(--brand) 50%, transparent);
    border-radius: 18px;
    box-shadow:
      0 30px 80px -24px rgba(0, 0, 0, 0.8),
      0 0 0 1.5px var(--surface),
      0 0 0 8px color-mix(in srgb, var(--brand) 20%, transparent);
    overflow: hidden;
    position: relative;
    transform-origin: center center;
    will-change: transform;
  }
  .frame-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--line-soft);
    background: var(--surface-overlay);
  }
  .traffic {
    display: flex;
    gap: 8px;
  }
  .traffic span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-grey-600);
  }
  .traffic span:nth-child(1) {
    background: #ff5f57;
  }
  .traffic span:nth-child(2) {
    background: #febc2e;
  }
  .traffic span:nth-child(3) {
    background: #28c840;
  }
  .url {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  .urlbar {
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: 7px;
    padding: 5px 16px;
    color: var(--fg-muted);
    font-size: 13px;
    font-family: var(--font-mono, monospace);
  }

  .dash {
    display: flex;
    height: min(64vh, 600px);
  }
  .side {
    width: 228px;
    flex-shrink: 0;
    border-right: 1px solid var(--line-soft);
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sel {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px;
    border-radius: 10px;
    background: var(--surface-overlay);
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--fg);
  }
  .sel .cube {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: color-mix(in srgb, var(--brand) 22%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand);
  }
  .navi {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 9px;
    font-size: 14px;
    color: var(--fg-muted);
  }
  .navi.on {
    background: var(--surface-overlay);
    color: var(--fg);
  }
  .navi .ic {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    background: currentColor;
    opacity: 0.5;
  }
  .sect {
    font-size: 11px;
    color: var(--fg-faint);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 12px 10px 4px;
  }
  .svc {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 9px;
    font-size: 14px;
    color: var(--fg-muted);
  }
  .hx {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    transform: rotate(45deg);
  }
  .hx.ok {
    background: var(--color-green-600);
  }
  .hx.err {
    background: var(--color-red-600);
  }
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .tabs {
    display: flex;
    gap: 6px;
    padding: 13px 16px;
    border-bottom: 1px solid var(--line-soft);
  }
  .tab {
    font-size: 13.5px;
    padding: 7px 14px;
    border-radius: 9px;
    color: var(--fg-muted);
  }
  .tab.on {
    background: var(--surface-overlay);
    color: var(--fg);
  }
  .panes {
    flex: 1;
    display: flex;
    min-height: 0;
  }
  .logs {
    flex: 1;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    overflow: hidden;
    border-right: 1px solid var(--line-soft);
    font-family: var(--font-mono, monospace);
  }
  .logrow {
    display: flex;
    gap: 10px;
    align-items: baseline;
    font-size: 12.5px;
  }
  .lvl {
    padding: 1px 7px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .ts {
    color: var(--fg-faint);
    flex-shrink: 0;
  }
  .msg {
    color: var(--fg-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rail {
    width: 250px;
    flex-shrink: 0;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tile {
    background: var(--surface-overlay);
    border: 1px solid var(--line-soft);
    border-radius: 12px;
    padding: 13px;
  }
  .tile .k {
    font-size: 12px;
    color: var(--fg-faint);
  }
  .tile .v {
    font-size: 23px;
    font-weight: 800;
    margin-top: 3px;
    color: var(--fg);
  }
  .tile .v.err {
    color: var(--color-red-600);
  }
  .tile .v small {
    font-size: 13px;
    color: var(--fg-faint);
    font-weight: 500;
  }
  .spark {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 34px;
    margin-top: 9px;
  }
  .spark i {
    flex: 1;
    border-radius: 2px 2px 0 0;
    background: var(--brand);
    opacity: 0.5;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    background: color-mix(in srgb, var(--surface) 52%, transparent);
    backdrop-filter: blur(7px) saturate(0.7);
    transition:
      opacity 0.5s,
      backdrop-filter 0.5s;
    cursor: pointer;
    z-index: 8;
  }
  .frame.revealed .overlay {
    opacity: 0;
    pointer-events: none;
    backdrop-filter: blur(0);
  }
  .play {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--brand);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 11px color-mix(in srgb, var(--brand) 22%, transparent);
  }
  .play::after {
    content: '';
    border-left: 18px solid #fff;
    border-top: 11px solid transparent;
    border-bottom: 11px solid transparent;
    margin-left: 5px;
  }
  .ohint {
    font-size: 15px;
    font-weight: 600;
    color: var(--fg);
  }
  .osmall {
    font-size: 12.5px;
    color: var(--fg-muted);
  }
  .livedot {
    position: absolute;
    top: 16px;
    right: 18px;
    z-index: 9;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--color-green-600);
    opacity: 0;
    transition: opacity 0.4s;
  }
  .frame.revealed .livedot {
    opacity: 1;
  }
  .livedot .b {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-green-600);
    animation: blink 1.4s infinite;
  }
  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  .hot {
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--brand);
    border: 2px solid #fff;
    cursor: pointer;
    z-index: 7;
    opacity: 0;
    transition: opacity 0.4s;
    transform: translate(-50%, -50%);
    padding: 0;
  }
  .frame.revealed .hot {
    opacity: 1;
  }
  .hot::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    background: var(--brand);
    opacity: 0.4;
    animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
    z-index: -1;
  }
  @keyframes ping {
    0% {
      transform: scale(1);
      opacity: 0.5;
    }
    80%,
    100% {
      transform: scale(2.4);
      opacity: 0;
    }
  }
  .pop {
    position: absolute;
    width: 248px;
    background: var(--surface-raised);
    border: 1px solid color-mix(in srgb, var(--brand) 45%, transparent);
    border-radius: 13px;
    padding: 13px 14px;
    z-index: 10;
    box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.7);
    opacity: 0;
    transform: translateY(6px) scale(0.96);
    pointer-events: none;
    transition:
      opacity 0.22s,
      transform 0.22s;
    transform-origin: left top;
    text-align: left;
  }
  .pop.show {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
  .pop h4 {
    font-size: 13.5px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--fg);
  }
  .pop h4 .tag {
    font-size: 10px;
    font-weight: 700;
    color: var(--brand-soft);
    background: color-mix(in srgb, var(--brand) 16%, transparent);
    padding: 2px 7px;
    border-radius: 6px;
    text-transform: uppercase;
  }
  .pop p {
    font-size: 12px;
    color: var(--fg-muted);
    line-height: 1.5;
  }
</style>
