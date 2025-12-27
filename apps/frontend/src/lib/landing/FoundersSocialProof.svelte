<script lang="ts">
  const avatars = [
    { src: '/images/testimonials/artur_w.webp', alt: 'Artur' },
    { src: '/images/testimonials/bialyjurek.webp', alt: 'Jerzy' },
    { src: '/images/testimonials/maciej_a.webp', alt: 'Maciej' },
    { src: '/images/testimonials/bsw.webp', alt: 'Bartosz' },
    { src: '/images/testimonials/yaroslaw.png', alt: 'Yaroslaw' },
  ];
</script>

<div
  class="mt-2 flex flex-col items-center gap-3 lg:flex-row lg:items-center lg:gap-4"
>
  <div class="avatar-group -space-x-3 p-1">
    {#each avatars as avatar}
      <div
        class="avatar bg-base-200 border-primary border ring-[3px] ring-base-300 ring-offset-base-300"
      >
        <div class="w-9">
          <img
            class="grayscale-100"
            src={avatar.src}
            alt={avatar.alt}
            loading="lazy"
          />
        </div>
      </div>
    {/each}
  </div>

  <div class="flex flex-col items-center lg:items-start">
    <span class="text-base-content text-sm font-medium">
      Join founders processing
    </span>
    <span class="text-primary text-sm font-semibold">2M+ logs monthly</span>
  </div>
</div>
