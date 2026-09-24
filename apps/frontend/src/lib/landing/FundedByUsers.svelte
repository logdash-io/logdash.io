<script lang="ts">
  import DiscordIcon from '$lib/domains/shared/icons/DiscordIcon.svelte';
  import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
  import FoundersByline from './FoundersByline.svelte';
  import LandingHeading from './LandingHeading.svelte';
  import { LINKS } from './nav/nav.data';

  const COMMUNITY = [
    {
      label: 'Star on GitHub',
      href: LINKS.github,
      icon: GitHubIcon,
      posthogId: 'funded-github-cta',
    },
    {
      label: 'Join the Discord',
      href: LINKS.discord,
      icon: DiscordIcon,
      posthogId: 'funded-discord-cta',
    },
  ];
</script>

<LandingHeading
  id="funded-by-users"
  title="Funded by our subscribers."
  quiet="Not by investors."
  description="No venture capital, no board, no exit to chase. Logdash runs on paid plans and a community that reports bugs, ships fixes and tells us what to build next. So the only people we answer to are the ones using it."
>
  <FoundersByline class="mt-10" />

  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
    {#each COMMUNITY as link (link.href)}
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-subtle btn-sm gap-2 rounded-full px-4 font-medium"
        data-posthog-id={link.posthogId}
      >
        <link.icon class="size-4" />
        {link.label}
      </a>
    {/each}
  </div>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</LandingHeading>
