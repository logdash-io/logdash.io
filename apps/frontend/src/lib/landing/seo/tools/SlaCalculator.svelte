<script lang="ts">
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import DowntimeTable from './DowntimeTable.svelte';
  import ToolField from './ToolField.svelte';
  import ToolPanel from './ToolPanel.svelte';
  import { compositePercent, formatPercent, parsePercent } from './uptime';

  type Dependency = { id: number; name: string; sla: string };

  const MAX_DEPENDENCIES = 8;

  const errorId = $props.id();

  let nextId = 3;
  let dependencies = $state<Dependency[]>([
    { id: 0, name: 'Hosting', sla: '99.95' },
    { id: 1, name: 'Database', sla: '99.99' },
    { id: 2, name: 'Payments API', sla: '99.9' },
  ]);

  const percents = $derived(
    dependencies.map((dependency) => parsePercent(dependency.sla)),
  );
  const values = $derived(
    percents.filter((percent): percent is number => percent !== null),
  );
  const composite = $derived(
    values.length === percents.length ? compositePercent(values) : null,
  );

  function onAdd(): void {
    dependencies.push({ id: nextId++, name: '', sla: '99.9' });
  }

  function onRemove(id: number): void {
    dependencies = dependencies.filter((dependency) => dependency.id !== id);
  }
</script>

<ToolPanel label="SLA calculator">
  {#snippet controls()}
    <div class="flex flex-col gap-2">
      <div
        aria-hidden="true"
        class="text-neutral-400 flex gap-2 pr-12 text-[13px]"
      >
        <span class="flex-1">Dependency</span>
        <span class="w-28 shrink-0">SLA</span>
      </div>
      {#each dependencies as dependency, index (dependency.id)}
        <div class="flex items-center gap-2">
          <ToolField
            label="Dependency {index + 1}"
            hideLabel
            bind:value={dependency.name}
            placeholder="Name"
            class="flex-1"
          />
          <ToolField
            label="Dependency {index + 1} SLA"
            hideLabel
            bind:value={dependency.sla}
            suffix="%"
            inputmode="decimal"
            invalid={percents[index] === null}
            describedby={percents[index] === null ? errorId : undefined}
            class="w-28 shrink-0"
          />
          <button
            type="button"
            aria-label="Remove dependency {index + 1}"
            disabled={dependencies.length === 1}
            onclick={() => onRemove(dependency.id)}
            class="text-neutral-500 hover:text-fg-default disabled:text-neutral-700 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-ink duration-150 outline-none focus-visible:shadow-(--focus-ring) disabled:cursor-default motion-reduce:transition-none"
          >
            <CloseIcon class="size-4" />
          </button>
        </div>
      {/each}
    </div>
    {#if dependencies.length < MAX_DEPENDENCIES}
      <button
        type="button"
        onclick={onAdd}
        class="text-neutral-400 hover:text-fg-default flex w-fit cursor-pointer items-center gap-1.5 rounded-md text-[13px] font-medium transition-ink duration-150 outline-none focus-visible:shadow-(--focus-ring) motion-reduce:transition-none"
      >
        <PlusIcon class="size-3.5" />
        Add dependency
      </button>
    {/if}
  {/snippet}

  {#if composite === null}
    <p id={errorId} role="status" class="text-error text-sm">
      Every SLA must be a percentage from 0 to 100, like 99.95.
    </p>
  {:else}
    <div class="flex flex-col gap-1">
      <p role="status" class="text-neutral-400 text-[15px] leading-7">
        Composite SLA:
        <strong class="text-fg-default font-medium">
          {formatPercent(composite)}
        </strong>
      </p>
      <p class="text-neutral-500 font-mono text-[13px]">
        {values.map(formatPercent).join(' × ')} = {formatPercent(composite)}
      </p>
    </div>
    <DowntimeTable percent={composite} />
  {/if}
</ToolPanel>
