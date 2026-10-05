<script lang="ts">
  import { logPreviewState } from '../../application/log-preview.state.svelte.js';
  import { LOG_LEVELS_MAP } from '../../domain/log-level-metadata.js';
  import type { LogLevel } from '../../domain/log-level.js';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
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

    const prettyJson = prettyPrintJsonObject(log.message.trim());
    if (prettyJson === null) return { isJson: false, content: log.message };

    return { isJson: true, content: prettyJson };
  });

  function prettyPrintJsonObject(raw: string): string | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return null;
    }
  }

  const levelColor = $derived(
    LOG_LEVELS_MAP[log?.level as LogLevel]?.color ?? 'bg-idle',
  );

  const levelLabel = $derived(
    LOG_LEVELS_MAP[log?.level as LogLevel]?.label ?? log?.level,
  );

  const sameTypeCount = $derived(logPreviewState.sameTypeLogsCount);
  const currentPosition = $derived(logPreviewState.currentIndexInSameType + 1);
  const isNamespaceLocked = $derived(
    logPreviewState.lockedNamespace === log?.namespace && log?.namespace,
  );

  function onClose(): void {
    logPreviewState.close();
  }

  function onNamespaceClick(): void {
    logPreviewState.toggleNamespaceLock();
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
    if (!logPreviewState.isOpen || e.defaultPrevented) return;

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
    class="from-surface-50-bg/80 via-surface-50-bg/80 to-surface-elevated-bg absolute inset-0 z-10 bg-gradient-to-t via-95%"
    onclick={onBackdropClick}
    transition:fade={{ duration: 150 }}
    aria-label="Close preview"
  ></button>

  <div
    class="bg-surface-elevated-bg absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col edge-t"
    transition:fly={{ y: 200, duration: 200 }}
  >
    <div class="flex h-12 shrink-0 items-center gap-3 edge-b px-4">
      <span class="flex min-w-0 items-center gap-2 text-xs">
        <span class={['size-2 shrink-0 rounded-full', levelColor]}></span>
        <span class="text-fg-tertiary">{levelLabel}</span>
      </span>

      {#if log.namespace}
        <button
          type="button"
          class={[
            'hover:text-fg-default transition-ink flex h-6 min-w-0 cursor-pointer items-center rounded-full px-2 text-[13px] edge',
            isNamespaceLocked
              ? 'bg-surface-150-bg text-fg-default'
              : 'text-fg-tertiary',
          ]}
          aria-pressed={Boolean(isNamespaceLocked)}
          onclick={onNamespaceClick}
        >
          <span class="truncate">{log.namespace}</span>
        </button>
      {/if}

      <div class="ml-auto flex shrink-0 items-center gap-1">
        <IconButton
          label="Previous {levelLabel}"
          disabled={!logPreviewState.hasPrevSameType}
          onclick={onPrev}
        >
          <ChevronRightIcon class="size-4 rotate-180" />
        </IconButton>

        <span class="text-fg-muted font-mono text-xs tabular-nums">
          {currentPosition}/{sameTypeCount}
        </span>

        <IconButton
          label="Next {levelLabel}"
          disabled={!logPreviewState.hasNextSameType}
          onclick={onNext}
        >
          <ChevronRightIcon class="size-4" />
        </IconButton>

        <span class="bg-surface-elevated-border mx-1 h-4 w-px"></span>

        <IconButton label="Close" class="-mr-1.5" onclick={onClose}>
          <CloseIcon class="size-4" />
        </IconButton>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <span class="text-fg-muted font-mono text-xs">{formattedDate}</span>

      {#if formattedMessage.isJson}
        <pre
          class="overflow-x-auto rounded-lg bg-surface-50-bg p-4 font-mono text-xs edge">{formattedMessage.content}</pre>
      {:else}
        <p class="font-mono text-sm break-words whitespace-pre-wrap">
          {formattedMessage.content}
        </p>
      {/if}
    </div>
  </div>
{/if}
