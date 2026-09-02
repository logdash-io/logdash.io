<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { Pathname } from '$app/types';
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';
  import { fade } from 'svelte/transition';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import { comparisons } from '$lib/landing/compare/compare.data';

  const ROUTES = [
    {
      path: '/guides',
      name: 'Guides',
      matchPrefix: true,
    },
    {
      path: '/pricing',
      name: 'Pricing',
      matchPrefix: false,
    },
  ] as const;

  const COMPARISONS = comparisons.map((c) => ({
    path: `/vs/${c.slug}` as Extract<Pathname, `/vs/${string}`>,
    name: c.title,
  }));

  function isRouteActive(
    routePath: string,
    matchPrefix: boolean,
    pathname: string,
  ): boolean {
    if (matchPrefix) {
      return pathname.startsWith(routePath);
    }
    return pathname === routePath;
  }

  const FEATURES = [
    {
      path: '/features/logging',
      name: 'Logging',
      description: 'Stream and search logs in real-time',
      icon: LogsIcon,
    },
    {
      path: '/features/metrics',
      name: 'Metrics',
      description: 'Track counters, gauges and histograms',
      icon: MetricsIcon,
    },
    {
      path: '/features/monitoring',
      name: 'Monitoring',
      description: 'Monitor uptime and get instant alerts',
      icon: MonitoringIcon,
    },
  ] as const;

  const currentRouteIndex = $derived(
    ROUTES.findIndex((route) => route.path === page.url.pathname),
  );

  function onCloseDropdown(): void {
    const focusedElement = document.activeElement as HTMLElement | null;

    if (focusedElement && typeof focusedElement.blur === 'function') {
      focusedElement.blur();
    }
  }
</script>

{#snippet featuresMenu(close: () => void)}
  <div class="ld-card-base rounded-box z-[1] w-fit space-y-1 p-2 shadow-lg">
    {#each FEATURES as { path, name, description, icon: Icon } (path)}
      <a
        href={resolve(path)}
        draggable="false"
        class={[
          'flex items-center gap-3 rounded-lg p-2 hover:bg-base-100/80 group transition-colors duration-150',
        ]}
        onclick={() => {
          close();
          animatedViewState.nextAnimationDirection = AnimationDirection.RIGHT;
        }}
      >
        <div
          class="border-base-content/10 bg-base-200 flex size-10 shrink-0 items-center justify-center rounded-lg border"
        >
          <Icon
            class={[
              'size-5 text-base-content/70 group-hover:text-primary transition-colors duration-150',
              { 'text-primary': page.url.pathname === path },
            ]}
          />
        </div>
        <div class="flex flex-col">
          <span class={['font-semibold text-sm']}>
            {name}
          </span>
          <span class="text-base-content/60 text-sm">{description}</span>
        </div>
      </a>
    {/each}
  </div>
{/snippet}

{#snippet compareMenu()}
  <ul class="menu ld-card-base rounded-box z-[1] w-52 p-2 shadow">
    {#each COMPARISONS as { path, name } (path)}
      <li>
        <a
          href={resolve(path)}
          draggable="false"
          class={page.url.pathname === path ? 'text-primary' : ''}
          onclick={() => {
            animatedViewState.nextAnimationDirection = AnimationDirection.RIGHT;
          }}
        >
          {name}
        </a>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet nav()}
  <nav class="sticky top-3 z-50 hidden w-full shrink-0 px-4 pb-3 lg:block">
    <div
      class="border-base-content/10 bg-base-300/70 mx-auto grid h-14 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-full border px-6 shadow-lg backdrop-blur-xl"
    >
      <a
        href={resolve('/')}
        class="flex w-fit items-center gap-2 justify-self-start py-1"
        onclick={() => {
          animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
        }}
        draggable="false"
      >
        <Logo class="h-8 w-8" />
        <span class="text-xl font-bold tracking-tight">logdash</span>
      </a>

      <ul
        class="navbar-center menu menu-horizontal justify-self-center px-1 text-sm font-semibold"
      >
        <li>
          <Tooltip
            class="p-0"
            placement="bottom"
            content={featuresMenu}
            interactive={true}
          >
            <div
              role="button"
              class={[
                'px-3 py-1.5 text-base-content/70 hover:text-base-content hover:bg-transparent transition-colors duration-150 relative',
                {
                  'navlink-active text-base-content':
                    page.url.pathname.startsWith('/features'),
                },
              ]}
            >
              Features
            </div>
          </Tooltip>
        </li>
        {#each ROUTES as { path, name, matchPrefix }, i (path)}
          <li>
            <a
              href={resolve(path)}
              draggable="false"
              class={[
                'px-3 py-1.5 text-base-content/70 hover:text-base-content hover:bg-transparent transition-colors duration-150',
                {
                  'navlink-active text-base-content': isRouteActive(
                    path,
                    matchPrefix,
                    page.url.pathname,
                  ),
                },
              ]}
              onclick={() => {
                const animationDirection =
                  i > currentRouteIndex
                    ? AnimationDirection.RIGHT
                    : AnimationDirection.LEFT;

                animatedViewState.nextAnimationDirection = animationDirection;
              }}
              in:fade={{ duration: 150, delay: i * 50 }}
            >
              {name}
            </a>
          </li>
        {/each}
        <li>
          <Tooltip
            class="p-0"
            placement="bottom"
            content={compareMenu}
            interactive={true}
          >
            <div
              role="button"
              class={[
                'px-3 py-1.5 text-base-content/70 hover:text-base-content hover:bg-transparent transition-colors duration-150 relative',
                {
                  'navlink-active text-base-content':
                    page.url.pathname.startsWith('/vs'),
                },
              ]}
            >
              Compare
            </div>
          </Tooltip>
        </li>
      </ul>

      <div class="flex items-center gap-2 justify-self-end">
        <a
          href={resolve('/app/auth')}
          draggable="false"
          class="btn btn-ghost btn-sm rounded-full px-4 font-semibold"
          data-posthog-id="nav-login-cta"
        >
          Log in
        </a>

        <a
          href={resolve('/app/quick-setup')}
          draggable="false"
          rel="nofollow"
          class="btn btn-primary btn-sm rounded-full px-5 font-semibold"
          data-posthog-id="nav-get-started-cta"
        >
          Get started
        </a>
      </div>
    </div>
  </nav>

  <nav class="sticky top-3 z-50 w-full shrink-0 px-4 pb-3 lg:hidden">
    <div
      class="border-base-content/10 bg-base-300/70 mx-auto flex h-14 w-full items-center justify-between rounded-full border pl-5 pr-3 shadow-lg backdrop-blur-xl"
    >
      <a
        href={resolve('/')}
        class="flex items-center gap-2 py-1"
        onclick={() => {
          animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
        }}
        draggable="false"
      >
        <Logo class="h-7 w-7" />
        <span class="text-lg font-bold tracking-tight">logdash</span>
      </a>

      <div class="dropdown dropdown-end">
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
        <ul
          class="menu dropdown-content menu-sm rounded-box ld-card-base z-[1] mt-3 w-56 p-4 shadow-lg"
        >
          <li>
            <details>
              <summary
                class={page.url.pathname.startsWith('/features')
                  ? 'text-primary'
                  : ''}
              >
                Features
              </summary>
              <ul>
                {#each FEATURES as { path, name } (path)}
                  <li>
                    <a
                      href={resolve(path)}
                      draggable="false"
                      class={page.url.pathname === path ? 'text-primary' : ''}
                      onclick={() => {
                        animatedViewState.nextAnimationDirection =
                          AnimationDirection.RIGHT;
                        onCloseDropdown();
                      }}
                    >
                      {name}
                    </a>
                  </li>
                {/each}
              </ul>
            </details>
          </li>
          {#each ROUTES as { path, name, matchPrefix }, i (path)}
            <li>
              <a
                href={resolve(path)}
                draggable="false"
                class={isRouteActive(path, matchPrefix, page.url.pathname)
                  ? 'text-primary'
                  : ''}
                onclick={() => {
                  const animationDirection =
                    i > currentRouteIndex
                      ? AnimationDirection.RIGHT
                      : AnimationDirection.LEFT;
                  animatedViewState.nextAnimationDirection = animationDirection;
                  onCloseDropdown();
                }}
              >
                {name}
              </a>
            </li>
          {/each}
          <li>
            <details>
              <summary
                class={page.url.pathname.startsWith('/vs')
                  ? 'text-primary'
                  : ''}
              >
                Compare
              </summary>
              <ul>
                {#each COMPARISONS as { path, name } (path)}
                  <li>
                    <a
                      href={resolve(path)}
                      draggable="false"
                      class={page.url.pathname === path ? 'text-primary' : ''}
                      onclick={() => {
                        animatedViewState.nextAnimationDirection =
                          AnimationDirection.RIGHT;
                        onCloseDropdown();
                      }}
                    >
                      {name}
                    </a>
                  </li>
                {/each}
              </ul>
            </details>
          </li>
          <li class="mt-3">
            <a
              href={resolve('/app/auth')}
              draggable="false"
              class="btn btn-ghost btn-sm w-full rounded-full font-semibold"
              data-posthog-id="nav-login-cta"
              onclick={onCloseDropdown}
            >
              Log in
            </a>
          </li>
          <li class="mt-2">
            <a
              href={resolve('/app/quick-setup')}
              draggable="false"
              rel="nofollow"
              class="btn btn-primary btn-sm w-full rounded-full font-semibold"
              data-posthog-id="nav-get-started-cta"
              onclick={onCloseDropdown}
            >
              Get started
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
{/snippet}

{@render nav()}

<style>
  @keyframes menu-in {
    from {
      opacity: 0;
      translate: 0 var(--menu-drop, 0px);
      filter: blur(var(--menu-blur, 0px));
    }
    to {
      opacity: 1;
      translate: 0 0;
      filter: blur(0px);
    }
  }

  .navbar-center {
    --menu-drop: -4px;
    --menu-blur: 3px;
    animation: menu-in 0.8s cubic-bezier(0.25, 1, 0.5, 1) 350ms backwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .navbar-center {
      --menu-drop: 0px;
      --menu-blur: 0px;
      animation-duration: 0.4s;
      animation-delay: 0ms;
    }
  }
</style>
