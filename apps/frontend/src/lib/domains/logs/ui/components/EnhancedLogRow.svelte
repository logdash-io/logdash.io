<script lang="ts">
  import { DateTime } from 'luxon';

  type Props = {
    index: number;
    date: Date;
    level: string;
    message: string;
    prefix?: 'full' | 'short';
  };

  const {
    date: rawDate,
    index,
    level,
    message,
    prefix = 'full',
  }: Props = $props();
  const [left, right] = DateTime.fromJSDate(new Date(rawDate))
    .toLocal()
    .toISO({ includeOffset: true })
    .split('T');

  const [date, time] = $derived([left, right.split('.')[0]]);

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

<div
  class={[
    'flex h-7 items-start gap-2.5 px-4 font-mono text-sm leading-7',
    {
      'hover:bg-base-100/50': level !== 'error' && level !== 'warning',
      'bg-warning/20 text-warning-content': level === 'warning',
      'bg-error/20 text-error-content': level === 'error',
    },
  ]}
>
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

  <div class="flex min-w-0 flex-1 flex-col-reverse sm:flex-row sm:gap-2">
    <span class="shrink-0 text-xs leading-7 whitespace-nowrap sm:text-sm">
      [{#if prefix === 'full'}{date} {time}{:else}{time}{/if}]
    </span>

    <div class="min-w-0 flex-1">
      {#if formattedMessage.isJson}
        <pre
          class="bg-base-200 font-jetbrains text-syntax-json overflow-x-auto rounded-md p-2 text-xs whitespace-pre">{formattedMessage.content}</pre>
      {:else}
        <span class="font-jetbrains break-all">
          {formattedMessage.content}
        </span>
      {/if}
    </div>
  </div>
</div>
