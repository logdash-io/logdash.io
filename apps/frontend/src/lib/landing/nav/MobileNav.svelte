<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button, Dropdown, Menu } from '@logdash/hyper-ui/presentational';
  import {
    NAV_ITEMS,
    NAV_PANELS,
    hrefOf,
    isCurrentTarget,
    isMenuActive,
    type NavMenuKey,
    type NavTarget,
  } from './nav.data';

  function linkClass(current: boolean): string {
    return current ? 'text-fg-default' : 'text-neutral-400';
  }

  function menuEntries(key: NavMenuKey): (NavTarget & { title: string })[] {
    const menu = NAV_PANELS[key];
    return [...menu.columns.flatMap((column) => column.items), ...menu.links];
  }
</script>

<Dropdown align="end">
  {#snippet trigger(attrs)}
    <Button
      {...attrs}
      variant="transparent"
      shape="square"
      size="sm"
      class="ml-auto lg:hidden"
      aria-label="Open menu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </Button>
  {/snippet}
  <!-- Internal hrefs go through resolve() in hrefOf(); external ones open in a new tab. -->
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <Menu size="sm" class="ld-card-base mt-3 w-60 rounded-xl shadow-lg">
    {#each NAV_ITEMS as item (item.name)}
      {#if item.kind === 'menu'}
        <li>
          <details>
            <summary class={linkClass(isMenuActive(item, page.url.pathname))}>
              {item.name}
            </summary>
            <ul>
              {#each menuEntries(item.key) as entry (entry.title)}
                <li>
                  <a
                    href={entry.kind === 'internal'
                      ? `${resolve(entry.path)}${entry.hash ?? ''}`
                      : hrefOf(entry)}
                    target={entry.kind === 'external' ? '_blank' : undefined}
                    rel={entry.kind === 'external'
                      ? 'noopener noreferrer'
                      : undefined}
                    draggable="false"
                    class={linkClass(isCurrentTarget(entry, page.url.pathname))}
                  >
                    {entry.title}
                  </a>
                </li>
              {/each}
            </ul>
          </details>
        </li>
      {:else if item.kind === 'link'}
        <li>
          <a
            href={resolve(item.path)}
            draggable="false"
            class={linkClass(page.url.pathname === item.path)}
          >
            {item.name}
          </a>
        </li>
      {:else}
        <li>
          <a href={item.href} draggable="false" class={linkClass(false)}>
            {item.name}
          </a>
        </li>
      {/if}
    {/each}
    <li class="mt-3">
      <Button
        href={resolve('/app/auth')}
        draggable="false"
        variant="subtle"
        size="sm"
        block
        class="font-medium"
        data-posthog-id="nav-login-cta"
      >
        Log in
      </Button>
    </li>
  </Menu>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</Dropdown>
