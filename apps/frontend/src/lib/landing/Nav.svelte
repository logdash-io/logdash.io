<script lang="ts">
  import { page } from '$app/state';
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';
  import { fade } from 'svelte/transition';
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  const ROUTES = [
    {
      path: '/pricing',
      name: 'Pricing',
    },
    {
      path: '/docs',
      name: 'Documentation',
    },
  ];

  const FEATURES = [
    {
      path: '/features/logging',
      name: 'Logging',
    },
    {
      path: '/features/metrics',
      name: 'Metrics',
    },
    {
      path: '/features/monitoring',
      name: 'Monitoring',
    },
  ];

  const currentRouteIndex = $derived(
    ROUTES.findIndex((route) => route.path === page.url.pathname),
  );

  const handleDashboardClick = () => {
    window.location.href = '/app/clusters';
  };
</script>

{#snippet featuresMenu()}
  <ul class="menu ld-card-base rounded-box z-[1] w-52 p-2 shadow">
    {#each FEATURES as { path, name }}
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
        {#each ROUTES as { path, name }, i}
          <li>
            <a
              href={path}
              draggable="false"
              class={[
                'hover:bg-transparent',
                {
                  'navlink-active': page.url.pathname === path,
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
          {#each ROUTES as { path, name }, i}
            <li>
              <a
                href={path}
                draggable="false"
                class={page.url.pathname === path ? 'text-primary' : ''}
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
                    focusedElement.blur(); // Close dropdown
                  }
                }}
              >
                {name}
              </a>
            </li>
          {/each}
          <li>
            <button
              class="btn btn-primary btn-sm mt-2 w-full"
              onclick={() => {
                const focusedElement = document.activeElement as HTMLElement;
                if (
                  focusedElement &&
                  typeof focusedElement.blur === 'function'
                ) {
                  focusedElement.blur(); // Close dropdown
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
