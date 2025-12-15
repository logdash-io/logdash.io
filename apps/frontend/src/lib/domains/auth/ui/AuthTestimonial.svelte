<script lang="ts">
  import GridPattern from '$lib/domains/shared/ui/components/GridPattern.svelte';
  import BlockquoteIcon from '$lib/domains/shared/icons/BlockquoteIcon.svelte';
</script>

<div
  class="relative hidden w-3/5 flex-col justify-between overflow-hidden bg-black p-12 text-white lg:flex"
>
  <GridPattern
    squares={[
      [4, 4],
      [5, 1],
      [8, 2],
      [6, 6],
      [10, 5],
      [13, 3],
    ]}
    class={[
      'absolute',
      '[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]',
      'inset-x-0 top-0 h-[10%] skew-y-12',
    ]}
    fillColor="rgb(156 163 175 / 0.15)"
  />

  <div class="relative z-10 flex flex-col h-full">
    <div class="flex-1 flex items-center justify-center">
      <div class="max-w-lg relative">
        <BlockquoteIcon
          class="absolute -left-8 -top-8 size-16 text-base-100 z-0 rotate-180"
        />
        <blockquote class="text-3xl italic z-10 relative">
          Most tools feel like they were made for enterprises. Logdash feels
          like it was made for me.
        </blockquote>
        <div class="mt-8 flex items-center gap-4">
          <img
            src="/images/testimonials/bsw.webp"
            alt="Bartosz Świtalski"
            class="size-10 rounded-full ring ring-primary"
          />
          <div>
            <div class="font-semibold">Bartosz Świtalski</div>
            <div class="text-sm opacity-70">Co-Founder, Cryptly</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
