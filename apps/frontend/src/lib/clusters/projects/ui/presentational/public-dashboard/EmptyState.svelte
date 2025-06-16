<script lang="ts">
  interface Props {
    title?: string;
    description?: string;
  }

  let {
    title = 'No data available',
    description = 'No dashboard data available',
  }: Props = $props();
</script>

<div class="flex h-64 items-center justify-center">
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
      {title}
    </h3>
    <p class="text-lg text-gray-600 dark:text-gray-300">
      {description}
    </p>
  </div>
</div>
