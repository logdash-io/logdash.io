<script lang="ts">
  import ToolField from './ToolField.svelte';
  import ToolPanel from './ToolPanel.svelte';
  import { formatMoney, parseAmount } from './uptime';

  const errorId = $props.id();

  let revenue = $state('500');
  let minutes = $state('90');
  let people = $state('2');
  let rate = $state('75');

  const revenuePerHour = $derived(parseAmount(revenue));
  const downtimeMinutes = $derived(parseAmount(minutes));
  const staff = $derived(optionalAmount(people));
  const staffRate = $derived(optionalAmount(rate));
  const valid = $derived(
    revenuePerHour !== null &&
      downtimeMinutes !== null &&
      staff !== null &&
      staffRate !== null,
  );
  const hours = $derived((downtimeMinutes ?? 0) / 60);
  const describedby = $derived(valid ? undefined : errorId);
  const lostRevenue = $derived((revenuePerHour ?? 0) * hours);
  const staffCost = $derived((staff ?? 0) * (staffRate ?? 0) * hours);

  function formatHours(value: number): string {
    return `${Number(value.toFixed(2))}h`;
  }

  function optionalAmount(input: string): number | null {
    return input.trim() ? parseAmount(input) : 0;
  }
</script>

<ToolPanel label="Downtime cost calculator">
  {#snippet controls()}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ToolField
        label="Revenue per hour"
        bind:value={revenue}
        prefix="$"
        inputmode="decimal"
        invalid={revenuePerHour === null}
        {describedby}
      />
      <ToolField
        label="Downtime in minutes"
        bind:value={minutes}
        inputmode="decimal"
        invalid={downtimeMinutes === null}
        {describedby}
      />
      <ToolField
        label="People fixing it (optional)"
        bind:value={people}
        inputmode="numeric"
        invalid={staff === null}
        {describedby}
      />
      <ToolField
        label="Cost per person-hour (optional)"
        bind:value={rate}
        prefix="$"
        inputmode="decimal"
        invalid={staffRate === null}
        {describedby}
      />
    </div>
  {/snippet}

  {#if !valid}
    <p id={errorId} role="status" class="text-error text-sm">
      Use plain numbers, like 500 or 1,250.50.
    </p>
  {:else}
    <p role="status" class="text-fg-tertiary text-[15px] leading-7">
      Cost of this outage:
      <strong class="text-fg-default font-medium">
        {formatMoney(lostRevenue + staffCost)}
      </strong>
    </p>
    <table class="w-full text-sm">
      <thead>
        <tr class="border-surface-root-border border-b">
          <th class="text-fg-muted pb-2.5 text-left font-medium">Cost</th>
          <th class="text-fg-muted pb-2.5 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody class="divide-surface-root-border divide-y">
        <tr>
          <td class="text-fg-tertiary py-2.5">
            Lost revenue
            <span class="text-fg-faint tabular-nums">
              {formatMoney(revenuePerHour ?? 0)}/h × {formatHours(hours)}
            </span>
          </td>
          <td class="text-fg-default py-2.5 text-right tabular-nums">
            {formatMoney(lostRevenue)}
          </td>
        </tr>
        <tr>
          <td class="text-fg-tertiary py-2.5">
            Staff time
            <span class="text-fg-faint tabular-nums">
              {staff} × {formatMoney(staffRate ?? 0)}/h × {formatHours(hours)}
            </span>
          </td>
          <td class="text-fg-default py-2.5 text-right tabular-nums">
            {formatMoney(staffCost)}
          </td>
        </tr>
      </tbody>
    </table>
  {/if}
</ToolPanel>
