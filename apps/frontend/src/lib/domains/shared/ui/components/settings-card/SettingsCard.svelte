<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import SettingsCardHeader from './SettingsCardHeader.svelte';

  type Props = {
    title: string;
    description?: string;
    variant?: 'default' | 'danger';
    icon?: Component<{ class?: ClassValue }>;
    children: Snippet;
  };

  const {
    title,
    description,
    variant = 'default',
    icon,
    children,
  }: Props = $props();
</script>

<section class="flex flex-col gap-3">
  <SettingsCardHeader {title} {description} {variant} {icon} />

  <div
    class="bg-surface-100-bg edge edge-between -mx-4 flex min-w-0 flex-col rounded-xl"
  >
    {@render children()}
  </div>
</section>
