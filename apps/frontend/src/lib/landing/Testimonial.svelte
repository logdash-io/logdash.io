<script lang="ts">
  type Props = {
    quote: string;
    person: string;
    img: string;
    company: {
      who: string;
      name: string;
      url: string;
    };
    align?: 'left' | 'center';
  };

  const { quote, person, img, company, align = 'left' }: Props = $props();
</script>

<div class="flex h-full flex-col gap-6">
  <blockquote
    class="text-neutral-400 group-hover:text-base-content text-base leading-relaxed text-pretty transition-ink duration-150"
  >
    “{quote}”
  </blockquote>

  <div
    class={[
      'mt-auto flex items-center gap-3',
      {
        'justify-center': align === 'center',
        'justify-start': align === 'left',
      },
    ]}
  >
    <img
      class="ring-base-100 size-10 shrink-0 rounded-full object-cover grayscale ring-1"
      src={img}
      alt={person}
      loading="lazy"
    />

    <div class="flex flex-col text-left">
      <span class="text-sm font-medium">{person}</span>

      <span class="text-neutral-500 text-sm">
        {company.who}
        {#if company.name}
          at
          <!-- eslint-disable svelte/no-navigation-without-resolve -->
          <a
            class="hover:text-base-content transition-ink duration-150"
            target="_blank"
            rel="noopener"
            href={company.url}
          >
            {company.name}
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {/if}
      </span>
    </div>
  </div>
</div>
