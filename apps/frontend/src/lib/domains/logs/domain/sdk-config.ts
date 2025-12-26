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

export const INSTALL_COMMANDS: Record<LogdashSDKName, string> = {
  [LogdashSDKName.NODE_JS]: 'npm install @logdash/node',
  [LogdashSDKName.NEXT_JS]: 'npm install @logdash/node',
  [LogdashSDKName.SVELTE_KIT]: 'npm install @logdash/node',
  [LogdashSDKName.PYTHON]: 'pip install logdash',
  [LogdashSDKName.JAVA]: `// Maven
<dependency>
    <groupId>io.logdash</groupId>
    <artifactId>logdash</artifactId>
    <version>0.2.0</version>
</dependency>

// Gradle
implementation 'io.logdash:logdash:0.2.0'`,
  [LogdashSDKName.PHP]: 'composer require logdash/php-sdk',
  [LogdashSDKName.RUBY]: 'gem install logdash',
  [LogdashSDKName.DOTNET]: 'dotnet add package Logdash',
  [LogdashSDKName.RUST]: 'cargo add logdash',
  [LogdashSDKName.GO]: 'go get github.com/logdash-io/go-sdk/logdash',
  [LogdashSDKName.CURL]: 'curl',
};
