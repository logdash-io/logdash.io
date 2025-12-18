<script lang="ts">
  import StatusHistoryBar from "./StatusHistoryBar.svelte";

  interface Ping {
    createdAt: string;
    statusCode: number;
    responseTimeMs: number;
  }

  interface Props {
    class?: string;
    pings: Ping[];
    maxPingsToShow?: number;
  }

  let { pings, maxPingsToShow = 90, class: className }: Props = $props();

  const displayPings = $derived(pings?.slice(-maxPingsToShow) || []);
  const pingsCount = $derived(displayPings.length);
</script>

<div class={["w-full space-y-2 overflow-hidden", className]}>
  <StatusHistoryBar pings={displayPings} height={6} />

  <div
    class="text-secondary/60 flex items-center justify-between font-mono text-xs"
  >
    <span>
      {pingsCount} pings ago
    </span>
    <span>Now</span>
  </div>
</div>
