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
  let { quote, person, img, company, align = 'left' }: Props = $props();
</script>

<article
  class="tcard"
  style={align === 'center' ? 'align-items:center;text-align:center;' : ''}
>
  <blockquote class="quote">"{quote}"</blockquote>

  <div class="who">
    <span class="avatar">
      <img src={img} alt={person} />
    </span>
    <span class="ident">
      <span class="name">{person}</span>
      <span class="role">
        {company.who}
        {#if company.name}
          at
          <a target="_blank" rel="noopener" href={company.url}>
            {company.name}
          </a>
        {/if}
      </span>
    </span>
  </div>
</article>

<style>
  .tcard {
    display: flex;
    flex-direction: column;
    gap: 22px;
    height: 100%;
    background: var(--surface-raised);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 26px 24px;
  }
  .quote {
    font-size: 16px;
    line-height: 1.6;
    color: var(--fg);
  }
  .who {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .avatar {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 50%;
    padding: 2px;
    background: var(--surface-overlay);
    border: 1px solid var(--line-soft);
    overflow: hidden;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    filter: grayscale(1);
  }
  .ident {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-size: 14.5px;
    font-weight: 600;
    color: var(--fg);
  }
  .role {
    font-size: 13px;
    color: var(--fg-faint);
  }
  .role a {
    color: var(--brand-soft);
    text-decoration: none;
  }
  .role a:hover {
    text-decoration: underline;
  }
</style>
