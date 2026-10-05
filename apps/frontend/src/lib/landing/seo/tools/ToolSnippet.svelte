<script lang="ts">
  import CopyButton from './CopyButton.svelte';

  type Props = {
    title: string;
    code: string;
    language: 'markdown' | 'html';
  };

  const { title, code, language }: Props = $props();
</script>

<div class="border-surface-root-border overflow-hidden rounded-xl border">
  <div
    class="border-surface-root-border flex h-9 items-center justify-between border-b pr-1 pl-4"
  >
    <span class="text-fg-muted text-xs font-medium">{title}</span>
    <CopyButton text={code} label="Copy {title}" class="size-7 rounded-md" />
  </div>
  <pre
    data-language={language}
    class="text-fg-secondary overflow-x-auto p-4 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap"><code>{code}</code></pre>
</div>
