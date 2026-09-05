<script lang="ts">
  const TRUSTED_BY = [
    { text: 'Trusted by founders at ', strong: false },
    { text: 'Cryptly', strong: true },
    { text: ', ', strong: false },
    { text: 'Resurgo.ai', strong: true },
    { text: ' and ', strong: false },
    { text: 'BlueMenu', strong: true },
  ];

  const avatars = [
    { src: '/images/testimonials/artur_w.webp', alt: 'Artur' },
    { src: '/images/testimonials/bialyjurek.webp', alt: 'Jerzy' },
    { src: '/images/testimonials/maciej_a.webp', alt: 'Maciej' },
    { src: '/images/testimonials/bsw.webp', alt: 'Bartosz' },
    { src: '/images/testimonials/yaroslaw.png', alt: 'Yaroslaw' },
  ];

  const MOBILE_AVATARS = 3;
</script>

<div class="flex items-center gap-3">
  <div class="flex -space-x-1.5">
    {#each avatars as avatar, i (avatar.src)}
      <img
        class={[
          'ring-base-300 bg-base-200 size-6 rounded-full object-cover grayscale ring-2',
          i >= MOBILE_AVATARS ? 'hidden sm:block' : 'block',
        ]}
        src={avatar.src}
        alt={avatar.alt}
        loading="lazy"
      />
    {/each}
  </div>

  <span class="text-neutral-400 text-sm text-pretty">
    {#each TRUSTED_BY as part (part.text)}
      {#if part.strong}
        <span class="text-base-content font-medium">{part.text}</span>
      {:else}
        {part.text}
      {/if}
    {/each}
  </span>
</div>
