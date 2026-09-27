<script lang="ts">
  import { resolve } from '$app/paths';
  import LogoMark from '$lib/domains/shared/icons/LogoMark.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import FooterEnding from '$lib/landing/FooterEnding.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
  import {
    FOOTER_COLUMNS,
    FOOTER_SOCIALS,
    type FooterLink,
  } from '$lib/landing/footer.data';
  import { hrefOf } from '$lib/landing/nav/nav.data';

  const currentYear = new Date().getFullYear();

  /** The EU flag's twelve stars, clockwise from the top, on a 30x20 box. */
  const EU_STARS = Array.from({ length: 12 }, (_, i) => ({
    x: 15 + 6 * Math.sin((i * Math.PI) / 6),
    y: 10 - 6 * Math.cos((i * Math.PI) / 6),
  }));

  /** Internal paths go through resolve(); mailto: stays in the current tab. */
  function linkAttrs(link: FooterLink): Record<string, string> {
    if (link.kind === 'internal')
      return { href: `${resolve(link.path)}${link.hash ?? ''}` };
    const href = hrefOf(link);
    return href.startsWith('mailto:')
      ? { href }
      : { href, target: '_blank', rel: 'noopener noreferrer' };
  }

  /** Marks links that leave the site, mailto included. */
  function leavesSite(link: FooterLink): boolean {
    return link.kind === 'external';
  }
</script>

<!--
  How the page ends: a hatched band across the full width, then the landing
  column between its rails with the logo mark alone on the left, five equal
  columns packed against the right edge, and a quiet bottom row with the
  social icons, where the data lives and the copyright. Last, the wordmark
  rising out of the page bottom (FooterEnding's runway; the root layout
  renders its floor), with the rails running on down to the page end.
-->
<!-- eslint-disable svelte/no-navigation-without-resolve -- linkAttrs() resolves internal paths -->
<footer class="w-full">
  <div class="border-hairline ld-hatch h-5 border-y lg:h-8"></div>

  <LandingSection
    divider={false}
    class="px-4 pt-16 pb-8 sm:px-6 lg:px-10 lg:pt-20 lg:pb-12"
  >
    <div
      class="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-[minmax(0,1fr)_repeat(5,12rem)] xl:gap-x-0"
    >
      <a
        href={resolve('/')}
        class="col-span-2 flex h-7 w-fit items-center sm:col-span-3 lg:col-span-5 xl:col-span-1"
        draggable="false"
        aria-label="Logdash home"
      >
        <LogoMark class="size-7" />
      </a>

      {#each FOOTER_COLUMNS as column (column.title)}
        <nav aria-label={column.title} class="flex flex-col">
          <h3
            class="text-neutral-500 flex h-7 items-center text-sm font-medium"
          >
            {column.title}
          </h3>
          <ul class="flex flex-col">
            {#each column.links as link (link.title)}
              <li>
                <a
                  {...linkAttrs(link)}
                  class="text-neutral-300 hover:text-fg-default flex h-7 w-fit items-center gap-1.5 text-sm transition-ink duration-150"
                  draggable="false"
                >
                  {link.title}
                  {#if leavesSite(link)}
                    <OpenIcon class="text-neutral-600 size-3 shrink-0" />
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        </nav>
      {/each}
    </div>

    <div
      class="mt-20 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:mt-32"
    >
      <ul class="flex items-center gap-5">
        {#each FOOTER_SOCIALS as social (social.href)}
          {@const Icon = social.icon}
          <li>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              class="text-neutral-500 hover:text-fg-default flex size-6 items-center justify-center transition-ink duration-150"
              draggable="false"
            >
              <Icon class="size-4" />
            </a>
          </li>
        {/each}
      </ul>

      <div
        class="text-neutral-500 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs leading-[18px] sm:justify-end"
      >
        <!-- An SVG flag, not the emoji: Windows shows 🇪🇺 as the letters "EU". -->
        <span class="flex items-center gap-1.5">
          <svg
            viewBox="0 0 30 20"
            class="h-3 w-[18px] shrink-0 rounded-[2px]"
            aria-hidden="true"
          >
            <rect width="30" height="20" fill="#039" />
            {#each EU_STARS as star, i (i)}
              <circle cx={star.x} cy={star.y} r="0.9" fill="#fc0" />
            {/each}
          </svg>
          Made in the EU. Your data is stored in the EU.
        </span>
        <span>&copy; {currentYear} logdash.io. All rights reserved.</span>
      </div>
    </div>
  </LandingSection>

  <div class="relative">
    <div
      class="pointer-events-none absolute inset-0 mx-auto w-full max-w-landing lg:px-10"
      aria-hidden="true"
    >
      <div class="border-hairline h-full lg:border-x"></div>
    </div>

    <FooterEnding part="runway" />
  </div>
</footer>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
