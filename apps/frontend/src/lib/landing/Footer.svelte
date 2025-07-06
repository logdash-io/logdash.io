<script>
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
</script>

<footer class="footer sm:footer-horizontal w-full p-10">
  <aside>
    <Logo class="h-10 w-10" />
    <p class="text-sm opacity-75">
      &copy; 2025 logdash.io. All rights reserved.
    </p>
  </aside>
  <nav>
    <h6 class="footer-title">Features</h6>
    <a href="/app/quick-setup?feature=logging" class="link link-hover">
      Logging
      <span class="text-info ml-2">beta</span>
    </a>
    <a href="/app/quick-setup?feature=metrics" class="link link-hover">
      Metrics
      <span class="text-info ml-2">beta</span>
    </a>
    <a href="/features" class="link link-hover">
      Monitoring
      <span class="text-primary ml-2">new</span>
    </a>
  </nav>
  <nav>
    <h6 class="footer-title">Company</h6>
    <a href="/pricing" class="link link-hover">Pricing</a>
    <a href="https://github.com/logdash-io/logdash.io" class="link link-hover">
      Source Code
    </a>
    <a href="/docs" class="link link-hover">Documentation</a>
    <a href="https://discord.gg/naftPW4Hxe" class="link link-hover">Discord</a>
    <a
      href="https://logdash.io/d/685498e1e0ad21003cb3b2fa"
      class="link link-hover"
    >
      Status
    </a>
    <a href="mailto:support@logdash.io" class="link link-hover">Contact</a>
    <!-- <a class="link link-hover">Jobs</a> -->
    <!-- <a class="link link-hover">Press kit</a> -->
  </nav>
  <nav>
    <h6 class="footer-title">Legal</h6>
    <a href="/terms-of-service" class="link link-hover">Terms of use</a>
    <a href="/privacy-policy" class="link link-hover">Privacy policy</a>
    <a href="/cookies-policy" class="link link-hover">Cookies policy</a>
  </nav>
</footer>
