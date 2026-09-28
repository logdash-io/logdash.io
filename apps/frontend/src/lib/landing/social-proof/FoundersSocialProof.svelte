<script lang="ts">
  import artur from './avatars/artur_w.webp';
  import bartosz from './avatars/bsw.webp';
  import jerzy from './avatars/bialyjurek.webp';
  import maciej from './avatars/maciej_a.webp';
  import yaroslaw from './avatars/yaroslaw.webp';

  const TRUSTED_BY = [
    { text: 'Trusted by founders at ', strong: false },
    { text: 'Cryptly', strong: true },
    { text: ', ', strong: false },
    { text: 'Resurgo.ai', strong: true },
    { text: ' and ', strong: false },
    { text: 'BlueMenu', strong: true },
  ];

  const avatars = [
    { src: artur, alt: 'Artur' },
    { src: jerzy, alt: 'Jerzy' },
    { src: maciej, alt: 'Maciej' },
    { src: bartosz, alt: 'Bartosz' },
    { src: yaroslaw, alt: 'Yaroslaw' },
  ];

  const MOBILE_AVATARS = 3;
</script>

<div class="flex items-center gap-3">
  <div class="flex shrink-0">
    {#each avatars as avatar, i (avatar.src)}
      <img
        class={[
          'ring-surface-root bg-surface-elevated size-6 rounded-full object-cover grayscale ring-2 not-first:-ml-1.5',
          i >= MOBILE_AVATARS ? 'hidden sm:block' : 'block',
        ]}
        src={avatar.src}
        alt={avatar.alt}
      />
    {/each}
  </div>

  <span class="text-neutral-400 text-sm text-pretty">
    {#each TRUSTED_BY as part (part.text)}
      {#if part.strong}
        <span class="text-fg-default font-medium">{part.text}</span>
      {:else}
        {part.text}
      {/if}
    {/each}
  </span>
</div>
