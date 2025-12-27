<script lang="ts">
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';

  const currentYear = new Date().getFullYear();
</script>

<footer class="footer sm:footer-horizontal w-full p-10">
  <div class="flex flex-col">
    <a
      href="/"
      class={['flex items-center space-x-2 py-1 pr-4']}
      onclick={() => {
        animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
      }}
      draggable="false"
    >
      <Logo class="h-10 w-10" />
      <span class="text-2xl font-semibold">logdash</span>
    </a>
    <p class="text-sm opacity-75">
      &copy; {currentYear} logdash.io. All rights reserved.
    </p>
  </div>
  <nav>
    <h6 class="footer-title">Product</h6>
    <a href="/features/logging" class="link link-hover">Logging</a>
    <a href="/features/metrics" class="link link-hover">Metrics</a>
    <a href="/features/monitoring" class="link link-hover">Monitoring</a>
  </nav>
  <nav>
    <h6 class="footer-title">Company</h6>
    <a href="/pricing" class="link link-hover">Pricing</a>
    <a
      target="_blank"
      href="https://github.com/logdash-io/logdash.io"
      class="link link-hover"
    >
      Source Code
    </a>
    <a href="/guides" class="link link-hover">Guides</a>
    <a
      target="_blank"
      href="https://discord.gg/naftPW4Hxe"
      class="link link-hover"
    >
      Discord
    </a>
    <a
      target="_blank"
      href="https://logdash.io/d/685498e1e0ad21003cb3b2fa"
      class="link link-hover"
    >
      Status
    </a>
    <a href="mailto:support@logdash.io" class="link link-hover">Contact</a>
    <a
      target="_blank"
      href="https://insigh.to/b/logdash"
      class="link link-hover"
    >
      Roadmap
    </a>
  </nav>
  <nav>
    <h6 class="footer-title">Legal</h6>
    <a href="/terms-of-service" class="link link-hover">Terms of use</a>
    <a href="/privacy-policy" class="link link-hover">Privacy policy</a>
    <a href="/cookies-policy" class="link link-hover">Cookies policy</a>
  </nav>
</footer>
