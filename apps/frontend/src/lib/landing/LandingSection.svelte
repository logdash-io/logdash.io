<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    id?: string;
    class?: ClassValue;
    /** Full-width hairline under the section. Off where the next section continues the thought. */
    divider?: boolean;
    /** Full-width hairline above the section, for the first one after the hero stage. */
    dividerTop?: boolean;
    children?: Snippet;
  };

  const {
    id,
    class: className,
    divider = true,
    dividerTop = false,
    children,
  }: Props = $props();
</script>

<!-- scroll-mt-16: an anchored section lands just under the 64px sticky nav, not beneath it. -->
<section
  {id}
  class={[
    'border-surface-root-border w-full',
    { 'border-b': divider, 'border-t': dividerTop, 'scroll-mt-16': id },
  ]}
>
  <div class="mx-auto w-full max-w-landing lg:px-10">
    <div class={['border-surface-root-border w-full lg:border-x', className]}>
      {@render children?.()}
    </div>
  </div>
</section>
