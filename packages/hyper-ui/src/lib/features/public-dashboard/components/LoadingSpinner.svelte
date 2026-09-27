<script lang="ts">
  import Spinner from "../../../presentational/Spinner.svelte";

  interface Props {
    message?: string;
    size?: "xs" | "sm" | "md" | "lg";
  }

  let { message = "Loading...", size = "xs" }: Props = $props();
</script>

<div class="flex h-64 items-center justify-center">
  <div class="flex items-center gap-3">
    <Spinner {size} aria-hidden="true" />
    <span class="text-lg text-neutral-300">
      {message}
    </span>
  </div>
</div>
