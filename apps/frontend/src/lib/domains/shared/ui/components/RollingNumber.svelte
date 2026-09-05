<script lang="ts">
  import { untrack } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';

  type Props = {
    value: number;
    class?: string;
    durationMs?: number;
  };

  const { value, class: className, durationMs = 2200 }: Props = $props();

  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const REVEAL_SPINS = 2;
  const COLUMN_STAGGER_MS = 140;
  const MIN_COLUMN_MS = 300;
  const format = new Intl.NumberFormat('en-US');

  type Cell = {
    key: number;
    char: string;
    column: number | null;
  };

  const formatted = $derived(format.format(value));

  const cells = $derived.by((): Cell[] => {
    let digitsFromRight = 0;

    return formatted
      .split('')
      .reverse()
      .map((char, index) => ({
        key: index,
        char,
        column: /\d/.test(char) ? digitsFromRight++ : null,
      }))
      .reverse();
  });

  const digitByColumn = $derived.by((): number[] => {
    const digits: number[] = [];

    for (const cell of cells) {
      if (cell.column !== null) {
        digits[cell.column] = Number(cell.char);
      }
    }

    return digits;
  });

  let positions = $state<number[]>(untrack(() => digitByColumn));
  let root = $state<HTMLElement | null>(null);
  let revealed = false;
  let frame = 0;

  $effect(() => {
    if (!root) return;

    if (prefersReducedMotion.current) {
      positions = digitByColumn;
      revealed = true;
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      observer.disconnect();
      revealed = true;
      roll(
        digitByColumn.map(() => 0),
        REVEAL_SPINS,
      );
    });

    observer.observe(root);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  });

  $effect(() => {
    const targets = digitByColumn;

    untrack(() => {
      if (!revealed || prefersReducedMotion.current) return;

      roll(positions.slice(0, targets.length), 0);
    });
  });

  function roll(from: number[], spins: number): void {
    cancelAnimationFrame(frame);

    const travel = digitByColumn.map((digit, column) => {
      const start = from[column] ?? 0;
      const forward = (digit - start + 10) % 10;

      return {
        start,
        distance: forward + spins * 10,
        end: Math.max(MIN_COLUMN_MS, durationMs - column * COLUMN_STAGGER_MS),
      };
    });
    const startedAt = performance.now();

    const tick = (now: number): void => {
      const elapsed = now - startedAt;
      let settled = true;

      positions = travel.map(({ start, distance, end }) => {
        const progress = Math.min(1, elapsed / end);

        if (progress < 1) settled = false;

        return (start + cubicOut(progress) * distance) % 10;
      });

      if (!settled) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
  }
</script>

<span
  bind:this={root}
  class={['inline-flex items-baseline tabular-nums select-none', className]}
>
  <span class="sr-only">{formatted}</span>

  {#each cells as cell (cell.key)}
    {#if cell.column !== null}
      <span
        class="relative inline-block w-[1ch] overflow-hidden leading-tight [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
        aria-hidden="true"
      >
        <span class="invisible">0</span>
        <span
          class="absolute inset-x-0 top-0 flex flex-col text-center will-change-transform"
          style:transform="translateY({-(positions[cell.column] ?? 0)}lh)"
        >
          {#each DIGITS as digit, index (index)}
            <span>{digit}</span>
          {/each}
        </span>
      </span>
    {:else}
      <span aria-hidden="true">{cell.char}</span>
    {/if}
  {/each}
</span>
