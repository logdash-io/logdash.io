<script lang="ts">
  import { page } from '$app/state';
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
    // {
    //   path: '/use-cases',
    //   name: 'Use Cases',
    //   matchPrefix: true,
    // },
    {
      path: '/pricing',
      name: 'Pricing',
      matchPrefix: false,
    },
  ];

  const COMPARISONS = comparisons.map((c) => ({
    path: `/vs/${c.slug}`,
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
  ];

  const currentRouteIndex = $derived(
    ROUTES.findIndex((route) => route.path === page.url.pathname),
  );

  const handleDashboardClick = () => {
    window.location.href = '/app/clusters';
  };
</script>

{#snippet featuresMenu(close: () => void)}
  <div class="ld-card-base rounded-box z-[1] w-fit p-2 shadow-lg space-y-1">
    {#each FEATURES as { path, name, description, icon: Icon }}
      <a
        href={path}
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
          class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-base-content/10 bg-base-200"
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
          <span class="text-sm text-base-content/60">{description}</span>
        </div>
      </a>
    {/each}
  </div>
{/snippet}

{#snippet compareMenu()}
  <ul class="menu ld-card-base rounded-box z-[1] w-52 p-2 shadow">
    {#each COMPARISONS as { path, name }}
      <li>
        <a
          href={path}
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
  <nav
    class="bg-base-300/50 sticky top-0 z-50 mx-auto hidden h-24 w-full shrink-0 items-center justify-between gap-4 px-8 backdrop-blur-lg lg:flex"
  >
    <div class="navbar-start">
      <a
        href="/"
        class={[
          'flex items-center space-x-2 py-1 pr-4',
          {
            'navlink-active': page.url.pathname === '/',
          },
        ]}
        onclick={() => {
          animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
        }}
        draggable="false"
      >
        <Logo class="h-10 w-10" />
        <span class="text-2xl font-bold">logdash</span>
      </a>
    </div>

    <div class="navbar-center">
      <ul class="menu menu-horizontal space-x-4 px-1 text-base font-semibold">
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
                'px-3 py-1.5 hover:bg-transparent relative',
                {
                  'navlink-active': page.url.pathname.startsWith('/features'),
                },
              ]}
            >
              Features
            </div>
          </Tooltip>
        </li>
        {#each ROUTES as { path, name, matchPrefix }, i}
          <li>
            <a
              href={path}
              draggable="false"
              class={[
                'hover:bg-transparent',
                {
                  'navlink-active': isRouteActive(
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
                'px-3 py-1.5 hover:bg-transparent relative',
                {
                  'navlink-active': page.url.pathname.startsWith('/vs'),
                },
              ]}
            >
              Compare
            </div>
          </Tooltip>
        </li>
      </ul>
    </div>

    <div class="navbar-end">
      <div class="flex items-center space-x-4">
        <button
          class="btn btn-outline border-primary"
          onclick={handleDashboardClick}
        >
          Get started
        </button>
      </div>
    </div>
  </nav>

  <nav
    class="bg-base-300 sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between px-4 lg:hidden"
  >
    <div class="navbar-start">
      <a
        href="/"
        class="flex items-center space-x-2 py-1"
        onclick={() => {
          animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
        }}
        draggable="false"
      >
        <Logo class="h-8 w-8" />
        <span class="text-xl font-bold">logdash</span>
      </a>
    </div>
    <div class="navbar-end">
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-square btn-transparent">
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
        </label>
        <ul
          tabindex="0"
          class="menu dropdown-content menu-sm rounded-box ld-card-base z-[1] mt-3 w-52 p-4 shadow"
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
                {#each FEATURES as { path, name }}
                  <li>
                    <a
                      href={path}
                      draggable="false"
                      class={page.url.pathname === path ? 'text-primary' : ''}
                      onclick={() => {
                        animatedViewState.nextAnimationDirection =
                          AnimationDirection.RIGHT;
                        const focusedElement =
                          document.activeElement as HTMLElement;
                        if (
                          focusedElement &&
                          typeof focusedElement.blur === 'function'
                        ) {
                          focusedElement.blur(); // Close dropdown
                        }
                      }}
                    >
                      {name}
                    </a>
                  </li>
                {/each}
              </ul>
            </details>
          </li>
          {#each ROUTES as { path, name, matchPrefix }, i}
            <li>
              <a
                href={path}
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
                  const focusedElement = document.activeElement as HTMLElement;
                  if (
                    focusedElement &&
                    typeof focusedElement.blur === 'function'
                  ) {
                    focusedElement.blur();
                  }
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
                {#each COMPARISONS as { path, name }}
                  <li>
                    <a
                      href={path}
                      draggable="false"
                      class={page.url.pathname === path ? 'text-primary' : ''}
                      onclick={() => {
                        animatedViewState.nextAnimationDirection =
                          AnimationDirection.RIGHT;
                        const focusedElement =
                          document.activeElement as HTMLElement;
                        if (
                          focusedElement &&
                          typeof focusedElement.blur === 'function'
                        ) {
                          focusedElement.blur();
                        }
                      }}
                    >
                      {name}
                    </a>
                  </li>
                {/each}
              </ul>
            </details>
          </li>
          <li>
            <button
              class="btn btn-primary btn-sm mt-2 w-full"
              onclick={() => {
                const focusedElement = document.activeElement as HTMLElement;
                if (
                  focusedElement &&
                  typeof focusedElement.blur === 'function'
                ) {
                  focusedElement.blur();
                }
                handleDashboardClick();
              }}
            >
              Dashboard
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
{/snippet}

{@render nav()}
