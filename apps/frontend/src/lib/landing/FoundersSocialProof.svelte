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
  class="border-base-content/10 bg-base-200/60 inline-flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3.5 backdrop-blur-sm"
>
  <div class="avatar-group -space-x-2">
    {#each avatars as avatar (avatar.src)}
      <div class="avatar bg-base-200 border-primary/70 border">
        <div class="w-5 sm:w-6">
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

  <span class="text-base-content/70 text-xs font-medium sm:text-sm">
    Founders processing
    <span class="text-base-content font-semibold">2M+ logs monthly</span>
  </span>
</div>
