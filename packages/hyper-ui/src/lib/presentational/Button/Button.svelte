<script lang="ts">
  import type { ButtonProps } from "./Button.types";

  export let variant: ButtonProps["variant"] = "primary";
  export let size: ButtonProps["size"] = "md";
  export let disabled: ButtonProps["disabled"] = false;
  export let loading: ButtonProps["loading"] = false;
  export let type: ButtonProps["type"] = "button";

  let className = "";
  export { className as class };
</script>

<button
  class="btn btn-{variant} btn-{size} {className}"
  class:btn-disabled={disabled}
  class:loading
  disabled={disabled || loading}
  {type}
  on:click
>
  {#if loading}
    <span class="loading loading-spinner loading-sm"></span>
  {/if}
  <slot />
</button>
