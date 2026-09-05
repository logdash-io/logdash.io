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
  import LandingSection from './LandingSection.svelte';

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

<LandingSection>
  <div
    class="flex flex-col items-center gap-6 px-4 py-10 sm:px-6 lg:px-10 lg:py-12"
  >
    <p class="text-neutral-500 text-sm">Works with your stack</p>

    <div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
      {#each frameworks as framework (framework.name)}
        <Tooltip content={framework.name} placement="top">
          <framework.icon
            class="size-8 grayscale transition-[filter] duration-150 hover:grayscale-0"
          />
        </Tooltip>
      {/each}
    </div>
  </div>
</LandingSection>
