<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & {
    src?: string | null;
    alt?: string;
    children?: Snippet;
  };

  let { src, alt = "", class: className, children, ...rest }: Props = $props();
</script>

<div {...rest} class={["ld-avatar", className]}>
  {#if src}
    <img {src} {alt} />
  {:else}
    {@render children?.()}
  {/if}
</div>

<style>
  @layer theme, base, components;

  @layer components {
    .ld-avatar {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      vertical-align: middle;
    }

    .ld-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
