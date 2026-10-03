<script lang="ts">
  import { untrack } from 'svelte';
  import {
    convertFields,
    DIALECTS,
    evaluate,
    fieldSpec,
    formatExpression,
    parseExpression,
    type CronDialect,
    type CronFieldKey,
    type CronFields,
  } from './cron';
  import CopyButton from './CopyButton.svelte';
  import ToolChoice from './ToolChoice.svelte';
  import ToolField from './ToolField.svelte';
  import ToolPanel from './ToolPanel.svelte';

  type Props = {
    dialect?: CronDialect;
  };

  const { dialect: initialDialect = 'standard' }: Props = $props();

  const DIALECT_NAMES: Record<CronDialect, string> = {
    standard: 'standard 5-field cron',
    seconds: '6-field cron with seconds',
    quartz: 'Quartz cron',
    aws: 'AWS EventBridge cron',
  };

  const GRID_COLUMNS: Record<number, string> = {
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
    7: 'sm:grid-cols-7',
  };

  const options = (Object.keys(DIALECTS) as CronDialect[]).map((value) => ({
    value,
    label: DIALECTS[value].label,
  }));

  const errorId = $props.id();

  let dialect = $state(untrack(() => initialDialect));
  let fields = $state<CronFields>(
    untrack(() => ({ ...DIALECTS[initialDialect].defaults })),
  );
  let expression = $state(
    untrack(() => formatExpression(dialect, DIALECTS[dialect].defaults)),
  );
  let parseError = $state<string | null>(null);

  const result = $derived(evaluate(dialect, fields));
  const invalidFields = $derived(
    new Set(result.ok ? [] : result.errors.map((error) => error.field)),
  );
  const keys = $derived(DIALECTS[dialect].fields);

  function onDialect(next: CronDialect): void {
    fields = convertFields(dialect, next, fields);
    dialect = next;
    expression = formatExpression(next, fields);
    parseError = null;
  }

  function onExpression(next: string): void {
    expression = next;

    const parsed = parseExpression(dialect, next);

    if (!parsed.ok) {
      parseError = parsed.message;
      return;
    }

    parseError = null;
    fields = parsed.fields;
  }

  function onField(key: CronFieldKey, value: string): void {
    fields[key] = value;
    expression = formatExpression(dialect, fields);
    parseError = null;
  }
</script>

<ToolPanel label="Cron expression generator">
  {#snippet controls()}
    <ToolChoice
      legend="Syntax"
      {options}
      bind:value={() => dialect, onDialect}
    />

    <div class="flex items-end gap-2">
      <ToolField
        label="Expression"
        bind:value={() => expression, onExpression}
        mono
        invalid={parseError !== null}
        describedby={parseError ? errorId : undefined}
        class="flex-1"
      />
      <CopyButton
        text={result.expression}
        label="Copy expression"
        class="size-10 rounded-lg"
      />
    </div>

    <div class={['grid grid-cols-3 gap-3', GRID_COLUMNS[keys.length]]}>
      {#each keys as key (key)}
        {@const spec = fieldSpec(dialect, key)}
        <ToolField
          label={spec.label}
          bind:value={
            () => fields[key] ?? '', (value: string) => onField(key, value)
          }
          hint="{spec.min}-{spec.max}"
          mono
          invalid={invalidFields.has(key)}
          describedby={invalidFields.has(key) ? errorId : undefined}
        />
      {/each}
    </div>
  {/snippet}

  {#if parseError}
    <p id={errorId} role="status" class="text-error text-sm">{parseError}</p>
  {:else if !result.ok}
    <ul
      id={errorId}
      role="status"
      class="text-error flex flex-col gap-1 text-sm"
    >
      {#each result.errors as error (error.message)}
        <li>{error.message}</li>
      {/each}
    </ul>
  {:else}
    <div role="status" class="flex flex-col gap-1.5">
      <p class="text-fg-default text-lg font-medium tracking-[-0.01em]">
        {result.meaning}
      </p>
      <p class="text-neutral-500 text-sm">
        <code class="text-neutral-300 font-mono">{result.expression}</code>
        in {DIALECT_NAMES[dialect]}
      </p>
    </div>
  {/if}
</ToolPanel>
