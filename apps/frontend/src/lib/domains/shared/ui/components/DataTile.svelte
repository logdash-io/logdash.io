<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { fly } from 'svelte/transition';

  const {
    children,
    class: className = '',
    parentClass = '',
    delayIn = 0,
    delayOut = 0,
    header,
  }: {
    children: Snippet;
    class?: ClassValue;
    parentClass?: ClassValue;
    header?: () => ReturnType<Snippet>;
    delayIn?: number;
    delayOut?: number;
  } = $props();

  const flattenCls = (cls: ClassValue): string => {
    return Array.isArray(cls) ? cls.join(' ') : String(cls);
  };

  const cls = $derived.by(() => {
    return [
      'flex h-fit w-full flex-col gap-2 relative',
      ...(Array.isArray(className) ? className : [className]),
      ...(flattenCls(className).includes('p-')
        ? ['ld-card-base']
        : ['ld-card']),
    ];
  });
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
