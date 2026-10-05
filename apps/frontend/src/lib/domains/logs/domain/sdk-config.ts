import CurlIcon from '$lib/domains/shared/icons/CurlIcon.svelte';
import DotNetIcon from '$lib/domains/shared/icons/DotNetIcon.svelte';
import GoIcon from '$lib/domains/shared/icons/GoIcon.svelte';
import JavaIcon from '$lib/domains/shared/icons/JavaIcon.svelte';
import NextJsIcon from '$lib/domains/shared/icons/NextJsIcon.svelte';
import NodeJsIcon from '$lib/domains/shared/icons/NodeJSIcon.svelte';
import PhpIcon from '$lib/domains/shared/icons/PHPIcon.svelte';
import PythonIcon from '$lib/domains/shared/icons/PythonIcon.svelte';
import RubyIcon from '$lib/domains/shared/icons/RubyIcon.svelte';
import RustIcon from '$lib/domains/shared/icons/RustIcon.svelte';
import SvelteKitIcon from '$lib/domains/shared/icons/SvelteKitIcon.svelte';
import { type LogdashSDK, LogdashSDKName } from '$lib/domains/shared/types.js';

export const SDK_LIST: LogdashSDK[] = [
  { name: LogdashSDKName.NODE_JS, icon: NodeJsIcon },
  { name: LogdashSDKName.NEXT_JS, icon: NextJsIcon },
  { name: LogdashSDKName.SVELTE_KIT, icon: SvelteKitIcon },
  { name: LogdashSDKName.PYTHON, icon: PythonIcon },
  { name: LogdashSDKName.GO, icon: GoIcon },
  { name: LogdashSDKName.DOTNET, icon: DotNetIcon },
  { name: LogdashSDKName.JAVA, icon: JavaIcon },
  { name: LogdashSDKName.RUST, icon: RustIcon },
  { name: LogdashSDKName.RUBY, icon: RubyIcon },
  { name: LogdashSDKName.PHP, icon: PhpIcon },
  { name: LogdashSDKName.CURL, icon: CurlIcon },
];

export { INSTALL_COMMANDS } from './sdk-install-commands';
