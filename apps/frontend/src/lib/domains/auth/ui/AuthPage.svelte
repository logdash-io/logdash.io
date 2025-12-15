<script lang="ts">
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import AuthForm from './AuthForm.svelte';
  import AuthTestimonial from './AuthTestimonial.svelte';
</script>

<div class="flex min-h-screen w-full overflow-hidden">
  <div
    class="relative flex w-full flex-col bg-base-200/60 p-8 lg:w-2/5 lg:border-r lg:border-base-100"
  >
    <div class="absolute left-8 top-8">
      <a href="/" class="flex items-center space-x-2">
        <Logo class="size-10" />
        <span class="text-2xl font-bold">logdash</span>
      </a>
    </div>

    <AuthForm />
  </div>

  <AuthTestimonial />
</div>
