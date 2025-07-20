<script lang="ts">
  import type { PageData } from './$types';
  import { Calendar, ArrowLeft } from 'lucide-svelte';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBody = (body: string): string => {
    return body.replace(/\n/g, '<br>');
  };
</script>

<svelte:head>
  <title>{data.blogPost.title} - logdash</title>
  <meta name="description" content={data.blogPost.title} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
  <nav class="mb-8">
    <a href="/blog" class="btn btn-ghost btn-sm">
      <ArrowLeft class="h-4 w-4" />
      Back to Blog
    </a>
  </nav>

  <article class="ld-card-base rounded-xl p-8">
    <header class="mb-8">
      <div class="mb-4 flex items-center gap-4 text-sm text-base-content/60">
        <div class="flex items-center gap-2">
          <Calendar class="h-4 w-4" />
          <time datetime={data.blogPost.createdAt}>
            Published {formatDate(data.blogPost.createdAt)}
          </time>
        </div>
        {#if data.blogPost.updatedAt !== data.blogPost.createdAt}
          <div class="flex items-center gap-2">
            <span>•</span>
            <time datetime={data.blogPost.updatedAt}>
              Updated {formatDate(data.blogPost.updatedAt)}
            </time>
          </div>
        {/if}
      </div>
      
      <h1 class="text-4xl font-bold tracking-tight lg:text-5xl">
        {data.blogPost.title}
      </h1>
    </header>

    <div class="prose prose-lg max-w-none">
      <div class="text-base-content leading-relaxed">
        {@html formatBody(data.blogPost.body)}
      </div>
    </div>
  </article>

  <nav class="mt-8 text-center">
    <a href="/blog" class="btn btn-outline">
      <ArrowLeft class="h-4 w-4" />
      Back to Blog
    </a>
  </nav>
</div> 