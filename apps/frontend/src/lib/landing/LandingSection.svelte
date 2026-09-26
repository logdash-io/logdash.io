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

<section
  {id}
  class={[
    'border-hairline w-full',
    { 'border-b': divider, 'border-t': dividerTop },
  ]}
>
  <div class="mx-auto w-full max-w-landing lg:px-10">
    <div class={['border-hairline w-full lg:border-x', className]}>
      {@render children?.()}
    </div>
  </div>
</section>
