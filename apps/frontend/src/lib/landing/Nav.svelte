<script lang="ts">
  import { page } from '$app/state';
  import Logo from '$lib/domains/shared/icons/Logo.svelte';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte';
  import { generateGithubOAuthUrl } from '$lib/domains/shared/utils/generate-github-oauth-url';
  import { ExternalLinkIcon } from 'lucide-svelte';
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';

  const ROUTES = [
    {
      path: '/features',
      name: 'Features',
    },
    {
      path: '/pricing',
      name: 'Pricing',
    },
    {
      path: '/docs',
      name: 'Docs',
    },
    {
      path: 'https://discord.gg/naftPW4Hxe',
      name: 'Discord',
      target: '_blank',
    },
    {
      path: 'https://status.logdash.io',
      name: 'Status',
      target: '_blank',
    },
    {
      path: 'https://github.com/logdash-io/logdash.io',
      name: 'Source',
      target: '_blank',
    },
    // {
    // 	path: '/about-us',
    // 	name: 'About us',
    // },
  ];

  let loggingIn = $state(false);
  const currentRouteIndex = $derived(
    ROUTES.findIndex((route) => route.path === page.url.pathname),
  );

  onDestroy(() => {
    loggingIn = false;
  });

  const handleGithubLogin = () => {
    loggingIn = true;
    window.location.href = generateGithubOAuthUrl({
      terms_accepted: false,
      email_accepted: false,
      flow: 'login',
      fallback_url: '/app/auth?needs_account=true',
      next_url: '/app/clusters',
    });
  };
</script>

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

        <span class="badge badge-xs font-mono text-xs opacity-70">beta</span>
      </a>
    </div>

    <div class="navbar-center">
      <ul class="menu menu-horizontal space-x-4 px-1 text-base font-semibold">
        {#each ROUTES as { path, name, target }, i}
          <li>
            <a
              href={path}
              target={target ? target : undefined}
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

              {#if target === '_blank'}
                <ExternalLinkIcon class="h-4 w-4 shrink-0" />
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </div>

    <div class="navbar-end">
      <div class="flex items-center space-x-4">
        <button
          disabled={loggingIn}
          class="btn btn-outline border-primary"
          onclick={handleGithubLogin}
        >
          {#if loggingIn}
            <div
              in:fade={{ duration: 150 }}
              class="flex h-6 w-6 items-center justify-center"
            >
              <span class="loading loading-spinner h-4 w-4"></span>
            </div>
          {/if}

          Dashboard
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
        <span class="badge badge-xs font-mono text-xs opacity-70">beta</span>
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
          {#each ROUTES as { path, name, target }, i}
            <li>
              <a
                href={path}
                target={target ? target : undefined}
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

                {#if target === '_blank'}
                  <ExternalLinkIcon class="h-4 w-4 shrink-0" />
                {/if}
              </a>
            </li>
          {/each}
          <li>
            <button
              disabled={loggingIn}
              class="btn btn-primary btn-sm mt-2 w-full"
              onclick={() => {
                const focusedElement = document.activeElement as HTMLElement;
                if (
                  focusedElement &&
                  typeof focusedElement.blur === 'function'
                ) {
                  focusedElement.blur(); // Close dropdown
                }
                handleGithubLogin();
              }}
            >
              {#if loggingIn}
                <span class="loading loading-spinner h-4 w-4"></span>
              {:else}
                Dashboard
              {/if}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
{/snippet}

{@render nav()}
