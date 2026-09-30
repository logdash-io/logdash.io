<script lang="ts">
  import type { Snippet } from 'svelte';
  import SettingsCardHeader from './SettingsCardHeader.svelte';

  type Props = {
    title: string;
    description?: string;
    variant?: 'default' | 'danger';
    children: Snippet;
  };

  const { title, description, variant = 'default', children }: Props = $props();
</script>

<section class="border-hairline flex flex-col border-b lg:flex-row">
  <SettingsCardHeader {title} {description} {variant} />

  <div class="divide-hairline flex min-w-0 flex-1 flex-col divide-y">
    {@render children()}
  </div>
</section>
