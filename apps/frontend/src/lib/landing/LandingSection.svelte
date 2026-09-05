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
    children: Snippet;
  };

  const {
    id,
    class: className,
    divider = true,
    dividerTop = false,
    children,
  }: Props = $props();
</script>

<!--
  Sections are separated by a subtle full-width rule and nothing else. Blocks
  that need weight (demos, comparisons, quotes) sit on a borderless surface
  (`ld-card-bg rounded-2xl`), padded 24px and, from xl, bled 24px past the
  column (`xl:-mx-6`) so the content inside lands on the nav's x.
-->
<section
  {id}
  class={[
    'border-hairline w-full',
    { 'border-b': divider, 'border-t': dividerTop },
  ]}
>
  <div class={['mx-auto w-full max-w-landing', className]}>
    {@render children()}
  </div>
</section>
