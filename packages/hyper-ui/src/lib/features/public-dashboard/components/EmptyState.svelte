<script lang="ts">
  interface Props {
    title?: string;
    description?: string;
  }

  let {
    title = "No data available",
    description = "No dashboard data available",
  }: Props = $props();
</script>

<div class="ld-card md:w-xl mb-4 flex w-full items-center justify-center">
  <div class="text-center">
    <h3 class="text-secondary mb-2 text-xl font-medium">
      {title}
    </h3>
    <p class="text-secondary/70 text-base">
      {description}
    </p>
  </div>
</div>
