<script lang="ts">
  import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
  import DotNetIcon from '$lib/domains/shared/icons/DotNetIcon.svelte';
  import GoIcon from '$lib/domains/shared/icons/GoIcon.svelte';
  import JavaIcon from '$lib/domains/shared/icons/JavaIcon.svelte';
  import NodeJsIcon from '$lib/domains/shared/icons/NodeJSIcon.svelte';
  import PhpIcon from '$lib/domains/shared/icons/PHPIcon.svelte';
  import PythonIcon from '$lib/domains/shared/icons/PythonIcon.svelte';
  import RubyIcon from '$lib/domains/shared/icons/RubyIcon.svelte';
  import RustIcon from '$lib/domains/shared/icons/RustIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';

  const frameworks = [
    { name: 'Node.js', icon: NodeJsIcon },
    { name: 'Python', icon: PythonIcon },
    { name: 'Go', icon: GoIcon },
    { name: '.NET', icon: DotNetIcon },
    { name: 'Java', icon: JavaIcon },
    { name: 'Rust', icon: RustIcon },
    { name: 'Ruby', icon: RubyIcon },
    { name: 'PHP', icon: PhpIcon },
    { name: 'Curl', icon: CurlIcon },
  ];
</script>

<div class="w-full text-center">
  <h3 class="text-base-content/50 mb-6 text-base font-medium">
    Integrates with your favorite tech stack
  </h3>

  <div class="mx-auto flex max-w-4xl flex-wrap justify-center gap-8 md:gap-8">
    {#each frameworks as framework}
      <Tooltip content={framework.name} placement="top">
        <framework.icon
          class="size-10 grayscale transition-all duration-150 hover:grayscale-0"
        />
      </Tooltip>
    {/each}
  </div>
</div>
