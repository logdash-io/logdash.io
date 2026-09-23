<script lang="ts">
  import { resolve } from '$app/paths';
  import Logotype from '$lib/domains/shared/icons/Logotype.svelte';
  import AuthForm from './AuthForm.svelte';
  import AuthTestimonial from './AuthTestimonial.svelte';
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

    <AuthForm />
  </div>

  <AuthTestimonial />
</div>
