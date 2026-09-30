<script lang="ts">
  import type { StatusPage } from "@logdash/status";
  import type { ClassValue } from "svelte/elements";
  import {
    DashboardFooter,
    MonitorCard,
    SystemStatusHeader,
  } from "./components";

  interface Props {
    page: StatusPage;
    lastUpdated?: Date | null;
    isRefreshing?: boolean;
    withBranding?: boolean;
    class?: ClassValue;
  }

  let {
    page,
    lastUpdated = null,
    isRefreshing = false,
    withBranding = true,
    class: className,
  }: Props = $props();

  const COLUMN =
    "border-hairline mx-auto w-full max-w-3xl px-5 @xl:px-10 @min-[52rem]:border-x";

  const updatedAt = $derived(lastUpdated ?? new Date(page.updatedAt));
</script>

<div class={["@container flex flex-col", className]} aria-busy={isRefreshing}>
  <header class="border-hairline border-b">
    <div class={[COLUMN, "pt-16 pb-12 @xl:pt-24 @xl:pb-16"]}>
      <SystemStatusHeader name={page.name} status={page.status} {updatedAt} />
    </div>
  </header>

  {#each page.monitors as monitor (monitor.id)}
    <section class="border-hairline border-b">
      <div class={[COLUMN, "py-10 @xl:py-12"]}>
        <MonitorCard {monitor} />
      </div>
    </section>
  {:else}
    <section class="border-hairline border-b">
      <p class={[COLUMN, "text-neutral-500 py-10 text-sm"]}>
        No monitors on this page yet.
      </p>
    </section>
  {/each}

  {#if withBranding}
    <footer class="flex flex-1 flex-col">
      <div class={[COLUMN, "flex-1 py-8"]}>
        <DashboardFooter />
      </div>
    </footer>
  {/if}
</div>
