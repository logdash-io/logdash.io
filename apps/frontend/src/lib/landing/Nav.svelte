<script lang="ts">
  import { resolve } from '$app/paths';
  import Logotype from '$lib/domains/shared/icons/Logotype.svelte';
  import MobileNav from '$lib/landing/nav/MobileNav.svelte';
  import NavMenu from '$lib/landing/nav/NavMenu.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
</script>

<nav
  class="border-hairline bg-surface-root sticky top-0 z-50 w-full shrink-0 border-b"
>
  <!-- `relative` anchors the desktop menu panel to this bar. -->
  <div
    class="relative mx-auto flex h-16 w-full max-w-landing items-center gap-5 px-4 sm:px-6 lg:px-10"
  >
    <a href={resolve('/')} class="flex shrink-0 items-center" draggable="false">
      <Logotype class="text-[18px]" />
    </a>

    <NavMenu />

    <!-- -ml-3 cancels the last link's inner padding so the rule sits 20px from text and button alike -->
    <div
      aria-hidden="true"
      class="bg-hairline -ml-3 hidden h-4 w-px lg:block"
    ></div>

    <div class="hidden items-center gap-2 lg:flex">
      <Button
        href={resolve('/app/auth')}
        draggable="false"
        variant="subtle"
        size="sm"
        class="px-4 font-medium"
        data-posthog-id="nav-login-cta"
      >
        Log in
      </Button>
    </div>

    <MobileNav />
  </div>
</nav>
