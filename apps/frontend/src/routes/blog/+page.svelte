<script lang="ts">
  import type { PageData } from './$types';
  import { Calendar } from 'lucide-svelte';

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
</script>

<svelte:head>
  <title>Blog - logdash</title>
  <meta name="description" content="Read the latest updates and insights from the logdash team." />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8 lg:max-w-6xl lg:px-8">
  <header class="mb-12 text-center">
    <h1 class="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
      Blog
    </h1>
    <p class="text-base-content/70 mx-auto max-w-2xl text-xl">
      The latest updates, insights, and stories from the logdash team.
    </p>
  </header>

  {#if data.blogPosts.length === 0}
    <div class="ld-card-base rounded-xl p-12 text-center">
      <h2 class="mb-2 text-xl font-semibold">No blog posts yet</h2>
      <p class="text-base-content/70">
        We're working on some great content. Check back soon!
      </p>
    </div>
  {:else}
    <div class="space-y-6">
      {#each data.blogPosts as post}
        <article class="ld-card-base group rounded-xl p-6 transition-all duration-200 hover:shadow-lg min-w-96 w-full">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2 text-sm text-base-content/60">
              <Calendar class="h-4 w-4" />
              <time datetime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
            </div>
            
            <div>
              <h2 class="mb-3 text-2xl font-semibold group-hover:text-primary transition-colors">
                <a href="/blog/{post.id}" class="hover:underline">
                  {post.title}
                </a>
              </h2>
            </div>

            <div class="flex justify-end">
              <a 
                href="/blog/{post.id}" 
                class="btn btn-outline btn-sm"
              >
                Read more
              </a>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div> 