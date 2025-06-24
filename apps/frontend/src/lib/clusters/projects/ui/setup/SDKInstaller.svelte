<script lang="ts">
  import DotNetIcon from '$lib/shared/icons/DotNetIcon.svelte';
  import GoIcon from '$lib/shared/icons/GoIcon.svelte';
  import JavaIcon from '$lib/shared/icons/JavaIcon.svelte';
  import NodeJsIcon from '$lib/shared/icons/NodeJSIcon.svelte';
  import PhpIcon from '$lib/shared/icons/PHPIcon.svelte';
  import PythonIcon from '$lib/shared/icons/PythonIcon.svelte';
  import RubyIcon from '$lib/shared/icons/RubyIcon.svelte';
  import RustIcon from '$lib/shared/icons/RustIcon.svelte';
  import { type LogdashSDK, LogdashSDKName } from '$lib/shared/types.js';
  import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
  import {
    CheckIcon,
    ChevronDownIcon,
    Copy,
    DotSquareIcon,
  } from 'lucide-svelte';
  import Highlight from 'svelte-highlight';
  import { bash, csharp, type LanguageType } from 'svelte-highlight/languages';

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
      language: null,
      code: null,
    },
    [LogdashSDKName.PHP]: {
      language: null,
      code: null,
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
    [LogdashSDKName.OTHER]: {
      language: null,
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
      name: LogdashSDKName.OTHER,
      icon: DotSquareIcon as any,
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

<div class="flex items-center justify-between px-1 py-4 font-semibold">
  <span>1. Install the Logdash SDK</span>

  <button
    class="btn btn-neutral btn-sm"
    data-posthog-id="sdk-selection-button"
    popovertarget="sdk-popover"
    style="anchor-name:--sdk-popover-anchor"
  >
    <selectedSDK.icon class="h-4 w-4 shrink-0" />
    {selectedSDK.name}

    <ChevronDownIcon class="h-4 w-4 shrink-0" />
  </button>

  <ul
    bind:this={sdkPopover}
    class="dropdown dropdown-center bg-base-100 rounded-box z-1 overflow-visible p-1 shadow-sm"
    id="sdk-popover"
    popover
    style="position-anchor:--sdk-popover-anchor"
    tabindex="0"
  >
    {#each SDK_LIST as sdk}
      {@const isSupported = !!SDK_INSTALLERS[sdk.name].code}
      <div
        class={[
          'w-full',
          {
            'tooltip tooltip-left tooltip-primary': !isSupported,
          },
        ]}
        data-tip={isSupported
          ? ''
          : 'In development, click to put higher priority.'}
      >
        <li
          onclick={(e) => {
            e.stopPropagation();
            if (!isSupported) {
              toast.success('Noted!');
              return;
            }

            selectedSDKIndex = SDK_LIST.indexOf(sdk);
            sdkPopover.hidePopover();
          }}
          class="hover:bg-base-200/60 flex cursor-pointer select-none flex-row items-center justify-start gap-2 rounded-md p-1.5 text-xs"
        >
          <sdk.icon class="h-4 w-4 shrink-0" />
          <div class="block">
            {sdk.name}
          </div>
        </li>
      </div>
    {/each}
  </ul>
</div>

<div class="space-y-2 overflow-hidden text-sm">
  <div class="relative text-base">
    <Highlight
      class="code-snippet selection:bg-base-100"
      code={SDK_INSTALLERS[selectedSDK.name].code}
      language={bash}
    />

    <label
      class="btn btn-md btn-square bg-base-100 swap swap-rotate absolute right-2 top-2 border-transparent"
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
