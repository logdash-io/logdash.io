<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { fly } from 'svelte/transition';

  type Props = {
    children: Snippet;
    class?: ClassValue;
    parentClass?: ClassValue;
    header?: () => ReturnType<Snippet>;
    delayIn?: number;
  };

  const {
    children,
    class: className = '',
    parentClass = '',
    delayIn = 0,
    header,
  }: Props = $props();

  const cls = $derived([
    'flex h-fit w-full flex-col gap-2 relative',
    className,
    hasPaddingClass(className) ? 'ld-card-base' : 'ld-card',
  ]);

  function hasPaddingClass(value: ClassValue): boolean {
    if (Array.isArray(value)) {
      return value.some(hasPaddingClass);
    }

    return typeof value === 'string' && value.includes('p-');
  }
</script>

<div class={parentClass}>
  {@render header?.()}

  <div class={cls}>
    <div
      in:fly|global={{
        y: 5,
        duration: 400,
        delay: delayIn,
      }}
      class="z-10 h-full w-full"
    >
      {@render children()}
    </div>
  </div>
</div>
