<script lang="ts">
  import { resolve } from '$app/paths';
  import Logotype from '$lib/domains/shared/icons/Logotype.svelte';
  import type { Snippet } from 'svelte';
  import AuthTestimonial from './AuthTestimonial.svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();
</script>

<div class="flex min-h-screen w-full overflow-hidden">
  <div
    class="relative flex w-full flex-col bg-neutral-900 p-8 lg:w-2/5 lg:border-r lg:border-base-100"
  >
    <div class="absolute left-8 top-8">
      <a href={resolve('/')} class="flex">
        <Logotype class="text-[24px]" />
      </a>
    </div>

    <div class="flex flex-1 items-center justify-center">
      {@render children()}
    </div>
  </div>

  <AuthTestimonial />
</div>
