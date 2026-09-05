<script lang="ts">
  import {
    anonymousPreviewState,
    type AnonymousPreviewSource,
  } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { scrollIntoViewCentered } from '$lib/domains/shared/utils/scroll';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url';
  import { page } from '$app/state';
  import { ArrowRightIcon, CircleAlertIcon, GlobeIcon } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fly } from 'svelte/transition';
  import { HERO_SHOWCASE_ID, HERO_URL_INPUT_ID } from './hero-anchors';

  type Props = {
    source: AnonymousPreviewSource;
    compact?: boolean;
  };

  const { source, compact = false }: Props = $props();

  /**
   * The full question needs ~183px and the field only offers ~149px next to
   * the button on a 390px screen, so the narrow phrasing takes over there
   * rather than letting the placeholder clip mid-word. Both lines sit in the
   * markup and a breakpoint shows one, over a transparent native placeholder
   * that keeps `:placeholder-shown` working, so the server and the client
   * render the same text and nothing swaps after hydration.
   */
  const PLACEHOLDER = 'What’s your website url?';
  const PLACEHOLDER_NARROW = 'Your website url?';

  const SHAKE_DURATION_MS = 450;
  const SHAKE_OFFSETS_PX = [0, -5, 4, -2, 0];
  const SHAKE_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';
  const STATUS_SWAP_MS = 200;

  let url = $state('');
  let validationMessage = $state<string | null>(null);
  let composer = $state<HTMLDivElement | null>(null);
  let input = $state<HTMLInputElement | null>(null);

  /**
   * A submit that lands before hydration falls back to the browser's native
   * GET, which reloads `/` with `?url=`. Read it back so the typed address
   * survives instead of silently vanishing.
   */
  onMount(() => {
    const submitted = page.url.searchParams.get('url')?.trim();

    if (submitted && !url) {
      url = submitted;
    }
  });

  const isCreating = $derived(anonymousPreviewState.phase === 'creating');
  const isInvalid = $derived(validationMessage !== null);
  const statusId = $derived(`${source}-url-status`);
  const submitPosthogId = $derived(`${source}-monitor-url-submit-cta`);
  const statusSwapMs = $derived(
    prefersReducedMotion.current ? 0 : STATUS_SWAP_MS,
  );

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    const value = url.trim();

    if (!value) {
      reject('Enter the address you want us to watch.');
      return;
    }

    if (!isValidUrl(value)) {
      reject('That is not a valid URL. Try https://yourapp.com');
      return;
    }

    validationMessage = null;
    revealShowcase();

    await anonymousPreviewState.submit(tryPrependProtocol(value), source);
  }

  function reject(message: string): void {
    validationMessage = message;
    shake(composer);
    input?.focus();
  }

  function shake(node: HTMLElement | null): void {
    if (!node || prefersReducedMotion.current) return;

    node.animate(
      SHAKE_OFFSETS_PX.map((offset) => ({
        transform: `translateX(${offset}px)`,
      })),
      { duration: SHAKE_DURATION_MS, easing: SHAKE_EASING },
    );
  }

  function revealShowcase(): void {
    const showcase = document.getElementById(HERO_SHOWCASE_ID);

    if (showcase) {
      scrollIntoViewCentered(showcase);
    }
  }

  function onInput(): void {
    if (validationMessage) {
      validationMessage = null;
    }
  }

  /**
   * The composer's own padding and the gap beside the button are inside the
   * shell but outside the field, so a click there would land nowhere. Hand
   * those clicks to the input, the way a native text field's padding behaves.
   */
  function onShellMouseDown(event: MouseEvent): void {
    if (event.target !== composer) return;

    event.preventDefault();
    input?.focus();
  }
</script>

<form class="flex w-full flex-col gap-2" onsubmit={onSubmit} novalidate>
  <div
    bind:this={composer}
    class={[
      'inset-ring-base-100 bg-base-300 flex w-full cursor-text items-center gap-2 rounded-2xl p-2 inset-ring',
      'transition-shadow duration-150',
      'hover:not-focus-within:inset-ring-neutral-700',
      'focus-within:inset-ring-neutral-600 focus-within:shadow-(--focus-ring)',
      {
        'inset-ring-error/60! focus-within:shadow-(--focus-ring-error)!':
          isInvalid,
      },
    ]}
    onmousedown={onShellMouseDown}
  >
    <div class="relative flex min-w-0 flex-1">
      <input
        bind:this={input}
        class={[
          'peer selection:bg-neutral-700 w-full bg-transparent px-2 outline-none placeholder:text-transparent disabled:opacity-60',
          compact ? 'h-9 text-base' : 'h-11 text-base sm:text-lg',
        ]}
        id={compact ? undefined : HERO_URL_INPUT_ID}
        type="text"
        name="url"
        inputmode="url"
        autocomplete="url"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        placeholder={PLACEHOLDER}
        aria-label="Your app URL"
        aria-invalid={isInvalid ? 'true' : undefined}
        aria-describedby={statusId}
        disabled={isCreating}
        bind:value={url}
        oninput={onInput}
      />
      <span
        aria-hidden="true"
        class={[
          'text-neutral-600 pointer-events-none absolute inset-y-0 left-2 right-2 hidden items-center peer-placeholder-shown:flex',
          compact ? 'text-base' : 'text-base sm:text-lg',
        ]}
      >
        <span class="truncate sm:hidden">{PLACEHOLDER_NARROW}</span>
        <span class="hidden truncate sm:block">{PLACEHOLDER}</span>
      </span>
    </div>

    <button
      type="submit"
      class={[
        'btn btn-primary btn-sm shrink-0 rounded-lg font-medium',
        compact ? 'h-9 px-4' : 'h-11 px-5 text-sm sm:text-base',
      ]}
      data-posthog-id={submitPosthogId}
      disabled={isCreating}
    >
      Start monitoring
      {#if isCreating}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <ArrowRightIcon class="size-4" />
      {/if}
    </button>
  </div>

  <p
    id={statusId}
    class={[
      'flex min-h-4 pl-4 text-xs transition-ink duration-150',
      isInvalid ? 'text-error' : 'text-neutral-500',
    ]}
    aria-live="polite"
  >
    {#key validationMessage}
      <span
        class="inline-flex items-center gap-1.5"
        in:fly={{ y: -2, duration: statusSwapMs }}
      >
        {#if validationMessage}
          <CircleAlertIcon class="size-3.5 shrink-0" />
          {validationMessage}
        {:else}
          <GlobeIcon class="size-3.5 shrink-0 text-neutral-500" />
          Any public URL · checked every 15 s
        {/if}
      </span>
    {/key}
  </p>
</form>
