<script lang="ts">
  import { SearchIcon } from 'lucide-svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fly, slide } from 'svelte/transition';

  type Level = 'info' | 'http' | 'debug' | 'warning' | 'error';

  type Line = { namespace: string; level: Level; message: string };

  type Row = Line & { key: number; at: number };

  const QUERY = 'checkout';
  const LINES = (
    [
      ['api', 'http', 'GET /api/projects 200 in 18 ms'],
      ['api', 'http', 'POST /api/checkout 201 in 342 ms'],
      ['worker', 'info', 'Receipt sent for order #4821'],
      ['api', 'http', 'GET /api/users/me 200 in 41 ms'],
      ['cron', 'info', 'billing-reconcile finished in 1.2 s'],
      ['worker', 'info', 'Webhook checkout.session.completed handled'],
      ['api', 'warning', 'Slow query on orders took 812 ms'],
      ['api', 'http', 'POST /api/checkout 201 in 298 ms'],
      ['worker', 'warning', 'Email delivery retry 2 of 5'],
      ['api', 'http', 'GET /health 200 in 3 ms'],
      ['cron', 'info', 'Nightly backup uploaded, 2.3 GB'],
      ['api', 'http', 'PATCH /api/projects/42 200 in 91 ms'],
      ['worker', 'info', 'Invoice INV-2041 generated'],
      ['api', 'http', 'POST /api/checkout 201 in 371 ms'],
      ['api', 'debug', 'Cache hit ratio 94% over 5 min'],
    ] satisfies [string, Level, string][]
  ).map(([namespace, level, message]): Line => ({ namespace, level, message }));
  const FAILURE: Line = {
    namespace: 'api',
    level: 'error',
    message: 'Checkout failed: payment gateway timed out',
  };
  const FAILURE_DETAIL: [string, string][] = [
    ['route', 'POST /api/checkout'],
    ['status', '502'],
    ['upstream', 'payments-gateway:8443'],
    ['error', 'ETIMEDOUT after 10000 ms'],
    ['requestId', 'req_7Hq2fK'],
  ];
  const SEEDED_ROWS = 24;
  const KEPT_ROWS = 40;
  const ARRIVALS_PER_LOOP = 4;
  const ARRIVAL_MS = 1_400;
  const TYPE_MS = 110;
  const ERASE_MS = 40;
  const OPEN_HOLD_MS = 4_500;

  let rows = $state<Row[]>(seedRows());
  let query = $state('');
  let filter = $state('');
  let searching = $state(false);
  let openedKey = $state<number | null>(null);
  let linesLastHour = $state(48_213);
  let errorsLastHour = $state(2);
  let cursor = SEEDED_ROWS;

  const shown = $derived(
    filter ? rows.filter((row) => matchStart(row.message) !== -1) : rows,
  );
  const duration = $derived(prefersReducedMotion.current ? 0 : 400);

  $effect(() => {
    let cancelled = false;

    const wait = async (ms: number): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, ms));

      if (cancelled) {
        throw new Error('cancelled');
      }
    };

    const play = async (): Promise<void> => {
      try {
        await loop();
      } catch {
        return;
      }
    };

    const loop = async (): Promise<void> => {
      for (;;) {
        for (let arrival = 0; arrival < ARRIVALS_PER_LOOP; arrival += 1) {
          await wait(ARRIVAL_MS);
          arrive(LINES[cursor % LINES.length]);
        }

        await wait(ARRIVAL_MS);
        const failure = arrive(FAILURE);
        errorsLastHour += 1;

        await wait(1_200);
        searching = true;

        for (const character of QUERY) {
          await wait(TYPE_MS);
          query += character;
        }

        await wait(300);
        filter = query;

        await wait(900);
        openedKey = failure.key;

        await wait(OPEN_HOLD_MS);
        openedKey = null;

        await wait(400);

        while (query) {
          await wait(ERASE_MS);
          query = query.slice(0, -1);
        }

        filter = '';
        searching = false;
      }
    };

    void play();

    return () => {
      cancelled = true;
    };
  });

  function seedRows(): Row[] {
    const now = Date.now();

    return Array.from({ length: SEEDED_ROWS }, (_, index) => ({
      ...LINES[(SEEDED_ROWS - 1 - index) % LINES.length],
      key: SEEDED_ROWS - 1 - index,
      at: now - (index * 3 + 2) * 1_000,
    }));
  }

  function arrive(line: Line): Row {
    const row = { ...line, key: cursor, at: Date.now() };

    cursor += 1;
    rows = [row, ...rows.slice(0, KEPT_ROWS - 1)];
    linesLastHour += 18 + Math.round(Math.random() * 24);

    return row;
  }

  function matchStart(message: string): number {
    return message.toLowerCase().indexOf(filter.toLowerCase());
  }

  function toTime(at: number): string {
    return new Date(at).toLocaleTimeString('en-GB');
  }
</script>

<div class="flex h-full w-full flex-col">
  <div
    class="border-hairline flex h-11 shrink-0 items-center gap-3 border-b px-4 text-sm"
  >
    <SearchIcon class="text-neutral-600 size-3.5 shrink-0" />

    <span class="flex min-w-0 items-center">
      {#if query}
        <span class="text-base-content">{query}</span>
      {:else if !searching}
        <span class="text-neutral-500">Search logs</span>
      {/if}

      {#if searching}
        <span class="bg-base-content ml-px h-4 w-px animate-pulse"></span>
      {/if}
    </span>

    <span
      class="text-neutral-400 ml-auto flex shrink-0 items-center gap-1.5 text-xs"
    >
      <span class="bg-success size-1.5 rounded-full"></span>
      Live
    </span>
  </div>

  <div class="flex min-h-0 flex-1 flex-col gap-5 p-5">
    <div class="flex gap-x-10 sm:gap-x-14">
      <div class="flex flex-col gap-0.5">
        <span class="text-neutral-500 text-xs">Last hour</span>
        <span class="text-2xl font-medium tabular-nums">
          {linesLastHour.toLocaleString('en-US')} lines
        </span>
      </div>

      <div class="flex flex-col gap-0.5">
        <span class="text-neutral-500 text-xs">Errors</span>
        <span class="text-2xl font-medium tabular-nums">{errorsLastHour}</span>
      </div>
    </div>

    <div
      class="-mx-2 min-h-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
      aria-hidden="true"
    >
      {#each shown as row (row.key)}
        <div
          class="py-1"
          animate:flip={{ duration, easing: quintOut }}
          in:fly={{ y: -6, duration, easing: quintOut }}
        >
          {@render logRow(row)}

          {#if row.key === openedKey}
            <div
              class="mt-2 mb-1 flex gap-3 px-2"
              transition:slide={{ duration, easing: quintOut }}
            >
              {@render columnSpacers()}
              <div
                class="ring-hairline bg-base-300 flex min-w-0 flex-1 flex-col gap-1 rounded-md px-3 py-2.5 font-mono text-xs ring-1"
              >
                {#each FAILURE_DETAIL as [key, value] (key)}
                  <div class="flex gap-3">
                    <span class="text-neutral-500 w-20 shrink-0">{key}</span>
                    <span class="text-neutral-300 truncate">{value}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

{#snippet logRow(row: Row)}
  <div
    class={[
      'flex items-center gap-3 rounded-md px-2 py-0.5 font-mono text-[13px]',
      { 'bg-base-100': row.key === openedKey },
    ]}
  >
    <span class="text-neutral-600 w-16 shrink-0 tabular-nums max-sm:hidden">
      {toTime(row.at)}
    </span>
    <span
      class={[
        'size-1.5 shrink-0 rounded-full',
        {
          'bg-error': row.level === 'error',
          'bg-warning': row.level === 'warning',
          'bg-neutral-600': row.level !== 'error' && row.level !== 'warning',
        },
      ]}
    ></span>
    <span class="text-neutral-500 w-12 shrink-0">{row.namespace}</span>
    <span class="text-neutral-200 flex min-w-0">
      {@render highlighted(row.message)}
    </span>
  </div>
{/snippet}

{#snippet highlighted(message: string)}
  {@const start = filter ? matchStart(message) : -1}

  {#if start === -1}
    <span class="truncate">{message}</span>
  {:else}
    <span class="flex min-w-0 whitespace-pre">
      <span class="shrink-0">{message.slice(0, start)}</span>
      <mark class="bg-neutral-700 text-base-content shrink-0 rounded-[2px]">
        {message.slice(start, start + filter.length)}
      </mark>
      <span class="min-w-0 overflow-hidden text-ellipsis">
        {message.slice(start + filter.length)}
      </span>
    </span>
  {/if}
{/snippet}

{#snippet columnSpacers()}
  <span class="w-16 shrink-0 max-sm:hidden"></span>
  <span class="w-1.5 shrink-0 max-sm:hidden"></span>
  <span class="w-12 shrink-0 max-sm:hidden"></span>
{/snippet}
