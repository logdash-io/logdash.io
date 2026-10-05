<script lang="ts">
  import type { StatusPage } from "@logdash/status";
  import { onMount } from "svelte";
  import { formatAge } from "../utils/format-status-page";

  interface Props {
    name: string;
    status: StatusPage["status"];
    updatedAt: Date;
  }

  let { name, status, updatedAt }: Props = $props();

  const statuses: Record<StatusPage["status"], { label: string; dot: string }> =
    {
      operational: { label: "All systems operational", dot: "bg-success" },
      degraded: { label: "Partial outage", dot: "bg-warning" },
      outage: { label: "Major outage", dot: "bg-error" },
      unknown: { label: "Status unknown", dot: "bg-idle" },
    };

  let now = $state<Date | null>(null);

  const headline = $derived(statuses[status]);

  onMount(() => {
    now = new Date();
    const timer = setInterval(() => (now = new Date()), 1000);

    return () => clearInterval(timer);
  });
</script>

<h1 class="text-fg-tertiary text-base break-words">{name}</h1>

<p
  class="mt-3 flex items-start gap-3 text-3xl leading-[1.15] font-medium tracking-[-0.03em] text-balance @xl:text-4xl"
>
  <span class="flex h-[1.15em] shrink-0 items-center">
    <span class={["size-2.5 rounded-full", headline.dot]}></span>
  </span>
  {headline.label}
</p>

<p class="text-fg-muted mt-4 text-sm tabular-nums">
  {now ? `Updated ${formatAge(updatedAt, now)}` : "\u00a0"}
</p>
