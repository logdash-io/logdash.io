<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import {
    NAV_ITEMS,
    NAV_PANELS,
    hrefOf,
    isCurrentTarget,
    isMenuActive,
    type NavMenuKey,
    type NavTarget,
  } from './nav.data';

  /** daisyUI keeps the dropdown open while its trigger has focus. */
  function closeDropdown(): void {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement) focused.blur();
  }

  function linkClass(current: boolean): string {
    return current ? 'text-base-content' : 'text-neutral-400';
  }

  function menuEntries(key: NavMenuKey): (NavTarget & { title: string })[] {
    const menu = NAV_PANELS[key];
    return [...menu.columns.flatMap((column) => column.items), ...menu.links];
  }
</script>

<div class="dropdown dropdown-end ml-auto lg:hidden">
  <div
    tabindex="0"
    role="button"
    class="btn btn-transparent btn-square btn-sm"
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
  </div>
  <!-- Internal hrefs go through resolve() in hrefOf(); external ones open in a new tab. -->
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <ul
    class="menu dropdown-content menu-sm rounded-box ld-card-base z-[1] mt-3 w-60 p-4 shadow-lg"
  >
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
                      ? resolve(entry.path)
                      : hrefOf(entry)}
                    target={entry.kind === 'external' ? '_blank' : undefined}
                    rel={entry.kind === 'external'
                      ? 'noopener noreferrer'
                      : undefined}
                    draggable="false"
                    class={linkClass(isCurrentTarget(entry, page.url.pathname))}
                    onclick={closeDropdown}
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
            onclick={closeDropdown}
          >
            {item.name}
          </a>
        </li>
      {:else}
        <li>
          <a
            href={item.href}
            draggable="false"
            class={linkClass(false)}
            onclick={closeDropdown}
          >
            {item.name}
          </a>
        </li>
      {/if}
    {/each}
    <li class="mt-3">
      <a
        href={resolve('/app/auth')}
        draggable="false"
        class="btn btn-subtle btn-sm w-full rounded-full font-medium"
        data-posthog-id="nav-login-cta"
        onclick={closeDropdown}
      >
        Log in
      </a>
    </li>
    <li class="mt-2">
      <a
        href={resolve('/app/quick-setup')}
        draggable="false"
        rel="nofollow"
        class="btn btn-primary btn-sm w-full rounded-full font-medium"
        data-posthog-id="nav-get-started-cta"
        onclick={closeDropdown}
      >
        Get started
      </a>
    </li>
  </ul>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
