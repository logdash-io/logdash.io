<script lang="ts">
  import LogRowTime from './LogRowTime.svelte';

  type Props = {
    index: number;
    date: Date;
    level: string;
    message: string;
    prefix?: 'full' | 'short';
  };

  const { date: rawDate, level, message }: Props = $props();

  function isJsonString(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }

  function formatMessage(msg: string): { isJson: boolean; content: string } {
    const trimmed = msg.trim();

    if (isJsonString(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          isJson: true,
          content: JSON.stringify(parsed, null, 2),
        };
      } catch {
        return { isJson: false, content: msg };
      }
    }

    return { isJson: false, content: msg };
  }

  const formattedMessage = $derived(formatMessage(message));
</script>

{#snippet logDot()}
  <div
    class={[
      'mt-2.5 inline-block h-2 w-2 shrink-0 rounded-full align-middle',
      {
        'bg-[#155dfc]': level === 'info',
        'bg-[#fe9a00]': level === 'warning',
        'bg-[#e7000b]': level === 'error',
        'bg-[#00a6a6]': level === 'http',
        'bg-[#00a600]': level === 'verbose' || level === 'debug',
        'bg-[#505050]': level === 'silly',
      },
    ]}
  ></div>
{/snippet}

<div
  class={[
    'bg-base-300 selection:bg-secondary/20 flex min-h-7 items-start gap-2.5 overflow-hidden px-4 font-mono text-sm leading-7',
    {
      'hover:bg-base-100/50': level !== 'error' && level !== 'warning',
      'bg-warning/20 text-warning-content': level === 'warning',
      'bg-error/20 text-error-content': level === 'error',
    },
  ]}
>
  {@render logDot()}

  <div class="flex min-w-0 flex-1 flex-row gap-4">
    <LogRowTime date={rawDate} {level} />

    <div class="w-0 min-w-0 flex-1 overflow-hidden">
      {#if formattedMessage.isJson}
        <pre
          class="bg-base-200 text-syntax-json overflow-x-auto rounded-md p-2 text-xs whitespace-pre">{formattedMessage.content}</pre>
      {:else}
        <details class="collapse">
          <summary
            class="collapse-title min-h-0 cursor-pointer overflow-hidden p-0"
          >
            <span
              class="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {formattedMessage.content}
            </span>
          </summary>
          <div class="collapse-content p-0 pt-2">
            <span class="block break-words whitespace-pre-wrap">
              {formattedMessage.content}
            </span>
          </div>
        </details>
      {/if}
    </div>
  </div>
</div>
