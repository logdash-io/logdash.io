<script lang="ts">
  interface Props {
    content: string;
    placement?: "top" | "bottom" | "left" | "right";
    class?: string;
  }

  let { content, placement = "top", class: className = "" }: Props = $props();
</script>

<div class={`tooltip tooltip-${placement} ${className}`} data-tip={content}>
  <slot />
</div>
