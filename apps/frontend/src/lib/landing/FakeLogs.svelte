<script lang="ts">
  import LogRow from '$lib/landing/LogRow.svelte';
  import { FAKE_LOGS } from './data/logs.mock';
</script>

<div
  class="ld-card-base flex h-full min-h-64 w-full flex-col gap-4 rounded-2xl p-5 sm:p-6"
>
  <div class="flex flex-col gap-1">
    <span
      class="text-base-content/40 text-[11px] font-semibold tracking-[0.14em] uppercase"
    >
      Live tail
    </span>
    <h3 class="text-lg font-semibold">Recent logs</h3>
  </div>

  <div class="flex flex-1 flex-col justify-center gap-2">
    {#each FAKE_LOGS.slice(0, 6) as log (log.id)}
      <LogRow
        prefix="short"
        date={new Date(log.timestamp)}
        level={log.level}
        message={log.message}
      />
    {/each}
  </div>
</div>
