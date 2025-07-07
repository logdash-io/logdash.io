<script lang="ts">
  import DotNetIcon from '$lib/domains/shared/icons/DotNetIcon.svelte';
  import GoIcon from '$lib/domains/shared/icons/GoIcon.svelte';
  import JavaIcon from '$lib/domains/shared/icons/JavaIcon.svelte';
  import NodeJsIcon from '$lib/domains/shared/icons/NodeJSIcon.svelte';
  import PhpIcon from '$lib/domains/shared/icons/PHPIcon.svelte';
  import PythonIcon from '$lib/domains/shared/icons/PythonIcon.svelte';
  import RubyIcon from '$lib/domains/shared/icons/RubyIcon.svelte';
  import RustIcon from '$lib/domains/shared/icons/RustIcon.svelte';
  import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
  import {
    type LogdashSDK,
    LogdashSDKName,
  } from '$lib/domains/shared/types.js';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    CheckIcon,
    ChevronDownIcon,
    Copy,
    DotSquareIcon,
  } from 'lucide-svelte';
  import Highlight from 'svelte-highlight';
  import {
    bash,
    csharp,
    java,
    type LanguageType,
  } from 'svelte-highlight/languages';

  type Props = {
    selectedSDK: LogdashSDK;
    installationCode: string;
  };
  let { selectedSDK = $bindable(), installationCode = $bindable() }: Props =
    $props();

  let sdkPopover = $state(null);

  type SDKInstallers = Record<
    LogdashSDK['name'],
    {
      language: LanguageType<string>;
      code: string;
    }
  >;

  const SDK_INSTALLERS: SDKInstallers = {
    [LogdashSDKName.NODE_JS]: {
      language: bash,
      code: `npm install @logdash/js-sdk`,
    },
    [LogdashSDKName.PYTHON]: {
      language: bash,
      code: `pip install logdash`,
    },
    [LogdashSDKName.JAVA]: {
      language: bash,
      code: `// Maven
<dependency>
    <groupId>io.logdash</groupId>
    <artifactId>logdash</artifactId>
    <version>0.2.0</version>
</dependency>

// Gradle
implementation 'io.logdash:logdash:0.2.0'`,
    },
    [LogdashSDKName.PHP]: {
      language: bash,
      code: `composer require logdash/php-sdk`,
    },
    [LogdashSDKName.RUBY]: {
      language: bash,
      code: `gem install logdash`,
    },
    [LogdashSDKName.DOTNET]: {
      language: csharp,
      code: `dotnet add package Logdash`,
    },
    [LogdashSDKName.GO]: {
      language: bash,
      code: `go get github.com/logdash-io/go-sdk/logdash`,
    },
    [LogdashSDKName.RUST]: {
      language: bash,
      code: `cargo add logdash`,
    },
    [LogdashSDKName.CURL]: {
      language: bash,
      code: null,
    },
  };

  const SDK_LIST: LogdashSDK[] = [
    {
      name: LogdashSDKName.NODE_JS,
      icon: NodeJsIcon,
    },
    {
      name: LogdashSDKName.PYTHON,
      icon: PythonIcon,
    },
    {
      name: LogdashSDKName.GO,
      icon: GoIcon,
    },
    {
      name: LogdashSDKName.DOTNET,
      icon: DotNetIcon,
    },
    {
      name: LogdashSDKName.JAVA,
      icon: JavaIcon,
    },
    {
      name: LogdashSDKName.RUST,
      icon: RustIcon,
    },
    {
      name: LogdashSDKName.RUBY,
      icon: RubyIcon,
    },
    {
      name: LogdashSDKName.PHP,
      icon: PhpIcon,
    },
    {
      name: LogdashSDKName.CURL,
      icon: CurlIcon,
    },
  ];
  let selectedSDKIndex = $state(0);
  selectedSDK = selectedSDK ?? SDK_LIST[0];

  $effect(() => {
    selectedSDK = SDK_LIST[selectedSDKIndex];
  });
  $effect(() => {
    installationCode = SDK_INSTALLERS[selectedSDK.name].code;
  });
</script>

{#snippet menu(close: () => void)}
  <ul
    bind:this={sdkPopover}
    class="dropdown dropdown-center ld-card-base z-20 overflow-visible rounded-xl p-1.5 shadow-sm"
  >
    {#each SDK_LIST as sdk}
      <div class={['w-full rounded-xl']}>
        <li
          onclick={(e) => {
            e.stopPropagation();
            close();

            selectedSDKIndex = SDK_LIST.indexOf(sdk);
            sdkPopover.hidePopover();
          }}
          class="hover:bg-base-100/70 flex cursor-pointer flex-row items-center justify-start gap-2 rounded-md p-1.5 text-xs select-none"
        >
          <sdk.icon class="h-4 w-4 shrink-0" />
          <div class="block">
            {sdk.name}
          </div>
        </li>
      </div>
    {/each}
  </ul>
{/snippet}

<div class="z-50 flex items-center justify-between px-1 py-4 font-semibold">
  <span>1. Install the Logdash SDK</span>

  <Tooltip content={menu} interactive={true} placement="bottom">
    <button
      class="btn btn-neutral btn-sm"
      data-posthog-id="sdk-selection-button"
    >
      <selectedSDK.icon class="h-4 w-4 shrink-0" />
      {selectedSDK.name}

      <ChevronDownIcon class="h-4 w-4 shrink-0" />
    </button>
  </Tooltip>
</div>

{#if SDK_INSTALLERS[selectedSDK.name].code}
  <div class="space-y-2 overflow-hidden text-sm">
    <div class="relative text-base">
      <Highlight
        class="code-snippet selection:bg-base-100"
        code={SDK_INSTALLERS[selectedSDK.name].code}
        language={bash}
      />

      <label
        class="btn btn-md btn-square bg-base-100 swap swap-rotate absolute top-2 right-2 border-transparent"
        for="copy-code-0"
        onclick={() => {
          navigator.clipboard.writeText(SDK_INSTALLERS[selectedSDK.name].code);
        }}
      >
        <input id="copy-code-0" type="checkbox" />

        <CheckIcon class="swap-on text-success h-5 w-5" />

        <Copy class="swap-off h-5 w-5" />
      </label>
    </div>
  </div>
{/if}
