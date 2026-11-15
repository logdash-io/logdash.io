<script lang="ts">
  import GripIcon from '$lib/domains/shared/icons/GripIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';

  type Props = { id: string; title: string };

  const { id, title }: Props = $props();
</script>

<div
  class="pointer-fine:opacity-0 pointer-fine:group-hover/cell:opacity-100 pointer-fine:group-focus-within/cell:opacity-100 hidden shrink-0 transition-opacity @3xl/insights:flex"
>
  <IconButton
    well
    label="Move {title}"
    tooltip="Drag, or use the arrow keys, to move"
    class="cursor-grab touch-none"
    data-grip={id}
  >
    <GripIcon class="size-4" />
  </IconButton>
</div>
