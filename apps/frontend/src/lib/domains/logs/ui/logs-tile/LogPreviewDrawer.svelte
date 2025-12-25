<script lang="ts">
  import { logPreviewState } from '../../application/log-preview.state.svelte.js';
  import { LOG_LEVELS_MAP } from '../../domain/log-level-metadata.js';
  import type { LogLevel } from '../../domain/log-level.js';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import { DateTime } from 'luxon';
  import { fly, fade } from 'svelte/transition';

  const log = $derived(logPreviewState.selectedLog);

  const formattedDate = $derived.by(() => {
    if (!log) return '';
    return DateTime.fromJSDate(new Date(log.createdAt))
      .toLocal()
      .toFormat('yyyy-MM-dd HH:mm:ss.SSS');
  });

  const formattedMessage = $derived.by(() => {
    if (!log) return { isJson: false, content: '' };

    const trimmed = log.message.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          isJson: true,
          content: JSON.stringify(parsed, null, 2),
        };
      }
    } catch {}

    return { isJson: false, content: log.message };
  });

  const levelColor = $derived(
    LOG_LEVELS_MAP[log?.level as LogLevel]?.color ?? 'bg-[#155dfc]',
  );

  const levelLabel = $derived(
    LOG_LEVELS_MAP[log?.level as LogLevel]?.label ?? log?.level,
  );

  const sameTypeCount = $derived(logPreviewState.sameTypeLogsCount);
  const currentPosition = $derived(logPreviewState.currentIndexInSameType + 1);

  function onClose(): void {
    logPreviewState.close();
  }

  function onBackdropClick(): void {
    logPreviewState.close();
  }

  function onPrev(): void {
    logPreviewState.goToPrevSameType();
  }

  function onNext(): void {
    logPreviewState.goToNextSameType();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!logPreviewState.isOpen) return;

    if (e.key === 'Escape') {
      logPreviewState.close();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      logPreviewState.goToPrevSameType();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      logPreviewState.goToNextSameType();
    }
  }
</script>

<svelte:window onkeydown={onKeyDown} />

{#if logPreviewState.isOpen && log}
  <button
    class="absolute inset-0 z-10 bg-gradient-to-t from-base-300/80 via-95% via-base-300/80 to-base-200"
    onclick={onBackdropClick}
    transition:fade={{ duration: 150 }}
    aria-label="Close preview"
  ></button>

  <div
    class="absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col rounded-t-3xl border-t border-base-100 bg-base-200"
    transition:fly={{ y: 200, duration: 200 }}
  >
    <div
      class="flex shrink-0 items-center justify-between border-b border-base-content/10 px-5 py-3"
    >
      <div
        class="flex flex-col md:flex-row md:items-center items-start md:gap-3"
      >
        <span class="fcc gap-1.5 md:gap-3">
          <div
            class={['size-2 md:size-2.5 rounded-full shrink-0', levelColor]}
          ></div>
          <span class="font-mono text-xs uppercase opacity-60">
            {log.level}
          </span>
          {#if log.namespace}
            <span class="rounded bg-base-300 px-1.5 py-0.5 text-xs">
              {log.namespace}
            </span>
          {/if}
        </span>
        <span class="font-mono text-xs opacity-40">{formattedDate}</span>
      </div>

      <div
        class="flex items-center gap-0.5 rounded-lg bg-base-300 p-0.5 mr-auto ml-2 border border-base-100"
      >
        <button
          class="btn btn-ghost btn-xs btn-circle"
          onclick={onPrev}
          disabled={!logPreviewState.hasPrevSameType}
          aria-label="Previous {levelLabel}"
        >
          <ChevronRightIcon class="size-4 rotate-180" />
        </button>

        <span class="px-2 font-mono text-xs opacity-60 hidden md:block">
          {currentPosition}/{sameTypeCount}
        </span>

        <button
          class="btn btn-ghost btn-xs btn-circle"
          onclick={onNext}
          disabled={!logPreviewState.hasNextSameType}
          aria-label="Next {levelLabel}"
        >
          <ChevronRightIcon class="size-4" />
        </button>
      </div>

      <div class="flex items-center gap-1">
        <button
          class="btn btn-ghost btn-xs btn-circle"
          onclick={onClose}
          aria-label="Close"
        >
          <CloseIcon class="size-5" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      {#if formattedMessage.isJson}
        <pre
          class="overflow-x-auto rounded-lg bg-base-300 p-4 font-mono text-xs">{formattedMessage.content}</pre>
      {:else}
        <p class="whitespace-pre-wrap break-words font-mono text-sm">
          {formattedMessage.content}
        </p>
      {/if}
    </div>
  </div>
{/if}
